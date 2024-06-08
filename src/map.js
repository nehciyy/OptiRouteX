// // @param  {H.Map} map

// function moveMapToSingapore(map) {
//   map.setCenter({ lat: 1.3521, lng: 103.8198 });
//   map.setZoom(14);
// }

// /**
//  * Boilerplate map initialization code starts below:
//  */

// //Step 1: initialize communication with the platform
// const platform = new H.service.Platform({
//   apikey: "G1OcoyO4L7xsmvpkua0a1KxPS4FvaqgwBpG_2cyXlXc",
// });
// var defaultLayers = platform.createDefaultLayers();

// //Step 2: initialize a map - this map is centered over Singapore
// var map = new H.Map(
//   document.getElementById("map"),
//   defaultLayers.vector.normal.map,
//   {
//     center: { lat: 1.3521, lng: 103.8198 },
//     zoom: 4,
//     pixelRatio: window.devicePixelRatio || 1,
//   }
// );
// // add a resize listener to make sure that the map occupies the whole container
// window.addEventListener("resize", () => map.getViewPort().resize());

// //Step 3: make the map interactive
// // MapEvents enables the event system
// // Behavior implements default interactions for pan/zoom (also on mobile touch environments)
// var behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(map));

// // Create the default UI components
// var ui = H.ui.UI.createDefault(map, defaultLayers);

// // Now use the map as required...
// window.onload = function () {
//   moveMapToSingpaore(map);
// };
