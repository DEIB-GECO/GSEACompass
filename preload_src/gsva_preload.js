const { contextBridge, ipcRenderer, webUtils } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    sendDataGsva: (geneSetsPath, datasetPath, minGeneSet, maxGeneSet) =>
        ipcRenderer.send('send-data-gsva', webUtils.getPathForFile(geneSetsPath), webUtils.getPathForFile(datasetPath), minGeneSet, maxGeneSet),

    goBackToHome: () => ipcRenderer.send('go-back-to-home'),
    
    showHelperPopup: (helpString) => ipcRenderer.send('show-helper-popup', helpString)
})