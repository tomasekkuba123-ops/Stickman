#!/usr/bin/env python3
"""Stickman detector (no ML): finds the rig-v2 hero by his RED HOODIE with a WHITE ROUND HEAD (+ black ink eyes) on top.
detect(rgb) -> {"hoodie":(x0,y0,x1,y1), "face":(x0,y0,x1,y1), "body":(x0,y0,x1,y1), "height_frac":f} or None   (coords in input pixels)
usage: stickdetect.py video.mp4 out.json [fps=30] [width=270]    -> per-frame detections (used by captions.py and qc_check.py)"""
import sys, json, subprocess
import numpy as np
import cv2


def detect(rgb):
    H, W = rgb.shape[:2]
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
    h, s, v = hsv[..., 0].astype(np.int16), hsv[..., 1].astype(np.int16), hsv[..., 2].astype(np.int16)
    red = (((h <= 11) | (h >= 171)) & (s > 130) & (v > 100)).astype(np.uint8)
    red = cv2.morphologyEx(red, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    white = ((s < 75) & (v > 200)).astype(np.uint8)
    white = cv2.morphologyEx(white, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8), iterations=2)
    ink = (v < 70)
    n, lab, st, _ = cv2.connectedComponentsWithStats(red, 8)
    nw, wlab, wst, _ = cv2.connectedComponentsWithStats(white, 4)
    heads = []
    for j in range(1, nw):
        x, y, w, hh, area = wst[j]
        if area < H * W * 0.0006 or not (0.55 < w / hh < 1.8) or area / (w * hh) < 0.5:
            continue
        inkf = ink[y:y + hh, x:x + w].mean()
        if inkf < 0.02:
            continue
        heads.append((x, y, w, hh, area))
    best, bscore = None, 0.0
    for i in range(1, n):
        x, y, w, hh, area = st[i]
        if area < H * W * 0.0008 or hh < 6 or area / (w * hh) < 0.22:
            continue
        cx = x + w / 2
        for (fx, fy, fw, fh, farea) in heads:
            fb = fy + fh
            if not (y - 0.35 * hh <= fb <= y + 0.45 * hh):
                continue
            if abs((fx + fw / 2) - cx) > 0.45 * w + 0.3 * fw:
                continue
            if not (0.45 < fh / hh < 2.4):
                continue
            score = area + farea
            if score > bscore:
                bottom = y + hh + 1.25 * hh
                best = {"hoodie": [int(x), int(y), int(x + w), int(y + hh)], "face": [int(fx), int(fy), int(fx + fw), int(fy + fh)],
                        "body": [int(min(x, fx)), int(fy), int(max(x + w, fx + fw)), int(min(H, bottom))],
                        "height_frac": float((bottom - fy) / H), "cut_bottom": bool(bottom > H)}
                bscore = score
    return best


def frames(video, fps=30, width=270):
    hgt = width * 16 // 9
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-i", video, "-vf", f"fps={fps},scale={width}:{hgt}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
    n = width * hgt * 3
    while True:
        b = p.stdout.read(n)
        if len(b) < n:
            break
        yield np.frombuffer(b, np.uint8).reshape(hgt, width, 3)


def scan(video, fps=30, width=270):
    out = []
    for i, f in enumerate(frames(video, fps, width)):
        d = detect(f)
        out.append({"t": round(i / fps, 3), **({"hit": True, **{k: v for k, v in d.items()}} if d else {"hit": False})})
    return {"fps": fps, "w": width, "h": width * 16 // 9, "frames": out}


if __name__ == "__main__":
    v, o = sys.argv[1], sys.argv[2]
    fps = float(sys.argv[3]) if len(sys.argv) > 3 else 30
    w = int(sys.argv[4]) if len(sys.argv) > 4 else 270
    r = scan(v, fps, w)
    json.dump(r, open(o, "w"))
    hits = sum(f["hit"] for f in r["frames"])
    print(f"detected Stickman in {hits}/{len(r['frames'])} frames ({100 * hits / max(1, len(r['frames'])):.1f} %)")
