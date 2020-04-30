'use strict';

const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = merge(common, {
  mode: 'production',
  devtool: 'source-map',
  optimization: {
    concatenateModules: true,
    noEmitOnErrors: true,
    minimize: true,
    minimizer: [new TerserPlugin({
      terserOptions: {
        ecma: 2016,
        sourceMap: true,
        mangle: {
          properties: false,
        }
      }
    })],
  },
});