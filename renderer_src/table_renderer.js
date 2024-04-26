window.electronAPI.requestJsonData()

let table = ''

window.electronAPI.onJsonData((rawJsonData) => {
    jsonData = JSON.parse(rawJsonData)

    table = new DataTable('#dataTable', {
        data: jsonData,
        columns: [
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
                // Enable ellipsis truncation on first and last column (term and lead_genes)
                targets: [0, 8], 
                render: DataTable.render.ellipsis(30) 
            }
        ],
        // responsive: true,
        select: {
            style: 'os'
        },
        fixedHeader: true,
        colReorder: true,
        layout: {
            topStart: {
                buttons: [
                    {
                        text: 'Generate plot',
                        action: () => {
                            // Fetch the selected rows
                            let selectedRows = table.rows({selected: true}).data()
                            let numSelectedRows = selectedRows.length

                            // Put each selected rows Term field in an array
                            let selectedTerms = []
                            for (let i = 0; i < numSelectedRows; i++)
                                selectedTerms[i]= selectedRows[i].Term

                            // Send the selected terms in JSON format
                            window.electronAPI.requestPlot(JSON.stringify(selectedTerms))
                        }
                    }
                ]
            },
            bottomoStart: 'buttons'
        }
    })
})


