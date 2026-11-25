#!/usr/bin/env python3
"""Would You Rather Shorts — reusable template (v2).

usage:
  python3 render.py episodes/<name>.txt                  # full render -> out/<name>/final.mp4
  python3 render.py episodes/<name>.txt --stills 0,5,9    # PNG stills only (fast check)

Script format: see README.md.
"""
import sys, os, re, json, math, hashlib, subprocess, argparse, difflib
import numpy as np, cairo, soundfile as sf
from PIL import Image
from gfx import W, H, hexc, ease_out_back, pop, text_surface, text_width, wrap, paint, circle, rrect, pil_to_surface
from icons import render_icon, pick_icon

HERE = os.path.dirname(os.path.abspath(__file__))
CFG = json.load(open(os.path.join(HERE, "config.json")))
L, T, C = CFG["layout"], CFG["timing"], CFG["colors"]
FPS, SR = 30, 24000
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


# ================================================================= sfx (synthesized in code)
def _lp(x, cut):
    y = np.empty_like(x); acc = 0.0; a = 1 - np.exp(-2 * np.pi * np.asarray(cut) / SR)
    for i in range(len(x)): acc += a[i] * (x[i] - acc); y[i] = acc
    return y

def sfx(name):
    rng = np.random.default_rng(7)
    if name == "whoosh":
        n = int(0.5 * SR); t = np.linspace(0, 1, n); noise = rng.standard_normal(n)
        cut = 300 + 2400 * np.sin(np.pi * t) ** 2
        band = _lp(noise, cut) - _lp(noise, cut * 0.35)
        env = np.sin(np.pi * np.clip(t * 1.15, 0, 1)) ** 2 * (1 - t) ** 0.4
        return (band * env / (np.abs(band).max() + 1e-9) * 0.5).astype(np.float32)
    if name == "tick":   # soft wood-block tick
        n = int(0.09 * SR); t = np.arange(n) / SR
        body = np.sin(2 * np.pi * 1050 * t) * 0.7 + np.sin(2 * np.pi * 2300 * t) * 0.3
        return (body * np.exp(-t * 55) * 0.35).astype(np.float32)
    if name == "ding":
        n = int(0.9 * SR); t = np.arange(n) / SR
        tone = np.sin(2 * np.pi * 1318.5 * t) + 0.45 * np.sin(2 * np.pi * 1975.5 * t) * np.exp(-t * 3) + 0.2 * np.sin(2 * np.pi * 2637 * t)
        return (tone * np.minimum(1, t * 400) * np.exp(-t * 7) * 0.28).astype(np.float32)
    raise KeyError(name)


