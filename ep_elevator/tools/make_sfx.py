"""Procedurally synthesised sound-effects stem (no samples, no third-party audio -> no licence issues).

Writes out/SFX_STEM.wav (48 kHz, stereo, exactly 480.000 s) and timeline/SFX_CUES.csv.
Levels are deliberately low (peaks around -16 dBFS, SFX-only loudness ~ -30 LUFS) so a narrator
recorded at ~ -16 LUFS stays clearly on top. Every cue is listed in the CSV so it can be moved/muted.
"""
import csv, pathlib, wave
import numpy as np
from scipy import signal

ROOT = pathlib.Path(__file__).resolve().parent.parent
SR = 48000
DUR = 480.0
N = int(SR * DUR)
rng = np.random.default_rng(7)
L = np.zeros(N); R = np.zeros(N)


def env(n, a=0.005, d=None, curve=4.0):
    t = np.arange(n) / SR
    e = np.minimum(t / max(a, 1e-4), 1.0)
    if d is not None:
        e *= np.exp(-curve * t / d)
    return e


def fade(x, fin=0.01, fout=0.05):
    n = len(x); i = min(int(fin * SR), n // 2); o = min(int(fout * SR), n // 2)
    x[:i] *= np.linspace(0, 1, i); x[n - o:] *= np.linspace(1, 0, o); return x


def bp(x, lo, hi, order=2):
    sos = signal.butter(order, [lo, hi], btype="band", fs=SR, output="sos"); return signal.sosfilt(sos, x)


def lp(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, fs=SR, output="sos"), x)


def hp(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, btype="high", fs=SR, output="sos"), x)


def add(t, x, gain_db=0.0, pan=0.0):
    i = int(t * SR); x = x * 10 ** (gain_db / 20)
    j = min(N, i + len(x)); x = x[: j - i]
    l = np.cos((pan + 1) * np.pi / 4); r = np.sin((pan + 1) * np.pi / 4)
    L[i:j] += x * l * 1.414; R[i:j] += x * r * 1.414


# ---------- primitives ----------
def bell(f, d=1.6):
    n = int(SR * d * 1.5); t = np.arange(n) / SR
    x = sum(a * np.sin(2 * np.pi * f * m * t) * np.exp(-t * k / d) for m, a, k in
            [(1, 1, 3), (2.0, .35, 5), (2.76, .25, 6), (5.4, .1, 9)])
    return fade(x * env(n, .002), .001, .2)


def ding():  # classic two-tone elevator chime
    a = bell(1318.5, 1.4); b = bell(1046.5, 1.8); x = np.zeros(int(SR * .35) + len(b))
    x[: len(a)] += a; x[int(SR * .35):] += b; return x / np.abs(x).max()


def noise(d):
    return rng.standard_normal(int(SR * d))


