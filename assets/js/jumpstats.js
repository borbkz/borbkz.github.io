
//over 20 violates CORS wtf
var jumpLimit = 20,
	jumpMin = 100,
	jumpMax = 290;
var requestSteamID = "steam_id=";
var requestJumpType = "jumptype=";
var requestLimit = "limit=";
var requestMaximum = "less_than_distance=";

var requestBoost = "is_crouch_boost=";
//two different ways of getting top jumpstats, using /jumpstat/jumpstattype/ seems to root out cheated stats
var jumpstatsPBURLBase = "https://kztimerglobal.com/api/v1.0/jumpstats?";
var jumpstatsGlobalURLBase = "https://kztimerglobal.com/api/v1.0/jumpstats/";
var globalTable;
var personalTable;
var steamID = "";

var inputTip = "Enter Your SteamID"

var whitelist;

//global jumpstat names are not necessarily the same
//ex: ladder vs ladderjump
//translation table 
//jumpstat: [max limit, global jumpstat name]
var jumpstatTable = {
	longjump: [295, "longjump"],
	bhop: [360, "bhop"],
	multihop: [370, "multibhop"],
	dropbhop: [350, "dropbhop"],
	weirdjump: [310, "weirdjump"],
	ladder: [215, "ladderjump"],
	countjump: [315, "countjump"]
}

