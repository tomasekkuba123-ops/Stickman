# ENGINE_CHANGELOG.md — running log of what each episode taught us and what changed in the engine

Rule: after EVERY episode add an entry: **Learned** (what went wrong / user feedback / QC numbers) and **Changed** (what was built into the engine so it never happens again).
Newest entries on top.

---

## v21 — EP14 "Stickman's bed just woke up" (35 s, bedroom -> stairs -> playground -> bedroom loop)
**Learned**
- HomeSet bedroom: the built-in bed sits behind the desk, so a living bed placed near it is hidden. Turn the room bed off (`noBed`) and stand the hero on open floor with the story prop to one side.
- A small prop (toothbrush in a cup) behind the hero is invisible in a size-B shot: put it in front of him, beside his hand, at the same depth (z of the hero + 0.15).
- Chase shots on stairs: lerping the camera from the hero to a fast prop (k 0.75) throws the hero out of the frame. Track the hero and clamp the offset toward the prop to about +-1.1 m; let the prop run out of frame ahead of him.
- Kokoro: one-word exclamations come out weak on their own; merge them with the next sentence.
- QC rounds (final PASS after 5 partial re-renders): the V-scale/stray/cropped checks read `out/<ep>/mask.json`. After ANY change to positions, framing or transitions re-run `pipeline/qcmask.sh` before qc_check, or it reports the old failures.
- DepthPass focus is a fixed distance: when a shot is widened (lower frac) or the hero is tracked far from the camera, he drifts out of focus -> V-blur. Refocus or drop blur to <= 0.8 for that shot.
- A `whip2` transition's first incoming frame sits exactly on the cut time; qc samples it and flags "hero touches the frame edge". Use a hard cut where the QC sample lands.
- Captions + "WHAT IF?" hook: high captions overlap the hook title in 0-2.75 s. Always force `--low 0-2.8`.
- Bottom 20 % empty in open fields: add near Grass + Flowers in front of the hero (z +2..+8) instead of re-framing.
- Thumbnail: use a clean still (`npx remotion still <Id> 02-videos/<ep>/thumb.png --frame=N --props='{"clean":true}'`) so no caption leaks under the text.
**Changed**
- kit/bed.tsx (new): `LivingBed` (moods happy/sleepy/asleep/wow/play/yawn, gallop legs, tuck/squash/tilt/wag/ears/blanket/flip), `bedTop`, `Quilt`, `Zzz`, `Toothbrush` (rise/awake/sing/sway), `GiantPillow` + `PILLOW_PATH`, `Trampoline` + `TRAMP_TOP`, `Slide`, `SwingSet`, `Sandbox`, `PicketFence`, `StairHall` + `STAIR`/`stairY`, `Ceiling`.
- style/set3d.tsx + kit/world.tsx: `Bedroom`/`HomeSet` take `noBed`.
- tools/make_sfx_bed.py (new): sfx/snore, gallop, spring, sing, splat.
- tools/tts.py: `--voice` / `--speed` flags (bm_/bf_ voices use en-gb).

