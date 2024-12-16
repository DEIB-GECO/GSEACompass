const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    openGseaPreranked: () => 
        ipcRenderer.send('open-gsea-preranked'),
    openGsea: () => 
        ipcRenderer.send('open-gsea')
})
