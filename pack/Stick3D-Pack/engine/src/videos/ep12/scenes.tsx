// EP12 "Stickman's backpack woke up STARVING" — v20 kit. Size A (58 %) in every normal shot, size B (68 %) for the hook + ending (bedroom, same framing -> loops).
// New reusable pieces: kit/backpack.tsx (LivingBackpack, Prop homework/crayons/clock/cake/cookie, Crumbs, MusicNotes, BedroomDoor, BakeryFront, COOKIE_PATH).
import React from "react";
import { Cam, Key } from "../../style/extra";
import { V3 } from "../../style/kit";
import { Stickman, LipCue } from "../../kit/character";
import { Face, RUN_STRIDE } from "../../style/stickman";
import { World, HomeSet, HOME } from "../../kit/world";
import { Street } from "../../kit/sets2";
import { DrawStrokes, MagicSparkles } from "../../kit/fx";
import { PuffRing } from "../../kit/puff";
import { DepthPass } from "../../kit/envlib";
import { frameShot, framePose, CLOSE, SY_A, SY_B, FULL, FrameOpts } from "../../kit/frame";
import { GKey, WWord } from "../../kit/gesture";
import { act, AKey } from "../../kit/acting";
import { LivingBackpack, BagPose, Prop, PropKind, Crumbs, MusicNotes, BedroomDoor, DOOR, BakeryFront, BAKERY, COOKIE_PATH } from "../../kit/backpack";
import { drawPencil } from "../../style/props2d";
import MOUTH from "../../../public/ep12/mouth.json";
import WORDS from "../../../public/ep12/words.json";

