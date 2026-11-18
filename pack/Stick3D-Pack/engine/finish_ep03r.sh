#!/usr/bin/env bash
# Concatenate the 10 Ep03R parts, mux the voice+SFX+music mix, verify, export.
set -e
cd "$(dirname "$0")"; P=out/ep03r; EXP=../99-exports/ep03r; mkdir -p "$EXP"
printf "file 'part%d.mp4'\n" 0 1 2 3 4 5 6 7 8 9 > $P/list.txt
ffmpeg -v error -y -f concat -safe 0 -i $P/list.txt -c copy $P/video.mp4
OUT="$EXP/EP03_REMAKE_What_If_Stickman_Drew_A_Rocket_1080x1920.mp4"
ffmpeg -v error -y -i $P/video.mp4 -i public/ep03r/mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -t 100 -movflags +faststart "$OUT"
ffprobe -v error -show_entries format=duration:stream=codec_name,width,height,r_frame_rate,nb_frames -of compact "$OUT"
cp ../02-videos/ep03r/EP03_VOICE_100S.wav "$EXP/" && cp ../02-videos/ep03r/EP03_CAPTIONS.srt "$EXP/"
