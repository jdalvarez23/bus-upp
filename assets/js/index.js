// Variables
var db = ""; // initialize database variable
var databasePopulated = false; // initalize boolean variable
var userInformation; // initialize user information variable
var selectedRoute; // initialize user-selected route variable
var selectedStop; // initialize user-selected route stop variable
var selectedDirection; // initialize user-selected route direction variable
// Bus API Variables
var apiKey = 'hfn2fy3Ph6wRLreQtTJfRvR3S';
var endText = '&format=json';
var searchURL = "";
var baseURL = "http://www.ctabustracker.com/bustime/api/v2/";
var apiPassThruUrl = "https://polar-garden-75406.herokuapp.com/apiPassThru.php";

// Execute when the document is "ready"
$(document).ready(function() {
  initializeDatabase(); // method called to initialize IndexedDB
  fetchData(); // method called to fetch user information from indexedDB
});

// Function to detect mobile device
var isMobile = {
  Android: function() {
    return navigator.userAgent.match(/Android/i);
  },
  BlackBerry: function() {
    return navigator.userAgent.match(/BlackBerry/i);
  },
  iOS: function() {
    return navigator.userAgent.match(/iPhone|iPad|iPod/i);
  },
  Opera: function() {
    return navigator.userAgent.match(/Opera Mini/i);
  },
  Windows: function() {
      return navigator.userAgent.match(/IEMobile/i);
  },
  any: function() {
    return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows());
  }
};

// Initialize Database Function (Initialize the IndexedDB)
function initializeDatabase() {
  db = new Dexie("busUp_Database"); // create new indexedDB
  db.version(1).stores({ // store information on version one
    users: '++id,registered,name,location,savedStops',
  });

  db.open(); // open connection to indexedDB
}

// Fetch Data Function (Retrieve user information from indexedDB)
function fetchData() {
  db.on('ready', function() { // execute when indexedDB is on "ready" state
    console.log("Fetching data...");
    return db.users.count(function(count) { // return information from indexedDB
      // Execute if there are users found in indexedDB
      if (count > 0) {
        console.log('Data already populated onto database.');
        databasePopulated = true;
        // Retrieve user data from indexedDB
        db.users.get(1, function(user) {
          userInformation = user; // set user data to variable
          console.log(userInformation);
        });
        displayPage("home"); // display the home page
        // Execute if no users found in indexedDB
      } else {
        console.log('No data found in database.');
        displayPage("register"); // display the register page
      }
    });
  });
}

// Write Data Function (Write user information to indexedDB)
function writeData(type, data) {
  console.log("...Writing data...");
  console.log("Type: ", type);
  console.log(data);

  // Execute if user is entering data for first time
  if (type == "firstTime") {
    console.log("First time submitting data.");

    db.transaction('rw', db.users, function () {
      db.users.add(data); // write data to user's table
      console.log('Fetching data again...');
      fetchData(); // method called to fetch user information from indexedDB
    }).catch(function(err) { // execute if error occurs
      console.error(err.stack || err);
    });

  // Execute if user is updating existing data
  } else if (type == "update") {
    db.users.update(1, {name: data['name'], location: data['location']}).then(function(updated) {
      console.log(updated);
      // Execute if data returned exists
      if (updated) {
        console.log ("Update successful!");
        // Alert the user that data was successfully updated
        bootbox.alert({
          title: "Success",
          message: "Successfully updated information!",
          callback: function() {
            console.log('Fetching data again...');
            fetchData(); // method called to fetch user information from indexedDB
          }
        });
      // Execute if data returned is null
      } else if (updated == 0) {
        console.log("Nothing to update!");
        console.log('Fetching data again...');
        fetchData(); // method called to fetch user information from indexedDB
      // Execute if no data is returned
      } else {
        console.log ("Failed to update!");
        // Alert the user of error
        bootbox.alert({
          title: "Error",
          message: "There seems to be an error updating your information, please try again later!",
          callback: function() {
            console.log('Fetching data again...');
            fetchData(); // method called to fetch user information from indexedDB
          }
        });
      }
    });
  }
}

// Display Page Function (Load the page to the main content element using jQuery load method)
function displayPage(page) {
  $("#main_Content").load("./page-content/loading.html", function() {
    var pageURL = "./page-content/" + page + ".html";
    console.log(pageURL);
    setTimeout(function() {
      $("#main_Content").load(pageURL);
    }, 1000);
  });
}

// Display Error Notification (Display an error div with error message)
function displayError(id, message) {
  $(id).find("#alert_Description").html(message);
  $(id).removeClass('hide');
}

// Filter Routes Function (filters and hides bus route cards based on user input)
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

// Filter Stops Function (filters and hides bus stops cards based on user input)
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

// Alert Error Function (displays a customized error message)
function bootBoxError(errorMessage) {
  bootbox.alert({
    title: "Erorr!",
    message: errorMessage
  });
}
