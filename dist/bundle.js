(function () {
  'use strict';

  const hereCredentials = {
    id: "HERE-580478a9-edc0-4a38-8842-1393f0e46820",
    code: "BYa7o5f155QWUHkSmjWA",
    apikey: "G1OcoyO4L7xsmvpkua0a1KxPS4FvaqgwBpG_2cyXlXc",
  };

  let mapInstance = null;
  let platformInstance = null;
  let behaviorInstance = null;
  let uiInstance = null;

  function initializeMap() {
    if (!mapInstance) {
      platformInstance = new H.service.Platform({
        apiKey: hereCredentials.apikey,
      });
      const defaultLayers = platformInstance.createDefaultLayers();

      mapInstance = new H.Map(
        document.getElementById("map"),
        defaultLayers.vector.normal.map,
        {
          zoom: 12,
          center: { lat: 1.301114, lng: 103.838872 }, // Default center
          pixelRatio: window.devicePixelRatio || 1,
        }
      );

      // Enable the event system on the map instance:
      const mapEvents = new H.mapevents.MapEvents(mapInstance);
      behaviorInstance = new H.mapevents.Behavior(mapEvents);
      behaviorInstance.disable(H.mapevents.Behavior.Feature.DBL_TAP_ZOOM);

      // Create the default UI:
      uiInstance = H.ui.UI.createDefault(mapInstance, defaultLayers, "en-US");

      window.addEventListener("resize", () => mapInstance.getViewPort().resize());
    }
    return { mapInstance, platformInstance, behaviorInstance, uiInstance };
  }

  function getMap() {
    if (!mapInstance) {
      throw new Error(
        "Map has not been initialized. Call initializeMap() first."
      );
    }
    return { mapInstance, platformInstance, behaviorInstance, uiInstance };
  }

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

  function multiRouteCal(waypoints, origin, destination) {
    const { mapInstance: map, platformInstance: platform } = getMap();
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

    // Function to create a custom marker icon with a number
    function createMarkerIcon(color, number) {
      return new H.map.Icon(
        `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30">
        <circle cx="15" cy="15" r="10" fill="${color}" stroke="white" stroke-width="2"/>
        <text x="15" y="20" font-size="12" font-family="Arial" fill="white" text-anchor="middle">${number}</text>
      </svg>`
      );
    }

    // Create icons for origin and destination with numbers
    const originIcon = createMarkerIcon("blue", "Start");
    const destinationIcon = createMarkerIcon("red", "End");

    // Callback function to process the routing response
    const onResult = function (result) {
      // Check if a route was found
      if (!result.routes.length) {
        console.error("No routes found");
        return;
      }

      // Create waypoint markers with numbers
      waypoints.forEach((waypoint, index) => {
        const waypointMarker = new H.map.Marker(
          { lat: waypoint.lat, lng: waypoint.lng },
          { icon: createMarkerIcon("gray", index + 1) }
        );
        waypointMarkers.push(waypointMarker);
      });

      // Add markers for origin and destination with custom icons
      const originMarker = new H.map.Marker(origin, { icon: originIcon });
      const destinationMarker = new H.map.Marker(destination, {
        icon: destinationIcon,
      });
      waypointMarkers.push(originMarker, destinationMarker);

      // Collect line strings for each section of the route
      const lineStrings = [];
      result.routes[0].sections.forEach((section) => {
        lineStrings.push(H.geo.LineString.fromFlexiblePolyline(section.polyline));
      });

      // Create multi-line string from the line strings
      const multiLineString = new H.geo.MultiLineString(lineStrings);

      // Calculate the distance along the polyline
      let totalDistance = 0;
      const segmentDistances = [];

      lineStrings.forEach((lineString, segmentIndex) => {
        let previousPoint = null;
        let segmentDistance = 0;
        lineString.eachLatLngAlt((lat, lng, alt, index) => {
          const currentPoint = new H.geo.Point(lat, lng);
          if (previousPoint) {
            const distance = previousPoint.distance(currentPoint);
            totalDistance += distance;
            segmentDistance += distance;
          }
          previousPoint = currentPoint;
        });
        segmentDistances.push(segmentDistance);
      });

      // Log the total distance
      console.log(`Total travel distance: ${totalDistance} meters`);

      // Log distances between each stopping point
      segmentDistances.forEach((distance, index) => {
        console.log(`Distance from segment ${index + 1}: ${distance} meters`);
      });

      // Create a polyline to display the route
      const routeLine = new H.map.Polyline(multiLineString, {
        style: {
          strokeColor: "blue",
          lineWidth: 3,
        },
      });

      // Create a group that holds the route and waypoint markers
      const group = new H.map.Group();
      group.addObjects([routeLine, ...waypointMarkers]);

      // Add the group to the map if the map object is defined and valid
      if (typeof map !== "undefined" && map instanceof H.Map) {
        map.addObject(group);
      } else {
        console.error("Map object is not defined or not an instance of H.Map");
      }
    };

    // Get an instance of the routing service version 8
    const router = platform.getRoutingService(null, 8);

    // Call the calculateRoute() method with the routing parameters,
    // the callback, and an error callback function
    router.calculateRoute(routingParameters, onResult, function (error) {
      console.error(error.message);
      alert(error.message);
    });
  }

  const platform$1 = new H.service.Platform({ apiKey: hereCredentials.apikey });
  // Obtain the default map types from the platform object
  const defaultLayers = platform$1.createDefaultLayers();

  // Function to update traffic layer
  function updateTrafficLayer() {
    // Get the provider instance from the layer
    const provider = defaultLayers.vector.traffic.map.getProvider();
    // Invalidate provider's data and force reload
    provider.reload(true);
  }

  // Refresh traffic layer every 1 minute (60 seconds)
  const refreshInterval = 60 * 1000; // 60 seconds in milliseconds
  setInterval(updateTrafficLayer, refreshInterval);

  // Instantiate a map and platform object:
  const platform = new H.service.Platform({ apiKey: hereCredentials.apikey });

  // Get an instance of the search service:
  platform.getSearchService();

  // import { H } from "@here/maps-api-for-javascript";

  // Initialize the map
  initializeMap();

  const { mapInstance: map, uiInstance: ui } = getMap();
  // Add the distance measurement tool to the UI
  addDistanceMeasurementTool(ui);
  //reverseGeocode(ui, coordinates);
  //autoSuggestion(ui, "Merlion", coordinates);

  const origin = { lat: 1.292982, lng: 103.857003 }; //Suntec City
  const destination = { lat: 1.300639, lng: 103.854837 }; // Bugis Junction

  //routeCal(origin, destination);

  const waypoints = [
    { lat: 1.28668, lng: 103.853607 }, //Merlion
    { lat: 1.301114, lng: 103.838872 }, //313 Somerset
    { lat: 1.28437, lng: 103.8599 }, //Marina Bay Sands
    { lat: 1.281517, lng: 103.865774 }, //Gardens by the Bay
    { lat: 1.289299, lng: 103.863137 }, //Singapore Flyer
  ];
  multiRouteCal(waypoints, origin, destination);
  // export { router, geocoder };

  //draggableDirections(origin, destination);
  //updateTrafficLayer();

})();
