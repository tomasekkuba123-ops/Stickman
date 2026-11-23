// EP09 v17 rebuilt scenes: S1 hook (night field), S3 ocean / tides, S5 Earth in space, S7 ending (= hook set, loops to frame 0).
// Smooth speech gestures (kit/gesture.ts) on Whisper word times, consistent framing (kit/frame.ts), richer dioramas (kit/sets4.tsx).
import React from "react";
import { Cam, Key } from "../../style/extra";
import { V3 } from "../../style/kit";
import { Stickman, LipCue } from "../../kit/character";
import { Face } from "../../style/stickman";
import { DepthPass } from "../../kit/envlib";
import { NightField, MoonShore, SpaceDiorama, Earth3 } from "../../kit/sets4";
import { frameShot, framePose, worldAt, FULL, CLOSE, FrameOpts } from "../../kit/frame";
import { GKey, beat, WWord } from "../../kit/gesture";
import MOUTH from "../../../public/ep09/mouth.json";
import WORDS from "../../../public/ep09/words.json";

export type Ctx = { t: number; f: number };
const LIPS = (MOUTH as { mouthCues: LipCue[] }).mouthCues;
const W = WORDS as WWord[];
const seg = (t: number, a: number, b: number) => Math.max(0, Math.min(1, (t - a) / (b - a)));
const sm = (x: number) => { const u = Math.max(0, Math.min(1, x)); return u * u * (3 - 2 * u); };
const faceAt = (t: number, list: [number, Face][]) => { let f = list[0][1]; for (const [a, x] of list) if (t >= a) f = x; return f; };
const shot = (t: number, list: [number, Key[]][]) => { let k = list[0][1]; for (const [t0, ks] of list) if (t >= t0) k = ks; return k; };

/* ================= S1 HOOK 0–3.0 (one shot: Moon swells, shrinks + fades + sparkles away; Stickman points, then gasps) ================= */
export const PH: V3 = [0, 0, 0];
export const HOOK_O: FrameOpts = { frac: FULL, fov: 42, yaw: -0.22, camY: 1.15, sx: 0.4, sy: 0.37, push: 0.94, drift: 0.05 };
export const MOON_P = worldAt(framePose(PH, HOOK_O, 0), 0.8, 0.3, 70); // Moon placed in the composition: right of the hero, under the WHAT IF? title
export const HOOK_FACE = { lookX: 0.45, lookY: -0.7, headTilt: -6 };
const G1: GKey[] = [{ t: 0.8, g: "pointUp", in: 0.35, hold: 0.3 }, { t: 1.35, g: "whoa", in: 0.22, hold: 1.1, amp: 1 }];
export const vanishAt = (t: number) => seg(t, 0.95, 2.15);
export const S1 = ({ t }: Ctx) => { const v = vanishAt(t), dark = sm(seg(t, 1.35, 2.7));
  return (<NightField t={t} dark={dark} vanish={v} moonP={MOON_P}>
    <Cam t={t} keys={frameShot(PH, 0, 3.05, HOOK_O)} impacts={[[1.5, 0.012]]} />
    <Stickman p={PH} t={t} action="idle" lips={LIPS} gest={G1} face={faceAt(t, [[0, "smile"], [1.15, "surprised"], [2.2, "scared"]])}
      rig={{ ...HOOK_FACE, ...(t < 0.8 ? { blink: 0 } : {}), ...(t > 1.3 ? { lookX: 0.3, lookY: -0.8, squash: -0.03 * Math.exp(-(t - 1.3) * 4) } : {}) }} />
    <DepthPass focus={6.2} blur={2.4} />
  </NightField>); };

/* ================= S7 ENDING 32.7–38.0 (same set; Moon pops back; ends EXACTLY on the hook's first frame) ================= */
const G7: GKey[] = beat(W, [["so", "palmUp2"], ["moon", "pointUp"], ["tonight", "shrug"], ["would", "palmUp"], ["notice", "chin", { hold: 0.9 }]], 32.5);
export const S7 = ({ t }: Ctx) => { const back = seg(t, 36.7, 37.4);
  const end: Key[] = [{ ...framePose(PH, { ...HOOK_O, frac: FULL * 0.92 }, 0), t: 36.55 }, { ...framePose(PH, HOOK_O, 0), t: 38.0 }];
  const cam = t < 35.0 ? frameShot(PH, 32.7, 35.0, { frac: CLOSE, fov: 40, yaw: -0.18, camY: 1.5, sx: 0.5, sy: 0.36, push: 0.95, drift: -0.05 }) : t < 36.55 ? frameShot(PH, 35.0, 36.55, { frac: FULL, fov: 42, yaw: 0.3, camY: 1.2, sx: 0.5, sy: 0.37, drift: -0.06 }) : end;
  const endPose = t > 37.0 ? HOOK_FACE : { lookX: 0, lookY: -0.1 };
  return (<NightField t={t} dark={1 - sm(back)} vanish={back > 0 ? 0 : 2} back={back} moonP={MOON_P}>
    <Cam t={t} keys={cam} />
    <Stickman p={PH} t={t} action="idle" lips={LIPS} gest={G7} face={faceAt(t, [[32.7, "think"], [35.0, "confused"], [36.7, "surprised"], [37.35, "smile"]])} rig={{ ...endPose, ...(t > 36.9 ? { blink: 0 } : {}) }} />
    <DepthPass focus={6.2} blur={2.4} />
  </NightField>); };

