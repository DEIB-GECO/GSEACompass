const img = document.querySelector('#panzoom-img')
const zoomInButton = document.querySelector('#zoom-in-btn')
const zoomOutButton = document.querySelector('#zoom-out-btn')
const xSize = document.querySelector('#x-size')
const ySize = document.querySelector('#y-size')
const measurementUnit = document.querySelector('#measurement-unit')
const updateSizeButton = document.querySelector('#update-size-btn')
const savePngButton = document.querySelector('#save-png-btn')
const savePdfButton = document.querySelector('#save-pdf-btn')
const saveSvgButton = document.querySelector('#save-svg-btn')
const savePngHiddenAnchor = document.querySelector('#save-png-hidden-anchor')
const savePdfHiddenAnchor = document.querySelector('#save-pdf-hidden-anchor')
const saveSvgHiddenAnchor = document.querySelector('#save-svg-hidden-anchor')

// Set up save buttons
savePngButton.addEventListener('click', () => {
    savePngHiddenAnchor.click()
})
savePdfButton.addEventListener('click', () => {
    savePdfHiddenAnchor.click()
})
saveSvgButton.addEventListener('click', () => {
    saveSvgHiddenAnchor.click()
})

// Create and set up Panzoom
const panzoom = Panzoom(img, { maxScale: 3 })
panzoom.pan(10, 10)
panzoom.zoom(1, { animate: true })

// Bind zoom event to mouse wheel and zoomin/zoomout buttons click
img.parentElement.addEventListener('wheel', panzoom.zoomWithWheel)

zoomInButton.addEventListener('click', () => {
    panzoom.zoomIn()
})

zoomOutButton.addEventListener('click', () => {
    panzoom.zoomOut()
})

// Listen for plot data received
window.electronAPI.onReceviedData((plotType, plotArg, plotPath) => {
    const imageContainer = document.querySelector('#image-container');
    const iframePlot = document.querySelector('#interactive-plot');
    const controlsContainer = document.querySelector('#controls-container');

    if (plotType === 'similarity-graph') {
        // Show interactive HTML, hide static tools
        imageContainer.style.display = 'none';
        controlsContainer.style.display = 'none';
        iframePlot.style.display = 'block';
        iframePlot.src = plotPath + '.html';
    } else {
        // Standard static plot setup
        imageContainer.style.display = 'block';
        controlsContainer.style.display = 'block';
        iframePlot.style.display = 'none';
        
        img.src = plotPath + '.png'

        savePngHiddenAnchor.href = plotPath + '.png'
        savePdfHiddenAnchor.href = plotPath + '.pdf'
        saveSvgHiddenAnchor.href = plotPath + '.svg'

        if (plotType == 'wordcloud')
            saveSvgButton.style.display = 'none'
        else
            saveSvgButton.style.display = 'block'

        // Set up the update size listener
        updateSizeButton.onclick = () => {
            if (xSize.value != '' && ySize.value != '') {
                window.electronAPI.changePlotSize(plotType, plotArg, xSize.value, ySize.value, measurementUnit.value)
                window.electronAPI.onPlotUpdated(() => {
                    const timestamp = new Date().getTime()
                    img.src = plotPath + '.png?t=' + timestamp
                })
            }
        }
    }
})