## v19 — EP11 "Stickman's hoodie came alive" (story episode, continues EP10's cliffhanger)
**Learned**
- HOME.hero stands behind the desk: in a size-B front shot the desk hides his chest (and anything drawn on the hoodie). EP11 stands him 1.9 m in front of HOME.hero.
- PuffRing at r > 1 / size > 0.4 close to the camera turns into big dark-outlined smears over the face. Keep r <= 0.9, size <= 0.3, life <= 1 s and put the ring behind the hero.
- A screen-placed sky object (worldAt) needs sy >= 0.17 for a 1.5-1.8 m prop or its top is cut off.
- Kokoro + Whisper: "T-shirt" and "ACHOO" come back as two words each; merge them before mapping Whisper times onto the script tokens.
- First final QC FAIL (cropped / scale / stray / hands). Root causes: (1) at FULL/CLOSE the spread arms span ~85-95 % of the frame width, so any sx off-centre (0.27-0.36) or a wide gesture (whoa, palmUp2, sneeze) puts a glove on the frame edge. Keep sx 0.4-0.6 and drop frac to ~0.5-0.6 for shots with wide arm gestures. (2) A static camera framed on the ladder top let him climb up from below the frame: track the camera with the climb. (3) A low camera (camY 0.35) inside the flower field showed a flower as a huge green triangle swinging past the lens: keep camY >= 0.7 in the park.
- QC tool false alarms: a prop or puff in front of his body split the mask into pieces -> head-only height (fake scale jump) and "stray" blobs; the hands check always used the safe band although captions.py had put the captions high/low.
- Fresh-eyes review after QC PASS: the hoodie+kite floating in the sky (worldAt sy 0.19-0.2) sat right inside the HIGH caption band (12-26 % of the height) for 14-27 s and hid words. The mask only knows the hero, so captions.py picked "high" because "low" touched his legs/chair. Rule: when a story prop lives in the upper sky, force those caption groups low (`captions.py --low a-b`); low over legs is fine, never over a key prop. Re-running captions.py with a newer mask can flip other groups too: pin them with --low/--high so only the intended parts need a re-render.
- The post-render hook runs QC without --cuts, so it reports V-scale jumps exactly at the planned cuts; only the full qc_check with --cuts counts.
- After a container reset opencv-python-headless is missing (stickmask / captions / qc / publish_kit need it): `pip install opencv-python-headless`.
**Changed**
- tools/stickmask.py: blobs whose centre lies inside the figure envelope measured from the face disc (±2.6 face heights, down to 4.8) are merged into the hero (occluded parts are not strays, height stays right).
- tools/qc_frames.py: captions-over-hands check uses each caption group's own band (BAND_Y low/high/safe).
- tools/captions.py: fixed KeyError 'safe' (cost loop only over the high/low bands).
- style/stickman.ts: `Outfit.tee` (T-shirt: short sleeves, bare stick arms, crew neck, no hood/strings/pocket; the backpack stays), `rig.hoodieFace` (eyes + grin on the chest, wink, look, moods happy/sad/shock/sneaky), `rig.bagFace` (growling backpack face, front strip + big in side view).
- kit/hoodie.tsx (new): `LivingHoodie` (the hoodie as a character: hood up with eyes in the dark opening, sleeves as arms, wiggle), `hoodieCuff()` (sleeve-end world point for strings), `Kite`, `Rope`.
- kit/world.tsx: `HomeSet` takes children (so the hero inside gets the room's rim light).
- sfx/wind.wav (synthesized gust).

## v18 — EP09 round 3 (HD quality, richer environments, body acting)
**Learned**
- Transparent additive meshes (torch beam) do not write depth, so the DOF pass blurred them with the far background -> the beam vanished. Beam now writes depth.
- 3D grass blades right in front of the camera become giant dark triangles: keep tall grass behind the hero, use a thin short lawn in front, and a vector front bed for the bottom edge.
- In dark scenes stickmask.py split the head from the body (rim shading gap) -> measured only the head; bridged with a 5 px dilate before grouping (fixed in EP09 v17 delivery).
- Rig: armL is the SCREEN-LEFT arm; hand-on-head poses need ik targets around y 1000-1090 + handsOverHead.
**Changed**
- Final = 2160x3840 supersampled render (--scale=2), Lanczos downscale + light unsharp + temporal grain dither, H.264 High CRF 15 / AAC 192k (pipeline/final4k.sh, resumable 60-frame parts).
- canvasTex draws every texture at 2x (TEX_K); hero billboard canvas 2560 px (HERO_RES); low-res previews switch both down with --props '{"lowres":true}'.
- kit/frame.ts: size A = 58 % (FULL), size B = 68 % (CLOSE, hook + ending only), SY_A / SY_B lower the hero so the bottom is ground + foreground.
- kit/acting.ts (new): body acting keys — head turn (new rig.headTurn), tilt, lean, hip shift, knee dip, startled step back (world), foot lift, shiver; continuous weight shift.
- style/critters2.ts + kit/animals.tsx (new): HD vector wolf on its rock (timber colours, fur strokes, howl), owl with feather rows + head swivel, crab with snapping pincers, fish, coral, "?" pop, fish school, coral spawn.
- kit/frontbed.tsx (new): vector front bed (layered smooth blades with rim light, rocks, flowers, shells, starfish, snow) per scene kind; can be lit by the torch.
- world.tsx Grass: smooth curved tapered blades with vertex shading (no black cone spikes), lum + beam glow; Kenney grass tufts render as blades.
- whip2 transitions + season changes: no blur on the frame, crisp motion streaks instead (Streaks in ep02/common.tsx).
- captions: fixed size for every chunk (no shrink), group split when a chunk would need 3 lines, active word = colour + small scale pulse only.
- sets4: NightField glow/lum/ghost (Moon returns as a ghost before it pops back), seasons chaos 1 = snow in summer, 2 = lightning storm; TorchBeam bright + depth.
- tools/qc_frames.py (new): a frame every 0.5 s -> blur / cropped / empty bottom / scale-jump checks + grid image.

## v17 — EP09 rebuild after 2 preview rounds (richer environments + smooth hand acting)
**Learned**
- Depth-of-field post pass at full resolution cost ~15 s/frame on the CPU renderer -> render DOF at low resolution (resolutionScale 0.25).
- The puppet billboard canvas was too narrow (640x960): outstretched arms were clipped -> "flat red tube without a hand". Canvas is now square.
- User feedback: plain gradients and triangle trees look cheap; stripe sea; T-pose / symmetric straight arms; points that don't aim; empty bottom third; cross-fade ghosting; a floating half-sphere shell looked like a stray sprite; the lighthouse jumped between shots.
**Changed**
- kit/gesture.ts: speech-driven GESTURE ENGINE — joint-angle keyframes with cubic ease, elbow/wrist springs (overlap + overshoot), moving holds, motion-blur arm trail, asymmetric gesture set, aim() = point at a world target (screenDir), beat() = gestures from Whisper words (never the same twice in a row).
- style/stickman.ts: continuous HandShape morphing glove (open/relaxed/point/fist/thumb/hold), ghost arms.
- kit/character.tsx: `gest` prop, Savitzky-Golay smoothing of mocap curves, LookContext `dim` (body darkens, head stays white).
- kit/frame.ts: consistent character scale (FULL / CLOSE), framePose/frameShot, worldAt (place Moon/Sun/Earth in the composition), groundAt (bottom-edge foreground props), screenDir.
- kit/diorama.tsx: SkyGrad, shader StarField, ShootingStar, BigMoon (halo, rays, vanish burst), CloudStrips, painted HillLayer (+ village windows), GroundHaze, FireflyTrails, Motes, Props, WoodSign, PaintedGround, ForeFrame (grass, reeds, rocks, seaweed, crab, flowers, branches, space debris), Grain, Vignette, Iris, Lights.
- kit/sets4.tsx: NightField, MoonShore (layered crests, tide waterline + wet band + marker post, shells, starfish, driftwood, footprints, lighthouse), SpaceDiorama (nebula layers, star-dust layers, planets, Sun + lens flare), Earth3 (cloud layer, atmosphere, wobbling axis), RockPlatform, TorchBeam (volumetric cone + lit dust), ForestGlade, Branch, SeasonHill (4 seasons, particles, chaos).
- Captions: "safe" band (62-72 %), max 2 lines laid out explicitly; captions.py --safe; qc_check knows the band.
- Transitions: "cut", "iris", "whip2" (clean whip-pan, no double exposure) in Scene; season whip = backdrop blur.
- Critters: owl head turn + feather ruffle, wolf ear twitch; 24-fps preview composition (<Id>P24).

## v16 — EP09 "What If the Moon Disappeared?" (first episode on the v4 workflow, CLAUDE.md)
**Learned**
- The old puppet drifted from the master sheet: legs too long/thin, hoodie too narrow, 4 thin hair strands, no cheeks, colours off. Measured overlay IoU 0.748.
- Kenney downloads need a page session cookie + a signed link; Hugging Face model files redirect to us.aws.cdn.hf.co / cas-server.xethub.hf.co (allow-list both).
- PyAV in this image breaks faster-whisper's audio decode -> decode with ffmpeg to float32 first.
- A big additive cone for a flashlight beam reads as a grey blob on dark skies; keep the cone at ~5 % opacity and let the spot light + glow do the work.
- Seamless loop: the end shot must reuse the hook's exact camera keys, pose and moon state; blinks off on both ends; captions start when the voice starts.

**Changed (engine)**
- PUPPET v3 (style/stickman.ts `MODEL`): proportions + palette fitted to assets/reference views with `tools/puppet_fit.py` (OpenCV trace -> overlay -> measure; IoU 0.748 -> 0.823), 3 thick tufts, pink cheeks, neck, v3 hex colours, bigger sneakers. Turnaround: assets/character/.
- LIP SYNC: `Mouth` shapes A-H/X (Rhubarb) in the face; `<Stickman lips={mouthCues}>`.
- EXPRESSIONS: + happy, confused, sad.
- MOTION LIBRARY: CMU BVH (11 clips: walk run jump fall wave point sit scared celebrate flashlight shrug) -> `tools/bvh_retarget.py` -> src/motion/motion_lib.json; `<Stickman mo={[{clip, t0, view, amp, hold}]}>` blends in/out, root motion, follow-through from velocity. Check sheet: composition `MotionSheet`.
- ENV LIBRARY (CC0): Kenney Nature Kit (39 GLB) + Poly Haven textures; `KModel`, `KScatter` (recoloured toon), `usePHTex`, `DepthPass` (real depth of field on far layers). assets/env/LICENSES.md.
- CAPTIONS v4: `WordCaptions` — 3-word groups, current word highlighted + pop (`tools/captions.py --max 3` stores per-word times).
- VOICE: Kokoro am_michael (`tools/tts.py`), Whisper words (`tools/whisper_words.py`), Rhubarb mouth cues.
- SETS (kit/sets3.tsx): Moon (vanish pop / pop back), Earth (tilt wobble), NightHill, Beach + tide wave, SeasonMeadow, FlashBeam; critters owl / wolf / crab with confused mode (style/critters.ts).
- SFX synthesized: owl_hoot, wolf_howl, ocean_wave (`tools/make_sfx_nature.py`).

## v15 — after EP08 "What If Stickman Drew a Million Dollars?"
**Learned (EP08)**
- Mask-first order (EP07 lesson) worked first try: QC mask 97.8 % visible, 80.1 % big enough, 56.4 % in the 40-60 % band before the final render; captions placed 42 high / 49 low from the mask.
- Crowd scenes need townspeople that read as *different people* at a glance: hoodie colour + hat is enough; faces stay the same style.
- Night scenes with dark money blankets go muddy without extra moon fill lights near Stickman.
- Price/sign close-ups are fine as short cutaways (≤1.2 s) — the gap rule allows them.
- Still one 2-hour background stop on a 100 s final → resume works (5 of 10 parts per run).

**Changed (engine)**
- `foregroundShot()` and `heroShot()` promoted into `kit/camera.tsx` (EP07 `fg()` pattern) — dist 5 ≈ Stickman 50 % tall.
- `Townsperson` + `TOWNSFOLK` outfits (neighbor, mailman, chef, kid1, kid2, granny, worker, teen): `Outfit {hoodie, hat, hatColor}`, `drawHat()` (cap, chef, mail, beanie, bow); never masked as hero in QC.
- Auto thumbnail picked a frame with the hand over the face and no money in it → `tools/publish_kit.py` now takes `thumb.txt` ("<seconds> [WORD]"), `thumb.png` (clean still) and `logline.txt` (description line) from the episode folder; input prop `{"clean":true}` (kit/qc.ts `CLEAN`) renders stills without captions.
- Final QC: PASS first try — 97.8 % visible, 80.1 % big, 56.4 % band, head white 97.1 %, -14.0 LUFS / -1.2 dBTP, 96 cuts (mean 1.03 s).
- `kit/sets2.tsx`: Banknote (procedural bill texture), MoneyStack (topple), MoneyPile (instanced, glow), MoneyRain, MoneyBlanket, PencilProp, GoldCar, GoldToilet (sparkle, lid), GoldMansion, SoldSign, PizzaShop (neon sign), PriceBoard (spinning digits), Street (morning/day/dinner/night, sold signs), Bike, AppleTree (grow), Apple (bite), SeedSprout, Garden8.

## v14 — after EP07 "What If Stickman's Baby Dragon Grew Up Overnight?"
**Learned (EP07)**
- First full render FAILED QC: Stickman big enough only 57 % (giant dragon + wide two-shots make him tiny), captions over his face in 8 places.
- The QC mask itself was wrong: bright green grass passed the HSV "face green" test, so face boxes covered the whole frame (false "tinted head" FAIL, wrong caption placement). → measurement tools must be validated on every new set palette.
- Rendering the final BEFORE the QC mask wastes 2.5 h: caption placement and framing fixes both need the mask first.
- Background tasks stop at 2 h: a 100 s final (10 parts × ~16 min) needs one resume. final.sh resumes cleanly.
- No speech-to-text model downloads here (Hugging Face / OpenAI blocked): transcripts come from pocketsphinx + candidate-grammar checks; uncertain lines must be flagged to the user.
- Template titles from the script can be nonsense ("Giant Happy"); curated titles are better.

**Changed (engine)**
- `tools/stickmask.py`: exact RGB key match (magenta body, green face) + largest face blob only → grass/foliage never read as the face.
- ORDER in MASTER-PROMPT: animatic/QC-mask → fix framing → captions.py → final → qc_check. (Never final first.)
- Foreground-hero framing pattern (EP07 `fg()`): camera 5 units behind/beside Stickman looking past him at the giant subject → Stickman 45-55 % tall while the giant stays readable. To be promoted into kit/camera.tsx as `foregroundShot()`.
- `tools/voice_fit.py`: pause markers in the script (`[++]` long, `[+]` longer, `[-]` short) control where pauses go and how long.
- `kit/sets.tsx`: Cottage (door, windows, chimney smoke, burnt roof), CottageHall (real doorway, `outside` slot), Garden (fence, gate, path, mailbox, swing, birdhouse, flower beds, trees), GardenTable, Pancake/PancakeStack (wobbling towers, syrup), Teacup, Town, Mountains, Sea, Island + PalmTree, DragonEgg (wobble, crack, peek).
- `kit/fx.tsx`: Fire (flickering flame tongues, glow, embers, lit smoke), Rain (streaks + splash rings).
- Dragon: `mood "sad"`, `tear`, `mouthOpen` (gulp/fire/yawn), any size via `h` (grown dragon = same drawing ×11), `dragonPoint()` (world position of mouth/snout/eye for gulps, fire and riding on the nose).
- Bedroom `night` mode (moonlit window, lamp light). `autoBlink` never fires on frame 0 (hook frames).
- `tools/publish_kit.py`: optional `titles.txt`, `topic.txt`, `hashtags.txt` in the episode folder; no adjectives across sentence breaks; thumbnail word auto-fits.

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
