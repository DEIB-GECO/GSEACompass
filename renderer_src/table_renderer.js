window.electronAPI.requestJsonData()

window.electronAPI.onJsonData((rawJsonData) => {
    jsonData = JSON.parse(rawJsonData)

    let table = new DataTable('#dataTable', {
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
        columnDefs: [{
            targets: 0,
            render: DataTable.render.ellipsis(17) 
        }],
        responsive: true,
        select: true,
        fixedHeader: true,
        colReorder: true,
        scrollX: true,
        layout: {
            bottomoStart: 'buttons'
        },
        buttons: [ 'copy', 'excel', 'pdf' ]
    });
})


