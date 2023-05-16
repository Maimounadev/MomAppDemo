const modalButtons = document.querySelectorAll(".open");
console.log(modalButtons)
modalButtons.forEach((button) => {
  button.addEventListener("click", (e) => {
    console.log('clicked button')
    const buttonId = button.id;
    const container = document.querySelector("#popup-modal-container");
    container.removeAttribute("class");
    container.classList.add(buttonId);
    document.body.classList.add("modal-active");
  });
});

// logic for closing the modal
const modal = document.querySelector("#popup-modal-container");
modal.addEventListener("click", (e) => {
  const clickedOut =
    e.target == e.target.closest('div[class="modal-background"]');
  if (clickedOut) {
    modal.classList.add("out");
    document.body.classList.remove("modal-active");
  }
});

// #region google maps api
document.querySelector(".get").addEventListener("click", () => {
    console.log("getting map...");
    // set map options, we're gunna start the map in boston
  
    const coordinates = { lat: 42.361145, lng: -71.057083 };
    const mapOptions = {
      center: coordinates, // map will focus on this area
      zoom: 13, // level from 0 to 15, 0 is earth
      mapTypeId: google.maps.MapTypeId.ROADMAP, // signifies if you are driving or walking or biking.
    };
  
    // creating our map
    const map = new google.maps.Map( // taking all options from above code and feeding it to google maps constructer (similar to Number in JS or newDate)
      document.getElementById("googleMap"),// constructor of google map API, needs a element to show map in
      mapOptions
    );
  
    // getting directions
    var directionsService = new google.maps.DirectionsService();// another constrctor, generating the direction services
  
    //create a DirectionsRenderer object which we will use to display the directions
    var directionsDisplay = new google.maps.DirectionsRenderer();// direction display is what renders the direction in html
  
    //attach the DirectionsRenderer to the map
    directionsDisplay.setMap(map);// setting the map
  
    getRoute(directionsDisplay, directionsService, map, coordinates);// passing in the service workers to the Get route function
  });
  
  function getRoute(directionsDisplay, directionsService, map, coordinates) {
    const from = document.getElementById("from").value;
    const to = document.getElementById("to").value;
  
    // make a request in the format google api needs
    const request = { // request object that google Api eats
      origin: from,
      destination: to,
      travelMode: google.maps.TravelMode.DRIVING,
      unitSystem: google.maps.UnitSystem.IMPERIAL,// metric system
    };
  
    // send the request to google api's route method
    directionsService.route(request, (result, status) => {
      if (status == google.maps.DirectionsStatus.OK) {
        // if everythings good, then get the distance and time it'll take to get there
        console.log(result, "result");
        const distanceInMiles = result.routes[0].legs[0].distance.text;
        const steps = result.routes[0].legs[0].steps;
        const ul = document.querySelector("#steps");
        for (let i = 0; i < steps.length; i++) {
          let instruction = document.createElement("li");
          instruction.innerHTML = steps[i].instructions;
          ul.appendChild(instruction);
        }
  
        const output = document.querySelector("#output");
        output.innerText = `It'll take you ${distanceInMiles} to get from ${from} to ${to}.`;
  
        //display route
        directionsDisplay.setDirections(result);
      } else {
        //delete route from map
  
        directionsDisplay.setDirections({ routes: [] });
  
        //recenter map in Boston
        map.setCenter(coordinates);
  
        //show error message
        output.innerText = "Could not retrieve driving distance.";
      }
    });
    console.log(request, "what we send to the api");
  }
  
  // autocomplete all inputs
  const input1Array = document.querySelectorAll("#from");
  input1Array.forEach((input)=> {
    new google.maps.places.Autocomplete(input)
  })
  
  const input2Array = document.querySelectorAll("#to");
  input2Array.forEach((input)=> {
    new google.maps.places.Autocomplete(input)
  })
  // #endregion
  