// 10-second SHOWREEL of the engine kit: world presets, ambient life, water, god rays, bloom, DOF foreground, actions, dragon, FX, home set.
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Scene, FPS } from "./ep02/common";
import { World, Terrain, Grass, Flowers, Rocks, WindTree, Bush, Clouds, Water, Ripples, Birds, Butterflies, Fireflies, FallingLeaves, Foreground, HomeSet, HOME, terrainY } from "../kit/world";
import { Stickman, Dragon } from "../kit/character";
import { DrawStrokes, PATHS, MagicSparkles, MagicGlow, DustImpact, ExplosionPuff, Smoke, SpeedLines, ImpactFrame, Splash, shakes } from "../kit/fx";
import { ShotCam, shotPreset } from "../kit/camera";
import { V3 } from "../style/kit";

const CUT = [0, 1.7, 3.4, 5.0, 6.7, 8.3, 10];
const LABELS = [["WORLD KIT", "day sky · terrain · instanced grass + flowers · wind trees · birds · butterflies", "wave"],
  ["SUNSET", "water + ripples · reflections · god rays · baby dragon", "jump · land + dust"],
  ["NIGHT", "fireflies · twinkling stars · falling leaves · DOF foreground", "think"],
  ["MAGIC", "draw-in-air · sparkles · glow · bloom", "draw-in-air"],
  ["SPACE", "zero-G float · smoke · explosion puff · speed lines · impact frame", "float"],
  ["HOME SET", "Stickman's bedroom · dust motes · light rays", "celebrate · thumbs-up"]];
const P0: V3 = [0, 0, 0];
const g = (x: number, z: number): V3 => [x, terrainY(x, z), z];

const Seg1 = ({ t }: { t: number }) => { const P = g(0, 0); return (<World preset="day" t={t} bloom={0.4}>
  <ShotCam t={t} shots={[shotPreset("orbit", 0, 1.9, { subject: P, side: 0.5 })]} />
  <Terrain /><Grass t={t} c={[0, 0, -2]} area={[24, 18]} n={2200} /><Flowers t={t} c={[0, 0, -2]} /><Rocks />
  {[[-5, -6, 1], [6, -9, 2], [-9, -14, 3], [3, -18, 4], [11, -16, 5]].map(([x, z, sd]) => <WindTree key={sd} p={g(x, z)} t={t} seed={sd} s={1.1} kind={sd === 3 ? "pine" : "round"} />)}
  <Bush p={g(-2.6, -2.5)} t={t} flowers="#ff6aa8" /><Bush p={g(3, -3)} t={t} seed={4} />
  <Clouds t={t} preset="day" /><Birds t={t} c={[0, 9, -20]} r={10} /><Butterflies t={t} c={[0.5, 1.6, -0.5]} area={3} />
  <Stickman p={P} t={t} action="wave" t0={0.1} />
</World>); };
const Seg2 = ({ t }: { t: number }) => { const P = g(-1.5, 1); return (<World preset="sunset" t={t} rays={0.14} bloom={0.6}>
  <ShotCam t={t} shots={[shotPreset("wide", 1.7, 3.6, { subject: P, side: -0.5, frac: 0.42 })]} impacts={shakes([2.66, "small"])} />
  <Terrain color="#7ac85a" color2="#c8a85a" /><Grass t={t} c={[-2, 0, 0]} area={[14, 10]} n={1400} colors={["#8ac84a", "#c8b84a", "#6ab84a"]} />
  <Water p={[3, 0.05, -5]} s={[14, 10]} t={t} color="#ff8a6a" sky="#ffd0a0" /><Ripples c={[2.2, 0.06, -3]} t={t} t0={2.0} />
  <WindTree p={g(-6, -6)} t={t} kind="blossom" seed={2} s={1.3} /><WindTree p={g(-9, -12)} t={t} kind="blossom" seed={5} />
  <Dragon p={[1.6, 2.2 + Math.sin(t * 2) * 0.2, -1.5]} t={t} action="fly" h={2.2} />
  <Stickman p={P} t={t} action="jump" t0={1.8} dur={1.1} /><DustImpact c={P} t={t} t0={2.66} />
  <Splash c={[2.2, 0.06, -3]} t={t} t0={2.0} />
</World>); };
const Seg3 = ({ t }: { t: number }) => { const P = g(0, 0); return (<World preset="night" t={t} bloom={0.8}>
  <ShotCam t={t} shots={[shotPreset("pushIn", 3.4, 5.2, { subject: P, side: 0.3 })]} />
  <Terrain color="#1e5a4a" color2="#2a4a6a" /><Grass t={t} n={1600} area={[18, 14]} colors={["#2a6a4a", "#3a7a5a", "#1e5a4a"]} />
  {[[-5, -5, 1], [5, -7, 2], [-8, -12, 3]].map(([x, z, sd]) => <WindTree key={sd} p={g(x, z)} t={t} seed={sd} />)}
  <Fireflies t={t} c={[0, 1.6, -1]} area={[9, 3, 6]} n={30} /><FallingLeaves t={t} c={[0, 6, -1]} />
  <Stickman p={P} t={t} action="think" t0={3.45} />
</World>); };
const Seg4 = ({ t }: { t: number }) => { const P = g(-1, 0.5), prog = Math.min(1, Math.max(0, (t - 5.15) / 1.2)); return (<World preset="magic" t={t} bloom={1.1}>
  <ShotCam t={t} shots={[shotPreset("medium", 5.0, 6.9, { subject: [-0.2, P[1], 0.5], side: 0.25, frac: 0.46 })]} />
  <Terrain color="#8a5ad8" color2="#c86ad8" /><Grass t={t} n={1400} area={[16, 12]} colors={["#a87af0", "#c88af0", "#8a6ad8"]} />
  <DrawStrokes p={[0.9, 2.2, 0.4]} s={[1.8, 1.8]} paths={PATHS.star} prog={prog} t={t} style="magic" fill="rgba(255,236,120,0.25)" fillK={Math.max(0, (t - 6.35) * 3)} />
  <MagicSparkles t={t} c={[0.9, 2.2, 0.6]} area={[1.6, 1.6, 0.4]} /><MagicGlow p={[0.9, 2.2, 0.6]} r={0.9} t={t} />
  <Dragon p={[2.6, terrainY(2.6, -1.5), -1.5]} t={t} action="happy" h={1.4} />
  <Stickman p={P} t={t} action="drawInAir" t0={5.05} prop="pencil" />
</World>); };
const Seg5 = ({ t }: { t: number }) => { const P: V3 = [0, 0, 0]; return (<World preset="space" t={t} fog={false} bloom={0.9}>
  <ShotCam t={t} shots={[shotPreset("orbit", 6.7, 8.5, { subject: P, side: -0.3, frac: 0.42 })]} impacts={shakes([7.25, "big"])} />
  <mesh position={[0, -60, -30]}><sphereGeometry args={[52, 48, 32]} /><meshToonMaterial color="#c8c4dc" /></mesh>
  <ExplosionPuff c={[3.5, 3, -6]} t={t} t0={7.25} s={1.2} />
  <Smoke src={[-3, 2, -4]} t={t} t0={6.7} rate={6} vel={[0.4, 0.6, 0]} size={0.5} life={2} color="#d8d0e8" />
  <Stickman p={P} t={t} action="float" t0={6.7} shadow={false} />
</World>); };
const Seg6 = ({ t }: { t: number }) => (<>
  <ShotCam t={t} shots={[shotPreset("medium", 8.3, 10.1, { subject: HOME.heroSide, side: 0.25, frac: 0.5 })]} />
  <HomeSet t={t} paper={{ body: 1, fin1: 1, fin2: 1, win: 1 }} />
  <Stickman p={HOME.heroSide} t={t} action={t < 9.2 ? "celebrate" : "thumbsUp"} t0={t < 9.2 ? 8.35 : 9.2} />
</>);

