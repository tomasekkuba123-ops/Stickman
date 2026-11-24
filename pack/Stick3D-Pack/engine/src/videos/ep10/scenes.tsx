// EP10 "The Floor Is Lava" — one continuous LavaPark set; every shot reads the same world state (lava, cracks, planks, button, duck)
// from global functions of t, so cuts never break continuity. Hero = Stickman playing "Bloxie" (narrated: no lip sync, the narrator talks).
// Loop: the hook (t 0..1.4) and the ending tail use the same function of tau (tau = t, or t - LEN), so the last frame flows into frame 0.
import React from "react";
import { Cam, Key } from "../../style/extra";
import { V3 } from "../../style/kit";
import { Stickman, rigAt, ActionName } from "../../kit/character";
import { Face, Rig, RUN_STRIDE } from "../../style/stickman";
import { DepthPass } from "../../kit/envlib";
import { LavaPark, LP, TOP, plankX, bridgeY } from "../../kit/sets5";
import { framePose, FrameOpts, FULL, CLOSE, SY_A, SY_B, screenDir } from "../../kit/frame";
import { GKey, aim } from "../../kit/gesture";
import { act, AKey } from "../../kit/acting";
import { Animal, QPop } from "../../kit/animals";
import { DustImpact, Splash } from "../../kit/fx";
import { PuffRing } from "../../kit/puff";

export type Ctx = { t: number; f: number };
export const LEN = 845 / 30; // 28.1667 s, frame 845 == frame 0
const cl = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const seg = (t: number, a: number, b: number) => cl((t - a) / (b - a));
const sm = (x: number) => { const u = cl(x); return u * u * (3 - 2 * u); };
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const pick = <T,>(t: number, list: [number, T][]) => { let k = list[0][1]; for (const [a, x] of list) if (t >= a) k = x; return k; };
const H = 3, K = H / 1000;

/* ================= TIMELINE (from lines.json / Whisper) ================= */
export const T = {
  hook: 1.4, crack: 3.5, flood: 4.45, j1: 5.55, j2: 6.38, jd: 0.8, crouch: 7.95, leap: 8.05, ld: 1.45,
  walkOn: 11.9, run: 12.35, arrive: 14.45, turn: 16.75, point: 17.4, step: 18.25, press: 18.9, drain: 19.0, cheer: 19.4,
  duckIn: 21.8, duckAt: 24.4, flap: 25.2, peck: 25.55, again: 25.65,
};
export const CUTS = [0, 1.4, 3.3, 5.5, 7.3, 9.85, 11.85, 14.85, 16.6, 18.6, 20.5, 22.0, 24.05, 25.85, LEN];

/* ================= hero positions ================= */
export const HA: V3 = [1.0, TOP, 0.3];        // terrace A spot
const XS1 = LP.S1[0], XS2 = LP.S2[0], XH = LP.H[0] - 0.2;
export const HB: V3 = [22.5, TOP, 0.35];      // arrival on terrace B
export const HP: V3 = [24.0, TOP, 0.6];     // next to the button (after the press) = hook / ending spot
const RUN_V = 4.9, RUN_RATE = 2.6 * RUN_STRIDE * K; // world units / s at speed 1
const runX = (t: number) => { // walk on (11.9-12.35), run, ease into the stop at B
  const x0 = XH, x1 = 12.55, x2 = HB[0];
  if (t < T.walkOn) return x0; if (t < T.run) return lerp(x0, x1, sm(seg(t, T.walkOn, T.run)));
  const dur = T.arrive - T.run, u = seg(t, T.run, T.arrive); return lerp(x1, x2, u < 0.85 ? u / 0.85 * 0.9 : 0.9 + 0.1 * Math.sin((u - 0.85) / 0.15 * Math.PI / 2)) + 0 * dur;
};
/* plank i drops ~0.3 s after the hero has passed it ("It's falling apart!") */
export const FALL: number[] = Array.from({ length: LP.N }, (_, i) => { const x = plankX(i); let tp = T.arrive; for (let s = T.walkOn; s <= T.arrive; s += 0.02) if (runX(s) >= x + 0.2) { tp = s; break; } return Math.max(12.15, tp + 0.28 + (i % 3) * 0.04); });
const jumpP = (t: number, t0: number, dur: number, x0: number, x1: number, extra = 0): V3 => { const k = (t - t0) / dur, a = sm(seg(k, 0.22, 0.78)) * 0.15 + seg(k, 0.22, 0.78) * 0.85; return [lerp(x0, x1, a), TOP + extra * Math.sin(Math.PI * seg(k, 0.22, 0.78)), lerp(0.3, 0.1, a) * 0 + 0.15]; };

