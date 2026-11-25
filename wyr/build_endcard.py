#!/usr/bin/env python3
"""Build the SUBSCRIBE end card ONCE -> wyr/assets/endcard/{endcard.mkv, endcard.wav}. Every episode reuses these files
unchanged (render.py appends them). Refuses to overwrite an existing card unless --force (user rule: never regenerate).
v4 (bright channel style, no mascot): sunburst + wave background, the channel's round PICK ONE DAILY logo
(assets/brand/logo_round.png), tagline, SUBSCRIBE button press -> grey SUBSCRIBED, bell rings, caption.
Video: 45 frames @30 fps, stored lossless (FFV1). Audio (24 kHz mono): Kokoro voice + click on the press + bell chime."""
import os, sys, math, subprocess, tempfile, numpy as np, soundfile as sf, cairo
from PIL import Image, ImageDraw, ImageFilter
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import render
from gfx import W, H, hexc, rrect, pil_to_surface, ease_out_back
from icons import render_icon

OUT = os.path.join(HERE, "assets", "endcard")
LINE = "Subscribe for tomorrow's choice!"; DUR = 1.5; FR = 45; PRESS, FLIP, RING = 0.42, 0.52, 0.68; SR = render.SR
INK = render.INK

def round_logo(d):
    im = Image.open(os.path.join(HERE, "assets", "brand", "logo_round.png")).convert("RGB")
    s = min(im.size); im = im.crop(((im.width - s) // 2, (im.height - s) // 2, (im.width + s) // 2, (im.height + s) // 2))
    big = 4 * d; m = Image.new("L", (big, big), 0); ImageDraw.Draw(m).ellipse((int(big * 0.012), int(big * 0.012), int(big * 0.988), int(big * 0.988)), fill=255)
    out = im.resize((d, d), Image.LANCZOS).convert("RGBA"); out.putalpha(m.resize((d, d), Image.LANCZOS)); return pil_to_surface(out), d

def frame(ctx, t, logo, bell):
    per = 1 / DUR
    # background: warm sunburst on top, blue wave + purple swoosh below (channel art)
    render.sunburst(ctx, W / 2, 640, 0, H, "#FFB000", "#FFC93C", "#FFF1A8", 0.35 * t)
    ctx.save(); render.wave_path(ctx, t, 1240, 22); ctx.line_to(W + 10, H); ctx.line_to(-10, H); ctx.close_path(); ctx.clip()
    render.sunburst(ctx, W / 2, 1600, 1100, H, "#1677FF", "#2A8CFF", "#8FD0FF", -0.35 * t); ctx.restore()
    for lw, col in ((26, hexc(INK)), (14, (1, 1, 1, 1))):
        render.wave_path(ctx, t, 1240, 22); ctx.set_line_width(lw); ctx.set_source_rgba(*col); ctx.stroke()
    ctx.move_to(-10, H - 120)
    for x in range(0, W + 41, 40): ctx.line_to(x, H - 150 + 30 * math.sin(x / 700 * 2 * math.pi + 1.2 + t * 0.8))
    ctx.line_to(W + 10, H); ctx.line_to(-10, H); ctx.close_path(); ctx.set_source_rgb(*hexc("#7A1FE0")[:3]); ctx.fill()
    # logo
    surf, d = logo; k = 0.82 + 0.18 * ease_out_back(min(1, t / 0.3)); bob = 6 * math.sin(2 * math.pi * per * t)
    cx, cy = W / 2, 640 + bob
    ctx.arc(cx + 6, cy + 18, d / 2 * k + 10, 0, 2 * math.pi); ctx.set_source_rgba(0, 0, 0, 0.3); ctx.fill()
    ctx.arc(cx, cy, d / 2 * k + 10, 0, 2 * math.pi); ctx.set_source_rgb(*hexc(INK)[:3]); ctx.fill()
    render.paint(ctx, surf, cx, cy, d, d, scale=k)
    a = 0.6 + 0.4 * math.sin(2 * math.pi * 2 * per * t)
    render.burst(ctx, cx - d / 2 * k - 18, cy - 40, -1, a, 1.3); render.burst(ctx, cx + d / 2 * k + 18, cy - 40, 1, a, 1.3)
    render.put(ctx, render.tsurf("A NEW IMPOSSIBLE CHOICE EVERY DAY", 46, "#FFFFFF"), W / 2, 1065)
    # SUBSCRIBE button
    pk = 0 if t < PRESS else (t - PRESS) / (FLIP - PRESS) if t < FLIP else max(0, 1 - (t - FLIP) / 0.12)
    done = t >= FLIP; sc = 1 - 0.08 * math.sin(math.pi * min(1, pk)) + (0.06 * math.exp(-(t - FLIP) * 10) if done else 0)
    bw, bh, bx, by = 560, 132, 430, 1200
    ctx.save(); ctx.translate(bx, by); ctx.scale(sc, sc)
    rrect(ctx, -bw / 2 + 4, -bh / 2 + 12, bw, bh, 66); ctx.set_source_rgba(0, 0, 0, 0.3); ctx.fill()
    rrect(ctx, -bw / 2 - 8, -bh / 2 - 8, bw + 16, bh + 16, 74); ctx.set_source_rgb(*hexc(INK)[:3]); ctx.fill()
    g = cairo.LinearGradient(0, -bh / 2, 0, bh / 2)
    for o, c in ((0, "#8A8C99" if done else "#FF4A4A"), (1, "#5E606C" if done else "#E0102A")): g.add_color_stop_rgb(o, *hexc(c)[:3])
    rrect(ctx, -bw / 2, -bh / 2, bw, bh, 66); ctx.set_source(g); ctx.fill()
    ctx.set_source_rgba(1, 1, 1, 0.55); ctx.set_line_width(10); ctx.set_line_cap(cairo.LINE_CAP_ROUND)
    ctx.move_to(-bw / 2 + 60, -bh / 2 + 24); ctx.line_to(-bw / 2 + 130, -bh / 2 + 24); ctx.stroke()
    if done:
        for lw, col in ((20, hexc(INK)[:3]), (10, (1, 1, 1))):
            ctx.move_to(-222, 2); ctx.line_to(-200, 26); ctx.line_to(-162, -22); ctx.set_line_width(lw); ctx.set_line_join(cairo.LINE_JOIN_ROUND); ctx.set_source_rgb(*col); ctx.stroke()
        render.put(ctx, render.tsurf("SUBSCRIBED", 56, "#FFFFFF"), 48, 2)
    else:
        render.put(ctx, render.tsurf("SUBSCRIBE", 64, "#FFFFFF"), 0, 2)
    ctx.restore()
    # bell
    bs, bwid, bhei = bell; u = t - RING; ang = math.radians(22 * math.sin(2 * math.pi * 5.5 * u) * math.exp(-2.6 * u)) if u > 0 else 0
    bcx, bcy = 845, 1200
    ctx.arc(bcx, bcy, 92, 0, 2 * math.pi); ctx.set_source_rgb(*hexc(INK)[:3]); ctx.fill()
    ctx.arc(bcx, bcy, 84, 0, 2 * math.pi); ctx.set_source_rgb(1, 1, 1); ctx.fill()
    ctx.save(); ctx.translate(bcx, bcy - 55); ctx.rotate(ang); ctx.translate(0, 55); render.paint(ctx, bs, 0, 0, bwid, bhei); ctx.restore()
    if u > 0: render.burst(ctx, bcx + 96, bcy - 30, 1, math.exp(-u * 2.5), 0.9)
    # caption (voice line)
    render.put(ctx, render.tsurf(LINE, 50, "#FFFFFF"), W / 2, 1420)

def main():
    mkv, wav = os.path.join(OUT, "endcard.mkv"), os.path.join(OUT, "endcard.wav")
    if (os.path.exists(mkv) or os.path.exists(wav)) and "--force" not in sys.argv:
        sys.exit("end card already exists; it must stay identical in every episode (use --force only if the user asks for a new card)")
    os.makedirs(OUT, exist_ok=True)
    logo = round_logo(700); bell = render_icon("bell", 120)
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
