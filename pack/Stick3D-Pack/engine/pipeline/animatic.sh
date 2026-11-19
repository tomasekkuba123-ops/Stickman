#!/usr/bin/env bash
# STEP 1 — ANIMATIC for approval: 540x960 @ 12 fps (+ the episode mix if given), and the QC mask (270x480 @ 12 fps).
# usage: pipeline/animatic.sh <Id> <seconds> <outdir> [mix.wav] [--no-mask]
set -e; cd "$(dirname "$0")/.."; ID=$1; SEC=$2; OUT=$3; MIX=$4; NF=$(python3 -c "print(round($SEC*12)-1)"); mkdir -p "$OUT"; GL=$(cat ../.gl-flag)
npx remotion render "${ID}Animatic" "$OUT/animatic_silent.mp4" --gl=$GL --scale=0.5 --frames=0-$NF --concurrency=4 --timeout=240000 --muted --log=error
if [ -n "$MIX" ] && [ -f "$MIX" ]; then ffmpeg -v error -y -i "$OUT/animatic_silent.mp4" -i "$MIX" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 160k -shortest "$OUT/animatic.mp4"; else cp "$OUT/animatic_silent.mp4" "$OUT/animatic.mp4"; fi
if [ "$5" != "--no-mask" ]; then bash pipeline/qcmask.sh "$ID" "$SEC" "$OUT"; fi
echo "ANIMATIC: $OUT/animatic.mp4"
