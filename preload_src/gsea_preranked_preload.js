const { contextBridge, ipcRenderer } = require('electron/renderer')

contextBridge.exposeInMainWorld('electronAPI', {
    sendDataPreranked: (geneSetsPath, numPermutations, rankedListPath, remapOption, chipPath) =>
        ipcRenderer.send('send-data-preranked', geneSetsPath, numPermutations, rankedListPath, remapOption, chipPath),
    showHelperPopup: (helpString) => ipcRenderer.send('show-helper-popup', helpString)
})
