"""Flat illustration library. Every icon draws itself in a 600x600 box.
Add a new icon: write `def icon_name(ctx):` below and register it in ICONS with match keywords."""
import math, cairo
from gfx import hexc, rrect, fill_stroke, circle, limb, text_surface, paint, INK

SKIN, SHIRT, PANTS = "#FFD6A5", "#FFD23F", "#3A3D6B"
YELLOW, WHITE, DARK = "#FFD23F", "#FFFFFF", "#22223B"


def _person(ctx, ox=0, oy=0, arms_up=False, ghost=False):
    """simple flat character, feet at y=oy+360, centre x=300+ox"""
    x = 300 + ox
    if ghost:  # dashed white outline only = invisible
        ctx.save(); ctx.set_dash([22, 16]); ctx.set_line_width(9); ctx.set_source_rgba(1, 1, 1, 0.95)
        ctx.set_line_cap(cairo.LINE_CAP_ROUND)
        circle(ctx, x, oy + 120, 52); ctx.stroke()
        rrect(ctx, x - 62, oy + 182, 124, 112, 30); ctx.stroke()
        for p in ([(x - 62, oy + 200), (x - 110, oy + 270)], [(x + 62, oy + 200), (x + 110, oy + 270)],
                  [(x - 30, oy + 294), (x - 36, oy + 380)], [(x + 30, oy + 294), (x + 36, oy + 380)]):
            ctx.move_to(*p[0]); ctx.line_to(*p[1]); ctx.stroke()
        ctx.restore(); return
    if arms_up:
        limb(ctx, [(x - 50, oy + 200), (x - 95, oy + 130), (x - 110, oy + 70)], SKIN)
        limb(ctx, [(x + 50, oy + 200), (x + 95, oy + 130), (x + 110, oy + 70)], SKIN)
    else:
        limb(ctx, [(x - 55, oy + 205), (x - 100, oy + 275)], SKIN)
        limb(ctx, [(x + 55, oy + 205), (x + 100, oy + 275)], SKIN)
    limb(ctx, [(x - 28, oy + 290), (x - 34, oy + 365)], PANTS, w=30)
    limb(ctx, [(x + 28, oy + 290), (x + 34, oy + 365)], PANTS, w=30)
    rrect(ctx, x - 62, oy + 180, 124, 118, 32); fill_stroke(ctx, SHIRT)
    circle(ctx, x, oy + 118, 56); fill_stroke(ctx, SKIN)
    ctx.set_source_rgb(*hexc(DARK)[:3])
    for ex in (-19, 19): circle(ctx, x + ex, oy + 112, 7); ctx.fill()
    ctx.set_line_width(7); ctx.set_line_cap(cairo.LINE_CAP_ROUND)
    ctx.arc(x, oy + 130, 20, 0.2 * math.pi, 0.8 * math.pi); ctx.stroke()


def _label(ctx, text, x, y, size, fill=WHITE):
    s, w, h = text_surface(text, size, fill, stroke=int(size * 0.13), shadow=False)
    paint(ctx, s, x, y, w, h)


def _bubble(ctx, x, y, w, h, text, size, tail=(0, 1)):
    rrect(ctx, x - w / 2, y - h / 2, w, h, h * 0.45); fill_stroke(ctx, WHITE, 8)
    tx, ty = x + tail[0] * w * 0.25, y + h / 2 - 4
    ctx.move_to(tx - 18, ty); ctx.line_to(tx + 18, ty); ctx.line_to(tx - 10 + tail[0] * 30, ty + 34); ctx.close_path()
    fill_stroke(ctx, WHITE, 8)
    rrect(ctx, x - w / 2 + 5, y - h / 2 + 5, w - 10, h - 6, h * 0.42); ctx.set_source_rgb(1, 1, 1); ctx.fill()
    s, sw, sh = text_surface(text, size, "#22223B", stroke=0, shadow=False)
    paint(ctx, s, x, y, sw, sh)


# ---------------- icons ----------------
def icon_question(ctx):
    _label(ctx, "?", 300, 300, 420, YELLOW)

