var globalTable;
var difficultyArray = getDifficultyArray();
var URI = getURIVars();
var expandGlobaId = "#expand-allservers";
var inputTip = "Enter your name or SteamID";
var playerInfo = {};
var mapRequestBaseURL = "https://kztimerglobal.com/api/v1.0/records/top?"
var playerInfoRequestBaseURL = "https://kztimerglobal.com/api/v1.0/player_ranks?stages=0mode_ids=200";
var playerInfoProRequestURL = playerInfoRequestBaseURL + "&has_teleports=false";
var playerInfoTPRequestURL = playerInfoRequestBaseURL + "&has_teleports=true";
var playerSteam64URI = "steamid64s=";
var globalHeader = ["Map", "Tier", "Pro Tier", "Length", "Time", "TPs", "Pts", "Date",
    "Server"
];

var RANKING ={

}
$(document).ready(function () {

    var steamID = "";
    if (typeof URI["steamid"] !== 'undefined' && URI["teleports"] !== 'undefined') {
        steamID = URI["steamid"];
        teleports = URI["teleports"]
        if (isValidSteamID(steamID)) {
            //$(expandGlobalId).click(); //autoexpand if url linked by steamid

            $('#steamIDText').val(steamID);
            var teleportsBool = ("true" === teleports);

            retrieveStats(steamID, teleportsBool);
            if (teleportsBool) {
                $('#tpradio').click();
            } else {
                $('#proradio').click();
            }


        }
    } else {
        var steamID = localStorage.getItem("globalMapsSteamID");
        var teleportsBool = "true" === localStorage.getItem(
            "globalMapsTeleports"); //convert string to boolean
        if (isValidSteamID(steamID)) {
            $('#steamIDText').val(steamID);
            if (teleportsBool) {
                $('#tpradio').click();
            } else {
                $('#proradio').click();
            }

            $("#expandGlobal").click(); //autoexpand if url linked by steamid
            retrieveStats(steamID, teleportsBool);
        }

    }

    function retrieveStats(steamID, teleports) {

        playerInfo = {
            "player-name": "",
            "run-type": "",
            "runs-possible": 0,
            "runs-total": 0,
            "points-total": 0,
            "points-average": 0,
            "runs-by-tier": [0, 0, 0, 0, 0, 0, 0],
            "runs-possible-by-tier": [0, 0, 0, 0, 0, 0, 0]
        }
        //temp max limit based on ~440 maps, eventually should change to indexdb storage 
        //so you dont fetch every map all the time, and just fetch the latest runs

        var finishedGlobals = jQuery.extend(true, {}, difficultyArray); //deep copy
        var tempLimit = 500;


        var steamIDText = "";
        if (isValidSteamID(steamID)) {
            steamIDText = "steam_id=" + steamID;
        } else if (steamID !== "" && steamID !== inputTip) {
            //assume name was entered
            steamIDText = "player_name=" + steamID;
        }
        requestURL = mapRequestBaseURL + steamIDText +
            "&tickrate=128&stage=0&has_teleports=" + teleports + "&limit=" + tempLimit +
            "&modes_list_string=kz_timer";

        $.getJSON(requestURL, function (data) {
            if (data.length == 0) {
                alert("No Times Found for " + steamID);
                return true;
            }
            var maps = [];


            //remember logic is flipped, has teleports = true means TP

            var firstEntry = data[0];
            var steam_id = firstEntry["steam_id"];

            playerInfo["player-name"] = sanitizeName(data[0]["player_name"]);
            playerInfo["run-type"] = +firstEntry["teleports"] == 0 ? "pro" : "tp";


            localStorage.setItem("globalMapsSteamID", steam_id);
            localStorage.setItem("globalMapsTeleports", teleports);

            //set url to steamid and teleports for future use
            window.history.pushState("object or string", "Title", "?steamid=" + steam_id + "&teleports=" +
                teleports);;

            $.each(data, function (i, field) {

                var map = field["map_name"]
                //server is sometimes null, and throws exception
                var tptier = "N/A",
                    protier = "N/A",
                    length = "N/A",
                    time = "N/A",
                    teleports = "N/A",
                    points = "N/A",
                    date = "N/A",
                    server = "N/A";
                if (map in finishedGlobals) {

                    //flag to see if map is finished, most of the new death maps have not been added to global api
                    finishedGlobals[map].push("finished");

                    tptier = difficultyArray[field["map_name"]][0];
                    protier = difficultyArray[field["map_name"]][1];
                    length = difficultyArray[field["map_name"]][2];
                    time = getTimeFromSeconds(field["time"]);
                    teleports = field["teleports"];
                    points = field["points"];
                    date = field["updated_on"];
                    if (typeof field["server_name"] === "string") {
                        server = field["server_name"].substring(0, 35);
                    }
                    playerInfo["points-total"] += +points;

                }
                var statRow = [map, tptier, protier, length,
                    time, teleports, points, date, server
                ];
                maps.push(statRow);
                //createTable(maps, header);


            }); //.each


            cols = [{}, //map name
            {}, //tier
            {}, //pro tier
            {}, //length
            {
                type: "time",
                timeFormat: "h:mm:ss"
            },
            {}, //tp
            {}, //pts
            {},
            {} //server
            ];
            var spreadsheetContainer = $("#spreadsheet-global")[0];

            for (var map in finishedGlobals) {
                var maptier = finishedGlobals[map][0];


                if(maptier != 0 && !(playerInfo["run-type"] == "tp" && map.startsWith("kzpro"))){
                    playerInfo["runs-possible"]++;
                    playerInfo["runs-possible-by-tier"][maptier]++;
                }
                if (finishedGlobals[map].length >= 4) {
                    playerInfo["runs-total"]++;
                    playerInfo["runs-by-tier"][maptier]++;

                }
                if (finishedGlobals[map].length < 4) {
                    unfinished = Array(globalHeader.length).fill("N/A");
                    unfinished[0] = map;
                    unfinished[1] = finishedGlobals[map][0]; //tp tier
                    unfinished[2] = finishedGlobals[map][1]; //pro tier
                    unfinished[3] = finishedGlobals[map][2]; //length
                    maps.push(unfinished);
                }

            }
            if (globalTable)
                globalTable.destroy();

		$("#steamButton").attr('value', 'Fetch Times');
            globalTable = genTable(spreadsheetContainer, maps, globalHeader, [0, 4, 8], cols);
            printPlayerProfile();
        }); //end json
    }

    function printPlayerProfile() {

        playerInfo["points-average"] = (playerInfo["points-total"] / playerInfo["runs-total"]).toFixed(1);
        var runPercentage = (100 * playerInfo["runs-total"]/playerInfo["runs-possible"] || 0).toFixed(1);

        $("#player-info").show();
        $("#player-name-info").text("Player: " + playerInfo["player-name"]);
        $("#run-info-text").text(`${playerInfo["runs-total"]}/${playerInfo["runs-possible"]} (${runPercentage}%)`);
        $("#points-info-label").text("Total Points: ")
        $("#points-info-text").text(`${playerInfo["points-total"].toLocaleString("en")} (avg: ${playerInfo["points-average"]})`);

        $("#rank-info-text").text('To be implemented');

        if (playerInfo["run-type"] === "pro") {
            $("#run-info-label").text("Total Pro Runs: ")
            $("#rank-info-label").text('PRO Rank: ');

        } else if (playerInfo["run-type"] === "tp") {
            $("#run-info-label").text("Total TP Runs: ")
            $("#rank-info-label").text('TP Rank: ');

        }
        
        $(".progress-group-container").empty();
        for (var tier in TIERKEY) {
            if (tier == 0)
                continue;

            var tierText = TIERKEY[tier][0];
            var tierColor = TIERKEY[tier][1];
            var tierMax = playerInfo["runs-possible-by-tier"][tier];
            var tierRuns = playerInfo["runs-by-tier"][tier];
            var tierPercentage =  Math.floor(100 * tierRuns/tierMax) || 0;


            var barFontStyle = "";
            //so you can see against white background
            if(tierPercentage  >  5 && tier == 6){
                    barFontStyle = "color: #DDD;";
            }

            var $progressBar = $(`<div class='progress-bar progress-bar-tier' 
                role='progressbar' style='width:${tierPercentage}%; background-color: ${tierColor} !important; ${barFontStyle}'aria-valuenow='${tierPercentage}'
                aria-valuemin='0' aria-valuemax='100'>${tierRuns}/${tierMax}</div>`);
            var $progressBarContainer = $('<div class="progress"></div>');
            $progressBarContainer.append($progressBar);

            var $progressLabel = $(`<div class="progress-label">${tierText}</div>`);

            var $progressContainer = $('<div class=progress-container></div>');
            $progressContainer.append($progressLabel);
            $progressContainer.append($progressBarContainer);
            $(".progress-group-container").append($progressContainer);

        }

    }
    $("#steamButton").click(function () {

        var steamID = $('#steamIDText').val();

		$(this).attr('value', 'Fetching...');


        var ispro = $('input[name=isprorun-radio]:checked').val();
        var teleports = true;
        if (ispro === "proradio")
            teleports = false;


        retrieveStats(steamID, teleports);
    });


});