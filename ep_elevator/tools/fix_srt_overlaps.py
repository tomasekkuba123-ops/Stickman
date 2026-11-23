"""Ensure no two subtitle cues overlap: end_i <= start_{i+1} - 0.04 s.  python3 tools/fix_srt_overlaps.py file.srt"""
import sys, re, pathlib
p = pathlib.Path(sys.argv[1]); blocks = p.read_text(encoding="utf-8-sig").strip().split("\n\n")
def ts(s): h, m, r = s.replace(",", ".").split(":"); return int(h)*3600 + int(m)*60 + float(r)
def fmt(t):
    ms = int(round(t*1000)); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"
cues = []
for b in blocks:
    l = b.split("\n"); a, z = l[1].split(" --> "); cues.append([ts(a), ts(z), "\n".join(l[2:])])
n = 0
for i in range(len(cues) - 1):
    lim = cues[i+1][0] - 0.04
    if cues[i][1] > lim: cues[i][1] = lim; n += 1
p.write_text("".join(f"{k}\n{fmt(s)} --> {fmt(e)}\n{t}\n\n" for k, (s, e, t) in enumerate(cues, 1)), encoding="utf-8")
print(f"fixed {n} overlaps in {p}")
