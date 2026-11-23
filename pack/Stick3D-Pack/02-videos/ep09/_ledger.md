# EP09 ledger: "What If the Moon Disappeared?"
- Voice: Kokoro am_michael, 38.0 s, read exactly as scripted; Whisper word timing; Rhubarb mouths; -14 LUFS mix with synthesized SFX and music bed.
- Engine v17: gesture engine (kit/gesture.ts: eased keys, spring elbows/wrists, moving holds, ghost-arm motion blur, aim + beat from Whisper words), morphing gloves, framing helpers (kit/frame.ts), diorama kit (kit/diorama.tsx) and scene sets (kit/sets4.tsx: NightField, MoonShore, Space, TorchBeam, ForestGlade, SeasonHill) saved for reuse.
- 7 scenes, 2 preview rounds (scenes 1/3/5) approved before the full build. Transitions: cut / whip2 / iris, no overlap; loop: last frame = first frame.
- QC (qc_check.py): PASS: 1140 frames; visible 100 %; big enough 92.1 %; 40-60 % band 92.1 %; no caption on face; head white 95.2 %; -14.1 LUFS / -1.2 dBTP; 20 cuts, mean shot 1.8 s (warn: one 5.3 s continuous ocean shot).
- Fixed tools/stickmask.py: in dark scenes the head and body blobs were split by rim shading, so only the head was measured (first QC run said "too small"); a 5 px bridge before blob grouping fixed it.
- Fixed tools/publish_kit.py: removed the hardcoded EP08 "magic pencil" sentence from the description template.
- Render resumed once after the 2 h background limit.
