'use strict';

const merge = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  mode: 'development',
  performance: {
    hints: false,
  },
  devtool: 'source-map',
  optimization: {
    concatenateModules: false,
    minimize: false,
  },
});