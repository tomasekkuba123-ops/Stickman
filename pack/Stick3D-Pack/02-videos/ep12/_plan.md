# EP12 plan: "Stickman's backpack woke up STARVING" (35.0 s, 1050 frames). Voice 34.08 s (Kokoro am_michael).
Continues EP11's cliffhanger (the backpack growled). The user asked to start the next episode as soon as EP11 was done and to keep working without stopping, so the plan is recorded here and built without a wait.

| # | time | line | set | action |
|---|------|------|-----|--------|
| S1 | 0-3.7 | backpack woke up... STARVING | bedroom (HomeSet), size B, hook | bag face opens on his back, growl; it pops off onto the desk, mouth wide, tongue out; WHAT IF? text |
| S2 | 3.7-8.1 | gobbled homework, crayons, alarm clock | bedroom desk (size A, 2 angles) | each item flies from the desk into its mouth (chomp + gulp), he grabs at them |
| S3 | 8.1-11.5 | sniffed the air, hopped out the door | bedroom wide, new door on the left wall | scent wisps, sniff, it hops across the floor, door swings open, gone; he runs after it |
| S4 | 11.5-14.9 | chased it all the way to the bakery | street (Street set) | side tracking run, backpack hopping ahead, stops at the bakery front |
| S5 | 14.9-18.6 | opened wide... swallowed a whole cake | bakery front (new BakeryFront) | cake on the display table, mouth stretches huge, cake gone, gulp |
| S6 | 18.6-22.6 | drew a giant cookie with the magic pencil | bakery front | DrawStrokes cookie -> real giant cookie on the pavement |
| S7 | 22.6-25.7 | ate it in one bite. CRUNCH! | bakery front | one chomp, crumb burst, camera shake |
| S8 | 25.7-30.1 | burped... out flew homework, crayons, clock | bakery front | burp puff, the three items pop out and land in his arms; backpack hops onto his back |
| S9 | 30.1-35.0 | peace at last... until his sneakers started to dance | bedroom = hook framing | content bag (sleepy face), then his sneakers tap on their own (music notes); settles to frame 0 |

Reuse: rig v2 Stickman (backpack: false while the bag is loose; bagFace), HomeSet, Street + Building, DrawStrokes + magic pencil, PuffRing, MagicSparkles, FrontBed, captions, music_bed, SFX library.
Build (reusable): kit/backpack.tsx = LivingBackpack (eyes, big mouth with teeth + tongue, strap legs, chew/gulp/burp poses), food + desk props (Homework, Crayons, AlarmClock, Cake, GiantCookie, Crumbs), BedroomDoor, BakeryFront, COOKIE_PATH; tools/make_sfx_food.py (chomp, gulp, crunch, burp, sniff, boing, tap).
Risks: render time (2160x3840 supersampling, ~8 h); the loose backpack is small next to him: keep it in the lower-middle third, never in the caption bands; sky props none this time.
