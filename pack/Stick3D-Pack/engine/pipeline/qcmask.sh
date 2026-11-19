#!/usr/bin/env bash
# QC MASK render (Stickman = magenta body + green face, no captions) at 270x480 @ 6 fps -> mask.mp4 + mask.json
# usage: pipeline/qcmask.sh <Id> <seconds> <outdir>
set -e; cd "$(dirname "$0")/.."; ID=$1; SEC=$2; OUT=$3; NF=$(python3 -c "print(round($SEC*6)-1)"); mkdir -p "$OUT"; GL=$(cat ../.gl-flag)
npx remotion render "${ID}QC" "$OUT/mask.mp4" --gl=$GL --scale=0.25 --frames=0-$NF --concurrency=4 --timeout=240000 --muted --crf=12 --props='{"qcmask":true}' --log=error
python3 ../tools/stickmask.py "$OUT/mask.mp4" "$OUT/mask.json"
