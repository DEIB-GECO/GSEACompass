const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    onReceivedData: (callback) => 
        ipcRenderer.on('send-gene-set-data', (_event, jsonData) => callback(jsonData))
})