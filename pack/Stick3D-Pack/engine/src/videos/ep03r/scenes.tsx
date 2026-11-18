// EP03 REMAKE (3D, EP02 style): "What if Stickman drew a rocket". Every set is a real 3D scene; rig v2 hero on billboards.
import React from "react";
import * as THREE from "three";
import { Cam, Key, Building, StreetLamp } from "../../style/extra";
import { SGlow, ChalkDraw, ROCKET_PATH, Path2 } from "../../style/sky";
import { Box, Cyl, Ball, CanvasPlane, Shadow } from "../../style/toon";
import { Ctx, seg, lerp, clamp, ease, V3 } from "../ep02/common";
import { Rig, POSES } from "../../style/stickman";
import {
  HeroV2, Extra2D, gloveOffset, pencil2D, Smoke, PuffBurst, Sparks, Rocket3D, RopeLadder, ladderPts, AltDome, GradientDome, Cloud3D, Earth,
  Bedroom, DrawingPaper, PAPER, MoonSet, PAD, KIOSK, PUMP, CRATER, Robot3D, Receipt3D, Coin3D, Whale3D, WhaleBelly, Satellite3D,
} from "../../style/set3d";

export const H = 3; // hero height (world units)
const TAU = Math.PI * 2;
// pick the active shot (hard cut) — each shot is a Catmull-Rom key list
const shot = (t: number, list: [number, Key[]][]) => { let k = list[0][1]; for (const [t0, ks] of list) if (t >= t0) k = ks; return k; };
const K = (t: number, pos: V3, look: V3, fov = 50, roll = 0): Key => ({ t, pos, look, fov, roll });
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

/* ---------- rigs ---------- */
const stand = (t: number, face: Rig["face"], ex: Partial<Rig> = {}): Rig => ({ ...POSES.stand(t * 30), view: "front", face, ...ex } as Rig);
const hang = (t: number, face: Rig["face"], ex: Partial<Rig> = {}): Rig => { const sw = Math.sin(t * 3.2);
  return { t: t * 30, view: "front", face, armL: { a: 170, b: -6 }, armR: { a: 170, b: -6 }, handL: "hold", handR: "hold", legL: { a: 6 + sw * 8, b: 0, lift: 30 + 20 * Math.max(0, sw) }, legR: { a: 6 - sw * 8, b: 0, lift: 30 + 20 * Math.max(0, -sw) }, grounded: false, ...ex } as Rig; };
const run = (t: number, flip: boolean, face: Rig["face"] = "determined", ex: Partial<Rig> = {}): Rig => ({ ...POSES.run(t * 2.6), t: t * 30, flip, face, ...ex } as Rig);
const walk = (t: number, flip: boolean, face: Rig["face"] = "smile", ex: Partial<Rig> = {}): Rig => ({ ...POSES.walk(t * 1.4), t: t * 30, flip, face, ...ex } as Rig);

/* ---------- rocket + ladder + hanging hero ---------- */
const ladderTop = (rp: V3, s: number): V3 => [rp[0] + 1.05 * s, rp[1] - 0.25 * s, rp[2] + 0.25 * s];
type RocketRigProps = { t: number; rp: V3; s?: number; flame?: number; rig?: Rig | null; L?: number; k?: number; sway?: number; gauge?: number; face?: number; faceMood?: "scared" | "smile" | "wow"; extra?: Extra2D; rim?: string; tilt?: number; smoke?: boolean; smokeVel?: V3; lit?: number };
export const RocketRig: React.FC<RocketRigProps> = ({ t, rp, s = 1.5, flame = 1, rig, L = 3.6, k = 0.82, sway, gauge, face, faceMood, extra, rim = "255,190,120", tilt = 0, smoke = true, smokeVel = [0, -5, 0], lit = 1 }) => {
  const sw = sway ?? Math.sin(t * 2.3) * 0.12; const top = ladderTop(rp, s), rung = ladderPts(top, L, sw, k);
  const gy = rig ? gloveOffset(rig, H)[1] : 0;
  return (<>
    <Rocket3D p={rp} s={s} t={t} flame={flame} gauge={gauge} face={face} faceMood={faceMood} rot={[0, 0.35, tilt]} />
    <RopeLadder top={top} L={L} sway={sw} n={8} />
    {rig ? <HeroV2 p={[rung[0], rung[1] - gy, rung[2] + 0.3]} h={H} rig={rig} rim={rim} extra={extra} shadow={false} /> : null}
    {smoke && flame > 0.05 ? <Smoke src={add(rp, [0, -1.0 * s, 0])} t={t} t0={t - 3} rate={9} vel={smokeVel} spread={0.9} size={0.75 * s} life={1.6} lit={lit} seed={3} max={16} /> : null}
  </>);
};

/* ---------- sky world: rocket fixed at origin, clouds stream downward ---------- */
const SkyWorld: React.FC<{ t: number; alt: number; speed?: number; clouds?: number; earth?: number; lateral?: number }> = ({ t, alt, speed = 9, clouds = 1, earth = 0, lateral = 0 }) => (<>
  <ambientLight intensity={1.05} /><directionalLight position={[6, 8, 8]} intensity={1.3} color={alt < 0.5 ? "#fff0d8" : "#d8e4ff"} /><directionalLight position={[-6, -2, 4]} intensity={0.5} color="#ffb070" />
  <AltDome alt={alt} />
  {clouds > 0 ? Array.from({ length: 16 }, (_, i) => { const span = 60, y = ((((i * 7.3 + 20) - t * speed) % span) + span) % span - span / 2; const x = (i % 2 ? 1 : -1) * (2.5 + (i * 2.7) % 9) + Math.sin(i) * 2 - lateral * ((t * speed * 0.6 + i * 5) % 30 - 15);
    return <Cloud3D key={i} p={[x, y, -2 - (i * 3.1) % 16]} s={0.9 + (i % 4) * 0.35} seed={i + 2} o={clouds} tint={alt > 0.6 ? "#c8d0ff" : "#ffffff"} />; }) : null}
  {earth > 0 ? <Earth p={[0, -95 + (1 - earth) * -40, -40]} r={70} rotY={t * 0.04} /> : null}
</>);

/* ===================== S1 HOOK 0–2.45 : rocket bursting up through clouds, Stickman clinging (big word LIFTOFF!) ===================== */
const K1: Key[] = [K(0, [4.6, -7.6, 6.4], [1.2, -3.0, 0], 50), K(1.2, [4.2, -6.8, 5.9], [1.2, -3.1, 0], 50), K(2.6, [3.8, -6.2, 5.5], [1.2, -3.2, 0], 52)];
export const S1 = ({ t }: Ctx) => (<>
  <Cam t={t} keys={K1} />
  <SkyWorld t={t} alt={0.15} speed={14} />
  {/* cloud bank the rocket just tore through */}
  <Cloud3D p={[-1.5, -3 - t * 6, -1]} s={1.8} seed={40} /><Cloud3D p={[3.2, -6 - t * 6, 1.5]} s={1.4} seed={41} /><Cloud3D p={[-4, -8 - t * 6, 2.5]} s={1.2} seed={42} />
  <RocketRig t={t} rp={[0, 0, 0]} s={1.5} flame={1.2} rig={hang(t, "laugh", { zeroG: 0.5 })} sway={Math.sin(t * 3) * 0.18 - 0.1} tilt={-0.05} />
</>);

/* ===================== S2 2.45–4.95 : bedroom at sunset, Stickman at desk with pencil, grin ===================== */
const HERO_DESK: V3 = [-0.55, 0, -3.65];
const drawRig = (t: number, face: Rig["face"], k: number, ex: Partial<Rig> = {}): Rig => stand(t, face, { ikR: [160 + Math.sin(t * 9) * 40 * k, 500 + Math.cos(t * 7) * 25 * k], ikKR: 1, handR: "hold", lookY: 0.6, lookX: 0.1, lean: 8, armL: { a: 14, b: 30 }, ...ex });
const K2: Key[] = [K(2.45, [-1.6, 3.6, 1.6], [-0.7, 2.0, -3.4], 50), K(4.95, [-1.3, 3.4, 0.5], [-0.6, 2.1, -3.5], 46)];
export const S2 = ({ t }: Ctx) => (<>
  <Cam t={t} keys={K2} />
  <Bedroom t={t} />
  <DrawingPaper t={t} parts={{ body: seg(t, 3.3, 4.9), fin1: 0, fin2: 0, win: 0 }} />
  <HeroV2 p={HERO_DESK} h={H} rig={t < 3.3 ? stand(t, "smirk", { ikR: [120, 760], handR: "hold", lookX: 0.3, lookY: 0.1, headTilt: -6 }) : drawRig(t, "grin", 1)} extra={pencil2D(t < 3.3 ? 0.2 : 0.5, 0.13, t < 3.3 ? 0.6 : 0, t < 3.3)} rim="255,200,140" />
</>);

