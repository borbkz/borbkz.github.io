var imagepath = "assets/images/medals/";
var playerMax = 20; //20 players, not 20 records, each player may have a bunch of incremental times
var globalsRequestURLBase = "https://kztimerglobal.com/api/v1.0/records/top/recent?stage=0&tickrate=128&modes_list_string=kz_timer";

var top1RequestURL = globalsRequestURLBase + "&place_top_at_least=1&limit=40";
var top20RequestURL = globalsRequestURLBase +
    "&place_top_at_least=20&limit=40"; //#1 counts as top 20, get 50 just in case
var top100RequestURL = globalsRequestURLBase + "&limit=100";

const THUMBNAIL_URI ="?imw=637&imh=358&ima=fit&impolicy=Letterbox&imcolor=%23000000&letterbox=true";



//using player_name+map_name+teleports as hash
var top1Players = {};
var top20Players = {};
var top100Players = {};

var globalURLs = {
    "gold": top1RequestURL,
    "silver": top20RequestURL,
    "bronze": top100RequestURL,
}

$.getJSON(jsonPath + 'map_thumbs.json', function (data) {
    mapthumbs = data;

});

var mapthumbs = {};

$(document).ready(function(){


let useFancy = localStorage.getItem("USE_FANCY");
 $('.fancy-container').show();
 $('#top-1-container').hide();

if (useFancy !== null && useFancy === "false") {
    $('.fancy-container').hide();
    $('#top-1-container').show();
    $('#fancy-checkbox').prop('checked', false);

}

  $('#fancy-checkbox').change(function () {
      //localStorage.setItem("USE_FANCY", this.checked);
      if(this.checked){
          localStorage.setItem('USE_FANCY', true);

          $('.fancy-container').show();
          $('#top-1-container').hide();

      }else{
          localStorage.setItem('USE_FANCY', false);
          $('.fancy-container').hide();
          $('#top-1-container').show();

      }
  });


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
            if (!uniqTimes[playerEntries[playerKey][i]["time"]]) {
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

    var nameLink = '<a title="' + player + '" href="local.html?steamid=' + steamID + "&teleports=" + teleportsBool + '">' + player + '</a>'


    var recordTimeText = "";

    var timeFinished = getTimeAgo(date);
    if (timeMinusInSeconds != 0)
        recordTimeText = '<span class="record-minus-time"> ( -' + getTimeFromSeconds(timeMinusInSeconds) + ')</span>';


    var runtypeText = '<span class="' + runtype.toLowerCase() + '-type-container">' + runtype + '</span>';
    var timeText = '<span class="' + runtype.toLowerCase() + '-run-container">' + time + '</span>';
    var placeText = '<span class="' + medal + '-place-container">#' + place + '</span>';
    var playerText = '<span class="player-name-container">' + nameLink + "</span>";
    let map_link = `<a href="maps.html?map=${map}">${map}</a>`
    var mapText = '<span class="map-name-container">' + map_link + "</span>"
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


    if (medal === "gold") {
        let $fancyRecordContainer = $('.record-pro-all-container');

        let $divRecordCard = $('<div class="record-card"></div>');

        //$divRecordCard.css('background-image',`url(/assets/images/${map}.jpg)`)
        let mapImage = mapthumbs[map];
        //setting to full opacity right now, since the text shadows seem to be doing the trick
        $divRecordCard.css('background',`linear-gradient( rgba(0, 0, 0, 0.2), rgba(0, 0, 0,.2) ), url('${mapImage+THUMBNAIL_URI}')`)
        //apparently setting a background image overrides everything so I have to reset
        $divRecordCard.css('background-size','cover');
        $divRecordCard.css('background-position','0 50%');
        $divRecordCard.css('background-repeat','no-repeat');

        let timeMinusText = "";
        if (timeMinusInSeconds != 0)
            timeMinusText = "-" + getTimeFromSeconds(timeMinusInSeconds);

        let maplink = `<a href="maps.html?map=${map}">${map} (${time})</a>`
        
        $divRecordCard.html(`<p><span class="map-title-text">🏆${maplink}<span class="wr-minus-time">${timeMinusText}</span>🏆</span>` +
            `<br><span class="runner-title-text">—<fancy>&nbsp;&nbsp;${nameLink}&nbsp;&nbsp;</fancy>—<br>${timeFinished + (timeFinished === "" ? "just now" : " ago")}</span></p>`)


        if (runtype === "TP") {
            $fancyRecordContainer = $('.record-tp-all-container');
        }

        if (indentLevel == 0) {
            $fancyRecordContainer.append($divRecordCard);
        }

    } 

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


});