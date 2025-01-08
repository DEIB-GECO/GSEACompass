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

// Behavior when plot data received
window.electronAPI.onReceviedData((plotType, plotArg, plotPath) => {
    img.src = plotPath + '.png'

    savePngHiddenAnchor.href = plotPath + '.png'
    savePdfHiddenAnchor.href = plotPath + '.pdf'
    saveSvgHiddenAnchor.href = plotPath + '.svg'

    // Hide SVG save button for wordcloud plot, since it's not supported
    if (plotType == 'wordcloud')
        saveSvgButton.style.display = 'none'

    // Update the plot size when update button clicked
    updateSizeButton.addEventListener('click', () => {
        // If the inputs are not empty
        if (xSize.value != '' && ySize.value != '') {
            window.electronAPI.changePlotSize(plotType, plotArg, xSize.value, ySize.value, measurementUnit.value)

            // Needed to update the image after being re-generated
            // otherwise, because of cache, the same would be shown
            window.electronAPI.onPlotUpdated(() => {
                const timestamp = new Date().getTime()
                img.src = plotPath + '.png?t=' + timestamp
            })
        }
    })
})