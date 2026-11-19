#!/usr/bin/env python3
"""Final episode mix: voice (on top) + SFX events + mood music (ducked) -> -14 LUFS integrated, true peak <= -1 dBTP (measured, iterated).
usage: mix_episode.py voice.wav sfx-events.json music.json out.wav [--music-db -19]
  sfx-events.json: [{"t":1.2,"sfx":"whoosh","db":-4}, ...]  (tools/auto_sfx.py makes it from actions.json)
  music.json: [{"t":0,"mood":"playful"},{"t":23.4,"mood":"soar","gain":1.0}, ...]  (tools/music_bed.py)
The SIGNATURE sound sfx/magic_pencil.wav is always present: if no event uses it, it is added at the first "draw" event (or 0.6 s)."""
import sys, os, json, subprocess, re, argparse, tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def run(*a): subprocess.run(a, check=True)


def meas(p):
    e = subprocess.run(["ffmpeg", "-nostats", "-i", p, "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
    return float(re.findall(r"I:\s+(-?[\d.]+) LUFS", e)[-1]), float(re.findall(r"Peak:\s+(-?[\d.]+) dBFS", e)[-1])


def main():
    ap = argparse.ArgumentParser(); ap.add_argument("voice"); ap.add_argument("events"); ap.add_argument("music"); ap.add_argument("out"); ap.add_argument("--music-db", type=float, default=-19)
    a = ap.parse_args(); tmp = tempfile.mkdtemp()
    ev = json.load(open(a.events))
    if not any(e["sfx"] == "magic_pencil" for e in ev):
        d = [e for e in ev if e["sfx"] == "draw"]; t0 = d[0]["t"] if d else 0.6; ev.append({"t": t0, "sfx": "magic_pencil", "db": -2}); print(f"signature magic_pencil added at {t0}s")
    evp = os.path.join(tmp, "ev.json"); json.dump(ev, open(evp, "w"))
    dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", a.voice]))
    vs = os.path.join(tmp, "vs.wav"); run(sys.executable, os.path.join(ROOT, "tools", "mix_sfx.py"), a.voice, evp, vs, os.path.join(ROOT, "sfx"))
    mu = os.path.join(tmp, "music.wav"); run(sys.executable, os.path.join(ROOT, "tools", "music_bed.py"), a.music, mu, str(dur))
    pre = os.path.join(tmp, "pre.wav")
    run("ffmpeg", "-v", "error", "-y", "-i", vs, "-i", mu, "-filter_complex", f"[0:a]asplit=2[v][k];[1:a]volume={a.music_db}dB[m];[m][k]sidechaincompress=threshold=0.03:ratio=6:attack=10:release=400[md];[v][md]amix=inputs=2:normalize=0[o]", "-map", "[o]", "-ar", "48000", pre)
    comp = os.path.join(tmp, "comp.wav")
    run("ffmpeg", "-v", "error", "-y", "-i", pre, "-af", "acompressor=threshold=-18dB:ratio=3:attack=5:release=120:makeup=2,loudnorm=I=-14:TP=-1.5:LRA=9,aresample=48000", "-ar", "48000", comp)
    g = 0.0
    for it in range(6):  # iterate: gain + oversampled true-peak limiter until -14 +-0.3 and TP <= -1.0
        run("ffmpeg", "-v", "error", "-y", "-i", comp, "-af", f"volume={g:.2f}dB,aresample=192000,alimiter=limit=0.86:level=false:attack=1:release=30,aresample=48000", "-ar", "48000", "-t", str(dur), a.out)
        I, TP = meas(a.out); print(f"  pass {it}: {I:.1f} LUFS, TP {TP:.1f} dBTP")
        if abs(I + 14) <= 0.3 and TP <= -1.0: break
        g += (-14 - I) * 0.9
    print(f"MIX {a.out}: {I:.1f} LUFS, true peak {TP:.1f} dBTP, {len(ev)} sfx")


if __name__ == "__main__":
    main()
