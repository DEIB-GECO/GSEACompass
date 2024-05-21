const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron')
const { spawn } = require('child_process')
const fs = require('fs')
const path = require('node:path')
const notifier = require('node-notifier')
const log = require('electron-log/main')
const tmp = require('tmp')


// Utility function to get current date in yyyy-mm-dd format as a string
const currentDate = () => {
    return new Date().toISOString().slice(0, 10)
}

// Utility function to be called when there's a major failure, because of which the app must exit
const fail = (info, error) => {
    console.log(info + error)
    log.error('\n\n=================' + info + '\n' + error)

    // Launch OS notification
    notifier.notify({
        title: 'GSEAWrap failed',
        message: info + ', you can find the log in ' + log.transports.file.getFile(),
        wait: true
    })

    app.exit(-1)
}

// Utility function that collects the stderr output and make the app fail in case the passed
// process returns a code different from 0
const exitOnProcessFail = (process, info) => {
    let stderrChunks = []

    process.stderr.on('data', (data) => {
        stderrChunks = stderrChunks.concat(data)
    })

    process.on('exit', (code) => {
        if (code !== 0) {
            let stderrContent = Buffer.concat(stderrChunks).toString()
            fail(info, stderrContent)
        }
    })
}

// Utility function that create a local path
const localPath = (type, file) => {
    let dir = ''
    let ext = ''
    switch (type) {
        case 'web':
            dir = 'web_pages' 
            ext = '.html'
            break
        case 'preload':
            dir = 'preload_src'
            ext = '.js'
            break
        case 'python':
            dir = 'backend_src'
            ext = '.py'
            break
        case 'renderer':
            dir = 'renderer_src'
            ext = '.js'
            break
        case 'resources':
            dir = 'GSEAWrap_resources'
            break
        case 'log':
            dir = 'GSEAWrap_log'
            break
        default:
            fail('Wrong local path given')
    }

    let locPath = ''
    
    if (file === null || file === '')
        locPath = path.join(__dirname, dir)
    else 
        locPath = path.join(__dirname, dir, file + ext)

    return locPath
}

// Setup the logger
// It will be used just for errors and it must save the logs in the local directory
const LOG_FILE_NAME = 'gseawrap_error_' + currentDate() + '.log'
log.transports.file.level = 'error'

// Function that creates the home window
const createMainWindow = () => {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: localPath('preload', 'main_preload')
        }
    })

    ipcMain.on('open-gsea-preranked', () => {
        createGseaPrerankedWindow()
    })

    ipcMain.on('open-gsea', () => {
        createGseaWindow()
    })

    mainWindow.loadFile(localPath('web', 'main'))
}

// Function that creates and handles the GSEA analysis window
const createGseaWindow = () => {
    const gseaWindow = new BrowserWindow({
        width: 800,
        height: 670,
        webPreferences: {
            preload: localPath('preload', 'gsea_preload')
        }
    })

    // Message sent by the TableWindow renderer when a GSEA analysis has been requested
    ipcMain.on('send-data-gsea', (_event, geneSetsPath, numPermutations, expressionSet, phenotypeLabels, remapOption, chipPath) => {
        const pythonProcess = spawn('python', [localPath('python', 'gsea'),
            geneSetsPath, numPermutations, expressionSet, phenotypeLabels, remapOption, chipPath])

        let jsonContent = ''

        pythonProcess.stdout.on('data', (data) => {
            jsonContent += data
        })
        pythonProcess.stdout.on('end', () => {
            createTableWindow(jsonContent, 'gsea')
        })

        exitOnProcessFail(pythonProcess, 'The app failed while computing the GSEA analysis')
    })

    gseaWindow.loadFile(localPath('web', 'gsea'))
}

// Function that creates and handles the preranked analysis window
const createGseaPrerankedWindow = () => {
    const gseaPrerankedWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: localPath('preload', 'gsea_preranked_preload')
        }
    })

    // Message sent by the TableWindow renderer when a preranked analysis has been requested
    ipcMain.on('send-data-preranked', (_event, geneSetsPath, numPermutations, rankedListPath, collapseRemapOption, chipPath) => {
        const pythonProcess = spawn('python', [localPath('python', 'gsea_preranked'),
            geneSetsPath, numPermutations, rankedListPath, collapseRemapOption, chipPath])

        let jsonContent = ''

        pythonProcess.stdout.on('data', (data) => {
            jsonContent += data
        })
        pythonProcess.stdout.on('end', () => {
            createTableWindow(jsonContent, 'gsea_preranked')
        })

        exitOnProcessFail(pythonProcess, 'The app failed while computing the preranked analysis')
    })

    gseaPrerankedWindow.loadFile(localPath('web', 'gsea_preranked'))
}

