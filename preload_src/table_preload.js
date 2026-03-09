const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {

    goBackToHome: () => 
        ipcRenderer.send('go-back-to-home'),

    onReceviedData: (callback) => 
        ipcRenderer.on('send-analysis-data', (_event, jsonData, analysisType) => callback(jsonData, analysisType)),

    requestEnrichmentPlot: (selectedTerms) => 
        ipcRenderer.send('request-enrichment-plot', selectedTerms, 4, 5, 'in', 'create'),

    requestSimilarityGraph: (selectedTerms) =>
        ipcRenderer.send('request-similarity-graph', selectedTerms, 4, 5, 'in', 'create'),

    requestSimilarityHeatmap: (selectedTerms) =>
        ipcRenderer.send('request-similarity-heatmap', selectedTerms, 4, 5, 'in', 'create'),

    requestDotplot: (selectedColumnAndTerms) => 
        ipcRenderer.send('request-dotplot', selectedColumnAndTerms, 4, 7, 'in', 'create'),

    requestHeatmap: (selectedRow) => 
        ipcRenderer.send('request-heatmap', selectedRow, 14, 4, 'in', 'create'),

    requestIOUPlot: (selectedTerms) => 
        ipcRenderer.send('request-iou-plot', selectedTerms, 7, 7, 'in', 'create'),

    requestWordCloud: (selectedColumn) => 
        ipcRenderer.send('request-wordcloud', selectedColumn, 800, 500, 'px', 'create'),

    requestGeneSetInfo: (selectedTerm) => 
        ipcRenderer.send('request-gene-set-info', selectedTerm),

    requestHeatmapSSGSEA: (visibleRows) =>
        ipcRenderer.send('request-heatmap-ssgsea', visibleRows, 14, 4, 'in', 'create'),

    requestHeatmapGSVA: (visibleRows) =>
        ipcRenderer.send('request-heatmap-gsva', visibleRows, 14, 4, 'in', 'create'),

    onPlotCreationComplete: (callback) => 
        ipcRenderer.on('plot-creation-complete', () => callback())
})
