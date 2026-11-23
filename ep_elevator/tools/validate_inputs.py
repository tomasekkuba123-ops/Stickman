"""Check SRT / timecoded voiceover / timeline CSV for consistency (30 scenes x 16 s, 120 lines x 4 s)."""
import csv, re, sys, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
src = root / "source_text"

def ts(s):
    h, m, rest = s.replace(",", ".").split(":"); return int(h)*3600 + int(m)*60 + float(rest)

srt = (src/"SUBTITLES_EN.srt").read_text(encoding="utf-8-sig").replace("\r\n", "\n").strip().split("\n\n")
subs = []
for b in srt:
    l = b.split("\n"); a, z = l[1].split(" --> "); subs.append((int(l[0]), ts(a), ts(z), " ".join(l[2:])))
errs = []
if len(subs) != 120: errs.append(f"SRT has {len(subs)} cues, expected 120")
for i, (n, a, z, t) in enumerate(subs):
    if n != i+1 or abs(a-i*4) > 1e-6 or abs(z-(i+1)*4) > 1e-6: errs.append(f"cue {n}: {a}-{z}")
tc = (src/"VOICEOVER_EN_TIMECODED.txt").read_text(encoding="utf-8")
vo = re.findall(r"(\d\d:\d\d:\d\d\.\d{3}) – (\d\d:\d\d:\d\d\.\d{3})  (.+)", tc)
if len(vo) != 120: errs.append(f"timecoded VO has {len(vo)} lines")
for i, ((a, z, t), s) in enumerate(zip(vo, subs)):
    if abs(ts(a)-s[1]) > 1e-6 or t.strip() != s[3].strip(): errs.append(f"VO/SRT mismatch line {i+1}: {t!r} vs {s[3]!r}")
rows = list(csv.DictReader(open(src/"TIMELINE_30_SCENES.csv", encoding="utf-8-sig")))
if len(rows) != 30: errs.append(f"CSV has {len(rows)} rows")
for i, r in enumerate(rows):
    if int(r["Scene"]) != i+1 or r["Image"] != f"SCENE_{i+1:02d}.jpg" or abs(ts(r["Image start"])-16*i) > 1e-6 or float(r["Duration s"]) != 16:
        errs.append(f"CSV row {i+1} bad: {r['Image']} {r['Image start']}")
    joined = " ".join(s[3] for s in subs[4*i:4*i+4])
    if " ".join(r["Text EN"].split()) != " ".join(joined.split()): errs.append(f"CSV text != SRT text scene {i+1}")
print(f"SRT cues: {len(subs)}, VO lines: {len(vo)}, CSV rows: {len(rows)}")
print(f"longest subtitle: {max(len(s[3]) for s in subs)} chars")
print("ERRORS:\n" + "\n".join(errs) if errs else "OK - all inputs consistent")
sys.exit(1 if errs else 0)
