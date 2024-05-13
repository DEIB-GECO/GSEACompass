const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    onJsonData: (callback) => ipcRenderer.on('send-json-data', (_event, jsonData, analysisType) => callback(jsonData, analysisType)),
    requestJsonData: () => ipcRenderer.send('request-json-data'),
    requestEnrichmentPlot: (selectedTerms) => ipcRenderer.send('request-enrichment-plot', selectedTerms),
    requestDotplot: (selectedColumn) => ipcRenderer.send('request-dotplot', selectedColumn),
    requestHeatmap: (selectedRow) => ipcRenderer.send('request-heatmap', selectedRow),
    requestWordCloud: (selectedColumn) => ipcRenderer.send('request-word-cloud', selectedColumn)
})
