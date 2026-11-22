#!/usr/bin/env python3
"""PUPPET FIT: trace the reference front view and the engine puppet (PuppetFit still), overlay them and measure.
usage: puppet_fit.py puppet_still.png out_dir  -> out_dir/fit_overlay.png + fit.json (IoU, head/hoodie/leg/shoe proportions)"""
import sys, json, cv2, numpy as np
REF = "assets/reference/STICKMAN_REFERENCE_SHEET_v3.png"; REF_BOX = (96, 406, 132, 318)  # front view on the v3 sheet

def fill(m):
    m = cv2.morphologyEx(m.astype(np.uint8) * 255, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8)); h, w = m.shape; ff = m.copy(); bg = np.zeros((h + 2, w + 2), np.uint8)
    for x in range(w):
        for y in (0, h - 1):
            if ff[y, x] == 0: cv2.floodFill(ff, bg, (x, y), 128)
    for y in range(h):
        for x in (0, w - 1):
            if ff[y, x] == 0: cv2.floodFill(ff, bg, (x, y), 128)
    s = (ff != 128).astype(np.uint8); n, lab, st, _ = cv2.connectedComponentsWithStats(s); return lab == 1 + np.argmax(st[1:, 4])

def ref_sil():
    y0, y1, x0, x1 = REF_BOX; im = cv2.imread(REF)[y0:y1, x0:x1]; hsv = cv2.cvtColor(im, cv2.COLOR_BGR2HSV)
    red = (hsv[..., 1] > 110) & (hsv[..., 2] > 80) & ((hsv[..., 0] < 12) | (hsv[..., 0] > 165)); return im, fill((im.max(2) < 70) | red)

def pup_sil(p):
    im = cv2.imread(p)[:, :400]; return im, fill(np.abs(im.astype(int) - 255).max(2) > 14)

def norm(im, s, H=600):
    ys, xs = np.where(s); y0, y1 = ys.min(), ys.max(); cx = (xs.min() + xs.max()) / 2; k = H / (y1 - y0)
    M = np.float32([[k, 0, 200 - cx * k], [0, k, 20 - y0 * k]]); return cv2.warpAffine(im, M, (400, H + 40), borderValue=(255, 255, 255)), cv2.warpAffine(s.astype(np.uint8), M, (400, H + 40)) > 0

def measure(s):
    ys, xs = np.where(s); top, bot = ys.min(), ys.max(); H = bot - top; prof = np.array([s[y].sum() for y in range(top, bot + 1)]) / H
    def band(a, b): return float(prof[int(a * H):int(b * H)].max())
    head_w = band(0.12, 0.36); hy = top + int(0.12 * H) + int(np.argmax(prof[int(.12 * H):int(.36 * H)]))
    leg = prof[int(0.74 * H):int(0.9 * H)]
    return {"head_width": round(head_w, 3), "head_center_y": round((hy - top) / H, 3), "body_width": round(band(0.5, 0.74), 3), "leg_gap_width": round(float(np.median(leg)), 3), "shoe_width": round(band(0.92, 1.0), 3)}

if __name__ == "__main__":
    out = sys.argv[2]; ri, rs = norm(*ref_sil()); pi, ps = norm(*pup_sil(sys.argv[1]))
    iou = float((rs & ps).sum() / (rs | ps).sum()); R, P = measure(rs), measure(ps)
    ov = ri.copy(); ov[ps & ~rs] = (0.4 * ov[ps & ~rs] + 0.6 * np.array([255, 0, 255])).astype(np.uint8); ov[rs & ~ps] = (0.4 * ov[rs & ~ps] + 0.6 * np.array([0, 200, 0])).astype(np.uint8)
    cv2.imwrite(f"{out}/fit_overlay.png", np.hstack([ri, pi, ov]))
    res = {"iou": round(iou, 3), "reference": R, "puppet": P}; json.dump(res, open(f"{out}/fit.json", "w"), indent=1); print(json.dumps(res))
