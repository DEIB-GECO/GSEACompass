import sys
import os.path
import warnings
import pandas as pd
import matplotlib.pyplot as plt
from gseapy.plot import GSEAPlot, Heatmap ,TracePlot, DotPlot
from io import StringIO
import dill
import numpy as np
import seaborn as sns
from wordcloud import WordCloud
from typing import Sequence, Optional, List, Tuple, Dict, Union, Any
import fontTools
import fontTools.ttLib.ttFont

# Utility function to convert inches, cm and px
def convert_to_inches(measurement_unit, value):
    match measurement_unit:
        case "cm":
            converted = value / 2.54
        case "px":
            converted = value / 300
        case _:
            converted = value
    return converted

def convert_to_px(measurement_unit, value):
    match measurement_unit:
        case "cm":
            converted = value * 2.54 * 300
        case "in":
            converted = value * 300
        case _:
            converted = value
    return converted

# Modified version of gseapy.gseaplot
def gseaplot_modified(
    term: str,
    hits: Sequence[int],
    nes: float,
    pval: float,
    fdr: float,
    RES: Sequence[float],
    rank_metric: Optional[Sequence[float]] = None,
    pheno_pos: str = "",
    pheno_neg: str = "",
    color: str = "#88C544",
    figsize: Tuple[float, float] = (6, 5.5),
    cmap: str = "seismic",
    # File name without extension
    ofname: Optional[str] = None,
    # Added parameter, to choose the output file extensions
    # Each element of the list must be an extension (.png, .pdf, etc.)
    ofext: Optional[List[str]] = None,
    **kwargs,
) -> Optional[List[plt.Axes]]:
    g = GSEAPlot(
        term, 
        hits, 
        RES, 
        nes, 
        pval, 
        fdr, 
        rank_metric, 
        pheno_pos, 
        pheno_neg, 
        color, 
        figsize, 
        cmap,
        # The file name is concatened to the first extension for compatibility reasons
        ofname + ofext[0])
    g.add_axes()
    if ofname is None:
        return g.fig.axes
    
    # Export the output file as an image of each given extension
    for ext in ofext:
        g.ofname = ofname + ext
        g.savefig(bbox_inches="tight")
        
# Modified version of gseapy.gseaplot2
def gseaplot2_modified(
    terms: List[str],
    hits: List[Sequence[int]],
    RESs: List[Sequence[float]],
    rank_metric: Optional[Sequence[float]] = None,
    colors: Optional[Union[str, List[str]]] = None,
    figsize: Tuple[float, float] = (6, 4),
    legend_kws: Optional[Dict[str, Any]] = None,
    # File name without extension
    ofname: Optional[str] = None,
    # Added parameter, to choose the output file extensions
    # Each element of the list must be an extension (.png, .pdf, etc.)
    ofext: Optional[List[str]] = None,
    **kwargs,
) -> Optional[List[plt.Axes]]:
    # in case you just input one pathway
    if isinstance(terms, str):
        terms = [terms]
    # make the inputs are legal
    assert (
        hasattr(terms, "__len__")
        and hasattr(hits, "__len__")
        and hasattr(RESs, "__len__")
    )
    assert len(terms) == len(hits) == len(RESs)

    trace = TracePlot(
        terms=list(terms),
        runes=list(RESs),
        tags=list(hits),
        rank_metric=rank_metric,
        colors=colors,
        figsize=figsize,
        # The file name is concatened to the first extension for compatibility reasons
        ofname=ofname + ofext[0],
        legend_kws=legend_kws,
        **kwargs,
    )
    trace.add_axes()
    if ofname is None:
        return trace.fig.axes
    
    # Export the output file as an image of each given extension
    for ext in ofext:
        trace.savefig(ofname=ofname+ext, bbox_inches="tight")

