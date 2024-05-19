const gseaPrerankedBtn = document.querySelector('#gsea-preranked')
const gseaBtn = document.querySelector('#gsea')
const lastResultsBtn = document.querySelector('#last-results')

gseaPrerankedBtn.addEventListener('click', _event => {
    console.log('preranked')
    window.electronAPI.openGseaPreranked()
})

gseaBtn.addEventListener('click', _event => {
    console.log('gsea')
    window.electronAPI.openGsea()
})