"""Drop in the narrator later: VOICE_01..VOICE_30 -> mixed audio, re-timed subtitles, final MP4.

  python3 tools/add_voice.py --voices path/to/voice_folder [--offset 0.15] [--no-burn]

Expects one file per scene named VOICE_01.* .. VOICE_30.* (wav/mp3/m4a/aac/flac/ogg).
Each clip is placed at its scene start (00:00, 00:16, ... 07:44) + --offset seconds.

What it does
 1. Measures every clip; FAILS loudly if a clip is longer than its 16 s slot (minus offset)
    so nothing silently overlaps the next scene.
 2. Re-times the 4 subtitle lines of each scene to the REAL speech: it looks for the pauses
    between sentences with ffmpeg silencedetect; if 3 usable pauses are not found it falls back
    to splitting the clip proportionally to sentence length. Result: out/SUBTITLES_EN_SYNCED.srt
    (please still spot-check it - this is automatic, not hand-synced).
 3. Mixes voice (normalised to -16 LUFS) over the SFX stem, which is ducked under the voice.
 4. Writes out/FINAL_with_voice.mp4 (subtitles burned in) and out/FINAL_with_voice_nosubs.mp4.
"""
import argparse, json, pathlib, re, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SCENE = 16.0
EXTS = (".wav", ".mp3", ".m4a", ".aac", ".flac", ".ogg")


def run(cmd, **kw):
    return subprocess.run(cmd, check=True, text=True, capture_output=True, **kw)


def duration(p):
    out = run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "json", str(p)]).stdout
    return float(json.loads(out)["format"]["duration"])


def silences(p, noise_db=-35, min_d=0.22):
    err = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(p), "-af", f"silencedetect=noise={noise_db}dB:d={min_d}",
                          "-f", "null", "-"], text=True, capture_output=True).stderr
    st = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", err)]
    en = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", err)]
    return list(zip(st, en))


def speech_bounds(p, dur):
    sil = silences(p); start, end = 0.0, dur
    if sil and sil[0][0] <= 0.05: start = sil[0][1]
    if sil and sil[-1][1] >= dur - 0.05: end = sil[-1][0]
    inner = [(a, b) for a, b in sil if a > start + 0.05 and b < end - 0.05]
    return start, end, inner


def split_scene(texts, p, dur):
    """Return 4 (start,end) pairs relative to clip start."""
    s0, s1, inner = speech_bounds(p, dur)
    weights = [max(len(t), 1) for t in texts]; tot = sum(weights)
    # proportional guesses for the 3 boundaries
    acc, guess = 0, []
    for w in weights[:-1]:
        acc += w; guess.append(s0 + (s1 - s0) * acc / tot)
    bounds, used = [], set()
    for g in guess:  # pick nearest unused pause midpoint (must be in order)
        cands = [(abs((a + b) / 2 - g), i, a, b) for i, (a, b) in enumerate(inner)
                 if i not in used and (not bounds or (a + b) / 2 > bounds[-1][1])]
        if cands and min(cands)[0] < 0.25 * (s1 - s0):
            _, i, a, b = min(cands); used.add(i); bounds.append((a, b))
        else:
            bounds.append((g, g))
    method = "pauses" if len(used) == 3 else ("mixed" if used else "proportional")
    edges = [s0] + [x for ab in bounds for x in ab] + [s1]
    segs = [(edges[2 * k], edges[2 * k + 1]) for k in range(4)]
    # subtitles: appear slightly before speech, linger into the pause
    out = []
    for k, (a, b) in enumerate(segs):
        nxt = segs[k + 1][0] if k < 3 else dur + 0.6
        out.append((max(0.0, a - 0.10), min(b + 0.35, nxt - 0.05)))
    return out, method


