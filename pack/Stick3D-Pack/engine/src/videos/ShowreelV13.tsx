// ENGINE v13 SHOWREEL (12 s): new cloud-puff smoke, the giant whale model + gulp action, draw-it-real, dressed sets.
// Built only with kit modules; goes through the full pipeline incl. QC (must PASS).
import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { Scene, FPS } from "./ep02/common";
import { World, HomeSet, HOME, SafeGrade } from "../kit/world";
import { Stickman } from "../kit/character";
import { ShotCam, shotPreset } from "../kit/camera";
import { Cam } from "../style/extra";
import { PuffSmoke, PuffRing } from "../kit/puff";
import { GiantWhale, gulpAt, whaleMouth } from "../kit/creatures";
import { DrawItReal, drawTip, PATHS, MagicSparkles } from "../kit/fx";
import { MoonSet, PAD, Rocket3D, Satellite3D, moonY } from "../style/set3d";
import { V3 } from "../style/kit";

const CUT = [0, 4, 8, 12];
const LABEL = [["NEW SMOKE", "cloud puffs · 3-tone shading · lit by the flame · dissolve fade"], ["GIANT WHALE", "real model · jaw opens: teeth, tongue, throat · GULP"], ["DRAW-IT-REAL", "lines at the final spot → colour fill → inflates to 3D"]];

/* A: rocket lands behind Stickman in a billowing, flame-lit smoke cloud (dressed Moon: curved horizon, mountains, rocks, footprints) */
const SegA = ({ t }: { t: number }) => {
  const land = Math.min(1, t / 2.2), e = 1 - (1 - land) ** 3; const rp: V3 = [PAD[0], 2.3 + (1 - e) * 9, PAD[2]];
  const H: V3 = [-1.3, 0, 1.9];
  return (<>
    <Cam t={t} keys={t < 2.2 ? [{ t: 0, pos: [0.9, 1.0, 7.5], look: [-2.6, 3.6, -0.5], fov: 50 }, { t: 2.2, pos: [0.7, 1.1, 7.0], look: [-2.6, 2.6, -0.5], fov: 50 }] : [{ t: 2.2, pos: [-3.4, 1.9, 7.4], look: [-1.9, 2.2, 0.4], fov: 50 }, { t: 4.3, pos: [-3.2, 2.0, 6.8], look: [-1.9, 2.3, 0.4], fov: 50 }]} impacts={[[2.2, 0.035]]} />
    <MoonSet t={t} />
    <Rocket3D p={rp} s={1.5} t={t} flame={t < 2.3 ? 1.1 : 0.05} />
    <PuffSmoke src={[rp[0], Math.max(0.6, rp[1] - 1.4), rp[2]]} t={t} t0={-0.5} t1={2.4} rate={10} vel={[0, -1.2, 0]} spread={1.6} size={0.75} life={2.6} lit={1} rise={0.35} color="#eeeaf4" seed={3} />
    <PuffRing c={[PAD[0], 0, PAD[2]]} t={t} t0={2.2} n={14} r={4.2} size={0.9} color="#ddd6e8" up={1.2} life={2.2} />
    <Stickman p={H} t={t} action={t < 2.2 ? "freezeShock" : t < 3.0 ? "scaredShake" : "laugh"} t0={t < 2.2 ? 0.3 : t < 3.0 ? 2.2 : 3.0} />
  </>);
};

