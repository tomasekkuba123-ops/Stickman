#!/usr/bin/env python3
"""usage: tts.py script.txt out.wav [--voice bm_george] [--speed 1.0]
Channel voice from assets/voice/VOICE.json (Kokoro). --voice overrides it for one episode (bm_*/bf_* voices use en-gb)."""
import sys, json, os, argparse, soundfile as sf
from kokoro_onnx import Kokoro
p = argparse.ArgumentParser(); p.add_argument("script"); p.add_argument("out")
p.add_argument("--voice"); p.add_argument("--speed", type=float); a_ = p.parse_args()
V = json.load(open(os.path.join(os.path.dirname(__file__), "..", "assets/voice/VOICE.json")))
voice = a_.voice or V["voice"]; speed = a_.speed or V["speed"]
lang = "en-gb" if voice[:2] in ("bm", "bf") else V["lang"]
k = Kokoro(V["model"], V["voices_file"]); a, sr = k.create(open(a_.script).read().strip(), voice=voice, speed=speed, lang=lang)
sf.write(a_.out, a, sr); print(f"{voice} {lang} x{speed}: {len(a)/sr:.2f} s ->", a_.out)
