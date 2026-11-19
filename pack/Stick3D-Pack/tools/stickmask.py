#!/usr/bin/env python3
"""Measure Stickman per frame from a QC MASK render (engine input prop {"qcmask":true}: body magenta, face green).
usage: stickmask.py mask.mp4 out.json
out: {"fps":..,"w":..,"h":..,"frames":[{"t":s,"vis":bool,"body":[x0,y0,x1,y1] (0..1),"face":[..] or null,"hf":height fraction,"cut":bool}]}"""
import sys, json, subprocess
import numpy as np
import cv2


def probe(v):
    o = subprocess.check_output(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,r_frame_rate", "-of", "csv=p=0", v]).decode().strip().split(",")
    a, b = o[2].split("/")
    return int(o[0]), int(o[1]), float(a) / float(b)


def scan(v):
    W, H, fps = probe(v)
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-i", v, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
    n, out, i = W * H * 3, [], 0
    while True:
        b = p.stdout.read(n)
        if len(b) < n:
            break
        f = np.frombuffer(b, np.uint8).reshape(H, W, 3)
        hsv = cv2.cvtColor(f, cv2.COLOR_RGB2HSV)
        h, s, v_ = hsv[..., 0].astype(int), hsv[..., 1].astype(int), hsv[..., 2].astype(int)
        r, g, b_ = f[..., 0].astype(int), f[..., 1].astype(int), f[..., 2].astype(int)
        # exact key colours (magenta #ff00ff body, green #00ff00 face) with a tight RGB tolerance — scene greens/pinks never match
        body = (r > 205) & (b_ > 205) & (g < 60)
        face = (g > 215) & (r < 50) & (b_ < 50)
        allm = (body | face).astype(np.uint8)
        # keep only the hero blob: the connected component(s) touching the green face (else the largest blob)
        nc, lab, st, _ = cv2.connectedComponentsWithStats(cv2.morphologyEx(allm, cv2.MORPH_OPEN, np.ones((2, 2), np.uint8)), 8)
        keep = set(np.unique(lab[face & (lab > 0)]).tolist()) - {0}
        if not keep and nc > 1: keep = {int(np.argmax(st[1:, 4])) + 1}
        allm = np.isin(lab, list(keep)) if keep else np.zeros_like(face)
        face = face & allm
        if face.any():  # keep only the largest face blob (the hero's head)
            nf, fl, fs, _ = cv2.connectedComponentsWithStats(face.astype(np.uint8), 8)
            if nf > 2: face = fl == (int(np.argmax(fs[1:, 4])) + 1)
        rec = {"t": round(i / fps, 3), "vis": False, "body": None, "face": None, "hf": 0.0, "cut": False}
        if allm.sum() > W * H * 0.0015:
            ys, xs = np.nonzero(allm)
            x0, x1, y0, y1 = xs.min() / W, (xs.max() + 1) / W, ys.min() / H, (ys.max() + 1) / H
            rec.update(vis=True, body=[round(x0, 4), round(y0, 4), round(x1, 4), round(y1, 4)], hf=round(y1 - y0, 4),
                       cut=bool(x0 <= 0.002 or y0 <= 0.002 or x1 >= 0.998 or y1 >= 0.998))
            if face.sum() > W * H * 0.0003:
                fy, fx = np.nonzero(face)
                rec["face"] = [round(fx.min() / W, 4), round(fy.min() / H, 4), round((fx.max() + 1) / W, 4), round((fy.max() + 1) / H, 4)]
        out.append(rec)
        i += 1
    return {"fps": fps, "w": W, "h": H, "frames": out}


if __name__ == "__main__":
    r = scan(sys.argv[1])
    json.dump(r, open(sys.argv[2], "w"))
    vis = sum(f["vis"] for f in r["frames"])
    print(f"mask: {len(r['frames'])} frames @ {r['fps']:.2f} fps, Stickman visible in {100 * vis / max(1, len(r['frames'])):.1f} %")
