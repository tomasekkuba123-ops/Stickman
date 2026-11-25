# KIDS EP01 — "What If Stickman Shrank?" (standalone, 40 s)

Format: 9:16, 1080x1920, 30 fps, 40.0 s (1200 frames). Kokoro voice (channel voice unless the user picks another), Whisper timing, word captions, synth SFX + music bed, -14 LUFS, seamless loop.
Hook (0–1.5 s): big text **"WHAT IF I SHRANK?"** + Stickman mid-sneeze, camera snaps down to ground level.
Loop: last line ends with his nose twitching (pre-sneeze) at full size in the same garden framing as frame 0 -> the hook sneeze continues it.

| # | time (approx) | line | shot / action |
|---|---|---|---|
| 1 | 0.0–3.0 | What if Stickman shrank… | Garden, full size, nose twitch -> hook text, camera dips |
| 2 | 3.0–6.0 | Achoo! … pop! He's tiny! | sneeze, PuffRing pop, camera crashes down to ant scale |
| 3 | 6.0–8.5 | grass taller than trees | low angle, giant grass blades swaying above him, he looks up (wow) |
| 4 | 8.5–11.5 | Buzz! A ladybug lands | ladybug flies in, lands, dust puff; he jumps back (surprised) |
| 5 | 11.5–14.0 | Hi there! Can I ride… | waves, ladybug nods |
| 6 | 14.0–16.5 | climbs on, up they fly | climb + take-off, whip2 |
| 7 | 16.5–19.5 | giant flower, sleepy snail | flight track over a huge flower and a snail (Zz) |
| 8 | 19.5–23.5 | raindrop as big as a beach ball | a wobbling drop falls, he points, scared |
| 9 | 23.5–27.0 | Splash! waterslide. Wheee! | splash, he slides down a curved leaf, celebrate |
| 10 | 27.0–29.5 | Boing! fluffy dandelion | squash & stretch landing on a dandelion head, seeds float |
| 11 | 29.5–31.5 | nose starts to tickle | close-up, a seed tickles his nose |
| 12 | 31.5–34.0 | Achoo! Pop! big again | sneeze, pop ring, camera rises to full scale |
| 13 | 34.0–37.0 | ladybug waves. Bye! | he waves down at the tiny ladybug on a flower |
| 14 | 37.0–40.0 | What would YOU do…? | asks the viewer, then nose twitch = frame 0 |

## Reuse
Puppet + action library, gestures, Garden8 / Grass / Flowers / WindTree / Bush, PuffSmoke/PuffRing, Splash, DustImpact, Motes, Cam, DepthPass, WordCaptions, Scene transitions, sfx/ library (pop, whoosh, boing, splash...), music_bed.py.

## To build (new, reusable)
- `kit/sets6.tsx` MiniGarden: giant grass blades, a giant flower, a curved leaf slide, a dandelion head, a raindrop (wobble shader), for an ant-scale world (same assets also at normal scale).
- Animals: `ladybug` (flying wings + walk) and `snail` (sleeping) in `style/critters2.ts` + animals.tsx.
- SFX synth: sneeze (achoo), buzz, tickle, waterdrop, boing if missing.

## Risks
- Scale change: the hero stays the same size in frame; the world grows (QC scale check stays consistent).
- Riding the ladybug: hero sits on the ladybug -> sit pose; keep both in frame.
- 40 s limit: if the voice runs long, cut the snail.
