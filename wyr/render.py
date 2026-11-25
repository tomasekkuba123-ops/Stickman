#!/usr/bin/env python3
"""Would You Rather Shorts — reusable template (v3, cinematic: full-bleed toon-3D option renders).

usage:
  python3 render.py episodes/<name>.txt                  # full render -> out/<name>/final.mp4
  python3 render.py episodes/<name>.txt --stills 0,5,9    # PNG stills only (fast check)

Script format: see README.md.
"""
import sys, os, re, json, math, hashlib, subprocess, argparse, difflib
from functools import lru_cache
import numpy as np, cairo, soundfile as sf
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from gfx import W, H, hexc, ease_out_back, paint, rrect, pil_to_surface
from icons import pick_icon
import scenes3d

HERE = os.path.dirname(os.path.abspath(__file__))
CFG = json.load(open(os.path.join(HERE, "config.json")))
L, T, C = CFG["layout"], CFG["timing"], CFG["colors"]
FPS, SR = 30, 24000
ENDCARD_MKV = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets", "endcard", "endcard.mkv")
ENDCARD_WAV = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets", "endcard", "endcard.wav")
ENDCARD_FRAMES = 45
COMP = "acompressor=threshold=-20dB:ratio=3:attack=5:release=120:makeup=2,"


# ================================================================= script
def parse_script(path):
    q = lambda s: s.strip().strip('"“”').strip()
    ep = dict(episode="", results_line="", hook="", outro="", questions=[])
    cur = None
    for raw in open(path, encoding="utf-8"):
        line = raw.strip()
        if not line or line.startswith("#"): continue
        m = re.match(r"^(EPISODE|RESULTS_LINE|HOOK|OUTRO|Q\d+|A|Reaction|Icons|Mood)\b[^:]*:\s*(.*)$", line, re.I)
        if not m: continue
        key, val = m.group(1).upper(), m.group(2)
        if key == "EPISODE": ep["episode"] = q(val)
        elif key == "RESULTS_LINE": ep["results_line"] = q(val)
        elif key == "HOOK": ep["hook"] = q(val)
        elif key == "OUTRO": ep["outro"] = q(val)
        elif key.startswith("Q"):
            cur = dict(text=q(val), A="", B="", icons=None, reaction="", mood=None); ep["questions"].append(cur)
        elif key == "A":
            a, _, b = val.partition("|"); cur["A"] = q(a); cur["B"] = q(re.sub(r"^\s*B\s*:", "", b))
        elif key == "REACTION": cur["reaction"] = q(val)
        elif key == "ICONS": a, _, b = val.partition("|"); cur["icons"] = [a.strip(), b.strip()]
        elif key == "MOOD": cur["mood"] = val.strip().lower()
    for qq in ep["questions"]:
        if not qq["icons"]: qq["icons"] = [pick_icon(qq["A"], "A"), pick_icon(qq["B"], "B")]
        if not qq["mood"]:
            low = qq["reaction"].lower()
            qq["mood"] = next((p for p, kws in CFG["mascot"]["mood_keywords"].items() if any(k in low for k in kws)),
                              CFG["mascot"]["default_reaction"])
    if not ep["episode"]:
        m = re.search(r"(\d+)", os.path.basename(path)); ep["episode"] = str(int(m.group(1))) if m else ""
    return ep


# ================================================================= voice
def tts_text(t):
    t = re.sub(r"\b([A-Z]{2,})\b", lambda m: m.group(1).lower(), t)       # ALL-CAPS emphasis would be spelled out
    t = re.sub(r"\bA\b(?=\s+or\b|[?!.]|$)", "Ay", t); t = re.sub(r"\bB\b", "Bee", t)  # A/B spoken as letters
    t = re.sub(r"\$([\d,]+)", lambda m: m.group(1).replace(",", "") + " dollars", t)
    return t.lstrip(" .…").strip()

