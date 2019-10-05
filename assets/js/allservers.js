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


var dateArray = [[], [], [], [], [], [], []];
var playerInfo = getEmptyPlayer();

function createProgressionChart(tier) {

    let ctx = document.getElementById('my-chart').getContext('2d');
    let tiertext = TIERKEY[tier][0];
    let tiercolor = TIERKEY[tier][1];

    let data = dateArray[tier];

    let bestfit = linearLeastSquares(data);

    let xmin = bestfit[0]["x"];
    let xmax = bestfit[1]["x"];
    let linecolor = "black";

    let titleMargin = 0;
    let percentageIncrease = (100 * (bestfit[1]["y"] - bestfit[0]["y"]) / 1000) || 0;

    let months = Math.floor((xmax - xmin) / (30));
    let remainingDays = (xmax - xmin) - 30 * months;


    let duration = months + " Months, " + remainingDays + " Days";
    if (months < 1) {
        duration = remainingDays + " Days";
    }
    if (remainingDays < 1) {
        duration = months + " Months";
    }


    let improvementText = (percentageIncrease >= 0.0 ? "Improvement" : "Deterioration")

    let title = () => `${tiertext} Tier: ${Math.abs(percentageIncrease.toFixed(1))}% ${improvementText} Over The Last ${duration}`;

    const monthNames = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    let chartConfig = {
                type: 'scatter',
                data: {
                    datasets: [{
                        label: tiertext,
                        data: data,
                        backgroundColor: tiercolor,
                        label: tiertext,
                        borderColor: linecolor,
                    }, {
                        label: "Best Fit (LLS)",
                        data: bestfit,
                        backgroundColor: 'black',
                        borderColor: linecolor,
                        borderWidth: 2,
                        fill: false,
                        tension: 0,
                        showLine: true,
                        radius: 0
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
                    elements:{

                        line:{
                            cubicInterpolationMode: 'monotone',

                        }
                    },
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
                    },
                    label: {
                        display: false,
                    },

                    events: ['mousemove'],

                    responsive: true,
                    tooltips: {
                        displayColors: false,
                        enabled: true,
                        mode: 'label',
                        filter: function (tooltipItem) {
                            return tooltipItem.datasetIndex === 0;
                        },

                        callbacks: {

                            label: function (tooltipItem, data) {

                                let pointData = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index];

                                let vals = ["map", "time", "tp", "date"];
                                for (let i = 0; i < vals.length; i++) {
                                    if (!(vals[i] in pointData)) {
                                        return "N/A";
                                    }
                                }
                                let labelStrings = [];
                                let points = pointData["y"];
                                let tps = pointData["tp"];
                                let originaldate = pointData["date"];
                                let map = pointData["map"];
                                let time = pointData["time"];
                                try {
                                    originaldate = originaldate.substring(0, originaldate.indexOf("T"));
                                } catch (e) {
                                    console.log(e);

                                }
                                //let simpleDate = new Date(timestamp * 24 * 60 * 60 * 1000).toJSON().slice(0, 10).replace(/-/g, '/');
                                labelStrings.push(map);
                                labelStrings.push(points + " Pts, " + tps + " TPs");
                                labelStrings.push(time);
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
                                max: 1000,
                                min: 0,
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
                                    let month = monthNames[parseInt(mydate[1], 10)];
                                    return month + " " + mydate[0];
                                }
                            }
                        }]
                    }
                }
            }//end config

    if (typeof myChart === 'undefined') {
        myChart = new Chart(ctx,chartConfig);

    }else{
        //myChart.destroy();
        myChart.data.datasets[0].data = data;
        myChart.data.datasets[0].backgroundColor = tiercolor;
        myChart.data.datasets[0].label = tiertext;
        myChart.data.datasets[1].data = bestfit;

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
        "oldest": 0,
        "server-completions": {},
    }

}

var radioTier = -1;


function createMap(mapName, mapTime) {

    if(!$('#distribution-btn').parent().hasClass('active')){

    $('#distribution-btn').click();
    }

    //go to top of map
    $('#map-info-link').attr('href', 'maps.html?map=' + mapName);
    window.scrollTo(0,0);
    let has_teleports = $('input[name=isprorun-radio]:checked').val() !== "proradio";

    $.getJSON(MAP_ID_URL + mapName, function (data) {

        if (typeof data === 'undefined' || data.length ===  0) {
                alert("Not enough times have been registered!")
                return true;
        }
        let mapid = data[0]['id'];

        $.getJSON(MAP_NAME_URL + '&has_teleports=' + has_teleports + '&map_ids=' + mapid, function (data) {
            if (typeof data === 'undefined' || data.length === 0) {
                alert("Not enough times have been registered!")
                return true;
            }

            let map = data[0];
            createMapDistribution(mapName, map['c'], map['d'], map['loc'], map['scale'], mapTime);
        });
    });
}

