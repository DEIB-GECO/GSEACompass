import sys
import pandas as pd
import matplotlib.pyplot as plt
import gseapy as gp
import dill

# Read arguments passed on the script call
gene_sets_path = sys.argv[1]
num_permutation = int(sys.argv[2])
rnk_list_path = sys.argv[3]
remap = sys.argv[4]
chip_path = sys.argv[5]

# Try to parse the ranked list
if (not rnk_list_path.endswith(".rnk")):
    print("The ranked list file (.rnk) is not of the right type.", file=sys.stderr)
    exit(1)
try:
    rnk_list = pd.read_csv(rnk_list_path, header=None, index_col=0, sep="\t")
except Exception:
    print("The ranked list file (.rnk) is malformed and cannot be intepreted.", file=sys.stderr)
    exit(1)

rnk_chosen = ""

# If the number of permutation is invalid, exit and print error
if num_permutation <= 0:
    print("The number of permutations must be positive.", file=sys.stderr)
    exit(1)

# If remap unselected
if remap == "none":
    rnk_chosen = rnk_list
# If remap selected
else:
    # If chip file not selected (left blank), exit and print error
    if (chip_path == "null"):
        print("If remap selected, a chip must be selected.", file=sys.stderr)
        exit(1)
    
    # Try to parse chip platform file
    if (not chip_path.endswith(".chip")):
        print("The expression set file (.chip) is not of the right type.", file=sys.stderr)
        exit(1)
    try:
        chip = pd.read_csv(chip_path, header=0, index_col=0, sep="\t")
    except Exception:
        print("The chip platform file (.chip) is malformed and cannot be intepreted.", file=sys.stderr)
        exit(1)
        
    rnk_chosen = rnk_list.join(chip)[["Gene Symbol", 1]].reset_index(drop=True).dropna()

if (not gene_sets_path.endswith((".gmt", ".gmx"))):
    print("The gene set file (.gmt, .gmx) is not of the right type.", file=sys.stderr)
    exit(1)

try:
    res = gp.prerank(rnk=rnk_chosen,
                    gene_sets=gene_sets_path,
                    threads=4,
                    min_size=5,
                    max_size=1000,
                    permutation_num=num_permutation,
                    outdir=None,
                    seed=6)
except Exception:
    print("GSEA preranked failed while computing the analysis.", file=sys.stderr)
    exit(1)

# Print and send on stdout the result as a JSON-formatted string
res_json = res.res2d.to_json(orient="records")
print(res_json)
sys.stdout.flush()

# Save the python session on a file
dill.dump_session("gsea_run.pkl")
