# Stickman & the Secret Door: 28 segments, each starts exactly at its timestamp, total 180.000 s. Kokoro bm_george.
# Each segment is spoken sentence by sentence with dramatic pauses between sentences; if it does not fit its slot
# the pauses shrink first, then the speed rises. ALL-CAPS words are written in lowercase so Kokoro does not spell them.
import numpy as np, soundfile as sf, json, sys, re
from kokoro_onnx import Kokoro
V = json.load(open("assets/voice/VOICE.json")); k = Kokoro(V["model"], V["voices_file"])
def ts(s): m, x = s.split(":"); return int(m) * 60 + int(x)
SEG = [l.split("|") for l in open(sys.argv[1]).read().strip().splitlines()]
SR = 24000; out = np.zeros(180 * SR, np.float32); BASE = 0.95
def say(t, sp):
    a, _ = k.create(t, voice="bm_george", speed=sp, lang="en-gb")
    i = np.where(np.abs(a) > 0.01)[0]; return a[max(0, i[0] - 120): i[-1] + 1200]
for t0s, t1s, text in SEG:
    t0, t1 = ts(t0s), ts(t1s); room = t1 - t0 - 0.25
    sents = [s for s in re.split(r"(?<=[.!?])\s+(?=[A-Z])", text.strip()) if s]
    # a one-word exclamation ("Crack!") alone comes out weak in Kokoro -> speak it together with the next sentence
    i = 0
    while i < len(sents) - 1:
        if len(sents[i].split()) == 1: sents[i:i + 2] = [sents[i] + " " + sents[i + 1]]
        else: i += 1
    sp = BASE
    while True:
        parts = [say(s, sp) for s in sents]; speech = sum(len(p) for p in parts) / SR
        gap = min(0.7, (room - speech) / max(1, len(parts) - 1)) if len(parts) > 1 else 0
        if gap >= 0.2 or (len(parts) == 1 and speech <= room) or sp >= 1.3: break
        sp += 0.05
    gap = max(gap, 0.15); g = np.zeros(int(gap * SR), np.float32)
    seg = np.concatenate([x for p in parts for x in (p, g)][:-1]) if len(parts) > 1 else parts[0]
    s = t0 * SR; out[s:s + len(seg)] += seg[: len(out) - s]
    print(f"{t0s}-{t1s}  {len(seg)/SR:5.2f}/{t1-t0:2d} s  speed {sp:.2f}  pause {gap if len(parts)>1 else 0:.2f}  {text[:50]}")
sf.write(sys.argv[2], out, SR, subtype="FLOAT")
