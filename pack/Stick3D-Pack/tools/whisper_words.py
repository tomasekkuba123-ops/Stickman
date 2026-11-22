#!/usr/bin/env python3
"""usage: whisper_words.py voice.wav words.json [model=base.en]
Whisper (faster-whisper) word timestamps -> [{"w","s","e"}]. Audio is decoded with ffmpeg (PyAV in this image is incompatible)."""
import sys, json, subprocess, numpy as np
from faster_whisper import WhisperModel
src, out = sys.argv[1], sys.argv[2]; model = sys.argv[3] if len(sys.argv) > 3 else "base.en"
pcm = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", src, "-ar", "16000", "-ac", "1", "-f", "f32le", "-"], capture_output=True, check=True).stdout
a = np.frombuffer(pcm, np.float32)
segs, _ = WhisperModel(model, device="cpu", compute_type="int8").transcribe(a, word_timestamps=True)
words = [{"w": w.word.strip(), "s": round(w.start, 3), "e": round(w.end, 3)} for s in segs for w in s.words]
json.dump(words, open(out, "w"), indent=1); print(len(words), "words ->", out)
