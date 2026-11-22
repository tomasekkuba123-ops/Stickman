// EP08 "What If Stickman Drew a Million Dollars?" — engine kit v15.
import React from "react";
import { Cam, Key } from "../../style/extra";
import { SGlow, Path2 } from "../../style/sky";
import { V3 } from "../../style/kit";
import { World, Birds, Butterflies, DustMotes } from "../../kit/world";
import { Stickman, Townsperson, ActionName } from "../../kit/character";
import { Face, RigOut } from "../../style/stickman";
import { DrawItReal, MagicSparkles, DustImpact, Rain } from "../../kit/fx";
import { PuffRing } from "../../kit/puff";
import { foregroundShot, heroShot } from "../../kit/camera";
import { Street, STREET, PizzaShop, PriceBoard, MoneyStack, MoneyPile, MoneyRain, MoneyBlanket, Banknote, GoldCar, GoldToilet, GoldMansion, AppleTree, Apple, SeedSprout, Garden8, PencilProp, SoldSign } from "../../kit/sets2";
import { drawPencil } from "../../style/props2d";

export type Ctx = { t: number; f: number };
const TAU = Math.PI * 2;
const K = (t: number, pos: V3, look: V3, fov = 52): Key => ({ t, pos, look, fov });
const shot = (t: number, list: [number, Key[]][]) => { let k = list[0][1]; for (const [t0, ks] of list) if (t >= t0) k = ks; return k; };
const seg = (t: number, a: number, b: number) => Math.max(0, Math.min(1, (t - a) / (b - a)));
const eo = (x: number) => 1 - (1 - x) ** 3, eio = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);
const beats = (t: number, list: [number, ActionName, Face?][]) => { let b = list[0]; for (const x of list) if (t >= x[0]) b = x; return { action: b[1], t0: b[0], face: b[2] }; };
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const SW = 0.24; // sidewalk height

/* drawn shapes (normalised paths) */
const RECT = (x0: number, y0: number, x1: number, y1: number): Path2 => [[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]];
const ELL = (cx: number, cy: number, rx: number, ry: number): Path2 => Array.from({ length: 33 }, (_, i) => [cx + Math.cos((i / 32) * TAU) * rx, cy + Math.sin((i / 32) * TAU) * ry] as [number, number]);
const BILL: Path2[] = [RECT(0.04, 0.08, 0.96, 0.92), RECT(0.12, 0.2, 0.88, 0.8), ELL(0.5, 0.5, 0.14, 0.25), [[0.55, 0.35], [0.45, 0.38], [0.45, 0.48], [0.55, 0.52], [0.55, 0.62], [0.45, 0.65]], [[0.5, 0.28], [0.5, 0.72]]];
const CAR: Path2[] = [[[0.04, 0.75], [0.04, 0.5], [0.25, 0.48], [0.35, 0.25], [0.7, 0.25], [0.8, 0.48], [0.96, 0.52], [0.96, 0.75], [0.04, 0.75]], ELL(0.25, 0.78, 0.09, 0.15), ELL(0.75, 0.78, 0.09, 0.15)];
const HOUSE: Path2[] = [[[0.1, 0.95], [0.1, 0.45], [0.9, 0.45], [0.9, 0.95], [0.1, 0.95]], [[0.04, 0.47], [0.5, 0.08], [0.96, 0.47]], RECT(0.42, 0.68, 0.58, 0.95), RECT(0.2, 0.55, 0.32, 0.67), RECT(0.68, 0.55, 0.8, 0.67)];
const TOILET: Path2[] = [RECT(0.25, 0.05, 0.75, 0.38), [[0.12, 0.42], [0.88, 0.42], [0.8, 0.62], [0.62, 0.72], [0.62, 0.95], [0.38, 0.95], [0.38, 0.72], [0.2, 0.62], [0.12, 0.42]]];
const SEED: Path2[] = [ELL(0.5, 0.55, 0.22, 0.32), [[0.5, 0.25], [0.55, 0.08], [0.7, 0.04]]];
const pencilR = (gleam = 0, up = false) => (c: CanvasRenderingContext2D, o: RigOut, W: number, H: number) => { const a = up ? Math.PI + 0.3 : 0.5, L = H * 0.13, bx = Math.sin(a), by = -Math.cos(a); void W; drawPencil(c, o.gloveR[0] - bx * L * 0.42, o.gloveR[1] - by * L * 0.42, L, a, gleam); };
const holdBill = (c: CanvasRenderingContext2D, o: RigOut) => { c.save(); c.translate(o.gloveR[0], o.gloveR[1] - 18); c.rotate(-0.2); c.fillStyle = "#8fd88a"; c.fillRect(-46, -24, 92, 48); c.lineWidth = 5; c.strokeStyle = "#101018"; c.strokeRect(-46, -24, 92, 48); c.fillStyle = "#1f6a3a"; c.font = "900 34px Inter"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("$", 0, 2); c.restore(); };
const holdApple = (bite = 0) => (c: CanvasRenderingContext2D, o: RigOut) => { c.save(); c.translate(o.gloveR[0], o.gloveR[1] - 26); c.fillStyle = "#e5263a"; c.beginPath(); c.arc(0, 0, 30, 0, TAU); c.fill(); c.lineWidth = 6; c.strokeStyle = "#101018"; c.stroke(); if (bite > 0) { c.fillStyle = "#fff4d8"; c.beginPath(); c.arc(24, -6, 16 * bite, 0, TAU); c.fill(); } c.fillStyle = "#5a3a1a"; c.fillRect(-2, -42, 5, 14); c.restore(); };

