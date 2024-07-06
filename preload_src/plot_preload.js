const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    onReceviedData: (callback) => 
        ipcRenderer.on('send-plot-data', (_event, plotType, plotArg, plotPath) => callback(plotType, plotArg, plotPath)),
    onPlotUpdated: (callback) => 
        ipcRenderer.on('plot-updated', (_event) => callback()),
    changePlotSize: (plotType, plotArg, sizeX, sizeY) => {
        ipcRenderer.send('request-' + plotType, plotArg, sizeX, sizeY, 'update')
    }
})