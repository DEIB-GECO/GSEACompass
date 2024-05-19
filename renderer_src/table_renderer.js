// Function applied to each column to verify whether it should be exported or not
// Returns true if the current column should be exported, otherwise false
let exportColSelector = (idx, _data, _node) => {
    // If one or more columns have been selected
    if (table.columns({ selected: true }).header().length > 0)
        // Return true (export) iff the current considered column is selected AND it's not the first one (checkbox)
        return table.column(idx).selected() && idx != 0
    // If no column has been selected
    else
        // Return true (export) for all columns except the first one (checkbox)
        return idx != 0;
}

let table = ''
const tableTitle = document.querySelector('#table-title')

window.electronAPI.onReceviedData((rawJsonData, analysisType) => {
    jsonData = JSON.parse(rawJsonData)

    // Set title above the table
    if (analysisType === 'gsea')
        tableTitle.innerText = 'GSEA results'
    else if (analysisType === 'gsea_preranked')
        tableTitle.innerText = 'GSEA preranked results'

    // Initialise the table
    table = new DataTable('#dataTable', {
        data: jsonData,
        columns: [
            { data: null, defaultContent: '' },
            { data: 'Term', title: 'Term' },
            { data: 'ES', title: 'ES' },
            { data: 'NES', title: 'NES' },
            { data: 'NOM p-val', title: 'NOM p-val' },
            { data: 'FDR q-val', title: 'FDR q-val' },
            { data: 'FWER p-val', title: 'FWER p-val' },
            { data: 'Gene %', title: 'Gene %' },
            { data: 'Tag %', title: 'Tag %' },
            { data: 'Lead_genes', title: 'Lead_genes' }
        ],
        columnDefs: [
            {
                // Enable ellipsis truncation on first and last data columns (term and lead_genes)
                targets: [1, 9],
                render: DataTable.render.ellipsis(25)
            },
            {
                // Enable checkbox for rows selection on first column (empty one at index 0)
                targets: 0,
                render: DataTable.render.select()
            }
        ],
        select: {
            style: 'multi',
            selector: 'td, th'
        },
        fixedHeader: true,
        colReorder: true,
        layout: {
            top2Start: {
                pageLength: {
                    menu: [10, 25, 50, 100, 300]
                }
            },
            topStart: {
                // Drop down button to generate plots
                buttons: [
                    {
                        extend: 'collection',
                        text: 'Generate plot',
                        buttons: [
                            {   // First button
                                text: 'Enrichment plot',
                                name: 'enrichmentPlot',
                                enabled: false,
                                action: () => {
                                    // Fetch the selected rows
                                    let selectedRows = table.rows({ selected: true }).data()
                                    let numSelectedRows = selectedRows.length

                                    // Put each selected rows Term field in an array
                                    let selectedTerms = []
                                    for (let i = 0; i < numSelectedRows; i++)
                                        selectedTerms[i] = selectedRows[i].Term

                                    // Send the selected terms in JSON format
                                    window.electronAPI.requestEnrichmentPlot(JSON.stringify(selectedTerms))
                                }
                            },
                            {
                                text: 'Dotplot',
                                name: 'dotplot',
                                enabled: false,
                                action: () => {
                                    // Fetch the selected column title (e.g FDR q-val)
                                    let selectedColumn = table.columns({ selected: true }).titles()[0]

                                    // Send the selected column title in JSON format
                                    window.electronAPI.requestDotplot(selectedColumn)
                                }
                            },
                            {
                                text: 'Heatmap',
                                name: 'heatmap',
                                enabled: false,
                                action: () => {
                                    // Fetch the selected row
                                    let selectedRow = table.rows({ selected: true }).data()[0]

                                    // Send the selected row in JSON format
                                    window.electronAPI.requestHeatmap(JSON.stringify(selectedRow))
                                }
                            },
                            {
                                text: 'Intersection over union',
                                name: 'iouPlot',
                                enabled: false,
                                action: () => {
                                    // Fetch the selected rows
                                    let selectedRows = table.rows({ selected: true }).data()
                                    let numSelectedRows = selectedRows.length

                                    // Put each selected rows Term and Lead_genes fields in an array of dictionaries
                                    let selectedGenesets = []
                                    for (let i = 0; i < numSelectedRows; i++)
                                        selectedGenesets[i] = {
                                            'term': selectedRows[i].Term, 
                                            'lead_genes': selectedRows[i].Lead_genes.split(';') }

                                    window.electronAPI.requestIOUPlot(JSON.stringify(selectedGenesets))
                                }
                            },
                            {
                                text: 'Wordcloud',
                                name: 'wordcloud',
                                enabled: false,
                                action: () => {
                                    // Fetch the selected column data
                                    let selectedColumn = table.columns({ selected: true }).data().toArray().toString()

                                    window.electronAPI.requestWordCloud(JSON.stringify(selectedColumn))
                                }
                            }
                        ]
                    },
                    {
                        extend: 'collection',
                        text: 'Selection options',
                        buttons: ['selectAll', 'selectNone', 'selectRows', 'selectColumns']
                    }
                ]
            },
            bottomStart: {
                buttons: [
                    {
                        extend: 'collection',
                        text: 'Export',
                        enabled: false,
                        name: 'export',
                        buttons: [
                            {
                                extend: 'copy',
                                exportOptions: {
                                    columns: exportColSelector,
                                    orthogonal: 'export'
                                }
                            },
                            {
                                extend: 'csv',
                                exportOptions: {
                                    columns: exportColSelector,
                                    orthogonal: 'export'
                                }
                            },
                            {
                                extend: 'excel',
                                exportOptions: {
                                    columns: exportColSelector,
                                    orthogonal: 'export'
                                }
                            }
                        ]
                    },
                    'colvis'
                ]
            }
        }
    })

    // Every time a rows/column has been selected or deselected
    table.on('select deselect', () => {
        let selectedRows = table.rows({ selected: true }).count()
        let selectedColumns = table.columns({ selected: true }).count()

        table.button(['export:name']).enable(selectedRows > 0 || selectedColumns > 0)
        table.button(['enrichmentPlot:name']).enable(selectedRows > 0 && selectedColumns === 0)
        table.button(['dotplot:name']).enable(selectedRows === 0 && selectedColumns === 1)
        table.button(['heatmap:name']).enable(selectedRows === 1 && analysisType === 'gsea')
        table.button(['iouPlot:name']).enable(selectedRows >= 2 && selectedColumns === 0)
        table.button(['wordcloud:name']).enable(selectedColumns === 1)
    })

    // Every time a row is double clicked on
    table.on('dblclick', 'tr', (event) => {
        let dblClickedTr = event.target.closest('tr')
        let dblClickedTerm = table.row(dblClickedTr).data().Term

        window.electronAPI.requestGeneSetInfo(dblClickedTerm)
    })
})