/* ============ S1 0–3.4 HOOK: buried up to the neck in glowing banknotes ============ */
const P1: V3 = [0, 0, 2.5];
export const S1 = ({ t }: Ctx) => (<World preset="morning" t={t}>
  <Cam t={t} keys={[K(0, [0.7, 2.2, 6.4], [0.1, 1.6, 2.2], 52), K(3.5, [0.6, 2.2, 5.8], [0.1, 1.65, 2.2], 48)]} />
  <Street t={t} mood="morning" />
  <MoneyPile p={[0, SW, 0.6]} r={3.4} h={1.9} n={900} glow={1} />
  <Stickman p={[P1[0], -0.55, P1[2]]} t={t} action="laugh" t0={0} face="laugh" shadow={false} rig={{ ikR: [380, 1050], ikKR: 1, handR: "open" }} extra={holdBill} />
  <MoneyRain c={[0, 0, 1.5]} t={t} area={[8, 4]} top={6} n={18} />
</World>);

/* ============ S2 3.4–10.3 one bill, another, a stack taller than him — it topples ============ */
const P2: V3 = [-1.6, SW, 3.6], B1: V3 = [0.2, 1.7, 3.9], STK: V3 = [0.6, SW, 2.6];
const K2: [number, Key[]][] = [[3.4, heroShot(P2, 3.4, 5.0, { yaw: 0.45, dist: 5.4 })], [5.0, [K(5.0, [-0.6, 0.9, 8.2], [-0.4, 2.0, 2.6], 56), K(6.9, [-0.4, 1.0, 7.6], [-0.4, 2.4, 2.6], 56)]],
  [6.9, foregroundShot(P2, [STK[0], 2.5, STK[2]], 6.9, 8.6, { side: -0.6, dist: 5.2, fov: 58 })], [8.6, [K(8.6, [-4.6, 1.6, 9.0], [-0.2, 1.6, 3], 58), K(10.4, [-4.4, 1.6, 8.6], [-0.2, 1.4, 3], 58)]]];
export const S2 = ({ t }: Ctx) => { const h = 0.024 + 3.4 * eo(seg(t, 6.2, 8.3)), top = seg(t, 9.0, 9.6);
  const b = beats(t, [[3.4, "drawInAir"], [4.4, "thumbsUp", "grin"], [4.95, "drawInAir"], [5.6, "celebrate"], [6.2, "drawInAir"], [8.3, "laugh"], [9.0, "freezeShock", "surprised"], [9.6, "scaredShake"]]);
  return (<World preset="morning" t={t}>
    <Cam t={t} keys={shot(t, K2)} impacts={[[9.6, 0.03]]} />
    <Street t={t} mood="morning" />
    <DrawItReal t={t} t0={3.55} p={[B1[0], B1[1] - 0.3, B1[2]]} size={[1.2, 0.6]} paths={BILL} fill="#8fd88a" draw={0.55} fillDur={0.15} pop={0.3}><Banknote p={[0, 0.3, 0]} rot={[Math.PI / 2, 0, 0]} s={1.2} glow={1} /></DrawItReal>
    <DrawItReal t={t} t0={4.95} p={[B1[0] + 0.3, B1[1] - 0.95, B1[2] + 0.1]} size={[1.2, 0.6]} paths={BILL} fill="#8fd88a" draw={0.45} fillDur={0.12} pop={0.3}><Banknote p={[0, 0.3, 0]} rot={[Math.PI / 2, 0, 0.2]} s={1.2} glow={1} /></DrawItReal>
    {t > 6.1 ? <MoneyStack p={STK} h={h} t={t} topple={eio(top)} /> : null}
    {t > 9.45 ? <><MoneyRain c={[STK[0] + 2.4, 0, STK[2]]} t={t} area={[4, 2]} top={3} n={26} /><PuffRing c={[STK[0] + 2.6, SW, STK[2]]} t={t} t0={9.55} n={10} r={2.2} size={0.5} color="#e8f0d8" /></> : null}
    <Stickman p={P2} t={t} action={b.action} t0={b.t0} face={b.face} prop={b.action === "drawInAir" ? "pencil" : null} rig={b.action === "drawInAir" ? { ikR: [520, 640], ikKR: 1, handR: "hold", lookX: 0.8 } : { lookX: 0.6 }} />
  </World>); };

/* ============ S3 10.3–16.8 buying spree: a pizza, the pizza shop, the whole street (fast cuts) ============ */
const P3: V3 = [-2.0, SW, -4.6], CHEF: V3 = [0.2, SW, -5.6];
const K3: [number, Key[]][] = [[10.3, [K(10.3, [-0.1, 1.9, 0.6], [-1.2, 1.7, -5.0], 52), K(11.6, [-0.2, 1.9, 0.2], [-1.2, 1.7, -5.0], 50)]],
  [11.6, foregroundShot(P3, [0, 5.0, -9], 11.6, 13.3, { side: -0.45, dist: 5.0, fov: 60, k: 0.5 })], [13.3, [K(13.3, [-6.5, 2.0, 1.4], [-2.4, 2.6, -6], 60), K(14.5, [-6.2, 2.1, 1.0], [-2.2, 2.8, -6], 60)]],
  [14.5, heroShot(P3, 14.5, 15.6, { yaw: -0.5, dist: 5.0 })], [15.6, [K(15.6, [2.6, 1.5, 0.9], [-1.4, 3.0, -6], 62), K(16.9, [2.4, 1.6, 0.4], [-1.4, 3.2, -6], 62)]]];
