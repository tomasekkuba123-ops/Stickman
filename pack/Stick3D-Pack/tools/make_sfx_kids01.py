#!/usr/bin/env python3
"""KIDS EP01 synth SFX (own work, no downloads): sneeze_burst, boing, flutter, tickle, shrink, grow. 48 kHz mono -> sfx/."""
import numpy as np, soundfile as sf, os
SR = 48000; R = np.random.default_rng(101); OUT = os.path.join(os.path.dirname(__file__), "..", "sfx")
def env(n, a, d): t = np.arange(n) / SR; return np.minimum(1, t / a) * np.exp(-t / d)
def save(name, x): x = x / (np.abs(x).max() + 1e-9) * 0.89; sf.write(os.path.join(OUT, name + ".wav"), x.astype(np.float32), SR, subtype="PCM_16"); print(name, f"{len(x)/SR:.2f}s")
def lp(x, k):
    y = np.zeros_like(x); a = 0.0
    for i, v in enumerate(x): a += k * (v - a); y[i] = a
    return y
def sweep(f0, f1, dur, shape=1.0): t = np.arange(int(dur * SR)) / SR; f = f0 + (f1 - f0) * (t / dur) ** shape; return np.sin(2 * np.pi * np.cumsum(f) / SR)
# sneeze_burst: sharp breathy air blast (band noise, fast attack) — sits under the voiced "Achoo!"
n = int(0.5 * SR); nz = R.standard_normal(n); b = lp(nz, 0.35) - lp(nz, 0.04); save("sneeze_burst", b * env(n, 0.008, 0.11))
# boing: spring — sine with a wobbling, falling pitch
n = int(0.7 * SR); t = np.arange(n) / SR; f = 180 + 260 * np.exp(-t * 6) * (1 + 0.35 * np.sin(2 * np.pi * 18 * t))
save("boing", np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.004, 0.25))
# flutter: insect wing flutter — noise amplitude-modulated at ~60 Hz, 1.2 s, soft fades
n = int(1.2 * SR); t = np.arange(n) / SR; nz = lp(R.standard_normal(n), 0.3); am = 0.5 + 0.5 * np.sin(2 * np.pi * 62 * t)
fade = np.minimum(1, np.minimum(t / 0.15, (1.2 - t) / 0.3)); save("flutter", nz * am * fade + 0.3 * np.sin(2 * np.pi * 124 * t) * am * fade)
# tickle: light rising chirps (three tiny blips)
x = np.concatenate([np.concatenate([sweep(1800 + 300 * i, 2600 + 300 * i, 0.07) * env(int(0.07 * SR), 0.005, 0.03), np.zeros(int(0.05 * SR))]) for i in range(3)]); save("tickle", x)
# shrink: falling cartoon slide-whistle; grow: rising
s = sweep(1400, 260, 0.6, 0.7); save("shrink", s * env(len(s), 0.01, 0.5)); g = sweep(260, 1400, 0.6, 1.4); save("grow", g * env(len(g), 0.01, 0.5))
