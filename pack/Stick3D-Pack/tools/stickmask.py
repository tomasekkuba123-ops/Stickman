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
        hand = (b_ > 205) & (r < 60) & (g < 60)  # v18: gloves (blue)
        allm = (body | face | hand).astype(np.uint8)
        # keep only the hero blob: the connected component(s) touching the green face (else the largest blob)
        opn = cv2.morphologyEx(allm, cv2.MORPH_OPEN, np.ones((2, 2), np.uint8))
        # bridge thin outline/dim gaps (dark-scene rim shading) between head and body before grouping blobs
        nc, lab, st, _ = cv2.connectedComponentsWithStats(cv2.dilate(opn, np.ones((5, 5), np.uint8)), 8)
        keep = set(np.unique(lab[face & (lab > 0)]).tolist()) - {0}
        if not keep and nc > 1: keep = {int(np.argmax(st[1:, 4])) + 1}
        # v19: hero parts split off by an occluder in front of him (a prop, a puff, a thin arm lost at mask scale) are still the hero:
        # merge blobs whose centre lies inside the figure envelope measured from the face disc (full height ~ 4.6 face heights)
        fm = face & np.isin(lab, list(keep)) if keep else None
        if fm is not None and fm.any():
            ys, xs = np.nonzero(fm); D = ys.max() - ys.min() + 1; cx = xs.mean(); top = ys.min()
            for k in range(1, nc):
                if k in keep: continue
                kx, ky = st[k, 0] + st[k, 2] / 2, st[k, 1] + st[k, 3] / 2
                if abs(kx - cx) < 2.6 * D and top - 0.4 * D < ky < top + 4.8 * D: keep.add(k)
        allm = (np.isin(lab, list(keep)) & (opn > 0)) if keep else np.zeros_like(face)
        # v18 stray sprites: other hero-coloured blobs not connected to the hero (duplicate puppets, leftover billboards)
        stray = int(sum(1 for k in range(1, nc) if k not in keep and st[k, 4] > W * H * 0.002)) if nc > 1 else 0
        hand = hand & allm
        face = face & allm
        if face.any():  # keep only the largest face blob (the hero's head)
            nf, fl, fs, _ = cv2.connectedComponentsWithStats(face.astype(np.uint8), 8)
            if nf > 2: face = fl == (int(np.argmax(fs[1:, 4])) + 1)
        rec = {"t": round(i / fps, 3), "vis": False, "body": None, "face": None, "hf": 0.0, "cut": False, "hands": [], "stray": stray}
        if hand.any():
            nh, hl, hs, _ = cv2.connectedComponentsWithStats(hand.astype(np.uint8), 8)
            for k in range(1, nh):
                if hs[k, 4] > W * H * 0.0002: x, y, w, h = hs[k, :4]; rec["hands"].append([round(x / W, 4), round(y / H, 4), round((x + w) / W, 4), round((y + h) / H, 4)])
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
