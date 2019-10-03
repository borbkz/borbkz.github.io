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
    30: "GOD",
    29: "DEMIGOD",
    28: "PRO+",
    27: "PRO",
    26: "PRO",
    25: "PRO",
    24: "PRO-",
    23: "SEMIPRO+",
    22: "SEMIPRO",
    21: "SEMIPRO-",
    20: "EXPERT+",
    19: "EXPERT",
    18: "SKILLED+",
    17: "SKILLED",
    16: "SKILLED-",
    15: "REGULAR+",
    14: "REGULAR",
    13: "CASUAL+",
    12: "CASUAL",
    11: "CASUAL-",
    10: "TRAINEE+",
    9: "TRAINEE",
    8: "TRAINEE-",
    7: "SCRUB+",
    6: "SCRUB",
    5: "SCRUB",
    4: "SCRUB-",
    3: "NEWBIE",
    2: "NEWBIE",
    1: "NEWBIE",
    0: "NEWBIE"
}

var myChart;

var easyArray = [];
var hardArray = [];

var dateArray = [[], [], [], [], [], [], []];
var playerInfo = getEmptyPlayer();

function linearLeastSquares(data) {
    let xsum = 0, ysum = 0, xx = 0, xy = 0;
    let xmin = Infinity, xmax = -Infinity;
    for (let i = 0; i < data.length; i++) {
        let x = data[i]["x"];
        let y = data[i]["y"];

        if (x < xmin) {
            xmin = x;
        }
        if (x > xmax) {
            xmax = x;
        }
        xsum += x;
        ysum += y;
        xx += (x * x);
        xy += (x * y);
    }
    let N = data.length;
    let slope = (N * xy - (xsum * ysum));
    slope /= ((N * xx) - (xsum * xsum));
    let intercept = (ysum - slope * xsum) / N;

    let f = x => slope * x + intercept;

    return [{ x: xmin, y: f(xmin) }, { x: xmax, y: f(xmax) }];
}
function createChart(tier) {

    let ctx = document.getElementById('my-chart').getContext('2d');
    let tiertext = TIERKEY[tier][0];
    let tiercolor = TIERKEY[tier][1];

    let data = dateArray[tier];
    let bestfit = linearLeastSquares(data);
    let xmin = bestfit[0]["x"];
    let xmax = bestfit[1]["x"];
    let linecolor = "black";

    let titleMargin = 0;
    let percentageIncrease = 100 * (bestfit[1]["y"] - bestfit[0]["y"]) / 1000; 

    let months = Math.floor((xmax - xmin) / (30));
    let remainingDays = (xmax - xmin) - 30 * months;


    let duration = months + " Months, " + remainingDays + " Days";
    if (months < 1) {
        duration = remainingDays + " Days";
    }
    if( remainingDays < 1){
        duration = months + " Months";
    }


    let improvementText = (percentageIncrease > 0.0 ? "Improvement" : "Deterioration")

    let title = () => `${tiertext} Tier: ${Math.abs(percentageIncrease.toFixed(1))}% ${improvementText} Over The Last ${duration}`;

    const monthNames = ["","Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    if (typeof myChart === 'undefined') {
        myChart = new Chart(ctx,
            {
                type: 'scatter',
                data: {
                    datasets: [{
                        label: tiertext,
                        data: data,
                        backgroundColor: tiercolor,
                        label: tiertext,
                        borderColor: linecolor
                    }, {
                        label: "Best Fit (LLS)",
                        data: linearLeastSquares(data),
                        backgroundColor: 'black',
                        borderColor: linecolor,
                        borderWidth: 2,
                        fill: false,
                        tension: 0,
                        showLine: true
                    }]
                },
                plugins: [{
                    beforeInit: function (chart, options) {
                        chart.legend.afterFit = function () {
                            this.height = this.height + titleMargin;
                        };
                    }
                }],
                options: {
                    layout: {
                        padding: {
                            left: 0,
                            right: 0,
                            top: 0,
                            bottom: 0
                        },
                    },

                    title: {
                        display: true,
                        text: title(),
                        fontStyle: "bold",
                        fontSize: "16",

                    },
                    legend: {
                        display: false,
                    },
                    responsive: false,
                    tooltips: {
                        displayColors: false,
                        enabled: true,
                        mode: 'label',
                        callbacks: {

                            label: function (tooltipItem, data) {

                                let pointData = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index];

                                let labelStrings = [];
                                let timestamp = pointData["x"];
                                let points = pointData["y"];
                                let tps = pointData["tp"];
                                let originaldate = pointData["date"];
                                originaldate = originaldate.substring(0, originaldate.indexOf("T"));

                                //let simpleDate = new Date(timestamp * 24 * 60 * 60 * 1000).toJSON().slice(0, 10).replace(/-/g, '/');
                                labelStrings.push(pointData["map"]);
                                labelStrings.push(points + " Pts, " + tps + " TPs");
                                labelStrings.push(pointData["time"]);
                                labelStrings.push(originaldate);

                                return labelStrings;
                            }

                        }
                    },
                    pan: {
                        enabled: true,
                        mode: 'xy',
                        speed: .1,
                        threshold: .1
                    },
                    zoom: {
                        enabled: true,
                        drag: false,
                        mode: 'xy',
                        speed: .1
                    },
                    scales: {
                        yAxes: [{
                            ticks: {

                            },
                            scaleLabel: {
                                display: true,
                                labelString: 'Points',
                                fontSize: 16,
                                fotStyle: 'bold'
                            }


                        }],
                        xAxes: [{
                            type: 'linear',
                            position: 'bottom',
                            ticks: {
                                maxRotation: 0,
                                maxTicksLimit: 12,
                                callback: function (value, index, values) {

                                    let mydate = new Date(value * 24 * 60 * 60 * 1000).toJSON().slice(0, 10).split('-');

                                    let month = monthNames[parseInt(mydate[1],10)];

                                    return month + " " + mydate[0]; 
                                }
                            }
                        }]
                    }
                }
            }

        );
    }
    else {
        myChart.data = {
            datasets: [{
                data: data,
                backgroundColor: tiercolor,
                label: tiertext,
                borderColor: linecolor
            }, {
                label: "Best Fit (LLS)",
                data: linearLeastSquares(data),
                backgroundColor: 'black',
                borderColor: linecolor,
                borderWidth: 2,
                fill: false,
                tension: 0,
                showLine: true
            }]
        }
        myChart.options.title.text = title();
        myChart.update();
        myChart.resetZoom();
    }

}




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
        "dates-by-tier": [[], [], [], [], [], [], []],
        "runs-possible-by-tier": new Array(7).fill(0),
        "points-total-by-tier": new Array(7).fill(0),
        "points-average-by-tier": new Array(7).fill(0),
        "records-by-tier": new Array(7).fill(0),
        "silvers-by-tier": new Array(7).fill(0),
        "bronzes-by-tier": new Array(7).fill(0),
        "tier-max-maps": 1,
        "records-max-maps": 1,
        "silvers-max-maps": 1,
        "bronzes-max-maps": 1,
        "newest": 0,
        "oldest": 0
    }

}

