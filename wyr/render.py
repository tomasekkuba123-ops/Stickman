#!/usr/bin/env python3
"""Would You Rather Shorts — reusable template (v3, cinematic: full-bleed toon-3D option renders).

usage:
  python3 render.py episodes/<name>.txt                  # full render -> out/<name>/final.mp4
  python3 render.py episodes/<name>.txt --stills 0,5,9    # PNG stills only (fast check)

Script format: see README.md.
"""
import sys, os, re, json, math, hashlib, subprocess, argparse, difflib
import numpy as np, cairo, soundfile as sf
from PIL import Image
from gfx import W, H, hexc, ease_out_back, paint, rrect, pil_to_surface, text_surface, text_width, wrap
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
            cur = dict(text=q(val), A="", B="", icons=None, reaction=""); ep["questions"].append(cur)
        elif key == "A":
            a, _, b = val.partition("|"); cur["A"] = q(a); cur["B"] = q(re.sub(r"^\s*B\s*:", "", b))
        elif key == "REACTION": cur["reaction"] = q(val)
        elif key == "ICONS": a, _, b = val.partition("|"); cur["icons"] = [a.strip(), b.strip()]
    for qq in ep["questions"]:
        if not qq["icons"]: qq["icons"] = [pick_icon(qq["A"], "A"), pick_icon(qq["B"], "B")]
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
    disp = [w for w in text.replace("…", "...").split() if norm(w)]   # keep "word..." so the pause stays a phrase break
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
    elif name == "tick":       # soft wood-block tick
        n = int(0.09 * SR); t = np.arange(n) / SR
        out = (np.sin(2 * np.pi * 1050 * t) * 0.7 + np.sin(2 * np.pi * 2300 * t) * 0.3) * np.exp(-t * 55) * 0.35
    elif name == "pop":        # bubbly pop
        n = int(0.12 * SR); t = np.arange(n) / SR; f = 380 + 700 * np.exp(-t * 45)
        out = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 38) * 0.45
    elif name == "ding":       # bright bell ding
        n = int(0.9 * SR); t = np.arange(n) / SR
        out = (np.sin(2 * np.pi * 1318.5 * t) + 0.45 * np.sin(2 * np.pi * 1975.5 * t) * np.exp(-t * 3) + 0.2 * np.sin(2 * np.pi * 2637 * t)) * np.minimum(1, t * 400) * np.exp(-t * 5) * 0.28
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
    audio, scenes, header, caps = [], [], [], []
    G = CFG["sfx_gain"]; CD = CFG["countdown_s"]

    def voice(text, at):
        a, key = tts(text, cache)
        words = align(text, word_times(a, key, cache), len(a) / SR)
        for w in words: w["s"] += at; w["e"] += at
        audio.append((at, a, 1.0)); caps.append(words)
        return at + len(a) / SR, words

    hook_text = ep["results_line"] or ep["hook"]
    qs = ep["questions"]
    t = T["hook_start"]
    header.append((-1, ("hook", hook_text)))
    scenes.append(dict(start=0.0, qi=0, countdown=None, reveal=None, special=False))
    t, _ = voice(hook_text, t)
    for i, qq in enumerate(qs):
        special = CFG["special_last"] and i == len(qs) - 1
        if i > 0:
            t += T["gap"]
            audio.append((t - 0.38, sfx("whoosh"), G["whoosh"]))
            scenes.append(dict(start=t, qi=i, countdown=None, reveal=None, special=special))
        t += T["voice_delay"] if i > 0 else T["hook_to_q1"]
        header.append((t, ("text", CFG["pick_text"])))
        qend, _ = voice(qq["text"], t)
        c0 = qend + T["before_countdown"]; r0 = c0 + CD
        scenes[-1].update(countdown=c0, reveal=r0, pick="AB"[i % 2])   # fun tap animation, alternates A/B (not a result)
        for k in range(int(round(CD))): audio.append((c0 + k, sfx("tick"), G["tick"]))
        audio.append((r0, sfx("pop"), G["pop"])); audio.append((r0 + 0.06, sfx("ding"), G["ding"]))
        header.append((r0, ("text", qq["reaction"])))
        t, _ = voice(qq["reaction"], r0 + T["after_countdown"])
    # outro: short line over the last question's images (calm: no pulse/shake), then the fixed end card is appended
    t += T["gap"]
    last = scenes[-1]
    scenes.append(dict(start=t, qi=last["qi"], countdown=None, reveal=None, special=False, outro=True))
    header.append((t, ("text", CFG["outro_header"])))
    oend, ow = voice(ep["outro"], t + T["voice_delay"])
    total = oend + T["outro_tail"]
    for k, s in enumerate(scenes): s["end"] = scenes[k + 1]["start"] if k + 1 < len(scenes) else total
    last["u1"] = total; scenes[-1]["u0"] = last["start"]; scenes[-1]["u1"] = total   # one continuous push-in under the outro
    return dict(scenes=scenes, header=header, caps=caps, audio=audio, total=total, episode=ep["episode"], ep=ep)


