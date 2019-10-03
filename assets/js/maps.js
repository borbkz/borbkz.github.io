
let datapoints = {
    "protimes": [],
    "tptimes": [],
    "propoints": [],
    "tppoints": [],
    "teleports": [],
    "teleport-density": [],
    "top20tpavg": 0,
    "top20proavg": 0,
    "top100proavg": 0,
    "top100tpavg": 0,
    "top20prosd": 0,
    "top20tpsd": 0,
    "top100prosd": 0,
    "top100tpsd": 0,
    "top20procv": 0,
    "top20tpcv": 0,
    "top100procv": 0,
    "top100tpcv": 0,
    "tier": 0
}
let tagtips = {};

//$('#none-dropdown').click();
//} else if (showgraph === "time") {
//$('#times-dropdown').click();
//} else if( showgraph === "teleports"){
//$('#teleports-dropdown').click();

//}else {
//$('#points-dropdown').click();

//}
//} else {
//$('#times-dropdown').click();

$(document).ajaxStop(function () {
    let showgraph = localStorage.getItem("SHOW_MAPS_GRAPH");
    $("#calculated-length-text").text(calcLength());
    if (showgraph !== null) {
        if (showgraph === "hide") {
            return true;
        } else

            if (showgraph === "time") {
                $('#times-dropdown').click();
            } else if (showgraph === "teleports") {
                $('#teleports-dropdown').click();

            } else if (showgraph === "teleport-density") {
                $('#teleport-density-dropdown').click();
            } else {
                $('#points-dropdown').click();
            }
    } else {
        $('#times-dropdown').click();
    }

    let cv = coefficientOfVariation(datapoints["tptimes"],20);
    let procv = coefficientOfVariation(datapoints["protimes"],20);
    let l = x=>Math.sqrt(x);
    console.log(l(1+datapoints["tier"]));
    let compRating = l(1+datapoints["tier"])  * (1/cv);
    let procompRating =l(1+datapoints["tier"])  * (1/procv);
   $("#calculated-competitive-text").text(compRating.toFixed(1));
   $("#calculated-competitive-pro-text").text(procompRating.toFixed(1));
    //$("#calculated-tier-text").text(calcTier());
});

function calcLength(){
    let lengthMinutes = average(datapoints["tptimes"],20)/60;
    let calcLength = "Very Short";
    for(let i = 1; i < LENGTHKEY. length; i++){
        let timelimit = LENGTHKEY[i][2];
        if(lengthMinutes<= timelimit){
            calcLength = LENGTHKEY[i][0];
                break;
        }
    }
    return calcLength;
}

function calcTier(){
    let size = 20;
    let cv = coefficientOfVariation(datapoints["tptimes"], size);


    //return cv; 
    return 0;
}
$.getJSON(jsonPath + "maptags.json", function (data) {
    tagtips = data;

});

function setStatistics(type) {
    let proarr =datapoints["protimes"];
    let tparr =datapoints["tptimes"];
    if(type === "points"){
        proarr = datapoints["propoints"];
        tparr = datapoints["tppoints"];
    }else if(type === "teleports"){
        proarr = datapoints["teleports"];
        tparr = datapoints["teleports"];
    }else if (type === "teleport-density"){
        proarr = datapoints["teleport-density"];
        tparr = datapoints["teleport-density"];
    }

    datapoints["top20tpavg"] = average(tparr,20);
    datapoints["top100tpavg"] = average(tparr);
    datapoints["top20proavg"] = average(proarr,20);
    datapoints["top100proavg"] = average(proarr);

    datapoints["top20prosd"] = stddev(proarr,20);
    datapoints["top100prosd"] = stddev(proarr);
    datapoints["top20tpsd"] = stddev(tparr,20);
    datapoints["top100tpsd"] = stddev(tparr);

    datapoints["top20procv"] = coefficientOfVariation(proarr,20);
    datapoints["top100procv"] = coefficientOfVariation(proarr,100);
    datapoints["top20tpcv"] = coefficientOfVariation(tparr,20);
    datapoints["top100tpcv"] = coefficientOfVariation(tparr,100);
}
function calculateTier() {
    return 5;
}
function calculateProTier() {
    return 5;
}
function calculateLength() {
    return 5;
}




