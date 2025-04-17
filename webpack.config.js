"use strict";
const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
module.exports = {
  mode: "development",
  entry: "./public_html/script/src/index.es6",
  output: {
    path: path.resolve("public_html"),
    filename: "catan.js",
    publicPath: "/",
  },
  module: {
    rules: [
      {
        test: /\.scss$/,
        use: [MiniCssExtractPlugin.loader, "css-loader", "fast-sass-loader"],
      },
      { test: /\.es6$/ },
      { test: /\.png$/, type: 'asset/resource' },
    ],
  },
  plugins: [new MiniCssExtractPlugin()],
};
