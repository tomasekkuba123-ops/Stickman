// EP10 "What If Stickman Drew a Pause Button?" — one street (kit/sets2 Street) for the whole episode.
// Time model: the world runs on its own clock that FREEZES at the click (3.78 s) and resumes per object after PLAY
// (everything visible at 25.6 s; the ball, the pigeon and the dog get their own beat in the payoff shots).
import React from "react";
import { Cam, Key, Hydrant } from "../../style/extra";
import { V3 } from "../../style/kit";
import { Ball, Box, Cyl, CanvasPlane } from "../../style/toon";
import { Glow } from "../../style/props";
import { Path2 } from "../../style/sky";
import { World } from "../../kit/world";
import { Stickman, Townsperson, ActionName, LipCue } from "../../kit/character";
import { Face, RigOut } from "../../style/stickman";
import { Critter } from "../../kit/creatures";
import { DrawItReal, Splash } from "../../kit/fx";
import { PuffRing } from "../../kit/puff";
import { Street } from "../../kit/sets2";
import { frameShot, framePose, worldAt, FULL, CLOSE, FrameOpts } from "../../kit/frame";
import MOUTH from "../../../public/ep10/mouth.json";

export type Ctx = { t: number; f: number };
const LIPS = (MOUTH as { mouthCues: LipCue[] }).mouthCues;
const TAU = Math.PI * 2, SW = 0.24;
const seg = (t: number, a: number, b: number) => Math.max(0, Math.min(1, (t - a) / (b - a)));
const sm = (x: number) => { const u = Math.max(0, Math.min(1, x)); return u * u * (3 - 2 * u); };
const lerp3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const beats = (t: number, list: [number, ActionName, Face?][]) => { let b = list[0]; for (const x of list) if (t >= x[0]) b = x; return { action: b[1], t0: b[0], face: b[2] }; };
const K = (t: number, pos: V3, look: V3, fov = 46): Key => ({ t, pos, look, fov });

/* ---------- clocks ---------- */
export const FREEZE = 3.78, RESUME = 25.6;
export const BALL_GO = 28.0, PIGEON_GO = 29.5, SMASH = 28.03, BONK = 30.12;
/* object time: runs, stops at FREEZE, continues from the same instant when `go` arrives */
export const oT = (t: number, go = RESUME) => (t < FREEZE ? t : t < go ? FREEZE : FREEZE + (t - go));
export const frozen = (t: number) => t >= FREEZE && t < RESUME;

/* ---------- places ---------- */
export const H: V3 = [-0.6, SW, -4.6];           // hero spot (hook + ending: the loop point)
export const BTN: V3 = [0.75, 2.35, -4.15];       // the drawn PAUSE button (floats in the air)
export const PLAY: V3 = [1.0, 1.35, -3.95];       // the drawn PLAY button
const DOG: V3 = [3.4, SW, -4.95];
const BENCH_PIG: V3 = [-4.15, SW + 0.82, -4.62];  // pigeon on the bench seat (Street bench at x -5)
const LAMP: V3 = [-2, SW, -4.2];                  // Street lamp post
const WIN: V3 = [-7, 1.3, -6.93];                 // TOYS shop window (front of the glass)
const BALL_FROZEN: V3 = [-6.45, 1.42, -6.62];
const KICK: V3 = [-9.6, 0.25, 2.2];
export const HOOK_O: FrameOpts = { frac: FULL, fov: 42, yaw: 0.22, camY: 1.25, sx: 0.4, sy: 0.37, push: 0.95, drift: 0.04 };
const HP = framePose(H, HOOK_O, 0);
const BIRD: V3 = (() => { const p = framePose(H, { frac: FULL, fov: 46, yaw: -0.35, camY: 0.9, sx: 0.36, sy: 0.4 }, 0); return worldAt(p, 0.68, 0.17, 7.5); })();

