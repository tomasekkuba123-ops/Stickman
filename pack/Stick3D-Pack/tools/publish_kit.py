#!/usr/bin/env python3
"""STEP 4 — publish kit: 3 title options, a description with hashtags, and the best thumbnail frame (clear face + action).
usage: publish_kit.py final.mp4 episode_dir mask.json out_dir
  episode_dir must contain script.txt (and optionally captions.json for keywords / caption timing)
  thumbnail = frame with the largest, fully visible face, sharp + colourful, preferring moments without a caption on screen;
  writes THUMBNAIL.png (clean 1080x1920 frame) + THUMBNAIL_TEXT.png (with a big title word) + PUBLISH.md"""
import sys, os, re, json, subprocess
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFont

STOP = set("a an the and or but if of to in on at by for with from into up down out off he his him it its was were is be then than so very just what would you your".split())


def titles(script, kw):
    sents = [s.strip() for s in re.split(r"(?<=[.!?…])\s+", script.strip()) if s.strip()]
    hook = sents[0].replace("…", "...").rstrip()
    m = re.search(r"drew an? ([A-Za-z]+)", script, re.I); obj = (m.group(1) if m else (kw[0].lower() if kw else "something")).capitalize()
    twist = next((w for w in kw if w.lower() not in (obj.lower(), "stickman")), "").capitalize()
    q = next((s for s in reversed(sents) if s.endswith("?")), "What would YOU draw?")
    return [hook if hook.endswith("?") else hook + "?",
            f"Stickman Drew a {obj}... Then a {twist} Showed Up 😱" if twist else f"Stickman Drew a {obj}... and It Came ALIVE 😱",
            f"{q} ✏️ #Shorts"], obj


def best_frame(video, mask, caps):
    M = json.load(open(mask)); cands = []
    busy = [(g["a"], g["e"] + 0.7) for g in caps.get("groups", [])] if caps else []
    for f in M["frames"]:
        fc = f.get("face")
        if not f["vis"] or not fc or f["cut"] or f["t"] < 1.0: continue
        fh = fc[3] - fc[1]
        if fh < 0.08: continue
        if fc[1] < 0.03 or fc[3] > 0.97 or fc[0] < 0.02 or fc[2] > 0.98: continue  # full face inside
        score = min(fh, 0.32) * (0.6 if any(a <= f["t"] <= b for a, b in busy) else 1.0)
        cands.append((score, f["t"]))
    cands.sort(reverse=True)
    best = None
    for score, t in cands[:24]:  # refine top candidates on the real frame: sharpness + colourfulness
        img = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{t:.3f}", "-i", video, "-frames:v", "1", "-f", "image2pipe", "-vcodec", "png", "-"], capture_output=True).stdout
        im = cv2.imdecode(np.frombuffer(img, np.uint8), cv2.IMREAD_COLOR)
        if im is None: continue
        sharp = cv2.Laplacian(cv2.cvtColor(im, cv2.COLOR_BGR2GRAY), cv2.CV_64F).var()
        hsv = cv2.cvtColor(im, cv2.COLOR_BGR2HSV); col = hsv[..., 1].mean() / 255
        s = score * (0.5 + min(1, sharp / 400)) * (0.6 + col)
        if not best or s > best[0]: best = (s, t, im)
    return best


def main():
    video, ep, mask, out = sys.argv[1:5]; os.makedirs(out, exist_ok=True)
    script = open(os.path.join(ep, "script.txt")).read()
    capp = os.path.join(ep, "captions.json"); caps = json.load(open(capp)) if os.path.exists(capp) else {}
    kw = caps.get("keywords") or [w.upper() for w in re.findall(r"[A-Za-z]{5,}", script) if w.lower() not in STOP][:20]
    T, obj = titles(script, kw)
    sents = [s.strip() for s in re.split(r"(?<=[.!?…])\s+", script.strip()) if s.strip()]
    tags = ["#stickman", "#animation", "#shorts", "#whatif", f"#{obj.lower()}", "#cartoon", "#funny", "#story"] + [f"#{w.lower()}" for w in kw[:4] if w.lower() != obj.lower()]
    desc = f"{sents[0]} {sents[1] if len(sents) > 1 else ''}\n\nStickman has a magic pencil: whatever he draws becomes real. This time it was a {obj.lower()}... and things got out of hand. ✏️\n\n{sents[-1]} Tell me in the comments! 👇\nSubscribe for a new Stickman adventure every week.\n\n" + " ".join(dict.fromkeys(tags))
    b = best_frame(video, mask, caps)
    lines = ["# PUBLISH KIT", "", "## Title options"] + [f"{i + 1}. {t}" for i, t in enumerate(T)] + ["", "## Description", "", desc, ""]
    if b:
        _, t, im = b; p = os.path.join(out, "THUMBNAIL.png"); cv2.imwrite(p, im)
        pil = Image.fromarray(cv2.cvtColor(im, cv2.COLOR_BGR2RGB)); d = ImageDraw.Draw(pil)
        word = (obj.upper() + "?!") if len(obj) < 9 else obj.upper()
        try: F = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 190)
        except Exception: F = ImageFont.load_default()
        M = json.load(open(mask)); fr = min(M["frames"], key=lambda f: abs(f["t"] - t)); fy = (fr.get("face") or [0, 0.3, 0, 0.5])
        y = 1450 if fy[1] < 0.55 else 170
        w = d.textlength(word, font=F); d.text(((1080 - w) / 2, y), word, font=F, fill="#ffd23a", stroke_width=18, stroke_fill="#0b0d1a")
        pil.save(os.path.join(out, "THUMBNAIL_TEXT.png"))
        lines += ["## Thumbnail", f"Best frame at {t:.2f} s (largest clear face, sharp, colourful, no caption on it): THUMBNAIL.png, THUMBNAIL_TEXT.png"]
    open(os.path.join(out, "PUBLISH.md"), "w").write("\n".join(lines))
    print("\n".join(lines[:6]))


if __name__ == "__main__":
    main()
