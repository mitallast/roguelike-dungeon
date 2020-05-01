'use strict';

const merge = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  mode: 'development',
  performance: {
    hints: false,
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        options: {
          transpileOnly: true,
          experimentalWatchApi: true,
        },
      }
    ]
  },
  optimization: {
    concatenateModules: true,
    minimize: false,
  },
});