/* ---------- drawn shapes ---------- */
const CIRC: Path2 = Array.from({ length: 41 }, (_, i) => [0.5 + Math.cos((i / 40) * TAU) * 0.46, 0.5 + Math.sin((i / 40) * TAU) * 0.46] as [number, number]);
const R = (x0: number, y0: number, x1: number, y1: number): Path2 => [[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]];
const PAUSE_P: Path2[] = [CIRC, R(0.34, 0.3, 0.44, 0.7), R(0.56, 0.3, 0.66, 0.7)];
const PLAY_P: Path2[] = [CIRC, [[0.38, 0.28], [0.72, 0.5], [0.38, 0.72], [0.38, 0.28]]];
const icon = (kind: "pause" | "play", col: string, press = 0) => (c: CanvasRenderingContext2D, W: number, H2: number) => {
  c.clearRect(0, 0, W, H2); const r = W * 0.47, g = c.createRadialGradient(W * 0.38, H2 * 0.32, r * 0.1, W / 2, H2 / 2, r);
  g.addColorStop(0, kind === "pause" ? "#7fb2ff" : "#7fe08f"); g.addColorStop(1, col); c.beginPath(); c.arc(W / 2, H2 / 2, r, 0, TAU); c.fillStyle = g; c.fill();
  c.lineWidth = W * 0.04; c.strokeStyle = "#1A1A1A"; c.stroke(); c.fillStyle = "#fff";
  const s = 1 - press * 0.08; c.save(); c.translate(W / 2, H2 / 2); c.scale(s, s); c.translate(-W / 2, -H2 / 2);
  if (kind === "pause") { c.beginPath(); c.roundRect(W * 0.33, H2 * 0.29, W * 0.12, H2 * 0.42, W * 0.03); c.roundRect(W * 0.55, H2 * 0.29, W * 0.12, H2 * 0.42, W * 0.03); c.fill(); c.stroke(); }
  else { c.beginPath(); c.moveTo(W * 0.39, H2 * 0.28); c.lineTo(W * 0.74, H2 * 0.5); c.lineTo(W * 0.39, H2 * 0.72); c.closePath(); c.fill(); c.lineJoin = "round"; c.stroke(); }
  c.restore(); c.beginPath(); c.ellipse(W * 0.38, H2 * 0.24, W * 0.16, H2 * 0.06, -0.5, 0, TAU); c.fillStyle = "rgba(255,255,255,0.45)"; c.fill();
};
/* the button as a solid object: thick disc + icon face + soft glow; `press` 0..1 pushes it in */
const Button3: React.FC<{ kind: "pause" | "play"; press?: number; glow?: number; s?: number }> = ({ kind, press = 0, glow = 0.5, s = 1.1 }) => {
  const col = kind === "pause" ? "#2f63d0" : "#22974a";
  return (<group position={[0, s / 2, -press * 0.12]}>
    <Cyl p={[0, 0, -0.08]} rt={s * 0.49} h={0.16} color={col} rot={[Math.PI / 2, 0, 0]} line={3} />
    <CanvasPlane p={[0, 0, 0.012]} s={[s, s]} px={[256, 256]} draw={icon(kind, col, press)} />
    {glow > 0 ? <Glow p={[0, 0, -0.1]} r={s * 1.1} color={kind === "pause" ? "rgba(120,170,255,1)" : "rgba(120,240,150,1)"} o={glow * 0.5} /> : null}
  </group>);
};
const pressAt = (t: number, times: number[]) => { let k = 0; for (const a of times) k = Math.max(k, Math.max(0, 1 - Math.abs(t - a) / 0.12)); return k; };
export const PAUSE_PRESS = [3.78, 19.42, 19.86, 20.3];
/* both buttons are "used up" when PLAY is pressed: they pop away with a puff at RESUME */
const popK = (t: number, t0: number) => (t0 < RESUME ? 1 - sm(seg(t, RESUME + 0.05, RESUME + 0.3)) : 1);
const Popper: React.FC<{ c: V3; k: number; children: React.ReactNode }> = ({ c, k, children }) => k <= 0.001 ? null : <group position={c} scale={k}><group position={[-c[0], -c[1], -c[2]]}>{children}</group></group>;
const PauseButton: React.FC<{ t: number; t0?: number }> = ({ t, t0 = 0.2 }) => (<Popper c={BTN} k={popK(t, t0)}>
  <DrawItReal t={t} t0={t0} p={[BTN[0], BTN[1] - 0.55, BTN[2]]} size={[1.1, 1.1]} paths={PAUSE_P} fill="#5a8ff0" draw={0.85} fillDur={0.18} pop={0.35}>
    <group position={[0, -0.55, 0]}><Button3 kind="pause" press={pressAt(t, PAUSE_PRESS)} glow={0.55 + 0.15 * Math.sin(t * 3)} /></group>
  </DrawItReal></Popper>);

