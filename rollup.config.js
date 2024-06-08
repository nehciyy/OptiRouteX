import resolve from "@rollup/plugin-node-resolve";

export default {
  input: "src/index.js",
  output: {
    file: "dist/bundle.js",
    format: "iife",
    name: "bundle",
  },
  // Disable "Use of Eval" Warning
  // The HERE Maps API for JavaScript uses 'eval' to evaluate
  // filter functions in the YAML Configuration for the Vector Tiles
  // onwarn: function (message) {
  //   if (/mapsjs.bundle.js/.test(message) && /Use of eval/.test(message)) return;
  //   console.error(message);
  // },
  plugins: [resolve()],
};
