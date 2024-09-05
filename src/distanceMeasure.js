import { getMap } from "./mapSingleton.js";

// Create a template for marker icons by using custom SVG style (from the HERE Maps API documentation)
function createMarkerIcon(color) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="32" viewBox="0 0 24 32">
      <path d="M12 0C6.48 0 2 4.48 2 10c0 5.057 3.333 14.5 10 22 6.667-7.5 10-16.943 10-22 0-5.52-4.48-10-10-10zm0 14c-1.657 0-3-1.343-3-3s1.343-3 3-3 3 1.343 3 3-1.343 3-3 3z" 
      fill="${color}" stroke="#FFFFFF"/>
    </svg>`;
}

// Define the colors for the icons (from the HERE Maps API documentation)
const startColor = "#00008B";
const stopoverColor = "#8AC9C9";
const splitColor = "#A2EDE7";
const endColor = "#990000";

// Create the icons with respective colors
const startIcon = new H.map.Icon(createMarkerIcon(startColor));
const stopoverIcon = new H.map.Icon(createMarkerIcon(stopoverColor));
const endIcon = new H.map.Icon(createMarkerIcon(endColor));
const splitIcon = new H.map.Icon(createMarkerIcon(splitColor));

// Create the DistanceMeasurement control (from the HERE Maps API documentation)
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

// Export the distance measurement tool setup function (from the HERE Maps API documentation)
export function addDistanceMeasurementTool(ui) {
  ui.addControl("distancemeasurement", distanceMeasurementTool);
  ui.setUnitSystem(H.ui.UnitSystem.METRIC);
}

// Export the function to calculate the distance between pairs of points (from the HERE Maps API documentation and modified calculation of the distance)
export function multiRouteCal(waypoints, origin, destination, task_id) {
  return new Promise((resolve, reject) => {
    const { mapInstance: map, platformInstance: platform } = getMap();
    const waypointMarkers = [];

    const routingParameters = {
      routingMode: "fast",
      transportMode: "car", // by car OR pedestrian
      origin: `${origin.lat},${origin.lng}`,
      destination: `${destination.lat},${destination.lng}`,
      return: "polyline,summary",
      via: new H.service.Url.MultiValueQueryParameter(
        waypoints.map((wp) => `${wp.lat},${wp.lng}`)
      ),
    };

    function createMarkerIcon(color, number) {
      return new H.map.Icon(
        `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30">
                  <circle cx="15" cy="15" r="10" fill="${color}" stroke="white" stroke-width="2"/>
                  <text x="15" y="20" font-size="12" font-family="Arial" fill="white" text-anchor="middle">${number}</text>
              </svg>`
      );
    }

    const originIcon = createMarkerIcon("blue", "Start");
    const destinationIcon = createMarkerIcon("red", "End");

    const onResult = function (result) {
      if (!result.routes.length) {
        console.error("No routes found");
        reject("No routes found");
        return;
      }

      waypoints.forEach((waypoint, index) => {
        const waypointMarker = new H.map.Marker(
          { lat: waypoint.lat, lng: waypoint.lng },
          { icon: createMarkerIcon("gray", index + 1) }
        );
        waypointMarkers.push(waypointMarker);
      });

      const originMarker = new H.map.Marker(origin, { icon: originIcon });
      const destinationMarker = new H.map.Marker(destination, {
        icon: destinationIcon,
      });
      waypointMarkers.push(originMarker, destinationMarker);

      // All codes below are codes done by me
      const lineStrings = [];
      let totalDistance = 0;
      const segmentDistances = [];
      let redTrafficCount = 0;

      result.routes[0].sections.forEach((section, index) => {
        const lineString = H.geo.LineString.fromFlexiblePolyline(
          section.polyline
        );
        lineStrings.push(lineString);

        // Calculate the distance along the polyline
        let segmentDistance = 0;
        let previousPoint = null;

        lineString.eachLatLngAlt((lat, lng, alt, idx) => {
          const currentPoint = new H.geo.Point(lat, lng);
          if (previousPoint) {
            const distance = previousPoint.distance(currentPoint);
            totalDistance += distance;
            segmentDistance += distance;
          }
          previousPoint = currentPoint;
        });

        segmentDistances.push(segmentDistance);

        // Count red traffic conditions
        if (section.traffic && section.traffic.jamFactor > 7) {
          redTrafficCount += 1; // Increment the red traffic counter
          console.log(
            "Red traffic detected:",
            section.traffic,
            section.traffic.jamFactor
          );
        }
      });

      const data = {
        totalDistance: totalDistance,
        segmentDistances: segmentDistances,
        redTrafficCount: redTrafficCount, // Return the number of red traffic conditions detected
      };

      console.log(data);

      const routeLine = new H.map.Polyline(
        new H.geo.MultiLineString(lineStrings),
        {
          style: {
            strokeColor: "blue",
            lineWidth: 3,
          },
        }
      );

      const group = new H.map.Group();
      group.addObjects([routeLine, ...waypointMarkers]);

      if (typeof map !== "undefined" && map instanceof H.Map) {
        map.addObject(group);
      } else {
        console.error("Map object is not defined or not an instance of H.Map");
      }

      resolve(data);
    };

    const router = platform.getRoutingService(null, 8);
    router.calculateRoute(routingParameters, onResult, function (error) {
      console.error(error.message);
      reject(error.message);
    });
  });
}
