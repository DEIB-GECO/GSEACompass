const geneSetsObj = document.querySelector('#gene_sets')
const datasetObj = document.querySelector('#data_set')
const minSizeObj = document.querySelector('#min_gene_set')
const maxSizeObj = document.querySelector('#max_gene_set')
const submitBtn = document.querySelector('#submit')
const backBtn = document.querySelector('#back')

submitBtn.addEventListener('click', (_event) => {
    const geneSetsPath = geneSetsObj.files[0]
    const datasetPath = datasetObj.files[0]
    const minSize = minSizeObj.value
    const maxSize = maxSizeObj.value

    window.electronAPI.sendDataSsgsea(geneSetsPath, datasetPath, minSize, maxSize)
})

backBtn.addEventListener('click', (_event) => {
    window.electronAPI.goBackToHome()
})

const showHelper = (helpString) => window.electronAPI.showHelperPopup(helpString)
