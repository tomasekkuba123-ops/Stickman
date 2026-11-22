#!/usr/bin/env python3
"""usage: tts.py script.txt out.wav  — the channel voice (assets/voice/VOICE.json, Kokoro am_michael). Never change the voice."""
import sys, json, os, soundfile as sf
from kokoro_onnx import Kokoro
V = json.load(open(os.path.join(os.path.dirname(__file__), "..", "assets/voice/VOICE.json")))
k = Kokoro(V["model"], V["voices_file"]); a, sr = k.create(open(sys.argv[1]).read().strip(), voice=V["voice"], speed=V["speed"], lang=V["lang"])
sf.write(sys.argv[2], a, sr); print(f"{len(a)/sr:.2f} s ->", sys.argv[2])
