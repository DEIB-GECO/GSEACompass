window.electronAPI.onReceivedData((rawJsonData) => {
    const jsonData = JSON.parse(rawJsonData)

    for (const [key, value] of Object.entries(jsonData)) {
        const node = document.querySelector('#' + key)
        let text = ''

        if (value == null || value === '')
            text = 'no data'
        else
            text = value

        if (Array.isArray(text))
            text = text.join(', ')

        if (node.nodeName == 'A' && text != 'no data')
            node.href = text

        node.innerText = text
    }

    document.querySelector('#title').innerText = jsonData['standard_name']

})