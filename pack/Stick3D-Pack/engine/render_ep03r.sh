#!/usr/bin/env bash
# Renders Ep03R (3D remake) in 10 chunks of 300 frames; re-run to resume (finished parts are skipped).
cd "$(dirname "$0")"; mkdir -p out/ep03r
for i in 0 1 2 3 4 5 6 7 8 9; do a=$((i*300)); b=$((a+299)); f=out/ep03r/part$i.mp4
  [ -s "$f" ] && { echo "skip part $i"; continue; }
  npx remotion render Ep03R "$f.tmp.mp4" --gl=$(cat ../.gl-flag) --concurrency=4 --timeout=240000 --muted --frames=$a-$b --log=error && mv "$f.tmp.mp4" "$f" && echo "DONE part $i $(date +%T)"
done