# ================================================================= timeline
def build(ep, cache):
    """returns (scenes, events, audio, total). scenes = visual states; events = timed header/mascot changes"""
    audio, scenes = [], []
    header, mascot = [], []          # (t, value) step functions
    caps = []                        # caption word lists (absolute times)

    def voice(text, at):
        a, key = tts(text, cache)
        words = align(text, word_times(a, key, cache), len(a) / SR)
        for w in words: w["s"] += at; w["e"] += at
        audio.append((at, a, 1.0)); caps.append(words)
        return at + len(a) / SR, words

    hook_text = ep["results_line"] or ep["hook"]
    qs = ep["questions"]
    M = CFG["mascot"]["poses"]
    t = T["hook_start"]
    header.append((-1, ("hook", hook_text))); mascot.append((-1, M["hook"]))
    scenes.append(dict(start=-1, q=qs[0], tA=-1, tB=-1, countdown=None))
    t, _ = voice(hook_text, t)
    for i, qq in enumerate(qs):
        if i > 0:
            t += T["gap"]
            audio.append((t - 0.38, sfx("whoosh"), CFG["sfx_gain"]["whoosh"]))  # done before the voice starts
            scenes.append(dict(start=t, q=qq, tA=t, tB=t + T["b_after_a"], countdown=None))
        t += T["voice_delay"] if i > 0 else T["hook_to_q1"]
        header.append((t, ("text", CFG["pick_text"]))); mascot.append((t, M["question"]))
        qend, _ = voice(qq["text"], t)
        c0 = qend + T["before_countdown"]
        scenes[-1]["countdown"] = c0; mascot.append((c0, M["countdown"]))
        for k in range(3): audio.append((c0 + k, sfx("tick"), CFG["sfx_gain"]["tick"]))
        r0 = c0 + 3
        audio.append((r0, sfx("ding"), CFG["sfx_gain"]["ding"]))
        header.append((r0, ("text", qq["reaction"]))); mascot.append((r0, M.get(qq["mood"], qq["mood"])))
        t, _ = voice(qq["reaction"], r0 + T["after_countdown"])
    # outro: back to Q1 so the last frame == the first frame
    t += T["gap"]
    audio.append((t - 0.38, sfx("whoosh"), CFG["sfx_gain"]["whoosh"]))  # done before the voice starts
    scenes.append(dict(start=t, q=qs[0], tA=t, tB=t + T["b_after_a"], countdown=None))
    header.append((t, ("text", CFG["outro_header"]))); mascot.append((t, M["outro"]))
    oend, ow = voice(ep["outro"], t + T["voice_delay"])
    # the loop word: last word of the outro switches everything back to the frame-0 state
    lw = ow[-1]["s"] - 0.05
    header.append((lw, ("hook", hook_text))); mascot.append((lw, M["hook"]))
    total = oend + T["loop_tail"]
    return dict(scenes=scenes, header=header, mascot=mascot, caps=caps, audio=audio, total=total, episode=ep["episode"])


# ================================================================= drawing
TOP, BOT = hexc(C["A"]), hexc(C["B"])

def step(seq, t):
    cur, t0 = seq[0][1], seq[0][0]
    for tt, v in seq:
        if tt <= t: cur, t0 = v, tt
    return cur, t0

def background():
    s = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H); c = cairo.Context(s)
    for (y0, col, cy) in ((0, TOP, L["icon_y_A"]), (H / 2, BOT, L["icon_y_B"])):
        g = cairo.RadialGradient(W / 2, cy, 50, W / 2, cy, 900)
        g.add_color_stop_rgb(0, *[min(1, x * 1.18 + 0.04) for x in col[:3]]); g.add_color_stop_rgb(1, *[x * 0.78 for x in col[:3]])
        c.rectangle(0, y0, W, H / 2); c.set_source(g); c.fill()
    c.set_source_rgba(1, 1, 1, 0.035); c.set_line_width(46)
    for x in range(-H, W + H, 140): c.move_to(x, 0); c.line_to(x + H, H); c.stroke()
    c.rectangle(0, H / 2 - 5, W, 10); c.set_source_rgb(1, 1, 1); c.fill()
    return s

ICON_CACHE, MASCOT_CACHE = {}, {}
def icon(name):
    if name not in ICON_CACHE: ICON_CACHE[name] = render_icon(name, L["icon_size"])
    return ICON_CACHE[name]

def mascot_img(pose):
    if pose not in MASCOT_CACHE:
        im = Image.open(os.path.join(HERE, "assets", "mascot", pose + ".png"))
        scale = (L["mascot_h"] if pose != "thumbs" else L["mascot_h"] * 0.92) / im.height
        im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
        MASCOT_CACHE[pose] = (pil_to_surface(im), im.width, im.height)
    return MASCOT_CACHE[pose]

def rich_lines(ctx, text, cx, cy, size, max_w, max_lines, base_col, emph_col, scale=1.0):
    """wrapped header text; words written in ALL CAPS in the script are drawn in the emphasis colour"""
    words = text.split()
    caps = [len(re.sub(r"[^A-Za-z]", "", w)) > 1 and re.sub(r"[^A-Za-z]", "", w).isupper() for w in words]
    lines, size = wrap(text.upper(), size, max_w, max_lines)
    gap = size * 0.28; lh = size * 1.08; k = 0
    y = cy - (len(lines) - 1) * lh / 2
    for ln in lines:
        ws = ln.split(); widths = [text_width(w, size) for w in ws]
        x = W / 2 - (sum(widths) + gap * (len(ws) - 1)) / 2
        for w, wd in zip(ws, widths):
            col = emph_col if caps[k] else base_col; k += 1
            s, sw, sh = text_surface(w, size, col, stroke=int(size * 0.13))
            paint(ctx, s, W / 2 + (x + wd / 2 - W / 2) * scale, cy + (y - cy) * scale, sw, sh, scale=scale)
            x += wd + gap
        y += lh