/* ================= world state ================= */
export const lavaAt = (t: number) => t < 1.4 ? 0 : t < T.drain ? sm(seg(t, T.flood, T.flood + 1.1)) : t < T.again ? 1 - sm(seg(t, T.drain, T.drain + 0.95)) : 0;
const hookCrack = (tau: number) => 0.06 + 0.045 * (tau + 2.5); // tau -2.5..1.4 -> grows slowly through the loop seam
export const crackAt = (t: number) => t < 1.4 ? hookCrack(t) : t < T.drain ? sm(seg(t, T.crack, T.crack + 0.8)) : t < T.again ? 0 : hookCrack(t - LEN);
export const crackC = (t: number): [number, number] => (t < 1.4 || t >= T.again ? [LP.BTN[0], LP.BTN[2]] : [HA[0], HA[2] - 0.6]);
export const pressAt = (t: number) => t < 1.4 ? 1 : t < T.press ? 0 : t < T.press + 0.5 ? sm(seg(t, T.press, T.press + 0.08)) * (1 - sm(seg(t, T.press + 0.25, T.press + 0.5))) : t < T.peck ? 0 : sm(seg(t, T.peck, T.peck + 0.08));
export const glowAt = (t: number) => t >= T.turn - 0.2 && t < T.press + 0.3 ? sm(seg(t, T.point - 0.3, T.point)) : t >= T.peck || t < 1.4 ? 0.8 : 0;
/* duck: waddles in on the grass, hops onto terrace B, flutters up onto the button and sits on it (sits there at frame 0 too) */
export function duckAt(t: number): { p: V3; walk: number; tilt: number; mouth: number; wing: number; flip: boolean; show: boolean } {
  const onBtn: V3 = [LP.BTN[0], TOP + 0.98, LP.BTN[2]], sit = { walk: 0, tilt: 0.15 + 0.1 * Math.sin(t * 3), mouth: 0, wing: 0, flip: true, show: true };
  if (t < 1.4 || t >= T.peck) { const tau = t < 1.4 ? t : t - LEN; return { ...sit, p: onBtn, mouth: (tau % 1.3 + 1.3) % 1.3 < 0.2 ? 1 : 0 }; }
  if (t < T.duckIn) return { ...sit, p: [32, 0, -2], show: false };
  const path: [number, V3][] = [[T.duckIn, [29.2, 0, -1.6]], [22.9, [27.0, 0, -1.25]], [23.25, [26.4, TOP, -1.1]], [T.duckAt, [25.45, TOP, -0.95]]];
  if (t < T.flap) { let p: V3 = path[path.length - 1][1]; for (let i = 0; i < path.length - 1; i++) if (t < path[i + 1][0]) { const u = seg(t, path[i][0], path[i + 1][0]); const a = path[i][1], b = path[i + 1][1]; p = [lerp(a[0], b[0], u), lerp(a[1], b[1], u) + (i === 1 ? 0.5 * Math.sin(Math.PI * u) : 0), lerp(a[2], b[2], u)]; break; }
    const walking = t < T.duckAt; const q1 = Math.abs(t - 22.55) < 0.25, q2 = Math.abs(t - 23.6) < 0.22; // quacks ("A duck?" / "What's it doing here?")
    return { p, walk: walking ? (t - T.duckIn) * 2.2 : 0, tilt: walking ? 0 : 0.25 * Math.sin((t - T.duckAt) * 5) ** 2, mouth: q1 || q2 ? 1 : 0, wing: 0, flip: true, show: true }; }
  const u = seg(t, T.flap, T.peck), a = path[path.length - 1][1]; // flutter up onto the button
  return { p: [lerp(a[0], onBtn[0], u), lerp(a[1], onBtn[1], sm(u)) + 0.35 * Math.sin(Math.PI * u), lerp(a[2], onBtn[2], u)], walk: 0, tilt: 0, mouth: 0.6, wing: 0.5 + 0.5 * Math.sin(t * 40), flip: true, show: true };
}

