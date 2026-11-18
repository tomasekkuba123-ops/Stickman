// EP02 scenes 1-4 (meadow): impossible door hook, chalk key, door drawn in midair, click -> opens.
import React from "react";
import { Box } from "../../style/toon";
import { Cam, Key, camAt, FaceGroup } from "../../style/extra";
import { ChalkKey, ChalkDraw, DOOR_PATHS, pathTip, SGlow, Sparkles, Cloud } from "../../style/sky";
import { Ctx, Hero, HeldKey, armForTip, Meadow, MagicDoor, gy, seg, lerp, clamp, ease, V3, HH } from "./common";

/* ===== S1 0-3.85 "What if Stickman drew a door... and the sky opened?" =====
   flash-forward: a glowing door floats in the sky; fast push-in, then smash down to Stickman staring up; door opens on "opened". */
const D1: V3 = [0, 8.6, -8];
const K1: Key[] = [
  { t: 0, pos: [0.8, 6.4, 2.0], look: [0, 10.2, -8], fov: 44 },
  { t: 1.12, pos: [0.3, 8.2, -2.4], look: [0, 10.3, -8], fov: 40 },
  { t: 1.42, pos: [2.0, 1.6, 11.2], look: [0.0, 3.5, -3.0], fov: 60 },
  { t: 2.6, pos: [1.8, 1.6, 10.5], look: [0.0, 3.6, -3.0], fov: 60 },
  { t: 4.0, pos: [1.6, 1.6, 9.8], look: [0.0, 3.7, -3.0], fov: 59 },
];
export const S1 = ({ t, f }: Ctx) => {
  const open = seg(t, 2.67, 3.25, ease.back), P: V3 = [0, gy(0, 0), 0];
  const shield = seg(t, 2.75, 3.05, ease.o);
  return (<>
    <Cam t={t} keys={K1} fovKick={[1.42]} />
    <Meadow t={t} wind={1 + open * 2.5} />
    {/* the impossible door, bobbing in the sky with cloud wisps passing */}
    <group position={[D1[0], D1[1] + Math.sin(t * 1.6) * 0.12, D1[2]]} rotation={[0, 0, Math.sin(t * 1.1) * 0.03]}>
      <MagicDoor p={[0, 0, 0]} w={2.6} h={3.9} solid={1} open={open} glow={1 + Math.sin(t * 6) * 0.2} />
      <Sparkles t={t} c={[0, 1.9, 0.4]} area={[2.4, 2.6, 0.6]} n={14} color="#9ff4ff" size={0.14} rise={1.2} />
    </group>
    {open > 0 ? [0, 1, 2, 3, 4, 5].map((i) => <SGlow key={i} p={[D1[0] + Math.sin(i * 1.7) * 1.2 * open, D1[1] + 1.8 - i * 1.4 * open, D1[2] + 1 + i * 0.6]} r={1.0 + open * 0.8} color="#ffe2a8" o={0.22 * open} />) : null}
    <Cloud p={[-6.5 + t * 0.5, 9.0, -11]} s={0.9} seed={21} /><Cloud p={[6.5 - t * 0.4, 7.0, -12]} s={1.1} seed={22} />
    {/* leaves blown by the door wind */}
    {open > 0 ? [0, 1, 2, 3, 4, 5, 6].map((i) => { const u = (t - 2.67) * (1.2 + i * 0.15); return <Box key={i} p={[-2 + i * 0.7 + u * 1.2, 1.2 + Math.sin(u * 3 + i) * 0.6 + i * 0.25, 1.5 + u * 1.5]} s={[0.18, 0.04, 0.12]} rot={[u * 4, u * 3, i]} color={i % 2 ? "#4fd06a" : "#8ee06a"} line={1} />; }) : null}
    <Hero p={P} f={f} pose={{ mood: t < 2.67 ? "shock" : "shock", lookY: -1, lookX: 0, squash: t < 1.6 ? -0.05 : 0.04 * Math.sin((t - 1.6) * 5) * Math.exp(-(t - 1.6) * 2) - shield * 0.06, tilt: -0.06 * shield,
      armR: [0.16, 0.8], armRK: shield, armL: [-0.24, 0.42], armLK: seg(t, 1.5, 1.9) * 0.6, nerv: 0.2 }} />
  </>);
};