/* ---------- props ---------- */
const SoccerBall: React.FC<{ p: V3; r?: number; spin?: number }> = ({ p, r = 0.22, spin = 0 }) => (
  <group position={p} rotation={[spin, spin * 0.6, 0]}>
    <Ball p={[0, 0, 0]} r={r} color="#fbfbfb" ink={0.018} />
    {[[0, 0, 1], [0.9, 0.3, -0.3], [-0.9, 0.3, -0.3], [0.3, -0.95, 0], [-0.4, 0.9, 0.2], [0, 0.1, -1]].map((d, i) => <Ball key={i} p={[d[0] * r * 0.82, d[1] * r * 0.82, d[2] * r * 0.82]} r={r * 0.32} color="#1A1A1A" s={[1, 1, 0.45]} ink={0} />)}
  </group>);
/* ball: kicked from the road, frozen one inch from the glass, hits it when it resumes */
const ballAt = (t: number) => { const tau = oT(t, BALL_GO), u = seg(tau, 2.62, 3.80); const p = lerp3(KICK, [WIN[0] + 0.55, WIN[1] + 0.12, WIN[2] + 0.24], u); return { p: [p[0], p[1] + Math.sin(u * Math.PI) * 1.6, p[2]] as V3, spin: tau * 9, hit: tau >= 3.80 }; };
const Shards: React.FC<{ t: number }> = ({ t }) => { const u = t - SMASH; if (u < 0 || u > 1.6) return null;
  return (<group>{Array.from({ length: 16 }, (_, i) => { const a = i * 2.39, sp = 1.6 + (i % 5) * 0.5, x = WIN[0] + 0.4 + Math.cos(a) * 0.5 * u * sp, y = WIN[1] + 0.2 + Math.sin(a) * 0.4 * u * sp + 2.2 * u - 4.9 * u * u, z = WIN[2] + 0.15 + u * (1.2 + (i % 3) * 0.4);
    return y < SW ? null : <Box key={i} p={[x, y, z]} s={[0.16 + (i % 3) * 0.06, 0.12, 0.02]} rot={[u * 6 + i, u * 4, i]} color="#cfeeff" line={1} />; })}</group>); };
const WindowCracks: React.FC<{ t: number }> = ({ t }) => t < SMASH ? null : (
  <CanvasPlane p={[WIN[0], WIN[1], WIN[2] + 0.03]} s={[3.6, 1.8]} px={[512, 256]} draw={(c, W, H2) => { c.clearRect(0, 0, W, H2); const cx = W * 0.62, cy = H2 * 0.45;
    c.beginPath(); for (let i = 0; i <= 12; i++) { const a = (i / 12) * TAU, r = (i % 2 ? 46 : 70); c.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.9); } c.closePath(); c.fillStyle = "#1d2a44"; c.fill(); c.lineWidth = 5; c.strokeStyle = "#1A1A1A"; c.stroke();
    c.strokeStyle = "rgba(255,255,255,0.95)"; c.lineWidth = 4; for (let i = 0; i < 10; i++) { const a = i * 0.63 + 0.2; c.beginPath(); c.moveTo(cx + Math.cos(a) * 60, cy + Math.sin(a) * 52); c.lineTo(cx + Math.cos(a) * (150 + (i % 3) * 70), cy + Math.sin(a) * (120 + (i % 2) * 60)); c.stroke(); } }} />);
