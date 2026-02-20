const gseaPrerankedBtn = document.querySelector('#gsea-preranked')
const gseaBtn = document.querySelector('#gsea')
const ssgseaBtn = document.querySelector('#ssgsea')
const lastResultsBtn = document.querySelector('#last-results')

gseaPrerankedBtn.addEventListener('click', _event => {
    window.electronAPI.openGseaPreranked()
})

gseaBtn.addEventListener('click', _event => {
    window.electronAPI.openGsea()
})

ssgseaBtn.addEventListener('click', _event => {
    window.electronAPI.openSsgsea()
})