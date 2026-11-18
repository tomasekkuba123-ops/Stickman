#!/usr/bin/env python3
"""cutouts.py: cut painted objects out of a background into soft-edged sprites + an inpainted clean plate.
usage: cutouts.py <bg.png> <spec.json> <outdir> <prefix>
spec = [{"name":..., "box":[x0,y0,x1,y1], "kind":"float|blob|static"}, ...]   (BG pixel coords)
writes <prefix>_plate.png, <prefix>_<name>.png and appends to <outdir>/manifest.json"""
import sys, json, os, cv2, numpy as np
bg, specf, out, prefix = sys.argv[1:5]
im = cv2.imread(bg, cv2.IMREAD_COLOR); H, W = im.shape[:2]; spec = json.load(open(specf))
mask = np.zeros((H, W), np.uint8); PAD = 10
def rrect(m, x0, y0, x1, y1, r, val):
    cv2.rectangle(m, (x0 + r, y0), (x1 - r, y1), val, -1); cv2.rectangle(m, (x0, y0 + r), (x1, y1 - r), val, -1)
    for cx, cy in [(x0 + r, y0 + r), (x1 - r, y0 + r), (x0 + r, y1 - r), (x1 - r, y1 - r)]: cv2.circle(m, (cx, cy), r, val, -1)
for s in spec:
    x0, y0, x1, y1 = s["box"]; rrect(mask, max(0, x0 - PAD), max(0, y0 - PAD), min(W - 1, x1 + PAD), min(H - 1, y1 + PAD), 24, 255)
plate = cv2.inpaint(im, cv2.dilate(mask, np.ones((9, 9), np.uint8)), 18, cv2.INPAINT_TELEA)
plate = np.where(mask[..., None] > 0, cv2.GaussianBlur(plate, (0, 0), 6), plate)  # soften the filled areas
cv2.imwrite(os.path.join(out, f"{prefix}_plate.png"), plate)
manp = os.path.join(out, "manifest.json"); man = json.load(open(manp)) if os.path.exists(manp) else {}
for s in spec:
    x0, y0, x1, y1 = s["box"]; X0, Y0, X1, Y1 = max(0, x0 - PAD), max(0, y0 - PAD), min(W, x1 + PAD), min(H, y1 + PAD)
    crop = im[Y0:Y1, X0:X1]; a = np.zeros(crop.shape[:2], np.uint8); rrect(a, 3, 3, crop.shape[1] - 4, crop.shape[0] - 4, 22, 255)
    a = cv2.GaussianBlur(a, (0, 0), 4); rgba = np.dstack([crop, a]); fn = f"{prefix}_{s['name']}.png"; cv2.imwrite(os.path.join(out, fn), rgba)
    man[f"{prefix}_{s['name']}"] = {"file": fn, "x": X0, "y": Y0, "w": X1 - X0, "h": Y1 - Y0, "kind": s.get("kind", "float"), "bg": prefix}
json.dump(man, open(manp, "w"), indent=1); print(prefix, len(spec), "sprites")
