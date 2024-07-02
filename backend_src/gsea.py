import sys
import pandas as pd
import matplotlib.pyplot as plt
import gseapy as gp
import dill

# Read arguments passed on the script call
gene_sets_path = sys.argv[1]
num_permutation = int(sys.argv[2])
expression_set_path = sys.argv[3]
phenotype_labels_path = sys.argv[4]
remap = sys.argv[5]
chip_path = sys.argv[6]

# Try to parse the expression set file
if (not expression_set_path.endswith((".gct", ".res", ".pcl", ".txt"))):
    print("The expression set file (.gct, .res, .pcl, .txt) is not of the right type.", file=sys.stderr)
    exit(1)
try:
    expression_set = pd.read_csv(expression_set_path, header=2, index_col=0, sep="\t")
except Exception:
    print("The expression set file (.gct, .res, .pcl, .txt) is malformed and cannot be intepreted.", file=sys.stderr)
    exit(1)

expression_set_chosen = ""

# If the number of permutation is invalid, exit and print error
if num_permutation <= 0:
    print("The number of permutations must be positive.", file=sys.stderr)
    exit(1)

# If remap unselected
if remap == "none":
    expression_set_chosen = expression_set
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
            
    expression_set_chosen = expression_set.join(chip).reset_index(drop=True).dropna()

if (not gene_sets_path.endswith((".gmt", ".gmx"))):
    print("The gene set file (.gmt, .gmx) is not of the right type.", file=sys.stderr)
    exit(1)
if (not phenotype_labels_path.endswith(".cls")):
    print("The phenotype labels file (.cls) is not of the right type.", file=sys.stderr)
    exit(1)

try:
    res = gp.gsea(data=expression_set_chosen,
                gene_sets=gene_sets_path,
                cls=phenotype_labels_path,
                permutation_type="phenotype",
                permutation_num=num_permutation,
                outdir=None,
                method="signal_to_noise",
                threads=4, 
                seed=7)
except Exception:
    print("GSEA failed while computing the analysis.", file=sys.stderr)
    exit(1)

# Print and send on stdout the result as a JSON-formatted string
res_json = res.res2d.to_json(orient="records")
print(res_json)
sys.stdout.flush()

# Save the python session on a file
dill.dump_session("gsea_run.pkl")