export const S3 = ({ t }: Ctx) => { const b = beats(t, [[10.3, "hold", "grin"], [11.6, "point", "smile"], [12.3, "thumbsUp", "grin"], [13.4, "celebrate"], [14.5, "laugh"], [15.6, "wave", "laugh"]]);
  return (<World preset="day" t={t}>
    <Cam t={t} keys={shot(t, K3)} />
    <Street t={t} mood="day" sold={seg(t, 13.6, 16.5)} />
    <SoldSign p={[0.4, 2.6, -6.7]} k={seg(t, 12.2, 12.5)} s={1.6} />
    <Townsperson who="chef" p={CHEF} t={t} action={t < 11.6 ? "hold" : "wave"} t0={10.3} face="smile" seed={3} />
    {t < 11.6 ? <mesh position={[-0.9, 1.85, -5.0]}><cylinderGeometry args={[0.5, 0.5, 0.06, 24]} /><meshToonMaterial color="#ffc25a" /></mesh> : null}
    <Stickman p={P3} t={t} action={b.action} t0={b.t0} face={b.face} extra={t < 11.0 ? holdBill : undefined} rig={{ lookX: 0.5 }} />
    <MoneyRain c={[-2, 0, -4]} t={t} area={[6, 3]} top={5} n={t > 13.4 ? 16 : 0} />
  </World>); };

/* ============ S4 16.8–25.0 gold car, gold house, gold toilet — just because he could ============ */
const P4: V3 = [-0.4, 0, 3.0], CARP: V3 = [-4.2, 0, 1.2], TOI: V3 = [3.0, 0, 1.6];
const K4: [number, Key[]][] = [[16.8, foregroundShot(P4, add(CARP, [0, 1, 0]), 16.8, 18.2, { side: 0.5, dist: 5.2, fov: 58 })], [18.2, [K(18.2, [-1.6, 1.2, 11.5], [0.2, 3.6, -4], 60), K(19.3, [-1.7, 1.3, 11.0], [0.2, 4.0, -4], 60)]],
  [19.3, [K(19.3, [0.2, 1.9, 8.8], [0.7, 1.6, 2.2], 56), K(21.6, [0.1, 1.9, 8.2], [0.7, 1.6, 2.2], 54)]], [21.6, [K(21.6, [1.6, 1.9, 8.4], [0.3, 1.6, 2.4], 54), K(23.3, [1.4, 1.9, 7.8], [0.3, 1.6, 2.4], 52)]], [23.3, heroShot(P4, 23.3, 25.1, { yaw: 0.6, dist: 5.2 })]];
export const S4 = ({ t }: Ctx) => { const b = beats(t, [[16.8, "drawInAir"], [17.8, "point", "grin"], [18.2, "drawInAir"], [19.2, "drawInAir"], [20.1, "laugh"], [21.7, "thumbsUp", "smirk"], [23.3, "celebrate"]]);
  return (<World preset="day" t={t} rays={0.08}>
    <Cam t={t} keys={shot(t, K4)} />
    <Garden8 t={t} />
    <DrawItReal t={t} t0={17.0} p={CARP} size={[3.4, 1.8]} paths={CAR} fill="#ffc83a" draw={0.55} fillDur={0.12} pop={0.3}><GoldCar p={[0, 0, 0]} t={t} /></DrawItReal>
    <DrawItReal t={t} t0={18.3} p={[0, 0, -9]} size={[12, 9]} paths={HOUSE} fill="#ffd86a" draw={0.5} fillDur={0.12} pop={0.35}><GoldMansion p={[0, 0, 0]} t={t} s={0.9} /></DrawItReal>
    <DrawItReal t={t} t0={19.45} p={TOI} size={[1.6, 2.2]} paths={TOILET} fill="#ffc83a" draw={0.5} fillDur={0.12} pop={0.3}><GoldToilet p={[0, 0, 0]} t={t} sparkle={t > 20.3 ? 1 : 0.3} lid={t > 22.3 && t < 23.0 ? Math.sin((t - 22.3) / 0.7 * Math.PI) : 0} /></DrawItReal>
    <Stickman p={P4} t={t} action={b.action} t0={b.t0} face={b.face} prop={b.action === "drawInAir" ? "pencil" : null} rig={b.action === "drawInAir" ? { ikR: [t < 18.2 ? -520 : 520, 640], ikKR: 1, handR: "hold" } : { lookX: 0.5 }} />
  </World>); };

/* ============ S5 25.0–27.6 but people noticed (neighbors peek over the fence) ============ */
const K5: [number, Key[]][] = [[25.0, [K(25.0, [-1.8, 2.6, 15.2], [-0.6, 1.5, 4.0], 52), K(26.2, [-1.7, 2.6, 14.6], [-0.6, 1.5, 4.0], 50)]], [26.2, heroShot([0.4, 0, 3.4], 26.2, 27.7, { yaw: -0.3, dist: 5.0 })]];
export const S5 = ({ t }: Ctx) => (<World preset="day" t={t}>
  <Cam t={t} keys={shot(t, K5)} />
  <Garden8 t={t} /><GoldMansion p={[0, 0, -9]} t={t} s={0.9} /><GoldCar p={CARP} t={t} /><GoldToilet p={TOI} t={t} />
  {([["neighbor", -4.4], ["kid1", -2.6], ["granny", -1.2], ["mailman", 1.4]] as [string, number][]).map(([w, x], i) => <Townsperson key={i} who={w as "neighbor"} p={[x, 0, 8.0]} t={t} action="idle" face="surprised" seed={i + 2} rig={{ view: "back" }} />)}
  <Stickman p={[0.4, 0, 3.4]} t={t} action={t < 26.2 ? "idle" : "think"} t0={26.2} face={t < 26.2 ? "smirk" : "worried"} rig={{ lookX: t < 26.2 ? 0.4 : -0.8, lookY: 0.2 }} />
</World>);