HH = H // 2
# ================================================================= v4 look: bright channel style (sunbursts, rounded tiles, outlined rounded font)
# Text = Fredoka Bold with a dark outline (gfx.text_surface). Option images = toon-3D heroes rendered by the engine (WyrTile).
INK = "#1B1B2F"
def tsurf(text, size, fill="#FFFFFF", stroke=None, shadow=True):
    s, w, h = text_surface(text, size, fill, stroke=int(size * 0.14) if stroke is None else stroke, shadow=shadow)
    return s, w, h

def put(ctx, surf, cx, cy, alpha=1.0, scale=1.0, rot=0.0):
    s, w, h = surf; paint(ctx, s, cx, cy, w, h, scale=scale, alpha=alpha, rot=rot)

def smooth(x): x = min(1.0, max(0.0, x)); return x * x * (3 - 2 * x)

def step(seq, t):
    cur, t0 = seq[0][1], seq[0][0]
    for tt, v in seq:
        if tt <= t: cur, t0 = v, tt
    return cur, t0

def load_images(ep):
    items = []
    for i, q in enumerate(ep["questions"]):
        for side, ic in zip("AB", q["icons"]):
            base, _, mod = ic.partition("+"); items.append(dict(name=base, side=side, ban=mod == "ban", dark=False))
    paths = scenes3d.ensure(items, comp="WyrTile", layers=("tile",), size=scenes3d.TILE)
    return {(k // 2, it["side"]): pil_to_surface(stickerize(Image.open(paths[k][0]).convert("RGBA"))) for k, it in enumerate(items)}

def stickerize(im, ow=16):
    """logo-style sticker: thick dark outline around the silhouette + soft top-light gloss + a touch more saturation"""
    import cv2
    a = np.asarray(im).astype(np.float32) / 255; rgb, al = a[..., :3], a[..., 3]
    hsv = cv2.cvtColor((rgb * 255).astype(np.uint8), cv2.COLOR_RGB2HSV).astype(np.float32); hsv[..., 1] = np.clip(hsv[..., 1] * 1.15, 0, 255)
    rgb = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2RGB).astype(np.float32) / 255
    yy = np.linspace(0, 1, a.shape[0])[:, None]; ys, xs = np.nonzero(al > 0.5)
    if len(ys):
        y0, y1 = ys.min(), ys.max(); g = np.clip(1 - (np.arange(a.shape[0])[:, None] - y0) / max(1, (y1 - y0) * 0.55), 0, 1) ** 2
        rgb = rgb + (1 - rgb) * 0.16 * g[..., None]
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * ow + 1, 2 * ow + 1))
    ring = cv2.GaussianBlur(cv2.dilate((al > 0.35).astype(np.uint8) * 255, k), (5, 5), 0).astype(np.float32) / 255
    ink = np.array(hexc(INK)[:3], np.float32)
    out_rgb = rgb * al[..., None] + ink * (1 - al[..., None]); out_a = np.maximum(al, ring)
    return Image.fromarray((np.dstack([out_rgb, out_a]) * 255).clip(0, 255).astype(np.uint8), "RGBA")

# ---------- backgrounds
def sunburst(ctx, cx, cy, y0, y1, c1, c2, glow, ang, n=22):
    ctx.save(); ctx.rectangle(0, y0, W, y1 - y0); ctx.clip()
    ctx.set_source_rgb(*hexc(c1)[:3]); ctx.paint()
    ctx.set_source_rgb(*hexc(c2)[:3]); R = 2400
    for k in range(n):
        a0 = ang + k * 2 * math.pi / n; a1 = a0 + math.pi / n
        ctx.move_to(cx, cy); ctx.line_to(cx + R * math.cos(a0), cy + R * math.sin(a0)); ctx.line_to(cx + R * math.cos(a1), cy + R * math.sin(a1)); ctx.close_path()
    ctx.fill()
    g = cairo.RadialGradient(cx, cy, 30, cx, cy, 760)
    g.add_color_stop_rgba(0, *hexc(glow)[:3], 0.95); g.add_color_stop_rgba(0.55, *hexc(glow)[:3], 0.25); g.add_color_stop_rgba(1, *hexc(glow)[:3], 0)
    ctx.set_source(g); ctx.paint(); ctx.restore()

