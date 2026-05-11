import { app, BrowserWindow, ipcMain, dialog, Menu, shell } from 'electron'
import { spawn } from 'child_process'
import { writeFileSync, existsSync, unlink, copyFile, mkdirSync } from 'fs'
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

            error(`\n========================\n
                   Error description: ${stdoutContent}\n
                   Stderr trace:\n ${stderrContent}
                   \n========================\n`)
        }
    })
}

// Utility function that returns a local path
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
            dir = join('backend_src', 'dist', 'backend')
            if (process.platform === 'win32')
                ext = '.exe'
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
        case 'database':
            return join(app.getPath('userData'), file)
        default:
            return ''
    }

    let locPath = join(app.getAppPath(), dir, file + ext)

    return locPath
}

// Utility function that spawns a python process either using 
// packaged executables or the local python environment, based on the app environment
const spawnPythonProcess = (scriptName, args) => {
    if (app.isPackaged) {
        return spawn(localPath('pythonBin', scriptName), args)
    } else {
        // Automatically use 'python3' on macOS/Linux, and 'python' on Windows
        const pythonCommand = process.platform === 'win32' ? 'python' : 'python3'
        return spawn(pythonCommand, [localPath('python', scriptName), ...args])
    }
}

// Setup the logger
// It will be used just for errors and it must save the logs in the local directory
const LOG_FILE_NAME = 'gseacompass_error_' + currentDate
transports.file.resolvePathFn = () => join(HOME_DIR, 'GSEACompass_log', LOG_FILE_NAME)
transports.file.level = 'error'

globalThis.chosenGeneSetsPath = ''

// Function that creates the home window
const createMainWindow = () => {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        icon: localPath('icon', 'compass_1024px.png'),
        webPreferences: {
            preload: localPath('preload', 'main_preload')
        }
    })

    ipcMain.removeAllListeners('open-gsea-preranked')
    ipcMain.on('open-gsea-preranked', () => {
        createGseaPrerankedWindow()
        mainWindow.close()
    })

    ipcMain.removeAllListeners('open-gsea')
    ipcMain.on('open-gsea', () => {
        createGseaWindow()
        mainWindow.close()
    })

    ipcMain.removeAllListeners('open-ssgsea')
    ipcMain.on('open-ssgsea', () => {
        createSsgseaWindow()
        mainWindow.close()
    })

    ipcMain.removeAllListeners('open-gsva')
    ipcMain.on('open-gsva', () => {
        createGsvaWindow()
        mainWindow.close()
    })

    mainWindow.loadFile(localPath('web', 'main'))
}

// Function that creates and handles the GSVA analysis window
const createGsvaWindow = () => {
    const gsvaWindow = new BrowserWindow({
        width: 780,
        height: 750,
        icon: localPath('icon', 'compass_1024px.png'),
        webPreferences: {
            preload: localPath('preload', 'gsva_preload')
        }
    })

    ipcMain.removeAllListeners('send-data-gsva')
    ipcMain.on('send-data-gsva', (_event, geneSetsPath, expressionSetPath, minGeneSet, maxGeneSet) => {
        gsvaWindow.loadFile(localPath('web', 'loading'))

        let pythonProcess = spawnPythonProcess('gsva', [geneSetsPath, expressionSetPath, minGeneSet, maxGeneSet])
        let jsonContent = ''

        pythonProcess.stdout.on('data', (data) => { jsonContent += data })

        pythonProcess.on('exit', (code) => {
            if (code === 0) {
                globalThis.chosenGeneSetsPath = geneSetsPath
                createTableWindow(jsonContent, 'gsva')
                gsvaWindow.close()
            } else {
                gsvaWindow.loadFile(localPath('web', 'gsva'))
            }
        })
        popupOnProcessFail(pythonProcess)
    })

    ipcMain.removeAllListeners('go-back-to-home')
    ipcMain.on('go-back-to-home', () => {
        createMainWindow()
        gsvaWindow.close()
    })

    ipcMain.removeAllListeners('show-helper-popup')
    ipcMain.on('show-helper-popup', (_event, helpString) => {
        dialog.showMessageBox({ message: helpString, type: 'info', title: 'Helper' })
    })

    gsvaWindow.loadFile(localPath('web', 'gsva'))
}

