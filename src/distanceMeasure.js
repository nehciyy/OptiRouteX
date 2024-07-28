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

export function multiRouteCal(map, waypoints, origin, destination) {
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
  //Callback function to process the routing response
  const onResult = function (result) {
    //Check if a route was found
    if (!result.routes.length) {
      console.error("No routes found");
      return;
    }

    // Create waypoint markers:
    waypoints.forEach((waypoint) => {
      const waypointMarker = new H.map.Marker({
        lat: waypoint.lat,
        lng: waypoint.lng,
      });
      waypointMarkers.push(waypointMarker);
    });

    // Collect line strings for each section of the route
    const lineStrings = [];
    result.routes[0].sections.forEach((section) => {
      lineStrings.push(H.geo.LineString.fromFlexiblePolyline(section.polyline));
    });

    //Create multi-line string from the line strings
    const multiLineString = new H.geo.MultiLineString(lineStrings);

    //Create a polyline to display the route
    const routeLine = new H.map.Polyline(multiLineString, {
      style: {
        strokeColor: "blue",
        lineWidth: 3,
      },
    });

    //Create markers for the start and end points
    const startMarker = new H.map.Marker(origin);
    const endMarker = new H.map.Marker(destination);

    //Create a group that holds the route and waypoint markers
    const group = new H.map.Group();
    group.addObjects([routeLine, startMarker, endMarker, ...waypointMarkers]);

    //Add the group to the map if the map object is defined and valid
    if (typeof map !== "undefined" && map instanceof H.Map) {
      map.addObject(group);
    } else {
      console.error("Map object is not defined or not an instance of H.Map");
    }
  };

  //Get an instance of the routing service version 8
  const router = platform.getRoutingService(null, 8);

  //Call the calculateRoute() method with the routing parameters,
  // the callback, and an error callback function
  router.calculateRoute(routingParameters, onResult, function (error) {
    console.error(error.message);
    alert(error.message);
  });
}

export function draggableDirections(map, origin, destination) {
  /**
   * Returns an instance of H.map.Icon to style the markers
   * @param {number|string} id An identifier that will be displayed as marker label
   *
   * @return {H.map.Icon}
   */
  function getMarkerIcon(id) {
    const svgCircle = `<svg width="30" height="30" version="1.1" xmlns="http://www.w3.org/2000/svg">
                        <g id="marker">
                          <circle cx="15" cy="15" r="10" fill="#0099D8" stroke="#0099D8" stroke-width="4" />
                          <text x="50%" y="50%" text-anchor="middle" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="12px" dy=".3em">${id}</text>
                        </g></svg>`;
    return new H.map.Icon(svgCircle, {
      anchor: {
        x: 10,
        y: 10,
      },
    });
  }

  /**
   * Create an instance of H.map.Marker and add it to the map
   *
   * @param {object} position  An object with 'lat' and 'lng' properties defining the position of the marker
   * @param {string|number} id An identifier that will be displayed as marker label
   * @return {H.map.Marker} The instance of the marker that was created
   */
  function addMarker(position, id) {
    const marker = new H.map.Marker(position, {
      data: {
        id,
      },
      icon: getMarkerIcon(id),
      // Enable smooth dragging
      volatility: true,
    });
    // Enable draggable markers
    marker.draggable = true;

    map.addObject(marker);
    return marker;
  }

  const originMarker = addMarker(origin, "A");
  const destinationMarker = addMarker(destination, "B");
  // This array holds instances of H.map.Marker representing the route waypoints
  const waypoints = [];

  const routingParams = {
    origin: `${origin.lat},${origin.lng}`,
    destination: `${destination.lat},${destination.lng}`,
    // defines multiple waypoints
    via: new H.service.Url.MultiValueQueryParameter(waypoints),
    transportMode: "car",
    return: "polyline",
  };

  function updateRoute() {
    // Add waypoints the route must pass through
    routingParams.via = new H.service.Url.MultiValueQueryParameter(
      waypoints.map((wp) => `${wp.getGeometry().lat},${wp.getGeometry().lng}`)
    );

    router.calculateRoute(routingParams, routeResponseHandler, console.error);
  }

  const router = platform.getRoutingService(null, 8);
  let routePolyline;
  /**
   * Handler for the H.service.RoutingService8#calculateRoute call
   *
   * @param {object} response The response object returned by calculateRoute method
   */
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
    }

    // Add the polyline to the map
    map.addObject(routePolyline);
  }

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
   * Listen to the drag event and move the position of the marker as necessary
   */
  map.addEventListener(
    "drag",
    function (ev) {
      const target = ev.target;
      const pointer = ev.currentPointer;
      if (target instanceof H.map.Marker) {
        target.setGeometry(
          map.screenToGeo(
            pointer.viewportX - target["offset"].x,
            pointer.viewportY - target["offset"].y
          )
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
   * Listen to the tap event to add a new waypoint
   */
  map.addEventListener("tap", function (ev) {
    const target = ev.target;
    const pointer = ev.currentPointer;
    const coords = map.screenToGeo(pointer.viewportX, pointer.viewportY);

    if (!(target instanceof H.map.Marker)) {
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
      // Prevent the origin or destination markers from being removed
      if (["origin", "destination"].indexOf(target.getData().id) !== -1) {
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

  behavior.disable(H.mapevents.Behavior.Feature.DBL_TAP_ZOOM);
}
