import { app, BrowserWindow, ipcMain, dialog, Menu } from 'electron'
import { spawn } from 'child_process'
import { writeFileSync, existsSync, unlink } from 'fs'
import { join } from 'node:path'
import logPkg from 'electron-log/main.js'
const { error, transports } = logPkg
import { fileSync } from 'tmp'
import fixPath from 'fix-path'

// Needed since electron-squirrel-startup seems not to support ESM
import { createRequire } from 'module'
const require = createRequire(import.meta.url)

// Needed in Linux and OSX enviroments, in which Electron may not recognize the $PATH correctly
fixPath()

// Current date in yyyy-mm-dd format as a string
const currentDate = new Date().toISOString().slice(0, 10)

// Home directory of user running the app
const HOME_DIR = app.getPath('home')

// Default temporary plot file path (without an extension, it gets added in the web page)
const PLOT_PATH = join(HOME_DIR, 'gsea_plot')

// Plot standard extensions
const plotExtensions = ['.png', '.pdf', '.svg']

// Utility function that collects the stderr output, shows a failure popup in case the passed
// process returns a code different from 0 (unexpected exit) and logs it in a file
const popupOnProcessFail = (process) => {
    let stderrContent = ''
    let stdoutContent = ''

    process.stderr.on('data', (data) => {
        stderrContent += data
    })

    process.stdout.on('data', (data) => {
        stdoutContent += data
    })

    process.on('exit', (code) => {
        if (code !== 0) {
            dialog.showMessageBox({
                message: stdoutContent != ''
                    ? stdoutContent
                    : stderrContent,
                type: 'error',
                title: 'Failure'
            })

            error('\n========================\nError description: ' + stdoutContent + '\nStderr trace:\n' + stderrContent + '\n========================\n')
        }
    })
}

// Utility function that return a local path
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
        case 'pythonBin':
			dir = join('backend_src', 'dist', file)
            break
        case 'renderer':
            dir = 'renderer_src'
            ext = '.js'
            break
        case 'resource':
            dir = 'misc_resources'
            break
        case 'icon':
            dir = 'icons'
            break
        default:
            return ''
    }

    let locPath = join(app.getAppPath(), dir, file + ext)

    return locPath
}

// Setup the logger
// It will be used just for errors and it must save the logs in the local directory
const LOG_FILE_NAME = 'gseawrap_error_' + currentDate
transports.file.resolvePathFn = () => join(HOME_DIR, 'GSEAWrap_log', LOG_FILE_NAME)
transports.file.level = 'error'

globalThis.chosenGeneSetsPath = ''

// Function that creates the home window
const createMainWindow = () => {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        icon: localPath('icon', 'GW.png'),
        webPreferences: {
            preload: localPath('preload', 'main_preload')
        }
    })

    ipcMain.on('open-gsea-preranked', () => {
        createGseaPrerankedWindow()
        mainWindow.close()        
    })

    ipcMain.on('open-gsea', () => {
        createGseaWindow()
        mainWindow.close()
    })

    mainWindow.loadFile(localPath('web', 'main'))
}

// Function that creates and handles the GSEA analysis window
const createGseaWindow = () => {
    const gseaWindow = new BrowserWindow({
        width: 800,
        height: 670,
        icon: localPath('icon', 'GW.png'),
        webPreferences: {
            preload: localPath('preload', 'gsea_preload')
        }
    })

    // Message sent by the GseaWindow renderer when a GSEA analysis has been requested
    ipcMain.on('send-data-gsea', (_event, geneSetsPath, numPermutations, expressionSet, phenotypeLabels, remapOption, chipPath) => {
        let pythonProcess = null

        // Show the loading animation web page
        gseaWindow.loadFile(localPath('web', 'loading'))

        if (app.isPackaged)
            pythonProcess = spawn(localPath('pythonBin', 'gsea'), [geneSetsPath, numPermutations, expressionSet, phenotypeLabels, remapOption, chipPath])
        else
            pythonProcess = spawn('venv/bin/python', [localPath('python', 'gsea'), geneSetsPath, numPermutations, expressionSet, phenotypeLabels, remapOption, chipPath])

        let jsonContent = ''

        pythonProcess.stdout.on('data', (data) => {
            jsonContent += data
        })

        pythonProcess.on('exit', (code) => {
            if (code === 0) {
                globalThis.chosenGeneSetsPath = geneSetsPath
                createTableWindow(jsonContent, 'gsea')
                gseaWindow.close()
            }
            // In case of error show the GSEA web page
            else {
                gseaWindow.loadFile(localPath('web', 'gsea'))
            }
        })
        
        popupOnProcessFail(pythonProcess)
    })

    // Request from the GseaWindow renderer to show an helper popup
    ipcMain.on('show-helper-popup', (_event, helpString) => {
        dialog.showMessageBox({
            message: helpString,
            type: 'info',
            title: 'Helper'
        })
    })

    gseaWindow.loadFile(localPath('web', 'gsea'))
}

