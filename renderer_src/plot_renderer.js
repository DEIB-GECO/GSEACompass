const elem = document.getElementById('panzoom-img')

const panzoom = Panzoom(elem, {
  maxScale: 3
})

panzoom.pan(10, 10)
panzoom.zoom(1, { animate: true })

elem.parentElement.addEventListener('wheel', panzoom.zoomWithWheel)