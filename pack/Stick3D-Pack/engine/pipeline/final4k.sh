#!/usr/bin/env bash
# STEP 2 (HD) — FINAL rendered at 2160x3840 (supersampling, --scale=2) in resumable parts, then ONE pass to 1080x1920:
#   Lanczos downscale -> light unsharp mask -> fine temporal grain (dither, no banding in dark gradients)
#   H.264 High, yuv420p, CRF 15 (cap 20 Mbps), AAC 192k, faststart. Audio = the -14 LUFS mix as is.
# usage: pipeline/final4k.sh <Id> <frames> <outdir> <mix.wav> [part_frames=60] [concurrency=3]
# Re-run to resume (finished parts are kept; a part takes < 1 h so every background run stays under the 2 h limit).
set -e; cd "$(dirname "$0")/.."; ID=$1; N=$2; OUT=$3; MIX=$4; P=${5:-60}; CC=${6:-3}; mkdir -p "$OUT/parts4k"; GL=$(cat ../.gl-flag)
rm -f "$OUT"/parts4k/*.tmp.mp4
for ((i=0; i*P<N; i++)); do a=$((i*P)); b=$((a+P-1)); [ $b -ge $N ] && b=$((N-1)); f="$OUT/parts4k/part$i.mp4"
  [ -s "$f" ] && continue
  npx remotion render "$ID" "$f.tmp.mp4" --gl=$GL --scale=2 --concurrency=$CC --timeout=600000 --muted --crf=12 --frames=$a-$b --log=error && mv "$f.tmp.mp4" "$f" && echo "DONE 4k part $i ($a-$b) $(date +%T)"
done
ls "$OUT"/parts4k/part*.mp4 | sort -V | sed "s|^$OUT/parts4k/|file '|; s|$|'|" > "$OUT/parts4k/list.txt"
(cd "$OUT/parts4k" && ffmpeg -v error -y -f concat -safe 0 -i list.txt -c copy ../video4k.mp4)
ffmpeg -v error -y -i "$OUT/video4k.mp4" -i "$MIX" -map 0:v -map 1:a \
  -vf "scale=1080:1920:flags=lanczos+accurate_rnd+full_chroma_int,unsharp=5:5:0.45:5:5:0.0,noise=c0s=3:c0f=t+u,format=yuv420p" \
  -c:v libx264 -profile:v high -preset slow -crf 15 -maxrate 20M -bufsize 40M -pix_fmt yuv420p \
  -c:a aac -b:a 192k -ar 48000 -t $(python3 -c "print($N/30)") -movflags +faststart "$OUT/final.mp4"
echo "FINAL: $OUT/final.mp4"
# verify loop (same script as the project PostToolUse hook): resolution, -14 LUFS, qc_check.py -> <outdir>/qc/report.txt
bash /home/user/Stickman/.claude/hooks/post_render.sh --file "$PWD/$OUT/final.mp4" | jq -r '.hookSpecificOutput.additionalContext // empty'