// Function that creates and handles the data table window
const createTableWindow = (jsonRawData, analysisType) => {
    const tableWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: localPath('preload', 'table_preload')
        }
    })

    tableWindow.webContents.on('did-finish-load', () => {
        tableWindow.webContents.send('send-analysis-data', jsonRawData, analysisType)
    })

    ipcMain.on('request-enrichment-plot', (_event, selectedTerms) => {
        const pythonProcess = spawn('python', [localPath('python', 'gsea_plot'), 'enrichment-plot', selectedTerms])

        pythonProcess.stdout.on('end', () => {
            createPlotWindow(800, 600)
        })

        exitOnProcessFail(pythonProcess, 'The app failed while computing a plot')
    })

    ipcMain.on('request-dotplot', (_event, selectedColumn) => {
        const pythonProcess = spawn('python', [localPath('python', 'gsea_plot'), 'dotplot', selectedColumn])

        pythonProcess.stdout.on('end', () => {
            createPlotWindow(900, 500)
        })

        exitOnProcessFail(pythonProcess, 'The app failed while computing a plot')
    })

    ipcMain.on('request-heatmap', (_event, selectedRow) => {
        const pythonProcess = spawn('python', [localPath('python', 'gsea_plot'), 'heatmap', selectedRow])

        pythonProcess.stdout.on('end', () => {
            createPlotWindow(900, 500)
        })

        exitOnProcessFail(pythonProcess, 'The app failed while computing a plot')
    })

    ipcMain.on('request-iou-plot', (_event, selectedGenesets) => {
        const pythonProcess = spawn('python', [localPath('python', 'gsea_plot'), 'intersection-over-union', selectedGenesets])

        pythonProcess.stdout.on('end', _data => {
            createPlotWindow(800, 600)
        })

        exitOnProcessFail(pythonProcess, 'The app failed while computing a plot')
    })

    ipcMain.on('request-word-cloud', (_event, selectedColumn) => {
        // Create a tmp file
        const tmpFile = tmp.fileSync();

        // Write to the tmp file the selected column data
        fs.writeFileSync(tmpFile.name, selectedColumn, (err) => {
            if(err)
                log.error('The selected column data file, to be passed to python script, couldn\'t be created')
        })

        const pythonProcess = spawn('python', [localPath('python', 'gsea_plot'), 'wordcloud', tmpFile.name])

        pythonProcess.stdout.on('end', () => {
            // Remove the tmp file
            tmpFile.removeCallback()

            createPlotWindow(800, 600)
        })

        exitOnProcessFail(pythonProcess, 'The app failed while computing a plot')
    })

    ipcMain.on('request-gene-set-info', (_event, selectedTerm) => {
        if (!fs.existsSync(localPath('resources', 'msigdb.db')))
            notifier.notify({
                title: 'GSEAWrap error',
                message: 'No Msig database was found',
                wait: true
            })
        else {
            const pythonProcess = spawn('python', [localPath('python', 'gene_set_info'), selectedTerm])

            let jsonContent = ''

            pythonProcess.stdout.on('data', (data) => {
                jsonContent += data
            })

            pythonProcess.on('exit', (code) => {
                if (code === 0)
                    createGeneSetInfoWindow(jsonContent)
                else
                    notifier.notify({
                        title: 'GSEAWrap error',
                        message: 'No gene set data was found or an error was thrown while retrieving it',
                        wait: true
                    })
            })
        }
    })

    tableWindow.maximize()

    tableWindow.loadFile(localPath('web', 'table'))
}

// Function that creates and handles the plot window
const createPlotWindow = (customWidth, customHeight) => {
    const plotWindow = new BrowserWindow({
        width: customWidth,
        height: customHeight
    })

    // Delete plot file when the window is closed
    plotWindow.on('close', _event => {
        fs.unlink('gsea_plot.png', (err) => {
            if (err)
                log.error('Plot file gsea_plot.png couldn\'t be deleted')
        })
    })

    plotWindow.loadFile(localPath('web', 'plot'))
}

// Function that creates and handles the gene set information window
const createGeneSetInfoWindow = (geneSetInfo) => {
    const geneSetInfoWindow = new BrowserWindow({
        width: 600,
        height: 400,
        webPreferences: {
            preload: localPath('preload', 'gene_set_info_preload')
        }
    })

    geneSetInfoWindow.webContents.on('did-finish-load', () => {
        geneSetInfoWindow.webContents.send('send-gene-set-data', geneSetInfo)
    })

    geneSetInfoWindow.loadFile(localPath('web', 'gene_set_info'))
}

//  Set up the app
Menu.setApplicationMenu(null)
app.disableHardwareAcceleration()

// Needed for Windows Squirrel package
if (require('electron-squirrel-startup')) 
    app.quit();

app.whenReady().then(() => {

    // --- Debug
    let data = fs.readFileSync('../test_data/preranked/test_result.json', 'utf8')
    createTableWindow(data, 'gsea_preranked')
    // --- Debug

    // createMainWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0)
            createMainWindow()
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        // TODO: remove comments
        // fs.unlink('gsea_run.pkl', err => {
        //     if (err)
        //         log.error('Python session file gsea_run.pkl couldn\'t be deleted')
        // })

        app.quit()
    }
})