// Function that creates and handles the ssGSEA analysis window
const createSsgseaWindow = () => {
    const ssgseaWindow = new BrowserWindow({
        width: 780,
        height: 750,
        icon: localPath('icon', 'compass_1024px.png'),
        webPreferences: {
            preload: localPath('preload', 'ssgsea_preload')
        }
    })

    // Message sent by the SsgseaWindow renderer when an analysis has been requested
    ipcMain.removeAllListeners('send-data-ssgsea')
    ipcMain.on('send-data-ssgsea', (_event, geneSetsPath, expressionSetPath, minGeneSet, maxGeneSet) => {
        let pythonProcess = null

        // Show the loading animation web page
        ssgseaWindow.loadFile(localPath('web', 'loading'))

        pythonProcess = spawnPythonProcess('ssgsea', [geneSetsPath, expressionSetPath, minGeneSet, maxGeneSet])

        let jsonContent = ''

        pythonProcess.stdout.on('data', (data) => {
            jsonContent += data
        })

        pythonProcess.on('exit', (code) => {
            if (code === 0) {
                globalThis.chosenGeneSetsPath = geneSetsPath
                createTableWindow(jsonContent, 'ssgsea')
                ssgseaWindow.close()
            }
            // In case of error show the ssGSEA web page
            else {
                ssgseaWindow.loadFile(localPath('web', 'ssgsea'))
            }
        })

        popupOnProcessFail(pythonProcess)
    })

    // Go back to the home window
    ipcMain.removeAllListeners('go-back-to-home')
    ipcMain.on('go-back-to-home', () => {
        createMainWindow()
        ssgseaWindow.close()
    })

    // Request from the SsgseaWindow renderer to show an helper popup
    ipcMain.removeAllListeners('show-helper-popup')
    ipcMain.on('show-helper-popup', (_event, helpString) => {
        dialog.showMessageBox({
            message: helpString,
            type: 'info',
            title: 'Helper'
        })
    })

    ssgseaWindow.loadFile(localPath('web', 'ssgsea'))
}