/* ===================== S3 4.95–10.1 : "He sketched one fin, two fins, a round little window" ===================== */
const K3: [number, Key[]][] = [
  [4.95, [K(4.95, [0.9, 4.4, 0.4], [-0.6, 2.0, -3.2], 46), K(7.35, [0.2, 4.2, 0.0], [-0.6, 2.0, -3.3], 44)]],
  [7.35, [K(7.35, [-2.2, 2.9, 1.0], [-0.5, 2.0, -3.4], 46), K(10.2, [-1.4, 2.8, 1.4], [-0.5, 2.0, -3.4], 44)]],
];
export const S3 = ({ t }: Ctx) => { const parts = { body: 1, fin1: seg(t, 5.2, 5.9), fin2: seg(t, 6.3, 7.0), win: seg(t, 7.6, 8.6) };
  const drawing = (t > 5.1 && t < 7.1) || (t > 7.5 && t < 8.7);
  const face: Rig["face"] = t < 8.8 ? "determined" : "laugh";
  return (<>
    <Cam t={t} keys={shot(t, K3)} />
    <Bedroom t={t} />
    <DrawingPaper t={t} parts={parts} />
    {[5.9, 7.0, 8.6].map((x) => <Sparks key={x} c={add(PAPER, [0, 0.1, 0])} t={t} t0={x} n={8} v={1.6} life={0.5} color="#fff2a0" />)}
    <HeroV2 p={HERO_DESK} h={H} rig={drawing ? drawRig(t, face, 1) : stand(t, face, { ikR: t > 8.8 ? [240, 860] : [160, 620], handR: t > 8.8 ? "thumb" : "hold", lookY: t > 8.8 ? -0.1 : 0.5, lean: t > 8.8 ? -4 : 6, squash: t > 8.8 ? 0.04 * Math.exp(-(t - 8.8) * 4) * Math.sin((t - 8.8) * 20) : 0 })} extra={t > 8.8 ? undefined : pencil2D(0.5, 0.13)} rim="255,200,140" />
  </>);
};

/* ===================== S4 10.1–14.25 : paper shook, smoke poured from the bottom ===================== */
const K4: [number, Key[]][] = [
  [10.1, [K(10.1, [1.4, 2.4, -1.2], [-0.6, 1.8, -3.0], 40), K(11.3, [1.0, 2.3, -1.5], [-0.6, 1.8, -3.0], 36)]],
  [11.3, [K(11.3, [0.8, 2.2, 1.8], [-1.1, 2.1, -3.4], 50), K(14.3, [0.2, 2.0, 2.3], [-1.1, 2.3, -3.4], 52)]],
];
export const S4 = ({ t }: Ctx) => { const sh = seg(t, 10.5, 10.8), sm = t > 11.3;
  return (<>
    <Cam t={t} keys={shot(t, K4)} impacts={[[10.57, 0.02]]} />
    <Bedroom t={t} shake={sh * 0.6} />
    <DrawingPaper t={t} parts={{ body: 1, fin1: 1, fin2: 1, win: 1 }} shakeK={sh * (1 + seg(t, 12, 14))} glowK={sm ? 0.25 + 0.1 * Math.sin(t * 12) : 0} />
    {sm ? <Smoke src={add(PAPER, [0.35, 0.15, 0.1])} t={t} t0={11.3} rate={6} vel={[1.3, 0.8, -0.9]} spread={0.3} size={0.35} life={2.4} color="#e8e4f0" lit={0.35} seed={5} /> : null}
    <HeroV2 p={add(HERO_DESK, [-1.3 * seg(t, 10.5, 10.9, ease.back), 0, 0.1 * seg(t, 10.5, 10.9, ease.back)])} h={H}
      rig={stand(t, sm ? "scared" : "surprised", { lean: -10 * sh, squash: -0.05 * Math.exp(-Math.max(0, t - 10.57) * 5), ikR: [200, 700], ikL: [-220, 720], handR: "open", handL: "open", lookY: 0.7, lookX: sm ? 0.2 : 0, headTilt: sm ? -8 : 0, zeroG: 0 })} extra={undefined} rim="255,200,140" />
  </>);
};

/* ===================== S5 14.25–19.5 : THREE. TWO. ONE. (cut on every number) ===================== */
const K5: [number, Key[]][] = [
  [14.25, [K(14.25, [-1.0, 2.6, -1.2], [-1.6, 2.3, -3.5], 42), K(15.15, [-1.1, 2.6, -1.5], [-1.6, 2.3, -3.5], 38)]],
  [15.15, [K(15.15, [-2.6, 3.0, 0.6], [-1.1, 2.0, -3.3], 50), K(15.75, [-2.4, 2.9, 0.3], [-1.1, 2.0, -3.3], 48)]],
  [15.75, [K(15.75, [1.0, 0.7, 0.4], [-1.2, 2.2, -3.2], 56, 0.08), K(16.6, [0.8, 0.8, 0.8], [-1.2, 2.4, -3.2], 58, 0.06)]],
  [16.6, [K(16.6, [0.2, 2.6, 3.0], [-2.1, 1.8, -2.6], 50), K(19.6, [-0.4, 2.2, 2.4], [-2.1, 2.0, -2.6], 50)]],
];
export const S5 = ({ t }: Ctx) => { const n = t < 15.19 ? "3" : t < 15.79 ? "2" : "1", nt = t < 15.19 ? 14.36 : t < 15.79 ? 15.19 : 15.79; const rumble = seg(t, 16.0, 19.4);
  const hide = seg(t, 16.8, 17.3, ease.back);
  return (<>
    <Cam t={t} keys={shot(t, K5)} impacts={[[14.36, 0.015], [15.19, 0.02], [15.79, 0.03]]} quake={rumble * 0.025} />
    <Bedroom t={t} shake={0.6 + rumble * 1.4} />
    <DrawingPaper t={t} parts={{ body: 1, fin1: 1, fin2: 1, win: 1 }} shakeK={1 + rumble * 2} count={t < 16.6 && t > 14.3 ? n : undefined} countK={clamp((t - nt) / 0.25)} glowK={0.35 + rumble * 0.8} />
    <Smoke src={add(PAPER, [0.35, 0.15, 0.1])} t={t} t0={13} rate={6 + rumble * 4} vel={[1.4, 0.7 + rumble * 0.5, -1.0]} spread={0.3 + rumble * 0.3} size={0.35 + rumble * 0.2} life={1.6} color="#e8e4f0" lit={0.5 + rumble * 0.5} seed={5} max={30} />
    {t > 16.0 ? <Sparks c={add(PAPER, [0, 0.2, 0])} t={t} t0={16.0 + Math.floor((t - 16) * 3) / 3} n={10} v={2.2} life={0.33} color="#ffcf5a" /> : null}
    <HeroV2 p={[lerp(HERO_DESK[0] - 1.3, -2.9, hide), 0, lerp(HERO_DESK[2] + 0.1, -2.2, hide)]} h={H}
      rig={hide > 0 ? stand(t, "scared", { squash: -0.12 * hide, ikR: [140, 900], ikL: [-140, 900], handR: "open", handL: "open", lookX: 0.6, lookY: 0.3, legL: { a: 18, b: 40 }, legR: { a: 18, b: 40 } }) : stand(t, "scared", { lean: -6, ikR: [180, 740], ikL: [-180, 740], handR: "open", handL: "open", lookY: 0.7, squash: -0.03 })} rim="255,200,140" />
  </>);
};

