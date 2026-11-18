# EP03 REMAKE ledger — "What If Stickman Drew a Rocket" (full 3D, EP02 style)
- Kept: EP03_VOICE_100S.wav, captions/SRT, timing, story beats, rig v2 Stickman. Removed: the 4 BG_*.png images (deleted from the pack) and the old 2D Ep03 composition.
- Composition: `Ep03R` (engine/src/videos/Ep03R.tsx + ep03r/scenes.tsx, props in style/set3d.tsx). 22 scenes, 45+ camera shots.
- Audio: voice + 83 SFX events (sfx-events.json) + procedural mood music (music.json -> tools/music_bed.py), ducked; -14.0 LUFS, -1.3 dBTP.
- Render: engine/render_ep03r.sh (10 x 300-frame parts, resumable), concat + mux -> 99-exports/ep03r/.
- Self-check (rule 10, contact_1fps.png): Stickman visible ~96 % (gap = swallow, < 2 s); new shot every 2-3 s; captions high/low, key words yellow; hook frame 1 = LIFTOFF!; end = question + SUBSCRIBE, last shot = drawing a new rocket -> loops to the rocket hook.
- Final: 1080x1920, 30 fps, 3000 frames, 100.0 s; audio -14.0 LUFS, true peak -1.1 dBTP.
