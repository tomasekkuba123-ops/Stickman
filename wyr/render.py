#!/usr/bin/env python3
"""Would You Rather Shorts — reusable template.

usage:
  python3 render.py episodes/<name>.txt                 # full render -> out/<name>/final.mp4
  python3 render.py episodes/<name>.txt --stills 1,5,9  # PNG stills only (fast check)

Script format: see README.md (HOOK / Q1..Qn / A: .. | B: .. / Reaction / OUTRO, optional Icons: a | b).
"""
import sys, os, re, json, math, hashlib, subprocess, argparse
import numpy as np, cairo, soundfile as sf
from gfx import (W, H, INK, hexc, clamp, ease_out_cubic, ease_in_cubic, pop, text_surface, text_width, wrap,
                 paint, circle)
from icons import render_icon, pick_icon

HERE = os.path.dirname(os.path.abspath(__file__))
CFG = json.load(open(os.path.join(HERE, "config.json")))
FPS, SR = 30, 24000
COMP = "acompressor=threshold=-20dB:ratio=3:attack=5:release=120:makeup=2,"

# ---------------------------------------------------------------- script
def parse_script(path):
    q = lambda s: s.strip().strip('"“”').strip()
    segs, cur = [], None
    for raw in open(path, encoding="utf-8"):
        line = raw.strip()
        if not line or line.startswith("#"): continue
        m = re.match(r"^(HOOK|OUTRO|Q\d+|A|Reaction|Icons|Labels)\s*:\s*(.*)$", line, re.I)
        if not m: continue
        key, val = m.group(1).upper(), m.group(2)
        if key == "HOOK":
            cur = dict(kind="hook", text=q(val), A=CFG["hook"]["A"], B=CFG["hook"]["B"],
                       icons=CFG["hook"]["icons"]); segs.append(cur)
        elif key == "OUTRO":
            cur = dict(kind="outro", text=q(val), A=CFG["outro"]["A"], B=CFG["outro"]["B"],
                       icons=CFG["outro"]["icons"]); segs.append(cur)
        elif key.startswith("Q"):
            cur = dict(kind="question", text=q(val), A="", B="", icons=None, reaction=None); segs.append(cur)
        elif key == "A":  # "A: x | B: y"
            a, _, b = val.partition("|")
            cur["A"] = q(a); cur["B"] = q(re.sub(r"^\s*B\s*:", "", b))
        elif key == "LABELS":
            a, _, b = val.partition("|"); cur["A"], cur["B"] = q(a), q(b)
        elif key == "REACTION":
            cur["reaction"] = q(val)
        elif key == "ICONS":
            a, _, b = val.partition("|"); cur["icons"] = [a.strip(), b.strip()]
    for s in segs:
        if not s["icons"]:
            s["icons"] = [pick_icon(s["A"], "A"), pick_icon(s["B"], "B")]
    return segs


# ---------------------------------------------------------------- voice
def tts_text(t):
    t = re.sub(r"\b([A-Z]{2,})\b", lambda m: m.group(1).lower(), t)  # ALL-CAPS emphasis would be spelled out
    t = re.sub(r"\bA\b(?=\s+or\b|[?!.]|$)", "Ay", t); t = re.sub(r"\bB\b", "Bee", t)  # letters A/B spoken as letters
    return t.lstrip(".… ").strip()

_kokoro = None
def tts(text, cache):
    global _kokoro
    v = CFG["voice"]
    key = hashlib.sha1(f"{tts_text(text)}|{v["name"]}|{v["speed"]}".encode()).hexdigest()[:12]
    path = os.path.join(cache, key + ".wav")
    if not os.path.exists(path):
        if _kokoro is None:
            from kokoro_onnx import Kokoro
            _kokoro = Kokoro(v["model"], v["voices_file"])
        a, sr = _kokoro.create(tts_text(text), voice=v["name"], speed=v["speed"], lang="en-us")
        assert sr == SR
        sf.write(path, a, sr)
    a, _ = sf.read(path, dtype="float32")
    # trim leading/trailing silence
    nz = np.where(np.abs(a) > 0.01)[0]
    a = a[max(0, nz[0] - 240): nz[-1] + 1200] if len(nz) else a
    return a

