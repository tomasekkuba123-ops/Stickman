"""40 s narration for "What If Stickman Drew a Tiny Storm?" with Kokoro-82M (Apache-2.0, kokoro-onnx).

  python3 tools/make_voice.py [--voice am_michael] [--speed 1.0]
Each of the 9 segments is generated phrase by phrase (text exactly as supplied, split only at
punctuation), joined with short dramatic pauses and placed at the start of its interval.
Pauses are stretched to use the interval naturally; if speech is too long it is regenerated faster.
Outputs (out/): STICKMAN_TINY_STORM_VOICE_40S.wav (48 kHz 16-bit mono, exactly 40.000 s),
clips/SEG_01..09.wav (each exactly its interval length), STICKMAN_TINY_STORM_VOICE_40S.srt, timing.csv
"""
import argparse, csv, pathlib
import numpy as np, soundfile as sf
from scipy.signal import resample_poly
from kokoro_onnx import Kokoro

ROOT = pathlib.Path(__file__).resolve().parent.parent
SR_OUT = 48000
# (start, end, [phrases]) - phrases joined in order reproduce the supplied text exactly
SEGS = [
    (0, 4,  ["What if Stickman drew the world's tiniest rain cloud?"]),
    (4, 8,  ["One drop landed on his nose.", "He laughed."]),
    (8, 12, ["But then,", "the little cloud began to grow."]),
    (12, 17, ["Rain flooded the workshop.", "Papers flew everywhere.", "Thunder shook the walls!"]),
    (17, 22, ["He drew an umbrella.", "One gust flipped it inside out!"]),
    (22, 27, ["Then he had an idea.", "A giant sponge!"]),
    (27, 32, ["It soaked up the rain...", "and swallowed the cloud!"]),
    (32, 36, ["Finally, peace and quiet.", "Stickman smiled."]),
    (36, 40, ["But then...", "drip.", "Something was hiding in his hood!"]),
]
# pronunciation fixes: same words, explicit phonemes (default G2P flaps "it" to "ɪɾ", which sounds like "her")
PHONEMES = {"One gust flipped it inside out!": "wˈʌn ɡˈʌst flˈɪpt ɪt ɪnsˈaɪd ˈaʊt!"}
LEAD = 0.12      # start of speech after interval start
TAIL = 0.30      # minimum air before the next interval
GAP_MIN, GAP_MAX = 0.28, 0.85


def trim(a, sr, thr=0.006, pad=0.025):
    i = np.where(np.abs(a) > thr)[0]
    return a if len(i) == 0 else a[max(0, i[0] - int(pad * sr)): i[-1] + int(pad * sr)]


