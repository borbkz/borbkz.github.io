
//over 20 violates CORS wtf
var jumpLimit = 20,
	jumpMin = 100,
	jumpMax = 290;
var requestSteamID = "steam_id=";
var requestJumpType = "jumptype=";
var requestLimit = "limit=";
var requestMaximum = "less_than_distance=";

var requestBind = "is_crouch_bind=";
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
$(document).ready(function () {
	var header = ["Player", "Jump Type", "Distance", "Strafe Count", "Binded", "Date", "Server"];


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
		console.log("hello")
		if (isValidSteamID(steamID) && isValidStat(jumptype)) {
		console.log("in 1")

			$('#steamIDText').val(steamID);
			if (isValidStat(URI["jumptype"]))
				jumptype = URI["jumptype"];


			$("#" + jumptype + "Radio").click();


			//$("#expand-personal-jumpstats").click(); //autoexpand if url linked by steamid
			retrieveStats(getRequestURL(steamID, jumptype, "both"), localContainer, false);
		}

	} else {
		console.log("in 2")
		steamID = localStorage.getItem("jumpstatSteamID");
		jumptype = localStorage.getItem("jumpstatType");
		binded = localStorage.getItem("jumpstatBinded");
		if (isValidSteamID(steamID) && isValidStat(jumptype) && isValidBind(binded)) {
			$('#steamIDText').val(steamID);
			$("#expandLocal").click();
			retrieveStats(getRequestURL(steamID, jumptype, binded), localContainer, false);

		}
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
				var distance = field["distance"];

				//filter out any non-whitelisted WR's

				if (first && global) {

					if (steam_id in whitelist) {

						player = whitelist[steam_id];
						first = false;
					} else {
						return true;
					}

				}

				if (serverID in servers) {
					server = servers[serverID];
				} else {

					server = getServerName(serverID);
					servers[serverID] = server.substring(0, 25);

				}
				var statRow = [player, jumpstatType,
					distance, field[
					"strafe_count"],
					field["is_crouch_bind"] ? "Yes" : "No", field[
					"created_on"],
					server
				];


				if (!global) {
					if(jumpstats.length < 10)
					jumpstats.push(statRow);
				} else if(jumpstats.length < 10){

					if (steam_id in whitelist && distance > highestStat) {
						highestStat = distance;
						jumpstats.push(statRow);
					} else {
						//if not in whitelist but not WR either...
						if (distance < highestStat || highestStat == 0) {
							jumpstats.push(statRow);
						}

					}
				}
			});


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


		window.history.pushState("object or string", "Title", "?steamid=" + steamID + "&jumptype=" + jumpstatType);;

		localStorage.setItem("jumpstatSteamID", steamID)
		localStorage.setItem("jumpstatType", jumpstatType)
		localStorage.setItem("jumpstatBinded", isbinded)

		retrieveStats(getRequestURL(steamID, jumpstatType, isbinded), localContainer, false);
	});
	$("#globalJumpstatsButton").click(function () {


		jumpstatType = $('input[name=globalJumpstat]:checked').val();
		isbinded = $('input[name=globalBind]:checked').val();


		retrieveStats(getRequestURL("", jumpstatType, isbinded), globalContainer, true);
	});

	function getRequestURL(steamID, jumpstatType, binded, reqLimit) {
		if (typeof reqLimit === "undefined")
			reqLimit = jumpLimit;

		var requestBindURI = requestBind + "false";
		var globalRequestBindURI = "";
		if (binded === "both") {
			requestBindURI = "";
		} else if (binded === "binded") {
			requestBindURI = requestBind + "true";
			globalRequestBindURI = "is_crouch_boost=true&";
		}

		if (jumpstatType === "ladder") {
			requestBindURI = requestBind + "false";
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