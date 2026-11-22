#!/usr/bin/env python3
"""Synthesized nature SFX (own work, no downloads): sfx/owl_hoot.wav, sfx/wolf_howl.wav, sfx/ocean_wave.wav. 48 kHz mono."""
import wave, numpy as np, os
SR = 48000; OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "sfx"); rng = np.random.default_rng(9)
def save(n, y): y = y / (np.abs(y).max() + 1e-9) * 0.7; w = wave.open(os.path.join(OUT, n), "w"); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((y * 32767).astype(np.int16).tobytes()); w.close()
def env(t, a, d, T): return np.clip(t / a, 0, 1) * np.clip((T - t) / d, 0, 1)
# owl: two soft "hoo" notes (sine + breathy noise, slight downward glide)
T = 1.3; t = np.arange(int(SR * T)) / SR; y = np.zeros_like(t)
for st, du, f0 in [(0.0, 0.32, 420), (0.48, 0.7, 400)]:
    u = t - st; m = (u >= 0) & (u < du); f = f0 * (1 - 0.06 * np.clip(u / du, 0, 1)); ph = 2 * np.pi * np.cumsum(f) / SR
    y += m * env(np.clip(u, 0, None), 0.06, 0.18, du) * (np.sin(ph) + 0.25 * np.sin(2 * ph) + 0.08 * rng.standard_normal(len(t)))
save("owl_hoot.wav", y)
# wolf: rising then falling howl with vibrato
T = 2.4; t = np.arange(int(SR * T)) / SR; f = 380 + 260 * np.sin(np.pi * np.clip(t / 2.2, 0, 1)) ** 0.7 + 8 * np.sin(2 * np.pi * 5.5 * t); ph = 2 * np.pi * np.cumsum(f) / SR
y = env(t, 0.25, 0.6, T) * (np.sin(ph) + 0.35 * np.sin(2 * ph) + 0.12 * np.sin(3 * ph) + 0.05 * rng.standard_normal(len(t))); save("wolf_howl.wav", y)
# ocean wave: low-passed noise swell + foam hiss
T = 3.0; t = np.arange(int(SR * T)) / SR; n = rng.standard_normal(len(t)); lo = np.convolve(n, np.ones(220) / 220, "same"); hi = n - np.convolve(n, np.ones(12) / 12, "same")
sw = np.sin(np.pi * np.clip(t / T, 0, 1)) ** 1.5; foam = np.clip((t - 1.2) / 0.3, 0, 1) * np.clip((T - t) / 1.4, 0, 1)
save("ocean_wave.wav", lo * sw * 6 + hi * foam * 0.35)
print("ok")
