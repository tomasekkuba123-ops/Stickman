#!/usr/bin/env bash
# PostToolUse(Bash) after a render command, or directly: post_render.sh --file out/epXX/final.mp4
# 1) output must be 1080x1920 @ 30 fps  2) audio loudnorm to -14 LUFS if it drifted (> 0.5 LU)  3) qc_check.py (verify loop) -> report back to Claude
PACK=/home/user/Stickman/pack/Stick3D-Pack; ENG=$PACK/engine
if [ "$1" = "--file" ]; then files="$2"; else
  cmd=$(jq -r '.tool_input.command // ""'); bg=$(jq -r '.tool_input.run_in_background // false')
  printf '%s' "$cmd" | grep -Eq 'final4k\.sh|final\.sh|remotion render|ep[0-9]+[a-z0-9]*/run\.sh' || exit 0
  [ "$bg" = "true" ] && exit 0   # background renders call this script themselves when they finish (pipeline/final4k.sh)
  files=$(find "$ENG/out" -name final.mp4 -mmin -30 2>/dev/null)
fi
[ -z "$files" ] && exit 0
msg=""
for f in $files; do
  [ -s "$f" ] || continue
  read -r w h r < <(ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate -of csv=p=0 "$f" | tr ',' ' ')
  [ "$w x $h @ $r" != "1080 x 1920 @ 30/1" ] && msg+="RESOLUTION FAIL: $f is ${w}x${h} @ $r (need 1080x1920 @ 30). "
  I=$(ffmpeg -nostats -i "$f" -af ebur128=peak=true -f null - 2>&1 | awk '/Integrated loudness:/{getline; print $2}' | tail -1)
  if [ -n "$I" ] && python3 -c "import sys; sys.exit(0 if abs($I + 14) > 0.5 else 1)"; then
    ffmpeg -v error -y -i "$f" -map 0 -c:v copy -af loudnorm=I=-14:TP=-1.5:LRA=11 -c:a aac -b:a 192k -ar 48000 -movflags +faststart "${f%.mp4}.ln.mp4" && mv "${f%.mp4}.ln.mp4" "$f"
    msg+="LOUDNESS: $f was $I LUFS -> re-normalised to -14 LUFS. "
  fi
  dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f" | python3 -c "import sys; print(round(float(sys.stdin.read())))")
  ep=$(printf '%s' "$f" | grep -oE 'ep[0-9]+' | head -1); cap=$ENG/public/$ep/captions.json; cuts=$(cat "$(dirname "$f")/cuts.txt" 2>/dev/null)
  (cd "$PACK" && python3 tools/qc_check.py "$f" --duration "$dur" ${ep:+--captions "$cap"} ${cuts:+--cuts "$cuts"} --fit assets/character/fit.json >/dev/null 2>&1)
  rep="$(dirname "$f")/qc/report.txt"; [ -f "$rep" ] && msg+="QC for $f: $(head -c 1500 "$rep" | tr '\n' ' ') "
done
[ -n "$msg" ] && jq -n --arg m "$msg" '{systemMessage:("post-render check: " + ($m|.[0:300])), hookSpecificOutput:{hookEventName:"PostToolUse",additionalContext:("POST-RENDER HOOK: " + $m + " If QC FAILED: fix the listed issues, re-render the affected parts and re-run until PASS; then run the fresh-eyes review before showing the user.")}}'
exit 0