function createChart(prodata, tpdata, step, type) {
    let ctx = document.getElementById('my-chart').getContext('2d');

    let fillVal = false;
    let graphType = 'line';

    let tooltipCallback = {};
    let tickCallback = function (item, index) {
        if (item % 1 === 0) { return item; }

    }
    let proLabel = "Pro Points";
    let tpLabel = "TP Points";

    let max = Math.max(...prodata);
    max = Math.max(max, ...tpdata);
    let min = Math.min(...prodata);
    min = Math.min(min, ...tpdata);
    let len = Math.max(prodata.length, tpdata.length);

    let probackgroundFill = ['orange'];
    let tpbackgroundFill = ['limegreen'];

    if (type == "time") {
        tooltipCallback = {
            label: function (tooltipItem, data) {
                var indice = tooltipItem.index;
                var index = tooltipItem.datasetIndex;

                return (index == 0 ? "Pro " : "TP ") +
                    getTimeFromSeconds(data.datasets[tooltipItem.datasetIndex].data[indice]);
            }
        };
        tickCallback = function (item, index) {
            if (index == 0 || index % 2 == 0) return getTimeFromSeconds(item);
        };
        proLabel = "Pro Times";
        tpLabel = "TP Times";
    } else if (type === "teleports") {
        proLabel = "Teleports";
        tpLabel = "Teleports";
        graphType = 'bar';
        min = Math.min(min, 1);
        max = Math.max(max, 5);
        probackgroundFill = 'limegreen';
    } else if (type === "teleport-density") {
        proLabel = "TPs/minute";
        tpLabel = "TPs/minute";
        graphType = 'bar';
        max = Math.max(max, 5);
        min = 0;
        probackgroundFill = 'limegreen';
        tooltipCallback = {
            label: function (tooltipItem, data) {
                var indice = tooltipItem.index;
                var index = tooltipItem.datasetIndex;

                return (index == 0 ? "Pro " : "TP ") +
                    getTimeFromSeconds(data.datasets[tooltipItem.datasetIndex].data[indice]);
            }
        };

    }


    let labels = [];
    for (let i = 1; i <= len; i++) {
        labels.push(i);
    }

    labels[0] = "WR";
    title = (type.charAt(0).toUpperCase() + type.slice(1)) + ' Progression for Top 100';
    if(type === "teleport-density"){
    title = 'Teleport Frequency Progression for Top 100';

    }
    var myChart = new Chart(ctx, {
        type: graphType,
        
        data: {
            labels: labels,
            datasets: [{
                label: proLabel,
                fill: false,
                data: prodata,
                backgroundColor: probackgroundFill,
                borderColor: probackgroundFill,
                yAxisID: 'A',
                borderWidth: 1
            },

            {
                label: tpLabel,
                fill: false,
                data: tpdata,
                backgroundColor: tpbackgroundFill,
                borderColor: tpbackgroundFill,
                yAxisID: 'A',
                borderWidth: 1
            }

            ]
        },
        options: {
            title: {
                display: true,
                text: title 
            },
            responsive: false,
            tooltips: {
                mode: 'label',
                callbacks: tooltipCallback
                },
                elements: {
                    point:{
                        radius: 1
                    }
                },
            scales: {
                yAxes: [{
                    id: 'A',
                    type: 'linear',
                    position: 'left',
                    ticks: {
                        max: max,
                        min: min,
                        userCallback: tickCallback,
                    }
                }],
                xAxes: [{
                    ticks: {
                        beginAtZero: true,
                        autoSkip: true,
                        maxTicksLimit: 21
                    }
                }]
            }
        }
    });

}



var currentmap = "kz_zxp_interstellar_v2";
const PRO_URL_BASE =
    'https://kztimerglobal.com/api/v1.0/records/top?modes_list_string=kz_timer&stage=0&has_teleports=false&limit=100&tickrate=128&map_name='
const TP_URL_BASE =
    'https://kztimerglobal.com/api/v1.0/records/top?modes_list_string=kz_timer&stage=0&has_teleports=true&limit=100&tickrate=128&map_name='
var urls = {
    "pro": PRO_URL_BASE,
    "tp": TP_URL_BASE
};
var URI = getURIVars();

