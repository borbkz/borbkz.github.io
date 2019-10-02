var tagsArray = {};
var wordArray = [];
var tagContainer = $("#svgContainer");

var mapRecordLimit = 20;
var mapURLBase = "https://kztimerglobal.com/api/v1.0/records/top?modes_list_string=kz_timer&stage=0&limit=" + mapRecordLimit + "&tickrate=128"
var mapProURLBase = mapURLBase + "&has_teleports=false";
var mapTPURLBase = mapURLBase + "&has_teleports=true";
var mapNameURI = "&map_name=";

var tagDataMap = {};
var mapInfo = {};


function loadTags() {
    $.when(loadTagData()).done(function (data) {
        tagDataMap = data;
        getMapArray();
    });

}
function loadTagData() {
    return $.getJSON(jsonPath + "maptags.json", function (data) {

    });

}

var currentMaps = {};
var includeFilters = {};
var excludeFilters = {};
function getMapArray() {
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
        "Misc": 9
    }




    $.getJSON(difficultyJSON, function (data) {


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
            misc = field[mapKeys["Misc"]];

            var miscArray = misc.split("|");

            for (var i = 0; i < miscArray.length; i++) {
                var key = miscArray[i].trim();
                if (key !== "") {

                    if (key in tagsArray) {
                        tagsArray[key].push(map)
                    } else {
                        tagsArray[key] = [map]
                    }

                }


            }
            currentMaps[map] = true;
            mapInfo[map] = {};
            for (var key in mapKeys) {

                mapInfo[map][key] = field[mapKeys[key]];

            }

        });

        function displayCurrentMaps() {


            var includeFilterText = "";
            var excludeFilterText = "";

            var includeFilterKeys = Object.keys(includeFilters);
            var excludeFilterKeys = Object.keys(excludeFilters);
            if (includeFilterKeys.length > 0) {
                includeFilterText = "Include: " + includeFilterKeys.join(", ");
            }
            if (excludeFilterKeys.length > 0) {
                excludeFilterText = "Exclude: " + excludeFilterKeys.join(", ");
            }

            var filteredMaps = "";

            if (includeFilterKeys.length > 0 || excludeFilterKeys.length > 0) {
                for (var map in currentMaps) {
                    if (currentMaps[map]) {
                        filteredMaps += '<span class="map-link">' + map + "</span>, ";
                    }
                }

            }
            filteredMaps = filteredMaps.replace(/,\s*$/, "");

            $("#include-filter-container").html(includeFilterText + "<br>");
            $("#exclude-filter-container").html(excludeFilterText + "<br>");
            $("#maplist-container").html(filteredMaps);

        }




        var maxLength = 0;
        var minLength = 1000;
        var index = 0;
        for (tag in tagsArray) {
            //ugly hack will fix later

            var tagLength = Math.min(40, tagsArray[tag].length);
            if (tagLength > maxLength)
                maxLength = tagLength;

            if (tagLength < minLength)
                minLength = tagLength;


            wordArray.push({ text: tag, length: tagLength, maps: tagsArray[tag], position: index++ });
        }


        var minWordSize = 20;
        var maxWordSize = 100;
        (function () {
            var wordScale = d3.scaleLinear().domain([20, 40, 50, 100]).range([1, 20, 50, 200]).clamp(true);
            //var wordScale=d3.scaleLinear().domain([1,200]).range([50,100]).clamp(true);

            var fill = d3.scaleOrdinal(d3.schemeCategory10);
            var words = wordArray;
            var width = 800;
            var height = 2 * maxWordSize * words.length / 10;
            for (var i = 0; i < words.length; i++) {
                var potentialSize = words[i].length;


                var interp = (potentialSize - minLength) / (maxLength - minLength);

                //linear ramp
                words[i].size = minWordSize + interp * (maxWordSize - minWordSize);
                //words[i].size = words[i].length;

                var typeColorMap = tagDataMap["type-color"];
                words[i].color = typeColorMap["other"];
                $('.ladder-color').css('color', typeColorMap["ladder"]);
                $('.surf-color').css('color', typeColorMap["surf"]);
                $('.bhop-color').css('color', typeColorMap["bhop"]);
                $('.tech-color').css('color', typeColorMap["tech"]);
                $('.chain-color').css('color', typeColorMap["chain"]);
                $('.strafe-color').css('color', typeColorMap["strafe"]);
                $('.booster-color').css('color', typeColorMap["booster"]);
                $('.meta-color').css('color', typeColorMap["meta"]);

                for (var tag in tagDataMap) {
                    var thisTag = tagDataMap[tag];
                    var ismatch = words[i].text.toLowerCase() === tag;

                    if (ismatch) {
                        if (thisTag.type in typeColorMap) {
                            words[i].color = typeColorMap[thisTag.type];
                        } else {

                        }
                        break;
                    }

                }

                //use clamp
            }

            d3.layout.cloud()
                .size([width, height])
                .words(words)
                .padding(5)
                .rotate(function () { return Math.random() * 10 - 5 })
                .font("Impact")
                .fontSize(function (d) { return d.size; })
                .on("end", draw)
                .start();

            function draw(wordArray) {
                var maxRendered = 0;

                d3.select("#svgContainer")
                    .append("svg")
                    .attr("width", width)
                    .attr("height", height)
                    .append("g")
                    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")")
                    .selectAll("text")
                    .data(words)
                    .enter()
                    .append("text")
                    .style("font-size", function (d) {
                        maxRendered++;
                        //return wordScale(d.size) + "px";
                        return d.size + "px";
                    })
                    .style("font-family", "Impact")
                    .style("fill", function (d, i) {
                        return d.color;
                    })
                    .attr("text-anchor", "middle")
                    .attr("value", "off")
                    .attr("id", function (d) {
                        var id = d.text.replace(/\s+/g, '-') + "-id";
                        d.id = id;
                        return id;
                    })
                    .attr("transform", function (d) {
                        return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
                    })
                    .text(function (d) { return d.text; })
                    .on("click", function (d, i) {

                        var $tag = $('#' + d.id);


                        var selectStatus = $tag.attr('value');


                        $tag.css("stroke", "white");
                        $tag.css("stroke-width", "3px");
                        $tag.css("fill", "black");

                        if (d.size < 2 * minWordSize) {
                            $tag.css("stroke-width", "1px");
                        }

                        //any map removed from current pool goes into deleted pool
                        //any map removed from deleted pool goes into current pool

                        if (selectStatus === "off") {
                            includeFilters[d.text] = "on";
                            //add all maps that match include but don't match exclude

                            $tag.attr('value', 'include');
                            $tag.text(d.text + ' \u2714')//checkmark

                        } else if (selectStatus === "include") {
                            excludeFilters[d.text] = "on";
                            delete includeFilters[d.text];
                            //remove all current maps that match exclude, move them to deleted maps 
                            $tag.attr('value', 'exclude');
                            $tag.text(d.text + ' \u2717')//x mark

                        } else {
                            delete includeFilters[d.text]
                            delete excludeFilters[d.text]

                            $tag.css("stroke", "none");
                            $tag.css("stroke-idth", "0px");
                            $tag.css("fill", d.color);
                            $tag.attr('value', 'off');
                            $tag.css('font-size', d.size);
                            $tag.text(d.text) //remove checkmark
                        }


                        for (var curMap in currentMaps) {

                            var includeFlag = true;
                            for (var filter in includeFilters) {
                                if (!tagsArray[filter].includes(curMap)) {
                                    includeFlag = false;
                                    break;
                                }
                            }

                            var excludeFlag = false;
                            for (var filter in excludeFilters) {
                                if (tagsArray[filter].includes(curMap)) {
                                    excludeFlag = true;
                                    break;
                                }
                            }

                            if (includeFlag && !excludeFlag) {
                                currentMaps[curMap] = true;
                            } else {
                                currentMaps[curMap] = false;
                            }

                        }
                        displayCurrentMaps();
                        $(".map-link").on('click', function (event) {
                            $("#map-info").show();
                            var mapname = $(event.target).text().toLowerCase().trim();
                            var proURL = mapProURLBase + mapNameURI + mapname;
                            var tpURL = mapTPURLBase + mapNameURI + mapname;
                            var tptier = "", protier = "", tptierColor = "", protierColor = "", length = "", tags = "";
                            try {
                                tptier = TIERKEY[+mapInfo[mapname]["Tier"]][0];
                                protier = TIERKEY[+mapInfo[mapname]["Pro Tier"]][0]
                                tptierColor = TIERKEY[+mapInfo[mapname]["Tier"]][1];
                                protierColor = TIERKEY[+mapInfo[mapname]["Pro Tier"]][1];
                                length = mapInfo[mapname]["Length"];
                                tags = mapInfo[mapname]["Misc"].split("|").join(",").replace(/\s\s+/g, ' ');
                            } catch (error) {
                                console.log(error);
                            }
                            if (tptierColor === "black") {
                                tptierColor = "yellow";
                            }
                            if (protierColor === "black") {
                                protierColor = "yellow";
                            }

                            $("#map-info-name").html(`Map: ${mapname}`);
                            $("#map-info-description").html(`<b>TP Tier:</b> <span style='color:${tptierColor}'><b>${tptier}</b></span>, ` +
                                `<b>Pro Tier:</b> <span style=' color:${protierColor}'><b>${protier}</b></span>, <b>Length:</b> ${length}`);
                            $("#map-info-tags").html(`<b>Tags:</b> ${tags}<br><br><a href="/maps?map=${mapname}">View map info page</a>`);
                            fetch(proURL).then(response => {
                                return response.json();
                            }).then(proRun => {
                                var record = proRun[0];
                                var server = record["server_name"];
                                var player = record["player_name"];
                                var time = record["time"];
                                $("#pro-run-wr").html(`Pro WR: ${player} (${getTimeFromSeconds(time)})`);

                            }).catch((error) => {
                                $("#pro-run-wr").html(`Pro WR: Not Found`);
                                console.log(error)
                            });

                            fetch(tpURL).then(response => {
                                return response.json();
                            }).then(tpRun => {
                                var record = tpRun[0];
                                var server = record["server_name"];
                                var player = record["player_name"];
                                var time = record["time"];
                                $("#tp-run-wr").html(`TP WR: ${player} (${getTimeFromSeconds(time)})`);

                            }).catch((error) => {

                                $("#tp-run-wr").html(`TP WR: Not Found`);
                                console.log(error)
                            });
                        });

                    }).append("svg:title")
                    .text(function (d) {

                        var tooltip = "";
                        if (d.text in tagDataMap)
                            tooltip = tagDataMap[d.text].description;

                        return tooltip;


                    });

            }


        })();



    }); //end json

}