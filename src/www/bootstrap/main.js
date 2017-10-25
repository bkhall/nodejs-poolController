/* jshint undef: false, unused: true , latedef: false*/

/* global Storage */
var autoDST; // Flag for Automatic DST (0 = manual, 1 = automatic)
var tmeLastUpd; // Time of Last Update (last socket message received)
var socket; // Socket IO (don't initalize communications until clientConfig.json received!)
var currCircuitArr; // keep a local copy of circuits so we can use them to allow schedule changes

/**
 * jQuery.browser.mobile (http://detectmobilebrowser.com/)
 *
 * jQuery.browser.mobile will be true if the browser is a mobile device
 *
 **/
(function(a) {
  (jQuery.browser = jQuery.browser || {}).mobile = /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))
})(navigator.userAgent || navigator.vendor || window.opera);


//Configure Bootstrap Panels, in 2 steps ...
//   1) Enable / Disable panels as configured (in json file)
//   2) Load Panel Sequence from Storage (as saved from last update)
function configPanels(jsonPanel) {
  //Enable / Disable panels as configured (in json file)
  for (var currPanel in jsonPanel) {
    if (jsonPanel[currPanel]["state"] === "hidden")
      $('#' + currPanel).hide();
    else if (jsonPanel[currPanel]["state"] === "collapse")
      $('#' + 'collapse' + currPanel.capitalizeFirstLetter()).collapse();
    else
      $('#' + currPanel).show();
    // Debug Panel -> Update Debug Log Button
    if (currPanel === "debug") {
      if (jsonPanel[currPanel]["state"] === "hidden")
        setStatusButton($('#debugEnable'), 0, 'Debug:<br/>');
      else
        setStatusButton($('#debugEnable'), 1, 'Debug:<br/>');
    }
  }

  // Load Panel Sequence from Storage (as saved from last update)
  if (typeof(Storage) !== "undefined") {
    var panelIndices = JSON.parse(localStorage.getItem('panelIndices'));
    // Make sure list loaded from Storage is not empty => if so, just go with default as in index.html
    if (panelIndices) {
      var panelList = $('#draggablePanelList');
      var panelListItems = panelList.children();
      // And, only reorder if no missing / extra items => or items added, removed ... so "reset" to index.html
      var sizeStorage = panelIndices.filter(function(value) {
        return value !== null
      }).length;
      if (sizeStorage === panelListItems.length) {
        panelListItems.detach();
        $.each(panelIndices, function() {
          var currPanel = this.toString();
          var result = $.grep(panelListItems, function(e) {
            return e.id === currPanel;
          });
          panelList.append(result);
        });
      }
    }
  } else {
    $('#txtDebug').append('Sorry, your browser does not support Web Storage.' + '<br>');
  }
}

//Routine to recursively parse Equipment Configuration, setting associated data for DOM elements
function dataAssociate(strControl, varJSON) {
  for (var currProperty in varJSON) {
    if (typeof varJSON[currProperty] !== "object") {
      $('#' + strControl).data(currProperty, varJSON[currProperty]);
    } else {
      if (Array.isArray(varJSON)) {
        dataAssociate(strControl, varJSON[currProperty]);
      } else {
        dataAssociate(currProperty, varJSON[currProperty]);
      }
    }
  }
}

function monthOfYearAsString(indDay) {
  return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][indDay];
}

function dayOfWeekAsInteger(strDay) {
  return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].indexOf(strDay.capitalizeFirstLetter(strDay));
}

function dayOfWeekAsString(indDay) {
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][indDay];
}

// Format Time (String), to 12 hour format. Input is HH:MM, Output is HH:MM am/pm
function fmt12hrTime(strInpStr) {
  // Make sure input is in 24 hour time ... if not, don't convert
  if (strInpStr.toUpperCase().search("M") >= 0)
    return strInpStr;
  else {
    splitInpStr = strInpStr.split(":");
    if (splitInpStr[0] < 12)
      strAMPM = 'am';
    else
      strAMPM = 'pm';
    strHours = (parseInt(splitInpStr[0]) % 12).toFixed(0);
    if (strHours === "0")
      strHours = "12";
    strMins = ('0' + parseInt(splitInpStr[1])).slice(-2);
    return strHours + ':' + strMins + ' ' + strAMPM;
  }
}

// Format Time (String), to 24 hour format. Input is HH:MM am/pm, Output is HH:MM
function fmt24hrTime(strInpStr) {
  // Make sure input is in 12 hour time ... if not, don't convert
  if (strInpStr.toUpperCase().search("M") < 0)
    return strInpStr;
  else {
    splitInpStr = strInpStr.slice(0, -3).split(":");
    intAMPM = (strInpStr.slice(-2).toUpperCase() === "AM") ? 0 : 1;
    strHours = ((parseInt(splitInpStr[0]) % 12) + (12 * intAMPM)).toFixed(0);
    if (strHours === "0")
      strHours = "00";
    strMins = ('0' + parseInt(splitInpStr[1])).slice(-2);
    return strHours + ':' + strMins;
  }
}

function fmtEggTimerTime(strInpStr) {
  splitInpStr = strInpStr.split(":");
  strHours = splitInpStr[0];
  strMins = ('0' + parseInt(splitInpStr[1])).slice(-2);
  return strHours + ' hrs, ' + strMins + ' mins';
}

