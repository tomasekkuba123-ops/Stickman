// EP14 "Stickman's bed just woke up... and it wanted to play!" — v21 kit. Size A in normal shots, size B for the hook + ending (bedroom, same framing -> loops).
// New reusable pieces: kit/bed.tsx (LivingBed, Quilt, Zzz, Toothbrush, GiantPillow + PILLOW_PATH, Trampoline, Slide, SwingSet, Sandbox, PicketFence, StairHall, Ceiling).
import React from "react";
import { Cam, Key } from "../../style/extra";
import { V3 } from "../../style/kit";
import { Box } from "../../style/toon";
import { Stickman, LipCue } from "../../kit/character";
import { Face, RUN_STRIDE } from "../../style/stickman";
import { World, HomeSet, HOME, Terrain, Grass, Flowers, WindTree, Bush, Clouds, Butterflies, Birds } from "../../kit/world";
import { DrawStrokes, MagicSparkles } from "../../kit/fx";
import { PuffRing } from "../../kit/puff";
import { DepthPass } from "../../kit/envlib";
import { frameShot, framePose, CLOSE, FULL, SY_A, SY_B, FrameOpts } from "../../kit/frame";
import { GKey, WWord } from "../../kit/gesture";
import { act, AKey } from "../../kit/acting";
import { MusicNotes } from "../../kit/backpack";
import { LivingBed, BedPose, bedTop, Quilt, Zzz, Toothbrush, GiantPillow, PILLOW_PATH, Trampoline, TRAMP_TOP, Slide, SwingSet, Sandbox, PicketFence, StairHall, STAIR, stairY, Ceiling } from "../../kit/bed";
import { drawPencil } from "../../style/props2d";
import MOUTH from "../../../public/ep14/mouth.json";
import WORDS from "../../../public/ep14/words.json";

