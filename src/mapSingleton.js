import { hereCredentials } from "./config.js";

let mapInstance = null;
let platformInstance = null;
let behaviorInstance = null;
let uiInstance = null;

export function initializeMap() {
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
        center: { lat: 1.301114, lng: 103.838872 },
        pixelRatio: window.devicePixelRatio || 1,
      }
    );

    const mapEvents = new H.mapevents.MapEvents(mapInstance);
    behaviorInstance = new H.mapevents.Behavior(mapEvents);
    behaviorInstance.disable(H.mapevents.Behavior.Feature.DBL_TAP_ZOOM);

    uiInstance = H.ui.UI.createDefault(mapInstance, defaultLayers, "en-US");

    // Add traffic and incident layers
    mapInstance.addLayer(defaultLayers.vector.traffic);
    mapInstance.addLayer(defaultLayers.vector.trafficincidents);

    window.addEventListener("resize", () => mapInstance.getViewPort().resize());
  }
  return { mapInstance, platformInstance, behaviorInstance, uiInstance };
}

export function getMap() {
  if (!mapInstance) {
    throw new Error(
      "Map has not been initialized. Call initializeMap() first."
    );
  }
  return { mapInstance, platformInstance, behaviorInstance, uiInstance };
}