function buildSchTime(currSchedule) {
  schName = 'schTime' + currSchedule.ID;
  strRowEdit = '<tr name="' + schName + '" id="' + schName + '" class="botpad schEdit" '
  if (!$('#editPanelschedule').hasClass('btn-success'))
    strRowEdit += 'style="display:none"'
  strRowEdit += ' data-id="' + currSchedule.ID + '">';
  el_circuit = schName + 'Circuit'
  el_start = schName + 'StartTime'
  el_end = schName + 'EndTime'

  circuitSelectHTML = '<div class="input-group" style="width:150px"><select class="selectpicker show-menu-arrow show-tick" id="' + el_circuit + '">'
  //circuitSelectHTML += '<option>' + currSchedule.friendlyName.capitalizeFirstLetter() + '</option>'
  if (Object.keys(currCircuitArr).length > 1) {
    $.each(currCircuitArr, function(index, currCircuit) {
      if (currCircuit.friendlyName.toUpperCase() !== "NOT USED" && ((generalParams.hideAUX === false) || (currCircuit.friendlyName.indexOf("AUX") === -1))) {
        circuitSelectHTML += '<option data-circuitnum="' + currCircuit.number
        if (currCircuit.friendlyName.toUpperCase() !== currSchedule.friendlyName.toUpperCase()) {
          circuitSelectHTML += ' class="selected" '
        }
        circuitSelectHTML += '">' + currCircuit.friendlyName.capitalizeFirstLetter() + '</option>';
      }
    })
    circuitSelectHTML += '<option data-divider="true"></option><option style="color: red;">DELETE</option>'
    circuitSelectHTML += '</div>';
  }

  circuitSelectHTML += '</select>'

  strHTMLEdit = '<td>' + currSchedule.ID + '</td>' +
    '<td>' + circuitSelectHTML +
    '</td>' +
    '<td id="' + schName + '">' +
    '<div class="input-group" style="width:85px">    <input type="text" class="form-control" id="' + el_start + '" data-startorend="start" data-id="' + currSchedule.ID + '" value="' + fmt12hrTime(currSchedule.START_TIME) + '" readonly="true"></div>' +
    '</td>' +
    '<td>' +
    '<div class="input-group" style="width:85px">    <input type="text" class="form-control" id="' + el_end + '" data-startorend="end" data-id="' + currSchedule.ID + '" value="' + fmt12hrTime(currSchedule.END_TIME) + '" readonly="true"></div>' +
    '</td></tr>';

  strRowStatic = '<tr name="' + schName + '" id="' + schName + '" class="botpad schStatic" '
  if ($('#editPanelschedule').hasClass('btn-success'))
    strRowStatic += 'style="display:none"'
  strRowStatic += '>';
  strHTMLStatic = '<td>' + currSchedule.ID + '</td>' +
    '<td>' + currSchedule.friendlyName.capitalizeFirstLetter() + '</td>' +
    '<td>' + fmt12hrTime(currSchedule.START_TIME) + '</td>' +
    '<td>' + fmt12hrTime(currSchedule.END_TIME) + '</td></tr>';

  return strRowEdit + strHTMLEdit + strRowStatic + strHTMLStatic;
}

function buildEggTime(currSchedule) {
  schName = 'schEgg' + currSchedule.ID;
  strRowStatic = '<tr name="' + schName + '" id="' + schName + 'Static" '
  if ($('#editPaneleggtimer').hasClass('btn-success'))
    strRowStatic += 'style="display:none"'
  strRowStatic += ' class="eggStatic">';
  strHTMLStatic = '<td>' + currSchedule.ID + '</td>' +
    '<td>' + currSchedule.friendlyName.capitalizeFirstLetter() + '</td>' +
    '<td>' + fmtEggTimerTime(currSchedule.DURATION) + '</td></tr>';



  splitInpStr = currSchedule.DURATION.split(":");
  strHours = splitInpStr[0];
  strMins = ('0' + parseInt(splitInpStr[1])).slice(-2);

  schNameEdit = schName + 'Edit'







  circuitSelectHTML = '<div class="input-group" style="width:150px"><select class="selectpicker show-menu-arrow show-tick" id="' + schName + 'Circuit">'
  //circuitSelectHTML += '<option>' + currSchedule.friendlyName.capitalizeFirstLetter() + '</option>'
  if (Object.keys(currCircuitArr).length > 1) {
    $.each(currCircuitArr, function(index, currCircuit) {
      if (currCircuit.friendlyName.toUpperCase() !== "NOT USED" && ((generalParams.hideAUX === false) || (currCircuit.friendlyName.indexOf("AUX") === -1))) {
        circuitSelectHTML += '<option data-circuitnum="' + currCircuit.number + '" '
        if (currCircuit.friendlyName.toUpperCase() !== currSchedule.friendlyName.toUpperCase()) {
          circuitSelectHTML += ' class="selected" '
        }
        circuitSelectHTML += '>' + currCircuit.friendlyName.capitalizeFirstLetter() + '</option>'

      }
    })
    circuitSelectHTML += '<option data-divider="true"></option><option style="color: red;">DELETE</option>'
    circuitSelectHTML += '</div>';
  }

  hourSelectHTML = '<div class="input-group" style="width:55px"><select class="selectpicker show-menu-arrow show-tick" id="' + schName + 'Hour">'
  //hourSelectHTML += '<option>' + strHours + '</option>'
  for (i = 1; i <= 11; i++) {
    hourSelectHTML += '<option'
    if (i === parseInt(strHours)) {
      hourSelectHTML += ' class="selected" '
    }
    hourSelectHTML += '>' + i + '</option>';
  }
  hourSelectHTML += '</div>'

  minSelectHTML = '<div class="input-group" style="width:55px"><select class="selectpicker show-menu-arrow show-tick" id="' + schName + 'Min">'
  //minSelectHTML +=' <option>' + strMins + '</option>'
  for (i = 0; i <= 3; i++) {
    minSelectHTML += '<option '
    if (i * 15 === parseInt(strMins)) {
      minSelectHTML += ' class="selected" '
    }
    minSelectHTML += '>' + i * 15 + '</option>';
  }
  minSelectHTML += '</div>'

  strRowEdit = '<tr name="' + schName + '" id="' + schNameEdit + '"'
  if (!$('#editPaneleggtimer').hasClass('btn-success'))
    strRowEdit += 'style="display:none"'
  strRowEdit += ' class="eggEdit" data-id="' + currSchedule.ID + '" data-circuitnum="' + currSchedule.CIRCUITNUM + ' " data-hour="' + strHours + '" data-min="' + parseInt(strMins) + '">'


  strHTMLEdit = '<td>' + currSchedule.ID + '</td>'
  strHTMLEdit += '<td>' + circuitSelectHTML + '</td>'

  strHTMLEdit += '<td class="eggEditHour">' + hourSelectHTML + '</td>'
  strHTMLEdit += '<td class="eggEditMin">' + minSelectHTML + '</td>'
  strHTMLEdit += '</tr>'
  return strRowStatic + strHTMLStatic + strRowEdit + strHTMLEdit;
}

