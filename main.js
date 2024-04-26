const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const { spawn } = require('child_process')
const path = require('node:path')
const sizeOf = require('image-size')

const createMainWindow = () => {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload_src', 'main_preload.js')
        }
    })

    ipcMain.on('send-data-preranked', (_event, geneSetsPath, numPermutations, rankedListPath, collapseRemapOption, chipPath) => {
        
        const pythonProcess = spawn('python', ['backend_src/gsea_preranked.py',
            geneSetsPath, numPermutations, rankedListPath, collapseRemapOption, chipPath])
        
        let rawJsonData = ''

        pythonProcess.stdout.on('data', (data) => {
            rawJsonData += data
        })

        pythonProcess.stdout.on('end', (_data) => {
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

    ipcMain.on('request-json-data', (_event) => {
        tableWindow.webContents.send('send-json-data', jsonRawData)
    })

    ipcMain.on('request-plot', (_event, selectedTerms) => {
        const pythonProcess = spawn('python', ['backend_src/gsea_plot.py', selectedTerms])

        pythonProcess.stdout.on('end', (_data) => {
            createPlotWindow(800, 600)
        })
    })

    tableWindow.maximize()
    
    tableWindow.loadFile('web_pages/table.html')
}

const createPlotWindow = (customWidth, customHeight) => {
    const plotWindow = new BrowserWindow({
        width: customWidth,
        height: customHeight,
        autoHideMenuBar: true
    })

    plotWindow.loadFile('web_pages/plot.html')
}

app.whenReady().then(() => {
    // ### Debug ###
    var fs = require('fs')
    var data = fs.readFileSync('../test_data/test_result.json', 'utf8')
    createTableWindow(data)
    // ### ### ###

    // createMainWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) 
            createMainWindow()
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') 
        app.quit()
})