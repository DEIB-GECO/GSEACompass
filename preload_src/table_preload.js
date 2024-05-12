const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    onJsonData: (callback) => ipcRenderer.on('send-json-data', (_event, jsonData) => callback(jsonData)),
    requestJsonData: () => ipcRenderer.send('request-json-data'),
    requestEnrichmentPlot: (selectedTerms) => ipcRenderer.send('request-enrichment-plot', selectedTerms),
    requestDotplot: (selectedColumn) => ipcRenderer.send('request-dotplot', selectedColumn),
    requestWordCloud: (selectedTerms) => ipcRenderer.send('request-word-cloud', selectedTerms)
})