def draw_header(tl, ctx, t):
    (kind, text), t0 = step(tl["header"], t)
    sc = 1.0 if t0 < 0 else 0.55 + 0.45 * ease_out_back((t - t0) / 0.28)
    if kind == "text" and text == CFG["pick_text"]:
        sc *= 1 + 0.025 * math.sin(2 * math.pi * 1.5 * t)
        rich_lines(ctx, text, W / 2, L["header_y"], L["pick_size"], L["header_max_w"], 1, C["caption_active"], C["caption_active"], sc)
    else:
        rich_lines(ctx, text, W / 2, L["header_y"], L["header_size"], L["header_max_w"], 3, "#FFFFFF", C["caption_active"], sc)

def draw_badge(ctx, ep):
    if not ep: return
    s, w, h = text_surface("#" + ep, 64, "#22223B", stroke=0, shadow=False)
    bw = max(120, w - 10); x, y = L["badge_x"], L["badge_y"]
    ctx.save(); rrect(ctx, x, y + 6, bw, 92, 30); ctx.set_source_rgba(0, 0, 0, 0.25); ctx.fill()
    rrect(ctx, x, y, bw, 92, 30); ctx.set_source_rgb(1, 1, 1); ctx.fill(); ctx.restore()
    paint(ctx, s, x + bw / 2, y + 48, w, h)

def draw_half(ctx, sc_, side, t, bobf):
    qq = sc_["q"]; cy_icon = L["icon_y_" + side]
    t_in = sc_["tA"] if side == "A" else sc_["tB"]
    k = 1.0 if t_in < 0 else (0.35 + 0.65 * ease_out_back((t - t_in) / 0.26) if t >= t_in else 0.0)
    if k <= 0: return
    bob = 8 * math.sin(2 * math.pi * bobf * t + (0 if side == "A" else 1.7))
    x = W / 2
    circle(ctx, x, cy_icon + bob, L["icon_size"] * 0.58 * k); ctx.set_source_rgba(1, 1, 1, 0.14); ctx.fill()
    s, w, h = icon(qq["icons"][0 if side == "A" else 1])
    paint(ctx, s, x, cy_icon + bob, w, h, scale=k, rot=0.03 * math.sin(2 * math.pi * bobf * t))
    bs, bw, bh = text_surface(side, 60, "#FFFFFF", stroke=8)            # A/B sticker
    bx, by = x - L["icon_size"] * 0.7, cy_icon + bob
    circle(ctx, bx, by, 47 * k); ctx.set_source_rgba(*hexc("#22223B")); ctx.fill()
    circle(ctx, bx, by, 40 * k); ctx.set_source_rgba(*(TOP if side == "A" else BOT)); ctx.fill()
    paint(ctx, bs, bx, by + 2, bw, bh, scale=k * 0.9)
    lines, size = wrap(qq[side].upper(), L["label_size"], L["label_max_w"])
    lh = size * 1.02
    for i, ln in enumerate(lines):   # A grows upward from its anchor, B downward (away from the centre)
        y = L["label_y_A"] - (len(lines) - 1 - i) * lh if side == "A" else L["label_y_B"] + i * lh
        s, sw, sh = text_surface(ln, size)
        paint(ctx, s, x, y, sw, sh, scale=k)

