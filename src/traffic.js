import { hereCredentials } from "./config";

const platform = new H.service.Platform({ apiKey: hereCredentials.apikey });
// Obtain the default map types from the platform object
const defaultLayers = platform.createDefaultLayers();

// Function to update traffic layer
export function updateTrafficLayer() {
  // Get the provider instance from the layer
  const provider = defaultLayers.vector.traffic.map.getProvider();
  // Invalidate provider's data and force reload
  provider.reload(true);
}

// Refresh traffic layer every 1 minute (60 seconds)
const refreshInterval = 60 * 1000; // 60 seconds in milliseconds
setInterval(updateTrafficLayer, refreshInterval);
