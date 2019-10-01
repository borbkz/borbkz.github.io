
    let datapoints = {
        "protimes": [],
        "tptimes": [],
        "propoints": [],
        "tppoints": [],
        "teleports": [],
    }
    let tagtips = {};
    $(document).ajaxStop(function () {
        let showgraph = localStorage.getItem("SHOW_MAPS_GRAPH");
        if (showgraph !== null) {
            if(showgraph === "hide"){
                return true;
            }
                if (showgraph === "time") {
                    createChart(datapoints["protimes"], datapoints["tptimes"], 5, "time");
                }else if (showgraph === "teleports"){
                    createChart(datapoints["teleports"], datapoints["teleports"], 5, "teleports");
                }else {
                    createChart(datapoints["propoints"], datapoints["tppoints"], 5, "points");
                }
        } else {
            $('#times-dropdown').click();
        }
    });

    $.getJSON(jsonPath + "maptags.json", function (data) {
        tagtips = data;

    });


    function normalizeValues(data) {
        let max = Math.max.apply(Math, data);
        for (let i = 0; i < data.length; i++) {
            if (max != 0) {
                data[i] /= max;
            }
        }
        return data;
    }



    function createChart(prodata, tpdata, step, type) {
        let ctx = document.getElementById('my-chart').getContext('2d');

        let fillVal = false;
        let graphType = 'line';

        let tooltipCallback = {};
        let tickCallback = function (item, index) {
             if (item % 1 === 0) {return item;}
            
        }
        let proLabel = "Pro Points";
        let tpLabel = "TP Points";

        let max = Math.max(...prodata);
        max = Math.max(max, ...tpdata);
        let min = Math.min(...prodata);
        min = Math.min(min, ...tpdata);
        let len = Math.max(prodata.length, tpdata.length);

        let probackgroundFill = ['orange'];
        let tpbackgroundFill = ['green'];

        if (type == "time") {
            tooltipCallback = {
                label: function (tooltipItem, data) {
                    var indice = tooltipItem.index;
                    var index = tooltipItem.datasetIndex; 

                    return (index == 0? "Pro ": "TP ")+
                        getTimeFromSeconds(data.datasets[tooltipItem.datasetIndex].data[indice]);
                }
            };
            tickCallback = function (item, index) {
                if (index == 0 || index % 2 == 0) return getTimeFromSeconds(item);
            };
            proLabel = "Pro Times";
            tpLabel = "TP Times";
        }else if(type === "teleports"){
            proLabel = "Teleports";
            tpLabel = "Teleports";
            graphType = 'bar';
            min = Math.min(min,1);
            max = Math.max(max, 10);
            probackgroundFill = 'green';
            tpbackgroundFill = 'green';
        }

        
        let labels = [];
        for(let i = 1; i <= len; i++){
            labels.push(i);
        }

        labels[0] = "WR";
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
                responsive: false,
                tooltips: {
                    mode: 'label',
                    callbacks: tooltipCallback
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

        let container = $('.pro-table');
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
                    teleportData= [];
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
                        timeData.push(field["time"]);
                        teleportData.push(teleports);
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
                        `<span class="map-link"><a href="/local.html?steamid=${steam_id}&teleports=${teleports!=0}">${player}</a></span>`;
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
                    $('.title-map').text(map);
                    let tptierColor = TIERKEY[+tier][1];
                    let tptierText = TIERKEY[+tier][0];
                    let protierColor = TIERKEY[+protier][1];
                    let protierText = TIERKEY[+protier][0];

                    let tagarray = field[9].split("|");
                    let tagText = "";
                    for(let i = 0; i < tagarray.length; i++){
                        let curtag = tagarray[i].trim();
                        let tooltip = "";
                        if (curtag in tagtips){
                            tooltip = tagtips[curtag].description;
                        }
                            tagText += `<span style="border-bottom: 1px dotted" title="${tooltip}">${curtag}</span>, `
                    }
                    tagText = tagText.replace(/,\s*$/, "");

                    if(tier == 6){
                        tptierColor = "yellow";
                    }
                    if(protier == 6){
                        protierColor = "yellow";
                    }
                    

                    $(".map-description-sub-container").append(
                        `TP Tier: <span style='color:${tptierColor}'>${tptierText}</span><br>` +
                        `Pro Tier: <span style=' color:${protierColor}'>${protierText}</span><br>Length: ${length}<br>` +
                        `Tags: ${tagText}`);
                    //$("#map-info-tags").html(`<b>Tags:</b> ${tags}`);
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


        $('#none-dropdown').click(function () {
            localStorage.setItem("SHOW_MAPS_GRAPH", "hide");
            $('.map-chart').remove();
        });
        $('#times-dropdown').click(function () {
            localStorage.setItem("SHOW_MAPS_GRAPH", "time");
            $('.map-chart').remove();
            $('.chart-container').append('<canvas class="map-chart" id="my-chart"></canvas>')
            createChart(datapoints["protimes"], datapoints["tptimes"], 5, "time");
        });
        $('#teleports-dropdown').click(function () {
            localStorage.setItem("SHOW_MAPS_GRAPH", "teleports");
            $('.map-chart').remove();
            $('.chart-container').append('<canvas class="map-chart" id="my-chart"></canvas>')
            createChart(datapoints["teleports"], datapoints["teleports"], 5, "teleports");
        });
        $('#points-dropdown').click(function () {
            localStorage.setItem("SHOW_MAPS_GRAPH", "points");
            $('.map-chart').remove();
            $('.chart-container').append('<canvas class="map-chart" id="my-chart"></canvas>')
            createChart(datapoints["propoints"], datapoints["tppoints"], 5, "points");

        });

        let showgraph = localStorage.getItem("SHOW_MAPS_GRAPH");
        if (showgraph !== null) {
            if (showgraph === "hide") {
                $('#none-dropdown').click();
            } else if (showgraph === "time") {
                $('#times-dropdown').click();
            } else if( showgraph === "teleports"){
                $('#teleports-dropdown').click();

            }else {
                $('#points-dropdown').click();

            }
        } else {
            $('#times-dropdown').click();

        }
        //displayEmptyMap();
        myMaps = getMaps();
    });