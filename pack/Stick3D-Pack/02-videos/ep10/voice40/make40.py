import numpy as np, soundfile as sf, json, sys
from kokoro_onnx import Kokoro
V = json.load(open("assets/voice/VOICE.json"))
k = Kokoro(V["model"], V["voices_file"])
L = ["What if Stickman lived in the Stone Age?", "He woke up inside a freezing cave.",
     "Outside, a giant mammoth was blocking his path.", "Stickman offered him a delicious apple.",
     "They quickly became best friends.", "But walking everywhere was exhausting.",
     "So Stickman invented the very first wheel.", "Then he built a wooden car.",
     "The mammoth jumped in, and they raced downhill.",
     "Everything was perfect... until they invented the first traffic jam!"]
SR = 24000; out = np.zeros(40 * SR, np.float32); rep = []
for i, t in enumerate(L):
    sp = 1.15 if i == 9 else 1.05
    while True:
        a, sr = k.create(t, voice="bm_george", speed=sp, lang="en-gb")
        env = np.abs(a) > 0.01; idx = np.where(env)[0]
        a = a[max(0, idx[0] - 120): idx[-1] + 2400]  # trim lead, keep natural 0.1 s tail
        if len(a) / SR <= 3.95 or sp >= 1.3: break
        sp += 0.05
    s = i * 4 * SR; out[s:s + len(a)] += a[: len(out) - s]
    rep.append((i * 4, round(len(a) / SR, 2), sp))
sf.write(sys.argv[1], out, SR, subtype="FLOAT")
for r in rep: print("start %2d s  len %.2f s  speed %.2f" % r)