/* hydrant spraying an arc of water (frozen droplets while paused) */
const WaterArc: React.FC<{ t: number; p: V3 }> = ({ t, p }) => { const tau = oT(t);
  return (<group>{Array.from({ length: 16 }, (_, i) => { const u = ((tau * 1.1 + i / 16) % 1), x = p[0] + 0.3 + u * 2.2, y = p[1] + 0.6 + 2.0 * u - 2.4 * u * u;
    return y < SW ? null : <Ball key={i} p={[x, y, p[2] + Math.sin(i) * 0.05]} r={0.07 + 0.03 * Math.sin(i * 1.7)} color="#8fd8ff" ink={0.02} />; })}</group>); };
/* town life that freezes: a walker, the kid who kicked the ball, the hydrant spray */
const TownLife: React.FC<{ t: number }> = ({ t }) => { const tw = oT(t);
  return (<>
    <Townsperson who="granny" p={[-15 - 0.9 * tw, SW, 4.4]} t={tw} action="walk" dir={-1} seed={3} />
    <Townsperson who="kid1" p={[KICK[0] - 0.5, 0, KICK[2] + 0.4]} t={tw} action={tw < 3.0 ? "jump" : "celebrate"} t0={tw < 3.0 ? 2.2 : 3.0} face="laugh" seed={9} h={2.3} />
    <Hydrant p={[6.6, SW, -4.0]} /><WaterArc t={t} p={[6.6, SW, -4.0]} />
  </>);
};
const BirdFly: React.FC<{ t: number }> = ({ t }) => { const tw = oT(t), p: V3 = [BIRD[0] + (tw - FREEZE) * 2.4, BIRD[1] + Math.sin(tw * 3) * 0.15, BIRD[2]];
  return <Critter kind="bird" p={[p[0], p[1] - 0.35, p[2]]} h={0.7} t={t} flap={(tw * 2.2) % 1} />; };
const Pigeon: React.FC<{ t: number }> = ({ t }) => { const tau = oT(t, PIGEON_GO), fly = t >= PIGEON_GO, glasses = sm(seg(t, 16.95, 17.25));
  if (!fly) return <Critter kind="pigeon" p={[BENCH_PIG[0], BENCH_PIG[1] - 0.05, BENCH_PIG[2]]} h={0.75} t={t} glasses={glasses} />;
  const u = seg(t, PIGEON_GO, BONK), top: V3 = [LAMP[0] - 0.25, 3.3, LAMP[2] + 0.25];
  if (t < BONK) { const p = lerp3(BENCH_PIG, top, sm(u)); return <Critter kind="pigeon" p={[p[0], p[1] + Math.sin(u * Math.PI) * 0.6, p[2]]} h={1.0} t={t} fly={1} flap={(tau * 3) % 1} glasses={1} />; }
  const v = seg(t, BONK, BONK + 0.55), y = top[1] + (SW + 0.05 - top[1]) * v * v;
  return <Critter kind="pigeon" p={[top[0] - 0.4 * v, y, top[2] + 0.2]} h={0.75} t={t} glasses={1} dizzy={1} fly={v < 1 ? 1 : 0} flap={0.6} />; };
const Dog: React.FC<{ t: number; p?: V3; angry?: number; run?: number; flip?: boolean }> = ({ t, p = DOG, angry = 0, run = 0, flip = true }) =>
  <Critter kind="dog" p={p} h={1.35} t={frozen(t) ? FREEZE : t} fry={t < 13.98 ? 1 : 0} angry={angry} run={run} flip={flip} />;