def wave_path(ctx, t, y, amp=16):
    ctx.move_to(-10, y + amp * math.sin(-0.3 + t * 1.2))
    for x in range(0, W + 41, 40): ctx.line_to(x, y + amp * math.sin(x / 540 * 2 * math.pi + t * 1.2))

def draw_bg(ctx, t, special, per):
    P = CFG["palette"]["special" if special else "normal"]
    ang = 2 * math.pi * per * 0.5 * t
    sunburst(ctx, W / 2, L["tile_cy_A"], 0, HH + 40, P["A1"], P["A2"], P["Aglow"], ang)
    ctx.save(); wave_path(ctx, t, HH); ctx.line_to(W + 10, H); ctx.line_to(-10, H); ctx.close_path(); ctx.clip()
    sunburst(ctx, W / 2, L["tile_cy_B"], HH - 40, H, P["B1"], P["B2"], P["Bglow"], -ang)
    ctx.restore()
    # bottom purple swoosh like the channel art
    ctx.save(); ctx.move_to(-10, H - 120)
    for x in range(0, W + 41, 40): ctx.line_to(x, H - 150 + 30 * math.sin(x / 700 * 2 * math.pi + 1.2 + t * 0.8))
    ctx.line_to(W + 10, H); ctx.line_to(-10, H); ctx.close_path()
    ctx.set_source_rgb(*hexc(P["swoosh"])[:3]); ctx.fill_preserve(); ctx.restore()
    ctx.new_path()
    for lw, col in ((26, hexc(INK)), (14, (1, 1, 1, 1))):
        wave_path(ctx, t, HH); ctx.set_line_width(lw); ctx.set_source_rgba(*col); ctx.set_line_join(cairo.LINE_JOIN_ROUND); ctx.stroke()

# ---------- option tiles
def tile_rect(side):
    w, h = L["tile_w"], L["tile_h"]; cy = L["tile_cy_" + side]; return W / 2 - w / 2, cy - h / 2, w, h

