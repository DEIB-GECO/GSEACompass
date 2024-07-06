const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    onReceviedData: (callback) => 
        ipcRenderer.on('send-analysis-data', (_event, jsonData, analysisType) => callback(jsonData, analysisType)),
    requestEnrichmentPlot: (selectedTerms) => 
        ipcRenderer.send('request-enrichment-plot', selectedTerms, 4, 5, 'create'),
    requestDotplot: (selectedColumn, selectedTerms) => 
        ipcRenderer.send('request-dotplot', selectedColumn, selectedTerms, 4, 7, 'create'),
    requestHeatmap: (selectedRow) => 
        ipcRenderer.send('request-heatmap', selectedRow, 14, 4, 'create'),
    requestIOUPlot: (selectedGenesets) => 
        ipcRenderer.send('request-iou-plot', selectedGenesets, 7, 7, 'create'),
    requestWordCloud: (selectedColumn) => 
        ipcRenderer.send('request-wordcloud', selectedColumn, 800, 500, 'create'),
    requestGeneSetInfo: (selectedTerm) => 
        ipcRenderer.send('request-gene-set-info', selectedTerm)
})