function buildSchDays(currSchedule) {
  schName = 'schDays' + currSchedule.ID;
  strRowEdit = '<tr class="borderless toppad schEdit" '
  if (!$('#editPanelschedule').hasClass('btn-success'))
    strRowEdit += 'style="display:none"'
  strRowEdit += 'name="' + schName + '" id="' + schName + '"><td colspan="4" align="left">';
  var arrDays = [false, false, false, false, false, false, false];
  splitDays = currSchedule.DAYS.split(" ");
  $.each(splitDays, function(indx, currDay) {
    if (currDay !== "")
      arrDays[dayOfWeekAsInteger(currDay)] = true;
  });
  strHTMLEdit = '';
  for (var iterDay in arrDays) {
    strCurrDay = dayOfWeekAsString(iterDay);
    if (arrDays[iterDay] === true) {
      strHTMLEdit += '<button class="btn btn-success btn-md schDay" data-schId="' + currSchedule.ID + '" data-schDay="' + strCurrDay + '" >';
    } else {
      strHTMLEdit += '<button class="btn btn-default btn-md schDay" data-schId="' + currSchedule.ID + '" data-schDay="' + strCurrDay + '" >';
    }
    strHTMLEdit += strCurrDay + '</button>';
  }
  strHTMLEdit += '</td></tr>'

  strRowStatic = '<tr class="borderless toppad schStatic" name="' + schName + '" id="' + schName + '" '
  if ($('#editPanelschedule').hasClass('btn-success'))
    strRowStatic += 'style="display:none"'
  strRowStatic += '><td colspan="4" align="left">';
  arrDays = [false, false, false, false, false, false, false];
  splitDays = currSchedule.DAYS.split(" ");
  $.each(splitDays, function(indx, currDay) {
    if (currDay !== "")
      arrDays[dayOfWeekAsInteger(currDay)] = true;
  });
  strHTMLStatic = '';
  for (iterDay in arrDays) {
    strCurrDay = dayOfWeekAsString(iterDay);
    if (arrDays[iterDay] === true) {
      strHTMLStatic += '<button class="btn btn-success btn-md" id="' + strCurrDay + '">';
    } else {
      strHTMLStatic += '<button class="btn btn-default btn-md" id="' + strCurrDay + '">';
    }
    strHTMLStatic += strCurrDay + '</button>';
  }
  strHTMLStatic += '</td></tr>'

  return strRowEdit + strHTMLEdit + strRowStatic + strHTMLStatic;
}

function formatLog(strMessage) {
  // Colorize Message, in HTML format
  var strSplit = strMessage.split(' ');
  if (typeof(logColors) !== "undefined")
    strColor = logColors[strSplit[1].toLowerCase()];
  else
    strColor = "lightgrey";
  if (strColor) {
    strSplit[1] = strSplit[1].fontcolor(strColor).bold();
  }

  // And output colorized string to Debug Log (Panel)
  $('#txtDebug').append(strSplit.join(' ') + '<br>');
  $("#txtDebug").scrollTop($("#txtDebug")[0].scrollHeight);
}

String.prototype.capitalizeFirstLetter = function() {
  return this.charAt(0).toUpperCase() + this.toLowerCase().slice(1);
};

