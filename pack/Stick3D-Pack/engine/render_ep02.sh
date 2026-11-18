#!/usr/bin/env bash
# Renders Ep02 in 5 chunks (600 frames each), then concatenates and muxes the voice+SFX mix.
cd "$(dirname "$0")"; mkdir -p out/ep02
for i in 0 1 2 3 4; do a=$((i*600)); b=$((a+599)); f=out/ep02/part$i.mp4
  [ -s "$f" ] && { echo "skip part $i"; continue; }
  npx remotion render Ep02 "$f" --gl=$(cat ../.gl-flag) --concurrency=4 --muted --frames=$a-$b --log=error && echo "DONE part $i $(date +%T)"
done
