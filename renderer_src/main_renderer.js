const geneSetsObj = document.querySelector("#gene_sets")
const numPermutationsObj = document.querySelector("#num_permutations")
const rankedListObj = document.querySelector("#ranked_list")
const chipObj = document.querySelector("#chip")
const submitBtn = document.querySelector("#submit")

const log = document.querySelector("#log")

submitBtn.addEventListener("click", (event) => {
    const geneSetsPath = geneSetsObj.files[0].path
    const numPermutations = numPermutationsObj.value
    const rankedListPath = rankedListObj.files[0].path
    const collapseRemapOption = document.querySelector('[name="collaps_remap"]:checked').value
    const chipPath = chipObj.files[0].path

    window.electronAPI.sendDataPreranked(geneSetsPath, rankedListPath, chipPath)
})
