const { contextBridge, ipcRenderer, webUtils } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    sendMsigdb: (msigdbPath) =>
        ipcRenderer.send('send-msigdb', webUtils.getPathForFile(msigdbPath))
})