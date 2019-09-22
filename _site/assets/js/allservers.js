var globalTable;
var difficultyArray = getDifficultyArray();
var URI = getURIVars();
var expandGlobaId = "#expand-allservers";
$(document).ready(function () {
    var globalHeader = ["Map", "Tier", "Pro Tier", "Length", "Time", "TPs", "Pts", "Date",
        "Server"
    ];
    var mapRequestBaseURL = "https://kztimerglobal.com/api/v1.0/records/top?"

    var steamID = "";
    if (typeof URI["steamid"] !== 'undefined' && URI["teleports"] !== 'undefined') {
        steamID = URI["steamid"];
        teleports = URI["teleports"]
        if (isValidSteamID(steamID)) {
            console.log("RECEIVED " + steamID + " TELEPORTS " + teleports);
            //$(expandGlobalId).click(); //autoexpand if url linked by steamid

            $('#steamIDText').val(steamID);
            var teleportsBool = "true" === teleports;

            retrieveStats(steamID, teleportsBool);
            if (teleportsBool) {
                $('#tpradio').click();
            } else {
                $('#tpradio').click();
            }


        }
    } else {
        var steamID = localStorage.getItem("globalMapsSteamID");
        var teleportsBool = "true" === localStorage.getItem(
            "globalMapsTeleports"); //convert string to boolean
        if (isValidSteamID(steamID)) {
            $('#steamIDText').val(steamID);
            if (teleportsBool) {
                $('#tpradio').click();
            } else {
                $('#tpradio').click();
            }

            $("#expandGlobal").click(); //autoexpand if url linked by steamid
            retrieveStats(steamID, teleportsBool);
        }

    }

    function retrieveStats(steamID, teleports) {
        //temp max limit based on ~440 maps, eventually should change to indexdb storage 
        //so you dont fetch every map all the time, and just fetch the latest runs

        var finishedGlobals = jQuery.extend(true, {}, difficultyArray); //deep copy
        var tempLimit = 500;
        requestURL = "https://kztimerglobal.com/api/v1.0/records/top?steam_id=" + steamID +
            "&tickrate=128&stage=0&has_teleports=" + teleports + "&limit=" + tempLimit +
            "&modes_list_string=kz_timer";

        $.getJSON(requestURL, function (data) {
            if (data.length == 0) {
                alert("No Times Found for " + steamID);
                return true;
            }
            var maps = [];

            var playerName = sanitizeName(data[0]["player_name"]);
            var ispro = $('input[name=isprorun-radio]:checked').val();
            var runtype = "Pro Times";
            if (ispro !== "proradio")
                runtype = "TP Times";


            $("#global-player-name").text(playerName + "'s " + runtype +
                " Across All Servers");
            $.each(data, function (i, field) {

                var map = field["map_name"]
                //server is sometimes null, and throws exception
                var tptier = "N/A",
                    protier = "N/A",
                    length = "N/A",
                    time = "N/A",
                    teleports = "N/A",
                    points = "N/A",
                    date = "N/A",
                    server = "N/A";
                if (map in finishedGlobals) {

                    //flag to see if map is finished, most of the new death maps have not been added to global api
                    finishedGlobals[map].push("finished");

                    tptier = difficultyArray[field["map_name"]][0];
                    protier = difficultyArray[field["map_name"]][1];
                    length = difficultyArray[field["map_name"]][2];
                    time = getTimeFromSeconds(field["time"]);
                    teleports = field["teleports"];
                    points = field["points"];
                    date = field["updated_on"];
                    if (typeof field["server_name"] === "string") {
                        server = field["server_name"].substring(0, 35);
                    }

                }
                var statRow = [map, tptier, protier, length,
                    time, teleports, points, date, server
                ];
                maps.push(statRow);
                //createTable(maps, header);


            }); //.each


            cols = [{}, //map name
                {}, //tier
                {}, //pro tier
                {}, //length
                {
                    type: "time",
                    timeFormat: "h:mm:ss"
                },
                {}, //tp
                {}, //pts
                {},
                {} //server
            ];
            var spreadsheetContainer = $("#spreadsheet-global")[0];

            for (var map in finishedGlobals) {
                if (finishedGlobals[map].length < 4) {
                    unfinished = Array(globalHeader.length).fill("N/A");
                    unfinished[0] = map;
                    unfinished[1] = finishedGlobals[map][0]; //tp tier
                    unfinished[2] = finishedGlobals[map][1]; //pro tier
                    unfinished[3] = finishedGlobals[map][2]; //length
                    maps.push(unfinished);
                }

            }
            if (globalTable)
                globalTable.destroy();

            globalTable = genTable(spreadsheetContainer, maps, globalHeader, [0, 4, 8], cols);
        }); //end json
    }

    $("#getGlobalMapsButton").click(function () {

        var steamID = $('#steamIDText').val();


        if (!isValidSteamID(steamID)) {
            alert("invalid Steam ID!");
            return;
        }


        //remember logic is flipped, has teleports = true means TP
        ispro = $('input[name=isprorun-radio]:checked').val();
        teleports = true;
        if (ispro === "proradio")
            teleports = false;

        localStorage.setItem("globalMapsSteamID", steamID);
        localStorage.setItem("globalMapsTeleports", teleports);

        //set url to steamid and teleports for future use
        window.history.pushState("object or string", "Title", "?steamid=" + steamID + "&teleports=" +
            teleports);;
        retrieveStats(steamID, teleports);
    });


});