def icon_fly_low(ctx):
    ctx.set_source_rgba(0, 0, 0, 0.25); ctx.save(); ctx.translate(270, 535); ctx.scale(1, 0.22)
    circle(ctx, 0, 0, 120); ctx.fill(); ctx.restore()
    ctx.set_source_rgba(1, 1, 1, 0.8); ctx.set_line_width(9); ctx.set_line_cap(cairo.LINE_CAP_ROUND)
    for i, y in enumerate((210, 260, 310)):  # speed lines
        ctx.move_to(70 - i * 10, y); ctx.line_to(140 - i * 10, y); ctx.stroke()
    _person(ctx, -30, 30, arms_up=True)
    # 1 m ruler
    x = 500; ctx.set_source_rgb(1, 1, 1); ctx.set_line_width(10)
    ctx.move_to(x, 400); ctx.line_to(x, 530); ctx.stroke()
    for y, d in ((400, 1), (530, -1)):
        ctx.move_to(x - 22, y + d * 26); ctx.line_to(x, y); ctx.line_to(x + 22, y + d * 26); ctx.stroke()
    _label(ctx, "1m", 500, 335, 78, YELLOW)

def icon_invisible(ctx):
    _person(ctx, -20, 70, ghost=True)
    for (sx, sy, r) in ((140, 160, 22), (470, 420, 16), (120, 430, 14)):
        ctx.set_source_rgb(1, 1, 1); ctx.move_to(sx, sy - r * 2)
        for k in range(1, 8):
            a = k * math.pi / 4; rr = r * 2 if k % 2 == 0 else r * 0.6
            ctx.line_to(sx + rr * math.sin(a), sy - rr * math.cos(a))
        ctx.close_path(); ctx.fill()
    circle(ctx, 450, 150, 92); fill_stroke(ctx, WHITE)            # closed-eye badge
    ctx.set_source_rgb(*hexc(DARK)[:3]); ctx.set_line_width(12); ctx.set_line_cap(cairo.LINE_CAP_ROUND)
    ctx.arc_negative(450, 120, 62, 0.85 * math.pi, 0.15 * math.pi); ctx.stroke()
    for a in (0.3, 0.5, 0.7):
        ax, ay = 450 + 62 * math.cos(a * math.pi), 120 + 62 * math.sin(a * math.pi)
        ctx.move_to(ax, ay); ctx.line_to(ax + 24 * math.cos(a * math.pi), ay + 24 * math.sin(a * math.pi)); ctx.stroke()

def icon_pizza(ctx):
    ctx.move_to(120, 150); ctx.line_to(480, 150); ctx.line_to(300, 560); ctx.close_path(); fill_stroke(ctx, "#FFC93C", 12)
    rrect(ctx, 95, 100, 410, 90, 45); fill_stroke(ctx, "#D9822B", 12)
    for (x, y, r) in ((230, 250, 38), (360, 245, 34), (300, 360, 36), (290, 470, 24)):
        circle(ctx, x, y, r); fill_stroke(ctx, "#D7263D", 8)
    ctx.set_source_rgba(*hexc("#FFC93C")); circle(ctx, 395, 330, 18); ctx.fill()  # cheese drip
    ctx.move_to(395, 290); ctx.line_to(395, 340); ctx.set_line_width(26); ctx.stroke()

def icon_wifi(ctx):
    cx, cy = 300, 450
    for r in (300, 205, 110):
        ctx.set_line_cap(cairo.LINE_CAP_ROUND)
        for lw, col in ((78, hexc(DARK)), (56, hexc(YELLOW))):
            ctx.new_path(); ctx.arc(cx, cy, r, -0.78 * math.pi, -0.22 * math.pi)
            ctx.set_line_width(lw); ctx.set_source_rgba(*col); ctx.stroke()
    circle(ctx, cx, cy, 44); fill_stroke(ctx, YELLOW, 11)
    _bubble(ctx, 470, 545, 150, 80, "FREE", 46, tail=(0, 0))