def fmt(t):
    ms = int(round(t * 1000)); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--voice", default="am_michael")
    ap.add_argument("--speed", type=float, default=1.0)
    ap.add_argument("--model-dir", default="/root/kokoro")
    a = ap.parse_args()
    k = Kokoro(f"{a.model_dir}/kokoro-v1.0.onnx", f"{a.model_dir}/voices-v1.0.bin")
    out = ROOT / "out"; (out / "clips").mkdir(parents=True, exist_ok=True)
    full = np.zeros(int(40 * SR_OUT), np.float32); rows = []; cues = []
    for n, (s0, s1, phrases) in enumerate(SEGS, 1):
        slot = s1 - s0; speed = a.speed
        while True:
            parts = []
            for p in phrases:
                if p in PHONEMES:
                    au, sr = k.create(PHONEMES[p], voice=a.voice, speed=speed, is_phonemes=True)
                else:
                    au, sr = k.create(p, voice=a.voice, speed=speed, lang="en-us")
                au = resample_poly(np.asarray(au, np.float32), SR_OUT, sr)
                parts.append(trim(au, SR_OUT))
            speech = sum(len(p) for p in parts) / SR_OUT
            ngap = len(parts) - 1
            if speech + ngap * GAP_MIN <= slot - LEAD - TAIL or speed >= 1.25:
                break
            speed = round(min(1.25, speed * (speech + ngap * GAP_MIN) / (slot - LEAD - TAIL) + 0.02), 3)
        spare = slot - LEAD - TAIL - speech
        gap = min(GAP_MAX, max(GAP_MIN, spare / ngap * 0.6)) if ngap else 0
        clip = np.zeros(int(slot * SR_OUT), np.float32); t = LEAD; ph_times = []
        for i, p in enumerate(parts):
            j = int(t * SR_OUT); clip[j:j + len(p)] = p[: len(clip) - j]
            ph_times.append((t, t + len(p) / SR_OUT)); t += len(p) / SR_OUT + (gap if i < ngap else 0)
        end = t
        assert end <= slot - 0.05, f"segment {n} does not fit ({end:.2f}s > {slot}s)"
        pk = np.abs(clip).max(); clip *= 0.79 / pk if pk else 1
        full[int(s0 * SR_OUT): int(s0 * SR_OUT) + len(clip)] = clip
        cues.append((s0 + LEAD - 0.05, min(s0 + end + 0.4, s1 - 0.04), " ".join(phrases)))
        rows.append([n, f"{s0}-{s1}", " ".join(phrases), f"{speed:.2f}", f"{LEAD:.2f}", f"{end:.2f}", f"{slot - end:.2f}", f"{gap:.2f}",
                     " | ".join(f"{s0 + x:.2f}-{s0 + y:.2f}" for x, y in ph_times)])
        print(f"SEG_{n:02d} {s0:>2}-{s1:<2}s speed {speed:.2f} speech ends at {s0 + end:5.2f}s (free {slot - end:.2f}s) gap {gap:.2f}s")
    # loudness: -16 LUFS integrated, true peak <= -1.5 dBTP (ffmpeg loudnorm, 2-pass, linear), then slice clips
    import json, subprocess, tempfile
    raw = out / "_raw.wav"; sf.write(raw, full, SR_OUT, subtype="FLOAT")
    err = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(raw), "-af", "loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    st = json.loads(err[err.rindex("{"):err.rindex("}") + 1])
    af = (f"loudnorm=I=-16:TP=-1.5:LRA=11:measured_I={st['input_i']}:measured_TP={st['input_tp']}:measured_LRA={st['input_lra']}"
          f":measured_thresh={st['input_thresh']}:offset={st['target_offset']}:linear=true,aresample=48000")
    final = out / "STICKMAN_TINY_STORM_VOICE_40S.wav"
    subprocess.run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(raw), "-af", af, "-ar", "48000",
                    "-c:a", "pcm_s16le", "-t", "40", str(final)], check=True)
    raw.unlink()
    y, _ = sf.read(final, dtype="float32")
    if len(y) < 40 * SR_OUT: y = np.pad(y, (0, 40 * SR_OUT - len(y)))
    y = y[: 40 * SR_OUT]; sf.write(final, y, SR_OUT, subtype="PCM_16")
    for n, (s0, s1, _) in enumerate(SEGS, 1):
        sf.write(out / "clips" / f"SEG_{n:02d}.wav", y[int(s0 * SR_OUT): int(s1 * SR_OUT)], SR_OUT, subtype="PCM_16")
    (out / "STICKMAN_TINY_STORM_VOICE_40S.srt").write_text(
        "".join(f"{i}\n{fmt(x)} --> {fmt(y)}\n{t}\n\n" for i, (x, y, t) in enumerate(cues, 1)), encoding="utf-8")
    with open(out / "timing.csv", "w", newline="") as f:
        w = csv.writer(f); w.writerow(["segment", "interval_s", "text", "speed", "speech_start_in_clip_s", "speech_end_in_clip_s", "free_s", "pause_s", "phrase_times_abs_s"]); w.writerows(rows)
    print(f"voice={a.voice} -> out/STICKMAN_TINY_STORM_VOICE_40S.wav ({len(full) / SR_OUT:.3f}s)")


if __name__ == "__main__":
    main()
