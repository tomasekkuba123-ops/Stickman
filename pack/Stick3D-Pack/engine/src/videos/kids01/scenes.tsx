// KIDS EP01 "What If Stickman Shrank?" — 40 s. Two sets: BigGarden (normal scale) and MiniGarden (ant scale, hero keeps h = 3).
// Every shot reads hero / ladybug / seed state from global functions of t, so cuts never break continuity.
// Loop: the hook (t 0..2.48) and the ending (t >= 36.8) both use hookHero(tau) / seedAt(tau) / hookKey(tau) with tau = t or t - LEN,
// so the last frame flows into frame 0 (a dandelion seed drifts to his nose -> the sneeze that starts the episode).
import React from "react";
import { Cam, Key } from "../../style/extra";
import { V3 } from "../../style/kit";
import { Stickman, ActionName, LipCue } from "../../kit/character";
import { Face, Rig } from "../../style/stickman";
import { DepthPass } from "../../kit/envlib";
import { BigGarden, MiniGarden, MG, leafY, DAND_TOP, LF, LF_TOP, Raindrop, FloatSeed, GrassBlades, makeBlades } from "../../kit/sets6";
import { framePose, FrameOpts, FULL, CLOSE, SY_A, SY_B } from "../../kit/frame";
import { GKey } from "../../kit/gesture";
import { act, AKey } from "../../kit/acting";
import { Animal } from "../../kit/animals";
import { DustImpact, Splash } from "../../kit/fx";
import { PuffRing } from "../../kit/puff";
import MOUTH from "../../../public/kids01/mouth.json";

export type Ctx = { t: number; f: number };
export const LEN = 40;
const cl = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const seg = (t: number, a: number, b: number) => cl((t - a) / (b - a));
const sm = (x: number) => { const u = cl(x); return u * u * (3 - 2 * u); };
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const lerp3 = (a: V3, b: V3, k: number): V3 => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
const pick = <T,>(t: number, list: [number, T][]) => { let k = list[0][1]; for (const [a, x] of list) if (t >= a) k = x; return k; };
const path = (t: number, keys: [number, V3][]): V3 => { if (t <= keys[0][0]) return keys[0][1]; for (let i = 0; i < keys.length - 1; i++) if (t < keys[i + 1][0]) { const u = (t - keys[i][0]) / (keys[i + 1][0] - keys[i][0]), k = u * u * (3 - 2 * u) * 0.5 + u * 0.5; return lerp3(keys[i][1], keys[i + 1][1], k); } return keys[keys.length - 1][1]; };
const H = 3;

/* ================= TIMELINE (Whisper word times, lines.json) ================= */
export const T = {
  sneeze0: 2.48, achoo: 3.03, shrink: 4.47, pop: 4.53, tiny: 4.6, land: 4.85, buzz: 8.7, bugLand: 9.88, hi: 11.42, ride: 12.1,
  climb: 13.55, climbD: 0.75, takeoff: 14.5, flower: 16.4, snail: 17.6, leafLand: 18.6, hop: 18.8, hopD: 0.45, wait: 18.84, point: 19.68,
  ball: 20.74, drop: 22.38, splash: 22.74, slide: 23.0, launch: 26.0, boing: 26.75, tickle: 29.4, sneeze2: 30.98, achoo2: 31.53, pop2: 31.89,
  big: 31.95, cheer: 32.3, bye: 34.77, ask: 36.8,
};
export const CUTS = [0, 2.95, 4.6, 6.1, 8.6, 11.3, 13.4, 15.8, 18.7, 22.7, 26.95, 29.4, 31.95, 33.5, 36.8, LEN];
export const BIG = (t: number) => t < T.tiny || t >= T.big;
/* the hero speaks only his own lines (the rest is the narrator) */
const SPEAK: [number, number][] = [[11.38, 13.0], [25.88, 26.3], [34.72, 36.3], [36.86, 38.4]];
const LIPS: LipCue[] = (MOUTH as { mouthCues: LipCue[] }).mouthCues.map((c) => SPEAK.some(([a, b]) => c.start >= a && c.start < b) ? c : { ...c, value: "X" });

