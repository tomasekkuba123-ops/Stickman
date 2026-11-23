"""SRT -> styled ASS for burning in (bottom safe area, readable on phones).

  python3 tools/make_subs.py [input.srt] [output.ass]
Defaults: subtitles/SUBTITLES_EN.srt -> out/subs_burn.ass
Long lines are balanced onto two rows (max ~42 chars per row) so nothing runs edge to edge.
"""
import pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
src = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "subtitles" / "SUBTITLES_EN.srt"
dst = pathlib.Path(sys.argv[2]) if len(sys.argv) > 2 else ROOT / "out" / "subs_burn.ass"

HEAD = """[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Main,Inter,58,&H00FFFFFF,&H00FFFFFF,&H00101010,&H96000000,-1,0,0,0,100,100,0.5,0,1,4.2,2,2,160,160,70,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""


def balance(text, limit=42):
    if len(text) <= limit:
        return text
    words = text.split(); best = None
    for i in range(1, len(words)):
        a, b = " ".join(words[:i]), " ".join(words[i:])
        score = max(len(a), len(b))
        if best is None or score < best[0]:
            best = (score, a, b)
    return best[1] + r"\N" + best[2]


def ass_time(s):
    h, m, rest = s.strip().split(":"); sec, ms = rest.split(",")
    cs = round(int(ms) / 10)
    return f"{int(h)}:{m}:{sec}.{cs:02d}"


blocks = src.read_text(encoding="utf-8-sig").replace("\r\n", "\n").strip().split("\n\n")
lines = [HEAD]
for b in blocks:
    l = b.split("\n"); a, z = l[1].split(" --> ")
    text = re.sub(r"\s+", " ", " ".join(l[2:])).strip()
    lines.append(f"Dialogue: 0,{ass_time(a)},{ass_time(z)},Main,,0,0,0,,{balance(text)}\n")
dst.parent.mkdir(parents=True, exist_ok=True)
dst.write_text("".join(lines), encoding="utf-8")
print(f"wrote {dst} ({len(blocks)} events)")
