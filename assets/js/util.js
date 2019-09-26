

const jsonPath = "/assets/json/"
const jsPath = "/assets/js/"
const difficultyJSON = jsonPath + "maps.json";
const headerJSON = jsonPath + "header.json";


const TROPHY = {
	"gold": '🏆',
	"silver": '🥈',
	"bronze": '🥉'
}

var jumpBinds = ["bind", "nobind", "both"];
const JUMPSTATSKEY = {
	1: "longjump",
	2: "bhop",
	3: "multihop",
	4: "weirdjump",
	5: "dropbhop",
	6: "countjump",
	7: "ladder",
}
const TIERKEY = {
	"0": ["Not Global", "white"],
	"1": ["Very Easy", "lightgreen"],
	"2": ["Easy", "green"],
	"3": ["Medium", "dodgerblue"],
	"4": ["Hard", "orange"],
	"5": ["Very Hard", "red"],
	"6": ["Death", "black"]

}
var serverIDRequest = "https://kztimerglobal.com/api/v1.0/servers/";


function getHeaderArray() {
	//var header = {};
	$.getJSON(headerJSON, function (data) {
		//header = data;
	}); //end json
	//return header;

}
function getDifficultyArray(difficultyArray) {

	$.ajax({
		url: difficultyJSON,
		dataType: 'json',
		async: false,
		data: difficultyArray,
		success: function (data) {
			var mapKeys = {
				"Map": 0,
				"Tier": 1,
				"Pro Tier": 2,
				"Length": 3,
			}

		$.each(data, function (i, field) {
			//if (i == 0) return true;
			tier = field[mapKeys["Tier"]];
			protier = field[mapKeys["Pro Tier"]];
			length = field[mapKeys["Length"]];
			difficultyArray[field[mapKeys["Map"]]] = [tier, protier, length];
		});

		}
	});


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

function isValidStat(stat) {
	for (key in JUMPSTATSKEY)
		if (JUMPSTATSKEY[key] === stat)
			return true;

	return false;
}

function isValidBind(bind) {
	return jumpBinds.includes(bind);
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
function sanitizeName(name) {
	return name.replace(/<\/?[^>]+(>|$)/g, "");
}

function genTable(container, maps, header, filterArray, myColumns, initialSort) {

	colWidth = 1000;
	initialSort = initialSort || 0;
	//var narrowHeaders = ["time","tier", "length"];
	var wideHeaders = ["map", "server", "date"];


	function isNarrowHeader(myHeader) {
		//see if it's a narrow input field
		return !(new RegExp(wideHeaders.join("|")).test(myHeader));
	}

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

		var curHeader = header[colIndex].trim().toLowerCase();

		if (isNarrowHeader(curHeader)) {
			$(input).css('width', '4.5em');
		}

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


	sortConfig = initialSort || {
		column: 0,
		sortOrder: "asc"
	}


	//$(container).parent().prepend($checkboxContainer)

	var mapTable = new Handsontable(container, {
		data: maps,
		height: 1000,
		width: colWidth,
		colHeaders: header,
		columns: myColumns,
		columnSorting: true,
		columnSorting: {
			initialConfig: sortConfig
		},
		manualColumnResize: true,
		filters: true,
		hiddenColumns: {
			indicators: true,
			columns: [] //hide pro teleports by default
		},
		className: 'typefilter',
		afterGetColHeader: addInput,
		beforeOnCellMouseDown: doNotSelectColumn,
		licenseKey: 'non-commercial-and-evaluation'
	});

	let $checkboxContainer = $('<div class="checkboxContainer innerSelection"></div>');
	$(".checkboxContainer").remove();


	for (let i = 1; i < header.length; i++) {
		let curHeader = header[i];
		let id = curHeader.replace(/\s+/g, '-').toLowerCase() + '-checkbox';

		$checkboxContainer.append(`<div style="display: inline; margin: 0 10px"><input class='${container.id + "-checkbox"}' name="${header[i]}" type="checkbox" id="${id}" checked> <b>${curHeader}</b></div>`);
		//$(container).parent().prepend(`<input type="checkbox" id="${id}" checked> ${curHeader}`);
		$(container).parent().prepend($checkboxContainer);
		$("#" + id).change(function () {

			var hidden = [];
			$("." + container.id + "-checkbox").each(function () {

				var curIndex = header.indexOf(this.name);

				if (!this.checked)
					hidden.push(curIndex);

			});

			mapTable.updateSettings({
				hiddenColumns: {
					indicators: false,
					columns: hidden
				}
			});

		});
	}


	first = false;
	return mapTable;

}