# EP14 voice, same layout as EP11/EP12: one Kokoro take per line (channel voice from VOICE.json, am_michael),
# first line at 0.3 s, 0.6 s between lines. ALL-CAPS words are spoken lowercase so Kokoro doesn't spell them.
# Writes VOICE.wav (24 kHz), lines/L<n>.wav, lines.json [{i,t0,t1}].
import numpy as np, soundfile as sf, json, os, re, sys
from kokoro_onnx import Kokoro
D = os.path.dirname(os.path.abspath(__file__)); V = json.load(open(os.path.join(D, "../../assets/voice/VOICE.json")))
k = Kokoro(V["model"], V["voices_file"]); SR = 24000
L = [l.strip() for l in open(os.path.join(D, "script.txt")) if l.strip()]
out = [np.zeros(int(0.3 * SR), np.float32)]; t = 0.3; meta = []
for i, line in enumerate(L, 1):
    say = re.sub(r"\b[A-Z]{2,}\b", lambda m: m.group(0).lower(), line)
    a, _ = k.create(say, voice=V["voice"], speed=V["speed"], lang=V["lang"])
    idx = np.where(np.abs(a) > 0.01)[0]; a = a[max(0, idx[0] - 120): idx[-1] + 2400]
    sf.write(os.path.join(D, f"lines/L{i}.wav"), a, SR)
    meta.append({"i": i, "t0": round(t, 2), "t1": round(t + len(a) / SR, 2)}); print(meta[-1], line)
    out += [a, np.zeros(int(0.6 * SR), np.float32)]; t += len(a) / SR + 0.6
v = np.concatenate(out[:-1] + [np.zeros(int(0.3 * SR), np.float32)])
sf.write(os.path.join(D, "VOICE.wav"), v, SR); json.dump(meta, open(os.path.join(D, "lines.json"), "w"), indent=1)
print("VOICE.wav", round(len(v) / SR, 2), "s")