/* ============ S6 27.6–34.6 neighbor borrows a pencil, then the mailman, then the whole town ============ */
const P6: V3 = [-1.0, SW, 4.4];
const K6: [number, Key[]][] = [[27.6, [K(27.6, [2.6, 1.9, 9.6], [-0.2, 1.6, 4.4], 50), K(29.6, [2.4, 1.9, 9.0], [-0.2, 1.6, 4.4], 48)]], [29.6, [K(29.6, [-4.6, 1.9, 9.4], [-0.4, 1.6, 4.2], 50), K(31.1, [-4.4, 1.9, 8.9], [-0.4, 1.6, 4.2], 48)]],
  [31.1, foregroundShot(P6, [4.5, 1.8, -4.4], 31.1, 33.0, { side: 0.15, dist: 5.2, fov: 62, k: 0.55 })], [33.0, [K(33.0, [6.0, 2.4, 9.8], [-1.0, 1.8, 2.0], 58), K(34.7, [5.6, 2.5, 9.2], [-1.0, 1.9, 2.0], 58)]]];
const CROWD: [string, V3][] = [["kid1", [3, SW, -4.4]], ["granny", [6, SW, -4.6]], ["worker", [-5, SW, -4.4]], ["teen", [9, SW, 4.6]], ["kid2", [-7, SW, 4.4]], ["chef", [0.4, SW, -5.4]]];
export const S6 = ({ t }: Ctx) => { const give1 = seg(t, 28.3, 28.9), give2 = seg(t, 29.9, 30.4), town = t > 31.1;
  const b = beats(t, [[27.6, "hold", "smile"], [28.4, "point", "neutral"], [29.9, "hold", "worried"], [30.6, "facepalm"], [31.2, "scaredShake"], [33.0, "think", "worried"]]);
  return (<World preset="day" t={t}>
    <Cam t={t} keys={shot(t, K6)} />
    <Street t={t} mood="day" />
    <Townsperson who="neighbor" p={[1.4 - give1 * 0.5, SW, 4.6]} t={t} action={give1 > 0.9 ? "walk" : "point"} t0={28.9} dir={1} face="grin" seed={2} extra={give1 > 0.5 ? pencilR() : undefined} />
    <Townsperson who="mailman" p={[t < 29.6 ? 9 : 1.6 - give2 * 0.3, SW, 3.8]} t={t} action={t < 29.6 ? "walk" : give2 > 0.9 ? "drawInAir" : "point"} t0={29.6} dir={-1} face="grin" seed={4} extra={give2 > 0.5 ? pencilR() : undefined} />
    {town ? CROWD.map(([w, p], i) => <React.Fragment key={i}><Townsperson who={w as "kid1"} p={p} t={t} action="drawInAir" t0={31.1 + i * 0.1} face="grin" seed={i + 5} extra={pencilR()} />
      <DrawItReal t={t} t0={31.5 + i * 0.25} p={add(p, [0.9, 1.5, 0.3])} size={[1.0, 0.5]} paths={BILL} fill="#8fd88a" draw={0.4} fillDur={0.1} pop={0.25}><Banknote p={[0, 0.25, 0]} rot={[Math.PI / 2, 0, 0]} glow={1} /></DrawItReal></React.Fragment>) : null}
    <Stickman p={P6} t={t} action={b.action} t0={b.t0} face={b.face} extra={t < 28.6 ? pencilR() : undefined} rig={{ lookX: t < 31 ? 0.7 : 0.3 }} />
  </World>); };

/* ============ S7 34.6–38.2 by lunchtime everyone was a millionaire — money falls like snow ============ */
const P7: V3 = [-1.2, SW, 4.2];
const K7: [number, Key[]][] = [[34.6, [K(34.6, [-3.6, 1.2, 10.6], [-0.4, 2.8, 0], 60), K(36.3, [-3.4, 1.3, 10.0], [-0.4, 3.0, 0], 60)]], [36.3, foregroundShot(P7, [2, 2.4, -2], 36.3, 38.3, { side: -0.4, dist: 5.0, fov: 58 })]];
export const S7 = ({ t }: Ctx) => (<World preset="day" t={t}>
  <Cam t={t} keys={shot(t, K7)} />
  <Street t={t} mood="day" />
  <MoneyRain c={[0, 0, 1]} t={t} area={[20, 12]} top={11} n={90} />
  {CROWD.map(([w, p], i) => <Townsperson key={i} who={w as "kid1"} p={add(p, [0, 0, p[2] < 0 ? 1.2 : -0.6])} t={t} action={i % 2 ? "celebrate" : "laugh"} t0={34.6 + i * 0.13} seed={i + 5} />)}
  <Townsperson who="neighbor" p={[2.4, SW, 4.6]} t={t} action="celebrate" t0={34.8} seed={2} /><Townsperson who="mailman" p={[4.4, SW, 3.8]} t={t} action="laugh" t0={35} seed={4} />
  <Stickman p={P7} t={t} action="idle" face="worried" rig={{ lookX: 0.6, lookY: -0.4 }} extra={pencilR()} />
</World>);