var topstats = {};
function createTable(tableData, headerArray, tableContainer) {
	var tables = document.getElementsByTagName("table");
	for (var i = tables.length - 1; i >= 0; i -= 1)
		if (tables[i]) tables[i].parentNode.removeChild(tables[i]);

	var table = document.createElement('table');

	var tableBody = document.createElement('tbody');

	var headerRow = document.createElement('tr');
	for (var header in headerArray) {

		if (headerArray[header] !== "Steam ID") {


			var cell = document.createElement('th');

			cell.appendChild(document.createTextNode(headerArray[header]));
			headerRow.appendChild(cell);
		}

	}
	tableBody.appendChild(headerRow);
	tableData.forEach(function (rowData) {
		var row = document.createElement('tr');


		var i = 0;
		var steamID = "";
		rowData.forEach(function (cellData) {
			var cell = document.createElement('td');

			if (i == 0) {
				// don't show steamID
				steamID = cellData;
			} else if (i == 1) {
				var queryString = "/local?steamid=" + steamID + "&teleports=false";
				//player link
				$(cell).html(`<a style="color: black" href="${queryString}"><u>${cellData}</u></a>`)

				row.appendChild(cell);
			} else if (i == 2) {
				//verification
				var cellText = "";
				if (cellData === "true") {

					cellText = '<span style="color: green; font-weight:bold">\u2713 </span>';
				} else if (cellData === "false") {

					cellText = '<span style="color: red; font-weight:bold">\u2717 </span>';
				} else {
					cellText = cellData;

				}
				$(cell).html(cellText);
			}
			else {
				cell.appendChild(document.createTextNode(cellData));

				row.appendChild(cell);
			}

			if (i != 0) {
				row.appendChild(cell);

			}
			i++;
		});

		tableBody.appendChild(row);
	});

	table.appendChild(tableBody);
	tableContainer.appendChild(table);
}
$(document).ready(function () {
	var header = ["Steam ID", "Player", "Verification", "Jump Type", "Distance", "Strafe Count", "Crouch Boost", "Date", "Server"];


	var localContainer = $("#localJumpstatsContainer")[0];
	var globalContainer = $("#globalJumpstatsContainer")[0];

	$.getJSON(jsonPath + "jumpstats_whitelist.json",
		function (data) {
			whitelist = data;

		}
	);

	URI = getURIVars();
	if (typeof URI["steamid"] !== 'undefined' && typeof URI["jumptype"] !== 'undefined') {
		steamID = URI["steamid"];
		jumptype = URI["jumptype"];
		if (isValidSteamID(steamID) && isValidStat(jumptype)) {

			$('#steamIDText').val(steamID);
			if (isValidStat(URI["jumptype"]))
				jumptype = URI["jumptype"];


			$("#" + jumptype + "Radio").click();


			//$("#expand-personal-jumpstats").click(); //autoexpand if url linked by steamid
			retrieveStats(getRequestURL(steamID, jumptype, "both"), localContainer, false);
		}

	} else if (localStorage.getItem(STEAMID_PERSISTENT) !== null) {
		$('#steamIDText').val(localStorage.getItem(STEAMID_PERSISTENT));
	}


	function isSteamIDEqual(steamID1, steamID2) {
		return getSteamIDSubstring(steamID1) === getSteamIDSubstring(steamID2);
	}
	function getSteamIDSubstring(steamID) {
		if (isValidSteamID(steamID))
			return steamID.substring(steamID.lastIndexOf(":") + 1);
		else
			return "";

	}

	function retrieveStats(requestURL, container, global) {

		$.getJSON(requestURL, function (data) {

			if (data.length == 0) {
				alert("No Stats Obtained");
				return true;
			}
			var jumpstats = [];
			var servers = {};
			var highestStat = 0;
			var playerName = sanitizeName(data[0]["player_name"]);
			var isbinded = $('input[name=bind]:checked').val();
			var jumpstatType = JUMPSTATSKEY[data[0]["jump_type"]];
			if (isbinded === "both")
				isbinded = "";

			var first = true;
			$.each(data, function (i, field) {

				var server = "N/A";
				var serverID = field["server_id"];
				var player = sanitizeName(field["player_name"]);

				var steam_id = sanitizeName(field["steam_id"]);
				var uniq_id = getSteamIDSubstring(steam_id);
				var distance = field["distance"];

				//filter out any non-whitelisted WR's

				if (first && global) {

					if (uniq_id in whitelist) {

						player = TROPHY["gold"] + " " + whitelist[uniq_id] + " " + TROPHY["gold"];
						first = false;
					} else {
						return true;
					}

				} else if (!first && global) {
					if (uniq_id in whitelist)
						player = whitelist[uniq_id];

				}

				if (serverID in servers) {
					server = servers[serverID];
				} else {

					server = getServerName(serverID);
					servers[serverID] = server.substring(0, 25);

				}
				var statRow = [steam_id, player, "N/A", jumpstatType,
					distance, field[
					"strafe_count"],
					field["is_crouch_boost"] ? "Yes" : "No", field[
					"created_on"],
					server
				];


				if (!global) {
					$("#jumpstat-tip").css("visibility", "hidden");
					if (jumpstats.length < 10) {
						jumpstats.push(statRow);

					}
				} else if (jumpstats.length < 10) {

					$("#jumpstat-tip").css("visibility", "visible");
					if (uniq_id in whitelist) {
						statRow[2] = "true";

						if (distance > highestStat)
							highestStat = distance;
						jumpstats.push(statRow);
					} else {
						//if not in whitelist but not WR either...
						if (distance < highestStat || highestStat == 0) {
							statRow[2] = "false";
							jumpstats.push(statRow);
						}

					}
				}
			});


			$("#steamButton").attr('value', 'Fetch Stats');
			$("#globalJumpstatsButton").attr('value', 'Fetch Stats');
			createTable(jumpstats, header, container)

		}); //end json
	}

	$("#steamButton").click(function () {

		var steamID = $('#steamIDText').val().trim();

		if (steamID !== inputTip && !isValidSteamID(steamID)) {
			alert("Please enter a valid Steam ID or leave empty to fetch global jumpstats!");
			return;
		}
		jumpstatType = $('input[name=jumpstat]:checked').val();
		isbinded = $('input[name=bind]:checked').val();


		$(this).attr('value', 'Fetching...');
		window.history.pushState("object or string", "Title", "?steamid=" + steamID + "&jumptype=" + jumpstatType);;

		localStorage.setItem("jumpstatSteamID", steamID)
		localStorage.setItem("jumpstatType", jumpstatType)
		localStorage.setItem("jumpstatBinded", isbinded)

		retrieveStats(getRequestURL(steamID, jumpstatType, isbinded), localContainer, false);
	});
	$("#globalJumpstatsButton").click(function () {


		jumpstatType = $('input[name=globalJumpstat]:checked').val();
		isbinded = $('input[name=globalBind]:checked').val();

		$(this).attr('value', 'Fetching...');

		retrieveStats(getRequestURL("", jumpstatType, isbinded), globalContainer, true);
	});

	function getRequestURL(steamID, jumpstatType, binded, reqLimit) {
		if (typeof reqLimit === "undefined")
			reqLimit = jumpLimit;

		var requestBindURI = requestBoost + "false";
		var globalRequestBindURI = "";
		if (binded === "both") {
			requestBindURI = "";
		} else if (binded === "binded") {
			requestBindURI = requestBoost + "true";
			globalRequestBindURI = "is_crouch_boost=true&";
		} else {
			globalRequestBindURI = "is_crouch_boost=false&";
		}

		if (jumpstatType === "ladder") {
			requestBindURI = requestBoost + "false";
			globalRequestBindURI = "is_crouch_boost=false&";
		}

		steamParam = ""; //empty steamid parameter will fetch top global stats instead
		if (isValidSteamID(steamID)) {
			steamParam = requestSteamID + steamID;
		}

		//URL format for personal stats: "https://kztimerglobal.com/api/v1.0/jumpstats?steam_id=<STEAMID>&jumptype=...
		var playerRequestURL = jumpstatsPBURLBase +
			steamParam + '&' +
			requestJumpType + jumpstatType + '&' +
			requestBindURI + '&' +
			requestMaximum + jumpstatTable[jumpstatType][0] + '&' +
			requestLimit + reqLimit;

		//URL format for top stats: "https://kztimerglobal.com/api/v1.0/jumpstats/jumptype/top?..."
		//jumpstat type must be converted to right name first
		var globalRequestURL = jumpstatsGlobalURLBase +
			jumpstatTable[jumpstatType][1] + "/top?" +
			globalRequestBindURI +
			requestMaximum + jumpstatTable[jumpstatType][0] + '&' +
			requestLimit + reqLimit;

		//if steamid is empty, use global jumpstat request string
		if (steamID === "")
			requestURL = globalRequestURL;
		else
			requestURL = playerRequestURL;

		return requestURL;

	}


});