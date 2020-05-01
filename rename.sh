#!/bin/zsh

function renameFile() {
  file=$1
  to=`echo $file | tr '[4321]' '[3210]'`
  echo "rename file $file to $to";
  if [ ! -f "../npc/$to" ] ; then
    cp "$file" "../npc/$to"
  fi
}

function renameAll() {
    cd npc_origin
    for file in * ; do
      if [ -f "$file" ] ; then
        renameFile "$file"
      fi
    done
}

renameAll