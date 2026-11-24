# EP11 plan: "Stickman's hoodie came alive" (35.0 s, 1050 frames). Voice 34.15 s (Kokoro am_michael).
User asked to build the whole episode at once ("rovnou udělej celou ep"), so the plan is recorded here and built without a wait.

| # | time | line | set | action |
|---|------|------|-----|--------|
| S1 | 0-3.65 | hoodie came alive... ran away | bedroom (HomeSet), size B, hook | eyes + grin open on his hoodie, it wriggles and tugs him; WHAT IF? text |
| S2 | 3.65-6.75 | wriggled off his back, out the window | bedroom wide, window | hoodie pops off (puff), he is in a T-shirt, the hoodie hops out of the window |
| S3 | 6.75-10.25 | chased it through the park in his T-shirt | park (World day, trees, bench) | tracking run, hoodie scurries ahead |
| S4 | 10.25-14.05 | grabbed a kite, floated over the rooftops | park edge + Town behind | kid with kite, hoodie grabs the string, floats up over the roofs |
| S5 | 14.05-18.0 | drew a ladder with his pencil. Too short! | park | magic-pencil ladder (DrawStrokes -> Ladder), climbs, reaches: too short |
| S6 | 18.0-22.0 | cold wind... sneezed. ACHOO! | park, wind | leaves blow, shivers on the ladder, big sneeze |
| S7 | 22.0-26.0 | hoodie froze, looked down at its friend | sky / park | hoodie close in the sky, sad eyes, he shivers below |
| S8 | 26.0-30.0 | dove and wrapped him up. Warm again. | park | hoodie dives, puff, he wears it again, warm glow + hearts |
| S9 | 30.0-35.0 | Best friends... until his backpack growled | bedroom = hook framing | hoodie winks, backpack gets eyes + growls; last frame = first frame |

Reuse: rig v2 Stickman, HomeSet, World/Grass/WindTree/Bench/Flowers, Town, DrawStrokes + Ladder, PuffRing, MagicSparkles, FrontBed, captions, music_bed, SFX library.
Build (reusable): T-shirt outfit (Outfit.tee), hoodie/backpack faces on the rig (rig.hoodieFace / rig.bagFace), LivingHoodie character (kit/hoodie.tsx), Kite prop, wind SFX.
Risks: render time on 4 CPU cores (2160x3840 supersampling); hero size rule in sky shots (keep Stickman in every shot, hoodie in the upper frame).
