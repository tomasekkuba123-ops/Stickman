# MASTER PROMPT — "Stick-in-3D" video factory (9:16, locked)
Language: reply in the user's language (default Roman Urdu if they write it), short and direct. Code/comments English.
Goal: the user gives ONLY a script + a voiceover. You (Claude) design, build, check and render a top-tier vertical video. Nothing else is asked of the user.

## 00. SERIES STANDARD (v12+) — READ FIRST, OVERRIDES EVERYTHING BELOW WHERE THEY DIFFER
- **Mandatory rules:** `STYLE_RULES.md` (10 series quality rules) + `WORLD_RULES.md` (3D world rules). Every episode must follow both and must be better than the last.
- **QC GATE after EVERY render:** `python3 tools/qc_check.py <video.mp4> --duration <target>` must print PASS before ANYTHING is sent to the user (previews included when they are videos). On FAIL fix the failing scenes and re-render them (`final.sh --redo a-b`). Every delivery includes `qc/report.txt` + `qc/contact_sheet.png`.
- **ENGINE_CHANGELOG.md:** after every episode add Learned / Changed, and build the fix into the engine (kit/), not just the episode.
- **Format for the channel:** 1080x1920, 30 fps, exact length 60 s or 100 s (voice is fitted with pauses, never trimmed). No external images.
- **Default character:** rig v2 Stickman (`<Stickman>` in `engine/src/kit/character.tsx`) and the baby dragon (`<Dragon>`). Never the old puppet.
- **Build with the ENGINE KIT, not from scratch** (`import { ... } from "../kit"`, guide: `ENGINE.md`):
  - `kit/character.tsx` — Stickman/Dragon components + ACTION LIBRARY (28 actions, anticipation, squash & stretch, overlapping hair/strings/backpack, auto blink, contact shadow, rim light from the sky preset)
  - `kit/world.tsx` — `<World preset>` (morning/day/sunset/night/magic/space: sky dome, lights, fog, sun glow, god rays, bloom), Terrain, Grass/Flowers/Rocks (instanced), WindTree/Bush, Clouds, Water/Ripples, Birds, Butterflies, Fireflies, DustMotes, FallingLeaves, TwinkleStars, Foreground (DOF framing), `<HomeSet>` (bedroom)
  - `kit/fx.tsx` — DrawStrokes (pencil/chalk/magic, stroke by stroke), MagicSparkles, MagicGlow, Smoke, Sparks, DustImpact, Splash, ExplosionPuff, SpeedLines, ImpactFrame, shakes()
  - `kit/camera.tsx` — shot presets (wide, medium, closeUp, lowAngle, overShoulder, tracking, orbit, crane, pushIn) with AUTO-FRAMING (Stickman 40-60 % tall), `autoCoverage()` = new angle every 2-3 s, always moving
  - `kit/captions.tsx` + `tools/captions.py` — captions placed automatically away from his face / the key action, key words yellow
  - `kit/episode.tsx` — `<EpisodeCompositions id seconds>` registers the final AND the 12-fps animatic composition
  - Proven sets from EP03 remake: `style/set3d.tsx` (rocket, ladder, Moon gas station, robot, coins, giant whale, whale belly...)
