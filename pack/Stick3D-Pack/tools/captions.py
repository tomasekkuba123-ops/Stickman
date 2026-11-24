#!/usr/bin/env python3
"""Captions: 1-2 words per group (word-synced), key words yellow, band (low/high) chosen so the caption never covers
Stickman's FACE or the KEY ACTION (his body box), measured from the QC mask of the animatic (tools/stickmask.py).
usage: captions.py words.json script.txt out_dir [--mask mask.json] [--keywords "ROCKET,WHALE"] [--high a-b,c-d] [--low a-b]
writes out_dir/captions.json (read by kit/captions.tsx) and out_dir/CAPTIONS.srt"""
import sys, os, re, json, argparse

STOP = set("a an the and or but if of to in on at by for with from into onto up down out off over under then than so it its he his him she her they them we you your i me my is was were be been are do did does not no yes very just what would could should can will this that these those there here when who whom which how why all any some one two three as".split())
BAND = {"low": (1450, 1720), "high": (230, 500), "safe": (1195, 1425)}  # v17 safe = 62-72 % (kit/captions.tsx)


def groups_from(words, toks, mx=2):
    G, cur = [], []
    def flush():
        nonlocal cur
        if cur:
            G.append({"words": [re.sub(r"[.,!?;:…\"]+$", "", toks[i]).upper() for i in cur], "a": words[cur[0]]["start"], "e": words[cur[-1]]["end"], "ts": [[words[i]["start"], words[i]["end"]] for i in cur]}); cur = []
    for i in range(len(words)):
        cur.append(i)
        if len(cur) == mx or re.search(r"[.,!?;:…]$", toks[i]) or (i + 1 < len(words) and words[i + 1]["start"] - words[i]["end"] > 0.35):
            flush()
    flush(); return G


def auto_keywords(toks, n=40):
    # nouns-ish: not stop words, length >= 4 or numbers, plus words that repeat; capped
    from collections import Counter
    ws = [re.sub(r"[^A-Za-z0-9']", "", t).upper() for t in toks]
    c = Counter(w for w in ws if w and w.lower() not in STOP and len(w) >= 4)
    return [w for w, _ in c.most_common(n)]


def srt(G, path):
    def ts(x):
        h, m, s = int(x // 3600), int(x % 3600 // 60), x % 60
        return f"{h:02d}:{m:02d}:{int(s):02d},{int(round((s - int(s)) * 1000)):03d}"
    with open(path, "w") as f:
        for i, g in enumerate(G, 1):
            end = min(g["e"] + 0.5, G[i]["a"] - 0.02) if i < len(G) else g["e"] + 0.5
            f.write(f"{i}\n{ts(g['a'])} --> {ts(end)}\n{' '.join(g['words'])}\n\n")


def main():
    ap = argparse.ArgumentParser(); ap.add_argument("words"); ap.add_argument("script"); ap.add_argument("out"); ap.add_argument("--mask"); ap.add_argument("--keywords", default=""); ap.add_argument("--high", default=""); ap.add_argument("--low", default=""); ap.add_argument("--max", type=int, default=2); ap.add_argument("--safe", action="store_true", help="v17: every caption in the fixed safe zone (62-72 %%)")
    a = ap.parse_args(); os.makedirs(a.out, exist_ok=True)
    words = json.load(open(a.words))
    toks = json.load(open(a.script)) if a.script.endswith(".json") else open(a.script).read().split()
    if len(toks) != len(words): print(f"WARNING: {len(toks)} script tokens vs {len(words)} aligned words")
    G = groups_from(words, toks, a.max)
    kw = [k.strip().upper() for k in a.keywords.split(",") if k.strip()] or auto_keywords(toks)
    faces = []
    if a.mask and os.path.exists(a.mask):
        M = json.load(open(a.mask)); faces = [(f["t"], f.get("face"), f.get("body")) for f in M["frames"] if f["vis"]]
    force = lambda spec: [tuple(map(float, r.split("-"))) for r in spec.split(",") if r]
    hi, lo = force(a.high), force(a.low)
    for g in G:
        g["key"] = [w in kw for w in g["words"]]
        t0, t1 = g["a"], min(g["e"] + 0.7, g["a"] + 3)
        if any(x <= t0 < y for x, y in hi): g["band"] = "high"; continue
        if any(x <= t0 < y for x, y in lo): g["band"] = "low"; continue
        cost = {"low": 0.0, "high": 0.4}  # prefer low (classic position) when both are free
        for t, face, body in faces:
            if not (t0 <= t <= t1): continue
            for b, (y0, y1) in BAND.items():
                if b not in cost: continue
                if face and face[3] * 1920 > y0 + 20 and face[1] * 1920 < y1 - 20: cost[b] += 10      # face: never
                if body and body[3] * 1920 > y0 and body[1] * 1920 < y1: cost[b] += 1                 # key action (body/hands): avoid
        g["band"] = min(cost, key=cost.get)
    if a.safe:
        y0, y1 = BAND["safe"]; clash = 0
        for g in G:
            g["band"] = "safe"; t0, t1 = g["a"], min(g["e"] + 0.7, g["a"] + 3)
            if any(t0 <= t <= t1 and face and face[3] * 1920 > y0 + 20 and face[1] * 1920 < y1 - 20 for t, face, _ in faces): clash += 1
        print(f"safe band: {clash} groups overlap a face")
    json.dump({"groups": G, "keywords": kw}, open(os.path.join(a.out, "captions.json"), "w"), indent=0)
    srt(G, os.path.join(a.out, "CAPTIONS.srt"))
    print(f"captions: {len(G)} groups, {sum(g['band'] == 'high' for g in G)} high / {sum(g['band'] == 'low' for g in G)} low, keywords: {', '.join(kw[:12])}...")


if __name__ == "__main__":
    main()
