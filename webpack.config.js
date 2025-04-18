import path from "path";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
export default {
  mode: "development",
  entry: "./public_html/script/src/index.js",
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
      { test: /\.png$/, type: 'asset/resource' },
    ],
  },
  plugins: [new MiniCssExtractPlugin()],
};
