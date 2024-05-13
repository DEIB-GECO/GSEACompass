import sys
import pandas as pd
import matplotlib.pyplot as plt
from gseapy import gseaplot, gseaplot2, dotplot, heatmap
from io import StringIO
import dill
from operator import itemgetter
import numpy as np
from PIL import Image
from wordcloud import WordCloud
from nltk.corpus import stopwords

# Read plot type argument passed by the script call
# it's supposed either "enrichment-plot" or "dotplot"
plot_type = sys.argv[1]

# Load the saved python session, with all its variables
dill.load_session("gsea_run.pkl")

match plot_type:

    case "enrichment-plot":
        selected_terms_raw = sys.argv[2]

        # Convert the JSON-formatted input in a Series
        selected_terms = pd.read_json(StringIO(selected_terms_raw))[0]

        # If just one term is passed
        if len(selected_terms) == 1:
            gseaplot(rank_metric=res.ranking, 
                    term=selected_terms[0],
                    figsize=(4,5),
                    ofname="plots/gsea_plot.png",
                    **res.results[selected_terms[0]])
        
        # If two or more terms are passed
        else:
            hits = [res.results[t]["hits"] for t in selected_terms]
            runes = [res.results[t]["RES"] for t in selected_terms]

            gseaplot2(terms=selected_terms, 
                    RESs=runes, 
                    hits=hits,
                    rank_metric=res.ranking,
                    legend_kws={"loc": (0, 1.1)}, 
                    figsize=(4,5),
                    ofname="plots/gsea_plot.png")
    
    case "dotplot":
        selected_column = sys.argv[2]

        dotplot(res.res2d,
                column=selected_column,
                title=selected_column + " dotplot",
                cmap=plt.cm.viridis,
                size=6,
                figsize=(4,5), cutoff=0.25, show_ring=False,
                ofname="plots/gsea_plot.png")
        
    case "heatmap":
        selected_row_raw = sys.argv[2]

        # Convert the JSON-formatted input in a Series
        selected_row = pd.read_json(StringIO(selected_row_raw), typ="series")
        
        selected_term = selected_row.Term
        selected_genes = selected_row.Lead_genes.split(";")
        
        heatmap(df=res.heatmat.loc[selected_genes],
                z_score=0, 
                title=selected_term,
                figsize=(14,4),
                ofname="plots/gsea_plot.png")
        
    case "wordcloud":
        selected_column = sys.argv[2]
        
        data = selected_column.replace("_", " ").replace(";", " ").replace(",", " ")
        
        wc = WordCloud(width=800, 
                       height=500,
                       background_color="white",
                       scale=4).generate(data)
        
        wc.to_file("plots/gsea_plot.png")
    
    case _:
        print("Error: request plot doesn't exist")


