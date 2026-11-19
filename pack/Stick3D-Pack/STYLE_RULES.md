# STYLE_RULES.md — series quality rules (MANDATORY for every episode)

Every episode must be better than the last. No external / ChatGPT images: every location is built as a real 3D scene
(`engine/src/style/set3d.tsx`, `sky.tsx`, `extra.tsx`, `toon.tsx`, `props.tsx`). Reference build: `engine/src/videos/Ep03R.tsx` (+ `ep03r/scenes.tsx`).

1. **Hook** – frame 1 is the most exciting image of the episode (action + a big readable word).
2. **Stickman on screen ≥ 95 % of the time**, fully inside the frame, 40–60 % of frame height in most shots.
   Off screen max 2 s in a row, and only when the story needs it (he chases something, gets swallowed or lifted, etc.).
3. **New camera angle or action every 2–3 s**; the camera always moves a little (drift, push-in, orbit). No static shot longer than 3 s.
4. **Real 3D sets** with depth, soft shadows, rim light, ink outlines and saturated colours. No empty backgrounds, no flat placeholder shapes,
   no 2D backdrops cropped by the camera.
5. **Animation principles** – anticipation before actions, squash & stretch on impacts and jumps, overlapping motion (hood strings, backpack),
   a clear expression on every beat.
6. **Effects** – real-looking smoke (soft shaded puffs, varied sizes, dissipating, lit by flames), sparks, dust, glow.
   Camera shake only on big impacts.
7. **Captions** never cover faces or the key action (switch high/low per shot); key words in yellow.
8. **Audio** – about −14 LUFS integrated, true peak ≤ −1 dBTP, voice on top, an SFX on every real action, music that changes with the mood.
9. **Ending** – a big question + SUBSCRIBE card; the last shot visually connects to the first shot so the video loops well.
10. **Before delivering** – render a 1-fps contact sheet, check rules 1–9 yourself and fix every failure before sending.

## How to check (rule 10) — automatic
`tools/qc_check.py` (run by `engine/pipeline/deliver.sh`) checks rules 2, 3, 7, 8 and the exact length, and saves the 1-fps contact sheet.
It measures Stickman exactly from a QC MASK render (`pipeline/qcmask.sh`: body painted magenta, face green), so visibility, height and
caption-over-face are measured, not guessed. It must print PASS before delivery. Rules 1, 4, 5, 6, 9 are checked by eye on the contact sheet
(write the result in the episode `_ledger.md`).
