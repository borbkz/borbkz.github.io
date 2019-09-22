
		var requestSteamID = "steam_id=";
		var requestJumpType = "&jumptype=";
		var requestLimit = "&limit=" + jumpLimit;
		var requestMinimum = "&greater_than_distance=" + jumpMin;

		var requestBind = "&is_crouch_bind=";
		var jumpstatsPBURLBase = "https://kztimerglobal.com/api/v1.0/jumpstats?";
		var globalTable;
		var personalTable;
		var steamID = "";
		$(document).ready(function () {
			var header = ["Player", "Jump Type", "Distance", "Strafe Count", "Binded", "Date", "Server"];


			var localContainer = $("#localJumpstatsContainer")[0];
			var globalContainer = $("#globalJumpstatsContainer")[0];
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
					retrieveStats(getRequestURL(steamID, jumptype, "both"), localContainer);
				}

			} else {
				steamID = localStorage.getItem("jumpstatSteamID");
				jumptype = localStorage.getItem("jumpstatType");
				binded = localStorage.getItem("jumpstatBinded");
				console.log("in")

				console.log("steam valid " + isValidSteamID(steamID));
				console.log("jump valid " + isValidSteamID(jumptype));
				console.log("jumpType valid " + isValidSteamID(binded));
				if (isValidSteamID(steamID) && isValidStat(jumptype) && isValidBind(binded)) {
				console.log("i2n")
					$('#steamIDText').val(steamID);
					$("#expandLocal").click();
					retrieveStats(getRequestURL(steamID, jumptype, binded), localContainer);

				}
			}


			function retrieveStats(requestURL, container) {

				$.getJSON(requestURL, function (data) {

					if (data.length == 0) {
						alert("No Stats for " + steamID);
						return true;
					}
					var jumpstats = [];
					var servers = {};
					var playerName = sanitizeName(data[0]["player_name"]);
					var isbinded = $('input[name=bind]:checked').val();
					var jumpstatType = jumpstatsKey[data[0]["jump_type"]];
					if (isbinded === "both")
						isbinded = "";
					$.each(data, function (i, field) {

						server = "N/A";
						serverID = field["server_id"];

						if (serverID in servers) {
							server = servers[serverID];
						} else {

							server = getServerName(serverID);
							servers[serverID] = server.substring(0, 25);

						}
						var statRow = [sanitizeName(field["player_name"]), jumpstatType,
							field["distance"], field[
								"strafe_count"],
							field["is_crouch_bind"] ? "Yes" : "No", field[
								"created_on"],
							server
						];
						jumpstats.push(statRow);

						createTable(jumpstats, header, container)


					});

				}); //end json
			}

			$("#localJumpstatsButton").click(function () {

				var steamID = $('#steamIDText').val().trim();

				if (!isValidSteamID(steamID)) {
					alert("invalid Steam ID!");
					return;
				}
				jumpstatType = $('input[name=jumpstat]:checked').val();
				isbinded = $('input[name=bind]:checked').val();


				window.history.pushState("object or string", "Title", "?steamid=" + steamID + "&jumptype=" +
					jumpstatType);;

				localStorage.setItem("jumpstatSteamID", steamID)
				localStorage.setItem("jumpstatType", jumpstatType)
				localStorage.setItem("jumpstatBinded", isbinded)

				retrieveStats(getRequestURL(steamID, jumpstatType, isbinded), localContainer);
			});
			$("#globalJumpstatsButton").click(function () {


				jumpstatType = $('input[name=globalJumpstat]:checked').val();
				isbinded = $('input[name=globalBind]:checked').val();


				retrieveStats(getRequestURL("", jumpstatType, isbinded), globalContainer);
			});

			function getRequestURL(steamID, jumpstatType, binded) {

				requestBindURI = requestBind;
				if (binded === "both")
					requestBindURI = "";
				else if (binded === "binded")
					requestBindURI = requestBind + "true";
				else
					requestBindURI = requestBind + "false";

				steamParam = ""; //empty steamid parameter will fetch top global stats instead
				if (isValidSteamID(steamID))
					steamParam = requestSteamID + steamID;

				var requestURL = jumpstatsPBURLBase +
					steamParam +
					requestJumpType + jumpstatType +
					requestBindURI +
					requestMinimum + requestLimit;

				return requestURL;

			}


		});