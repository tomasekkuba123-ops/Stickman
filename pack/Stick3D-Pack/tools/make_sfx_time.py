#!/usr/bin/env python3
"""Synthesized SFX (own work, no samples): tape_stop (world freezes), tape_start (world restarts), bark (small dog), bonk (cartoon head bump).
usage: make_sfx_time.py [sfx_dir=sfx]"""
import sys, os, numpy as np, soundfile as sf
from scipy import signal
SR = 48000; out = sys.argv[1] if len(sys.argv) > 1 else "sfx"; rng = np.random.default_rng(10)
def save(n, x): x = x / (np.abs(x).max() + 1e-9) * 0.89; sf.write(os.path.join(out, n + ".wav"), x.astype(np.float32), SR); print(n, f"{len(x)/SR:.2f}s")
def env(n, a=0.005, r=0.05):
    e = np.ones(n); ai, ri = int(a * SR), int(r * SR); e[:ai] = np.linspace(0, 1, ai); e[-ri:] *= np.linspace(1, 0, ri); return e
def chord_sweep(d, f0, f1, curve):
    t = np.arange(int(d * SR)) / SR; k = (t / d) ** curve; f = f0 + (f1 - f0) * k; ph = 2 * np.pi * np.cumsum(f) / SR
    x = sum(a * signal.sawtooth(ph * m) for m, a in [(1, 1), (1.5, 0.5), (2, 0.35)]); return signal.sosfilt(signal.butter(2, 2400, fs=SR, output="sos"), x)
# tape stop: music-like chord slowing to a halt (pitch + low-pass fall)
x = chord_sweep(0.75, 440, 40, 0.6); x *= np.linspace(1, 0.2, len(x)) * env(len(x), 0.002, 0.08); save("tape_stop", x)
# tape start: rising back up to speed
x = chord_sweep(0.6, 40, 440, 1.6); x *= np.linspace(0.3, 1, len(x)) * env(len(x), 0.02, 0.05); save("tape_start", x)
# bark: two short barks, formant-filtered pulse + noise
def bark(d=0.16, f=520):
    t = np.arange(int(d * SR)) / SR; f0 = f * (1 + 0.5 * np.exp(-t * 30)); src = signal.square(2 * np.pi * np.cumsum(f0) / SR, 0.3) + 0.4 * rng.standard_normal(len(t))
    y = sum(signal.sosfilt(signal.butter(2, [fc * 0.8, fc * 1.2], "band", fs=SR, output="sos"), src) * g for fc, g in [(700, 1), (1500, 0.6), (2600, 0.3)])
    return y * np.exp(-t * 14) * env(len(t), 0.004, 0.03)
b = bark(); x = np.concatenate([b, np.zeros(int(0.09 * SR)), bark(0.14, 560)]); save("bark", x)
# bonk: hollow wooden knock + tiny metallic ring (head hits a pole)
t = np.arange(int(0.6 * SR)) / SR; x = np.sin(2 * np.pi * 180 * t * (1 + 0.8 * np.exp(-t * 40))) * np.exp(-t * 18) + 0.35 * np.sin(2 * np.pi * 1320 * t) * np.exp(-t * 6) + 0.2 * np.sin(2 * np.pi * 2210 * t) * np.exp(-t * 8)
save("bonk", x * env(len(x), 0.001, 0.05))
