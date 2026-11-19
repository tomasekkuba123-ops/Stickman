#!/usr/bin/env bash
# STEP 2 — FINAL 1080x1920 @ 30 fps in resumable 300-frame parts (each part < 15 min, safe for the 2 h task limit; re-run to resume).
# usage: pipeline/final.sh <Id> <frames> <outdir> <mix.wav> [--redo a-b]   (--redo 70-80 deletes the parts covering seconds 70..80 first)
set -e; cd "$(dirname "$0")/.."; ID=$1; N=$2; OUT=$3; MIX=$4; mkdir -p "$OUT/parts"; GL=$(cat ../.gl-flag); P=300
if [ "$5" = "--redo" ]; then a=${6%-*}; b=${6#*-}; for ((i=0; i*P<N; i++)); do s=$((i*P/30)); e=$(((i+1)*P/30)); if [ $e -gt $a ] && [ $s -lt $b ]; then rm -f "$OUT/parts/part$i.mp4"; echo "redo part $i"; fi; done; fi
for ((i=0; i*P<N; i++)); do a=$((i*P)); b=$((a+P-1)); [ $b -ge $N ] && b=$((N-1)); f="$OUT/parts/part$i.mp4"
  [ -s "$f" ] && continue
  npx remotion render "$ID" "$f.tmp.mp4" --gl=$GL --concurrency=4 --timeout=240000 --muted --frames=$a-$b --log=error && mv "$f.tmp.mp4" "$f" && echo "DONE part $i $(date +%T)"
done
ls "$OUT"/parts/part*.mp4 | sort -V | sed "s|^|file '|; s|$|'|; s|$OUT/parts/|parts/|" > "$OUT/list.txt"
(cd "$OUT" && ffmpeg -v error -y -f concat -safe 0 -i list.txt -c copy video.mp4)
ffmpeg -v error -y -i "$OUT/video.mp4" -i "$MIX" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -t $(python3 -c "print($N/30)") -movflags +faststart "$OUT/final.mp4"
echo "FINAL: $OUT/final.mp4"