def draw_tile(ctx, imgs, sc_, side, t, per):
    x, y, w, h = tile_rect(side); cx, cy = x + w / 2, y + h / 2
    t_in = sc_["start"] + (0.0 if side == "A" else 0.07)
    k = 1.0 if sc_["start"] <= 0 else (0.55 + 0.45 * ease_out_back(min(1, (t - t_in) / 0.32)) if t >= t_in else 0.55)
    u = max(0.0, (t - sc_.get("u0", sc_["start"])) / max(0.5, sc_.get("u1", sc_["end"]) - sc_.get("u0", sc_["start"])))
    kick = 0.05 * math.exp(-(t - sc_["reveal"]) * 6) if sc_["reveal"] is not None and t >= sc_["reveal"] else 0.0
    bob = 6 * math.sin(2 * math.pi * per * 3 * t + (0 if side == "A" else 1.6))
    rot = 0.012 * math.sin(2 * math.pi * per * 2 * t + (0 if side == "A" else 2.0)) * (1 if side == "A" else -1)
    sh = (0, 0)
    if sc_["special"] and t >= sc_["start"]:
        a = 4.0 + (8.0 if sc_["countdown"] is not None and sc_["countdown"] <= t < sc_["reveal"] + 0.3 else 0.0)
        sh = (a * (math.sin(t * 37.1) * 0.6 + math.sin(t * 23.3 + 1) * 0.4), a * (math.sin(t * 29.7 + 2) * 0.6 + math.sin(t * 41.9) * 0.4))
    P = CFG["palette"]["special" if sc_["special"] else "normal"]
    s = k * (1 + 0.035 * u + kick)
    ctx.save(); ctx.translate(cx + sh[0], cy + bob + sh[1]); ctx.rotate(rot); ctx.scale(s, s)
    r = 64
    rrect(ctx, -w / 2 + 6, -h / 2 + 18, w, h, r); ctx.set_source_rgba(0, 0, 0, 0.28); ctx.fill()          # drop shadow
    rrect(ctx, -w / 2 - 9, -h / 2 - 9, w + 18, h + 18, r + 9); ctx.set_source_rgb(*hexc(INK)[:3]); ctx.fill()  # dark outline
    rrect(ctx, -w / 2, -h / 2, w, h, r); ctx.set_source_rgb(1, 1, 1); ctx.fill()                          # white border
    bw = 13; g = cairo.LinearGradient(0, -h / 2, 0, h / 2)
    g.add_color_stop_rgb(0, *hexc(P["tile" + side + "1"])[:3]); g.add_color_stop_rgb(1, *hexc(P["tile" + side + "2"])[:3])
    rrect(ctx, -w / 2 + bw, -h / 2 + bw, w - 2 * bw, h - 2 * bw, r - bw); ctx.set_source(g); ctx.fill()
    rg = cairo.RadialGradient(0, -h * 0.05, 20, 0, -h * 0.05, w * 0.55); rg.add_color_stop_rgba(0, 1, 1, 1, 0.35); rg.add_color_stop_rgba(1, 1, 1, 1, 0)
    rrect(ctx, -w / 2 + bw, -h / 2 + bw, w - 2 * bw, h - 2 * bw, r - bw); ctx.set_source(rg); ctx.fill()
    ctx.set_source_rgba(1, 1, 1, 0.75); ctx.set_line_width(12); ctx.set_line_cap(cairo.LINE_CAP_ROUND)   # glossy highlight
    ctx.new_path(); ctx.arc(-w / 2 + r + 6, -h / 2 + r + 6, r - 26, math.pi * 1.05, math.pi * 1.45); ctx.stroke()
    ctx.move_to(-w / 2 + r + 30, -h / 2 + 34); ctx.line_to(-w / 2 + r + 70, -h / 2 + 34); ctx.stroke()
    img = imgs[(sc_["qi"], side)]; iw, ih = scenes3d.TILE; f = min((w - 30) / iw, (h - 30) / ih)
    ctx.save(); ctx.scale(f, f); ctx.set_source_surface(img, -iw / 2, -ih / 2 - 6 / f); ctx.get_source().set_filter(cairo.FILTER_GOOD); ctx.paint(); ctx.restore()
    ctx.restore()
    return k

def burst(ctx, cx, cy, side_sign, a, size=1.0):
    """yellow/white emphasis strokes like the channel art"""
    if a <= 0.02: return
    for i, (ang, ln) in enumerate(((-0.55, 60), (0.0, 72), (0.55, 60))):
        dx, dy = math.cos(ang) * side_sign, math.sin(ang)
        x0, y0 = cx + dx * 26 * size, cy + dy * 26 * size; x1, y1 = x0 + dx * ln * size, y0 + dy * ln * size
        for lw, col in ((22, hexc(INK)[:3]), (12, hexc("#FFE14D")[:3])):
            ctx.move_to(x0, y0); ctx.line_to(x1, y1); ctx.set_line_width(lw * size); ctx.set_line_cap(cairo.LINE_CAP_ROUND)
            ctx.set_source_rgba(*col, a); ctx.stroke()

def draw_banner(ctx, tl, sc_, side, k):
    q = tl["ep"]["questions"][sc_["qi"]]
    x, y, w, h = tile_rect(side)
    cy = y + h if side == "A" else y
    lines, size = wrap(q[side].upper(), L["label_size"], L["label_max_w"], 2)
    lw = max(text_width(l, size) for l in lines); bh = size * (1.25 + 1.05 * (len(lines) - 1)); bw = lw + 2 * 44 + 70
    cyb = cy + (bh / 2 - 34 if side == "A" else -(bh / 2 - 34))
    ctx.save(); ctx.translate(W / 2, cyb); ctx.scale(k, k)
    rrect(ctx, -bw / 2 + 4, -bh / 2 + 10, bw, bh, 30); ctx.set_source_rgba(0, 0, 0, 0.3); ctx.fill()
    rrect(ctx, -bw / 2 - 7, -bh / 2 - 7, bw + 14, bh + 14, 37); ctx.set_source_rgb(*hexc(INK)[:3]); ctx.fill()
    g = cairo.LinearGradient(0, -bh / 2, 0, bh / 2); g.add_color_stop_rgb(0, *hexc("#FFE14D")[:3]); g.add_color_stop_rgb(1, *hexc("#FFB800")[:3])
    rrect(ctx, -bw / 2, -bh / 2, bw, bh, 30); ctx.set_source(g); ctx.fill()
    ccx = -bw / 2 + 50                                                  # A/B chip
    ctx.arc(ccx, 0, 34, 0, 2 * math.pi); ctx.set_source_rgb(*hexc(INK)[:3]); ctx.fill()
    ctx.arc(ccx, 0, 28, 0, 2 * math.pi); ctx.set_source_rgb(*hexc(CFG["palette"]["normal"]["tile" + side + "1"])[:3]); ctx.fill()
    put(ctx, tsurf(side, 40, "#FFFFFF", stroke=5, shadow=False), ccx, 1)
    for i, ln in enumerate(lines):
        yy = (i - (len(lines) - 1) / 2) * size * 1.05
        put(ctx, tsurf(ln, size, INK, stroke=0, shadow=False), 35 + (lw - text_width(ln, size)) * 0, yy)
    ctx.restore()

