const { contextBridge, ipcRenderer, webUtils } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    sendDataPreranked: (geneSetsPath, numPermutations, rankedListPath, remapOption, chipPath) =>
        ipcRenderer.send('send-data-preranked', webUtils.getPathForFile(geneSetsPath), numPermutations, webUtils.getPathForFile(rankedListPath), remapOption, chipPath != null ? webUtils.getPathForFile(chipPath) : null),
    showHelperPopup: (helpString) => 
        ipcRenderer.send('show-helper-popup', helpString)
})
