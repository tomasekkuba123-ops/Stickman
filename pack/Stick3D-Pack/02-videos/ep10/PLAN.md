# EP10 plan: "The Floor Is Lava" (Bloxie)
Length: about 28-32 s with Kokoro am_michael at speed 1.0 (under the 40 s cap). 9:16, 1080x1920, 30 fps.
Loop: "Oh no! Not again!" ends on the floor cracking orange, which matches frame 1, so the Short loops.

## Scenes (times are estimates; Whisper timestamps will set the real ones)
| # | Time | Line | Picture | Camera |
|---|------|------|---------|--------|
| 0 | 0.0-1.5 | (hook) | Frame 1: lava cracks glowing under his feet, text "THE FLOOR IS LAVA!" | low angle push-in |
| 1 | 0-2.5 | perfectly normal day | Calm meadow/HomeSet, he sips a drink and stretches; one crack glows | slow drift |
| 2 | 2.5-4.5 | floor turned into lava | Floor splits, lava rises, smoke puffs, scared pose | crane up, short shake |
| 3 | 4.5-6.5 | Quick, Bloxie! Jump! | Hops across stepping stones (jump clip, squash/stretch) | side tracking |
| 4 | 6.5-9.5 | one more jump | Big gap, anticipation crouch, slow-mo leap, lands | orbit, FOV punch-in |
| 5 | 9.5-11 | A wooden bridge! | Rope-and-plank bridge over lava, surprised face | pull-back reveal |
| 6 | 11-14 | falling apart! Run! | Planks drop into lava behind him as he runs (run clip) | follow cam |
| 7 | 14-15.5 | Phew! | Safe ledge, wipes brow, sits | medium |
| 8 | 15.5-17.5 | reset button? | Big red button on a pedestal, glow + sparkle | push-in on button |
| 9 | 17.5-19 | It worked! | Presses it; lava drains, grass returns, celebrate clip | whip to wide |
| 10 | 19-21 | Finally, he's safe | Relaxes in calm world (same layout as scene 1) | drift |
| 11 | 21-23.5 | A duck? | Duck waddles in, quacks, he is confused | two-shot |
| 12 | 23.5-26 | Don't touch that! | Duck pecks the button, he lunges with a reaching arm | fast push-in |
| 13 | 26-end | Not again! | Rumble, cracks glow orange again (matches frame 1) | low angle, loop seam |

## Reuse
Stickman puppet + fit.json, motion clips (jump, run, scared, celebrate, sit, point), World presets, fx (Smoke/CloudPuff, Sparks, DustImpact, MagicSparkles), camera presets, captions, music_bed.py, SFX (rumble, impact, thud, whoosh, click, success, sparkle, pop).

## New builds (saved to the kit for reuse)
- `LavaFloor`: animated glowing lava with crust and bubbles, plus a crack-spread effect.
- Stepping stones, a collapsing plank bridge (planks fall with physics arcs and splash in lava), a reset-button pedestal.
- Duck model for `animals.tsx` (waddle, quack beak, peck).
- SFX synthesized: lava bubble/sizzle, wood creak/snap, button press, quack.

## Risks
- The script names the hero "Bloxie", but the channel hero is Stickman (see question 1).
- No "WHAT IF...?" question; I'd use "THE FLOOR IS LAVA!" as the hook text.
- Lava glow could tint his white head; I'll keep it on lights only (SafeGrade, QC check H).
- Plank-fall physics and the duck are the biggest new pieces, so they get previews first.