/* ================= hero acting ================= */
type HeroState = { p: V3; action: ActionName; t0: number; face: Face; dir?: 1 | -1; dur?: number; speed?: number; gest?: GKey[]; rig?: Partial<Rig>; move?: boolean };
const HOOK_A: AKey[] = [{ t: -3, back: 0, lean: -6, dip: 0.5, turn: 0.55, tilt: -5, shiver: 0.5 }];
const hookHero = (tau: number): HeroState => { const a = act(tau + 10, HOOK_A, { swayT: tau });
  return { p: HP, action: "idle", t0: 0, face: "scared", gest: [{ t: -9, g: "whoa", in: 0.2, hold: 99 }], rig: { ...a.rig, lookX: 0.6, lookY: -0.25, blink: 0 } }; };
const G_DAY: GKey[] = [{ t: 1.55, g: "hips", in: 0.35, hold: 1.0 }, { t: 2.6, g: "palmUp", in: 0.3, hold: 0.5 }];
const G_BRIDGE: GKey[] = [{ t: 10.55, g: aim(-8), in: 0.3, hold: 0.7 }, { t: 11.35, g: "whoa", in: 0.2, hold: 0.4 }];
const G_PHEW: GKey[] = [{ t: 15.05, g: { L: { a: 14, b: 30, hand: "relaxed" }, R: { a: 150, b: 105, hand: "open" }, tilt: 6 }, in: 0.3, hold: 0.7 }, { t: 15.9, g: "rest", in: 0.4 }];
const G_BTN: GKey[] = [{ t: T.point, g: aim(-12), in: 0.25, hold: 0.6 }];
const G_PRESS: GKey[] = [{ t: T.press - 0.15, g: { L: { a: 20, b: 30, hand: "relaxed" }, R: { a: 62, b: 8, hand: "point" }, lean: 8 }, in: 0.25, hold: 0.35 }];
const G_SAFE: GKey[] = [{ t: 20.7, g: "hips", in: 0.4, hold: 1.2 }];
const G_DUCK: GKey[] = [{ t: 22.4, g: "chin", in: 0.3, hold: 0.8 }, { t: 23.45, g: "palmUpL", in: 0.3, hold: 0.5 }];
const G_NO: GKey[] = [{ t: 24.15, g: "reach", in: 0.18, hold: 0.55 }, { t: 24.85, g: aim(-10, "open"), in: 0.15, hold: 0.6 }];
export function heroAt(t: number): HeroState {
  if (t < T.hook) return hookHero(t);
  if (t >= LEN - 1.3) return hookHero(t - LEN);
  if (t < T.crack) return { p: HA, action: "idle", t0: 0, face: pick(t, [[0, "happy" as Face], [2.4, "smile" as Face]]), gest: G_DAY, rig: { ...act(t, [{ t: 1.6, tilt: 6, turn: -0.2 }, { t: 2.6, tilt: -3, turn: 0.2 }]).rig } };
  if (t < T.flood + 0.2) return { p: HA, action: "freezeShock", t0: T.crack, face: "surprised" };
  if (t < T.j1) return { p: HA, action: "panic", t0: T.flood + 0.2, face: "scared" };
  if (t < T.j2) return { p: jumpP(t, T.j1, T.jd, HA[0], XS1), action: "jump", t0: T.j1, dur: T.jd, face: "determined", move: false };
  if (t < T.j2 + T.jd) return { p: jumpP(t, T.j2, T.jd, XS1, XS2), action: "jump", t0: T.j2, dur: T.jd, face: "determined", move: false };
  if (t < T.crouch) return { p: [XS2, TOP, 0.15], action: "idle", t0: 0, face: "worried", rig: { ...act(t, [{ t: 7.5, dip: 0.4, lean: -4, turn: 0.6 }]).rig, lookX: 0.8, lookY: 0.3 } };
  if (t < T.leap + T.ld) return { p: jumpP(t, T.leap, T.ld, XS2, XH, 0.45), action: "jump", t0: T.leap, dur: T.ld, face: "determined", move: false };
  if (t < T.walkOn) return { p: [XH, TOP, 0.15], action: t < T.leap + T.ld + 0.6 ? "land" : "idle", t0: T.leap + T.ld, face: t < 10.3 ? "laugh" : "surprised", gest: t > 10.3 ? G_BRIDGE : undefined, rig: { lookX: t > 10.2 ? 0.8 : 0 } };
  if (t < T.arrive) { const x = runX(t); return { p: [x, x > LP.b0 && x < LP.b1 ? bridgeY(x) : TOP, 0.15], action: t < T.run ? "walk" : "run", t0: t < T.run ? T.walkOn : T.run, face: "scared", speed: t < T.run ? 1 : RUN_V / RUN_RATE, move: false }; }
  if (t < T.turn) return { p: HB, action: t < T.arrive + 0.5 ? "land" : "idle", t0: T.arrive, face: t < 15.0 ? "surprised" : t < 16.0 ? "happy" : "smile", gest: G_PHEW, rig: { ...act(t, [{ t: 15.2, lean: -5, dip: 0.5, tilt: 6 }, { t: 16.2, dip: 0, lean: 0 }]).rig, ...(t > 15.0 && t < 15.7 ? { blink: 1 } : {}) } };
  if (t < T.step) return { p: HB, action: "idle", t0: 0, face: t < 17.0 ? "surprised" : "happy", gest: G_BTN, rig: { ...act(t, [{ t: 16.95, turn: 0.75, tilt: -5, lean: 3 }]).rig, lookX: 0.8, lookY: 0.4 } };
  if (t < T.press - 0.15) { const u = seg(t, T.step, T.press - 0.15); return { p: [lerp(HB[0], HP[0], sm(u)), TOP, lerp(HB[2], HP[2], u)], action: "walk", t0: T.step, face: "determined", move: false, rig: { lookX: 0.8, lookY: 0.4 } }; }
  if (t < T.cheer) return { p: HP, action: "idle", t0: 0, face: "determined", gest: G_PRESS, rig: { ...act(t, [{ t: T.press, lean: 8, dip: 0.3, turn: 0.6 }]).rig, lookX: 0.8, lookY: 0.6 } };
  if (t < 20.45) return { p: HP, action: "celebrate", t0: T.cheer, face: "laugh" };
  if (t < 22.15) return { p: HP, action: "idle", t0: 0, face: "happy", gest: G_SAFE, rig: { ...act(t, [{ t: 20.7, tilt: 7, lean: -3 }]).rig, ...(t > 20.9 && t < 21.6 ? { blink: 1 } : {}) } };
  if (t < 24.1) return { p: HP, action: "idle", t0: 0, face: "confused", gest: G_DUCK, rig: { ...act(t, [{ t: 22.25, turn: 0.7, tilt: -8 }, { t: 23.4, turn: 0.5, tilt: 8 }]).rig, lookX: 0.9, lookY: 0.2 } };
  if (t < T.again) return { p: HP, action: "idle", t0: 0, face: "scared", gest: G_NO, rig: { ...act(t, [{ t: 24.15, lean: 10, turn: 0.7, dip: 0.3, d: 0.15 }, { t: 24.9, lean: 6, turn: 0.6 }]).rig, lookX: 0.9, lookY: -0.2 } };
  return { p: HP, action: "freezeShock", t0: T.again, face: "scared" };
}