/* ===================== S6 19.5–23.4 : rocket tore off the page, Stickman grabbed the ladder just in time ===================== */
const K6: [number, Key[]][] = [
  [19.5, [K(19.5, [0.9, 0.7, 2.0], [-1.3, 2.8, -2.8], 64, 0.05), K(21.0, [1.2, 0.7, 2.8], [-1.3, 3.6, -2.8], 66, 0.04)]],
  [21.0, [K(21.0, [4.8, 2.6, 4.2], [-1.0, 3.6, -2.6], 54), K(23.5, [4.2, 2.4, 5.0], [-0.8, 5.2, -2.6], 58)]],
];
export const S6 = ({ t }: Ctx) => { const grow = seg(t, 19.6, 20.5, ease.back), lift = seg(t, 20.5, 23.4, ease.i);
  const rp: V3 = [PAPER[0], PAPER[1] + 0.6 + grow * 1.6 + lift * 9, PAPER[2] + 0.3]; const s = 0.15 + grow * 1.15;
  const ant = seg(t, 21.15, 21.5), jump = seg(t, 21.5, 21.88, ease.o), grabbed = t > 21.88;
  const jumpP: V3 = [lerp(-2.9, rp[0] + 1.2, jump), Math.sin(jump * Math.PI) * 1.2 + jump * 1.2, lerp(-2.2, rp[2], jump)];
  return (<>
    <Cam t={t} keys={shot(t, K6)} impacts={[[19.68, 0.05], [21.88, 0.02]]} quake={0.012} />
    <Bedroom t={t} shake={1.5} />
    <DrawingPaper t={t} parts={{ body: 1, fin1: 1, fin2: 1, win: 1 }} torn={grow > 0.15 ? 1 : 0} />
    {/* torn page scraps */}
    {t > 19.7 ? [0, 1, 2, 3, 4].map((i) => { const u = t - 19.7; return <Box key={i} p={[PAPER[0] + (i - 2) * 0.4 * (1 + u), PAPER[1] + 0.2 + u * 2 - u * u * 1.6, PAPER[2] + Math.sin(i) * u]} s={[0.35, 0.02, 0.25]} rot={[u * 5 + i, u * 3, i]} color="#fffdf4" line={2} />; }) : null}
    <PuffBurst c={[PAPER[0], PAPER[1], PAPER[2]]} t={t} t0={19.7} n={14} r={2.2} size={0.6} color="#eceaf4" up={1.2} life={1.8} />
    <RocketRig t={t} rp={rp} s={s} flame={grow * 1.1} rig={grabbed ? hang(t, t < 22.6 ? "surprised" : "laugh", { zeroG: 0.3 }) : null} L={3.0 * Math.max(0.3, grow)} sway={Math.sin(t * 4) * 0.2} smokeVel={[1.6, -1.2, -1.0]} />
    {!grabbed ? <HeroV2 p={jump > 0 ? jumpP : [-2.9, 0, -2.2]} h={H} sy={0} rig={jump > 0 ? stand(t, "determined", { ikR: [120, 1150], ikL: [-60, 1100], handR: "open", handL: "open", squash: 0.08, lookY: -0.8, legL: { a: 10, b: 50 }, legR: { a: -20, b: 20 }, grounded: false }) : stand(t, ant > 0 ? "determined" : "scared", { squash: -0.14 * ant, lean: 8 * ant, ikR: [160, 860 + ant * 60], ikL: [-160, 860], handR: "open", handL: "open", lookY: -0.7, lookX: 0.4, legL: { a: 14 * ant, b: 50 * ant }, legR: { a: 14 * ant, b: 50 * ant } })} rim="255,200,140" /> : null}
  </>);
};

/* ===================== S7 23.4–26.1 : out of the house, over the sunset city ===================== */
const K7: Key[] = [K(23.4, [7.5, 3.5, 11], [1.5, 6.5, 0], 52), K(26.2, [6.5, 9.0, 10], [1.5, 12.5, 0], 52)];
export const S7 = ({ t }: Ctx) => { const u = t - 23.4, rp: V3 = [0, 6 + u * 3.6, 0];
  return (<>
    <Cam t={t} keys={K7} />
    <ambientLight intensity={1.0} /><directionalLight position={[-6, 6, 8]} intensity={1.2} color="#ffd0a0" />
    <GradientDome stops={[[0, "#5a3a9a"], [0.45, "#ff7a5a"], [0.7, "#ffc07a"], [1, "#ffe0b0"]]} />
    <SGlow p={[-30, 8, -80]} r={22} color="#fff0b0" o={0.6} />
    {/* Stickman's house with a hole in the roof */}
    <group position={[0, 0, 0]}><Box p={[0, 2.2, 0]} s={[6, 4.4, 5]} color="#f6c08a" /><Extrude3 /><Box p={[1.4, 2.4, 2.52]} s={[1.6, 1.4, 0.05]} color="#ffd890" line={3} /><Box p={[-1.6, 1.0, 2.52]} s={[1.0, 2.0, 0.05]} color="#8a4a2a" line={3} /></group>
    <PuffBurst c={[0, 5.6, 0]} t={t} t0={23.4} n={12} r={2.6} size={0.7} color="#d8c8c8" up={1} life={2} />
    {Array.from({ length: 12 }, (_, i) => <Building key={i} p={[-26 + i * 4.6 + (i > 4 && i < 7 ? 20 : 0), 0, -14 - (i % 3) * 6]} s={[3.6, 6 + ((i * 7) % 5) * 2.4, 3.4]} color={["#7a5ab0", "#5a4a9a", "#9a6ab8"][i % 3]} seed={i + 2} lit={0.5} />)}
    {[-7, 7].map((x) => <Building key={x} p={[x, 0, 4]} s={[4, 5, 4]} color="#b07ab8" seed={x + 30} lit={0.6} />)}
    <StreetLamp p={[3.6, 0, 4]} h={4} />
    <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[200, 200]} /><meshToonMaterial color="#5a4a7a" /></mesh>
    {[0, 1, 2, 3].map((i) => <Ball key={i} p={[-4 + i * 2.6, 0.8, 7]} r={0.9} color="#3fa84a" ink={0.05} />)}
    <RocketRig t={t} rp={rp} s={1.5} flame={1.2} rig={hang(t, "laugh", { zeroG: 0.4 })} sway={Math.sin(t * 3) * 0.2} smokeVel={[0, -3.5, 0]} />
  </>);
};
const Extrude3: React.FC = () => (<><mesh position={[0, 5.4, 0]} rotation={[0, Math.PI / 4, 0]}><coneGeometry args={[4.4, 2.2, 4]} /><meshToonMaterial color="#c8403a" /></mesh><mesh position={[0, 6.2, 0]}><cylinderGeometry args={[0.9, 0.9, 0.3, 16]} /><meshBasicMaterial color="#1a0a10" /></mesh></>);

/* ===================== S8 26.1–35.8 : ascent in 5 shots ===================== */
const K8: [number, Key[]][] = [
  // a: low angle bursting through clouds
  [26.1, [K(26.1, [1.8, -11, 6], [0, 0.5, 0], 52, -0.06), K(28.2, [2.6, -9, 7.5], [0, 1.0, 0], 56, -0.02)]],
  // b: close-up on Stickman clinging, hoodie whipping
  [28.2, [K(28.2, [3.8, -3.6, 5.4], [1.9, -4.5, 0.3], 42), K(30.4, [3.4, -3.5, 4.9], [1.9, -4.4, 0.3], 40)]],
  // c: side tracking, clouds whoosh past
  [30.4, [K(30.4, [9, -3.4, 3], [0.8, -3.0, 0], 50), K(32.4, [8.6, -3.2, 5.2], [0.8, -3.0, 0], 50)]],
  // d: Earth curving below (high, behind)
  [32.4, [K(32.4, [-2.4, 2.6, 6.4], [1.0, -4.5, -2], 58), K(34.2, [-1.6, 3.4, 7.4], [1.0, -5.0, -3], 60)]],
  // e: stars appearing — wide, slow push
  [34.2, [K(34.2, [5.4, -3.8, 8.6], [1.2, -3.0, 0], 50), K(35.9, [4.8, -3.6, 7.6], [1.2, -3.0, 0], 48)]],
];
export const S8 = ({ t }: Ctx) => { const alt = t < 29.2 ? 0.25 : t < 30.9 ? lerp(0.3, 1.0, seg(t, 29.4, 30.4)) : lerp(1.0, 2.0, seg(t, 30.9, 32.2));
  const face: Rig["face"] = t < 29 ? "surprised" : t < 32 ? "determined" : "smile";
  const extra: Extra2D = t >= 28.2 && t < 30.4 ? (c, o, W, H) => { c.strokeStyle = "rgba(255,255,255,0.8)"; c.lineWidth = 5; for (let i = 0; i < 9; i++) { const x = (i * 97 + t * 900) % W, y = ((i * 211) % H); c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 90); c.stroke(); } void o; } : (() => {});
  return (<>
    <Cam t={t} keys={shot(t, K8)} />
    <SkyWorld t={t} alt={alt} speed={t < 30.4 ? 12 : 9} clouds={t < 32.4 ? 1 - seg(t, 31.6, 32.4) : 0} earth={t > 32.4 ? 1 : 0} lateral={0} />
    {t >= 26.1 && t < 28.2 ? <><Cloud3D p={[-1.2, 1 - (t - 26.1) * 9, 0.6]} s={2.0} seed={51} /><Cloud3D p={[2.2, 3 - (t - 26.1) * 9, -0.8]} s={1.6} seed={52} /></> : null}
    {t >= 30.4 && t < 32.4 ? [0, 1, 2, 3].map((i) => <Cloud3D key={i} p={[-10 + ((t - 30.4) * 16 + i * 7) % 28 - 4, -4 + i * 1.6, 3.5 + (i % 2) * 2]} s={1.0 + (i % 2) * 0.5} seed={60 + i} o={clamp(1 - seg(t, 31.6, 32.4))} />) : null}
    {t >= 34.2 ? Array.from({ length: 30 }, (_, i) => <SGlow key={i} p={[(i * 7.7) % 30 - 15, (i * 5.3) % 20 - 4, -20 - (i % 5) * 6]} r={0.35 + (i % 3) * 0.2} color="#ffffff" o={clamp((t - 34.2 - (i % 6) * 0.15) * 2) * (0.6 + 0.4 * Math.sin(t * 6 + i))} />) : null}
    <RocketRig t={t} rp={[0, 0, 0]} s={1.5} flame={1.2} rig={hang(t, t >= 28.2 && t < 30.4 ? "grin" : face, { zeroG: t >= 28.2 && t < 30.4 ? 0.9 : 0.4, lookY: t > 34.2 ? -0.6 : 0, lookX: t > 34.2 ? 0.4 : 0 })} sway={Math.sin(t * 2.6) * 0.16} extra={extra} />
  </>);
};