// Function that creates and handles the GSEA analysis window
const createGseaWindow = () => {
    const gseaWindow = new BrowserWindow({
        width: 780,
        height: 830,
        icon: localPath('icon', 'compass_1024px.png'),
        webPreferences: {
            preload: localPath('preload', 'gsea_preload')
        }
    })

    // Message sent by the GseaWindow renderer when a GSEA analysis has been requested
    ipcMain.removeAllListeners('send-data-gsea')
    ipcMain.on('send-data-gsea', (_event, geneSetsPath, numPermutations, minGeneSet, maxGeneSet, expressionSet, phenotypeLabels, remapOption, chipPath) => {
        let pythonProcess = null

        // Show the loading animation web page
        gseaWindow.loadFile(localPath('web', 'loading'))

        pythonProcess = spawnPythonProcess('gsea', [geneSetsPath, numPermutations, minGeneSet, maxGeneSet, expressionSet, phenotypeLabels, remapOption, chipPath])

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

    // Go back to the home window
    ipcMain.removeAllListeners('go-back-to-home')
    ipcMain.on('go-back-to-home', () => {
        createMainWindow()
        gseaWindow.close()
    })

    // Request from the GseaWindow renderer to show an helper popup
    ipcMain.removeAllListeners('show-helper-popup')
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
        width: 780,
        height: 750,
        icon: localPath('icon', 'compass_1024px.png'),
        webPreferences: {
            preload: localPath('preload', 'gsea_preranked_preload')
        }
    })

    // Message sent by the GseaPrerankedWindow renderer when a preranked analysis has been requested
    ipcMain.removeAllListeners('send-data-preranked')
    ipcMain.on('send-data-preranked', (_event, geneSetsPath, numPermutations, minGeneSet, maxGeneSet, rankedListPath, remapOption, chipPath) => {
        let pythonProcess = null

        // Show the loading animation web page
        gseaPrerankedWindow.loadFile(localPath('web', 'loading'))

        pythonProcess = spawnPythonProcess('gsea_preranked', [geneSetsPath, numPermutations, minGeneSet, maxGeneSet, rankedListPath, remapOption, chipPath])

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

    // Go back to the home window
    ipcMain.removeAllListeners('go-back-to-home')
    ipcMain.on('go-back-to-home', () => {
        createMainWindow()
        gseaPrerankedWindow.close()
    })

    // Request from the GseaPrerankedWindow renderer to show an helper popup
    ipcMain.removeAllListeners('show-helper-popup')
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
        icon: localPath('icon', 'compass_1024px.png'),
        webPreferences: {
            preload: localPath('preload', 'table_preload')
        }
    })

    // Go back to the home window
    ipcMain.removeAllListeners('go-back-to-home')
    ipcMain.on('go-back-to-home', () => {
        // Delete the session file if it exists, since the user is going back to the home page and any previous session should be cleared
        if (existsSync(join(HOME_DIR, 'gseacompass_python_session.pkl'))) {
            unlink(join(HOME_DIR, 'gseacompass_python_session.pkl'), (err) => {
                if (err)
                    error(`\n========================\n
                             Warning: The file ${join(HOME_DIR, 'gseacompass_python_session.pkl')} exists but couldn't be deleted. 
                           \n========================\n`)
            })
        }

        createMainWindow()
        tableWindow.close()
    })

    tableWindow.webContents.on('did-finish-load', () => {
        tableWindow.webContents.send('send-analysis-data', jsonRawData, analysisType)
    })

    ipcMain.removeAllListeners('request-enrichment-plot')
    ipcMain.on('request-enrichment-plot', (_event, selectedTerms, sizeX, sizeY, measurementUnit, createOrUpdate) => {
        let pythonProcess = null

        pythonProcess = spawnPythonProcess('gsea_plot', ['enrichment-plot', selectedTerms, sizeX, sizeY, measurementUnit])

        pythonProcess.on('exit', (code) => {
            if (code == 0) {
                if (createOrUpdate == 'create') {
                    createPlotWindow(800, 600, 'enrichment-plot', selectedTerms)

                    tableWindow.webContents.send('plot-creation-complete')
                }
                else if (createOrUpdate == 'update')
                    // Send the update message just if plotWindow object is not null (.?)
                    globalThis.plotWindow?.webContents.send('plot-updated')
            }
        })

        popupOnProcessFail(pythonProcess)
    })

    ipcMain.removeAllListeners('request-similarity-graph')
    ipcMain.on('request-similarity-graph', (_event, selectedTerms, sizeX, sizeY, measurementUnit, createOrUpdate) => {
        let pythonProcess = null

        pythonProcess = spawnPythonProcess('gsea_plot', ['similarity-graph', selectedTerms, sizeX, sizeY, measurementUnit])

        pythonProcess.on('exit', (code) => {
            if (code == 0) {
                if (createOrUpdate == 'create') {
                    createPlotWindow(800, 600, 'similarity-graph', selectedTerms)

                    tableWindow.webContents.send('plot-creation-complete')
                }
                else if (createOrUpdate == 'update')
                    // Send the update message just if plotWindow object is not null (.?)
                    globalThis.plotWindow?.webContents.send('plot-updated')
            }
        })

        popupOnProcessFail(pythonProcess)
    })

    ipcMain.removeAllListeners('request-similarity-heatmap')
    ipcMain.on('request-similarity-heatmap', (_event, selectedTerms, sizeX, sizeY, measurementUnit, createOrUpdate) => {
        let pythonProcess = null

        pythonProcess = spawnPythonProcess('gsea_plot', ['similarity-heatmap', selectedTerms, sizeX, sizeY, measurementUnit])

        pythonProcess.on('exit', (code) => {
            if (code == 0) {
                if (createOrUpdate == 'create') {
                    createPlotWindow(900, 800, 'similarity-heatmap', selectedTerms)

                    tableWindow.webContents.send('plot-creation-complete')
                }
                else if (createOrUpdate == 'update')
                    // Send the update message just if plotWindow object is not null (.?)
                    globalThis.plotWindow?.webContents.send('plot-updated')
            }
        })

        popupOnProcessFail(pythonProcess)
    })

    ipcMain.removeAllListeners('request-heatmap-gsva')
    ipcMain.on('request-heatmap-gsva', (_event, visibleRows, sizeX, sizeY, measurementUnit, createOrUpdate) => {
        const tmpFile = fileSync();
        writeFileSync(tmpFile.name, visibleRows, (err) => {
            if (err) error('The table data file couldn\'t be created.')
        })

        // Call python with 'heatmap-gsva'
        let pythonProcess = spawnPythonProcess('gsea_plot', ['heatmap-gsva', tmpFile.name, sizeX, sizeY, measurementUnit])

        pythonProcess.on('exit', (code) => {
            tmpFile.removeCallback()
            if (code == 0) {
                if (createOrUpdate == 'create') {
                    createPlotWindow(900, 800, 'heatmap-gsva', visibleRows)

                    tableWindow.webContents.send('plot-creation-complete')
                }
                else if (createOrUpdate == 'update')
                    globalThis.plotWindow?.webContents.send('plot-updated')
            }
        })
        popupOnProcessFail(pythonProcess)
    })

    ipcMain.removeAllListeners('request-dotplot')
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

        pythonProcess = spawnPythonProcess('gsea_plot', ['dotplot', tmpFile.name, sizeX, sizeY, measurementUnit])

        pythonProcess.on('exit', (code) => {
            // Remove the tmp file
            tmpFile.removeCallback()

            if (code == 0) {
                if (createOrUpdate == 'create') {
                    createPlotWindow(900, 800, 'dotplot', selectedColumnAndTerms)

                    tableWindow.webContents.send('plot-creation-complete')
                }
                else if (createOrUpdate == 'update')
                    // Send the update message only if plotWindow object is not null (.?)
                    globalThis.plotWindow?.webContents.send('plot-updated')
            }
        })

        popupOnProcessFail(pythonProcess)
    })

    ipcMain.removeAllListeners('request-heatmap')
    ipcMain.on('request-heatmap', (_event, selectedRows, sizeX, sizeY, measurementUnit, createOrUpdate) => {
        let pythonProcess = null

        pythonProcess = spawnPythonProcess('gsea_plot', ['heatmap', selectedRows, sizeX, sizeY, measurementUnit])

        pythonProcess.on('exit', (code) => {
            if (code == 0) {
                if (createOrUpdate == 'create') {
                    createPlotWindow(900, 800, 'heatmap', selectedRows)

                    tableWindow.webContents.send('plot-creation-complete')
                }
                else if (createOrUpdate == 'update')
                    // Send the update message just if plotWindow object is not null (.?)
                    globalThis.plotWindow?.webContents.send('plot-updated')
            }
        })

        popupOnProcessFail(pythonProcess)
    })

    ipcMain.removeAllListeners('request-iou-plot')
    ipcMain.on('request-iou-plot', (_event, selectedTerms, sizeX, sizeY, measurementUnit, createOrUpdate) => {
        let pythonProcess = null

        pythonProcess = spawnPythonProcess('gsea_plot', ['intersection-over-union', selectedTerms, globalThis.chosenGeneSetsPath, sizeX, sizeY, measurementUnit])

        pythonProcess.on('exit', (code) => {
            if (code == 0) {
                if (createOrUpdate == 'create') {
                    createPlotWindow(800, 600, 'iou-plot', selectedTerms)

                    tableWindow.webContents.send('plot-creation-complete')
                }
                else if (createOrUpdate == 'update')
                    // Send the update message just if plotWindow object is not null (.?)
                    globalThis.plotWindow?.webContents.send('plot-updated')
            }
        })

        popupOnProcessFail(pythonProcess)
    })

    ipcMain.removeAllListeners('request-wordcloud')
    ipcMain.on('request-wordcloud', (_event, selectedColumn, sizeX, sizeY, measurementUnit, createOrUpdate) => {
        // Create a tmp file
        const tmpFile = fileSync();

        // Write to the tmp file the selected column data
        // Needed since, most of the times, lead_gene data are too long to be passed as argument
        writeFileSync(tmpFile.name, selectedColumn, (err) => {
            if (err)
                error('The selected column data file couldn\'t be created.')
        })

        let pythonProcess = null

        pythonProcess = spawnPythonProcess('gsea_plot', ['wordcloud', tmpFile.name, sizeX, sizeY, measurementUnit])

        pythonProcess.on('exit', (code) => {
            // Remove the tmp file
            tmpFile.removeCallback()

            if (code == 0) {
                if (createOrUpdate == 'create') {
                    createPlotWindow(800, 600, 'wordcloud', selectedColumn)

                    tableWindow.webContents.send('plot-creation-complete')
                }
                else if (createOrUpdate == 'update')
                    // Send the update message just if plotWindow object is not null (.?)
                    globalThis.plotWindow?.webContents.send('plot-updated')
            }
        })

        popupOnProcessFail(pythonProcess)
    })

    ipcMain.removeAllListeners('request-heatmap-ssgsea')
    ipcMain.on('request-heatmap-ssgsea', (_event, visibleRows, sizeX, sizeY, measurementUnit, createOrUpdate) => {
        // Create a tmp file
        const tmpFile = fileSync();

        // Write to the tmp file the selected column data
        // Needed since, most of the times, lead_gene data are too long to be passed as argument
        writeFileSync(tmpFile.name, visibleRows, (err) => {
            if (err)
                error('The table data file couldn\'t be created.')
        })

        let pythonProcess = null

        pythonProcess = spawnPythonProcess('gsea_plot', ['heatmap-ssgsea', tmpFile.name, sizeX, sizeY, measurementUnit])

        pythonProcess.on('exit', (code) => {
            // Remove the tmp file
            tmpFile.removeCallback()

            if (code == 0) {
                if (createOrUpdate == 'create') {
                    createPlotWindow(900, 800, 'heatmap-ssgsea', visibleRows)
                    
                    tableWindow.webContents.send('plot-creation-complete')
                }
                else if (createOrUpdate == 'update')
                    // Send the update message just if plotWindow object is not null (.?)
                    globalThis.plotWindow?.webContents.send('plot-updated')
            }
        })

        popupOnProcessFail(pythonProcess)
    })

    ipcMain.removeAllListeners('request-gene-set-info')
    ipcMain.on('request-gene-set-info', (_event, selectedTerm) => {
        if (!existsSync(localPath('database', 'msigdb.db'))) {
            dialog.showMessageBox({
                message: 'The MSigDB file (msigdb.db) wasn\'t found.',
                type: 'error',
                title: 'Failure'
            })
        } else {
            let pythonProcess = null

            pythonProcess = spawnPythonProcess('gene_set_info', [selectedTerm, localPath('database', 'msigdb.db')])

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
        icon: localPath('icon', 'compass_1024px.png'),
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
                    error(`Temporary plot file ${PLOT_PATH + ext} cannot be deleted.`)
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
        icon: localPath('icon', 'compass_1024px.png'),
        webPreferences: {
            preload: localPath('preload', 'gene_set_info_preload')
        }
    })

    geneSetInfoWindow.webContents.on('did-finish-load', () => {
        geneSetInfoWindow.webContents.send('send-gene-set-data', geneSetInfo)
    })

    geneSetInfoWindow.loadFile(localPath('web', 'gene_set_info'))
}