/* ================= cameras (size A = 58 %, size B = 68 % only for hook + ending) ================= */
const A = (o: FrameOpts): FrameOpts => ({ frac: FULL, sy: SY_A, fov: 42, camY: 1.0, ...o });
const B = (o: FrameOpts): FrameOpts => ({ frac: CLOSE, sy: SY_B, fov: 42, camY: 1.05, ...o });
export const HOOK_O = B({ yaw: -0.3, sx: 0.34, push: 0.96, drift: 0.05 });
const hookKey = (tau: number): Key => ({ ...framePose(HP, HOOK_O, (tau + 1.3) / 2.7), t: 0 });
const span = (t0: number, t1: number, f: (t: number) => Key, n = 12): Key[] => Array.from({ length: n + 1 }, (_, i) => { const t = lerp(t0, t1, i / n); return { ...f(t), t }; });
const still = (hero: V3, t0: number, t1: number, o: FrameOpts): Key[] => [{ ...framePose(hero, o, 0), t: t0 }, { ...framePose(hero, o, 1), t: t1 }];
const track = (t0: number, t1: number, o: FrameOpts, n = 16): Key[] => span(t0, t1, (t) => framePose([heroAt(t).p[0], TOP, 0.15], o, seg(t, t0, t1)), n);
const smoothTrack = (t0: number, t1: number, o: FrameOpts, lagS = 0.15) => span(t0, t1, (t) => { const a = heroAt(t).p, b = heroAt(Math.max(t0, t - lagS)).p; return framePose([(a[0] + b[0]) / 2, TOP, 0.15], o, seg(t, t0, t1)); }, 20);
export const CAMS: ((t: number) => Key[])[] = [
  () => span(0, 1.45, (t) => hookKey(t), 6),
  () => still(HA, 1.4, 3.3, A({ yaw: 0.28, sx: 0.5, push: 0.94, drift: -0.06 })),
  () => [{ ...framePose(HA, A({ yaw: 0.1, sx: 0.5 }), 0), t: 3.3 }, { ...framePose(HA, A({ yaw: -0.15, sx: 0.5, camY: 1.9, fov: 44 }), 0), t: 5.5 }],
  () => smoothTrack(5.5, 7.3, A({ yaw: 0.08, sx: 0.5, drift: 0.05 })),
  () => smoothTrack(7.3, 9.85, A({ yaw: 0.45, sx: 0.5, drift: -0.5, push: 0.97 }), 0.25),
  () => still([XH, TOP, 0.15], 9.85, 11.85, A({ yaw: -0.62, sx: 0.32, push: 1.04, drift: 0.04 })),
  () => smoothTrack(11.85, 14.85, A({ yaw: 0.25, sx: 0.55, drift: 0.08 }), 0.2),
  () => still(HB, 14.85, 16.6, A({ yaw: 0.05, sx: 0.5, push: 0.95, drift: 0.05 })),
  () => [{ ...framePose(HB, A({ yaw: -0.15, sx: 0.5 }), 0), t: 16.6 }, { ...framePose(HB, A({ yaw: -0.42, sx: 0.36, push: 0.94 }), 1), t: 18.6 }],
  () => still(HP, 18.6, 20.5, A({ yaw: 0.5, sx: 0.48, push: 0.95, drift: 0.06 })),
  () => still(HP, 20.5, 22.0, A({ yaw: 0.0, sx: 0.5, push: 0.95, drift: -0.05 })),
  () => still(HP, 22.0, 24.05, A({ yaw: -0.3, sx: 0.34, push: 0.97, drift: 0.04 })),
  () => still(HP, 24.05, 25.85, A({ yaw: -0.36, sx: 0.34, push: 0.93, drift: 0.03 })),
  () => [{ ...framePose(HP, A({ yaw: -0.33, sx: 0.34 }), 0), t: 25.85 }, { ...framePose(HP, A({ yaw: -0.31, sx: 0.34, frac: (FULL + CLOSE) / 2 }), 0), t: 26.6 },
    ...span(LEN - 1.3, LEN + 0.05, (t) => hookKey(t - LEN), 6)],
];
export const IMPACTS: [number, number][] = [[T.crack + 0.05, 0.02], [T.flood, 0.03], [T.leap + T.ld * 0.8, 0.012], [T.again + 0.05, 0.02]];