function createDefaultDistribution() {
    let c = 12.080335928402382;
    let d = 0.31754654878247446;
    let loc = -0.47595114150014428;
    let scale = 57.161919391160936;
    let map = 'bkz_cg_coldbhop';
    createMapDistribution(map, c, d, loc, scale);
}

var distributionChart;
function createMapDistribution(map, c, d, loc, scale, mytime) {

    $('#map-info-link').attr('href','/maps.html?map='+map);
    $('#map-info-link').text(map + " (Click here for more details)");

    let times = [], datas = [];

    let MAXHOURS = 3;
    let xMin = 0;
    let index = 0;
    let step = 1;
    let precision = 4;
    let title = () => 'Burr XII survival function for ' + map +
        ` (c = ${c.toFixed(precision)}, d = ${d.toFixed(precision)}, loc = ${loc.toFixed(precision)}, scale = ${scale.toFixed(precision)})`;
    //increment by seconds until 1 minute
    let threshold = .9999;
    while (index < MAXHOURS * 60 * 60) {
        let y = survival(index, c, d, loc, scale);

        if (y < .05) {
            break
        };

        if (y < threshold && xMin == 0) {
            xMin = index;
        }

        times.push(index);
        datas.push(Math.min(1.0, .0005 + y));//fudge

        index += step;
    }

    let myTimeRadius = 0;
    let myTimeFill = false;
    let myTimeBackgroundColor = 'rgba(0,0,0,0)';
    let myTimeBorderColor = 'rgba(255,0,0,0)';
    let myTimeX = -1, myTimeY = -1;

    if(typeof mytime !== 'undefined'){
        let mytimesplit = mytime.split(":");

        if(mytimesplit.length == 3){
            myTimeX = Math.floor((+mytimesplit[0] * 3600 + +mytimesplit[1] * 60 + +mytimesplit[2])||0);
        }

        myTimeRadius = 7;
        myTimeFill = true;
        myTimeBackgroundColor = 'rgba(255,0,102,.6)';
        myTimeBorderColor = 'rgba(255,0,102,1)';
        myTimeY = survival(myTimeX, c,d,loc,scale)
    }


    let ctx = $('#distribution-chart')[0];

        let chartConfig = {
            type: 'line',
            data: {
                labels: times,
                datasets: [{
                    label: 'Probability That Time is Optimal',
                    data: datas,
                    borderColor: 'rgba(153,204,255,1)',
                    backgroundColor: 'rgba(153, 204, 255, .3)',
                    borderWidth: 3,
                    fill: true,
                    radius: 0,

                },{
                    label: 'Your Time',
                    data: [{x:myTimeX, y:myTimeY}],
                    borderColor: myTimeBorderColor, 
                    backgroundColor: myTimeBackgroundColor,
                    fill: myTimeFill,
                    radius: myTimeRadius,
                }
            
            ]
            },
            options: {
                responsive: true,
                title: {
                    display: true,
                    text: title(),
                    fontSize: 16,
                },
                tooltips: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function (tooltipItem, data) {
                            let pointData = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index];

                            let percentile = pointData * 100;
                            return percentile.toFixed(2) + '%';
                        }
                    }

                },
                hover: {

                    mode: 'index',
                    intersect: false,
                },
                legend: {
                    display: true,
                },
                scales: {
                    xAxes: [{
                        display: true,
                        ticks: {
                            min: xMin,
                            maxTicksLimit: 30,
                            autoskip: true,
                            callback: function (value, index, values) {

                                return getShortTimeFromSeconds(value);
                            }
                        }
                    }],
                    yAxes: [{
                        display: true,
                        ticks: {
                            min: 0,
                            max: 1,
                            callback: function (value, index, values) {

                                let toppercentile = value * 100;

                                return toppercentile.toFixed(0) + "%";

                            }
                        },
                        scaleLabel: {
                            display: false,
                        },
                    }]
                }
            }
    } 

    if (typeof distributionChart === 'undefined') {
        distributionChart = new Chart(ctx,chartConfig);
        
    } else {

        distributionChart.destroy();
        distributionChart = new Chart(ctx,chartConfig);
    }


}


