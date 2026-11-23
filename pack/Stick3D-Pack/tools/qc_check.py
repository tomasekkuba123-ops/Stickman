#!/usr/bin/env python3
"""STEP 3 — automatic QC. Must PASS before delivery (exit code 0 = PASS, 1 = FAIL).
usage: qc_check.py video.mp4 --duration 100 [--mask mask.json] [--captions captions.json] [--out qcdir]
  (mask.json is picked up automatically from the video folder; without it a red-hoodie detector is used and marked APPROXIMATE)
  writes <out>/report.txt + contact_sheet.png (+ qc.json, QC_REPORT.md); default out = <video folder>/qc
Checks (STYLE_RULES.md):
  A  exact duration / frame count (30 fps, seconds*30 frames), 1080x1920
  B  Stickman visible >= 95 % of the time, no gap > 2.0 s            (from the QC mask render: pipeline/qcmask.sh)
  C  Stickman 40-60 % of frame height in most shots (>= 50 % of visible time inside 0.38-0.65), BIG ENOUGH (>= 38 % tall) >= 75 % of visible time, fully in frame >= 70 %
  H  his head stays WHITE (no colour grade tint): >= 90 % of sampled frames
  D  no static shot longer than 3 s (camera + content frozen), longest shot without a cut reported
  E  no caption over his face (captions.json bands vs face box per frame)
  F  loudness -14 LUFS (+-1), true peak <= -1.0 dBTP
  G  1-fps contact sheet saved (contact_1fps.png)
On FAIL the report lists the time ranges to fix and the final.sh --redo ranges."""
import sys, os, json, argparse, subprocess, re
import numpy as np

BAND = {"low": (1450, 1450 + 2 * 135), "high": (230, 230 + 2 * 135), "safe": (1195, 1195 + 2 * 135)}  # px in 1920 (kit/captions.tsx BAND_Y, 2 lines max)


def sh(*a):
    return subprocess.run(a, capture_output=True, text=True)


def ranges(ts, step, minlen=0.0):
    out, a, prev = [], None, None
    for t in ts:
        if a is None:
            a = prev = t
        elif t - prev > step * 1.5:
            out.append((a, prev + step)); a = t
        prev = t
    if a is not None:
        out.append((a, prev + step))
    return [(round(x, 2), round(y, 2)) for x, y in out if y - x >= minlen]


