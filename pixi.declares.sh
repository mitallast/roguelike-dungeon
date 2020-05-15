#!/bin/zsh

function process() {
  file="$1"
  cat "$file" | sed -E 's#\/\/.+##g' | sed 's|/\*|\n&|g;s|*/|&\n|g' | sed '/\/\*/,/*\//d' |\
    sed -E 's/([a-zA-Z_]+)\??\([^\)]+\)\:/\1/g' |\
    sed -E 's#"[^"]+"##g' | sed -E "s#'[^']+'##g" |\
    grep -oE '[a-zA-Z0-9_]+' |\
    grep -vE '^(declare|namespace|var|class|extends|constructor|number|readonly|object|type|Array|symbol)$' |\
    grep -vE '^(export|enum|let|string|function|void|any|boolean|this|module|interface|index|undefined|canvas)$' |\
    grep -vE '^(Float32Array|Uint32Array|Uint16Array|static|x|y|CanvasGradient|CanvasPattern)$' |\
    grep -vE '^(HTML|XML)[A-Za-z]+|)$' |\
    grep -vE '^.$' |\
    sort -u
}

echo '[' > reserved.json

find ./node_modules/pixi* -name '*.d.ts' -print0 | while read -d $'\0' file
do
  process "$file"
done | sort -u | xargs -I{} echo '"{}",' >> reserved.json


cat dungeon.design.json | grep -oE '"[a-zA-Z0-9_]+":' | tr ':' ',' >> reserved.json
cat dungeon.rules.json | grep -oE '"[a-zA-Z0-9_]+":' | tr ':' ',' >> reserved.json
cat monster.config.json | grep -oE '"[a-zA-Z0-9_]+":' | tr ':' ',' >> reserved.json
cat npc.config.json | grep -oE '"[a-zA-Z0-9_]+":' | tr ':' ',' >> reserved.json
cat weapon.config.json | grep -oE '"[a-zA-Z0-9_]+":' | tr ':' ',' >> reserved.json
cat dialogs.json | grep -oE '"[a-zA-Z0-9_]+":' | tr ':' ',' >> reserved.json

echo '"PIXI"]' >> reserved.json