# Modified version of gseapy.dotplot
def dotplot_modified(
    df: pd.DataFrame,
    column: str = "Adjusted P-value",
    x: Optional[str] = None,
    y: str = "Term",
    x_order: Union[List[str], bool] = False,
    y_order: Union[List[str], bool] = False,
    title: str = "",
    cutoff: float = 0.05,
    top_term: int = 10,
    size: float = 5,
    ax: Optional[plt.Axes] = None,
    figsize: Tuple[float, float] = (4, 6),
    cmap: str = "viridis_r",
    # File name without extension
    ofname: Optional[str] = None,
    # Added parameter, to choose the output file extensions
    # Each element of the list must be an extension (.png, .pdf, etc.)
    ofext: Optional[List[str]] = None,
    xticklabels_rot: Optional[float] = None,
    yticklabels_rot: Optional[float] = None,
    marker: str = "o",
    show_ring: bool = False,
    **kwargs,
):
    if "group" in kwargs:
        warnings.warn("group is deprecated; use x instead", DeprecationWarning, 2)
        return

    dot = DotPlot(
        df=df,
        x=x,
        y=y,
        x_order=x_order,
        y_order=y_order,
        hue=column,
        title=title,
        thresh=cutoff,
        n_terms=int(top_term),
        dot_scale=size,
        ax=ax,
        figsize=figsize,
        cmap=cmap,
        # The file name is concatened to the first extension for compatibility reasons
        ofname=ofname + ofext[0],
        marker=marker,
    )
    ax = dot.scatter(outer_ring=show_ring)

    if xticklabels_rot:
        for label in ax.get_xticklabels():
            label.set_ha("right")
            label.set_rotation(xticklabels_rot)

    if yticklabels_rot:
        for label in ax.get_yticklabels():
            label.set_ha("right")
            label.set_rotation(yticklabels_rot)

    if ofname is None:
        return ax
    
    # Export the output file as an image of each given extension
    for ext in ofext:
        dot.fig.savefig(ofname + ext, bbox_inches="tight", dpi=300)

# Modified version of gseapy.heatmap
def heatmap_modified(
    df: pd.DataFrame,
    z_score: Optional[int] = None,
    title: str = "",
    figsize: Tuple[float, float] = (5, 5),
    cmap: Optional[str] = None,
    xticklabels: bool = True,
    yticklabels: bool = True,
    # File name without extension
    ofname: Optional[str] = None,
    # Added parameter, to choose the output file extensions
    # Each element of the list must be an extension (.png, .pdf, etc.)
    ofext: Optional[List[str]] = None,
    ax: Optional[plt.Axes] = None,
    **kwargs,
):
    ht = Heatmap(
        df=df,
        z_score=z_score,
        title=title,
        figsize=figsize,
        cmap=cmap,
        xticklabels=xticklabels,
        yticklabels=yticklabels,
        # The file name is concatened to the first extension for compatibility reasons
        ofname=ofname + ofext[0],
        ax=ax,
        **kwargs,
    )
    ax = ht.draw()
    if ofname is None:
        return ax
    
    # Export the output file as an image of each given extension
    for ext in ofext:
        ht.fig.savefig(ofname + ext, bbox_inches="tight", dpi=300)

# Home directory of user running this script
HOME_DIR = os.path.expanduser("~")

# Load the saved python session, with all its variables
dill.load_session(os.path.join(HOME_DIR, "gseawrap_python_session.pkl"))

# Default plot file name and extensions
PLOT_FILE = os.path.join(HOME_DIR, "gsea_plot")
plot_extensions = [".png", ".pdf", ".svg"]

# Read plot type argument passed by the script call
plot_type = sys.argv[1]