// Function that creates and handles the preranked analysis window
const createGseaPrerankedWindow = () => {
    const gseaPrerankedWindow = new BrowserWindow({
        width: 800,
        height: 600,
        icon: localPath('icon', 'GW.png'),
        webPreferences: {
            preload: localPath('preload', 'gsea_preranked_preload')
        }
    })

    // Message sent by the GseaPrerankedWindow renderer when a preranked analysis has been requested
    ipcMain.on('send-data-preranked', (_event, geneSetsPath, numPermutations, rankedListPath, remapOption, chipPath) => {
        let pythonProcess = null

        // Show the loading animation web page
        gseaPrerankedWindow.loadFile(localPath('web', 'loading'))

        if (app.isPackaged)
            pythonProcess = spawn(localPath('pythonBin', 'gsea_preranked'), [geneSetsPath, numPermutations, rankedListPath, remapOption, chipPath])
        else
            pythonProcess = spawn('venv/bin/python', [localPath('python', 'gsea_preranked'), geneSetsPath, numPermutations, rankedListPath, remapOption, chipPath])

        let jsonContent = ''

        pythonProcess.stdout.on('data', (data) => {
            jsonContent += data
        })

        pythonProcess.on('exit', (code) => {
            if (code === 0) {
                globalThis.chosenGeneSetsPath = geneSetsPath
                createTableWindow(jsonContent, 'gsea_preranked')
                gseaPrerankedWindow.close()
            }
            // In case of error
            else {
                // Show the GSEA web page
                gseaPrerankedWindow.loadFile(localPath('web', 'gsea_preranked'))
            }
        })

        popupOnProcessFail(pythonProcess)
    })

    // Request from the GseaPrerankedWindow renderer to show an helper popup
    ipcMain.on('show-helper-popup', (_event, helpString) => {
        dialog.showMessageBox({
            message: helpString,
            type: 'info',
            title: 'Helper'
        })
    })

    gseaPrerankedWindow.loadFile(localPath('web', 'gsea_preranked'))
}

