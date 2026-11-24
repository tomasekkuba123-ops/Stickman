// EP11 "Stickman's hoodie came alive" — v19 kit. Size A (58 %) in every normal shot, size B (68 %) for the hook + ending (bedroom, same framing -> loops).
// New reusable pieces: rig outfit `tee` (T-shirt), rig.hoodieFace / rig.bagFace, kit/hoodie.tsx (LivingHoodie, Kite, Rope).
import React from "react";
import { Cam, Key, Bench } from "../../style/extra";
import { V3 } from "../../style/kit";
import { Ladder, SGlow, LADDER_PATH } from "../../style/sky";
import { Stickman, Townsperson, LipCue, rigAt } from "../../kit/character";
import { Face, Rig, RUN_STRIDE, MODEL } from "../../style/stickman";
import { World, Terrain, Grass, Flowers, WindTree, Bush, Clouds, Butterflies, Birds, HomeSet, HOME } from "../../kit/world";
import { Town } from "../../kit/sets";
import { DrawStrokes, MagicSparkles } from "../../kit/fx";
import { PuffRing } from "../../kit/puff";
import { DepthPass } from "../../kit/envlib";
import { frameShot, framePose, worldAt, FULL, CLOSE, SY_A, SY_B, FrameOpts } from "../../kit/frame";
import { GKey, WWord } from "../../kit/gesture";
import { act, AKey } from "../../kit/acting";
import { LivingHoodie, HoodiePose, Kite, Rope, hoodieCuff } from "../../kit/hoodie";
import { drawPencil } from "../../style/props2d";
import MOUTH from "../../../public/ep11/mouth.json";
import WORDS from "../../../public/ep11/words.json";

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
const TEE: Rig["outfit"] = { tee: "#7cc6f0" };
const HH = 3, U = HH / 1000; // hero height, metres per rig unit
const HUG = (t: number) => ({ ikL: [70 + Math.sin(t * 50) * 4, 610] as [number, number], ikKL: 1, ikR: [-70, 590 + Math.sin(t * 47) * 4] as [number, number], ikKR: 1, handL: "relaxed" as const, handR: "relaxed" as const });
const SELFHUG = { ikL: [80, 640] as [number, number], ikKL: 1, ikR: [-80, 620] as [number, number], ikKR: 1, handL: "open" as const, handR: "open" as const };
const pencilR = (c: CanvasRenderingContext2D, o: { gloveR: [number, number] }, _W: number, H: number) => { const a = 0.5, L = H * 0.13; drawPencil(c, o.gloveR[0] - Math.sin(a) * L * 0.42, o.gloveR[1] + Math.cos(a) * L * 0.42, L, a, 0.6); };

/* ================= BEDROOM (S1 hook, S2 escape, S9 ending = hook framing) ================= */
export const PH: V3 = [HOME.hero[0], 0, HOME.hero[2] + 1.9]; // in front of the desk (the desk hid his chest)
export const HOOK_O: FrameOpts = B({ yaw: -0.2, sx: 0.5, push: 0.95, drift: 0.04 });
const HP = framePose(PH, HOOK_O, 0);
export const HOOK_LOOK = { lookX: 0.25, lookY: -0.15 };
const hoodieWake = (t: number) => sm(seg(t, 0.78, 1.05));
const G1: GKey[] = [{ t: 1.5, g: "whoa", in: 0.14, hold: 0.5 }, { t: 2.5, g: "palmUp2", in: 0.2, hold: 0.4 }];
const ACT1: AKey[] = [{ t: 0, turn: 0.1 }, { t: 1.0, turn: 0, tilt: 10, dip: 0.3, d: 0.2 }, { t: 1.45, back: 0.25, lean: -8, dip: 0.6, lift: -0.6, tilt: 12, d: 0.14 }, { t: 1.9, back: 0.25, lean: -3, dip: 0.2, d: 0.3 },
  { t: 2.55, back: 0.25, lean: 12, lift: 0.7, turn: 0.6, d: 0.16 }, { t: 2.95, back: 0.25, lean: -10, lift: -0.6, turn: -0.4, d: 0.18 }, { t: 3.35, back: 0.25, lean: 9, lift: 0.6, d: 0.16 }];
export const S1 = ({ t }: Ctx) => { const a = act(t, ACT1), wake = hoodieWake(t), wrig = t > 1.4 ? 0.6 + 0.4 * seg(t, 2.4, 2.7) : 0;
  const jit = wrig * (Math.sin(t * 38) * 7 + Math.sin(t * 23) * 4); // v19 QC: smaller wriggle so the gloves stay off the frame edge
  return (<HomeSet t={t} preset="morning">
    <Cam t={t} keys={[...frameShot(PH, 0, 2.15, HOOK_O), ...frameShot(PH, 2.5, 3.7, { ...HOOK_O, frac: 0.6, push: 0.98 })]} impacts={[[1.47, 0.01]]} /> {/* v19 QC: eases back before the wriggle so the gloves stay in frame */}
    <Stickman p={PH} t={t} action="idle" lips={LIPS} gest={G1} face={faceAt(t, [[0, "smile"], [1.1, "surprised"], [2.0, "scared"]])}
      rig={{ ...a.rig, x: (a.rig.x ?? 0) + jit, squash: (a.rig.squash ?? 0) + wrig * 0.03 * Math.sin(t * 31), ...eyes(t, [[0, HOOK_LOOK.lookX, HOOK_LOOK.lookY], [1.0, 0, 0.9], [1.9, -0.3, 0.6], [2.5, 0.7, 0.2]]),
        hoodieFace: { open: wake, lookX: t < 1.9 ? 0 : Math.sin(t * 3), lookY: -0.6, mood: t > 2.4 ? "sneaky" : "happy" }, ...(t < 0.75 ? { blink: 0 } : {}) }} />
    <DepthPass focus={6.6} blur={2.0} />
  </HomeSet>); };