export const Showreel: React.FC = () => {
  const t = useCurrentFrame() / FPS; const i = CUT.findIndex((c, k) => t >= c && t < CUT[k + 1]); const L = LABELS[Math.max(0, i)];
  return (<AbsoluteFill style={{ background: "#000" }}>
    <Scene first start={CUT[0]} end={CUT[1]} bg="#8ccaff">{(c) => <Seg1 t={c.t} />}</Scene>
    <Scene start={CUT[1]} end={CUT[2]} bg="#ff9a6a" trans="whip">{(c) => <Seg2 t={c.t} />}</Scene>
    <Scene start={CUT[2]} end={CUT[3]} bg="#122060" trans="flash">{(c) => <Seg3 t={c.t} />}</Scene>
    <Scene start={CUT[3]} end={CUT[4]} bg="#8a3ad8" trans="whipL">{(c) => <Seg4 t={c.t} />}</Scene>
    <Scene start={CUT[4]} end={CUT[5]} bg="#05051a" trans="flash">{(c) => <Seg5 t={c.t} />}</Scene>
    <Scene start={CUT[5]} end={CUT[6]} bg="#f0a870" trans="whip">{(c) => <Seg6 t={c.t} />}</Scene>
    {t >= CUT[2] && t < CUT[3] ? <Foreground t={t} kind="leaves" side="left" blur={9} /> : null}
    {t >= CUT[2] && t < CUT[3] ? <Foreground t={t} kind="bokeh" blur={6} /> : null}
    {t >= CUT[4] && t < CUT[5] ? <SpeedLines t={t} k={0.6} mode="radial" /> : null}
    <ImpactFrame t={t} t0={7.25} />
    <div style={{ position: "absolute", left: 44, top: 120, right: 44, fontFamily: "Inter, Arial", fontWeight: 900, color: "#ffd23a", fontSize: 92, WebkitTextStroke: "14px #0b0d1a", paintOrder: "stroke fill" }}>{L[0]}</div>
    <div style={{ position: "absolute", left: 44, top: 240, right: 44, fontFamily: "Inter, Arial", fontWeight: 900, color: "#fff", fontSize: 46, lineHeight: 1.15, WebkitTextStroke: "9px #0b0d1a", paintOrder: "stroke fill" }}>{L[1]}</div>
    <div style={{ position: "absolute", left: 44, bottom: 150, right: 44, textAlign: "center", fontFamily: "Inter, Arial", fontWeight: 900, color: "#fff", fontSize: 64, WebkitTextStroke: "12px #0b0d1a", paintOrder: "stroke fill" }}>ACTION: <span style={{ color: "#ffd23a" }}>{L[2].toUpperCase()}</span></div>
  </AbsoluteFill>);
};
void P0;