_whisper = None
def word_times(audio, cache_key, cache):
    path = os.path.join(cache, cache_key + ".words.json")
    if os.path.exists(path): return json.load(open(path))
    global _whisper
    if _whisper is None:
        from faster_whisper import WhisperModel
        _whisper = WhisperModel("base.en", device="cpu", compute_type="int8")
    a16 = np.interp(np.arange(0, len(audio), SR / 16000), np.arange(len(audio)), audio).astype(np.float32)
    segs, _ = _whisper.transcribe(a16, word_timestamps=True, language="en")
    words = [{"w": w.word.strip(), "s": w.start, "e": w.end} for s in segs for w in s.words]
    json.dump(words, open(path, "w")); return words

norm = lambda w: re.sub(r"[^a-z0-9]", "", w.lower())

def align(text, whisper_words, dur):
    """display words of the script text with start/end times taken from Whisper"""
    disp = [w for w in text.replace("...", " ").replace("…", " ").split() if norm(w)]
    tok = [norm(w) for w in disp]
    wtok = [norm(w["w"]) for w in whisper_words]
    import difflib
    times = [None] * len(disp)
    for a, b, n in difflib.SequenceMatcher(None, tok, wtok, autojunk=False).get_matching_blocks():
        for k in range(n): times[a + k] = (whisper_words[b + k]["s"], whisper_words[b + k]["e"])
    # interpolate the unmatched ones by character length
    i = 0
    while i < len(disp):
        if times[i] is None:
            j = i
            while j < len(disp) and times[j] is None: j += 1
            t0 = times[i - 1][1] if i > 0 else 0.0
            t1 = times[j][0] if j < len(disp) else dur
            lens = [len(tok[k]) + 1 for k in range(i, j)]; tot = sum(lens); acc = t0
            for k, L in zip(range(i, j), lens):
                d = (t1 - t0) * L / tot; times[k] = (acc, acc + d); acc += d
            i = j
        else: i += 1
    out = []
    for w, (s, e) in zip(disp, times):
        w0 = w; w = w.strip(",.;:").upper() if not w.endswith(("?", "!")) else w.upper()
        out.append({"w": w.strip('"“”'), "s": s, "e": e, "brk": w0.rstrip('"“”')[-1:] in ".,?!:;"})
    return out


# ---------------------------------------------------------------- sfx (synthesized, no samples)
def _lp(x, cut):
    y = np.empty_like(x); acc = 0.0
    a = 1 - np.exp(-2 * np.pi * np.asarray(cut) / SR) * np.ones_like(x)
    for i in range(len(x)): acc += a[i] * (x[i] - acc); y[i] = acc
    return y

def sfx(name):
    rng = np.random.default_rng(7)
    if name == "whoosh":
        n = int(0.55 * SR); t = np.linspace(0, 1, n)
        noise = rng.standard_normal(n)
        cut = 300 + 2600 * np.sin(np.pi * t) ** 2
        band = _lp(noise, cut) - _lp(noise, cut * 0.35)
        env = np.sin(np.pi * np.clip(t * 1.15, 0, 1)) ** 2 * (1 - t) ** 0.4
        return (band * env / (np.abs(band).max() + 1e-9) * 0.5).astype(np.float32)
    if name == "pop":
        n = int(0.11 * SR); t = np.arange(n) / SR
        f = 380 + 700 * np.exp(-t * 45); ph = 2 * np.pi * np.cumsum(f) / SR
        return (np.sin(ph) * np.exp(-t * 38) * 0.45).astype(np.float32)
    if name == "tick":
        n = int(0.06 * SR); t = np.arange(n) / SR
        return ((np.sin(2 * np.pi * 1900 * t) + 0.4 * rng.standard_normal(n) * np.exp(-t * 400)) * np.exp(-t * 70) * 0.4).astype(np.float32)
    if name == "ding":
        n = int(0.8 * SR); t = np.arange(n) / SR
        return ((np.sin(2 * np.pi * 1568 * t) + 0.35 * np.sin(2 * np.pi * 3136 * t)) * np.exp(-t * 6) * 0.3).astype(np.float32)
    raise KeyError(name)


