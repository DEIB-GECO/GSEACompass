import sys
import pandas as pd
import matplotlib.pyplot as plt
from gseapy import gseaplot, gseaplot2
from io import StringIO
import dill
from operator import itemgetter

# Read arguments passed on the script call
selected_terms_raw = sys.argv[1]

# Convert the string-formatted input in a list
selected_terms = pd.read_json(StringIO(selected_terms_raw))[0]

# Load the saved python session, with all the attached variables
dill.load_session("gsea_run.pkl")

if len(selected_terms) == 1:
    gseaplot(rank_metric=pre_res.ranking, 
             term=selected_terms[0],
             figsize=(4,5),
             ofname='plots/gsea_plot.png',
             **pre_res.results[selected_terms[0]])
else:
    hits = [pre_res.results[t]['hits'] for t in selected_terms]
    runes = [pre_res.results[t]['RES'] for t in selected_terms]

    gseaplot2(terms=selected_terms, 
              RESs=runes, 
              hits=hits,
              rank_metric=pre_res.ranking,
              legend_kws={'loc': (0, -1)}, 
              figsize=(4,5),
              ofname='plots/gsea_plot.png')