def draw_vs(ctx, sc_, t):
    cx, cy, r = W / 2, HH, L["vs_radius"]; cd = sc_["countdown"]; CD = CFG["countdown_s"]
    in_cd = cd is not None and cd <= t < cd + CD
    wob = 0.06 * math.sin(t * 3.1)
    ctx.arc(cx, cy + 8, r + 8, 0, 2 * math.pi); ctx.set_source_rgba(0, 0, 0, 0.3); ctx.fill()
    ctx.arc(cx, cy, r + 8, 0, 2 * math.pi); ctx.set_source_rgb(*hexc(INK)[:3]); ctx.fill()
    g = cairo.LinearGradient(0, cy - r, 0, cy + r); g.add_color_stop_rgb(0, *hexc("#FFE14D")[:3]); g.add_color_stop_rgb(1, *hexc("#FFB000")[:3])
    ctx.arc(cx, cy, r, 0, 2 * math.pi); ctx.set_source(g); ctx.fill()
    if in_cd:
        u = (t - cd) / CD; sec = int(t - cd); ph = (t - cd) - sec
        for lw, col in ((22, hexc(INK)[:3]), (12, (1, 1, 1))):
            ctx.new_path(); ctx.arc(cx, cy, r + 24, -math.pi / 2, -math.pi / 2 + 2 * math.pi * (1 - u)); ctx.set_line_cap(cairo.LINE_CAP_ROUND)
            ctx.set_line_width(lw); ctx.set_source_rgb(*col); ctx.stroke()
        put(ctx, tsurf(str(int(math.ceil(CD - (t - cd)))), 84, "#FFFFFF", stroke=10), cx, cy + 2, scale=1 + 0.25 * max(0, 1 - ph / 0.25))
    else:
        put(ctx, tsurf("VS", 56, INK, stroke=0, shadow=False), cx, cy + 3, rot=wob)

def draw_header(ctx, tl, t):
    (kind, text), t0 = step(tl["header"], t)
    k = 1.0 if t0 < 0 else 0.6 + 0.4 * ease_out_back(min(1, (t - t0) / 0.28))
    if text == CFG["pick_text"]:
        put(ctx, tsurf(text, L["pick_size"], "#FFFFFF"), W / 2, L["header_y"], scale=k * (1 + 0.035 * math.sin(2 * math.pi * 1.6 * t)), rot=0.03 * math.sin(t * 2.2))
        return
    words = text.split()
    emph = [len(re.sub(r"[^A-Za-z]", "", w)) > 1 and re.sub(r"[^A-Za-z]", "", w).isupper() for w in words]
    lines, sz = wrap(text.upper(), L["header_size"], L["header_max_w"], 3)
    lh = sz * 1.1; y = L["header_y"] - (len(lines) - 1) * lh / 2; i = 0
    for ln in lines:
        ws = ln.split(); widths = [text_width(w, sz) for w in ws]; gap = sz * 0.28
        x = W / 2 - (sum(widths) + gap * (len(ws) - 1)) / 2
        for w_, wd in zip(ws, widths):
            px, py = W / 2 + (x + wd / 2 - W / 2) * k, L["header_y"] + (y - L["header_y"]) * k
            if emph[i]: pill(ctx, w_, sz, px, py, k)
            else: put(ctx, tsurf(w_, sz, "#FFFFFF"), px, py, scale=k)
            i += 1; x += wd + gap
        y += lh

