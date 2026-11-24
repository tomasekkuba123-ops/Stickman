// EP09 v18 (round 3): bigger hero (size A = 58 % of the height in every normal shot, size B = 68 % only for the hook + ending),
// lower ground line, body acting (kit/acting.ts: head turns BEFORE the hand, weight shifts, knee dips, startled step back, stumble, shiver),
// HD animals (kit/animals.tsx), flashlight beam lighting the field, one-spot seasons montage, ending = hook framing (loops to frame 0).
import React from "react";
import * as THREE from "three";
import { Cam, Key } from "../../style/extra";
import { V3 } from "../../style/kit";
import { Stickman, LipCue } from "../../kit/character";
import { Face, RigOut } from "../../style/stickman";
import { DepthPass, KModel } from "../../kit/envlib";
import { NightField, MoonShore, SpaceDiorama, Earth3, RockPlatform, TorchBeam, ForestGlade, Branch, SeasonHill } from "../../kit/sets4";
import { GroundHaze } from "../../kit/diorama";
import { canvasTex } from "../../style/set3d";
import { SGlow, Lightning } from "../../style/sky";
import { frameShot, framePose, worldAt, screenDir, FULL, CLOSE, SY_A, SY_B, FrameOpts } from "../../kit/frame";
import { GKey, beat, WWord, aim, GEST, Pose2 } from "../../kit/gesture";
import { act, stepBack, AKey } from "../../kit/acting";
import { Animal, QPop, FishSchool, Spawn } from "../../kit/animals";
import MOUTH from "../../../public/ep09/mouth.json";
import WORDS from "../../../public/ep09/words.json";

