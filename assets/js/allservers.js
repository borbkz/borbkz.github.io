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
var globalHeader = ["Map", "Pts", "Time", "TPs", "Tier", "Pro Tier", "Length", "Date",
    "Server"];

var RANKING = {

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
            "world-records": 0,
            "run-type": "",
            "runs-possible": 0,
            "runs-total": 0,
            "points-total": 0,
            "points-average": 0,
            "runs-by-tier": new Array(7).fill(0),
            "runs-possible-by-tier":  new Array(7).fill(0),
            "points-total-by-tier":  new Array(7).fill(0),
            "points-average-by-tier":  new Array(7).fill(0),
            "tier-max-maps": 1
        }
        //temp max limit based on ~440 maps, eventually should change to indexdb storage 
        //so you dont fetch every map all the time, and just fetch the latest runs

        var finishedGlobals = jQuery.extend(true, {}, difficultyArray); //deep copy
        var tempLimit = 500;


        var steamIDText = "";
        if (isValidSteamID(steamID)) {
            steamIDText = "steam_id=" + steamID;
            $("#steamButton").attr('value', 'Fetching...');
        } else {
            alert("Please enter valid Steam ID!")
            return;
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

                var map = field["map_name"];
                //server is sometimes null, and throws exception
                var tptier = 0,
                    protier = 0,
                    length = "N/A",
                    time = "N/A",
                    teleports = "N/A",
                    points = 0,
                    date = "N/A",
                    server = "N/A";

                time = getTimeFromSeconds(field["time"]);

                teleports = field["teleports"];
                points = field["points"];
                date = field["updated_on"];
                if (typeof field["server_name"] === "string") {
                    server = field["server_name"].substring(0, 35);
                }
                if (map in finishedGlobals) {
                    tptier = difficultyArray[field["map_name"]][0];

                    if (tptier !== 0 && +points === 1000) {

                        playerInfo["world-records"]++;

                    }

                    if(tptier !==0){
                        playerInfo["points-total-by-tier"][tptier] += points;
                    }

                    playerInfo["points-total"] += +points;
                    //flag to see if map is finished, most of the new death maps have not been added to global api
                    finishedGlobals[map].push("finished");

                    protier = difficultyArray[field["map_name"]][1];
                    length = difficultyArray[field["map_name"]][2];

                }

                var statRow = new Array(globalHeader.length);


                statRow[globalHeader.indexOf("Map")] = map;
                statRow[globalHeader.indexOf("Pts")] = points;
                statRow[globalHeader.indexOf("Tier")] = tptier;
                statRow[globalHeader.indexOf("Pro Tier")] = protier;
                statRow[globalHeader.indexOf("Length")] = length;
                statRow[globalHeader.indexOf("Time")] = time;
                statRow[globalHeader.indexOf("TPs")] = teleports;
                statRow[globalHeader.indexOf("Date")] = date;
                statRow[globalHeader.indexOf("Server")] = server;


                if (map !== null && map !== "")
                    maps.push(statRow);
                //createTable(maps, header);


            }); //.each


            var cols = new Array(globalHeader.length);
            cols[globalHeader.indexOf("Map")] = { className: "htLeft" };
            cols[globalHeader.indexOf("Time")] = { type: "time", timeFormat: "hh:mm:ss" };

            var spreadsheetContainer = $("#spreadsheet-global")[0];

            for (var map in finishedGlobals) {
                var maptier = finishedGlobals[map][0];

                var includeKZPro = !(playerInfo["run-type"] == "tp" && map.startsWith("kzpro"));

                if (maptier != 0 && includeKZPro) {
                    playerInfo["runs-possible"]++;
                    playerInfo["runs-possible-by-tier"][maptier]++;
                }
                if (maptier != 0 && finishedGlobals[map].length >= 4) {
                    playerInfo["runs-total"]++;
                    playerInfo["runs-by-tier"][maptier]++;

                }
                if (finishedGlobals[map].length < 4 && includeKZPro) {
                    unfinished = Array(globalHeader.length).fill("N/A");
                    unfinished[globalHeader.indexOf("Map")] = map;
                    unfinished[globalHeader.indexOf("Tier")] = finishedGlobals[map][0]; //tp tier
                    unfinished[globalHeader.indexOf("Pro Tier")] = finishedGlobals[map][1]; //pro tier
                    unfinished[globalHeader.indexOf("Length")] = finishedGlobals[map][2]; //length

                    var ptsIndex = globalHeader.indexOf("Pts");
                    unfinished[ptsIndex] = 0;


                    maps.push(unfinished);
                }

            }

            for (var i = 0; i < maps.length; i++) {
                var mypoints = +maps[i][globalHeader.indexOf("Pts")];
                if (mypoints === 1000) {
                    maps[i][globalHeader.indexOf("Pts")] = TROPHY["gold"];
                } else if (mypoints >= 950) {
                    //to be implemented 
                    //maps[i][0] += TROPHY["silver"];

                } else if (mypoints >= 850) {
                    //maps[i][0] += TROPHY["bronze"];

                }

            }
            if (globalTable)
                globalTable.destroy();

            $("#steamButton").attr('value', 'Fetch Times');

            $("#global-tooltip").show();
            globalTable = genTable(spreadsheetContainer, maps, globalHeader, [globalHeader.indexOf("Map"), globalHeader.indexOf("Time"),
            globalHeader.indexOf("Server"), globalHeader.indexOf("Tier"), globalHeader.indexOf("Pro Tier"), globalHeader.indexOf("Length")], cols, { column: globalHeader.indexOf("Pts"), sortOrder: "desc" });

            globalTable.updateSettings({
                hiddenColumns: {
                    indicators: true,
                    columns: []
                }
            })

            printPlayerProfile();
        }); //end json
    }

    function printPlayerProfile() {

        playerInfo["points-average"] = (playerInfo["points-total"] / playerInfo["runs-total"]).toFixed(1);
        var runPercentage = (100 * playerInfo["runs-total"] / playerInfo["runs-possible"] || 0).toFixed(1);

        $("#player-info").show();

        $("#player-info-label").text("Player: ");
        $("#player-info-text").text(playerInfo["player-name"]);

        $("#wr-info-label").text('World Records: ');
        var medalType = "";

        if (+playerInfo["world-records"] !== 0)
            medalType = TROPHY["gold"];

        $("#wr-info-text").html(playerInfo["world-records"] + medalType);

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
            var tierPercentage = Math.floor(100 * tierRuns / tierMax) || 0;
            var wrs = playerInfo["world-records"];

            var tierAveragePoints = playerInfo["points-total-by-tier"][tier]/playerInfo["runs-by-tier"][tier];


            if(tierMax > playerInfo["runs-possible-by-tier"][playerInfo["tier-max-maps"]]){
                playerInfo["tier-max-maps"] = tier;

            }

            playerInfo["points-average-by-tier"][tier] = tierAveragePoints.toFixed(1);

            var barFontStyle = "";
            //so you can see against white background
            if (tierPercentage > 5 && tier == 6) {
                barFontStyle = "color: #DDD;";
            }

            var $progressBar = $(`<div id="progress-bar-${tier}"class='progress-bar progress-bar-tier' 
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

        $('#tier-percentage-dropdown').click(function(){
            for (let i = 1; i <= 6; i++) {
                let curRuns = +playerInfo["runs-by-tier"][i];
                let curMax = +playerInfo["runs-possible-by-tier"][i];
                let $curProgressBar = $("#progress-bar-"+i);
                setProgressWdith($("#progress-bar-"+i), getPercentage(curRuns, 0, curMax), "(" + curRuns+"/" +curMax+")");
            } 
        });

        $('#tier-average-dropdown').click(function(){
            for (let i = 1; i <= 6; i++) {
                let avgPoints = +playerInfo["points-average-by-tier"][i];
                let $curProgressBar = $("#progress-bar-"+i);
                setProgressWdith($("#progress-bar-"+i), getPercentage(avgPoints, 0, 1000), avgPoints);
            } 
        });


        $('#tier-total-dropdown').click(function(){
            for (let i = 1; i <= 6; i++) {
                let curVal = +playerInfo["runs-by-tier"][i];
                let curMax = playerInfo["runs-possible-by-tier"][playerInfo["tier-max-maps"]];
                let $curProgressBar = $("#progress-bar-"+i);
                setProgressWdith($("#progress-bar-"+i), getPercentage(curVal, 0, curMax), curVal);
            } 
        });

        function setProgressWdith($myProgressBar, percentageWidth, myText){
            $myProgressBar.css("width", percentageWidth+"%");
            $myProgressBar.text(myText);
        }
        function getPercentage(value, min, max){
            // OR with 0 in case of NaN
            return Math.floor(100 *  value/max) || 0;

        }


    }

    $("#steamButton").click(function () {

        var steamID = $('#steamIDText').val();



        var ispro = $('input[name=isprorun-radio]:checked').val();
        var teleports = true;
        if (ispro === "proradio")
            teleports = false;


        retrieveStats(steamID, teleports);
    });


});