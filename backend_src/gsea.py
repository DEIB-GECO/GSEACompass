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

expression_set = pd.read_csv(expression_set_path, header=2, index_col=0, sep="\t")

expression_set_chosen = ""

if remap == "none":
    expression_set_chosen = expression_set
else:
    chip = pd.read_csv(chip_path, header=0, index_col=0, sep="\t")
    expression_set_chosen = expression_set.join(chip).reset_index(drop=True).dropna()

res = gp.gsea(data=expression_set_chosen,
              gene_sets=gene_sets_path,
              cls=phenotype_labels_path,
              permutation_type="phenotype",
              permutation_num=num_permutation,
              outdir=None,
              method="signal_to_noise",
              threads=4, seed= 7)

res_json = res.res2d.to_json(orient="records")

print(res_json)

sys.stdout.flush()

# Save the python session on a file
dill.dump_session("gsea_run.pkl")
