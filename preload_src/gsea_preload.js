const { contextBridge, ipcRenderer } = require('electron/renderer')

contextBridge.exposeInMainWorld('electronAPI', {
    sendDataGsea: (geneSetsPath, numPermutations, expressionSetPath, phenotypeLabels, remapOption, chipPath) =>
        ipcRenderer.send('send-data-gsea', geneSetsPath, numPermutations, expressionSetPath, phenotypeLabels, remapOption, chipPath),
    showHelperPopup: (helpString) => ipcRenderer.send('show-helper-popup', helpString)
})