/* ============ S8 38.2–42.5 by dinner a pizza cost $3,000,000 — the price board spins ============ */
const P8: V3 = [-1.4, SW, -3.9], BOARD: V3 = [3.6, 2.4, -5.6];
const K8: [number, Key[]][] = [[38.2, foregroundShot(P8, [0, 4.6, -9], 38.2, 39.5, { side: -0.4, dist: 5.0, fov: 58, k: 0.45 })], [39.5, [K(39.5, [1.2, 2.4, 2.4], [2.6, 2.2, -5.6], 54), K(40.6, [1.3, 2.4, 1.8], [2.6, 2.2, -5.6], 52)]],
  [40.6, heroShot(P8, 40.6, 41.5, { yaw: 0.25, dist: 4.6 })], [41.5, foregroundShot(P8, BOARD, 41.5, 42.6, { side: 0.6, dist: 5.0, fov: 58, k: 0.5 })]];
export const S8 = ({ t }: Ctx) => { const b = beats(t, [[38.2, "point", "smile"], [39.6, "idle", "surprised"], [40.6, "freezeShock", "surprised"], [41.5, "scaredShake"]]);
  return (<World preset="sunset" t={t}>
    <Cam t={t} keys={shot(t, K8)} impacts={[[40.65, 0.03]]} />
    <Street t={t} mood="dinner" />
    <PriceBoard p={BOARD} t={t} t0={39.6} t1={40.6} from={12} to={3000000} s={0.9} />
    <Townsperson who="chef" p={[1.8, SW, -5.0]} t={t} action="point" t0={39.5} face="grin" seed={3} />
    <Townsperson who="kid2" p={[-3.6, SW, -4.6]} t={t} action={t > 40.6 ? "freezeShock" : "idle"} t0={40.6} face="surprised" seed={6} />
    <Stickman p={P8} t={t} action={b.action} t0={b.t0} face={b.face} rig={{ lookX: 0.7 }} />
  </World>); };

/* ============ S9 42.5–47.2 by midnight people used money as blankets (moonlight) ============ */
const P9: V3 = [-0.4, SW, 4.3];
const K9: [number, Key[]][] = [[42.5, [K(42.5, [3.2, 1.6, 10.6], [0.0, 1.3, 4.4], 58), K(44.6, [3.0, 1.6, 10.0], [0.0, 1.3, 4.4], 58)]], [44.6, foregroundShot(P9, [3.0, 0.6, 4.8], 44.6, 47.3, { side: 0.6, dist: 5.0, fov: 56, k: 0.35 })]];
export const S9 = ({ t }: Ctx) => (<World preset="night" t={t}>
  <Cam t={t} keys={shot(t, K9)} />
  <Street t={t} mood="night" />
  {[[2.4, 6.0, 0.4], [-2.6, 5.4, -0.2], [5.6, 5.0, 0.1], [-6.4, -4.6, 3.0], [1.0, -4.6, 3.1], [0.4, 7.0, 0.2]].map(([x, z, r], i) => <MoneyBlanket key={i} p={[x, SW, z]} rotY={r} t={t + i} s={0.9} />)}
  <MoneyBlanket p={[-5, 0.7, -4.6]} rotY={0} t={t} s={0.7} />
  <SGlow p={[-30, 40, -90]} r={10} color="#fffbe0" o={0.9} /><ambientLight intensity={0.5} color="#a8c0ff" /><pointLight position={[1, 5, 6]} intensity={1.4} distance={16} color="#c8d8ff" />
  <Stickman p={P9} t={t} action={t < 44.6 ? "tiptoe" : "idle"} t0={42.6} dir={1} move={false} face="worried" rig={{ lookX: 0.6, lookY: 0.5 }} />
</World>);

/* ============ S10 47.2–55.4 his giant pile of cash ... was worth ... nothing ============ */
const P10: V3 = [-2.0, 0, 3.0], PILE: V3 = [1.4, 0, -0.4];
const K10: [number, Key[]][] = [[47.2, foregroundShot(P10, add(PILE, [0, 2.4, 0]), 47.2, 49.4, { side: -0.5, dist: 5.2, fov: 58 })], [49.4, [K(49.4, [-1.0, 1.0, 9.8], [0.0, 2.6, 0.5], 58), K(51.1, [-1.2, 1.1, 9.2], [0.0, 2.8, 0.5], 58)]],
  [51.1, heroShot(P10, 51.1, 53.2, { yaw: 0.3, dist: 4.6 })], [53.2, foregroundShot(P10, add(PILE, [0, 1.6, 0]), 53.2, 55.5, { side: 0.55, dist: 5.0, fov: 56 })]];
export const S10 = ({ t }: Ctx) => { const dull = seg(t, 52.8, 53.6); const b = beats(t, [[47.2, "idle", "smile"], [48.3, "point", "smirk"], [49.4, "think"], [51.1, "idle", "worried"], [53.3, "facepalm"]]);
  return (<World preset="night" t={t}>
    <Cam t={t} keys={shot(t, K10)} />
    <Garden8 t={t} night />
    <MoneyPile p={PILE} r={3.2} h={3.4} n={1100} glow={1 - dull} seed={4} />
    {t > 53.3 ? [0, 1, 2].map((i) => { const u = (t - 53.3) * 0.5 + i * 0.2; return <Banknote key={i} p={[PILE[0] - u * 4, 3.2 + Math.sin(u * 3 + i) * 0.5, PILE[2] + u * 2]} rot={[u * 4, u * 3, u * 2]} s={0.6} />; }) : null}
    <Stickman p={P10} t={t} action={b.action} t0={b.t0} face={b.face} rig={{ lookX: 0.7, lookY: -0.3 }} />
  </World>); };

