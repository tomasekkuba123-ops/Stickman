# ENGINE.md — the Stick3D engine kit (v12)

Everything a new episode needs is in `engine/src/kit/` (import from `"../kit"`) plus the tools in `tools/` and the pipeline in `engine/pipeline/`.
Rules it implements: `STYLE_RULES.md`, `WORLD_RULES.md`. Showreel of the kit: composition `Showreel` (`engine/src/videos/Showreel.tsx`).

## Minimal episode skeleton
```tsx
// engine/src/videos/Ep07.tsx
import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { Scene, FPS } from "./ep02/common";                         // scene wrapper with transitions (ghost/zoom/flash/whip/whipL)
import { World, Terrain, Grass, WindTree, Butterflies, Stickman, Dragon, ShotCam, autoCoverage, shotPreset, Captions, DrawStrokes, PATHS, HomeSet, HOME } from "../kit";
import CAP from "../../public/ep07/captions.json";                  // from tools/captions.py

const S1 = ({ t }: { t: number }) => (<World preset="day" t={t}>
  <ShotCam t={t} shots={autoCoverage(0, 6, { subject: [0, 0, 0] })} />   {/* new angle every ~2.5 s, Stickman 40-60 % tall */}
  <Terrain /><Grass t={t} /><WindTree p={[-5, 0, -6]} t={t} /><Butterflies t={t} />
  <Stickman p={[0, 0, 0]} t={t} action={t < 3 ? "wave" : "jump"} t0={t < 3 ? 0 : 3} />
</World>);
export const Ep07: React.FC = () => { const t = useCurrentFrame() / FPS; return (<AbsoluteFill>
  <Audio src={staticFile("ep07/mix.wav")} />
  <Scene first start={0} end={6} bg="#8ccaff">{(c) => <S1 t={c.t} />}</Scene>
  <Captions data={CAP} until={97} />
</AbsoluteFill>); };
// Root.tsx:  <EpisodeCompositions id="Ep07" component={Ep07} seconds={100} />   -> Ep07 (final) + Ep07Animatic (12 fps)
```

