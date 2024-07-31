import { getMap } from "./mapSingleton";

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

export function routeCal(origin, destination) {
  const {
    mapInstance: map,
    platformInstance: platform,
    behaviorInstance: behavior,
  } = getMap();

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

export function multiRouteCal(waypoints, origin, destination) {
  const { mapInstance: map, platformInstance: platform } = getMap();
  const waypointMarkers = [];

  // Define the routing parameters
  const routingParameters = {
    routingMode: "fast",
    transportMode: "pedestrian",
    origin: `${origin.lat},${origin.lng}`,
    destination: `${destination.lat},${destination.lng}`,
    return: "polyline",
    // Add a via parameter to the query for each coordinate pair:
    via: new H.service.Url.MultiValueQueryParameter(
      waypoints.map((wp) => `${wp.lat},${wp.lng}`)
    ),
  };

  // Function to create a custom marker icon with a number
  function createMarkerIcon(color, number) {
    return new H.map.Icon(
      `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30">
        <circle cx="15" cy="15" r="10" fill="${color}" stroke="white" stroke-width="2"/>
        <text x="15" y="20" font-size="12" font-family="Arial" fill="white" text-anchor="middle">${number}</text>
      </svg>`
    );
  }

  // Create icons for origin and destination with numbers
  const originIcon = createMarkerIcon("blue", "Start");
  const destinationIcon = createMarkerIcon("red", "End");

  // Callback function to process the routing response
  const onResult = function (result) {
    // Check if a route was found
    if (!result.routes.length) {
      console.error("No routes found");
      return;
    }

    // Create waypoint markers with numbers
    waypoints.forEach((waypoint, index) => {
      const waypointMarker = new H.map.Marker(
        { lat: waypoint.lat, lng: waypoint.lng },
        { icon: createMarkerIcon("gray", index + 1) }
      );
      waypointMarkers.push(waypointMarker);
    });

    // Add markers for origin and destination with custom icons
    const originMarker = new H.map.Marker(origin, { icon: originIcon });
    const destinationMarker = new H.map.Marker(destination, {
      icon: destinationIcon,
    });
    waypointMarkers.push(originMarker, destinationMarker);

    // Collect line strings for each section of the route
    const lineStrings = [];
    result.routes[0].sections.forEach((section) => {
      lineStrings.push(H.geo.LineString.fromFlexiblePolyline(section.polyline));
    });

    // Create multi-line string from the line strings
    const multiLineString = new H.geo.MultiLineString(lineStrings);

    // Calculate the distance along the polyline
    let totalDistance = 0;
    const distances = [];
    const segmentDistances = [];

    lineStrings.forEach((lineString, segmentIndex) => {
      let previousPoint = null;
      let segmentDistance = 0;
      lineString.eachLatLngAlt((lat, lng, alt, index) => {
        const currentPoint = new H.geo.Point(lat, lng);
        if (previousPoint) {
          const distance = previousPoint.distance(currentPoint);
          totalDistance += distance;
          segmentDistance += distance;
        }
        previousPoint = currentPoint;
      });
      segmentDistances.push(segmentDistance);
    });

    // Log the total distance
    console.log(`Total travel distance: ${totalDistance} meters`);

    // Log distances between each stopping point
    segmentDistances.forEach((distance, index) => {
      console.log(`Distance from segment ${index + 1}: ${distance} meters`);
    });

    // Create a polyline to display the route
    const routeLine = new H.map.Polyline(multiLineString, {
      style: {
        strokeColor: "blue",
        lineWidth: 3,
      },
    });

    // Create a group that holds the route and waypoint markers
    const group = new H.map.Group();
    group.addObjects([routeLine, ...waypointMarkers]);

    // Add the group to the map if the map object is defined and valid
    if (typeof map !== "undefined" && map instanceof H.Map) {
      map.addObject(group);
    } else {
      console.error("Map object is not defined or not an instance of H.Map");
    }
  };

  // Get an instance of the routing service version 8
  const router = platform.getRoutingService(null, 8);

  // Call the calculateRoute() method with the routing parameters,
  // the callback, and an error callback function
  router.calculateRoute(routingParameters, onResult, function (error) {
    console.error(error.message);
    alert(error.message);
  });
}

export function draggableDirections(origin, destination) {
  const {
    mapInstance: map,
    platformInstance: platform,
    behaviorInstance: behavior,
  } = getMap();
  // Clear all existing objects from the map
  map.removeObjects(map.getObjects());
  let routePolyline;

  function routeResponseHandler(response) {
    const sections = response.routes[0].sections;
    const lineStrings = [];
    sections.forEach((section) => {
      // convert Flexible Polyline encoded string to geometry
      lineStrings.push(H.geo.LineString.fromFlexiblePolyline(section.polyline));
    });
    const multiLineString = new H.geo.MultiLineString(lineStrings);
    const bounds = multiLineString.getBoundingBox();

    // Create the polyline for the route
    if (routePolyline) {
      // If the routePolyline we just set the new geometry
      routePolyline.setGeometry(multiLineString);
    } else {
      // routePolyline is not yet defined, instantiate a new H.map.Polyline
      routePolyline = new H.map.Polyline(multiLineString, {
        style: {
          lineWidth: 5,
        },
      });
      // Add the polyline to the map
      map.addObject(routePolyline);
    }

    // Ensure the map view includes the whole route
    map.getViewModel().setLookAtData({ bounds });
  }

  function getMarkerIcon(id) {
    const svgCircle = `<svg width="30" height="30" version="1.1" xmlns="http://www.w3.org/2000/svg">
                        <g id="marker">
                          <circle cx="15" cy="15" r="10" fill="#0099D8" stroke="#0099D8" stroke-width="4" />
                          <text x="50%" y="50%" text-anchor="middle" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="12px" dy=".3em">${id}</text>
                        </g></svg>`;
    return new H.map.Icon(svgCircle, {
      anchor: {
        x: 15,
        y: 15,
      },
    });
  }

  function addMarker(position, id) {
    if (
      !position ||
      typeof position.lat === "undefined" ||
      typeof position.lng === "undefined"
    ) {
      console.error("Invalid position for marker:", position);
      return null;
    }
    const marker = new H.map.Marker(
      new H.geo.Point(position.lat, position.lng),
      {
        data: {
          id,
        },
        icon: getMarkerIcon(id),
        // Enable smooth dragging
        volatility: true,
      }
    );
    // Enable draggable markers
    marker.draggable = true;

    map.addObject(marker);
    return marker;
  }

  function updateRoute() {
    // Add waypoints the route must pass through
    routingParams.via = new H.service.Url.MultiValueQueryParameter(
      waypoints.map((wp) => `${wp.getGeometry().lat},${wp.getGeometry().lng}`)
    );

    router.calculateRoute(routingParams, routeResponseHandler, console.error);
  }

  const originMarker = addMarker(origin, "A");
  const destinationMarker = addMarker(destination, "B");
  // This array holds instances of H.map.Marker representing the route waypoints
  const waypoints = [];

  // Define the routing service parameters
  const routingParams = {
    origin: `${origin.lat},${origin.lng}`,
    destination: `${destination.lat},${destination.lng}`,
    // defines multiple waypoints
    via: new H.service.Url.MultiValueQueryParameter(waypoints),
    transportMode: "car",
    return: "polyline",
  };

  const router = platform.getRoutingService(null, 8);
  updateRoute();

  /**
   * Listen to the dragstart and store the relevant position information of the marker
   */
  map.addEventListener(
    "dragstart",
    function (ev) {
      const target = ev.target;
      const pointer = ev.currentPointer;
      if (target instanceof H.map.Marker) {
        // Disable the default draggability of the underlying map
        behavior.disable(H.mapevents.Behavior.Feature.PANNING);

        var targetPosition = map.geoToScreen(target.getGeometry());
        // Calculate the offset between mouse and target's position
        // when starting to drag a marker object
        target["offset"] = new H.math.Point(
          pointer.viewportX - targetPosition.x,
          pointer.viewportY - targetPosition.y
        );
      }
    },
    false
  );

  /**
   * Listen to the dragend and update the route
   */
  map.addEventListener(
    "dragend",
    function (ev) {
      const target = ev.target;
      if (target instanceof H.map.Marker) {
        // re-enable the default draggability of the underlying map
        // when dragging has completed
        behavior.enable(H.mapevents.Behavior.Feature.PANNING);
        const coords = target.getGeometry();
        const markerId = target.getData().id;

        // Update the routing params `origin` and `destination` properties
        // in case we dragging either the origin or the destination marker
        if (markerId === "A") {
          routingParams.origin = `${coords.lat},${coords.lng}`;
        } else if (markerId === "B") {
          routingParams.destination = `${coords.lat},${coords.lng}`;
        }

        updateRoute();
      }
    },
    false
  );

  /**
   * Listen to the drag event and move the position of the marker as necessary
   */
  map.addEventListener(
    "drag",
    function (ev) {
      const target = ev.target;
      const pointer = ev.currentPointer;
      if (target instanceof H.map.Marker) {
        const newCoords = map.screenToGeo(
          pointer.viewportX - target["offset"].x,
          pointer.viewportY - target["offset"].y
        );
        if (newCoords instanceof H.geo.Point) {
          target.setGeometry(newCoords);
        }
      }
    },
    false
  );

  /**
   * Listen to the tap event to add a new waypoint
   */
  map.addEventListener("tap", function (ev) {
    const target = ev.target;
    const pointer = ev.currentPointer;
    const coords = map.screenToGeo(pointer.viewportX, pointer.viewportY);

    if (coords instanceof H.geo.Point && !(target instanceof H.map.Marker)) {
      const marker = addMarker(coords, waypoints.length + 1);
      waypoints.push(marker);
      updateRoute();
    }
  });
  /**
   * Listen to the dbltap event to remove a waypoint
   */
  map.addEventListener("dbltap", function (ev) {
    const target = ev.target;

    if (target instanceof H.map.Marker) {
      // Prevent origin or destination markers from being removed
      if (["A", "B"].indexOf(target.getData().id) !== -1) {
        return;
      }

      const markerIdx = waypoints.indexOf(target);
      if (markerIdx !== -1) {
        // Remove the marker from the array of way points
        waypoints.splice(markerIdx, 1);
        // Iterate over the remaining waypoints and update their data
        waypoints.forEach((marker, idx) => {
          const id = idx + 1;
          // Update marker's id
          marker.setData({
            id,
          });
          // Update marker's icon to show its new id
          marker.setIcon(getMarkerIcon(id));
        });
      }

      // Remove the marker from the map
      map.removeObject(target);

      updateRoute();
    }
  });
}