/* ================= one scene renderer for every shot ================= */
export const Shot: React.FC<Ctx & { i: number }> = ({ t, i }) => {
  const h = heroAt(t), lava = lavaAt(t), crack = crackAt(t), d = duckAt(t);
  const keys = CAMS[i](t); const k0 = keys[0], cam = framePose(h.p, A({}), 0); void cam;
  const focus = Math.hypot(k0.pos[0] - h.p[0], k0.pos[2] - h.p[2]);
  const r = h.rig ?? {};
  return (<LavaPark t={t} bgT={t < 1.4 ? t : t >= LEN - 1.3 ? t - LEN : t} lava={lava} crack={crack} crackC={crackC(t)} crackR0={t < 1.4 || t >= T.again ? 0.6 : 1.2} fall={FALL} press={pressAt(t)} btnGlow={glowAt(t)} picnic={1}>
    <Cam t={t} keys={keys} impacts={IMPACTS} />
    <Stickman p={h.p} t={t} h={H} action={h.action} t0={h.t0} face={h.face} dir={h.dir ?? 1} dur={h.dur} speed={h.speed} gest={h.gest} rig={r} move={h.move ?? false} groundY={h.p[0] > LP.b0 && h.p[0] < LP.b1 ? bridgeY(h.p[0]) : TOP} />
    {d.show ? <Animal kind="duck" p={d.p} h={1.3} t={t} pose={{ walk: d.walk, tilt: d.tilt, mouth: d.mouth, wing: d.wing, flip: d.flip, look: -0.3 }} /> : null}
    <QPop p={[HP[0] - 0.3, TOP + 3.35, HP[2]]} t={t} t0={22.3} t1={23.9} />
    {/* landings + splashes */}
    <DustImpact c={[XS1, TOP, 0.15]} t={t} t0={T.j1 + T.jd * 0.78} r={0.9} />
    <DustImpact c={[XS2, TOP, 0.15]} t={t} t0={T.j2 + T.jd * 0.78} r={0.9} />
    <DustImpact c={[XH, TOP, 0.15]} t={t} t0={T.leap + T.ld * 0.78} r={1.3} />
    {FALL.map((tf, j) => t > tf + 0.35 && t < tf + 1.6 ? <Splash key={j} c={[plankX(j), 0.05, 0]} t={t} t0={tf + 0.42} n={8} color="#ffb03a" s={0.6} /> : null)}
    {t > T.again && t < T.again + 1.5 ? <PuffRing c={[LP.BTN[0], TOP + 0.2, LP.BTN[2]]} t={t} t0={T.again} n={8} r={1.6} size={0.4} color="#ffd8a0" /> : null}
    {t > T.drain && t < T.drain + 1.4 ? <PuffRing c={[HP[0], TOP + 0.1, HP[2]]} t={t} t0={T.drain} n={12} r={3.2} size={0.22} color="#ffffff" up={0.3} /> : null}
    <DepthPass focus={focus} blur={2.0} />
  </LavaPark>);
};
void screenDir; void SY_B;
