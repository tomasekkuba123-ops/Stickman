#!/usr/bin/env python3
"""v21 (EP14) synthesized SFX -> sfx/: snore, gallop, spring, sing (toothbrush la-la melody), splat. Own synthesis (numpy), no downloads.
usage: python3 tools/make_sfx_bed.py"""
import os, numpy as np, soundfile as sf
SR = 48000
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "sfx")
rng = np.random.default_rng(14)
def t_(d): return np.arange(int(SR * d)) / SR
def env(n, a=0.005, r=0.1):
    e = np.ones(n); na, nr = max(1, int(a * SR)), max(1, int(r * SR)); e[:na] = np.linspace(0, 1, na); e[-nr:] *= np.linspace(1, 0, nr) ** 2; return e
def lp(x, k):
    y = np.zeros_like(x); a = 0.0
    for i, v in enumerate(x): a += k * (v - a); y[i] = a
    return y
def save(name, x):
    x = x / (np.abs(x).max() + 1e-9) * 0.89; sf.write(os.path.join(OUT, name + ".wav"), np.stack([x, x], 1), SR, subtype="PCM_16"); print(name, round(len(x) / SR, 2), "s")

# snore: two breaths, rough low buzz on the inhale, airy whistle on the exhale
def snore():
    parts = []
    for _ in range(2):
        t = t_(0.9); f = 70 + 15 * np.sin(t * 3); ph = 2 * np.pi * np.cumsum(f) / SR
        buzz = np.sign(np.sin(ph)) * 0.5 + np.sin(ph * 2) * 0.3; buzz *= 0.6 + 0.4 * rng.standard_normal(len(t)).clip(-1, 1)
        inh = lp(buzz, 0.08) * np.sin(np.pi * t / 0.9) ** 1.5
        t2 = t_(0.8); ex = lp(rng.standard_normal(len(t2)), 0.15) * 0.5 + 0.25 * np.sin(2 * np.pi * (900 - 300 * t2) * t2); ex *= np.sin(np.pi * t2 / 0.8) ** 2 * 0.6
        parts += [inh, np.zeros(int(0.1 * SR)), ex, np.zeros(int(0.25 * SR))]
    return np.concatenate(parts)
# gallop: wooden clip-clop pattern (da-da-DUM) x2
def gallop():
    def clop(f, a=1.0):
        t = t_(0.09); return a * (np.sin(2 * np.pi * f * t) * np.exp(-t * 60) + lp(rng.standard_normal(len(t)), 0.4) * np.exp(-t * 120) * 0.6)
    out = np.zeros(int(1.0 * SR))
    for k, (dt, f, a) in enumerate([(0, 520, 0.7), (0.09, 470, 0.8), (0.2, 380, 1.0), (0.5, 520, 0.7), (0.59, 470, 0.8), (0.7, 380, 1.0)]):
        c = clop(f, a); s = int(dt * SR); out[s:s + len(c)] += c
    return out
# spring: bed-spring boing with metallic ring
def spring():
    t = t_(0.7); f = 180 + 260 * np.exp(-t * 6) + 30 * np.sin(2 * np.pi * 9 * t) * np.exp(-t * 3)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 5) + 0.3 * np.sin(2 * np.pi * 2300 * t) * np.exp(-t * 9) * np.sin(2 * np.pi * 11 * t)
    return x * env(len(t), 0.003, 0.2)
# sing: cheerful 8-note la-la melody, vocal-ish (vibrato + formant-ish harmonics), ~2.6 s
def sing():
    notes = [(72, .28), (76, .28), (79, .28), (84, .5), (81, .28), (79, .28), (76, .3), (79, .55)]; parts = []
    for m, d in notes:
        t = t_(d); f = 440 * 2 ** ((m - 69) / 12) * (1 + 0.012 * np.sin(2 * np.pi * 6 * t) * np.clip(t / 0.1, 0, 1)); ph = 2 * np.pi * np.cumsum(f) / SR
        x = np.sin(ph) + 0.45 * np.sin(2 * ph) + 0.25 * np.sin(3 * ph) + 0.12 * np.sin(4 * ph); parts.append(x * env(len(t), 0.03, 0.08) * 0.9)
    return np.concatenate(parts)
# splat: soft body hitting the ceiling
def splat():
    t = t_(0.45); x = lp(rng.standard_normal(len(t)), 0.12) * np.exp(-t * 14) + 0.8 * np.sin(2 * np.pi * (90 - 40 * t) * t) * np.exp(-t * 10)
    return x * env(len(t), 0.002, 0.15)
for n, f in [("snore", snore), ("gallop", gallop), ("spring", spring), ("sing", sing), ("splat", splat)]: save(n, f())