// Function that creates a window to upload the MSigDB 
const createUploadMsigdbWindow = () => {
    const uploadMsigdbWindow = new BrowserWindow({
        width: 800,
        height: 350,
        icon: localPath('icon', 'compass_1024px.png'),
        webPreferences: {
            preload: localPath('preload', 'upload_msigdb_preload'),
        }
    })

    uploadMsigdbWindow.webContents.on('will-navigate', (e, url) => {
        e.preventDefault()
        shell.openExternal(url)
    })

    // When a MsigDB file is received
    ipcMain.removeAllListeners('send-msigdb')
    ipcMain.on('send-msigdb', (_event, msigdbPath) => {

        // Copy the MsigdDB file into the safe user data directory
        copyFile(msigdbPath, localPath('database', 'msigdb.db'), (err) => {
            if (err) {
                error(`\n========================\n
                         Error: The MsgiDB couldn't be copied in the GSEACompss directory. \n
                         Error description: ${err}
                       \n========================\n`)

                dialog.showMessageBox({
                    message: 'The provided MsgiDB file couldn\'t be copied in the GSEACompss directory',
                    type: 'error',
                    title: 'MsigDB upload failure'
                })
            }
            else {
                uploadMsigdbWindow.close()
                createMainWindow()
            }
        })
    })

    uploadMsigdbWindow.loadFile(localPath('web', 'upload_msigdb'))


}

