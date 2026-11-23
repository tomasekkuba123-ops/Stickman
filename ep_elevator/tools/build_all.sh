#!/usr/bin/env bash
# Full rebuild of the voiceless 8-minute cut. Needs: python3 (numpy, opencv-python-headless, scipy), ffmpeg with libass.
# Images must be in images/SCENE_01.jpg .. SCENE_30.jpg (1920x1080).
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p out/chunks
python3 tools/validate_inputs.py
python3 tools/make_timeline.py
python3 tools/make_sfx.py
python3 tools/make_subs.py
# picture: 4 x 120 s chunks in parallel, then lossless concat
for i in 0 1 2 3; do python3 tools/render_video.py --start $((i*120)) --dur 120 --out out/chunks/part$i.mp4 > out/chunks/part$i.log 2>&1 & done
wait
printf "file 'part%d.mp4'\n" 0 1 2 3 > out/chunks/list.txt
ffmpeg -y -hide_banner -loglevel error -f concat -safe 0 -i out/chunks/list.txt -c copy -movflags +faststart out/master_clean.mp4
# visual cut without voice: picture + burned subtitles + SFX
ffmpeg -y -hide_banner -loglevel error -i out/master_clean.mp4 -i out/SFX_STEM.wav \
  -vf "ass=out/subs_burn.ass:fontsdir=/usr/share/fonts/opentype/inter" \
  -map 0:v -map 1:a -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p -profile:v high \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 \
  -c:a aac -b:a 192k -t 480 -movflags +faststart \
  "out/WHAT_IF_STICKMAN_WRONG_ELEVATOR_8min_NO_VOICE.mp4"
python3 tools/check_output.py "out/WHAT_IF_STICKMAN_WRONG_ELEVATOR_8min_NO_VOICE.mp4"
