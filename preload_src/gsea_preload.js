const { contextBridge, ipcRenderer, webUtils } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
    
    sendDataGsea: (geneSetsPath, numPermutations, minGeneSet, maxGeneSet, expressionSetPath, phenotypeLabels, remapOption, chipPath) =>
        ipcRenderer.send('send-data-gsea', webUtils.getPathForFile(geneSetsPath), numPermutations, minGeneSet, maxGeneSet, webUtils.getPathForFile(expressionSetPath), webUtils.getPathForFile(phenotypeLabels), remapOption, chipPath != null ? webUtils.getPathForFile(chipPath) : 'null'),
    
    goBackToHome: () => 
        ipcRenderer.send('go-back-to-home'),
    
    showHelperPopup: (helpString) => 
        ipcRenderer.send('show-helper-popup', helpString)
})
