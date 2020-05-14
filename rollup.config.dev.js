import typescript from '@rollup/plugin-typescript';
import copy from 'rollup-plugin-copy'

export default {
  input: 'src/app.ts',
  output: {
    file: 'dist/bundle.js',
    format: 'iife',
    globals: {
      "pixi.js": "PIXI",
      "pixi-sound": "PIXI.sound"
    },
    sourcemap: true,
  },
  plugins: [
    typescript(),
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