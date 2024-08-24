import { initializeMap, getMap } from "./mapSingleton.js";
import {
  addDistanceMeasurementTool,
  multiRouteCal,
} from "./distanceMeasure.js";

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
