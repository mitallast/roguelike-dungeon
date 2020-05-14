import typescript from '@rollup/plugin-typescript';
import {terser} from "rollup-plugin-terser";
import copy from 'rollup-plugin-copy'

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
          // regex: /^_/,
          keep_quoted: true,
          reserved: [
            "Stage",
            "Container",
            "AnimatedSprite",
            "Application",
            "BLEND_MODES", "ADD", "MULTIPLY",
            "BitmapText",
            "Container",
            "Graphics",
            "Point",
            "SCALE_MODES", "NEAREST",
            "Sprite",
            "Texture.from",
            "Ticker",
            "shared", "add", "remove",
            "TilingSprite",
            "UPDATE_PRIORITY", "LOW",
            "display", "Layer",
            "display", "Stage",
            "filters", "BlurFilter",
            "sound", "play",
            "loader",
            "ticker",
            "screen",
            "texture", "baseTexture", "scaleMode",
            "spritesheet",
            "textures", "animations",
            "name",
            "autoUpdate",
            "animationSpeed",
            "loop",
            "play",
            "resources",


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