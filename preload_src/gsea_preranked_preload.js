const { contextBridge, ipcRenderer } = require('electron/renderer')

contextBridge.exposeInMainWorld('electronAPI', {
    sendDataPreranked: (geneSetsPath, numPermutations, rankedListPath, collapseRemapOption, chipPath) =>
        ipcRenderer.send('send-data-preranked', geneSetsPath, numPermutations, rankedListPath, collapseRemapOption, chipPath)
})