/* S2 3.65–6.75: wide room with the window; the hoodie pops off (puff), he is in a T-shirt, it hops onto the sill and slips out */
const O2A = A({ yaw: -0.42, sx: 0.46, camY: 1.15, drift: 0.04 });
const O2B = A({ yaw: -0.55, sx: 0.44, camY: 1.3, push: 0.97, drift: 0.03 });
const POP = 4.5, SILL = 5.75, GONE = 6.35;
const WIN: V3 = [HOME.window[0], HOME.window[1] - 1.05, HOME.window[2] + 0.25];
const hoodie2 = (t: number): { p: V3; s: number; pose: HoodiePose } => {
  const chest: V3 = [PH[0] + 0.05, PH[1] + 0.7, PH[2] + 0.12];
  if (t < SILL) { const u = seg(t, POP, SILL), arc = Math.sin(u * Math.PI) * 1.6, base = lerp3(chest, WIN, eo(u));
    return { p: [base[0], base[1] + arc, base[2]], s: lerp(2.6, 1.9, eo(u * 3)), pose: { armL: 150 - 60 * u, armR: 160 - 40 * u, bendL: -20, bendR: -10, eyes: 1, mood: "happy", lookX: -0.8, lookY: 0.4, squash: 0.15 * Math.sin(u * Math.PI), tilt: -12 * u, wiggle: 1 } }; }
  const u = seg(t, SILL, GONE); return { p: [WIN[0] + 0.25 * u, WIN[1], WIN[2] - 0.9 * eo(u)], s: 1.9 * (1 - eo(u) * 0.85), pose: { armL: 40, armR: 140, eyes: 1, wink: sm(seg(t, SILL + 0.05, SILL + 0.2)) * (1 - sm(seg(t, SILL + 0.35, SILL + 0.45))), mood: "sneaky", lookX: -1, squash: -0.15 * Math.sin(u * Math.PI), wiggle: 1 } }; };
const G2: GKey[] = [{ t: 5.1, g: "palmUp2", in: 0.25, hold: 0.3 }, { t: 5.55, g: "pointUp", in: 0.25, hold: 0.6 }, { t: 6.3, g: "whoa", in: 0.15, hold: 0.4 }];
const ACT2: AKey[] = [{ t: 3.65, lean: -4, dip: 0.3 }, { t: 4.1, lean: 8, dip: 0.5, d: 0.12 }, { t: 4.3, lean: -8, dip: 0.6, d: 0.12 }, { t: POP + 0.05, back: 0.2, lean: -12, dip: 0.7, lift: -0.6, d: 0.14 },
  { t: 4.95, back: 0.2, turn: -0.1, tilt: 8, dip: 0.2, d: 0.3 }, { t: 5.45, back: 0.2, turn: 0.75, tilt: -8, dip: 0, d: 0.3 }, { t: 6.4, back: 0.2, turn: 0.6, lean: 6, dip: 0.4, d: 0.2 }];
export const S2 = ({ t }: Ctx) => { const a = act(t, ACT2), off = t >= POP, h = hoodie2(t), wr = t < POP ? Math.sin(t * 34) * 18 : 0;
  return (<HomeSet t={t} preset="morning">
    <Cam t={t} keys={t < 5.3 ? frameShot(PH, 3.65, 5.3, O2A) : frameShot(PH, 5.3, 6.8, O2B)} impacts={[[POP, 0.012]]} />
    <Stickman p={PH} t={t} action="idle" lips={LIPS} gest={G2} face={faceAt(t, [[3.65, "scared"], [POP, "surprised"], [5.0, "confused"], [5.5, "surprised"], [6.3, "worried"]])}
      rig={{ ...a.rig, x: (a.rig.x ?? 0) + wr, ...(off ? { outfit: TEE } : { hoodieFace: { open: 1, mood: "sneaky", lookX: Math.sin(t * 4) } }), ...eyes(t, [[3.65, 0, 0.8], [4.95, -0.2, 0.9], [5.4, 0.8, -0.6]]) }} />
    {off && t < GONE ? <LivingHoodie p={h.p} t={t} h={h.s} pose={h.pose} shadow={false} /> : null}
    <PuffRing c={[PH[0], 2.0, PH[2] - 0.4]} t={t} t0={POP} n={7} r={0.55} size={0.16} color="#ffffff" life={0.6} up={0.4} />
    {t > SILL ? <PuffRing c={[WIN[0], WIN[1] + 0.6, WIN[2]]} t={t} t0={GONE - 0.12} n={7} r={0.5} size={0.3} color="#ffffff" /> : null}
    <DepthPass focus={7.2} blur={2.0} />
  </HomeSet>); };

