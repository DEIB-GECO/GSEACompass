import sys

import pandas as pd
import matplotlib.pyplot as plt
import gseapy as gp
from gseapy import gseaplot
from gseapy import gseaplot2

gene_sets_path = sys.argv[1]
rnk_list_path = sys.argv[2]
chip_path = sys.argv[3]

rnk_list = pd.read_csv(rnk_list_path, header=None, index_col=0, sep="\t")
chip = pd.read_csv(chip_path, header=0, index_col=0, sep="\t")

rnk_orthologs = rnk_list.join(chip)[["Gene Symbol", 1]].reset_index(drop=True).dropna()

pre_res = gp.prerank(rnk=rnk_orthologs,
                     gene_sets=gene_sets_path,
                     threads=8,
                     min_size=5,
                     max_size=1000,
                     permutation_num=1000,
                     outdir=None,
                     seed=6
                    )

res_json = pre_res.res2d.to_json(orient="records")

print(res_json)

sys.stdout.flush()
