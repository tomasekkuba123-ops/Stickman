"""Render the 8-minute visual cut of "What If Stickman Entered the Wrong Elevator?".

30 stills (images/SCENE_01.jpg .. SCENE_30.jpg), each owning exactly 16.000 s of the timeline.
Motion is camera-only (the artwork itself is never warped non-uniformly, so the Stickman is not
deformed): a slow Ken Burns zoom of 2-5 % or a gentle lateral pan, eased, plus a soft foreground
layer of out-of-focus light motes that drifts faster than the camera (parallax depth cue).
Scene changes are 0.6 s dissolves centred on the 16 s boundaries, so the 50 % point of every
dissolve sits exactly on 00:16, 00:32 ... and no black/grey frames are ever produced.

Usage:
  python3 tools/render_video.py --out out/master_clean.mp4            # full render, no subtitles
  python3 tools/render_video.py --out out/test.mp4 --start 0 --dur 20  # partial preview
  python3 tools/render_video.py --still 47.5 --out out/frame.png       # single frame
"""
import argparse, math, pathlib, subprocess, sys
import cv2
import numpy as np

ROOT = pathlib.Path(__file__).resolve().parent.parent
W, H, FPS = 1920, 1080, 30
SCENE_LEN = 16.0
N_SCENES = 30
XFADE = 0.6  # total dissolve length, centred on each boundary

# Camera plan per scene: (kind, params)
#  ("in",  fx, fy)      zoom 1.02 -> 1.06 towards focus point (normalised image coords)
#  ("out", fx, fy)      zoom 1.06 -> 1.02 away from focus point
#  ("pan", x0, x1, fy)  zoom 1.05 constant, centre slides x0 -> x1 (normalised)
CAMERA = {
    1: ("in", 0.42, 0.45),    # evening walk: settle on Stickman
    2: ("pan", 0.40, 0.62, 0.5),  # from Stickman to the golden elevator
    3: ("in", 0.62, 0.32),    # towards the glowing zero button
    4: ("in", 0.62, 0.50),    # into the purple portal
    5: ("out", 0.62, 0.45),   # reveal the upside-down city
    6: ("in", 0.55, 0.40),    # tumbling Stickman
    7: ("in", 0.55, 0.45),    # leap into the doors
    8: ("out", 0.30, 0.65),   # reveal the giant toy room
    9: ("pan", 0.62, 0.40, 0.5),  # chase: from Stickman back to the train
    10: ("pan", 0.38, 0.62, 0.5), # dash towards the elevator
    11: ("out", 0.35, 0.50),  # reveal underwater kingdom
    12: ("pan", 0.38, 0.62, 0.45),# from Stickman to the octopus
    13: ("pan", 0.40, 0.62, 0.5), # leap towards the blue portal
    14: ("out", 0.35, 0.50),  # reveal world of stopped time
    15: ("in", 0.50, 0.45),   # pushing the clock hand
    16: ("in", 0.50, 0.45),   # clinging to broken platform
    17: ("in", 0.65, 0.40),   # the crystal goes back in
    18: ("pan", 0.38, 0.62, 0.5), # across the three doorways
    19: ("in", 0.58, 0.40),   # towards the home door
    20: ("pan", 0.40, 0.62, 0.5), # from Stickman to the wardrobe
    21: ("in", 0.55, 0.40),   # golden ticket
    22: ("pan", 0.38, 0.60, 0.5), # across the glowing map
    23: ("in", 0.48, 0.42),   # ticket raised
    24: ("out", 0.30, 0.55),  # reveal kingdom of lost things
    25: ("pan", 0.38, 0.62, 0.5), # along the book path
    26: ("in", 0.60, 0.42),   # reaching for the key
    27: ("in", 0.60, 0.45),   # key in the lock
    28: ("out", 0.35, 0.50),  # lost things fly home
    29: ("pan", 0.40, 0.64, 0.5), # run towards the home doorway
    30: ("out", 0.40, 0.45),  # final pull-back in the bedroom
}


def ease(u):
    u = min(max(u, 0.0), 1.0)
    return 0.5 - 0.5 * math.cos(math.pi * u)


def camera(scene, local_t):
    """Return (zoom, cx, cy) in source pixels. local_t may run slightly outside 0..16 for dissolves."""
    kind, *p = CAMERA[scene]
    # map -XFADE/2 .. 16+XFADE/2 onto 0..1 so motion never stops inside a dissolve
    u = ease((local_t + XFADE / 2) / (SCENE_LEN + XFADE))
    if kind == "in":
        z = 1.02 + 0.04 * u; fx, fy = p
        cx = 0.5 + (fx - 0.5) * u; cy = 0.5 + (fy - 0.5) * u
    elif kind == "out":
        z = 1.06 - 0.04 * u; fx, fy = p
        cx = 0.5 + (fx - 0.5) * (1 - u); cy = 0.5 + (fy - 0.5) * (1 - u)
    else:
        z = 1.05; x0, x1, fy = p
        cx = x0 + (x1 - x0) * u; cy = fy
    # clamp so the window never leaves the picture (no black borders)
    hw, hh = 0.5 / z, 0.5 / z
    cx = min(max(cx, hw), 1 - hw); cy = min(max(cy, hh), 1 - hh)
    return z, cx * W, cy * H


