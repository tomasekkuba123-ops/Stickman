# 12 lines, each starts exactly at its timestamp and must end before the next one; total 35.000 s. Kokoro bm_george.
import numpy as np, soundfile as sf, json, sys
from kokoro_onnx import Kokoro
V = json.load(open("assets/voice/VOICE.json")); k = Kokoro(V["model"], V["voices_file"])
L = [(0.0, 2.4, "Bloxie broke gravity!"), (2.4, 5.2, "It all started with one mysterious button."),
     (5.2, 7.0, "Just one little push."), (7.0, 11.0, "Oh no! Everything started floating!"),
     (11.0, 14.0, "Quick! Grab the lamp!"), (14.0, 17.0, "Wait... a flying crate?"),
     (17.0, 20.0, "Bloxie jumped!"), (20.0, 23.5, "He rode it straight back to the button."),
     (23.5, 26.0, "Come on! Switch it off!"), (26.0, 29.0, "Phew! Finally safe."),
     (29.0, 32.0, "Wait... what's that cat doing?"), (32.0, 35.0, "Oh no! Not again!")]
SR = 24000; out = np.zeros(35 * SR, np.float32)
for t0, t1, txt in L:
    room = t1 - t0 - 0.12; sp = 1.05
    while True:
        a, _ = k.create(txt, voice="bm_george", speed=sp, lang="en-gb")
        idx = np.where(np.abs(a) > 0.01)[0]; a = a[max(0, idx[0] - 120): idx[-1] + 2400]
        if len(a) / SR <= room or sp >= 1.35: break
        sp += 0.05
    s = int(round(t0 * SR)); out[s:s + len(a)] += a[: len(out) - s]
    print(f"{t0:5.1f}-{t1:4.1f}  len {len(a)/SR:.2f}/{t1-t0:.1f} s  speed {sp:.2f}  {txt}")
sf.write(sys.argv[1], out, SR, subtype="FLOAT")
