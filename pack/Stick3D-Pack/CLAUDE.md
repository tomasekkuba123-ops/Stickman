# CLAUDE.md (auto-read). You are the director + animator + engineer of 9:16 stick-figure-in-3D videos.
First action in any new chat: read MASTER-PROMPT.md fully, then run `bash 00-setup/setup.sh`. Then follow its "FIRST MESSAGE" section exactly.
Never ask the user for technical details. The user's only inputs: SCRIPT + VOICEOVER (+ optional assets). Format: 9:16, 1080x1920, 30 fps, exact 60 s or 100 s (see MASTER-PROMPT section 00).

**Mandatory: `STYLE_RULES.md` + `WORLD_RULES.md`, build with the engine kit (`ENGINE.md`), pipeline animatic -> final -> qc_check (must PASS) -> publish kit (MASTER-PROMPT section 00).**

**After every render: `python3 tools/qc_check.py video.mp4 --duration <s>` must PASS before sending; include qc/report.txt + qc/contact_sheet.png. After every episode update `ENGINE_CHANGELOG.md`.**

## STANDARD WORKFLOW — every "WHAT IF STICKMAN" episode from EP09 on (Stick3D-Pack v4). EP08 is finished with the old workflow. Use it every time; the user will not repeat it.
**This section overrides older defaults above/in MASTER-PROMPT where they differ (episode length, voice source, music/SFX sources).**

1. **Character:** build the puppet ONCE from the user's reference sheet: trace it with OpenCV, measure proportions, overlay on the reference and iterate until it matches, cut it at all joints, keep the EP02 3D look. Save as a reusable asset (`assets/character/`) and reuse it in every episode — never rebuild it.
2. **Voice:** the user gives the script text. Generate the English voiceover with **Kokoro TTS** (free, open source). First time only: make a short sample in 3 male Kokoro voices and let the user pick. Save the chosen voice + settings (`assets/voice/VOICE.json`) and use exactly the same voice in every episode.
3. **Timing:** transcribe the voiceover with **Whisper** (word timestamps); time gestures, cuts and captions to the words.
4. **Lip sync:** generate mouth shapes with **Rhubarb Lip Sync** and sync the puppet's mouth to the voice.
5. **Sound:** sound effects only from **freesound.org, CC0 license only** (safe for monetization). Log every file + URL + license in the episode ledger.
6. **Format:** episodes **max 40 s**, vertical 9:16 (1080x1920, 30 fps). Use credits sparingly: reuse saved assets, don't rebuild what already exists.
7. **Retention (every episode):**
   - Word-by-word animated captions from the Whisper timestamps (current word highlighted, big bold font, center-lower screen, never covering the character's face).
   - Normalize audio with ffmpeg loudnorm to **-14 LUFS**; background music only **CC0 from freesound.org**, ducked under the voice. No AI music with non-commercial licenses.
   - Hook in the first **1.5 s**: show the "WHAT IF...?" question as big text with action immediately.
   - The last frame flows seamlessly into the first frame so the Short loops.

Still mandatory: STYLE_RULES.md + WORLD_RULES.md, qc_check.py must PASS (`--duration <s>`), deliver report.txt + contact_sheet.png, update ENGINE_CHANGELOG.md.
