var globalTable;



var difficultyArray = {};


getDifficultyArray(difficultyArray);

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
var normalizeRatings = true;

var RANKING = {
    10: "CHEATER",
    9: "GOD",
    8: "PRO",
    7: "SEMI-PRO",
    6: "EXPERT",
    5: "SKILLED",
    4: "REGULAR",
    3: "CASUAL",
    2: "TRAINEE",
    1: "SCRUB",
    0: "NEW",
}

var playerInfo = getEmptyPlayer();

function getEmptyPlayer() {
    //records = 1000 points
    //"silvers = 900 points (Not necessarily a top 20, just a good time)
    //"bronze = 800 points (Not necessarily a top 20, just a good time)
    return {
        "player-name": "N/A",
        "world-records": 0,
        "silvers": 0,
        "bronzes": 0,
        "run-type": "tp",
        "runs-possible": 0,
        "runs-total": 0,
        "points-total": 0,
        "points-average": 0,
        "runs-by-tier": new Array(7).fill(0),
        "runs-possible-by-tier": new Array(7).fill(0),
        "points-total-by-tier": new Array(7).fill(0),
        "points-average-by-tier": new Array(7).fill(0),
        "records-by-tier": new Array(7).fill(0),
        "silvers-by-tier": new Array(7).fill(0),
        "bronzes-by-tier": new Array(7).fill(0),
        "tier-max-maps": 1,
        "records-max-maps": 1,
        "silvers-max-maps": 1,
        "bronzes-max-maps": 1
    }

}
$(document).ready(function () {

    $('.dropdown-menu a').click(function () {
        $('#dropdownMenuButton').text($(this).text());
        $('#dropdownMenuButton').attr('target-id', this.id);
    });
    normalizeRatings = $("#normalize-checkbox").is(':checked');
    printPlayerProfile();
    function printPlayerProfile() {

        playerInfo["points-average"] = (playerInfo["points-total"] / playerInfo["runs-total"] || 0).toFixed(1);
        var runPercentage = (100 * playerInfo["runs-total"] / playerInfo["runs-possible"] || 0).toFixed(1);

        $("#player-info").show();

        $("#player-info-text").text(playerInfo["player-name"]);

        var goldmedal = "", silvermedal = "", bronzemedal = "";

        if (+playerInfo["world-records"] !== 0)
            goldmedal = TROPHY["gold"];
        if (+playerInfo["silvers"] !== 0)
            silvermedal = TROPHY["silver"];
        if (+playerInfo["bronzes"] !== 0)
            bronzemedal = TROPHY["bronze"];

        $("#wr-info-text").html(playerInfo["world-records"] + goldmedal);
        $("#silver-info-text").html(playerInfo["silvers"] + silvermedal);
        $("#bronze-info-text").html(playerInfo["bronzes"] + bronzemedal);

        $("#run-info-text").text(`${playerInfo["runs-total"]}/${playerInfo["runs-possible"]} (${runPercentage}%)`);
        $("#points-info-label").text("Total Points: ")
        $("#points-info-text").text(`${playerInfo["points-total"].toLocaleString("en")} (avg: ${playerInfo["points-average"]})`);


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
            var tierMax = playerInfo["runs-by-tier"][tier];
            var tierRecordsMax = playerInfo["records-by-tier"][tier];
            var tierSilversMax = playerInfo["silvers-by-tier"][tier];
            var tierBronzesMax = playerInfo["bronzes-by-tier"][tier];
            var tierRuns = playerInfo["runs-by-tier"][tier];

            var tierPercentage = Math.floor(100 * tierRuns / tierMax) || 0;

            var tierAveragePoints = playerInfo["points-total-by-tier"][tier] / playerInfo["runs-by-tier"][tier];


            if (tierMax > playerInfo["runs-by-tier"][playerInfo["tier-max-maps"]]) {
                playerInfo["tier-max-maps"] = tier;
            }
            if (tierRecordsMax > playerInfo["records-by-tier"][playerInfo["records-max-maps"]]) {
                playerInfo["records-max-maps"] = tier;
            }
            if (tierSilversMax > playerInfo["silvers-by-tier"][playerInfo["silvers-max-maps"]]) {
                playerInfo["silvers-max-maps"] = tier;
            }
            if (tierBronzesMax > playerInfo["bronzes-by-tier"][playerInfo["bronzes-max-maps"]]) {
                playerInfo["bronzes-max-maps"] = tier;
            }

            playerInfo["points-average-by-tier"][tier] = tierAveragePoints.toFixed(1);


            var $progressBar = $(`<div id="progress-bar-${tier}"class='progress-bar progress-bar-tier' 
                role='progressbar' style='width:0%; background-color: ${tierColor} !important;'aria-valuenow='0'
                aria-valuemin='0' aria-valuemax='100'></div>`);
            var $progressBarContainer = $('<div class="progress"></div>');
            $progressBarContainer.append($progressBar);

            var $progressLabel = $(`<div class="progress-label">${tierText}</div>`);

            var $progressContainer = $('<div class=progress-container></div>');
            $progressContainer.append($progressLabel);
            $progressContainer.append($progressBarContainer);
            $(".progress-group-container").append($progressContainer);

            deathTierColorText(tierPercentage, tier, $progressBar);
            $('#tier-total-dropdown').click();


        }

        $("#rank-info-text").text(getRanking());
        function resetProgressBar() {
            //$('.progress').css("border-radius", "7px");
            //$('.progress-bar-tier').css("border", "solid 2px lightgrey");
            //$('.progress-bar-tier').css("border-radius", "7px");
        }
        function setProgressBar() {
            //$('.progress').css("border-radius", "0");
            //$('.progress-bar-tier').css("border-radius", "0");
            //$('.progress-bar-tier').css("border", "none");
        }

        //checking the checkbox wil trigger new progress bars
        $("#normalize-checkbox").click(function () {
            normalizeRatings = this.checked;
            $('#' + $("#dropdownMenuButton").attr('target-id')).click();
        });



        function getRanking() {
            //1:20:50:500
            let wrPoints = 1000;
            let goldToSilver = 20, goldToBronze = 50,
                goldToUnranked = 500;


            let silverPoints = Math.floor(wrPoints / goldToSilver);
            let bronzePoints = Math.floor(wrPoints / goldToBronze);
            let unrankedPoints = Math.floor(wrPoints / goldToUnranked);

            let rankedMaps = playerInfo["world-records"] +
                playerInfo["silvers"] + playerInfo["bronzes"];
            let unrankedMaps = playerInfo["runs-total"] - rankedMaps;



            let placementTotal = playerInfo["world-records"] * wrPoints +
                + playerInfo["silvers"] * silverPoints + playerInfo["bronzes"] * bronzePoints
                + unrankedMaps * unrankedPoints;

            let r_base = 2.5;
            let placementRanking = getPlacementRank(placementTotal, r_base);

            let placementMax = getPlacementRank(playerInfo["runs-possible"] * wrPoints, r_base);

            let normalizedPlacementRating = placementRanking / placementMax;
            let steepPlacement = 3.0;
            let placementMid = getPlacementRank(200, r_base) / placementMax;

            let placementRating = sigmoid(normalizedPlacementRating, 1.0, steepPlacement, placementMid);

            let pointsMax = playerInfo["runs-possible"] * wrPoints;
            let pointsMid = .25, steepPoints = 3.5;
            if (playerInfo["run-type"] == "pro") {
                pointsMid = pointsMid * 0.3;
            }
            let normalizedPoints = playerInfo["points-total"] / pointsMax;
            let pointsRating = sigmoid(normalizedPoints, 1.0, steepPoints, pointsMid);


            let pointsWeight = .1, placementWeight = .8, avgWeight = 1- (placementWeight + pointsWeight);
            let finalRating = pointsWeight * pointsRating + placementWeight * placementRating + avgWeight * (playerInfo["points-average"]/1000);
 //           console.log("points " + pointsRating + " placement " + placementRating);
            finalRating = (10 * Math.max(0, finalRating || 0));

            let goldBonus = Math.min(playerInfo["world-records"], Math.min(1.25, Math.log(10+playerInfo["world-records"])/3 ));
            let silverBonus = Math.min(playerInfo["silvers"]/20, Math.min(0.5, Math.log(10+playerInfo["silvers"])/8 ));

//            console.log("final " + finalRating + " gold bonus " + goldBonus + " silverBonus " + silverBonus);
            finalRating = finalRating + (goldBonus + silverBonus) - .5;


            finalRating = Math.min(10, finalRating);

            let rankText = RANKING[Math.floor(finalRating+.1)];
            console.log(finalRating);
            return rankText;// + " ("+finalRating.toFixed(1)+")";
        }
        function getPlacementRank(r_val, r_base) {
            return Math.log(r_val) / Math.log(r_base);

        }
        function sigmoid(val, f_max, k, x_0) {
            return  f_max / (1 + Math.exp(-1 * k * (val - x_0)));
        }
        $('#tier-total-dropdown').click(function () {
            for (let i = 1; i <= 6; i++) {
                let curVal = +playerInfo["runs-by-tier"][i];
                let curMax = playerInfo["runs-by-tier"][playerInfo["tier-max-maps"]];
                setProgressBar(curVal, curMax,i);
            }
        });
        $('#tier-records-dropdown').click(function () {
            for (let i = 1; i <= 6; i++) {
                let records = +playerInfo["records-by-tier"][i];
                let curMax = playerInfo["records-by-tier"][playerInfo["records-max-maps"]];
                setProgressBar(records, curMax,i);
            }
        });
        $('#tier-silvers-dropdown').click(function () {
            for (let i = 1; i <= 6; i++) {
                let records = +playerInfo["silvers-by-tier"][i];
                let curMax = playerInfo["silvers-by-tier"][playerInfo["silvers-max-maps"]];
                setProgressBar(records, curMax, i);
            }
        });
        $('#tier-bronzes-dropdown').click(function () {
            for (let i = 1; i <= 6; i++) {
                let records = +playerInfo["bronzes-by-tier"][i];
                let curMax = playerInfo["bronzes-by-tier"][playerInfo["bronzes-max-maps"]];
                setProgressWdith(records,curMax, i);
            }
        });
        $('#tier-average-dropdown').click(function () {
            for (let i = 1; i <= 6; i++) {
                let avgPoints = +playerInfo["points-average-by-tier"][i];
                let $curProgressBar = $("#progress-bar-" + i);
                let curPercentage = getPercentage(avgPoints, 0, 1000);

                deathTierColorText(curPercentage, i, $curProgressBar);
                resetProgressBar();
                setProgressWdith($("#progress-bar-" + i), curPercentage, avgPoints || 0);
            }
        });

        function setProgressBar(val, max,tier){
            let progressBar = $("#progress-bar-" + tier);
            let normalizeText = "";
            if(normalizeRatings){
                max = +playerInfo["runs-possible-by-tier"][tier];
            }
            let percentage = getPercentage(val, 0, max);
            if(normalizeRatings){
                normalizeText = "/" + max + " (" + percentage + "%)";
            }
            deathTierColorText(percentage, tier, progressBar);
            setProgressWdith(progressBar, percentage, val+normalizeText);

        }

        function deathTierColorText(percentage, tier, bar) {
            if (percentage >= 1 && tier == 6) {
                bar.css("color", "#DDD");
            } else if (percentage < 1 && tier == 6) {
                bar.css("color", "black");
            }
        }


        function setProgressWdith($myProgressBar, percentageWidth, myText) {
            $myProgressBar.css("width", percentageWidth + "%");
            $myProgressBar.html(myText);
        }
        function getPercentage(value, min, max) {
            // OR with 0 in case of NaN
            return Math.floor(100 * value / max) || 0;

        }


    }




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
        if (useSteamIDPersistent() && persistentSteamIDExists()) {
            var potentialSteamID = localStorage.getItem(STEAMID_PERSISTENT);
            $('#steamIDText').val(potentialSteamID);

            if (isValidSteamID(potentialSteamID)) {
                $('#tpradio').click();
                retrieveStats(potentialSteamID, true);
            }

        }

    }

    function retrieveStats(steamID, teleports) {

        playerInfo = getEmptyPlayer();
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

            //hi rufus
            if (getSteamIDSubstring(steam_id) === "84091052" && Math.floor(Math.random() * 4) == 1) {
                new SpiderController({ 'minBugs': 5, 'maxBugs': 10, 'min_frames': 7 });
            }


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

                    if (tptier !== 0) {
                        if (+points === 1000) {
                            playerInfo["world-records"]++;
                            playerInfo["records-by-tier"][tptier]++;
                        } else if (+points >= 900) {
                            playerInfo["silvers"]++;
                            playerInfo["silvers-by-tier"][tptier]++;

                        } else if (+points >= 800) {
                            playerInfo["bronzes"]++;
                            playerInfo["bronzes-by-tier"][tptier]++;

                        }

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


    $("#steamButton").click(function () {

        var steamID = $('#steamIDText').val();



        var ispro = $('input[name=isprorun-radio]:checked').val();
        var teleports = true;
        if (ispro === "proradio")
            teleports = false;


        retrieveStats(steamID, teleports);
    });


});