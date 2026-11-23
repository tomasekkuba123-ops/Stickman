"""Create 30 fake VOICE_xx.wav clips (tone bursts = 'sentences', separated by pauses) to test add_voice.py.
NOT a voiceover - only for checking the pipeline.  python3 tools/make_test_voices.py out/test_voices"""
import sys, pathlib, wave, numpy as np
out = pathlib.Path(sys.argv[1]); out.mkdir(parents=True, exist_ok=True)
SR = 48000; rng = np.random.default_rng(3)
for i in range(1, 31):
    parts = []
    for k in range(4):
        d = rng.uniform(2.6, 3.4); t = np.arange(int(SR * d)) / SR
        x = 0.25 * np.sin(2 * np.pi * (180 + 40 * k) * t) * (0.6 + 0.4 * np.sin(2 * np.pi * 4 * t))
        parts += [x, np.zeros(int(SR * rng.uniform(0.35, 0.55)))]
    x = np.concatenate(parts[:-1])
    with wave.open(str(out / f"VOICE_{i:02d}.wav"), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x * 32767).astype("<i2").tobytes())
print("30 test clips in", out)
