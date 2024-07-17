// import { H } from "@here/maps-api-for-javascript";
import { center, hereCredentials } from "./config.js";
import { addDistanceMeasurementTool, routeCal } from "./distanceMeasure.js";
import { reverseGeocode, autoSuggestion } from "./location.js";
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
const behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(map));
const provider = map.getBaseLayer().getProvider();

// //Initialize router and geocoder
// const router = platform.getRoutingService();
//const geocoder = platform.getGeocodingService();

window.addEventListener("resize", () => map.getViewPort().resize());
// Create the default UI:
const ui = H.ui.UI.createDefault(map, defaultLayers, `en-US`);
// Add the distance measurement tool to the UI
addDistanceMeasurementTool(ui);

// Call reverseGeocode with dynamic parameters
const coordinates = "1.28668,103.853607,150"; // Replace with your desired coordinates
//reverseGeocode(ui, coordinates);
//autoSuggestion(ui, "Merlion", coordinates);

const origin = { lat: 1.301114, lng: 103.838872 };
const destination = { lat: 1.28437, lng: 103.8599 };

routeCal(map, origin, destination);
// export { router, geocoder };