export type Ctx = { t: number; f: number };
const LIPS = (MOUTH as { mouthCues: LipCue[] }).mouthCues;
const W = WORDS as WWord[];
export const seg = (t: number, a: number, b: number) => Math.max(0, Math.min(1, (t - a) / (b - a)));
const sm = (x: number) => { const u = Math.max(0, Math.min(1, x)); return u * u * (3 - 2 * u); };
const eo = (x: number) => 1 - (1 - Math.max(0, Math.min(1, x))) ** 3;
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const lerp3 = (a: V3, b: V3, k: number): V3 => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
const faceAt = (t: number, list: [number, Face][]) => { let f = list[0][1]; for (const [a, x] of list) if (t >= a) f = x; return f; };
const shot = (t: number, list: [number, Key[]][]) => { let k = list[0][1]; for (const [t0, ks] of list) if (t >= t0) k = ks; return k; };
const wt = (w: string, from = 0) => (W.find((x) => x.start >= from && x.word.toLowerCase().replace(/[^a-z'-]/g, "") === w)?.start ?? from);
const eyes = (t: number, keys: [number, number, number][]) => { let i = 0; while (i < keys.length - 1 && t >= keys[i + 1][0]) i++; const [, x0, y0] = keys[i], nx = keys[i + 1];
  if (!nx || t < nx[0] - 0.18) return { lookX: x0, lookY: y0 }; const k = sm((t - (nx[0] - 0.18)) / 0.18); return { lookX: x0 + (nx[1] - x0) * k, lookY: y0 + (nx[2] - y0) * k }; };
const A = (o: FrameOpts): FrameOpts => ({ frac: FULL, sy: SY_A, fov: 42, camY: 1.0, ...o });
const B = (o: FrameOpts): FrameOpts => ({ frac: CLOSE, sy: SY_B, fov: 42, camY: 1.05, ...o });
const HH = 3, U = HH / 1000; // hero height, metres per rig unit
const SELFHUG = { ikL: [80, 640] as [number, number], ikKL: 1, ikR: [-80, 620] as [number, number], ikKR: 1, handL: "open" as const, handR: "open" as const };
const pencilR = (c: CanvasRenderingContext2D, o: { gloveR: [number, number] }, _W: number, H: number) => { const a = 0.5, L = H * 0.13; drawPencil(c, o.gloveR[0] - Math.sin(a) * L * 0.42, o.gloveR[1] + Math.cos(a) * L * 0.42, L, a, 0.6); };
/* a hop from a to b between t0..t1 (arc height hh) + squash at take-off / landing */
const hop = (t: number, a: V3, b: V3, t0: number, t1: number, hh = 0.7): { p: V3; sq: number; legs: number } => {
  const u = seg(t, t0, t1), e = sm(u), p = lerp3(a, b, e); p[1] += Math.sin(u * Math.PI) * hh;
  const pre = t < t0 ? -0.18 * sm(seg(t, t0 - 0.12, t0)) : 0, land = t >= t1 ? -0.2 * Math.exp(-(t - t1) * 14) * Math.cos((t - t1) * 30) : 0;
  return { p, sq: u > 0 && u < 1 ? 0.18 * Math.sin(u * Math.PI) : pre + land, legs: u > 0 && u < 1 ? -0.8 : 0 };
};
/* chewing: mouth open/close rhythm for `dur` seconds after t0 */
const chew = (t: number, t0: number, dur = 0.8) => (t < t0 || t > t0 + dur ? 0 : 0.35 * Math.abs(Math.sin((t - t0) * 16)) * (1 - (t - t0) / dur));

/* ================= BEDROOM (S1 hook, S2 desk, S3 door, S9 ending = hook framing) ================= */
export const PH: V3 = [HOME.hero[0], 0, HOME.hero[2] + 1.9]; // in front of the desk (same spot as EP11)
export const HOOK_O: FrameOpts = B({ yaw: -0.2, sx: 0.5, push: 0.95, drift: 0.04 });
export const HOOK_LOOK = { lookX: 0.25, lookY: -0.15 };
const DESK_Y = 1.48;
const BAGD: V3 = [-1.85, DESK_Y, -2.05]; // the backpack on the desk, left of him
const BAG_H = 1.45;
const BACK: V3 = [PH[0] - 0.2, 1.2, PH[2] - 0.35]; // where the bag sits on his back
const POPOFF = 1.95, STARVE = wt("starving", 2.4);

/* S1 0–3.7 hook: his backpack opens its eyes and growls, pops off his back onto the desk, mouth wide: STARVING */
const G1: GKey[] = [{ t: 0.95, g: "whoa", in: 0.14, hold: 0.4 }, { t: 2.1, g: "palmUp2", in: 0.2, hold: 0.5 }, { t: 2.9, g: "point", in: 0.2, hold: 0.6 }];
const ACT1: AKey[] = [{ t: 0, turn: 0.1 }, { t: 0.9, turn: -0.5, tilt: -8, dip: 0.3, d: 0.2 }, { t: POPOFF, back: 0.1, lean: 8, dip: 0.6, lift: 0.6, turn: -0.6, d: 0.12 }, { t: 2.4, back: 0.1, turn: -0.8, tilt: 10, d: 0.3 }, { t: 3.2, back: 0.1, turn: -0.6, lean: -5, d: 0.3 }];
export const S1 = ({ t }: Ctx) => { const a = act(t, ACT1), off = t >= POPOFF, h = hop(t, BACK, BAGD, POPOFF, POPOFF + 0.45, 0.9);
  const growl = sm(seg(t, 0.85, 1.15)), wide = sm(seg(t, STARVE - 0.15, STARVE + 0.1));
  const bag: BagPose = { mouth: off ? 0.15 + 0.8 * wide + chew(t, 3.2, 0.5) : 0, tongue: wide * (0.7 + 0.3 * Math.sin(t * 9)), mood: "hungry", lookX: t < STARVE ? 0.6 : 0.2, lookY: -0.2, squash: h.sq + wide * 0.08 * Math.sin(t * 12), legs: h.legs, tilt: t < POPOFF + 0.45 ? 15 * Math.sin(seg(t, POPOFF, POPOFF + 0.45) * Math.PI) : 4 * Math.sin(t * 7) };
  return (<HomeSet t={t} preset="morning">
    <Cam t={t} keys={[...frameShot(PH, 0, 0.35, HOOK_O), ...frameShot(PH, 1.3, 3.75, { ...HOOK_O, frac: 0.55, sx: 0.6, push: 0.98 })]} impacts={[[POPOFF + 0.45, 0.012]]} />
    <Stickman p={PH} t={t} action="idle" lips={LIPS} gest={G1} face={faceAt(t, [[0, "smile"], [0.95, "surprised"], [POPOFF, "scared"], [2.6, "surprised"]])}
      rig={{ ...a.rig, backpack: !off, bagFace: off ? 0 : growl, ...eyes(t, [[0, HOOK_LOOK.lookX, HOOK_LOOK.lookY], [0.95, -0.9, 0.1], [POPOFF + 0.3, -0.9, 0.3]]), ...(t < 0.75 ? { blink: 0 } : {}) }} />
    {off ? <LivingBackpack p={h.p} t={t} h={BAG_H} pose={bag} groundY={DESK_Y} shadow={t > POPOFF + 0.3} /> : null}
    <PuffRing c={[BACK[0], BACK[1] + 0.5, BACK[2] - 0.3]} t={t} t0={POPOFF} n={7} r={0.5} size={0.16} color="#ffffff" life={0.55} up={0.3} />
    <DepthPass focus={6.6} blur={2.0} />
  </HomeSet>); };

/* S2 3.7–8.1: it gobbles the homework, the crayons and the alarm clock off the desk */
const EAT: [PropKind, V3, number, number][] = [ // kind, desk spot, chomp time, size
  ["homework", [-1.2, DESK_Y + 0.45, -2.0], 4.62, 0.85], ["crayons", [-1.25, DESK_Y + 0.32, -2.75], 5.66, 0.62], ["clock", [-2.55, DESK_Y + 0.36, -2.6], 7.0, 0.68]];
const mouthAt = (p: V3): V3 => [p[0], p[1] + BAG_H * 0.5, p[2] + 0.08];
const flying = (t: number, i: number, bag: V3): { p: V3; s: number; rot: number } | null => {
  const [, from, tc] = EAT[i], t0 = tc - 0.35; if (t >= tc + 0.02) return null; if (t < t0) return { p: from, s: 1, rot: 0 };
  const u = seg(t, t0, tc), m = mouthAt(bag); const p = lerp3(from, m, eo(u)); p[1] += Math.sin(u * Math.PI) * 0.5; return { p, s: 1 - 0.55 * u, rot: u * 300 * (i % 2 ? -1 : 1) };
};
const O2A = A({ frac: 0.5, yaw: 0.25, sx: 0.66, camY: 1.35, drift: 0.04 });
const O2B = A({ frac: 0.5, yaw: -0.35, sx: 0.64, camY: 1.5, push: 0.96, drift: -0.03 });
const G2: GKey[] = [{ t: 4.4, g: "whoa", in: 0.14, hold: 0.4 }, { t: 5.5, g: "reach", in: 0.2, hold: 0.5 }, { t: 6.6, g: "palmUp2", in: 0.2, hold: 0.4 }, { t: 7.2, g: "whoa", in: 0.14, hold: 0.5 }];
const ACT2: AKey[] = [{ t: 3.7, turn: -0.7, tilt: 6, back: 0.1 }, { t: 4.65, turn: -0.8, lean: -8, dip: 0.5, back: 0.1, d: 0.12 }, { t: 5.4, turn: -0.6, lean: 8, lift: -0.5, back: 0.1, d: 0.2 }, { t: 6.7, turn: -0.7, tilt: -8, back: 0.1, d: 0.2 }, { t: 7.05, turn: -0.8, lean: -10, dip: 0.6, back: 0.1, d: 0.12 }];
export const S2 = ({ t }: Ctx) => { const a = act(t, ACT2, { seed: 2 }), bag = BAGD;
  const mo = Math.max(...EAT.map(([, , tc]) => (t > tc - 0.4 && t < tc ? sm(seg(t, tc - 0.4, tc - 0.15)) * 0.9 : 0)), ...EAT.map(([, , tc]) => chew(t, tc, 0.7)));
  const full = Math.min(1, EAT.filter(([, , tc]) => t > tc + 0.3).length * 0.18), gulp = EAT.some(([, , tc]) => t > tc + 0.3 && t < tc + 0.5);
  return (<HomeSet t={t} preset="morning">
    <Cam t={t} keys={t < 5.95 ? frameShot(PH, 3.7, 5.95, O2A) : frameShot(PH, 5.95, 8.15, O2B)} impacts={EAT.map(([, , tc]) => [tc, 0.008] as [number, number])} />
    {EAT.map(([kind], i) => { const f = flying(t, i, bag); return f ? <Prop key={i} kind={kind} p={f.p} h={EAT[i][3] * f.s} t={t} rot={f.rot} /> : null; })}
    <LivingBackpack p={[bag[0], bag[1], bag[2]]} t={t} h={BAG_H} groundY={DESK_Y} pose={{ mouth: mo, mood: "hungry", lookX: 0.6 * Math.sin(t * 2), lookY: 0.2, full, squash: gulp ? 0.12 : 0.03 * Math.sin(t * 9), tilt: 5 * Math.sin(t * 6) }} />
    <Stickman p={PH} t={t} action="idle" lips={LIPS} gest={G2} face={faceAt(t, [[3.7, "surprised"], [4.65, "scared"], [5.5, "worried"], [7.0, "scared"]])}
      rig={{ ...a.rig, backpack: false, ...eyes(t, [[3.7, -0.9, 0.2], [5.0, -0.7, 0.4], [6.5, -0.9, 0.3]]) }} />
    <DepthPass focus={6.4} blur={1.8} />
  </HomeSet>); };

/* S3 8.1–11.5: it sniffs the air (scent from the open door), hops down and out of the door; he runs after it */
const SNIFF = 8.55, HOP0 = 9.65, DOOR_OPEN = 10.0, OUT = 10.95;
const FLOOR1: V3 = [-3.0, 0, -2.2], DOORP: V3 = [DOOR.p[0] + 0.5, 0, DOOR.p[2]], GONE: V3 = [DOOR.p[0] - 1.2, 0, DOOR.p[2]];
const bag3 = (t: number) => t < HOP0 ? hop(t, BAGD, BAGD, 0, 1) : t < 10.15 ? hop(t, BAGD, FLOOR1, HOP0, 10.15, 0.6) : t < 10.6 ? hop(t, FLOOR1, DOORP, 10.15, 10.6, 0.5) : hop(t, DOORP, GONE, 10.6, OUT, 0.4);
const O3 = A({ frac: 0.44, yaw: 0.75, sx: 0.7, camY: 1.6, push: 0.97, drift: 0.05 });
const G3: GKey[] = [{ t: 9.7, g: "whoa", in: 0.14, hold: 0.4 }, { t: 10.5, g: "reach", in: 0.2, hold: 0.7 }];
const ACT3: AKey[] = [{ t: 8.1, turn: -0.6, tilt: 8, back: 0.1 }, { t: 9.0, turn: -0.4, tilt: -8, back: 0.1, d: 0.3 }, { t: 9.7, turn: -0.9, lean: -8, dip: 0.4, back: 0.1, d: 0.15 }, { t: 10.5, turn: -1, lean: 12, lift: -0.7, back: 0.1, d: 0.2 }];
export const S3 = ({ t }: Ctx) => { const a = act(t, ACT3, { seed: 3 }), b = bag3(t), sniff = t > SNIFF && t < 9.4;
  const scent = sm(seg(t, 8.15, 8.6)) * (1 - sm(seg(t, 9.4, 9.8)));
  return (<HomeSet t={t} preset="morning">
    <BedroomDoor open={sm(seg(t, 8.15, 8.5)) * 0.35 + sm(seg(t, DOOR_OPEN - 0.1, DOOR_OPEN + 0.2)) * 0.65 - sm(seg(t, OUT + 0.05, OUT + 0.25))} />
    <Cam t={t} keys={frameShot(PH, 8.1, 11.55, O3)} />
    {scent > 0.02 ? <MagicSparkles t={t} c={[lerp(DOOR.p[0] + 0.6, BAGD[0], (t * 0.6) % 1), 2.2, lerp(DOOR.p[2], BAGD[2], (t * 0.6) % 1)]} area={[1.6, 0.6, 0.4]} n={10} color="#ffcf8a" size={0.12 * scent} /> : null}
    {t < OUT ? <LivingBackpack p={b.p} t={t} h={BAG_H} groundY={b.p[1] > 1.2 && t < 10.0 ? DESK_Y : 0} pose={{ mouth: sniff ? 0.08 : 0.25, mood: t < HOP0 ? "happy" : "sneaky", lookX: -1, lookY: -0.3, full: 0.5, squash: b.sq + (sniff ? 0.06 * Math.sin(t * 28) : 0), legs: b.legs, tilt: sniff ? -10 + 6 * Math.sin(t * 14) : -6, flip: true }} /> : null}
    <Stickman p={PH} t={t} action="idle" lips={LIPS} gest={G3} face={faceAt(t, [[8.1, "confused"], [9.0, "think"], [9.7, "surprised"], [10.5, "determined"]])}
      rig={{ ...a.rig, backpack: false, ...eyes(t, [[8.1, -0.8, 0.3], [9.7, -1, 0.6], [10.5, -1, 0.2]]) }} />
    <DepthPass focus={7.0} blur={1.8} />
  </HomeSet>); };

/* ================= STREET (S4–S8): the bakery front on the north sidewalk ================= */
const SW = 0.24; // sidewalk top
const StreetSet: React.FC<{ t: number; children?: React.ReactNode }> = ({ t, children }) => (
  <World preset="day" t={t}><Street t={t} mood="day" noPizza /><BakeryFront t={t} />{children}</World>);

/* S4 11.5–14.9: side tracking run along the sidewalk; the backpack hops ahead and stops at the bakery */
const RUN0 = 11.6, RUN1 = 14.55, ZR = -3.95, XB = 0.7;
const RV = 2.6 * RUN_STRIDE * U;
const X0 = XB - RV * (RUN1 - RUN0 - 0.18);
const runX = (t: number) => X0 + RV * Math.max(0, Math.min(t, RUN1) - RUN0 - 0.18);
export const PB: V3 = [XB, SW, ZR]; // where he stops (in front of the bakery)
const BAG_S: V3 = [XB - 1.35, SW, ZR - 0.5]; // the bag's spot by the cake table
const bagRunX = (t: number) => Math.min(runX(t) + 1.3, BAG_S[0]);
const O4A = A({ yaw: 0.3, sx: 0.4, camY: 1.1 });
const O4B = A({ yaw: -0.35, sx: 0.56, camY: 0.9 });
const track = (t0: number, t1: number, o: FrameOpts): Key[] => { const ks: Key[] = []; for (let t = t0; t <= t1 + 1e-6; t += 1 / 30) ks.push({ ...framePose([runX(t), SW, ZR], o, 0), t }); return ks; };
const K4: [number, Key[]][] = [[11.5, track(11.5, 13.2, O4A)], [13.2, track(13.2, 14.95, O4B)]];
export const S4 = ({ t }: Ctx) => { const x = runX(t), stop = t >= RUN1, bx = bagRunX(t), ph = (t * 3.2) % 1, arrived = bx >= BAG_S[0] - 1e-3;
  const by = arrived ? 0 : Math.sin(ph * Math.PI) * 0.45, bz = lerp(ZR + 0.3, BAG_S[2], sm(seg(t, 13.6, 14.4)));
  return (<StreetSet t={t}>
    <Cam t={t} keys={shot(t, K4)} />
    <LivingBackpack p={[bx, SW + by, bz]} t={t} h={BAG_H} groundY={SW} pose={{ mouth: 0.25 + (arrived ? 0.3 * sm(seg(t, 14.4, 14.8)) : 0), tongue: arrived ? 0.6 : 0.3, mood: "hungry", lookX: arrived ? -0.4 : 1, lookY: arrived ? -0.6 : 0, full: 0.5, squash: arrived ? 0 : 0.18 * Math.sin(ph * Math.PI) - 0.12 * (ph < 0.12 ? 1 : 0), legs: arrived ? 0 : -0.8, tilt: arrived ? 0 : -10 }} />
    <Stickman p={[x, SW, ZR]} t={t} action={t < RUN0 ? "idle" : stop ? "land" : "run"} t0={stop ? RUN1 : RUN0} dir={1} move={false} lips={LIPS} groundY={SW}
      face={faceAt(t, [[11.5, "determined"], [13.6, "surprised"]])} rig={{ backpack: false, ...(t > 13.6 && !stop ? { lookX: 0.4, lookY: 0.4 } : {}) }} />
    <DepthPass focus={7.0} blur={2.0} />
  </StreetSet>); };

/* S5 14.9–18.6: the cake on the display table; the bag opens WIDE and swallows it whole */
const CAKE0: V3 = [BAKERY.table[0] + BAKERY.p[0], BAKERY.table[1] + 0.48, BAKERY.table[2]];
const WIDE = wt("wide", 15.5), SWAL = 16.95;
const bag5: V3 = [BAG_S[0], SW, BAG_S[2] + 0.25];
const O5A = A({ yaw: 0.25, sx: 0.66, camY: 1.2, drift: 0.04 });
const O5B = A({ frac: 0.5, yaw: -0.3, sx: 0.7, camY: 1.3, push: 0.96, drift: -0.03 });
const G5: GKey[] = [{ t: 15.3, g: "point", in: 0.2, hold: 0.5 }, { t: 16.4, g: "whoa", in: 0.14, hold: 0.5 }, { t: 17.7, g: "palmUp2", in: 0.2, hold: 0.6 }];
const ACT5: AKey[] = [{ t: 14.9, turn: -0.7, tilt: 6 }, { t: 15.9, turn: -0.8, lean: -6, dip: 0.3, d: 0.2 }, { t: SWAL, turn: -0.9, lean: -12, dip: 0.6, lift: -0.5, d: 0.12 }, { t: 17.8, turn: -0.6, tilt: -10, d: 0.3 }];
export const S5 = ({ t }: Ctx) => { const a = act(t, ACT5, { seed: 5 }), wide = sm(seg(t, WIDE - 0.3, WIDE + 0.2)), into = sm(seg(t, SWAL - 0.45, SWAL));
  const mo = t < SWAL ? 0.15 + 0.85 * wide : chew(t, SWAL, 0.4) + 0.05, full = t > SWAL ? 1 : 0.5, gulpK = t > 17.15 && t < 17.5 ? Math.sin(seg(t, 17.15, 17.5) * Math.PI) : 0;
  const m = mouthAt(bag5); m[1] += 0.25; const cake = lerp3(CAKE0, m, into); cake[1] += Math.sin(into * Math.PI) * 0.4;
  return (<StreetSet t={t}>
    <Cam t={t} keys={t < 16.2 ? frameShot(PB, 14.9, 16.2, O5A) : frameShot(PB, 16.2, 18.65, O5B)} impacts={[[SWAL, 0.012]]} />
    {t < SWAL ? <Prop kind="cake" p={cake} h={1.05 * (1 - 0.45 * into)} t={t} rot={into * -25} /> : null}
    <LivingBackpack p={bag5} t={t} h={BAG_H * (1 + 0.15 * wide * (t < SWAL ? 1 : 0))} groundY={SW} pose={{ mouth: mo, tongue: t < SWAL ? 0.5 * wide : 0, mood: t > 17.4 ? "full" : "hungry", lookX: -0.3, lookY: -0.6, full, squash: 0.35 * wide * (t < SWAL ? 1 : 0) + 0.15 * gulpK, tilt: t < SWAL ? -8 * wide : 3 * Math.sin(t * 5) }} />
    <Stickman p={PB} t={t} action="idle" lips={LIPS} gest={G5} groundY={SW} face={faceAt(t, [[14.9, "worried"], [16.0, "surprised"], [SWAL, "scared"], [17.8, "confused"]])}
      rig={{ ...a.rig, backpack: false, ...eyes(t, [[14.9, -0.8, 0.2], [16.4, -0.9, 0.4], [17.8, -0.6, 0.1]]) }} />
    <DepthPass focus={6.6} blur={1.8} />
  </StreetSet>); };

/* S6 18.6–22.6: he draws a giant cookie with the magic pencil; it turns real (stands on its edge) */
const DRAW0 = 19.75, DRAW1 = 21.6, COOK_R = 0.82;
const COOKIE: V3 = [PB[0] + 1.55, SW + COOK_R + 0.02, PB[2] - 0.5];
const O6A = A({ yaw: 0.2, sx: 0.36, camY: 1.15, drift: 0.04 });
const O6B = A({ frac: 0.5, yaw: -0.25, sx: 0.34, camY: 1.2, push: 0.96, drift: 0.03 });
const ACT6: AKey[] = [{ t: 18.6, turn: 0.5, tilt: -6 }, { t: 19.4, turn: 0.7, tilt: 8, lean: 4, d: 0.3 }, { t: DRAW1 + 0.1, turn: 0.3, lean: -6, dip: 0.3, d: 0.2 }];
export const S6 = ({ t }: Ctx) => { const drawing = t >= DRAW0 - 0.2 && t < DRAW1 + 0.1, prog = sm(seg(t, DRAW0, DRAW1)), real = t >= DRAW1, a = act(t, ACT6, { seed: 6 });
  const pop = real ? 1 + 0.12 * Math.exp(-(t - DRAW1) * 7) * Math.sin((t - DRAW1) * 26) : 1;
  return (<StreetSet t={t}>
    <Cam t={t} keys={t < 20.4 ? frameShot(PB, 18.6, 20.4, O6A) : frameShot(PB, 20.4, 22.65, O6B)} />
    {!real ? <DrawStrokes p={COOKIE} s={[COOK_R * 2, COOK_R * 2]} paths={COOKIE_PATH} prog={prog} t={t} style="magic" face /> : <Prop kind="cookie" p={COOKIE} h={COOK_R * 2 * pop} t={t} shadow groundY={SW} />}
    {real && t < DRAW1 + 0.7 ? <MagicSparkles t={t} c={COOKIE} area={[1.2, 1.2, 0.3]} n={14} /> : null}
    <PuffRing c={[COOKIE[0], COOKIE[1], COOKIE[2] - 0.3]} t={t} t0={DRAW1} n={7} r={0.6} size={0.2} color="#fff0d0" life={0.7} up={0.3} />
    <LivingBackpack p={[bag5[0] - 0.3, SW, bag5[2]]} t={t} h={BAG_H} groundY={SW} pose={{ mouth: 0.1 + 0.6 * sm(seg(t, DRAW1, DRAW1 + 0.4)), tongue: real ? 0.8 : 0, mood: real ? "hungry" : "full", lookX: 1, lookY: 0, full: 1 - 0.4 * seg(t, 18.6, 20), squash: real ? 0.06 * Math.sin(t * 14) : 0.02 * Math.sin(t * 3) }} />
    <Stickman p={PB} t={t} action={drawing ? "drawInAir" : "idle"} t0={DRAW0 - 0.2} lips={LIPS} groundY={SW} extra={t < DRAW1 + 0.4 ? pencilR : undefined}
      face={faceAt(t, [[18.6, "think"], [19.3, "grin"], [DRAW1, "laugh"]])}
      rig={{ ...a.rig, backpack: false, ...(drawing ? { ikR: [330 + Math.sin(t * 6) * 60, 620 + prog * 300 + Math.cos(t * 6) * 60], ikKR: 1, handR: "hold" as const, lookX: 0.8, lookY: -0.2 } : eyes(t, [[18.6, 0.6, 0.1], [21.8, 0.8, 0.2]])) }} />
    <DepthPass focus={6.6} blur={1.8} />
  </StreetSet>); };

/* S7 22.6–25.7: one bite — CRUNCH! crumbs burst */
const LEAP0 = 23.45, BITE = 24.05, CRUNCH = wt("crunch", 24.5);
const BAG7_0: V3 = [bag5[0] - 0.3, SW, bag5[2]], BAG7_1: V3 = [COOKIE[0] - 0.85, SW, COOKIE[2] + 0.35];
const O7A = A({ frac: 0.5, yaw: 0.0, sx: 0.36, camY: 1.0, drift: 0.04 });
const O7B = B({ frac: 0.6, yaw: 0.3, sx: 0.36, camY: 1.1, push: 0.95, drift: -0.03 });
const G7: GKey[] = [{ t: 23.0, g: "point", in: 0.2, hold: 0.5 }, { t: BITE, g: "whoa", in: 0.12, hold: 0.6 }];
const ACT7: AKey[] = [{ t: 22.6, turn: 0.6, tilt: 8 }, { t: BITE + 0.05, turn: 0.8, lean: -10, dip: 0.6, back: 0.1, d: 0.12 }, { t: CRUNCH, turn: 0.5, tilt: -10, back: 0.1, d: 0.15 }];
export const S7 = ({ t }: Ctx) => { const a = act(t, ACT7, { seed: 7 }), h = hop(t, BAG7_0, BAG7_1, LEAP0, BITE - 0.15, 0.6), into = sm(seg(t, BITE - 0.15, BITE + 0.1));
  const crunchK = t > CRUNCH ? Math.exp(-(t - CRUNCH) * 4) : 0;
  const mo = t < BITE - 0.15 ? 0.3 + 0.6 * sm(seg(t, 23.2, LEAP0)) : t < BITE + 0.1 ? 1 : chew(t, BITE + 0.1, 1.2) + 0.25 * crunchK;
  const mm = mouthAt(BAG7_1); mm[1] += 0.3;
  return (<StreetSet t={t}>
    <Cam t={t} keys={t < BITE - 0.1 ? frameShot(PB, 22.6, BITE - 0.1, O7A) : frameShot(PB, BITE - 0.1, 25.75, O7B)} impacts={[[CRUNCH, 0.03]]} />
    {t < BITE + 0.1 ? <Prop kind="cookie" p={lerp3(COOKIE, mm, into)} h={COOK_R * 2 * (1 - 0.6 * into)} t={t} shadow={into < 0.2} groundY={SW} /> : null}
    <LivingBackpack p={h.p} t={t} h={BAG_H * (1 + 0.12 * into * (1 - seg(t, BITE + 0.3, BITE + 0.8)))} groundY={SW} pose={{ mouth: mo, mood: t > CRUNCH + 0.5 ? "full" : "hungry", lookX: 1, lookY: 0, full: t > BITE ? 1 : 0.6, squash: h.sq + 0.12 * crunchK * Math.sin(t * 40), legs: h.legs, tilt: 6 * crunchK * Math.sin(t * 30), flip: true }} />
    <Crumbs c={[BAG7_1[0], SW + BAG_H * 0.55, BAG7_1[2] + 0.1]} t={t} t0={CRUNCH} n={30} speed={3.0} />
    <Stickman p={PB} t={t} action="idle" lips={LIPS} gest={G7} groundY={SW} face={faceAt(t, [[22.6, "grin"], [BITE, "surprised"], [CRUNCH, "scared"], [25.0, "worried"]])}
      rig={{ ...a.rig, backpack: false, ...eyes(t, [[22.6, 0.8, 0.2], [BITE, 0.9, 0.4]]) }} />
    <DepthPass focus={6.6} blur={1.8} />
  </StreetSet>); };

/* S8 25.7–30.1: BURP — the homework, the crayons and the clock pop back out into his arms; the bag hops onto his back */
const BURP = 26.15, OUTS = [27.4, 28.25, 29.1], ONBACK = 29.6;
const BAG8: V3 = [BAG7_1[0] - 0.15, SW, BAG7_1[2]];
const ARMS: V3[] = [[PB[0] - 0.05, SW + 1.25, PB[2] + 0.35], [PB[0] + 0.14, SW + 1.42, PB[2] + 0.38], [PB[0] - 0.16, SW + 1.62, PB[2] + 0.42]];
const KINDS: PropKind[] = ["homework", "crayons", "clock"];
const O8A = A({ yaw: -0.15, sx: 0.36, camY: 1.1, drift: 0.04 });
const O8B = A({ yaw: 0.25, sx: 0.44, camY: 1.15, push: 0.96, drift: -0.03 });
const ACT8: AKey[] = [{ t: 25.7, turn: 0.6, tilt: -6 }, { t: BURP + 0.05, turn: 0.7, lean: -12, dip: 0.6, back: 0.1, d: 0.12 }, { t: 27.4, turn: 0.4, lean: 6, back: 0.1, d: 0.2 }, { t: 28.3, turn: 0.2, tilt: 8, back: 0.1, d: 0.2 }, { t: 29.2, turn: 0, tilt: -6, dip: 0.3, back: 0.1, d: 0.2 }];
export const S8 = ({ t }: Ctx) => { const a = act(t, ACT8, { seed: 8 }), burpK = sm(seg(t, BURP - 0.1, BURP + 0.1)) * (1 - sm(seg(t, BURP + 0.8, BURP + 1.1)));
  const jumping = t >= ONBACK, hb = hop(t, BAG8, [PB[0] - 0.15, SW + 1.4, PB[2] - 0.4], ONBACK, ONBACK + 0.35, 0.8);
  const spit = Math.max(...OUTS.map((to) => (t > to - 0.15 && t < to + 0.12 ? 0.7 : 0)));
  const holding = t > OUTS[0] + 0.3;
  return (<StreetSet t={t}>
    <Cam t={t} keys={t < 27.2 ? frameShot(PB, 25.7, 27.2, O8A) : frameShot(PB, 27.2, 30.15, O8B)} impacts={[[BURP, 0.015]]} />
    <PuffRing c={[BAG8[0] + 0.1, SW + BAG_H * 0.7, BAG8[2] + 0.2]} t={t} t0={BURP + 0.05} n={8} r={0.6} size={0.2} color="#d9f2c6" life={0.9} up={0.5} />
    {KINDS.map((k, i) => { const to = OUTS[i]; if (t < to) return null; const u = sm(seg(t, to, to + 0.4)), from = mouthAt(BAG8); const p = lerp3(from, ARMS[i], u); p[1] += Math.sin(u * Math.PI) * 0.9;
      return <Prop key={k} kind={k} p={p} h={[0.6, 0.42, 0.4][i] * lerp(0.5, 1, u)} t={t} rot={(1 - u) * 360 * (i % 2 ? 1 : -1)} />; })}
    {t < ONBACK + 0.35 ? <LivingBackpack p={jumping ? hb.p : BAG8} t={t} h={BAG_H} groundY={SW} shadow={!jumping} pose={{ mouth: Math.max(0.8 * burpK, spit), mood: t > 28 ? "happy" : "full", lookX: -0.8, lookY: -0.2, full: 1 - 0.25 * OUTS.filter((to) => t > to).length, squash: jumping ? hb.sq : 0.15 * burpK * Math.sin(t * 25), legs: hb.legs, tilt: burpK * -10 }} /> : null}
    <Stickman p={PB} t={t} action="idle" lips={LIPS} groundY={SW} face={faceAt(t, [[25.7, "worried"], [BURP, "surprised"], [27.5, "happy"], [ONBACK, "laugh"]])}
      rig={{ ...a.rig, backpack: t > ONBACK + 0.3, ...(holding ? SELFHUG : {}), ...eyes(t, [[25.7, 0.8, 0.3], [27.3, 0.6, 0], [29.2, 0, -0.3]]) }} />
    <DepthPass focus={6.6} blur={1.8} />
  </StreetSet>); };

/* S9 30.1–35.0: home again (hook framing). Peace at last (the bag naps on his back) ... then his sneakers start to dance; all quiet -> loops to frame 0 */
const TAP0 = 31.9, TAP1 = 33.75;
const ACT9: AKey[] = [{ t: 30.1, tilt: 8, turn: 0.1 }, { t: 30.7, tilt: -4, turn: 0.2, d: 0.4 }, { t: 31.7, tilt: 10, turn: 0, d: 0.25 }, { t: 33.9, tilt: 0, turn: 0.1, d: 0.35 }];
export const S9 = ({ t }: Ctx) => { const a = act(t, ACT9, { seed: 9 }), tapping = t >= TAP0 && t < TAP1, end = t > 34.35;
  const beat = (t - TAP0) / 0.25, side = Math.floor(beat) % 2, ph = beat - Math.floor(beat), lift = tapping ? Math.sin(ph * Math.PI) : 0;
  const end0 = framePose(PH, HOOK_O, 0);
  const cam: Key[] = t < 34.35 ? frameShot(PH, 30.1, 34.35, { ...HOOK_O, push: 0.97 }).map((k, i) => i === 0 ? { ...k, t: 30.1 } : { ...framePose(PH, { ...HOOK_O, frac: CLOSE * 0.98 }, 0), t: 34.35 }) : [{ ...framePose(PH, { ...HOOK_O, frac: CLOSE * 0.98 }, 0), t: 34.35 }, { ...end0, t: 35.0 }];
  const legs = tapping ? { legL: { a: 6 + 6 * lift * (side ? 0 : 1), b: 0, lift: side ? 0 : lift * 0.9 }, legR: { a: 6 + 6 * lift * (side ? 1 : 0), b: 0, lift: side ? lift * 0.9 : 0 } } : {};
  return (<HomeSet t={t} preset="morning">
    <Cam t={t} keys={cam} impacts={tapping ? [[TAP0, 0.004]] : []} />
    <Stickman p={PH} t={t} action="idle" lips={LIPS} face={end ? "smile" : faceAt(t, [[30.1, "happy"], [31.5, "smile"], [TAP0, "surprised"], [32.9, "confused"], [33.9, "worried"], [34.2, "smile"]])}
      rig={{ ...a.rig, ...legs, air: tapping ? lift * 12 : 0, ...(t < 31.4 ? SELFHUG : {}), ...(end ? { ...HOOK_LOOK, headTurn: 0, headTilt: 0 } : eyes(t, [[30.1, 0.2, 0.4], [31.2, 0.3, -0.1], [TAP0, 0, 1], [33.8, 0.2, 0]])), ...(t > 34.6 ? { blink: 0 } : {}) }} />
    <MusicNotes c={[PH[0], 0.3, PH[2] + 0.3]} t={t} t0={TAP0} t1={TAP1} n={4} />
    <DepthPass focus={6.6} blur={2.0} />
  </HomeSet>); };
void HH; void SY_A; void SY_B;
