// EP09 v17.2 rebuilt scenes: S1 hook (night field), S3 ocean / tides, S5 Earth in space, S7 ending (= hook set, loops to frame 0).
// Speech gestures (kit/gesture.ts, asymmetric + aimed), eyes glance to the target before the hand, consistent framing (kit/frame.ts),
// dioramas (kit/sets4.tsx) with bottom-edge foreground props placed by groundAt().
import React from "react";
import { Cam, Key } from "../../style/extra";
import { V3 } from "../../style/kit";
import { Stickman, LipCue } from "../../kit/character";
import { Face } from "../../style/stickman";
import { DepthPass } from "../../kit/envlib";
import { NightField, MoonShore, SpaceDiorama, Earth3, RockPlatform, TorchBeam, ForestGlade, Branch, SeasonHill } from "../../kit/sets4";
import { GroundHaze } from "../../kit/diorama";
import { Critter } from "../../kit/creatures";
import { KModel } from "../../kit/envlib";
import { SGlow, Lightning } from "../../style/sky";
import { RigOut } from "../../style/stickman";
import { frameShot, framePose, worldAt, groundAt, screenDir, FULL, CLOSE, FrameOpts } from "../../kit/frame";
import { GKey, beat, WWord, aim, GEST, Pose2 } from "../../kit/gesture";
import MOUTH from "../../../public/ep09/mouth.json";
import WORDS from "../../../public/ep09/words.json";