def render_scene(img, scene, local_t):
    z, cx, cy = camera(scene, local_t)
    # output (u,v) -> source: x = cx + (u - W/2)/z  => inverse map matrix for warpAffine(WARP_INVERSE_MAP)
    M = np.array([[1 / z, 0, cx - (W / 2) / z], [0, 1 / z, cy - (H / 2) / z]], dtype=np.float64)
    return cv2.warpAffine(img, M, (W, H), flags=cv2.INTER_CUBIC | cv2.WARP_INVERSE_MAP,
                          borderMode=cv2.BORDER_REFLECT)


class Motes:
    """Soft bokeh light motes in the foreground. Deterministic per scene; moves ~2.5x the camera pan."""

    def __init__(self, scene, img):
        rng = np.random.default_rng(1000 + scene)
        n = 26
        self.x = rng.uniform(0, W, n); self.y = rng.uniform(0, H * 0.78, n)
        self.r = rng.uniform(6, 22, n); self.a = rng.uniform(0.05, 0.14, n)
        self.vx = rng.uniform(-6, 6, n); self.vy = rng.uniform(-14, -4, n)  # px/s gentle upward drift
        self.ph = rng.uniform(0, 2 * math.pi, n); self.tw = rng.uniform(0.3, 0.9, n)
        # tint from the brightest 2 % of the image so motes match the scene's light
        flat = img.reshape(-1, 3).astype(np.float32)
        lum = flat @ np.array([0.114, 0.587, 0.299], np.float32)
        top = flat[lum >= np.percentile(lum, 98)].mean(0)
        self.col = (top / max(top.max(), 1) * 255).astype(np.float32)
        self.scene = scene

    def layer(self, local_t):
        z, cx, cy = camera(self.scene, local_t)
        z0, cx0, cy0 = camera(self.scene, 0.0)
        par = 2.5  # parallax factor relative to the background
        dx = -(cx - cx0) * par; dy = -(cy - cy0) * par
        zs = 1 + (z - z0) * par
        lay = np.zeros((H, W), np.float32)
        for i in range(len(self.x)):
            x = (self.x[i] + self.vx[i] * local_t + dx - W / 2) * zs + W / 2
            y = (self.y[i] + self.vy[i] * local_t + dy - H / 2) * zs + H / 2
            x %= W; y %= H
            a = self.a[i] * (0.65 + 0.35 * math.sin(self.ph[i] + self.tw[i] * local_t))
            cv2.circle(lay, (int(x * 4), int(y * 4)), int(self.r[i] * zs * 4), float(a), -1, cv2.LINE_AA, 2)
        lay = cv2.GaussianBlur(lay, (0, 0), 7)
        return lay


def frame_at(t, cache):
    """Compose the frame at absolute time t (seconds)."""
    s = min(int(t // SCENE_LEN), N_SCENES - 1)
    local = t - s * SCENE_LEN
    parts = [(s + 1, local, 1.0)]
    half = XFADE / 2
    if local > SCENE_LEN - half and s + 1 < N_SCENES:      # dissolve into next
        w = ease((local - (SCENE_LEN - half)) / XFADE)
        parts = [(s + 1, local, 1 - w), (s + 2, local - SCENE_LEN, w)]
    elif local < half and s > 0:                             # dissolve from previous
        w = ease((local + half) / XFADE)
        parts = [(s, local + SCENE_LEN, 1 - w), (s + 1, local, w)]
    out = np.zeros((H, W, 3), np.float32)
    for sc, lt, wgt in parts:
        img, motes = cache(sc)
        f = render_scene(img, sc, lt).astype(np.float32)
        m = motes.layer(lt)[..., None]
        f = f + (motes.col - f) * m  # screen-ish tint towards mote colour
        out += f * wgt
    return np.clip(out + 0.5, 0, 255).astype(np.uint8)


def make_cache():
    store = {}

    def get(sc):
        if sc not in store:
            if len(store) > 3:
                store.pop(min(store))
            p = ROOT / "images" / f"SCENE_{sc:02d}.jpg"
            img = cv2.imread(str(p), cv2.IMREAD_COLOR)
            if img is None or img.shape[:2] != (H, W):
                sys.exit(f"bad or missing image {p}")
            store[sc] = (img, Motes(sc, img))
        return store[sc]
    return get


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True)
    ap.add_argument("--start", type=float, default=0.0)
    ap.add_argument("--dur", type=float, default=N_SCENES * SCENE_LEN)
    ap.add_argument("--still", type=float)
    ap.add_argument("--crf", default="18")
    a = ap.parse_args()
    out = pathlib.Path(a.out); out.parent.mkdir(parents=True, exist_ok=True)
    cache = make_cache()
    if a.still is not None:
        cv2.imwrite(str(out), frame_at(a.still, cache)); return
    n = int(round(a.dur * FPS)); f0 = int(round(a.start * FPS))
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}",
           "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "slow", "-crf", a.crf,
           "-pix_fmt", "yuv420p", "-profile:v", "high", "-g", str(FPS * 2),
           "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709",
           "-movflags", "+faststart", str(out)]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for i in range(n):
        t = (f0 + i) / FPS
        p.stdin.write(frame_at(t, cache).tobytes())
        if i % (FPS * 16) == 0:
            print(f"  t={t:7.2f}s  frame {i}/{n}", flush=True)
    p.stdin.close(); sys.exit(p.wait())


if __name__ == "__main__":
    main()