/* ============ S11 55.4–58.4 he needed something nobody could draw (panic) ============ */
const P11: V3 = [-0.6, 0, 2.6];
export const S11 = ({ t }: Ctx) => (<World preset="night" t={t}>
  <Cam t={t} keys={shot(t, [[55.4, heroShot(P11, 55.4, 56.9, { yaw: -0.4, dist: 5.0 })], [56.9, heroShot(P11, 56.9, 58.5, { yaw: 0.6, dist: 4.4, y: 1.2 })]])} />
  <Garden8 t={t} night /><MoneyPile p={PILE} r={3.2} h={3.4} n={1100} glow={0} seed={4} />
  <Stickman p={P11} t={t} action="panic" t0={55.4} face="scared" move={false} />
</World>);

/* ============ S12 58.4–64.9 he thought. and thought. and drew a tiny seed ============ */
const P12: V3 = [-0.6, 0, 2.6];
export const S12 = ({ t }: Ctx) => { const b = beats(t, [[58.4, "think"], [59.8, "think"], [60.9, "drawInAir", "determined"], [62.4, "hold", "smile"]]);
  return (<World preset="night" t={t}>
    <Cam t={t} keys={shot(t, [[58.4, heroShot(P12, 58.4, 59.8, { yaw: 0.2, dist: 4.4 })], [59.8, heroShot(P12, 59.8, 60.9, { yaw: -0.7, dist: 4.2, y: 1.3 })], [60.9, [K(60.9, [0.9, 1.9, 7.6], [-0.1, 1.6, 2.8], 50), K(64.9, [0.7, 1.9, 7.0], [-0.1, 1.6, 2.8], 48)]]])} />
    <Garden8 t={t} night /><MoneyPile p={PILE} r={3.2} h={3.4} n={1100} glow={0} seed={4} />
    <DrawItReal t={t} t0={61.4} p={[0.45, 1.85, 3.0]} size={[0.5, 0.5]} paths={SEED} fill="#c8843a" draw={0.6} fillDur={0.15} pop={0.3}><mesh position={[0, 0.25, 0]} scale={[0.14, 0.2, 0.14]}><sphereGeometry args={[1, 16, 12]} /><meshToonMaterial color="#a8643a" /></mesh></DrawItReal>
    {t > 62.3 ? <><SGlow p={[0.45, 2.1, 3.0]} r={0.6} color="#fff4a0" o={0.6} /><MagicSparkles t={t} c={[0.45, 2.1, 3.0]} area={[0.6, 0.6, 0.3]} n={8} /></> : null}
    <Stickman p={P12} t={t} action={b.action} t0={b.t0} face={b.face} prop={b.action === "drawInAir" ? "pencil" : null} rig={b.action === "drawInAir" ? { ikR: [380, 760], ikKR: 1, handR: "hold" } : b.action === "hold" ? { ikR: [360, 740], ikKR: 1, handR: "open", lookX: 0.6, lookY: 0.3 } : {}} />
  </World>); };

/* ============ S13 64.9–68.9 planted it, watered it, waited ============ */
const SEEDP: V3 = [0.6, 0, 1.8], P13: V3 = [-0.8, 0, 2.6];
export const S13 = ({ t }: Ctx) => { const b = beats(t, [[64.9, "pickUp", "determined"], [66.0, "hold", "smile"], [67.1, "think"]]);
  return (<World preset={t < 67.1 ? "sunset" : "night"} t={t}>
    <Cam t={t} keys={shot(t, [[64.9, heroShot(P13, 64.9, 66.0, { yaw: 0.5, dist: 4.6, y: 1.4 })], [66.0, foregroundShot(P13, SEEDP, 66.0, 67.1, { side: -0.5, dist: 4.8, fov: 52, k: 0.3 })], [67.1, [K(67.1, [0.4, 1.7, 7.6], [-0.2, 1.4, 2.4], 52), K(68.9, [0.3, 1.8, 7.0], [-0.2, 1.4, 2.4], 50)]]])} />
    <Garden8 t={t} night={t > 67.1} />
    <SeedSprout p={SEEDP} k={seg(t, 65.6, 66.2) * 0.2 + seg(t, 67.5, 68.8) * 0.5} />
    <Rain c={[SEEDP[0] + 0.3, 0, SEEDP[2]]} t={t} area={[0.5, 0.3]} top={1.0} ground={0.05} n={14} on={t > 66.2 && t < 67.0 ? 1 : 0} />
    <Stickman p={P13} t={t} action={b.action} t0={b.t0} face={b.face} rig={b.action === "hold" ? { ikR: [520, 460], ikKR: 1, handR: "hold", lean: 10, lookX: 0.7, lookY: 0.6 } : { lookX: 0.6, lookY: 0.4 }}
      extra={b.action === "hold" ? (c, o) => { c.save(); c.translate(o.gloveR[0] + 20, o.gloveR[1]); c.rotate(0.5); c.fillStyle = "#3a8fe0"; c.fillRect(-40, -30, 80, 60); c.lineWidth = 6; c.strokeStyle = "#101018"; c.strokeRect(-40, -30, 80, 60); c.beginPath(); c.moveTo(40, -10); c.lineTo(90, -40); c.stroke(); c.restore(); } : undefined} />
  </World>); };

