"""Shared drawing helpers: colors, easing, PIL text -> cairo surfaces, shapes."""
import math, os
from functools import lru_cache
import numpy as np, cairo
from PIL import Image, ImageDraw, ImageFont, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
FONT = os.path.join(HERE, "assets", "fonts", "Fredoka.ttf")
INK = (27, 27, 47)          # outline / dark text
W, H = 1080, 1920


def hexc(h, a=1.0):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)) + (a,)


# ---------- easing ----------
def clamp(x, a=0.0, b=1.0):
    return a if x < a else b if x > b else x

def ease_out_cubic(x):
    x = clamp(x); return 1 - (1 - x) ** 3

def ease_in_cubic(x):
    x = clamp(x); return x ** 3

def ease_out_back(x, s=2.2):
    x = clamp(x); x -= 1; return 1 + (s + 1) * x ** 3 + s * x ** 2

def pop(t, dur=0.32):
    """scale for a pop-in that starts at t=0 (0 before)"""
    if t <= 0: return 0.0
    return ease_out_back(t / dur)


# ---------- PIL -> cairo ----------
def pil_to_surface(img):
    img = img.convert("RGBA")
    a = np.asarray(img).astype(np.uint16)
    alpha = a[..., 3:4]
    rgb = (a[..., :3] * alpha // 255).astype(np.uint8)
    bgra = np.concatenate([rgb[..., ::-1], a[..., 3:4].astype(np.uint8)], axis=2)
    h, w = bgra.shape[:2]
    buf = bytearray(bgra.tobytes())
    surf = cairo.ImageSurface.create_for_data(buf, cairo.FORMAT_ARGB32, w, h, w * 4)
    # pycairo keeps a reference to buf
    return surf


@lru_cache(maxsize=64)
def font(size):
    f = ImageFont.truetype(FONT, size)
    f.set_variation_by_axes([700, 100])  # Bold
    return f


@lru_cache(maxsize=512)
def text_surface(text, size, fill="#FFFFFF", stroke=None, stroke_fill=INK, shadow=True):
    """Bold rounded text with a dark outline + soft drop shadow. Returns (surface, w, h)."""
    f = font(size)
    stroke = int(size * 0.11) if stroke is None else stroke
    l, t, r, b = f.getbbox(text, stroke_width=stroke)
    pad = stroke + int(size * 0.18)
    w, h = r - l + 2 * pad, b - t + 2 * pad
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    if shadow:
        sh = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        ImageDraw.Draw(sh).text((pad - l, pad - t + size * 0.07), text, font=f, fill=(0, 0, 0, 110),
                                stroke_width=stroke, stroke_fill=(0, 0, 0, 110))
        img = Image.alpha_composite(img, sh.filter(ImageFilter.GaussianBlur(size * 0.04)))
    ImageDraw.Draw(img).text((pad - l, pad - t), text, font=f, fill=fill, stroke_width=stroke, stroke_fill=stroke_fill)
    return pil_to_surface(img), w, h


def text_width(text, size):
    l, t, r, b = font(size).getbbox(text)
    return r - l


def wrap(text, size, max_w, max_lines=2):
    """greedy wrap; shrinks size until it fits in max_lines. returns (lines, size)"""
    while True:
        words, lines, cur = text.split(), [], ""
        for wd in words:
            test = (cur + " " + wd).strip()
            if text_width(test, size) <= max_w or not cur:
                cur = test
            else:
                lines.append(cur); cur = wd
        lines.append(cur)
        if (len(lines) <= max_lines and all(text_width(l, size) <= max_w for l in lines)) or size < 40:
            return lines, size
        size -= 4


def paint(ctx, surf, cx, cy, w, h, scale=1.0, alpha=1.0, rot=0.0):
    if scale <= 0.001 or alpha <= 0.001: return
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.scale(scale, scale)
    ctx.set_source_surface(surf, -w / 2, -h / 2)
    ctx.get_source().set_filter(cairo.FILTER_GOOD)
    ctx.paint_with_alpha(alpha); ctx.restore()


# ---------- shapes ----------
def rrect(ctx, x, y, w, h, r):
    r = min(r, w / 2, h / 2)
    ctx.new_sub_path()
    ctx.arc(x + w - r, y + r, r, -math.pi / 2, 0)
    ctx.arc(x + w - r, y + h - r, r, 0, math.pi / 2)
    ctx.arc(x + r, y + h - r, r, math.pi / 2, math.pi)
    ctx.arc(x + r, y + r, r, math.pi, 1.5 * math.pi)
    ctx.close_path()

def fill_stroke(ctx, fill, lw=10, ink=INK):
    ctx.set_source_rgba(*hexc(fill) if isinstance(fill, str) else fill); ctx.fill_preserve()
    ctx.set_source_rgb(*[c / 255 for c in ink]); ctx.set_line_width(lw)
    ctx.set_line_join(cairo.LINE_JOIN_ROUND); ctx.stroke()

def circle(ctx, x, y, r):
    ctx.new_sub_path(); ctx.arc(x, y, r, 0, 2 * math.pi); ctx.close_path()

def limb(ctx, pts, color, w=24, lw=10, ink=INK):
    """thick round-capped line with outline (flat cartoon limb)"""
    for width, col in ((w + 2 * lw, [c / 255 for c in ink] + [1]), (w, hexc(color))):
        ctx.move_to(*pts[0])
        for p in pts[1:]: ctx.line_to(*p)
        ctx.set_line_cap(cairo.LINE_CAP_ROUND); ctx.set_line_join(cairo.LINE_JOIN_ROUND)
        ctx.set_line_width(width); ctx.set_source_rgba(*col); ctx.stroke()
