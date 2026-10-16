import os
import pickle
import re
import sqlite3
import zipfile
from urllib.parse import unquote, urljoin

import numpy as np
import requests
import torch
from bs4 import BeautifulSoup
from tqdm.auto import tqdm
from transformers import AutoModel, AutoTokenizer

EMAIL = "vamevad793@iconcubic.com"

LOGIN_URL = "https://www.gsea-msigdb.org/gsea/login.jsp"
COLLECTIONS_URL = "https://www.gsea-msigdb.org/gsea/msigdb/collections.jsp"
TIMEOUT = (15, 120)

session = requests.Session()
session.headers.update({
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
})

print(f"Logging in with {EMAIL}...")
res = session.get(LOGIN_URL, timeout=TIMEOUT)
res.raise_for_status()
soup = BeautifulSoup(res.text, "html.parser")

form = soup.find("form")
if not form:
    raise RuntimeError("Login form not found on the page.")

action = form.get("action", "")
target_login_url = urljoin(LOGIN_URL, action) if action else LOGIN_URL

email_input = form.find("input", {"type": "text"}) or form.find("input", {"type": "email"})
input_name = email_input.get("name", "email") if email_input else "email"

# The login endpoint requires the hidden password field as well as the email.
login_payload = {
    field["name"]: field.get("value", "")
    for field in form.find_all("input", type="hidden", attrs={"name": True})
}
login_payload[input_name] = EMAIL
login_response = session.post(target_login_url, data=login_payload, timeout=TIMEOUT)
login_response.raise_for_status()
if BeautifulSoup(login_response.text, "html.parser").find("form", id="loginForm"):
    raise RuntimeError(
        "Login failed. Check that the email address is registered with GSEA/MSigDB."
    )

print("Fetching collections page to discover the latest Human SQLite file link...")
col_response = session.get(COLLECTIONS_URL, timeout=TIMEOUT)
col_response.raise_for_status()

col_soup = BeautifulSoup(col_response.text, "html.parser")
base_tag = col_soup.find("base", href=True)
link_base_url = urljoin(col_response.url, base_tag["href"]) if base_tag else col_response.url

download_link = None
# Matches 'msigdb', followed by anything, then 'Hs', then anything, ending in 'db.zip'
pattern = re.compile(r"msigdb.*Hs.*db\.zip", re.IGNORECASE)

for a_tag in col_soup.find_all("a", href=True):
    href = a_tag["href"]
    # Check both the link URL and text
    if pattern.search(href) or pattern.search(a_tag.get_text()):
        download_link = urljoin(link_base_url, href)
        break

if not download_link:
    raise RuntimeError("Could not find a link matching 'msigdb...Hs...db.zip' on the collections page.")

print(f"Discovered download link: {download_link}")

if "filePath=" in download_link:
    raw_filename = download_link.split("filePath=")[-1].split("&")[0]
    filename = os.path.basename(unquote(raw_filename))
else:
    filename = os.path.basename(download_link.split("?")[0])

if not filename or not filename.endswith(".zip"):
    filename = "msigdb_Hs_latest.db.zip"

print(f"Starting download: {filename}")
partial_filename = filename + ".part"
try:
    with session.get(download_link, stream=True, timeout=TIMEOUT) as stream_resp:
        stream_resp.raise_for_status()
        content_type = stream_resp.headers.get("content-type", "").lower()
        if "text/" in content_type or "html" in content_type:
            raise RuntimeError(
                f"Expected a ZIP archive, but received {content_type} from {stream_resp.url}. "
                "The server may have returned a login or error page."
            )

        total_size = int(stream_resp.headers.get("content-length", 0))
        downloaded = 0
        with open(partial_filename, "wb") as f:
            for chunk in stream_resp.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
                    downloaded += len(chunk)
                    if total_size:
                        percent = (downloaded / total_size) * 100
                        print(f"\rDownloading: {downloaded / (1024*1024):.2f} MB / {total_size / (1024*1024):.2f} MB ({percent:.1f}%)", end="")
                    else:
                        print(f"\rDownloaded: {downloaded / (1024*1024):.2f} MB", end="")

    if not zipfile.is_zipfile(partial_filename):
        raise RuntimeError(
            f"Downloaded {downloaded} bytes, but the response is not a valid ZIP archive. "
            "The download may be incomplete, or the server returned a login/error page."
        )
    os.replace(partial_filename, filename)
finally:
    if os.path.exists(partial_filename):
        os.remove(partial_filename)

print(f"\nDownload finished successfully: {filename}")

# Unzip the downloaded file
with zipfile.ZipFile(filename, "r") as zip_ref:
    zip_ref.extractall()

# Delete the zip file
os.remove(filename)

# Open the extracted file
extracted_filename = os.path.basename(zip_ref.namelist()[0])
print(f"Extracted filename: {extracted_filename}")

with open(extracted_filename, "r") as f:
    # read as sqlite database
    conn = sqlite3.connect(extracted_filename)
    cursor = conn.cursor()
    cursor.execute("SELECT standard_name FROM gene_set")
    rows = cursor.fetchall()

    # convert rows to a list of strings
    all_names = [row[0] for row in rows]
    print(f"Number of geneset: {len(all_names)}")

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    tokenizer = AutoTokenizer.from_pretrained("cambridgeltl/SapBERT-from-PubMedBERT-fulltext")
    model = AutoModel.from_pretrained("cambridgeltl/SapBERT-from-PubMedBERT-fulltext").to(device)

    bs = 128 # batch size during inference
    all_embs = []
    for i in tqdm(np.arange(0, len(all_names), bs)):
        toks = tokenizer.tokenizer(all_names[i:i+bs],
                                           padding="max_length",
                                           max_length=25,
                                           truncation=True,
                                           return_tensors="pt")
        toks_device = {}
        for k,v in toks.items():
            toks_device[k] = v.to(device)
        cls_rep = model(**toks_device)[0][:,0,:] # use CLS representation as the embedding
        all_embs.append(cls_rep.cpu().detach().numpy())

    all_embs = np.concatenate(all_embs, axis=0)

    # Create dictionary mapping gene names to embeddings
    name_to_emb = {name: emb for name, emb in zip(all_names, all_embs)}

    # Save dictionary to disk
    output_dir = "misc_resources"
    os.makedirs(output_dir, exist_ok=True)

    output_path = os.path.join(output_dir, "new_msigdb_embeddings.pkl")

    with open(output_path, "wb") as f:
        pickle.dump(name_to_emb, f)