/* ================= PARK (S3–S8): flat lawn, trees, bench, the town's rooftops behind ================= */
const TREES: [V3, number, "round" | "pine" | "blossom"][] = [[[-7, 0, -7], 1.2, "round"], [[6, 0, -8.5], 1.3, "blossom"], [[10, 0, -3.5], 1.0, "round"], [[-11, 0, -2], 1.1, "pine"], [[1.5, 0, -13], 1.2, "round"], [[-3.5, 0, -15], 1.0, "pine"], [[15, 0, -9], 1.2, "pine"], [[19, 0, -2], 1.1, "round"], [[24, 0, -7], 1.3, "blossom"]];
export const Park: React.FC<{ t: number; wind?: number; children?: React.ReactNode }> = ({ t, wind = 1, children }) => (
  <World preset="day" t={t}>
    <Terrain amp={0} />
    <Grass t={t} area={[56, 34]} c={[8, 0, -8]} n={3600} wind={wind} amp={0} />
    <Flowers t={t} area={[50, 28]} c={[8, 0, -8]} n={260} amp={0} />
    {TREES.map(([p, s, k], i) => <WindTree key={i} p={p} t={t} s={s} seed={i + 3} kind={k} wind={wind} />)}
    <Bush p={[-4.2, 0, -4.5]} t={t} s={1.1} seed={2} flowers="#ff6aa8" /><Bush p={[12.5, 0, -5.5]} t={t} s={1.2} seed={5} flowers="#ffd23a" />
    <Bench p={[-2.6, 0, -4.2]} rotY={0.25} /><Bench p={[14.2, 0, -3.4]} rotY={-0.3} />
    <Town c={[6, 0, -26]} t={t} n={18} seed={3} />
    <Clouds t={t} preset="day" />
    <Butterflies t={t} c={[4, 1.3, -2]} area={9} />
    <Birds t={t} c={[6, 12, -30]} />
    {children}
  </World>
);

/* S3 6.75–10.25: the chase (side tracking run), the hoodie scurries ahead and looks back */
const RUN0 = 6.85, RUN1 = 10.05, X0 = -5, ZR = 1.0;
const RV = 2.6 * RUN_STRIDE * U; // m/s that matches the run stride (no foot sliding)
const runX = (t: number) => X0 + RV * Math.max(0, Math.min(t, RUN1) - RUN0 - 0.18);
export const XK = runX(RUN1); // where he stops = the kite spot
const O3A = A({ yaw: 0.32, sx: 0.43, camY: 1.1, push: 1, drift: 0 });
const O3B = A({ yaw: -0.38, sx: 0.46, camY: 0.75, push: 1, drift: 0 });
const track = (t0: number, t1: number, o: FrameOpts): Key[] => { const ks: Key[] = []; for (let t = t0; t <= t1 + 1e-6; t += 1 / 30) ks.push({ ...framePose([runX(t), 0, ZR], o, 0), t }); return ks; };
const K3: [number, Key[]][] = [[6.75, track(6.75, 8.6, O3A)], [8.6, track(8.6, 10.3, O3B)]];
const hoodieRunX = (t: number) => runX(t) + 1.75 + 0.25 * Math.sin(t * 1.7);
export const S3 = ({ t }: Ctx) => { const hx = hoodieRunX(t), hop = Math.abs(Math.sin(t * 7.5)) * 0.32, stop = t >= RUN1;
  return (<Park t={t}>
    <Cam t={t} keys={shot(t, K3)} />
    <Stickman p={[runX(t), 0, ZR]} t={t} action={t < RUN0 ? "idle" : stop ? "land" : "run"} t0={stop ? RUN1 : RUN0} dir={1} move={false} lips={LIPS}
      face={faceAt(t, [[6.75, "determined"], [8.8, "determined"], [9.4, "worried"]])} rig={{ outfit: TEE, ...(t > 9.3 && !stop ? { lookX: 0.3, lookY: 0.6 } : {}) }} />
    <LivingHoodie p={[hx, hop, ZR - 0.25]} t={t} h={1.5} groundY={0} pose={{ armL: 70 + 45 * Math.sin(t * 15), armR: 70 - 45 * Math.sin(t * 15), bendL: 20, bendR: 20, lookX: -1, lookY: 0.2, mood: t < 8.6 ? "sneaky" : "happy", tilt: 8 + 4 * Math.sin(t * 15), squash: 0.08 * Math.sin(t * 15), wiggle: 1 }} />
    <DepthPass focus={7.0} blur={2.0} />
  </Park>); };

/* S4 10.25–14.05: a kid flies a kite; the hoodie snatches the string and floats away over the rooftops */
export const PK: V3 = [XK, 0, ZR];
const KID: V3 = [XK + 1.65, 0, ZR - 1.2];
const GRAB = 10.95, LIFT = 11.6;
const kiteAt = (t: number): V3 => { const sw = Math.sin(t * 1.3) * 0.4; const base: V3 = [KID[0] + 1.6 + sw, 6.4 + Math.sin(t * 2) * 0.15, KID[2] - 2.5];
  const u = sm(seg(t, LIFT, 14.1)); return [base[0] + u * 2.2, base[1] + u * 4.5, base[2] - u * 9]; };