def draw_vs(ctx, cd, t):
    cx, cy, r = W / 2, H / 2, L["vs_radius"]
    in_cd = cd is not None and cd <= t < cd + 3
    k = 1.0
    if in_cd: sec = int(t - cd); k = 1 + 0.1 * max(0, 1 - (t - cd - sec) / 0.25)
    circle(ctx, cx, cy + 8, r * k); ctx.set_source_rgba(0, 0, 0, 0.25); ctx.fill()
    circle(ctx, cx, cy, r * k); ctx.set_source_rgb(1, 1, 1); ctx.fill()
    if in_cd:
        rr, lw = r * k + 22, 16
        ctx.set_line_width(lw + 10); ctx.set_source_rgba(*hexc("#22223B", 0.55)); circle(ctx, cx, cy, rr); ctx.stroke()
        ctx.new_path(); ctx.arc(cx, cy, rr, -math.pi / 2, -math.pi / 2 + 2 * math.pi * (1 - (t - cd) / 3))
        ctx.set_line_cap(cairo.LINE_CAP_ROUND); ctx.set_line_width(lw)
        ctx.set_source_rgba(*hexc(C["caption_active"])); ctx.stroke()
        s, w, h = text_surface(str(3 - sec), 112, "#22223B", stroke=0, shadow=False)
        paint(ctx, s, cx, cy + 4, w, h, scale=pop(t - cd - sec, 0.2))
    else:
        s, w, h = text_surface("VS", 76, "#22223B", stroke=0, shadow=False)
        paint(ctx, s, cx, cy + 3, w, h)

def draw_caption(ctx, words, t, total):
    chunks, cur = [], []
    for w in words:
        cur.append(w)
        if len(cur) == 3 or w["brk"]: chunks.append(cur); cur = []
    if cur: chunks.append(cur)
    for ci, ch in enumerate(chunks):
        t0 = ch[0]["s"] - 0.04
        t1 = chunks[ci + 1][0]["s"] - 0.04 if ci + 1 < len(chunks) else ch[-1]["e"] + 0.3
        t1 = min(t1, total - 1.5 / FPS)            # last frame stays caption-free like frame 0 (loop)
        if not (max(t0, 1.0 / FPS) <= t < t1): continue   # frame 0 caption-free (loop seam)
        size = L["caption_size"]
        while sum(text_width(w["w"], size) for w in ch) + size * 0.3 * (len(ch) - 1) > L["caption_max_w"]: size -= 2
        gap = size * 0.3; ws = [text_width(w["w"], size) for w in ch]
        x = W / 2 - (sum(ws) + gap * (len(ws) - 1)) / 2
        cs = 0.6 + 0.4 * ease_out_back((t - t0) / 0.18)
        act = max((u for u in ch if u["s"] - 0.04 <= t), key=lambda u: u["s"], default=None)
        pw, ph = (sum(ws) + gap * (len(ws) - 1) + size * 0.9) * cs, size * 1.35 * cs   # dark pill = clearly a caption
        rrect(ctx, W / 2 - pw / 2, L["caption_y"] - ph / 2, pw, ph, ph / 2); ctx.set_source_rgba(0.08, 0.08, 0.18, 0.55); ctx.fill()
        for w, wd in zip(ch, ws):
            on = w is act
            s, sw, sh = text_surface(w["w"], size, C["caption_active"] if on else "#FFFFFF", stroke=int(size * 0.14))
            kk = 1 + 0.12 * max(0.0, 1 - (t - w["s"]) / 0.18) if on and t >= w["s"] else 1.0
            paint(ctx, s, W / 2 + (x + wd / 2 - W / 2) * cs, L["caption_y"], sw, sh, scale=cs * kk)
            x += wd + gap
        return

def draw_mascot(ctx, tl, t, bobf):
    pose, t0 = step(tl["mascot"], t)
    s, w, h = mascot_img(pose)
    k = 1.0 if t0 < 0 else 0.8 + 0.2 * ease_out_back((t - t0) / 0.25)
    bob = 4 * math.sin(2 * math.pi * bobf * 2 * t)
    cx, by = L["mascot_x"], L["mascot_bottom"]
    ctx.save(); ctx.translate(cx, by); ctx.scale(1, 0.25); circle(ctx, 0, 0, w * 0.42); ctx.restore()
    ctx.set_source_rgba(0, 0, 0, 0.22); ctx.fill()
    paint(ctx, s, cx, by - h * k / 2 + bob * 0.5, w, h, scale=k)

