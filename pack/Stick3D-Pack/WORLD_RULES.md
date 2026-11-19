# WORLD_RULES.md — 3D world quality rules (MANDATORY for every episode, together with STYLE_RULES.md)

Every location is a REAL 3D SET built in code with the WORLD KIT (`engine/src/kit/world.tsx`). No external / ChatGPT / stock images, ever.

1. **Real 3D sets, never flat backdrops.** No 2D picture cropped by the camera, no single painted plane behind the characters.
   A set has a floor/terrain you can see the characters stand on, walls/horizon, and objects you can walk around.
2. **Three depth layers in every shot:** foreground (framing elements: leaves, grass, window edge, bokeh — `Foreground`, blurred = depth of field),
   midground (Stickman + the action), background (sky dome, far hills/buildings/planets, clouds). The camera must reveal depth by moving (parallax).
3. **Sky + light from a preset** (`<World preset="morning|day|sunset|night|magic|space">`): sky dome, sun/moon glow, key light + coloured fill,
   fog/haze for aerial perspective, optional god rays, bloom on bright/magic parts. The character rim light follows the preset automatically.
4. **Toon look, everywhere the same:** ink outlines on solid props, 3-step toon shading, soft contact shadows under everything that touches the ground,
   saturated colours with one dominant hue per scene and a complementary accent.
5. **Rich, purposeful detail:** 15-20 props per set that belong to the place (bedroom: desk, window city, shelves, lamp, rug, posters, bed, plant...).
   No empty rooms, no placeholder primitives (a "rock" is an outlined faceted rock, a "tree" sways in the wind, water has ripples and reflections).
6. **Ambient life in every exterior:** at least two of birds, butterflies, fireflies, dust motes, falling leaves, twinkling stars, drifting clouds,
   swaying grass/trees. Interiors get dust motes in light rays.
7. **Scale and readability:** giant things are shown next to Stickman for scale; Stickman always reads clearly against the background
   (value contrast, rim light, no busy pattern behind his face).
8. **Effects are real-looking** (`kit/fx.tsx`): soft shaded smoke puffs that dissipate and are lit by fire, sparks, dust impacts, splashes,
   explosion puffs, glow + sparkles for magic. Camera shake only on big impacts (`shakes()`), impact frames only for the biggest hit.
9. **Continuity:** the same set keeps the same layout across cuts (props do not jump), lighting direction stays consistent, time of day changes are motivated.
11. **Set dressing is mandatory:** every location gets `<SetDressing>` (20-40 props in foreground / midground / background). Rooms: wall texture (wallpaper/planks), skirting, framed window with curtains,
   full shelves, posters, plants, cables, small clutter. Moon/planets: curved horizon, rocks, crater rims with highlights, footprints, distant mountains. Space: nebula clouds, planets, star layers at different depths (`SpaceBackdrop`).
12. **Creatures are proper models** (`kit/creatures.tsx`): body shape, fins/limbs, a mouth that really opens (teeth, tongue, inside), belly detail, highlights; always shown next to Stickman for size.
    A swallow/gulp uses `gulpAt()`: the object visibly flies INTO the mouth and the jaw shuts after it.
13. **Smoke/dust/clouds = `CloudPuff` only** (`kit/puff.tsx`) — never plain circles.
14. **Draw-it-real** (`DrawItReal`): what Stickman draws appears line by line at its final position, fills with colour, then becomes 3D. Never a floating icon.
15. **Key moments** (landings, arrivals, reveals) use `keyMoment()` / `twoShot` so the object AND Stickman are clearly readable.
16. **His head stays white:** no full-frame colour tint overlays (use `SafeGrade`), colour mood comes from `<World>` lights; QC check H enforces it.
10. **The HOME SET** (Stickman's bedroom, `<HomeSet>`) opens or closes episodes when the story allows — it is the channel's recognisable place.

Performance notes (CPU renderer): keep instanced grass <= 2500 blades per shot, bloom <= 1.2, shadows are fake contact blobs (`Shadow`), sky dome radius 150 (camera far = 200).