match plot_type:

    case "enrichment-plot":
        selected_terms_raw = sys.argv[2]
        size_x = float(sys.argv[3])
        size_y = float(sys.argv[4])
        measurement_unit = sys.argv[5]
        
        converted_size_x = convert_to_inches(measurement_unit, size_x)
        converted_size_y = convert_to_inches(measurement_unit, size_y)
        
        if (converted_size_x > 50 or converted_size_y > 50):
            print("Plot sizes cannot exceed 50 inches.")
            exit(1)

        # Convert the JSON-formatted input in a Series
        selected_terms = pd.read_json(StringIO(selected_terms_raw))[0]

        # If just one term is passed
        if len(selected_terms) == 1:
            gseaplot_modified(
                rank_metric=res.ranking, 
                term=selected_terms[0],
                figsize=(converted_size_x,converted_size_y),
                ofname=PLOT_FILE,
                ofext=plot_extensions,
                **res.results[selected_terms[0]])
        
        # If two or more terms are passed
        else:
            hits = [res.results[t]["hits"] for t in selected_terms]
            runes = [res.results[t]["RES"] for t in selected_terms]

            gseaplot2_modified(
                terms=selected_terms, 
                RESs=runes, 
                hits=hits,
                rank_metric=res.ranking,
                legend_kws={"loc": (0, 1.1)}, 
                figsize=(converted_size_x,converted_size_y),
                ofname=PLOT_FILE,
                ofext=plot_extensions)
    
    case "dotplot":
        selected_column_and_terms_file_path = sys.argv[2]
        size_x = float(sys.argv[3])
        size_y = float(sys.argv[4])
        measurement_unit = sys.argv[5]
        
        converted_size_x = convert_to_inches(measurement_unit, size_x)
        converted_size_y = convert_to_inches(measurement_unit, size_y)
        
        if (converted_size_x > 50 or converted_size_y > 50):
            print("Plot sizes cannot exceed 50 inches.")
            exit(1)
        
        # Parse file content as JSON
        selected_column_and_terms = pd.read_json(selected_column_and_terms_file_path)
        
        # Extract selected column name (first field)
        selected_column = selected_column_and_terms.iloc[0, 0]
        
        # Extract selected terms (second field, list) and convert it to a series
        selected_terms = pd.Series(selected_column_and_terms.iloc[1, 0]).rename('Term')
        
        # Join the GSEA/GSEA preranked result with the selected terms
        # i.e filter out from res.res2d all those rows not having a term contained in selected_terms
        filtered_res = res.res2d.merge(selected_terms, how="inner", on="Term")
            
        dotplot_modified(
            filtered_res,
            title="",
            column=selected_column,
            cmap=plt.cm.viridis,
            size=6,
            figsize=(converted_size_x,converted_size_y), 
            cutoff=0.25, 
            show_ring=False,
            ofname=PLOT_FILE,
            ofext=plot_extensions)
        
    case "heatmap":
        selected_row_raw = sys.argv[2]
        size_x = float(sys.argv[3])
        size_y = float(sys.argv[4])
        measurement_unit = sys.argv[5]
        
        converted_size_x = convert_to_inches(measurement_unit, size_x)
        converted_size_y = convert_to_inches(measurement_unit, size_y)
        
        if (converted_size_x > 50 or converted_size_y > 50):
            print("Plot sizes cannot exceed 50 inches.")
            exit(1)

        # Convert the JSON-formatted input in a Series
        selected_row = pd.read_json(StringIO(selected_row_raw), typ="series")
        
        selected_term = selected_row.Term
        selected_genes = selected_row.Lead_genes.split(";")
        
        heatmap_modified(
            df=res.heatmat.loc[selected_genes],
            z_score=0, 
            title=selected_term,
            figsize=(converted_size_x,converted_size_y),
            ofname=PLOT_FILE,
            ofext=plot_extensions)
        
    case "intersection-over-union":
        selected_terms_raw = sys.argv[2]
        gene_sets_path = sys.argv[3]
        size_x = float(sys.argv[4])
        size_y = float(sys.argv[5])
        measurement_unit = sys.argv[6]
        
        converted_size_x = convert_to_inches(measurement_unit, size_x)
        converted_size_y = convert_to_inches(measurement_unit, size_y)
        
        if (converted_size_x > 50 or converted_size_y > 50):
            print("Plot sizes cannot exceed 50 inches.")
            exit(1)
        
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
        fig, ax = plt.subplots(figsize=(converted_size_x, converted_size_y))
        ax.set_aspect('equal')
        sns.heatmap(iou_matrix, mask=mask, annot=False, cmap='YlGnBu', ax=ax, linewidths=0.5, linecolor='lightgrey')

        # Add a legend for the labels
        ax.legend([plt.Line2D([0], [0], color='white') for _ in labels], 
                [f'{k}: {v}' for k, v in labels.items()], 
                bbox_to_anchor=(1.20, 1.1), loc='upper left')

        # Save the figure as an images with several extensions
        for ext in plot_extensions:
            fig.savefig(PLOT_FILE + ext, bbox_inches='tight')
        
    case "wordcloud":
        selected_column_file_path = sys.argv[2]
        size_x = int(sys.argv[3])
        size_y = int(sys.argv[4])
        measurement_unit = sys.argv[5]
        
        converted_size_x = convert_to_px(measurement_unit, size_x)
        converted_size_y = convert_to_px(measurement_unit, size_y)
        
        if (converted_size_x > 3000 or converted_size_y > 3000):
            print("Plot sizes cannot exceed 3000 pixels.")
            exit(1)
        
        # Read selected column data from file path passed as CLI arguments
        file = open(selected_column_file_path, "r")
        selected_column = file.read()
        file.close()
        
        data = selected_column.replace("_", " ").replace(";", " ").replace(",", " ")
        
        wc = WordCloud(
            width=converted_size_x, 
            height=converted_size_y,
            background_color="white",
            scale=1).generate(data)
        
        # The .svg image extension is excluded, since it's not supported for wordclouds
        for ext in plot_extensions[:2]:
            wc.to_file(PLOT_FILE + ext)
    
    case _:
        print("The requested plot doesn't exist", file=sys.stderr)
        exit(1)


