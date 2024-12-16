const geneSetsObj = document.querySelector("#gene_sets")
const numPermutationsObj = document.querySelector("#num_permutations")
const rankedListObj = document.querySelector("#ranked_list")
const chipObj = document.querySelector("#chip")
const submitBtn = document.querySelector("#submit")

submitBtn.addEventListener("click", (event) => {
    const geneSetsPath = geneSetsObj.files[0]
    const numPermutations = numPermutationsObj.value
    const rankedListPath = rankedListObj.files[0]
    const remapOption = document.querySelector('[name="remap"]:checked').value
    const chipPath = chipObj.files[0]

    window.electronAPI.sendDataPreranked(geneSetsPath, numPermutations, rankedListPath, remapOption, chipPath)
})

const showHelper = (helpString) => window.electronAPI.showHelperPopup(helpString)