const hoodie4 = (t: number): { p: V3; pose: HoodiePose } => {
  const start: V3 = [KID[0] - 1.2, 0, KID[2] + 0.6];
  if (t < GRAB) { const u = seg(t, 10.55, GRAB); return { p: [lerp(start[0], KID[0] - 0.2, eo(u)), Math.sin(u * Math.PI) * 1.4 + 0.0, lerp(start[2], KID[2] + 0.2, u)], pose: { armL: 60 + 90 * u, armR: 160, bendR: -15, mood: "sneaky", lookX: 0.6, lookY: -0.6, squash: 0.12 * Math.sin(u * Math.PI), wiggle: 1 } }; }
  const k = kiteAt(t), hang = sm(seg(t, GRAB, LIFT)); const y = lerp(1.2, k[1] - 3.3, sm(seg(t, GRAB + 0.2, 14.1)));
  return { p: [lerp(KID[0] - 0.1, k[0] - 0.4, hang * 0.5 + 0.5 * sm(seg(t, LIFT, 14))), y + Math.sin(t * 3) * 0.08, lerp(KID[2] + 0.2, k[2] + 1.0, sm(seg(t, GRAB, 14)))],
    pose: { armL: 20 + 20 * Math.sin(t * 4), armR: 172, bendR: -8, mood: "happy", lookX: -0.8, lookY: 0.8, tilt: 6 * Math.sin(t * 1.6), wiggle: 1 } };
};
const O4A = A({ yaw: 0.12, sx: 0.4, camY: 1.15, drift: 0.04 });
const O4B = A({ yaw: -0.25, sx: 0.43, sy: 0.6, camY: 0.35, fov: 50, push: 0.96, drift: -0.04 });
const P4B = framePose(PK, O4B, 0);
const K4: [number, Key[]][] = [[10.25, frameShot(PK, 10.25, 11.95, O4A)], [11.95, frameShot(PK, 11.95, 14.1, O4B)]];
const ACT4: AKey[] = [{ t: 10.25, lean: -4, dip: 0.3, turn: 0.6 }, { t: GRAB + 0.05, turn: 0.7, back: 0.25, lean: -9, dip: 0.6, lift: 0.6, d: 0.14 }, { t: 11.5, back: 0.25, turn: 0.5, tilt: -10, dip: 0, d: 0.3 }, { t: 12.9, back: 0.25, turn: 0.3, tilt: -12, d: 0.3 }];
const G4: GKey[] = [{ t: 10.6, g: "point", in: 0.2, hold: 0.25 }, { t: GRAB + 0.05, g: "whoa", in: 0.14, hold: 0.4 }, { t: 12.3, g: "reach", in: 0.3, hold: 1.2 }];
export const S4 = ({ t }: Ctx) => { const a = act(t, ACT4, { seed: 4 }), h = hoodie4(t), k = kiteAt(t), kidHas = t < GRAB;
  const cam: V3 = t < 11.95 ? framePose(PK, O4A, 0).pos : P4B.pos, kidHand: V3 = [KID[0] + 0.45, 1.75, KID[2] + 0.1];
  const cuff = hoodieCuff(h.p, 1.5, h.pose.armR ?? 160, h.pose.bendR ?? 10, 1, cam);
  return (<Park t={t}>
    <Cam t={t} keys={shot(t, K4)} />
    <Kite p={k} t={t} s={1.15} />
    <Rope a={kidHas ? kidHand : cuff} b={k} />
    <Townsperson who="kid1" p={KID} t={t} h={2.2} action={kidHas ? "idle" : t < GRAB + 0.9 ? "freezeShock" : "point"} t0={GRAB} face={kidHas ? "happy" : "surprised"} seed={3}
      rig={kidHas ? { ikR: [150, 760], ikKR: 1, handR: "hold", lookY: -0.8, lookX: 0.4 } : { lookY: -0.8, lookX: 0.2 }} />
    {t > 10.5 ? <LivingHoodie p={h.p} t={t} h={1.5} groundY={0} pose={h.pose} shadow={h.p[1] < 2.5} /> : null}
    <Stickman p={PK} t={t} action="idle" lips={LIPS} gest={G4} face={faceAt(t, [[10.25, "determined"], [GRAB, "surprised"], [12.0, "worried"]])}
      rig={{ ...a.rig, outfit: TEE, ...eyes(t, [[10.25, 0.7, 0], [GRAB, 0.6, -0.7], [12.0, 0.4, -0.9]]) }} />
    <DepthPass focus={6.8} blur={1.8} />
  </Park>); };

