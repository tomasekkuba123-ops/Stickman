import numpy as np, soundfile as sf, json, sys
from kokoro_onnx import Kokoro
V = json.load(open("assets/voice/VOICE.json")); k = Kokoro(V["model"], V["voices_file"])
L = ["Bloxie was having a perfectly normal day.", "Until the floor turned into lava!", "Quick, Bloxie! Jump!",
     "Just one more jump. You can do it!", "Oh no! A wooden bridge!", "It's falling apart! Run, Bloxie, run!",
     "Phew! That was close.", "Wait! Is that a reset button?", "It worked!", "Finally, he's safe.",
     "A duck? What's it doing here?", "No, duck! Don't touch that!", "Oh no! Not again!"]
SR = 24000; GAP = int(0.45 * SR); parts = []; t = 0.0
for i, s in enumerate(L):
    a, _ = k.create(s, voice="bm_george", speed=1.05, lang="en-gb")
    idx = np.where(np.abs(a) > 0.01)[0]; a = a[max(0, idx[0] - 120): idx[-1] + 2400]
    print(f"{i+1:2d}  {t:6.2f} s  {len(a)/SR:4.2f} s  {s}"); parts += [a, np.zeros(GAP, np.float32)]; t += (len(a) + GAP) / SR
out = np.concatenate(parts[:-1] + [np.zeros(int(0.3 * SR), np.float32)])
sf.write(sys.argv[1], out, SR, subtype="FLOAT"); print("total", round(len(out) / SR, 2), "s")
