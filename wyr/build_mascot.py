#!/usr/bin/env python3
"""Build the mascot pose PNGs (assets/mascot/*.png) from the Stickman v3 reference sheet. Run once.
Body = FRONT view; expressions = heads from the EXPRESSIONS row swapped onto it; 'thumbs' = first ACTION POSE."""
import os, cv2, numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SHEET = os.path.join(HERE, "..", "pack", "Stick3D-Pack", "assets", "reference", "STICKMAN_REFERENCE_SHEET_v3.png")
OUT = os.path.join(HERE, "assets", "mascot"); os.makedirs(OUT, exist_ok=True)
S = 3  # upscale factor before cutting (cleaner edges)

sheet = np.array(Image.open(SHEET).convert("RGB"))

def cut(box):
    """crop + remove the light grid background (flood fill from the border + bluish enclosed gaps)"""
    x0, y0, x1, y1 = box
    im = cv2.resize(sheet[y0:y1, x0:x1], None, fx=S, fy=S, interpolation=cv2.INTER_LANCZOS4)
    h, w = im.shape[:2]
    hsv = cv2.cvtColor(im, cv2.COLOR_RGB2HSV)
    r, g, b = [im[..., i].astype(int) for i in range(3)]
    bgish = ((hsv[..., 2] > 170) & (hsv[..., 1] < 70)) & ~((r > 235) & (g > 235) & (b > 235) & (abs(b - r) < 6))
    bgish |= (hsv[..., 2] > 200) & (hsv[..., 1] < 40) & (b - r > 6)
    cand = bgish.astype(np.uint8)
    n, lab = cv2.connectedComponents(cand, connectivity=4)
    border = set(np.unique(np.r_[lab[0], lab[-1], lab[:, 0], lab[:, -1]])) - {0}
    bg = np.isin(lab, list(border))
    # enclosed bluish pockets (e.g. between the legs)
    for k in range(1, n):
        if k in border: continue
        m = lab == k
        ys = np.nonzero(m)[0]
        if m.sum() > 40 * S * S and ys.mean() > 0.74 * h and (b[m] - r[m]).mean() > 8: bg |= m  # only the leg gap
    alpha = (~bg).astype(np.uint8) * 255
    alpha = cv2.morphologyEx(alpha, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    # keep the largest blob + anything touching it
    n2, lab2, st, _ = cv2.connectedComponentsWithStats((alpha > 0).astype(np.uint8), connectivity=8)
    if n2 > 1:
        big = 1 + np.argmax(st[1:, cv2.CC_STAT_AREA]); alpha[lab2 != big] = 0
    alpha = cv2.GaussianBlur(alpha, (3, 3), 0)
    return np.dstack([im, alpha])

# front body (sheet px): head centre (221,171) r~47
BODY_BOX = (140, 92, 302, 406)
HEAD_C, HEAD_R = (221, 171), 47
EXPR_X = {"excited": 260, "surprised": 345, "scared": 430, "thinking": 515, "laughing": 861, "wow": 944}
EXPR_Y0, EXPR_Y1, EXPR_HALF, EXPR_R, EXPR_CY = 444, 530, 42, 34, 492

body = cut(BODY_BOX)
bx0, by0 = BODY_BOX[:2]
Image.fromarray(body).save(os.path.join(OUT, "happy.png"))

for name, cx in EXPR_X.items():
    head = cut((cx - EXPR_HALF, EXPR_Y0, cx + EXPR_HALF, EXPR_Y1 + 6))
    # solid face disc (the face shading is close to the paper colour) + flood cutout above it for the hair
    yy, xx = np.mgrid[:head.shape[0], :head.shape[1]]
    # fit the head circle to the dark outline: least squares on dark pixels near the expected ring
    hx, hy, hr = EXPR_HALF * S, (EXPR_CY - EXPR_Y0) * S, EXPR_R * S
    dark = head[..., :3].astype(int).sum(2) < 200
    for _ in range(3):
        d = np.hypot(xx - hx, yy - hy); ring = dark & (abs(d - hr) < 5 * S) & (yy > hy - 0.4 * hr)
        py, px = np.nonzero(ring)
        A = np.c_[2 * px, 2 * py, np.ones(len(px))]; sol = np.linalg.lstsq(A, px ** 2 + py ** 2, rcond=None)[0]
        hx, hy = sol[0], sol[1]; hr = np.sqrt(sol[2] + hx ** 2 + hy ** 2)
    print(name, "head fit", round(hx / S, 1), round(hy / S, 1), round(hr / S, 1))
    disc = (xx - hx) ** 2 + (yy - hy) ** 2 <= (hr + 1.0 * S) ** 2
    a = head[..., 3].copy(); a[yy > hy - EXPR_R * 0.55 * S] = 0
    head[..., 3] = np.maximum(a, cv2.GaussianBlur(disc.astype(np.uint8) * 255, (5, 5), 0))
    k = HEAD_R * S / hr
    hh = cv2.resize(head, None, fx=k, fy=k, interpolation=cv2.INTER_LANCZOS4)
    out = body.copy()
    # erase the original head (circle + everything above the head centre)
    yy, xx = np.mgrid[:out.shape[0], :out.shape[1]]
    hcx, hcy = (HEAD_C[0] - bx0) * S, (HEAD_C[1] - by0) * S
    out[..., 3][((xx - hcx) ** 2 + (yy - hcy) ** 2 < (HEAD_R * S + 4) ** 2) | (yy < hcy)] = 0
    # paste the expression head so its circle centre lands on the body head centre
    ox = int(hcx - hx * k)
    oy = int(hcy - hy * k)
    pad = max(0, -oy)
    if pad:
        out = np.vstack([np.zeros((pad, out.shape[1], 4), np.uint8), out]); oy += pad
    canvas = Image.fromarray(out); canvas.alpha_composite(Image.fromarray(hh), (ox, oy))
    canvas.save(os.path.join(OUT, f"{name}.png"))

Image.fromarray(cut((118, 562, 222, 712))).save(os.path.join(OUT, "thumbs.png"))
print("mascot poses ->", OUT, sorted(os.listdir(OUT)))