def pill(ctx, word, sz, cx, cy, k=1.0):
    """highlighted word: dark text on a yellow pill with a dark outline (channel logo 'DAILY' style)"""
    tw = text_width(word, sz); pw, ph = tw + sz * 0.7, sz * 1.18
    ctx.save(); ctx.translate(cx, cy); ctx.scale(k, k); ctx.rotate(-0.025)
    rrect(ctx, -pw / 2 + 3, -ph / 2 + 8, pw, ph, ph * 0.32); ctx.set_source_rgba(0, 0, 0, 0.3); ctx.fill()
    rrect(ctx, -pw / 2 - 6, -ph / 2 - 6, pw + 12, ph + 12, ph * 0.32 + 6); ctx.set_source_rgb(*hexc(INK)[:3]); ctx.fill()
    g = cairo.LinearGradient(0, -ph / 2, 0, ph / 2); g.add_color_stop_rgb(0, *hexc("#FFE14D")[:3]); g.add_color_stop_rgb(1, *hexc("#FFB800")[:3])
    rrect(ctx, -pw / 2, -ph / 2, pw, ph, ph * 0.32); ctx.set_source(g); ctx.fill()
    put(ctx, tsurf(word, sz, INK, stroke=0, shadow=False), 0, 2); ctx.restore()

def hand_path(ctx):
    """white pointing hand (index finger up, tip at 0,0), as in the channel logo"""
    rrect(ctx, -19, 0, 38, 120, 19)                                   # index finger
    rrect(ctx, -46, 92, 112, 112, 40)                                 # palm
    for i in range(3): rrect(ctx, 14 + i * 0, 92 + i * 30, 70, 34, 17)  # folded fingers
    ctx.save(); ctx.translate(-46, 150); ctx.rotate(-0.7); rrect(ctx, -10, -18, 70, 36, 18); ctx.restore()   # thumb
    rrect(ctx, -30, 196, 86, 34, 12)                                  # cuff

def draw_hand(ctx, tipx, tipy, ang, sc):
    ctx.save(); ctx.translate(tipx, tipy); ctx.rotate(ang); ctx.scale(sc, sc)
    ctx.translate(8, 14); hand_path(ctx); ctx.set_source_rgba(0, 0, 0, 0.25); ctx.fill(); ctx.translate(-8, -14)
    hand_path(ctx); ctx.set_source_rgb(*hexc(INK)[:3]); ctx.set_line_width(16); ctx.set_line_join(cairo.LINE_JOIN_ROUND); ctx.stroke()
    hand_path(ctx); ctx.set_source_rgb(1, 1, 1); ctx.fill()
    ctx.set_source_rgb(*hexc(INK)[:3]); ctx.set_line_width(5); ctx.set_line_cap(cairo.LINE_CAP_ROUND)
    for yy in (122, 152, 182): ctx.move_to(22, yy); ctx.line_to(58, yy); ctx.stroke()
    ctx.restore()

def draw_check(ctx, cx, cy, k):
    if k <= 0.01: return
    ctx.save(); ctx.translate(cx, cy); ctx.scale(k, k)
    ctx.arc(0, 0, 62, 0, 2 * math.pi); ctx.set_source_rgb(*hexc(INK)[:3]); ctx.fill()
    ctx.arc(0, 0, 55, 0, 2 * math.pi); ctx.set_source_rgb(1, 1, 1); ctx.fill()
    g = cairo.RadialGradient(-12, -16, 4, 0, 0, 48); g.add_color_stop_rgb(0, *hexc("#5BE36B")[:3]); g.add_color_stop_rgb(1, *hexc("#16A34A")[:3])
    ctx.arc(0, 0, 46, 0, 2 * math.pi); ctx.set_source(g); ctx.fill()
    for lw, col in ((22, hexc(INK)[:3]), (12, (1, 1, 1))):
        ctx.move_to(-22, 2); ctx.line_to(-6, 18); ctx.line_to(24, -16); ctx.set_line_width(lw); ctx.set_line_cap(cairo.LINE_CAP_ROUND)
        ctx.set_line_join(cairo.LINE_JOIN_ROUND); ctx.set_source_rgb(*col); ctx.stroke()
    ctx.restore()

