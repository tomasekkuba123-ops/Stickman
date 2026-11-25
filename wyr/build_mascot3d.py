#!/usr/bin/env python3
"""Mascot poses straight from the series 3D Stickman puppet -> wyr/assets/mascot/<pose>.png (true RGBA, no halo).
Engine composition WyrMascot (pack/Stick3D-Pack/engine/src/videos/WyrMascot.tsx) is rendered twice, on pure black and on
pure white; two-background matting gives the exact alpha and the uncontaminated colour of every pixel:
    I_black = a*F,  I_white = a*F + (1-a)*255   ->   a = 1 - (I_white - I_black)/255,  F = I_black / a
All poses share one crop box, so scale and the feet baseline are identical in every pose. Run once; reuse the PNGs."""
import os, json, subprocess, tempfile, numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ENGINE = os.path.join(HERE, "..", "pack", "Stick3D-Pack", "engine")
OUT = os.path.join(HERE, "assets", "mascot")
POSES = ["happy", "excited", "thinking", "laughing", "surprised", "scared", "wow", "thumbs"]   # order = WyrMascot.tsx

def render(bg, td):
    pj = os.path.join(td, f"{bg}.json"); json.dump({"bg": bg}, open(pj, "w"))
    subprocess.run(["npx", "remotion", "render", "WyrMascot", os.path.join(td, bg), "--sequence", "--image-format=png",
                    f"--frames=0-{len(POSES) - 1}", f"--props={pj}", "--gl=swangle", "--concurrency=4", "--log=error"], cwd=ENGINE, check=True)
    d = os.path.join(td, bg); return [np.asarray(Image.open(os.path.join(d, f)).convert("RGB")).astype(np.float32) for f in sorted(os.listdir(d))]

def main():
    os.makedirs(OUT, exist_ok=True)
    with tempfile.TemporaryDirectory() as td:
        blk, wht = render("black", td), render("white", td)
    rgba = []
    for b, w in zip(blk, wht):
        a = np.clip(1 - (w - b).mean(2) / 255.0, 0, 1)
        a[a < 1.5 / 255] = 0
        f = np.where(a[..., None] > 1e-3, b / np.maximum(a[..., None], 1e-3), 0)
        rgba.append(np.dstack([np.clip(f, 0, 255), a * 255]).astype(np.uint8))
    ys, xs = np.nonzero(np.max([r[..., 3] for r in rgba], axis=0) > 0)
    pad = 6; y0, y1, x0, x1 = max(0, ys.min() - pad), ys.max() + pad, max(0, xs.min() - pad), xs.max() + pad
    for name, r in zip(POSES, rgba):
        Image.fromarray(r[y0:y1, x0:x1], "RGBA").save(os.path.join(OUT, name + ".png"))
    print("poses ->", OUT, "box", (x1 - x0, y1 - y0))

if __name__ == "__main__":
    main()