def squeeze(a, maxgap):
    """shorten internal silences to maxgap seconds (keeps the voice speed natural)"""
    env = np.convolve(np.abs(a), np.ones(240) / 240, mode="same")   # 10 ms envelope, not raw samples
    q = env > 0.006
    edges = np.flatnonzero(np.diff(np.r_[0, (~q).astype(np.int8), 0]))
    keep = np.ones(len(a), bool); g = int(maxgap * SR)
    for s, e in zip(edges[::2], edges[1::2]):
        if e - s > g: keep[s + g // 2: e - g // 2] = False
    return a[keep]

_kokoro = None
def tts(text, cache):
    global _kokoro
    v = CFG["voice"]
    key = hashlib.sha1(f"{tts_text(text)}|{v['name']}|{v['speed']}".encode()).hexdigest()[:12]
    path = os.path.join(cache, key + ".wav")
    if not os.path.exists(path):
        if _kokoro is None:
            from kokoro_onnx import Kokoro
            _kokoro = Kokoro(v["model"], v["voices_file"])
        a, sr = _kokoro.create(tts_text(text), voice=v["name"], speed=v["speed"], lang="en-us")
        assert sr == SR; sf.write(path, a, sr)
    a, _ = sf.read(path, dtype="float32")
    nz = np.where(np.abs(a) > 0.004)[0]          # low threshold + pre-roll keeps soft onsets ("Ph", "B", "D")
    a = a[max(0, nz[0] - int(0.08 * SR)): nz[-1] + int(0.04 * SR)] if len(nz) else a
    return squeeze(a, v["max_pause"]), key

_whisper = None
def word_times(audio, key, cache):
    path = os.path.join(cache, f"{key}_{CFG['voice']['max_pause']}_v3.words.json")
    if os.path.exists(path): return json.load(open(path))
    global _whisper
    if _whisper is None:
        from faster_whisper import WhisperModel
        _whisper = WhisperModel("base.en", device="cpu", compute_type="int8")
    pad = 0.4   # leading silence: without it Whisper mishears the first word ("Phone" -> "own")
    a = np.r_[np.zeros(int(pad * SR), np.float32), audio]
    a16 = np.interp(np.arange(0, len(a), SR / 16000), np.arange(len(a)), a).astype(np.float32)
    segs, _ = _whisper.transcribe(a16, word_timestamps=True, language="en")
    words = [{"w": w.word.strip(), "s": max(0.0, w.start - pad), "e": max(0.0, w.end - pad)} for s in segs for w in s.words]
    json.dump(words, open(path, "w")); return words

norm = lambda w: re.sub(r"[^a-z0-9]", "", w.lower())

def align(text, ww, dur):
    """script words (as written) with start/end times from Whisper; unmatched words interpolated"""
    disp = [w for w in text.replace("...", " ").replace("…", " ").split() if norm(w)]
    tok, wtok = [norm(w) for w in disp], [norm(w["w"]) for w in ww]
    times = [None] * len(disp)
    for a, b, n in difflib.SequenceMatcher(None, tok, wtok, autojunk=False).get_matching_blocks():
        for k in range(n): times[a + k] = (ww[b + k]["s"], ww[b + k]["e"])
    i = 0
    while i < len(disp):
        if times[i] is None:
            j = i
            while j < len(disp) and times[j] is None: j += 1
            t0 = times[i - 1][1] if i > 0 else 0.0; t1 = times[j][0] if j < len(disp) else dur
            lens = [len(tok[k]) + 1 for k in range(i, j)]; acc = t0
            for k, ln in zip(range(i, j), lens):
                d = (t1 - t0) * ln / sum(lens); times[k] = (acc, acc + d); acc += d
            i = j
        else: i += 1
    out = []
    for w, (s, e) in zip(disp, times):
        clean = w.strip('"“”')
        shown = clean.strip(",.;:") if not clean.endswith(("?", "!")) else clean
        out.append({"w": shown.upper(), "s": s, "e": e, "brk": clean[-1:] in ".,?!:;"})
    return out



# ================================================================= sfx (synthesized in code, no samples)
def _lp(x, cut):
    y = np.empty_like(x); acc = 0.0; a = 1 - np.exp(-2 * np.pi * np.asarray(cut) / SR) * np.ones_like(x)
    for i in range(len(x)): acc += a[i] * (x[i] - acc); y[i] = acc
    return y

_SFX = {}
def sfx(name):
    if name in _SFX: return _SFX[name]
    rng = np.random.default_rng(7)
    if name == "whoosh":
        n = int(0.5 * SR); t = np.linspace(0, 1, n); noise = rng.standard_normal(n)
        cut = 300 + 2400 * np.sin(np.pi * t) ** 2
        band = _lp(noise, cut) - _lp(noise, cut * 0.35)
        env = np.sin(np.pi * np.clip(t * 1.15, 0, 1)) ** 2 * (1 - t) ** 0.4
        out = band * env / (np.abs(band).max() + 1e-9) * 0.5
    elif name == "riser":        # rising tension over the countdown: sweeping filtered noise + pitch-rising drone + faster tremolo
        d = CFG["countdown_s"]; n = int(d * SR); t = np.arange(n) / SR; u = t / d
        noise = rng.standard_normal(n); cut = 250 + 3800 * u ** 2
        air = _lp(noise, cut) - _lp(noise, cut * 0.4); air /= np.abs(air).max() + 1e-9
        f = 70 * 2 ** (2.2 * u ** 1.4); ph = 2 * np.pi * np.cumsum(f) / SR
        drone = np.sin(ph) + 0.5 * np.sin(2 * ph + 0.3) + 0.25 * np.sin(3 * ph)
        trem = 0.65 + 0.35 * np.sin(2 * np.pi * np.cumsum(3 + 14 * u ** 2) / SR)
        out = (0.55 * air + 0.45 * drone / 1.75 * trem) * u ** 1.6 * 0.55
        out[-int(0.01 * SR):] *= np.linspace(1, 0, int(0.01 * SR))
    elif name == "bass_hit":     # sub drop + body + click transient
        n = int(1.2 * SR); t = np.arange(n) / SR
        f = 38 + 52 * np.exp(-t * 18); ph = 2 * np.pi * np.cumsum(f) / SR
        sub = np.sin(ph) * np.exp(-t * 3.2); body = np.sin(2 * ph) * np.exp(-t * 9) * 0.4
        click = rng.standard_normal(n) * np.exp(-t * 180) * 0.5
        out = np.tanh(1.6 * (sub + body + click)) * 0.7
    elif name == "heartbeat":    # lub-dub, used under the "impossible" question
        n = int(0.6 * SR); t = np.arange(n) / SR
        def thump(t0, a): tt = np.clip(t - t0, 0, None); return a * np.sin(2 * np.pi * (48 + 20 * np.exp(-tt * 30)) * tt) * np.exp(-tt * 16) * (t >= t0)
        out = np.tanh(2 * (thump(0, 1) + thump(0.22, 0.7))) * 0.5
    else:
        raise KeyError(name)
    _SFX[name] = out.astype(np.float32); return _SFX[name]


# ================================================================= timeline
def build(ep, cache):
    audio, scenes, header, mascot, caps = [], [], [], [], []
    G = CFG["sfx_gain"]; CD = CFG["countdown_s"]

    def voice(text, at):
        a, key = tts(text, cache)
        words = align(text, word_times(a, key, cache), len(a) / SR)
        for w in words: w["s"] += at; w["e"] += at
        audio.append((at, a, 1.0)); caps.append(words)
        return at + len(a) / SR, words

    hook_text = ep["results_line"] or ep["hook"]
    qs = ep["questions"]; M = CFG["mascot"]["poses"]
    t = T["hook_start"]
    header.append((-1, ("hook", hook_text))); mascot.append((-1, M["hook"]))
    scenes.append(dict(start=0.0, qi=0, countdown=None, reveal=None, special=False))
    t, _ = voice(hook_text, t)
    for i, qq in enumerate(qs):
        special = CFG["special_last"] and i == len(qs) - 1
        if i > 0:
            t += T["gap"]
            audio.append((t - 0.38, sfx("whoosh"), G["whoosh"]))
            scenes.append(dict(start=t, qi=i, countdown=None, reveal=None, special=special))
        t += T["voice_delay"] if i > 0 else T["hook_to_q1"]
        header.append((t, ("text", CFG["pick_text"]))); mascot.append((t, M["question"]))
        qend, _ = voice(qq["text"], t)
        c0 = qend + T["before_countdown"]; r0 = c0 + CD
        scenes[-1].update(countdown=c0, reveal=r0)
        if special:   # heartbeat under the impossible question
            hb = scenes[-1]["start"] + 0.2
            while hb < r0 - 0.3: audio.append((hb, sfx("heartbeat"), G["heartbeat"])); hb += 0.83
        mascot.append((c0, M["countdown"]))
        audio.append((c0, sfx("riser"), G["riser"]))
        audio.append((r0, sfx("bass_hit"), G["bass_hit"]))
        header.append((r0, ("text", qq["reaction"]))); mascot.append((r0, M.get(qq["mood"], qq["mood"])))
        t, _ = voice(qq["reaction"], r0 + T["after_countdown"])
    # outro: short line over the last question's images (calm: no pulse/shake), then the fixed end card is appended
    t += T["gap"]
    last = scenes[-1]
    scenes.append(dict(start=t, qi=last["qi"], countdown=None, reveal=None, special=False, outro=True))
    header.append((t, ("text", CFG["outro_header"]))); mascot.append((t, M["outro"]))
    oend, ow = voice(ep["outro"], t + T["voice_delay"])
    total = oend + T["outro_tail"]
    for k, s in enumerate(scenes): s["end"] = scenes[k + 1]["start"] if k + 1 < len(scenes) else total
    last["u1"] = total; scenes[-1]["u0"] = last["start"]; scenes[-1]["u1"] = total   # one continuous push-in under the outro
    return dict(scenes=scenes, header=header, mascot=mascot, caps=caps, audio=audio, total=total, episode=ep["episode"], ep=ep)


# ================================================================= text (Inter Display: clean bold sans, no outlines)
FONTS = {w: os.path.join(HERE, "assets", "fonts", f"InterDisplay-{w}.otf") for w in ("SemiBold", "Bold", "ExtraBold", "Black")}
@lru_cache(maxsize=64)
def ifont(size, weight="ExtraBold"): return ImageFont.truetype(FONTS[weight], size)
def iwidth(text, size, weight="ExtraBold"): return ifont(size, weight).getlength(text)

@lru_cache(maxsize=1024)
def isurf(text, size, color="#FFFFFF", weight="ExtraBold", shadow=0.55, track=0.0):
    """clean text with a soft drop shadow (no outline). returns (surface, w, h)"""
    f = ifont(size, weight); pad = int(size * 0.5)
    widths = [f.getlength(ch) for ch in text]; adv = sum(widths) + track * size * (len(text) - 1)
    asc, desc = f.getmetrics(); w, h = int(adv + 2 * pad), int(asc + desc + 2 * pad)
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    def draw(im, fill, dy=0):
        d = ImageDraw.Draw(im); x = pad
        if track == 0: d.text((x, pad + dy), text, font=f, fill=fill)
        else:
            for ch, cw in zip(text, widths): d.text((x, pad + dy), ch, font=f, fill=fill); x += cw + track * size
    if shadow:
        sh = Image.new("RGBA", (w, h), (0, 0, 0, 0)); draw(sh, (0, 0, 0, int(255 * shadow)), dy=size * 0.05)
        img = Image.alpha_composite(img, sh.filter(ImageFilter.GaussianBlur(size * 0.12)))
    draw(img, color)
    return pil_to_surface(img), w, h

def iwrap(text, size, max_w, max_lines=2, weight="ExtraBold"):
    while True:
        words = text.split()
        if max_lines == 2 and len(words) > 1 and iwidth(text, size, weight) > max_w:
            best = min((max(iwidth(" ".join(words[:i]), size, weight), iwidth(" ".join(words[i:]), size, weight)), i) for i in range(1, len(words)))
            lines = [" ".join(words[:best[1]]), " ".join(words[best[1]:])]
        else:
            lines, cur = [], ""
            for wd in words:
                test = (cur + " " + wd).strip()
                if iwidth(test, size, weight) <= max_w or not cur: cur = test
                else: lines.append(cur); cur = wd
            lines.append(cur)
        if (len(lines) <= max_lines and all(iwidth(l, size, weight) <= max_w for l in lines)) or size <= 30: return lines, size
        size -= 2

def put(ctx, surf, cx, cy, alpha=1.0, scale=1.0):
    s, w, h = surf; paint(ctx, s, cx, cy, w, h, scale=scale, alpha=alpha)


# ================================================================= images (3D option renders, graded once)
TOP, BOT = hexc(C["A"]), hexc(C["B"])
HW, HH = W, H // 2

def grade(img, side, layer, dark):
    """cinematic grade: lift blacks into the side colour, deepen, (Q4) darker + redder"""
    a = np.asarray(img).astype(np.float32) / 255; rgb, al = a[..., :3], a[..., 3:]
    tint = np.array(hexc(C["deep_" + side])[:3], np.float32)
    if layer == "bg":
        lum = rgb.mean(2, keepdims=True); rgb = rgb * 0.62 + tint * 0.22 * (1 - lum) + lum * tint * 0.25
    else:
        rgb = np.clip((rgb - 0.5) * 1.08 + 0.5, 0, 1) * 0.92 + tint * 0.06
    if dark:   # the "impossible" question: background much darker, hero only slightly
        k = 0.6 if layer == "bg" else 0.88
        rgb = rgb * k; rgb[..., 0] = np.clip(rgb[..., 0] * 1.15 + 0.02, 0, 1)
    return Image.fromarray((np.concatenate([np.clip(rgb, 0, 1), al], 2) * 255).astype(np.uint8), "RGBA")

def bloom(fg):
    a = np.asarray(fg).astype(np.float32) / 255; lum = (a[..., :3].max(2) * a[..., 3])
    m = np.clip((lum - 0.62) / 0.38, 0, 1)[..., None] * a[..., :3]
    b = Image.fromarray((m * 255).astype(np.uint8), "RGB").filter(ImageFilter.GaussianBlur(28))
    arr = np.asarray(b).astype(np.float32) / 255 * 0.85
    return Image.fromarray((np.concatenate([arr, arr.max(2, keepdims=True)], 2) * 255).astype(np.uint8), "RGBA")

def load_images(ep):
    items = []
    for i, q in enumerate(ep["questions"]):
        dark = CFG["special_last"] and i == len(ep["questions"]) - 1
        for side, ic in zip("AB", q["icons"]):
            base, _, mod = ic.partition("+")
            items.append(dict(name=base, side=side, ban=mod == "ban", dark=dark))
    paths = scenes3d.ensure(items); out = {}
    for k, it in enumerate(items):
        bgp, fgp = paths[k]
        bg = grade(Image.open(bgp).convert("RGBA"), it["side"], "bg", it["dark"])
        fg = grade(Image.open(fgp).convert("RGBA"), it["side"], "fg", it["dark"])
        out[(k // 2, it["side"])] = tuple(pil_to_surface(x) for x in (bg, fg, bloom(fg)))
    return out


# ================================================================= overlays (built once)
def make_overlays():
    o = {}
    # vignette
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32); d = np.sqrt(((xx - W / 2) / (W * 0.62)) ** 2 + ((yy - H / 2) / (H * 0.6)) ** 2)
    v = np.clip((d - 0.55) / 0.6, 0, 1) ** 1.6 * 0.75
    o["vignette"] = pil_to_surface(Image.fromarray((np.dstack([np.zeros_like(v)] * 3 + [v]) * 255).astype(np.uint8), "RGBA"))
    # red pulse frame for the special question
    r = np.clip((d - 0.45) / 0.55, 0, 1) ** 1.4
    o["redpulse"] = pil_to_surface(Image.fromarray((np.dstack([r * 0.9, r * 0.05, r * 0.08, r]) * 255).astype(np.uint8), "RGBA"))
    # readability scrims: top (header), around the centre line (labels + caption)
    sc = np.zeros((H, W), np.float32); y = np.arange(H, dtype=np.float32)
    sc += np.clip(1 - y / 430, 0, 1)[:, None] ** 1.3 * 0.82
    sc += np.exp(-((y - 905) / 150) ** 2)[:, None] * 0.55 + np.exp(-((y - 1080) / 110) ** 2)[:, None] * 0.45
    o["scrim"] = pil_to_surface(Image.fromarray((np.dstack([np.zeros_like(sc)] * 3 + [np.clip(sc, 0, 0.9)]) * 255).astype(np.uint8), "RGBA"))
    return o


# ================================================================= drawing
def step(seq, t):
    cur, t0 = seq[0][1], seq[0][0]
    for tt, v in seq:
        if tt <= t: cur, t0 = v, tt
    return cur, t0

def smooth(x): x = min(1.0, max(0.0, x)); return x * x * (3 - 2 * x)

MASCOT_CACHE = {}
def mascot_img(pose):
    if pose not in MASCOT_CACHE:
        im = Image.open(os.path.join(HERE, "assets", "mascot", pose + ".png"))
        sc = L["mascot_h"] / im.height        # all poses share one crop box (build_mascot3d.py) -> same scale + baseline
        im = im.convert("RGBa").resize((round(im.width * sc), round(im.height * sc)), Image.LANCZOS).convert("RGBA")  # premultiplied resize: no edge fringe
        MASCOT_CACHE[pose] = (pil_to_surface(im), im.width, im.height)
    return MASCOT_CACHE[pose]

def draw_half(ctx, tl, imgs, sc_, side, t, per):
    y0 = 0 if side == "A" else HH
    bg, fg, bl = imgs[(sc_["qi"], side)]
    u0, u1 = sc_.get("u0", sc_["start"]), sc_.get("u1", sc_["end"])
    u = max(0.0, (t - u0) / max(0.5, u1 - u0))
    base = HW / 1350.0
    kick = 0.0
    if sc_["reveal"] is not None and t >= sc_["reveal"]: kick = 0.025 * math.exp(-(t - sc_["reveal"]) * 5)
    shake = (0, 0)
    if sc_["special"] and t >= sc_["start"]:
        k = 5.0 + (9.0 if sc_["countdown"] and sc_["countdown"] <= t < sc_["reveal"] + 0.3 else 0.0)
        shake = (k * (math.sin(t * 37.1) * 0.6 + math.sin(t * 23.3 + 1) * 0.4), k * (math.sin(t * 29.7 + 2) * 0.6 + math.sin(t * 41.9) * 0.4))
    dirx = -1 if side == "A" else 1
    sway = math.sin(2 * math.pi * per * t + (0 if side == "A" else 1.3))
    ctx.save(); ctx.rectangle(0, y0, HW, HH); ctx.clip()
    for surf, zoom, px, py in ((bg, 1.0 + 0.045 * u, 10 * u * dirx + 6 * sway, 6 * sway),
                               (fg, 1.0 + 0.10 * u + kick, -16 * u * dirx - 8 * sway, -10 * u - 4 * sway),
                               (bl, 1.0 + 0.10 * u + kick, -16 * u * dirx - 8 * sway, -10 * u - 4 * sway)):
        s = base * zoom
        ctx.save(); ctx.translate(HW / 2 + px + shake[0], y0 + HH / 2 + py + shake[1]); ctx.scale(s, s)
        ctx.set_source_surface(surf, -1350 / 2, -1200 / 2); ctx.get_source().set_filter(cairo.FILTER_GOOD)
        if surf is bl: ctx.set_operator(cairo.OPERATOR_ADD)
        ctx.paint(); ctx.restore()
    ctx.restore()

PARTS = None
def draw_particles(ctx, t, total):
    global PARTS
    if PARTS is None:
        rng = np.random.default_rng(3); PARTS = []
        for i in range(70):
            PARTS.append(dict(x=rng.uniform(0, W), y=rng.uniform(0, H), k=int(rng.integers(1, 4)), r=rng.uniform(1.5, 5.5),
                              a=rng.uniform(0.15, 0.55), ph=rng.uniform(0, 6.28), sw=rng.uniform(8, 30)))
    for p in PARTS:
        y = (p["y"] - p["k"] * H * t / total) % H            # integer number of laps per video -> loops
        x = p["x"] + p["sw"] * math.sin(2 * math.pi * p["k"] * t / total * 3 + p["ph"])
        col = (1.0, 0.55, 0.45) if y < HH else (0.55, 0.75, 1.0)
        a = p["a"] * (0.6 + 0.4 * math.sin(2 * math.pi * 7 * t / total + p["ph"]))
        g = cairo.RadialGradient(x, y, 0, x, y, p["r"] * 3)
        g.add_color_stop_rgba(0, *col, a); g.add_color_stop_rgba(1, *col, 0)
        ctx.set_source(g); ctx.new_path(); ctx.arc(x, y, p["r"] * 3, 0, 2 * math.pi); ctx.fill()

def draw_line(ctx, t, per, flash):
    cy = HH; k = 0.85 + 0.15 * math.sin(2 * math.pi * per * 2 * t) + flash
    for (c, sgn) in ((TOP, -1), (BOT, 1)):
        g = cairo.LinearGradient(0, cy, 0, cy + sgn * 70)
        g.add_color_stop_rgba(0, *[min(1, x * 1.4) for x in c[:3]], 0.75 * k); g.add_color_stop_rgba(1, *c[:3], 0)
        ctx.set_source(g); ctx.rectangle(0, cy - 70 if sgn < 0 else cy, W, 70); ctx.fill()
    g = cairo.LinearGradient(0, 0, W, 0)
    for x, a in ((0, 0.25), (0.5, 1.0), (1, 0.25)): g.add_color_stop_rgba(x, 1, 1, 1, min(1, a * k))
    ctx.set_source(g); ctx.rectangle(0, cy - 2, W, 4); ctx.fill()

def draw_vs(ctx, sc_, t):
    cx, cy, r = W / 2, HH, L["vs_radius"]; cd = sc_["countdown"]; CD = CFG["countdown_s"]
    in_cd = cd is not None and cd <= t < cd + CD
    g = cairo.RadialGradient(cx, cy, 0, cx, cy, r * 2.2)
    g.add_color_stop_rgba(0, 1, 1, 1, 0.22 if not in_cd else 0.35); g.add_color_stop_rgba(1, 1, 1, 1, 0)
    ctx.set_source(g); ctx.arc(cx, cy, r * 2.2, 0, 2 * math.pi); ctx.fill()
    ctx.arc(cx, cy, r, 0, 2 * math.pi); ctx.set_source_rgba(0.04, 0.04, 0.08, 0.82); ctx.fill()
    ring = cairo.LinearGradient(0, cy - r, 0, cy + r)
    ring.add_color_stop_rgb(0, *[min(1, x * 1.3) for x in TOP[:3]]); ring.add_color_stop_rgb(1, *[min(1, x * 1.3) for x in BOT[:3]])
    ctx.arc(cx, cy, r, 0, 2 * math.pi); ctx.set_source(ring); ctx.set_line_width(4); ctx.stroke()
    if in_cd:
        u = (t - cd) / CD; sec = int(t - cd)
        ctx.new_path(); ctx.arc(cx, cy, r + 16, -math.pi / 2, -math.pi / 2 + 2 * math.pi * (1 - u))
        ctx.set_line_cap(cairo.LINE_CAP_ROUND); ctx.set_line_width(9); ctx.set_source_rgba(*hexc(C["gold"])[:3], 1); ctx.stroke()
        n = str(int(math.ceil(CD - (t - cd)))); ph = (t - cd) - sec
        put(ctx, isurf(n, 76, "#FFFFFF", "Black", 0.4), cx, cy + 2, alpha=min(1, ph / 0.08 + 0.2), scale=1 + 0.18 * max(0, 1 - ph / 0.25))
    else:
        put(ctx, isurf("VS", 46, "#FFFFFF", "Black", 0.3, track=0.04), cx, cy + 2)

def draw_header(ctx, tl, t):
    (kind, text), t0 = step(tl["header"], t)
    a = 1.0 if t0 < 0 else smooth((t - t0) / 0.25); dy = 0 if t0 < 0 else 14 * (1 - a)
    if text == CFG["pick_text"]:
        sz = L["pick_size"]; s = isurf(text, sz, C["gold"], "Black", 0.6, track=0.08)
        glow = 0.5 + 0.5 * math.sin(2 * math.pi * 1.2 * t)
        put(ctx, s, W / 2, L["header_y"] + dy, alpha=a * (0.9 + 0.1 * glow))
        return
    words = text.split()
    emph = [len(re.sub(r"[^A-Za-z]", "", w)) > 1 and re.sub(r"[^A-Za-z]", "", w).isupper() for w in words]
    lines, sz = iwrap(text.upper(), L["header_size"], L["header_max_w"], 3, "Black")
    lh = sz * 1.12; y = L["header_y"] - (len(lines) - 1) * lh / 2 + dy; k = 0
    for ln in lines:
        ws = ln.split(); widths = [iwidth(w, sz, "Black") for w in ws]; gap = sz * 0.26
        x = W / 2 - (sum(widths) + gap * (len(ws) - 1)) / 2
        for w, wd in zip(ws, widths):
            put(ctx, isurf(w, sz, C["gold"] if emph[k] else "#FFFFFF", "Black", 0.6), x + wd / 2, y, alpha=a); x += wd + gap; k += 1
        y += lh

def draw_labels(ctx, tl, sc_, t):
    q = tl["ep"]["questions"][sc_["qi"]]
    a = 1.0 if sc_["start"] <= 0 else smooth((t - sc_["start"]) / 0.3)
    for side in "AB":
        col = TOP if side == "A" else BOT
        lines, sz = iwrap(q[side].upper(), L["label_size"], L["label_max_w"], 2, "Black")
        lh = sz * 1.08; tag = isurf(f"OPTION {side}", 30, "#FFFFFF", "Bold", 0.5, track=0.22)
        if side == "A":
            ys = [L["label_y_A"] - (len(lines) - 1 - i) * lh for i in range(len(lines))]; ty = ys[0] - sz * 0.62 - 20
        else:
            ys = [L["label_y_B"] + i * lh for i in range(len(lines))]; ty = ys[0] - sz * 0.62 - 20
        dy = 18 * (1 - a) * (1 if side == "A" else -1)
        tw = tag[1] - 30; ctx.save()
        rrect(ctx, W / 2 - tw / 2 - 16, ty - 22 + dy, tw + 32, 44, 22); ctx.set_source_rgba(*[min(1, x * 1.15) for x in col[:3]], 0.85 * a); ctx.fill(); ctx.restore()
        put(ctx, tag, W / 2, ty + dy, alpha=a)
        for ln, y in zip(lines, ys): put(ctx, isurf(ln, sz, "#FFFFFF", "Black", 0.7), W / 2, y + dy, alpha=a)

def phrases(words):
    """full short phrases: break at punctuation; long runs split evenly into <= 6 words"""
    out, cur = [], []
    for w in words:
        cur.append(w)
        if w["brk"]: out.append(cur); cur = []
    if cur: out.append(cur)
    res = []
    for p in out:
        n = math.ceil(len(p) / 6); k = math.ceil(len(p) / n)
        res += [p[i:i + k] for i in range(0, len(p), k)]
    return res

def draw_caption(ctx, tl, t):
    total = tl["total"]
    for words in tl["caps"]:
        if not (words[0]["s"] - 0.1 <= t <= words[-1]["e"] + 0.4): continue
        ph = phrases(words)
        for i, p in enumerate(ph):
            t0 = p[0]["s"] - 0.06
            t1 = ph[i + 1][0]["s"] - 0.06 if i + 1 < len(ph) else p[-1]["e"] + 0.35
            t1 = min(t1, total)
            if not (max(t0, 1.0 / FPS) <= t < t1): continue
            text = " ".join(w["w"] for w in p).replace(" ,", ",")
            text = text[0] + text[1:].lower() if text.isupper() else text
            text = re.sub(r"\bi\b", "I", text); text = re.sub(r"\ba or b\b", "A or B", text, flags=re.I)
            sz = L["caption_size"]
            while iwidth(text, sz, "SemiBold") > L["caption_max_w"]: sz -= 2
            a = smooth((t - t0) / 0.12); s = isurf(text, sz, "#FFFFFF", "SemiBold", 0.0)
            pw, phh = s[1] - sz * 0.6, sz * 1.75
            ctx.save(); rrect(ctx, W / 2 - pw / 2, L["caption_y"] - phh / 2 + 6 * (1 - a), pw, phh, phh / 2)
            ctx.set_source_rgba(0.03, 0.03, 0.07, 0.62 * a); ctx.fill(); ctx.restore()
            put(ctx, s, W / 2, L["caption_y"] + 6 * (1 - a) - 2, alpha=a)
            return

def draw_badge(ctx, ep):
    if not ep: return
    s = isurf("#" + ep, 34, "#FFFFFF", "Bold", 0.0); w = s[1] - 34
    x, y = L["badge_x"], L["badge_y"]
    rrect(ctx, x, y, w + 28, 54, 27); ctx.set_source_rgba(0, 0, 0, 0.45); ctx.fill()
    rrect(ctx, x, y, w + 28, 54, 27); ctx.set_source_rgba(1, 1, 1, 0.35); ctx.set_line_width(1.5); ctx.stroke()
    put(ctx, s, x + (w + 28) / 2, y + 27)

def draw_mascot(ctx, tl, t, per):
    pose, t0 = step(tl["mascot"], t)
    s, w, h = mascot_img(pose)
    a = 1.0 if t0 < 0 else 0.85 + 0.15 * ease_out_back((t - t0) / 0.25)
    bob = 4 * math.sin(2 * math.pi * per * 2 * t)
    cx, by = L["mascot_x"], L["mascot_bottom"]
    g = cairo.RadialGradient(cx, by, 0, cx, by, w * 0.7); g.add_color_stop_rgba(0, 0, 0, 0, 0.45); g.add_color_stop_rgba(1, 0, 0, 0, 0)
    ctx.save(); ctx.translate(0, by); ctx.scale(1, 0.22); ctx.translate(0, -by); ctx.set_source(g); ctx.arc(cx, by, w * 0.7, 0, 2 * math.pi); ctx.fill(); ctx.restore()
    paint(ctx, s, cx, by - h * a / 2 + bob * 0.5, w, h, scale=a)

def frame(ctx, tl, imgs, ov, t):
    total = tl["total"]; per = max(1, round(0.12 * total)) / total      # slow sway, periodic over the video (loop)
    ctx.set_source_rgb(0, 0, 0); ctx.paint()
    sc_ = [s for s in tl["scenes"] if s["start"] <= t][-1] if t >= 0 else tl["scenes"][0]
    draw_half(ctx, tl, imgs, sc_, "A", t, per); draw_half(ctx, tl, imgs, sc_, "B", t, per)
    ctx.set_source_surface(ov["scrim"], 0, 0); ctx.paint()
    draw_particles(ctx, t, total)
    ctx.set_source_surface(ov["vignette"], 0, 0); ctx.paint()
    if sc_["special"]:
        beat = (t - sc_["start"]) % 0.83; pulse = math.exp(-beat * 6) + 0.6 * math.exp(-max(0, beat - 0.22) * 7) * (beat > 0.22)
        ctx.set_source_surface(ov["redpulse"], 0, 0); ctx.paint_with_alpha(min(1, 0.25 + 0.45 * pulse))
    flash = 0.0
    if sc_["reveal"] is not None and t >= sc_["reveal"]: flash = 1.2 * math.exp(-(t - sc_["reveal"]) * 6)
    draw_line(ctx, t, per, flash)
    draw_labels(ctx, tl, sc_, t)
    draw_vs(ctx, sc_, t)
    draw_header(ctx, tl, t)
    draw_badge(ctx, tl["episode"])
    draw_caption(ctx, tl, t)
    draw_mascot(ctx, tl, t, per)
    if flash > 0.02:
        ctx.set_source_rgba(1, 1, 1, min(0.35, flash * 0.25)); ctx.paint()


# ================================================================= audio + encode
def loudness(path):
    r = subprocess.run(["ffmpeg", "-hide_banner", "-i", path, "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"],
                       capture_output=True, text=True).stderr
    return json.loads(r[r.rindex("{"): r.rindex("}") + 1])

def mix_audio(tl, out):
    n = int(round(tl["total"] * SR)); mix = np.zeros(n + 2 * SR, np.float32)
    for at, clip, g in tl["audio"]:
        i0 = max(0, int(round(at * SR))); seg = clip[: len(mix) - i0] * g; mix[i0:i0 + len(seg)] += seg
    mix = mix[:n]
    card, csr = sf.read(ENDCARD_WAV, dtype="float32"); assert csr == SR
    w = sfx("whoosh") * CFG["sfx_gain"]["whoosh"]; i0 = n - int(0.3 * SR); mix[i0:] += w[: n - i0]
    mix = np.concatenate([mix, card[: int(round(ENDCARD_FRAMES / FPS * SR))]])
    raw = os.path.join(out, "mix_raw.wav"); sf.write(raw, mix, SR)
    pre = os.path.join(out, "mix_pre.wav")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", raw, "-af", COMP.rstrip(","), "-ar", "48000", "-ac", "2", pre], check=True)
    gain = -14.0 - float(loudness(pre)["input_i"])
    wav = os.path.join(out, "mix.wav")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", pre, "-af", f"volume={gain:.2f}dB,alimiter=limit=0.85:attack=2:release=40:level=false",
                    "-ar", "48000", "-ac", "2", wav], check=True)
    fix = -14.0 - float(loudness(wav)["input_i"])
    if abs(fix) > 0.1:
        tmp = wav + ".tmp.wav"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", wav, "-af", f"volume={fix:.2f}dB,alimiter=limit=0.89:level=false", tmp], check=True)
        os.replace(tmp, wav)
    return wav

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("script"); ap.add_argument("--stills", default="")
    a = ap.parse_args()
    name = os.path.splitext(os.path.basename(a.script))[0]
    out = os.path.join(HERE, "out", name); cache = os.path.join(out, "cache"); os.makedirs(cache, exist_ok=True)
    ep = parse_script(a.script)
    tl = build(ep, cache)
    nfr = int(round(tl["total"] * FPS)); tl["total"] = nfr / FPS
    full = tl["total"] + ENDCARD_FRAMES / FPS
    if full > CFG["max_seconds"] + 1e-6: print(f"WARNING: {full:.2f}s is over the {CFG['max_seconds']}s limit - shorten the script/outro")
    for s in tl["scenes"]: s["end"] = min(s["end"], tl["total"])
    json.dump({"duration": tl["total"], "header": tl["header"], "mascot": tl["mascot"], "scenes": tl["scenes"], "captions": tl["caps"]},
              open(os.path.join(out, "timeline.json"), "w"), indent=1)
    print(f"duration {full:.2f}s = {tl['total']:.2f}s + {ENDCARD_FRAMES / FPS:.1f}s end card  scenes: " + ", ".join("/".join(q["icons"]) for q in ep["questions"])
          + "  moods: " + ", ".join(q["mood"] for q in ep["questions"]), flush=True)
    imgs = load_images(ep); ov = make_overlays()
    surf = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H); ctx = cairo.Context(surf)
    if a.stills:
        for ts in a.stills.split(","):
            t = (nfr - 1) / FPS if ts == "last" else min(float(ts), (nfr - 1) / FPS)
            frame(ctx, tl, imgs, ov, t); p = os.path.join(out, f"still_{t:05.2f}.png"); surf.write_to_png(p); print(p)
        return
    wav = mix_audio(tl, out)
    final = os.path.join(out, "final.mp4")
    ff = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgra", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                           "-i", wav, "-map", "0:v", "-map", "1:a", "-c:v", "libx264", "-preset", "medium", "-crf", "17", "-pix_fmt", "yuv420p",
                           "-c:a", "aac", "-b:a", "192k", "-t", f"{full:.3f}", "-movflags", "+faststart", final], stdin=subprocess.PIPE)
    for f in range(nfr):
        frame(ctx, tl, imgs, ov, f / FPS); surf.flush(); ff.stdin.write(surf.get_data())
        if f % 150 == 0: print(f"frame {f}/{nfr}", flush=True)
    # fixed end card: the saved frames, byte-identical in every episode (never re-rendered here)
    card = subprocess.run(["ffmpeg", "-v", "error", "-i", ENDCARD_MKV, "-f", "rawvideo", "-pix_fmt", "bgra", "-"], capture_output=True, check=True).stdout
    assert len(card) == ENDCARD_FRAMES * W * H * 4, "end card asset has the wrong size"
    ff.stdin.write(card)
    ff.stdin.close(); ff.wait()
    print("->", final)

if __name__ == "__main__":
    main()
