// import { H } from "@here/maps-api-for-javascript";
import { center, hereCredentials } from "./config.js";

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

//Initialize router and geocoder
const router = platform.getRoutingService();
const geocoder = platform.getGeocodingService();

window.addEventListener("resize", () => map.getViewPort().resize());

export { router, geocoder };
