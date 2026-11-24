#!/usr/bin/env python3
"""EP10 synth SFX (own work, no downloads): quack, lava_bubble, sizzle, creak, snap, button. 48 kHz mono -> sfx/."""
import numpy as np, soundfile as sf, os
SR = 48000; R = np.random.default_rng(10); OUT = os.path.join(os.path.dirname(__file__), "..", "sfx")
def env(n, a, d): t = np.arange(n) / SR; return np.minimum(1, t / a) * np.exp(-t / d)
def save(name, x): x = x / (np.abs(x).max() + 1e-9) * 0.89; sf.write(os.path.join(OUT, name + ".wav"), x.astype(np.float32), SR, subtype="PCM_16"); print(name, f"{len(x)/SR:.2f}s")
def lp(x, k):
    y = np.zeros_like(x); a = 0.0
    for i, v in enumerate(x): a += k * (v - a); y[i] = a
    return y
# quack: buzzy pulse (~420 Hz with a pitch drop) through two nasal formants
n = int(0.32 * SR); t = np.arange(n) / SR; f0 = 440 - 160 * t / 0.32; ph = np.cumsum(f0) / SR
src = (np.mod(ph, 1) < 0.22).astype(float) - 0.22
y = np.zeros(n)
for fc, bw, g in [(1100, 160, 1.0), (2300, 260, 0.6), (650, 140, 0.5)]:
    w = 2 * np.pi * fc / SR; r = np.exp(-np.pi * bw / SR); a1, a2 = -2 * r * np.cos(w), r * r; o = np.zeros(n)
    for i in range(n): o[i] = src[i] - a1 * (o[i-1] if i else 0) - a2 * (o[i-2] if i > 1 else 0)
    y += g * o
save("quack", y * env(n, 0.01, 0.12) * (1 - np.exp(-(0.32 - t) * 40)))
# lava bubble: low "blorp" (rising sine blip) + soft pop
n = int(0.4 * SR); t = np.arange(n) / SR
save("lava_bubble", np.sin(2 * np.pi * np.cumsum(70 + 260 * (t / 0.4) ** 2) / SR) * env(n, 0.03, 0.12) + 0.25 * R.standard_normal(n) * env(n, 0.001, 0.01))
# sizzle: band-limited crackly noise bed, 2.5 s, loop-friendly fades
n = int(2.5 * SR); nz = R.standard_normal(n); hi = nz - lp(nz, 0.25); cr = (R.random(n) < 0.004) * R.standard_normal(n) * 6
x = lp(hi * 0.4 + cr, 0.6); f = np.minimum(1, np.minimum(np.arange(n), n - np.arange(n)) / (0.3 * SR)); save("sizzle", x * f)
# creak: slow scraping friction (pulse train with wobbling rate) through a wood resonance
n = int(0.9 * SR); t = np.arange(n) / SR; rate = 38 + 22 * np.sin(2 * np.pi * 1.7 * t) + 15 * t; ph = np.cumsum(rate) / SR
p = (np.diff(np.floor(ph), prepend=0) > 0).astype(float) * (0.6 + 0.4 * R.random(n))
y = np.zeros(n)
for fc, g in [(420, 1), (980, 0.5), (1700, 0.3)]:
    w = 2 * np.pi * fc / SR; r = 0.995; a1, a2 = -2 * r * np.cos(w), r * r; o = np.zeros(n)
    for i in range(n): o[i] = p[i] - a1 * (o[i-1] if i else 0) - a2 * (o[i-2] if i > 1 else 0)
    y += g * o
save("creak", y * np.sin(np.pi * t / 0.9) ** 0.5)
# snap: wood crack = sharp noise burst + short low thump
n = int(0.35 * SR); t = np.arange(n) / SR; save("snap", R.standard_normal(n) * env(n, 0.0005, 0.025) + 0.8 * np.sin(2 * np.pi * 120 * t) * env(n, 0.002, 0.06))
# button: plastic click + low "thunk" + a short rising electronic blip
n = int(0.5 * SR); t = np.arange(n) / SR
save("button", R.standard_normal(n) * env(n, 0.0003, 0.006) + 0.9 * np.sin(2 * np.pi * 95 * t) * env(n, 0.002, 0.08) + 0.35 * np.sin(2 * np.pi * np.cumsum(600 + 900 * t / 0.5) / SR) * np.where(t > 0.08, env(n, 0.01, 0.15), 0))
