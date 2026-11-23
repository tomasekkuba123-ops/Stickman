"""English narration with Kokoro-82M (Apache-2.0) via kokoro-onnx, sentence by sentence.

  python3 tools/make_voice_kokoro.py [--voice af_heart] [--speed 1.0] [--offset 0.15]

Model files expected in /root/kokoro (or --model-dir):
  kokoro-v1.0.onnx, voices-v1.0.bin  from github.com/thewh1teagle/kokoro-onnx/releases (model-files-v1.0)

Outputs
  out/voice_kokoro/VOICE_01.wav .. VOICE_30.wav  (24 kHz mono, one per scene, each fits its 16 s slot)
  out/SUBTITLES_EN_SYNCED.srt   subtitle cues timed to the actual generated sentences
  out/voice_kokoro/report.csv   per scene: speed used, clip length, spare time
If the 4 sentences do not fit into 16 s - offset at --speed, the scene is re-generated slightly faster
(max 1.20x) and that is reported.
"""
import argparse, csv, pathlib
import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

ROOT = pathlib.Path(__file__).resolve().parent.parent
SLOT = 16.0
GAP = 0.32          # pause between sentences inside a scene
TAIL_SAFETY = 0.30  # keep this much air before the next scene starts


def trim(a, sr, thr=0.008, pad=0.03):
    idx = np.where(np.abs(a) > thr)[0]
    if len(idx) == 0: return a
    s = max(0, idx[0] - int(pad * sr)); e = min(len(a), idx[-1] + int(pad * sr)); return a[s:e]


def fmt(t):
    ms = int(round(t * 1000)); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--voice", default="af_heart")
    ap.add_argument("--speed", type=float, default=1.0)
    ap.add_argument("--offset", type=float, default=0.15)
    ap.add_argument("--model-dir", default="/root/kokoro")
    ap.add_argument("--scenes", help="comma list, e.g. 10 - regenerate only these scenes and patch their cues into the existing out/SUBTITLES_EN_SYNCED.srt")
    a = ap.parse_args()
    md = pathlib.Path(a.model_dir)
    k = Kokoro(str(md / "kokoro-v1.0.onnx"), str(md / "voices-v1.0.bin"))
    lang = "en-us" if a.voice[0] == "a" else "en-gb"
    blocks = (ROOT / "subtitles" / "SUBTITLES_EN.srt").read_text(encoding="utf-8-sig").replace("\r\n", "\n").strip().split("\n\n")
    lines = [" ".join(b.split("\n")[2:]).strip() for b in blocks]
    out = ROOT / "out" / "voice_kokoro"; out.mkdir(parents=True, exist_ok=True)
    cues, rep = [], []
    budget = SLOT - a.offset - TAIL_SAFETY
    only = sorted(int(x) for x in a.scenes.split(',')) if a.scenes else None
    for sc in ([x - 1 for x in only] if only else range(30)):
        sents = lines[4 * sc: 4 * sc + 4]
        speed = a.speed
        while True:
            parts, sr = [], 24000
            for s in sents:
                au, sr = k.create(s, voice=a.voice, speed=speed, lang=lang)
                parts.append(trim(np.asarray(au, np.float32), sr))
            total = sum(len(p) for p in parts) / sr + GAP * 3
            if total <= budget or speed >= 1.20: break
            speed = round(min(1.20, speed * total / budget + 0.01), 3)
        clip, t, times = [], 0.0, []
        for i, p in enumerate(parts):
            d = len(p) / sr; times.append((t, t + d)); clip.append(p); t += d
            if i < 3: clip.append(np.zeros(int(GAP * sr), np.float32)); t += GAP
        y = np.concatenate(clip)
        pk = np.abs(y).max();  y = y / pk * 0.89 if pk > 0 else y
        sf.write(out / f"VOICE_{sc+1:02d}.wav", y, sr, subtype="PCM_16")
        base = sc * SLOT + a.offset; dur = len(y) / sr
        for i, (s0, s1) in enumerate(times):
            nxt = times[i + 1][0] if i < 3 else SLOT - a.offset - 0.05
            cues.append((base + max(0, s0 - 0.08), base + min(s1 + 0.30, nxt - 0.08 - 0.04), sents[i]))
        rep.append((sc + 1, speed, round(dur, 2), round(SLOT - a.offset - dur, 2)))
        print(f"VOICE_{sc+1:02d}  speed {speed:.3f}  {dur:5.2f} s  spare {SLOT - a.offset - dur:5.2f} s", flush=True)
    synced = ROOT / "out" / "SUBTITLES_EN_SYNCED.srt"
    if only:
        def ts(x): h, m, r = x.replace(",", ".").split(":"); return int(h) * 3600 + int(m) * 60 + float(r)
        old = []
        for blk in synced.read_text(encoding="utf-8-sig").strip().split("\n\n"):
            l = blk.split("\n"); x, y = l[1].split(" --> "); old.append((ts(x), ts(y), " ".join(l[2:])))
        it = iter(cues)
        for sc in only:
            for k in range(4 * (sc - 1), 4 * sc): old[k] = next(it)
        cues = old
        rp = out / "report.csv"; prev = list(csv.reader(open(rp)))[1:] if rp.exists() else []
        d = {int(r[0]): r for r in prev}
        for r in rep: d[r[0]] = list(r)
        rep = [d[k] for k in sorted(d)]
    synced.write_text(
        "".join(f"{n}\n{fmt(s)} --> {fmt(e)}\n{t}\n\n" for n, (s, e, t) in enumerate(cues, 1)), encoding="utf-8")
    with open(out / "report.csv", "w", newline="") as f:
        w = csv.writer(f); w.writerow(["scene", "speed", "clip_s", "spare_s"]); w.writerows(rep)
    print(f"voice={a.voice}  clips in {out}  synced SRT in out/SUBTITLES_EN_SYNCED.srt")


if __name__ == "__main__":
    main()
