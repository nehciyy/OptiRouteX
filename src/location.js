import { hereCredentials } from "./config.js";
// Instantiate a map and platform object:
const platform = new H.service.Platform({ apiKey: hereCredentials.apikey });

// Get an instance of the search service:
var service = platform.getSearchService();

// Call the reverse geocode method with the geocoding parameters,
// the callback and an error callback function (called if a
// communication error occurs):
export function reverseGeocode(ui, coordinates) {
  service.reverseGeocode(
    {
      at: coordinates,
    },
    (result) => {
      result.items.forEach((item) => {
        // Assumption: ui is instantiated
        // Create an InfoBubble at the returned location with
        // the address as its contents:
        ui.addBubble(
          new H.ui.InfoBubble(item.position, {
            content: item.address.label,
          })
        );
      });
    },
    alert
  );
}