export type Ctx = { t: number; f: number };
const LIPS = (MOUTH as { mouthCues: LipCue[] }).mouthCues;
const W = WORDS as WWord[];
export const seg = (t: number, a: number, b: number) => Math.max(0, Math.min(1, (t - a) / (b - a)));
const sm = (x: number) => { const u = Math.max(0, Math.min(1, x)); return u * u * (3 - 2 * u); };
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const lerp3 = (a: V3, b: V3, k: number): V3 => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
const faceAt = (t: number, list: [number, Face][]) => { let f = list[0][1]; for (const [a, x] of list) if (t >= a) f = x; return f; };
const wt = (w: string, from = 0) => (W.find((x) => x.start >= from && x.word.toLowerCase().replace(/[^a-z'-]/g, "") === w)?.start ?? from);
const eyes = (t: number, keys: [number, number, number][]) => { let i = 0; while (i < keys.length - 1 && t >= keys[i + 1][0]) i++; const [, x0, y0] = keys[i], nx = keys[i + 1];
  if (!nx || t < nx[0] - 0.18) return { lookX: x0, lookY: y0 }; const k = sm((t - (nx[0] - 0.18)) / 0.18); return { lookX: x0 + (nx[1] - x0) * k, lookY: y0 + (nx[2] - y0) * k }; };
const A = (o: FrameOpts): FrameOpts => ({ frac: FULL, sy: SY_A, fov: 42, camY: 1.0, ...o });
const B = (o: FrameOpts): FrameOpts => ({ frac: CLOSE, sy: SY_B, fov: 42, camY: 1.05, ...o });
const U = 3 / 1000;
const pencilR = (c: CanvasRenderingContext2D, o: { gloveR: [number, number] }, _W: number, H: number) => { const a = 0.5, L = H * 0.13; drawPencil(c, o.gloveR[0] - Math.sin(a) * L * 0.42, o.gloveR[1] + Math.cos(a) * L * 0.42, L, a, 0.6); };
/* ballistic hop a -> b between t0..t1, peak hh above the higher end; squash at take-off / landing */
const hop = (t: number, a: V3, b: V3, t0: number, t1: number, hh = 0.7): { p: V3; sq: number; air: boolean } => {
  const u = seg(t, t0, t1), p = lerp3(a, b, u); p[1] = lerp(a[1], b[1], u) + 4 * hh * u * (1 - u);
  const pre = t < t0 ? -0.16 * sm(seg(t, t0 - 0.15, t0)) : 0, land = t >= t1 ? -0.18 * Math.exp(-(t - t1) * 10) * Math.cos((t - t1) * 26) : 0;
  return { p, sq: u > 0 && u < 1 ? 0.12 * Math.sin(u * Math.PI) : pre + land, air: u > 0 && u < 1 };
};
const BEDH = 1.8;

/* ================= BEDROOM (S1 hook, S2 bounce to the ceiling, S9 ending = hook framing) ================= */
export const PH: V3 = [1.2, 0, 0.8]; // open floor on the rug (the bed stands right next to him)
export const HOOK_O: FrameOpts = B({ frac: 0.52, yaw: -0.35, sx: 0.42, push: 0.95, drift: 0.04 });
export const HOOK_LOOK = { lookX: 0.25, lookY: -0.15 };
export const BEDP: V3 = [3.75, 0, 0.35]; // the living bed on his right, headboard (face) toward him
const DESK_Y = 1.48;
export const STAND: V3 = [0.2, 0, 0.95]; // nightstand on his left, in view
export const CUP: V3 = [STAND[0], 1.0, STAND[2]];
const Nightstand = () => (<group position={STAND}><Box p={[0, 0.48, 0]} s={[0.6, 0.96, 0.6]} color="#c08850" line={3} /><Box p={[0, 0.65, 0.31]} s={[0.42, 0.22, 0.04]} color="#d89a60" line={2} /><Box p={[0, 0.3, 0.31]} s={[0.42, 0.22, 0.04]} color="#d89a60" line={2} /></group>); // toothbrush cup on the desk, right of him
const SLEEP: BedPose = { mood: "asleep", blanket: 1 };
const breathe = (t: number) => 0.02 * Math.sin(t * Math.PI * 2 / 2.5); // 2.5 s breath (35 / 2.5 = 14 -> loops)

/* S1 0–3.85 hook: the bed is asleep behind him ... its eyes snap open, tail-blanket wags, it play-bows: it wants to PLAY */
const WOKE = wt("woke", 1), PLAY = wt("play", 2.5);
const G1: GKey[] = [{ t: WOKE + 0.1, g: "whoa", in: 0.14, hold: 0.45 }, { t: PLAY - 0.2, g: "palmUp2", in: 0.2, hold: 0.5 }];
const ACT1: AKey[] = [{ t: 0, turn: 0.1 }, { t: WOKE, turn: 0.7, tilt: -8, dip: 0.3, d: 0.2 }, { t: 2.4, turn: 0.8, tilt: 8, d: 0.3 }, { t: PLAY, turn: 0.6, lean: -8, dip: 0.4, back: 0.1, d: 0.15 }];
export const S1 = ({ t }: Ctx) => { const a = act(t, ACT1), awake = t >= WOKE;
  const jolt = awake ? 0.22 * Math.exp(-(t - WOKE) * 7) * Math.cos((t - WOKE) * 22) : 0, bow = sm(seg(t, PLAY - 0.35, PLAY)), h = hop(t, BEDP, BEDP, PLAY + 0.05, PLAY + 0.45, 0.35);
  const bed: BedPose = !awake ? { ...SLEEP, squash: breathe(t) } : { mood: t < WOKE + 0.5 ? "wow" : "play", mouth: t < WOKE + 0.5 ? 0.25 : 0.35 + 0.15 * Math.sin(t * 9), lookX: -1, lookY: 0.2, blanket: 1, wag: sm(seg(t, WOKE + 0.3, WOKE + 0.6)),
    squash: jolt + h.sq, tilt: -9 * bow * (h.air ? 0 : 1), ear: Math.sin(t * 8) * 0.6, tuck: h.air ? 0.4 : 0 };
  return (<HomeSet t={t} preset="morning" noBed>
    <Cam t={t} keys={t < 1.3 ? frameShot(PH, 0, 1.3, HOOK_O) : frameShot(PH, 1.3, 3.9, { ...HOOK_O, frac: 0.48, sx: 0.42, yaw: -0.42, push: 0.97 })} impacts={[[WOKE, 0.006]]} />
    <LivingBed p={h.p} t={t} h={BEDH} pose={bed} groundY={0} />
    {!awake ? <Zzz c={[BEDP[0] - 1.6, BEDH * 0.9, BEDP[2]]} t={t} h={0.45} /> : null}
    <Nightstand />
    <Toothbrush p={CUP} t={t} h={0.55} pose={{ rise: 0, awake: 0 }} />
    <Stickman p={PH} t={t} action="idle" lips={LIPS} gest={G1} face={faceAt(t, [[0, "smile"], [WOKE, "surprised"], [2.4, "confused"], [PLAY, "scared"]])}
      rig={{ ...a.rig, ...eyes(t, [[0, HOOK_LOOK.lookX, HOOK_LOOK.lookY], [WOKE, 0.9, 0.2]]), ...(t < 0.75 ? { blink: 0 } : {}) }} />
    <DepthPass focus={6.6} blur={2.0} />
  </HomeSet>); };

/* S2 3.85–7.55: he stands on the mattress under the blanket; the bed bounces him OUT of the blanket (small hop) ... then a big one: SPLAT on the ceiling */
const BED2: V3 = [-2.6, 0, 0.6];
const TOP2 = bedTop(BED2, BEDH); // mattress top
const B1 = 4.35, L1 = 5.2, B2 = 5.95, HIT = 6.72, DROP = 7.02;
const CEIL = 7.2, PEAK = CEIL - 3.65; // feet height when his head touches the ceiling
const heroY2 = (t: number) => { if (t < B1) return TOP2; if (t < L1) { const u = seg(t, B1, L1); return TOP2 + 4 * 1.0 * u * (1 - u); } if (t < B2) return TOP2;
  if (t < HIT) { const u = seg(t, B2, HIT); return TOP2 + (PEAK - TOP2) * (1 - (1 - u) ** 2); } if (t < DROP) return PEAK; const u = (t - DROP); return PEAK - 4.9 * u * u; };
const bedSq2 = (t: number) => { const crouch = (t0: number) => -0.2 * sm(seg(t, t0 - 0.3, t0)) * (t < t0 + 0.08 ? 1 : 0) + (t >= t0 && t < t0 + 0.4 ? 0.2 * Math.sin(seg(t, t0, t0 + 0.4) * Math.PI) : 0);
  return crouch(B1) + crouch(B2) + (t > L1 && t < L1 + 0.4 ? -0.15 * Math.sin(seg(t, L1, L1 + 0.4) * Math.PI) : 0); };
const O2 = A({ frac: 0.5, yaw: 0.15, sx: 0.5, camY: -0.2, push: 0.98, drift: 0.03 });
const K2 = (): Key[] => { const ks: Key[] = []; for (let t = 3.85; t <= 7.6; t += 1 / 30) { const y = heroY2(Math.min(t, DROP + 0.1)); const sy = lerp(SY_A, 0.68, sm(seg(t, 6.0, 6.6))); ks.push({ ...framePose([BED2[0], y, BED2[2]], { ...O2, sy, frac: lerp(0.5, 0.45, sm(seg(t, 6.0, 6.6))) }, seg(t, 3.85, 7.6)), t }); } return ks; };
const KEYS2 = K2();
export const S2 = ({ t }: Ctx) => { const y = heroY2(t), air = y > TOP2 + 0.02, splat = t >= HIT && t < DROP + 0.15, quiltOff = t >= B1 + 0.05;
  const qu = seg(t, B1 + 0.05, B1 + 0.9), qp: V3 = quiltOff ? [BED2[0] + 1.6 * qu, TOP2 + 0.9 + 2.6 * qu - 2.2 * qu * qu, BED2[2] - 0.35] : [BED2[0], TOP2 - 0.7, BED2[2] + 0.35];
  const sq = splat ? -0.28 * (1 - seg(t, DROP, DROP + 0.15)) : air ? 0.08 : (t > L1 && t < L1 + 0.25 ? -0.15 * Math.sin(seg(t, L1, L1 + 0.25) * Math.PI) : 0);
  return (<HomeSet t={t} preset="morning" noBed>
    <Ceiling t={t} y={CEIL} swing={t > HIT ? Math.exp(-(t - HIT) * 2) : 0} />
    <Cam t={t} keys={KEYS2} impacts={[[HIT, 0.03], [L1, 0.006]]} />
    <LivingBed p={BED2} t={t} h={BEDH} groundY={0} pose={{ mood: "play", mouth: 0.3 + 0.2 * Math.sin(t * 8), lookX: 0.5, lookY: -0.8, blanket: 0, wag: 1, squash: bedSq2(t), ear: Math.sin(t * 7) * 0.8 }} />
    <Stickman p={[BED2[0] + 0.15, y, BED2[2] + 0.25]} t={t} action={air && !splat ? "float" : "idle"} t0={air ? (t < L1 ? B1 : B2) : 0} lips={LIPS} groundY={TOP2} shadow={false}
      face={faceAt(t, [[3.85, "confused"], [B1, "surprised"], [L1, "worried"], [B2, "scared"], [HIT, "scared"], [DROP, "surprised"]])}
      rig={{ squash: sq, zeroG: air ? 1 : 0, ...(splat ? { lookX: 0, lookY: -1, handsOverHead: true, ikL: [-180, 1080] as [number, number], ikR: [180, 1080] as [number, number], ikKL: 1, ikKR: 1, handL: "open" as const, handR: "open" as const } : eyes(t, [[3.85, 0.2, 0.5], [B2, 0, -1]])) }} />
    <Quilt p={qp} t={t} w={2.4} h={quiltOff ? 1.7 : 0.85} flutter={quiltOff ? 1 : 0.15} rot={quiltOff ? qu * 160 : 0} o={1 - sm(seg(t, B1 + 0.75, B1 + 0.95))} />
    {splat ? <MagicSparkles t={t} c={[BED2[0] + 0.15, CEIL - 0.5, BED2[2] + 0.4]} area={[1.4, 0.3, 0.3]} n={12} color="#ffd23a" size={0.16} /> : null}
    <PuffRing c={[BED2[0] + 0.15, CEIL - 0.15, BED2[2] + 0.2]} t={t} t0={HIT} n={7} r={0.6} size={0.18} color="#ffffff" life={0.6} up={-0.3} />
    <DepthPass focus={6.0} blur={lerp(1.6, 0.4, sm(seg(t, 6.0, 6.5)))} />
  </HomeSet>); };

/* ================= STAIR HALL (S3): the bed gallops down the stairs like a puppy; he shouts from the landing ================= */
const GAL0 = wt("galloped", 7.6) - 0.05, GAL1 = 9.9;
const BED3_0: V3 = [-4.3, STAIR.top, 0.35], BED3_1: V3 = [1.6, 0, 0.35];
const bed3 = (t: number): { p: V3; tuck: number; tilt: number } => { const u = seg(t, GAL0, GAL1), x = lerp(BED3_0[0], BED3_1[0], u);
  const z = lerp(BED3_0[2], BED3_1[2], u), base = stairY(x + 0.9), ph = (u * 9) % 1; return { p: [x, base + (u > 0 && u < 1 ? 0.35 * Math.sin(ph * Math.PI) : 0), z], tuck: u > 0 && u < 1 ? 0.5 * Math.sin(ph * Math.PI) : 0, tilt: x > STAIR.x0 && x < STAIR.x0 + STAIR.n * STAIR.dx ? 22 : 0 }; };
export const P3: V3 = [-6.0, STAIR.top, 0.25];
const RUN3 = 9.25, RV3 = 2.6 * RUN_STRIDE * U;
const hero3 = (t: number): V3 => { const x = P3[0] + RV3 * Math.max(0, t - RUN3); return [x, stairY(x), P3[2]]; };
const O3A = A({ frac: 0.46, yaw: 0.45, sx: 0.4, camY: 0.6, push: 0.97, drift: 0.05 });
const O3B = A({ frac: 0.46, yaw: 0.25, sx: 0.42, camY: 0.5 });
const K3B = (): Key[] => { const ks: Key[] = []; for (let t = 8.85; t <= 10.56; t += 1 / 30) { const h = hero3(t), b = bed3(t), k = sm(seg(t, 8.85, 9.4)) * 0.75;
  const dx = Math.max(-0.6, Math.min(0.6, (b.p[0] - 1.2 - h[0]) * k)); ks.push({ ...framePose([h[0] + dx, h[1] + 0.25 * k * (b.p[1] - h[1]), P3[2]], O3B, 0), t }); } return ks; };
const KEYS3B = K3B();
const G3: GKey[] = [{ t: 8.0, g: "whoa", in: 0.14, hold: 0.5 }, { t: 8.75, g: "reach", in: 0.2, hold: 0.45 }];
const ACT3: AKey[] = [{ t: 7.55, turn: 0.6, tilt: 6 }, { t: 8.1, turn: 0.8, lean: -8, dip: 0.4, d: 0.15 }, { t: 8.75, turn: 0.9, lean: 12, d: 0.2 }];
export const S3 = ({ t }: Ctx) => { const a = act(t, ACT3, { seed: 3 }), b = bed3(t), go = t >= GAL0, running = t >= RUN3, h = hero3(t);
  return (<>
    <StairHall t={t} />
    <Cam t={t} keys={t < 8.85 ? frameShot(P3, 7.55, 8.85, O3A) : KEYS3B} />
    <LivingBed p={b.p} t={t} h={BEDH} groundY={stairY(b.p[0] + 0.9)} pose={{ mood: "play", mouth: 0.45 + 0.15 * Math.sin(t * 10), lookX: 1, lookY: 0.3, blanket: 0, wag: 1, legs: go ? (t - GAL0) * 3.2 : undefined, tuck: b.tuck, tilt: -b.tilt, ear: go ? Math.sin(t * 14) : 0.3, flip: true }} />
    <Stickman p={h} t={t} action={running ? "run" : "idle"} t0={running ? RUN3 : 0} dir={1} move={false} lips={LIPS} gest={running ? undefined : G3} groundY={h[1]}
      face={faceAt(t, [[7.55, "surprised"], [8.1, "scared"], [8.75, "worried"], [RUN3, "determined"]])}
      rig={running ? {} : { ...a.rig, ...eyes(t, [[7.55, 0.8, 0.2], [8.6, 0.9, 0.6]]) }} />
    <DepthPass focus={7.0} blur={1.8} />
  </>); };

/* ================= PLAYGROUND (S4–S8) ================= */
const XB = 0.0, ZR = 0.0; // where he stops
export const PB: V3 = [XB, 0, ZR];
export const TR: V3 = [XB + 3.0, 0, -2.2]; // trampoline centre
export const PIL: V3 = [XB + 2.2, 0, -1.4]; // giant pillow (drawn in S6)
const PILW = 3.0, PILH = PILW * 0.42;
const PBM: V3 = [PB[0] + 0.32 * (PIL[0] - PB[0]), 0, PB[2] + 0.32 * (PIL[2] - PB[2])]; // frame hero + pillow together
const Playground: React.FC<{ t: number; preset?: "day" | "sunset"; dip?: number; front?: boolean; children?: React.ReactNode }> = ({ t, preset = "day", dip = 0, front = false, children }) => (
  <World preset={preset} t={t}>
    <Terrain amp={0} color="#6ad05a" color2="#58c04e" />
    <Grass t={t} area={[40, 26]} c={[0, 0, -12]} n={2200} amp={0} />
    <Flowers t={t} area={[30, 14]} c={[0, 0, -9]} n={160} amp={0} />
    {front ? <><Grass t={t} area={[30, 8]} c={[0, 0, 5.5]} n={1100} amp={0} h={0.45} /><Flowers t={t} area={[24, 6]} c={[0, 0, 5.2]} n={110} amp={0} /></> : null}
    <mesh position={[XB - 4, 0.012, ZR + 0.6]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[40, 1.6]} /><meshToonMaterial color="#e8d2a0" /></mesh>
    <Trampoline p={TR} r={1.7} dip={dip} />
    <Slide p={[XB - 6.5, 0, -4.5]} rotY={0.3} />
    <SwingSet p={[XB + 8.5, 0, -6.0]} t={t} rotY={-0.4} />
    <Sandbox p={[XB - 2.6, 0, -6.4]} />
    <PicketFence from={[-16, 0, -9.5]} to={[16, 0, -9.5]} n={44} />
    {[[-10, -12, 1.3, 1], [-4, -15, 1.6, 2], [6, -14, 1.5, 3], [13, -12, 1.2, 4], [18, -16, 1.7, 5], [-15, -15, 1.4, 6]].map(([x, z, s, sd]) => <WindTree key={sd} p={[x, 0, z]} t={t} s={s} seed={sd} kind={sd % 3 ? "round" : "blossom"} />)}
    {[[-8, -8, 1], [10, -8.5, 2], [4, -9, 3]].map(([x, z, sd]) => <Bush key={sd} p={[x, 0, z]} t={t} s={1.2} seed={sd} flowers={sd % 2 ? "#ff6aa8" : "#ffd23a"} />)}
    <Clouds t={t} preset={preset} n={7} />
    {preset === "day" ? <><Butterflies t={t} c={[XB - 2, 1.4, -3]} area={4} /><Birds t={t} /></> : null}
    {children}
  </World>);

/* S4 10.5–14.05: side tracking run along the path; the bed gallops ahead (flipped = facing right) and heads for the trampoline */
const RUN0 = 10.6, RUN1 = 13.7;
const RV = 2.6 * RUN_STRIDE * U;
const X0 = XB - RV * (RUN1 - RUN0 - 0.18);
const runX = (t: number) => X0 + RV * Math.max(0, Math.min(t, RUN1) - RUN0 - 0.18);
const bedRunX = (t: number) => Math.min(runX(t) + 2.5, TR[0] - 1.8);
const O4A = A({ yaw: 0.3, sx: 0.4, camY: 1.1 });
const O4B = A({ yaw: -0.3, sx: 0.5, camY: 0.9 });
const track = (t0: number, t1: number, o: FrameOpts): Key[] => { const ks: Key[] = []; for (let t = t0; t <= t1 + 1e-6; t += 1 / 30) ks.push({ ...framePose([runX(t), 0, ZR], o, 0), t }); return ks; };
const K4: [number, Key[]][] = [[10.5, track(10.5, 12.3, O4A)], [12.3, track(12.3, 14.1, O4B)]];
const shot = (t: number, list: [number, Key[]][]) => { let k = list[0][1]; for (const [t0, ks] of list) if (t >= t0) k = ks; return k; };
export const S4 = ({ t }: Ctx) => { const x = runX(t), stop = t >= RUN1, bx = bedRunX(t), arrived = bx >= TR[0] - 1.8 - 1e-3, gp = (t - RUN0) * 3.0, ph = gp % 1;
  const bz = lerp(ZR - 0.6, TR[2] + 0.3, sm(seg(t, 12.8, 13.8)));
  return (<Playground t={t}>
    <Cam t={t} keys={shot(t, K4)} />
    <LivingBed p={[bx, arrived ? 0 : 0.25 * Math.sin(ph * Math.PI), bz]} t={t} h={BEDH} groundY={0} pose={{ mood: "play", mouth: 0.4 + 0.15 * Math.sin(t * 10), lookX: arrived ? 0.3 : 1, lookY: arrived ? -0.6 : 0, blanket: 0, wag: 1, legs: arrived ? undefined : gp, tuck: arrived ? 0 : 0.3 * Math.sin(ph * Math.PI), ear: Math.sin(t * 12), flip: true }} />
    <Stickman p={[x, 0, ZR]} t={t} action={t < RUN0 ? "idle" : stop ? "land" : "run"} t0={stop ? RUN1 : RUN0} dir={1} move={false} lips={LIPS}
      face={faceAt(t, [[10.5, "determined"], [12.8, "surprised"]])} rig={{ ...(t > 12.8 && !stop ? { lookX: 0.5, lookY: 0.3 } : {}) }} />
    <DepthPass focus={7.0} blur={2.0} />
  </Playground>); };

/* S5 14.05–17.75: the bed jumps onto the trampoline ... bounces higher ... and HIGHER (leaves the frame at the top) */
const TT: V3 = [TR[0], TRAMP_TOP, TR[2]];
const BED5_0: V3 = [TR[0] - 1.8, 0, TR[2] + 0.3];
// bounce schedule [t0, t1, peak height above the mat]; the first one is the leap onto the trampoline
const BOUNCES: [number, number, number][] = [[14.55, 15.05, 0.8], [15.05, 16.05, 1.2], [16.05, 17.0, 1.1], [17.0, 18.9, 3.4], [18.9, 20.8, 3.4]];
export const bedBounce = (t: number): { p: V3; sq: number; air: boolean; dip: number } => {
  if (t < BOUNCES[0][0]) return { p: BED5_0, sq: -0.12 * sm(seg(t, BOUNCES[0][0] - 0.25, BOUNCES[0][0])), air: false, dip: 0 };
  for (let i = 0; i < BOUNCES.length; i++) { const [t0, t1, hh] = BOUNCES[i]; if (t >= t0 && t < t1) { const u = seg(t, t0, t1), from = i ? TT : BED5_0;
    const p: V3 = [lerp(from[0], TT[0], i ? 1 : u), lerp(from[1], TT[1], u) + 4 * hh * u * (1 - u), lerp(from[2], TT[2], i ? 1 : u)];
    const land = t1 - t < 0.12 ? (t1 - t) / 0.12 : 1, dip = i && u < 0.07 ? 1 - u / 0.07 : 0; return { p, sq: 0.1 * Math.sin(u * Math.PI), air: true, dip }; } }
  return { p: TT, sq: 0, air: false, dip: 0 };
};
const O5A = A({ frac: 0.5, yaw: -0.25, sx: 0.42, camY: 1.0, drift: 0.04 });
const O5B = A({ frac: 0.46, yaw: -0.15, sx: 0.4, camY: 0.6, push: 0.97, drift: -0.03 });
const G5: GKey[] = [{ t: 14.6, g: "point", in: 0.2, hold: 0.6 }, { t: 16.3, g: "whoa", in: 0.14, hold: 0.5 }, { t: 16.95, g: "palmUp2", in: 0.2, hold: 0.6 }];
const ACT5: AKey[] = [{ t: 14.05, turn: 0.6, tilt: 6 }, { t: 15.2, turn: 0.7, tilt: -6, d: 0.3 }, { t: 16.3, turn: 0.7, lean: -6, dip: 0.3, d: 0.2 }, { t: 16.95, turn: 0.6, lean: -10, tilt: 10, d: 0.2 }];
export const S5 = ({ t }: Ctx) => { const a = act(t, ACT5, { seed: 5 }), b = bedBounce(t);
  return (<Playground t={t} dip={b.dip} front={t >= 16.1}>
    <Cam t={t} keys={t < 16.1 ? frameShot(PB, 14.05, 16.1, O5A) : frameShot(PB, 16.1, 17.8, O5B)} />
    <LivingBed p={b.p} t={t} h={BEDH} groundY={b.air || t > BOUNCES[0][0] ? TRAMP_TOP : 0} shadow={t < BOUNCES[0][0] + 0.3} pose={{ mood: t > 16.9 ? "wow" : "play", mouth: 0.5 + 0.2 * Math.sin(t * 9), lookX: -0.6, lookY: 0.4, blanket: 0, wag: 1, squash: b.sq, tuck: b.air ? 0.8 : 0, ear: b.air ? -0.8 : 0.5, flip: false }} />
    <Stickman p={PB} t={t} action="idle" lips={LIPS} gest={G5} face={faceAt(t, [[14.05, "surprised"], [15.2, "worried"], [16.3, "surprised"], [16.95, "scared"]])}
      rig={{ ...a.rig, ...eyes(t, [[14.05, 0.8, 0.2], [15.2, 0.8, -0.4], [16.3, 0.7, -0.9]]) }} />
    <DepthPass focus={6.8} blur={1.8} />
  </Playground>); };

/* S6 17.75–21.65: he draws a giant pillow with the magic pencil (the bed is still bouncing sky-high behind him) */
const DRAW0 = wt("pillow", 18.5) - 0.3, DRAW1 = 20.9;
const PILC: V3 = [PIL[0], PILW * 0.5, PIL[2]];
const O6A = A({ frac: 0.46, yaw: 0.15, sx: 0.4, camY: 1.1, drift: 0.04 });
const O6B = A({ frac: 0.42, yaw: -0.2, sx: 0.5, camY: 1.2, push: 0.96, drift: 0.03 });
const ACT6: AKey[] = [{ t: 17.75, turn: 0.5, tilt: -8, lean: -6 }, { t: 18.6, turn: 0.4, tilt: 8, lean: 4, d: 0.3 }, { t: DRAW1 + 0.1, turn: 0.3, lean: -6, dip: 0.3, d: 0.2 }];
export const S6 = ({ t }: Ctx) => { const drawing = t >= DRAW0 - 0.2 && t < DRAW1 + 0.1, prog = sm(seg(t, DRAW0, DRAW1)), real = t >= DRAW1, a = act(t, ACT6, { seed: 6 }), b = bedBounce(t);
  const pop = real ? 1 + 0.1 * Math.exp(-(t - DRAW1) * 7) * Math.sin((t - DRAW1) * 26) : 1;
  return (<Playground t={t} dip={b.dip} front>
    <Cam t={t} keys={t < 19.6 ? frameShot(PB, 17.75, 19.6, O6A) : frameShot(PBM, 19.6, 21.7, O6B)} />
    <LivingBed p={b.p} t={t} h={BEDH} groundY={TRAMP_TOP} shadow={false} pose={{ mood: "wow", mouth: 0.5, lookX: -0.5, lookY: 0.5, blanket: 0, wag: 1, squash: b.sq, tuck: 0.8, ear: -0.8 }} />
    {!real ? <DrawStrokes p={PILC} s={[PILW, PILW]} paths={PILLOW_PATH} prog={prog} t={t} style="magic" face /> : <GiantPillow p={PIL} t={t} w={PILW} pop={pop} />}
    {real && t < DRAW1 + 0.7 ? <MagicSparkles t={t} c={[PIL[0], PILH * 0.6, PIL[2]]} area={[1.8, 0.8, 0.3]} n={14} /> : null}
    <PuffRing c={[PIL[0], PILH * 0.5, PIL[2] - 0.4]} t={t} t0={DRAW1} n={7} r={0.7} size={0.2} color="#fff6d0" life={0.7} up={0.3} />
    <Stickman p={PB} t={t} action={drawing ? "drawInAir" : "idle"} t0={DRAW0 - 0.2} lips={LIPS} extra={t < DRAW1 + 0.4 ? pencilR : undefined}
      face={faceAt(t, [[17.75, "worried"], [18.5, "think"], [19.2, "grin"], [DRAW1, "laugh"]])}
      rig={{ ...a.rig, ...(drawing ? { ikR: [330 + Math.sin(t * 6) * 60, 620 + prog * 300 + Math.cos(t * 6) * 60] as [number, number], ikKR: 1, handR: "hold" as const, lookX: 0.8, lookY: -0.2 } : eyes(t, [[17.75, 0.6, -0.8], [18.6, 0.6, 0.1], [21.0, 0.8, 0.2]])) }} />
    <DepthPass focus={6.6} blur={1.8} />
  </Playground>); };

/* S7 21.65–25.45: the bed comes down out of the sky and FLOPS onto the pillow ... and lets out a huge yawn */
const FLOP = wt("flopped", 21.8) + 0.15, YAWN = wt("yawn", 24) - 0.45;
const BEDON: V3 = [PIL[0], PILH * 0.82, PIL[2] + 0.05];
const bed7 = (t: number): { p: V3; sq: number; psq: number } => { if (t < FLOP) { const u = seg(t, 21.65, FLOP); return { p: [lerp(TR[0] - 0.2, BEDON[0], u), lerp(7.5, BEDON[1], u * u), lerp(TR[2], BEDON[2], u)], sq: 0.12, psq: 0 }; }
  const k = t - FLOP, psq = Math.exp(-k * 4) * Math.cos(k * 14) * 0.6 + 0.25; return { p: [BEDON[0], BEDON[1] - 0.35 * psq + 0.1, BEDON[2]], sq: -0.2 * Math.exp(-k * 6) * Math.cos(k * 20), psq: Math.max(0, psq) }; };
const O7A = A({ frac: 0.38, yaw: 0.1, sx: 0.54, camY: 1.4, drift: 0.04 });
const O7B = A({ frac: 0.42, yaw: -0.3, sx: 0.5, camY: 1.1, push: 0.96, drift: -0.03 });
const G7: GKey[] = [{ t: FLOP, g: "whoa", in: 0.12, hold: 0.6 }, { t: YAWN + 0.3, g: "chin", in: 0.25, hold: 0.9 }];
const ACT7: AKey[] = [{ t: 21.65, turn: 0.5, tilt: -8, lean: -6 }, { t: FLOP, turn: 0.7, lean: -10, dip: 0.6, d: 0.12 }, { t: 23.0, turn: 0.6, tilt: 8, d: 0.3 }, { t: YAWN, turn: 0.6, tilt: -6, lean: 4, d: 0.3 }];
export const S7 = ({ t }: Ctx) => { const a = act(t, ACT7, { seed: 7 }), b = bed7(t), y = sm(seg(t, YAWN - 0.2, YAWN + 0.3)) * (1 - sm(seg(t, YAWN + 0.9, YAWN + 1.3)));
  return (<Playground t={t} front>
    <Cam t={t} keys={t < 23.4 ? frameShot(PBM, 21.65, 23.4, O7A) : frameShot(PBM, 23.4, 25.5, O7B)} impacts={[[FLOP, 0.02]]} />
    <GiantPillow p={PIL} t={t} w={PILW} squash={b.psq} />
    <LivingBed p={b.p} t={t} h={BEDH} groundY={PILH * 0.8} shadow={false} pose={{ mood: t < FLOP + 0.6 ? "wow" : y > 0.05 ? "yawn" : t > YAWN + 1.0 ? "sleepy" : "happy", mouth: t < FLOP ? 0.6 : y > 0.05 ? y : 0.1, lookX: -0.6, lookY: 0.2, blanket: 0, wag: t < YAWN ? 0.6 : 0.15, squash: b.sq + 0.08 * y, tilt: -6 * y, tuck: t < FLOP ? 0.8 : 0, ear: t < FLOP ? -0.9 : 0.4 }} />
    <PuffRing c={[BEDON[0], PILH * 0.6, BEDON[2] - 0.5]} t={t} t0={FLOP} n={8} r={0.8} size={0.22} color="#fff6d0" life={0.7} up={0.2} />
    <Stickman p={PB} t={t} action="idle" lips={LIPS} gest={G7} face={faceAt(t, [[21.65, "worried"], [FLOP, "surprised"], [22.9, "laugh"], [YAWN, "happy"]])}
      rig={{ ...a.rig, ...eyes(t, [[21.65, 0.6, -0.7], [FLOP, 0.8, 0.1], [YAWN, 0.7, 0.1]]) }} />
    <DepthPass focus={6.6} blur={1.8} />
  </Playground>); };

/* S8 25.45–29.35 (sunset): he tucks it in with the blanket ... the bed falls asleep, and he dozes off standing next to it */
const TUCK = wt("tucked", 25.6) - 0.1, ASLEEP = wt("asleep", 27.5);
const PB8: V3 = [XB + 0.35, 0, ZR + 0.1];
const O8A = A({ frac: 0.46, yaw: -0.2, sx: 0.42, camY: 1.1, drift: 0.03 });
const O8B = A({ frac: 0.48, yaw: 0.15, sx: 0.42, camY: 1.0, push: 0.96, drift: -0.02 });
const G8: GKey[] = [{ t: TUCK - 0.3, g: "present", in: 0.25, hold: 0.7 }];
const ACT8: AKey[] = [{ t: 25.45, turn: 0.6, tilt: 6 }, { t: TUCK, turn: 0.7, lean: 10, d: 0.3 }, { t: 27.0, turn: 0.4, tilt: -6, d: 0.4 }, { t: ASLEEP - 0.3, turn: 0.3, tilt: 14, lean: 6, dip: 0.2, d: 0.6 }];
export const S8 = ({ t }: Ctx) => { const a = act(t, ACT8, { seed: 8 }), q = seg(t, TUCK, TUCK + 0.7), tucked = t >= TUCK + 0.7, sleepy = t > 27.0, out = t > ASLEEP - 0.1;
  const qFrom: V3 = [PB8[0] + 1.3, 2.0, PB8[2] - 0.3], qTo: V3 = [BEDON[0] + 0.2, BEDON[1] + BEDH * 0.5, BEDON[2] + 0.2], qp = lerp3(qFrom, qTo, sm(q)); qp[1] += Math.sin(q * Math.PI) * 0.9;
  return (<Playground t={t} preset="sunset" front>
    <Cam t={t} keys={t < 27.2 ? frameShot(PB8, 25.45, 27.2, O8A) : frameShot(PB8, 27.2, 29.4, O8B)} />
    <GiantPillow p={PIL} t={t} w={PILW} squash={0.25} />
    <LivingBed p={[BEDON[0], BEDON[1] - 0.35 * 0.25 + 0.1, BEDON[2]]} t={t} h={BEDH} groundY={PILH * 0.8} shadow={false} pose={{ mood: tucked ? (sleepy ? "asleep" : "sleepy") : "sleepy", blanket: tucked ? 1 : 0, lookX: -0.5, squash: breathe(t) * 1.5, ear: 0.4 }} />
    {!tucked ? <Quilt p={qp} t={t} w={1.9} h={1.3} flutter={t > TUCK ? 1 : 0.2} rot={q * -30} /> : null}
    {sleepy ? <Zzz c={[BEDON[0] - 1.5, BEDON[1] + BEDH * 0.9, BEDON[2]]} t={t} t0={27.0} h={0.45} /> : null}
    {out ? <Zzz c={[PB8[0] + 0.3, 3.1, PB8[2]]} t={t} t0={ASLEEP} h={0.4} n={2} /> : null}
    <Stickman p={PB8} t={t} action="idle" lips={LIPS} gest={G8} face={faceAt(t, [[25.45, "smile"], [TUCK, "happy"], [27.0, "smile"]])}
      rig={{ ...a.rig, ...(out ? { blink: 1, lookX: 0, lookY: 0.3 } : eyes(t, [[25.45, 0.7, 0.1], [27.0, 0.6, 0.3]])) }} />
    <DepthPass focus={6.6} blur={1.8} />
  </Playground>); };

/* S9 29.35–35.0: home again (hook framing), morning. The bed sleeps behind him ... then his toothbrush pops up and SINGS; quiet again -> loops to frame 0 */
const SING0 = wt("toothbrush", 31) - 0.1, SING1 = 33.9;
const ACT9: AKey[] = [{ t: 29.35, tilt: 8, turn: 0.2 }, { t: 30.3, tilt: -4, turn: 0.1, d: 0.4 }, { t: SING0 + 0.1, turn: -0.7, tilt: -10, dip: 0.3, d: 0.2 }, { t: 33.2, turn: -0.6, tilt: 8, d: 0.3 }, { t: 33.95, tilt: 0, turn: 0.1, d: 0.35 }];
export const S9 = ({ t }: Ctx) => { const a = act(t, ACT9, { seed: 9 }), singing = t >= SING0 && t < SING1, end = t > 34.35;
  const rise = sm(seg(t, SING0, SING0 + 0.35)) * (1 - sm(seg(t, SING1, SING1 + 0.35))), sing = singing && t > SING0 + 0.3 ? 0.5 + 0.5 * Math.abs(Math.sin((t - SING0) * 9)) : 0;
  const end0 = framePose(PH, HOOK_O, 0);
  const cam: Key[] = t < 34.35 ? frameShot(PH, 29.35, 34.35, { ...HOOK_O, push: 0.97 }).map((k, i) => i === 0 ? { ...k, t: 29.35 } : { ...framePose(PH, { ...HOOK_O, frac: CLOSE * 0.98 }, 0), t: 34.35 }) : [{ ...framePose(PH, { ...HOOK_O, frac: CLOSE * 0.98 }, 0), t: 34.35 }, { ...end0, t: 35.0 }];
  return (<HomeSet t={t} preset="morning" noBed>
    <Cam t={t} keys={cam} />
    <LivingBed p={BEDP} t={t} h={BEDH} pose={{ ...SLEEP, squash: breathe(t) }} groundY={0} />
    <Zzz c={[BEDP[0] - 1.6, BEDH * 0.9, BEDP[2]]} t={t} h={0.45} />
    <Nightstand />
    <Toothbrush p={CUP} t={t} h={0.55 + 0.55 * rise} pose={{ rise, awake: rise, sing, sway: singing ? 14 * Math.sin((t - SING0) * 6) : 0 }} />
    <MusicNotes c={[CUP[0], CUP[1] + 0.5, CUP[2] + 0.2]} t={t} t0={SING0 + 0.3} t1={SING1} n={4} h={0.36} />
    <Stickman p={PH} t={t} action="idle" lips={LIPS} face={end ? "smile" : faceAt(t, [[29.35, "happy"], [30.3, "smile"], [SING0, "surprised"], [32.6, "confused"], [33.9, "worried"], [34.2, "smile"]])}
      rig={{ ...a.rig, ...(end ? { ...HOOK_LOOK, headTurn: 0, headTilt: 0 } : eyes(t, [[29.35, 0.3, 0.3], [30.4, 0.2, -0.1], [SING0, -1, 0.4], [33.9, 0.3, 0]])), ...(t > 34.6 ? { blink: 0 } : {}) }} />
    <DepthPass focus={6.6} blur={2.0} />
  </HomeSet>); };
void SY_B; void bedTop;
