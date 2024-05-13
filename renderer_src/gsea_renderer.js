const geneSetsObj = document.querySelector("#gene_sets")
const numPermutationsObj = document.querySelector("#num_permutations")
const expressionSetObj = document.querySelector("#expression_set")
const phenotypeLabelsObj = document.querySelector("#phenotype_labels")
const chipObj = document.querySelector("#chip")
const submitBtn = document.querySelector("#submit")

submitBtn.addEventListener("click", (_event) => {
    const geneSetsPath = geneSetsObj.files[0].path
    const numPermutations = numPermutationsObj.value
    const expressionSet = expressionSetObj.files[0].path
    const phenotypeLabels = phenotypeLabelsObj.files[0].path
    const remapOption = document.querySelector('[name="remap"]:checked').value
    const chipPath = chipObj.files[0] != null ? chipObj.files[0].path : null

    window.electronAPI.sendDataGsea(geneSetsPath, numPermutations, expressionSet, phenotypeLabels, remapOption, chipPath)
})
