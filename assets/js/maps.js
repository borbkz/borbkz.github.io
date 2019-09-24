var tagsArray = {};
var wordArray = [];
var tagContainer = $("#svgContainer");


var tagDataMap = {};

$.getJSON(jsonPath + "maptags.json", function (data) {

    tagDataMap = data;


});
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
                        filteredMaps += map + ", ";
                    }
                }

            }
            filteredMaps = filteredMaps.replace(/,\s*$/, "");

            $("#include-filter-container").html("<h4>" + includeFilterText + "</h4><br>");
            $("#exclude-filter-container").html("<h4>" + excludeFilterText + "</h4><br>");
            $("#maplist-container").html("<h4>" + filteredMaps + "</h4>");

        }


        var maxLength = 0;
        var minLength = 1000;
        for (tag in tagsArray) {
            //ugly hack will fix later

            var tagLength = Math.min(40, tagsArray[tag].length);
            if (tagLength > maxLength)
                maxLength = tagLength;

            if (tagLength < minLength)
                minLength = tagLength;

            wordArray.push({ text: tag, length: tagLength, maps: tagsArray[tag], displaySize: Math.min(40, tagLength) });
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
                .rotate(function () { return 0 })
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

                        console.log("rendered: " + maxRendered + " out of " + words.length);
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