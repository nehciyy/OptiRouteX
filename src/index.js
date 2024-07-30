// import { H } from "@here/maps-api-for-javascript";
import { initializeMap, getMap } from "./mapSingleton.js";
import {
  addDistanceMeasurementTool,
  routeCal,
  multiRouteCal,
  draggableDirections,
} from "./distanceMeasure.js";
import { updateTrafficLayer } from "./traffic.js";
import { reverseGeocode, autoSuggestion } from "./location.js";

// Initialize the map
initializeMap();

const { mapInstance: map, uiInstance: ui } = getMap();
// Add the distance measurement tool to the UI
addDistanceMeasurementTool(ui);

// Call reverseGeocode with dynamic parameters
const coordinates = "1.28668,103.853607,150"; // Replace with your desired coordinates
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
//multiRouteCal(map, waypoints, origin, destination);
// export { router, geocoder };

draggableDirections(origin, destination);
updateTrafficLayer();