// Function that creates and handles the data table window
const createTableWindow = (jsonRawData, analysisType) => {
    const tableWindow = new BrowserWindow({
        width: 800,
        height: 600,
        icon: localPath('icon', 'GW.png'),
        webPreferences: {
            preload: localPath('preload', 'table_preload')
        }
    })

    tableWindow.webContents.on('did-finish-load', () => {
        tableWindow.webContents.send('send-analysis-data', jsonRawData, analysisType)
    })

    ipcMain.on('request-enrichment-plot', (_event, selectedTerms, sizeX, sizeY, measurementUnit, createOrUpdate) => {
        let pythonProcess = null

        if (app.isPackaged)
            pythonProcess = spawn(localPath('pythonBin', 'gsea_plot'), ['enrichment-plot', selectedTerms, sizeX, sizeY, measurementUnit])
        else
            pythonProcess = spawn('venv/bin/python', [localPath('python', 'gsea_plot'), 'enrichment-plot', selectedTerms, sizeX, sizeY, measurementUnit])

        pythonProcess.on('exit', (code) => {
            if (code == 0) {
                if (createOrUpdate == 'create')
                    createPlotWindow(800, 600, 'enrichment-plot', selectedTerms)
                else if (createOrUpdate == 'update')
                    // Send the update message just if plotWindow object is not null (.?)
                    globalThis.plotWindow?.webContents.send('plot-updated')
            }
        })

        popupOnProcessFail(pythonProcess)
    })

    ipcMain.on('request-dotplot', (_event, selectedColumnAndTerms, sizeX, sizeY, measurementUnit, createOrUpdate) => {
        // Create a tmp file
        const tmpFile = fileSync();

        // Write to the tmp file the selected column data
        // Needed since, most of the times, lead_gene data are too long to be passed as argument
        writeFileSync(tmpFile.name, selectedColumnAndTerms, (err) => {
            if (err)
                error('The selected data file, to be passed to python script, couldn\'t be created.')
        })
        
        let pythonProcess = null

        if (app.isPackaged)
            pythonProcess = spawn(localPath('pythonBin', 'gsea_plot'), ['dotplot', tmpFile.name, sizeX, sizeY, measurementUnit])
        else
            pythonProcess = spawn('venv/bin/python', [localPath('python', 'gsea_plot'), 'dotplot', tmpFile.name, sizeX, sizeY, measurementUnit])

        pythonProcess.on('exit', (code) => {
            // Remove the tmp file
            tmpFile.removeCallback()

            if (code == 0) {
                if (createOrUpdate == 'create')
                    createPlotWindow(900, 500, 'dotplot', selectedColumnAndTerms)
                else if (createOrUpdate == 'update')
                    // Send the update message only if plotWindow object is not null (.?)
                    globalThis.plotWindow?.webContents.send('plot-updated')
            }
        })

        popupOnProcessFail(pythonProcess)
    })

    ipcMain.on('request-heatmap', (_event, selectedRow, sizeX, sizeY, measurementUnit, createOrUpdate) => {
        let pythonProcess = null

        if (app.isPackaged)
            pythonProcess = spawn(localPath('pythonBin', 'gsea_plot'), ['heatmap', selectedRow, sizeX, sizeY, measurementUnit])
        else
            pythonProcess = spawn('venv/bin/python', [localPath('python', 'gsea_plot'), 'heatmap', selectedRow, sizeX, sizeY, measurementUnit])

        pythonProcess.on('exit', (code) => {
            if (code == 0) {
                if (createOrUpdate == 'create')
                    createPlotWindow(900, 500, 'heatmap', selectedRow)
                else if (createOrUpdate == 'update')
                    // Send the update message just if plotWindow object is not null (.?)
                    globalThis.plotWindow?.webContents.send('plot-updated')
            }
        })

        popupOnProcessFail(pythonProcess)
    })

    ipcMain.on('request-iou-plot', (_event, selectedTerms, sizeX, sizeY, measurementUnit, createOrUpdate) => {
        let pythonProcess = null

        if (app.isPackaged)
            pythonProcess = spawn(localPath('pythonBin', 'gsea_plot'), ['intersection-over-union', selectedTerms, globalThis.chosenGeneSetsPath, sizeX, sizeY, measurementUnit])
        else
            pythonProcess = spawn('venv/bin/python', [localPath('python', 'gsea_plot'), 'intersection-over-union', selectedTerms, globalThis.chosenGeneSetsPath, sizeX, sizeY, measurementUnit])

        pythonProcess.on('exit', (code) => {
            if (code == 0) {
                if (createOrUpdate == 'create')
                    createPlotWindow(800, 600, 'iou-plot', selectedTerms)
                else if (createOrUpdate == 'update')
                    // Send the update message just if plotWindow object is not null (.?)
                    globalThis.plotWindow?.webContents.send('plot-updated')
            }
        })

        popupOnProcessFail(pythonProcess)
    })

    ipcMain.on('request-wordcloud', (_event, selectedColumn, sizeX, sizeY, measurementUnit, createOrUpdate) => {
        // Create a tmp file
        const tmpFile = fileSync();

        // Write to the tmp file the selected column data
        // Needed since, most of the times, lead_gene data are too long to be passed as argument
        writeFileSync(tmpFile.name, selectedColumn, (err) => {
            if (err)
                error('The selected column data file, to be passed to python script, couldn\'t be created.')
        })

        let pythonProcess = null

        if (app.isPackaged)
            pythonProcess = spawn(localPath('pythonBin', 'gsea_plot'), ['wordcloud', tmpFile.name, sizeX, sizeY, measurementUnit])
        else
            pythonProcess = spawn('venv/bin/python', [localPath('python', 'gsea_plot'), 'wordcloud', tmpFile.name, sizeX, sizeY, measurementUnit])

        pythonProcess.on('exit', (code) => {
            // Remove the tmp file
            tmpFile.removeCallback()

            if (code == 0) {
                if (createOrUpdate == 'create')
                    createPlotWindow(800, 600, 'wordcloud', selectedColumn)
                else if (createOrUpdate == 'update')
                    // Send the update message just if plotWindow object is not null (.?)
                    globalThis.plotWindow?.webContents.send('plot-updated')
            }
        })

        popupOnProcessFail(pythonProcess)
    })

    ipcMain.on('request-gene-set-info', (_event, selectedTerm) => {
        if (!existsSync(localPath('resource', 'msigdb.db'))) {
            dialog.showMessageBox({
                message: 'The MSigDB file (msigdb.db) wasn\'t found.',
                type: 'error',
                title: 'Failure'
            })
        } else {
            let pythonProcess = null

            if (app.isPackaged)
                pythonProcess = spawn(localPath('pythonBin', 'gene_set_info'), [selectedTerm, localPath('resource', 'msigdb.db')])
            else
                pythonProcess = spawn('venv/bin/python', [localPath('python', 'gene_set_info'), selectedTerm, localPath('resource', 'msigdb.db')])

            let jsonContent = ''

            pythonProcess.stdout.on('data', (data) => {
                jsonContent += data
            })

            pythonProcess.on('exit', (code) => {
                if (code == 0)
                    createGeneSetInfoWindow(jsonContent)
            })

            popupOnProcessFail(pythonProcess)
        }
    })

    tableWindow.maximize()

    tableWindow.loadFile(localPath('web', 'table'))
}

