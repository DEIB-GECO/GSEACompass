const { contextBridge, ipcRenderer, webUtils } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    sendDataPreranked: (geneSetsPath, numPermutations, minGeneSet, maxGeneSet, rankedListPath, remapOption, chipPath) =>
        ipcRenderer.send('send-data-preranked', webUtils.getPathForFile(geneSetsPath), numPermutations, minGeneSet, maxGeneSet, webUtils.getPathForFile(rankedListPath), remapOption, chipPath != null ? webUtils.getPathForFile(chipPath) : null),
    showHelperPopup: (helpString) => 
        ipcRenderer.send('show-helper-popup', helpString)
})