let serverChart;
function createServerChart() {


    let otherColors = 'lightgrey';
    let backgroundColors = ["#3e95cd", "#8e5ea2", "#3cba9f", "#e8c3b9", "#c45850",
        'khaki', 'green', 'peru', 'orange','#ff5050','#77b300'];
    backgroundColors.push(otherColors);
    let maxNamedServers = backgroundColors.length - 1;

    let serverCompletions = Object.values(playerInfo["server-completions"]);
    serverCompletions.sort((a, b) => b[1] - a[1]);

    let data = serverCompletions.map(x => x[1]).slice(0, maxNamedServers);
    let serverNames = serverCompletions.map(x => x[0]).slice(0, maxNamedServers);

    let serverTotalCompletions = serverCompletions.reduce((a, b) => a + b[1], 0);

    let otherCompletionsTotal = 0;
    if (serverCompletions.length > maxNamedServers) {
        let otherServers = serverCompletions.slice(maxNamedServers);
        otherCompletionsTotal = otherServers.reduce((a, b) => a + b[1], 0);
        serverNames.push("Other")
        data.push(otherCompletionsTotal);
    }
    let ctx = $('#server-chart')[0];


        let chartConfig = {
        type: 'pie',
        data: {
            labels: serverNames.map(x => x.substring(0, 15).trim()+ '...'),
            datasets: [{
                label: serverNames,
                backgroundColor: backgroundColors,
                data: data,
            }]
        },
        options: {
            responsive: true,
            tooltips: {
                callbacks: {
                    label: function (tooltipItem, data) {
                        let pointData = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index];

                        var label = data.datasets[tooltipItem.datasetIndex].label[tooltipItem.index] || "";
                        var labelStrings = [];

                        labelStrings.push(label);
                        let percentage = 100 * (pointData / serverTotalCompletions)
                        labelStrings.push(pointData + " Maps (" + percentage.toFixed(1) + "%)");

                        return labelStrings;
                    }
                },
            },
            legend: {
                display: true,
                labels: {
                    fontColor: 'white',
                    fontSize: 16,
                }
            },
            title: {
                display: true,
                fontColor: 'white',
                fontSize: 20,
                text: 'Percentage of Total Completions by Server (' + serverTotalCompletions + " Maps Total)",
            }
        }
    }


    if (typeof serverChart === 'undefined') {
        serverChart = new Chart(ctx,chartConfig);
    } else {
        serverChart.destroy();
        serverChart = new Chart(ctx,chartConfig);
    }

}
let powerChart;
function createPowerChart() {
    let labels = ["Ladder", "Surf", "Bhop", "Tech", "Combo"];

    let data = [];
    for (let i = 0; i < labels.length; i++) {
        data.push(Math.max(20, Math.random() * 100));
    }

    let ctx = $('#power-chart')[0];


        let chartConfig = {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: "Points Average",
                    fill: true,
                    backgroundColor: "rgba(135,206,235,0.2)",
                    borderColor: "rgba(135,206,235,1)",
                    pointBorderColor: "#fff",
                    pointBackgroundColor: "rgba(135,206,235,1)",
                    pointBorderColor: "#fff",
                    data: data,
                }
            ]
        },
        options: {
            responsive: true,
            tooltips: {
                callbacks: {
                    label: function (tooltipItem, data) {
                        let pointData = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index];
                        return pointData;
                    }
                },
            },
                legend: {
                display: false,
            },
            scale: {
                ticks: {
                    beginAtZero: true,
                    min: 0,
                    max: 100,
                    stepSize: 20,
                },
                gridLines: {
                    color: 'white',
                },
                angleLines: {
                    color: 'white',
                },
                pointLabels: {
                    fontColor: 'white',
                    fontSize: 16,
                },
            },
            title: {
                display: true,
                text: 'Skill Level by Category (work in progress, currently random)',
                fontColor: 'white',
                fontSize: 20,
            }
        }
    }


    if (typeof powerChart === 'undefined') {
        powerChart = new Chart(ctx, chartConfig);
    } else {
        powerChart.destroy();
        powerChart = new Chart(ctx, chartConfig);
    }
}

