#!/usr/bin/env python3
"""Creates the channel's SIGNATURE "magic pencil" sound: sfx/magic_pencil.wav (~1.1 s).
A quick graphite scribble (3 filtered-noise strokes) that turns into a rising sparkle chime (C6-E6-G6-C7 bells + shimmer).
Use it in EVERY episode the first time Stickman's pencil draws something magic (mix_episode.py adds it if it is missing)."""
import wave, numpy as np, os
SR = 48000; T = 1.15; t = np.arange(int(SR * T)) / SR; y = np.zeros_like(t); rng = np.random.default_rng(7)
for k, (a, d) in enumerate([(0.0, 0.11), (0.13, 0.1), (0.25, 0.14)]):  # scribble strokes
    n = rng.standard_normal(len(t)); n = np.convolve(n, np.ones(6) / 6, "same") - np.convolve(n, np.ones(60) / 60, "same")  # band-pass-ish
    env = np.clip((t - a) / 0.01, 0, 1) * np.clip((a + d - t) / 0.03, 0, 1); y += n * env * (0.55 + 0.4 * np.sin(2 * np.pi * (28 + 10 * k) * t))
for k, f in enumerate([1046.5, 1318.5, 1568.0, 2093.0]):  # bell chime
    st = 0.34 + k * 0.08; u = np.clip(t - st, 0, None); on = t >= st
    y += on * 0.32 * np.exp(-u * 5) * (np.sin(2 * np.pi * f * u) + 0.4 * np.sin(2 * np.pi * f * 2.76 * u) * np.exp(-u * 9))
sh = np.zeros_like(t)  # shimmer
for i in range(40):
    st = 0.4 + rng.random() * 0.6; f = 3000 + rng.random() * 4000; u = np.clip(t - st, 0, None); sh += (t >= st) * np.sin(2 * np.pi * f * u) * np.exp(-u * 30) * 0.06
y += sh; y = y / np.abs(y).max() * 10 ** (-3 / 20)
out = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "sfx", "magic_pencil.wav")
w = wave.open(out, "wb"); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((y * 32767).astype(np.int16).tobytes()); w.close(); print("wrote", out)
