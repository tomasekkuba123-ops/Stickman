// EP09 v17.2 rebuilt scenes: S1 hook (night field), S3 ocean / tides, S5 Earth in space, S7 ending (= hook set, loops to frame 0).
// Speech gestures (kit/gesture.ts, asymmetric + aimed), eyes glance to the target before the hand, consistent framing (kit/frame.ts),
// dioramas (kit/sets4.tsx) with bottom-edge foreground props placed by groundAt().
import React from "react";
import { Cam, Key } from "../../style/extra";
import { V3 } from "../../style/kit";
import { Stickman, LipCue } from "../../kit/character";
import { Face } from "../../style/stickman";
import { DepthPass } from "../../kit/envlib";
import { NightField, MoonShore, SpaceDiorama, Earth3, RockPlatform } from "../../kit/sets4";
import { frameShot, framePose, worldAt, groundAt, screenDir, FULL, CLOSE, FrameOpts } from "../../kit/frame";
import { GKey, beat, WWord, aim } from "../../kit/gesture";
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
