const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const { spawn } = require('child_process')
const path = require('node:path')
const notifier = require('node-notifier')
const log = require('electron-log/main')

const LOG_DIR = 'GSEAWrap_logs/error.log'

// Setup the logger
// It will be used just for errors and it must save the logs in the local directory
log.transports.file.level = 'error'
log.transports.file.resolvePathFn = () => path.join(__dirname, LOG_DIR)

// Function to be called when there's a major failure, because of which
// the app hat to exit
const exitOnFail = (info, error) => {
    console.log(info + error);
    log.error(info + '\n' + error)

    // Launch OS-specific notification
    notifier.notify({
        title: 'GSEAWrap failed',
        message: info + ', you can find the log in err_log.txt',
        wait: true
    })

    app.exit(-1)
}

const exitOnPythonProcessFail = (pythonProcess, info) => {
    let stderrChunks = []

    pythonProcess.stderr.on('data', (data) => {
        stderrChunks = stderrChunks.concat(data);
    })

    pythonProcess.stderr.on('end', (_data) => {
        let stderrContent = Buffer.concat(stderrChunks).toString();

        if (stderrContent.length !== 0)
            exitOnFail(info, stderrContent)
    })
}

// Function that creates and handles the main window
const createMainWindow = () => {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload_src', 'main_preload.js')
        }
    })

    // Message sent by the TableWindow renderer when a preranked analysis has been requested
    ipcMain.on('send-data-preranked', (_event, geneSetsPath, numPermutations, rankedListPath, collapseRemapOption, chipPath) => {
        const pythonProcess = spawn('venv/bin/python3.12', ['backend_src/gsea_preranked.py',
            geneSetsPath, numPermutations, rankedListPath, collapseRemapOption, chipPath])

        let jsonContent = ''

        pythonProcess.stdout.on('data', (data) => {
            jsonContent += data
        })
        pythonProcess.stdout.on('end', (_data) => {
            createTableWindow(jsonContent)
        })

        exitOnPythonProcessFail(pythonProcess, 'The app failed while computing the preranked analysis')
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

    ipcMain.on('request-enrichment-plot', (_event, selectedTerms) => {
        const pythonProcess = spawn('venv/bin/python3.12', ['backend_src/gsea_plot.py', 'enrichment-plot', selectedTerms])

        pythonProcess.stdout.on('end', (_data) => {
            createPlotWindow(800, 600)
        })

        exitOnPythonProcessFail(pythonProcess, "The app failed while computing a plot")
    })

    ipcMain.on('request-dotplot', (_event, selectedColumn) => {
        const pythonProcess = spawn('venv/bin/python3.12', ['backend_src/gsea_plot.py', 'dotplot', selectedColumn])

        pythonProcess.stdout.on('end', (_data) => {
            createPlotWindow(900, 500)
        })

        let stderrChunks = []

        pythonProcess.stderr.on('data', (data) => {
            stderrChunks = stderrChunks.concat(data);
        })
        pythonProcess.stderr.on('end', (_data) => {
            let stderrContent = Buffer.concat(stderrChunks).toString();

            if (stderrContent.length !== 0)
                exitOnFail("The app failed while computing the plot", stderrContent)
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