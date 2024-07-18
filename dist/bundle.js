(function () {
  'use strict';

  const center = {
    lat: 1.3521,
    lng: 103.8198,
    text: "Singapore",
  };

  const hereCredentials = {
    id: "HERE-580478a9-edc0-4a38-8842-1393f0e46820",
    code: "BYa7o5f155QWUHkSmjWA",
    apikey: "G1OcoyO4L7xsmvpkua0a1KxPS4FvaqgwBpG_2cyXlXc",
  };

  const platform$2 = new H.service.Platform({ apiKey: hereCredentials.apikey });

  // Create a template for marker icons by using custom SVG style
  function createMarkerIcon(color) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="32" viewBox="0 0 24 32">
      <path d="M12 0C6.48 0 2 4.48 2 10c0 5.057 3.333 14.5 10 22 6.667-7.5 10-16.943 10-22 0-5.52-4.48-10-10-10zm0 14c-1.657 0-3-1.343-3-3s1.343-3 3-3 3 1.343 3 3-1.343 3-3 3z" 
      fill="${color}" stroke="#FFFFFF"/>
    </svg>`;
  }

  // Define the colors for the icons
  const startColor = "#00008B";
  const stopoverColor = "#8AC9C9";
  const splitColor = "#A2EDE7";
  const endColor = "#990000";

  // Create the icons with respective colors
  const startIcon = new H.map.Icon(createMarkerIcon(startColor));
  const stopoverIcon = new H.map.Icon(createMarkerIcon(stopoverColor));
  const endIcon = new H.map.Icon(createMarkerIcon(endColor));
  const splitIcon = new H.map.Icon(createMarkerIcon(splitColor));

  // Create the DistanceMeasurement control
  const distanceMeasurementTool = new H.ui.DistanceMeasurement({
    startIcon: startIcon,
    stopoverIcon: stopoverIcon,
    endIcon: endIcon,
    splitIcon: splitIcon,
    lineStyle: {
      strokeColor: "rgba(95, 229, 218, 0.5)",
      lineWidth: 6,
    },
    alignment: H.ui.LayoutAlignment.LEFT_BOTTOM,
  });

  // Export the distance measurement tool setup function
  function addDistanceMeasurementTool(ui) {
    ui.addControl("distancemeasurement", distanceMeasurementTool);
    ui.setUnitSystem(H.ui.UnitSystem.METRIC);
  }

  function multiRouteCal(map, waypoints, origin, destination) {
    const waypointMarkers = [];

    // Define the routing parameters
    const routingParameters = {
      routingMode: "fast",
      transportMode: "pedestrian",
      origin: `${origin.lat},${origin.lng}`,
      destination: `${destination.lat},${destination.lng}`,
      return: "polyline",
      // Add a via parameter to the query for each coordinate pair:
      via: new H.service.Url.MultiValueQueryParameter(
        waypoints.map((wp) => `${wp.lat},${wp.lng}`)
      ),
    };
    //Callback function to process the routing response
    const onResult = function (result) {
      //Check if a route was found
      if (!result.routes.length) {
        console.error("No routes found");
        return;
      }

      // Create waypoint markers:
      waypoints.forEach((waypoint) => {
        const waypointMarker = new H.map.Marker({
          lat: waypoint.lat,
          lng: waypoint.lng,
        });
        waypointMarkers.push(waypointMarker);
      });

      // Collect line strings for each section of the route
      const lineStrings = [];
      result.routes[0].sections.forEach((section) => {
        lineStrings.push(H.geo.LineString.fromFlexiblePolyline(section.polyline));
      });

      //Create multi-line string from the line strings
      const multiLineString = new H.geo.MultiLineString(lineStrings);

      //Create a polyline to display the route
      const routeLine = new H.map.Polyline(multiLineString, {
        style: {
          strokeColor: "blue",
          lineWidth: 3,
        },
      });

      //Create markers for the start and end points
      const startMarker = new H.map.Marker(origin);
      const endMarker = new H.map.Marker(destination);

      //Create a group that holds the route and waypoint markers
      const group = new H.map.Group();
      group.addObjects([routeLine, startMarker, endMarker, ...waypointMarkers]);

      //Add the group to the map if the map object is defined and valid
      if (typeof map !== "undefined" && map instanceof H.Map) {
        map.addObject(group);
      } else {
        console.error("Map object is not defined or not an instance of H.Map");
      }
    };

    //Get an instance of the routing service version 8
    const router = platform$2.getRoutingService(null, 8);

    //Call the calculateRoute() method with the routing parameters,
    // the callback, and an error callback function
    router.calculateRoute(routingParameters, onResult, function (error) {
      console.error(error.message);
      alert(error.message);
    });
  }

  // Instantiate a map and platform object:
  const platform$1 = new H.service.Platform({ apiKey: hereCredentials.apikey });

  // Get an instance of the search service:
  platform$1.getSearchService();

  // import { H } from "@here/maps-api-for-javascript";
  // Initialize the platform object:
  const platform = new H.service.Platform({ apiKey: hereCredentials.apikey });

  // Obtain the default map types from the platform object
  const defaultLayers = platform.createDefaultLayers();

  // Instantiate (and display) a map object:
  const map = new H.Map(
    document.getElementById("map"),
    defaultLayers.vector.normal.map,
    {
      zoom: 12,
      center: center,
      pixelRatio: window.devicePixelRatio || 1,
    }
  );
  // MapEvents enables the event system.
  // The behavior variable implements default interactions for pan/zoom (also on mobile touch environments).
  new H.mapevents.Behavior(new H.mapevents.MapEvents(map));
  map.getBaseLayer().getProvider();

  // //Initialize router and geocoder
  // const router = platform.getRoutingService();
  //const geocoder = platform.getGeocodingService();

  window.addEventListener("resize", () => map.getViewPort().resize());
  // Create the default UI:
  const ui = H.ui.UI.createDefault(map, defaultLayers, `en-US`);
  // Add the distance measurement tool to the UI
  addDistanceMeasurementTool(ui);
  //reverseGeocode(ui, coordinates);
  //autoSuggestion(ui, "Merlion", coordinates);

  const origin = { lat: 1.301114, lng: 103.838872 };
  const destination = { lat: 1.28437, lng: 103.8599 };

  //routeCal(map, origin, destination);

  const waypoints = [
    { lat: 1.28668, lng: 103.853607 }, //Merlion
    { lat: 1.301114, lng: 103.838872 }, //313 Somerset
    { lat: 1.28437, lng: 103.8599 }, //Marina Bay Sands
    { lat: 1.281517, lng: 103.865774 }, //Gardens by the Bay
    { lat: 1.289299, lng: 103.863137 }, //Singapore Flyer
  ];
  multiRouteCal(map, waypoints, origin, destination);
  // export { router, geocoder };

})();