/* ===================== S9 35.8–39.8 : the engine coughed — Fuel: empty ===================== */
const K9: [number, Key[]][] = [
  [35.8, [K(35.8, [5.0, -2.6, 7.6], [1.0, -2.6, 0], 50), K(37.6, [4.4, -2.4, 6.8], [1.0, -2.6, 0], 48)]],
  [37.6, [K(37.6, [1.2, 1.4, 4.2], [0.3, 0.9, 0.5], 40), K(39.9, [1.0, 1.2, 3.6], [0.3, 0.9, 0.5], 36)]],
];
export const S9 = ({ t }: Ctx) => { const cough = (k: number) => Math.exp(-Math.max(0, t - k) * 6) * (t > k ? 1 : 0);
  const flame = t < 36.15 ? 1 : t < 37.0 ? 0.2 + 0.8 * Math.max(cough(36.2), cough(36.55)) * (Math.sin(t * 60) > 0 ? 1 : 0.4) : 0.05;
  const gauge = lerp(0.12, 0, seg(t, 37.0, 37.8));
  return (<>
    <Cam t={t} keys={shot(t, K9)} impacts={[[36.2, 0.03], [36.55, 0.02]]} />
    <SkyWorld t={t} alt={2} clouds={0} earth={1} />
    {[36.2, 36.55, 37.0].map((k) => <PuffBurst key={k} c={[0, -2.2, 0]} t={t} t0={k} n={7} r={1.2} size={0.55} color="#5a5a6a" up={-0.6} life={1.4} />)}
    <RocketRig t={t} rp={[0, 0, 0]} s={1.5} flame={flame} gauge={gauge} rig={hang(t, t < 36.2 ? "smile" : t < 37.6 ? "surprised" : "worried", { lookY: 0.6, lookX: -0.3, zeroG: 0.6 })} sway={Math.sin(t * 2) * 0.1} smoke={t < 36.2} face={t > 37.6 ? 1 : 0} faceMood="scared" />
  </>);
};

/* ===================== S10 39.8–44.4 : panicked, then remembered the pencil in his pocket ===================== */
const K10: [number, Key[]][] = [
  [39.8, [K(39.8, [3.6, -3.6, 6.6], [1.8, -4.2, 0.3], 46, 0.08), K(41.3, [3.2, -3.4, 7.0], [1.8, -4.3, 0.3], 48, -0.06)]],
  [41.3, [K(41.3, [3.6, -3.4, 5.4], [1.9, -4.2, 0.3], 42), K(44.5, [3.1, -3.3, 4.6], [1.9, -4.1, 0.3], 38)]],
];
export const S10 = ({ t }: Ctx) => { const panic = t < 41.25; const pull = seg(t, 41.75, 42.3, ease.back), show = seg(t, 42.3, 42.7, ease.back);
  const rig: Rig = panic ? hang(t, "scared", { legL: { a: 30 * Math.sin(t * 14), b: 40, lift: 60 }, legR: { a: -30 * Math.sin(t * 14), b: 40, lift: 60 }, lookX: Math.sin(t * 7), zeroG: 0.8, headTilt: Math.sin(t * 9) * 8 })
    : hang(t, t < 41.75 ? "think" : "grin", { armR: undefined, ikR: pull > 0 ? [170, lerp(470, 820, show)] : [80, 520], ikKR: 1, handR: pull > 0 ? "hold" : "open", lookX: 0.6, lookY: show > 0 ? -0.3 : 0.5, zeroG: 0.6 });
  return (<>
    <Cam t={t} keys={shot(t, K10)} />
    <SkyWorld t={t} alt={2} clouds={0} earth={1} />
    <RocketRig t={t} rp={[0, 0, 0]} s={1.5} flame={0.04} smoke={false} rig={rig} sway={panic ? Math.sin(t * 6) * 0.25 : Math.sin(t * 2) * 0.08} extra={pull > 0 ? pencil2D(-0.2, 0.15, show > 0.5 ? 0.5 + 0.5 * Math.sin(t * 10) : 0, true) : undefined} />
    {t > 42.5 ? <Sparks c={[2.0, -2.9, 0.5]} t={t} t0={42.5} n={10} v={1.5} life={0.6} /> : null}
  </>);
};

/* ===================== S11 44.4–49.9 : he drew a gas station — on the Moon ===================== */
const STATION_PATH: Path2[] = [[[0.08, 0.95], [0.92, 0.95]], [[0.12, 0.95], [0.12, 0.45], [0.88, 0.45], [0.88, 0.95]], [[0.05, 0.45], [0.5, 0.2], [0.95, 0.45]], [[0.3, 0.95], [0.3, 0.65], [0.42, 0.65], [0.42, 0.95]], [[0.6, 0.62], [0.78, 0.62], [0.78, 0.78], [0.6, 0.78], [0.6, 0.62]], [[0.25, 0.12], [0.75, 0.12], [0.75, 0.02], [0.25, 0.02], [0.25, 0.12]]];
const K11: [number, Key[]][] = [
  [44.4, [K(44.4, [4.0, -3.0, 7.4], [0.8, -3.4, 0.5], 50), K(45.95, [3.6, -2.8, 6.8], [0.7, -3.3, 0.5], 48)]],
  [45.95, [K(45.95, [-10, 4, 12], [-1, 7, -5], 60), K(48.0, [-9.0, 3, 10.5], [-2.6, 4.0, -2], 56), K(49.95, [-7.0, 2.4, 9], [-2.8, 2.2, -0.6], 54)]],
];
export const S11 = ({ t }: Ctx) => { const prog = seg(t, 44.5, 45.9);
  if (t < 45.95) { const tipR: [number, number] = [210 + Math.sin(prog * 30) * 60, 820 + Math.cos(prog * 23) * 80];
    return (<>
      <Cam t={t} keys={shot(t, K11)} />
      <SkyWorld t={t} alt={2} clouds={0} earth={1} />
      <mesh position={[-6, 6, -30]}><sphereGeometry args={[5, 32, 24]} /><meshToonMaterial color="#d8d4e8" /></mesh>
      <ChalkDraw p={[-1.0, -1.6, 1.4]} s={[2.4, 2.4]} paths={STATION_PATH} prog={prog} color="rgba(255,236,120,1)" width={12} t={t} face />
      <RocketRig t={t} rp={[0, 0, 0]} s={1.5} flame={0.04} smoke={false} rig={hang(t, "determined", { armR: undefined, ikR: tipR, ikKR: 1, handR: "hold", lookX: -0.6, lookY: 0.2, zeroG: 0.6 })} extra={pencil2D(-0.5, 0.15, 0.6, false)} />
    </>);
  }
  const reveal = seg(t, 46.0, 47.6), land = seg(t, 47.3, 49.2, ease.o);
  const rpAt = (tt: number): V3 => { const l = seg(tt, 47.3, 49.2, ease.o); return [lerp(PAD[0] + 6, PAD[0], l), lerp(14, 2.3, l), lerp(PAD[2] - 6, PAD[2], l)]; };
  const rp = rpAt(t), jk = seg(t, 48.2, 48.75, ease.io), off = t > 48.2;
  const r0 = rpAt(48.2), hr = hang(48.2, "surprised", { zeroG: 0.4 }), rung0 = ladderPts(ladderTop(r0, 1.5), 3.0, Math.sin(48.2 * 3) * 0.12, 0.82);
  const S0: V3 = [rung0[0], rung0[1] - gloveOffset(hr, H)[1], rung0[2] + 0.3];
  const jp: V3 = [lerp(S0[0], HP[0], jk), lerp(S0[1], 0, jk) + Math.sin(jk * Math.PI) * 0.8, lerp(S0[2], HP[2], jk)];
  const landSq = t > 48.75 ? -0.18 * Math.exp(-(t - 48.75) * 6) : 0;
  return (<>
    <Cam t={t} keys={shot(t, K11)} impacts={[[49.2, 0.03]]} />
    <MoonSet t={t} reveal={reveal} />
    {[0, 1, 2, 3].map((i) => <Sparks key={i} c={[PUMP[0] + i * 1.2, 1.5 + i * 0.6, PUMP[2] - i * 0.4]} t={t} t0={46.0 + i * 0.35} n={8} v={2} life={0.5} color="#ffe68a" />)}
    <PuffBurst c={PAD} t={t} t0={49.15} n={16} r={3.4} size={0.7} color="#c8c4d8" up={0.6} life={1.6} />
    <Shadow p={[rp[0], 0.26, rp[2]]} r={1.4 + land} o={0.4 * land} />
    {off ? <><HeroV2 p={jp} h={H} sy={0} rig={jk < 1 ? stand(t, "grin", { ikR: [220, 1000], ikL: [-220, 1000], handR: "open", handL: "open", legL: { a: 20, b: 50 }, legR: { a: -10, b: 40 }, grounded: false, zeroG: 0.5 }) : stand(t, "laugh", { squash: landSq, ikR: [260, 900], ikL: [-260, 900], handR: "open", handL: "open", lookX: 0.4 })} /><PuffBurst c={HP} t={t} t0={48.75} n={8} r={1.2} size={0.4} color="#c8c4d8" /></> : null}
    <RocketRig t={t} rp={rp} s={1.5} flame={t < 49.2 ? 0.6 : 0.02} rig={off ? null : hang(t, "surprised", { zeroG: 0.4 })} L={3.0} sway={Math.sin(t * 3) * 0.12} smokeVel={[0, -2, 0]} />
  </>);
};

