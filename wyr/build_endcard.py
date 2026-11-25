#!/usr/bin/env python3
"""Build the SUBSCRIBE end card ONCE -> wyr/assets/endcard/{endcard.mkv, endcard.wav}. Every episode reuses these files
unchanged (render.py appends them). Refuses to overwrite an existing card unless --force (user rule: never regenerate).
v4 (bright channel style, no mascot): sunburst + wave background, the channel's round PICK ONE DAILY logo
(assets/brand/logo_banner.png) full width, tagline, the pointing hand taps SUBSCRIBE -> grey SUBSCRIBED, bell rings, caption.
Video: 45 frames @30 fps, stored lossless (FFV1). Audio (24 kHz mono): Kokoro voice + click on the press + bell chime."""
import os, sys, math, subprocess, tempfile, numpy as np, soundfile as sf, cairo
from PIL import Image
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import render
from gfx import W, H, hexc, rrect, pil_to_surface, ease_out_back
from icons import render_icon

OUT = os.path.join(HERE, "assets", "endcard")
LINE = "Subscribe for tomorrow's choice!"; DUR = 1.5; FR = 45; PRESS, FLIP, RING = 0.42, 0.52, 0.68; SR = render.SR
INK = render.INK

def banner_logo(w):
    """the channel logo (assets/brand/logo_banner.png) full width, top/bottom edges feathered into the background"""
    im = Image.open(os.path.join(HERE, "assets", "brand", "logo_banner.png")).convert("RGBA")
    h = round(im.height * w / im.width); im = im.resize((w, h), Image.LANCZOS)
    a = np.ones((h, w), np.float32); f = 36
    a[:f] *= np.linspace(0, 1, f)[:, None]; a[-f:] *= np.linspace(1, 0, f)[:, None]
    arr = np.asarray(im).copy(); arr[..., 3] = (a * 255).astype(np.uint8)
    return pil_to_surface(Image.fromarray(arr, "RGBA")), w, h

def frame(ctx, t, logo, bell):
    # background continues the logo: warm sunburst above, purple below (logo ends in a purple wave)
    render.sunburst(ctx, W / 2, 560, 0, H, "#FFB000", "#FFC93C", "#FFF1A8", 0.35 * t)
    LY = 200
    g = cairo.LinearGradient(0, 0, 0, H); g.add_color_stop_rgb(0, *hexc("#8424EC")[:3]); g.add_color_stop_rgb(1, *hexc("#4E0FA8")[:3])
    ctx.rectangle(0, LY + 760, W, H); ctx.set_source(g); ctx.fill()
    ctx.save(); ctx.rectangle(0, LY + 760, W, H); ctx.clip(); ctx.set_source_rgba(1, 1, 1, 0.06)
    for k in range(18):
        a0 = 0.2 * t + k * 2 * math.pi / 18; a1 = a0 + math.pi / 18; cx, cy = W / 2, 1400
        ctx.move_to(cx, cy); ctx.line_to(cx + 2400 * math.cos(a0), cy + 2400 * math.sin(a0)); ctx.line_to(cx + 2400 * math.cos(a1), cy + 2400 * math.sin(a1)); ctx.close_path()
    ctx.fill(); ctx.restore()
    # logo, full width, gentle zoom
    surf, lw, lh = logo; k = 1.0 + 0.03 * (t / DUR) + 0.04 * (1 - min(1, t / 0.25)) ** 2 * -1
    render.paint(ctx, surf, W / 2, LY + lh / 2, lw, lh, scale=k)
    render.put(ctx, render.tsurf("A NEW IMPOSSIBLE CHOICE EVERY DAY", 46, "#FFFFFF"), W / 2, 1100)
    # SUBSCRIBE button
    pk = 0 if t < PRESS else (t - PRESS) / (FLIP - PRESS) if t < FLIP else max(0, 1 - (t - FLIP) / 0.12)
    done = t >= FLIP; sc = 1 - 0.08 * math.sin(math.pi * min(1, pk)) + (0.06 * math.exp(-(t - FLIP) * 10) if done else 0)
    bw, bh, bx, by = 560, 132, 430, 1260
    ctx.save(); ctx.translate(bx, by); ctx.scale(sc, sc)
    rrect(ctx, -bw / 2 + 4, -bh / 2 + 12, bw, bh, 66); ctx.set_source_rgba(0, 0, 0, 0.3); ctx.fill()
    rrect(ctx, -bw / 2 - 8, -bh / 2 - 8, bw + 16, bh + 16, 74); ctx.set_source_rgb(*hexc(INK)[:3]); ctx.fill()
    g = cairo.LinearGradient(0, -bh / 2, 0, bh / 2)
    for o, c in ((0, "#8A8C99" if done else "#FF4A4A"), (1, "#5E606C" if done else "#E0102A")): g.add_color_stop_rgb(o, *hexc(c)[:3])
    rrect(ctx, -bw / 2, -bh / 2, bw, bh, 66); ctx.set_source(g); ctx.fill()
    ctx.set_source_rgba(1, 1, 1, 0.55); ctx.set_line_width(10); ctx.set_line_cap(cairo.LINE_CAP_ROUND)
    ctx.move_to(-bw / 2 + 60, -bh / 2 + 24); ctx.line_to(-bw / 2 + 130, -bh / 2 + 24); ctx.stroke()
    if done:
        for lw_, col in ((20, hexc(INK)[:3]), (10, (1, 1, 1))):
            ctx.move_to(-222, 2); ctx.line_to(-200, 26); ctx.line_to(-162, -22); ctx.set_line_width(lw_); ctx.set_line_join(cairo.LINE_JOIN_ROUND); ctx.set_source_rgb(*col); ctx.stroke()
        render.put(ctx, render.tsurf("SUBSCRIBED", 56, "#FFFFFF"), 48, 2)
    else:
        render.put(ctx, render.tsurf("SUBSCRIBE", 64, "#FFFFFF"), 0, 2)
    ctx.restore()
    # bell
    bs, bwid, bhei = bell; u = t - RING; ang = math.radians(22 * math.sin(2 * math.pi * 5.5 * u) * math.exp(-2.6 * u)) if u > 0 else 0
    bcx, bcy = 845, 1260
    ctx.arc(bcx, bcy, 92, 0, 2 * math.pi); ctx.set_source_rgb(*hexc(INK)[:3]); ctx.fill()
    ctx.arc(bcx, bcy, 84, 0, 2 * math.pi); ctx.set_source_rgb(1, 1, 1); ctx.fill()
    ctx.save(); ctx.translate(bcx, bcy - 55); ctx.rotate(ang); ctx.translate(0, 55); render.paint(ctx, bs, 0, 0, bwid, bhei); ctx.restore()
    if u > 0: render.burst(ctx, bcx + 96, bcy - 30, 1, math.exp(-u * 2.5), 0.9); render.burst(ctx, bcx - 96, bcy - 30, -1, math.exp(-u * 2.5), 0.9)
    # pointing hand taps the button (same hand as in the episodes)
    tx, ty = bx + 200, by + 34; a = min(1, (t + 0.05) / (PRESS + 0.05)); e = 1 - (1 - a) ** 3
    sx, sy = 40, 2000; tap = math.exp(-((t - PRESS) / 0.06) ** 2)
    if t >= PRESS:
        q = (t - PRESS) / 0.4
        if q < 1:
            ctx.new_path(); ctx.arc(tx, ty, 30 + 90 * q, 0, 2 * math.pi); ctx.set_line_width(10 * (1 - q)); ctx.set_source_rgba(1, 1, 1, 0.9 * (1 - q)); ctx.stroke()
    render.draw_hand(ctx, sx + (tx - sx) * e + 4 * tap, sy + (ty - sy) * e + 10 * tap, -0.42, 0.95 - 0.08 * tap)
    # caption (voice line)
    render.put(ctx, render.tsurf(LINE, 50, "#FFFFFF"), W / 2, 1520)

