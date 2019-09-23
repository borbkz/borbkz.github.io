var format = d3.format(",");

// Set tooltips
var tip = d3.tip()
    .attr('class', 'd3-tip')
    .offset([0, 0])
    .html(function (d) {
        return "<div style='text-align: left'><strong>Country: </strong><span class='details'>" + d.properties.name + "<br></span>" +
            "<strong>Total WRs: </strong><span class='details'>" + format(d.totalRecords) + "<br></span>"+
            "<strong>Pro: </strong><span class='details'>" + format(d.proRecords) + "&nbsp;&nbsp;</span>"+
            "<strong>TP: </strong><span class='details'>" + format(d.tpRecords) + "</span></div>";
    })

    width = 800;
    height = 500;

var color = d3.scaleThreshold()
    .domain([0, 10, 15, 25, 50, 75, 100, 150, 200, 300])
    .range(["rgb(247,251,255)", "rgb(222,235,247)", "rgb(198,219,239)", "rgb(158,202,225)", "rgb(107,174,214)",
        "rgb(66,146,198)", "rgb(33,113,181)", "rgb(8,81,156)", "rgb(8,48,107)", "rgb(3,19,43)"
    ]);

var path = d3.geoPath();

var svg = d3.select("#svgContainer")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append('g')
    .attr('class', 'map');

var projection = d3.geoMercator()
    .scale(130)
    .translate([width / 2, height / 1.5]);

var path = d3.geoPath().projection(projection);

svg.call(tip);

queue()
    .defer(d3.json, jsonPath + "countries.json")
    .defer(d3.json, jsonPath + "records.json")
    .await(ready);

function ready(error, countries, wrs) {
    var recordsById = {};

    var proRecords = wrs["pro"];
    var tpRecords = wrs["tp"];

    countries["features"].forEach(function (d) {
        recordsById[d.id] = [0,0];
    });
    for (var i = 0; i < tpRecords.length; i++) {
        var country = tpRecords[i],
        records = parseInt(country.count);
        recordsById[country.playercountrycode][0] = records;
    }

    for (var i = 0; i < proRecords.length; i++) {
        var country = proRecords[i];
        records = parseInt(country.count);
        recordsById[country.playercountrycode][1] = records; 
    }
    countries.features.forEach(function (d) {
        d.totalRecords = recordsById[d.id][0] + recordsById[d.id][1];
        d.proRecords = recordsById[d.id][1];
        d.tpRecords = recordsById[d.id][0]; 
    });

    svg.append("g")
        .attr("class", "countries")
        .selectAll("path")
        .data(countries.features)
        .enter().append("path")
        .attr("d", path)
        .style("fill", function (d) {
            return color(recordsById[d.id][0]+recordsById[d.id][1]);
        })
        .style('stroke', 'white')
        .style('stroke-width', 1.5)
        .style("opacity", 0.8)
        // tooltips
        .style("stroke", "white")
        .style('stroke-width', 0.3)
        .on('mouseover', function (d) {
            tip.show(d);

            d3.select(this)
                .style("opacity", 1)
                .style("stroke", "white")
                .style("stroke-width", 3);
        })
        .on('mouseout', function (d) {
            tip.hide(d);

            d3.select(this)
                .style("opacity", 0.8)
                .style("stroke", "white")
                .style("stroke-width", 0.3);
        });

    svg.append("path")
        .datum(topojson.mesh(countries.features, function (a, b) {
            return a.id !== b.id;
        }))
        .attr("class", "names")
        .attr("d", path);
}