/* S5 14.05–18.0: he draws a ladder with the magic pencil, climbs it, reaches up — too short */
const LAD: V3 = [XK + 0.95, 0, ZR - 0.35], LAD_H = 2.6, TOP = 1.45;
const DRAW0 = 14.35, DRAW1 = 15.5, STEP0 = 15.62, CLIMB0 = 15.85, CLIMB1 = 16.45;
export const HERO_LAD: V3 = [LAD[0], TOP, LAD[2] + 0.28];
const hero5 = (t: number): V3 => { const s = sm(seg(t, STEP0, CLIMB0)), c = sm(seg(t, CLIMB0, CLIMB1)); return [lerp(PK[0], HERO_LAD[0], s), c * TOP, lerp(PK[2], HERO_LAD[2], s)]; };
export const SKYH = (t: number): V3 => { const k = kiteAt(Math.min(t, 14.05)); return [k[0] - 0.4, k[1] - 3.3, k[2] + 1.0]; }; // hoodie hanging under the kite (frozen in the sky after S4)
const O5A = A({ yaw: 0.2, sx: 0.44, camY: 1.1, drift: 0.04 });
const O5B = A({ yaw: -0.15, sx: 0.42, sy: 0.6, camY: 0.6, fov: 48, push: 0.95, drift: 0.04 });
const climbTrack = (): Key[] => { const ks: Key[] = []; for (let t = 15.75; t <= CLIMB1 + 0.2; t += 1 / 30) { const p = hero5(t); ks.push({ ...framePose([p[0], p[1], p[2]], O5B, 0), t }); } return ks; };
const K5: [number, Key[]][] = [[14.05, frameShot(PK, 14.05, 15.75, O5A)], [15.75, climbTrack()], [CLIMB1 + 0.2, frameShot(HERO_LAD, CLIMB1 + 0.2, 18.05, O5B)]]; // v19 QC: the camera rises with him on the ladder
export const S5 = ({ t }: Ctx) => { const p = hero5(t), drawing = t >= DRAW0 - 0.2 && t < DRAW1 + 0.1, prog = sm(seg(t, DRAW0, DRAW1)), real = t >= DRAW1, climbing = t >= CLIMB0 && t < CLIMB1;
  const reach = t >= CLIMB1, hop = reach ? Math.max(0, Math.sin((t - CLIMB1) * 7)) * 0.08 * (1 - seg(t, 17.2, 17.6)) : 0;
  const pose5 = t < 15.75 ? framePose(PK, O5A, 0) : framePose(HERO_LAD, O5B, 0);
  const sky = worldAt(pose5, 0.68, 0.19, 9);
  return (<Park t={t}>
    <Cam t={t} keys={shot(t, K5)} />
    {!real ? <DrawStrokes p={[LAD[0], LAD_H / 2 + 0.05, LAD[2]]} s={[1.0, LAD_H]} paths={LADDER_PATH} prog={prog} t={t} style="magic" /> : <Ladder p={LAD} h={LAD_H} lean={-0.15} w={0.9} k={1 + 0.15 * Math.exp(-(t - DRAW1) * 8) * Math.sin((t - DRAW1) * 30)} />}
    {real && t < DRAW1 + 0.6 ? <MagicSparkles t={t} c={[LAD[0], 1.4, LAD[2]]} area={[0.8, 1.4, 0.3]} n={14} /> : null}
    <PuffRing c={[LAD[0], 1.3, LAD[2] - 0.2]} t={t} t0={DRAW1} n={7} r={0.5} size={0.2} color="#e0fbff" life={0.7} up={0.3} />
    <LivingHoodie p={sky} t={t} h={1.8} shadow={false} pose={{ armL: 20 + 15 * Math.sin(t * 4), armR: 172, mood: t > 16.9 ? "happy" : "sneaky", lookX: -0.5, lookY: 0.9, wiggle: 1, tilt: 5 * Math.sin(t * 1.5) }} />
    <Kite p={[sky[0] + 0.4, sky[1] + 3.3, sky[2] - 1]} t={t} s={1.15} />
    <Rope a={[sky[0] + 0.15, sky[1] + 1.05, sky[2]]} b={[sky[0] + 0.4, sky[1] + 3.3, sky[2] - 1]} />
    <Stickman p={p} t={t} action={drawing ? "drawInAir" : climbing ? "climb" : t >= STEP0 && t < CLIMB0 ? "walk" : "idle"} t0={drawing ? DRAW0 - 0.2 : climbing ? CLIMB0 : STEP0} move={false} lips={LIPS} shadow={p[1] < 0.05}
      extra={t < STEP0 ? pencilR : undefined} face={faceAt(t, [[14.05, "determined"], [15.55, "grin"], [CLIMB1, "determined"], [16.85, "worried"]])}
      rig={{ outfit: TEE, ...(t >= CLIMB0 ? { grounded: false, legL: { a: 4, b: 4 }, legR: { a: 4, b: 4 } } : {}), ...(drawing ? { ikR: [300 + Math.sin(t * 7) * 40, 560 + prog * 420], ikKR: 1, handR: "hold" as const, lookX: 0.7, lookY: -0.2 - prog * 0.5 } : {}),
        ...(reach ? { ikR: [90, 1260 + Math.sin(t * 9) * 25], ikKR: 1, handR: "open" as const, ikL: [-150, 760], ikKL: 1, handL: "hold" as const, handsOverHead: false, lookX: 0.4, lookY: -1, air: hop / U } : {}) }} />
    <DepthPass focus={6.8} blur={1.8} />
  </Park>); };

