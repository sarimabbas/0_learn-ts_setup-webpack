const path = require("path");

module.exports = {
  mode: "development", // get helpful error messages
  entry: "./src/app.ts",
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"),
    // the webpack-dev-server will hold the bundle in memory. So we need to wire up `index.html` to it somehow
    publicPath: "dist",
  },
  module: {
    rules: [
      {
        // use a test to check if the rule should apply to the file
        // check if file ends with .ts
        test: /\.ts$/,
        use: "ts-loader",
        // we don't want webpack to look inside node_modules
        exclude: /node_modules/,
      },
    ],
  },
  // which file extensions webpack should look for
  resolve: {
    extensions: [".ts", ".js"],
  },
  // make use of the sourcemaps enabled by tsconfig.json
  devtool: "inline-source-map",
};
