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
  // const geocoder = platform.getGeocodingService();

  window.addEventListener("resize", () => map.getViewPort().resize());
  // Create the default UI:
  const ui = H.ui.UI.createDefault(map, defaultLayers, `en-US`);
  // Add the distance measurement tool to the UI
  addDistanceMeasurementTool(ui);
  // export { router, geocoder };

})();