# ---------------------------------------------------------------- timeline
def build(segs, cache):
    T = CFG["timing"]; t = 0.0; vis, audio_ev = [], []

    def voice(text, at, key):
        a = tts(text, cache)
        k = hashlib.sha1((tts_text(text) + json.dumps(CFG["voice"])).encode()).hexdigest()[:12]
        words = align(text, word_times(a, k, cache), len(a) / SR)
        for w in words: w["s"] += at; w["e"] += at
        audio_ev.append((at, a, 1.0))
        return at + len(a) / SR, words

    for i, s in enumerate(segs):
        v = dict(kind=s["kind"], start=t, A=s["A"], B=s["B"], icons=s["icons"], lines=[], countdown=None)
        if i > 0: audio_ev.append((t - 0.12, sfx("whoosh"), 0.55))
        vstart = t + (0.12 if i == 0 else T["voice_delay"])
        vend, words = voice(s["text"], vstart, "q")
        v["lines"].append(words)
        if s["kind"] == "question":
            # option B appears on the first word after "..." (or after " or ")
            txt = s["text"]; cut = txt.find("...")
            nA = len([w for w in txt[:cut].split() if norm(w)]) if cut > 0 else None
            if nA is None:
                lw = [norm(w) for w in txt.split() if norm(w)]
                nA = lw.index("or") if "or" in lw else len(lw) // 2
            v["tA"] = t + 0.15; v["tB"] = words[min(nA, len(words) - 1)]["s"] - 0.05
            c0 = vend + T["before_countdown"]
            v["countdown"] = c0
            for k in range(3): audio_ev.append((c0 + k, sfx("tick"), 0.6))
            audio_ev.append((c0 + 3, sfx("ding"), 0.5))
            r0 = c0 + 3 + T["after_countdown"]
            if s.get("reaction"):
                rend, rw = voice(s["reaction"], r0, "r"); v["lines"].append(rw)
            else: rend = r0
            t = rend + T["tail"]
        else:
            v["tA"] = t if i == 0 else t + 0.15; v["tB"] = v["tA"] + (0 if i == 0 else 0.25)
            t = vend + (T["outro_hold"] if s["kind"] == "outro" else T["tail"])
        if i > 0 or s["kind"] != "hook":
            audio_ev.append((v["tA"] + 0.05, sfx("pop"), 0.35)); audio_ev.append((v["tB"] + 0.05, sfx("pop"), 0.35))
        v["end"] = t; vis.append(v)
    return vis, audio_ev, t


# ---------------------------------------------------------------- drawing
TOP, BOT = hexc(CFG["colors"]["A"]), hexc(CFG["colors"]["B"])
L = CFG["layout"]

def background():
    s = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H); c = cairo.Context(s)
    for (y0, col, cy) in ((0, TOP, L["icon_y_A"]), (H / 2, BOT, L["icon_y_B"])):
        g = cairo.RadialGradient(W / 2, cy, 50, W / 2, cy, 900)
        light = tuple(min(1, x * 1.18 + 0.04) for x in col[:3]); dark = tuple(x * 0.78 for x in col[:3])
        g.add_color_stop_rgb(0, *light); g.add_color_stop_rgb(1, *dark)
        c.rectangle(0, y0, W, H / 2); c.set_source(g); c.fill()
    # subtle diagonal stripes for texture
    c.set_source_rgba(1, 1, 1, 0.035); c.set_line_width(46)
    for x in range(-H, W + H, 140):
        c.move_to(x, 0); c.line_to(x + H, H); c.stroke()
    c.rectangle(0, H / 2 - 5, W, 10); c.set_source_rgb(1, 1, 1); c.fill()
    return s

def draw_caption(ctx, words, t, y, base=96):
    # chunks of <=3 words, broken after punctuation
    chunks, cur = [], []
    for w in words:
        cur.append(w)
        if len(cur) == 3 or w.get("brk"): chunks.append(cur); cur = []
    if cur: chunks.append(cur)
    for ci, ch in enumerate(chunks):
        t0 = ch[0]["s"] - 0.04
        t1 = chunks[ci + 1][0]["s"] - 0.04 if ci + 1 < len(chunks) else ch[-1]["e"] + 0.45
        if not (t0 <= t < t1): continue
        size = base
        while sum(text_width(w["w"], size) for w in ch) + 30 * size / 100 * (len(ch) - 1) > 960: size -= 4
        gap = 30 * size / 100
        ws = [text_width(w["w"], size) for w in ch]; x = W / 2 - (sum(ws) + gap * (len(ws) - 1)) / 2
        cs = pop(t - t0, 0.22)
        for w, wd in zip(ch, ws):
            active = w is max((u for u in ch if u["s"] - 0.04 <= t), key=lambda u: u["s"], default=None)
            col = CFG["colors"]["caption_active"] if active else "#FFFFFF"
            surf, sw, sh = text_surface(w["w"], size, col, stroke=int(size * 0.13))
            k = 1 + 0.12 * max(0.0, 1 - (t - w["s"]) / 0.18) if active and t >= w["s"] else 1.0
            cxw = W / 2 + (x + wd / 2 - W / 2) * cs   # scale the chunk as a whole -> no overlap during pop
            paint(ctx, surf, cxw, y, sw, sh, scale=cs * k)
            x += wd + gap
        return True
    return False