// Function that creates and handles the plot window
const createPlotWindow = (customWidth, customHeight, plotType, plotArg) => {
    globalThis.plotWindow = new BrowserWindow({
        width: customWidth,
        height: customHeight,
        icon: localPath('icon', 'GW.png'),
        webPreferences: {
            preload: localPath('preload', 'plot_preload')
        }
    })

    // Send plot data (type and args used to generate it) when the window has finished loading
    plotWindow.webContents.on('did-finish-load', () => {
        plotWindow.webContents.send('send-plot-data', plotType, plotArg, PLOT_PATH)
    })

    // Delete plot file when the window is closed
    plotWindow.on('close', _event => {
        plotExtensions.forEach(ext => {
            unlink(PLOT_PATH + ext, (err) => {
                if (err)
                    error('Temporary plot file ' + PLOT_PATH + ' couldn\'t be deleted.')
            })
        })
    })

    plotWindow.loadFile(localPath('web', 'plot'))
}

// Function that creates and handles the gene set information window
const createGeneSetInfoWindow = (geneSetInfo) => {
    const geneSetInfoWindow = new BrowserWindow({
        width: 600,
        height: 400,
        icon: localPath('icon', 'GW.png'),
        webPreferences: {
            preload: localPath('preload', 'gene_set_info_preload')
        }
    })

    geneSetInfoWindow.webContents.on('did-finish-load', () => {
        geneSetInfoWindow.webContents.send('send-gene-set-data', geneSetInfo)
    })

    geneSetInfoWindow.loadFile(localPath('web', 'gene_set_info'))
}

// Set up the app
// Menu.setApplicationMenu(null)
app.disableHardwareAcceleration()

// Needed for Windows Squirrel package
if (require('electron-squirrel-startup'))
    app.quit()

app.whenReady().then(() => {
    createMainWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0)
            createMainWindow()
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        unlink(join(HOME_DIR, 'gseawrap_python_session.pkl'), (err) => {
            if (err)
                error('\n========================\nWarning: The file ' + join(HOME_DIR, 'gseawrap_python_session.pkl couldn\'t be deleted.') +  ' \n========================\n')
        })

        app.quit()
    }
})