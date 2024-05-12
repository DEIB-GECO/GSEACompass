const img = document.querySelector('#panzoom-img')
const zoomInButton = document.querySelector('#zoom-in');
const zoomOutButton = document.querySelector('#zoom-out');

// Create and set up Panzoom
const panzoom = Panzoom(img, { maxScale: 3 })
panzoom.pan(10, 10)
panzoom.zoom(1, { animate: true })

// Bind zoom event to mouse wheel and zoomin/zoomout buttons click
img.parentElement.addEventListener('wheel', panzoom.zoomWithWheel)

zoomInButton.addEventListener('click', () => {
  panzoom.zoomIn();
})

zoomOutButton.addEventListener('click', () => {
  panzoom.zoomOut();
})