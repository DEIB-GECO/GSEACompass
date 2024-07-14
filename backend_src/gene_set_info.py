import sqlite3
import sys
import json

# Utility function to exit on error
def errorAndExit(errorString):
    print(errorString)
    exit(1)

# Utility function to get SQLite results entries as dictionaries
def row_to_dict(cursor: sqlite3.Cursor, row: sqlite3.Row) -> dict:
    data = {}
    for idx, col in enumerate(cursor.description):
        data[col[0]] = row[idx]
    return data

# Read term argument passed as script argument
term = sys.argv[1]

# Read MSigDB file path passed as script argument
msigdb_path = sys.argv[2]

# Queries
genes_query = """ 
    SELECT symbol 
        FROM gene_set a 
            LEFT JOIN gene_set_gene_symbol ab ON a.id=ab.gene_set_id
            LEFT JOIN gene_symbol b ON b.id=ab.gene_symbol_id
        WHERE standard_name=? """
details_query = """ 
    SELECT a.standard_name,
            b.description_brief,
            b.description_full,
            b.systematic_name,
            b.exact_source,
            b.external_details_URL,
            d.species_name,
            b.contributor,
            b.contrib_organization AS contributor_organization,
            c.title AS publication_title,
            c.PMID AS publication_PMID, 
            c.DOI AS publication_DOI, 
            c.URL AS publication_URL,
            b.GEO_id
        FROM gene_set a
            LEFT JOIN gene_set_details b ON a.id=b.gene_set_id
            LEFT JOIN publication c ON c.id=b.publication_id
            LEFT JOIN species d ON d.species_code=b.source_species_code
        WHERE standard_name=? """
authors_query = """
    SELECT d.display_name AS name
        FROM gene_set a
            LEFT JOIN gene_set_details b ON a.id=b.gene_set_id
            LEFT JOIN publication_author c ON c.publication_id=b.publication_id
            LEFT JOIN author d ON d.id=c.author_id
        WHERE standard_name=? 
        ORDER BY c.author_order ASC """

# Open SQLite database connection
try:
    con = sqlite3.connect(msigdb_path)
except:
    errorAndExit('The MSigDB file (msigdb.db) couldn\'t be opened.')
    
con.row_factory = row_to_dict
cur = con.cursor()

# Executes all queries
try:
    details = cur.execute(details_query, (term, )).fetchone()
    genes = []
    for row in cur.execute(genes_query, (term, )):
        genes.append(row["symbol"])
    authors = []
    for row in cur.execute(authors_query, (term, )):
        authors.append(row["name"])
        
    # Format result to print
    res = details
    res["genes"] = genes
    res["authors"] = authors
    res_json = json.dumps(res)
except:
    errorAndExit('The gene set wasn\'t found in the MSigDB or there was an error while retreiving it.')

# Print and flush the result on stdout
print(res_json)
sys.stdout.flush()
