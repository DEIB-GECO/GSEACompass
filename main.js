const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const { spawn } = require('child_process')
const path = require('node:path')
const notifier = require('node-notifier')
const log = require('electron-log/main')

// Function to get current date in yyyy-mm-dd format as a string
const currentDate = () => {
    return new Date().toISOString().slice(0,10)
}

const LOG_FILE_POS = 'GSEAWrap_logs/error_' +  currentDate() + '.log'

// Setup the logger
// It will be used just for errors and it must save the logs in the local directory
log.transports.file.level = 'error'
log.transports.file.resolvePathFn = () => path.join(__dirname, LOG_FILE_POS)

// Function to be called when there's a major failure, because of which
// the app hat to exit
const fail = (info, error) => {
    console.log(info + error)
    log.error(info + '\n' + error)

    // Launch OS notification
    notifier.notify({
        title: 'GSEAWrap failed',
        message: info + ', you can find the log in GSEAWrap_error directory',
        wait: true
    })

    app.exit(-1)
}

// Utility function that collects the stderr output and make the app fail in case the passed
// process returns a code different from 0
const exitOnProcessFail = (process, info) => {
    let stderrChunks = []

    process.stderr.on('data', data => {
        stderrChunks = stderrChunks.concat(data)
    })

    process.on('exit', code => {
        if (code != 0) {
            let stderrContent = Buffer.concat(stderrChunks).toString()
            fail(info, stderrContent)
        }
    })
}

// Function that creates the home window
const createMainWindow = () => {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload_src', 'main_preload.js')
        }
    })

    ipcMain.on('open-gsea-preranked', _event => {
        createGseaPrerankedWindow()
    })

    ipcMain.on('open-gsea', _event => {
        createGseaWindow()
    })

    ipcMain.on('open-last-results', _event => {
        createTableWindow()
    })

    mainWindow.loadFile('web_pages/main.html')
}

// Function that creates and handles the GSEA analysis window
const createGseaWindow = () => {
    const gseaWindow = new BrowserWindow({
        width: 800,
        height: 670,
        webPreferences: {
            preload: path.join(__dirname, 'preload_src', 'gsea_preload.js')
        }
    })

    // Message sent by the TableWindow renderer when a GSEA analysis has been requested
    ipcMain.on('send-data-gsea', (_event, geneSetsPath, numPermutations, expressionSet, phenotypeLabels, remapOption, chipPath) => {
        const pythonProcess = spawn('venv/bin/python3.12', ['backend_src/gsea.py',
            geneSetsPath, numPermutations, expressionSet, phenotypeLabels, remapOption, chipPath])

        let jsonContent = ''

        pythonProcess.stdout.on('data', data => {
            jsonContent += data
        })
        pythonProcess.stdout.on('end', _data => {
            createTableWindow(jsonContent)
        })

        exitOnProcessFail(pythonProcess, 'The app failed while computing the GSEA analysis')
    })

    gseaWindow.loadFile('web_pages/gsea.html')
}

// Function that creates and handles the preranked analysis window
const createGseaPrerankedWindow = () => {
    const gseaPrerankedWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload_src', 'gsea_preranked_preload.js')
        }
    })

    // Message sent by the TableWindow renderer when a preranked analysis has been requested
    ipcMain.on('send-data-preranked', (_event, geneSetsPath, numPermutations, rankedListPath, collapseRemapOption, chipPath) => {
        const pythonProcess = spawn('venv/bin/python3.12', ['backend_src/gsea_preranked.py',
            geneSetsPath, numPermutations, rankedListPath, collapseRemapOption, chipPath])

        let jsonContent = ''

        pythonProcess.stdout.on('data', data => {
            jsonContent += data
        })
        pythonProcess.stdout.on('end', _data => {
            createTableWindow(jsonContent)
        })

        exitOnProcessFail(pythonProcess, 'The app failed while computing the preranked analysis')
    })

    gseaPrerankedWindow.loadFile('web_pages/gsea_preranked.html')
}

const createTableWindow = jsonRawData => {
    const tableWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload_src', 'table_preload.js')
        }
    })

    ipcMain.on('request-json-data', _event => {
        tableWindow.webContents.send('send-json-data', jsonRawData)
    })

    ipcMain.on('request-enrichment-plot', (_event, selectedTerms) => {
        const pythonProcess = spawn('venv/bin/python3.12', ['backend_src/gsea_plot.py', 'enrichment-plot', selectedTerms])

        pythonProcess.stdout.on('end', _data => {
            createPlotWindow(800, 600)
        })

        exitOnProcessFail(pythonProcess, "The app failed while computing a plot")
    })

    ipcMain.on('request-dotplot', (_event, selectedColumn) => {
        const pythonProcess = spawn('venv/bin/python3.12', ['backend_src/gsea_plot.py', 'dotplot', selectedColumn])

        pythonProcess.stdout.on('end', _data => {
            createPlotWindow(900, 500)
        })

        exitOnProcessFail(pythonProcess, "The app failed while computing a plot")
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
    // var fs = require('fs')
    // var data = fs.readFileSync('../test_data/test_result.json', 'utf8')
    // createTableWindow(data)

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