function displayMap(curmap) {

    $('.map-name').text(curmap);
    $.getJSON(jsonPath + 'map_thumbs.json', function (data) {
        mapthumbs = data;
        let thumbnail = mapthumbs[curmap];
        let mapImage = `url('${thumbnail}')`;
        $('.map-screenshot-container').css('background-image', mapImage);
    });

    $('tr').remove();
    $('td').remove();

    var headerHTML = `<tr class="header-line">` +
        `<td class="record-player-name">Player</td><td class="record-time">Time</td><td class="record-points">Pts</td>` +
        `<td class="record-teleports">TPs</td><td class="record-date">Date Run</td><td class="record-server">Server</td></tr></<tr>`;

    for (let url in urls) {
        $.getJSON(urls[url] + curmap, function (data) {
            if (data.length == 0) {
                //alert("No " + url + " times found for " + curmap + "!");
                return true;

            }
            let place = 1;

            if (url === "pro") {
                $('.pro-table').append($(headerHTML));
            } else {

                $('.tp-table').append($(headerHTML));
            }

            let pointsData = [],
                timeData = [],
                teleportData = [],
                teleportDensityData = [];
            let step = 5;

            $.each(data, function (i, field) {
                var player = sanitizeName(field["player_name"]).substring(0, 15);
                var teleports = field["teleports"];
                var time = getTimeFromSeconds(+field["time"]);
                var points = field["points"];
                var server = field["server_name"];
                let steam_id = field["steam_id"];
                if (server !== null)
                    server = server.substring(0, 15);
                var date = field["created_on"];
                let container = $('.pro-table');
                let $recordLine = "";


                pointsData.push(points);
                timeData.push(+field["time"]);
                teleportData.push(teleports);
                teleportDensityData.push(60 * (teleports / (+field["time"])) || 0);

                if (teleports != 0) {
                    container = $('.tp-table');
                }

                let medal = "";
                if (place == 1) {
                    medal = TROPHY["gold"];

                } else if (place > 1 && place <= 20) {
                    medal = TROPHY["silver"];
                }

                let playerLink =
                    `<span class="map-link"><a href="/local.html?steamid=${steam_id}&teleports=${teleports != 0}">${player}</a></span>`;
                $recordLine = $(`<tr class="record-line">` +
                    `<td class="record-player-name" style="text-align:left">${place}:${medal} ${playerLink}</td>
                            <td class="record-time">${time}</td>
                            var $recordLine = "";
                            <td class="record-points">${points}</td>` +
                    `<td class="record-teleports">${teleports}</td>
                            <td class="record-date">${date}</td>
                            <td class="record-server">${server}</td>
                        </tr>`
                );



                container.append($recordLine);
                place++;
            })

            if (url === "pro") {
                datapoints["protimes"] = timeData;
                datapoints["propoints"] = pointsData;
            } else {
                datapoints["tptimes"] = timeData;
                datapoints["tppoints"] = pointsData;
                datapoints["teleports"] = teleportData;
                datapoints["teleport-density"] = teleportDensityData;
            }

        });
    }
}

