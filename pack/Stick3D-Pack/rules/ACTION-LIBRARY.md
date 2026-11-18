# ACTION LIBRARY (what exists; extend and log new entries)
## Implemented in engine/src/style/puppet.ts
- Pose params: mood (smile, grin, laugh, shock, worry, gulp, angry, deadpan), arms (down, up, hold, point, head, chest, box, shrug) + armK blend, nerv (tremble > 0.5, blush, brow twitch), sweat (sliding + flung drops), squash (+stretch/-squash), tilt, lookX, flip, hunch, air, walk phase + speed.
- Outfits: suit(+tie), blazer, leather, hoodie, shirt; hair: short, swept, bob, grey; glasses, badge, hat, shoe colour.
## Implemented patterns in examples/NvidiaDemo.tsx (copy, then adapt)
- Jump-back shock (anticipation squash -> stretch air -> landing squash), analytic stair hops + tumble + slide, walk-to-door-reach-open-walk-through, carrying a box (box follows hand with bob), crowd cheering behind a door with camera flashes, quake (throne shake with decay), counters, calendar circle draw, chart line draw.
## To build the first time they are needed (recipe)
- Throw: wind-up (arm back, squash) -> release at hand position -> projectile parabola p = p0 + v t + g t^2/2, spin, impact reaction.
- Pick up / put down: reach (arms: point to object height), grasp frame, object parented to hand with offset, release with settle.
- Eat / drink: object to mouth along arc, mouth opens (laugh/gulp mouth), chew bob 6 Hz small, swallow = throat dip + eyes close.
- Fight: stance, wind-up, strike with extended arm + stretch, hit-stop 3 frames, target knock-back with squash and tilt, cartoon-safe.
- Farm work: dig (arm arc + tool prop), sow (hand scatter + seed sprites), water (can tilt + droplet particles), growth (scale spring on sprout meshes timed to words), harvest (pull + carry basket).
- Fear / cry / celebrate: cower (hunch + tremble + arms head), tears particles, jump with arms up + confetti.
- Sit / stand: pose with chair contact, hips lower, legs bent (add `sit` leg mode to puppet.ts).
- Day->night: sun/moon on arc meshes + sky gradient plane + directional light colour + window glow; stars as small additive Glow sprites with twinkle; lamp glow turns on at dusk.
Add every new pose/prop here with its pose-param names and the scene where first used.
## Added in nvidia-v4 (engine/src/style/extra.tsx + puppet.ts)
- puppet.ts: `armR` / `armL` IK hand targets ([x, y] in puppet-height units, x from body centre, y from feet) + `armRK` / `armLK` blend. Used for: sipping a mug, lifting a crown off the head, carrying it, pushing a domino, holding press cameras / phones.
- extra.tsx helpers: `Cam` (Catmull-Rom camera path, micro handheld <=0.004, impact shake decaying < 0.5 s, FOV kicks), `camAt`, `FaceGroup` + `hand()` (props that stay glued to a puppet's hand).
- extra.tsx props: Arrow3D, Extrude (any outlined polygon), Domino (pivots on its leading edge; chain rule: next starts when angle = asin(gap/h), rest angle = acos(th/spacing)), Globe, Crown, Throne, SpotCone, Curtain, Lectern, Building (lit windows), StreetLamp, StreetSign, Taxi, Hydrant, Bench, Bin, Barrier, PressCam, ChipStack, Card, Dice, HangLamp, Mug, Stars.
- Patterns in videos/NvidiaV4.tsx: cable snap + falling arrow spearing the floor (parabolic drop + rotation + crack decal + debris arcs); mug released into a ballistic arc then a puddle; crown lift -> carry -> place with settle bounce; domino chain + winding small chain + hinged sign flipping up; 240 Hz crown physics sliding off a shaking throne and bouncing on a sphere; whip transition (translateX + blur).
## Added in EP02 (style/puppet.ts, style/dragon.ts, style/sky.tsx, videos/ep02/*)
- puppet.ts channel-hero look ("Stickman"): `outfit:"hoodiePro"` (hood collar, drawstrings, kangaroo pocket, ribbed hem), `hair:"tufts"` (3 swaying tufts), `eyes:"bean"` (big black glossy eyes, arched brows, tongue mouth), `sleeve` (puffy sleeves + white `gloves`), `backpack`, sneakers via `sole`. Preset: `STICKMAN` in videos/ep02/common.tsx.
- puppet.ts poses: `lookY` (pupils up/down), `back` (back view: hood + centred backpack, no face), `hug` (callback that draws a held creature ON TOP of the body; gloves re-drawn over it), `blinkK`.
- Billboard/Person `res` (canvas resolution for 1080p close-ups); outlines scale with output height (toon.tsx/extra.tsx).
- dragon.ts: baby red dragon (moods happy/calm/scared/sneeze/wow/sleepy, flap amplitude+Hz, arms down/up/reach, headRecoil for sneeze, legsTucked, blink, lookX). sky.tsx `Dragon` billboard + `hugDragon()`.
- sky.tsx: SkyDome, SGlow (cached additive glow, cheap), Sparkles, Cloud (bright toon ramp), Island (floating, rock cone), Tree, Flower, Bridge (sagging golden rope bridge with per-plank fx: shake, collapse, ropeCut), Windmill, Bird, Castle (open doors, glowing eyes + blink), Crystal, ChalkKey, ChalkDraw (stroke-by-stroke reveal + `pathTip` for IK hand-follow), Bubble, Lightning, Vine (crystal vine, sub-range + falling piece), Scissors, Ladder, SoundRings; paths DOOR/HEART/SHIELD/LADDER/SCISSORS/ROCKET/SWORD.
- Patterns (videos/ep02): hand follows a chalk tip (`armForTip`), hero walks along while drawing; draw -> solidify (outline fades, 3D object scales in); key into lock + turn = "click"; thought bubble with pencil drawing then red X; heart shrink-wrap + reverse cracks; sneeze anticipation/recoil -> bubble trail; bubble ride (bezier); bridge chase-collapse; transition "whipL" with chalk swoosh (rewind).
## DEFAULT CHARACTERS (since EP03) — use these, not the old puppet.ts look
- `engine/src/style/stickman.ts` = STICKMAN rig v2 (approved model sheet: 99-exports/rig_v2/STICKMAN_DRAGON_RIG_v2_model_sheet.png). Layered 2D vector parts, 1000-unit body, feet auto-grounded.
  Views front/side/back; faces smile, laugh, think, surprised, worried, determined, scared, neutral, grin; gloves open, relaxed, hold, point, fist, thumb.
  Joints: armL/armR {a,b} (FK) or ikL/ikR hand targets (+ ikBendL/R), legL/legR {a,b,f,lift}, lean, headTilt, squash, air, handsOverHead, hug().
  Motion: POSES.stand / POSES.walk(phase) / POSES.run(phase) with WALK_STRIDE / RUN_STRIDE (no foot sliding). drawStickman() returns glove/head positions for held props.
- `engine/src/style/dragon.ts` = baby dragon v2 (muzzle, swept-back horns, neck, striped belly; moods; fly 0..1; sneeze headRecoil).
## Added in EP03 (2D painted-background engine)
- `engine/src/videos/ep03/engine2d.ts`: painted backgrounds as world planes (camera x/y/zoom with clamping, Catmull-Rom keys, shake/impact), stick() stamps the rig and can anchor its hands to a point (ladders, rungs).
- `engine/src/style/props2d.ts`: rocket (+ fuel gauge, window face, flame), sketchRocket (stroke-by-stroke), rope ladder (returns rung positions), pencil (gleam), wheeled robot with screen face (happy/neutral/angry/shock/blink, steam), receipt (amount), coin (spin/roll), space whale (eyes, blink, yawn/mouth, fins, spout), smoke, puff, sparkles, glow, clouds, birds, twinkling stars, sweat drops, countdown numbers.
- Patterns: hands anchored to a swinging ladder; "draw it into existence" = scribble-mask reveal of the real background over a clean plate; hose stretching from a pump; receipt printing; coin drop + thud + wobble + roll into a crater; creature rising, yawning and gulping a prop.