/* ============ S14 68.9–73.9 everyone laughed ... until morning ============ */
const K14: [number, Key[]][] = [[68.9, [K(68.9, [-1.2, 1.8, 13.4], [-0.6, 1.6, 7.6], 52), K(70.6, [-1.4, 1.8, 12.8], [-0.6, 1.6, 7.6], 50)]], [70.6, [K(70.6, [0.4, 1.6, 7.6], [-0.2, 1.3, 2.4], 52), K(73.9, [0.3, 1.7, 6.8], [-0.2, 1.4, 2.4], 50)]]];
export const S14 = ({ t }: Ctx) => { const morning = t > 71.6;
  return (<World preset={morning ? "morning" : "night"} t={t} rays={morning ? 0.1 : 0}>
    <Cam t={t} keys={shot(t, K14)} />
    <Garden8 t={t} night={!morning} /><SeedSprout p={SEEDP} k={0.7} />
    {t < 70.6 ? ([["neighbor", -3.2], ["mailman", -1.4], ["granny", 0.4], ["kid1", 2.0]] as [string, number][]).map(([w, x], i) => <Townsperson key={i} who={w as "neighbor"} p={[x, 0, 8.0]} t={t} action="laugh" t0={68.9 + i * 0.1} seed={i + 2} />) : null}
    <Stickman p={t < 70.6 ? [-0.8, 0, 9.4] : P13} t={t} action={t < 70.6 ? "facepalm" : morning ? "freezeShock" : "idle"} t0={t < 70.6 ? 69.3 : 71.7} face={t < 70.6 ? "worried" : morning ? "surprised" : "neutral"} rig={t > 70.6 && !morning ? { blink: 1, headTilt: 14, squash: -0.05 } : { lookX: 0.4 }} />
  </World>); };

/* ============ S15 73.9–79.8 a tree, full of real juicy apples (fast-motion growth) ============ */
const TREE: V3 = [0.8, 0, 0.6], P15: V3 = [-1.6, 0, 3.0];
const K15: [number, Key[]][] = [[73.9, [K(73.9, [-2.6, 1.2, 10.6], [0.4, 3.4, 0.6], 60), K(75.6, [-2.8, 1.4, 10.0], [0.4, 3.8, 0.6], 60)]], [75.6, foregroundShot(P15, [TREE[0], 4.2, TREE[2]], 75.6, 77.6, { side: -0.4, dist: 5.2, fov: 60, k: 0.5 })], [77.6, heroShot(P15, 77.6, 79.9, { yaw: 0.4, dist: 4.8 })]];
export const S15 = ({ t }: Ctx) => { const grow = eo(seg(t, 74.1, 75.4)), apples = seg(t, 75.8, 77.0);
  return (<World preset="morning" t={t} rays={0.12}>
    <Cam t={t} keys={shot(t, K15)} impacts={[[74.15, 0.02]]} />
    <Garden8 t={t} /><Butterflies t={t} c={[0, 2.4, 1]} area={3} /><Birds t={t} c={[0, 9, -8]} r={6} />
    <AppleTree p={TREE} grow={grow} t={t} apples={apples} s={1.15} />
    {t > 74.0 && t < 77.4 ? <MagicSparkles t={t} c={[TREE[0], 3.2, TREE[2]]} area={[2.6, 3, 1]} n={28} /> : null}
    <PuffRing c={TREE} t={t} t0={74.15} n={10} r={1.6} size={0.4} color="#d8c8a8" />
    <Stickman p={P15} t={t} action={t < 75.6 ? "freezeShock" : t < 77.6 ? "point" : "celebrate"} t0={t < 75.6 ? 74.1 : t < 77.6 ? 75.6 : 77.6} face={t < 77.6 ? "surprised" : undefined} rig={{ lookX: 0.6, lookY: -0.5 }} />
  </World>); };

