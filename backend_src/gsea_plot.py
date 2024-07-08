try:
    import sys
    import os.path
    import pandas as pd
    import matplotlib.pyplot as plt
    from gseapy import gseaplot, gseaplot2, dotplot, heatmap
    from io import StringIO
    import dill
    import numpy as np
    import seaborn as sns
    from wordcloud import WordCloud
    import json
except Exception as e:
    print('Some python libraries weren\'t found.\n' + str(e))
    exit(1)

# Home directory of user running this script
HOME_DIR = os.path.expanduser("~")

# Load the saved python session, with all its variables
dill.load_session(os.path.join(HOME_DIR, "gseawrap_python_session.pkl"))

# Default plot file name
PLOT_FILE = os.path.join(HOME_DIR, "gsea_plot.png")

# Read plot type argument passed by the script call
plot_type = sys.argv[1]

match plot_type:

    case "enrichment-plot":
        selected_terms_raw = sys.argv[2]
        size_x = float(sys.argv[3])
        size_y = float(sys.argv[4])

        # Convert the JSON-formatted input in a Series
        selected_terms = pd.read_json(StringIO(selected_terms_raw))[0]

        # If just one term is passed
        if len(selected_terms) == 1:
            gseaplot(rank_metric=res.ranking, 
                    term=selected_terms[0],
                    figsize=(size_x,size_y),
                    ofname=PLOT_FILE,
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
                    figsize=(size_x,size_y),
                    ofname=PLOT_FILE)
    
    case "dotplot":
        selected_column_and_terms_file_path = sys.argv[2]
        size_x = float(sys.argv[3])
        size_y = float(sys.argv[4])
        
        # Parse file content as JSON
        selected_column_and_terms = pd.read_json(selected_column_and_terms_file_path)
        
        # Extract selected column name (first field)
        selected_column = selected_column_and_terms.iloc[0, 0]
        
        # Extract selected terms (second field, list) and convert it to a series
        selected_terms = pd.Series(selected_column_and_terms.iloc[1, 0]).rename('Term')
        
        # Join the GSEA/GSEA preranked result with the selected terms
        # i.e filter out from res.res2d all those rows not having a term contained in selected_terms
        filtered_res = res.res2d.merge(selected_terms, how="inner", on="Term")
            
        dotplot(filtered_res,
                column=selected_column,
                title=selected_column + " dotplot",
                cmap=plt.cm.viridis,
                size=6,
                figsize=(size_x,size_y), 
                cutoff=0.25, 
                show_ring=False,
                ofname=PLOT_FILE)
        
    case "heatmap":
        selected_row_raw = sys.argv[2]
        size_x = float(sys.argv[3])
        size_y = float(sys.argv[4])

        # Convert the JSON-formatted input in a Series
        selected_row = pd.read_json(StringIO(selected_row_raw), typ="series")
        
        selected_term = selected_row.Term
        selected_genes = selected_row.Lead_genes.split(";")
        
        heatmap(df=res.heatmat.loc[selected_genes],
                z_score=0, 
                title=selected_term,
                figsize=(size_x,size_y),
                ofname=PLOT_FILE)
        
    case "intersection-over-union":
        selected_terms_raw = sys.argv[2]
        gene_sets_path = sys.argv[3]
        size_x = float(sys.argv[4])
        size_y = float(sys.argv[5])
        
        # Convert the JSON-formatted selected terms in a Series
        selected_terms = pd.read_json(StringIO(selected_terms_raw))[0]
        
        # Get the numbers of columns in each line of the gene sets database
        # Needed since the gene sets data database has a different number of fields for each row
        col_count = []
        with open(gene_sets_path, "r") as gene_sets_file:
            col_count = [ len(line.split("\t")) for line in gene_sets_file.readlines() ]
        
        # Read the gene sets database CSV file
        gene_sets_database = pd.read_csv(gene_sets_path, sep="\t", names=range(max(col_count)), header=None, index_col=0)
        
        genesets = {}
        labels = {}
        i = 0
        
        for term in selected_terms:
            # Create a short label for each geneset
            label = 'G' + str(i)
            labels[label] = term
            
            genesets[label] = set(gene_sets_database.loc[term, 2:].dropna())
            
            i = i+1

        # Calculate the IOU for each pair of gene sets
        iou_matrix = pd.DataFrame(index=genesets.keys(), columns=genesets.keys())
        for i in genesets:
            for j in genesets:
                intersection = genesets[i].intersection(genesets[j])
                union = genesets[i].union(genesets[j])
                iou = len(intersection) / len(union)
                iou_matrix.loc[i, j] = iou

        # Convert the matrix to float
        iou_matrix = iou_matrix.astype(float)

        # Mask for the upper triangle, main diagonal included
        mask = np.triu(np.ones_like(iou_matrix, dtype=bool), k=1)
        
        # Generate the heatmap
        fig, ax = plt.subplots(figsize=(size_x, size_y))
        ax.set_aspect('equal')
        sns.heatmap(iou_matrix, mask=mask, annot=False, cmap='YlGnBu', ax=ax, linewidths=0.5, linecolor='lightgrey')

        # Add a legend for the labels
        ax.legend([plt.Line2D([0], [0], color='white') for _ in labels], 
                [f'{k}: {v}' for k, v in labels.items()], 
                bbox_to_anchor=(1.20, 1.1), loc='upper left')

        # Save the figure
        fig.savefig(PLOT_FILE, bbox_inches='tight')
        
    case "wordcloud":
        selected_column_file_path = sys.argv[2]
        size_x = int(sys.argv[3])
        size_y = int(sys.argv[4])
        
        # Read selected column data from file path passed as CLI arguments
        file = open(selected_column_file_path, "r")
        selected_column = file.read()
        file.close()
        
        data = selected_column.replace("_", " ").replace(";", " ").replace(",", " ")
        
        wc = WordCloud(width=size_x, 
                       height=size_y,
                       background_color="white",
                       scale=4).generate(data)
        
        wc.to_file(PLOT_FILE)
    
    case _:
        print("The requested plot doesn't exist", file=sys.stderr)
        exit(1)


