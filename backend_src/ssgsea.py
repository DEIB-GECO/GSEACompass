# Utility function to exit on error
def errorAndExit(errorString):
    print(errorString)
    exit(1)

try:
    import sys
    import os.path
    import pandas as pd
    import gseapy as gp
    from pandas.api.types import is_numeric_dtype
    import dill
    import matplotlib.pyplot as plt
except Exception as e:
    errorAndExit('Some python libraries weren\'t found.\n' + str(e))

# Home directory of user running this script
HOME_DIR = os.path.expanduser("~")

# Read arguments passed on the script call
gene_sets_path = sys.argv[1]
dataset_path = sys.argv[2]
min_gene_set = int(sys.argv[3])
max_gene_set = int(sys.argv[4])


# If files types are not correct, print error and exit
if (not dataset_path.endswith((".gct", ".txt", ".rnk"))):
    errorAndExit("The dataset file (.gct, .txt, .rnk) is not of the right type.")
if (not gene_sets_path.endswith(".gmt")):
    errorAndExit("The gene set file (.gmt) is not of the right type.")

# Try to parse the expression set file
try:
    if dataset_path.endswith(".rnk"):
        # Check if the ranked list has a header 
        with open(dataset_path, 'r') as f:
            first_line = f.readline().strip()

        has_header = False
        if first_line:
            parts = first_line.split('\t')
        
          # If the second column is not a number, it's a header
        if len(parts) > 1:
            try:
                float(parts[1])
            except ValueError:
                has_header = True

        if has_header:
            dataset = pd.read_csv(dataset_path, skiprows = 1, header = None, index_col=0, sep="\t")
        else:
            dataset = pd.read_csv(dataset_path, header=None, index_col=0, sep="\t")
    else:
        dataset = pd.read_csv(dataset_path, header=2, index_col=0, sep="\t")
except Exception:
    errorAndExit("The expression set file is malformed and cannot be intepreted.")

if dataset_path.endswith(".rnk"):
    # Check if any value in the ranked list file is missing
    if (dataset.isnull().any().any() or dataset.index.hasnans):
        errorAndExit("The ranked list file has some missing values and cannot be used.")

    # Check if any cell of the ranked list file (except index) is not numerical
    if (dataset.apply(lambda x: not is_numeric_dtype(x)).any()):
        errorAndExit("The ranked list file has some non-numerical values and cannot be used.")
else:
    # Check if any value is missing in the expression set file (except for the description column)
    if (dataset.drop(dataset.columns[0], axis=1).isnull().any().any() or dataset.index.hasnans):
        errorAndExit("The expression set file has some missing values and cannot be used.")

    # Check if any cell of the expression set file (except description column) is not numeric
    if (dataset.iloc[:,1:].apply(lambda x: not is_numeric_dtype(x)).any()):
        errorAndExit("The expression set file has some non-numerical values and cannot be used.")
 
if min_gene_set < 0:
    errorAndExit("Min gene set size must be positive.")
if max_gene_set < 0:
    errorAndExit("Max gene set size must be positive.")
if min_gene_set > max_gene_set:
    errorAndExit("Max gene set size must be greater than min gene set size.")

try:
    res = gp.ssgsea(data=dataset,
                    gene_sets=gene_sets_path,
                    min_size=min_gene_set,
                    max_size=max_gene_set,
    )
except Exception as e:
    errorAndExit(f"ssGSEA failed while computing the analysis.\nThe following error was raised:\n{str(e)}")

# Print and send on stdout the result as a JSON-formatted string
res_json = res.res2d.to_json(orient="records")
print(res_json)
sys.stdout.flush()