/* ================= places ================= */
export const HP: V3 = [0, 0, 0];                        // big world spot (hook + ending)
const NOSE = (p: V3): V3 => [p[0] + 0.04, p[1] + 2.08, p[2] + 0.18];
const BUG_BACK = (b: V3, flip: boolean): V3 => [b[0] + (flip ? 0.44 : -0.44), b[1] + 1.5, b[2] + 0.2];
export const LS: V3 = [39.6, leafY(39.6), 0.15];        // his spot on the leaf (high end)
const DROP_X = 40.75, DROP_TIP = 10.25;                 // the drop hangs under this blade tip
export const DT: V3 = [MG.dand[0], DAND_TOP, 0.12];      // on top of the dandelion puff
const arc = (t: number, t0: number, d: number, a: V3, b: V3, apex: number): V3 => { const u = seg(t, t0, t0 + d); const p = lerp3(a, b, u); return [p[0], p[1] + apex * Math.sin(Math.PI * u), p[2]]; };
const slideX = (t: number) => lerp(LS[0], MG.leafX1, seg(t, T.slide, T.launch) ** 1.7);

/* ================= ladybug ================= */
type Bug = { p: V3; h: number; flip: boolean; wing: number; walk: number; claw: number; look: number; show: boolean };
const FLIGHT: [number, V3][] = [[T.takeoff, [MG.bug[0], 0, MG.bug[2]]], [15.1, [4.6, 2.6, -1.0]], [15.8, [9.5, 5.2, -0.3]], [T.flower, [16.0, 6.6, 0]], [17.0, [21.5, 4.6, 0]], [T.snail, [27.5, 1.6, 0]], [18.15, [34.0, 6.6, 0]], [T.leafLand, [38.3, leafY(38.3), -0.35]]];
export function bugAt(t: number): Bug {
  if (BIG(t)) { const tau = t >= T.big ? t - LEN : t; const wave = t >= 33.85 && t < 36.6 ? 0.55 + 0.45 * Math.sin((t - 33.85) * 9) : 0;
    return { p: [LF[0], LF_TOP - 0.01, LF[2] + 0.02], h: 0.42, flip: true, wing: (tau % 4 + 4) % 4 < 0.25 ? 0.6 : 0, walk: 0, claw: wave, look: -0.2, show: true }; }
  if (t < T.buzz) return { p: [20, 9, -5], h: 3, flip: true, wing: 1, walk: 0, claw: 0, look: 0, show: false };
  if (t < T.bugLand) { const p = path(t, [[T.buzz, [7.5, 7.5, -3.5]], [9.4, [3.2, 2.2, -2.4]], [T.bugLand, MG.bug]]); return { p, h: 3, flip: true, wing: 1, walk: 0, claw: 0, look: -0.3, show: true }; }
  if (t < T.takeoff) { const nod = t > T.ride + 0.5 && t < T.ride + 1.3 ? 0.5 * Math.sin((t - T.ride - 0.5) * 12) : 0;
    return { p: MG.bug, h: 3, flip: true, wing: t > 14.25 ? sm(seg(t, 14.25, T.takeoff)) : t < T.bugLand + 0.25 ? 1 - seg(t, T.bugLand, T.bugLand + 0.25) : 0, walk: 0, claw: t > T.hi + 0.1 && t < T.hi + 1.0 ? 0.6 + 0.4 * Math.sin((t - T.hi) * 10) : 0, look: -0.3 + nod * 0.3, show: true }; }
  if (t < T.leafLand) return { p: path(t, FLIGHT), h: 3, flip: false, wing: 1, walk: 0, claw: 0, look: 0.2, show: true };
  if (t < 19.25) return { p: FLIGHT[FLIGHT.length - 1][1], h: 3, flip: false, wing: t < T.leafLand + 0.2 ? 1 : t > 19.0 ? 1 : 0, walk: 0, claw: t > T.hop + 0.3 ? 0.8 : 0, look: 0, show: true };
  if (t < 20.4) { const u = seg(t, 19.25, 20.4), a = FLIGHT[FLIGHT.length - 1][1]; return { p: [a[0] - 6 * u * u, a[1] + 7 * u, a[2] - 3 * u], h: 3, flip: true, wing: 1, walk: 0, claw: 0, look: 0, show: true }; }
  return { p: [0, 0, 0], h: 3, flip: true, wing: 0, walk: 0, claw: 0, look: 0, show: false };
}

