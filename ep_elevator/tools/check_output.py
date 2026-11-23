"""Automatic QA of a rendered cut.

  python3 tools/check_output.py out/VIDEO.mp4
Checks: duration 480 s, 1920x1080, 16:9, fps, frame count, audio length, no black frames,
and that the frame in the middle of every 16 s slot really is SCENE_NN (best match against all 30 stills,
compared on a lower strip-free crop so burned subtitles do not disturb the match). Writes out/qa_contact_sheet.jpg.
"""
import json, pathlib, subprocess, sys
import cv2
import numpy as np

ROOT = pathlib.Path(__file__).resolve().parent.parent
vid = pathlib.Path(sys.argv[1])
ok = True


def say(cond, msg):
    global ok
    ok &= bool(cond); print(("PASS " if cond else "FAIL ") + msg)


pr = json.loads(subprocess.run(["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", str(vid)],
                               capture_output=True, text=True, check=True).stdout)
v = next(s for s in pr["streams"] if s["codec_type"] == "video")
a = [s for s in pr["streams"] if s["codec_type"] == "audio"]
dur = float(pr["format"]["duration"])
fps = eval(v["r_frame_rate"])
nb = int(v.get("nb_frames", 0))
say(abs(dur - 480) < 0.05, f"duration {dur:.3f} s (target 480.000)")
say((v["width"], v["height"]) == (1920, 1080), f"resolution {v['width']}x{v['height']} (16:9)")
say(v["codec_name"] == "h264" and v["pix_fmt"] == "yuv420p", f"codec {v['codec_name']} {v['pix_fmt']} {v.get('profile')}")
say(abs(fps - 30) < 1e-6, f"frame rate {fps}")
say(nb == 14400, f"video frames {nb} (expected 14400 = 30 x 16 s x 30 fps)")
if a:
    ad = float(a[0].get("duration", dur)); say(abs(ad - 480) < 0.1, f"audio {a[0]['codec_name']} {a[0].get('sample_rate')} Hz, {ad:.3f} s")
else:
    print("INFO no audio stream")
print(f"INFO size {int(pr['format']['size']) / 1e6:.1f} MB, bitrate {int(pr['format']['bit_rate']) / 1e6:.1f} Mb/s")

bd = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(vid), "-vf", "blackdetect=d=0.04:pix_th=0.08", "-an", "-f", "null", "-"],
                    capture_output=True, text=True).stderr
say("black_start" not in bd, "no black segments (blackdetect)")

# scene order check
refs = []
for i in range(1, 31):
    im = cv2.imread(str(ROOT / "images" / f"SCENE_{i:02d}.jpg"))
    refs.append(cv2.resize(im[100:760, 200:1720], (304, 132), interpolation=cv2.INTER_AREA).astype(np.float32))


def feat(x):
    x = x - x.mean(); return x / (np.linalg.norm(x) + 1e-6)


R = np.stack([feat(r).ravel() for r in refs])
thumbs, wrong = [], []
cap = cv2.VideoCapture(str(vid))
for i in range(30):
    t = 16 * i + 8
    cap.set(cv2.CAP_PROP_POS_MSEC, t * 1000); okf, fr = cap.read()
    if not okf: wrong.append((i + 1, "unreadable")); continue
    f = feat(cv2.resize(fr[100:760, 200:1720], (304, 132), interpolation=cv2.INTER_AREA).astype(np.float32)).ravel()
    sc = R @ f; best = int(sc.argmax()) + 1
    if best != i + 1: wrong.append((i + 1, best))
    th = cv2.resize(fr, (384, 216)); cv2.putText(th, f"{i+1:02d} @{t//60}:{t%60:02d}", (8, 24), cv2.FONT_HERSHEY_SIMPLEX, .7, (0, 255, 255), 2)
    thumbs.append(th)
say(not wrong, "every 16 s slot shows the right picture, in order 01..30" + (f"  mismatches: {wrong}" if wrong else ""))
rows = [np.hstack(thumbs[r * 6:(r + 1) * 6]) for r in range(5)]
cv2.imwrite(str(ROOT / "out" / "qa_contact_sheet.jpg"), np.vstack(rows), [cv2.IMWRITE_JPEG_QUALITY, 85])
print("INFO contact sheet: out/qa_contact_sheet.jpg")
print("ALL CHECKS PASSED" if ok else "SOME CHECKS FAILED"); sys.exit(0 if ok else 1)