/* S6 18.0–22.0: a cold gust (leaves fly sideways, grass bends), he shivers on top of the ladder, then a huge sneeze */
const SNEEZE = wt("achoo", 20.5) - 0.55 + 0.02; // sneezeReact blast at u = 0.55
const Gust: React.FC<{ t: number; c: V3; k: number }> = ({ t, c, k }) => k <= 0.01 ? null : (<>{Array.from({ length: 26 }, (_, i) => {
  const ph = ((t * (0.55 + (i % 5) * 0.08) + i * 0.137) % 1), x = c[0] - 9 + ph * 18, y = c[1] + ((i * 0.61) % 1) * 4 + Math.sin(t * 6 + i) * 0.3, z = c[2] - 2 + ((i * 0.37) % 1) * 5;
  return <mesh key={i} position={[x, y, z]} rotation={[t * 7 + i, t * 5 + i * 2, t * 3]} scale={[0.16 * k, 0.08 * k, 0.02]}><sphereGeometry args={[1, 8, 6]} /><meshToonMaterial color={["#ff9a3a", "#ffd23a", "#e5483f", "#8ee06a"][i % 4]} /></mesh>; })}</>);
const O6A = A({ yaw: 0.35, sx: 0.42, sy: 0.6, camY: 0.9, fov: 46, drift: -0.04 });
const O6B = B({ frac: 0.49, yaw: -0.05, sx: 0.58, sy: 0.6, camY: 0.9, fov: 46, push: 0.95, drift: 0.03 });
const K6: [number, Key[]][] = [[18.0, frameShot(HERO_LAD, 18.0, 19.85, O6A)], [19.85, frameShot(HERO_LAD, 19.85, 22.05, O6B)]];
export const gustAt = (t: number) => sm(seg(t, 18.2, 18.6)) * (1 - 0.6 * sm(seg(t, 20.0, 20.6)));
const ACT6: AKey[] = [{ t: 18.0, turn: 0.2, tilt: -6 }, { t: 18.55, turn: -0.6, tilt: 8, lean: -6, shiver: 0.4, d: 0.25 }, { t: 19.3, turn: 0, tilt: 4, lean: -3, shiver: 1, d: 0.3 }, { t: 21.7, turn: 0.1, shiver: 0.7, d: 0.3 }];
export const S6 = ({ t }: Ctx) => { const g = gustAt(t), a = act(t, ACT6, { seed: 6 }), sneeze = t >= SNEEZE, blast = SNEEZE + 0.6;
  const pose = t < 19.85 ? framePose(HERO_LAD, O6A, 0) : framePose(HERO_LAD, O6B, 0), sky = worldAt(pose, 0.74, 0.19, 10);
  return (<Park t={t} wind={1 + 3 * g}>
    <Cam t={t} keys={shot(t, K6)} impacts={[[blast, 0.02]]} />
    <Gust t={t} c={[HERO_LAD[0], 0.6, HERO_LAD[2] - 1]} k={g} />
    <Ladder p={LAD} h={LAD_H} lean={-0.15} w={0.9} />
    {t < 19.85 ? <><LivingHoodie p={sky} t={t} h={1.5} shadow={false} pose={{ armL: 30 + 20 * Math.sin(t * 6), armR: 172, mood: "happy", lookX: -0.5, lookY: 0.9, wiggle: 1.5, tilt: 10 * Math.sin(t * 2.2) }} />
      <Kite p={[sky[0] + 0.4, sky[1] + 3.3, sky[2] - 1]} t={t} s={1.15} /><Rope a={[sky[0] + 0.15, sky[1] + 1.05, sky[2]]} b={[sky[0] + 0.4, sky[1] + 3.3, sky[2] - 1]} /></> : null}
    <Stickman p={HERO_LAD} t={t} action={sneeze ? "sneezeReact" : "idle"} t0={SNEEZE} lips={LIPS} shadow={false} face={sneeze ? undefined : faceAt(t, [[18.0, "worried"], [18.6, "scared"], [19.3, "worried"]])}
      rig={{ ...a.rig, outfit: TEE, grounded: false, legL: { a: 4, b: 4 }, legR: { a: 4, b: 4 }, ...(sneeze ? {} : HUG(t)), ...eyes(t, [[18.0, 0.3, -0.4], [18.5, -0.8, -0.1], [19.3, 0, 0.2]]) }} />
    <PuffRing c={[HERO_LAD[0] + 0.7, TOP + 2.4, HERO_LAD[2] + 0.3]} t={t} t0={blast} n={8} r={0.8} size={0.22} color="#eef4ff" up={0.2} life={0.9} />
    <DepthPass focus={6.6} blur={2.0} />
  </Park>); };

