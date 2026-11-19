#!/usr/bin/env python3
"""Voice tool: take a HeyGen (or any) voice WAV + script, find every line, insert pauses so the voice lands on an EXACT target length
(60 s or 100 s), keep the end-card tail, normalise, and write word timings for captions.
usage: voice_fit.py voice.wav script.txt target_seconds out_dir [--tail 2.6] [--max-pause 1.4]
  - lines = sentences of script.txt (split after . ! ? …); pauses are inserted at the QUIETEST 10 ms point between the last word of a
    line and the first word of the next, weighted (paragraph breaks get more), never more than --max-pause per gap
  - if the voice is too long it is sped up with atempo (max 8 %), otherwise the remaining time goes to the tail
  - writes out_dir/VOICE_<N>S.wav (-16 LUFS, peaks -2 dBFS; the final mix brings it to -14), words.json, script.json
Needs pocketsphinx (tools/voice/align.py). Spoken overrides (numbers, names) go in spoken.json next to script.txt."""
import sys, os, re, json, wave, subprocess, argparse
import numpy as np

ROOT = os.path.dirname(os.path.abspath(__file__))
SR = 48000


def run(*a):
    subprocess.run(a, check=True)


def load(p):
    tmp = p + ".48k.wav"; run("ffmpeg", "-v", "error", "-y", "-i", p, "-ac", "1", "-ar", str(SR), "-sample_fmt", "s16", tmp)
    w = wave.open(tmp); x = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768; os.remove(tmp); return x


def save(p, x):
    w = wave.open(p, "wb"); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes()); w.close()


def align(wav, script, out):
    r = subprocess.run([sys.executable, "-I", os.path.join(ROOT, "voice", "align.py"), wav, script, out])
    if r.returncode: sys.exit("ALIGN FAILED: add spoken overrides to spoken.json next to script.txt")
    return json.load(open(out))


def main():
    ap = argparse.ArgumentParser(); ap.add_argument("voice"); ap.add_argument("script"); ap.add_argument("target", type=float); ap.add_argument("out"); ap.add_argument("--tail", type=float, default=2.6); ap.add_argument("--max-pause", type=float, default=1.4)
    a = ap.parse_args(); os.makedirs(a.out, exist_ok=True)
    x = load(a.voice)
    # trim leading/trailing silence
    env = np.sqrt(np.convolve(x * x, np.ones(480) / 480, "same")); idx = np.nonzero(env > 0.01)[0]
    x = x[max(0, idx[0] - int(0.15 * SR)): idx[-1] + int(0.25 * SR)]
    tmp = os.path.join(a.out, "_trim.wav"); save(tmp, x)
    words = align(tmp, a.script, os.path.join(a.out, "_words.json"))
    text = open(a.script).read(); toks = text.split()
    ends = [i for i, t in enumerate(toks) if re.search(r"[.!?…]$", t)][:-1]  # line ends (not the last)
    paras = set(); acc = 0
    for para in re.split(r"\n\s*\n", text.strip()):
        acc += len(para.split()); paras.add(acc - 1)
    dur = len(x) / SR; budget = a.target - a.tail - dur
    if budget < 0:
        tempo = min(1.08, dur / (a.target - a.tail)); print(f"voice too long ({dur:.2f}s): atempo {tempo:.3f}")
        run("ffmpeg", "-v", "error", "-y", "-i", tmp, "-af", f"atempo={tempo}", tmp + ".t.wav"); os.replace(tmp + ".t.wav", tmp); x = load(tmp)
        words = align(tmp, a.script, os.path.join(a.out, "_words.json")); dur = len(x) / SR; budget = max(0, a.target - a.tail - dur)
    wts = [2.0 if i in paras else 1.0 for i in ends]; tot = sum(wts) or 1
    adds = [min(a.max_pause, budget * w / tot) for w in wts]
    # insertion points = quietest 10 ms between word i end and word i+1 start
    cuts = []
    for i, add in zip(ends, adds):
        s0, s1 = int(words[i]["end"] * SR), int(words[i + 1]["start"] * SR)
        if s1 - s0 < 480: s = (s0 + s1) // 2
        else:
            e = np.array([np.abs(x[k:k + 480]).mean() for k in range(s0, s1 - 480, 240)]); s = s0 + int(np.argmin(e)) * 240 + 240
        cuts.append((s, add))
    parts, last, shift = [], 0, []
    for s, add in cuts:
        parts += [x[last:s], np.zeros(int(add * SR), np.float32)]; shift.append((s / SR, add)); last = s
    parts.append(x[last:]); y = np.concatenate(parts)
    y = np.concatenate([y, np.zeros(max(0, int(a.target * SR) - len(y)), np.float32)])[: int(a.target * SR)]
    # shift word timings instead of re-aligning (exact, no drift)
    for w in words:
        off = sum(add for s, add in shift if w["start"] >= s); w["start"] = round(w["start"] + off, 3); w["end"] = round(w["end"] + off, 3)
    raw = os.path.join(a.out, "_raw.wav"); save(raw, y)
    N = int(round(a.target)); outp = os.path.join(a.out, f"VOICE_{N}S.wav")
    run("ffmpeg", "-v", "error", "-y", "-i", raw, "-af", "loudnorm=I=-16:TP=-2:LRA=11,aresample=48000", "-ar", "48000", "-t", str(a.target), outp)
    json.dump(words, open(os.path.join(a.out, "words.json"), "w")); json.dump(toks, open(os.path.join(a.out, "script.json"), "w"))
    for f in ("_trim.wav", "_raw.wav", "_words.json"): os.remove(os.path.join(a.out, f))
    print(f"VOICE {outp}: {a.target:.2f}s, {len(ends) + 1} lines, pauses {', '.join(f'{p:.2f}' for p in adds)} s, last word ends {words[-1]['end']:.2f}s")


if __name__ == "__main__":
    main()