/* ============ S16 79.8–88.3 the whole town wants to trade: a gold car for one apple, a gold house for two ============ */
const P16: V3 = [-1.2, 0, 4.2];
const QUEUE: [string, V3][] = [["neighbor", [1.0, 0, 5.4]], ["mailman", [2.4, 0, 6.6]], ["granny", [3.8, 0, 7.8]], ["kid1", [5.2, 0, 9.0]], ["worker", [6.6, 0, 10.2]], ["teen", [8.0, 0, 11.4]]];
const K16: [number, Key[]][] = [[79.8, foregroundShot(P16, [4.4, 1.4, 8.4], 79.8, 82.8, { side: 0.55, dist: 5.2, fov: 58, k: 0.45 })], [82.8, foregroundShot(P16, [1.0, 1.4, 5.4], 82.8, 84.8, { side: 0.8, dist: 5.0, fov: 56, k: 0.5 })], [84.8, foregroundShot(P16, [2.6, 1.6, 6.6], 84.8, 86.6, { side: -0.6, dist: 5.0, fov: 56, k: 0.5 })], [86.6, heroShot(P16, 86.6, 88.4, { yaw: 0.3, dist: 4.8 })]];
export const S16 = ({ t }: Ctx) => { const b = beats(t, [[79.8, "freezeShock", "surprised"], [80.9, "idle", "smile"], [83.3, "thumbsUp", "grin"], [85.2, "point", "smirk"], [86.6, "laugh"]]);
  return (<World preset="morning" t={t}>
    <Cam t={t} keys={shot(t, K16)} />
    <Garden8 t={t} /><AppleTree p={TREE} grow={1} t={t} apples={1} s={1.15} />
    <GoldCar p={[3.4, 0, 3.6]} rotY={-0.3} t={t} s={0.9} />
    {QUEUE.map(([w, p], i) => <Townsperson key={i} who={w as "kid1"} p={p} t={t} action={i === 0 && t > 83.2 ? "celebrate" : "hold"} t0={83.2} face={i === 0 && t > 83.2 ? "laugh" : "smile"} seed={i + 3} rig={{ lookX: -0.7 }}
      extra={(c, o) => { c.save(); c.translate(o.gloveR[0] - 10, o.gloveR[1] - 30); if (i === 1) { c.fillStyle = "#ffc83a"; c.beginPath(); c.moveTo(-40, 20); c.lineTo(-40, -10); c.lineTo(0, -40); c.lineTo(40, -10); c.lineTo(40, 20); c.closePath(); c.fill(); c.lineWidth = 6; c.strokeStyle = "#101018"; c.stroke(); } else if (i > 1) { c.fillStyle = "#ffc83a"; c.beginPath(); c.arc(0, 0, 22, 0, TAU); c.fill(); c.lineWidth = 6; c.strokeStyle = "#101018"; c.stroke(); } c.restore(); }} />)}
    {t > 83.4 ? <Apple p={[1.4, 2.2 + Math.sin(t * 6) * 0.05, 5.6]} /> : null}
    {t > 85.5 ? <><Apple p={[2.6, 2.3, 6.8]} /><Apple p={[3.0, 2.2, 6.8]} /></> : null}
    <Stickman p={P16} t={t} action={b.action} t0={b.t0} face={b.face} rig={{ lookX: 0.7 }} extra={t > 80.9 && t < 83.4 ? holdApple(0) : undefined} />
  </World>); };

/* ============ S17 88.3–95.2 he smiled, took a bite... and the apple tasted like pencil ============ */
const P17: V3 = [-0.6, 0, 3.2];
export const S17 = ({ t }: Ctx) => { const bite = seg(t, 89.9, 90.1), chew = t > 90.1 ? Math.sin(t * 16) * 0.03 : 0;
  return (<World preset="morning" t={t}>
    <Cam t={t} keys={shot(t, [[88.3, heroShot(P17, 88.3, 90.4, { yaw: 0.4, dist: 4.8 })], [90.4, heroShot(P17, 90.4, 92.2, { yaw: -0.3, dist: 4.0, y: 1.9 })], [92.2, heroShot(P17, 92.2, 95.3, { yaw: 0.15, dist: 3.8, y: 1.95, push: 0.85 })]])} impacts={[[90.0, 0.012]]} />
    <Garden8 t={t} /><AppleTree p={TREE} grow={1} t={t} apples={1} s={1.15} />
    {t > 93.1 ? [0, 1, 2, 3].map((i) => { const u = ((t - 93.1) * 0.8 + i * 0.2) % 1; return <mesh key={i} position={[P17[0] + 0.3 + Math.sin(i) * 0.4, 2.6 + u * 1.2, P17[2] + 0.3]} rotation={[0, 0, u * 6]}><coneGeometry args={[0.06, 0.16, 6]} /><meshToonMaterial color={i % 2 ? "#ffd23a" : "#f2c38a"} /></mesh>; }) : null}
    <Stickman p={P17} t={t} action="idle" face={t < 89.8 ? "smirk" : t < 92.9 ? "smile" : "worried"} rig={{ ikR: t < 89.8 ? [260, 640] : [120, 780], ikKR: 1, handR: "hold", squash: chew, headTilt: t > 92.9 ? 12 : 0, lookX: t > 92.9 ? 0.6 : 0.2, lookY: t > 92.9 ? -0.4 : 0 }} extra={holdApple(bite)} />
  </World>); };

/* ============ S18 95.2–100 WHAT WOULD YOU DRAW? — he lifts the pencil and starts a new $ bill (loops to the hook pile) ============ */
const P18: V3 = [-0.6, 0, 3.2];
export const S18 = ({ t }: Ctx) => (<World preset="morning" t={t}>
  <Cam t={t} keys={[K(95.2, [0.4, 1.9, 7.4], [-0.2, 1.7, 3.0], 52), K(100, [0.3, 1.9, 6.6], [-0.2, 1.7, 3.0], 48)]} />
  <Garden8 t={t} /><AppleTree p={TREE} grow={1} t={t} apples={1} s={1.15} />
  <DrawItReal t={t} t0={97.4} p={[0.9, 1.6, 3.4]} size={[1.2, 0.6]} paths={BILL} fill="#8fd88a" draw={1.6} fillDur={0.3} pop={0.4}><Banknote p={[0, 0.3, 0]} rot={[Math.PI / 2, 0, 0]} s={1.2} glow={1} /></DrawItReal>
  <Stickman p={P18} t={t} action={t < 97.3 ? "think" : "drawInAir"} t0={t < 97.3 ? 95.2 : 97.3} face={t < 97.3 ? undefined : "smirk"} prop={t < 97.3 ? null : "pencil"} rig={t < 97.3 ? { lookX: 0.4 } : { ikR: [520, 700], ikKR: 1, handR: "hold", lookX: 0.8 }} />
</World>);
void DustImpact; void DustMotes; void PizzaShop; void PencilProp; void STREET;
