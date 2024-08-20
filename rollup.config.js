import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import polyfillNode from "rollup-plugin-polyfill-node";
import json from "@rollup/plugin-json";
import replace from "@rollup/plugin-replace";
import dotenv from "dotenv";

dotenv.config(); // Load the environment variables from the .env file

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
  plugins: [
    resolve({
      browser: true,
      preferBuiltins: false,
    }),
    replace({
      preventAssignment: true, // Required to avoid issues with Rollup v2
      "process.env.MAPS_API_KEY": JSON.stringify(process.env.MAPS_API_KEY),
    }),
    commonjs(),
    polyfillNode(),
    json(),
  ],
};