// Define and apply the menu template
const menuTemplate = [
    {
        label: 'Options',
        submenu: [{
            label: 'Update MSigDB from local',
            click() {
                // Delete the current MSigDB file from the user data folder
                unlink(localPath('database', 'msigdb.db'), (err) => {
                    if (err)
                        error(`\n========================\n
                                 Warning: The file ${localPath('database', 'msigdb.db')} couldn't be deleted. 
                               \n========================\n`)
                })

                // Close all windows except the upload MSigDB one
                BrowserWindow.getAllWindows().forEach(win => {win.close()})

                // Show the upload MSigDB window
                createUploadMsigdbWindow()
            }
        }]
    },
    {
        label: 'About',
        submenu: [
            {
                label: 'GitHub repository',
                click() {
                    shell.openExternal('https://github.com/DEIB-GECO/GSEACompass')
                }
            },
            {
                label: 'Third-party licenses',
                click() {
                    const licenseWindow = new BrowserWindow({
                        width: 800,
                        height: 600,
                        icon: localPath('icon', 'compass_1024px.png')
                    })
                    licenseWindow.loadFile('NOTICE.md')
                }
            }]
    },
    {
        label: 'Help',
        submenu: [
            {
                label: 'Documentation',
                click() {
                    shell.openExternal('https://gseacompass.gitbook.io/user-manual/')
                }
            },
            {
                label: 'Report an issue',
                click() {
                    shell.openExternal('https://github.com/DEIB-GECO/GSEACompass/pulls')
                }
            }
        ]
    },
    // Uncomment to add a "Toggle Developer Tools" option in the menu (for debugging purposes)
    // {
    //     label: 'Toggle Developer Tools',
    //     click(item, focusedWindow) {
    //         if (focusedWindow)
    //             focusedWindow.webContents.toggleDevTools()
    //     }
    // }
]
Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate))


app.disableHardwareAcceleration()

// Needed for Windows Squirrel package
if (require('electron-squirrel-startup'))
    app.quit()

app.whenReady().then(() => {
    // If the MSigDB exists, show the main window, otherwise show the upload MSigDB window
    // Now safely checking the 'database' route in the user directory
    if (existsSync(localPath('database', 'msigdb.db')))
        createMainWindow()
    else
        createUploadMsigdbWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0)
            createMainWindow()
    })
})

app.on('window-all-closed', () => {
    // Delete the python session file, if it exists
    // Only in non-macOS enviroments, since in macOS it's common for apps to stay active even without windows
    if (process.platform !== 'darwin') {
        if (existsSync(join(HOME_DIR, 'gseacompass_python_session.pkl'))) {
            unlink(join(HOME_DIR, 'gseacompass_python_session.pkl'), (err) => {
                if (err)
                    error(`\n========================\n
                            Warning: The file ${join(HOME_DIR, 'gseacompass_python_session.pkl')} exists but couldn't be deleted. 
                           \n========================\n`)
            })
        }

        app.quit()
    }
})