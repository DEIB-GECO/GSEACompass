import sys
import os.path
import pandas as pd
import gseapy as gp
from pandas.api.types import is_numeric_dtype

def errorAndExit(errorString):
	print(errorString)
	exit(1)

gene_sets_path = sys.argv[1]
dataset_path = sys.argv[2]
min_gene_set = int(sys.argv[3])
max_gene_set = int(sys.argv[4])

if (not dataset_path.endswith((".gct", ".txt", ".rnk"))):
	errorAndExit("The dataset file (.gct, .txt, .rnk) is not of the right type.")
if (not gene_sets_path.endswith(".gmt")):
	errorAndExit("The gene set file (.gmt) is not of the right type.")

try:
    if dataset_path.endswith(".rnk"):
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
    errorAndExit("The dataset file is malformed and cannot be intepreted.")

if min_gene_set < 0 or max_gene_set < 0 or min_gene_set > max_gene_set:
    errorAndExit("Invalid min/max gene set sizes.")

try:
    # Use gseapy's GSVA implementation
	res = gp.gsva(data=dataset,
                  gene_sets=gene_sets_path,
                  outdir=None,
                  min_size=min_gene_set,
                  max_size=max_gene_set)
except Exception as e:
	errorAndExit(f"GSVA failed while computing the analysis.\nThe following error was raised:\n{str(e)}")

res_json = res.res2d.to_json(orient="records")
print(res_json)
sys.stdout.flush()