/* S7 22.0–26.0: the hoodie freezes in the sky and looks down at its shivering friend */
const O7A = A({ yaw: 0.15, sx: 0.4, sy: 0.64, camY: 0.2, fov: 52, drift: 0.03 });
const O7B = A({ yaw: -0.4, sx: 0.36, sy: 0.6, camY: 1.6, fov: 46, push: 0.96, drift: -0.03 });
const K7: [number, Key[]][] = [[22.0, frameShot(HERO_LAD, 22.0, 23.5, O7A)], [23.5, frameShot(HERO_LAD, 23.5, 26.05, O7B)]];
const ACT7: AKey[] = [{ t: 22.0, shiver: 1, turn: 0.2, tilt: 6 }, { t: 24.0, shiver: 1, turn: 0.4, tilt: -6, d: 0.4 }];
export const S7 = ({ t }: Ctx) => { const a = act(t, ACT7, { seed: 7 }), A7 = t < 23.5;
  const pose = A7 ? framePose(HERO_LAD, O7A, 0) : framePose(HERO_LAD, O7B, 0), sky = worldAt(pose, A7 ? 0.62 : 0.72, 0.2, A7 ? 9 : 8);
  const froze = t >= wt("froze", 22.3) - 0.05, sadK = sm(seg(t, 23.6, 24.2));
  return (<Park t={t} wind={1.6}>
    <Cam t={t} keys={shot(t, K7)} />
    <Ladder p={LAD} h={LAD_H} lean={-0.15} w={0.9} />
    <LivingHoodie p={sky} t={t} h={1.6} shadow={false} pose={{ armL: froze ? 25 : 25 + 15 * Math.sin(t * 4), armR: 172, mood: sadK > 0.5 ? "sad" : froze ? "shock" : "happy", lookX: -0.4, lookY: 1, wiggle: froze ? 0 : 1, squash: froze ? 0.06 * Math.exp(-(t - 22.45) * 6) : 0, tilt: froze ? 0 : 6 * Math.sin(t * 1.5) }} />
    <Kite p={[sky[0] + 0.4, sky[1] + 3.5, sky[2] - 1]} t={t} s={1.2} /><Rope a={[sky[0] + 0.16, sky[1] + 1.12, sky[2]]} b={[sky[0] + 0.4, sky[1] + 3.5, sky[2] - 1]} />
    <Stickman p={HERO_LAD} t={t} action="idle" lips={LIPS} shadow={false} face={faceAt(t, [[22.0, "worried"], [24.4, "sad"]])}
      rig={{ ...a.rig, outfit: TEE, grounded: false, legL: { a: 4, b: 4 }, legR: { a: 4, b: 4 }, ...HUG(t), ...eyes(t, [[22.0, 0, 0.2], [24.0, 0.3, -0.3]]) }} />
    <DepthPass focus={6.6} blur={2.0} />
  </Park>); };

/* S8 26.0–30.0: it lets go of the kite, dives, wraps him up — he wears it again, warm glow + hearts */
const DIVE0 = wt("dove", 25.9) - 0.05, WRAP = wt("wrapped", 27) + 0.05;
const O8A = A({ yaw: 0.3, sx: 0.4, sy: 0.62, camY: 0.9, fov: 50, drift: 0.04 });
const O8B = B({ yaw: -0.15, sx: 0.5, sy: 0.6, camY: 1.0, fov: 46, push: 0.95, drift: -0.03 });
const K8: [number, Key[]][] = [[26.0, frameShot(HERO_LAD, 26.0, WRAP, O8A)], [WRAP, frameShot(HERO_LAD, WRAP, 30.05, O8B)]];
const ACT8: AKey[] = [{ t: 26.0, shiver: 1, tilt: -8, turn: 0.4 }, { t: WRAP + 0.05, shiver: 0, back: 0.15, lean: -8, dip: 0.6, lift: 0.5, d: 0.14 }, { t: 28.3, back: 0.15, tilt: 10, dip: 0.2, d: 0.35 }, { t: 29.3, back: 0.15, tilt: -6, d: 0.4 }];
export const S8 = ({ t }: Ctx) => { const a = act(t, ACT8, { seed: 8 }), worn = t >= WRAP;
  const pose = framePose(HERO_LAD, O8A, 0), sky = worldAt(pose, 0.72, 0.2, 8), u = sm(seg(t, DIVE0, WRAP));
  const chest: V3 = [HERO_LAD[0], HERO_LAD[1] + 0.8, HERO_LAD[2] + 0.2], hp = lerp3(sky, chest, u), arc: V3 = [hp[0] + Math.sin(u * Math.PI) * 1.2, hp[1], hp[2]];
  const kite: V3 = [sky[0] + 0.4 + seg(t, DIVE0, 28) * 3, sky[1] + 3.5 + seg(t, DIVE0, 28) * 6, sky[2] - 1];
  const warm = sm(seg(t, WRAP, WRAP + 0.5)) * (1 - 0.4 * seg(t, 29.2, 30));
  return (<Park t={t} wind={1.2}>
    <Cam t={t} keys={shot(t, K8)} impacts={[[WRAP, 0.012]]} />
    <Ladder p={LAD} h={LAD_H} lean={-0.15} w={0.9} />
    {t < 28.2 ? <Kite p={kite} t={t} s={1.2} /> : null}
    {t < DIVE0 ? <Rope a={[sky[0] + 0.16, sky[1] + 1.12, sky[2]]} b={kite} /> : null}
    {!worn ? <LivingHoodie p={arc} t={t} h={lerp(1.6, 2.4, u)} shadow={false} pose={{ armL: lerp(30, 160, u), armR: lerp(172, 160, u), bendL: -10, bendR: -10, mood: u > 0.05 ? "happy" : "sad", lookX: -0.6, lookY: 0.8, tilt: -25 * Math.sin(u * Math.PI), squash: 0.2 * Math.sin(u * Math.PI), wiggle: 1 }} /> : null}
    <PuffRing c={[chest[0], chest[1] + 0.1, chest[2] - 0.3]} t={t} t0={WRAP} n={9} r={0.8} size={0.26} color="#ffe4e4" life={0.8} up={0.3} />
    {worn ? <><SGlow p={[chest[0], chest[1] + 0.4, chest[2] - 0.6]} r={1.7} color="#ffb070" o={0.22 * warm} /><MagicSparkles t={t} c={[chest[0], chest[1] + 1.0, chest[2] + 0.3]} area={[1.4, 1.2, 0.4]} n={12} color="#ff8fb0" size={0.16} /></> : null}
    <Stickman p={HERO_LAD} t={t} action="idle" lips={LIPS} shadow={false} face={faceAt(t, [[26.0, "sad"], [DIVE0 + 0.2, "surprised"], [WRAP + 0.3, "laugh"], [28.6, "happy"]])}
      rig={{ ...a.rig, grounded: false, legL: { a: 4, b: 4 }, legR: { a: 4, b: 4 }, ...(worn ? { ...SELFHUG, hoodieFace: { open: sm(seg(t, 28.0, 28.4)), mood: "happy", lookX: -0.3, lookY: -0.8 } } : { outfit: TEE, ...HUG(t) }),
        ...eyes(t, [[26.0, 0.4, -0.6], [DIVE0, 0.6, -0.9], [WRAP, 0, 0.3], [28.6, 0.2, -0.2]]) }} />
    <DepthPass focus={6.6} blur={2.0} />
  </Park>); };

