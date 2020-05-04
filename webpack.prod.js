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
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          ecma: 8,
          sourceMap: true,
          compress: {
            drop_console: true,
            unsafe_arrows: true,
          },
          mangle: {
            properties: {
              regex: /^_/,
              keep_quoted: true,
              reserved: [
                "__Hint__",
                "_accessibleActive",
                "_accessibleDiv",
                "_backgroundColor",
                "_backgroundColorRgba",
                "_backgroundColorString",
                "_batchEnabled",
                "_batchLocation",
                "_blendEq",
                "_bounds",
                "_buffer",
                "_cachedTint",
                "_calculateBounds",
                "_canvasRenderTarget",
                "_compareStyles",
                "_currentLocalID",
                "_cx",
                "_cy",
                "_destroyed",
                "_drawCallPool",
                "_fillStyle",
                "_frame",
                "_globalBatch",
                "_height",
                "_holeMode",
                "_indexBuffer",
                "_initCurve",
                "_lastObjectRendered",
                "_lastSortedIndex",
                "_lineStyle",
                "_loadMatrix",
                "_localID",
                "_mask",
                "_matrix",
                "_overrideHeight",
                "_overrideWidth",
                "_parentID",
                "_populateBatches",
                "_recursivePostUpdateTransform",
                "_refresh",
                "_render",
                "_renderBatched",
                "_renderDefault",
                "_renderDirect",
                "_renderDrawCallDirect",
                "_renderToBatch",
                "_resolution",
                "_resolveDirectShader",
                "_rotation",
                "_scissorRect",
                "_shader",
                "_sx",
                "_sy",
                "_tempDisplayObjectParent",
                "_textureArrayPool",
                "_updateID",
                "_uvs",
                "_width",
                "_worldID",
                "_zIndex",
              ]
            },
          },
          output: {
            beautify: false,
            ecma: 8,
          }
        }
      }),
    ],
  },
});