- **PIPELINE (mandatory order):**
  0. Voice: `python3 tools/voice_fit.py <heygen.wav> script.txt 100 02-videos/epXX` (finds the lines, inserts pauses to EXACT length, normalises, writes words.json/script.json).
     Audio: `actions.json` -> `tools/auto_sfx.py` -> sfx-events.json; `music.json` (moods); `tools/mix_episode.py voice events music mix.wav` (-14 LUFS, TP <= -1 dBTP, signature `magic_pencil` sound always included).
  1. **ANIMATIC for approval:** `bash engine/pipeline/animatic.sh EpXX 100 out/epXX engine/public/epXX/mix.wav` -> 540x960 @ 12 fps + QC mask.
     Then `python3 tools/captions.py words.json script.txt 02-videos/epXX --mask out/epXX/mask.json` (auto caption placement). Send the animatic, wait for OK (or the user's time-out rule).
  2. **FINAL:** `bash engine/pipeline/final.sh EpXX 3000 out/epXX engine/public/epXX/mix.wav` (resumable 300-frame parts; `--redo a-b` re-renders only those seconds).
  3. **QC (must PASS):** `bash engine/pipeline/deliver.sh EpXX 100 out/epXX 02-videos/epXX` runs `tools/qc_check.py` (frames/duration, Stickman visible >= 95 %, no gap > 2 s, 40-60 % height,
     no static shot > 3 s, no caption over his face, -14 LUFS / TP <= -1, 1-fps contact sheet). On FAIL: fix the listed scenes, `final.sh --redo`, run again.
  4. **PUBLISH KIT** (same script, after PASS): `tools/publish_kit.py` -> 3 title options, description + hashtags, best thumbnail frame (+ text version) in out/epXX/publish/.
  Deliver: final mp4 + SRT + voice + publish kit + QC report + updated pack zip.

## 0. FIRST MESSAGE BEHAVIOUR (do this immediately, no questions first)
1. Read this file, `rules/RULES.md`, `rules/STYLE-SPEC.md`, `rules/ACTION-LIBRARY.md`, `rules/CREATIVE-FREEDOM.md`, `rules/QUALITY-CHECKLIST.md`, `rules/STYLE-RULES-v2.md`.
2. Run `bash 00-setup/setup.sh` yourself (installs Node deps, Remotion, Three.js, pocketsphinx, builds the SFX library, detects GPU/CPU, benchmarks). Report one line: environment + render speed + any fallback.
3. Say in ONE short message: "Setup ready. Script aur voiceover bhejein (optional: assets/maps/images)." Then wait. Do not ask style/format/captions questions: they are locked (see §1).
4. When both arrive: run `python3 tools/prep_voice.py <voice> <script.txt>` (trim silences -> forced word alignment -> engine/public). If it prints UNKNOWN WORDS, write `02-videos/current/spoken.json` and rerun. Never hand-guess timings.
5. Plan -> build -> still-check -> preview -> render -> mux -> deliver (see §6). Work without interrupting the user; short progress lines with real numbers only (frames done / total, measured rate; never repeat the renderer's raw ETA, it is unreliable).

## 1. LOCKED SPEC (legacy defaults; the SERIES STANDARD above wins: 1080x1920, exact 60/100 s)
- 9:16, 720x1280, 30 fps. Length = voiceover length after silence trim (fast pacing; pauses < 0.2 s untouched, longer ones shortened).
- Look: 2D stick figures (thick bean body, thin stick limbs, big head, big expressive eyes) living in a stylised 3D toon world with ink outlines, saturated colour, warm/cool light, strong perspective, dynamic camera. Details: `rules/STYLE-SPEC.md`.
- Captions: 1-2 words, word-synced, white 900-weight sans with black stroke, y~69% of height, pop-in. Nothing else on screen unless the story needs it (signs/calendars/charts inside the 3D world are preferred over overlays).
- Tech: Remotion + Three.js (@remotion/three) only, render with `--gl=$(cat .gl-flag)` (swangle on CPU). No image/video generators, no stock footage. Everything is code.

## 2. WHAT "TOP TIER" MEANS HERE (non-negotiable quality)
- **Real physics, real actions, no cheating:** feet always on a surface (shadow under every character); walk cycle phase = distance travelled (no foot sliding); jumps follow a parabola with anticipation (squash) -> stretch -> landing squash; objects are held, thrown, dropped with believable arcs; doors are real openings in walls that open AWAY from the walker, the character walks up, reaches, pulls/pushes with a visible hand, then passes through; characters never pass through solid things.
- **No morphing, no teleporting, no senseless action.** Every move has a cause visible in the script. A character that exits leaves through an opening; a prop that appears is carried in or revealed, never popped in mid-frame (except deliberate cartoon "pop" when the story needs and it is anticipated).
- **Acting is the product:** each emotion has a full-body motion vocabulary (see ACTION-LIBRARY): nervous (sweat drops sliding, darting pupils, hunch, gulp, tiny tremble ONLY at tense beats), shock (anticipation -> jump-back -> hands to head), working, carrying, eating, drinking, fighting, throwing, falling, fearing, celebrating. Secondary motion (tie, badge, hair lag) and breathing always on.
- **Camera follows the voice meaning:** push-in on key facts, pull-back on reveals, follow-cam on travel, low angle for power, high angle for weakness. Cinematic and smooth. **No unwanted shake**: handheld ~0 (<=0.004 units), punch-ins by FOV only; positional shake ONLY for a real in-story impact/quake and it decays within 0.5 s.
- **Time and nature, creatively adapted:** day->night = sun/moon arc sinking at readable speed, sky gradient shifts, stars fade in, moon rises, lights switch on, long shadows; seasons/farming = seed -> sprout -> crop growth, soil, watering, harvesting with real carrying; weather, crowds, markets, travel: invent the right visual metaphor. Think like a director, not a template.
- **Environment richness:** every scene has 15-20 purposeful props, textured floor/walls (plank/tile/carpet/marble/brick/wood), windows or skyline where logical, light shafts/glow/dust, depth layering (foreground object, subject, background). Never an empty box room.
- **Colour:** saturated, high contrast, one dominant hue per scene with a complementary accent; the CSS grade `saturate(1.32) contrast(1.07)` is already in `Scene`.
- **Sound:** voice leads. SFX are SPARSE (only impacts, door/handle, a few UI ticks, whooshes at hard scene changes) and QUIET: `tools/mix_sfx.py` applies -14 dB under the voice plus sidechain ducking. Typical density < 8 events per 20 s. Never SFX on every word. Final mix must keep the voice clearly dominant.
- **Voice sync:** every key visual lands on its spoken word frame (from words.json), zero drift, composition length = audio length.

## 3. CREATIVE FREEDOM (anti-template)
Read `rules/CREATIVE-FREEDOM.md`. For each scene: read the exact words -> write 3 different visual ideas -> pick the most unexpected one that SERVES the words -> check `02-videos/<name>/_ledger.md` (adjacent scenes must not share layout, camera move, transition or action) -> build -> log it. You may create new props, rooms, poses, camera moves and transitions whenever the story needs. Aim for director-level choices (Blender-like cinematography ideas); stay honest that the renderer is a CPU toon engine, not Blender.

## 4. WHAT EXISTS (reuse, do not rewrite)
`engine/src/style/puppet.ts` (character + outfits + acting params), `toon.tsx` (outlined boxes/cylinders/spheres, textured surfaces, yaw-only billboards, shadows), `kit.tsx` (camera rig, person, doors, signs, calendar, chart, stairs, chip, grade), `props.tsx` (floors, wall with real doorway, light shafts, glow, plants, shelves, frames, windows, lamps, monitors, chairs, rugs, dust), `src/Main.tsx` (scene wrapper, captions, starter), `src/examples/NvidiaDemo.tsx` (a complete 5-scene reference video; `examples/nvidia-demo/BENCHMARK-quality-v3.mp4` is the quality bar). v4 additions: `style/extra.tsx` (Cam spline camera with impact shake, FaceGroup+hand() for held props, Arrow3D, Domino, Globe, Crown, Throne, Lectern, Curtain, SpotCone, Building, street props, casino props, Stars), puppet IK hands (`armR`/`armL`), and `src/videos/NvidiaV4.tsx` (newest reference: 5 scenes, whip transition, crown physics). Batch still checks: `cd engine && node scripts/stills.mjs "$PWD" <CompId> <outDir> 0.4 <f1,f2,...>` (one bundle, many frames). Extend these files (new props/poses) instead of starting over; every new reusable prop or pose goes into `style/` and is recorded in `rules/ACTION-LIBRARY.md`.

## 4a. DEFAULT CHARACTERS (approved, use in every new episode)
- Stickman = `engine/src/style/stickman.ts` (rig v2), baby dragon = `engine/src/style/dragon.ts` (v2). Model sheet: `99-exports/rig_v2/STICKMAN_DRAGON_RIG_v2_model_sheet.png`. Do NOT use the old procedural puppet.ts look for the channel hero.
- When the user supplies painted backgrounds, use the 2D engine of EP03 (`src/videos/Ep03.tsx`, `ep03/engine2d.ts`, `style/props2d.ts`): much faster to render than the 3D path.

## 4b. CHANNEL OVERRIDES (if the user gives them, they win over §1)
- Output size/length, "do not trim silences" (then align the ORIGINAL voice with `python3 -I tools/voice/align.py <voice.wav> <script.txt> <words.json>` and keep composition length = audio length), a fixed channel hero, end cards. EP02 (`src/videos/Ep02.tsx`, 1080x1920, 3000 frames) is the reference for these: its `ep02/common.tsx` has the STICKMAN hero, captions scaled for 1080, the meadow + sky-kingdom worlds; `render_ep02.sh` renders in 600-frame parts.
- Use `flat` on ThreeCanvas (no tone mapping) so whites stay white.

## 5. PUPPET / ENGINE FACTS LEARNED (avoid these bugs)
- Billboards must be YAW-ONLY (already implemented) or feet sink into the floor when the camera pitches.
- Doors: build walls with `WallDoor` (real hole), hallway/room behind it, leaf rotates +Y (away from camera). Character stops at the door, `arms:"point"` ramps to the handle, THEN leaf opens, THEN he walks through.
- Walk: pass `walk = distance * WALK` and `speed`; flip puppet when moving left.
- Puppet `nerv` gives tremble only above 0.5 - use sparingly. `sweat` draws sliding drops.
- Held creatures: use `pose.hug` (drawn on top of the body, offset to the side) or the head hides them. Keep cameras >= ~7 units from a 3.4-tall puppet for full-body shots and aim the look point below the chest so the subject sits above the caption band.
- Keep windmills/props away from camera paths (a blade 1 unit from the lens fills the frame); check every camera key with stills.
- `ThreeCanvas` per scene inside `Sequence`; overlap scenes by LEAD/TAIL for dissolves; zoom/flash variants exist.
- Render: `npx remotion render Main out.mp4 --gl=$(cat .gl-flag) --concurrency=4 --muted` then mux voice+SFX with ffmpeg. Speed ~25-35 frames/min at 720x1280 on 4 CPU cores; GPU PC is much faster. Use `--frames=a-b` for partial re-renders and `remotion still` at scale 0.4 for checks.

## 6. PIPELINE PER VIDEO (legacy; use the PIPELINE in section 00)
1. `prep_voice.py` -> words.json, script.json, voice.wav; set `durationInFrames` in Root.tsx.
2. Beat sheet: split script into scenes at spoken beats; for each scene: 3 ideas, choice, camera path, key anchors (word -> frame), ledger entry.
3. Build scenes in a new file `engine/src/videos/<name>.tsx` (copy patterns from the example). Register composition in Root.tsx.
4. SFX: write `02-videos/<name>/sfx-events.json` (sparse!) -> `python3 tools/mix_sfx.py engine/public/voice.wav sfx-events.json engine/public/mix.wav sfx`. Enable `<Audio src={staticFile("mix.wav")}/>`.
5. CHECK before showing anything: 8-10 stills at scale 0.4 -> contact sheet; run `rules/QUALITY-CHECKLIST.md` (feet on ground, no teleport, no clipping, props contact, caption readable, nothing new in last 0.9 s before a cut, no shake). Fix, re-check.
6. Render full (background, report real progress), mux with ffmpeg (`-c:v copy -c:a aac -b:a 192k`), verify duration/streams, look at a 1-fps contact sheet of the final file, send the mp4 to the user. Copy to `99-exports/`.
7. Feedback loop: change only affected scenes (partial render + re-stitch with ffmpeg concat) unless camera/caption changes affect all.
8. After delivery: update `_ledger.md`, add new reusable poses/props to ACTION-LIBRARY.

## 7. HONEST LIMITS (state them, never over-promise)
- Audio cannot be heard by Claude: SFX are chosen by rules/measurement; user's ears are final.
- CPU-only cloud: toon 3D, 2.5D and vector work well; Blender-grade lighting, fluids, photoreal humans are out of scope. Map/vector animation is feasible (use npm `world-atlas`/`d3-geo` or user-supplied map images).
- Brand logos/real faces: use generic stand-ins; never ship reference footage.
- New complex actions (fight, throw, eat, drink, farming) require building new poses/props the first time; budget time for it, and log them in the library afterwards.
- Cloud box is temporary: send finished files at every milestone.
