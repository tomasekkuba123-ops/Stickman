# 10 lines, each starts exactly on its 4 s mark, total 40.000 s. Kokoro bm_george.
import numpy as np, soundfile as sf, json, sys
from kokoro_onnx import Kokoro
V = json.load(open("assets/voice/VOICE.json")); k = Kokoro(V["model"], V["voices_file"])
L = ["Bloxie found a portal that wasn't supposed to exist.", "So, of course, he jumped in!", "A whole new world!",
     "And a mysterious glowing crystal.", "But something was guarding it.",
     "Uh, oh. Run, Bloxie!",  # Kokoro merges "Uh-oh" into "Oh"; this spelling is heard as "Uh-oh". "RUN" lowercase so it is not spelled R-U-N
     "One jump. Two jumps. Almost there!", "The crystal opened a portal back home.",
     "Wait... where did that egg come from?", "Oh great. Now he has a dragon!"]
SR = 24000; out = np.zeros(40 * SR, np.float32)
for i, t in enumerate(L):
    sp = 1.05
    while True:
        a, _ = k.create(t, voice="bm_george", speed=sp, lang="en-gb")
        idx = np.where(np.abs(a) > 0.01)[0]; a = a[max(0, idx[0] - 120): idx[-1] + 2400]
        if len(a) / SR <= 3.9 or sp >= 1.3: break
        sp += 0.05
    s = i * 4 * SR; out[s:s + len(a)] += a[: len(out) - s]
    print(f"{i*4:2d} s  len {len(a)/SR:.2f} s  speed {sp:.2f}  {t}")
sf.write(sys.argv[1], out, SR, subtype="FLOAT")
