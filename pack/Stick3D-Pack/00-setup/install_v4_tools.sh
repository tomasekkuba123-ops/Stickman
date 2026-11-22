#!/bin/bash
# v4 workflow tools: Kokoro TTS (onnx), faster-whisper, Rhubarb Lip Sync -> /opt/tools
set -e; mkdir -p /opt/tools && cd /opt/tools
pip install -q kokoro-onnx faster-whisper soundfile
B=https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0
[ -f kokoro-v1.0.int8.onnx ] || curl -sSLf -o kokoro-v1.0.int8.onnx $B/kokoro-v1.0.int8.onnx
[ -f voices-v1.0.bin ] || curl -sSLf -o voices-v1.0.bin $B/voices-v1.0.bin
[ -x Rhubarb-Lip-Sync-1.14.0-Linux/rhubarb ] || { curl -sSLf -o rhubarb.zip https://github.com/DanielSWolf/rhubarb-lip-sync/releases/download/v1.14.0/Rhubarb-Lip-Sync-1.14.0-Linux.zip && unzip -qo rhubarb.zip && rm rhubarb.zip; }
echo "v4 tools ready"
