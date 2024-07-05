const { contextBridge, ipcRenderer } = require('electron/renderer')

contextBridge.exposeInMainWorld('electronAPI', {
    openGseaPreranked: () => 
        ipcRenderer.send('open-gsea-preranked'),
    openGsea: () => 
        ipcRenderer.send('open-gsea')
})
