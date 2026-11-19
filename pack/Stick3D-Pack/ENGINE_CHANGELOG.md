# ENGINE_CHANGELOG.md — running log of what each episode taught us and what changed in the engine

Rule: after EVERY episode add an entry: **Learned** (what went wrong / user feedback / QC numbers) and **Changed** (what was built into the engine so it never happens again).
Newest entries on top.

---

## v13 — after EP03 remake review (user score 7/10)
**Learned (EP03 remake)**
- QC FAIL: Stickman visible 92.3 % (user QC) / 95.3 % (mask QC), one 2.25 s gap at 83.5 s (whale swallow), big enough only 58 % of the time (too many wide shots: 2.5-3.7, 11-14, 22-28, 32-34, 46-50, 76-78 s).
- Environments still too sparse: rooms without wall texture, skirting, cables, clutter; Moon was a flat plane; space was an empty gradient.
- The whale was an oval with a painted mouth: no real jaw, teeth or inside, so the swallow did not read.
- Smoke = overlapping transparent circles.
- Drawn things appeared as floating icons, not at their final spot.
- Landing/arrival moments framed too wide: neither the rocket nor Stickman readable.
- CSS colour-grade overlays tinted Stickman's white head (warm/pink casts).

**Changed (engine)**
- `tools/qc_check.py` = THE delivery gate: `python3 tools/qc_check.py video.mp4 --duration <s>` after every render; picks up the QC mask automatically; writes `report.txt` + `contact_sheet.png`;
  new checks: off-screen gaps >= ~2 s FAIL (6-fps sampling is conservative), BIG ENOUGH (>= 38 % frame height) >= 75 % of visible time, head stays WHITE (H) >= 90 %.
  Every delivery now includes report.txt + contact_sheet.png. (The user's own qc_check.py did not arrive with the message; drop it in `tools/` when re-sent.)
- `kit/puff.tsx` CloudPuff: irregular cauliflower puff (6 lobes), 3-tone toon shading, soft ink rim, warm underside lit by fire, expands, rises, thins out, blob-dissolve fade.
  `Smoke`, `PuffBurst`, robot steam and `Cloud3D` in `style/set3d.tsx` now all use it → no circle smoke anywhere (old episodes upgrade on re-render).
- `kit/creatures.tsx` GiantWhale: lathe-built body (fat head → tail stock), belly grooves, glowing spots, big eyes with lids + glow, pectoral fins, dorsal, beating flukes, cheeks, highlights, spout,
  HINGED LOWER JAW with teeth (upper + lower), pink tongue, dark throat/cavity; `whaleMouth()` + `gulpAt()` = swallow action (suction path into the mouth, jaw snaps shut AFTER the object passes the lips, throat bulge).
  `Whale3D` (set3d) is now a wrapper around it.
- `kit/fx.tsx` DrawItReal: lines drawn stroke-by-stroke AT THE FINAL POSITION (ink + white halo, `InkDraw`) → flat colour fill → inflates into the real 3D object with overshoot + sparkles; `drawTip()` for the pencil hand.
- `kit/dressing.tsx` SetDressing: scatters 20-40 props in foreground / midground / background zones (room, moon, meadow, space libraries), keeps the action area clear.
  `SpaceBackdrop`: nebula clouds, planets (one ringed), three star layers at different depths — automatic in `<World preset="space">`.
- Bedroom (HOME SET): wallpaper on 2 walls, skirting boards, wall socket + 2 cables, + 26 clutter props via SetDressing (books, plants, toy blocks, ball, box, sneakers, paper balls, pouf, mug, toy robot).
- Moon: curved horizon (`moonY`, flat 25 units then falls away), 14 distant mountains, crater rim highlights, footprints, 34 dressing props (rocks, pebbles, small lit craters, flag, antenna).
- `kit/camera.tsx`: `twoShot` preset + `keyMoment(t0, t1, hero, object, objectH)` — landings/arrivals framed so both Stickman and the object are fully readable.
- Head stays white: `paintHero()` restores the untinted head after rim/shade overlays; character billboards ignore fog and tone mapping; `SafeGrade` (neutral vignette only) replaces colour-tint overlays — colour mood must come from `<World>` light presets.
- GradientDome default radius 150 (inside camera far = 200; the 300 radius dome was invisible).
- Showreel: `ShowreelV13` (smoke, whale gulp, draw-it-real), passed QC before delivery.

## v12 — engine kit (after EP03 remake)
**Learned:** every episode re-built characters, sets, camera and checks from scratch; QC by eye missed Stickman's size/visibility problems.
**Changed:** `kit/` modules (character + 28 actions with anticipation/squash/overlap, world presets + terrain/grass/trees/water/ambient life/DOF/HOME SET, FX library, camera presets + auto-framing + auto-coverage,
auto-placed captions), QC mask render (Stickman painted magenta/green for exact measurement), animatic compositions (12 fps), pipeline scripts (animatic → final → deliver), voice_fit / auto_sfx / mix_episode / music_bed /
captions / stickmask / qc_check / publish_kit tools, signature `magic_pencil` sound, STYLE_RULES.md + WORLD_RULES.md + ENGINE.md.

## v11 and earlier — EP02-EP06
- EP02: 3D EP02 style established (Scene wrapper with transitions, Cam spline camera, toon outlines, sky kingdom); renders must be chunked (2 h task limit).
- EP03 (2D) → remade in 3D: no external images; real 3D sets; rocket/ladder/Moon gas station/robot/whale/belly in `style/set3d.tsx`.
- EP04-EP06: rig v2 hero, procedural worlds, loop recipe (EP06), stroke-by-stroke drawing (EP05).
