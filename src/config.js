const center = {
  lat: 1.3521,
  lng: 103.8198,
  text: "Singapore",
};

const hereCredentials = {
  id: process.env.ID,
  code: process.env.CODE,
  apikey: process.env.MAPS_API_KEY,
  TRAFFIC_API_URL: "https://traffic.ls.hereapi.com/traffic/7.16/flow.json",
};

export { center, hereCredentials };
