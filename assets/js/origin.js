// NOTE: Fix the issue where the form updates even if an error appears!

// Variables
var db = "";
var databasePopulated = false;
var userInformation;

// Bus Tracker Variables
var apiKey = 'hfn2fy3Ph6wRLreQtTJfRvR3S';
var endText = '&format=json';
var searchURL = "";
var baseURL = "http://www.ctabustracker.com/bustime/api/v2/";
var apiPassThruUrl = "https://polar-garden-75406.herokuapp.com/apiPassThru.php";

// Display Page Function (Load the page to the main content element using jQuery load method)
function displayPage(page) {
  $("#main_Content").load("./page-content/loading.html", function() {
    var pageURL = "./page-content/" + page + ".html";
    $("#main_Content").load(pageURL, function() {
      componentHandler.upgradeAllRegistered(); // initialize all mdl-js components
    });
  });
}

// Execute when the document is "ready"
$(document).ready(function() {
  initializeDatabase();
  fetchData();
});

function initializeDatabase() {
  db = new Dexie("busUp_Database");
  db.version(1).stores({
    users: '++id,registered,name,location,savedStops',
  });

  db.open();
}

function fetchData() {
  db.on('ready', function() {
      console.log("Fetching data...");
    return db.users.count(function(count) {
      if (count > 0) {
        console.log('Data already populated onto database.');
        databasePopulated = true;
        // Get the user data
        db.users.get(1, function(user) {
        //  console.log(user);
          userInformation = user;
          console.log(userInformation);
          $('#first_Name_Display').text(user.name);
        })

        hideAll();
        show('#welcome_Back_Page');
        setActiveNav("home");
      } else {
        console.log('No data found in the database.');
        hideAll();
        show('#sign_Up_Page');
      }
    });
  });
}

function displaySettingsInformation() {
  $('#getStarted_Header').text('Edit your information');
  $('input[name="name"]').val(userInformation.name);
  $('input[name="location"]').val(userInformation.location);
}

function writeData(type, data) {
  console.log('... Write Data ...');
  console.log(type);
  console.log(data);

  if (type == "firstTime") {
    console.log('First time submitting data...');

    db.transaction('rw', db.users, function () {
          db.users.add(data);
      }).catch(function(err) {
          console.error(err.stack || err);
      });


  } else if (type == "update") {
    db.users.update(1, {name: data['name'], location: data['location']}).then(function (updated) {
      console.log(updated);
      if (updated) {
        console.log ("Update successful!");
        bootbox.alert({
          title: "Success",
          message: "Successfully updated information!",
          callback: function() {
            fetchData();
            console.log('Fetching data again');
          }
        });
      } else if (updated == 0) {
        console.log("Nothing to update!");
        fetchData();
        console.log('Fetching data again');
      } else {
        console.log ("Failed to update!");
        bootbox.alert({
          title: "Error",
          message: "There seems to be an error updating your information, please try again later!",
          callback: function() {
            fetchData();
            console.log('Fetching data again');
          }
        });
      }
    });
  }
}

function fetchAllBusRoutes() {
  var selectedDirection;
  searchURL = baseURL + "getroutes";
  console.log(searchURL);

  showLoader();

  $.ajax({
    url: apiPassThruUrl,
    dataType: 'json',
    method: 'GET',
    data: {"apiEndpoint": searchURL,
           "key": apiKey,
           "format": "json"}
  }).done (function (data) {
    console.log(data);
    console.log(data['bustime-response']['routes']);
    $.each(data['bustime-response']['routes'], function(i, v) {
      //$('#bus_Route_List').append("Route: " + v.rt + ", Route Name: " + v.rtnm);
      var newBusCard = $('#bus_Route_Card').clone();
      newBusCard.removeAttr('id');
      newBusCard.find('h4').text('Route ' + v.rt);
      newBusCard.find('p').text(v.rtnm);
      newBusCard.attr('data-route', 'Route ' + v.rt);
      newBusCard.attr('data-routename',  v.rtnm);
      newBusCard.removeClass('hide');
      newBusCard.appendTo('#bus_Route_List');
      //hide('.loader_Center');
    //  show('#bus_Tracker_Page');

      newBusCard.on('click', function() {
        var options = [];
        var directions = fetchRouteDirections(v.rt).done(function(result) {
          $.each(result['bustime-response']['directions'], function(i, v) {
            options.push({text: v.dir, value: v.dir});
           });

           console.log(options);

           if (!options) {
             console.log('ERROR: Data not pushed into array!');
           } else {
             console.log('SUCCESS: Data pushed into array!');
             console.log(options);
             options.unshift({text: "Select Direction", value: ""});
             var promptOptions = {
               title: "Direction",
               inputType: 'select',
               inputOptions: options,
               callback: function (result) {
                 console.log(result);
                 fetchRouteStops(v.rt, result);
               }
             };
             bootbox.prompt(promptOptions);
           }
        });

      // NOTE: Make a new abstract function to make this work, otherwise this will be an extremely long function

      // NOTE: Save the routes and bus stops to IndexedDB so that we are not calling the same routes/stops every time we refresh the page
      });
    });
    hideAll();
    show('#bus_Tracker_Page');
  });
}

