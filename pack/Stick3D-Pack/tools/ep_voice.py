#!/usr/bin/env python3
"""Episode voice in one step (v4 workflow): script lines -> Kokoro channel voice (assets/voice/VOICE.json) line by line
-> joined with pauses -> exact length -> Whisper word timestamps mapped onto the SCRIPT words -> Rhubarb mouth cues.

usage: ep_voice.py <epdir> <seconds> [--pauses "2:0.5,6:0.7"] [--lead 0.25]
  <epdir>/script.txt  one spoken line per row.  --pauses: extra pause AFTER line i (1-based), default gap 0.32 s.
writes <epdir>/: lines/L*.wav, lines.json, VOICE.wav, whisper_words.json, words.json, script.json, mouth.json
and copies words/script/mouth into engine/public/<ep>/ (VOICE.wav too)."""
import argparse, json, os, re, shutil, subprocess, sys, difflib
import numpy as np, soundfile as sf
from scipy.signal import resample_poly
from kokoro_onnx import Kokoro

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ap = argparse.ArgumentParser(); ap.add_argument("epdir"); ap.add_argument("seconds", type=float)
ap.add_argument("--pauses", default=""); ap.add_argument("--lead", type=float, default=0.25); ap.add_argument("--gap", type=float, default=0.32)
a = ap.parse_args()
ep = os.path.abspath(a.epdir); name = os.path.basename(ep); SR = 48000
V = json.load(open(os.path.join(ROOT, "assets/voice/VOICE.json")))
lines = [l.strip() for l in open(os.path.join(ep, "script.txt"), encoding="utf-8") if l.strip()]
extra = {int(k): float(v) for k, v in (x.split(":") for x in a.pauses.split(",") if x)}
k = Kokoro(V["model"], V["voices_file"]); os.makedirs(os.path.join(ep, "lines"), exist_ok=True)

def trim(x, thr=0.006, pad=0.03):
    i = np.where(np.abs(x) > thr)[0]
    return x if len(i) == 0 else x[max(0, i[0] - int(pad * SR)): i[-1] + int(pad * SR)]

out = np.zeros(int(a.seconds * SR), np.float32); t = a.lead; meta = []
for i, l in enumerate(lines, 1):
    au, sr = k.create(l, voice=V["voice"], speed=V["speed"], lang=V["lang"])
    au = trim(resample_poly(np.asarray(au, np.float32), SR, sr).astype(np.float32))
    sf.write(os.path.join(ep, "lines", f"L{i}.wav"), au, SR)
    j = int(t * SR)
    if j + len(au) > len(out): sys.exit(f"too long: line {i} ends at {t + len(au)/SR:.2f}s > {a.seconds}s")
    out[j:j + len(au)] = au; meta.append({"i": i, "t0": round(t, 3), "t1": round(t + len(au) / SR, 3), "text": l})
    t += len(au) / SR + a.gap + extra.get(i, 0)
end = meta[-1]["t1"]
out *= 0.89 / np.abs(out).max()
sf.write(os.path.join(ep, "VOICE.wav"), out, SR, subtype="PCM_16")
json.dump(meta, open(os.path.join(ep, "lines.json"), "w"), indent=1)
print(f"speech {a.lead:.2f}-{end:.2f}s in {a.seconds}s (tail {a.seconds-end:.2f}s)")

# Whisper words -> mapped onto script words (script spelling, Whisper times)
subprocess.run([sys.executable, os.path.join(ROOT, "tools/whisper_words.py"), os.path.join(ep, "VOICE.wav"), os.path.join(ep, "whisper_words.json")], check=True)
ww = json.load(open(os.path.join(ep, "whisper_words.json")))
sw = " ".join(lines).split(); norm = lambda s: re.sub(r"[^a-z0-9']", "", s.lower())
sm = difflib.SequenceMatcher(None, [norm(x) for x in sw], [norm(x["w"]) for x in ww], autojunk=False)
times = [None] * len(sw)
for tag, i1, i2, j1, j2 in sm.get_opcodes():
    if tag == "equal":
        for d in range(i2 - i1): times[i1 + d] = (ww[j1 + d]["s"], ww[j1 + d]["e"])
    elif tag == "replace" and j2 > j1:  # spread the whisper span over the script words
        s0, e0 = ww[j1]["s"], ww[j2 - 1]["e"]; n = i2 - i1
        for d in range(n): times[i1 + d] = (s0 + (e0 - s0) * d / n, s0 + (e0 - s0) * (d + 1) / n)
miss = [i for i, x in enumerate(times) if x is None]
for i in miss:  # interpolate from neighbours
    p = next((times[j][1] for j in range(i - 1, -1, -1) if times[j]), a.lead); q = next((times[j][0] for j in range(i + 1, len(sw)) if times[j]), end)
    times[i] = (p, q)
words = [{"word": w, "start": round(s, 3), "end": round(e, 3)} for w, (s, e) in zip(sw, times)]
match = sum(1 for tag, i1, i2, *_ in sm.get_opcodes() if tag == "equal" for _ in range(i2 - i1)) / len(sw)
json.dump(words, open(os.path.join(ep, "words.json"), "w"), indent=0); json.dump(sw, open(os.path.join(ep, "script.json"), "w"))
print(f"words: {len(sw)} script / {len(ww)} whisper, exact match {match*100:.1f} %, interpolated {len(miss)}")

# Rhubarb lip sync (dialog = script text helps recognition)
rb = "/opt/tools/Rhubarb-Lip-Sync-1.14.0-Linux/rhubarb"; dlg = os.path.join(ep, "_dialog.txt"); open(dlg, "w").write(" ".join(lines))
subprocess.run([rb, "-f", "json", "--extendedShapes", "GHX", "-d", dlg, "-o", os.path.join(ep, "mouth.json"), os.path.join(ep, "VOICE.wav")], check=True, capture_output=True)
os.remove(dlg)
pub = os.path.join(ROOT, "engine/public", name); os.makedirs(pub, exist_ok=True)
for f in ("words.json", "script.json", "mouth.json"): shutil.copy(os.path.join(ep, f), pub)
print("mouth cues:", len(json.load(open(os.path.join(ep, "mouth.json")))["mouthCues"]), "-> engine/public/" + name)
