const geneSetsObj = document.querySelector('#gene_sets')
const numPermutationsObj = document.querySelector('#num_permutations')
const minGeneSetObj = document.querySelector('#min_gene_set')
const maxGeneSetObj = document.querySelector('#max_gene_set')
const expressionSetObj = document.querySelector('#expression_set')
const phenotypeLabelsObj = document.querySelector('#phenotype_labels')
const chipObj = document.querySelector('#chip')
const submitBtn = document.querySelector('#submit')

submitBtn.addEventListener('click', (_event) => {
    const geneSetsPath = geneSetsObj.files[0]
    const numPermutations = numPermutationsObj.value
    const minGeneSet = minGeneSetObj.value
    const maxGeneSet = maxGeneSetObj.value
    const expressionSet = expressionSetObj.files[0]
    const phenotypeLabels = phenotypeLabelsObj.files[0]
    const remapOption = document.querySelector('[name="remap"]:checked').value
    const chipPath = chipObj.files[0]

    console.log(geneSetsPath, numPermutations, minGeneSet,maxGeneSet,expressionSet, phenotypeLabels, remapOption, chipPath)

    window.electronAPI.sendDataGsea(geneSetsPath, numPermutations,minGeneSet,maxGeneSet, expressionSet, phenotypeLabels, remapOption, chipPath)
})

const showHelper = (helpString) => window.electronAPI.showHelperPopup(helpString)