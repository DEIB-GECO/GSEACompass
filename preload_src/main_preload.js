const { contextBridge, ipcRenderer } = require('electron/renderer')

contextBridge.exposeInMainWorld('electronAPI', {
    sendDataPreranked: (geneSetsPath, rankedListPath, chipPath) => ipcRenderer.send('send-data-preranked', geneSetsPath, rankedListPath, chipPath)
})