/* things in Stickman's hands */
const fryInL = (c: CanvasRenderingContext2D, o: RigOut) => { c.save(); c.translate(o.gloveL[0], o.gloveL[1] - 10); c.rotate(-0.9); c.beginPath(); c.roundRect(-6, -40, 18, 70, 5); c.fillStyle = "#ffcf3a"; c.fill(); c.lineWidth = 5; c.strokeStyle = "#1A1A1A"; c.stroke(); c.restore(); };
const shadesInR = (c: CanvasRenderingContext2D, o: RigOut) => { c.save(); c.translate(o.gloveR[0], o.gloveR[1] - 26); c.rotate(-0.15); c.fillStyle = "#111"; c.beginPath(); c.roundRect(-46, -12, 40, 26, 9); c.roundRect(6, -12, 40, 26, 9); c.fill(); c.lineWidth = 5; c.strokeStyle = "#1A1A1A"; c.beginPath(); c.moveTo(-6, -2); c.lineTo(6, -2); c.stroke(); c.fillStyle = "rgba(255,255,255,0.7)"; c.fillRect(-38, -6, 10, 5); c.fillRect(14, -6, 10, 5); c.restore(); };
const both = (...fs: ((c: CanvasRenderingContext2D, o: RigOut, W: number, H: number) => void)[]) => (c: CanvasRenderingContext2D, o: RigOut, W: number, H: number) => fs.forEach((f) => f(c, o, W, H));

/* everything in the street, every shot */
const Town: React.FC<{ t: number; children?: React.ReactNode; dog?: React.ReactNode; noBall?: boolean }> = ({ t, children, dog, noBall }) => { const b = ballAt(t);
  return (<World preset="day" t={oT(t)}>
    <Street t={oT(t)} mood="day" noPizza noBikes />
    <TownLife t={t} />
    {t < SMASH && !noBall ? <SoccerBall p={b.p} spin={b.spin} /> : null}
    {t >= SMASH ? <SoccerBall p={[WIN[0] + 0.5, 0.5 + Math.max(0, 1.2 - (t - SMASH) * 3), WIN[2] - 0.6]} spin={0} /> : null}
    <Shards t={t} /><WindowCracks t={t} />
    <BirdFly t={t} /><Pigeon t={t} />
    {dog ?? <Dog t={t} />}
    {children}
  </World>);
};
const Hero: React.FC<{ t: number; p?: V3; b: { action: ActionName; t0: number; face?: Face }; rig?: object; prop?: "pencil" | "pencilUp" | null; extra?: (c: CanvasRenderingContext2D, o: RigOut, W: number, H: number) => void; dir?: 1 | -1; move?: boolean }> =
  ({ t, p = H, b, rig, prop = null, extra, dir = 1, move = false }) => <Stickman p={p} t={t} action={b.action} t0={b.t0} face={b.face} lips={LIPS} prop={prop} extra={extra} dir={dir} move={move} rig={rig} />;
const holdFry = (t: number) => (t >= 13.98 && t < 35.0 ? fryInL : undefined);

/* ================= S1 HOOK 0–3.55: draws the pause button, reaches for it ================= */
export const S1 = ({ t }: Ctx) => { const b = beats(t, [[0, "drawInAir", "grin"], [1.55, "idle", "smirk"], [2.45, "point", "grin"]]);
  return (<Town t={t}><Cam t={t} keys={frameShot(H, 0, 3.6, HOOK_O)} />
    <PauseButton t={t} />
    <Hero t={t} b={b} prop={t < 1.55 ? "pencil" : null} rig={{ lookX: 0.7, lookY: -0.2, ...(t < 0.6 ? { blink: 0 } : {}) }} />
  </Town>); };

/* ================= S2 3.55–4.75 "Click." close: the press + freeze wave ================= */
export const S2 = ({ t }: Ctx) => (<Town t={t}>
  <Cam t={t} keys={frameShot(H, 3.55, 4.8, { frac: CLOSE, fov: 40, yaw: 0.5, camY: 1.6, sx: 0.36, sy: 0.4, push: 0.9, drift: 0.03 })} impacts={[[FREEZE, 0.01]]} />
  <PauseButton t={t} />
  <Hero t={t} b={beats(t, [[3.55, "point", "determined"], [4.0, "idle", "surprised"]])} rig={{ lookX: 0.8, lookY: -0.3 }} />
</Town>);

