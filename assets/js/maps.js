var tagsArray  = {};
var wordArray = [];
var tagContainer = $("#svgContainer");


var colorArray = {
    "180 tech surf": "purple",
    "dropdown": "purple",
    "drop": "red",
    "strafeheavy": "red",
    "chain": "orange", //chain has precedence, has to be first
    "ladder": "yellow",
    "surf": "cyan",
    "slide": "cyan",
    "bhop": "green",
    "kurouch": "green",
    "forced perf": "green",
    "hard bhop": "green",
    "hard multihop": "green",
    "hard singlehop": "green",
    "spikes": "green",
    "crouched headbanger": "purple",
    "hard tech": "purple",
    "headbanger": "purple",
    "boxtech": "purple",
    "gap jump": "purple",
    "booster": "pink",
    "block": "red",
    "prekeep": "red",
    "crouchjump": "red",
    "climb": "white",
    "combo": "white",
    "other": "lightgrey",
    "bhop": "green",
}
function getMapArray() {
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
        "Misc": 9
    }
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
            misc = field[mapKeys["Misc"]];

            var miscArray = misc.split("|");
            if(map === "kz_grass_hard"){
                console.log("printing grass hard")

                for(var i = 0; i < miscArray.length; i++){

                    console.log(i + " " + miscArray[i]);
                }
            }

            for (var i = 0; i < miscArray.length; i++) {
                var key = miscArray[i].trim();
                if (key !== "") {

                    //console.log("checking map " + map + " for key " + key);
                    if (key in tagsArray) {
                        tagsArray[key].push(map)
                    } else {
                        tagsArray[key] = [map]
                    }

                }


            }
            maps.push([map, tier, protier, length, strafe, bhop, ladder, surf, tech]);
        });

        var maxLength = 0;
        var minLength = 1000;
        for (tag in tagsArray) {
            //ugly hack will fix later

            var tagLength = Math.min(40, tagsArray[tag].length);
            if (tagLength > maxLength)
                maxLength = tagLength;

            if (tagLength < minLength)
                minLength = tagLength;
            
            wordArray.push({ text: tag, length: tagLength, maps: tagsArray[tag] });
        }


        var minWordSize = 20;
        var maxWordSize = 100;
        (function () {
            var wordScale=d3.scaleLinear().domain([20,40,50,100]).range([1,20,50,200]).clamp(true);
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
                words[i].color = colorArray.other;
                for (var techtype in colorArray) {
                    var ismatch = words[i].text.toLowerCase().includes(techtype);

                    if (ismatch) {
                        words[i].color = colorArray[techtype];
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
                var maxRendered = 1;

                var currentMaps = [];
                var deletedMaps = [];
                var filteredOutMaps = [];
                var currentFilters = {};
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
                        console.log("rendered: " + maxRendered + " out of " + words.length);
                        maxRendered++;
                        //return wordScale(d.size) + "px";
                        return d.size + "px";
                    })
                    .style("font-family", "Impact")
                    .style("fill", function (d, i) {
                        return d.color;
                    })
                    .attr("text-anchor", "middle")
                    .attr("value", "false")
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

                        if ($tag.attr('value') === "false") {
                            $tag.css("stroke", "white");
                            $tag.css("stroke-width", "3px");
                            $tag.css("fill", "black");
                            $tag.attr('value', 'true');
                            $tag.text(d.text + ' \u2714')//checkmark

                            if (d.size < 2 * minWordSize) {
                                $tag.css("stroke-width", "1px");
                                //enlarge if too small
                            }
                            if (currentMaps.length === 0) {
                                currentMaps = d.maps.slice();
                            } else {
                                currentMaps.push(...d.maps);


                            }

                            currentFilters[d.text] = "on";
                            //iterate backwards to avoid having to recalculate index after deletion
                            for (var i = currentMaps.length - 1; i >= 0; i--) {
                                var curMap = currentMaps[i];
                                var pass = true;
                                for (filter in currentFilters) {

                                    if (!tagsArray[filter].includes(curMap)) {
                                        pass = false;
                                        break;

                                    } else {

                                    }
                                }
                                if (!pass) {
                                    deletedMaps.push(curMap);
                                    currentMaps.splice(i, 1);
                                }

                            }
                            //add to current map pool
                        } else {
                            //restore to old css
                            $tag.css("stroke", "none");
                            $tag.css("stroke-idth", "0px");
                            $tag.css("fill", d.color);
                            $tag.attr('value', 'false');
                            $tag.css('font-size', d.size);
                            $tag.text(d.text) //remove checkmark


                            delete currentFilters[d.text]
                            if (Object.keys(currentFilters).length === 0) {
                                currentMaps = [];

                            } else {

                                for (var i = deletedMaps.length - 1; i >= 0; i--) {
                                    var curMap = deletedMaps[i];
                                    var recover = true;
                                    for (filter in currentFilters) {

                                        if (!tagsArray[filter].includes(curMap)) {
                                            recover = false;
                                            break;

                                        } else {

                                        }
                                    }
                                    if (recover) {
                                        currentMaps.push(curMap);
                                        deletedMaps.splice(i, 1);
                                    }


                                }
                            }

                        }
                        uniq = [...new Set(currentMaps)];
                        currentMaps = uniq;
                        $("#maplist-container").html("<h4>" + currentMaps.join(", ") + "</h4>");

                    });

            }


        })();


        genTable(spreadsheetContainer, maps, header, [0], cols);

    }); //end json

}