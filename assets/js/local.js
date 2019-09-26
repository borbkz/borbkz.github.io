var localHeader = ["Map", "Tier", "Pro Tier", "Length", "TP Time", "Teleports", "TP Rank", "Pro Time",
    "Pro Teleports", "Pro Rank"
];
var plugin;
var localTable;
var finishedLocals;

var totalProsPossible = 0;
var totalTPPossible = 0;
var totalProRuns = 0;
var totalTPRuns = 0;
$(document).ready(function () {
    var beginOffset = 2;

    $("#downloadButton").click(function () {
        var csvText = localHeader.join(",") + "\r\n";
        if (typeof outputBuffer !== 'undefined') {
            for (var i = 0; i < outputBuffer.length; i++)
                csvText += outputBuffer[i];
        }
        this.href = "data:text/plain;charset=UTF-8," + encodeURIComponent(csvText);
    });
    $("#convertButton").click(function () {
        var textIn = $("#inputMapsTextArea");
        //var textOut = $("#outputMapsTextArea");
        finishedLocals = jQuery.extend(true, {}, difficultyArray); //deep copy

        $.each(textIn.val().split("\n"), function (i, line) {
            if (!(/.+,.+,.+,.+$/.test(line))) {
                return true;
            }
            mapInfo = line.split(",");
            //[mapname][difficulty, TP time, TP Teleports, TP Rank, Pro time, PRO teleports, Pro Rank]		 
            offset = beginOffset + (mapInfo[1].includes("(PRO)") ? 3 :
                0);
            mapName = mapInfo[0];

            if (mapName in finishedLocals) {
                writeToArray(mapInfo, finishedLocals[mapName], offset);
            } else {
                temp = [finishedLocals[mapName]];
                writeToArray(mapInfo, temp, offset);
                finishedLocals[mapName] = temp;
            }


        });

        function writeToArray(arrIn, arrOut, offset) {
            for (var i = 1; i < 4; i++) {
                arrOut[i + offset] = arrIn[i].replace(/Time: /g, '').replace(/Teleports: /g, '')
                    .replace(/Rank: /g, '');
            }
        }
        printAllMaps();


        function printAllMaps() {

            var outputBuffer = [""];
            var tableBuffer = [];
            for (var map in finishedLocals) {

                line = map + ", " + finishedLocals[map];
                outputBuffer.push(map + ", " + finishedLocals[map] + "\n");

                length = finishedLocals[map].length;
                row = line.split(",");

                for (var i = length; i < (localHeader.length - 1); i++) {
                    row.push("");
                }
                tableBuffer.push(row);

            }
            var spreadsheetContainer = $("#spreadsheet-local")[0];

            var cols = [{
                className: "htLeft"
            }, //map name
                {}, //tier
                {}, //pro tier
                {}, //length
                {
                    type: "time",
                    timeFormat: "h:mm:ss"
                },
                {}, //tp
                {}, //tp rank
                {
                    type: "time",
                    timeFormat: "h:mm:ss"
                },
                {}, //pro teleports
                {} //pro rank
            ];
            //filters for map, tp&pro tiers, length, tp& pro times

            if (localTable) {
                localTable.destroy();
            }


            $("#personal-tooltip").show();

            localTable = genTable(spreadsheetContainer, tableBuffer, localHeader, [0, 1,2,3,4, 7], cols);

            plugin = localTable.getPlugin('hiddenColumns');

            //if (typeof mapTable !== "undefined")
            //mapTable.updateSettings({ data: [] }); //clear table after click
        }


    }); //end click

}); //end ready