ICON_CACHE = {}
def icon(name):
    if name not in ICON_CACHE: ICON_CACHE[name] = render_icon(name, L["icon_size"])
    return ICON_CACHE[name]

def draw_half(ctx, v, side, t, xoff):
    cy_icon = L["icon_y_" + side]; cy_lab = L["label_y_" + side]
    t_in = v["tA"] if side == "A" else v["tB"]
    sc = pop(t - t_in, 0.38)
    if sc <= 0: return
    bob = 9 * math.sin(2 * math.pi * 0.45 * t + (0 if side == "A" else 1.7))
    x = W / 2 + xoff
    ctx.save(); circle(ctx, x, cy_icon + bob, L["icon_size"] * 0.58 * sc)
    ctx.set_source_rgba(1, 1, 1, 0.14); ctx.fill(); ctx.restore()
    s, w, h = icon(v["icons"][0 if side == "A" else 1])
    paint(ctx, s, x, cy_icon + bob, w, h, scale=sc, rot=0.03 * math.sin(2 * math.pi * 0.3 * t))
    if v["kind"] == "question":  # A/B sticker
        bs, bw, bh = text_surface(side, 70, "#FFFFFF", stroke=9)
        bx, by = x - L["icon_size"] * 0.66, cy_icon + bob
        ctx.save(); circle(ctx, bx, by, 54 * sc); ctx.set_source_rgba(*hexc("#22223B")); ctx.fill()
        circle(ctx, bx, by, 46 * sc); ctx.set_source_rgba(*(TOP if side == "A" else BOT)); ctx.fill(); ctx.restore()
        paint(ctx, bs, bx, by + 2, bw, bh, scale=sc * 0.9)
    text = (v["A"] if side == "A" else v["B"]).upper()
    if text:
        lines, size = wrap(text, L["label_size"], L["label_max_w"])
        ls = pop(t - t_in - 0.08, 0.3)
        for k, ln in enumerate(lines):
            dy = (k - (len(lines) - 1) / 2) * size * 1.05
            if side == "A": dy -= (len(lines) - 1) * size * 0.5   # grow away from the centre line
            else: dy += (len(lines) - 1) * size * 0.5
            surf, sw, sh = text_surface(ln, size)
            paint(ctx, surf, x, cy_lab + dy, sw, sh, scale=ls)

def draw_vs(ctx, v, t):
    cx, cy, r = W / 2, H / 2, L["vs_radius"]
    cd = v["countdown"] if v else None
    in_cd = cd is not None and cd <= t < cd + 3
    k = 1.0
    if in_cd:
        sec = int(t - cd); k = 1 + 0.12 * max(0, 1 - (t - cd - sec) / 0.25)
    ctx.save(); circle(ctx, cx, cy + 8, r * k); ctx.set_source_rgba(0, 0, 0, 0.25); ctx.fill()
    circle(ctx, cx, cy, r * k); ctx.set_source_rgb(1, 1, 1); ctx.fill(); ctx.restore()
    if in_cd:
        rr, lw = r * k + 24, 18
        ctx.set_line_width(lw + 10); ctx.set_source_rgba(*hexc("#22223B", 0.55)); circle(ctx, cx, cy, rr); ctx.stroke()
        frac = 1 - (t - cd) / 3
        ctx.new_path(); ctx.arc(cx, cy, rr, -math.pi / 2, -math.pi / 2 + 2 * math.pi * frac)
        ctx.set_line_cap(cairo.LINE_CAP_ROUND); ctx.set_line_width(lw)
        ctx.set_source_rgba(*hexc(CFG["colors"]["caption_active"])); ctx.stroke()
        n = str(3 - sec); s, w, h = text_surface(n, 120, "#22223B", stroke=0, shadow=False)
        paint(ctx, s, cx, cy + 4, w, h, scale=pop(t - cd - sec, 0.2))
    else:
        s, w, h = text_surface("VS", 82, "#22223B", stroke=0, shadow=False)
        paint(ctx, s, cx, cy + 3, w, h, scale=k)

