#!/usr/bin/env python3
"""Build the SUBSCRIBE end card ONCE -> wyr/assets/endcard/{endcard.mkv, endcard.wav}. Every episode reuses these files
unchanged (render.py appends them). Refuses to overwrite an existing card unless --force (user rule: never regenerate).
Video: engine composition WyrEndcard (pack/Stick3D-Pack/engine/src/videos/WyrEndcard.tsx), 45 frames @30 fps, stored lossless (FFV1).
Audio (24 kHz mono): Kokoro voice "Subscribe for tomorrow's choice!" + click on the button press + bell chime when it rings."""
import os, sys, subprocess, tempfile, numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import render

OUT = os.path.join(HERE, "assets", "endcard"); ENGINE = os.path.join(HERE, "..", "pack", "Stick3D-Pack", "engine")
LINE = "Subscribe for tomorrow's choice!"; DUR = 1.5; PRESS, RING = 0.42, 0.68; SR = render.SR

def main():
    mkv, wav = os.path.join(OUT, "endcard.mkv"), os.path.join(OUT, "endcard.wav")
    if (os.path.exists(mkv) or os.path.exists(wav)) and "--force" not in sys.argv:
        sys.exit("end card already exists; it must stay identical in every episode (use --force only if the user asks for a new card)")
    os.makedirs(OUT, exist_ok=True)
    with tempfile.TemporaryDirectory() as td:
        subprocess.run(["npx", "remotion", "render", "WyrEndcard", os.path.join(td, "seq"), "--sequence", "--image-format=png",
                        "--frames=0-44", "--gl=swangle", "--concurrency=4", "--log=error"], cwd=ENGINE, check=True)
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-framerate", "30", "-i", os.path.join(td, "seq", "element-%02d.png"),
                        "-c:v", "ffv1", "-level", "3", "-pix_fmt", "bgra", mkv], check=True)
    # audio
    cache = os.path.join(HERE, "out", "_endcard_cache"); os.makedirs(cache, exist_ok=True)
    v, _ = render.tts(LINE, cache)
    if len(v) / SR > DUR - 0.08:   # pitch-preserving stretch so the line fits inside the card
        k = (len(v) / SR) / (DUR - 0.08)
        with tempfile.TemporaryDirectory() as td:
            a, b = os.path.join(td, "a.wav"), os.path.join(td, "b.wav"); sf.write(a, v, SR)
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", a, "-af", f"atempo={k:.4f}", b], check=True); v, _ = sf.read(b, dtype="float32")
    n = int(DUR * SR); mix = np.zeros(n, np.float32); t = np.arange(n) / SR
    mix[int(0.02 * SR): int(0.02 * SR) + len(v)] += v[: n - int(0.02 * SR)]
    tc = np.clip(t - PRESS, 0, None); mix += ((np.sin(2 * np.pi * 2200 * tc) * 0.5 + np.random.default_rng(1).standard_normal(n) * 0.5) * np.exp(-tc * 220) * (t >= PRESS) * 0.25).astype(np.float32)
    tb = np.clip(t - RING, 0, None)
    bell = sum(a * np.sin(2 * np.pi * f * tb) for f, a in ((1568, 1.0), (2093, 0.55), (3136, 0.3), (4186, 0.15)))
    mix += (bell * np.minimum(1, tb * 300) * np.exp(-tb * 4.5) * (1 + 0.25 * np.sin(2 * np.pi * 11 * tb)) * (t >= RING) * 0.14).astype(np.float32)
    mix[-int(0.03 * SR):] *= np.linspace(1, 0, int(0.03 * SR))
    sf.write(wav, mix, SR)
    print("end card ->", mkv, wav, f"voice {len(v) / SR:.2f}s")

if __name__ == "__main__":
    main()
