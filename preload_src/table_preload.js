const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    onJsonData: (callback) => ipcRenderer.on('send-json-data', (_event, jsonData) => callback(jsonData)),
    requestJsonData: () => ipcRenderer.send('request-json-data')
})