/* ================= S3 4.75–6.7 "A bird froze in midair." ================= */
const O3: FrameOpts = { frac: FULL, fov: 46, yaw: -0.35, camY: 0.9, sx: 0.36, sy: 0.4, push: 0.93, drift: -0.08 };
export const S3 = ({ t }: Ctx) => (<Town t={t}>
  <Cam t={t} keys={frameShot(H, 4.75, 6.75, O3)} />
  <PauseButton t={t} />
  <Hero t={t} b={beats(t, [[4.75, "idle", "surprised"], [5.4, "point", "surprised"], [6.1, "idle", "grin"]])} rig={{ lookX: 0.6, lookY: -0.9 }} />
</Town>);

/* ================= S4 6.7–9.6 "A soccer ball stopped one inch from a window." ================= */
const P4a: V3 = [-9.6, SW, -6.0], P4b: V3 = [-8.15, SW, -6.05];
export const S4 = ({ t }: Ctx) => { const k = sm(seg(t, 7.5, 8.45)), p = lerp3(P4a, P4b, k);
  const cam: Key[] = t < 7.5 ? [K(6.7, [-4.15, 1.95, -5.75], [-6.75, 1.4, -6.9], 52), K(7.5, [-4.3, 1.9, -5.85], [-6.7, 1.42, -6.9], 48)]
    : frameShot(P4b, 7.5, 9.65, { frac: FULL, fov: 42, yaw: -0.18, camY: 1.2, sx: 0.36, sy: 0.38, push: 0.94, drift: 0.05 });
  return (<Town t={t}><Cam t={t} keys={cam} />
    <Hero t={t} p={p} b={t < 8.45 ? { action: "tiptoe", t0: 7.5, face: "smirk" } : beats(t, [[8.45, "point", "surprised"], [9.2, "idle", "grin"]])} rig={{ lookX: 0.9, lookY: 0.1 }} />
  </Town>); };

/* ================= S5 9.6–11.8 "The whole world was on hold." (wide crane) ================= */
export const S5 = ({ t }: Ctx) => { const cam: Key[] = [K(9.6, [-6.5, 6.0, 5.0], [1.0, 1.3, -4.3], 56), K(11.85, [-5.6, 5.2, 4.4], [0.9, 1.4, -4.4], 52)];
  const p = lerp3([-2.6, SW, -4.5], [-0.8, SW, -4.4], sm(seg(t, 9.6, 11.4)));
  return (<Town t={t}><Cam t={t} keys={cam} /><PauseButton t={t} />
    <Hero t={t} p={p} b={{ action: "walk", t0: 9.6, face: "happy" }} rig={{ lookX: 0.5 }} />
  </Town>); };

/* ================= S6 11.8–15.4 "Stickman grinned. He borrowed a fry from a frozen dog," ================= */
const P6: V3 = [2.0, SW, -4.55];
export const S6 = ({ t }: Ctx) => { const b = beats(t, [[11.8, "laugh", "grin"], [13.35, "pickUp", "smirk"], [14.3, "idle", "grin"]]);
  const cam = t < 13.2 ? frameShot(P6, 11.8, 13.2, { frac: CLOSE, fov: 40, yaw: 0.15, camY: 1.6, sx: 0.42, sy: 0.38, push: 0.9 }) : frameShot(P6, 13.2, 15.45, { frac: FULL, fov: 42, yaw: 0.55, camY: 1.0, sx: 0.36, sy: 0.38, drift: -0.05 });
  return (<Town t={t}><Cam t={t} keys={cam} /><PauseButton t={t} />
    <Hero t={t} p={P6} b={b} extra={holdFry(t)} rig={{ lookX: t > 12.9 ? 0.9 : 0.1, lookY: t > 12.9 ? 0.3 : 0 }} />
  </Town>); };

/* ================= S7 15.4–18.4 "...and gave a pigeon tiny sunglasses." ================= */
const P7: V3 = [-3.05, SW, -4.7];
export const S7 = ({ t }: Ctx) => { const b = beats(t, [[15.4, "hold", "smirk"], [16.6, "pickUp", "grin"], [17.35, "laugh", "laugh"]]);
  return (<Town t={t}><Cam t={t} keys={frameShot(P7, 15.4, 18.45, { frac: FULL, fov: 40, yaw: -0.45, camY: 1.1, sx: 0.62, sy: 0.38, push: 0.93, drift: 0.06 })} />
    <Hero t={t} p={P7} b={b} dir={-1} extra={both(fryInL, ...(t < 16.95 ? [shadesInR] : []))} rig={{ lookX: -0.8, lookY: 0.4 }} />
  </Town>); };