var radioTier = -1;

$(document).ajaxStop(function () {

    if (radioTier < 0) {
        radioTier = playerInfo["tier-max-maps"];
    }

    $('#tier-' + radioTier + '-radio').click();

})
$(document).ready(function () {

    $('#reset-zoom').click(function(){
        if(typeof myChart !== 'undefined'){
            myChart.resetZoom();

        }

    });

    $("input[name=tier-radio]").on("change", function () {
        radioTier = $("input[name=tier-radio]:checked").val();
        createChart(radioTier);
    });
    $('.dropdown-menu a').click(function () {
        $('#dropdownMenuButton').text($(this).text());
        $('#dropdownMenuButton').attr('target-id', this.id);
    });


    //might have to switch to non-linear regression later due to 
    //sensitivity to outliers

    normalizeRatings = $("#normalize-checkbox").is(':checked');
    printPlayerProfile();
    function printPlayerProfile() {

        playerInfo["points-average"] = (playerInfo["points-total"] / playerInfo["runs-total"] || 0).toFixed(1);
        var runPercentage = (100 * playerInfo["runs-total"] / playerInfo["runs-possible"] || 0).toFixed(1);

        $("#player-info").show();

        $("#player-info-text").text(playerInfo["player-name"].substring(0, 20));

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
        $("#points-info-text").text(`${playerInfo["points-total"].toLocaleString("en")} (avg: ${playerInfo["points-average"]})`);


        if (playerInfo["run-type"] === "pro") {
            $('#runtype-divider').text("Pro Runs");
        } else if (playerInfo["run-type"] === "tp") {
            $('#runtype-divider').text("TP Runs");
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
            var $progressEndLabel = $(`<div class="progress-end-label" id="progress-end-label-${tier}"></div>`);

            var $progressContainer = $('<div class=progress-container></div>');
            $progressContainer.append($progressLabel);
            $progressContainer.append($progressBarContainer);
            $progressContainer.append($progressEndLabel);
            $(".progress-group-container").append($progressContainer);

            deathTierColorText(tierPercentage, tier, $progressBar);


        }

        let dropdownSelect = localStorage.getItem("SHOW_PROGRESS_BARS");
        let normalizeSaved = localStorage.getItem("NORMALIZE_PROGRESS");

        if (normalizeSaved !== null) {
            $('#normalize-checkbox').prop('checked', normalizeSaved === "true");
            normalizeRatings = normalizeSaved === "true";
        } else {
            $('#normalize-checkbox').prop('checked', true);
            normalizeRatings = true;
        }

        if (dropdownSelect !== null) {
            if (dropdownSelect === "hide") {
                $('.progress-bar-display-container').hide();
                $('#none-dropdown').click();
            } else {
                $('#' + dropdownSelect).show();
                $('#' + dropdownSelect).click();
            }
        } else {
            $('.progress-bar-display-container').show();
            $('#tier-total-dropdown').click();
        }


        $("#rank-info-text").text(getRanking());

        //checking the checkbox wil trigger new progress bars
        $("#normalize-checkbox").click(function () {
            setNormalize(this.checked);
            $('#' + $("#dropdownMenuButton").attr('target-id')).click();
        });

        function setNormalize(flag) {
            normalizeRatings = flag;
            localStorage.setItem("NORMALIZE_PROGRESS", flag)
        }
        function shouldNormalize() {
            return normalizeRatings;
        }



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


            let pointsWeight = .1, placementWeight = .8, avgWeight = 1 - (placementWeight + pointsWeight);
            let finalRating = pointsWeight * pointsRating + placementWeight * placementRating + avgWeight * (playerInfo["points-average"] / 1000);
            finalRating = (10 * Math.max(0, finalRating || 0));

            let goldBonus = Math.min(playerInfo["world-records"], Math.min(1.25, Math.log(10 + playerInfo["world-records"]) / 3));
            let silverBonus = Math.min(playerInfo["silvers"] / 20, Math.min(0.5, Math.log(10 + playerInfo["silvers"]) / 8));

            finalRating = finalRating + (goldBonus + silverBonus);


            finalRating *= 3;

            let rankText = RANKING[Math.floor(finalRating)];

            let completionRate = playerInfo["runs-total"] / playerInfo["runs-possible"];


            let runtype = playerInfo["run-type"];
            let protip = "";
            if (runtype === "pro") {
                if (completionRate > .99) {
                    protip = "Go out and PRO-create!";
                } else if (completionRate > .95) {
                    protip = "PRO-bably cheating";
                } else if (completionRate > .90) {
                    protip = "PRO-tector of the realms";
                } else if (completionRate > .85) {
                    protip = "One True PRO-phet"
                } else if (completionRate > .80) {
                    protip = "The PRO-fessor";
                } else if (completionRate > .75) {
                    protip = "A Pro's Pro";
                } else if (completionRate > .70) {
                    protip = "PRO-digy";
                } else if (completionRate > .65) {
                    protip = "PRO-ficient prorunner";
                } else if (completionRate > .60) {
                    protip = "Pro-lific prorunner";
                } else {

                }

            } else if (completionRate > .99) {
                protip = "Achievement Unlocked: Completionist";
            } else if (completionRate > .95) {
                protip = "Almost there!"
            }
            if (protip !== "") {
                $("#run-info-label>span").addClass('tier-tooltip');
                $("#run-info-label").attr('title', protip);
            } else {
                $("#run-info-label>span").removeClass('tier-tooltip');
                $("#run-info-label").attr('title', "");
            }
            $("#rank-info-text").attr('title', finalRating.toFixed(2));

            return rankText;// + " ("+finalRating.toFixed(1)+")";
        }
        function getPlacementRank(r_val, r_base) {
            return Math.log(r_val) / Math.log(r_base);

        }


        function showProgressTotal(progressBarID, playerInfoKey, playerInfoSubKey) {
            $('.progress-bar-display-container').show();
            localStorage.setItem("SHOW_PROGRESS_BARS", progressBarID);
            for (let i = 1; i <= 6; i++) {
                let curVal = +playerInfo[playerInfoKey][i];
                let curMax = playerInfo[playerInfoKey][playerInfo[playerInfoSubKey]];
                setProgressBar(curVal, curMax, i);
            }

        }
        $('#tier-total-dropdown').click(function () {
            showProgressTotal(this.id, "runs-by-tier", "tier-max-maps");
        });
        $('#tier-records-dropdown').click(function () {
            showProgressTotal(this.id, "records-by-tier", "records-max-maps");
        });
        $('#tier-silvers-dropdown').click(function () {
            showProgressTotal(this.id, "silvers-by-tier", "silvers-max-maps");
        });
        $('#tier-bronzes-dropdown').click(function () {
            showProgressTotal(this.id, "bronzes-by-tier", "bronzes-max-maps");
        });
        $('#tier-average-dropdown').click(function () {
            $('.progress-bar-display-container').show();
            localStorage.setItem("SHOW_PROGRESS_BARS", this.id);
            for (let i = 1; i <= 6; i++) {
                let avgPoints = +playerInfo["points-average-by-tier"][i];
                let $curProgressBar = $("#progress-bar-" + i);
                let curPercentage = getPercentage(avgPoints, 0, 1000);

                deathTierColorText(curPercentage, i, $curProgressBar);
                setProgressWdith($("#progress-bar-" + i), curPercentage, avgPoints || 0);
                $('#progress-end-label-' + i).text(avgPoints.toFixed(1));
            }
        });
        $('#none-dropdown').click(function () {
            localStorage.setItem("SHOW_PROGRESS_BARS", "hide");
            $('.progress-bar-display-container').hide();
        });

        function setProgressBar(val, max, tier) {
            let progressBar = $("#progress-bar-" + tier);
            let normalizeText = "";
            if (shouldNormalize()) {
                max = +playerInfo["runs-possible-by-tier"][tier];
            }
            let percentage = getPercentage(val, 0, max);
            if (shouldNormalize()) {
                normalizeText = "/" + max + " (" + percentage.toFixed(1) + "%)";
            }

            deathTierColorText(percentage, tier, progressBar);
            setProgressWdith(progressBar, percentage, val + normalizeText);
            if (normalizeRatings) {
                $('#progress-end-label-' + tier).css('text-align', 'right');
            } else {
                $('#progress-end-label-' + tier).css('text-align', 'center');
            }
            $('#progress-end-label-' + tier).text(val + normalizeText);
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
            //$myProgressBar.html(myText);
        }
        function getPercentage(value, min, max) {
            // OR with 0 in case of NaN
            return (100 * value / max) || 0;

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

        dateArray = [[], [], [], [], [], [], []];
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
                $("#steamButton").attr('value', 'Fetch Times');
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

            let getday = x => Math.floor(x / (24 * 60 * 60 * 1000));
            var oldestDate = getday(Date.now())
            var newestDate = 0;
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


                teleports = field["teleports"];
                points = field["points"];
                date = field["created_on"];

                let mapday = getday(new Date(date));

                time = getTimeFromSeconds(field["time"]);

                if (typeof field["server_name"] === "string") {
                    server = field["server_name"].substring(0, 35);
                }
                if (map in finishedGlobals) {
                    tptier = difficultyArray[field["map_name"]][0];

                    if (tptier !== 0) {
                        var datapoint = { x: mapday, y: points, 'map': map, 'time': time, 'tp': teleports, 'date': date };

                        if (tptier == 3)
                            hardArray.push(datapoint);
                        if (tptier == 1)
                            easyArray.push(datapoint);

                        dateArray[tptier].push(datapoint);

                        if (mapday < oldestDate) {
                            oldestDate = mapday;
                        }
                        if (mapday > newestDate) {
                            newestDate = mapday;
                        }

                        playerInfo["dates-by-tier"][tptier].push({ "date": date, "points": points });

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

            playerInfo["oldest"] = oldestDate;
            playerInfo["newest"] = newestDate;

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

            if (radioTier < 0) {
                radioTier = playerInfo["tier-max-maps"];


            }
            createChart(radioTier);
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