
var jumpLimit = 10,
	jumpMin = 100;

var serverIDRequest = "https://kztimerglobal.com/api/v1.0/servers/";
var requestURLBase = "https://kztimerglobal.com/api/v1.0/jumpstats?";
var requestSteamID = "steam_id=";
var requestJumpType = "&jumptype=";
var requestLimit = "&limit=" + jumpLimit;
var requestMinimum = "&greater_than_distance=" + jumpMin;

var requestBind = "&is_crouch_bind=";
var first = true;
var mapTable;


function getDifficultyArray() {
	difficultyArray = {};
	var mapKeys = {
		"Map": 0,
		"Tier": 1,
		"Pro Tier": 2,
		"Length": 3,
	}
	$.getJSON("maps.json", function (data) {

		$.each(data, function (i, field) {
			if (i == 0) return true;
			tier = field[mapKeys["Tier"]];
			protier = field[mapKeys["Pro Tier"]];
			length = field[mapKeys["Length"]];
			difficultyArray[field[mapKeys["Map"]]] = [tier, protier, length];
		});

	}); //end json

	return difficultyArray;
}
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
	document.body.getElementsByClassName("table-container")[0].appendChild(table);
}


function getServerName(serverID) {
	serverReq = serverIDRequest + serverID;
	var temp = $.ajax({
		url: serverReq,
		async: false,
	});//.responseText;
	var serverName = "N/A";
	if (typeof temp !== 'undefined') {
		if (temp.responseText !== "")
			serverName = JSON.parse(temp.responseText)["name"];
	}
	return serverName;
}
/*
* returns true if steamID is valid
* does not assumed whitespace trimmed string
*/
function isValidSteamID(steamID) {
	return /^STEAM_[0-5]:[01]:\d+$/.test(steamID);
}
function getURIVars() {
	var vars = {};
	var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
		vars[key] = value;
	});
	return vars;
}

function getTimeFromSeconds(seconds) {
	var hours = Math.floor(seconds / 3600);

	if (hours < 10)
		hours = "0" + hours;

	seconds -= hours * 3600;

	var min = Math.floor(seconds / 60);

	if (min < 10)
		min = "0" + min;

	seconds -= min * 60;

	seconds = seconds.toFixed(2);
	if (seconds < 10)
		seconds = "0" + seconds

	return hours + ":" + min + ":" + seconds;
}


function genTable(container, maps, header, filterArray, myColumns, colWidth) {

	colWidth = colWidth || 1000;
	var debounceFn = Handsontable.helper.debounce(function (colIndex, event) {
		var filtersPlugin = mapTable.getPlugin('filters');

		filtersPlugin.removeConditions(colIndex);
		filtersPlugin.addCondition(colIndex, 'contains', [event.realTarget.value]);
		filtersPlugin.filter();
	}, 200);

	var addEventListeners = function (input, colIndex) {
		input.addEventListener('keydown', function (event) {
			debounceFn(colIndex, event);
		});
	};

	// Build elements which will be displayed in header.
	var getInitializedElements = function (colIndex) {
		var div = document.createElement('div');
		var input = document.createElement('input');

		div.className = 'filterHeader';

		addEventListeners(input, colIndex);

		div.appendChild(input);

		return div;
	};

	// Add elements to header on `afterGetColHeader` hook.
	var addInput = function (col, TH) {
		// Hooks can return value other than number (for example `columnSorting` plugin use this).
		if (typeof col !== 'number') {
			return col;
		}

		if (TH.childElementCount < 2) {

			for (i = 0; i < filterArray.length; i++) {
				if (col == filterArray[i]) {
					TH.appendChild(getInitializedElements(col));
				}
			}
		}
	};

	// Deselect column after click on input.
	var doNotSelectColumn = function (event, coords) {
		if (coords.row === -1 && event.realTarget.nodeName === 'INPUT') {
			event.stopImmediatePropagation();
			this.deselectCell();
		}
	};

	if (!first) {
		mapTable.destroy();
	}

		mapTable = new Handsontable(container, {
			data: maps,
			height: 1000,
			width: colWidth,
			colHeaders: header,
			columns: myColumns,
			columnSorting: true,
			filters: true,
			dropdownMenu: ["filter_by_value", "filter_action_bar"],
			contextMenu: ['hidden_columns_hide', 'hidden_columns_show'],
			hiddenColumns: {
				indicators: false,
				columns: [] //hide pro teleports by default
			},
			className: 'typefilter',
			afterGetColHeader: addInput,
			beforeOnCellMouseDown: doNotSelectColumn,
			licenseKey: 'non-commercial-and-evaluation'
		});
	//FIX: problem with old table and event listeners not clearing when requesting new times
	/*
		var originalColWidths = [];
		var colWidths = [];
		var inputs;
	
		inputs = document.querySelectorAll('input.toggle');
	
		for (var i = 0; i < inputs.length; i++) {
			(function (input) {
	
					input.addEventListener('click', function () {
						toggleColumnAt(parseInt(input.dataset.column, 10));
					});
			}(inputs[i]));
		}
	
		toggleColumnAt = function (column) {
			if (colWidths[column] === 0.1) {
				colWidths[column] = originalColWidths[column];
			} else {
				colWidths[column] = 0.1;
			}
			mapTable.updateSettings({ colWidths: colWidths });
		};
	
		for (var i = 0, l = inputs.length; i < l; i++) {
			originalColWidths.push(mapTable.getColWidth(i));
		}
		colWidths = originalColWidths.slice();
	
		*/

		$("#table-tips").text("Click on any column to sort. Left click to hide. You can filter maps by typing in the filter bar.")
	first = false;
	return mapTable;

}