/* ================= floating seeds ================= */
/* the hook seed: drifts in from the left, hovers at his nose, gets blown away by the sneeze (tau = t or t - LEN) */
export function seedAt(tau: number): { p: V3; rot: number; show: boolean } {
  const n = NOSE(HP);
  if (tau < -3.3 || tau > 4.4) return { p: n, rot: 0, show: false };
  if (tau < 0.6) { const u = seg(tau, -3.3, 0.6), e = 1 - (1 - u) ** 2; return { p: [lerp(-3.2, n[0], e), lerp(3.7, n[1], e) + 0.18 * Math.sin(tau * 3.1) * (1 - u), lerp(0.2, n[2], e)], rot: 0.3 * Math.sin(tau * 2), show: true }; }
  if (tau < T.achoo) return { p: [n[0] + 0.05 * Math.sin(tau * 4), n[1] + 0.04 * Math.cos(tau * 3.3), n[2]], rot: 0.15 * Math.sin(tau * 5), show: true };
  const u = tau - T.achoo; return { p: [n[0] + 4.5 * u, n[1] + 1.4 * u + 0.6 * u * u, n[2] + 0.5 * u], rot: u * 6, show: true };
}
/* tiny world: the tickle seed (from the burst) drifts onto his nose on the dandelion */
const tickleSeed = (t: number): V3 | null => { if (t < T.tickle - 0.1 || t > T.achoo2 + 1.4) return null; const n = NOSE(DT);
  if (t < 30.4) { const u = sm(seg(t, T.tickle - 0.1, 30.4)); return [lerp(n[0] + 2.6, n[0], u), lerp(n[1] + 1.8, n[1], u) + 0.15 * Math.sin(t * 3), lerp(n[2] - 0.4, n[2], u)]; }
  if (t < T.achoo2) return [n[0] + 0.06 * Math.sin(t * 5), n[1] + 0.05 * Math.cos(t * 4), n[2]];
  const u = t - T.achoo2; return [n[0] + 5 * u, n[1] + 2 * u, n[2] + 0.4 * u]; };
const BURST = Array.from({ length: 7 }, (_, i) => ({ a: -1.2 + i * 0.42, v: 1.0 + (i % 3) * 0.35, s: 1.5 + (i % 2) * 0.4 }));

/* ================= raindrop ================= */
const dropAt = (t: number): { p: V3; r: number; o: number } | null => { if (t < 18.5 || t > T.splash + 0.04) return null;
  const r = lerp(0.55, 0.88, sm(seg(t, 18.9, 21.8))), hang = DROP_TIP - r * 1.08;
  if (t < T.drop) return { p: [DROP_X, hang + 0.05 * Math.sin(t * 2.3), -0.4], r, o: 1 };
  const u = seg(t, T.drop, T.splash); return { p: [DROP_X, lerp(hang, leafY(DROP_X) + r * 0.6, u * u), lerp(-0.4, 0, u)], r, o: 1 }; };

