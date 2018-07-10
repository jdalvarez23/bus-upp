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
  db.on('ready', function() { // Execute when indexedDB is on "ready" state
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

// Display Page Function (Load the page to the main content element using jQuery load method)
function displayPage(page) {
  $("#main_Content").load("./page-content/loading.html", function() {
    var pageURL = "./page-content/" + page + ".html";
    console.log(pageURL);
    setTimeout(function() {
      $("#main_Content").load(pageURL);
    }, 2000);
  });
}
