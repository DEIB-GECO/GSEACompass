import sys
import os.path
import pandas as pd
import matplotlib.pyplot as plt
from pandas.api.types import is_numeric_dtype
import gseapy as gp
import dill

# Home directory of user running this script
HOME_DIR = os.path.expanduser("~")

# Utility function to exit on error
def errorAndExit(errorString):
    print(errorString)
    exit(1)

# Read arguments passed on the script call
gene_sets_path = sys.argv[1]
num_permutation = int(sys.argv[2])
rnk_list_path = sys.argv[3]
remap = sys.argv[4]
chip_path = sys.argv[5]

# If the files types are not correct, print error and exit
if (not rnk_list_path.endswith(".rnk")):
    errorAndExit("The ranked list file (.rnk) is not of the right type.")
if (not gene_sets_path.endswith((".gmt", ".gmx"))):
    errorAndExit("The gene set file (.gmt, .gmx) is not of the right type.")
   
# Try to parse the ranked list 
try:
    rnk_list = pd.read_csv(rnk_list_path, header=None, index_col=0, sep="\t")
except Exception:
    errorAndExit("The ranked list file is malformed and cannot be intepreted.")
    
# Check if any value in the ranked list file is missing
if (rnk_list.isnull().any().any() or rnk_list.index.hasnans):
    errorAndExit("The ranked list file has some missing values and cannot be used.")

# Check if any cell of the ranked list file (except index) is not numerical
if (rnk_list.apply(lambda x: not is_numeric_dtype(x)).any()):
    errorAndExit("The ranked list file has some non-numerical values and cannot be used.")
    
rnk_chosen = ""

# If the number of permutation is invalid, exit and print error
if num_permutation <= 0:
    errorAndExit("The number of permutations must be positive.")

# If remap unselected
if remap == "none":
    rnk_chosen = rnk_list
# If remap selected
else:
    # If chip file not selected (left blank), exit and print error
    if (chip_path == "null"):
        errorAndExit("If remap selected, a chip must be selected.")
    
    if (not chip_path.endswith(".chip")):
        errorAndExit("The chip platform file (.chip) is not of the right type.")
        
    # Try to parse chip platform file
    try:
        chip = pd.read_csv(chip_path, header=0, index_col=0, sep="\t")
    except Exception:
        errorAndExit("The chip platform file is malformed and cannot be intepreted.")
        
    # Check if any cell (index included) of the chip platform file is missing
    if (chip.iloc[:, 0].isnull().any() or chip.index.hasnans):
        errorAndExit("The chip platform file has some missing values and cannot be used.")
        
    # Convert the ranked list genes in the chip platform notation
    rnk_chosen = rnk_list.join(chip)[["Gene Symbol", 1]].reset_index(drop=True).dropna()

try:
    res = gp.prerank(rnk=rnk_chosen,
                    gene_sets=gene_sets_path,
                    threads=4,
                    min_size=5,
                    max_size=1000,
                    permutation_num=num_permutation,
                    outdir=None,
                    seed=7)
except Exception:
    errorAndExit("GSEA preranked failed while computing the analysis.")

# Print and send on stdout the result as a JSON-formatted string
res_json = res.res2d.to_json(orient="records")
print(res_json)
sys.stdout.flush()

# Save the python session on a file
dill.dump_session(os.path.join(HOME_DIR, "gseacompass_python_session.pkl"))