def draw_reveal(ctx, sc_, t):
    """after the countdown the pointing hand taps one tile (alternating A/B) and a green check pops on it"""
    if sc_.get("pick") is None or sc_["reveal"] is None: return
    r0 = sc_["reveal"]; x, y, w, h = tile_rect(sc_["pick"])
    tx, ty = x + w * 0.64, y + h * 0.40                                  # tap point (hand stays clear of the label banner)
    a = t - (r0 - 0.35)
    if a < 0: return
    u = min(1.0, a / 0.35); e = 1 - (1 - u) ** 3
    sx, sy = -120, ty + 420                                              # comes in from bottom-left
    px, py = sx + (tx - sx) * e, sy + (ty - sy) * e
    tap = math.exp(-((t - r0) / 0.06) ** 2) if t >= r0 - 0.1 else 0     # quick press
    bob = 6 * math.sin((t - r0) * 4) if t > r0 + 0.2 else 0
    if t >= r0:                                                          # tap ripple
        q = (t - r0) / 0.4
        if q < 1:
            ctx.new_path(); ctx.arc(tx, ty, 30 + 90 * q, 0, 2 * math.pi); ctx.set_line_width(10 * (1 - q)); ctx.set_source_rgba(1, 1, 1, 0.9 * (1 - q)); ctx.stroke()
    ck = ease_out_back(min(1, (t - r0 - 0.04) / 0.3)) if t >= r0 + 0.04 else 0
    draw_check(ctx, x + 70, y + 66, ck)
    if ck > 0: burst(ctx, x + 70 - 66, y + 66, -1, max(0, 1 - (t - r0) / 0.8), 0.9)
    draw_hand(ctx, px + 4 * tap, py + 10 * tap + bob, -0.42, 0.9 - 0.08 * tap)

def draw_question(ctx, sc_, t):
    """the logo's big '?' bounces during the countdown"""
    cd = sc_["countdown"]
    if cd is None or not (cd <= t < sc_["reveal"]): return
    u = t - cd; hop = abs(math.sin(u * math.pi * 2.2)); k = min(1, u / 0.15)
    sq = 1 + 0.08 * (1 - hop)
    put(ctx, tsurf("?", 190, "#FFFFFF", stroke=26), 150, 915 - 70 * hop, scale=k * sq, rot=-0.15 + 0.08 * math.sin(u * 7))

def phrases(words):
    out, cur = [], []
    for w in words:
        cur.append(w)
        if w["brk"]: out.append(cur); cur = []
    if cur: out.append(cur)
    res = []
    for p in out:
        n = math.ceil(len(p) / 8); kk = math.ceil(len(p) / n); res += [p[i:i + kk] for i in range(0, len(p), kk)]
    return res

def draw_caption(ctx, tl, t):
    total = tl["total"]
    for words in tl["caps"]:
        if not (words[0]["s"] - 0.1 <= t <= words[-1]["e"] + 0.4): continue
        ph = phrases(words)
        for i, p in enumerate(ph):
            t0 = p[0]["s"] - 0.06
            t1 = min(ph[i + 1][0]["s"] - 0.06 if i + 1 < len(ph) else p[-1]["e"] + 0.35, total)
            if not (t0 <= t < t1): continue
            text = " ".join(w["w"] for w in p)
            sz = L["caption_size"]
            while text_width(text, sz) > L["caption_max_w"]: sz -= 2
            put(ctx, tsurf(text, sz, "#FFFFFF"), W / 2, L["caption_y"], scale=0.7 + 0.3 * ease_out_back(min(1, (t - t0) / 0.18)))
            return

def draw_badge(ctx, ep):
    if not ep: return
    s = tsurf("#" + ep, 40, INK, stroke=0, shadow=False); w = s[1] - 30; x, y = L["badge_x"], L["badge_y"]
    rrect(ctx, x - 5, y - 5, w + 34, 66, 33); ctx.set_source_rgb(*hexc(INK)[:3]); ctx.fill()
    rrect(ctx, x, y, w + 24, 56, 28); ctx.set_source_rgb(*hexc("#FFE14D")[:3]); ctx.fill()
    put(ctx, s, x + (w + 24) / 2, y + 29)

