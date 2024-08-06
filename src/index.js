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
import fs from "browserify-fs";
import { saveAsJSON, loadFromJSON } from "./generationJSON.js";

// Initialize the map
initializeMap();

const { mapInstance: map, uiInstance: ui } = getMap();
// Add the distance measurement tool to the UI
addDistanceMeasurementTool(ui);

// Call reverseGeocode with dynamic parameters
const coordinates = "1.28668,103.853607,150"; // Replace with your desired coordinates
//reverseGeocode(ui, coordinates);
//autoSuggestion(ui, "Merlion", coordinates);

//routeCal(origin, destination);

//const fs = require("fs");
//latitude and longitude  taken from https://www.findlatitudeandlongitude.com/
const origin = { lat: 1.292982, lng: 103.857003 }; // Suntec City
const destination = { lat: 1.300639, lng: 103.854837 }; // Bugis Junction

const waypoints = [
  { lat: 1.28668, lng: 103.853607 }, // Merlion
  { lat: 1.301114, lng: 103.838872 }, // 313 Somerset
  { lat: 1.28437, lng: 103.8599 }, // Marina Bay Sands
  { lat: 1.281517, lng: 103.865774 }, // Gardens by the Bay
  { lat: 1.289299, lng: 103.863137 }, // Singapore Flyer
];

// Create an empty object to hold the locations
const locations = {};

// Use a loop to dynamically add waypoints to the locations object
waypoints.forEach((waypoint, index) => {
  // Create a key based on the index (e.g., "A", "B", "C", ...)
  const key = String.fromCharCode(65 + index); // 65 is the ASCII code for "A"
  locations[key] = waypoint;
});

console.log(locations);

// Save locations to a JSON file
saveAsJSON(locations, "locations");

// Calculate routes and save distances to a JSON file
multiRouteCal(waypoints, origin, destination);

// export { router, geocoder };

//draggableDirections(origin, destination);
//updateTrafficLayer();