function getMaps() {
    var maps = [];
    var mapKeys = {
        "Map": 0,
        "Tier": 1,
        "Pro Tier": 2,
        "Length": 3,
        "Strafe": 4,
        "Bhop": 5,
        "Ladder": 6,
        "Surf": 7,
        "Tech": 8,
    }

    if (typeof URI["map"] !== 'undefined') {
        currentmap = URI["map"];

    }

    displayMap(currentmap);

    $.getJSON(difficultyJSON, function (data) {

        var header = ["Map", "Tier", "Pro Tier", "Length", "Strafe", "Bhop", "Ladder", "Surf", "Tech"];
        var cols = Array(header.length).fill({});
        var spreadsheetContainer = $("#spreadsheet")[0];

        $.each(data, function (i, field) {
            map = field[mapKeys["Map"]];
            tier = field[mapKeys["Tier"]];
            protier = field[mapKeys["Pro Tier"]];
            length = field[mapKeys["Length"]];
            strafe = field[mapKeys["Strafe"]];
            bhop = field[mapKeys["Bhop"]];
            ladder = field[mapKeys["Ladder"]];
            surf = field[mapKeys["Surf"]];
            tech = field[mapKeys["Tech"]];
            maps.push([map, tier, protier, length, strafe, bhop, ladder, surf, tech]);

            if (map === currentmap) {
                datapoints["tier"] = tier;
                $('.title-map').text(map);
                let tptierColor = TIERKEY[+tier][1];
                let tptierText = TIERKEY[+tier][0];
                let protierColor = TIERKEY[+protier][1];
                let protierText = TIERKEY[+protier][0];

                let tagarray = field[9].split("|");
                let tagText = "";
                for (let i = 0; i < tagarray.length; i++) {
                    let curtag = tagarray[i].trim();
                    let tooltip = "";
                    if (curtag in tagtips) {
                        tooltip = tagtips[curtag].description;
                    }
                    tagText += `<span style="border-bottom: 1px dotted" title="${tooltip}">${curtag}</span>, `
                }
                tagText = tagText.replace(/,\s*$/, "");

                if (tier == 6) {
                    tptierColor = "yellow";
                }
                if (protier == 6) {
                    protierColor = "yellow";
                }

                $('#tier-text').text(tptierText);
                $('#tier-text').css('color', tptierColor);
                $('#protier-text').text(protierText);
                $('#protier-text').css('color', protierColor);
                $('#length-text').text(length);
                $('#tag-text').html(tagText);

            }
        });

        $("#maps-tooltip").show();
        cols[0] = {
            className: "htLeft"
        };

        genTable(spreadsheetContainer, maps, header, [...Array(header.length).keys()], cols);


    }); //end json

}
$(document).ready(function () {

    $('.dropdown-menu a').click(function () {
        $('#dropdownMenuButton').text($(this).text());
        $('#dropdownMenuButton').attr('target-id', this.id);
    });

    function setStatLabels(type){

        let displaynum = x=>isNaN(x)?"none": x.toFixed(1);
        let displaynum2 = x=>isNaN(x)?"none": x.toFixed(2);
        let displaytime = x=>isNaN(x)?"none":getTimeFromSeconds(x);
        let displayfunc = displaynum; 
        let displayprofunc = displayfunc;
        let displaypronum2 = displaynum2;
        let cv = "% CV";

        if(typeof type !== 'undefined' && type === "time"){
            displayfunc = displaytime; 
            displayprofunc = displaytime;
        }

        if(typeof type !== 'unefined' && (type === "teleports" || type === 'teleport-density')){
          displayprofunc = x=> "none";  
          displaypronum2 = x=>"none";
          cv = "";
        }

        $('#top-20-tp-average > span').text(displayfunc(datapoints["top20tpavg"]));
        $('#top-100-tp-average > span').text(displayfunc(datapoints["top100tpavg"]));
        $('#top-20-pro-average > span').text(displayprofunc(datapoints["top20proavg"]));
        $('#top-100-pro-average > span').text(displayprofunc(datapoints["top100proavg"]));

        $('#top-20-tp-sd > span').text(`${displaynum2(datapoints["top20tpsd"])} (${displaynum2(datapoints["top20tpcv"])}% CV)`);
        $('#top-100-tp-sd > span').text(`${displaynum2(datapoints["top100tpsd"])} (${displaynum2(datapoints["top100tpcv"])}% CV)`);
        $('#top-20-pro-sd > span').text(`${displaypronum2(datapoints["top20prosd"])} (${displaypronum2(datapoints["top20procv"])}${cv})`);
        $('#top-100-pro-sd > span').text(`${displaypronum2(datapoints["top100prosd"])} (${displaypronum2(datapoints["top100procv"])}${cv})`);
    }

    $('#none-dropdown').click(function () {
        localStorage.setItem("SHOW_MAPS_GRAPH", "hide");
        $('.graph-label-container').hide();
        $('.map-chart').remove();
    });
    $('#times-dropdown').click(function () {
        localStorage.setItem("SHOW_MAPS_GRAPH", "time");
        $('.map-chart').remove();
        $('.chart-container').append('<canvas class="map-chart" id="my-chart"></canvas>')
        $('.graph-label-container').show();

        setStatistics("time");
        setStatLabels("time");

        createChart(datapoints["protimes"], datapoints["tptimes"], 5, "time");
    });
    $('#teleports-dropdown').click(function () {
        localStorage.setItem("SHOW_MAPS_GRAPH", "teleports");
        $('.map-chart').remove();
        $('.chart-container').append('<canvas class="map-chart" id="my-chart"></canvas>')
        $('.graph-label-container').show();

        setStatistics("teleports");
        setStatLabels("teleports");
        createChart(datapoints["teleports"], datapoints["teleports"], 5, "teleports");
    });

    $('#teleport-density-dropdown').click(function () {
        localStorage.setItem("SHOW_MAPS_GRAPH", "teleport-density");
        $('.map-chart').remove();
        $('.chart-container').append('<canvas class="map-chart" id="my-chart"></canvas>')
        $('.graph-label-container').show();

        setStatistics("teleport-density");
        setStatLabels("teleport-density");
        createChart(datapoints["teleport-density"], datapoints["teleport-density"], 5, "teleport-density");
    });
    $('#points-dropdown').click(function () {
        localStorage.setItem("SHOW_MAPS_GRAPH", "points");
        $('.map-chart').remove();
        $('.chart-container').append('<canvas class="map-chart" id="my-chart"></canvas>')
        $('.graph-label-container').show();

        setStatistics("points");
        setStatLabels("points");
        createChart(datapoints["propoints"], datapoints["tppoints"], 5, "points");
    });

    let showgraph = localStorage.getItem("SHOW_MAPS_GRAPH");
    if (showgraph !== null) {
        if (showgraph === "hide") {
            $('#none-dropdown').click();
        } else if (showgraph === "time") {
            $('#times-dropdown').click();
        } else if (showgraph === "teleports") {
            $('#teleports-dropdown').click();
        } else if (showgraph === "teleport-density") {
            $('#teleport-density-dropdown').click();
        } else {
            $('#points-dropdown').click();
        }
    } else {
        $('#times-dropdown').click();

    }
    //displayEmptyMap();
    myMaps = getMaps();
    });