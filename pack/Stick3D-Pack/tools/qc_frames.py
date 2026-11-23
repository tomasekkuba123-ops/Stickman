#!/usr/bin/env python3
"""v18 frame QC: a frame every 0.5 s -> checks + one grid image for a visual pass.
usage: qc_frames.py final.mp4 mask.json out_dir [--cuts 0,3.0,...]
checks per sample:
  blur      Laplacian variance inside the hero's box (mask.json) vs the episode median (soft hero = < 35 %)
  cropped   hero box touches a frame edge (mask 'cut') outside intended close-ups
  bottom    bottom 20 % nearly empty (low detail: edge density + luminance spread)
  scale     hero height jumps > 18 % between samples inside one shot (not across a cut)
writes frames_grid.png (all samples, time-stamped) + frames_report.txt"""
import sys, os, json, subprocess, argparse
import numpy as np, cv2


def main():
    ap = argparse.ArgumentParser(); ap.add_argument("video"); ap.add_argument("mask"); ap.add_argument("out"); ap.add_argument("--cuts", default="")
    a = ap.parse_args(); os.makedirs(a.out, exist_ok=True)
    M = json.load(open(a.mask)); mf = M["frames"]; cuts = [float(x) for x in a.cuts.split(",") if x]
    W, H = 540, 960
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-i", a.video, "-vf", f"fps=2,scale={W}:{H}", "-f", "rawvideo", "-pix_fmt", "bgr24", "-"], stdout=subprocess.PIPE)
    S = []; i = 0
    while True:
        b = p.stdout.read(W * H * 3)
        if len(b) < W * H * 3: break
        S.append((i * 0.5, np.frombuffer(b, np.uint8).reshape(H, W, 3).copy())); i += 1
    rows, lap = [], []
    for t, im in S:
        m = min(mf, key=lambda f: abs(f["t"] - t)); g = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY)
        lv = None
        if m["vis"] and m["body"]:
            x0, y0, x1, y1 = [int(v * s) for v, s in zip(m["body"], (W, H, W, H))]
            roi = g[max(0, y0):max(y0 + 2, y1), max(0, x0):max(x0 + 2, x1)]
            lv = float(cv2.Laplacian(roi, cv2.CV_64F).var()) / (float(roi.std()) ** 2 + 25) * 1000; lap.append(lv)  # contrast-normalised (dark scenes are not "blurry")
        bot = g[int(H * 0.8):, :]; ed = float((cv2.Canny(bot, 40, 120) > 0).mean()); spread = float(bot.std())
        rows.append({"t": t, "lap": lv, "hf": m["hf"] if m["vis"] else 0, "cut": bool(m["cut"]), "edge": ed, "spread": spread})
    med = float(np.median(lap)) if lap else 1
    issues = []
    for k, r in enumerate(rows):
        if r["lap"] is not None and r["lap"] < 0.35 * med: issues.append(f"{r['t']:5.1f}s blur: hero detail {r['lap']:.0f} vs median {med:.0f}")
        if r["cut"]: issues.append(f"{r['t']:5.1f}s cropped: hero touches the frame edge")
        if r["edge"] < 0.012 and r["spread"] < 14: issues.append(f"{r['t']:5.1f}s bottom: bottom 20 % nearly empty (edges {r['edge']:.3f}, spread {r['spread']:.0f})")
        if k and rows[k - 1]["hf"] and r["hf"] and not any(rows[k - 1]["t"] < c <= r["t"] + 0.05 for c in cuts):
            j = abs(r["hf"] - rows[k - 1]["hf"]) / rows[k - 1]["hf"]
            if j > 0.18: issues.append(f"{r['t']:5.1f}s scale: hero height {rows[k-1]['hf']:.2f} -> {r['hf']:.2f} inside one shot")
    # grid
    th = [cv2.resize(im, (135, 240)) for _, im in S]; cols = 10; n = len(th); rws = (n + cols - 1) // cols
    grid = np.full((rws * 240, cols * 135, 3), 255, np.uint8)
    for k, (tim, (t, _)) in enumerate(zip(th, S)):
        y, x = (k // cols) * 240, (k % cols) * 135; grid[y:y + 240, x:x + 135] = tim
        cv2.rectangle(grid, (x, y), (x + 44, y + 16), (0, 0, 0), -1); cv2.putText(grid, f"{t:.1f}", (x + 3, y + 12), cv2.FONT_HERSHEY_SIMPLEX, 0.38, (255, 255, 255), 1)
    cv2.imwrite(os.path.join(a.out, "frames_grid.png"), grid)
    rep = [f"FRAME QC — {os.path.basename(a.video)} — {len(S)} samples (every 0.5 s)", f"hero detail median (Laplacian var): {med:.0f}", "ISSUES: " + ("none" if not issues else str(len(issues)))] + issues
    open(os.path.join(a.out, "frames_report.txt"), "w").write("\n".join(rep) + "\n"); print("\n".join(rep))


if __name__ == "__main__":
    main()