RED_PULSE = None
def red_pulse(ctx, a):
    global RED_PULSE
    if RED_PULSE is None:
        yy, xx = np.mgrid[0:H, 0:W].astype(np.float32); d = np.sqrt(((xx - W / 2) / (W * 0.62)) ** 2 + ((yy - H / 2) / (H * 0.6)) ** 2)
        r = np.clip((d - 0.45) / 0.55, 0, 1) ** 1.4
        RED_PULSE = pil_to_surface(Image.fromarray((np.dstack([r * 0.95, r * 0.05, r * 0.1, r]) * 255).astype(np.uint8), "RGBA"))
    ctx.set_source_surface(RED_PULSE, 0, 0); ctx.paint_with_alpha(a)

def frame(ctx, tl, imgs, t):
    total = tl["total"]; per = max(1, round(0.12 * total)) / total
    sc_ = [s for s in tl["scenes"] if s["start"] <= t][-1] if t >= 0 else tl["scenes"][0]
    draw_bg(ctx, t, sc_["special"], per)
    ka = draw_tile(ctx, imgs, sc_, "A", t, per); kb = draw_tile(ctx, imgs, sc_, "B", t, per)
    pop = 1.0 if sc_["start"] <= 0 else max(0.0, 1 - (t - sc_["start"]) / 0.6)
    rev = math.exp(-(t - sc_["reveal"]) * 3) if sc_["reveal"] is not None and t >= sc_["reveal"] else 0.0
    for side in "AB":
        x, y, w, h = tile_rect(side); a = max(0.55 + 0.45 * math.sin(2 * math.pi * 1.2 * t), rev)
        burst(ctx, x - 10, y + h * 0.35, -1, a); burst(ctx, x + w + 10, y + h * 0.35, 1, a)
    draw_banner(ctx, tl, sc_, "A", ka); draw_banner(ctx, tl, sc_, "B", kb)
    if sc_["special"]:
        beat = (t - sc_["start"]) % 0.83; pulse = math.exp(-beat * 6) + 0.6 * math.exp(-max(0, beat - 0.22) * 7) * (beat > 0.22)
        red_pulse(ctx, min(1, 0.2 + 0.4 * pulse))
    draw_vs(ctx, sc_, t)
    draw_question(ctx, sc_, t)
    draw_header(ctx, tl, t)
    draw_badge(ctx, tl["episode"])
    draw_caption(ctx, tl, t)
    draw_reveal(ctx, sc_, t)
    if rev > 0.05: ctx.set_source_rgba(1, 1, 1, min(0.35, rev * 0.3)); ctx.paint()


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
    json.dump({"duration": tl["total"], "header": tl["header"], "scenes": tl["scenes"], "captions": tl["caps"]},
              open(os.path.join(out, "timeline.json"), "w"), indent=1)
    print(f"duration {full:.2f}s = {tl['total']:.2f}s + {ENDCARD_FRAMES / FPS:.1f}s end card  scenes: " + ", ".join("/".join(q["icons"]) for q in ep["questions"])
          , flush=True)
    imgs = load_images(ep)
    surf = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H); ctx = cairo.Context(surf)
    if a.stills:
        for ts in a.stills.split(","):
            t = (nfr - 1) / FPS if ts == "last" else min(float(ts), (nfr - 1) / FPS)
            frame(ctx, tl, imgs, t); p = os.path.join(out, f"still_{t:05.2f}.png"); surf.write_to_png(p); print(p)
        return
    wav = mix_audio(tl, out)
    final = os.path.join(out, "final.mp4")
    ff = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgra", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                           "-i", wav, "-map", "0:v", "-map", "1:a", "-c:v", "libx264", "-preset", "medium", "-crf", "17", "-pix_fmt", "yuv420p",
                           "-c:a", "aac", "-b:a", "192k", "-t", f"{full:.3f}", "-movflags", "+faststart", final], stdin=subprocess.PIPE)
    for f in range(nfr):
        frame(ctx, tl, imgs, f / FPS); surf.flush(); ff.stdin.write(surf.get_data())
        if f % 150 == 0: print(f"frame {f}/{nfr}", flush=True)
    # fixed end card: the saved frames, byte-identical in every episode (never re-rendered here)
    card = subprocess.run(["ffmpeg", "-v", "error", "-i", ENDCARD_MKV, "-f", "rawvideo", "-pix_fmt", "bgra", "-"], capture_output=True, check=True).stdout
    assert len(card) == ENDCARD_FRAMES * W * H * 4, "end card asset has the wrong size"
    ff.stdin.write(card)
    ff.stdin.close(); ff.wait()
    print("->", final)

if __name__ == "__main__":
    main()