def main():
    mkv, wav = os.path.join(OUT, "endcard.mkv"), os.path.join(OUT, "endcard.wav")
    if (os.path.exists(mkv) or os.path.exists(wav)) and "--force" not in sys.argv:
        sys.exit("end card already exists; it must stay identical in every episode (use --force only if the user asks for a new card)")
    os.makedirs(OUT, exist_ok=True)
    logo = banner_logo(int(W * 1.35)); bell = render_icon("bell", 120)
    surf = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H); ctx = cairo.Context(surf)
    ff = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgra", "-s", f"{W}x{H}", "-r", "30", "-i", "-",
                           "-c:v", "ffv1", "-level", "3", "-pix_fmt", "bgra", mkv], stdin=subprocess.PIPE)
    for f in range(FR):
        ctx.set_source_rgb(0, 0, 0); ctx.paint(); frame(ctx, f / 30, logo, bell); surf.flush(); ff.stdin.write(surf.get_data())
        if f in (0, 15, 30): surf.write_to_png(os.path.join(HERE, "out", f"endcard_{f:02d}.png"))
    ff.stdin.close(); ff.wait()
    # audio
    cache = os.path.join(HERE, "out", "_endcard_cache"); os.makedirs(cache, exist_ok=True)
    v, _ = render.tts(LINE, cache)
    if len(v) / SR > DUR - 0.08:   # pitch-preserving stretch so the line fits inside the card
        k = (len(v) / SR) / (DUR - 0.08)
        with tempfile.TemporaryDirectory() as td:
            a, b = os.path.join(td, "a.wav"), os.path.join(td, "b.wav"); sf.write(a, v, SR)
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", a, "-af", f"atempo={k:.4f}", b], check=True); v, _ = sf.read(b, dtype="float32")
    n = int(DUR * SR); mix = np.zeros(n, np.float32); t = np.arange(n) / SR
    mix[int(0.02 * SR): int(0.02 * SR) + len(v)] += v[: n - int(0.02 * SR)]
    tc = np.clip(t - PRESS, 0, None); mix += ((np.sin(2 * np.pi * 2200 * tc) * 0.5 + np.random.default_rng(1).standard_normal(n) * 0.5) * np.exp(-tc * 220) * (t >= PRESS) * 0.25).astype(np.float32)
    tb = np.clip(t - RING, 0, None)
    bellsnd = sum(a * np.sin(2 * np.pi * f * tb) for f, a in ((1568, 1.0), (2093, 0.55), (3136, 0.3), (4186, 0.15)))
    mix += (bellsnd * np.minimum(1, tb * 300) * np.exp(-tb * 4.5) * (1 + 0.25 * np.sin(2 * np.pi * 11 * tb)) * (t >= RING) * 0.14).astype(np.float32)
    mix[-int(0.03 * SR):] *= np.linspace(1, 0, int(0.03 * SR))
    sf.write(wav, mix, SR)
    print("end card ->", mkv, wav)

if __name__ == "__main__":
    main()