/* ---------- Moon helpers: rocket parked on the pad, hero next to it ---------- */
const RP_PAD: V3 = [PAD[0], 2.3, PAD[2]];
const ParkedRocket: React.FC<{ t: number; gauge?: number; face?: number }> = ({ t, gauge, face }) => (<><Rocket3D p={RP_PAD} s={1.5} t={t} gauge={gauge} face={face} rot={[0, 0.35, 0]} /><RopeLadder top={ladderTop(RP_PAD, 1.5)} L={2.3} sway={0} n={6} /></>);
const HP: V3 = [-1.6, 0.0, 0.8]; // hero spot on the Moon
const BOT: V3 = [-0.3, 0, -1.3];
const Hose: React.FC<{ to: V3 }> = ({ to }) => { const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(PUMP[0] + 0.45, 1.1, PUMP[2]), new THREE.Vector3((PUMP[0] + to[0]) / 2, 0.15, (PUMP[2] + to[2]) / 2), new THREE.Vector3(to[0], to[1], to[2])]);
  return (<><mesh><tubeGeometry args={[curve, 40, 0.08, 8, false]} /><meshToonMaterial color="#2b2f40" /></mesh><mesh><tubeGeometry args={[curve, 40, 0.11, 8, false]} /><meshBasicMaterial color="#0b0d1a" side={THREE.BackSide} /></mesh></>); };

/* ===================== S12 49.9–55.0 : tiny robot rolled out, filled the tank, handed him a receipt ===================== */
const K12: [number, Key[]][] = [
  [49.9, [K(49.9, [1.2, 1.3, 7.4], [-3.4, 1.6, -2.4], 54), K(51.3, [0.8, 1.2, 6.8], [-2.4, 1.6, -1.2], 52)]],
  [51.3, [K(51.3, [-3.4, 2.6, 7.4], [-2.6, 1.9, -0.6], 50), K(52.45, [-3.0, 2.4, 6.8], [-2.4, 1.9, -0.6], 48)]],
  [52.45, [K(52.45, [0.8, 2.4, 7.0], [-1.0, 1.9, -0.2], 44), K(55.1, [0.3, 2.3, 6.2], [-1.0, 1.9, -0.2], 42)]],
];
export const S12 = ({ t }: Ctx) => { const roll = seg(t, 50.2, 51.2, ease.o); const bp: V3 = [lerp(KIOSK[0] + 0.9, BOT[0], roll), 0, lerp(KIOSK[2] + 1.6, BOT[2], roll)];
  const fill = seg(t, 51.4, 52.4); const rec = seg(t, 52.5, 53.2); const hand = seg(t, 53.2, 53.7, ease.back);
  const nozzle: V3 = [RP_PAD[0] + 0.9, 1.4, RP_PAD[2] + 0.7];
  return (<>
    <Cam t={t} keys={shot(t, K12)} />
    <MoonSet t={t} />
    <ParkedRocket t={t} gauge={fill} />
    {t > 51.3 ? <Hose to={nozzle} /> : null}
    {fill > 0 && fill < 1 ? [0, 1, 2].map((i) => <SGlow key={i} p={[nozzle[0] + Math.sin(t * 9 + i) * 0.2, nozzle[1] + 0.2, nozzle[2] + 0.2]} r={0.25} color="#7affb0" o={0.7} />) : null}
    <Robot3D p={bp} t={t} rotY={roll < 1 ? -0.9 : -0.5} wheel={roll * 14} face={t < 51.3 ? "happy" : fill < 1 ? "neutral" : "happy"} armR={t > 51.3 && t < 52.5 ? 1.0 : hand * 1.2} />
    <Receipt3D p={[bp[0] - 0.2, 1.05, bp[2] + 0.45]} len={rec * 1.2 * (1 - hand) + hand * 0.01} rot={[0.3, -0.5, 0]} />
    <HeroV2 p={HP} h={H} rig={t < 51.3 ? stand(t, "surprised", { lookX: 0.8, lookY: 0.3, ikR: [160, 760], handR: "open", headTilt: 6 }) : t < 52.45 ? stand(t, "grin", { ikR: [240, 860], handR: "thumb", lookX: 0.5 }) : stand(t, hand > 0 ? "smile" : "neutral", { ikR: [260, 600 + hand * 120], handR: hand > 0 ? "hold" : "open", lookX: 0.5, lookY: 0.4 })}
      extra={hand > 0 ? (c, o, W, Hh) => { c.save(); c.translate(o.gloveR[0], o.gloveR[1]); c.rotate(0.1); c.fillStyle = "#fffdf4"; c.fillRect(-14, -10, 60, 150); c.strokeStyle = "#0b0d1a"; c.lineWidth = 5; c.strokeRect(-14, -10, 60, 150); c.fillStyle = "#e5263a"; c.fillRect(-4, 110, 40, 10); c.restore(); void W; void Hh; } : undefined} />
  </>);
};

/* ===================== S13 55.0–58.2 : Thirty million dollars ===================== */
const K13: [number, Key[]][] = [
  [55.0, [K(55.0, [-0.4, 2.6, 5.4], [-1.4, 2.0, 0.8], 40), K(56.6, [-0.6, 2.5, 4.8], [-1.4, 2.1, 0.8], 38)]],
  [56.6, [K(56.6, [3.6, 1.2, 6.0], [-0.6, 1.9, 0], 48, -0.05), K(58.3, [3.2, 1.3, 5.2], [-0.6, 1.9, 0], 46, 0.02)]],
];
export const S13 = ({ t }: Ctx) => { const shock = seg(t, 55.1, 55.35, ease.back);
  const rec: Extra2D = (c, o) => { c.save(); c.translate(o.gloveR[0] - 10, o.gloveR[1] - 120); c.rotate(-0.08); c.fillStyle = "#fffdf4"; c.fillRect(-20, 0, 120, 240); c.strokeStyle = "#0b0d1a"; c.lineWidth = 6; c.strokeRect(-20, 0, 120, 240); c.fillStyle = "#8a8fa8"; for (let y = 20; y < 160; y += 22) c.fillRect(-6, y, 60, 6); c.fillStyle = "#e5263a"; c.font = "900 26px Inter"; c.fillText("$30M", -6, 210); c.restore(); };
  return (<>
    <Cam t={t} keys={shot(t, K13)} impacts={[[55.1, 0.03]]} />
    <MoonSet t={t} />
    <ParkedRocket t={t} gauge={1} />
    <Robot3D p={BOT} t={t} rotY={-0.6} face={Math.sin(t * 3) > 0.95 ? "blink" : "happy"} armR={0.4} />
    <HeroV2 p={HP} h={H} rig={stand(t, "scared", { squash: 0.12 * shock * Math.exp(-(t - 55.3) * 2) - 0.02, ikR: [200, 780], handR: "hold", ikL: [-220, 920], handL: "open", lookX: 0.3, lookY: t < 56.6 ? 0.5 : 0, headTilt: -6, zeroG: 0 })} extra={rec} />
  </>);
};