$(document).ajaxStop(function () {

})
$(document).ready(function () {

        let oldHideStatus = localStorage.getItem("SHOW_PROGRESS_BARS");
        if(oldHideStatus!==null && oldHideStatus==="hide"){
            localStorage.removeItem('SHOW_PROGRESS_BARS');
        }

    createPowerChart();
    createServerChart();
    createDefaultDistribution();



    function defaultProgressionPlot() {
        //if (radioTier < 0) {
        //radioTier = playerInfo["tier-max-maps"];
        //}
        //$('#tier-' + radioTier + '-radio').click();
        $('.progress-tier-radio:first').change();
    }
    $('.type-selection-btn').change(function () {
        $('.player-info-upper').hide();
        let target_id = $(this).attr('target');
        $('#' + target_id).show();
        //canvas elements dont' scale well if it was drawn while hidden

    });

    $('#progression-btn').change(function () {
        defaultProgressionPlot();
    });
    $('#distribution-btn').change(function () {
        createDefaultDistribution();
    });

    $('#power-btn').change(function () {
        createPowerChart();
    });

    $('#server-btn').change(function () {
        createServerChart();
    });


    function defaultMenuButton() {
        $('.type-selection-btn:first').click();
        //$('.player-info-upper').hide();
        //$('#completion-btn').change();
    }

    defaultMenuButton();

    $('#reset-zoom').click(function () {
        if (typeof myChart !== 'undefined') {
            myChart.resetZoom();
        }
    });

    $("input[name=tier-radio]").on("change", function () {
        radioTier = $("input[name=tier-radio]:checked").val();
        createProgressionChart(radioTier);
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
        let shortname = playerInfo["player-name"].substring(0,20);
        let playerTitle = "Your Times Across All Servers";
        if(shortname !== "N/A"){
            playerTitle = shortname + "'s Times Across All Servers";
        }
        $("#player-info-text").text(shortname);
        $('#allservers-title').text(playerTitle);

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

            //$('.dropdown-item:first').click();

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
                let avgPoints = +playerInfo["points-average-by-tier"][i] || 0;
                let $curProgressBar = $("#progress-bar-" + i);
                let curPercentage = getPercentage(avgPoints, 0, 1000);

                $curProgressBar.text('');
                deathTierColorText(curPercentage, i, $curProgressBar);
                setProgressWdith($("#progress-bar-" + i), curPercentage, avgPoints || 0);
                $('#progress-end-label-' + i).text(avgPoints.toFixed(0));
            }
        });

        function setProgressBar(val, max, tier) {
            let progressBar = $("#progress-bar-" + tier);
            let normalizeText = val;
            let bartext = val;
            if (shouldNormalize()) {
                max = +playerInfo["runs-possible-by-tier"][tier];
            }
            let percentage = getPercentage(val, 0, max);
            if (shouldNormalize()) {
                normalizeText = percentage.toFixed(1) + "%";
                bartext = val + '/' + max;
            }
            $('#progress-bar-' + tier).text(bartext);

            deathTierColorText(percentage, tier, progressBar);
            setProgressWdith(progressBar, percentage, val + normalizeText);
            $('#progress-end-label-' + tier).text(normalizeText);
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
            window.maps = [];


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

                        dateArray[tptier].push(datapoint);

                        if (mapday < oldestDate) {
                            oldestDate = mapday;
                        }
                        if (mapday > newestDate) {
                            newestDate = mapday;
                        }

                        let serverCompletions = playerInfo["server-completions"];
                        if (server in serverCompletions) {
                            serverCompletions[server][1]++;
                        } else {
                            serverCompletions[server] = [server, 1];
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
            if (globalTable){

                globalTable.destroy();
            }

            $("#steamButton").attr('value', 'Fetch Times');

            $("#global-tooltip").show();



            cols[0] = {
                className: "htLeft",
                readOnly: true,
                renderer: function (instance, td, row, col, prop, value, cellProperties) {
                    let timeInSec = -1;
                    let myRow = maps.filter(function(m){
                        return m[0] === value;
                    });
                    if(myRow.length != 0 ){
                        if(myRow[0][globalHeader.indexOf("Time")] !== "N/A"){
                            timeInSec = myRow[0][globalHeader.indexOf("Time")];
                        }
                    }

                    Handsontable.renderers.TextRenderer.apply(this, arguments);
                    td.innerHTML = `<span class="map-link" style="color: black !important" onclick="createMap('${value}','${timeInSec}')">` + value + '</span>';
                    return td;
                }
            };
            globalTable = genTable(spreadsheetContainer, maps, globalHeader, [globalHeader.indexOf("Map"), globalHeader.indexOf("Time"),
            globalHeader.indexOf("Server"), globalHeader.indexOf("Tier"), globalHeader.indexOf("Pro Tier"), globalHeader.indexOf("Length"), globalHeader.indexOf("Date")], cols, { column: globalHeader.indexOf("Pts"), sortOrder: "desc" }, false);

            globalTable.updateSettings({
                hiddenColumns: {
                    indicators: true,
                    columns: []
                }
            })

            printPlayerProfile();

            defaultProgressionPlot();
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