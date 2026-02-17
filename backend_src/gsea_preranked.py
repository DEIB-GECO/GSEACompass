# Utility function to exit on error
def errorAndExit(errorString):
    print(errorString)
    exit(1)

try:
    import sys
    import os.path
    import pandas as pd
    import matplotlib.pyplot as plt
    from pandas.api.types import is_numeric_dtype
    import gseapy as gp
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
rnk_list_path = sys.argv[5]
remap = sys.argv[6]
chip_path = sys.argv[7]

# If the files types are not correct, print error and exit
if (not rnk_list_path.endswith(".rnk")):
    errorAndExit("The ranked list file (.rnk) is not of the right type.")
if (not gene_sets_path.endswith(".gmt")):
    errorAndExit("The gene set file (.gmt) is not of the right type.")
   
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

if min_gene_set < 0:
    errorAndExit("Min gene set size must be positive.")
if max_gene_set < 0:
    errorAndExit("Max gene set size must be positive.")
if min_gene_set > max_gene_set:
    errorAndExit("Max gene set size must be greater than min gene set size.")

# If remap unselected
if remap == "none":
    # Verify that the gene sets and the ranked list have at least 10 genes in common, otherwise exit and print error
    gene_set_genes = set()
    with open(gene_sets_path, "r") as f:
        for line in f:
            parts = line.strip().split("\t")
            gene_set_genes.update(parts[2:])  # Skip the first two columns (gene set name and link)
    rnk_list_genes = set(rnk_list.index)
    common_genes = gene_set_genes.intersection(rnk_list_genes)
    
    if len(common_genes) < 10:
        errorAndExit("The gene set file has less than 10 genes in common with the ranked list file, " \
                    "the genes in those two files probably have different platform annotations.\n" \
                    "If you want to use a remapping, please select the appropriate chip platform file.\n\n" \
                    f"Some of the mismatching genes in the ranked list: {', '.join(list(rnk_list_genes.difference(gene_set_genes))[:2])}\n" \
                    f"Some of the mismatching genes in the gene set file: {', '.join(list(gene_set_genes.difference(rnk_list_genes))[:2])}")
    else:
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
    
    # Verify that the gene sets and the ranked list have at least 10 genes in common, otherwise exit and print error
    gene_set_genes = set()
    with open(gene_sets_path, "r") as f:
        for line in f:
            parts = line.strip().split("\t")
            gene_set_genes.update(parts[2:])  # Skip the first two columns (gene set name and link)
    rnk_remapped_genes = set(rnk_chosen["Gene Symbol"])
    common_genes = gene_set_genes.intersection(rnk_remapped_genes)
    
    if len(common_genes) < 10:
        errorAndExit("After remapping, the gene set file has less than 10 genes in common with the ranked list file, " \
                    "the genes in those two files probably have different platform annotations.\n" \
                    "If you want to use a remapping, please select the appropriate chip platform file.\n\n" \
                    f"Some of the mismatching genes in the ranked list: {', '.join(list(rnk_remapped_genes.difference(gene_set_genes))[:2])}\n" \
                    f"Some of the mismatching genes in the gene set file: {', '.join(list(gene_set_genes.difference(rnk_remapped_genes))[:2])}")

try:
    res = gp.prerank(rnk=rnk_chosen,
                     gene_sets=gene_sets_path,
                     threads=4,
                     min_size=min_gene_set,
                     max_size=max_gene_set,
                     permutation_num=num_permutation,
                     outdir=None,
                     seed=7)
except Exception as e:
    errorAndExit(f"GSEA preranked failed while computing the analysis.\nThe following error was raised:\n{str(e)}")

# Print and send on stdout the result as a JSON-formatted string
res_json = res.res2d.to_json(orient="records")
print(res_json)
sys.stdout.flush()

# Save the python session on a file
dill.dump_session(os.path.join(HOME_DIR, "gseacompass_python_session.pkl"))
