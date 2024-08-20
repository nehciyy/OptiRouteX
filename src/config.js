const center = {
  lat: 1.3521,
  lng: 103.8198,
  text: "Singapore",
};

const hereCredentials = {
  id: "HERE-580478a9-edc0-4a38-8842-1393f0e46820",
  code: "BYa7o5f155QWUHkSmjWA",
  apikey: process.env.MAPS_API_KEY,
  TRAFFIC_API_URL: "https://traffic.ls.hereapi.com/traffic/7.16/flow.json",
};

export { center, hereCredentials };