/* ===================== S14 58.2–61.1 : Stickman drew a coin (a tiny one) ===================== */
const CIRCLE: Path2[] = [Array.from({ length: 33 }, (_, i) => [0.5 + Math.cos((i / 32) * TAU - Math.PI / 2) * 0.44, 0.5 + Math.sin((i / 32) * TAU - Math.PI / 2) * 0.44] as [number, number])];
const K14: Key[] = [K(58.2, [1.6, 2.4, 6.4], [-0.6, 1.8, 0.0], 46), K(61.2, [0.8, 2.3, 5.8], [-0.6, 1.8, 0.0], 44)];
export const S14 = ({ t }: Ctx) => { const pr = seg(t, 58.6, 59.3), pop = seg(t, 59.3, 59.6, ease.back), give = seg(t, 59.9, 60.5, ease.io);
  const coinP: V3 = [lerp(-0.7, 0.55, give), lerp(2.2, 1.55, give) + Math.sin(give * Math.PI) * 0.5, lerp(1.0, -0.15, give)];
  return (<>
    <Cam t={t} keys={K14} />
    <MoonSet t={t} />
    <ParkedRocket t={t} gauge={1} />
    <Robot3D p={BOT} t={t} rotY={-0.6} face={give > 0.9 ? "neutral" : "happy"} armR={0.3 + give * 0.9} />
    <ChalkDraw p={[-0.7, 2.2, 1.05]} s={[0.5, 0.5]} paths={CIRCLE} prog={pr} color="rgba(255,226,90,1)" width={30} t={t} face fillK={0} />
    {pop > 0 ? <Coin3D p={coinP} r={0.16 * pop} rot={[0, t * 4, 0]} /> : null}
    <Sparks c={[-0.7, 2.2, 1.1]} t={t} t0={59.3} n={8} v={1} life={0.4} />
    <HeroV2 p={HP} h={H} rig={stand(t, give > 0 ? "smile" : "determined", { ikR: give > 0 ? [lerp(260, 380, give), 700] : [240 + Math.sin(pr * TAU) * 60, 720 + Math.cos(pr * TAU) * 60], handR: "hold", lookX: 0.5, lookY: 0.2, lean: 6 })} extra={give > 0 ? undefined : pencil2D(0.4, 0.13)} />
  </>);
};

/* ===================== S15 61.1–64.2 : the robot did not look happy ===================== */
const K15: [number, Key[]][] = [
  [61.1, [K(61.1, [0.2, 2.2, 6.2], [-1.0, 2.0, -0.3], 48), K(62.6, [0.1, 2.2, 5.7], [-1.0, 2.0, -0.3], 46)]],
  [62.6, [K(62.6, [-3.4, 1.6, 5.0], [-0.4, 2.0, 0], 48), K(64.3, [-3.0, 1.7, 4.4], [-0.4, 2.0, 0], 46)]],
];
export const S15 = ({ t }: Ctx) => { const angry = t > 61.6; const zoom = Math.max(0, Math.sin((t - 61.7) * 3)) * (t > 61.7 ? 1 : 0);
  return (<>
    <Cam t={t} keys={shot(t, K15)} impacts={[[61.7, 0.02]]} />
    <MoonSet t={t} />
    <ParkedRocket t={t} gauge={1} />
    <Robot3D p={BOT} t={t} rotY={-0.6} face={angry ? "angry" : "neutral"} armL={angry ? 1.1 + Math.sin(t * 12) * 0.2 : 0} armR={angry ? 1.1 - Math.sin(t * 12) * 0.2 : 0.8} steam={angry ? (t * 1.5) % 1 : 0} s={1 + zoom * 0.04} />
    {t < 62.6 ? <Coin3D p={[BOT[0] + 0.6, 1.55, BOT[2] + 0.2]} r={0.16} rot={[0.4, 0.6, 0]} /> : null}
    <HeroV2 p={HP} h={H} rig={stand(t, t < 62.6 ? "grin" : "worried", { ikR: [240, 920], handR: "open", ikL: t > 62.6 ? [-120, 940] : undefined, handL: "open", lookX: 0.6, lookY: 0.2, squash: -0.03, headTilt: t > 62.6 ? 10 : 0 })} />
  </>);
};

/* ===================== S16 64.2–68.6 : so he drew a BIGGER coin ===================== */
const K16: [number, Key[]][] = [
  [64.2, [K(64.2, [0.8, 2.0, 8.0], [-0.8, 2.2, 0.6], 50), K(66.0, [0.4, 1.9, 7.4], [-0.8, 2.3, 0.6], 52)]],
  [66.0, [K(66.0, [-2.2, 1.0, 7.4], [-1.0, 2.3, 0.6], 56, 0.04), K(68.7, [-1.8, 1.1, 8.0], [-1.0, 2.2, 0.6], 54, 0.02)]],
];
export const BIGCOIN: V3 = [0.2, 1.75, 1.4];
export const S16 = ({ t }: Ctx) => { const pr = seg(t, 64.5, 65.5), pop = seg(t, 65.5, 66.0, ease.back);
  return (<>
    <Cam t={t} keys={shot(t, K16)} impacts={[[66.0, 0.03]]} />
    <MoonSet t={t} />
    <ParkedRocket t={t} gauge={1} />
    <Robot3D p={BOT} t={t} rotY={-0.5} face={pop > 0.5 ? "shock" : "angry"} armL={pop > 0.5 ? 1.4 : 0.6} armR={pop > 0.5 ? 1.4 : 0.6} steam={pop > 0.5 ? 0 : (t * 1.5) % 1} />
    <ChalkDraw p={[BIGCOIN[0], BIGCOIN[1], BIGCOIN[2] + 0.1]} s={[3.6, 3.6]} paths={CIRCLE} prog={pr} color="rgba(255,226,90,1)" width={12} t={t} face />
    {pop > 0 ? <Coin3D p={BIGCOIN} r={1.6 * pop} rot={[0, 0.25 + Math.sin(t * 2) * 0.05, 0]} /> : null}
    <SGlow p={[BIGCOIN[0], BIGCOIN[1], BIGCOIN[2] + 0.4]} r={3 * pop} color="#ffe07a" o={0.35 * pop} />
    <Sparks c={BIGCOIN} t={t} t0={65.5} n={16} v={3} life={0.7} />
    <HeroV2 p={[-2.4, 0, 0.6]} h={H} rig={pop > 0 ? stand(t, "grin", { ikR: [200, 880], handR: "thumb", ikL: [-160, 560], handL: "fist", lookX: 0.6, lookY: -0.2, lean: -4, squash: 0.05 * Math.exp(-(t - 65.6) * 3) }) : stand(t, "determined", { ikR: [200 + Math.sin(pr * TAU) * 220, 760 + Math.cos(pr * TAU) * 220], handR: "hold", lookX: 0.5, lookY: -0.2 })} extra={pop > 0 ? undefined : pencil2D(0.4, 0.13)} />
  </>);
};

/* ===================== S17 68.6–76.5 : it fell, rolled across a crater, woke something enormous under the dust ===================== */
const DIR: [number, number] = (() => { const dx = CRATER[0] - BIGCOIN[0], dz = CRATER[2] - BIGCOIN[2], n = Math.hypot(dx, dz); return [dx / n, dz / n]; })();
const ROLL_D = Math.hypot(CRATER[0] - BIGCOIN[0], CRATER[2] - BIGCOIN[2]);
const coinAt = (t: number): { p: V3; rot: V3 } => { const fall = seg(t, 68.75, 69.15, ease.i); const d = seg(t, 69.3, 70.9, ease.sin) * ROLL_D; const into = seg(t, 70.75, 71.0);
  const hop = t > 69.15 && t < 69.5 ? Math.abs(Math.sin((t - 69.15) * 9)) * 0.3 * (1 - (t - 69.15) / 0.35) : 0;
  return { p: [BIGCOIN[0] + DIR[0] * d, lerp(BIGCOIN[1] + 0.6 * Math.sin(fall * Math.PI) * (1 - fall), 1.6, fall) + hop - into * 4, BIGCOIN[2] + DIR[1] * d], rot: [d / 1.6, Math.atan2(DIR[0], DIR[1]) + Math.PI / 2, Math.sin(t * 7) * 0.08 * (d > 0 ? 1 : 0)] }; };