/* ================= S8 18.4–21.6 "Then he pressed the button again. Nothing happened." ================= */
export const S8 = ({ t }: Ctx) => { const b = beats(t, [[18.4, "idle", "smirk"], [19.05, "point", "determined"], [20.55, "panic", "worried"]]);
  return (<Town t={t}><Cam t={t} keys={frameShot(H, 18.4, 21.65, { frac: FULL, fov: 42, yaw: 0.3, camY: 1.3, sx: 0.4, sy: 0.38, push: 0.9, drift: 0.05 })} />
    <PauseButton t={t} />
    <Hero t={t} b={b} extra={holdFry(t)} rig={{ lookX: 0.8, lookY: -0.3 }} />
  </Town>); };

/* ================= S9 21.6–23.95 "Pause buttons only pause." (button close, facepalm) ================= */
export const S9 = ({ t }: Ctx) => (<Town t={t}>
  <Cam t={t} keys={frameShot(H, 21.6, 24.0, { frac: CLOSE, fov: 38, yaw: 0.62, camY: 1.75, sx: 0.32, sy: 0.42, push: 0.92, drift: -0.04 })} />
  <PauseButton t={t} />
  <Hero t={t} b={beats(t, [[21.6, "think", "confused"], [22.6, "facepalm", "sad"]])} extra={holdFry(t)} rig={{ lookX: 0.7, lookY: -0.2 }} />
</Town>);

/* ================= S10 23.95–25.55 "So he drew a play button." ================= */
export const PLAY_PRESS = 25.45;
const PlayButton: React.FC<{ t: number }> = ({ t }) => (<Popper c={PLAY} k={popK(t, 0)}>
  <DrawItReal t={t} t0={24.1} p={[PLAY[0], PLAY[1] - 0.5, PLAY[2]]} size={[1.0, 1.0]} paths={PLAY_P} fill="#5fd07a" draw={0.65} fillDur={0.14} pop={0.3}>
    <group position={[0, -0.5, 0]}><Button3 kind="play" s={1.0} press={pressAt(t, [PLAY_PRESS])} glow={0.6} /></group>
  </DrawItReal></Popper>);
export const S10 = ({ t }: Ctx) => { const b = beats(t, [[23.95, "drawInAir", "determined"], [25.15, "point", "grin"]]);
  return (<Town t={t}><Cam t={t} keys={frameShot(H, 23.95, 25.6, { frac: FULL, fov: 42, yaw: 0.35, camY: 1.1, sx: 0.38, sy: 0.38, push: 0.92 })} />
    <PauseButton t={t} /><PlayButton t={t} />
    <Hero t={t} b={b} prop={t < 25.15 ? "pencil" : null} extra={holdFry(t)} rig={{ lookX: 0.8, lookY: 0.1 }} />
  </Town>); };

/* ================= S11 25.55–27.6 "Everything rushed back at once." (wide, world restarts) ================= */
export const S11 = ({ t }: Ctx) => { const cam: Key[] = [K(25.55, [-5.5, 4.2, 6.0], [0.0, 1.5, -4.0], 52), K(27.65, [-4.4, 3.6, 5.0], [0.1, 1.6, -4.2], 50)];
  return (<Town t={t}><Cam t={t} keys={cam} impacts={[[RESUME, 0.02]]} />
    <PauseButton t={t} /><PlayButton t={t} />
    {t >= RESUME && t < RESUME + 1.0 ? <><PuffRing c={[PLAY[0], PLAY[1], PLAY[2]]} t={t} t0={RESUME} n={16} r={4} size={0.28} color="#c8ffd4" up={0} life={1.0} /><PuffRing c={BTN} t={t} t0={RESUME + 0.08} n={8} r={0.9} size={0.22} color="#cfe0ff" life={0.7} /></> : null}
    <Hero t={t} b={beats(t, [[25.55, "freezeShock", "surprised"], [26.5, "idle", "worried"]])} extra={holdFry(t)} rig={{ lookX: -0.4 }} />
  </Town>); };