/* ================= hero acting ================= */
type HeroState = { p: V3; action: ActionName; t0: number; face: Face; dir?: 1 | -1; dur?: number; gest?: GKey[]; rig?: Partial<Rig>; h?: number };
/* hook + ending: one function of tau. tau -3.2..-1.6 asks the viewer, then a seed drifts to his nose (cross-eyed, head tips back) -> sneeze */
const HOOK_A: AKey[] = [{ t: 6.8, turn: 0.1, tilt: 0, lean: 0 }, { t: 7.2, turn: 0.0, tilt: 4, lean: 2, dip: 0.1 }, { t: 8.6, turn: 0.15, tilt: -3 }, { t: 10.6, tilt: -8, lean: -5, dip: 0.15, d: 0.5 }, { t: 11.4, tilt: -12, lean: -8, dip: 0.25, d: 0.7 }];
const G_ASK: GKey[] = [{ t: -3.1, g: "palmUp2", in: 0.3, hold: 1.0 }, { t: -1.75, g: "rest", in: 0.4 }, { t: 1.4, g: "chin", in: 0.4, hold: 99 }];
export function hookHero(tau: number): HeroState {
  if (tau >= T.sneeze0) return { p: HP, action: "sneezeReact", t0: T.sneeze0, face: "worried", gest: [] };
  const a = act(tau + 10, HOOK_A, { swayT: tau });
  const nose = tau > -0.6; // cross-eyed at the seed
  const twitch = tau > 0.9 ? 0.5 + 0.5 * Math.sin(tau * 23) : 0;
  return { p: HP, action: "idle", t0: 0, face: pick(tau, [[-99, "happy" as Face], [-3.1, "grin" as Face], [-1.6, "smile" as Face], [-0.5, "surprised" as Face], [0.8, "worried" as Face]]), gest: G_ASK,
    rig: { ...a.rig, lookX: nose ? 0.35 : 0, lookY: nose ? 0.55 : 0, ...(tau > 1.6 ? { blink: twitch > 0.85 ? 1 : 0 } : {}) } };
}
const G_UP: GKey[] = [{ t: 6.55, g: "whoa", in: 0.25, hold: 0.7 }, { t: 7.25, g: "open2", in: 0.3, hold: 0.9 }];
const G_HI: GKey[] = [{ t: T.hi, g: "wave", in: 0.2, hold: 0.55 }, { t: T.ride, g: "palmUp", in: 0.25, hold: 0.7 }];
const G_RIDE: GKey[] = [{ t: 14.3, g: "whoa", in: 0.2, hold: 1.0 }, { t: 15.2, g: "open2", in: 0.3, hold: 2.4 }];
const G_RAIN: GKey[] = [{ t: T.point, g: "pointUp", in: 0.2, hold: 0.7 }, { t: T.ball, g: "whoa", in: 0.2, hold: 1.6 }];
const G_FLUFF: GKey[] = [{ t: 27.9, g: "open2", in: 0.3, hold: 0.9 }];
const G_BYE: GKey[] = [{ t: T.bye - 0.05, g: "wave", in: 0.2, hold: 1.2 }];
export function heroAt(t: number): HeroState {
  if (t < T.sneeze0) return hookHero(t);
  if (t >= T.ask) return hookHero(t - LEN);
  // big world: sneeze, then shrink into the puff
  if (t < T.tiny) { const k = seg(t, T.shrink, T.tiny); return { p: HP, action: t < 4.2 ? "sneezeReact" : "idle", t0: T.sneeze0, face: t < 4.2 ? "surprised" : "confused", h: H * lerp(1, 0.08, sm(k)), rig: t >= 4.2 ? { ...act(t, [{ t: 4.25, tilt: 8, turn: -0.3 }]).rig } : undefined }; }
  // tiny world
  if (t < T.land) return { p: [0, lerp(1.4, 0, seg(t, T.tiny, T.land) ** 2), 0], action: "jump", t0: T.tiny - 0.4, dur: 0.65, face: "surprised" };
  if (t < 6.1) return { p: MG.land, action: t < T.land + 0.5 ? "land" : "idle", t0: T.land, face: "surprised", rig: { ...act(t, [{ t: 5.15, turn: -0.5 }, { t: 5.6, turn: 0.5 }]).rig } };
  if (t < T.buzz) return { p: MG.land, action: "idle", t0: 0, face: pick(t, [[0, "surprised" as Face], [7.1, "grin" as Face]]), gest: G_UP, rig: { lookY: -0.8, lookX: 0.2, ...act(t, [{ t: 6.3, lean: -6, tilt: -6 }, { t: 7.4, lean: -3, tilt: 4 }]).rig } };
  if (t < T.bugLand) return { p: MG.land, action: "idle", t0: 0, face: "surprised", rig: { lookX: 0.7, lookY: -0.5, ...act(t, [{ t: 8.8, turn: 0.6, lean: -4 }]).rig } };
  if (t < T.hi - 0.05) return { p: MG.land, action: "freezeShock", t0: T.bugLand, face: t < 10.6 ? "surprised" : "happy" };
  if (t < T.climb) return { p: MG.land, action: "idle", t0: 0, face: t < T.ride ? "happy" : "smile", gest: G_HI, rig: { lookX: 0.6, ...act(t, [{ t: 11.5, turn: 0.5, tilt: 5 }, { t: 12.3, lean: 4, tilt: -4 }]).rig } };
  const back = BUG_BACK(bugAt(t).p, bugAt(t).flip);
  if (t < T.climb + T.climbD) return { p: arc(t, T.climb, T.climbD, MG.land, BUG_BACK(MG.bug, true), 1.2), action: "jump", t0: T.climb, dur: T.climbD, face: "determined" };
  if (t < T.hop) return { p: back, action: t < T.climb + T.climbD + 0.4 ? "land" : "idle", t0: T.climb + T.climbD, face: pick(t, [[0, "happy" as Face], [14.5, "surprised" as Face], [15.0, "laugh" as Face], [16.2, "happy" as Face], [17.4, "smile" as Face], [18.2, "laugh" as Face]]), gest: G_RIDE,
    rig: { lookX: t > 16.0 && t < 16.8 ? -0.3 : t > 17.2 && t < 18.0 ? 0.3 : 0.4, lookY: t > 17.2 && t < 18.0 ? 0.6 : t > 16.0 && t < 16.8 ? -0.5 : 0, ...act(t, [{ t: 14.4, dip: 0.45, lean: -6 }, { t: 15.3, dip: 0.3, lean: 4 }]).rig } };
  if (t < T.hop + T.hopD) return { p: arc(t, T.hop, T.hopD, BUG_BACK(FLIGHT[FLIGHT.length - 1][1], false), LS, 0.6), action: "jump", t0: T.hop, dur: T.hopD, face: "happy" };
  if (t < T.splash) return { p: LS, action: t < T.hop + T.hopD + 0.45 ? "land" : "idle", t0: T.hop + T.hopD, face: pick(t, [[0, "happy" as Face], [19.3, "surprised" as Face], [T.ball, "scared" as Face]]), gest: G_RAIN,
    rig: { lookX: 0.45, lookY: t > 19.3 ? -0.75 : 0, ...act(t, [{ t: 19.4, lean: -5, tilt: -6, turn: 0.4 }, { t: T.ball, lean: -9, dip: 0.3, turn: 0.5 }, { t: 22.2, lean: -12, dip: 0.45, d: 0.3 }]).rig } };
  if (t < T.slide) return { p: LS, action: "freezeShock", t0: T.splash, face: "surprised" };
  if (t < T.launch) { const x = slideX(t); return { p: [x, leafY(x), LS[2]], action: "idle", t0: 0, face: t < 23.4 ? "surprised" : "laugh", gest: [{ t: T.slide, g: "whoa", in: 0.2, hold: 99 }], rig: { lookX: 0.6, ...act(t, [{ t: 23.05, lean: -14, dip: 0.55, d: 0.2 }, { t: 25.8, lean: -18, dip: 0.6, tilt: 8 }]).rig } }; }
  if (t < T.boing) return { p: arc(t, T.launch, T.boing - T.launch, [MG.leafX1, leafY(MG.leafX1), LS[2]], DT, 2.2), action: "jump", t0: T.launch - 0.3, dur: 1.05, face: "laugh" };
  if (t < T.tickle) { const bob = Math.exp(-(t - T.boing) * 3) * Math.sin((t - T.boing) * 13) * 0.35; return { p: [DT[0], DT[1] - Math.max(0, bob), DT[2]], action: t < T.boing + 0.55 ? "land" : "idle", t0: T.boing, face: pick(t, [[0, "laugh" as Face], [27.7, "happy" as Face], [28.6, "laugh" as Face]]), gest: G_FLUFF, rig: { ...act(t, [{ t: 27.9, tilt: 6, lean: 3 }, { t: 28.8, tilt: -4 }]).rig } }; }
  if (t < T.sneeze2) { const tw = t > 30.3 ? 0.5 + 0.5 * Math.sin(t * 23) : 0; return { p: DT, action: "idle", t0: 0, face: t < 30.0 ? "surprised" : "worried", rig: { lookX: 0.35, lookY: 0.55, ...(t > 30.5 ? { blink: tw > 0.85 ? 1 : 0 } : {}), ...act(t, [{ t: 29.6, tilt: 3 }, { t: 30.4, tilt: -10, lean: -6, dip: 0.15, d: 0.5 }]).rig } }; }
  if (t < T.big) return { p: DT, action: "sneezeReact", t0: T.sneeze2, face: "worried" };
  // big world again: grow out of the puff
  if (t < T.cheer) { const k = seg(t, T.big, 32.2), o = 1 + 0.12 * Math.sin(seg(t, 32.05, T.cheer) * Math.PI); return { p: HP, action: "idle", t0: 0, face: "surprised", h: H * lerp(0.15, 1, sm(k)) * (k >= 1 ? o : 1) }; }
  if (t < 33.5) return { p: HP, action: "celebrate", t0: T.cheer, face: "laugh" };
  return { p: HP, action: "idle", t0: 0, face: pick(t, [[0, "happy" as Face], [34.1, "smile" as Face], [T.bye, "happy" as Face]]), gest: G_BYE, rig: { lookX: 0.55, lookY: 0.7, ...act(t, [{ t: 33.7, lean: 7, dip: 0.25, turn: 0.5, tilt: 6 }, { t: 36.4, lean: 0, dip: 0, turn: 0, tilt: 0, d: 0.4 }]).rig } };
}