function fetchRouteDirections(routeNum) {
  var searchURL = baseURL + "getdirections?key=" + apiKey + "&rt=" + routeNum + "&format=json";
  var directionsReturned = "";
  return $.ajax({
    url: apiPassThruUrl,
    dataType: 'json',
    method: 'GET',
    data: {"apiEndpoint": searchURL,
           "key": apiKey,
           "format": "json"}
  });
}

function fetchRouteStops(routeNum, direction) {
  if (direction == "") {
    bootBoxError("You did not select a direction. Try again!");
  } else {
    console.log(routeNum);
    searchURL = baseURL + "getstops?key=" + apiKey + "&rt=" + routeNum + "&dir=" + direction + "&format=json";
    console.log(searchURL);
    hide('#bus_Tracker_Page_Route_Search');
    showLoader();

    $.ajax({
      url: apiPassThruUrl,
      dataType: 'json',
      method: 'GET',
      data: {"apiEndpoint": searchURL,
             "key": apiKey,
             "format": "json"}
    }).done (function (data) {
      console.log(data);
      console.log(data['bustime-response']['stops']);
      $.each(data['bustime-response']['stops'], function(i, v) {
        //$('#bus_Route_List').append("Route: " + v.rt + ", Route Name: " + v.rtnm);
        var newBusCard = $('#bus_Stop_Card').clone();
        newBusCard.removeAttr('id');
        newBusCard.find('h4').text(v.stpnm);
        newBusCard.attr('data-stopname', v.stpnm);
        newBusCard.attr('data-stopid', v.stpid);
        newBusCard.removeClass('hide');
        newBusCard.appendTo('#bus_Stop_Div_List');
        // hide('.loader_Center');
        // show('#bus_Tracker_Page');

        newBusCard.on('click', function() {
          // Function goes here
        });
      });
      hideAll();
      show('#bus_Tracker_Page');
      show('#bus_Tracker_Page_Stop_Search');
      $('#bus_Stop_Search_Route_Display').text('Route ' + routeNum);
    });



    // show('#bus_Tracker_Page_Stop_Search');
    // $('#bus_Stop_Search_Route_Display').text('Route ' + routeNum);
  }
}

$('#filter_Routes').keyup(function() {
  var rex = new RegExp($(this).val(), 'i');
  $('#bus_Route_List a').addClass('hide');
  $('#bus_Route_List a').filter(function() {
    return rex.test($(this).attr('data-routename'));
  }).removeClass('hide');
  $('#bus_Route_List a').filter(function() {
    return rex.test($(this).attr('data-route'));
  }).removeClass('hide');
});

$('#filter_Stops').keyup(function() {
  var rex = new RegExp($(this).val(), 'i');
  $('#bus_Stop_Div_List a').addClass('hide');
  $('#bus_Stop_Div_List a').filter(function() {
    return rex.test($(this).attr('data-stopname'));
  }).removeClass('hide');
  $('#bus_Route_List a').filter(function() {
    return rex.test($(this).attr('data-stopid'));
  }).removeClass('hide');
});

