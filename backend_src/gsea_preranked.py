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

rnk_list = pd.read_csv(rnk_list_path, header=None, index_col=0, sep="\t")

rnk_chosen = ""

if remap == "none":
    rnk_chosen = rnk_list
else:
    chip = pd.read_csv(chip_path, header=0, index_col=0, sep="\t")
    rnk_chosen = rnk_list.join(chip)[["Gene Symbol", 1]].reset_index(drop=True).dropna()

res = gp.prerank(rnk=rnk_chosen,
                     gene_sets=gene_sets_path,
                     threads=8,
                     min_size=5,
                     max_size=1000,
                     permutation_num=num_permutation,
                     outdir=None,
                     seed=6
                    )

res_json = res.res2d.to_json(orient="records")

print(res_json)

sys.stdout.flush()

# Save the python session on a file
dill.dump_session("gsea_run.pkl")
