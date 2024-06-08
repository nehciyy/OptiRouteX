var bundle = (function (exports) {
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

  //Initialize router and geocoder
  const router = platform.getRoutingService();
  const geocoder = platform.getGeocodingService();

  window.addEventListener("resize", () => map.getViewPort().resize());

  exports.geocoder = geocoder;
  exports.router = router;

  return exports;

})({});
