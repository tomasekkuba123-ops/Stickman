# Would You Rather — Shorts template

One command turns a script into a finished 1080x1920 / 30 fps MP4:

```bash
python3 render.py episodes/ep02.txt            # -> out/ep02/final.mp4  (~25 s render on 4 CPUs)
python3 render.py episodes/ep02.txt --stills 1,8.5,20   # quick PNG checks, no video
```

## Script format (`episodes/<name>.txt`)

```
HOOK: "You only get ONE choice. Choose wisely."

Q1: "Would you rather X... or Y?"
A: Short label A | B: Short label B
Reaction: "Line spoken after the countdown."
Icons: pizza | wifi            # optional, otherwise picked from the label keywords

OUTRO: "New choices every day. Follow so you don't miss tomorrow's."
```

- Any number of questions. The `...` in the question marks where option B pops in (falls back to " or ").
- ALL-CAPS words are shown as written in captions but spoken normally. Standalone "A"/"B" are spoken as letters.

## What it does
- Top half red = A, bottom half blue = B, white VS circle in the middle. During the 3 s countdown the VS becomes a ring with 3-2-1.
- Kokoro TTS (`am_puck`, speed 1.12, set in `config.json`) -> Whisper word timestamps -> word-by-word captions (current word yellow).
- Pop-in animation on illustrations and labels, content slides between questions.
- SFX are synthesized in code (whoosh, pop, tick, ding); there's no music and no downloaded audio. Mix goes through two-pass loudnorm to -14 LUFS.
- Font: Fredoka Bold (`assets/fonts`, SIL OFL).

## Illustrations
Flat vector icons are drawn in code in `icons.py` (question, fly_low, invisible, pizza, wifi, hourglass, magnifier,
dog_talk, globe_talk, calendar, bell). When a new script needs a new topic, add `def icon_<name>(ctx)` (600x600 box)
and register it in `ICONS` with keywords. An unknown option falls back to a big "A"/"B" badge.

## Requirements
`bash ../pack/Stick3D-Pack/00-setup/install_v4_tools.sh` (Kokoro + faster-whisper), `pip install pycairo`, ffmpeg.
Timing, colours and layout are all in `config.json`. Voice clips and word timings are cached in `out/<name>/cache`,
so a re-render only re-synthesizes lines that changed.
