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

  async function getRealTimeTrafficData(lat, lng) {
    try {
      const response = await fetch(
        `http://localhost:5000/proxy-traffic?lat=${lat}&lng=${lng}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log("Traffic Data:", data); // Log the traffic data to verify it
      return data;
    } catch (error) {
      console.error("Failed to fetch traffic data:", error);
    }
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

  // Initialize the map
  initializeMap();

  const { mapInstance: map, uiInstance: ui } = getMap();
  // Add the distance measurement tool to the UI
  addDistanceMeasurementTool(ui);

  // // Periodically check for new route data from Flask
  // setInterval(() => {
  //   // Ensure task_id is correctly retrieved from URL
  //   const task_id = new URLSearchParams(window.location.search).get("task_id");
  //   if (!task_id) {
  //     console.error("Task ID is missing");
  //     return; // Avoid making any API requests if task_id is missing
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
  //               // Send the calculated data back to Flask
  //               return fetch(`http://localhost:5000/receive-data/${task_id}`, {
  //                 method: "POST",
  //                 headers: {
  //                   "Content-Type": "application/json",
  //                 },
  //                 body: JSON.stringify({
  //                   total_distance: result.totalDistance,
  //                   segment_distances: result.segmentDistances,
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

  getRealTimeTrafficData(1.28668, 103.853607);

})();
