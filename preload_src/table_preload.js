const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    onReceviedData: (callback) => ipcRenderer.on('send-analysis-data', (_event, jsonData, analysisType) => callback(jsonData, analysisType)),
    requestEnrichmentPlot: (selectedTerms) => ipcRenderer.send('request-enrichment-plot', selectedTerms),
    requestDotplot: (selectedColumn) => ipcRenderer.send('request-dotplot', selectedColumn),
    requestHeatmap: (selectedRow) => ipcRenderer.send('request-heatmap', selectedRow),
    requestIOUPlot: (selectedGenesets) => ipcRenderer.send('request-iou-plot', selectedGenesets),
    requestWordCloud: (selectedColumn) => ipcRenderer.send('request-word-cloud', selectedColumn),
    requestGeneSetInfo: (selectedTerm) => ipcRenderer.send('request-gene-set-info', selectedTerm)
})
