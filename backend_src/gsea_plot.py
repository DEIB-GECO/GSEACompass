import sys
import os.path
import warnings
import pandas as pd
import matplotlib
import matplotlib.pyplot as plt
from gseapy.plot import GSEAPlot, Heatmap ,TracePlot, DotPlot
from io import StringIO
import dill
import pickle
import numpy as np
import seaborn as sns
from wordcloud import WordCloud
from typing import Sequence, Optional, List, Tuple, Dict, Union, Any
import networkx as nx
import matplotlib.pyplot as plt
from tqdm.auto import tqdm
import json
import math
import matplotlib.cm as cm
import matplotlib.colors as mcolors
import matplotlib.lines as mlines
from pyvis.network import Network


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

# Directory in which this script is placed
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))

# Read plot type argument passed by the script call
plot_type = sys.argv[1]

if (plot_type not in ["heatmap-ssgsea", "heatmap-gsva", "similarity-graph"]):
    # Load the saved python session, with all its variables
    dill.load_session(os.path.join(HOME_DIR, "gseacompass_python_session.pkl"))

# Default plot file name and extensions
PLOT_FILE = os.path.join(HOME_DIR, "gsea_plot")
plot_extensions = [".png", ".pdf", ".svg"]

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
        gene_sets_database = pd.read_csv(gene_sets_path, sep="\t", names=range(max(col_count)), header=None, index_col=0, engine="python")
        
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
    
    case "heatmap-ssgsea":
        visible_rows_file_path = sys.argv[2]
        size_x = float(sys.argv[3])
        size_y = float(sys.argv[4])
        measurement_unit = sys.argv[5]
        
        converted_size_x = convert_to_inches(measurement_unit, size_x)
        converted_size_y = convert_to_inches(measurement_unit, size_y)
        
        if (converted_size_x > 50 or converted_size_y > 50):
            print("Plot sizes cannot exceed 50 inches.")
            exit(1)
            
        # Read selected column data from file path passed as CLI arguments
        file = open(visible_rows_file_path, "r")
        visible_rows = file.read()
        file.close()
        
        data = pd.read_json(StringIO(visible_rows))
        
        # Make data as table Term versus Name, with NES values as values
        data = data.pivot(index="Term", columns="Name", values="NES")

        # Plot heatmap without gseapy, on NES values of the visible rows
        fig, ax = plt.subplots(figsize=(converted_size_x, converted_size_y))
        sns.heatmap(data, cmap="YlGnBu", ax=ax, linewidths=0.5, linecolor='lightgrey')
        ax.set_title("ssGSEA NES Heatmap", fontsize=16)
        
        # Save the figure as an images with several extensions
        for ext in plot_extensions:
            fig.savefig(PLOT_FILE + ext, bbox_inches='tight')
            
    case "similarity-graph":
        selected_terms_raw = sys.argv[2]
        size_x = float(sys.argv[3])        
        size_y = float(sys.argv[4])
        measurement_unit = sys.argv[5]

        import json
        import math
        import os
        import pickle
        import numpy as np
        import matplotlib.cm as cm
        import matplotlib.colors as mcolors
        from pyvis.network import Network

        # Parse the JSON containing Term, Score, and FDR
        graph_data = json.loads(selected_terms_raw)
        
        # Fallback for backward compatibility
        if len(graph_data) > 0 and isinstance(graph_data[0], str):
            graph_data = [{"Term": t, "Score": 0, "FDR": 1.0} for t in graph_data]

        selected_terms = [item["Term"] for item in graph_data]
        scores = [item["Score"] for item in graph_data]
        fdrs = [item["FDR"] for item in graph_data]

        if getattr(sys, 'frozen', False):
            # Running as a compiled executable (located in backend_src/dist/backend/)
            exe_dir = os.path.dirname(sys.executable)
            embeddings_path = os.path.abspath(os.path.join(exe_dir, '..', '..', '..', 'misc_resources', 'msigdb_embeddings.pkl'))
        else:
            # Running as a normal script (located in backend_src/)
            script_dir = os.path.dirname(os.path.abspath(__file__))
            embeddings_path = os.path.abspath(os.path.join(script_dir, '..', 'misc_resources', 'msigdb_embeddings.pkl'))
        
        with open(embeddings_path, "rb") as f:
            precomputed_embs = pickle.load(f)

        # Extract embeddings and safely filter out missing terms
        term_vectors = []
        valid_terms = []
        valid_scores = []
        valid_fdrs = []

        for i, term in enumerate(selected_terms):
            if term in precomputed_embs:
                term_vectors.append(precomputed_embs[term])
                valid_terms.append(term)
                valid_scores.append(scores[i])
                valid_fdrs.append(fdrs[i])
            else:
                print(f"Warning: No pre-computed embedding found for {term}. It will be excluded from the graph.")

        if not term_vectors:
            print("No valid embeddings found for the selected terms.")
            exit(1)

        # Overwrite variables so the graph only draws valid terms
        selected_terms = valid_terms
        scores = valid_scores
        fdrs = valid_fdrs

        # Calculate similarity matrix using pure Numpy (Dot product = Cosine Similarity)
        embs_matrix = np.array(term_vectors)
        similarity_matrix = np.dot(embs_matrix, embs_matrix.T)
        
        # Biological Context Formatting
        node_sizes = [10 + 8 * (-math.log10(max(f, 1e-5))) for f in fdrs] 
        max_abs_score = max([abs(s) for s in scores] + [1e-5])
        norm = mcolors.TwoSlopeNorm(vmin=-max_abs_score, vcenter=0, vmax=max_abs_score)
        cmap = matplotlib.colormaps['coolwarm']        
        node_colors = [mcolors.to_hex(cmap(norm(s))) for s in scores]

        # Generate Interactive Graph
        net = Network(height="100vh", width="100%", bgcolor="#ffffff", font_color="black")
        net.repulsion(node_distance=250, central_gravity=0.05, spring_length=200, spring_strength=0.05, damping=0.9)

        # Add Nodes (shape="dot" explicitly forces Pyvis to respect our custom node_sizes)
        for i in range(len(selected_terms)):
            tooltip = f"{selected_terms[i]}\nNES: {scores[i]:.2f}\nFDR q-val: {fdrs[i]:.4f}"
            net.add_node(i, label=f"G{i}", title=tooltip, color=node_colors[i], size=node_sizes[i], shape="dot")

        # Add Edges (Using hard width parameter for thinner, straight lines)
        for i in range(len(selected_terms)):
            for j in range(i+1, len(selected_terms)):
                weight = float(similarity_matrix[i, j])
                if weight > 0.1: 
                    net.add_edge(i, j, width=weight*2, weight=weight, title=f"Similarity: {weight:.2f}", color="#cccccc", smooth=False)

        net.write_html(PLOT_FILE + ".html")

        # Build the dynamic list mapping G-labels to pathways
        term_legend_html = "<div style='max-height: 250px; overflow-y: auto; font-size: 11px; margin-top: 15px; border-top: 1px solid #ccc; padding-top: 10px;'>"
        for i, term in enumerate(selected_terms):
            term_legend_html += f"<div style='margin-bottom: 4px;'><b>G{i}</b>: {term}</div>"
        term_legend_html += "</div>"
        
        with open(PLOT_FILE + ".html", "r") as f:
            html = f.read()
        

        ui_injection = f"""
            <div style="position: absolute; top: 20px; left: 20px; z-index: 9999; background: rgba(255,255,255,0.95); padding: 15px; border-radius: 8px; border: 1px solid #ccc; font-family: sans-serif; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <label for="threshold-slider" style="font-weight: bold; font-size: 14px;">Edge Cosine Similarity Threshold: <span id="threshold-val" style="color: #0048ff;">0.75</span></label><br>
                <input type="range" min="0" max="1" step="0.01" id="threshold-slider" value="0.75" style="width: 250px; margin-top: 10px;"><br>
                <button id="export-btn" style="margin-top: 15px; width: 100%; padding: 8px; cursor: pointer; background: #0048ff; color: white; border: none; border-radius: 4px; font-weight: bold;">Export as PNG</button>
            </div>
            
            <div style="position: absolute; top: 20px; right: 20px; z-index: 9999; background: rgba(255,255,255,0.95); padding: 15px; border-radius: 8px; border: 1px solid #ccc; font-family: sans-serif; box-shadow: 0 4px 6px rgba(0,0,0,0.1); font-size: 12px; width: 320px;">
                <b>Node Color (NES)</b><br>
                <div style="background: linear-gradient(to right, #3b4cc0, #dddddd, #b40426); width: 100%; height: 15px; border-radius: 3px; margin-top: 5px; margin-bottom: 5px;"></div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 15px;"><span>Down</span><span>Up</span></div>
                <b>Node Size (FDR q-val)</b><br>
                <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 5px;">
                    <div style="width: 10px; height: 10px; border-radius: 50%; background: #999;"></div> Not Sig.
                    <div style="width: 25px; height: 25px; border-radius: 50%; background: #999;"></div> Highly Sig.
                </div>
                {term_legend_html}
            </div>

            <script>
            document.addEventListener("DOMContentLoaded", function() {{
                setTimeout(function() {{
                    if (typeof edges !== 'undefined') {{
                        // Threshold Slider Logic
                        var slider = document.getElementById('threshold-slider');
                        var valSpan = document.getElementById('threshold-val');
                        var allEdges = edges.get(); 
                        
                        function updateEdges(thresh) {{
                            var updates = [];
                            allEdges.forEach(function(edge) {{
                                updates.push({{id: edge.id, hidden: edge.weight < thresh}});
                            }});
                            edges.update(updates);
                        }}
                        
                        slider.addEventListener('input', function() {{
                            var val = parseFloat(this.value);
                            valSpan.innerText = val.toFixed(2);
                            updateEdges(val);
                        }});
                        updateEdges(parseFloat(slider.value)); // Initial filter

                        // Canvas Export Logic
                        document.getElementById('export-btn').addEventListener('click', function() {{
                            var originalCanvas = document.getElementsByTagName('canvas')[0];
                            if (originalCanvas) {{
                                // Create a temporary canvas to hold the white background
                                var tempCanvas = document.createElement('canvas');
                                tempCanvas.width = originalCanvas.width;
                                tempCanvas.height = originalCanvas.height;
                                var ctx = tempCanvas.getContext('2d');

                                // Fill with solid white
                                ctx.fillStyle = '#ffffff';
                                ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

                                // Draw the transparent vis.js canvas on top
                                ctx.drawImage(originalCanvas, 0, 0);

                                // Export the result
                                var dataURL = tempCanvas.toDataURL('image/png');
                                var link = document.createElement('a');
                                link.download = 'plot.png';
                                link.href = dataURL;
                                link.click();
                            }}
                        }});
                    }}
                }}, 1500); // Give vis.js time to initialize
            }});
            </script>
        """
        html = html.replace("</body>", ui_injection + "</body>")
        with open(PLOT_FILE + ".html", "w") as f:
            f.write(html)
        
    case "similarity-heatmap":
        selected_terms_raw = sys.argv[2]
        size_x = float(sys.argv[3])
        size_y = float(sys.argv[4])
        measurement_unit = sys.argv[5]
        
        converted_size_x = convert_to_inches(measurement_unit, size_x)
        converted_size_y = convert_to_inches(measurement_unit, size_y)
        
        if (converted_size_x > 50 or converted_size_y > 50):
            print("Plot sizes cannot exceed 50 inches.")
            exit(1)
            
        # Parse the JSON containing Term, Score, and FDR
        raw_data = json.loads(selected_terms_raw)
        heatmap_data = []
        
        # Ignores nulls/garbage from the UI
        for item in raw_data:
            if isinstance(item, dict) and "Term" in item:
                heatmap_data.append(item)
            elif isinstance(item, str):
                heatmap_data.append({"Term": item, "Score": 0, "FDR": 1.0})
                
        if not heatmap_data:
            print("Error: No valid gene set data was received from the UI.", file=sys.stderr)
            exit(1)

        selected_terms = [item["Term"] for item in heatmap_data]
        scores = [item["Score"] for item in heatmap_data]
        fdrs = [item["FDR"] for item in heatmap_data]

        # Clean up the terms for the model
        model_inputs = [term.replace("_", " ").replace(";", " ").replace(",", " ").strip().lower() for term in selected_terms]

        if getattr(sys, 'frozen', False):
            # Running as a compiled executable (backend_src/dist/backend/)
            exe_dir = os.path.dirname(sys.executable)
            embeddings_path = os.path.abspath(os.path.join(exe_dir, '..', '..', '..', 'misc_resources', 'msigdb_embeddings.pkl'))
        else:
            # Running as a normal script (backend_src/)
            script_dir = os.path.dirname(os.path.abspath(__file__))
            embeddings_path = os.path.abspath(os.path.join(script_dir, '..', 'misc_resources', 'msigdb_embeddings.pkl'))
        
        with open(embeddings_path, "rb") as f:
            precomputed_embs = pickle.load(f)

        # Extract embeddings and filter out missing terms
        term_vectors = []
        valid_terms = []
        valid_scores = []
        valid_fdrs = []

        for i, term in enumerate(selected_terms):
            if term in precomputed_embs:
                term_vectors.append(precomputed_embs[term])
                valid_terms.append(term)
                valid_scores.append(scores[i])
                valid_fdrs.append(fdrs[i])
            else:
                print(f"Warning: No pre-computed embedding found for {term}. It will be excluded from the graph.")

        if not term_vectors:
            print("No valid embeddings found for the selected terms.")
            exit(1)

        # Overwrite variables so the graph only draws valid terms
        selected_terms = valid_terms
        scores = valid_scores
        fdrs = valid_fdrs

        # Calculate similarity matrix using pure Numpy (Dot product = Cosine Similarity)
        embs_matrix = np.array(term_vectors)
        similarity_matrix = np.dot(embs_matrix, embs_matrix.T)
        
        labels = {f'G{i}': term for i, term in enumerate(selected_terms)}
        
        plt.figure(figsize=(converted_size_x, converted_size_y))
        sns.heatmap(similarity_matrix, xticklabels=list(labels.keys()), yticklabels=list(labels.keys()), cmap='YlGnBu', linewidths=0.5, linecolor='lightgrey')
        plt.title("Similarity Heatmap", fontsize=16)
        
        plt.legend([plt.Line2D([0], [0], color='lightblue', marker='', linestyle='') for _ in labels], 
                   [f'{k}: {v}' for k, v in labels.items()], bbox_to_anchor=(1.30, 1.1), loc='upper left')
        
        # Save the figure as an images with several extensions
        for ext in plot_extensions:
            plt.savefig(PLOT_FILE + ext, bbox_inches='tight')
            
    case "heatmap-gsva":
        visible_rows_file_path = sys.argv[2]
        size_x = float(sys.argv[3])
        size_y = float(sys.argv[4])
        measurement_unit = sys.argv[5]
        
        converted_size_x = convert_to_inches(measurement_unit, size_x)
        converted_size_y = convert_to_inches(measurement_unit, size_y)
        
        if (converted_size_x > 50 or converted_size_y > 50):
            print("Plot sizes cannot exceed 50 inches.")
            exit(1)
            
        file = open(visible_rows_file_path, "r")
        visible_rows = file.read()
        file.close()
        
        data = pd.read_json(StringIO(visible_rows))
        
        # Pivot on ES
        data = data.pivot(index="Term", columns="Name", values="ES")

        fig, ax = plt.subplots(figsize=(converted_size_x, converted_size_y))
        sns.heatmap(data, cmap="YlGnBu", ax=ax, linewidths=0.5, linecolor='lightgrey')
        ax.set_title("GSVA ES Heatmap", fontsize=16)
        
        for ext in plot_extensions:
            fig.savefig(PLOT_FILE + ext, bbox_inches='tight')
            
    case _:
        print("The requested plot doesn't exist", file=sys.stderr)
        exit(1)