def fmt(t):
    ms = int(round(t * 1000)); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--voices", required=True)
    ap.add_argument("--offset", type=float, default=0.15, help="seconds after each scene start (default 0.15)")
    ap.add_argument("--no-burn", action="store_true")
    a = ap.parse_args()
    vdir = pathlib.Path(a.voices)
    master = ROOT / "out" / "master_clean.mp4"; sfx = ROOT / "out" / "SFX_STEM.wav"
    for f in (master, sfx):
        if not f.exists(): sys.exit(f"missing {f} - run tools/build_all.sh first")
    srt = (ROOT / "subtitles" / "SUBTITLES_EN.srt").read_text(encoding="utf-8-sig").replace("\r\n", "\n").strip().split("\n\n")
    lines = [" ".join(b.split("\n")[2:]) for b in srt]

    clips, problems = [], []
    for i in range(1, 31):
        c = [p for p in vdir.glob(f"VOICE_{i:02d}.*") if p.suffix.lower() in EXTS]
        if not c: problems.append(f"VOICE_{i:02d}: file missing"); continue
        d = duration(c[0])
        if d > SCENE - a.offset: problems.append(f"VOICE_{i:02d}: {d:.2f} s is longer than the {SCENE - a.offset:.2f} s slot")
        clips.append((i, c[0], d))
    if problems: sys.exit("Cannot continue:\n  " + "\n  ".join(problems))

    cues, report = [], []
    for i, p, d in clips:
        texts = lines[4 * (i - 1): 4 * i]
        segs, method = split_scene(texts, p, d)
        base = (i - 1) * SCENE + a.offset
        for t, (s, e) in zip(texts, segs):
            cues.append((base + s, min(base + e, i * SCENE + 0.5), t))
        report.append(f"VOICE_{i:02d}  {d:5.2f} s  free {SCENE - a.offset - d:5.2f} s  sync={method}")
    synced = ROOT / "out" / "SUBTITLES_EN_SYNCED.srt"
    synced.write_text("".join(f"{k}\n{fmt(s)} --> {fmt(e)}\n{t}\n\n" for k, (s, e, t) in enumerate(cues, 1)), encoding="utf-8")
    print("\n".join(report)); print(f"wrote {synced}")

    # audio mix
    inputs, chains = ["-i", str(sfx)], []
    for n, (i, p, d) in enumerate(clips, start=1):
        inputs += ["-i", str(p)]
        ms = int(round(((i - 1) * SCENE + a.offset) * 1000))
        chains.append(f"[{n}:a]aresample=48000,aformat=channel_layouts=stereo,adelay={ms}|{ms}[v{n}]")
    vlabels = "".join(f"[v{n}]" for n in range(1, len(clips) + 1))
    fc = ";".join(chains) + (
        f";{vlabels}amix=inputs={len(clips)}:normalize=0,apad=whole_dur=480,atrim=0:480,"
        "loudnorm=I=-16:TP=-1.5:LRA=11,asplit=2[vo][sc];"
        "[0:a][sc]sidechaincompress=threshold=0.03:ratio=5:attack=25:release=350[duck];"
        "[vo][duck]amix=inputs=2:normalize=0,alimiter=limit=0.89,atrim=0:480[mix]")
    mix = ROOT / "out" / "MIX_voice_sfx.wav"
    run(["ffmpeg", "-y", "-hide_banner", *inputs, "-filter_complex", fc, "-map", "[mix]", "-ar", "48000", str(mix)])
    print(f"wrote {mix}")

    nosubs = ROOT / "out" / "FINAL_with_voice_nosubs.mp4"
    run(["ffmpeg", "-y", "-hide_banner", "-i", str(master), "-i", str(mix), "-map", "0:v", "-map", "1:a",
         "-c:v", "copy", "-c:a", "aac", "-b:a", "256k", "-t", "480", "-movflags", "+faststart", str(nosubs)])
    print(f"wrote {nosubs}")
    if not a.no_burn:
        ass = ROOT / "out" / "subs_synced.ass"
        run([sys.executable, str(ROOT / "tools" / "make_subs.py"), str(synced), str(ass)])
        final = ROOT / "out" / "FINAL_with_voice.mp4"
        run(["ffmpeg", "-y", "-hide_banner", "-i", str(nosubs), "-vf", f"ass={ass}:fontsdir=/usr/share/fonts/opentype/inter",
             "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-c:a", "copy",
             "-movflags", "+faststart", str(final)])
        print(f"wrote {final}")


if __name__ == "__main__":
    main()
