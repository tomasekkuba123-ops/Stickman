# Would You Rather — Shorts template (v4, "PICK ONE DAILY" channel style)

One command turns a script into a finished 1080x1920 / 30 fps MP4 (~1 min on 4 CPUs, + ~1.5 min the first time new 3D options are rendered):

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

OUTRO: "That's all for today."   # keep it short: the 1.5 s end card follows
```

- ALL-CAPS words are spoken normally but drawn yellow in the header. Standalone "A"/"B" are spoken as letters; `$10,000` is read as "10000 dollars".
- **Length:** each question costs its voice time + 3 s countdown. With 4 questions, keep the spoken text around 85 words total to stay ≤ 35 s
  (EP01 = 34.97 s). The render prints the duration.

## Structure of every video
- Frame 1 = Q1 with both options + the hook as the header (no intro card). Hook voice plays over it.
- Header (top): hook → `PICK ONE!` during each question and countdown → the reaction line. Word-by-word captions (dark pill)
  sit in the middle just above the VS circle.
- 2-1 ring around the VS badge with ticks, pop + ding on the reveal, whoosh between questions
  (all synthesized in code; there's no music and no downloaded audio). Mix = exactly -14 LUFS.
- Both options pop in together on every new question.
- Outro: one short line over the last question's images, then the fixed **SUBSCRIBE end card** (1.5 s, `assets/endcard/`,
  built once by `build_endcard.py`: channel logo full width, tagline, the hand taps SUBSCRIBE -> SUBSCRIBED, bell rings,
  voice "Subscribe for tomorrow's choice!"). It is appended unchanged to every episode; never rebuild it.
  No seamless loop any more.

## Look: see "CHANNEL STYLE" in CLAUDE.md (channel logo style, no mascot)
- Bright cartoon style matching the channel logo (`assets/brand/`): yellow/orange sunburst (A) and blue sunburst (B) with a white
  wave between them, purple swoosh at the bottom, yellow VS badge (becomes the 2-1 countdown ring).
- Each option = a big rounded tile (red for A, blue for B; white border, dark outline, gloss) holding a **toon-3D hero render**
  from the Stickman engine (composition `WyrTile`, source `engine/src/videos/WyrScenes.tsx`; cached in `out/_scenes3d/`).
  Labels sit on yellow banners with an A/B chip. Heroes so far: phone, food, money_bag, money_month, mind_read, crystal_ball,
  hourglass, magnifier (+ 3D ban sign for "No/Never/Without"). New topic -> add a hero in WyrScenes.tsx + a keyword in icons.py.
- Fredoka with dark outlines for all text; captions are full short phrases. The last question is darker/redder with a pulse + shake.
- Countdown 2 s with ticks; the pointing hand taps a tile (alternating A/B) + green check, pop + ding. Engine deps once: `cd pack/Stick3D-Pack/engine && npm install`.
- No mascot on this channel.

## Files
- `render.py`: pipeline (parse → Kokoro TTS → Whisper word times → timeline → frames + audio → MP4)
- `config.json`: voice (`am_puck`, speed 1.2, pauses capped at 0.12 s), colours, layout, timing, palettes
- `icons.py`: flat illustrations drawn in code. Labels starting with "No/Never/Without" get a red ban sign automatically.
  New topic → add `def icon_<name>(ctx)` (600x600 box) + keywords in `ICONS`. Unknown topics fall back to an A/B badge.
- `assets/brand/`: channel logos (user art). `assets/endcard/`: the fixed end card.
- `assets/fonts/Fredoka.ttf`: SIL OFL (all on-screen text)

## Requirements
`bash ../pack/Stick3D-Pack/00-setup/install_v4_tools.sh` (Kokoro + faster-whisper), `pip install pycairo opencv-python-headless`, ffmpeg.
Voice clips and word timings are cached in `out/<name>/cache`.
