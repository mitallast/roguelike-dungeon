'use strict';

const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');

const path = require('path');
const distDir = path.resolve(__dirname, 'dist');

module.exports = {
  entry: "./src/app.ts",
  resolve: {
    extensions: ['.ts', '.js']
  },
  output: {
    path: distDir,
    filename: 'bundle.js'
  },
  performance: {
    maxAssetSize: 10000000,
    maxEntrypointSize: 200000,
    hints: "warning"
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader'
      }
    ]
  },
  externals: [
    // Don't bundle pixi.js, assume it'll be included in the HTML via a script
    // tag, and made available in the global variable PIXI.
    {"pixi.js": "PIXI"},
    {"pixi-layers": "PIXI.layers"},
    {"pixi-sound": "PIXI.sound"},
  ],
  plugins: [
    new webpack.ProvidePlugin({
      PIXI: 'pixi.js',
      sound: 'pixi-sound',
    }),
    new CopyPlugin([
      'node_modules/pixi.js/dist/pixi.min.js',
      'node_modules/pixi.js/dist/pixi.min.js.map',
      'node_modules/pixi-layers/dist/pixi-layers.js',
      'node_modules/pixi-layers/dist/pixi-layers.js.map',
      'node_modules/pixi-sound/dist/pixi-sound.js',
      'node_modules/pixi-sound/dist/pixi-sound.js.map',
    ]),
  ]
}