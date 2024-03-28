import sys

import pandas as pd
import matplotlib.pyplot as plt
import gseapy as gp
from gseapy import gseaplot
from gseapy import gseaplot2

from utils import gene_chip_conversion

gene_sets_path = sys.argv[1]
rnk_list_path = sys.argv[2]
chip_path = sys.argv[3]

rnk_list = pd.read_csv(rnk_list_path, header=None, sep="\t")
chip = pd.read_csv(chip_path, header=0, sep="\t")

# First and second column of ranked list as a DataFrames
rnk_first_col = rnk_list.iloc[:, 0]
rnk_second_col = rnk_list.iloc[:, 1]
 
orthologs = rnk_first_col.apply(lambda x : gene_chip_conversion(chip, x))

rnk_list_orthologs = pd.concat([orthologs, rnk_second_col], axis=1).dropna()

pre_res = gp.prerank(rnk=rnk_list_orthologs,
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