def icon_hourglass(ctx):
    rrect(ctx, 130, 70, 340, 56, 26); fill_stroke(ctx, "#8D5524")
    rrect(ctx, 130, 474, 340, 56, 26); fill_stroke(ctx, "#8D5524")
    ctx.move_to(175, 126); ctx.curve_to(175, 260, 280, 270, 285, 300); ctx.curve_to(280, 330, 175, 340, 175, 474)
    ctx.line_to(425, 474); ctx.curve_to(425, 340, 320, 330, 315, 300); ctx.curve_to(320, 270, 425, 260, 425, 126)
    ctx.close_path(); fill_stroke(ctx, "#CFEFFF", 11)
    ctx.move_to(215, 190); ctx.line_to(385, 190); ctx.curve_to(370, 250, 310, 270, 300, 295); ctx.curve_to(290, 270, 230, 250, 215, 190)
    ctx.close_path(); ctx.set_source_rgba(*hexc(YELLOW)); ctx.fill()
    ctx.move_to(195, 464); ctx.curve_to(230, 380, 370, 380, 405, 464); ctx.close_path(); ctx.fill()
    ctx.set_line_width(8); ctx.move_to(300, 300); ctx.line_to(300, 420); ctx.stroke()

def icon_magnifier(ctx):
    limb(ctx, [(370, 370), (500, 500)], "#8D5524", w=56, lw=11)
    circle(ctx, 255, 255, 175); fill_stroke(ctx, "#CFEFFF", 30)
    circle(ctx, 255, 255, 175); ctx.set_source_rgba(*hexc("#B0B7C6")); ctx.set_line_width(18); ctx.stroke()
    ctx.set_source_rgba(1, 1, 1, 0.8); ctx.set_line_width(16); ctx.set_line_cap(cairo.LINE_CAP_ROUND)
    ctx.arc(255, 255, 130, 1.1 * math.pi, 1.4 * math.pi); ctx.stroke()
    _label(ctx, "?", 255, 262, 230, "#D7263D")

def icon_dog_talk(ctx):
    cx, cy = 250, 340
    for sx in (-1, 1):  # floppy ears
        ctx.save(); ctx.translate(cx + sx * 135, cy - 40); ctx.rotate(sx * 0.35); ctx.scale(0.55, 1)
        circle(ctx, 0, 0, 110); ctx.restore(); fill_stroke(ctx, "#8D5524")
    circle(ctx, cx, cy, 150); fill_stroke(ctx, "#E0A458")
    ctx.save(); ctx.translate(cx, cy + 70); ctx.scale(1.25, 0.85); circle(ctx, 0, 0, 72); ctx.restore(); fill_stroke(ctx, "#FFF1DC")
    ctx.save(); ctx.translate(cx, cy + 35); ctx.scale(1.3, 1); circle(ctx, 0, 0, 24); ctx.restore(); fill_stroke(ctx, DARK, 4)
    for ex in (-55, 55):
        circle(ctx, cx + ex, cy - 35, 20); ctx.set_source_rgba(*hexc(DARK)); ctx.fill()
        circle(ctx, cx + ex + 6, cy - 42, 7); ctx.set_source_rgb(1, 1, 1); ctx.fill()
    ctx.set_source_rgba(*hexc(DARK)); ctx.set_line_width(8); ctx.set_line_cap(cairo.LINE_CAP_ROUND)
    ctx.move_to(cx, cy + 60); ctx.line_to(cx, cy + 85); ctx.stroke()
    ctx.arc(cx - 25, cy + 85, 25, 0, math.pi); ctx.stroke(); ctx.arc(cx + 25, cy + 85, 25, 0, math.pi); ctx.stroke()
    _bubble(ctx, 440, 110, 230, 120, "HI!", 76, tail=(-1, 1))

def icon_globe_talk(ctx):
    cx, cy, r = 300, 340, 185
    circle(ctx, cx, cy, r); fill_stroke(ctx, "#4CC9F0", 12)
    ctx.save(); circle(ctx, cx, cy, r - 6); ctx.clip()
    ctx.set_source_rgba(*hexc("#80ED99"))
    for (x, y, rx, ry, a) in ((240, 270, 90, 60, 0.4), (360, 400, 70, 100, -0.3), (390, 230, 50, 35, 0.2), (200, 440, 45, 30, 0)):
        ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.scale(rx, ry); circle(ctx, 0, 0, 1); ctx.restore(); ctx.fill()
    ctx.restore()
    circle(ctx, cx, cy, r); ctx.set_source_rgba(*hexc(DARK)); ctx.set_line_width(12); ctx.stroke()
    _bubble(ctx, 130, 110, 190, 96, "HOLA", 56, tail=(1, 1))
    _bubble(ctx, 480, 95, 170, 96, "CIAO", 56, tail=(-1, 1))
    _bubble(ctx, 495, 560, 150, 84, "HI", 56, tail=(0, 0))

