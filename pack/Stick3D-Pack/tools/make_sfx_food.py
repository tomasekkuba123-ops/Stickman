#!/usr/bin/env python3
"""v20 (EP12) synthesized food/creature SFX -> sfx/: chomp, gulp, crunch, burp, sniff, boing, tap. Own synthesis (numpy), no downloads.
usage: python3 tools/make_sfx_food.py"""
import os, wave, numpy as np

SR = 48000
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "sfx")
rng = np.random.default_rng(12)


def t_(d): return np.arange(int(SR * d)) / SR


def env(n, a=0.005, r=0.1):
    e = np.ones(n); na, nr = max(1, int(a * SR)), max(1, int(r * SR))
    e[:na] = np.linspace(0, 1, na); e[-nr:] *= np.linspace(1, 0, nr) ** 2; return e


def lp(x, k):  # one-pole lowpass, k = 0..1 (smaller = darker)
    y = np.zeros_like(x); a = 0.0
    for i, v in enumerate(x): a += k * (v - a); y[i] = a
    return y


def bp(x, f, q=6):  # crude band-pass via resonator
    w = 2 * np.pi * f / SR; r = 1 - w / q; y = np.zeros_like(x); y1 = y2 = 0.0
    c1, c2 = 2 * r * np.cos(w), -r * r
    for i, v in enumerate(x): y0 = v * (1 - r) + c1 * y1 + c2 * y2; y[i] = y0; y2, y1 = y1, y0
    return y


def save(name, y, width=200):
    y = y / (np.abs(y).max() + 1e-9) * 0.85
    st = np.stack([y, np.roll(y, width)], 1)
    w = wave.open(os.path.join(OUT, name + ".wav"), "wb"); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((st * 32767).astype(np.int16).tobytes()); w.close(); print(name, f"{len(y) / SR:.2f}s")


def chomp():  # wet bite: low thump + short filtered noise snap, twice (jaw closes, chews)
    out = np.zeros(int(SR * 0.55))
    for t0, g in [(0.0, 1.0), (0.24, 0.6)]:
        n = int(SR * 0.18); tt = t_(0.18)
        thump = np.sin(2 * np.pi * (140 - 260 * tt) * tt) * np.exp(-tt * 28)
        snap = bp(rng.standard_normal(n), 1800, 4) * np.exp(-tt * 45) * 2.2
        i = int(t0 * SR); out[i:i + n] += g * (thump + snap)
    return out


def gulp():  # throat swallow: falling pitched blob with a soft click
    tt = t_(0.42); f = 420 * np.exp(-tt * 4.2) + 90
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * np.clip(tt / 0.42, 0, 1)) ** 0.7
    y += 0.5 * bp(rng.standard_normal(len(tt)), 600, 3) * np.exp(-((tt - 0.05) / 0.02) ** 2)
    return y


def crunch():  # cookie crunch: dense bursts of bright crackle over a short decay
    tt = t_(0.7); y = np.zeros(len(tt))
    for k in range(70):
        c = rng.uniform(0, 0.5) ** 1.3; i = int(c * SR); n = int(SR * rng.uniform(0.004, 0.018))
        if i + n >= len(y): continue
        y[i:i + n] += rng.standard_normal(n) * np.exp(-np.linspace(0, 6, n)) * rng.uniform(0.4, 1.0) * np.exp(-c * 3)
    y = bp(y, 3000, 2.5) + 0.6 * y
    tl = t_(0.12); y[:len(tl)] += np.sin(2 * np.pi * 110 * tl) * np.exp(-tl * 30) * 0.8
    return y


def burp():  # cartoon burp: low buzzy voice with formant wobble
    tt = t_(0.85); f0 = 92 + 18 * np.sin(2 * np.pi * 5.5 * tt) - 25 * tt
    ph = 2 * np.pi * np.cumsum(f0) / SR; saw = (ph / (2 * np.pi)) % 1 * 2 - 1
    y = bp(saw, 420 + 120 * np.sin(2 * np.pi * 3 * tt[0] + 0), 3) + 0.7 * bp(saw, 900, 4)
    y *= env(len(tt), 0.03, 0.25) * (0.75 + 0.25 * np.sin(2 * np.pi * 11 * tt))
    return y + 0.15 * lp(rng.standard_normal(len(tt)), 0.2) * env(len(tt), 0.02, 0.3)


def sniff():  # two quick nose sniffs: band-passed noise puffs
    out = np.zeros(int(SR * 0.5))
    for t0 in (0.0, 0.2):
        n = int(SR * 0.14); tt = t_(0.14)
        s = bp(rng.standard_normal(n), 2600, 2) * np.sin(np.pi * tt / 0.14) ** 1.5
        i = int(t0 * SR); out[i:i + n] += s
    return out


def boing():  # spring hop: rising-then-wobbling sine with vibrato
    tt = t_(0.45); f = 180 + 260 * (1 - np.exp(-tt * 18)) + 40 * np.sin(2 * np.pi * 14 * tt) * np.exp(-tt * 4)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 6) * env(len(tt), 0.004, 0.08)


def tap():  # sneaker tap: tight wooden click
    tt = t_(0.12); return (np.sin(2 * np.pi * 900 * tt) * 0.6 + bp(rng.standard_normal(len(tt)), 3500, 3)) * np.exp(-tt * 70)


if __name__ == "__main__":
    for name, fn in [("chomp", chomp), ("gulp", gulp), ("crunch", crunch), ("burp", burp), ("sniff", sniff), ("boing", boing), ("tap", tap)]:
        save(name, fn())