/* ===== S2 3.85-7.15 "He found a glowing chalk key hidden in the grass." (rewind swoosh) ===== */
const KEY0: V3 = [0.74, 0, 0.35]; KEY0[1] = gy(KEY0[0], KEY0[2]) + 0.06;
const P2x = (t: number) => lerp(-4.2, -0.3, seg(t, 3.7, 4.95, ease.sin));
const K2: Key[] = [
  { t: 3.7, pos: [-2.6, 1.6, 9.6], look: [-2.2, 0.9, 0], fov: 46 },
  { t: 5.1, pos: [0.2, 1.3, 8.2], look: [0.1, 0.6, 0], fov: 46 },
  { t: 7.3, pos: [0.2, 1.7, 7.2], look: [0.0, 0.9, 0], fov: 46 },
];
export const S2 = ({ t, f }: Ctx) => {
  const x = P2x(t), P: V3 = [x, gy(x, 0), 0], moving = t > 3.75 && t < 4.95;
  const crouch = seg(t, 5.2, 5.6, ease.sin) * (1 - seg(t, 5.85, 6.25, ease.sin));
  const reach = seg(t, 5.25, 5.7, ease.sin), grabbed = t >= 5.75, lift = seg(t, 5.8, 6.35, ease.back);
  const arm: [number, number] = grabbed ? [lerp(0.3, 0.2, lift), lerp(0.08, 0.66, lift)] : [0.3, 0.08];
  const glow = 0.5 + 0.5 * seg(t, 4.4, 4.7) + 0.2 * Math.sin(t * 7);
  return (<>
    <Cam t={t} keys={K2} />
    <Meadow t={t} />
    {!grabbed ? <group><ChalkKey p={KEY0} rot={[-Math.PI / 2 + 0.15, 0, 0.4]} s={0.55} glow={glow} /><SGlow p={[KEY0[0] + 0.2, KEY0[1] + 0.3, KEY0[2]]} r={0.8 + 0.4 * glow} color="#5fe8ff" o={0.5 * glow} /></group> : <HeldKey P={P} arm={arm} ang={0.9 + lift * 0.5} sq={-0.18 * crouch} glow={1 + lift * 0.6} />}
    {grabbed ? <Sparkles t={t} c={[P[0] + 0.7, P[1] + 2.4, 0.3]} area={[0.8, 0.8, 0.3]} n={10} color="#9ff4ff" size={0.1} rise={2} o={lift} /> : null}
    <Hero p={P} f={f} pose={{ walk: (x + 4.2) * 3.4, speed: moving ? 0.9 : 0, mood: t < 4.5 ? "smile" : t < 5.8 ? "shock" : "laugh", lookY: t > 4.6 && t < 5.9 ? 1 : 0, lookX: t > 4.5 && t < 5.9 ? 0.8 : 0,
      squash: -0.2 * crouch, hunch: 0.6 * crouch, armR: arm, armRK: grabbed ? 1 : reach, armL: [-0.26, 0.5 + 0.2 * lift], armLK: lift * 0.8 }} />
  </>);
};

/* ===== S3 7.15-11.1 "With one shaky line, he drew a door in midair." stroke-by-stroke ===== */
export const DOOR3 = { cx: 0.9, z: -0.45, Wp: 2.9, Hp: 3.59 };
const DG = gy(0.9, -0.45);
const tipWorld = (prog: number): V3 => { const [u, v] = pathTip(DOOR_PATHS, prog); return [DOOR3.cx - DOOR3.Wp / 2 + u * DOOR3.Wp, DG + 1.72 + DOOR3.Hp / 2 - v * DOOR3.Hp, DOOR3.z]; };
export const drawProg = (t: number) => { const a = seg(t, 7.6, 10.15, (x) => x), wob = Math.sin(t * 9) * 0.004; return clamp(a + (a > 0 && a < 1 ? wob : 0)); };
const P3x = (t: number) => { const tp = tipWorld(drawProg(t)); return clamp(tp[0] - 1.15, -1.3, 0.85); };
const K3: Key[] = [
  { t: 7.0, pos: [-0.9, 1.8, 7.6], look: [-0.6, 0.9, 0], fov: 50 },
  { t: 9.0, pos: [0.2, 1.9, 8.6], look: [0.5, 1.2, -0.4], fov: 52 },
  { t: 11.3, pos: [1.0, 1.9, 9.0], look: [0.9, 1.2, -0.4], fov: 52 },
];
export const S3 = ({ t, f }: Ctx) => {
  const prog = drawProg(t), x = P3x(t), P: V3 = [x, gy(x, 0.2), 0.2];
  const moving = Math.abs(P3x(t + 0.05) - x) > 0.004;
  const tp = tipWorld(prog), ang = prog > 0.18 && prog < 0.52 ? 1.15 : 0.55;
  const drawing = prog > 0 && prog < 1;
  const tipLoc: [number, number] = [(tp[0] - x) / HH, (tp[1] - P[1]) / HH];
  const idle: [number, number] = [0.2, 0.66];
  const k = seg(t, 7.3, 7.6, ease.sin) * (1 - seg(t, 10.2, 10.6, ease.sin));
  const arm: [number, number] = drawing || k > 0 ? [lerp(idle[0], armForTip(tipLoc, ang)[0], k), lerp(idle[1], armForTip(tipLoc, ang)[1], k)] : idle;
  return (<>
    <Cam t={t} keys={K3} />
    <Meadow t={t} />
    <FaceGroup p={[DOOR3.cx, DG + 1.72, DOOR3.z]}><ChalkDraw p={[0, 0, 0]} s={[DOOR3.Wp, DOOR3.Hp]} paths={DOOR_PATHS} prog={prog} t={t} width={11} /></FaceGroup>
    {drawing ? <SGlow p={[tp[0], tp[1], tp[2] + 0.2]} r={0.5} color="#bff8ff" o={0.9} /> : null}
    {drawing ? <Sparkles t={t} c={[tp[0], tp[1], tp[2] + 0.2]} area={[0.3, 0.3, 0.1]} n={6} color="#bff8ff" size={0.08} rise={4} /> : null}
    <HeldKey P={P} arm={arm} ang={lerp(1.4, ang, k)} glow={1.3} />
    <Hero p={P} f={f} pose={{ walk: (x + 1.3) * 3.4, speed: moving ? 0.55 : 0, mood: prog >= 1 ? "laugh" : "smile", lookX: drawing ? 0.9 : 0.4, lookY: drawing && tipLoc[1] > 0.8 ? -1 : 0, armR: arm, armL: [-0.24, 0.42], armLK: 0.3 }} />
  </>);
};