const SIDE = (k: number, off: number, h: number): V3 => [BIGCOIN[0] + DIR[0] * k + DIR[1] * off, h, BIGCOIN[2] + DIR[1] * k - DIR[0] * off];
const RIM: V3 = [14, 0, -2.5];
const D2: [number, number] = (() => { const x = RIM[0] - CRATER[0], z = RIM[2] - CRATER[2], n = Math.hypot(x, z); return [x / n, z / n]; })();
const PERP: [number, number] = [D2[1], -D2[0]];
const WROT = Math.atan2(D2[0], D2[1]);
const behind = (d: number, side: number, y: number): V3 => [RIM[0] + D2[0] * d + PERP[0] * side, y, RIM[2] + D2[1] * d + PERP[1] * side];
const K17: [number, Key[]][] = [
  [68.6, [K(68.6, [-0.4, 1.8, 7.8], [-0.9, 1.7, 0.6], 54), K(69.4, [-0.1, 1.8, 7.4], [-0.6, 1.6, 0.4], 54)]],
  [69.4, [K(69.4, SIDE(-1, -9, 1.8), SIDE(1, 0, 1.4), 54), K(71.0, SIDE(5, -9, 2.2), SIDE(7, 0, 1.0), 54)]],
  [71.0, [K(71.0, behind(5.5, -1.5, 2.0), add(RIM, [0, 2.0, 0]), 44), K(73.0, behind(6.5, -2.0, 2.2), add(RIM, [0, 2.4, 0]), 48)]],
  [73.0, [K(73.0, behind(4.4, 1.2, 0.8), [lerp(RIM[0], CRATER[0], 0.4), 3.5, lerp(RIM[2], CRATER[2], 0.4)], 62), K(76.6, behind(5.2, 1.8, 0.7), [lerp(RIM[0], CRATER[0], 0.45), 6.5, lerp(RIM[2], CRATER[2], 0.45)], 64)]],
];
export const S17 = ({ t }: Ctx) => { const c = coinAt(t), chase = seg(t, 69.3, 71.0, ease.sin);
  const rumble = seg(t, 70.9, 71.4) * (t < 73 ? 1 : 1), rise = seg(t, 73.0, 76.5, ease.io);
  const heroP: V3 = t < 69.3 ? [-2.4, 0, 0.6] : t < 71.0 ? SIDE(Math.min(seg(t, 69.3, 70.9, ease.sin) * ROLL_D - 2.6, 5.6), -0.5, 0) : RIM;
  const heroRig: Rig = t < 69.3 ? stand(t, "surprised", { ikR: [220, 800], ikL: [-140, 800], handR: "open", handL: "open", lookX: 0.7, lookY: 0.3, lean: 10 * seg(t, 68.9, 69.3) })
    : t < 71.0 ? run(t, true, "scared", { lookX: -1 })
    : t < 73.0 ? stand(t, "scared", { squash: -0.06 + Math.sin(t * 40) * 0.015, ikR: [160, 760], ikL: [-160, 760], handR: "open", handL: "open", lookY: 0.4, lookX: 0.3, lean: -6 })
    : stand(t, "scared", { ikR: [200, 980], ikL: [-200, 980], handR: "open", handL: "open", lookY: -1, lookX: 0.2, lean: -10, squash: -0.04 });
  const wp: V3 = [CRATER[0], lerp(-10, 0.5, rise), CRATER[2]];
  return (<>
    <Cam t={t} keys={shot(t, K17)} impacts={[[69.15, 0.03], [70.9, 0.06], [72.7, 0.08]]} quake={t > 70.9 ? 0.02 + 0.03 * rise : 0} />
    <MoonSet t={t} />
    <ParkedRocket t={t} gauge={1} />
    <Robot3D p={BOT} t={t} rotY={t < 71 ? 0.6 : 2.2} face="shock" armL={1.4} armR={1.4} />
    {t < 71.05 ? <Coin3D p={c.p} r={1.6} rot={c.rot} /> : null}
    <PuffBurst c={[BIGCOIN[0], 0, BIGCOIN[2]]} t={t} t0={69.15} n={10} r={2.0} size={0.5} color="#c8c4d8" />
    {t > 69.4 && t < 71.2 ? <Smoke src={[c.p[0], 0.2, c.p[2]]} t={t} t0={69.4} t1={71.0} rate={10} vel={[0, 0.5, 0]} spread={0.5} size={0.35} life={1.0} color="#c8c4d8" seed={9} /> : null}
    {/* dust under the crater: rumbling plumes, then the whale rising with rocks falling off */}
    {t > 70.9 ? <Smoke src={add(CRATER, [0, 0, 0])} t={t} t0={70.9} rate={14} vel={[0, 1.6, 0]} spread={4} size={1.3} life={2.6} color="#bdb8d0" seed={12} max={40} /> : null}
    <PuffBurst c={CRATER} t={t} t0={72.7} n={24} r={9} size={1.7} color="#c8c4dc" up={2.5} life={2.4} />
    {t > 73 ? <Whale3D p={wp} s={1.8} t={t} eyes={0} rotY={WROT} /> : null}
    {t > 73 ? Array.from({ length: 12 }, (_, i) => { const t0 = 73.4 + (i % 6) * 0.45, u = Math.max(0, t - t0); const a = (i / 12) * TAU; return <Ball key={i} p={[CRATER[0] + Math.cos(a) * (6 + u * 1.5), wp[1] + 6 - 4 * u * u + (i % 3), CRATER[2] + Math.sin(a) * (6 + u * 1.5)]} r={0.4 + (i % 3) * 0.25} color="#a8a2c0" ink={0.04} />; }) : null}
    <HeroV2 p={heroP} h={H} rig={heroRig} rim="200,190,255" />
  </>);
};

/* ===================== S18 76.5–79.8 : two glowing eyes opened ===================== */
const WHALE_UP: V3 = [CRATER[0], 4.2, CRATER[2]];
const K18: [number, Key[]][] = [
  [76.5, [K(76.5, behind(12, -3.0, 1.6), [RIM[0] - D2[0] * 4, 3.5, RIM[2] - D2[1] * 4], 60), K(78.2, behind(11.5, -2.6, 1.7), [RIM[0] - D2[0] * 4, 4.5, RIM[2] - D2[1] * 4], 64)]],
  [78.2, [K(78.2, behind(-1.2, 4.2, 2.6), add(RIM, [0, 2.2, 0]), 42), K(79.9, behind(-1.0, 3.6, 2.5), add(RIM, [0, 2.3, 0]), 40)]],
];
export const S18 = ({ t }: Ctx) => { const eyes = seg(t, 77.5, 77.9, ease.back);
  return (<>
    <Cam t={t} keys={shot(t, K18)} impacts={[[77.57, 0.025]]} />
    <MoonSet t={t} />
    <Smoke src={CRATER} t={t} t0={74} rate={6} vel={[0, 1.0, 0]} spread={4} size={1.2} life={3} color="#bdb8d0" seed={13} max={16} />
    <Whale3D p={[WHALE_UP[0], lerp(0.5, WHALE_UP[1], seg(t, 76.5, 79.8, ease.o)), WHALE_UP[2]]} s={1.8} t={t} eyes={eyes} rotY={WROT} />
    <HeroV2 p={RIM} h={H} rig={stand(t, "scared", { ikR: [160, 820], ikL: [-160, 820], handR: "open", handL: "open", lookY: -1, lookX: t > 78.2 ? -0.2 : 0.3, squash: -0.04 - 0.06 * seg(t, 77.6, 77.9) })} rim="255,220,120"
      extra={t > 78.2 ? (c, o, W, Hh) => { c.save(); c.globalCompositeOperation = "source-atop"; c.fillStyle = "rgba(255,210,90,0.18)"; c.fillRect(0, 0, W, Hh); c.restore(); void o; } : undefined} />
  </>);
};

/* ===================== S19 79.8–85.3 : a giant space whale yawned, and swallowed the rocket whole ===================== */
const WH: V3 = [CRATER[0], 9.5, CRATER[2]], WS = 1.8, WY = -0.6;
const mouthW = (): V3 => { const lx = 0, ly = -1.4 * WS, lz = 6.6 * WS; return [WH[0] + lx * Math.cos(WY) + lz * Math.sin(WY), WH[1] + ly, WH[2] - lx * Math.sin(WY) + lz * Math.cos(WY)]; };
const K19: [number, Key[]][] = [
  [79.8, [K(79.8, [-5.4, 1.0, 5.4], [3.5, 7.0, -9], 66), K(81.8, [-5.8, 0.9, 6.0], [3.5, 8.0, -9], 68)]],
  [81.8, [K(81.8, [-8.5, 2.2, 4.5], [-3.5, 3.0, -1.5], 58, 0.03), K(82.6, [-6.5, 3.8, 4.5], [-1.5, 4.6, -3], 60), K(83.6, [-3.5, 6.0, 3.5], [1.5, 6.6, -5.5], 60, -0.03)]],
  [83.6, [K(83.6, [-5, 6, 6], [WH[0], WH[1] - 1, WH[2]], 54), K(85.4, [-7, 7, 8], [WH[0], WH[1], WH[2]], 56)]],
];
export const S19 = ({ t }: Ctx) => { const yawn = seg(t, 80.9, 81.6, ease.io) * (1 - seg(t, 83.4, 83.8, ease.back)) + seg(t, 81.9, 82.2) * 0;
  const suck = seg(t, 82.0, 83.4, ease.i), M = mouthW();
  const pre = seg(t, 81.6, 82.1, ease.o) * 4.0;
  const rp: V3 = [lerp(RP_PAD[0], M[0], suck), lerp(RP_PAD[1] + pre, M[1], suck) + Math.sin(suck * Math.PI) * 1.5, lerp(RP_PAD[2], M[2], suck)];
  const grab = t > 81.95;
  const hp: V3 = grab ? rp : [lerp(HP[0], HP[0] + 0.6, seg(t, 81.6, 81.95)), 0, HP[2]];
  return (<>
    <Cam t={t} keys={shot(t, K19)} impacts={[[83.75, 0.05]]} quake={0.01 + yawn * 0.015} />
    <MoonSet t={t} />
    <Whale3D p={[WH[0], WH[1] + Math.sin(t * 0.8) * 0.3, WH[2]]} s={WS} t={t} eyes={t > 83.8 ? 0.5 : 1} blink={t > 81.0 && t < 81.6 ? 0.7 : 0} mouth={yawn} rotY={WY} />
    {yawn > 0.3 && t < 83.6 ? Array.from({ length: 16 }, (_, i) => { const u = ((t * 1.3 + i / 16) % 1); const a = i * 2.4; return <SGlow key={i} p={[lerp(M[0] + Math.cos(a) * 6, M[0], u), lerp(M[1] + Math.sin(a) * 4, M[1], u), lerp(M[2] + 4, M[2], u)]} r={0.3} color="#e8e4ff" o={0.8 * u} />; }) : null}
    {yawn > 0.3 && t < 83.6 ? <Smoke src={[RP_PAD[0], 0.3, RP_PAD[2]]} t={t} t0={81.4} rate={10} vel={[(M[0] - RP_PAD[0]) * 0.5, M[1] * 0.5, (M[2] - RP_PAD[2]) * 0.5]} spread={1.2} size={0.7} life={2} color="#c8c4d8" seed={21} max={20} /> : null}
    {suck < 0.995 ? (grab ? <RocketRig t={t} rp={rp} s={1.5 * (1 - suck * 0.35)} flame={0} smoke={false} rig={hang(t, "scared", { zeroG: 1, legL: { a: 30 * Math.sin(t * 13), b: 30, lift: 40 }, legR: { a: -30 * Math.sin(t * 13), b: 30, lift: 40 } })} L={2.6} sway={0.5 + Math.sin(t * 6) * 0.2} tilt={suck * 1.2} />
      : <><RocketRig t={t} rp={rp} s={1.5} flame={0} smoke={false} rig={null} L={2.6} sway={0} /><HeroV2 p={hp} h={H} rig={stand(t, t < 80.9 ? "surprised" : "scared", { ikR: [200, 900], ikL: [-200, 900], handR: "open", handL: "open", lookY: -0.9, lookX: 0.5, lean: t > 81.6 ? 14 : 0, zeroG: t > 81.4 ? 0.8 : 0 })} /></>) : null}
    <Robot3D p={[1.6, 0, 1.2]} t={t} rotY={-2.4} face="shock" armL={1.3} armR={1.3} />
  </>);
};

