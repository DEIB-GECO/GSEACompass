const img = document.querySelector('#panzoom-img')
const zoomInButton = document.querySelector('#zoom-in-btn')
const zoomOutButton = document.querySelector('#zoom-out-btn')
const xSize = document.querySelector('#x-size')
const ySize = document.querySelector('#y-size')
const updateSizeButton = document.querySelector('#update-size-btn')
const saveButton = document.querySelector('#save-btn')
const saveHiddenAnchor = document.querySelector('#save-hidden-anchor')

// Set up save button
saveButton.addEventListener('click', () => {
    saveHiddenAnchor.click()
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
window.electronAPI.onReceviedData((plotType, plotArgs) => {
    // Update the plot size when update button clicked
    updateSizeButton.addEventListener('click', () => {
        if (xSize.value != '' && ySize.value != '') {
            window.electronAPI.changePlotSize(plotType, plotArgs, xSize.value, ySize.value)

            // Needed to update the image after being re-generated
            // otherwise, because of cache, the same would be shown
            window.electronAPI.onPlotUpdated(() => {
                const timestamp = new Date().getTime()
                img.src = img.src + '?t=' + timestamp
            })
        }
    })
})