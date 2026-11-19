#!/usr/bin/env bash
# STEP 3 + 4 — QC (must PASS) then publish kit. usage: pipeline/deliver.sh <Id> <seconds> <outdir> <episode-dir with words.json/script.txt/captions.json>
set -e; cd "$(dirname "$0")/.."; ID=$1; SEC=$2; OUT=$3; EP=$4
[ -f "$OUT/mask.json" ] || bash pipeline/qcmask.sh "$ID" "$SEC" "$OUT"
python3 ../tools/qc_check.py "$OUT/final.mp4" --duration "$SEC" --mask "$OUT/mask.json" --captions "$EP/captions.json" --out "$OUT/qc" || { echo "QC FAILED - see $OUT/qc/QC_REPORT.md, fix the listed scenes, re-render them with final.sh --redo a-b"; exit 1; }
python3 ../tools/publish_kit.py "$OUT/final.mp4" "$EP" "$OUT/mask.json" "$OUT/publish"
