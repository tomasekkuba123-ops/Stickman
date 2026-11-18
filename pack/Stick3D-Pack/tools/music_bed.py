#!/usr/bin/env python3
"""usage: music_bed.py sections.json out.wav duration
Procedural music bed (no samples). sections.json = [{"t":0,"mood":"playful"}, {"t":23.4,"mood":"soar"}, ...]
moods: playful | soar | tense | quirky | mystery | warm. Sections crossfade over 0.6 s. Output 48 kHz stereo, peak ~ -6 dBFS."""
import sys, json, wave
import numpy as np

SR = 48000
MOODS = {  # bpm, root midi, chord progression (semitone offsets of triads), scale for arps, brightness
    "playful": (124, 60, [[0, 4, 7], [5, 9, 12], [7, 11, 14], [0, 4, 7]], [0, 2, 4, 7, 9], 1.0),
    "soar":    (132, 62, [[0, 4, 7], [7, 11, 14], [9, 12, 16], [5, 9, 12]], [0, 2, 4, 7, 9, 11], 1.2),
    "tense":   (96, 57, [[0, 3, 7], [0, 3, 7], [1, 5, 8], [0, 3, 6]], [0, 1, 3, 6, 7], 0.6),
    "quirky":  (112, 60, [[0, 4, 7, 10], [5, 9, 12, 15], [0, 4, 7, 10], [7, 11, 14, 17]], [0, 3, 5, 7, 10], 0.9),
    "mystery": (80, 50, [[0, 3, 7], [8, 12, 15], [5, 8, 12], [7, 10, 14]], [0, 2, 3, 7, 8], 0.5),
    "warm":    (88, 60, [[0, 4, 7, 11], [9, 12, 16], [5, 9, 12, 16], [7, 11, 14]], [0, 2, 4, 7, 9], 0.8),
}
f = lambda m: 440.0 * 2 ** ((m - 69) / 12)

def env(n, a, r):
    e = np.ones(n); a = min(a, n); r = min(r, n - a)
    if a: e[:a] = np.linspace(0, 1, a)
    if r: e[n - r:] = np.linspace(1, 0, r)
    return e

def render(mood, dur, seed):
    bpm, root, prog, scale, br = MOODS[mood]; beat = 60 / bpm; bar = beat * 4; n = int(dur * SR)
    out = np.zeros((n, 2)); rng = np.random.default_rng(seed); t = np.arange(n) / SR
    for bi in range(int(dur / bar) + 1):
        ch = prog[bi % len(prog)]; s0 = int(bi * bar * SR); L = min(int(bar * SR), n - s0)
        if L <= 0: break
        tt = np.arange(L) / SR
        pad = sum(np.sin(2 * np.pi * f(root + c - 12) * tt) + 0.3 * np.sin(2 * np.pi * 2 * f(root + c - 12) * tt + 0.3) for c in ch) / len(ch)
        pad *= env(L, int(0.25 * SR), int(0.3 * SR)) * 0.22
        out[s0:s0 + L, 0] += pad; out[s0:s0 + L, 1] += pad * 0.95
        bass = np.sin(2 * np.pi * f(root + ch[0] - 24) * tt) * 0.28 * env(L, 200, int(0.2 * SR))
        out[s0:s0 + L] += bass[:, None]
        steps = 8 if mood in ("playful", "soar", "quirky") else 4
        for k in range(steps):  # arpeggio / pluck
            st = s0 + int(k * bar / steps * SR); ln = int(min(bar / steps * 0.9, 0.4) * SR)
            if st + ln > n: break
            deg = scale[(k * 2 + bi) % len(scale)] + (12 if k % 4 == 3 else 0); tt2 = np.arange(ln) / SR
            pl = (np.sin(2 * np.pi * f(root + deg + 12) * tt2) + 0.25 * br * np.sin(2 * np.pi * f(root + deg + 24) * tt2)) * np.exp(-tt2 * (9 if mood != "mystery" else 4)) * 0.16
            pan = 0.5 + 0.35 * np.sin(k)
            out[st:st + ln, 0] += pl * (1 - pan) * 1.4; out[st:st + ln, 1] += pl * pan * 1.4
        if mood in ("playful", "soar", "quirky", "tense"):  # soft kick + hat
            for k in range(4):
                st = s0 + int(k * beat * SR); ln = int(0.25 * SR)
                if st + ln > n: break
                tt2 = np.arange(ln) / SR; kick = np.sin(2 * np.pi * (50 + 90 * np.exp(-tt2 * 30)) * tt2) * np.exp(-tt2 * 14) * (0.35 if mood != "tense" else 0.25)
                out[st:st + ln] += kick[:, None]
                hs = st + int(beat / 2 * SR); hl = int(0.05 * SR)
                if hs + hl < n and mood != "tense":
                    hat = rng.standard_normal(hl) * np.exp(-np.arange(hl) / SR * 80) * 0.05; out[hs:hs + hl] += hat[:, None]
    if mood == "mystery":  # low drone + shimmer
        out += (np.sin(2 * np.pi * f(root - 24) * t) * 0.12 * (0.7 + 0.3 * np.sin(t * 0.7)))[:, None]
    return out

def main():
    secs, outp, dur = json.load(open(sys.argv[1])), sys.argv[2], float(sys.argv[3]); n = int(dur * SR)
    mix = np.zeros((n, 2)); xf = int(0.6 * SR)
    for i, s in enumerate(secs):
        a = int(s["t"] * SR); b = int(secs[i + 1]["t"] * SR) if i + 1 < len(secs) else n
        seg = render(s["mood"], (min(n, b + xf) - a) / SR, i)
        w = np.ones(len(seg));
        if i: w[:xf] = np.linspace(0, 1, xf)
        if i + 1 < len(secs): w[-xf:] = np.linspace(1, 0, xf)
        mix[a:a + len(seg)] += seg * w[:, None] * s.get("gain", 1.0)
    mix *= 0.5 / max(1e-6, np.abs(mix).max())
    pcm = (np.clip(mix, -1, 1) * 32767).astype(np.int16)
    with wave.open(outp, "wb") as wf: wf.setnchannels(2); wf.setsampwidth(2); wf.setframerate(SR); wf.writeframes(pcm.tobytes())
    print("music", outp, dur, "s", [s["mood"] for s in secs])

if __name__ == "__main__":
    main()