## kit/character.tsx — characters + ACTION LIBRARY
`<Stickman p t action t0 face dir move prop rig h>`: rig v2 hero on a yaw billboard, automatic contact shadow (shrinks when airborne), rim light from the `<World>` preset, auto blink,
overlapping motion (hair, hood strings, backpack lag via `rig.drag`, computed from the action's own velocity). `prop="pencil" | "pencilUp" | "chalk"` puts a pencil in his right glove.
`move` applies the action's travel (walk/run/tiptoe/swim/push/pull) along `dir` (+1 = screen right).
Actions (`ACTIONS`): idle, walk, run, tiptoe, jump, land, fallOnBottom, float, swimInAir, climb, push, pull, point, drawInAir, write, pickUp, hold, hug, wave, thumbsUp,
celebrate, panic, freezeShock, scaredShake, think, facepalm, laugh, sneezeReact. Each has anticipation and squash/stretch. Override anything per beat with `face=` or `rig={...}`.
`rigAt(name, t, t0)` gives the raw rig if you draw him yourself. `ACTION_SFX` / `rules/SFX_MAP.json` = the SFX for each action.
`<Dragon p t action>`: idle, fly, happy, sneeze, scared, sleepy, wow.

## kit/world.tsx — WORLD KIT
`<World preset t bloom rays fog>`: presets `morning, day, sunset, night, magic, space` (`SKY` table: sky gradient, stars, sun, fill light, fog, rim colour). Real bloom via postprocessing.
Terrain: `<Terrain>` + `terrainY(x,z)` for placing things on it; `<Grass>` (instanced, wind), `<Flowers>`, `<Rocks>`; `<WindTree kind="round|pine|blossom">`, `<Bush>`; `<Clouds>`;
`<Water>` (animated ripples, sky reflection, sparkles) + `<Ripples>`; `<GodRays>`. Ambient life: `<Birds> <Butterflies> <Fireflies> <DustMotes> <FallingLeaves> <TwinkleStars>`.
Depth of field: `<Foreground kind="leaves|grass|bokeh|frame">` — put it in the AbsoluteFill ABOVE the Scene (blurred framing layer with parallax).
HOME SET: `<HomeSet t preset paper>` (bedroom from EP03 remake) with `HOME.hero`, `HOME.heroSide`, `HOME.paper`, `HOME.window`, `HOME.bed`.
More proven sets/props: `style/set3d.tsx` (Bedroom, DrawingPaper, MoonSet + gas station, Rocket3D + RopeLadder, Robot3D, Coin3D, Whale3D, WhaleBelly, Satellite3D, Smoke...), `style/sky.tsx` (islands, castle, bridge, windmill, dragon 3D bits), `style/extra.tsx` (city, casino, stage props).

## kit/fx.tsx — FX LIBRARY
`<DrawStrokes paths prog style="pencil|chalk|magic">` + `PATHS` (rocket, door, circle, star, heart, house); `<MagicSparkles>`, `<MagicGlow>`, `<Smoke>` (soft shaded puffs, lit),
`<Sparks>`, `<DustImpact>`, `<Splash>`, `<ExplosionPuff>`; overlays `<SpeedLines mode="radial|down|side">`, `<ImpactFrame t0>`; `shakes([t,"small"|"big"|"huge"])` for `<ShotCam impacts>` (impacts only).

## kit/camera.tsx — CAMERA SYSTEM
`shotPreset(kind, t0, t1, { subject, side, frac, target })` kinds: wide, medium, closeUp, lowAngle, overShoulder, tracking, orbit, crane, pushIn.
Auto-framing: distance from FOV so Stickman fills `frac` of the frame (defaults 0.4-0.55, close-up = head + chest). Every preset moves (drift / push / orbit).
`autoCoverage(t0, t1, { subject })` cuts to a new angle every ~2.5 s. `<ShotCam t shots impacts>` plays them. Subject can be a function of time (tracking).

## kit/captions.tsx + tools/captions.py — CAPTIONS
`tools/captions.py words.json script.txt <epdir> --mask out/epXX/mask.json [--keywords A,B]` -> `captions.json` + `CAPTIONS.srt`; each 1-2 word group gets the band
(low y=1450 / high y=230) that does not cover his face (hard rule) or his body/hands (soft rule), measured on the animatic QC mask. `<Captions data={CAP}>` renders them, key words yellow.

## AUDIO
`tools/voice_fit.py voice.wav script.txt 100 <epdir>` — HeyGen WAV -> lines found by forced alignment, pauses inserted at the quietest points to hit EXACTLY 60/100 s
(end-card tail kept), normalised, words.json shifted exactly. `tools/auto_sfx.py actions.json events.json` (SFX tied to actions), `tools/music_bed.py` (moods: playful, soar, tense, quirky, mystery, warm),
`tools/mix_episode.py voice events music mix.wav` -> -14 LUFS / TP <= -1 dBTP (measured + iterated). Signature sound: `sfx/magic_pencil.wav` (always used; added automatically if missing).

## PIPELINE (engine/pipeline/)
1. `animatic.sh <Id> <sec> <out> [mix.wav]` — 540x960 @ 12 fps for approval + `qcmask.sh` (Stickman magenta/green mask, 270x480) -> mask.json
2. `final.sh <Id> <frames> <out> <mix.wav> [--redo a-b]` — 1080x1920 @ 30 fps in resumable parts, concat + mux -> out/final.mp4
3. `deliver.sh <Id> <sec> <out> <epdir>` — `tools/qc_check.py` must PASS (exit 1 = FAIL with fix ranges), then `tools/publish_kit.py` (titles, description, hashtags, thumbnail).
QC mask mode = input prop `{"qcmask":true}` (`kit/qc.ts`): billboards painted flat, captions/overlays hidden. Anything new that draws Stickman must call `maskify()` when `QC` is true.
