# Utility function to exit on error
def errorAndExit(errorString):
    print(errorString)
    exit(1)

try:
    import sys
    import os.path
    import pandas as pd
    import matplotlib.pyplot as plt
    import gseapy as gp
    from pandas.api.types import is_numeric_dtype
    import dill
except Exception as e:
    errorAndExit('Some python libraries weren\'t found.\n' + str(e))

# Home directory of user running this script
HOME_DIR = os.path.expanduser("~")

# Read arguments passed on the script call
gene_sets_path = sys.argv[1]
num_permutation = int(sys.argv[2])
min_gene_set = int(sys.argv[3])
max_gene_set = int(sys.argv[4])
expression_set_path = sys.argv[5]
phenotype_labels_path = sys.argv[6]
remap = sys.argv[7]
chip_path = sys.argv[8]

# If files types are not correct, print error and exit
if (not expression_set_path.endswith((".gct", ".res", ".pcl", ".txt"))):
    errorAndExit("The expression set file (.gct, .res, .pcl, .txt) is not of the right type.")
if (not gene_sets_path.endswith((".gmt", ".gmx"))):
    errorAndExit("The gene set file (.gmt, .gmx) is not of the right type.")
if (not phenotype_labels_path.endswith(".cls")):
    errorAndExit("The phenotype labels file (.cls) is not of the right type.")

# Try to parse the expression set file
try:
    expression_set = pd.read_csv(expression_set_path, header=2, index_col=0, sep="\t")
except Exception:
    errorAndExit("The expression set file is malformed and cannot be intepreted.")

# Check if any value is missing in the expression set file (except for the description column)
# Each row of the expression set must have the same number of fields
if (expression_set.drop(expression_set.columns[0], axis=1).isnull().any().any() or expression_set.index.hasnans):
    errorAndExit("The expression set file has some missing values and cannot be used.")

# Check if any cell of the expression set file (except description column) is not numeric
if (expression_set.iloc[:,1:].apply(lambda x: not is_numeric_dtype(x)).any()):
    errorAndExit("The expression set file has some non-numerical values and cannot be used.")

expression_set_chosen = ""

# If the number of permutation is invalid, exit and print error
if num_permutation <= 0:
    errorAndExit("The number of permutations must be positive.")

if min_gene_set < 0:
    errorAndExit("Min gene set size must be positive.")
if max_gene_set < 0:
    errorAndExit("Max gene set size must be positive.")
if min_gene_set > max_gene_set:
    errorAndExit("Max gene set size must be greater than min gene set size.")

# If remap unselected
if remap == "none":
    expression_set_chosen = expression_set
# If remap selected
else:
    # If chip file not selected (left blank), exit and print error
    if (chip_path == "null"):
        errorAndExit("If remap selected, a chip must be selected too.")
        
    # If chip platform file is not correct, exit and print error
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
    expression_set_chosen = expression_set.join(chip).reset_index(drop=True).dropna()

try:
    res = gp.gsea(data=expression_set_chosen,
                gene_sets=gene_sets_path,
                cls=phenotype_labels_path,
                permutation_type="phenotype",
                permutation_num=num_permutation,
                outdir=None,
                method="signal_to_noise",
                min_size=min_gene_set,
                max_size=max_gene_set,
                threads=4, 
                seed=7)
except Exception:
    errorAndExit("GSEA failed while computing the analysis.")

# Print and send on stdout the result as a JSON-formatted string
res_json = res.res2d.to_json(orient="records")
print(res_json)
sys.stdout.flush()

# Save the python session in a file
dill.dump_session(os.path.join(HOME_DIR, "gseacompass_python_session.pkl"))
