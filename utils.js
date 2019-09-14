
				function createTable(tableData, headerArray) {
					var tables = document.getElementsByTagName("table");
					for (var i = tables.length - 1; i >= 0; i -= 1)
						if (tables[i]) tables[i].parentNode.removeChild(tables[i]);

					var table = document.createElement('table');
					var tableBody = document.createElement('tbody');

					var headerRow = document.createElement('tr');
					for (var header in headerArray) {
						var cell = document.createElement('th');

						cell.appendChild(document.createTextNode(headerArray[header]));
						headerRow.appendChild(cell);

					}
					tableBody.appendChild(headerRow);
					tableData.forEach(function (rowData) {
						var row = document.createElement('tr');


						rowData.forEach(function (cellData) {
							var cell = document.createElement('td');
							cell.appendChild(document.createTextNode(cellData));
							row.appendChild(cell);
						});

						tableBody.appendChild(row);
					});

					table.appendChild(tableBody);
					document.body.getElementsByClassName("center")[0].appendChild(table);
				}
