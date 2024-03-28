function createTable(jsonData, containerSelector) {
    const table = document.createElement('table');
    const tableHead = document.createElement('thead');
    const tableBody = document.createElement('tbody');

    table.id = "dataTable"

    // Append the table head and body to table
    table.appendChild(tableHead);
    table.appendChild(tableBody);

    // Creating table head
    let row = tableHead.insertRow();
    Object.keys(jsonData[0]).forEach(key => {
        let th = document.createElement('th');
        th.textContent = key.toUpperCase();
        row.appendChild(th);
    });

    // Creating table body
    jsonData.forEach(item => {
    let row = tableBody.insertRow();
        Object.values(item).forEach(value => {
            let cell = row.insertCell();
            cell.textContent = value;
        });
    });

    // Append the table to the HTML document
    document.querySelector(containerSelector).appendChild(table);
}

window.electronAPI.requestJsonData()

window.electronAPI.onJsonData((rawJsonData) => {
    jsonData = JSON.parse(rawJsonData)

    createTable(jsonData, "#dataDiv")

    let table = new DataTable('#dataTable', {});
})
