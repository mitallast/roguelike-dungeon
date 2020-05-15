import typescript from '@rollup/plugin-typescript';
import {terser} from "rollup-plugin-terser";
import copy from 'rollup-plugin-copy';

import * as reserved from "./reserved.json";

export default {
  input: 'src/app.ts',
  output: {
    file: 'dist/bundle.js',
    format: 'iife',
    globals: {
      "pixi.js": "PIXI",
      "pixi-sound": "PIXI.sound",
      "pixi-layers": "PIXI.display"
    },
    sourcemap: true,
  },
  plugins: [
    typescript(),
    terser({
      ecma: 2020,
      keep_fnames: false,
      compress: {
        ecma: 2020,
        drop_console: true,
        unsafe_arrows: true,
        warnings: true
      },
      mangle: {
        properties: {
          regex: /^_/,
          keep_quoted: true,
          reserved: reserved
        },
      },
      output: {
        comments: false,
        beautify: false,
        ecma: 2020,
      }
    }),
    copy({
      targets: [
        {
          src: [
            'node_modules/pixi.js/dist/pixi.min.js',
            'node_modules/pixi.js/dist/pixi.min.js.map',
            'node_modules/pixi-layers/dist/pixi-layers.js',
            'node_modules/pixi-layers/dist/pixi-layers.js.map',
            'node_modules/pixi-sound/dist/pixi-sound.js',
            'node_modules/pixi-sound/dist/pixi-sound.js.map',
          ], dest: 'dist/'
        }
      ]
    })
  ],
  external: [
    "pixi.js",
    "pixi-layers",
    "pixi-sound"
  ],
  onwarn: message => {
    if (message.code === 'CIRCULAR_DEPENDENCY') return;
    console.error(message);
  },
};