/* ================= S12 27.6–28.6 "The ball smashed the window." ================= */
export const S12 = ({ t }: Ctx) => { const cam: Key[] = [K(27.6, [-4.3, 1.5, -5.35], [-6.7, 1.3, -6.75], 46), K(28.65, [-4.1, 1.6, -5.2], [-6.8, 1.2, -6.75], 47)];
  return (<Town t={t}><Cam t={t} keys={cam} impacts={[[SMASH, 0.035]]} /></Town>); };

/* ================= S13 28.6–31.5 "The pigeon hit a lamp post." ================= */
export const S13 = ({ t }: Ctx) => (<Town t={t}>
  <Cam t={t} keys={frameShot(H, 28.6, 31.55, { frac: FULL * 0.9, fov: 50, yaw: -0.3, camY: 1.9, sx: 0.7, sy: 0.46, push: 0.95, drift: 0.04 })} impacts={[[BONK, 0.012]]} />
  <Hero t={t} b={beats(t, [[28.6, "freezeShock", "scared"], [29.3, "idle", "worried"], [30.15, "freezeShock", "scared"], [30.8, "facepalm", "worried"]])} extra={fryInL} rig={{ lookX: -0.9, lookY: -0.5 }} />
</Town>);

/* ================= S14 31.5–33.95 "And the dog wanted its fry back." ================= */
export const S14 = ({ t }: Ctx) => { const ang = sm(seg(t, 31.9, 32.4));
  return (<Town t={t} dog={<Dog t={t} angry={ang} />}>
    <Cam t={t} keys={[K(31.5, [5.7, 1.5, -5.25], [-0.6, 1.55, -4.6], 46), K(34.0, [5.4, 1.5, -5.15], [-0.6, 1.6, -4.6], 42)]} />
    <Hero t={t} b={beats(t, [[31.5, "idle", "worried"], [32.3, "scaredShake", "scared"]])} extra={fryInL} rig={{ lookX: 0.9 }} />
  </Town>); };

/* ================= S15 33.9–39.0 run, grab the pencil, draw a pause button -> loops into S1 ================= */
export const S15 = ({ t }: Ctx) => {
  const run = seg(t, 33.95, 35.35), p = lerp3([2.3, SW, -4.4], H, sm(run));
  const dogP: V3 = t < 35.35 ? lerp3([4.6, SW, -4.7], [2.0, SW, -4.7], seg(t, 33.95, 35.35)) : lerp3([2.0, SW, -4.7], [1.45, SW, -4.7], sm(seg(t, 35.35, 36.4)));
  const b = t < 35.35 ? { action: "run" as ActionName, t0: 33.95, face: "scared" as Face } : beats(t, [[35.35, "drawInAir", "determined"], [37.2, "idle", "smirk"]]);
  const end = HP, cam: Key[] = t < 36.9 ? [K(33.9, [3.2, 2.0, 4.6], [1.9, 1.3, -4.6], 52), K(36.9, [1.4, 1.8, 3.2], [0.0, 1.6, -4.6], 48)] : [{ ...K(36.9, [1.4, 1.8, 3.2], [0.0, 1.6, -4.6], 48) }, { ...end, t: 38.5 }];
  return (<Town t={t} dog={<Dog t={t} p={dogP} angry={1} run={t < 36.2 ? 1 : 0} />}>
    <Cam t={t} keys={cam} />
    {t >= 35.35 ? <PauseButton t={t} t0={35.55} /> : null}
    <Hero t={t} p={p} b={b} dir={-1} move={false} prop={t >= 35.0 && t < 37.2 ? "pencil" : null} extra={t < 35.0 ? fryInL : undefined} rig={{ lookX: t < 35.35 ? -0.4 : 0.7, ...(t > 38.3 ? { blink: 0 } : {}) }} />
  </Town>); };
