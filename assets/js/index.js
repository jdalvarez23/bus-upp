// Variables
var db = ""; // initialize database variable
var databasePopulated = false; // initalize boolean variable
var userInformation; // initialize user information variable

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
          $('#first_Name_Display').text(user.name); // set text to user name
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

// Example starter JavaScript for disabling form submissions if there are invalid fields
(function() {
  'use strict';
  window.addEventListener('load', function() {
    // Fetch all the forms we want to apply custom Bootstrap validation styles to
    var forms = document.getElementsByClassName('needs-validation');
    // Loop over them and prevent submission
    var validation = Array.prototype.filter.call(forms, function(form) {
      form.addEventListener('submit', function(event) {
        if (form.checkValidity() === false) {
          event.preventDefault();
          event.stopPropagation();
        }
          console.log("Valid...");
          form.classList.add('was-validated');
          submitForm(); // method called to submit form
      }, false);
    });
  }, false);
})();

// Execute when register form has been validated
function submitForm() {
  // Initialization phase
  var submittedData = $('#register_Form').serializeArray(); // initialize serialized array of form data variable
  var dataObjects = {}; // initialize data object variable
  var attempt; // initialize attempt variable
  dataObjects.registered = "true"; // set registered value in object to true

  // Processing phase
  for (var i = 0; i < submittedData.length; i++) {
    dataObjects[field.name] = field.value; // set object key values
  }

  // Execute if location meets regular expression syntax
  if (/[\w ]+, \w{2}/.test(dataObjects['location'])) {
    console.log('Valid location input');
  // Execute if location does not meet regular expression syntax
  } else {
    // Display error notification
    displayError("#sign_Up_Page_Alert", 'Invalid location inserted. Please insert your location in the following format: City, State. For example: "Chicago, IL"');
  }

  dataObjects.savedStops = ''; // initialize saved stops value in data object

  console.log(dataObjects);

  // Execute if attempt is first time
  if ($('#getStarted_Header').text() == "Let's get started!") {
    attempt = "firstTime"; // set value to first time
  // Execute if attempt is data update
  } else if ($('#getStarted_Header').text() == "Edit your information") {
    attempt = "update"; // set value to update
  }

  // Execute if no error is present
    writeData(attempt, dataObjects); // method called to write user information to indexedDB
};