def frame(ctx, bg, tl, t):
    total = tl["total"]
    bobf = max(1, round(0.4 * total)) / total          # periodic over the whole video -> seamless loop
    ctx.set_source_surface(bg, 0, 0); ctx.paint()
    sc_ = [s for s in tl["scenes"] if s["start"] <= t][-1]
    draw_half(ctx, sc_, "A", t, bobf); draw_half(ctx, sc_, "B", t, bobf)
    draw_vs(ctx, sc_["countdown"], t)
    draw_header(tl, ctx, t)
    draw_badge(ctx, tl["episode"])
    for ln in tl["caps"]:
        if ln[0]["s"] - 0.05 <= t <= ln[-1]["e"] + 0.35: draw_caption(ctx, ln, t, total)
    draw_mascot(ctx, tl, t, bobf)


# ================================================================= audio + encode
def loudness(path):
    r = subprocess.run(["ffmpeg", "-hide_banner", "-i", path, "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"],
                       capture_output=True, text=True).stderr
    return json.loads(r[r.rindex("{"): r.rindex("}") + 1])

def mix_audio(tl, out):
    n = int(round(tl["total"] * SR)); mix = np.zeros(n + SR, np.float32)
    for at, clip, g in tl["audio"]:
        i0 = max(0, int(round(at * SR))); seg = clip[: len(mix) - i0] * g; mix[i0:i0 + len(seg)] += seg
    mix = mix[:n]
    raw = os.path.join(out, "mix_raw.wav"); sf.write(raw, mix, SR)
    pre = os.path.join(out, "mix_pre.wav")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", raw, "-af", COMP.rstrip(","), "-ar", "48000", "-ac", "2", pre], check=True)
    m = loudness(pre)
    # exact -14 LUFS: linear gain to target, then a true-peak limiter for safety
    gain = -14.0 - float(m["input_i"])
    wav = os.path.join(out, "mix.wav")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", pre, "-af", f"volume={gain:.2f}dB,alimiter=limit=0.85:attack=2:release=40:level=false",
                    "-ar", "48000", "-ac", "2", wav], check=True)
    m2 = loudness(wav)
    fix = -14.0 - float(m2["input_i"])
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
    json.dump({"duration": tl["total"], "header": tl["header"], "mascot": tl["mascot"],
               "scenes": [{"start": s["start"], "countdown": s["countdown"], "A": s["q"]["A"], "B": s["q"]["B"], "icons": s["q"]["icons"]} for s in tl["scenes"]],
               "captions": tl["caps"]}, open(os.path.join(out, "timeline.json"), "w"), indent=1)
    print(f"duration {tl['total']:.2f}s ({nfr} frames)  icons: " + ", ".join("/".join(q["icons"]) for q in ep["questions"])
          + "  moods: " + ", ".join(q["mood"] for q in ep["questions"]))
    bg = background(); surf = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H); ctx = cairo.Context(surf)
    if a.stills:
        for ts in a.stills.split(","):
            t = min(float(ts), (nfr - 1) / FPS) if ts != "last" else (nfr - 1) / FPS
            frame(ctx, bg, tl, t); p = os.path.join(out, f"still_{t:05.2f}.png"); surf.write_to_png(p); print(p)
        return
    wav = mix_audio(tl, out)
    final = os.path.join(out, "final.mp4")
    ff = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgra", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                           "-i", wav, "-map", "0:v", "-map", "1:a", "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
                           "-c:a", "aac", "-b:a", "192k", "-t", f"{tl['total']:.3f}", "-movflags", "+faststart", final], stdin=subprocess.PIPE)
    for f in range(nfr):
        frame(ctx, bg, tl, f / FPS); surf.flush(); ff.stdin.write(surf.get_data())
    ff.stdin.close(); ff.wait()
    print("->", final)

if __name__ == "__main__":
    main()
