// EP10 "What If Gravity Disappeared for 10 Seconds?" — single fixed spot (SeasonHill, autumn), v18-style kit reuse.
// No new environment: reuses SeasonHill (kit/sets4.tsx) + the character's own float/zeroG physics. Only new assets: a floating
// mug + phone (simple canvas billboards) and a few drifting leaves. Loop: last frame = first frame (same hook framing + pose).
import React from "react";
import { Billboard } from "../../style/toon";
import { Cam, Key } from "../../style/extra";
import { V3 } from "../../style/kit";
import { Stickman } from "../../kit/character";
import { Face } from "../../style/stickman";
import { DepthPass } from "../../kit/envlib";
import { SeasonHill } from "../../kit/sets4";
import { frameShot, framePose, FULL, CLOSE, SY_A, SY_B, FrameOpts } from "../../kit/frame";
import { GKey, WWord } from "../../kit/gesture";
import { act, AKey } from "../../kit/acting";
import MOUTH from "../../../public/ep10/mouth.json";
import WORDS from "../../../public/ep10/words.json";

export type Ctx = { t: number; f: number };
const LIPS = (MOUTH as { mouthCues: { start: number; end: number; value: string }[] }).mouthCues;
const W = WORDS as WWord[];
export const seg = (t: number, a: number, b: number) => Math.max(0, Math.min(1, (t - a) / (b - a)));
const sm = (x: number) => { const u = Math.max(0, Math.min(1, x)); return u * u * (3 - 2 * u); };
const faceAt = (t: number, list: [number, Face][]) => { let f = list[0][1]; for (const [a, x] of list) if (t >= a) f = x; return f; };
const shot = (t: number, list: [number, Key[]][]) => { let k = list[0][1]; for (const [t0, ks] of list) if (t >= t0) k = ks; return k; };
const wt = (w: string, from = 0) => (W.find((x) => x.start >= from && x.word.toLowerCase().replace(/[^a-z']/g, "") === w)?.start ?? from);
const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const eyes = (t: number, keys: [number, number, number][]) => { let i = 0; while (i < keys.length - 1 && t >= keys[i + 1][0]) i++; const [, x0, y0] = keys[i], nx = keys[i + 1];
  if (!nx || t < nx[0] - 0.18) return { lookX: x0, lookY: y0 }; const k = sm((t - (nx[0] - 0.18)) / 0.18); return { lookX: x0 + (nx[1] - x0) * k, lookY: y0 + (nx[2] - y0) * k }; };

/* size A (every normal shot) / size B (hook + ending, closer) — same convention as EP09 v18 */
const A = (o: FrameOpts): FrameOpts => ({ frac: FULL, sy: SY_A, fov: 42, camY: 1.0, ...o });
const B = (o: FrameOpts): FrameOpts => ({ frac: CLOSE, sy: SY_B, fov: 42, camY: 1.05, ...o });

export const SECONDS = 39.8;
export const PH: V3 = [0, 0, 1.0]; // the one fixed spot
export const HOOK_O: FrameOpts = B({ yaw: -0.15, sx: 0.5, push: 0.95, drift: 0.05 });
const HP = framePose(PH, HOOK_O, 0);
const OB = A({ yaw: 0.14, sx: 0.46, push: 0.96, drift: 0.04 });
const OC = A({ yaw: -0.1, sx: 0.57, push: 0.96, drift: -0.03 });
const OD = A({ yaw: 0.08, camY: 1.25, sx: 0.5, push: 0.97, drift: 0.03 });
const OE = A({ frac: FULL * 0.68, sy: SY_A + 0.09, yaw: -0.08, camY: 1.1, sx: 0.44, push: 0.94, drift: -0.05 });
const OF = A({ frac: FULL * 0.78, sy: SY_A + 0.07, yaw: 0.05, sx: 0.5, push: 0.96, drift: 0.02 });

/* zero-g lift: 0 at rest, rises 7.06s (first "float" line) -> peak at the snap (30.68s), eases back down by the landing (33.5s)
   — the camera for OE/OF is intentionally NOT tracking this (stays anchored to ground level like every other shot): the whole
   point is that the audience SEES him rise away from / crash back into a static frame, not a camera that chases him up. */
export const floatY = (t: number): number => {
  if (t < 7.06) return 0;
  if (t < 30.68) return sm((t - 7.06) / (30.68 - 7.06)) * 0.95;
  if (t < 33.5) return 0.95 * (1 - sm((t - 30.68) / (33.5 - 30.68)));
  return 0;
};
const zeroG = (t: number) => Math.max(0, Math.min(1, floatY(t) / 1.1));

/* floating props: a mug and a phone drift up from table height, bob gently, then drop back */
const drawMug = (c: CanvasRenderingContext2D, W_: number, H_: number) => {
  c.save(); c.translate(W_ / 2, H_ / 2); const s = W_ * 0.42;
  c.lineWidth = W_ * 0.055; c.strokeStyle = "#1A1A1A"; c.fillStyle = "#f4f4f0";
  c.beginPath(); c.roundRect(-s * 0.42, -s * 0.5, s * 0.84, s * 0.92, s * 0.1); c.fill(); c.stroke();
  c.beginPath(); c.arc(s * 0.42 + s * 0.18, -s * 0.03, s * 0.24, -Math.PI * 0.5, Math.PI * 0.5); c.lineWidth = W_ * 0.045; c.stroke();
  c.fillStyle = "#c9a06a"; c.beginPath(); c.ellipse(0, -s * 0.42, s * 0.34, s * 0.08, 0, 0, Math.PI * 2); c.fill(); c.stroke();
  c.restore();
};
const drawPhone = (c: CanvasRenderingContext2D, W_: number, H_: number) => {
  c.save(); c.translate(W_ / 2, H_ / 2); const w = W_ * 0.5, h = H_ * 0.86;
  c.lineWidth = W_ * 0.05; c.strokeStyle = "#1A1A1A"; c.fillStyle = "#2b2d42";
  c.beginPath(); c.roundRect(-w / 2, -h / 2, w, h, w * 0.18); c.fill(); c.stroke();
  c.fillStyle = "#8ecbff"; c.beginPath(); c.roundRect(-w * 0.4, -h * 0.4, w * 0.8, h * 0.72, w * 0.08); c.fill();
  c.restore();
};
const FloatProps: React.FC<{ t: number }> = ({ t }) => { const fy = floatY(t), wob = fy > 0.05 ? 1 : 0;
  return (<>
    <Billboard p={[-0.55, 1.0 + fy + Math.sin(t * 1.6) * 0.08 * wob, 0.35]} h={0.42} res={240} aspect={1} draw={drawMug} />
    <Billboard p={[0.52, 0.95 + fy * 0.9 + Math.sin(t * 1.9 + 1.4) * 0.08 * wob, 0.3]} h={0.5} res={240} aspect={0.6} draw={drawPhone} />
  </>); };
const LEAF_N = 7;
const Leaf: React.FC<{ i: number; t: number }> = ({ i, t }) => { const fy = floatY(t);
  const x = (rnd(i) - 0.5) * 3.2, z = 0.6 + rnd(i * 3) * 1.6, ph = rnd(i * 7) * 10, amp = 0.6 + rnd(i * 5) * 0.8;
  const y = 0.05 + fy * amp + (fy > 0.05 ? Math.sin(t * 1.1 + ph) * 0.1 : 0), spin = t * (0.6 + rnd(i * 9) * 0.6) + ph;
  const col = ["#f08a2c", "#d9541e", "#f2c14e"][i % 3];
  return (<group position={[x, y, z]} rotation={[0.3, spin, 0.2]}><mesh><circleGeometry args={[0.1, 5]} /><meshBasicMaterial color={col} side={2} /></mesh></group>); };
const FloatLeaves: React.FC<{ t: number }> = ({ t }) => <>{Array.from({ length: LEAF_N }, (_, i) => <Leaf key={i} i={i} t={t} />)}</>;

/* ---------------- gestures, body acting, face, eyes (full episode, one continuous shot at one spot) ---------------- */
const G: GKey[] = [
  { t: 0.3, g: "palmUpL", in: 0.3, hold: 0.5 },
  { t: wt("float", 4.0) + 0.02, g: "palmUp", hold: 0.5 },
  { t: wt("phone", 6.0) + 0.02, g: "point", hold: 0.3 },
  { t: wt("leaves", 7.5) + 0.02, g: "reach", hold: 0.4 },
  { t: wt("backpack", 9.8) + 0.02, g: "palmUpL", hold: 0.35 },
  { t: wt("yard", 13.0) + 0.02, g: "whoa", hold: 0.35 },
  { t: wt("blood", 15.2) + 0.02, g: "chin", hold: 0.4 },
  { t: wt("dizzy", 17.7) + 0.02, g: "shrug", hold: 0.5 },
  { t: wt("roller", 20.9) + 0.02, g: "whoa", hold: 0.4 },
  { t: 21.9, g: "open2", in: 0.4, hold: 5.6 },
  { t: wt("gravity", 30.5) + 0.02, g: "fist", in: 0.12, hold: 0.3 },
  { t: wt("crash", 32.6) + 0.02, g: "shrug", in: 0.1, hold: 0.6 },
  { t: 34.4, g: "palmUp", hold: 0.6 },
  { t: 36.4, g: "shrug", hold: 1.2 },
];
const ACT: AKey[] = [
  { t: 0, turn: 0.3, tilt: -5 },
  { t: 2.6, turn: 0.5, tilt: -8, d: 0.3 },
  { t: 7.0, turn: 0.1, tilt: 4, d: 0.4 },
  { t: 14.0, turn: -0.3, tilt: 6, d: 0.3 },
  { t: 17.9, shiver: 0.6, tilt: -6, d: 0.2 },
  { t: 21.7, shiver: 0, turn: 0.2, tilt: 0, d: 0.4 },
  { t: 28.3, turn: -0.2, tilt: 5, d: 0.4 },
  { t: 30.68, lean: -6, d: 0.1 },
  { t: 31.3, lean: 10, dip: 0.3, d: 0.15 },
  { t: 33.5, lean: 0, dip: 0.85, d: 0.1 },
  { t: 34.3, dip: 0.1, turn: 0, tilt: 0, d: 0.4 },
  { t: 37.0, turn: 0.1, tilt: -3, d: 0.5 },
];
const EY: [number, number, number][] = [[0, 0.3, -0.3], [2.6, 0.1, -0.5], [4.6, -0.3, 0.3], [9.0, 0.4, 0.2], [14.04, 0, 0.4], [21.7, 0.2, -0.2], [30.68, -0.1, -0.6], [34.0, 0, 0], [37.0, 0.3, -0.3]];
const FACE: [number, Face][] = [[0, "happy"], [2.6, "surprised"], [4.6, "laugh"], [9.0, "happy"], [14.04, "worried"], [17.94, "worried"], [21.7, "laugh"], [28.34, "surprised"], [30.68, "scared"], [33.6, "surprised"], [34.9, "happy"]];

/* OE/OF deliberately do NOT track the hero's rise (ground-anchored like every other shot): that is what makes the
   float/crash actually visible against a static frame. frac/sy give enough headroom at the float's peak (see floatY). */
const K: [number, Key[]][] = [
  [0, frameShot(PH, 0, 2.6, HOOK_O)],
  [2.6, frameShot(PH, 2.6, 9.0, OB)],
  [9.0, frameShot(PH, 9.0, 14.04, OC)],
  [14.04, frameShot(PH, 14.04, 21.7, OD)],
  [21.7, frameShot(PH, 21.7, 30.68, OE)],
  [30.68, frameShot(PH, 30.68, 34.74, OF)],
  [34.74, [{ ...framePose(PH, { ...HOOK_O, frac: CLOSE * 0.97 }, 0), t: 37.0 }, { ...HP, t: 38.2 }, { ...HP, t: SECONDS }]],
];

export const Ep10Scene = ({ t }: Ctx) => {
  const a = act(t, ACT, { swayT: t - SECONDS }); // sway phase ends at ~0 to match t=0 (seamless loop)
  const fy = floatY(t), p: V3 = [PH[0], PH[1] + fy, PH[2]];
  const afterLanding = t > 34.3;
  return (<SeasonHill t={t} season={2} chaos={0}>
    <Cam t={t} keys={shot(t, K)} impacts={[[33.5, 0.03]]} />
    <FloatProps t={t} />
    <FloatLeaves t={t} />
    <Stickman p={p} t={t} action="idle" lips={LIPS} gest={G}
      face={faceAt(t, FACE)}
      rig={{ ...a.rig, ...eyes(t, EY), zeroG: afterLanding ? 0 : zeroG(t), ...(afterLanding ? { headTurn: 0.3 } : {}) }} />
    <DepthPass focus={6.7} blur={2.0} />
  </SeasonHill>); };