$('#register_Form').on('submit', function(e) {
  e.preventDefault();
  var submittedData = $(this).serializeArray();
  var dataObjects = {};
  var attempt;
  dataObjects.registered = 'true';

  $(submittedData).each(function(i, field) {
    dataObjects[field.name] = field.value;
  });

  if (/[\w ]+, \w{2}/.test(dataObjects['location'])) {
    console.log('Valid location input');
  } else {
    displayError('Invalid location inserted. Please insert your location in the following format: City, State. For example: "Chicago, IL"');
  }

  dataObjects.savedStops = '';

  console.log(dataObjects);

  if ($('#getStarted_Header').text() == "Let's get started!") {
    attempt = 'firstTime';
  } else if ($('#getStarted_Header').text() == "Edit your information") {
    attempt = 'update';
  }



  writeData(attempt, dataObjects);

//  db.users.put()

  // console.log(dataObjects['name']); // Logs the name that the user submitted
});

function bootBoxError(errorMessage) {
  bootbox.alert({
    title: "Erorr!",
    message: errorMessage
});
}

// NOTE: Make sure to add the sub divs to the hideAll function!!

function hideAll() {
  $('#sign_Up_Page').addClass('hide');
  $('.loader_Center').addClass('hide');
  $('#welcome_Back_Page').addClass('hide');
  $('#bus_Tracker_Page').addClass('hide');
  $('#weather_Page').addClass('hide');
}

function hide(element) {
  $(element).addClass('hide');
}

function show(element) {
  $(element).removeClass('hide');
}

function showLoader() {
  $('.loader_Center').removeClass('hide');
}


function displayError(errorDescription) {
  $('#alert_Description').html(errorDescription);
  show('#sign_Up_Page_Alert');
}

function setActiveNav(activePage) {
  $('#home_Nav').removeClass('active');
  $('#bus_Tracker_Nav').removeClass('active');
  $('#weather_Nav').removeClass('active');
  $('#settings_Nav').removeClass('active');

  switch (activePage) {
    case "home":
      $('#home_Nav').addClass('active');
      break;
    case "bus_Tracker":
      $('#bus_Tracker_Nav').addClass('active');
      break;
    case "weather":
      $('#weather_Nav').addClass('active');
      break;
    case "settings":
      $('#settings_Nav').addClass('active');
      break;
  }
}

$('.home_Btn').on('click', function() {
  $('.navbar-toggler').click();
  console.log(databasePopulated);
  if (databasePopulated == false) {
    hideAll();
    show('#sign_Up_Page');
    setActiveNav("home");
  } else if (databasePopulated == true) {
    hideAll();
    show('#welcome_Back_Page');
    setActiveNav("home");
  }
});

$('.bus_Tracker_Btn').on('click', function() {
  $('.navbar-toggler').click();
  console.log(databasePopulated);
  if (databasePopulated == false) {
    hideAll();
    show('#sign_Up_Page');
    setActiveNav("home");
  } else if (databasePopulated == true) {
    hideAll();
    fetchAllBusRoutes();
    // show('#bus_Tracker_Page');
    setActiveNav("bus_Tracker");
  }
});

$('.weather_Btn').on('click', function() {
  $('.navbar-toggler').click();
  console.log(databasePopulated);
  if (databasePopulated == false) {
    hideAll();
    show('#sign_Up_Page');
    setActiveNav("home");
  } else if (databasePopulated == true) {
    hideAll();
    show('#weather_Page');
    setActiveNav("weather");
  }
});

$('.settings_Btn').on('click', function() {
  $('.navbar-toggler').click();
  console.log(databasePopulated);
  if (databasePopulated == false) {
    hideAll();
    show('#sign_Up_Page');
    setActiveNav("home");
  } else if (databasePopulated == true) {
    hideAll();
    displaySettingsInformation();
    show('#sign_Up_Page');
    setActiveNav("settings");
  }
});


$('.bus_Tracker_Btn_Alt').on('click', function() {
  console.log(databasePopulated);
  if (databasePopulated == false) {
    hideAll();
    show('#sign_Up_Page');
    setActiveNav("home");
  } else if (databasePopulated == true) {
    hideAll();
    fetchAllBusRoutes();
    // show('#bus_Tracker_Page');
    setActiveNav("bus_Tracker");
  }
});

$('.weather_Btn_Alt').on('click', function() {
  console.log(databasePopulated);
  if (databasePopulated == false) {
    hideAll();
    show('#sign_Up_Page');
    setActiveNav("home");
  } else if (databasePopulated == true) {
    hideAll();
    show('#weather_Page');
    setActiveNav("weather");
  }
});