export type Ctx = { t: number; f: number };
const LIPS = (MOUTH as { mouthCues: LipCue[] }).mouthCues;
const W = WORDS as WWord[];
export const seg = (t: number, a: number, b: number) => Math.max(0, Math.min(1, (t - a) / (b - a)));
const sm = (x: number) => { const u = Math.max(0, Math.min(1, x)); return u * u * (3 - 2 * u); };
const faceAt = (t: number, list: [number, Face][]) => { let f = list[0][1]; for (const [a, x] of list) if (t >= a) f = x; return f; };
const shot = (t: number, list: [number, Key[]][]) => { let k = list[0][1]; for (const [t0, ks] of list) if (t >= t0) k = ks; return k; };
const poseAt = <T,>(t: number, list: [number, T][]) => { let k = list[0][1]; for (const [t0, ks] of list) if (t >= t0) k = ks; return k; };
const wt = (w: string, from = 0) => (W.find((x) => x.start >= from && x.word.toLowerCase().replace(/[^a-z']/g, "") === w)?.start ?? from);
/* eyes: eased glance keys [t, lookX, lookY] — set ~0.25 s BEFORE the matching hand gesture (head turn keys ~0.35 s before) */
const eyes = (t: number, keys: [number, number, number][]) => { let i = 0; while (i < keys.length - 1 && t >= keys[i + 1][0]) i++; const [, x0, y0] = keys[i], nx = keys[i + 1];
  if (!nx || t < nx[0] - 0.18) return { lookX: x0, lookY: y0 }; const k = sm((t - (nx[0] - 0.18)) / 0.18); return { lookX: x0 + (nx[1] - x0) * k, lookY: y0 + (nx[2] - y0) * k }; };
/* billboard base so its CENTRE lands at screen (sx, sy) at distance d */
const at = (pose: { pos: V3; look: V3; fov?: number }, sx: number, sy: number, d: number, h: number): V3 => { const c = worldAt(pose, sx, sy, d); return [c[0], c[1] - h * 0.483, c[2]]; };
const basis = (pose: { pos: V3; look: V3 }) => { const f = [pose.look[0] - pose.pos[0], pose.look[2] - pose.pos[2]], fl = Math.hypot(f[0], f[1]) || 1; const F: V3 = [f[0] / fl, 0, f[1] / fl], R: V3 = [-F[2], 0, F[0]]; return { R, F }; };
const SHO = (p: V3): V3 => [p[0] + 0.25, p[1] + 2.0, p[2]];
/* size A / size B framing */
const A = (o: FrameOpts): FrameOpts => ({ frac: FULL, sy: SY_A, fov: 42, camY: 1.0, ...o });
const B = (o: FrameOpts): FrameOpts => ({ frac: CLOSE, sy: SY_B, fov: 42, camY: 1.05, ...o });
/* special arm poses by hand targets (rig units: x from the body centre, y up from the soles; head centre ~ 840) */
const SHIELD = { ikL: [-20, 1085] as [number, number], ikKL: 1, handL: "open" as const, handRotL: -80, handsOverHead: true };
const HUG = (t: number) => ({ ikL: [70 + Math.sin(t * 50) * 4, 610] as [number, number], ikKL: 1, ikR: [-70, 590 + Math.sin(t * 47) * 4] as [number, number], ikKR: 1, handL: "relaxed" as const, handR: "relaxed" as const });
const SCRATCH = (t: number) => ({ ikR: [165 + Math.sin(t * 22) * 14, 1060 + Math.sin(t * 22) * 12] as [number, number], ikKR: 1, handR: "relaxed" as const, handsOverHead: true });

/* ================= S1 HOOK 0–3.0 (size B) ================= */
export const PH: V3 = [0, 0, 0];
export const HOOK_O: FrameOpts = B({ yaw: -0.22, sx: 0.47, push: 0.95, drift: 0.05 });
const HP = framePose(PH, HOOK_O, 0);
export const MOON_P = worldAt(HP, 0.8, 0.27, 70);
export const HOOK_FACE = { lookX: 0.45, lookY: -0.7, headTilt: -6 };
const G1: GKey[] = [{ t: 0.8, g: aim(screenDir(HP, SHO(PH), MOON_P) + 14), in: 0.35, hold: 0.3 }, { t: 1.45, g: "whoa", in: 0.14, hold: 0.45 }, { t: 2.3, g: "palmUpL", in: 0.3, hold: 0.4 }];
const ACT1: AKey[] = [{ t: 0.0, turn: 0.35, tilt: -6 }, { t: 0.5, turn: 0.75, tilt: -9, d: 0.3 }, { t: 1.45, back: 0.32, lean: -9, dip: 0.7, lift: -0.7, turn: 0.6, tilt: -4, d: 0.14 }, { t: 1.8, back: 0.32, lean: -4, dip: 0.3, turn: 0.55, d: 0.3 }, { t: 2.3, back: 0.32, turn: 0.05, tilt: 3, dip: 0.15, d: 0.35 }, { t: 2.9, back: 0.32, turn: 0.1, d: 0.4 }];
export const vanishAt = (t: number) => seg(t, 0.95, 2.15);
const BEDP = (t: number) => Math.sin(t * 0.35) * 22 - (t % 6) * 3;
export const S1 = ({ t }: Ctx) => { const v = vanishAt(t), dark = sm(seg(t, 1.3, 2.4)), a = act(t, ACT1);
  return (<NightField t={t} dark={dark} vanish={v} moonP={MOON_P}>
    <Cam t={t} keys={frameShot(PH, 0, 3.05, HOOK_O)} impacts={[[1.5, 0.012]]} />
    <Stickman p={stepBack(PH, HP, a.back)} t={t} action="idle" lips={LIPS} gest={G1} face={faceAt(t, [[0, "smile"], [1.15, "surprised"], [2.2, "scared"]])}
      rig={{ ...a.rig, ...eyes(t, [[0, 0.45, -0.7], [0.4, 0.7, -0.9], [1.5, 0.35, -0.85], [2.15, 0.0, -0.1]]), ...(t < 0.8 ? { blink: 0 } : {}) }} />
    <DepthPass focus={6.6} blur={2.2} />
  </NightField>); };
void BEDP;

/* ================= S7 ENDING 32.7–38.0: size B, hook framing; full night field + fireflies; the Moon returns (ghost -> pop) ================= */
const O7A = B({ yaw: -0.3, sx: 0.5, push: 0.95, drift: 0.04 });
const O7B = B({ yaw: -0.12, sx: 0.5, push: 0.96, drift: -0.04 });
const G7: GKey[] = [{ t: wt("so", 32.5) + 0.04, g: "chin", in: 0.3, hold: 0.5 }, { t: wt("moon", 33) + 0.04, g: aim(screenDir(HP, SHO(PH), MOON_P) + 14), in: 0.3, hold: 0.35 },
  { t: wt("tonight", 33.9) + 0.04, g: "count", in: 0.25 }, { t: wt("would", 34.8) + 0.04, g: "palmUp" }, { t: wt("notice", 35.3) + 0.04, g: "shrug", hold: 0.9 }];
const ACT7: AKey[] = [{ t: 32.7, turn: -0.1, tilt: 6 }, { t: 33.3, turn: 0.7, tilt: -8, d: 0.3 }, { t: 34.1, turn: 0.1, tilt: 2, d: 0.3 }, { t: 35.5, turn: -0.15, tilt: 7, dip: 0.3, d: 0.3 }, { t: 36.4, turn: 0.75, tilt: -9, dip: 0, d: 0.35 }, { t: 37.3, turn: 0.35, tilt: -6, d: 0.5 }];
export const S7 = ({ t }: Ctx) => { const back = seg(t, 36.7, 37.4), ghost = sm(seg(t, 33.0, 35.8)) * (back > 0 ? 0 : 1), a = act(t, ACT7, { swayT: t - 38 }); // continuous sway phase ends at ~0 to match S1 at t=0 (seamless loop)
  const end: Key[] = [{ ...framePose(PH, { ...HOOK_O, frac: CLOSE * 0.97 }, 0), t: 36.55 }, { ...HP, t: 37.55 }, { ...HP, t: 38.1 }];
  const cam = t < 34.9 ? frameShot(PH, 32.7, 34.9, O7A) : t < 36.55 ? frameShot(PH, 34.9, 36.55, O7B) : end;
  const lk = t > 37.0 ? HOOK_FACE : eyes(t, [[32.7, -0.2, -0.1], [33.4, 0.6, -0.8], [34.1, 0, 0], [36.35, 0.5, -0.8]]);
  const rig = t > 37.3 ? { ...a.rig, headTurn: 0.35, ...HOOK_FACE } : { ...a.rig, ...lk };
  const bgT = t < 37.55 ? t - 38 : 0; // ambient (Moon, clouds, haze, grass/prop sway, fireflies) phase ends at the t=0 state -> exact loop
  return (<NightField t={t} bgT={bgT} dark={1 - sm(back)} vanish={back > 0 ? 0 : 2} back={back} ghost={ghost} moonP={MOON_P} fireflies={1.4}>
    <Cam t={t} keys={cam} />
    <Stickman p={PH} t={t} action="idle" lips={LIPS} gest={G7} face={faceAt(t, [[32.7, "think"], [35.0, "confused"], [36.7, "surprised"], [37.35, "smile"]])} rig={{ ...rig, ...(t > 36.9 ? { blink: 0 } : {}) }} />
    <DepthPass focus={6.6} blur={2.2} />
  </NightField>); };

/* ================= S3 OCEAN / TIDES 9.7–16.4 (one view direction: lighthouse, horizon, rocks stay put) ================= */
const P3: V3 = [0, 0, 3.4], MARK: V3 = [1.9, 0, -0.9];
const O3A = A({ yaw: 0.05, camY: 1.1, sx: 0.55, drift: -0.02 });
const O3B = A({ yaw: 0.05, camY: 0.85, sx: 0.47, drift: 0.015 });
const O3C = A({ yaw: 0.05, camY: 1.6, sx: 0.48, push: 0.97, drift: 0.015 });
const P3A = framePose(P3, O3A, 0), P3B = framePose(P3, O3B, 0), P3C = framePose(P3, O3C, 0);
const LH: V3 = (() => { const w = worldAt(P3A, 0.15, 0.4, 70); return [w[0], 1, w[2]]; })();
const GHOST_P = worldAt(P3B, 0.8, 0.17, 90);
const K3: [number, Key[]][] = [[9.7, frameShot(P3, 9.7, 11.75, O3A)], [11.75, frameShot(P3, 11.75, 13.45, O3B)], [13.45, frameShot(P3, 13.45, 16.45, O3C)]];
export const tideAt = (t: number) => 1 - 0.75 * sm(seg(t, 14.3, 15.8));
export const ghostAt = (t: number) => sm(seg(t, 11.75, 12.25)) * (1 - sm(seg(t, 13.5, 14.0)));
const SH3 = SHO(P3);
const G3: GKey[] = [{ t: wt("oceans", 9.6) + 0.04, g: "present" }, { t: wt("change", 10) + 0.04, g: "chop" },
  { t: wt("moon", 11.5) + 0.04, g: aim(screenDir(P3B, SH3, GHOST_P) + 10), in: 0.32, hold: 0.4 }, { t: wt("most", 12) + 0.04, g: "count" }, { t: wt("tides", 12.9) + 0.04, g: "palmUpL" }, { t: wt("they'd", 13.8) + 0.04, g: "fist" },
  { t: wt("shrink", 14.2) + 0.02, g: "whoa", in: 0.14, hold: 0.25 }, { t: wt("less", 14.5) + 0.04, g: aim(screenDir(P3C, SH3, [MARK[0], 0.2, MARK[2] - 2.5])), in: 0.25, hold: 0.3 }, { t: wt("half", 15) + 0.04, g: "palmUp2", hold: 0.5 }];
const EY3: [number, number, number][] = [[9.7, -0.6, -0.2], [10.8, 0, 0], [wt("moon", 11.5) - 0.25, 0.6, -0.9], [12.6, 0.1, -0.1], [14.0, 0.5, 0.5], [15.6, 0, 0]];
const ACT3: AKey[] = [{ t: 9.7, turn: -0.6, tilt: 4 }, { t: 10.7, turn: 0, d: 0.35 }, { t: 11.45, turn: 0.65, tilt: -8, d: 0.3 }, { t: 12.5, turn: 0.05, tilt: 0, d: 0.35 }, { t: 13.3, dip: 0.4, d: 0.3 }, { t: 13.9, turn: 0.55, tilt: 6, dip: 0, d: 0.3 },
  { t: 14.42, back: 0.38, lean: -10, dip: 0.6, lift: 0.7, turn: 0.45, d: 0.14 }, { t: 14.8, back: 0.38, lean: 3, dip: 0.1, turn: 0.5, tilt: 5, d: 0.28 }, { t: 15.3, back: 0.38, turn: 0, dip: 0.35, d: 0.3 }, { t: 15.9, back: 0.38, dip: 0, d: 0.3 }];
export const S3 = ({ t }: Ctx) => { const a = act(t, ACT3, { seed: 3 }), pose = t < 11.75 ? P3A : t < 13.45 ? P3B : P3C;
  return (<MoonShore t={t} tide={tideAt(t)} ghost={ghostAt(t)} ghostP={GHOST_P} lighthouse={LH} marker={MARK} hero={P3}>
    <Cam t={t} keys={shot(t, K3)} />
    <Stickman p={stepBack(P3, pose, a.back)} t={t} action="idle" lips={LIPS} gest={G3} face={faceAt(t, [[9.7, "smile"], [11.75, "happy"], [13.45, "surprised"], [14.3, "scared"], [14.9, "worried"], [15.3, "surprised"]])} rig={{ ...a.rig, ...eyes(t, EY3) }} />
    <DepthPass focus={6.9} blur={2.2} />
  </MoonShore>); };

/* ================= S5 EARTH IN SPACE 25.0–28.65 (platform; shields his eyes from the Sun; stumbles when the Earth wobbles) ================= */
const PLAT: V3 = [-1.6, -0.25, 1.6], ER = 1.45;
const O5A = A({ fov: 50, yaw: -0.25, camY: 1.3, sx: 0.36, push: 0.95, drift: 0.06 });
const O5B = A({ fov: 50, yaw: -0.2, camY: 1.2, sx: 0.36, push: 0.96, drift: -0.03 });
const PB5: V3 = [PLAT[0], 0, PLAT[2]];
const P5A = framePose(PB5, O5A, 0);
const EARTH: V3 = worldAt(framePose(PB5, O5A, 0.5), 0.74, 0.3, 10.5), SUN: V3 = worldAt(P5A, 0.12, 0.08, 110);
export const wobbleAt = (t: number) => { const env = sm(seg(t, 27.4, 27.9)), ph = ((t - 27.4) / 2.0) * Math.PI * 2; return { tilt: 23.4 + 32 * Math.sin(ph) * env, prec: 0.85 * Math.sin(ph - 0.9) * env, env, ph }; };
const K5: [number, Key[]][] = [[25.0, frameShot(PB5, 25.0, 27.3, O5A)], [27.3, frameShot(PB5, 27.3, 28.7, O5B)]];
const SH5: V3 = [PLAT[0] + 0.25, 2.0, PLAT[2]];
const G5: GKey[] = [{ t: wt("millions", 25.4) + 0.04, g: "palmUp" }, { t: wt("earth's", 26) + 0.04, g: aim(screenDir(P5A, SH5, EARTH), "open"), in: 0.3, hold: 0.5 },
  { t: wt("tilt", 27) + 0.04, g: aim(screenDir(P5A, SH5, [EARTH[0], EARTH[1] + ER * 1.6, EARTH[2]])), in: 0.28, hold: 0.25 }, { t: wt("wobble", 28) + 0.02, g: "whoa", in: 0.16, hold: 0.4 }];
const EY5: [number, number, number][] = [[25, -0.6, -0.6], [25.9, 0.2, -0.1], [wt("earth's", 26) - 0.25, 0.8, -0.3], [wt("tilt", 27) - 0.25, 0.8, -0.6], [28.0, 0.6, -0.3]];
const ACT5: AKey[] = [{ t: 25.0, turn: -0.6, tilt: -6, lean: -3 }, { t: 25.95, turn: 0.1, tilt: 0, lean: 0, d: 0.3 }, { t: 26.25, turn: 0.75, tilt: -4, d: 0.3 }, { t: 27.35, turn: 0.7, tilt: -9, d: 0.3 },
  { t: 28.05, lean: 13, dx: 40, lift: 0.8, dip: 0.5, turn: 0.4, d: 0.16 }, { t: 28.3, lean: -10, dx: -25, lift: -0.6, dip: 0.6, d: 0.2 }, { t: 28.6, lean: 3, dx: 0, lift: 0, dip: 0.2, d: 0.2 }];
export const S5 = ({ t }: Ctx) => { const w = wobbleAt(t), bob = Math.sin(t * 1.3) * 0.08, P: V3 = [PLAT[0], PLAT[1] + bob, PLAT[2]], a = act(t, ACT5, { seed: 5 });
  const shield = t < 25.95 ? sm(seg(t, 25.05, 25.3)) : 0;
  return (<SpaceDiorama t={t} sun={SUN}>
    <Cam t={t} keys={shot(t, K5)} />
    <Earth3 p={EARTH} r={ER} t={t} tilt={w.tilt} prec={w.prec} />
    <RockPlatform p={P} t={t} s={1.25} />
    <Stickman p={[P[0], P[1] + 0.1, P[2]]} t={t} action="idle" lips={LIPS} shadow={false} gest={G5}
      face={faceAt(t, [[25, "happy"], [27.5, "surprised"], [28.05, "scared"]])} rig={{ ...a.rig, ...eyes(t, EY5), zeroG: 1, ...(shield > 0.5 ? SHIELD : {}) }} />
    <DepthPass focus={6.9} blur={1.8} />
  </SpaceDiorama>); };

/* ================= S2 DARK NIGHT + FLASHLIGHT 3.0–9.7: faint blue ambient, volumetric beam forward + slightly down, sweeping grass, fence, tree ================= */
const P2: V3 = [0, 0, 0];
const O2A = A({ yaw: 0.3, sx: 0.43, drift: -0.05 });
const O2B = A({ yaw: 0.22, camY: 0.75, sx: 0.46, drift: 0.04 });
const O2C = A({ yaw: 0.05, camY: 1.2, sx: 0.5, push: 0.93, drift: 0.03 });
const P2A = framePose(P2, O2A, 0.5), P2B = framePose(P2, O2B, 0.5), P2C = framePose(P2, O2C, 0.5);
const K2: [number, Key[]][] = [[3.0, frameShot(P2, 3.0, 5.0, O2A)], [5.0, frameShot(P2, 5.0, 7.0, O2B)], [7.0, frameShot(P2, 7.0, 9.75, O2C)]];
/* field the beam reveals, laid out in the camera frame of shot 2A: lateral (screen right) + depth, so the cone reads from the side */
const { R: R2, F: F2 } = basis(P2A);
const fieldAt = (lat: number, dep: number, y = 0): V3 => [P2[0] + R2[0] * lat + F2[0] * dep, y, P2[2] + R2[2] * lat + F2[2] * dep];
const FENCE2: V3[] = Array.from({ length: 6 }, (_, i) => fieldAt(1.3 + i * 0.32, 2.6 + i * 0.95));
const TREE2: V3 = fieldAt(3.0, 9.0), BUSH2: V3 = fieldAt(2.0, 1.4);
/* beam target on the ground: sweeps grass -> fence -> tree -> back (forward + slightly down from the hand) */
const beamTo = (t: number): V3 => { const u = t < 3.9 ? 0.1 : t < 7.0 ? sm(seg(t, 3.9, 5.1)) * 0.8 + 0.2 * sm(seg(t, 5.3, 6.2)) - 0.45 * sm(seg(t, 6.2, 6.95)) : 0.45;
  return fieldAt(1.5 + u * 1.5, 2.2 + u * 6.2, 0.1 + 0.9 * sm(seg(u, 0.7, 0.95))); };
const torchTh = (t: number, pose: { pos: V3; look: V3; fov?: number }) => { const d = screenDir(pose, SHO(P2), beamTo(t)); return Math.max(60, Math.min(150, 90 + d)) + 2 * Math.sin(t * 1.9); };
const handWorld = (pose: { pos: V3; look: V3 }, th: number): V3 => { const { R } = basis(pose), a = (th * Math.PI) / 180, x = 0.4 + Math.sin(a) * 0.78, y = 1.7 - Math.cos(a) * 0.78; return [P2[0] + R[0] * x, P2[1] + y, P2[2] + R[2] * x]; };
const torch = (on: number, th: number) => (c: CanvasRenderingContext2D, o: RigOut) => { c.save(); c.translate(o.gloveR[0], o.gloveR[1]); c.rotate(Math.PI - (th * Math.PI) / 180); c.scale(o.S / 0.9, o.S / 0.9);
  c.fillStyle = "#3a3f5a"; c.beginPath(); c.roundRect(-14, -70, 28, 92, 8); c.fill(); c.lineWidth = 6; c.strokeStyle = "#1A1A1A"; c.stroke();
  c.fillStyle = "#c9cfe0"; c.beginPath(); c.roundRect(-20, -92, 40, 26, 6); c.fill(); c.stroke(); if (on > 0) { c.fillStyle = `rgba(255,246,190,${on})`; c.beginPath(); c.ellipse(0, -94, 18, 6, 0, 0, Math.PI * 2); c.fill(); } c.restore(); };
const G2: GKey[] = [{ t: wt("notice", 3.5) + 0.04, g: "palmUpL" }, { t: wt("dark", 4) + 0.04, g: "chopL", hold: 0.2 }, { t: wt("no", 5) + 0.04, g: "present" },
  { t: wt("stars", 5.9) + 0.04, g: aim(140), hold: 0.4 }, { t: wt("much", 7.3) + 0.04, g: "chopL", hold: 0.15 }, { t: wt("darker", 8) + 0.04, g: "fist", hold: 0.6 }];
const leftOnly = (keys: GKey[]): GKey[] => keys.map((k) => { const P = typeof k.g === "string" ? GEST[k.g] : k.g; return { ...k, g: { ...P, R: GEST.rest.R } as Pose2 }; });
const ACT2: AKey[] = [{ t: 3.0, turn: -0.3, dip: 0.3, lean: -2 }, { t: 3.75, turn: 0.6, tilt: 4, dip: 0.1, d: 0.25 }, { t: 5.0, turn: 0.3, tilt: -10, d: 0.3 }, { t: 5.7, turn: -0.4, tilt: -12, d: 0.35 }, { t: 6.8, turn: 0.1, tilt: -4, d: 0.3 },
  { t: 7.5, turn: 0, tilt: 0, dip: 0.5, lean: -5, shiver: 0.3, d: 0.3 }, { t: 8.2, dip: 0.7, lean: -7, shiver: 0.5, back: 0.15, d: 0.3 }];
/* soft contact shadow cast away from the torch (decal on the ground) */
const shadowTex = () => canvasTex("beamshadow18", 128, 256, (c, w, h) => { const g = c.createLinearGradient(0, h, 0, 0); g.addColorStop(0, "rgba(0,0,10,0.75)"); g.addColorStop(1, "rgba(0,0,10,0)"); c.fillStyle = g; c.beginPath(); c.ellipse(w / 2, h / 2, w * 0.42, h * 0.5, 0, 0, Math.PI * 2); c.fill(); });
const CastShadow: React.FC<{ obj: V3; from: V3; len: number; w: number; o: number }> = ({ obj, from, len, w, o }) => { if (o <= 0.02) return null; const dx = obj[0] - from[0], dz = obj[2] - from[2], a = Math.atan2(dx, dz);
  return <mesh position={[obj[0] + Math.sin(a) * len * 0.5, 0.03, obj[2] + Math.cos(a) * len * 0.5]} rotation={[-Math.PI / 2, 0, a + Math.PI]}><planeGeometry args={[w, len]} /><meshBasicMaterial map={shadowTex()} transparent opacity={o} depthWrite={false} /></mesh>; };
export const S2 = ({ t }: Ctx) => { const on = sm(seg(t, 3.72, 3.85)), pose = t < 5 ? P2A : t < 7 ? P2B : P2C, th = torchTh(t, pose), a = act(t, ACT2, { seed: 2 });
  const chin = t >= 7.0, hand = chin ? [P2[0] + 0.15, 1.75, P2[2] + 0.35] as V3 : handWorld(pose, th), to: V3 = chin ? [hand[0], hand[1] + 4, hand[2] - 0.6] : beamTo(t);
  const beamOn = on * (chin ? 0.55 : 1), glow: [number, number, number, number] | undefined = !chin && on > 0 ? [to[0], to[2], 2.4, on] : undefined;
  const lit = (q: V3) => { if (chin || on <= 0) return 0; return Math.max(0, 1 - Math.hypot(q[0] - to[0], q[2] - to[2]) / 3.2); };
  return (<NightField t={t} dark={1} pitch={0.5} vanish={2} stars={1.6} fireflies={1.2} moonP={MOON_P} glow={glow}>
    <Cam t={t} keys={shot(t, K2)} />
    <GroundHaze t={t} layers={[[-2, 0.25, 30], [-6, 0.35, 50], [-12, 0.5, 70]]} col="rgba(90,115,200,0.5)" o={0.6} speed={0.02} />
    {FENCE2.map((q, i) => <React.Fragment key={i}><KModel name="fence_simple" p={q} s={1.5} ry={0.5} tint="#b0a890" /><CastShadow obj={q} from={hand} len={2.2} w={0.9} o={0.8 * lit(q)} /></React.Fragment>)}
    <KModel name="tree_oak" p={TREE2} s={3.2} tint="#a8a890" t={t} sway={1} /><CastShadow obj={TREE2} from={hand} len={5} w={2.2} o={0.7 * lit(TREE2)} />
    <KModel name="plant_bushDetailed" p={BUSH2} s={1.4} tint="#a0a888" t={t} sway={1} /><CastShadow obj={BUSH2} from={hand} len={1.8} w={1.2} o={0.7 * lit(BUSH2)} />
    <TorchBeam from={hand} to={to} on={beamOn} t={t} spread={chin ? 0.12 : 0.2} bright={chin ? 1 : 3.4} />
    <Stickman p={stepBack(P2, pose, a.back)} t={t} action="idle" lips={LIPS} gest={leftOnly(G2)} extra={torch(on, chin ? 210 : th)}
      face={faceAt(t, [[3.0, "worried"], [3.8, "surprised"], [4.4, "smile"], [5.2, "happy"], [7.0, "scared"], [8.0, "worried"]])}
      rig={{ ...a.rig, armR: chin ? { a: -6, b: 152 } : { a: th - 24, b: 24 }, handR: "hold", handRotR: 0, ...eyes(t, [[3.0, -0.3, 0], [3.55, 0.6, 0.2], [5.0, 0.4, -0.8], [5.55, -0.5, -0.9], [7.0, 0, -0.1]]) }} />
    <DepthPass focus={6.7} blur={2.2} />
  </NightField>); };
const project = (pose: { pos: V3; look: V3; fov?: number }, q: V3) => { const f = new THREE.Vector3(pose.look[0] - pose.pos[0], pose.look[1] - pose.pos[1], pose.look[2] - pose.pos[2]).normalize(), r = new THREE.Vector3().crossVectors(f, new THREE.Vector3(0, 1, 0)).normalize(), u = new THREE.Vector3().crossVectors(r, f);
  const v = new THREE.Vector3(q[0] - pose.pos[0], q[1] - pose.pos[1], q[2] - pose.pos[2]), z = v.dot(f), th = Math.tan(((pose.fov ?? 42) * Math.PI) / 360); return { x: 0.5 + v.dot(r) / z / (2 * th * 1080 / 1920), y: 0.5 - v.dot(u) / z / (2 * th) }; };
/* screen x (px) of the beam spot -> the 2D front bed is lit there */
export const beamScreenX = (t: number) => (t >= 7 ? 540 : project(t < 5 ? P2A : P2B, beamTo(t)).x * 1080);

/* ================= S4 ANIMALS 16.4–25.0: owl close-up, wolf howling on its rock, tide pool (coral spawn, fish school, crabs), confusion, ecosystems shaken ================= */
const P4: V3 = [0, 0, 1.2], P4C: V3 = [0, 0, 3.4];
const O4A = A({ yaw: -0.05, sx: 0.37, drift: 0.04 });
const O4B = A({ yaw: 0.12, sx: 0.67, drift: -0.03 });
const O4C = A({ yaw: 0.05, camY: 1.15, sx: 0.57, drift: 0.02 });
const O4D = A({ yaw: -0.08, camY: 1.15, sx: 0.4, drift: -0.02 });
const O4E = A({ yaw: 0.0, camY: 1.3, sx: 0.5, push: 0.96, drift: 0.02 });
const P4A = framePose(P4, O4A, 0), P4B = framePose(P4, O4B, 0), P4Cp = framePose(P4C, O4C, 0), P4Dp = framePose(P4C, O4D, 0), P4E = framePose(P4, O4E, 0);
const K4: [number, Key[]][] = [[16.4, frameShot(P4, 16.4, 17.85, O4A)], [17.85, frameShot(P4, 17.85, 19.05, O4B)], [19.05, frameShot(P4C, 19.05, 20.6, O4C)], [20.6, frameShot(P4C, 20.6, 22.4, O4D)], [22.4, frameShot(P4, 22.4, 25.05, O4E)]];
// close animals (placed in screen space so they are big, fully in frame and never in front of the hero)
const OWL_H = 1.2, OWL_A = at(P4A, 0.81, 0.4, 4.0, OWL_H);
const WOLF_H = 1.55, WOLF_B = at(P4B, 0.24, 0.6, 3.9, WOLF_H);
const CORAL_H = 0.95, CORAL_C = at(P4Cp, 0.22, 0.74, 3.6, CORAL_H), POOL_C = worldAt(P4Cp, 0.3, 0.82, 3.4);
const CRAB_D = [at(P4Dp, 0.7, 0.86, 3.4, 0.5), at(P4Dp, 0.86, 0.8, 4.2, 0.45)];
const POOL_D = worldAt(P4Dp, 0.66, 0.66, 5.2);
// wide shot: owl on a branch (right), wolf on its rock (left), both behind the hero
const OWL_E: V3 = [1.55, 1.5, -2.6], WOLF_E: V3 = [-1.75, 0, -2.3];
const G4: GKey[] = [{ t: wt("animals", 16.2) + 0.1, g: "present" }, { t: wt("hunt", 17) + 0.04, g: aim(screenDir(P4A, SHO(P4), [OWL_A[0], OWL_A[1] + OWL_H * 0.6, OWL_A[2]])), hold: 0.45 },
  { t: wt("migrate", 17.9) + 0.04, g: aim(screenDir(P4B, SHO(P4), [WOLF_B[0], WOLF_B[1] + WOLF_H * 0.6, WOLF_B[2]])), hold: 0.4 }, { t: wt("spawn", 19.1) + 0.04, g: aim(screenDir(P4Cp, SHO(P4C), CORAL_C), "open"), hold: 0.4 },
  { t: wt("moonlight", 19.7) + 0.04, g: "pointUp" }, { t: wt("ecosystems", 22.4) + 0.04, g: "chopL" }, { t: wt("shaken", 23.6) + 0.04, g: "whoa", hold: 0.7 }];
const EY4: [number, number, number][] = [[16.4, 0.2, 0], [16.8, 0.8, -0.2], [17.9, -0.8, -0.3], [18.9, -0.7, 0.6], [19.6, 0, -0.8], [20.6, 0.6, 0.6], [21.2, -0.5, 0.2], [21.8, 0.5, 0.3], [22.4, 0, 0], [23.0, 0.6, -0.4], [23.6, -0.6, -0.2]];
const ACT4: AKey[] = [{ t: 16.4, turn: 0.1 }, { t: 16.85, turn: 0.75, tilt: -6, d: 0.3 }, { t: 17.85, turn: -0.75, tilt: 4, lean: -3, d: 0.25 }, { t: 18.95, turn: -0.6, tilt: 8, dip: 0.3, d: 0.3 }, { t: 19.6, turn: 0, tilt: -6, dip: 0, d: 0.3 },
  { t: 20.75, turn: 0.6, tilt: 10, dip: 0.2, d: 0.25 }, { t: 21.25, turn: -0.6, tilt: -8, d: 0.25 }, { t: 21.8, turn: 0.5, tilt: 9, d: 0.25 }, { t: 22.4, turn: 0, tilt: 0, dip: 0, d: 0.3 },
  { t: 23.85, dip: 0.7, lean: -8, dx: -30, lift: 0.6, d: 0.14 }, { t: 24.2, dip: 0.5, lean: 9, dx: 25, lift: -0.6, d: 0.16 }, { t: 24.6, dip: 0.3, lean: -4, dx: 0, lift: 0, d: 0.2 }];
const swivel = (t: number) => { const ph = t * 0.9; return Math.max(-1, Math.min(1, Math.sin(ph) * 1.6)) * 0.9; }; // owl: snaps between sides, holds
export const S4 = ({ t }: Ctx) => { const shake = t > 23.75 && t < 24.9, a = act(t, ACT4, { seed: 4 }), pose = poseAt(t, [[16.4, P4A], [17.85, P4B], [19.05, P4Cp], [20.6, P4Dp], [22.4, P4E]] as [number, typeof P4A][]);
  const confused = sm(seg(t, 20.6, 21.0)), face = faceAt(t, [[16.4, "smile"], [16.9, "surprised"], [17.4, "happy"], [17.9, "surprised"], [19.3, "happy"], [20.7, "confused"], [22.4, "worried"], [23.75, "scared"]]);
  const scratch = t > 20.95 && t < 22.2;
  const hero = <Stickman p={stepBack(t >= 19.05 && t < 22.4 ? P4C : P4, pose, a.back)} t={t} action={shake ? "scaredShake" : "idle"} lips={LIPS} gest={G4} face={face} rig={{ ...a.rig, ...eyes(t, EY4), ...(scratch ? SCRATCH(t) : {}) }} />;
  if (t >= 19.05 && t < 22.4) { const tp = t < 20.6, C = tp ? POOL_C : POOL_D;
    return (<MoonShore t={t} tide={1} hero={P4C} lighthouse={[-30, 1, -70]} marker={[9, 0, -12]}>
      <Cam t={t} keys={shot(t, K4)} />
      {hero}
      {/* glowing tide pool + coral + fish school + spawn (close to the camera) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[C[0], 0.03, C[2]]} scale={[1.7, 1, 1]}><circleGeometry args={[1.0, 48]} /><meshBasicMaterial color="#1f7fa0" transparent opacity={0.85} /></mesh>
      <SGlow p={[C[0], 0.1, C[2]]} r={1.6} color="#5afff0" o={0.35 + 0.1 * Math.sin(t * 3)} />
      {tp ? <><Animal kind="coral" p={CORAL_C} h={CORAL_H} t={t} pose={{ glow: 0.6 + 0.4 * sm(seg(t, 19.2, 19.6)) }} /><Spawn c={[CORAL_C[0], CORAL_C[1] + 0.4, CORAL_C[2]]} t={t} k={sm(seg(t, 19.2, 19.5))} w={0.9} /></> : null}
      <FishSchool c={[C[0], 0.25, C[2]]} t={t} n={tp ? 11 : 9} r={tp ? 0.9 : 0.8} h={0.28} confused={confused} />
      {tp ? [0, 1].map((i) => <Animal key={i} kind="crab" p={[POOL_C[0] + 1.6 + i * 0.9 + Math.sin(t * 1.8 + i) * 0.35, 0, POOL_C[2] + 0.3 - i * 0.4]} h={0.42} t={t} pose={{ walk: t * 2.4 + i, claw: 0.3 }} />)
        : CRAB_D.map((q, i) => { const spin = Math.sin(t * 5 + i * 2) > 0; return <React.Fragment key={i}><Animal kind="crab" p={[q[0] + Math.sin(t * 2.2 + i) * 0.15, q[1], q[2]]} h={i ? 0.45 : 0.5} t={t} pose={{ walk: t * 3 + i, claw: 1, tilt: 0.6, flip: spin, look: spin ? 0.8 : -0.8, mouth: 0.6 }} />
          <QPop p={[q[0] + 0.32, q[1] + 0.3, q[2]]} t={t} t0={20.75 + i * 0.25} h={0.3} /></React.Fragment>; })}
      {!tp ? <QPop p={[POOL_D[0] - 0.9, 0.55, POOL_D[2]]} t={t} t0={21.05} h={0.38} /> : null}
      <DepthPass focus={6.8} blur={2.0} />
    </MoonShore>); }
  const wide = t >= 22.4, owlP = wide ? OWL_E : OWL_A, wolfP = wide ? WOLF_E : WOLF_B, howl = wide ? 0 : seg(t, 18.05, 18.35) * (1 - seg(t, 18.85, 19.05));
  const wolfCircle = wide && !shake ? Math.sin((t - 22.4) * 2.6) : 0;
  const owlTurn = t < 17.85 ? (t < 17.1 ? swivel(t) : 0.85 * sm(seg(t, 17.1, 17.3))) : wide ? Math.sin(t * 2.8) * 0.95 : 0;
  const { R } = basis(P4B), snout: V3 = [WOLF_B[0] + R[0] * WOLF_H * 0.33, WOLF_B[1] + WOLF_H * 0.82, WOLF_B[2] + R[2] * WOLF_H * 0.33];
  return (<ForestGlade t={t} dark={0.45}>
    <Cam t={t} keys={shot(t, K4)} quake={shake ? 0.05 * Math.sin((t - 23.75) / 1.15 * Math.PI) : 0} />
    {wide ? <><KModel name="tree_detailed" p={[OWL_E[0] + 2.2, 0, OWL_E[2] - 0.6]} s={3.6} tint="#7c8ad0" t={t} sway={1} /><Branch p={[OWL_E[0] - 0.9, OWL_E[1] + 0.05, OWL_E[2]]} len={3.2} t={t} /></> : null}
    {t < 17.85 || wide ? <><Animal kind="owl" p={owlP} h={wide ? 1.1 : OWL_H} t={t} pose={{ turn: owlTurn, tilt: wide ? 0.25 * Math.sin(t * 1.7) : t > 17.3 && t < 17.85 ? -0.15 : 0, ruffle: (t > 16.9 && t < 17.3 ? 1 : 0) + (shake ? 1 : 0), wing: shake ? 1 : 0, look: wide ? -0.6 : 0 }} />
      {wide ? <QPop p={[owlP[0] + 0.1, owlP[1] + 1.15, owlP[2]]} t={t} t0={22.6} h={0.42} /> : null}</> : null}
    {t >= 17.85 ? <><Animal kind="wolf" p={[wolfP[0] + (wide ? Math.cos((t - 22.4) * 2.6) * 0.25 : 0), wolfP[1], wolfP[2] + (wide ? Math.sin((t - 22.4) * 2.6) * 0.15 : 0)]} h={wide ? 1.45 : WOLF_H} t={t}
      pose={{ howl, flip: wide ? wolfCircle < 0 : false, walk: wide ? t * 1.6 : 0, ear: Math.max(0, Math.sin(t * 2.7)) ** 8, turn: wide ? Math.sin(t * 3.1) * 0.5 : 0, tilt: wide ? 0.12 * Math.sin(t * 2) : 0 }} />
      {howl > 0.3 ? Array.from({ length: 7 }, (_, i) => { const u = ((t * 1.1 + i / 7) % 1); return <SGlow key={i} p={[snout[0] + R[0] * u * 0.25, snout[1] + u * 0.5, snout[2] + R[2] * u * 0.25]} r={0.05 + u * 0.16} color="#eef3ff" o={0.55 * (1 - u) * howl} />; }) : null}
      {wide ? <QPop p={[wolfP[0] + 0.3, wolfP[1] + 1.55, wolfP[2]]} t={t} t0={22.75} h={0.42} /> : null}</> : null}
    {wide ? [[-1.4, 3.0], [1.6, 3.2]].map(([x, z], i) => <Animal key={i} kind="crab" p={[x + Math.sin(t * 1.6 + i) * 0.4, 0, z]} h={0.42} t={t} pose={{ walk: t * 2 + i, claw: 1, flip: Math.sin(t * 4 + i) > 0, tilt: 0.5 }} />) : null}
    {hero}
    <DepthPass focus={t < 22.4 ? 6.8 : 7.6} blur={2.0} />
  </ForestGlade>); };

/* ================= S6 SEASONS 28.65–32.7: one fixed spot, spring -> summer -> (snow in summer) -> autumn -> (lightning) -> winter ================= */
const P6: V3 = [0, 0, 1.0];
const O6 = A({ yaw: -0.12, sx: 0.49, push: 0.96, drift: 0.04 });
export const SEASON_CUTS: [number, number, number][] = [[28.65, 0, 0], [29.45, 1, 0], [30.0, 1, 1], [30.4, 2, 0], [31.0, 2, 2], [31.4, 3, 0]]; // [t, season, chaos 1 = snow in summer / 2 = storm]
export const seasonAt = (t: number) => { let c = SEASON_CUTS[0]; for (const x of SEASON_CUTS) if (t >= x[0]) c = x; return c; };
const G6: GKey[] = [{ t: 28.95, g: "palmUpL" }, { t: wt("making", 29.1) + 0.04, g: "wave", hold: 0.3 }, { t: wt("seasons", 29.6) + 0.04, g: "present" }, { t: wt("wild", 30) + 0.02, g: "pointUp", hold: 0.25 }, { t: 30.55, g: "reach", hold: 0.35 }, { t: 31.02, g: "whoa", in: 0.12, hold: 0.3 }];
const ACT6: AKey[] = [{ t: 28.65, turn: 0.4, tilt: 8, lean: 3 }, { t: 29.45, turn: 0.6, tilt: -10, d: 0.25 }, { t: 30.0, turn: 0.2, tilt: -12, dip: 0.2, d: 0.15 }, { t: 30.4, turn: -0.4, tilt: 6, dip: 0, d: 0.25 },
  { t: 31.05, back: 0.3, lean: -9, dip: 0.6, lift: 0.7, turn: 0.3, d: 0.14 }, { t: 31.4, back: 0.3, lean: 0, dip: 0.55, lift: 0, turn: 0, shiver: 1, d: 0.25 }, { t: 32.7, back: 0.3, dip: 0.6, shiver: 1, d: 0.5 }];
export const S6 = ({ t }: Ctx) => { const [t0, season, chaos] = seasonAt(t), kick = Math.exp(-(t - t0) * 14) * (t0 > 28.7 ? 1 : 0), a = act(t, ACT6, { seed: 6 });
  const flash = chaos === 2 ? Math.max(0, Math.sin((t - 31.0) * 22)) ** 6 : 0;
  const keys = frameShot(P6, 28.65, 32.75, O6).map((k) => ({ ...k, look: [k.look[0] + kick * 0.45, k.look[1], k.look[2]] as V3 }));
  const winter = season === 3, wipe = season === 1 && chaos === 0 && t > 29.6 && t < 29.95;
  return (<SeasonHill t={t} season={season} chaos={chaos} flash={flash}>
    <Cam t={t} keys={keys} />
    {chaos === 2 && flash > 0.2 ? <Lightning p={[4, 9, -18]} s={[5, 14]} seed={Math.floor(t * 8)} o={flash} /> : null}
    <Stickman p={stepBack(P6, framePose(P6, O6, 0), a.back)} t={t} action="idle" lips={LIPS} gest={G6} face={winter ? "worried" : chaos ? "surprised" : (["happy", "laugh", "surprised", "worried"] as Face[])[season]}
      rig={{ ...a.rig, ...eyes(t, [[28.65, 0.4, -0.3], [29.45, 0.6, -0.9], [30.0, 0.1, -0.9], [30.4, -0.5, -0.4], [31.0, 0.5, -0.8], [31.4, 0, 0.1]]), ...(winter ? HUG(t) : {}), ...(wipe ? SHIELD : {}) }} />
    <DepthPass focus={6.7} blur={2.0} />
  </SeasonHill>); };
void THREE;
