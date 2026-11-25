# Would You Rather — Shorts template (v3, cinematic)

One command turns a script into a finished 1080x1920 / 30 fps MP4 (~25 s render on 4 CPUs):

```bash
python3 render.py episodes/ep02.txt                     # -> out/ep02/final.mp4
python3 render.py episodes/ep02.txt --stills 0,8.5,last  # quick PNG checks, no video
```

## Script format (`episodes/<name>.txt`)

```
EPISODE: 2                         # "#2" badge (default: number in the file name)
RESULTS_LINE: 68% of you picked PIZZA. Respect.   # optional: replaces the hook (spoken + header)
HOOK: "You won't survive these 4 choices. The last one is IMPOSSIBLE."

Q1: "Would you rather X... or Y?"
A: Short label A | B: Short label B
Reaction: "Line spoken after the countdown."
Icons: pizza | wifi                # optional, otherwise picked from the label keywords
Mood: laughing                     # optional mascot pose for the reaction (laughing/surprised/scared/wow/excited)

OUTRO: "Follow for a new one every day... because..."   # ends mid-sentence -> loops into the hook
```

- ALL-CAPS words are spoken normally but drawn yellow in the header. Standalone "A"/"B" are spoken as letters; `$10,000` is read as "10000 dollars".
- **Length:** each question costs its voice time + 3 s countdown. With 4 questions, keep the spoken text around 85 words total to stay ≤ 35 s
  (EP01 = 34.97 s). The render prints the duration.

## Structure of every video
- Frame 1 = Q1 with both options + the hook as the header (no intro card). Hook voice plays over it.
- Header (top): hook → `PICK ONE!` during each question and countdown → the reaction line. Word-by-word captions (dark pill)
  sit in the middle just above the VS circle.
- 3-2-1 ring around the VS circle; soft tick each second, ding when the reaction appears, whoosh between questions
  (all synthesized in code; there's no music and no downloaded audio). Mix = exactly -14 LUFS, true peak ≤ -1.4 dBFS.
- Both options pop in together on every new question.
- Mascot (Stickman, bottom-left, clear of the Shorts UI): excited (hook) → happy (question) → thinking (countdown) →
  laughing/surprised/scared (reaction, from `Mood:` or reaction keywords) → thumbs-up (outro).
- Seamless loop: the outro returns to Q1, and on its last word the header + mascot switch back to the frame-0 state.
  Idle motion is periodic over the video length, so the last frame flows into the first.

## v3 look (cinematic)
- Each half is a full-bleed **toon-3D render** of the option, made with the Stickman engine (`pack/Stick3D-Pack/engine`,
  composition `WyrScene`, source `engine/src/videos/WyrScenes.tsx`): toon shading + ink outlines + rim light, the series' 3D style,
  no external/AI images. `scenes3d.py` renders only missing options (cache: `out/_scenes3d/`), 2 layers each (studio bg + hero fg)
  for parallax. 3D heroes so far: phone, food, money_bag, money_month, mind_read, crystal_ball, hourglass, magnifier
  (+ automatic 3D ban sign for "No/Never/Without" labels). **New topic → add a hero component in WyrScenes.tsx** and a keyword in
  `icons.py` ICONS; unknown topics fall back to a big A/B letter on the plinth.
- Slow push-in + parallax on both layers, deep red vs deep blue grade with bloom, glowing light line between the halves,
  drifting particles, vignette. The last question is the "impossible" one: darker, red heartbeat pulse, slight camera shake,
  heartbeat sound (`special_last` in config.json).
- Inter Display (clean bold sans, no outlines; `assets/fonts`, SIL OFL). Captions are full short phrases on a dark pill.
- Countdown 2 s (`countdown_s`): rising tension sound, bass hit + flash when the reaction appears.
- Mascot mid-left at ~53–66 % height (out of the bottom-left Shorts UI zone).
- Engine deps once: `cd pack/Stick3D-Pack/engine && npm install`.

## Files
- `render.py`: pipeline (parse → Kokoro TTS → Whisper word times → timeline → frames + audio → MP4)
- `config.json`: voice (`am_puck`, speed 1.2, pauses capped at 0.12 s), colours, layout, timing, mascot poses
- `icons.py`: flat illustrations drawn in code. Labels starting with "No/Never/Without" get a red ban sign automatically.
  New topic → add `def icon_<name>(ctx)` (600x600 box) + keywords in `ICONS`. Unknown topics fall back to an A/B badge.
- `assets/mascot/*.png`: poses cut from `pack/Stick3D-Pack/assets/reference/STICKMAN_REFERENCE_SHEET_v3.png` by `build_mascot.py`
- `assets/fonts/Fredoka.ttf`: SIL OFL

## Requirements
`bash ../pack/Stick3D-Pack/00-setup/install_v4_tools.sh` (Kokoro + faster-whisper), `pip install pycairo opencv-python-headless`, ffmpeg.
Voice clips and word timings are cached in `out/<name>/cache`.