def whoosh(d=1.6, f0=300, f1=3000):
    n = int(SR * d); x = noise(d); out = np.zeros(n); seg = 1024
    fs = np.geomspace(f0, f1, n // seg + 1)
    for k in range(0, n, seg):
        f = fs[k // seg]; out[k:k + seg] = bp(x[max(0, k - 4096):k + seg], f * .6, min(f * 1.6, 20000))[-len(x[k:k + seg]):]
    e = np.sin(np.pi * np.linspace(0, 1, n)) ** 2
    return out * e / (np.abs(out * e).max() + 1e-9)


def shimmer(d=2.0, density=18, lo=2200, hi=6500):
    n = int(SR * d); x = np.zeros(n)
    for _ in range(int(density * d)):
        f = rng.uniform(lo, hi); m = int(SR * .45); s = int(rng.uniform(0, d - .46) * SR); t = np.arange(m) / SR
        x[s:s + m] += np.sin(2 * np.pi * f * t) * np.exp(-t * 9) * rng.uniform(.3, 1)
    x *= np.sin(np.pi * np.linspace(0, 1, n)) ** .5
    return x / (np.abs(x).max() + 1e-9)


def click(f=2500, d=.03):
    x = bp(noise(d), f * .5, f * 1.5) * np.exp(-np.arange(int(SR * d)) / SR * 120); return x / np.abs(x).max()


def tick():
    a = click(3200, .025) * .8; b = click(1800, .02) * .5; o = int(SR * .004)
    a[o:o + len(b)] += b[: len(a) - o]; return a


def thump(f=55, d=.5):
    n = int(SR * d); t = np.arange(n) / SR
    x = np.sin(2 * np.pi * f * t * (1 + .6 * np.exp(-t * 20))) * np.exp(-t * 7) + lp(noise(d), 600) * np.exp(-t * 25) * .4
    return x / np.abs(x).max()


def rumble(d, chug_hz=0.0, lo=35, hi=180):
    x = bp(noise(d), lo, hi, 2); t = np.arange(len(x)) / SR
    if chug_hz:
        x *= .55 + .45 * np.abs(np.sin(np.pi * chug_hz * t)) ** 3
        x += bp(noise(d), 800, 2500) * (np.abs(np.sin(np.pi * chug_hz * t)) ** 12) * .35
    x = fade(x, .4, .8); return x / np.abs(x).max()


def whistle(d=1.3):
    n = int(SR * d); t = np.arange(n) / SR; vib = 1 + .006 * np.sin(2 * np.pi * 5.5 * t)
    x = sum(np.sin(2 * np.pi * f * vib * t) for f in (587, 740, 880)) + bp(noise(d), 600, 1200) * .5
    return fade(x / np.abs(x).max(), .08, .3)


def bubbles(d=3.0, rate=6):
    n = int(SR * d); x = np.zeros(n)
    for _ in range(int(rate * d)):
        s = int(rng.uniform(0, d - .1) * SR); m = int(SR * rng.uniform(.03, .08)); t = np.arange(m) / SR
        f0 = rng.uniform(400, 1100); x[s:s + m] += np.sin(2 * np.pi * f0 * t * (1 + 6 * t)) * np.sin(np.pi * t / t[-1])
    return x / (np.abs(x).max() + 1e-9)


def sparks(d=1.0, rate=60):
    n = int(SR * d); x = np.zeros(n); idx = rng.integers(0, n - 200, int(rate * d))
    for i in idx:
        x[i:i + 200] += click(rng.uniform(3000, 7000), 200 / SR) * rng.uniform(.2, 1)
    x *= np.exp(-np.arange(n) / SR * 2.5); return hp(x, 1500) / (np.abs(x).max() + 1e-9)


def hum(d, f=110):
    n = int(SR * d); t = np.arange(n) / SR
    x = np.sin(2 * np.pi * f * t) + .4 * np.sin(2 * np.pi * f * 2.01 * t) + .2 * np.sin(2 * np.pi * f * 3 * t)
    x *= .8 + .2 * np.sin(2 * np.pi * .7 * t); return fade(x / np.abs(x).max(), .6, .8)


def creak(d=1.4):
    n = int(SR * d); t = np.arange(n) / SR; f = 90 + 40 * np.sin(2 * np.pi * .8 * t)
    x = signal.sawtooth(2 * np.pi * np.cumsum(f) / SR) * (.6 + .4 * np.sin(2 * np.pi * 23 * t))
    return fade(bp(x, 200, 1800), .1, .3)


def page():
    x = bp(noise(.12), 1500, 6000) * np.sin(np.pi * np.linspace(0, 1, int(SR * .12))) ** 2; return x / np.abs(x).max()


def ambience(d, lo=150, hi=900):
    return fade(bp(noise(d), lo, hi, 1) / 4, 1.5, 1.5)


# ---------- cue list: (time s, scene, name, fn, gain dB, pan) ----------
cues = []
def cue(t, sc, name, x, g, pan=0.0):
    cues.append((t, sc, name, g, pan)); add(t, x, g, pan)

cue(0.0, 1, "evening street ambience", ambience(16, 200, 1200), -34)
cue(12.6, 1, "magic glow shimmer", shimmer(3.0, 10), -30, .4)
cue(16.2, 2, "elevator warm hum", hum(15, 98), -36, .3)
cue(16.4, 2, "glow shimmer", shimmer(2.5, 8), -32, .3)
cue(32.3, 3, "interior shimmer", shimmer(3, 8, 3000, 7000), -34)
cue(44.2, 3, "button press click", click(1800, .06), -22, .3)
cue(44.5, 3, "elevator ding", ding(), -24, .2)
cue(48.1, 4, "door flash whoosh", whoosh(1.2, 400, 4000), -24)
cue(49.0, 4, "portal swirl", whoosh(6.0, 150, 1200), -28)
cue(52.5, 4, "floor shake rumble", rumble(4.0), -24)
cue(60.5, 4, "jump into portal whoosh", whoosh(1.8, 200, 5000), -22)
cue(64.2, 5, "floating city wind", whoosh(7.0, 300, 900), -32)
cue(70.0, 5, "drifting cars swoosh", whoosh(2.0, 500, 2500), -30, -.5)
cue(80.1, 6, "thrown upward whoosh", whoosh(1.6, 200, 4000), -23)
cue(84.5, 6, "tumble wind", whoosh(5.0, 250, 1500), -30)
cue(100.2, 7, "leap whoosh", whoosh(1.2, 300, 3500), -24, .3)
cue(104.3, 7, "shoe scrape", bp(noise(.5), 1500, 5000) * np.linspace(1, 0, int(SR * .5)), -32, .2)
cue(108.1, 7, "doors slam", thump(60, .7), -20)
cue(112.2, 8, "elevator ding", ding(), -22, -.6)
cue(124.4, 8, "tiny toy whistle", whistle(1.0), -32, .6)
cue(128.0, 9, "toy train chug", rumble(16.5, 4.0), -24, -.3)
cue(128.6, 9, "train whistle", whistle(1.4), -27, -.5)
cue(144.5, 10, "train thunder", rumble(10.0, 5.0), -24, -.5)
cue(154.4, 10, "golden flash shimmer", shimmer(2.5, 20), -26)
cue(156.5, 10, "jump whoosh", whoosh(1.4, 300, 4000), -26)
cue(160.2, 11, "elevator ding", ding(), -26, -.6)
cue(160.4, 11, "underwater bubbles", bubbles(15.0, 3), -32)
cue(160.4, 11, "underwater low ambience", ambience(15.5, 80, 400), -30)
cue(176.3, 12, "octopus deep rumble", rumble(6.0, 0, 30, 120), -22, .5)
cue(176.3, 12, "bubbles", bubbles(15.0, 4), -32)
cue(188.0, 12, "octopus lunge swoosh", whoosh(1.5, 150, 1200), -26, .4)
cue(192.3, 13, "metal creak", creak(1.6), -27, -.5)
cue(196.0, 13, "sparks", sparks(1.4), -28, -.5)
cue(197.5, 13, "walkway crack", thump(70, .5), -24)
cue(200.0, 13, "blue portal swirl", whoosh(4.0, 200, 1600), -28, .5)
cue(204.5, 13, "flying leap whoosh", whoosh(1.4, 300, 5000), -23, .3)
cue(208.3, 14, "timeless airy hum", hum(15.2, 73), -38)
cue(208.5, 14, "frozen-time shimmer", shimmer(4, 5, 1500, 4000), -34)
cue(224.3, 15, "straining clock creak", creak(2.0), -30)
cue(232.0, 15, "golden sparks", sparks(2.0, 90), -28)
cue(236.0, 15, "gear clunk", thump(80, .4), -24)
for k in range(4):
    cue(236.6 + k, 15, "clock tick", tick(), -24 if k % 2 == 0 else -27, .2)
for k in range(15):
    cue(240.6 + k, 16, "clock tick (storm)", tick(), -32)
cue(240.1, 16, "elevator cracks", thump(50, .8), -20)
cue(240.5, 16, "cosmic storm wind", whoosh(15.0, 150, 900), -28)
cue(248.0, 16, "debris whoosh", whoosh(1.2, 400, 3000), -28, .6)
cue(256.5, 17, "crawl scrape", bp(noise(.8), 800, 3000) * np.linspace(1, 0, int(SR * .8)), -34)
cue(260.0, 17, "crackling wires", sparks(2.5, 40), -30, .5)
cue(264.4, 17, "crystal clicks in", click(1500, .08), -22, .4)
cue(268.2, 17, "power-up shimmer", shimmer(2.5, 16, 1500, 5000), -27)
cue(270.0, 17, "doors light up hum", hum(2.0, 130), -32)
cue(272.2, 18, "elevator ding", ding(), -26, -.6)
cue(272.5, 18, "doorway ambience shimmer", shimmer(8, 4), -34)
cue(288.5, 19, "reaching shimmer", shimmer(2, 10), -30, .4)
cue(292.0, 19, "doorway bursts open", whoosh(2.0, 200, 6000), -22)
cue(300.2, 19, "run-in whoosh", whoosh(1.2, 300, 3000), -27)
cue(304.2, 20, "soft landing thump", thump(65, .4), -28)
cue(304.5, 20, "quiet bedroom room tone", ambience(15, 100, 500), -38)
cue(312.2, 20, "quiet ding from wardrobe", ding(), -30, .6)
cue(320.3, 21, "golden ticket appears", shimmer(3, 18), -26, .3)
cue(336.2, 22, "map unfolds swoosh", whoosh(1.4, 600, 5000), -26)
cue(336.8, 22, "map glow shimmer", shimmer(6, 5), -32)
cue(352.4, 23, "elevator descending hum", hum(15.4, 82), -30)
cue(352.5, 23, "descend swoosh", whoosh(4.0, 1200, 200), -30)
cue(368.2, 24, "elevator ding", ding(), -26, -.6)
cue(368.6, 24, "airy kingdom shimmer", shimmer(14, 3), -34)
for k, tt in enumerate((385.0, 387.2, 389.1, 391.6, 394.3, 396.5)):
    cue(tt, 25, "page step", page(), -30, (-.3 + .12 * k))
cue(400.3, 26, "key shoots out whoosh", whoosh(1.0, 800, 6000), -23, .4)
cue(400.5, 26, "key shimmer", shimmer(2.5, 16), -28, .4)
cue(408.2, 26, "jump whoosh", whoosh(1.2, 300, 3000), -28)
cue(416.3, 27, "catch key click", click(2200, .05), -25)
cue(420.0, 27, "machine energy hum", hum(5.0, 65), -32, .4)
cue(424.1, 27, "key turns in lock", click(1200, .09), -22, .4)
cue(424.4, 27, "machine awakens", thump(55, .6), -24, .4)
cue(427.5, 27, "rings connect shimmer", shimmer(4.5, 14), -27)
cue(432.2, 28, "doorways open whoosh", whoosh(2.0, 300, 3000), -26)
cue(433.5, 28, "objects fly home chimes", shimmer(14, 9, 1200, 4500), -28)
cue(448.3, 29, "final doorway opens", whoosh(1.6, 300, 4000), -26, .5)
cue(449.0, 29, "doorway glow", shimmer(5, 6), -32, .5)
cue(460.0, 29, "run into sunlight whoosh", whoosh(1.4, 300, 3000), -28, .4)
cue(464.3, 30, "bedroom room tone", ambience(15.5, 100, 500), -38)
cue(476.0, 30, "ticket blinks", shimmer(1.6, 18, 3000, 7000), -26, -.1)
cue(477.6, 30, "closing chime", bell(1568, 2.0), -30)

st = np.stack([L, R], 1)
st[-int(SR * .05):] *= np.linspace(1, 0, int(SR * .05))[:, None]
peak = np.abs(st).max(); lim = 10 ** (-12 / 20)
if True:  # normalise peak to -12 dBFS, keeps relative levels
    st *= lim / peak
out = ROOT / "out" / "SFX_STEM.wav"; out.parent.mkdir(exist_ok=True)
with wave.open(str(out), "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((st * 32767).astype("<i2").tobytes())
with open(ROOT / "timeline" / "SFX_CUES.csv", "w", newline="", encoding="utf-8") as f:
    c = csv.writer(f); c.writerow(["time_s", "timecode", "scene", "effect", "gain_db", "pan"])
    for t, sc, name, g, pan in sorted(cues):
        c.writerow([f"{t:.3f}", f"{int(t // 60):02d}:{t % 60:06.3f}", sc, name, g, pan])
print(f"wrote {out} ({len(st) / SR:.3f} s, {len(cues)} cues, peak {20 * np.log10(np.abs(st).max()):.1f} dBFS)")
