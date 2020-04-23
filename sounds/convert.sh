#!/usr/bin/env bash

rm -rf *.mp3
rm -rf *.ogg

for file in *.wav; do
  echo ${file%.*}
#  dest="$(echo $file | sed -e '/.wav$//')".mp3
#  dest="$(echo $file | sed -e '/.wav$//')".ogg

  ffmpeg -i "$file" -vn -ar 44100 -ac 2 -b:a 128k "${file%.*}.mp3"
  ffmpeg -i "$file" -vn -ar 44100 -ac 2 "${file%.*}.ogg"
done