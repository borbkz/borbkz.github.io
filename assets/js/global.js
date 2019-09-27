var imagepath = "assets/images/medals/";
var playerMax = 20; //20 players, not 20 records, each player may have a bunch of incremental times
var globalsRequestURLBase = "https://kztimerglobal.com/api/v1.0/records/top/recent?stage=0&tickrate=128&modes_list_string=kz_timer";

var top1RequestURL = globalsRequestURLBase + "&place_top_at_least=1&limit=40";
var top20RequestURL = globalsRequestURLBase +
    "&place_top_at_least=20&limit=40"; //#1 counts as top 20, get 50 just in case
var top100RequestURL = globalsRequestURLBase + "&limit=100";



//using player_name+map_name+teleports as hash
var top1Players = {};
var top20Players = {};
var top100Players = {};

var globalURLs = {
    "gold": top1RequestURL,
    "silver": top20RequestURL,
    "bronze": top100RequestURL,
}


for (var ranking in globalURLs) {



    $.getJSON(globalURLs[ranking], (function (ranking) {
        return function (data) {

            var maps = [];
            var recordEntries = [];
            var playerArr = top1Players;
            var playerContainer = $('#top-1-container')[0];



            $.each(data, function (i, field) {

                var player = field["player_name"],
                    place = parseInt(field["place"]),
                    map = field["map_name"],
                    time = field["time"];

                field["medal"] = "gold";

                if (place == 1) {
                    playerContainer = $('#top-1-container')[0];
                    playerArr = top1Players;
                    field["medal"] = "gold";

                } else if (place > 1 && place <= 20) {
                    playerContainer = $('#top-20-container')[0];
                    playerArr = top20Players;
                    field["medal"] = "silver";
                } else if (place > 20) {
                    playerContainer = $('#top-100-container')[0];
                    playerArr = top100Players;
                    field["medal"] = "bronze";
                }


                if (Object.keys(playerArr).length < playerMax) {
                    pushPlayer(playerArr, field);
                }

            }); //.each
            if (ranking == "gold") {
                publishPlayerTimes($('#top-1-container')[0], top1Players);
            } else if (ranking == "silver") {
                publishPlayerTimes($('#top-20-container')[0], top20Players);
            } else {
                publishPlayerTimes($('#top-100-container')[0], top100Players);
            }
        }
    })(ranking));

}

function pushPlayer(playerList, playerRecord) {
    var teleports = parseInt(playerRecord["teleports"]);
    var isPro = "TP";
    if (teleports === 0)
        isPro = "PRO";


    playerKey = playerRecord["player_name"] + "+" +
        playerRecord["map_name"] + "+" + isPro;

    if (playerKey in playerList) {
        playerList[playerKey].push(playerRecord);
    } else {
        playerList[playerKey] = [playerRecord];
    }

}

function publishPlayerTimes(recordContainer, playerEntries) {

    for (var playerKey in playerEntries) {


        //player:[record1, record2, record3]

        var bestTime = parseFloat(playerEntries[playerKey][0]["time"]);
        var prevTime = bestTime;

        var uniqTimes = {};

        for (var i = 0; i < playerEntries[playerKey].length; i++) {
            var recordTimeText = "";
            var indent = i == 0 ? 0 : 10;

            var timeDiff = "";
            if (i < playerEntries[playerKey].length - 1) {

                prevTime = parseFloat(playerEntries[playerKey][i + 1]["time"]);
                timeDiff = Math.abs(bestTime - prevTime);
                bestTime = prevTime;
            }

            let uniqKey = playerEntries[playerKey][i]["time"];
            if(!uniqTimes[playerEntries[playerKey][i]["time"]] ){
                publishEntry(recordContainer, playerEntries[playerKey][i], indent, timeDiff);
                uniqTimes[uniqKey] = true;

            }

        }
    }
}

function publishEntry(recordContainer, recordEntry, indentLevel, timeMinusInSeconds) {

    indentLevel = 0 || indentLevel;
    var preName = sanitizeName(recordEntry["player_name"]);
    var player = preName.substring(0, 20) + (preName.length > 20 ? " ..." : ""),
        steamID = recordEntry["steam_id"],
        place = parseInt(recordEntry["top_100"]),
        map = recordEntry["map_name"],
        time = getTimeFromSeconds(recordEntry["time"]),
        teleports = recordEntry["teleports"],
        teleportsBool = parseInt(teleports) > 0,
        runtype = recordEntry["teleports"] == 0 ? "PRO" : "TP",
        date = recordEntry["created_on"],
        updatedOn = recordEntry["updated_on"],
        medal = recordEntry["medal"]

    var nameLink = '<a href="local.html?steamid=' + steamID + "&teleports=" + teleportsBool + '">' + player + '</a>'


    var recordTimeText = "";

    var timeFinished = getTimeAgo(date);
    if (timeMinusInSeconds != 0)
        recordTimeText = '<span class="record-minus-time"> ( -' + getTimeFromSeconds(timeMinusInSeconds) + ')</span>';


    var runtypeText = '<span class="' + runtype.toLowerCase() + '-type-container">' + runtype + '</span>';
    var timeText = '<span class="' + runtype.toLowerCase() + '-run-container">' + time + '</span>';
    var placeText = '<span class="' + medal + '-place-container">#' + place + '</span>';
    var playerText = '<span class="player-name-container">' + nameLink + "</span>";
    var mapText = '<span class="map-name-container">' + map + "</span>"
    var dateText = '<span class="date-run-container"> ' + timeFinished + (timeFinished === "" ? "just now" : " ago") +
        "</span>";

    var medalTag = TROPHY[medal] + placeText;

    var recordText = playerText + " placed " + medalTag + " " + runtypeText + " on " + mapText + " " +
        " with a time " + " of " +
        timeText + recordTimeText + ", " + dateText;

    //indented previous times under the same player and map, no font decorations
    if (indentLevel != 0) {
        recordText = player + " placed #" + place + " " + runtype + " with " + time + recordTimeText + ", " +
            dateText;

    }
    //var recordText = playerText + " placed ";

    var recordDivClass = "record-text-container";


    var indentText = "";
    for (var i = 0; i < indentLevel; i++) {
        indentText += "&nbsp";
    }
    var indentHTML = '<span class="record-indent">' + indentText + '</span>';
    var recordHTML = '<div class="' + recordDivClass + '">' + indentHTML + recordText +
        '<br></div>';

    $(recordContainer).append(recordHTML);



}

//input format : YYYY-MM-DDTHH:MM:SS
//output format : X Days, Y Hours, Z Minutes
function getTimeAgo(time) {
    var mapTime = new Date(time);
    var curTime = new Date();


    curTime.setHours(curTime.getHours() + 7);

    //what fucking timee zone is this
    var remainingTime = Math.abs(curTime - mapTime);

    var days = Math.floor(remainingTime / (24 * 60 * 60 * 1000.0));
    remainingTime -= days * (24 * 60 * 60 * 1000);
    var hours = Math.floor(remainingTime / (60 * 60 * 1000.0));
    remainingTime -= hours * (60 * 60 * 1000);
    var minutes = Math.floor(remainingTime / (60 * 1000.0));

    var daysText = days > 0 ? days + " days " : "";
    var hoursText = hours > 0 ? hours + " hr " : "";
    var minutesText = minutes > 0 ? minutes + " min " : "";

    return daysText + hoursText + minutesText;
};