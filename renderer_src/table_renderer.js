const backBtn = document.querySelector('#back')
const loadingOverlay = document.getElementById('loading-overlay')

// Functions to show the loading overlay when generating plots
const showLoading = () => {
    if (loadingOverlay) 
        loadingOverlay.style.display = 'flex'
}

// Function to hide the loading overlay when plot creation is complete
const hideLoading = () => {
    if (loadingOverlay) 
        loadingOverlay.style.display = 'none'
}

// Listen for the plot creation completion event from the main process to hide the loading overlay
window.electronAPI.onPlotCreationComplete(() => {
    hideLoading()
})

// Go back to home page when back button is clicked
backBtn.addEventListener('click', () => {
    window.electronAPI.goBackToHome()
})

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
        return idx != 0
}

let table = ''
const tableTitle = document.querySelector('#table-title')

// Listen for the event of receiving the data from the main process
// Sent after an analysis has been performed and the table page is opened
window.electronAPI.onReceviedData((rawJsonData, analysisType) => {
    jsonData = JSON.parse(rawJsonData)

    // Table columns
    let columnsList = null

    // Buttons to generate plots
    let plotButtons = null

    // Columns on which ellipsis truncation should be applied
    let ellipsisColumnsIdx = null

    // Set variables according to the type of analysis performed
    switch (analysisType) {
        case 'gsea':
            tableTitle.innerText = 'GSEA results'

            columnsList = [
                { data: 'Select', title: '' },
                { data: 'Term', title: 'Term' },
                { data: 'ES', title: 'ES' },
                { data: 'NES', title: 'NES' },
                { data: 'NOM p-val', title: 'NOM p-val' },
                { data: 'FDR q-val', title: 'FDR q-val' },
                { data: 'FWER p-val', title: 'FWER p-val' },
                { data: 'Gene %', title: 'Gene %' },
                { data: 'Tag %', title: 'Tag %' },
                { data: 'Lead_genes', title: 'Lead_genes' }
            ]

            plotButtons = [
                { 
                    text: 'Enrichment plot',
                    name: 'enrichmentPlot',
                    enabled: false,
                    action: () => {
                        showLoading()

                        // Fetch the selected rows
                        const selectedRows = table.rows({ selected: true }).data()
                        const numSelectedRows = selectedRows.length

                        // Put each selected rows Term field in an array
                        const selectedTerms = []
                        for (let i = 0; i < numSelectedRows; i++)
                            selectedTerms[i] = selectedRows[i].Term

                        // Send the selected terms in JSON format
                        window.electronAPI.requestEnrichmentPlot(JSON.stringify(selectedTerms))
                    }
                },
                {
                    text: 'Similarity graph',
                    name: 'similarityGraph',
                    enabled: false,
                    action: () => {
                        showLoading()

                        // Fetch the selected rows
                        const selectedRows = table.rows({ selected: true }).data()

                        // Fetch the visible rows
                        const visibleRows = table.rows({ search: 'applied' }).data()

                        let rows = selectedRows.length === 0 ? visibleRows : selectedRows
                        
                        // Create an array of objects to hold the biological context
                        let graphData = []
                        for (let i = 0; i < rows.length; i++) {
                            graphData.push({
                                Term: rows[i].Term,
                                Score: parseFloat(rows[i].NES || 0),
                                FDR: parseFloat(rows[i]['FDR q-val'])
                            })
                        }

                        // Send the data as a JSON string (passing 0.75 cleanly as the threshold)
                        window.electronAPI.requestSimilarityGraph(JSON.stringify(graphData))
                    }
                },
                {
                    text: 'Similarity heatmap',
                    name: 'similarityHeatmap',
                    enabled: false,
                    action: () => {
                        showLoading()

                        // Fetch the selected column
                        const selectedColumn = table.columns({ selected: true }).titles()[0]

                        // Fetch the selected rows
                        const selectedRows = table.rows({ selected: true }).data()

                        // Fetch the visible rows
                        const visibleRows = table.rows({ search: 'applied' }).data()

                        let rows = ''
                        let selectedTerms = []

                        if (selectedRows.length == 0)
                            rows = visibleRows
                        else
                            rows = selectedRows

                        for (let i = 0; i < rows.length; i++)
                            selectedTerms[i] = rows[i][selectedColumn]

                        // Send the selected terms in JSON format
                        window.electronAPI.requestSimilarityHeatmap(JSON.stringify(selectedTerms))
                    }
                },
                {
                    text: 'Dotplot',
                    name: 'dotplot',
                    enabled: false,
                    action: () => {
                        showLoading()

                        // Fetch the selected column title (e.g. FDR q-val)
                        const selectedColumn = table.columns({ selected: true }).titles()[0]

                        // Fetch the selected rows
                        const selectedRows = table.rows({ selected: true }).data()

                        // Fetch the visible rows
                        const visibleRows = table.rows({ search: 'applied' }).data()

                        let rows = ''
                        const selectedTerms = []

                        if (selectedRows.length == 0)
                            rows = visibleRows
                        else
                            rows = selectedRows

                        // Put each chosen row term in an array
                        for (let i = 0; i < rows.length; i++)
                            selectedTerms[i] = rows[i].Term

                        // Send the selected column title and selecter/visible rows terms in JSON format
                        window.electronAPI.requestDotplot(JSON.stringify([selectedColumn, selectedTerms]))
                    }
                },
                {
                    text: 'Heatmap',
                    name: 'heatmap',
                    enabled: false,
                    action: () => {
                        showLoading()

                        // Fetch the selected row
                        const selectedRow = table.rows({ selected: true }).data()[0]

                        // Send the selected row in JSON format
                        window.electronAPI.requestHeatmap(JSON.stringify(selectedRow))
                    }
                },
                {
                    text: 'Intersection over union',
                    name: 'iouPlot',
                    enabled: false,
                    action: () => {
                        showLoading()

                        // Fetch the selected rows
                        const selectedRows = table.rows({ selected: true }).data()
                        const numSelectedRows = selectedRows.length

                        // Put each selected rows Term and Lead_genes fields in an array of dictionaries
                        const selectedTerms = []
                        for (let i = 0; i < numSelectedRows; i++)
                            selectedTerms[i] = selectedRows[i].Term

                        window.electronAPI.requestIOUPlot(JSON.stringify(selectedTerms))
                    }
                },
                {
                    text: 'Wordcloud',
                    name: 'wordcloud',
                    enabled: false,
                    action: () => {
                        showLoading()

                        // Fetch the selected column title (e.g FDR q-val)
                        const selectedColumnHeader = table.columns({ selected: true }).titles()[0]

                        // Fetch the selected rows
                        const selectedRows = table.rows({ selected: true }).data()

                        // Fetch the visible rows
                        const visibleRows = table.rows({ search: 'applied' }).data()

                        let rows = ''
                        const selectedStrings = []

                        if (selectedRows.length === 0)
                            rows = visibleRows
                        else
                            rows = selectedRows

                        // Put each chosen row field (that of the selected column) in an array
                        for (let i = 0; i < rows.length; i++)
                            selectedStrings[i] = rows[i][selectedColumnHeader]

                        window.electronAPI.requestWordCloud(JSON.stringify(selectedStrings))
                    }
                }
            ]

            ellipsisColumnsIdx = [1, 9]
            break
        case 'gsea_preranked':
            tableTitle.innerText = 'GSEA preranked results'

            columnsList = [
                { data: 'Select', title: '' },
                { data: 'Term', title: 'Term' },
                { data: 'ES', title: 'ES' },
                { data: 'NES', title: 'NES' },
                { data: 'NOM p-val', title: 'NOM p-val' },
                { data: 'FDR q-val', title: 'FDR q-val' },
                { data: 'FWER p-val', title: 'FWER p-val' },
                { data: 'Gene %', title: 'Gene %' },
                { data: 'Tag %', title: 'Tag %' },
                { data: 'Lead_genes', title: 'Lead_genes' }
            ]

            plotButtons = [
                { 
                    text: 'Enrichment plot',
                    name: 'enrichmentPlot',
                    enabled: false,
                    action: () => {
                        showLoading()

                        // Fetch the selected rows
                        const selectedRows = table.rows({ selected: true }).data()
                        const numSelectedRows = selectedRows.length

                        // Put each selected rows Term field in an array
                        const selectedTerms = []
                        for (let i = 0; i < numSelectedRows; i++)
                            selectedTerms[i] = selectedRows[i].Term

                        // Send the selected terms in JSON format
                        window.electronAPI.requestEnrichmentPlot(JSON.stringify(selectedTerms))
                    }
                },
                {
                    text: 'Similarity graph',
                    name: 'similarityGraph',
                    enabled: false,
                    action: () => {
                        showLoading()

                        // Fetch the selected rows
                        const selectedRows = table.rows({ selected: true }).data()

                        // Fetch the visible rows
                        const visibleRows = table.rows({ search: 'applied' }).data()

                        let rows = selectedRows.length === 0 ? visibleRows : selectedRows
                        
                        // Create an array of objects to hold the biological context
                        let graphData = []
                        for (let i = 0; i < rows.length; i++) {
                            graphData.push({
                                Term: rows[i].Term,
                                Score: parseFloat(rows[i].NES || 0),
                                FDR: parseFloat(rows[i]['FDR q-val'])
                            })
                        }

                        // Send the data as a JSON string (passing 0.75 cleanly as the threshold)
                        window.electronAPI.requestSimilarityGraph(JSON.stringify(graphData))
                    }
                },
                {
                    text: 'Similarity heatmap',
                    name: 'similarityHeatmap',
                    enabled: false,
                    action: () => {
                        showLoading()

                        // Fetch the selected rows
                        const selectedRows = table.rows({ selected: true }).data()

                        // Fetch the visible rows
                        const visibleRows = table.rows({ search: 'applied' }).data()

                        let rows = selectedRows.length === 0 ? visibleRows : selectedRows
                        
                        // Create an array of objects to hold the biological context
                        let heatmapData = []
                        for (let i = 0; i < rows.length; i++) {
                            heatmapData.push({
                                Term: rows[i].Term,
                                Score: parseFloat(rows[i].NES || 0),
                                FDR: parseFloat(rows[i]['FDR q-val'])
                            })
                        }

                        // Send the selected terms in JSON format
                        window.electronAPI.requestSimilarityHeatmap(JSON.stringify(heatmapData))
                    }
                },
                {
                    text: 'Dotplot',
                    name: 'dotplot',
                    enabled: false,
                    action: () => {
                        showLoading()

                        // Fetch the selected column title (e.g. FDR q-val)
                        const selectedColumn = table.columns({ selected: true }).titles()[0]

                        // Fetch the selected rows
                        const selectedRows = table.rows({ selected: true }).data()

                        // Fetch the visible rows
                        const visibleRows = table.rows({ search: 'applied' }).data()

                        let rows = ''
                        const selectedTerms = []

                        if (selectedRows.length == 0)
                            rows = visibleRows
                        else
                            rows = selectedRows

                        // Put each chosen row term in an array
                        for (let i = 0; i < rows.length; i++)
                            selectedTerms[i] = rows[i].Term

                        // Send the selected column title and selecter/visible rows terms in JSON format
                        window.electronAPI.requestDotplot(JSON.stringify([selectedColumn, selectedTerms]))
                    }
                },
                {
                    text: 'Intersection over union',
                    name: 'iouPlot',
                    enabled: false,
                    action: () => {
                        showLoading()

                        // Fetch the selected rows
                        const selectedRows = table.rows({ selected: true }).data()
                        const numSelectedRows = selectedRows.length

                        // Put each selected rows Term and Lead_genes fields in an array of dictionaries
                        const selectedTerms = []
                        for (let i = 0; i < numSelectedRows; i++)
                            selectedTerms[i] = selectedRows[i].Term

                        window.electronAPI.requestIOUPlot(JSON.stringify(selectedTerms))
                    }
                },
                {
                    text: 'Wordcloud',
                    name: 'wordcloud',
                    enabled: false,
                    action: () => {
                        showLoading()

                        // Fetch the selected column title (e.g FDR q-val)
                        const selectedColumnHeader = table.columns({ selected: true }).titles()[0]

                        // Fetch the selected rows
                        const selectedRows = table.rows({ selected: true }).data()

                        // Fetch the visible rows
                        const visibleRows = table.rows({ search: 'applied' }).data()

                        let rows = ''
                        const selectedStrings = []

                        if (selectedRows.length === 0)
                            rows = visibleRows
                        else
                            rows = selectedRows

                        // Put each chosen row field (that of the selected column) in an array
                        for (let i = 0; i < rows.length; i++)
                            selectedStrings[i] = rows[i][selectedColumnHeader]

                        window.electronAPI.requestWordCloud(JSON.stringify(selectedStrings))
                    }
                }
            ]

            ellipsisColumnsIdx = [1, 9]
            break
        case 'ssgsea':
            tableTitle.innerText = 'ssGSEA results'

            columnsList = [
                { data: 'Select', title: '' },
                { data: 'Name', title: 'Name' },
                { data: 'Term', title: 'Term' },
                { data: 'ES', title: 'ES' },
                { data: 'NES', title: 'NES' },
            ]

            plotButtons = [
                {
                    text: 'Heatmap',
                    name: 'heatmapSSGSEA',
                    enabled: true,
                    action: () => {
                        showLoading()

                        // Fetch the visible rows
                        const visibleRows = table.rows({ search: 'applied' }).data()

                        let rows = ''

                        if (visibleRows.length == 0)
                            rows = table.rows().data()
                        else
                            rows = visibleRows

                        selectedRows = []
                        for (let i = 0; i < rows.length; i++)
                            selectedRows[i] = { Name: rows[i].Name, Term: rows[i].Term, ES: rows[i].ES, NES: rows[i].NES }

                        // Send the visible rows in JSON format
                        window.electronAPI.requestHeatmapSSGSEA(JSON.stringify(selectedRows))
                    }
                }
            ]

            ellipsisColumnsIdx = [1, 2]
            break
        case 'gsva':
            tableTitle.innerText = 'GSVA results'

            columnsList = [
                { data: 'Select', title: '' },
                { data: 'Name', title: 'Name' },
                { data: 'Term', title: 'Term' },
                { data: 'ES', title: 'ES' } // Removed NES
            ]

            plotButtons = [
                {
                    text: 'Heatmap',
                    name: 'heatmapGSVA',
                    enabled: true,
                    action: () => {
                        showLoading()

                        const visibleRows = table.rows({ search: 'applied' }).data()
                        let rows = visibleRows.length == 0 ? table.rows().data() : visibleRows

                        selectedRows = []
                        for (let i = 0; i < rows.length; i++)
                            // Extract only Name, Term, and ES
                            selectedRows[i] = { Name: rows[i].Name, Term: rows[i].Term, ES: rows[i].ES } 

                        // Send to a new GSVA-specific heatmap IPC route
                        window.electronAPI.requestHeatmapGSVA(JSON.stringify(selectedRows))
                    }
                }
            ]

            ellipsisColumnsIdx = [1, 2]
            break
    }

    // Initialise the table
    table = new DataTable('#dataTable', {
        data: jsonData,
        columns: columnsList,
        columnDefs: [
            {
                // Enable ellipsis truncation on first and last data columns (term and lead_genes)
                targets: ellipsisColumnsIdx,
                render: DataTable.render.ellipsis(25)
            },
            {
                // Enable checkbox for rows selection on first column (empty one at index 0)
                targets: 0,
                render: DataTable.render.select()
            }
        ],
        search: {
            // Enable regex search functionality, but disable the smart one
            regex: true,
            smart: false
        },
        select: {
            style: 'multi',
            selector: 'td:first-child, th',
            headerCheckbox: false
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
                // Drop down menu of buttons to generate plots
                buttons: [
                    {
                        extend: 'collection',
                        text: 'Generate plot',
                        buttons: plotButtons
                    },
                    {
                        text: 'Deselect all',
                        name: 'deselectAll',
                        enabled: false,
                        action: () => {
                            table.columns({ selected: true }).deselect()
                            table.rows({ selected: true }).deselect()
                        }
                    }
                ]
            },
            bottomStart: {
                buttons: [
                    {
                        extend: 'collection',
                        text: 'Export',
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
        const numSelectedRows = table.rows({ selected: true }).count()
        const selectedColumns = table.columns({ selected: true })
        const numSelectedCols = selectedColumns.count()

        // Show or hide each top bar button if a specific condition is true
        table.button(['deselectAll:name']).enable(numSelectedRows > 0 || numSelectedCols > 0)

        // Only update these buttons if they were actually rendered
        if (analysisType === 'ssgsea') {
            table.button(['heatmapSSGSEA:name']).enable(
                numSelectedCols === 0 && numSelectedRows === 0)
        }
        else if (analysisType === 'gsva') {
            table.button(['heatmapGSVA:name']).enable(
                numSelectedCols === 0 && numSelectedRows === 0)
        }
        else {
            table.button(['enrichmentPlot:name']).enable(
                numSelectedRows > 0 && numSelectedCols > 0)
            table.button(['similarityGraph:name']).enable(
                numSelectedCols === 0 && numSelectedRows > 0)
            table.button(['similarityHeatmap:name']).enable(
                numSelectedCols === 0 && numSelectedRows > 0)
            table.button(['dotplot:name']).enable(
                numSelectedCols === 1 && selectedColumns.titles()[0] !== "Term" && selectedColumns.titles()[0] !== "Lead_genes" && 
                selectedColumns.titles()[0] !== "Gene %" && selectedColumns.titles()[0] !== "Tag %")
            table.button(['heatmap:name']).enable(
                numSelectedRows === 1 && analysisType === 'gsea')
            table.button(['iouPlot:name']).enable(
                numSelectedRows >= 2 && numSelectedCols === 0)
            table.button(['wordcloud:name']).enable(
                numSelectedCols === 1 && (selectedColumns.titles()[0] === "Term" || selectedColumns.titles()[0] === "Lead_genes"))
        }
    })

    // Every time a row is double clicked
    table.on('dblclick', 'tr', (event) => {
        const dblClickedTr = event.target.closest('tr')

        // If its a data row (parent is tbody and not thead)
        // to prevent this behavior from happening when the column selection row is double clicked
        if (dblClickedTr.parentElement.tagName == 'TBODY') {
            const dblClickedTerm = table.row(dblClickedTr).data().Term
            window.electronAPI.requestGeneSetInfo(dblClickedTerm)
        }
    })

    const maxFDRObj = document.querySelector('#maxFDR')
    const maxNOMObj = document.querySelector('#maxNOM')

    // Hide the FDR q-val and NOM p-val filter (first div containing them) if it's ssGEA or GSVA
    // since these two analyses don't have these values
    if (analysisType === 'ssgsea' || analysisType === 'gsva') {
        const filterDiv = maxFDRObj.parentElement.parentElement.parentElement.parentElement
        filterDiv.style.display = 'none'
    }

    // Custom filtering function for FDR q-val and NOM p-val
    table.search.fixed('range', (_searchStr, data, _index) => {
        const maxFDR = parseFloat(maxFDRObj.value)
        const maxNOM = parseFloat(maxNOMObj.value)
        const FDR = parseFloat(data['FDR q-val'])
        const NOM = parseFloat(data['NOM p-val'])

        return (isNaN(maxFDR) && isNaN(maxNOM)) ||
            (isNaN(maxFDR) && NOM <= maxNOM) ||
            (isNaN(maxNOM) && FDR <= maxFDR) ||
            (NOM <= maxNOM && FDR <= maxFDR)
    })

    // Changes to the inputs of FDR q-val or NOM p-val filter fields will trigger a redraw of the table
    maxFDRObj.addEventListener('input', () => {
        table.draw()
    })
    maxNOMObj.addEventListener('input', () => {
        table.draw()
    })

    // Add new column selection row in table head
    const selectorHeader = document.createElement('tr')
    document.querySelector('thead').appendChild(selectorHeader)

    // For each column
    for (let i = 0; i < table.columns().count(); i++) {
        // Add a new cell for each column to the column selection row
        const selector = document.createElement('td')
        selector.style = 'text-align:center;'
        selectorHeader.appendChild(selector)

        // If it's not the first (not the row selection column)
        if (i != 0) {
            // Add a checkbox to the cell
            selector.innerHTML = '<input aria-label="Select column" class="dt-select-checkbox" id="select-column" type="checkbox">'
            const checkbox = selector.firstChild

            // Select/deselect the corresponding column when checkbox clicked
            checkbox.addEventListener('change', (event) => {
                if (checkbox.checked == true) 
                    table.column(i).select()
                else
                    table.column(i).deselect()
            })

            // If hide/show a column, hide/show corresponding checkbox
            table.on('column-visibility.dt', function (_event, _settings, columnIdx, isVisible) {
                if (columnIdx == i)
                    selector.hidden = !isVisible
            })

            // If deselect a column, uncheck the corresponding checkbox
            table.on('deselect', (_event, _dt, type, index) => {
                if (type == 'column' && index.includes(i))
                    checkbox.checked = false
            })
        }
    }
})


