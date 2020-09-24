const path = require("path");
const CleanPlugin = require("clean-webpack-plugin");

module.exports = {
  mode: "production", // get helpful error messages
  entry: "./src/app.ts",
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"),
    // don't need this for prod
    // publicPath: "dist",
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
  // don't need sourcemaps for prod
  devtool: "none",
  // we add a plugin to clean the dist folder before every build
  plugins: [
    // yarn add clean-webpack-plugin -D
    new CleanPlugin.CleanWebpackPlugin(),
  ],
};