/* ===== S4 11.1-13.85 "Click. It opened." key turns in the lock, outline gains depth, door swings away ===== */
const LOCK: V3 = [DOOR3.cx - 1.1 + 0.86 * 2.2, DG + 1.65, DOOR3.z + 0.12];
const K4: Key[] = [
  { t: 10.9, pos: [3.4, 1.8, 3.4], look: [1.6, 0.9, -0.4], fov: 46 },
  { t: 11.9, pos: [3.0, 1.9, 4.8], look: [1.3, 1.0, -0.4], fov: 48 },
  { t: 12.6, pos: [1.8, 2.0, 8.0], look: [0.9, 1.2, -0.6], fov: 54 },
  { t: 14.0, pos: [1.2, 2.2, 9.2], look: [0.8, 1.3, -0.8], fov: 54 },
];
export const S4 = ({ t, f }: Ctx) => {
  const P: V3 = [0.85, gy(0.85, 0.2), 0.2];
  const ins = seg(t, 10.95, 11.3, ease.sin), turn = seg(t, 11.3, 11.42, ease.back), solid = seg(t, 11.38, 11.75, ease.back);
  const open = seg(t, 12.4, 13.1, ease.o), rec = seg(t, 12.45, 12.8, ease.o);
  const outlineO = 1 - seg(t, 11.4, 11.8);
  const lockLoc: [number, number] = [(LOCK[0] - P[0]) / HH, (LOCK[1] - P[1]) / HH];
  const armK = 1 - seg(t, 12.3, 12.6, ease.sin);
  const arm: [number, number] = [lerp(0.2, armForTip(lockLoc, 0.15)[0], ins * armK), lerp(0.66, armForTip(lockLoc, 0.15)[1], ins * armK)];
  return (<>
    <Cam t={t} keys={K4} fovKick={[11.38]} impacts={[[11.38, 0.012]]} />
    <Meadow t={t} wind={1 + open * 3} />
    <FaceGroup p={[DOOR3.cx, DG + 1.72, DOOR3.z]}><ChalkDraw p={[0, 0, 0.02]} s={[DOOR3.Wp, DOOR3.Hp]} paths={DOOR_PATHS} prog={1} o={outlineO} t={t} width={11} /></FaceGroup>
    <MagicDoor p={[DOOR3.cx, DG, DOOR3.z - 0.1]} w={2.2} h={3.3} solid={solid} open={open} glow={0.6 + outlineO * 0.6} />
    {turn > 0 && t < 11.9 ? <SGlow p={[LOCK[0], LOCK[1], LOCK[2] + 0.2]} r={0.9 * Math.exp(-(t - 11.38) * 5) + 0.1} color="#ffffff" o={0.9} /> : null}
    {open > 0 ? <Sparkles t={t} c={[DOOR3.cx, DG + 1.7, 0.4]} area={[1.4, 1.8, 0.6]} n={16} color="#ffe6b0" size={0.12} rise={1.5} o={open} /> : null}
    {open > 0 ? [0, 1, 2, 3, 4, 5].map((i) => { const u = (t - 12.4) * (1 + i * 0.2); return <Box key={i} p={[0.9 + Math.sin(i * 2) * 0.8 + u * 0.3, 1.0 + i * 0.3 + Math.sin(u * 4 + i) * 0.3, 0.2 + u * 2.4]} s={[0.16, 0.04, 0.11]} rot={[u * 5, u * 3, i]} color={i % 2 ? "#ffd8f0" : "#ffffff"} line={1} />; }) : null}
    <HeldKey P={P} arm={arm} ang={0.15} glow={1.2} spin={turn * 1.2} />
    <Hero p={P} f={f} pose={{ mood: t < 12.4 ? "smile" : "shock", lookX: t < 12.4 ? 0.8 : 0.2, squash: -0.08 * rec + 0.05 * rec * Math.exp(-(t - 12.8) * 4) * (t > 12.8 ? 1 : 0), tilt: -0.08 * rec, armR: arm, armL: [-0.28, 0.62], armLK: rec * 0.8 }} />
  </>);
};
void camAt;
