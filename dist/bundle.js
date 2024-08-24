(function () {
  'use strict';

  const hereCredentials = {
    id: "HERE-580478a9-edc0-4a38-8842-1393f0e46820",
    code: "BYa7o5f155QWUHkSmjWA",
    apikey: "G1OcoyO4L7xsmvpkua0a1KxPS4FvaqgwBpG_2cyXlXc",
    TRAFFIC_API_URL: "https://traffic.ls.hereapi.com/traffic/7.16/flow.json",
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

      // Add traffic layer
      mapInstance.addLayer(defaultLayers.vector.traffic.map);
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
    console.log(waypoints, origin, destination);
    //return new Promise((resolve, reject) => {
    const { mapInstance: map, platformInstance: platform } = getMap();
    const waypointMarkers = [];

    const routingParameters = {
      routingMode: "fast",
      transportMode: "pedestrian",
      origin: `${origin.lat},${origin.lng}`,
      destination: `${destination.lat},${destination.lng}`,
      return: "polyline",
      via: new H.service.Url.MultiValueQueryParameter(
        waypoints.map((wp) => `${wp.lat},${wp.lng}`)
      ),
    };

    function createMarkerIcon(color, number) {
      return new H.map.Icon(
        `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30">
                  <circle cx="15" cy="15" r="10" fill="${color}" stroke="white" stroke-width="2"/>
                  <text x="15" y="20" font-size="12" font-family="Arial" fill="white" text-anchor="middle">${number}</text>
              </svg>`
      );
    }

    const originIcon = createMarkerIcon("blue", "Start");
    const destinationIcon = createMarkerIcon("red", "End");

    const onResult = function (result) {
      if (!result.routes.length) {
        console.error("No routes found");
        reject("No routes found");
        return;
      }

      waypoints.forEach((waypoint, index) => {
        const waypointMarker = new H.map.Marker(
          { lat: waypoint.lat, lng: waypoint.lng },
          { icon: createMarkerIcon("gray", index + 1) }
        );
        waypointMarkers.push(waypointMarker);
      });

      const originMarker = new H.map.Marker(origin, { icon: originIcon });
      const destinationMarker = new H.map.Marker(destination, {
        icon: destinationIcon,
      });
      waypointMarkers.push(originMarker, destinationMarker);

      const lineStrings = [];
      let totalDistance = 0;
      const segmentDistances = [];

      result.routes[0].sections.forEach((section, index) => {
        const lineString = H.geo.LineString.fromFlexiblePolyline(
          section.polyline
        );
        lineStrings.push(lineString);

        // Calculate the distance along the polyline
        let segmentDistance = 0;
        let previousPoint = null;

        lineString.eachLatLngAlt((lat, lng, alt, idx) => {
          const currentPoint = new H.geo.Point(lat, lng);
          if (previousPoint) {
            const distance = previousPoint.distance(currentPoint);
            totalDistance += distance;
            segmentDistance += distance;
          }
          previousPoint = currentPoint;
        });

        segmentDistances.push(segmentDistance);

        // Count red traffic conditions
        // if (section.traffic && section.traffic.jamFactor > 7) {
        //   redTrafficCount += 1; // Increment the red traffic counter
        //   console.log(
        //     "Red traffic detected:",
        //     section.traffic,
        //     section.traffic.jamFactor
        //   );
        // }
      });

      const data = {
        totalDistance: totalDistance,
        segmentDistances: segmentDistances,
        //redTrafficCount: redTrafficCount, // Return the number of red traffic conditions detected
      };

      console.log(data);

      const routeLine = new H.map.Polyline(
        new H.geo.MultiLineString(lineStrings),
        {
          style: {
            strokeColor: "blue",
            lineWidth: 3,
          },
        }
      );

      const group = new H.map.Group();
      group.addObjects([routeLine, ...waypointMarkers]);

      if (typeof map !== "undefined" && map instanceof H.Map) {
        map.addObject(group);
      } else {
        console.error("Map object is not defined or not an instance of H.Map");
      }

      resolve(data);
    };

    const router = platform.getRoutingService(null, 8);
    router.calculateRoute(routingParameters, onResult, function (error) {
      console.error(error.message);
      reject(error.message);
    });
  }

  // Initialize the map
  initializeMap();

  const { mapInstance: map, uiInstance: ui } = getMap();
  // Add the distance measurement tool to the UI
  addDistanceMeasurementTool(ui);

  // let origin = {
  //   lat: 1.292982,
  //   lng: 103.857003,
  // };
  // let destination = {
  //   lat: 1.300639,
  //   lng: 103.854837,
  // };
  // let waypoints = [
  //   {
  //     lat: 1.28668,
  //     lng: 103.853607,
  //   },
  //   {
  //     lat: 1.301114,
  //     lng: 103.838872,
  //   },
  //   {
  //     lat: 1.28437,
  //     lng: 103.8599,
  //   },
  //   {
  //     lat: 1.281517,
  //     lng: 103.865774,
  //   },
  //   {
  //     lat: 1.289299,
  //     lng: 103.863137,
  //   },
  // ];
  const origin = { lat: 1.292982, lng: 103.857003 };
  const destination = { lat: 1.300639, lng: 103.854837 };
  const waypoints = [
    { lat: 1.28668, lng: 103.853607 }, // Merlion
    { lat: 1.301114, lng: 103.838872 }, // 313 Somerset
    { lat: 1.28437, lng: 103.8599 }, // Marina Bay Sands
    { lat: 1.281517, lng: 103.865774 }, // Gardens by the Bay
    { lat: 1.289299, lng: 103.863137 }, // Singapore Flyer
  ];

  multiRouteCal(waypoints, origin, destination);
  // Periodically check for new route data from Flask
  // setInterval(() => {
  //   const task_id = new URLSearchParams(window.location.search).get("task_id");
  //   if (!task_id) {
  //     console.error("Task ID is missing");
  //     return;
  //   }

  //   fetch(`http://localhost:5000/get-route-data?task_id=${task_id}`)
  //     .then((response) => response.json())
  //     .then((data) => {
  //       if (data.status !== "no_data") {
  //         const { origin, waypoints, destination } = data;
  //         console.log("Received route data from Flask:", data);

  //         // Validate that origin, waypoints, and destination are defined
  //         if (origin && waypoints && destination) {
  //           // Calculate the route using multiRouteCal
  //           multiRouteCal(waypoints, origin, destination, task_id)
  //             .then((result) => {
  //               return fetch(`http://localhost:5000/receive-data/${task_id}`, {
  //                 method: "POST",
  //                 headers: {
  //                   "Content-Type": "application/json",
  //                 },
  //                 body: JSON.stringify({
  //                   total_distance: result.totalDistance,
  //                   segment_distances: result.segmentDistances,
  //                   //red_traffic_count: result.redTrafficCount,
  //                 }),
  //               });
  //             })
  //             .then((response) => response.json())
  //             .then((data) => {
  //               console.log("Data successfully sent to Flask:", data);
  //             })
  //             .catch((error) => {
  //               console.error("Error sending data to Flask:", error);
  //             });
  //         } else {
  //           console.error("Origin, waypoints, or destination is missing");
  //         }
  //       } else {
  //         console.error("No data available for the provided task_id");
  //       }
  //     })
  //     .catch((error) =>
  //       console.error("Error fetching route data from Flask:", error)
  //     );
  // }, 1000);

})();