def frame(ctx, bg, vis, t, total):
    ctx.set_source_surface(bg, 0, 0); ctx.paint()
    v = next((x for x in vis if x["start"] <= t < x["end"]), vis[-1])
    i = vis.index(v)
    p_in = 1.0 if i == 0 else ease_out_cubic((t - v["start"]) / 0.35)
    p_out = 0.0 if i == len(vis) - 1 else ease_in_cubic((t - (v["end"] - 0.2)) / 0.2)
    off = (1 - p_in) * W - p_out * W
    draw_half(ctx, v, "A", t, off)
    draw_half(ctx, v, "B", t, -off)
    draw_vs(ctx, v, t)
    shown = any(draw_caption(ctx, ln, t, L["caption_y"]) for ln in v["lines"])
    cd = v["countdown"]
    if not shown and cd is not None and cd <= t < cd + 3.2:
        s, w, h = text_surface(CFG["countdown_text"], 92, CFG["colors"]["caption_active"])
        paint(ctx, s, W / 2, L["caption_y"], w, h, scale=pop(t - cd, 0.3) * (1 + 0.03 * math.sin(t * 12)))


# ---------------------------------------------------------------- main
def main():
    ap = argparse.ArgumentParser(); ap.add_argument("script"); ap.add_argument("--stills", default="")
    a = ap.parse_args()
    name = os.path.splitext(os.path.basename(a.script))[0]
    out = os.path.join(HERE, "out", name); cache = os.path.join(out, "cache"); os.makedirs(cache, exist_ok=True)
    segs = parse_script(a.script)
    vis, audio_ev, total = build(segs, cache)
    nfr = int(math.ceil(total * FPS)); total = nfr / FPS
    json.dump({"duration": total, "segments": [{k: v[k] for k in ("kind", "start", "end", "A", "B", "icons", "countdown", "lines")} for v in vis]},
              open(os.path.join(out, "timeline.json"), "w"), indent=1)
    print(f"duration {total:.2f}s, {nfr} frames; icons: " + ", ".join("/".join(v["icons"]) for v in vis))
    bg = background()
    surf = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H); ctx = cairo.Context(surf)
    if a.stills:
        for ts in a.stills.split(","):
            frame(ctx, bg, vis, float(ts), total); p = os.path.join(out, f"still_{float(ts):05.2f}.png"); surf.write_to_png(p); print(p)
        return
    # audio
    mix = np.zeros(int((total + 1) * SR), np.float32)
    for at, clip, g in audio_ev:
        i0 = max(0, int(at * SR)); seg = clip[: len(mix) - i0] * g; mix[i0:i0 + len(seg)] += seg
    mix = mix[: int(total * SR)]
    raw = os.path.join(out, "mix_raw.wav"); sf.write(raw, mix, SR)
    meas = subprocess.run(["ffmpeg", "-hide_banner", "-i", raw, "-af", COMP + "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"],
                          capture_output=True, text=True).stderr
    m = json.loads(meas[meas.rindex("{"):meas.rindex("}") + 1])
    ln = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}"
          f":measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
    wav = os.path.join(out, "mix.wav")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", raw, "-af", COMP + ln, "-ar", "48000", "-ac", "2", wav], check=True)
    # video
    final = os.path.join(out, "final.mp4")
    ff = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgra", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                           "-i", wav, "-map", "0:v", "-map", "1:a", "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
                           "-c:a", "aac", "-b:a", "192k", "-t", f"{total:.3f}", "-movflags", "+faststart", final], stdin=subprocess.PIPE)
    for f in range(nfr):
        frame(ctx, bg, vis, f / FPS, total); surf.flush()
        ff.stdin.write(surf.get_data())
        if f % 150 == 0: print(f"frame {f}/{nfr}", flush=True)
    ff.stdin.close(); ff.wait()
    print("->", final)

if __name__ == "__main__":
    main()
