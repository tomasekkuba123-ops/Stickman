#!/usr/bin/env python3
"""v18 FRAME QC (the verify loop, called by qc_check.py; also runs alone).
usage: qc_frames.py final.mp4 mask.json out_dir [--cuts 0,3.0,...] [--captions captions.json]
A frame every 0.5 s (+ a 10 fps scan for ghosting) -> issues per category + frames_grid.png:
  blur     contrast-normalised Laplacian inside the hero box < 30 % of the episode median
  cropped  hero box touches a frame edge
  bottom   bottom 20 % nearly empty (edge density + luminance spread)
  scale    hero height jumps > 18 % between samples inside one shot
  ghost    a frame that is a 25-75 % blend of its neighbours (cross-fade / double exposure)
  stray    hero-coloured blobs not attached to the hero in the QC mask (duplicate / leftover sprites)
  hands    caption band over a hand (mask gloves) — share of caption time
  loop     last frame vs first frame (mean abs difference)"""
import os, json, subprocess, argparse
import numpy as np, cv2

BAND_SAFE = (1195, 1195 + 2 * 112)  # kit/captions.tsx safe band, 2 lines at the fixed 96 px size


def frames(video, fps, W, H):
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-i", video, "-vf", f"fps={fps},scale={W}:{H}", "-f", "rawvideo", "-pix_fmt", "bgr24", "-"], stdout=subprocess.PIPE)
    out = []
    while True:
        b = p.stdout.read(W * H * 3)
        if len(b) < W * H * 3: break
        out.append(np.frombuffer(b, np.uint8).reshape(H, W, 3).copy())
    return out


def run(video, mask, out, cuts=(), captions=None):
    os.makedirs(out, exist_ok=True)
    mf = json.load(open(mask))["frames"]
    near = lambda t: min(mf, key=lambda f: abs(f["t"] - t))
    W, H = 540, 960; S = [(i * 0.5, im) for i, im in enumerate(frames(video, 2, W, H))]
    rows, lap = [], []
    for t, im in S:
        m = near(t); g = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY); lv = None
        if m["vis"] and m["body"]:
            x0, y0, x1, y1 = [int(v * s) for v, s in zip(m["body"], (W, H, W, H))]
            roi = g[max(0, y0):max(y0 + 2, y1), max(0, x0):max(x0 + 2, x1)]
            lv = float(cv2.Laplacian(roi, cv2.CV_64F).var()) / (float(roi.std()) ** 2 + 25) * 1000; lap.append(lv)
        bot = g[int(H * 0.8):, :]
        rows.append({"t": t, "lap": lv, "hf": m["hf"] if m["vis"] else 0, "cut": bool(m["cut"]), "edge": float((cv2.Canny(bot, 40, 120) > 0).mean()), "spread": float(bot.std())})
    med = float(np.median(lap)) if lap else 1
    I = {k: [] for k in ("blur", "cropped", "bottom", "scale", "ghost", "stray", "hands", "loop")}
    for k, r in enumerate(rows):
        if r["lap"] is not None and r["lap"] < 0.3 * med: I["blur"].append(f"{r['t']:.1f}s hero detail {r['lap']:.0f} (median {med:.0f})")
        if r["cut"]: I["cropped"].append(f"{r['t']:.1f}s hero touches the frame edge")
        if r["edge"] < 0.012 and r["spread"] < 14: I["bottom"].append(f"{r['t']:.1f}s bottom 20 % nearly empty")
        if k and rows[k - 1]["hf"] and r["hf"] and not any(rows[k - 1]["t"] - 0.05 < c <= r["t"] + 0.05 for c in cuts):
            j = abs(r["hf"] - rows[k - 1]["hf"]) / rows[k - 1]["hf"]
            if j > 0.18: I["scale"].append(f"{r['t']:.1f}s hero height {rows[k-1]['hf']:.2f} -> {r['hf']:.2f} inside one shot")
    # ghosting: 10 fps scan, frame b ~ alpha*a + (1-alpha)*c with a clear change a -> c
    F = [cv2.Laplacian(cv2.GaussianBlur(cv2.cvtColor(f, cv2.COLOR_BGR2GRAY), (3, 3), 0), cv2.CV_32F) for f in frames(video, 10, 135, 240)]  # high-pass: grade fades are not ghosts
    for i in range(1, len(F) - 1):
        a, b, c = F[i - 1], F[i], F[i + 1]; d = c - a; dd = float((d * d).mean())
        if np.sqrt(dd) < 6: continue
        al = float(((b - c) * (a - c)).sum() / max(1e-6, ((a - c) ** 2).sum()))
        res = float(np.abs(b - (al * a + (1 - al) * c)).mean()); base = float(np.abs(d).mean())
        if 0.25 < al < 0.75 and res < 0.3 * base: I["ghost"].append(f"{i / 10:.1f}s blend of neighbours (alpha {al:.2f})")
    # stray sprites from the mask
    st = [f["t"] for f in mf if f.get("stray")]
    if st: I["stray"].append(f"{len(st)} mask frames with extra hero-coloured blobs, first at {st[0]:.1f}s")
    # captions over hands
    if captions and os.path.exists(captions):
        G = json.load(open(captions))["groups"]; on = hit = 0; ht = []
        for f in mf:
            if not any(g["a"] <= f["t"] <= g["e"] + 0.5 for g in G): continue
            on += 1
            if any(h[3] * 1920 > BAND_SAFE[0] + 15 and h[1] * 1920 < BAND_SAFE[1] - 15 for h in f.get("hands", [])): hit += 1; ht.append(f["t"])
        if on and hit: I["hands"].append(f"caption band over a hand in {100 * hit / on:.0f} % of caption time (first {ht[0]:.1f}s)")
        I["hands_pct"] = round(100 * hit / on, 1) if on else 0.0
    # loop
    if S:
        last = [cv2.GaussianBlur(x, (9, 9), 0).astype(int) for x in frames(video, 30, 270, 480)]; d0 = float(np.abs(last[0] - last[-1]).mean())  # blurred: grain/fireflies ignored, framing compared
        if d0 > 8: I["loop"].append(f"last frame differs from the first (mean abs diff {d0:.1f} / 255)")
        I["loop_diff"] = round(d0, 2)
    # grid
    th = [cv2.resize(im, (135, 240)) for _, im in S]; cols = 10; rws = (len(th) + cols - 1) // cols
    grid = np.full((rws * 240, cols * 135, 3), 255, np.uint8)
    for k, (tim, (t, _)) in enumerate(zip(th, S)):
        y, x = (k // cols) * 240, (k % cols) * 135; grid[y:y + 240, x:x + 135] = tim
        cv2.rectangle(grid, (x, y), (x + 44, y + 16), (0, 0, 0), -1); cv2.putText(grid, f"{t:.1f}", (x + 3, y + 12), cv2.FONT_HERSHEY_SIMPLEX, 0.38, (255, 255, 255), 1)
    cv2.imwrite(os.path.join(out, "frames_grid.png"), grid)
    return I, len(S), med


if __name__ == "__main__":
    ap = argparse.ArgumentParser(); ap.add_argument("video"); ap.add_argument("mask"); ap.add_argument("out"); ap.add_argument("--cuts", default=""); ap.add_argument("--captions")
    a = ap.parse_args(); I, n, med = run(a.video, a.mask, a.out, [float(x) for x in a.cuts.split(",") if x], a.captions)
    print(json.dumps(I, indent=1))