/* S9 30.0–35.0: home again (hook framing). Best friends (the hoodie winks) ... the backpack growls (side view shows it), then all quiet -> loops to frame 0 */
const TURN0 = 32.15, TURN1 = 33.75;
const G9: GKey[] = [{ t: 31.5, g: "palmUp2", in: 0.25, hold: 0.3 }];
const ACT9: AKey[] = [{ t: 30.0, tilt: 8, turn: 0.1 }, { t: 30.6, tilt: -6, turn: 0.3, d: 0.3 }, { t: 31.4, tilt: 0, turn: -0.4, d: 0.3 }, { t: 32.2, turn: -0.8, tilt: 6, back: 0.0, d: 0.25 }, { t: 33.0, turn: -0.8, lean: -6, dip: 0.4, d: 0.14 }, { t: 34.2, turn: 0.1, tilt: 0, lean: 0, dip: 0, d: 0.35 }];
export const S9 = ({ t }: Ctx) => { const a = act(t, ACT9, { seed: 9 }), side = t >= TURN0 && t < TURN1, growl = sm(seg(t, 32.6, 32.95)) * (1 - sm(seg(t, 33.9, 34.3))) + sm(seg(t, 31.95, 32.3)) * 0.5 * (1 - sm(seg(t, 34.0, 34.3)));
  const shake = t > 32.9 && t < 33.6 ? Math.sin(t * 60) * 10 : 0, end = t > 34.35;
  const end0 = framePose(PH, HOOK_O, 0);
  const cam: Key[] = t < 34.35 ? frameShot(PH, 30.0, 34.35, { ...HOOK_O, push: 0.97 }).map((k, i) => i === 0 ? { ...k, t: 30.0 } : { ...framePose(PH, { ...HOOK_O, frac: CLOSE * 0.98 }, 0), t: 34.35 }) : [{ ...framePose(PH, { ...HOOK_O, frac: CLOSE * 0.98 }, 0), t: 34.35 }, { ...end0, t: 35.0 }];
  const hf = { open: sm(seg(t, 30.1, 30.35)) * (1 - sm(seg(t, 34.0, 34.3))), wink: sm(seg(t, 30.55, 30.7)) * (1 - sm(seg(t, 30.95, 31.1))), mood: (t > 32.3 ? "shock" : "happy") as "shock" | "happy", lookX: t > 32.0 ? -1 : 0.3, lookY: -0.4 };
  return (<HomeSet t={t} preset="morning">
    <Cam t={t} keys={cam} impacts={[[32.95, 0.008]]} />
    <Stickman p={PH} t={t} action="idle" lips={LIPS} gest={side ? undefined : G9} face={end ? "smile" : faceAt(t, [[30.0, "laugh"], [31.0, "happy"], [32.0, "confused"], [32.9, "scared"], [33.9, "worried"], [34.2, "smile"]])}
      rig={{ ...a.rig, x: (a.rig.x ?? 0) + shake, hoodieFace: hf, bagFace: growl, ...(t < 31.3 ? SELFHUG : {}), ...(side ? { view: "side" as const, flip: false, armL: { a: 10, b: 20 }, armR: { a: 30, b: 50 }, handR: "open" as const } : {}),
        ...(end ? { ...HOOK_LOOK, headTurn: 0, headTilt: 0 } : eyes(t, [[30.0, 0.2, 0.6], [31.2, 0.3, -0.1], [32.0, -0.8, 0.2], [33.8, 0.2, 0]])), ...(t > 34.6 ? { blink: 0 } : {}) }} />
    <DepthPass focus={6.6} blur={2.0} />
  </HomeSet>); };
void MODEL; void rigAt; void SKYH;