/* ================= cameras (size A = 58 %, size B = 68 % only for the hook + ending) ================= */
const A = (o: FrameOpts): FrameOpts => ({ frac: FULL, sy: SY_A, fov: 42, camY: 1.0, ...o });
const B = (o: FrameOpts): FrameOpts => ({ frac: CLOSE, sy: SY_B, fov: 42, camY: 1.05, ...o });
export const HOOK_O = B({ yaw: -0.22, sx: 0.44, push: 0.95, drift: 0.05 });
const hookKey = (tau: number): Key => ({ ...framePose(HP, HOOK_O, (tau + 3.2) / 6.2), t: 0 });
const span = (t0: number, t1: number, f: (t: number) => Key, n = 12): Key[] => Array.from({ length: n + 1 }, (_, i) => { const t = lerp(t0, t1, i / n); return { ...f(t), t }; });
const still = (hero: V3, t0: number, t1: number, o: FrameOpts): Key[] => [{ ...framePose(hero, o, 0), t: t0 }, { ...framePose(hero, o, 1), t: t1 }];
const smoothTrack = (t0: number, t1: number, o: FrameOpts, lagS = 0.15) => span(t0, t1, (t) => { const a = heroAt(t).p, b = heroAt(Math.max(t0, t - lagS)).p; return framePose(lerp3(a, b, 0.5), o, seg(t, t0, t1)); }, 24);
const MID_BUG: V3 = [0.6, 0, -1.0];
// dy(t): lower the framing anchor (e.g. to bring the sleeping snail under the flight path into frame)
const rideTrack = (t0: number, t1: number, o: FrameOpts, dy: (t: number) => number = () => 0) => span(t0, t1, (t) => { const a = bugAt(t).p, b = bugAt(Math.max(t0, t - 0.2)).p, m = lerp3(a, b, 0.5); return framePose([m[0], m[1] - dy(t), m[2]], o, seg(t, t0, t1)); }, 24);
const SNAIL_DIP = (t: number) => 2.0 * Math.sin(Math.PI * seg(t, 16.8, 18.4)) ** 2;
export const CAMS: ((t: number) => Key[])[] = [
  () => span(0, 2.95, (t) => hookKey(t), 8),
  () => still(HP, 2.95, T.tiny, A({ yaw: 0.22, sx: 0.5, push: 0.93, drift: -0.05 })),
  () => still(MG.land, T.tiny, 6.1, A({ yaw: 0.12, sx: 0.5, push: 0.95, drift: 0.06 })),
  () => still(MG.land, 6.1, T.buzz - 0.1, A({ yaw: -0.28, sx: 0.5, camY: 0.25, fov: 46, push: 0.93, drift: 0.08 })),
  () => still(MID_BUG, 8.6, 11.3, A({ yaw: -0.42, sx: 0.5, push: 0.96, drift: 0.05, h: 4.4 })),
  () => still(MID_BUG, 11.3, 13.4, A({ yaw: 0.12, sx: 0.5, push: 0.95, drift: -0.05, h: 4.4 })),
  () => rideTrack(13.4, 15.8, A({ yaw: -0.3, sx: 0.5, drift: 0.06, h: 5.4, camY: 1.6 })),
  () => rideTrack(15.8, 18.7, A({ yaw: 0.32, sx: 0.5, drift: 0.04, h: 5.4, camY: 1.2 }), SNAIL_DIP),
  () => still(LS, 18.7, 22.7, A({ yaw: -0.22, sx: 0.4, push: 0.95, drift: 0.04 })),
  () => smoothTrack(22.7, 26.95, A({ yaw: 0.3, sx: 0.44, drift: 0.04 }), 0.2),
  () => still(DT, 26.95, T.tickle, A({ yaw: 0.14, sx: 0.5, push: 0.95, drift: -0.05 })),
  () => still(DT, T.tickle, T.big, A({ yaw: -0.18, sx: 0.48, push: 0.92, drift: 0.04 })),
  () => still(HP, T.big, 33.5, A({ yaw: 0.16, sx: 0.5, push: 0.95, drift: 0.05 })),
  () => still([HP[0] + 0.55, 0, HP[2]], 33.5, T.ask, A({ yaw: -0.2, sx: 0.5, push: 0.97, drift: 0.04, h: 3.6 })),
  () => [{ ...framePose(HP, A({ yaw: -0.22, sx: 0.44 }), 0), t: T.ask }, { ...framePose(HP, A({ yaw: -0.22, sx: 0.44, frac: (FULL + CLOSE) / 2 }), 0), t: 37.9 }, ...span(LEN - 1.3, LEN + 0.05, (t) => hookKey(t - LEN), 6)],
];
export const IMPACTS: [number, number][] = [[T.achoo, 0.015], [T.land, 0.01], [T.splash, 0.02], [T.boing, 0.012], [T.achoo2, 0.015]];