def main():
    ap = argparse.ArgumentParser(); ap.add_argument("video"); ap.add_argument("--duration", "--seconds", dest="seconds", type=float, required=True); ap.add_argument("--mask"); ap.add_argument("--captions"); ap.add_argument("--out")
    a = ap.parse_args(); vdir = os.path.dirname(os.path.abspath(a.video)); a.out = a.out or os.path.join(vdir, "qc"); os.makedirs(a.out, exist_ok=True)
    approx = False
    if not a.mask:
        for cand in (os.path.join(vdir, "mask.json"), os.path.splitext(a.video)[0] + ".mask.json"):
            if os.path.exists(cand): a.mask = cand; break
    if not a.mask:  # fallback: approximate detection on the video itself
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); import stickdetect
        D = stickdetect.scan(a.video, 6, 270); fr = []
        for f in D["frames"]:
            if f["hit"]:
                b = [f["body"][0] / 270, f["body"][1] / 480, f["body"][2] / 270, f["body"][3] / 480]; fc = [f["face"][0] / 270, f["face"][1] / 480, f["face"][2] / 270, f["face"][3] / 480]
                fr.append({"t": f["t"], "vis": True, "body": b, "face": fc, "hf": min(1.0, f["height_frac"]), "cut": f["cut_bottom"]})
            else: fr.append({"t": f["t"], "vis": False, "body": None, "face": None, "hf": 0, "cut": False})
        a.mask = os.path.join(a.out, "mask_approx.json"); json.dump({"fps": 6, "w": 270, "h": 480, "frames": fr}, open(a.mask, "w")); approx = True
    R, fails, warns = {}, [], []
    # A duration / frames
    pr = json.loads(sh("ffprobe", "-v", "error", "-show_entries", "stream=codec_type,width,height,r_frame_rate,nb_frames:format=duration", "-of", "json", a.video).stdout)
    v = [s for s in pr["streams"] if s["codec_type"] == "video"][0]; dur = float(pr["format"]["duration"]); nf = int(v.get("nb_frames", 0))
    exp = round(a.seconds * 30)
    R["A_duration"] = {"frames": nf, "expected": exp, "duration": dur, "size": f"{v['width']}x{v['height']}", "fps": v["r_frame_rate"]}
    if nf != exp or abs(dur - a.seconds) > 0.05 or (v["width"], v["height"]) != (1080, 1920) or v["r_frame_rate"] != "30/1":
        fails.append(f"A: duration/frames {dur:.3f}s {nf} frames {v['width']}x{v['height']} @ {v['r_frame_rate']} (expected {a.seconds}s {exp} frames 1080x1920 @ 30)")
    # B, C, E from the mask
    face_at = {}
    if a.mask and os.path.exists(a.mask):
        M = json.load(open(a.mask)); F = M["frames"]; step = 1 / M["fps"]
        vis = [f for f in F if f["vis"]]; pv = len(vis) / max(1, len(F))
        gaps = ranges([f["t"] for f in F if not f["vis"]], step)
        long_gaps = [g for g in gaps if g[1] - g[0] >= 1.9]  # rule: max 2 s off screen (6-fps sampling: be conservative)
        R["B_visible"] = {"percent": round(100 * pv, 1), "gaps": gaps}
        if approx: warns.append("B/C/H: no QC mask render found -> APPROXIMATE red-hoodie detection (run pipeline/qcmask.sh for exact numbers)")
        if pv < 0.95: fails.append(f"B: Stickman visible only {100 * pv:.1f} % (< 95 %)")
        if long_gaps: fails.append(f"B: off screen ~2 s or more at {long_gaps}")
        hf = np.array([f["hf"] for f in vis]) if vis else np.zeros(1)
        inside = float(((hf >= 0.38) & (hf <= 0.65)).mean()) if vis else 0
        full = float(np.mean([not f["cut"] for f in vis])) if vis else 0
        small = ranges([f["t"] for f in vis if f["hf"] < 0.3], step, 1.0); big = ranges([f["t"] for f in vis if f["hf"] > 0.8], step, 1.0)
        bigk = float((hf >= 0.38).mean()) if vis else 0
        R["C_size"] = {"big_enough": round(100 * bigk, 1), "median_height": round(float(np.median(hf)), 3), "in_40_60_band": round(100 * inside, 1), "fully_in_frame": round(100 * full, 1), "too_small_ranges": small, "too_big_ranges": big}
        if bigk < 0.75: fails.append(f"C: Stickman big enough (>= 38 % of frame height) only {100 * bigk:.0f} % of the time (need >= 75 %)")
        if inside < 0.5: fails.append(f"C: Stickman 40-60 % tall only {100 * inside:.0f} % of the time (need >= 50 %); too small at {small}, too big at {big}")
        if full < 0.7: warns.append(f"C: fully inside the frame only {100 * full:.0f} % of the time")
        for f in F:
            if f.get("face"):
                face_at[round(f["t"], 3)] = f["face"]
    else:
        fails.append("B/C/E: no mask.json — run pipeline/qcmask.sh first")
    # E captions over face
    if a.captions and os.path.exists(a.captions) and face_at:
        C = json.load(open(a.captions)); hits = []
        ts = sorted(face_at)
        for g in C["groups"]:
            b0, b1 = BAND[g.get("band", "low")]; lines = 1 if len(" ".join(g["words"])) <= 12 else 2; b1 = b0 + lines * 135
            for t in ts:
                if g["a"] <= t <= min(g["e"] + 0.7, g["a"] + 3):
                    fy0, fy1 = face_at[t][1] * 1920, face_at[t][3] * 1920
                    if fy1 > b0 + 20 and fy0 < b1 - 20:
                        hits.append(round(t, 2))
        R["E_captions"] = {"face_overlap_times": ranges(hits, 1 / 6)}
        if hits: fails.append(f"E: caption over the face at {ranges(hits, 1 / 6)} -> run tools/captions.py with --mask to re-place them")
    elif not a.captions:
        warns.append("E: no captions.json given — caption/face check skipped")
    # H head stays white (sample the real video inside the mask face box)
    if face_at:
        M2 = json.load(open(a.mask)); fps2 = M2["fps"]; Wq, Hq = 270, 480
        p2 = subprocess.Popen(["ffmpeg", "-v", "error", "-i", a.video, "-vf", f"fps={fps2},scale={Wq}:{Hq}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
        tot = ok = 0; bad = []
        for fr in M2["frames"]:
            b = p2.stdout.read(Wq * Hq * 3)
            if len(b) < Wq * Hq * 3: break
            fc = fr.get("face")
            if not fc: continue
            x0, y0, x1, y1 = fc[0] * Wq, fc[1] * Hq, fc[2] * Wq, fc[3] * Hq
            if y1 - y0 < 14: continue
            cx, cy, rw, rh = (x0 + x1) / 2, (y0 + y1) / 2, (x1 - x0) * 0.32, (y1 - y0) * 0.32
            img = np.frombuffer(b, np.uint8).reshape(Hq, Wq, 3)[int(cy - rh):int(cy + rh), int(cx - rw):int(cx + rw)].reshape(-1, 3).astype(int)
            if len(img) < 20: continue
            lum = img.sum(1); top = img[lum >= np.percentile(lum, 50)]; m = top.mean(0)
            tot += 1
            if m.min() >= 212 and m.max() - m.min() <= 30: ok += 1
            else: bad.append(fr["t"])
        wk = ok / max(1, tot); R["H_face_white"] = {"white_percent": round(100 * wk, 1), "tinted_at": ranges(bad, 1 / fps2, 0.3)}
        if tot and wk < 0.9: fails.append(f"H: Stickman's head is tinted (not white) in {100 * (1 - wk):.0f} % of frames, at {ranges(bad, 1 / fps2, 0.3)} — remove colour-grade overlays / fog on him")
    # D static shots + cuts (10 fps, 108x192 gray)
    W, H = 108, 192
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-i", a.video, "-vf", f"fps=10,scale={W}:{H},format=gray", "-f", "rawvideo", "-"], stdout=subprocess.PIPE)
    prev, diffs = None, []
    while True:
        b = p.stdout.read(W * H)
        if len(b) < W * H: break
        f = np.frombuffer(b, np.uint8).astype(np.float32)
        if prev is not None: diffs.append(float(np.abs(f - prev).mean()))
        prev = f
    d = np.array(diffs); cuts = [i / 10 for i, x in enumerate(d) if x > 22]
    static = ranges([i / 10 for i, x in enumerate(d) if x < 0.35], 0.1, 3.0)
    seg = np.diff([0.0] + cuts + [len(d) / 10]) if len(d) else np.array([0])
    longest = float(seg.max()) if len(seg) else 0
    R["D_motion"] = {"cuts": len(cuts), "static_over_3s": static, "longest_shot_s": round(longest, 2), "mean_shot_s": round(float(seg.mean()), 2)}
    if static: fails.append(f"D: static shot > 3 s at {static}")
    if longest > 4.5: warns.append(f"D: longest stretch without a hard cut {longest:.1f} s (rule: new angle/action every 2-3 s)")
    # F loudness
    e = sh("ffmpeg", "-nostats", "-i", a.video, "-af", "ebur128=peak=true", "-f", "null", "-").stderr
    I = float(re.findall(r"I:\s+(-?[\d.]+) LUFS", e)[-1]); TP = float(re.findall(r"Peak:\s+(-?[\d.]+) dBFS", e)[-1])
    R["F_audio"] = {"lufs": I, "true_peak": TP}
    if not (-15 <= I <= -13): fails.append(f"F: loudness {I} LUFS (target -14 +-1)")
    if TP > -1.0: fails.append(f"F: true peak {TP} dBTP (max -1.0)")
    # G contact sheet
    cs = os.path.join(a.out, "contact_sheet.png")
    sh("ffmpeg", "-v", "error", "-y", "-i", a.video, "-vf", f"fps=1,scale=108:192,tile=20x{max(1, int(np.ceil(a.seconds / 20)))}", "-frames:v", "1", cs)
    R["G_contact_sheet"] = cs
    # redo ranges = union of failing time ranges -> final.sh --redo a-b
    fix = []
    if "B_visible" in R: fix += [g for g in R["B_visible"]["gaps"] if g[1] - g[0] >= 1.9]
    if "C_size" in R and fails and any(x.startswith("C:") for x in fails): fix += R["C_size"]["too_small_ranges"] + R["C_size"]["too_big_ranges"]
    fix += static
    R["fix_ranges"] = sorted(fix); R["redo_commands"] = [f"pipeline/final.sh <Id> <frames> <outdir> <mix.wav> --redo {int(x)}-{int(np.ceil(y))}" for x, y in sorted(fix)]
    R["result"] = "PASS" if not fails else "FAIL"; R["fails"] = fails; R["warnings"] = warns
    json.dump(R, open(os.path.join(a.out, "qc.json"), "w"), indent=1)
    md = [f"# QC REPORT — {os.path.basename(a.video)} — **{R['result']}**", ""] + [f"- FAIL {x}" for x in fails] + [f"- warn {x}" for x in warns] + [""] + [f"- fix: {c}" for c in R["redo_commands"]] + ["", "```", json.dumps({k: v for k, v in R.items() if k[0] in 'ABCDEFH'}, indent=1), "```", f"Contact sheet: {cs}"]
    open(os.path.join(a.out, "QC_REPORT.md"), "w").write("\n".join(md))
    txt = [f"QC {R['result']}  {a.video}  (target {a.seconds:g} s)"] + [f"FAIL {x}" for x in fails] + [f"WARN {x}" for x in warns] + [f"FIX  {c}" for c in R["redo_commands"]] + [""] + [f"{k}: {json.dumps(v)}" for k, v in R.items() if k[:2] in ("A_", "B_", "C_", "D_", "E_", "F_", "H_")] + [f"contact sheet: {cs}"]
    open(os.path.join(a.out, "report.txt"), "w").write("\n".join(txt) + "\n")
    print("\n".join(md[:2 + len(fails) + len(warns)]))
    sys.exit(0 if not fails else 1)


if __name__ == "__main__":
    main()