/* ===================== S20 85.3–92.4 : inside — warm, quiet, full of lost satellites ===================== */
const IN: V3 = [-1.0, 0, -3.0];
const K20: [number, Key[]][] = [
  [85.3, [K(85.3, [0.5, 3.2, 6], [-0.6, 2.6, -3], 54), K(87.2, [0.2, 2.6, 5], [-0.8, 1.6, -3], 52)]],
  [87.2, [K(87.2, [-4.6, 1.8, 2.0], [-1.0, 2.0, -3.0], 44), K(89.4, [-3.2, 2.0, 3.2], [-1.0, 2.0, -3.0], 44)]],
  [89.4, [K(89.4, [1.6, 1.8, 2.6], [-1.8, 2.8, -9], 58), K(92.5, [1.0, 2.0, 1.2], [-1.8, 3.0, -11], 60)]],
];
export const S20 = ({ t }: Ctx) => { const drop = seg(t, 85.3, 86.3, ease.i), land = t > 86.3;
  const hp: V3 = land ? (t < 89.4 ? IN : [lerp(IN[0], IN[0] - 0.6, seg(t, 89.4, 92.4)), 0, lerp(IN[2], IN[2] - 1.8, seg(t, 89.4, 92.4))]) : [IN[0], lerp(8, 0, drop), IN[2]];
  const bounce = land ? Math.exp(-(t - 86.3) * 5) : 0;
  const rig: Rig = !land ? stand(t, "scared", { ikR: [240, 1000], ikL: [-240, 1000], handR: "open", handL: "open", grounded: false, zeroG: 1, legL: { a: 20, b: 40 }, legR: { a: -10, b: 40 } })
    : t < 87.2 ? stand(t, "surprised", { squash: -0.2 * bounce * Math.cos((t - 86.3) * 14), ikR: [200, 600], ikL: [-200, 600], handR: "open", handL: "open" })
    : t < 89.4 ? stand(t, t < 88.2 ? "surprised" : "smile", { lookX: Math.sin((t - 87.2) * 1.6), lookY: -0.4, ikR: [140, 640], handR: "relaxed" })
    : walk(t, true, "smile", { lookY: -0.6, lookX: -0.4 });
  return (<>
    <Cam t={t} keys={shot(t, K20)} impacts={[[86.3, 0.04], [86.7, 0.03]]} />
    <WhaleBelly t={t} />
    {/* the rocket tumbles in after him and lands on its side */}
    <Rocket3D p={[2.6, lerp(10, 0.9, seg(t, 85.6, 86.7, ease.i)), -6.6]} s={1.3} t={t} rot={[0, 0.4, lerp(0.3, 1.45, seg(t, 85.6, 86.7))]} face={t > 87.2 ? 1 : 0} faceMood="wow" />
    <PuffBurst c={[2.6, 0, -6.6]} t={t} t0={86.7} n={10} r={2} size={0.6} color="#ffc8e8" />
    <PuffBurst c={IN} t={t} t0={86.3} n={8} r={1.2} size={0.4} color="#ffc8e8" />
    <HeroV2 p={hp} h={H} rig={rig} rim="120,255,230" />
  </>);
};

/* ===================== S21 92.4–95.7 : Stickman smiled and picked up his pencil ===================== */
const P21: V3 = [-1.6, 0, -4.8];
const K21: Key[] = [K(92.4, [1.4, 2.4, 1.0], [-1.4, 1.8, -4.8], 44), K(95.8, [0.8, 2.3, 0.0], [-1.4, 1.9, -4.8], 40)];
export const S21 = ({ t }: Ctx) => { const pick = seg(t, 93.5, 94.0, ease.io), up = seg(t, 94.0, 94.5, ease.back);
  return (<>
    <Cam t={t} keys={K21} />
    <WhaleBelly t={t} />
    <Rocket3D p={[2.6, 0.9, -6.6]} s={1.3} t={t} rot={[0, 0.4, 1.45]} face={1} faceMood="smile" />
    {pick < 1 ? <group position={[-1.05, 0.05, -4.4]} rotation={[0, 0, Math.PI / 2]}><Cyl p={[0, 0.5, 0]} rt={0.05} h={0.7} color="#ffd23a" line={2} /><Cyl p={[0, 0.07, 0]} rt={0.05} rb={0} h={0.14} color="#f2c38a" line={2} /><Cyl p={[0, 0.95, 0]} rt={0.055} h={0.12} color="#ff8fb0" line={1} /></group> : null}
    <HeroV2 p={P21} h={H} rig={stand(t, t < 93.5 ? "smile" : "grin", { lean: 22 * pick * (1 - up), squash: -0.08 * pick * (1 - up), ikR: pick < 1 ? [lerp(160, 300, pick), lerp(560, 200, pick)] : [230, lerp(200, 900, up)], handR: pick > 0.8 ? "hold" : "open", lookX: 0.5, lookY: lerp(0.2, 0.7, pick) - up, headTilt: -6 })}
      extra={pick >= 1 ? pencil2D(0.3, 0.15, up > 0.6 ? 0.8 : 0, true) : undefined} rim="120,255,230" />
    {t > 94.4 ? <Sparks c={[-1.2, 3.2, -4.6]} t={t} t0={94.4} n={12} v={1.4} life={0.7} /> : null}
  </>);
};

/* ===================== S22 95.7–100 : "What would you draw to get out?" — he starts drawing a rocket (loops to the hook) ===================== */
const K22: Key[] = [K(95.7, [2.2, 2.6, 1.4], [-0.6, 2.6, -4.6], 46), K(100, [0.6, 2.9, -1.2], [-0.4, 3.1, -4.6], 38)];
export const S22 = ({ t }: Ctx) => { const pr = seg(t, 95.9, 98.6);
  const tip: [number, number] = [260 + Math.sin(pr * 22) * 80, 860 + Math.cos(pr * 17) * 120];
  return (<>
    <Cam t={t} keys={K22} />
    <WhaleBelly t={t} />
    <Rocket3D p={[2.6, 0.9, -6.6]} s={1.3} t={t} rot={[0, 0.4, 1.45]} face={1} faceMood="wow" />
    <ChalkDraw p={[0.3, 3.0, -4.2]} s={[1.9, 2.6]} paths={ROCKET_PATH} prog={pr} color="rgba(255,236,120,1)" width={11} t={t} face fill="rgba(255,236,120,0.15)" fillK={seg(t, 98.6, 99.4)} />
    <SGlow p={[0.3, 3.0, -4.0]} r={2.4} color="#fff0a0" o={0.3 * pr} />
    <HeroV2 p={P21} h={H} rig={stand(t, "determined", { ikR: tip, ikKR: 1, handR: "hold", lookX: 0.7, lookY: -0.2, lean: 4 })} extra={pencil2D(-0.6, 0.15, 0.6)} rim="120,255,230" />
  </>);
};
void Satellite3D; void CanvasPlane;