export type Ctx = { t: number; f: number };
const LIPS = (MOUTH as { mouthCues: LipCue[] }).mouthCues;
const W = WORDS as WWord[];
const seg = (t: number, a: number, b: number) => Math.max(0, Math.min(1, (t - a) / (b - a)));
const sm = (x: number) => { const u = Math.max(0, Math.min(1, x)); return u * u * (3 - 2 * u); };
const faceAt = (t: number, list: [number, Face][]) => { let f = list[0][1]; for (const [a, x] of list) if (t >= a) f = x; return f; };
const shot = (t: number, list: [number, Key[]][]) => { let k = list[0][1]; for (const [t0, ks] of list) if (t >= t0) k = ks; return k; };
const wt = (w: string, from = 0) => (W.find((x) => x.start >= from && x.word.toLowerCase().replace(/[^a-z']/g, "") === w)?.start ?? from);
/* eyes: eased glance keys [t, lookX, lookY] (0.18 s moves) — glance keys are set ~0.25 s BEFORE the matching hand gesture */
const eyes = (t: number, keys: [number, number, number][]) => { let i = 0; while (i < keys.length - 1 && t >= keys[i + 1][0]) i++; const [ta, x0, y0] = keys[i], nx = keys[i + 1];
  if (!nx || t < nx[0] - 0.18) return { lookX: x0, lookY: y0 }; const k = sm((t - (nx[0] - 0.18)) / 0.18); return { lookX: x0 + (nx[1] - x0) * k, lookY: y0 + (nx[2] - y0) * k }; void ta; };
/* foreground ring along the bottom edge of a shot */
const foreFor = (pose: { pos: V3; look: V3; fov?: number }, xs: number[], sy = 0.9) => xs.map((sx, i) => groundAt(pose, sx, sy + (i % 2) * 0.04));

/* ================= S1 HOOK 0–3.0 ================= */
export const PH: V3 = [0, 0, 0];
export const HOOK_O: FrameOpts = { frac: FULL, fov: 42, yaw: -0.22, camY: 1.15, sx: 0.4, sy: 0.37, push: 0.94, drift: 0.05 };
const HP = framePose(PH, HOOK_O, 0);
export const MOON_P = worldAt(HP, 0.76, 0.215, 70);
const FORE1 = foreFor(HP, [0.04, 0.2, 0.33, 0.67, 0.82, 0.97, 0.12, 0.9]);
export const HOOK_FACE = { lookX: 0.45, lookY: -0.7, headTilt: -6 };
const SHO = (p: V3): V3 => [p[0] + 0.25, p[1] + 2.0, p[2]]; // right shoulder (world, approx.)
const G1: GKey[] = [{ t: 0.8, g: aim(screenDir(HP, SHO(PH), MOON_P) + 18), in: 0.35, hold: 0.3 }, { t: 1.4, g: "whoa", in: 0.22, hold: 0.5 }, { t: 2.3, g: "palmUpL", in: 0.3, hold: 0.4 }];
export const vanishAt = (t: number) => seg(t, 0.95, 2.15);
export const S1 = ({ t }: Ctx) => { const v = vanishAt(t), dark = sm(seg(t, 1.3, 2.4));
  return (<NightField t={t} dark={dark} vanish={v} moonP={MOON_P} fore={FORE1}>
    <Cam t={t} keys={frameShot(PH, 0, 3.05, HOOK_O)} impacts={[[1.5, 0.012]]} />
    <Stickman p={PH} t={t} action="idle" lips={LIPS} gest={G1} face={faceAt(t, [[0, "smile"], [1.15, "surprised"], [2.2, "scared"]])}
      rig={{ ...HOOK_FACE, ...eyes(t, [[0, 0.45, -0.7], [0.55, 0.6, -0.9], [1.5, 0.35, -0.85], [2.2, 0.0, -0.1]]), ...(t < 0.8 ? { blink: 0 } : {}), ...(t > 1.3 ? { squash: -0.03 * Math.exp(-(t - 1.3) * 4) } : {}) }} />
    <DepthPass focus={6.2} blur={2.4} />
  </NightField>); };

/* ================= S7 ENDING 32.7–38.0 (Moon pops back; ends EXACTLY on the hook's first frame) ================= */
const O7A: FrameOpts = { frac: CLOSE, fov: 40, yaw: -0.18, camY: 1.5, sx: 0.5, sy: 0.36, push: 0.95, drift: -0.05 };
const G7: GKey[] = [...beat(W, [["so", "palmUp2"]], 32.5), { t: wt("moon", 33) + 0.04, g: aim(70), in: 0.3, hold: 0.35 }, ...beat(W, [["tonight", "shrug"], ["would", "palmUp"], ["notice", "chin", { hold: 0.9 }]], 33.9)];
export const S7 = ({ t }: Ctx) => { const back = seg(t, 36.7, 37.4);
  const end: Key[] = [{ ...framePose(PH, { ...HOOK_O, frac: FULL * 0.92 }, 0), t: 36.55 }, { ...HP, t: 38.0 }];
  const cam = t < 35.0 ? frameShot(PH, 32.7, 35.0, O7A) : t < 36.55 ? frameShot(PH, 35.0, 36.55, { frac: FULL, fov: 42, yaw: 0.3, camY: 1.2, sx: 0.5, sy: 0.37, drift: -0.06 }) : end;
  const lk = t > 37.0 ? HOOK_FACE : eyes(t, [[32.7, 0, -0.1], [33.4, 0.5, -0.8], [34.1, 0, 0], [36.6, 0.5, -0.8]]);
  return (<NightField t={t} dark={1 - sm(back)} vanish={back > 0 ? 0 : 2} back={back} moonP={MOON_P} fore={FORE1}>
    <Cam t={t} keys={cam} />
    <Stickman p={PH} t={t} action="idle" lips={LIPS} gest={G7} face={faceAt(t, [[32.7, "think"], [35.0, "confused"], [36.7, "surprised"], [37.35, "smile"]])} rig={{ ...lk, ...(t > 37.0 ? HOOK_FACE : {}), ...(t > 36.9 ? { blink: 0 } : {}) }} />
    <DepthPass focus={6.2} blur={2.4} />
  </NightField>); };

/* ================= S3 OCEAN / TIDES 9.7–16.4 (same background in every shot: lighthouse, horizon, rocks) ================= */
const P3: V3 = [0, 0, 3.4], MARK: V3 = [1.9, 0, -0.9];
// one consistent view direction for the whole scene -> lighthouse, horizon and rocks stay in the same place
const O3A: FrameOpts = { frac: FULL, fov: 44, yaw: 0.05, camY: 1.5, sx: 0.55, sy: 0.37, drift: -0.02 };
const O3B: FrameOpts = { frac: FULL, fov: 44, yaw: 0.05, camY: 1.0, sx: 0.47, sy: 0.335, drift: 0.015 };
const O3C: FrameOpts = { frac: FULL, fov: 44, yaw: 0.05, camY: 2.3, sx: 0.5, sy: 0.37, push: 0.97, drift: 0.015 };
const P3A = framePose(P3, O3A, 0), P3B = framePose(P3, O3B, 0), P3C = framePose(P3, O3C, 0);
const LIGHTHOUSE = groundAt(P3A, 0.2, 0.31, 0); // not used directly (ground ray too far): see below
const LH: V3 = (() => { const w = worldAt(P3A, 0.17, 0.33, 70); return [w[0], 1, w[2]]; })();
const GHOST_P = worldAt(P3B, 0.78, 0.16, 90);
const FORE3 = foreFor(P3C, [0.05, 0.2, 0.8, 0.95, 0.33, 0.66], 0.9);
const K3: [number, Key[]][] = [[9.7, frameShot(P3, 9.7, 11.75, O3A)], [11.75, frameShot(P3, 11.75, 13.45, O3B)], [13.45, frameShot(P3, 13.45, 16.45, O3C)]];
export const tideAt = (t: number) => 1 - 0.75 * sm(seg(t, 14.3, 15.8)); // "...shrink to less than half": waterline + foam visibly retreat, the marker post ends dry
export const ghostAt = (t: number) => sm(seg(t, 11.75, 12.25)) * (1 - sm(seg(t, 13.5, 14.0)));
const SH3 = SHO(P3);
const G3: GKey[] = [...beat(W, [["oceans", "present"], ["change", "palmUp"]], 9.6),
  { t: wt("moon", 11.5) + 0.04, g: aim(screenDir(P3B, SH3, GHOST_P) + 10), in: 0.32, hold: 0.4 }, ...beat(W, [["most", "chopL"], ["tides", "open2"], ["they'd", "palmUpL"], ["shrink", "chop", { hold: 0.2 }]], 12.2),
  { t: wt("less", 14.5) + 0.04, g: aim(screenDir(P3C, SH3, [MARK[0], 0.2, MARK[2] - 2.5])), in: 0.3, hold: 0.55 }, ...beat(W, [["half", "palmUp2", { hold: 0.5 }]], 15)];
const EY3: [number, number, number][] = [[9.7, -0.2, 0], [wt("oceans", 9.6) - 0.25, -0.5, -0.2], [10.8, 0, 0], [wt("moon", 11.5) - 0.25, 0.6, -0.9], [12.6, 0.1, -0.1], [wt("less", 14.5) - 0.25, 0.6, 0.5], [15.6, 0, 0]];
export const S3 = ({ t }: Ctx) => (
  <MoonShore t={t} tide={tideAt(t)} ghost={ghostAt(t)} ghostP={GHOST_P} lighthouse={LH} marker={MARK} hero={P3} fore={FORE3}>
    <Cam t={t} keys={shot(t, K3)} />
    <Stickman p={P3} t={t} action="idle" lips={LIPS} gest={G3} face={faceAt(t, [[9.7, "smile"], [11.75, "happy"], [13.45, "surprised"], [14.3, "worried"], [15.3, "surprised"]])} rig={eyes(t, EY3)} />
    <DepthPass focus={t < 11.75 ? 7.5 : 6.8} blur={2.4} />
  </MoonShore>);
void LIGHTHOUSE;

/* ================= S5 EARTH IN SPACE 25.0–29.25 (hero stands on a floating asteroid; big slow axis wobble) ================= */
const PLAT: V3 = [-1.6, -0.25, 1.6], ER = 1.45;
const O5A: FrameOpts = { frac: FULL * 0.94, fov: 50, yaw: -0.25, camY: 1.5, sx: 0.36, sy: 0.38, push: 0.94, drift: 0.06 };
const O5B: FrameOpts = { ...O5A, yaw: -0.2, camY: 1.4, push: 0.96, drift: -0.03 };
const P5A = framePose([PLAT[0], 0, PLAT[2]], O5A, 0);
const EARTH: V3 = worldAt(framePose([PLAT[0], 0, PLAT[2]], O5A, 0.5), 0.7, 0.35, 10.5), SUN: V3 = worldAt(P5A, 0.14, 0.08, 110);
export const wobbleAt = (t: number) => { const env = sm(seg(t, 27.4, 27.9)), ph = ((t - 27.4) / 2.4) * Math.PI * 2; return { tilt: 23.4 + 32 * Math.sin(ph) * env, prec: 0.85 * Math.sin(ph - 0.9) * env, env, ph }; };
const K5: [number, Key[]][] = [[25.0, frameShot([PLAT[0], 0, PLAT[2]], 25.0, 27.4, O5A)], [27.4, frameShot([PLAT[0], 0, PLAT[2]], 27.4, 29.3, O5B)]];
const SH5: V3 = [PLAT[0] + 0.25, 2.0, PLAT[2]];
const G5: GKey[] = [...beat(W, [["millions", "open2"], ["years", "palmUpL"]], 25.0), { t: wt("earth's", 26) + 0.04, g: aim(screenDir(P5A, SH5, EARTH), "open"), in: 0.32, hold: 0.5 },
  { t: wt("tilt", 27) + 0.04, g: aim(screenDir(P5A, SH5, [EARTH[0], EARTH[1] + ER * 1.6, EARTH[2]])), in: 0.3, hold: 0.4 }, ...beat(W, [["start", "chopL"], ["wobble", "whoa", { hold: 0.5 }]], 27.8)];
const EY5: [number, number, number][] = [[25, 0.2, -0.1], [wt("earth's", 26) - 0.25, 0.8, -0.3], [wt("tilt", 27) - 0.25, 0.8, -0.6], [28.0, 0.6, -0.3]];
export const S5 = ({ t }: Ctx) => { const w = wobbleAt(t), bob = Math.sin(t * 1.3) * 0.12, P: V3 = [PLAT[0], PLAT[1] + bob, PLAT[2]];
  return (<SpaceDiorama t={t} sun={SUN}>
    <Cam t={t} keys={shot(t, K5)} />
    <Earth3 p={EARTH} r={ER} t={t} tilt={w.tilt} prec={w.prec} />
    <RockPlatform p={P} t={t} s={1.15} />
    <Stickman p={[P[0], P[1] + 0.1, P[2]]} t={t} action="idle" lips={LIPS} shadow={false} gest={G5}
      face={faceAt(t, [[25, "happy"], [27.5, "surprised"], [28.4, "scared"]])} rig={{ ...eyes(t, EY5), zeroG: 1, lean: 5 * Math.sin(w.ph) * w.env }} />
    <DepthPass focus={6.6} blur={2.0} />
  </SpaceDiorama>); };

/* ================= helpers for held props ================= */
/* camera basis of a pose (right, up, forward) */
const basis = (pose: { pos: V3; look: V3 }) => { const f = [pose.look[0] - pose.pos[0], pose.look[1] - pose.pos[1], pose.look[2] - pose.pos[2]], fl = Math.hypot(f[0], f[2]) || 1; const F: V3 = [f[0] / fl, 0, f[2] / fl], R: V3 = [-F[2], 0, F[0]]; return { R, F }; };
/* world position of the right glove for a front-view arm whose forearm points at rig angle th (deg from straight down, toward screen right) */
const handWorld = (hero: V3, pose: { pos: V3; look: V3 }, th: number): V3 => { const { R } = basis(pose), a = (th * Math.PI) / 180, x = 0.4 + Math.sin(a) * 0.78, y = 1.7 - Math.cos(a) * 0.78; return [hero[0] + R[0] * x, hero[1] + y, hero[2] + R[2] * x]; };
/* 2D flashlight held in the right glove, pointing along the forearm (rig angle th) */
const torch = (on: number, th: number) => (c: CanvasRenderingContext2D, o: RigOut) => { c.save(); c.translate(o.gloveR[0], o.gloveR[1]); c.rotate(Math.PI - (th * Math.PI) / 180); c.scale(o.S / 0.9, o.S / 0.9);
  c.fillStyle = "#3a3f5a"; c.beginPath(); c.roundRect(-14, -70, 28, 92, 8); c.fill(); c.lineWidth = 6; c.strokeStyle = "#1A1A1A"; c.stroke();
  c.fillStyle = "#c9cfe0"; c.beginPath(); c.roundRect(-20, -92, 40, 26, 6); c.fill(); c.stroke(); if (on > 0) { c.fillStyle = `rgba(255,246,190,${on})`; c.beginPath(); c.ellipse(0, -94, 18, 6, 0, 0, Math.PI * 2); c.fill(); } c.restore(); };

/* ================= S2 DARK NIGHT + FLASHLIGHT 3.0–9.7 ================= */
const P2: V3 = [0, 0, 0];
const O2A: FrameOpts = { frac: FULL, fov: 42, yaw: 0.25, camY: 1.3, sx: 0.42, sy: 0.37, drift: -0.05 };
const O2B: FrameOpts = { frac: FULL, fov: 46, yaw: -0.2, camY: 0.55, sx: 0.45, sy: 0.4, drift: 0.05 };
const O2C: FrameOpts = { frac: CLOSE, fov: 40, yaw: 0.05, camY: 1.6, sx: 0.5, sy: 0.36, push: 0.93, drift: 0.03 };
const P2A = framePose(P2, O2A, 0.5), P2B = framePose(P2, O2B, 0.5), P2C = framePose(P2, O2C, 0.5);
const K2: [number, Key[]][] = [[3.0, frameShot(P2, 3.0, 5.0, O2A)], [5.0, frameShot(P2, 5.0, 7.0, O2B)], [7.0, frameShot(P2, 7.0, 9.75, O2C)]];
/* torch arm: firm grip, slow eased sweep + wrist rotation while he talks */
const torchTh = (t: number) => t < 3.6 ? 40 : t < 5.0 ? 70 + 40 * sm(seg(t, 3.9, 4.9)) + 4 * Math.sin(t * 1.7) : t < 7.0 ? 120 + 22 * Math.sin((t - 5.0) * 1.1) + 3 * Math.sin(t * 2.3) : 150 + 3 * Math.sin(t * 1.9);
const torchArm = (t: number) => { const th = torchTh(t); return t < 7.0 ? { a: th - 24, b: 24 } : { a: -6, b: 152 }; };
const G2: GKey[] = [{ t: wt("notice", 3.5) + 0.04, g: "palmUpL" }, { t: wt("dark", 4) + 0.04, g: "chopL", hold: 0.2 }, { t: wt("no", 5) + 0.04, g: "present" },
  { t: wt("stars", 5.9) + 0.04, g: aim(150), hold: 0.4 }, { t: wt("much", 7.3) + 0.04, g: "chopL", hold: 0.15 }, { t: wt("darker", 8) + 0.04, g: "palmUpL", hold: 0.6 }];
const leftOnly = (keys: GKey[]): GKey[] => keys.map((k) => { const P = typeof k.g === "string" ? GEST[k.g] : k.g; return { ...k, g: { ...P, R: GEST.rest.R } as Pose2 }; });
export const S2 = ({ t }: Ctx) => { const on = sm(seg(t, 3.72, 3.85)), th = torchTh(t), arm = torchArm(t), pose = t < 5 ? P2A : t < 7 ? P2B : P2C;
  const hand = t < 7.0 ? handWorld(P2, pose, th) : [P2[0] + 0.15, 1.75, P2[2] + 0.35] as V3;
  const { R, F } = basis(pose), a = (th * Math.PI) / 180, Ls = 5.5, Ld = 2.2; // mostly sideways in the frame so the cone reads as a cone
  const to: V3 = t < 7.0 ? [hand[0] + R[0] * Math.sin(a) * Ls + F[0] * Ld, Math.max(0.05, hand[1] - Math.cos(a) * Ls), hand[2] + R[2] * Math.sin(a) * Ls + F[2] * Ld] : [hand[0], hand[1] + 4, hand[2] - 0.6];
  return (<NightField t={t} dark={1} pitch={0.85} vanish={2} stars={1.6} fireflies={1.5} moonP={MOON_P} fore={t < 5 ? foreFor(P2A, [0.05, 0.25, 0.75, 0.95]) : []}>
    <Cam t={t} keys={shot(t, K2)} />
    <GroundHaze t={t} layers={[[-2, 0.25, 30], [-6, 0.35, 50], [-12, 0.5, 70]]} col="rgba(110,130,210,0.55)" o={0.7} speed={0.02} />
    <TorchBeam from={hand} to={to} on={on * (t < 7 ? 1 : 0.55)} t={t} spread={t < 7 ? 0.22 : 0.12} />
    <Stickman p={P2} t={t} action="idle" lips={LIPS} gest={leftOnly(G2)} extra={torch(on, t < 7.0 ? th : 210)}
      face={faceAt(t, [[3.0, "worried"], [3.8, "surprised"], [4.4, "smile"], [5.2, "happy"], [7.0, "scared"], [8.0, "worried"]])}
      rig={{ armR: arm, handR: "hold", handRotR: 0, ...eyes(t, [[3.0, -0.3, 0], [3.6, 0.5, 0.2], [5.0, 0.5, -0.8], [7.0, 0, -0.1]]), ...(t >= 7 ? { handsOverHead: true } : {}) }} />
    <DepthPass focus={t < 7 ? 6.0 : 4.6} blur={2.6} />
  </NightField>); };

/* ================= S4 CONFUSED ANIMALS 16.4–25.0 ================= */
const P4: V3 = [0, 0, 1.2];
const O4A: FrameOpts = { frac: FULL, fov: 44, yaw: -0.05, camY: 1.4, sx: 0.36, sy: 0.38, drift: 0.04 };
const O4B: FrameOpts = { frac: FULL, fov: 44, yaw: 0.05, camY: 1.1, sx: 0.62, sy: 0.38, drift: -0.03 };
const O4C: FrameOpts = { frac: FULL, fov: 44, yaw: 0.05, camY: 1.6, sx: 0.5, sy: 0.36, drift: 0.02 };
const O4D: FrameOpts = { frac: FULL * 0.8, fov: 48, yaw: 0.0, camY: 1.9, sx: 0.5, sy: 0.4, push: 0.95, drift: 0.02 };
const P4A = framePose(P4, O4A, 0.5), P4B = framePose(P4, O4B, 0.5);
const OWL: V3 = [2.3, 2.5, -3.2], WOLF: V3 = [-2.5, 0, -3.0]; // owl behind-right on a branch, wolf left on a rock — never in front of the hero
const P4C: V3 = [0, 0, 3.4];
const K4: [number, Key[]][] = [[16.4, frameShot(P4, 16.4, 18.4, O4A)], [18.4, frameShot(P4, 18.4, 20.3, O4B)], [20.3, frameShot(P4C, 20.3, 22.4, O4C)], [22.4, frameShot(P4, 22.4, 25.05, O4D)]];
const G4: GKey[] = [{ t: wt("animals", 16.2) + 0.1, g: "present" }, { t: wt("hunt", 17) + 0.04, g: aim(screenDir(P4A, SHO(P4), [OWL[0], OWL[1] + 0.8, OWL[2]])), hold: 0.45 },
  { t: 18.55, g: aim(screenDir(P4B, SHO(P4), [WOLF[0], 1.6, WOLF[2]])), hold: 0.45 }, ...beat(W, [["even", "palmUp"], ["spawn", "open2"], ["confused", "shrug", { hold: 0.6 }], ["whole", "palmUp2"], ["ecosystems", "chop"], ["shaken", "whoa", { hold: 0.7 }]], 18.9)];
const EY4: [number, number, number][] = [[16.4, 0.2, 0], [wt("hunt", 17) - 0.25, 0.7, -0.8], [17.9, 0.3, -0.3], [18.3, -0.7, -0.3], [19.2, 0, 0], [20.3, 0.1, 0.6], [21.5, 0, 0], [22.4, 0, -0.1], [23.6, 0.4, 0]];
const crabX = (t: number, i: number) => [-1.5, 1.4, 0.3, 2.6][i] + Math.sin(t * 1.6 + i * 1.7) * 0.55;
export const S4 = ({ t }: Ctx) => { const shake = t > 23.75 && t < 24.9, beach = t >= 20.3 && t < 22.4;
  const owlK = sm(seg(t, 17.35, 17.8)), howl = seg(t, 18.55, 18.85) * (1 - seg(t, 19.55, 19.8)), wolfK = sm(seg(t, 19.8, 20.2)), crabK = sm(seg(t, 20.85, 21.2));
  const face = faceAt(t, [[16.4, "smile"], [17.4, "confused"], [18.4, "surprised"], [19.3, "happy"], [20.9, "confused"], [22.4, "worried"], [23.75, "scared"]]);
  const hero = <Stickman p={beach ? P4C : P4} t={t} action={shake ? "scaredShake" : "idle"} lips={LIPS} gest={G4} face={face} rig={eyes(t, EY4)} />;
  if (beach) return (<MoonShore t={t} tide={1} hero={P4C} lighthouse={[-30, 1, -70]} marker={[9, 0, -12]}>
    <Cam t={t} keys={shot(t, K4)} />
    {hero}
    {[0, 1, 2, 3].map((i) => { const x = crabX(t, i), z = [1.6, 1.2, 0.6, 2.0][i]; return <React.Fragment key={i}><Critter kind="crab" p={[x, 0, z]} h={0.75} t={t} walk={t * 2.2 + i} confused={crabK} flip={i % 2 === 1} />
      {[0, 1, 2].map((b) => { const u = ((t * 0.8 + b / 3 + i * 0.27) % 1); return <SGlow key={b} p={[x + 0.12 * (b - 1), 0.5 + u * 0.9, z + 0.1]} r={0.06 + 0.03 * u} color="#e6f6ff" o={0.8 * (1 - u)} />; })}</React.Fragment>; })}
    {Array.from({ length: 40 }, (_, i) => <SGlow key={"pl" + i} p={[(Math.sin(i * 7.1) * 0.5) * 20, 0.04, -1.2 - Math.abs(Math.sin(i * 3.3)) * 9]} r={0.1 + 0.08 * Math.sin(i)} color="#5afff0" o={0.4 + 0.5 * Math.max(0, Math.sin(t * 2.5 + i * 1.9))} />)}
    <DepthPass focus={6.5} blur={2.4} />
  </MoonShore>);
  return (<ForestGlade t={t} dark={0.5}>
    <Cam t={t} keys={shot(t, K4)} quake={shake ? 0.05 * Math.sin((t - 23.75) / 1.15 * Math.PI) : 0} />
    <KModel name="tree_detailed" p={[OWL[0] + 2.4, 0, OWL[2] - 0.5]} s={3.8} tint="#7c8ad0" t={t} sway={1} />
    <Branch p={[OWL[0] - 0.9, OWL[1] + 0.02, OWL[2]]} len={3.3} t={t} />
    <Critter kind="owl" p={OWL} h={1.7} t={t} confused={t > 22.4 ? 1 : owlK} turn={Math.sin(t * 0.9) * 0.8 * (1 - owlK * 0.5)} ruffle={sm(seg(t, 16.9, 17.2)) * (1 - sm(seg(t, 17.5, 17.9))) + (shake ? 1 : 0)} />
    <KModel name="rock_tallA" p={[WOLF[0], 0, WOLF[2] - 0.2]} s={1.6} tint="#8890c0" />
    <Critter kind="wolf" p={[WOLF[0], 0.95, WOLF[2]]} h={2.6} t={t} howl={howl} confused={t > 22.4 ? 1 : wolfK} ear={Math.max(0, Math.sin(t * 2.7)) ** 8} flip />
    {howl > 0.3 ? Array.from({ length: 5 }, (_, i) => { const u = ((t * 0.9 + i / 5) % 1); return <SGlow key={i} p={[WOLF[0] + 0.5 + u * 0.4, 3.0 + u * 1.1, WOLF[2] + 0.2]} r={0.12 + u * 0.35} color="#dfe8ff" o={0.45 * (1 - u) * howl} />; }) : null}
    {t > 22.4 ? [[-1.6, 2.6], [1.8, 2.8]].map(([x, z], i) => <Critter key={i} kind="crab" p={[x + Math.sin(t * 1.6 + i) * 0.4, 0, z]} h={0.6} t={t} walk={t * 2 + i} confused={1} flip={i === 1} />) : null}
    {hero}
    <DepthPass focus={t < 22.4 ? 6.2 : 8.0} blur={2.4} />
  </ForestGlade>); };

/* ================= S6 SEASONS MONTAGE 29.25–32.7: one fixed spot, whip-pan morph every ~0.5 s, weather chaos ================= */
const P6: V3 = [0, 0, 1.0];
const O6: FrameOpts = { frac: FULL, fov: 44, yaw: -0.12, camY: 1.5, sx: 0.4, sy: 0.37, push: 0.94, drift: 0.05 };
export const SEASON_CUTS: [number, number, number][] = [[29.25, 0, 0], [29.75, 1, 0], [30.22, 2, 0], [30.7, 3, 0], [31.2, 1, 1], [31.85, 2, 0], [32.3, 0, 0]]; // [t, season, chaos]
export const seasonAt = (t: number) => { let c = SEASON_CUTS[0]; for (const x of SEASON_CUTS) if (t >= x[0]) c = x; return c; };
const G6: GKey[] = [...beat(W, [["making", "palmUp"], ["seasons", "open2"], ["wild", "whoa"], ["unpredictable", "shrug", { hold: 0.6 }]], 29.0), { t: 31.95, g: "chopL" }];
export const S6 = ({ t }: Ctx) => { const [t0, season, chaos] = seasonAt(t), kick = Math.exp(-(t - t0) * 14) * (t0 > 29.3 ? 1 : 0);
  const flash = chaos ? Math.max(0, Math.sin((t - 31.2) * 20)) ** 6 * (t < 31.7 ? 1 : 0) : 0;
  const keys = frameShot(P6, 29.25, 32.75, O6).map((k) => ({ ...k, look: [k.look[0] + kick * 1.2, k.look[1], k.look[2]] as V3 }));
  return (<SeasonHill t={t} season={season} chaos={chaos} flash={flash}>
    <Cam t={t} keys={keys} />
    {chaos && flash > 0.2 ? <Lightning p={[4, 9, -18]} s={[5, 14]} seed={Math.floor(t * 8)} o={flash} /> : null}
    <Stickman p={P6} t={t} action={chaos ? "scaredShake" : "idle"} lips={LIPS} gest={G6} face={(["happy", "laugh", "surprised", "worried"] as Face[])[season] ?? "confused"}
      rig={{ ...eyes(t, [[29.25, 0.3, -0.2], [30.0, -0.3, -0.4], [30.7, 0.4, -0.6], [31.3, 0.0, -0.8], [31.9, -0.2, 0]]) }} />
    <DepthPass focus={6.0} blur={2.2} />
  </SeasonHill>); };
