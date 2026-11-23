"""Write timeline/VOICE_SLOTS.csv, timeline/SCENES.edl (CMX3600, 30 fps NDF) and timeline/VOICE_MARKERS.edl."""
import csv, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
rows = list(csv.DictReader(open(ROOT / "source_text" / "TIMELINE_30_SCENES.csv", encoding="utf-8-sig")))
FPS = 30
def tc(sec):
    f = int(round(sec * FPS)); return f"{f // (3600*FPS):02d}:{f // (60*FPS) % 60:02d}:{f // FPS % 60:02d}:{f % FPS:02d}"
with open(ROOT / "timeline" / "VOICE_SLOTS.csv", "w", newline="", encoding="utf-8") as fh:
    w = csv.writer(fh)
    w.writerow(["scene", "voice_file", "place_at", "slot_end", "max_length_s", "words", "min_wpm_to_fit_slot", "est_length_at_160wpm_s", "scene_title_cz", "text_en"])
    for i, r in enumerate(rows):
        s = 16 * i; words = len(r["Text EN"].split())
        w.writerow([i + 1, f"VOICE_{i+1:02d}.wav", tc(s), tc(s + 16), "16.0 (15.85 with default 0.15 s offset)", words,
                    f"{words / 15.85 * 60:.0f}", f"{words / 160 * 60:.1f}", r["Scene title CZ"], r["Text EN"]])
ev = ["TITLE: WHAT IF STICKMAN ENTERED THE WRONG ELEVATOR - PICTURE", "FCM: NON-DROP FRAME", ""]
for i in range(30):
    s, e = 16 * i, 16 * (i + 1)
    ev += [f"{i+1:03d}  SCENE{i+1:02d}  V     C        00:00:00:00 00:00:16:00 {tc(s)} {tc(e)}",
           f"* FROM CLIP NAME: SCENE_{i+1:02d}.jpg", ""]
(ROOT / "timeline" / "SCENES.edl").write_text("\n".join(ev), encoding="utf-8")
mk = ["TITLE: WHAT IF STICKMAN ENTERED THE WRONG ELEVATOR - VOICE SLOTS", "FCM: NON-DROP FRAME", ""]
for i in range(30):
    s = 16 * i
    mk += [f"{i+1:03d}  VOICE{i+1:02d}  A     C        00:00:00:00 00:00:16:00 {tc(s)} {tc(s + 16)}",
           f"* FROM CLIP NAME: VOICE_{i+1:02d}.wav", f"* COMMENT: {rows[i]['Scene title CZ']}", ""]
(ROOT / "timeline" / "VOICE_SLOTS.edl").write_text("\n".join(mk), encoding="utf-8")
print("timeline files written")