/* ================= S3 OCEAN / TIDES 9.7–16.4 ================= */
const P3: V3 = [0, 0, 3.4];
export const tideAt = (t: number) => 1 - 0.62 * sm(seg(t, 14.3, 15.7)); // "...shrink to less than half" -> waterline visibly retreats
export const ghostAt = (t: number) => sm(seg(t, 11.75, 12.25)) * (1 - sm(seg(t, 13.5, 14.0)));
const O3B: FrameOpts = { frac: FULL, fov: 46, yaw: -0.35, camY: 0.7, sx: 0.36, sy: 0.4, drift: 0.05 };
const K3: [number, Key[]][] = [
  [9.7, frameShot(P3, 9.7, 11.75, { frac: FULL, fov: 44, yaw: 0.55, camY: 1.6, sx: 0.58, sy: 0.37, drift: -0.08 })],
  [11.75, frameShot(P3, 11.75, 13.45, O3B)],
  [13.45, frameShot(P3, 13.45, 16.45, { frac: FULL, fov: 46, yaw: 0.05, camY: 3.6, sx: 0.5, sy: 0.37, push: 0.97, drift: 0.04 })],
];
const GHOST_P = worldAt(framePose(P3, O3B, 0), 0.74, 0.17, 90);
const G3: GKey[] = beat(W, [["oceans", "present"], ["change", "palmUp"], ["moon", "pointUp"], ["most", "chop"], ["tides", "open2"], ["they'd", "palmUpL"], ["shrink", "chop", { hold: 0.2 }], ["less", "pointL"], ["half", "palmUp2", { hold: 0.6 }]], 9.6);
export const S3 = ({ t }: Ctx) => (
  <MoonShore t={t} tide={tideAt(t)} ghost={ghostAt(t)} ghostP={GHOST_P}>
    <Cam t={t} keys={shot(t, K3)} />
    <Stickman p={P3} t={t} action="idle" lips={LIPS} gest={G3} face={faceAt(t, [[9.7, "smile"], [11.75, "happy"], [13.45, "surprised"], [14.3, "worried"], [15.3, "surprised"]])}
      rig={t >= 11.75 && t < 13.45 ? { lookY: -0.8, lookX: 0.4 } : t >= 13.45 && t < 15.8 ? { lookX: -0.2, lookY: 0.35 } : {}} />
    <DepthPass focus={t < 11.75 ? 7.5 : 6.8} blur={2.4} />
  </MoonShore>);

/* ================= S5 EARTH IN SPACE 25.0–29.25 (big slow axis wobble, hero floats beside the Earth) ================= */
const P5: V3 = [-1.7, -0.6, 1.6], ER = 1.45;
const O5A: FrameOpts = { frac: FULL, fov: 50, yaw: -0.25, camY: 1.6, sx: 0.3, sy: 0.4, push: 0.94, drift: 0.06 };
const EARTH: V3 = worldAt(framePose([P5[0], 0, P5[2]], O5A, 0.5), 0.76, 0.36, 10.5), SUN: V3 = worldAt(framePose([P5[0], 0, P5[2]], O5A, 0), 0.14, 0.08, 110);
export const wobbleAt = (t: number) => { const env = sm(seg(t, 27.45, 27.95)); return { tilt: 23.4 + 27 * Math.sin(((t - 27.45) / 2.3) * Math.PI * 2) * env, prec: 0.55 * Math.sin(((t - 27.45) / 2.3) * Math.PI * 2 - 0.9) * env }; };
const K5: [number, Key[]][] = [
  [25.0, frameShot([P5[0], 0, P5[2]], 25.0, 27.4, O5A)],
  [27.4, frameShot([P5[0], 0, P5[2]], 27.4, 29.3, { frac: FULL, fov: 50, yaw: -0.3, camY: 1.4, sx: 0.3, sy: 0.4, push: 0.96, drift: -0.03 })],
];
const G5: GKey[] = beat(W, [["millions", "open2"], ["years", "palmUpL"], ["earth's", "present", { hold: 0.6 }], ["tilt", "point"], ["start", "palmUp"], ["wobble", "whoa", { hold: 0.7 }]], 25.0);
export const S5 = ({ t }: Ctx) => { const w = wobbleAt(t), bob = Math.sin(t * 1.4) * 0.1;
  return (<SpaceDiorama t={t} sun={SUN}>
    <Cam t={t} keys={shot(t, K5)} />
    <Earth3 p={EARTH} r={ER} t={t} tilt={w.tilt} prec={w.prec} />
    <Stickman p={[P5[0], P5[1] + bob, P5[2]]} t={t} action="float" move={false} lips={LIPS} shadow={false} gest={G5}
      face={faceAt(t, [[25, "happy"], [27.5, "surprised"], [28.4, "scared"]])} rig={{ lookX: 0.7, lookY: -0.2, zeroG: 1, lean: 6 * Math.sin(((t - 27.45) / 2.3) * Math.PI * 2) * sm(seg(t, 27.6, 28.1)) }} />
    <DepthPass focus={6.6} blur={2.0} />
  </SpaceDiorama>); };
