const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const { spawn } = require('child_process')
const path = require('node:path')

const createMainWindow = () => {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload_src', 'main_preload.js')
        }
    })

    ipcMain.on('send-data-preranked', (event, geneSetsPath, numPermutations, rankedListPath, collapseRemapOption, chipPath) => {
        
        const pythonProcess = spawn('python3', ['backend_src/gsea_preranked.py',
            geneSetsPath, numPermutations, rankedListPath, collapseRemapOption, chipPath])
        
        let rawJsonData = ''

        pythonProcess.stdout.on('data', (data) => {
            rawJsonData += data
        })

        pythonProcess.stdout.on('end', (data) => {
            createTableWindow(rawJsonData)
        })
    })

    mainWindow.loadFile('web_pages/index.html')
}

const createTableWindow = (jsonRawData) => {
    const tableWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload_src', 'table_preload.js')
        }
    })

    ipcMain.on('request-json-data', (event) => {
        tableWindow.webContents.send('send-json-data', jsonRawData)
    })

    tableWindow.loadFile('web_pages/table.html')
}

app.whenReady().then(() => {
    createMainWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) 
            createMainWindow()
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') 
        app.quit()
})