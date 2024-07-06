const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    onReceviedData: (callback) => 
        ipcRenderer.on('send-plot-data', (_event, plotType, plotArgs, plotPath) => callback(plotType, plotArgs, plotPath)),
    onPlotUpdated: (callback) => 
        ipcRenderer.on('plot-updated', (_event) => callback()),
    changePlotSize: (plotType, plotArgs, sizeX, sizeY) => {
        if (plotType == 'dotplot')
            ipcRenderer.send('request-' + plotType, plotArgs[0], plotArgs[1], sizeX, sizeY, 'update')
        else 
            ipcRenderer.send('request-' + plotType, plotArgs[0], sizeX, sizeY, 'update')
    }
})