String.prototype.toTitleCase = function() {
  return this.replace(/\w\S*/g, function(txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
};

function setStatusButton(btnID, btnState, btnLeadingText, glyphicon) {
  // Check for Leading Text
  if (typeof btnLeadingText === "undefined")
    btnLeadingText = '';
  if (typeof glyphicon === "undefined")
    glyphicon = '';
  // Set Button State
  if (btnState === 'delay') {
    btnID.html(btnLeadingText + 'Delay' + glyphicon);
    btnID.removeClass('btn-success');
    btnID.addClass('btn-warning');
  } else if (btnState === 1) {
    btnID.html(btnLeadingText + 'On' + glyphicon);
    btnID.removeClass('btn-primary');
    btnID.removeClass('btn-warning');
    btnID.addClass('btn-success');
  } else {
    btnID.html(btnLeadingText + 'Off' + glyphicon);
    btnID.removeClass('btn-success');
    btnID.addClass('btn-primary');
  }
}

// Function to configure communications sockets receive handling -> not called until clientConfig.json available (i.e. configuration complete)
function startSocketRx() {
  socket.on('circuit', function(data) {
    if (data !== null) {
      currCircuitArr = JSON.parse(JSON.stringify(data))
      $.each(data, function(indx, currCircuit) {
        if (currCircuit.hasOwnProperty('friendlyName')) {
          // Check for POOL or SPA - then ignore friendlyName, need to use circuitFunction for these two!
          if ((currCircuit.circuitFunction.toUpperCase() === "POOL") || (currCircuit.circuitFunction.toUpperCase() === "SPA"))
            currName = currCircuit.circuitFunction.toUpperCase();
          else
            currName = currCircuit.friendlyName;
          if (currName !== "NOT USED") {
            var glyphicon = '<span class="glyphicon glyphicon-play" aria-hidden="true"></span>';
            if (document.getElementById(currName)) {

              setStatusButton($('#' + currName), currCircuit.status);
              $('#' + currName).data(currName, currCircuit.number);
            } else if (document.getElementById(currCircuit.numberStr)) {
              if (currCircuit.delay === 1) {
                setStatusButton($('#' + currCircuit.numberStr), 'delay', '', currCircuit.macro ? glyphicon : '');
              } else {
                setStatusButton($('#' + currCircuit.numberStr), currCircuit.status, '', currCircuit.macro ? glyphicon : '');
              }
              $('#' + currCircuit.numberStr).data(currCircuit.numberStr, currCircuit.number);
            } else if ((generalParams.hideAUX === false) || (currName.indexOf("AUX") === -1)) {
              $('#features tr:last').after('<tr><td>' + currName.toLowerCase().toTitleCase() + '</td><td><button class="btn btn-primary btn-md" name="' + currCircuit.numberStr + '" id="' + currCircuit.numberStr + '">---</button></td></tr>');
              if (currCircuit.delay === 1) {
                setStatusButton($('#' + currCircuit.numberStr), 'delay', '', currCircuit.macro ? glyphicon : '');
              } else {
                setStatusButton($('#' + currCircuit.numberStr), currCircuit.status, '', currCircuit.macro ? glyphicon : '');
              }
              $('#' + currCircuit.numberStr).data(currCircuit.numberStr, currCircuit.number);
            }
          }
        }
      });
    }
    lastUpdate(true);
  });

  socket.on('pump', function(data) {
    if (data !== null) {
      // check all pumps first to see if we need to hide the GPM row
      var showGPM = false;
      $.each(data, function(indx, currPump) {
        if (currPump['type'].toUpperCase() === 'VF') {
          showGPM = true;
        }
      })

      // Build Pump table / panel
      $.each(data, function(indx, currPump) {
        if (currPump === null) {
          //console.log("Pump: Dataset empty.")
        } else {
          if (currPump !== "blank") {
            // New Pump Data (Object) ... make sure pumpParams has been read / processed (i.e. is available)
            if (typeof(pumpParams) !== "undefined") {
              if (typeof(currPump["friendlyName"]) !== "undefined") {
                // Determine if we need to add a column (new pump), or replace data - and find the target column if needed
                var rowHeader = $('#pumps tr:first:contains(' + currPump["friendlyName"] + ')');
                var colAppend = rowHeader.length ? false : true;
                if (colAppend === false) {
                  var colTarget = -1;
                  $('th', rowHeader).each(function(index) {
                    if ($(this).text() === currPump["friendlyName"])
                      colTarget = index;
                  });
                }

                if (!showGPM) {
                  $('#pumps tr:contains("GPM")').attr("hidden", "hidden")
                }

                // Cycle through Pump Parameters
                for (var currPumpParam in pumpParams) {
                  currParamSet = pumpParams[currPumpParam];
                  // Find Target Row
                  var rowTarget = $('#pumps tr:contains("' + currParamSet["title"] + '")');
                  // And finally, append or replace data
                  if (colAppend === true) {
                    // Build Cell, Append
                    strCell = '<' + currParamSet["type"] + '>' + currPump[currPumpParam] + '</' + currParamSet["type"] + '>';
                    rowTarget.append(strCell);
                  } else {
                    // Replace Data, target Row, Column
                    $('td', rowTarget).each(function(index) {
                      if (index === colTarget)
                        $(this).html(currPump[currPumpParam]);
                    });
                  }
                }
              }
            }
          }
        }
      });
    }
    lastUpdate(true);
  });

  socket.on('heat', function(data) {
    if (data !== null) {
      $('#poolHeatSetPoint').html(data.poolSetPoint);
      $('#poolHeatMode').data('poolHeatMode', data.poolHeatMode);
      $('#poolHeatModeStr').html(data.poolHeatModeStr);
      $('#spaHeatSetPoint').html(data.spaSetPoint);
      $('#spaHeatMode').data('spaHeatMode', data.spaHeatMode);
      $('#spaHeatModeStr').html(data.spaHeatModeStr);
    }
    lastUpdate(true);
  });

  socket.on('chlorinator', function(data) {
    //var data = {"saltPPM":2900,"currentOutput": 12, "outputPoolPercent":7,"outputSpaPercent":-1,"superChlorinate":0,"version":0,"name":"Intellichlor--40","status":"Unknown - Status code: 128"};
    if (data !== null) {

      if (data.installed === 1) {
        $('#chlorinatorTable tr').not(':first').show();
        $('#chlorinatorInstalled').hide();

        if ((data.currentOutput > 0))
          setStatusButton($('#CHLORINATOR'), 1);
        else
          setStatusButton($('#CHLORINATOR'), 0);
        $('#chlorinatorName').html(data.name);
        $('#chlorinatorSalt').html(data.saltPPM + ' ppm');
        $('#chlorinatorCurrentOutput').html(data.currentOutput + '%');
        var chlorStr = data.outputPoolPercent + '%'
        if (data.outputSpaPercent === -1) {
          $('#chlorinatorPoolPercentLabel').html('Pool Setpoint')
        } else {
          chlorStr += ' / ' + data.outputSpaPercent + '%';
          $('#chlorinatorPoolPercentLabel').html('Pool/Spa Setpoint')
        }

        $('#chlorinatorPoolPercent').html(chlorStr);

        if (data.superChlorinate === 1)
          $('#chlorinatorSuperChlorinate').html('True');
        else
          $('#chlorinatorSuperChlorinate').html('False');
        $('#chlorinatorStatus').html(data.status);
      } else {
        $('#chlorinatorTable tr').not(':first').hide();
        $('#chlorinatorInstalled').show();
      }
    }
    lastUpdate(true);
  });

  socket.on('schedule', function(data) {
    if (data !== null) {
      // Schedule/EggTimer to be updated => Wipe, then (Re)Build Below
      $('#schedules tr').not('tr:first').remove();
      $('#eggtimers tr').not('tr:first').remove();

      idOfFirstNotUsed=-1

      // And (Re)Build Schedule and EggTimer tables / panels
      $.each(data, function(indx, currSchedule) {
        if (currSchedule === null) {
          //console.log("Schedule: Dataset empty.")
        } else {
          if (currSchedule !== "blank") {

            // Schedule Event (if circuit used)
            if (currSchedule.CIRCUIT !== 'NOT USED') {
              if (currSchedule.MODE === "Schedule") {
                $('#schedules tr:last').after(buildSchTime(currSchedule) + buildSchDays(currSchedule));
                bindClockPicker('#schTime' + currSchedule.ID + 'StartTime', 'left')
                bindClockPicker('#schTime' + currSchedule.ID + 'EndTime', 'right')
                bindSelectPickerScheduleCircuit('#schTime' + currSchedule.ID + 'Circuit', currSchedule.friendlyName.capitalizeFirstLetter())
              } else {
                // EggTimer Event (if circuit used)

                $('#eggtimers tr:last').after(buildEggTime(currSchedule));
                splitInpStr = currSchedule.DURATION.split(":");
                strHours = splitInpStr[0];
                strMins = ('0' + parseInt(splitInpStr[1])).slice(-2);
                bindSelectPickerEggTimerCircuit('#schEgg' + currSchedule.ID + 'Circuit', currSchedule.friendlyName.capitalizeFirstLetter())
                bindSelectPickerHour('#schEgg' + currSchedule.ID + 'Hour', strHours)
                bindSelectPickerMin('#schEgg' + currSchedule.ID + 'Min', parseInt(strMins))

              }
            } else {
              if (idOfFirstNotUsed===-1){
                idOfFirstNotUsed = currSchedule.ID
              }
            }
          }
        }
      });

      // Add last row to schedule/egg timer if there is an available slot
      if (idOfFirstNotUsed!==-1){

        circuitSelectScheduleHTML = '<div class="input-group" style="width:150px"><select class="selectpicker show-menu-arrow show-tick" id="addScheduleCircuit"><option>Not Used</option>'
        circuitSelectEggTimerHTML = '<div class="input-group" style="width:150px"><select class="selectpicker show-menu-arrow show-tick" id="addEggTimerCircuit"><option>Not Used</option>'
        if (Object.keys(currCircuitArr).length > 1) {
          $.each(currCircuitArr, function(index, currCircuit) {
            if (currCircuit.friendlyName.toUpperCase() !== "NOT USED" && ((generalParams.hideAUX === false) || (currCircuit.friendlyName.indexOf("AUX") === -1))) {
              circuitSelectScheduleHTML += '<option data-circuitnum="' + currCircuit.number
              circuitSelectEggTimerHTML += '<option data-circuitnum="' + currCircuit.number
              circuitSelectScheduleHTML += '">' + currCircuit.friendlyName.capitalizeFirstLetter() + '</option>';
              circuitSelectEggTimerHTML += '">' + currCircuit.friendlyName.capitalizeFirstLetter() + '</option>';
            }
          })
          circuitSelectScheduleHTML += '</div>';
          circuitSelectEggTimerHTML += '</div>'
        }

        strEggTimer = '<tr class="eggEdit" '
        if (!$('#editPaneleggtimer').hasClass('btn-success'))
          strEggTimer += ' style="display:none" '
        strEggTimer += '><td>' + idOfFirstNotUsed + '</td><td>'+ circuitSelectEggTimerHTML +'</td><td colspan=2><a tabindex="0" class="btn" role="button" data-toggle="popover" data-trigger="focus" title="Add an egg timer" data-content="Select a circuit to add an egg timer.  It will default to 2 hours, 0 mins and you can refine it from there.</p>  <p>Note: If slots are available, they will show in both egg timers and schedules.  Select in the appropriate section to add it.</p> <p>The option to add additional circuits will not appear if there are no available slots.</p>"><span class="glyphicon glyphicon-info-sign" aria-hidden="true"></span>Adding an egg timer</a></td></tr>'
        $('#eggtimers').append(strEggTimer)
        $('#addEggTimerCircuit').selectpicker({
          mobile: jQuery.browser.mobile, //if true, use mobile native scroll, else format with selectpicker css
        });
        $('#addEggTimerCircuit').on('changed.bs.select', function(e, clickedIndex, newValue, oldValue) {
          socket.emit('setSchedule', idOfFirstNotUsed, $('#addEggTimerCircuit').find('option:selected').data('circuitnum'),25,0,2,0,0)
          console.log('setSchedule', idOfFirstNotUsed, $('#addEggTimerCircuit').find('option:selected').data('circuitnum'),25,0,2,0,0)
          $('#addEggTimerCircuit').prop('disabled', true)
          $('#addEggTimerCircuit').selectpicker('refresh')
        })

        strSchedule =  '<tr class="schEdit"'
        if (!$('#editPanelschedule').hasClass('btn-success'))
          strSchedule += ' style="display:none" '
        strSchedule += '><td>' + idOfFirstNotUsed + '</td><td>'+ circuitSelectScheduleHTML +'</td><td colspan=2><a tabindex="0" class="btn" role="button" data-toggle="popover" data-trigger="focus" title="Add a schedule" data-content="Select a circuit to add a schedule.  It will default to run from 8am-9am on no days and you can refine it further from there.<p>Note: If slots are available, they will show in both egg timers and schedules.  Select in the appropriate section to add it.</p> <p>The option to add additional circuits will not appear if none are available.</p>"><span class="glyphicon glyphicon-info-sign" aria-hidden="true"></span>Adding a schedule</a></td></tr>'
        $('#schedules').append(strSchedule)
        $('#addScheduleCircuit').selectpicker({
          mobile: jQuery.browser.mobile, //if true, use mobile native scroll, else format with selectpicker css
        });
        $('#addScheduleCircuit').on('changed.bs.select', function(e, clickedIndex, newValue, oldValue) {
          socket.emit('setSchedule', idOfFirstNotUsed, $('#addScheduleCircuit').find('option:selected').data('circuitnum'),8,0,9,0,128)
          console.log('setSchedule', idOfFirstNotUsed, $('#addScheduleCircuit').find('option:selected').data('circuitnum'),8,0,9,0,0)
          $('#addScheduleCircuit').prop('disabled', true)
          $('#addScheduleCircuit').selectpicker('refresh')
        })

        //enable all tooltips
        $('[data-toggle="popover"]').popover({trigger: "hover click", html: true, container: 'body'});
      }


      function bindSelectPickerScheduleCircuit(el, _default) {
        // To style only <select>s with the selectpicker class
        $(el).selectpicker({
          mobile: jQuery.browser.mobile, //if true, use mobile native scroll, else format with selectpicker css
        });
        $(el).selectpicker('val', _default)
        $(el).on('changed.bs.select', function(e, clickedIndex, newValue, oldValue) {
          if ($(el).val() === "DELETE") {
            socket.emit('deleteScheduleOrEggTimer', $(el).closest('tr').data('id'))
          } else {
            socket.emit('setScheduleCircuit', $(el).closest('tr').data('id'), $(el).find('option:selected').data('circuitnum'))
          }
          $(el).prop('disabled', true)
          $(el).selectpicker('refresh')
        })
      }

      function bindSelectPickerEggTimerCircuit(el, _default) {
        // To style only <select>s with the selectpicker class
        $(el).selectpicker({
          mobile: jQuery.browser.mobile, //if true, use mobile native scroll, else format with selectpicker css
        });
        $(el).selectpicker('val', _default)
        $(el).on('changed.bs.select', function(e, clickedIndex, newValue, oldValue) {
          if ($(el).val() === "DELETE") {
            socket.emit('deleteScheduleOrEggTimer', $(el).closest('tr').data('id'))
          } else {
            socket.emit('setEggTimer', $(el).closest('tr').data('id'), $(el).find('option:selected').data('circuitnum'), $(el).closest('tr').data('hour'), $(el).closest('tr').data('min'))
            //console.log('setEggTimer', $(el).closest('tr').data('id'), $(el).find('option:selected').data('circuitnum'), $(el).closest('tr').data('hour'), $(el).closest('tr').data('min'))
          }
          $(el).prop('disabled', true)
          $(el).selectpicker('refresh')
        })
      }

      function bindSelectPickerHour(el, _default) {
        // To style only <select>s with the selectpicker class
        $(el).selectpicker({
          mobile: jQuery.browser.mobile, //if true, use mobile native scroll, else format with selectpicker css
        });
        $(el).selectpicker('val', _default)
        $(el).on('changed.bs.select', function(e, clickedIndex, newValue, oldValue) {
          socket.emit('setEggTimer', $(el).closest('tr').data('id'), $(el).closest('tr').data('circuitnum'), $(el).val(), $(el).closest('tr').data('min'))
          //console.log('egg id: %s  hour changed to %s.  circuit %s.  min %s', $(el).closest('tr').data('id'), $(el).val(), $(el).closest('tr').data('circuitnum'), $(el).closest('tr').data('min'))
          console.log('setEggTimer', $(el).closest('tr').data('id'), $(el).closest('tr').data('circuitnum'), $(el).val(), $(el).closest('tr').data('min'))
          $(el).prop('disabled', true)
          $(el).selectpicker('refresh')
        })
      }


      function bindSelectPickerMin(el, _default) {
        // To style only <select>s with the selectpicker class
        $(el).selectpicker({
          mobile: jQuery.browser.mobile, //if true, use mobile native scroll, else format with selectpicker css
        });
        $(el).selectpicker('val', _default)
        $(el).on('changed.bs.select', function(e, clickedIndex, newValue, oldValue) {
          socket.emit('setEggTimer', $(el).closest('tr').data('id'), $(el).closest('tr').data('circuitnum'), $(el).closest('tr').data('hour'), $(el).val())
          console.log('setEggTimer', $(el).closest('tr').data('id'), $(el).closest('tr').data('circuitnum'), $(el).closest('tr').data('hour'), $(el).val())
          $(el).prop('disabled', true)
          $(el).selectpicker('refresh')
        })
      }

      function bindClockPicker(el, _align) {
        $(el).clockpicker({
          donetext: 'OK',
          twelvehour: false,
          align: _align,
          autoclose: true,
          beforeShow: function() {
            $(el).val(fmt24hrTime($(el).val()));
          },
          afterShow: function() {
            $(el).val(fmt12hrTime($(el).val()));
          },
          afterHide: function() {
            $(el).val(fmt12hrTime($(el).val()));
          },
          afterDone: function() {
            $(el).val(fmt12hrTime($(el).val()));
            $(el).attr("value", fmt12hrTime($(el).val()))
            var newTime = fmt24hrTime($(el).val())
            var timeArr = newTime.split(':')
            socket.emit('setScheduleStartOrEndTime', $(el).data("id"), $(el).data("startorend"), timeArr[0], timeArr[1]);
          }
        })
      }
      bindClockPicker();




    }
    lastUpdate(true);
  });

  socket.on('outputLog', function(data) {
    formatLog(data);
    lastUpdate(true);
  });

  socket.on('time', function(data) {
    // Update Date and Time (buttons) - custom formatted
    var newDT = new Date(data.controllerDateStr + ' ' + data.controllerTime)
    $('#currDate').val(newDT.getDate() + '-' + monthOfYearAsString(newDT.getMonth()) + '-' + newDT.getFullYear().toString().slice(-2));
    $('#currTime').val(fmt12hrTime(newDT.getHours() + ':' + newDT.getMinutes()));
    // Initialize (and configure) Date and Clock Pickers for button (input) => gated on getting time once, to determine DST setting!
    autoDST = data.automaticallyAdjustDST;
    $('#currDate').datepicker({
      dateFormat: 'dd-M-y',
      onSelect: function() {
        var newDT = new Date($('#currDate').val() + ' ' + $('#currTime').val());
        socket.emit('setDateTime', newDT.getHours(), newDT.getMinutes(), Math.pow(2, newDT.getDay()), newDT.getDate(), newDT.getMonth() + 1, newDT.getFullYear().toString().slice(-2), autoDST);
      }
    });
    $('#currTime').clockpicker({
      donetext: 'OK',
      twelvehour: false,
      beforeShow: function() {
        $('#currTime').val(fmt24hrTime($('#currTime').val()));
      },
      afterShow: function() {
        $('#currTime').val(fmt12hrTime($('#currTime').val()));
      },
      afterHide: function() {
        $('#currTime').val(fmt12hrTime($('#currTime').val()));
      },
      afterDone: function() {
        $('#currTime').val(fmt12hrTime($('#currTime').val()));
        var newDT = new Date($('#currDate').val() + ' ' + $('#currTime').val());
        socket.emit('setDateTime', newDT.getHours(), newDT.getMinutes(), Math.pow(2, newDT.getDay()), newDT.getDate(), newDT.getMonth() + 1, newDT.getFullYear().toString().slice(-2), autoDST);
      }
    });
    lastUpdate(true);
  });

  socket.on('temp', function(data) {
    $('#airTemp').html(data.airTemp);
    $('#solarTemp').html(data.solarTemp);
    if (data.solarTemp === 0)
      $('#solarTemp').closest('tr').hide();
    else
      $('#solarTemp').closest('tr').show();
    $('#poolCurrentTemp').html(data.poolTemp);
    $('#spaCurrentTemp').html(data.spaTemp);
    if (data.heaterActive === 1)
      $('#stateHeater').html('On');
    else
      $('#stateHeater').html('Off');
    if (data.freeze === 1)
      $('#stateFreeze').html('On');
    else
      $('#stateFreeze').html('Off');
    lastUpdate(true);
  });

  socket.on('updateAvailable', function(data) {
    strUpdate = data.result.capitalizeFirstLetter()
    domUpdate = $('#gitState')
    domUpdate[0].innerHTML = 'Code State<br/>' + strUpdate;
    if (strUpdate === 'Equal') {
      domUpdate.removeClass('btn-warning');
      domUpdate.removeClass('btn-danger');
      domUpdate.addClass('btn-success');
    } else if (strUpdate === 'Newer') {
      domUpdate.removeClass('btn-success');
      domUpdate.removeClass('btn-danger');
      domUpdate.addClass('btn-warning');
    } else {
      domUpdate.removeClass('btn-success');
      domUpdate.removeClass('btn-warning');
      domUpdate.addClass('btn-danger');
    }
    domUpdate[0].style.visibility = "visible";
    lastUpdate(true);
  });
}

// Socket Emit Events (Transmit to Server)

function setHeatMode(equip, change) {
  socket.emit('setHeatMode', equip, change);
}

function setEquipmentStatus(equipment) {
  if (equipment !== undefined)
    socket.emit('toggleCircuit', equipment);
  else
    formatLog('ERROR: Client, equipment = undefined');
}


function refreshSpy() {
  $('[data-spy="scroll"]').each(function() {
    var $spy = $(this).scrollspy('refresh')
  })
}

// Initialize Panel Handling Routines (Callbacks)
function handlePanels() {
  // Panel Handling: When Panel is being collapsed or shown => save current state to configClient.json (i.e. set to be the default on load)
  $(".panel-collapse").on('show.bs.collapse', function(btnSelected) {
    var btnID = btnSelected.target.id;
    var strID = btnID.replace('collapse', '').toLowerCase();
    socket.emit('setConfigClient', 'panelState', strID, 'state', 'visible')
    refreshSpy();
  });
  $(".panel-collapse").on('hide.bs.collapse', function(btnSelected) {
    var btnID = btnSelected.target.id;
    var strID = btnID.replace('collapse', '').toLowerCase();
    socket.emit('setConfigClient', 'panelState', strID, 'state', 'collapse')
    refreshSpy();
  });
}

// Initialize Button Handling Routines (Callbacks)
function handleButtons() {

  // Button Handling: gitState => Hide Code State (and flag upstream). Note, hidden to start (default, in index.html), unhide (change visibility) if state received.
  $('#gitState').click(function() {
    $('#gitState')[0].style.visibility = "hidden";
    socket.emit('updateVersionNotification', true);
  });

  // Button Handling: Hide Panel, and Store / Update Config (so hidden permanently, unless reset!)
  $('button').click(function(btnSelected) {
    var btnID = btnSelected.target.id;
    // If Panel Hide selected => then do it!
    if (btnID.search('hidePanel') === 0) {
      var strID = btnID.replace('hidePanel', '');
      $('#' + strID).hide();
      socket.emit('setConfigClient', 'panelState', strID, 'state', 'hidden')
    }
    refreshSpy();
  });

  // Schedule day toggle: bind to the parent event as the children are dynamically created
  $('#schedules').on('click', '.schDay', function() {
    socket.emit('toggleScheduleDay', this.getAttribute("data-schId"), this.getAttribute("data-schDay"))
  })

  // Button Handling: Reset Button Layout (reset all panels in configClient.json to visible)
  $('#btnResetLayout').click(function() {
    socket.emit('updateVersionNotification', false);
    $.getJSON('configClient.json', function(json) {
      // Panel Data Retrieved, now reset all of them to visible (store to configClient.json, and make visible immediately)
      for (var currPanel in json.panelState) {
        socket.emit('setConfigClient', 'panelState', currPanel, 'state', 'visible')
        $('#' + currPanel).show();
      }
    });
    refreshSpy();
  });

  // Button Handling: Pool, Spa => On/Off
  $('#poolState, #spaState').on('click', 'button', function() {
    setEquipmentStatus($(this).data($(this).attr('id')));
  });

  // Button Handling: Pool / Spa, Temperature SetPoint
  $('#poolSetpoint, #spaSetpoint').on('click', 'button', function() {
    socket.emit($(this).data('socket'), $(this).data('adjust'));
  });


  // Button Handling: Pool / Spa, Heater Mode
  $('#poolHeatMode, #spaHeatMode').on('click', 'button', function() {
    var currButtonPressed = $(this).attr('id');
    if (currButtonPressed.includes('HeatMode')) {
      var strHeatMode = currButtonPressed.slice(0, currButtonPressed.indexOf('HeatMode')) + 'HeatMode';
      var currHeatMode = $('#' + strHeatMode).data(strHeatMode);
      var newHeatMode = (currHeatMode + 4 + $(this).data('heatModeDirn')) % 4;
      setHeatMode($('#' + strHeatMode).data('equip'), newHeatMode);
    }
  });

  // Button Handling: Features => On/Off
  $('#features').on('click', 'button', function() {

    if ($(this).html() === 'Delay') {
      socket.emit('cancelDelay')
    } else {
      setEquipmentStatus($(this).data($(this).attr('id')));
    }
  });

  // Button Handling: Debug Log => On/Off
  $('#debugEnable').click(function() {
    if ($('#debug').is(":visible") === true) {
      $('#debug').hide();
      setStatusButton($('#debugEnable'), 0, 'Debug:<br/>');
      socket.emit('setConfigClient', 'panelState', 'debug', 'state', 'hidden')
    } else {
      $('#debug').show();
      setStatusButton($('#debugEnable'), 1, 'Debug:<br/>');
      socket.emit('setConfigClient', 'panelState', 'debug', 'state', 'visible')
    }
  });

  // Debug Log, KeyPress => Select All (for copy and paste, select log window, press SHFT-A)
  // Reference, from https://www.sanwebe.com/2014/04/select-all-text-in-element-on-click => Remove "older ie".
  $('#txtDebug').keypress(function(event) {
    if (event.key === "A") {
      var sel, range;
      var el = $(this)[0];
      sel = window.getSelection();
      if (sel.toString() === '') { //no text selection
        window.setTimeout(function() {
          range = document.createRange(); //range object
          range.selectNodeContents(el); //sets Range
          sel.removeAllRanges(); //remove all ranges from selection
          sel.addRange(range); //add Range to a Selection.
        }, 1);
      }
    }
  });

  // Button Handling: Debug Log => Clear!
  $('#debugClear').click(function() {
    $('#txtDebug').html('<b>DEBUG LOG ... <br />');
  });

  // Button Handling: Modal, Save Settings for Chlorinator ... and second function, so keypress (Enter Key) fires input
  $('#SaveChanges').click(function() {
    $('#modalChlorinator').modal('hide');
    var chlorSetting = parseFloat($('#modalChlorInput')[0].value);
    if ((chlorSetting >= 0) && (chlorSetting <= 101))
      socket.emit('setchlorinator', chlorSetting);
  });
  $('#modalChlorinator').keypress(function(key) {
    if (key.which === 13)
      $('#SaveChanges').click();
  })

  //set active menu item
  $(".nav li").on("click", function() {
    $(".nav li").removeClass("active");
    $(this).addClass("active");
  });
  //and collapse navbar when selecting
  $('.navbar-collapse a').click(function() {
    $(".navbar-collapse").collapse('hide');
  });

  $('#editPanelschedule').click(function() {
    if ($('#editPanelschedule').hasClass('btn-success'))
    // static
    {
      $('#editPanelschedule').removeClass('btn-success')
      $('.schEdit').hide()
      $('.schStatic').show()
    } else
    // edit
    {
      $('#editPanelschedule').addClass('btn-success')
      $('.schEdit').show()
      $('.schStatic').hide()
    }

  })

  $('#editPaneleggtimer').click(function() {
    if ($('#editPaneleggtimer').hasClass('btn-success'))
    // static
    {
      $('#editPaneleggtimer').removeClass('btn-success')
      $('.eggEdit').hide()
      $('.eggStatic').show()
    } else
    // edit
    {
      $('#editPaneleggtimer').addClass('btn-success')
      $('.eggEdit').show()
      $('.eggStatic').hide()
    }

  })

}

// Refresh / Update status button (showing last message / information received)
function lastUpdate(reset) {
  var tmeCurrent = Date.now();
  if (typeof(tmeLastUpd) === "undefined")
    tmeLastUpd = tmeCurrent;
  tmeDelta = (tmeCurrent - tmeLastUpd) / 1000;
  domDelta = $('#tmrLastUpd')
  domDelta[0].innerHTML = 'Last Update<br/>' + tmeDelta.toFixed(1) + ' secs ago';

  if (typeof(generalParams) !== "undefined") {
    if (tmeDelta <= generalParams.tmeSuccess) {
      domDelta.removeClass('btn-warning');
      domDelta.removeClass('btn-danger');
      domDelta.addClass('btn-success');
    } else if (tmeDelta <= generalParams.tmeWarning) {
      domDelta.removeClass('btn-success');
      domDelta.removeClass('btn-danger');
      domDelta.addClass('btn-warning');
    } else {
      domDelta.removeClass('btn-success');
      domDelta.removeClass('btn-warning');
      domDelta.addClass('btn-danger');
    }
  }
  if (reset === true)
    tmeLastUpd = tmeCurrent;
}



// From http://api.jquery.com/jquery/#jQuery3
// JQuery(callback), Description: Binds a function to be executed when the DOM has finished loading
$(function() {
  // Callback Routine, every second - to update / record time since last message received
  setInterval(function() {
    lastUpdate(false)
  }, 1000);

  // Set up draggable options => allow to move panels around
  var panelList = $('#draggablePanelList');
  panelList.sortable({
    // Only make the .panel-heading child elements support dragging.
    // Omit this to make then entire <li>...</li> draggable.
    handle: '.panel-heading',
    update: function() {
      var panelIndices = [];
      panelList.children().each(function() {
        panelIndices[$(this).index()] = $(this).attr('id');
      });
      localStorage.setItem('panelIndices', JSON.stringify(panelIndices));
    }
  });

  // Load configuration (from json), process once data ready
  $.getJSON('configClient.json', function(json) {
    // Configure panels (visible / hidden, sequence)
    configPanels(json.panelState);
    // Call routine to recursively parse Equipment Configuration, setting associated data for DOM elements
    dataAssociate("base", json.equipConfig);
    // Log Pump Parameters (rows to output) => no var in front, so global
    pumpParams = json.pumpParams;
    // Log test colorization => no var in front, so global
    logColors = json.logLevels;
    // General JS Parameters (for this code)
    generalParams = json.generalParams;
    // And Now, initialize Socket IO (as client configuration in place now)
    socket = io();
    startSocketRx();
    // Finally, initialize Panel and button handling
    handlePanels();
    handleButtons();
  });

  $('body').scrollspy({
    target: '#pool_navbar'
  })
});