/* the blade the raindrop hangs from (tip over the leaf) */
const DROP_BLADE = makeBlades(91, 1, 43.1, 43.1, -1.0, -1.0, DROP_TIP + 0.2, DROP_TIP + 0.2).map((b) => ({ ...b, bend: -2.35, ry: 0, w: 0.9 }));

/* ================= one scene renderer for every shot ================= */
export const Shot: React.FC<Ctx & { i: number }> = ({ t, i }) => {
  const h = heroAt(t), bug = bugAt(t), big = BIG(t), tau = t >= T.big ? t - LEN : t;
  const keys = CAMS[i](t); const k0 = keys[0];
  const focus = Math.hypot(k0.pos[0] - h.p[0], k0.pos[2] - h.p[2]);
  const hero = <Stickman p={h.p} t={t} h={h.h ?? H} action={h.action} t0={h.t0} face={h.face} dir={h.dir ?? 1} dur={h.dur} gest={h.gest} rig={h.rig ?? {}} move={false} groundY={h.p[1]} lips={LIPS} />;
  const ladybug = bug.show ? <Animal kind="ladybug" p={bug.p} h={bug.h} t={t} pose={{ flip: bug.flip, wing: bug.wing, ruffle: 0, walk: bug.walk, claw: bug.claw, look: bug.look }} /> : null;
  if (big) { const s = seedAt(tau);
    return (<BigGarden t={t} bgT={tau}>
      <Cam t={t} keys={keys} impacts={IMPACTS} />
      {hero}{ladybug}
      {s.show ? <FloatSeed p={s.p} s={0.42} rot={s.rot} /> : null}
      {t > T.shrink - 0.05 && t < T.tiny ? <PuffRing c={[HP[0], 0.4, HP[2] + 0.3]} t={t} t0={T.shrink - 0.05} n={8} r={1.6} size={0.18} color="#ffffff" up={0.4} /> : null}
      {t > T.big - 0.02 && t < T.big + 1.4 ? <PuffRing c={[HP[0], 0.4, HP[2] + 0.3]} t={t} t0={T.big - 0.02} n={10} r={2.1} size={0.18} color="#ffffff" up={0.5} /> : null}
      <DepthPass focus={focus} blur={2.0} />
    </BigGarden>); }
  const drop = dropAt(t), ts = tickleSeed(t), squash = t > T.boing ? Math.exp(-(t - T.boing) * 3) * Math.max(0, Math.sin((t - T.boing) * 13)) : 0;
  return (<MiniGarden t={t} wet={t > T.splash ? 1 - seg(t, 27, 29) : 0} squash={squash} lost={t > T.boing ? 0.06 : 0}>
    <Cam t={t} keys={keys} impacts={IMPACTS} />
    <GrassBlades list={DROP_BLADE} t={t} />
    <Animal kind="snail" p={[MG.snail[0] + 0.9, 0, MG.snail[2] + 0.8]} h={2.6} t={t} />
    {hero}{ladybug}
    {drop ? <Raindrop p={drop.p} r={drop.r} t={t} o={drop.o} /> : null}
    {t > T.splash && t < T.splash + 1.4 ? <Splash c={[DROP_X, leafY(DROP_X) + 0.1, 0]} t={t} t0={T.splash} n={22} color="#9fe0ff" s={1.5} /> : null}
    <DustImpact c={[MG.land[0], 0, MG.land[2]]} t={t} t0={T.land} r={0.6} />
    <DustImpact c={[MG.bug[0], 0, MG.bug[2]]} t={t} t0={T.bugLand} r={0.9} />
    {t > T.tiny - 0.02 && t < T.tiny + 0.6 ? <PuffRing c={[0, 1.2, 0.6]} t={t} t0={T.tiny - 0.3} n={8} r={1.5} size={0.25} color="#ffffff" up={0.5} /> : null}
    {t > T.pop2 - 0.05 && t < T.big ? <PuffRing c={[DT[0], DT[1] + 1.3, DT[2] + 0.3]} t={t} t0={T.pop2 - 0.05} n={8} r={1.2} size={0.25} color="#ffffff" up={0.4} /> : null}
    {t > T.boing && t < T.tickle + 0.6 ? BURST.map((b, j) => { const u = t - T.boing; return <FloatSeed key={j} p={[DT[0] + Math.cos(b.a + 1.57) * 0.9 + Math.sin(b.a) * b.v * u * 1.2, DT[1] - 0.6 + b.v * u * 0.9 + Math.sin(u * 2 + j) * 0.2, DT[2] - 0.5 + (j % 3) * 0.4]} s={b.s} rot={Math.sin(u * 1.5 + j) * 0.4} />; }) : null}
    {ts ? <FloatSeed p={ts} s={1.3} rot={Math.sin(t * 2) * 0.3} /> : null}
    <DepthPass focus={focus} blur={2.0} />
  </MiniGarden>);
};
void CLOSE; void SY_B;
