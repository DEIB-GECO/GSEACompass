const msigdbObj = document.querySelector('#msigdb')
const submitBtn = document.querySelector('#submit')

submitBtn.addEventListener('click', (_event) => {
    const msigdbPath = msigdbObj.files[0]

    window.electronAPI.sendMsigdb(msigdbPath)
})