/* B: the giant whale rises behind Stickman, opens its jaw (teeth, tongue, throat) and GULPS a satellite that flies past him into its mouth */
const WP: V3 = [2.6, 4.8, -15], WS = 1.35, WR = -0.2;
const SegB = ({ t }: { t: number }) => {
  const H: V3 = [-0.6, 0, 1.6], rise = Math.min(1, (t - 4) / 1.2), wp: V3 = [WP[0], WP[1] - (1 - (1 - (1 - rise) ** 3)) * 6, WP[2]];
  const M = whaleMouth(wp, WS, WR, 1), g = gulpAt(t, 6.2, 7.0, [1.7, 2.8, 1.0], M, { arc: 1.4, spin: 4 });
  return (<>
    <Cam t={t} keys={t < 6.0 ? [{ t: 4, pos: [1.4, 1.0, 7.8], look: [-0.2, 3.6, -6], fov: 50 }, { t: 6.0, pos: [1.2, 1.1, 7.2], look: [-0.2, 3.9, -6], fov: 50 }] : [{ t: 6.0, pos: [-3.5, 1.8, 7.2], look: [1.0, 3.8, -8], fov: 50 }, { t: 8.3, pos: [-3.2, 1.7, 6.6], look: [1.0, 4.0, -8], fov: 50 }]} impacts={[[7.05, 0.03]]} />
    <World preset="space" t={t} fog={false}>
      <mesh position={[0, -0.02, -10]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[90, 64]} /><meshToonMaterial color="#b9b4c8" /></mesh>
    </World>
    <GiantWhale p={wp} s={WS} t={t} rotY={WR} jaw={Math.max(g.jaw, t < 5.2 ? 0 : 0)} bulge={g.bulge} eyes={1} blink={t > 4.6 && t < 4.75 ? 1 : 0} />
    {g.visible ? <group position={g.pos} scale={g.scale * 0.8} rotation={[g.rot, g.rot * 0.6, 0]}><Satellite3D p={[0, 0, 0]} /></group> : null}
    <PuffRing c={[wp[0], 0, wp[2] + 3]} t={t} t0={4.05} n={12} r={8} size={0.9} color="#ddd6e8" up={1} life={1.6} />
    <Stickman p={H} t={t} action={t < 5.8 ? "freezeShock" : t < 7.0 ? "point" : "facepalm"} t0={t < 5.8 ? 4.2 : t < 7.0 ? 5.8 : 7.0} face={t < 7.0 ? "surprised" : undefined} />
  </>);
};

/* C: in the dressed HOME SET Stickman draws a rocket on the floor: lines appear AT the spot, fill with colour, inflate into the 3D rocket */
const DP: V3 = [-1.0, 0, -1.4], DS: [number, number] = [1.6, 2.4];
const SegC = ({ t }: { t: number }) => {
  const t0 = 8.3, draw = 1.6, prog = Math.min(1, Math.max(0, (t - t0) / draw)), tip = drawTip(PATHS.rocket, prog, DP, DS), P = HOME.heroSide;
  const ik: [number, number] = [((tip[0] - P[0]) / 3) * 1000, ((tip[1] - P[1]) / 3) * 1000];
  const done = t > t0 + draw + 0.9;
  return (<>
    <ShotCam t={t} shots={[shotPreset("medium", 8, 12.2, { subject: [(P[0] + DP[0]) / 2, 0, (P[2] + DP[2]) / 2 + 0.3], side: 0.15, frac: 0.5 })]} />
    <HomeSet t={t} />
    <DrawItReal t={t} t0={t0} p={DP} size={DS} paths={PATHS.rocket} fill="#ffffff" draw={draw} fillDur={0.35} pop={0.55}>
      <Rocket3D p={[0, 0.55, 0]} s={0.6} t={t} />
    </DrawItReal>
    {done ? <MagicSparkles t={t} c={[DP[0], 1.4, DP[2]]} area={[1.2, 1.4, 0.4]} n={8} /> : null}
    <Stickman p={P} t={t} action={done ? "celebrate" : "drawInAir"} t0={done ? t0 + draw + 0.9 : 8} prop={done ? null : "pencil"} rig={done ? undefined : { ikR: [Math.max(-300, Math.min(420, ik[0])), Math.max(250, Math.min(1000, ik[1]))], ikKR: 1, handR: "hold" }} />
  </>);
};

export const ShowreelV13: React.FC = () => { const t = useCurrentFrame() / FPS; const i = t < 4 ? 0 : t < 8 ? 1 : 2;
  return (<AbsoluteFill style={{ background: "#000" }}>
    <Audio src={staticFile("showreel13/mix.wav")} />
    <Scene first start={CUT[0]} end={CUT[1]} bg="#120a3a">{(c) => <SegA t={c.t} />}</Scene>
    <Scene start={CUT[1]} end={CUT[2]} bg="#05051a" trans="flash">{(c) => <SegB t={c.t} />}</Scene>
    <Scene start={CUT[2]} end={CUT[3]} bg="#f0a870" trans="whip">{(c) => <SegC t={c.t} />}</Scene>
    <SafeGrade />
    <div style={{ position: "absolute", left: 44, top: 110, right: 44, fontFamily: "Inter, Arial", fontWeight: 900, color: "#ffd23a", fontSize: 96, WebkitTextStroke: "14px #0b0d1a", paintOrder: "stroke fill" }}>{LABEL[i][0]}</div>
    <div style={{ position: "absolute", left: 44, top: 232, right: 44, fontFamily: "Inter, Arial", fontWeight: 900, color: "#fff", fontSize: 44, lineHeight: 1.15, WebkitTextStroke: "9px #0b0d1a", paintOrder: "stroke fill" }}>{LABEL[i][1]}</div>
  </AbsoluteFill>);
};
void moonY;
