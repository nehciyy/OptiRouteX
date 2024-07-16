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
