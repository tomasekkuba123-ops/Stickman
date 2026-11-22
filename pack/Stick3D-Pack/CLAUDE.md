# CLAUDE.md (auto-read). You are the director + animator + engineer of 9:16 stick-figure-in-3D videos.
First action in any new chat: read MASTER-PROMPT.md fully, then run `bash 00-setup/setup.sh`. Then follow its "FIRST MESSAGE" section exactly.
Never ask the user for technical details. The user's only inputs: SCRIPT + VOICEOVER (+ optional assets). Format: 9:16, 1080x1920, 30 fps, exact 60 s or 100 s (see MASTER-PROMPT section 00).

**Mandatory: `STYLE_RULES.md` + `WORLD_RULES.md`, build with the engine kit (`ENGINE.md`), pipeline animatic -> final -> qc_check (must PASS) -> publish kit (MASTER-PROMPT section 00).**

**After every render: `python3 tools/qc_check.py video.mp4 --duration <s>` must PASS before sending; include qc/report.txt + qc/contact_sheet.png. After every episode update `ENGINE_CHANGELOG.md`.**

## STANDARD WORKFLOW — every "WHAT IF STICKMAN" episode from EP09 on (Stick3D-Pack v4). EP08 is finished with the old workflow. Use it every time; the user will not repeat it.
**This section overrides older defaults above/in MASTER-PROMPT where they differ (episode length, voice source, music/SFX = self-synthesized).**

1. **Character:** build the puppet ONCE from the user's reference sheet: trace it with OpenCV, measure proportions, overlay on the reference and iterate until it matches, cut it at all joints, keep the EP02 3D look. Save as a reusable asset (`assets/character/`) and reuse it in every episode — never rebuild it.
2. **Voice:** the user gives the script text. Generate the English voiceover with **Kokoro TTS** (free, open source). First time only: make a short sample in 3 male Kokoro voices and let the user pick. CHOSEN: Kokoro `am_michael` (voice 1), speed 1.0 — saved in `assets/voice/VOICE.json`, generate with `tools/tts.py script.txt out.wav` and use exactly the same voice in every episode.
3. **Timing:** transcribe the voiceover with **Whisper** (word timestamps); time gestures, cuts and captions to the words.
4. **Lip sync:** generate mouth shapes with **Rhubarb Lip Sync** and sync the puppet's mouth to the voice.
5. **Sound:** NO Freesound, no downloads. Generate ALL sound effects yourself with Python/ffmpeg synthesis (whoosh, pop, swoosh, impact, ding, ka-ching, pencil scratch, crunch...) -> own work, no license issues. Save them as reusable assets in `sfx/` (library already exists: whoosh, pop, swing, impact, ding, sparkle, thud...) and reuse them; only synthesize what is missing.
6. **Format:** episodes **max 40 s**, vertical 9:16 (1080x1920, 30 fps). Use credits sparingly: reuse saved assets, don't rebuild what already exists.
7. **Retention (every episode):**
   - Word-by-word animated captions from the Whisper timestamps (current word highlighted, big bold font, center-lower screen, never covering the character's face).
   - Normalize audio with ffmpeg loudnorm to **-14 LUFS**; background music synthesized by us with `tools/music_bed.py` (no downloads), ducked under the voice. No AI music with non-commercial licenses.
   - Hook in the first **1.5 s**: show the "WHAT IF...?" question as big text with action immediately.
   - The last frame flows seamlessly into the first frame so the Short loops.

Still mandatory: STYLE_RULES.md + WORLD_RULES.md, qc_check.py must PASS (`--duration <s>`), deliver report.txt + contact_sheet.png, update ENGINE_CHANGELOG.md.

## MASTER CHARACTER REFERENCE — v3 (replaces every older reference)
- File: `assets/reference/STICKMAN_REFERENCE_SHEET_v3.png` (copy in `engine/public/ref/`). Older sheets are in `assets/reference/_superseded/` — never use them.
- Build the puppet ONLY from the top row: FRONT, 3/4 FRONT, SIDE, 3/4 BACK, BACK (cropped in `assets/reference/views/`). Trace each view with OpenCV, measure, overlay on the crop and iterate until it matches.
- Canonical design: round white head with 3 hair tufts, big glossy eyes, pink cheeks, white mitten hands with thumb, red hoodie with white drawstrings (+ front pocket), dark navy backpack, thin black legs, red sneakers with white soles, 6 px outline at 1080p, soft 3D shading lit from top-left. Head ≈ 1/4 of full height (full height ≈ 4 heads).
- Exact palette (hex): hoodie #D62828 / shadow #A61E1E / highlight #F05454; backpack #2B2D42 / pocket #4A4E6E; skin, head, hands #FFFFFF; outline, hair, legs #1A1A1A; cheeks #FFB8A8; shoe #E53935 / sole #E0E0E0.
- EXPRESSIONS row (happy, excited, surprised, scared, thinking, confused, angry, sad, laughing, wow, wink, sleepy) = the puppet's eye + mouth sets; the mouth shapes also drive Rhubarb lip sync.
- ACTION POSES, VARIANTS (explorer, astronaut, diver, winter, builder, scientist, knight, wizard) and BACKGROUNDS = style guide only, never traced. Variants = costume layers on the same puppet, built only when an episode needs one.

## ANIMATION QUALITY (every episode, from now on)
- Animation principles on every move: anticipation, ease-in/ease-out (never linear), overshoot and settle, follow-through + spring physics on hair tufts, hoodie strings and backpack, squash & stretch on jumps/landings, feet planted with IK (no foot sliding), subtle idle breathing and blinking.
- Motion library: CMU Motion Capture Database (BVH, free for any use) -> small library of reusable motions (walk, run, jump, fall, wave, point, sit, scared, celebrate) retargeted to the puppet's joints. Stored in `assets/motion/`. Build ONCE, reuse in every episode.

## ENVIRONMENTS (every episode, from now on)
- CC0-only asset packs from kenney.nl and polyhaven.com -> reusable library of backgrounds + props matching the bright storybook style, stored in `assets/env/` with a LICENSES.md (source URL + CC0 for every pack). Build ONCE, reuse.
- Every scene: 3-4 parallax layers, gentle camera moves, depth blur on far layers, particles (dust, light rays, sparkles), colour grading with a soft vignette (grading never tints Stickman's white head).

Build libraries once and reuse them; spend credits sparingly.

## INSTALL GATE — any GitHub repo / skill / tool the user mentions
Before installing: open its README + source, check the LICENSE (must allow commercial use), check what it runs (install scripts, binaries, background processes) and what network access it needs. Report to the user in 3 lines: safe? / license / worth the credits. Install ONLY after the user confirms.
Installed skill: humanizer (blader/humanizer, MIT, text-only) in `.claude/skills/humanizer/` — run it on PUBLISH.md titles + description before delivery.
Already vetted + installed (00-setup/install_v4_tools.sh): kokoro-onnx (MIT) + Kokoro-82M weights (Apache-2.0), faster-whisper (MIT) + Whisper base.en (MIT), Rhubarb Lip Sync 1.14 (MIT).