def icon_calendar(ctx):
    rrect(ctx, 100, 110, 400, 420, 44); fill_stroke(ctx, WHITE, 12)
    ctx.save(); rrect(ctx, 100, 110, 400, 420, 44); ctx.clip()
    ctx.rectangle(100, 110, 400, 120); ctx.set_source_rgba(*hexc("#E63946")); ctx.fill(); ctx.restore()
    rrect(ctx, 100, 110, 400, 420, 44); ctx.set_source_rgba(*hexc(DARK)); ctx.set_line_width(12); ctx.stroke()
    for x in (200, 400): rrect(ctx, x - 16, 70, 32, 90, 16); fill_stroke(ctx, "#B0B7C6", 9)
    _label(ctx, "NEW", 300, 175, 70)
    _label(ctx, "+1", 300, 385, 190, "#1D6FE0")

def icon_bell(ctx):
    ctx.move_to(300, 90); ctx.curve_to(170, 100, 160, 220, 155, 330); ctx.curve_to(150, 400, 100, 420, 100, 450)
    ctx.line_to(500, 450); ctx.curve_to(500, 420, 450, 400, 445, 330); ctx.curve_to(440, 220, 430, 100, 300, 90)
    ctx.close_path(); fill_stroke(ctx, YELLOW, 12)
    circle(ctx, 300, 500, 50); fill_stroke(ctx, "#F4A261", 11)
    circle(ctx, 300, 75, 26); fill_stroke(ctx, YELLOW, 10)
    ctx.set_source_rgba(1, 1, 1, 0.7); ctx.set_line_width(18); ctx.set_line_cap(cairo.LINE_CAP_ROUND)
    ctx.move_to(215, 330); ctx.curve_to(218, 240, 225, 180, 260, 150); ctx.stroke()
    ctx.set_source_rgb(1, 1, 1); ctx.set_line_width(12)
    for s in (-1, 1):
        for k, r in enumerate((240, 290)):
            ctx.new_path(); a0 = (-0.2 if s > 0 else 1.2) * math.pi
            ctx.arc(300, 270, r, a0 - 0.12 * math.pi, a0 + 0.12 * math.pi); ctx.stroke()

def make_letter(letter):
    def icon(ctx):
        circle(ctx, 300, 300, 230); fill_stroke(ctx, WHITE, 14)
        _label(ctx, letter, 300, 300, 300, "#22223B")
    return icon


ICONS = {  # name: (draw fn, keywords matched against the option text)
    "question": (icon_question, ["?"]),
    "fly_low": (icon_fly_low, ["fly", "flying", "flight"]),
    "invisible": (icon_invisible, ["invisible", "invisibility"]),
    "pizza": (icon_pizza, ["pizza"]),
    "wifi": (icon_wifi, ["wi-fi", "wifi", "internet"]),
    "hourglass": (icon_hourglass, ["when", "time", "date"]),
    "magnifier": (icon_magnifier, ["how", "why", "what", "find"]),
    "dog_talk": (icon_dog_talk, ["animal", "animals", "dog", "pet"]),
    "globe_talk": (icon_globe_talk, ["language", "languages", "travel", "world"]),
    "calendar": (icon_calendar, ["daily", "every day", "tomorrow", "new"]),
    "bell": (icon_bell, ["follow", "subscribe", "notification"]),
}


def pick_icon(text, letter):
    """first icon (in ICONS order) whose keyword appears as a whole word in the text"""
    import re
    low = text.lower(); toks = set(re.findall(r"[a-z0-9\-?]+", low))
    for name, (_, kws) in ICONS.items():
        if any(k in toks or (" " in k and k in low) for k in kws):
            return name
    return "letter_" + letter


def render_icon(name, size):
    fn = ICONS[name][0] if name in ICONS else make_letter(name.split("_", 1)[1] if name.startswith("letter_") else "?")
    pad = int(size * 0.12)
    surf = cairo.ImageSurface(cairo.FORMAT_ARGB32, size + 2 * pad, size + 2 * pad)
    ctx = cairo.Context(surf)
    ctx.translate(pad, pad); ctx.scale(size / 600, size / 600)
    fn(ctx)
    return surf, size + 2 * pad, size + 2 * pad
