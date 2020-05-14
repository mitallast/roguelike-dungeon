#!/bin/zsh

function process() {
  file="$1"
  echo scan $file
  cat "$file" | sed -E 's#\/\/.+##g' | sed 's|/\*|\n&|g;s|*/|&\n|g' | sed '/\/\*/,/*\//d' |\
    sed -E 's#"[^"]+"##g' | sed -E "s#'[^']+'##g" |\
    sed -E 's/(declare|namespace|var|class|extends|constructor|number|readonly|object|type|Array|symbol)//g' |\
    sed -E 's/(export|enum|let|string|function|void|any|boolean|this|module|interface|index|undefined|canvas)//g' |\
    sed -E 's/(Float32Array|Uint32Array|Uint16Array|static|x|y|CanvasGradient|CanvasPattern)//g' |\
    sed -E 's/(HTML|XML)[A-Za-z]+|)//g'
  # grep -oE '[a-zA-Z0-9_]+'
}

#process "./node_modules/pixi-layers/dist/pixi-layers.d.ts"
#process "./node_modules/pixi-sound/pixi-sound.d.ts"
process "./node_modules/pixi.js/pixi.js.d.ts"

#find ./node_modules/pixi* -name '*.d.ts' -print0 | while read -d $'\0' file
#do
#  process "$file"
#done