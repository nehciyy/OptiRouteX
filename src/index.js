import fs from "browserify-fs";
// Static import of the JSON file
import locations from "../models/locations.json" assert { type: "json" };
import { initializeMap, getMap } from "./mapSingleton.js";
import {
  addDistanceMeasurementTool,
  routeCal,
  multiRouteCal,
  draggableDirections,
} from "./distanceMeasure.js";
import { updateTrafficLayer } from "./traffic.js";
import { reverseGeocode, autoSuggestion } from "./location.js";
import { saveAsJSON, loadFromJSON } from "./generationJSON.js";

// Initialize the map
initializeMap();

const { mapInstance: map, uiInstance: ui } = getMap();
// Add the distance measurement tool to the UI
addDistanceMeasurementTool(ui);

// Call reverseGeocode with dynamic parameters

//reverseGeocode(ui, coordinates);
//autoSuggestion(ui, "Merlion", coordinates);

//routeCal(origin, destination);

// Extract origin, destination, and waypoints from the loaded data
const origin = locations.origin;
const destination = locations.destination;
const waypoints = Object.values(locations.waypoints); // Convert waypoints object to an array

// Log loaded coordinates for verification
console.log("Loaded coordinates from file:", {
  origin,
  destination,
  waypoints,
});

// Pass the loaded data to the multiRouteCal function
multiRouteCal(waypoints, origin, destination);

// export { router, geocoder };

//draggableDirections(origin, destination);
//updateTrafficLayer();
