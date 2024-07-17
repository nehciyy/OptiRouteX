import { hereCredentials } from "./config";

const platform = new H.service.Platform({ apiKey: hereCredentials.apikey });

// Create a template for marker icons by using custom SVG style
function createMarkerIcon(color) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="32" viewBox="0 0 24 32">
      <path d="M12 0C6.48 0 2 4.48 2 10c0 5.057 3.333 14.5 10 22 6.667-7.5 10-16.943 10-22 0-5.52-4.48-10-10-10zm0 14c-1.657 0-3-1.343-3-3s1.343-3 3-3 3 1.343 3 3-1.343 3-3 3z" 
      fill="${color}" stroke="#FFFFFF"/>
    </svg>`;
}

// Define the colors for the icons
const startColor = "#00008B";
const stopoverColor = "#8AC9C9";
const splitColor = "#A2EDE7";
const endColor = "#990000";

// Create the icons with respective colors
const startIcon = new H.map.Icon(createMarkerIcon(startColor));
const stopoverIcon = new H.map.Icon(createMarkerIcon(stopoverColor));
const endIcon = new H.map.Icon(createMarkerIcon(endColor));
const splitIcon = new H.map.Icon(createMarkerIcon(splitColor));

// Create the DistanceMeasurement control
const distanceMeasurementTool = new H.ui.DistanceMeasurement({
  startIcon: startIcon,
  stopoverIcon: stopoverIcon,
  endIcon: endIcon,
  splitIcon: splitIcon,
  lineStyle: {
    strokeColor: "rgba(95, 229, 218, 0.5)",
    lineWidth: 6,
  },
  alignment: H.ui.LayoutAlignment.LEFT_BOTTOM,
});

// Export the distance measurement tool setup function
export function addDistanceMeasurementTool(ui) {
  ui.addControl("distancemeasurement", distanceMeasurementTool);
  ui.setUnitSystem(H.ui.UnitSystem.METRIC);
}

export function routeCal(map, origin, destination) {
  // Create the parameters for the routing request:
  const routingParameters = {
    routingMode: "fast",
    transportMode: "car",
    // The start point of the route:
    origin: `${origin.lat},${origin.lng}`,
    // The end point of the route:
    destination: `${destination.lat},${destination.lng}`,
    // Include the route shape in the response
    return: "polyline",
  };

  // Define a callback function to process the routing response:
  const onResult = function (result) {
    // Ensure that at least one route was found
    if (result.routes.length) {
      const lineStrings = [];
      result.routes[0].sections.forEach((section) => {
        // Create a linestring to use as a point source for the route line
        lineStrings.push(
          H.geo.LineString.fromFlexiblePolyline(section.polyline)
        );
      });

      // Create an instance of H.geo.MultiLineString
      const multiLineString = new H.geo.MultiLineString(lineStrings);

      // Create a polyline to display the route:
      const routeLine = new H.map.Polyline(multiLineString, {
        style: {
          strokeColor: "blue",
          lineWidth: 3,
        },
      });

      // Create a marker for the start point:
      const startMarker = new H.map.Marker(origin);
      // Create a marker for the end point:
      const endMarker = new H.map.Marker(destination);

      // Create a H.map.Group to hold all the map objects and enable us to obtain
      // the bounding box that contains all its objects within
      const group = new H.map.Group();
      group.addObjects([routeLine, startMarker, endMarker]);
      // Add the group to the map
      map.addObject(group);
    }
  };

  // Get an instance of the routing service version 8:
  const router = platform.getRoutingService(null, 8);

  // Call the calculateRoute() method with the routing parameters,
  // the callback, and an error callback function (called if a
  // communication error occurs):
  router.calculateRoute(routingParameters, onResult, function (error) {
    alert(error.message);
  });
}
