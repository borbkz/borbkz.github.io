
var jumpLimit = 10,
	jumpMin = 100;

var serverIDRequest = "https://kztimerglobal.com/api/v1.0/servers/";
var requestURLBase = "https://kztimerglobal.com/api/v1.0/jumpstats?";
var requestSteamID = "steam_id=";
var requestJumpType = "&jumptype=";
var requestLimit = "&limit=" + jumpLimit;
var requestMinimum = "&greater_than_distance=" + jumpMin;

var requestBind = "&is_crouch_bind=";



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

