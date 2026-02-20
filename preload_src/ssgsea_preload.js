const { contextBridge, ipcRenderer, webUtils } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    sendDataSsgsea: (geneSetsPath, datasetPath, minGeneSet, maxGeneSet) =>
        ipcRenderer.send('send-data-ssgsea', webUtils.getPathForFile(geneSetsPath), webUtils.getPathForFile(datasetPath), minGeneSet, maxGeneSet),

    goBackToHome: () =>
        ipcRenderer.send('go-back-to-home'),

    showHelperPopup: (helpString) =>
        ipcRenderer.send('show-helper-popup', helpString)
})
