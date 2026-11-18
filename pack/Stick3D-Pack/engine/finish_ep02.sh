#!/usr/bin/env bash
# Concatenate the 5 rendered parts, mux voice+SFX mix, verify, export, and zip the updated pack.
set -e
cd "$(dirname "$0")"; P=out/ep02; EXP=../99-exports/ep02
mkdir -p "$EXP"
printf "file 'part%d.mp4'\n" 0 1 2 3 4 > $P/list.txt
ffmpeg -v error -y -f concat -safe 0 -i $P/list.txt -c copy $P/video.mp4
ffmpeg -v error -y -i $P/video.mp4 -i public/ep02/mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -t 100 -movflags +faststart "$EXP/EP02_What_If_Stickman_Drew_A_Door_1080x1920.mp4"
ffprobe -v error -show_entries format=duration:stream=codec_name,width,height,r_frame_rate,nb_frames -of compact "$EXP/EP02_What_If_Stickman_Drew_A_Door_1080x1920.mp4"
