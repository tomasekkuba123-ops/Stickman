// EP07 "What If Stickman's Baby Dragon Grew Up Overnight?" — built with the engine kit (v13).
import React from "react";
import * as THREE from "three";
import { Cam, Key, camAt } from "../../style/extra";
import { SGlow, Sparkles } from "../../style/sky";
import { CanvasPlane, INK } from "../../style/toon";
import { V3 } from "../../style/kit";
import { World, HomeSet, HOME, Clouds, Birds, Butterflies, Water } from "../../kit/world";
import { Stickman, Dragon, dragonPoint, DRAGON_PTS, ActionName } from "../../kit/character";
import { Face, Rig } from "../../style/stickman";
import { DragonPose } from "../../style/dragon";
import { gulpAt } from "../../kit/creatures";
import { DrawItReal, PATHS, Fire, Rain, MagicSparkles, DustImpact } from "../../kit/fx";
import { PuffSmoke, PuffRing, CloudPuff } from "../../kit/puff";
import { Cottage, CottageHall, Garden, GardenTable, PancakeStack, Teacup, Town, Mountains, Sea, Island, DragonEgg, COTTAGE } from "../../kit/sets";
import { Path2 } from "../../style/sky";

export type Ctx = { t: number; f: number };
const H = 3, TAU = Math.PI * 2;
const K = (t: number, pos: V3, look: V3, fov = 50, roll = 0): Key => ({ t, pos, look, fov, roll });
const shot = (t: number, list: [number, Key[]][]) => { let k = list[0][1]; for (const [t0, ks] of list) if (t >= t0) k = ks; return k; };
const seg = (t: number, a: number, b: number) => Math.max(0, Math.min(1, (t - a) / (b - a)));
const eio = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2), eo = (x: number) => 1 - (1 - x) ** 3;
const lerp3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const towardCam = (p: V3, cam: V3, d: number): V3 => { const dx = cam[0] - p[0], dz = cam[2] - p[2], n = Math.hypot(dx, dz) || 1; return [p[0] + (dx / n) * d, p[1], p[2] + (dz / n) * d]; };
// one action per beat: [start time, action, face?]
const beats = (t: number, list: [number, ActionName, Face?][]) => { let b = list[0]; for (const x of list) if (t >= x[0]) b = x; return { action: b[1], t0: b[0], face: b[2] }; };


/* FOREGROUND HERO framing (QC rule: Stickman >= 38 % of frame height): camera ~6 units behind/beside Stickman, looking past him at the target */
const fg = (hero: V3, target: V3, t0: number, t1: number, side = 0.5, dist = 6.0, fov = 56, k = 0.38, lift = 1.7): Key[] => {
  const dx = hero[0] - target[0], dz = hero[2] - target[2], n = Math.hypot(dx, dz) || 1, ux = dx / n, uz = dz / n, px = -uz, pz = ux;
  const head: V3 = [hero[0], hero[1] + 1.8, hero[2]], look = lerp3(head, target, k);
  const cam = (d: number, sd: number): V3 => [hero[0] + ux * d + px * sd * d, hero[1] + lift, hero[2] + uz * d + pz * sd * d];
  return [K(t0, cam(dist, side), look, fov), K(t1, cam(dist * 0.92, side * 0.85), look, fov - 2)];
};

/* paths for draw-it-real */
const ELLIPSE = (cx: number, cy: number, rx: number, ry: number): Path2 => Array.from({ length: 41 }, (_, i) => [cx + Math.cos((i / 40) * TAU) * rx, cy + Math.sin((i / 40) * TAU) * ry] as [number, number]);
const PANCAKE_PATH: Path2[] = [ELLIPSE(0.5, 0.42, 0.44, 0.16), [[0.06, 0.42], [0.06, 0.62], [0.2, 0.74], [0.5, 0.78], [0.8, 0.74], [0.94, 0.62], [0.94, 0.42]], [[0.4, 0.3], [0.6, 0.3], [0.6, 0.38], [0.4, 0.38], [0.4, 0.3]]];
const TOWER_PATH: Path2[] = [[[0.15, 0.98], [0.15, 0.04], [0.85, 0.04], [0.85, 0.98]], ...Array.from({ length: 12 }, (_, i) => [[0.15, 0.1 + i * 0.075], [0.85, 0.1 + i * 0.075]] as Path2)];
const BIG_PANCAKE: Path2[] = [ELLIPSE(0.5, 0.3, 0.46, 0.2), [[0.04, 0.3], [0.04, 0.8], [0.25, 0.94], [0.5, 0.97], [0.75, 0.94], [0.96, 0.8], [0.96, 0.3]], [[0.04, 0.55], [0.25, 0.7], [0.5, 0.73], [0.75, 0.7], [0.96, 0.55]]];
const CLOUD_PATH: Path2[] = [[...Array.from({ length: 9 }, (_, i) => { const a = Math.PI + (i / 8) * Math.PI; return [0.24 + Math.cos(a) * 0.16, 0.62 + Math.sin(a) * 0.2] as [number, number]; }),
  ...Array.from({ length: 9 }, (_, i) => { const a = Math.PI * 1.1 + (i / 8) * Math.PI * 0.85; return [0.5 + Math.cos(a) * 0.2, 0.45 + Math.sin(a) * 0.3] as [number, number]; }),
  ...Array.from({ length: 9 }, (_, i) => { const a = Math.PI * 1.2 + (i / 8) * Math.PI * 0.9; return [0.76 + Math.cos(a) * 0.16, 0.6 + Math.sin(a) * 0.22] as [number, number]; }), [0.92, 0.78], [0.08, 0.78], [0.08, 0.62]]];

/* giant dragon eye filling a doorway (same eye design as the dragon: glossy black, two white highlights, red scaly skin) */
export const DragonEyeClose: React.FC<{ p: V3; s: number; open: number; t: number; look?: number }> = ({ p, s, open, t, look = 0 }) => (
  <CanvasPlane p={p} s={[s, s]} px={[640, 640]} draw={(c, W, Hh) => {
    const g = c.createRadialGradient(W * 0.5, Hh * 0.45, 30, W * 0.5, Hh * 0.5, W * 0.8); g.addColorStop(0, "#ff6450"); g.addColorStop(1, "#b4231d"); c.fillStyle = g; c.fillRect(0, 0, W, Hh);
    c.strokeStyle = "rgba(120,10,10,0.45)"; c.lineWidth = 6; for (let y = 0; y < Hh + 60; y += 56) for (let x = (y / 56) % 2 ? 28 : 0; x < W + 56; x += 56) { c.beginPath(); c.arc(x, y, 28, 0, Math.PI); c.stroke(); }
    const ex = W * 0.5, ey = Hh * 0.5, rx = W * 0.3, ry = Hh * 0.34; c.save(); c.beginPath(); c.ellipse(ex, ey, rx, ry * Math.max(0.04, open), 0, 0, TAU); c.clip();
    c.fillStyle = "#fffbe0"; c.fillRect(0, 0, W, Hh); const lx = look * rx * 0.25;
    c.fillStyle = "#101018"; c.beginPath(); c.ellipse(ex + lx, ey + ry * 0.05, rx * 0.62, ry * 0.92, 0, 0, TAU); c.fill();
    c.fillStyle = "#fff"; c.beginPath(); c.ellipse(ex + lx - rx * 0.2, ey - ry * 0.32, rx * 0.2, ry * 0.26, -0.2, 0, TAU); c.fill(); c.beginPath(); c.arc(ex + lx + rx * 0.22, ey + ry * 0.36, rx * 0.09, 0, TAU); c.fill(); c.restore();
    c.lineWidth = 16; c.strokeStyle = INK; c.beginPath(); c.ellipse(ex, ey, rx, ry * Math.max(0.04, open), 0, 0, TAU); c.stroke();
    c.beginPath(); c.moveTo(ex - rx * 1.1, ey - ry * (0.2 + open * 0.95)); c.quadraticCurveTo(ex, ey - ry * (0.55 + open * 1.0), ex + rx * 1.1, ey - ry * (0.3 + open * 0.95)); c.lineWidth = 22; c.stroke(); // brow ridge
    void t; }} />
);

/* the grown dragon's tail sticking out of the side window */
const Tail: React.FC<{ t: number }> = ({ t }) => { const w = Math.sin(t * 2.2) * 0.4; const pts: V3[] = [[3.9, 2.0, -3], [5.3, 2.4, -3.1], [6.7, 1.6, -2.6], [7.5, 0.6, -1.4], [7.2 + w * 0.3, 0.55, 0.2], [6.4 + w, 0.9, 1.1]];
  const r0 = 0.62; return (<>{pts.slice(0, -1).map((a, i) => { const b = pts[i + 1], m: V3 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), r = r0 * (1 - i * 0.14);
    const dir = [(b[0] - a[0]) / len, (b[1] - a[1]) / len, (b[2] - a[2]) / len]; const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(dir[0], dir[1], dir[2]));
    return <group key={i} position={m} quaternion={q}><mesh><cylinderGeometry args={[r * 0.88, r, len * 1.15, 18]} /><meshToonMaterial color="#e5372c" /></mesh><mesh scale={1.06}><cylinderGeometry args={[r * 0.88, r, len * 1.15, 14]} /><meshBasicMaterial color={INK} side={THREE.BackSide} /></mesh>
      <mesh position={[0, 0, r * 0.75]} scale={[0.5, 1, 0.3]}><cylinderGeometry args={[r * 0.9, r, len * 1.0, 10]} /><meshToonMaterial color="#ffd256" /></mesh></group>; })}
    <group position={pts[5]} rotation={[0, 0, 0.6 + w]}><mesh rotation={[0, 0, 0]} scale={[1, 1, 0.25]}><octahedronGeometry args={[0.7, 0]} /><meshToonMaterial color="#ffb43a" /></mesh></group></>); };

/* ===================== S1 HOOK 0–4.4 ===================== */
const K1: [number, Key[]][] = [[0, [K(0, [0.3, 1.1, 7.0], [0.95, 1.7, 0], 54), K(2.35, [0.4, 1.2, 6.3], [0.95, 1.7, 0], 52)]], [2.35, [K(2.35, [-4.2, 1.3, 13.5], [0.5, 4.8, -3], 56), K(4.5, [-4.0, 1.6, 12.2], [0.5, 5.5, -3], 58)]]];
export const S1 = ({ t }: Ctx) => {
  if (t < 2.35) return (<>
    <Cam t={t} keys={shot(t, K1)} impacts={[[0.05, 0.02]]} />
    <CottageHall t={t} doorOpen={1} outside={<><DragonEyeClose p={[0, 1.4, -0.4]} s={3.2} open={1} t={t} look={Math.sin(t * 2) * 0.4} /><CanvasPlane p={[0, 4, -0.6]} s={[16, 9]} px={[64, 64]} draw={(c, W, Hh) => { c.fillStyle = "#c8302a"; c.fillRect(0, 0, W, Hh); }} /></>} />
    <Stickman p={[1.5, 0, 2.6]} t={t} action="freezeShock" t0={0} face="surprised" rig={{ lookX: -0.6, lookY: -0.2 }} />
  </>);
  return (<World preset="morning" t={t}>
    <Cam t={t} keys={shot(t, K1)} />
    <Garden t={t} /><Cottage t={t} />
    <Dragon p={[1.5, 0, -8]} t={t} action="happy" t0={2.4} h={14} shadow={false} />
    <Stickman p={[-2.4, 0, 6.6]} t={t} action="freezeShock" t0={2.4} face="surprised" rig={{ lookY: -0.8, lookX: 0.4 }} />
    <Butterflies t={t} c={[-1, 1.5, 6]} area={3} />
  </World>);
};

/* ===================== S2 4.4–7.9 last night: baby dragon asleep in a teacup ===================== */
const CUP: V3 = [-1.55, 1.48, -2.95];
const K2: [number, Key[]][] = [[4.4, [K(4.4, [0.4, 2.6, 4.2], [-2.0, 1.7, -2.6], 48), K(6.1, [0.1, 2.5, 3.6], [-2.0, 1.7, -2.6], 46)]], [6.1, [K(6.1, [-4.4, 2.3, 2.4], [-2.0, 1.7, -2.7], 46), K(8.0, [-4.2, 2.3, 1.9], [-2.0, 1.7, -2.7], 44)]]];
export const S2 = ({ t }: Ctx) => (<>
  <Cam t={t} keys={shot(t, K2)} />
  <HomeSet t={t} preset="night" />
  <Teacup p={CUP} s={0.55} />
  <Dragon p={[CUP[0], CUP[1] + 0.12, CUP[2] + 0.05]} t={t} action="sleepy" h={0.8} shadow={false} />
  {[0, 1, 2].map((i) => { const u = (t * 0.5 + i / 3) % 1; return <SGlow key={i} p={[CUP[0] + 0.3 + u * 0.3, CUP[1] + 0.8 + u * 0.8, CUP[2]]} r={0.08} color="#ffffff" o={1 - u} />; })}
  <Stickman p={[-2.9, 0, -2.3]} t={t} action="idle" face="smile" rig={{ ikR: [520, 520], ikKR: 1, handR: "open", lookX: 0.8, lookY: 0.5, lean: 6 }} />
</>);

/* ===================== S3 7.9–11.9 this morning: the tail out of the window ===================== */
const K3: [number, Key[]][] = [[7.9, [K(7.9, [13.5, 1.8, 8.5], [4.6, 2.2, -1.6], 52), K(10.0, [12.6, 1.7, 7.4], [4.6, 2.1, -1.4], 50)]], [10.0, [K(10.0, [8.2, 1.6, 8.6], [5.6, 1.9, 1.0], 56), K(12.0, [8.0, 1.6, 8.0], [5.6, 1.9, 1.0], 54)]]];
export const S3 = ({ t }: Ctx) => { const b = beats(t, [[7.9, "walk", "smile"], [9.0, "think"], [10.1, "freezeShock", "surprised"]]);
  return (<World preset="morning" t={t}>
    <Cam t={t} keys={shot(t, K3)} />
    <Garden t={t} /><Cottage t={t} /><Tail t={t} />
    <Stickman p={[t < 9 ? 3.4 + (t - 7.9) * 0.9 : 4.4, 0, 2.6]} t={t} action={b.action} t0={b.t0} face={b.face} move={false} rig={{ lookX: 0.8, lookY: -0.3 }} />
    <Birds t={t} c={[4, 9, -10]} r={6} />
  </World>); };

/* ===================== S4 11.9–16.6 he opens the door — the eye opens right outside ===================== */
const K4: [number, Key[]][] = [[11.9, [K(11.9, [3.8, 1.8, 5.8], [0.4, 1.6, 0.6], 48), K(13.3, [3.4, 1.8, 5.2], [0.3, 1.6, 0.4], 46)]], [13.3, [K(13.3, [2.6, 2.0, 5.8], [0.2, 1.6, -0.5], 46), K(14.9, [2.4, 1.9, 5.2], [0.2, 1.55, -0.5], 44)]], [14.9, [K(14.9, [0.2, 1.3, 7.2], [0.95, 1.7, 0], 54), K(16.7, [0.3, 1.3, 6.6], [0.95, 1.7, 0], 52)]]];
export const S4 = ({ t }: Ctx) => { const door = eio(seg(t, 12.5, 13.3)), open = eo(seg(t, 14.2, 14.7));
  const P: V3 = t < 12.4 ? [1.6 - (t - 11.9) * 1.4, 0, 1.5] : t < 14.9 ? [0.9, 0, 1.3] : [1.5, 0, 2.6];
  const b = beats(t, [[11.9, "walk", "smile"], [12.4, "pull"], [13.4, "idle", "neutral"], [14.25, "freezeShock", "surprised"]]);
  return (<>
    <Cam t={t} keys={shot(t, K4)} impacts={[[14.25, 0.02]]} />
    <CottageHall t={t} doorOpen={door} outside={<><DragonEyeClose p={[0, 1.4, -0.4]} s={3.2} open={open} t={t} /><CanvasPlane p={[0, 4, -0.6]} s={[16, 9]} px={[64, 64]} draw={(c, W, Hh) => { c.fillStyle = "#c8302a"; c.fillRect(0, 0, W, Hh); }} /></>} />
    <Stickman p={P} t={t} action={b.action} t0={b.t0} face={b.face} dir={-1} move={false} rig={t > 13.3 && t < 14.9 ? { view: "back" } : { lookX: -0.5 }} />
  </>); };

/* ---------------- garden layout for the breakfast / fire scenes ---------------- */
const DP: V3 = [5.2, 0, 1.0], DH = 11, TB: V3 = [-2.4, 0, 5.0], HG: V3 = [-3.7, 0, 5.8];

/* ===================== S5 16.6–20.1 Giant. Happy. Hungry. ===================== */
const K5: [number, Key[]][] = [[16.6, [K(16.6, [-2.2, 0.6, 14.5], [3.6, 5.4, 0], 60), K(17.7, [-2.0, 0.7, 14.0], [3.6, 5.8, 0], 60)]], [17.7, fg([0.2, 0, 7.4], [5.2, 6.0, 1.0], 17.7, 18.75, 0.5, 6.2, 60, 0.45)], [18.75, [K(18.75, [-1.8, 1.8, 12.6], [0.8, 2.6, 6.0], 52), K(20.2, [-1.7, 1.8, 12.0], [0.8, 2.7, 6.0], 50)]]];
export const S5 = ({ t }: Ctx) => { const mood: DragonPose["mood"] = t < 17.7 ? "wow" : t < 18.75 ? "happy" : "calm";
  const b = beats(t, [[16.6, "freezeShock", "surprised"], [17.75, "laugh"], [18.8, "think"]]);
  return (<World preset="morning" t={t}>
    <Cam t={t} keys={shot(t, K5)} />
    <Garden t={t} /><Cottage t={t} />
    <Dragon p={DP} t={t} action={t < 17.7 ? "idle" : t < 18.75 ? "happy" : "idle"} t0={17.75} h={DH} pose={{ mood, mouthOpen: t > 18.8 ? 0.25 + 0.1 * Math.sin(t * 6) : 0 }} />
    <Stickman p={[0.2, 0, 7.4]} t={t} action={b.action} t0={b.t0} face={b.face} rig={{ lookX: 0.7, lookY: -0.6 }} />
  </World>); };

/* ===================== S6 20.1–27.3 breakfast: pancake drawn line by line -> real + fluffy -> one gulp ===================== */
const K6: [number, Key[]][] = [[20.1, fg(HG, [5.2, 6.0, 1.0], 20.1, 21.8, 0.55, 6.2, 60, 0.42)], [21.8, [K(21.8, [-1.9, 2.3, 10.8], [-3.0, 1.4, 5.2], 48), K(24.3, [-2.1, 2.2, 10.0], [-3.0, 1.35, 5.2], 46)]], [24.3, fg(HG, [4.4, 7.2, 1.5], 24.3, 27.3, -0.5, 6.4, 62, 0.45)]];
export const S6 = ({ t }: Ctx) => { const keys = shot(t, K6), cam = camAt(t, keys).pos as V3, M = dragonPoint(DP, DH, DRAGON_PTS.mouth, cam);
  const plate: V3 = [TB[0], 1.07, TB[2]], g = gulpAt(t, 24.75, 25.5, [plate[0], plate[1] + 0.3, plate[2]], M, { arc: 1.8, spin: 3 });
  const b = beats(t, [[20.1, "idle", "smile"], [20.6, "think"], [21.7, "drawInAir"], [23.5, "thumbsUp", "grin"], [24.9, "freezeShock", "surprised"], [26.0, "facepalm"]]);
  return (<World preset="morning" t={t}>
    <Cam t={t} keys={keys} impacts={[[25.6, 0.02]]} />
    <Garden t={t} /><Cottage t={t} /><GardenTable p={TB} />
    <Dragon p={DP} t={t} action={t > 25.6 ? "happy" : "idle"} t0={25.6} h={DH} pose={{ mood: t < 21.7 ? "calm" : t < 24.6 ? "wow" : undefined, mouthOpen: Math.max(g.jaw, t > 20.2 && t < 21.0 ? 0.35 : 0) }} />
    {t < 24.75 ? <DrawItReal t={t} t0={21.95} p={plate} size={[1.2, 0.6]} paths={PANCAKE_PATH} fill="#ffd27a" draw={1.0} fillDur={0.3} pop={0.5}><PancakeStack p={[0, 0, 0]} n={3} r={0.42} t={t} /></DrawItReal>
      : g.visible ? <group position={g.pos} scale={g.scale} rotation={[g.rot, 0, g.rot * 0.5]}><PancakeStack p={[0, -0.3, 0]} n={3} r={0.42} t={t} /></group> : null}
    {t > 23.3 && t < 24.9 ? [0, 1, 2].map((i) => { const u = (t * 0.6 + i / 3) % 1; return <CloudPuff key={i} p={[plate[0] + Math.sin(i * 2) * 0.2, plate[1] + 0.7 + u * 1.2, plate[2]]} r={0.12 + u * 0.12} u={u} seed={i + 90} look={{ color: "#ffffff", shadow: "#d8d8f0" }} outline={false} />; }) : null}
    <Stickman p={HG} t={t} action={b.action} t0={b.t0} face={b.face} prop={t > 21.7 && t < 23.5 ? "pencil" : null} rig={b.action === "drawInAir" ? { ikR: [420, 520], ikKR: 1, handR: "hold", lookX: 0.8, lookY: 0.6 } : { lookX: 0.6, lookY: -0.3 }} />
  </World>); };

/* ===================== S7 27.3–31.2 two hundred pancakes — gulp ===================== */
const TW: V3 = [-0.9, 0, 4.6];
const K7: [number, Key[]][] = [[27.3, [K(27.3, [-1.0, 1.4, 11.6], [-1.6, 3.0, 4.8], 60), K(29.4, [-1.1, 1.5, 11.0], [-1.6, 3.3, 4.8], 60)]], [29.4, fg([-2.6, 0, 5.4], [4.4, 7.2, 1.5], 29.4, 31.2, 0.5, 6.4, 62, 0.45)]];
export const S7 = ({ t }: Ctx) => { const keys = shot(t, K7), cam = camAt(t, keys).pos as V3, M = dragonPoint(DP, DH, DRAGON_PTS.mouth, cam);
  const g = gulpAt(t, 29.45, 30.3, [TW[0], 3.0, TW[2]], M, { arc: 1.0, spin: 1.2 });
  const b = beats(t, [[27.3, "drawInAir"], [28.9, "celebrate"], [29.5, "freezeShock", "surprised"], [30.4, "scaredShake"]]);
  return (<World preset="morning" t={t}>
    <Cam t={t} keys={keys} impacts={[[30.35, 0.03]]} />
    <Garden t={t} /><Cottage t={t} /><GardenTable p={TB} />
    <Dragon p={DP} t={t} action={t > 30.4 ? "happy" : "idle"} t0={30.4} h={DH} pose={{ mood: t < 29.4 ? "wow" : undefined, mouthOpen: g.jaw }} />
    {t < 29.45 ? <DrawItReal t={t} t0={27.55} p={TW} size={[1.4, 6.6]} paths={TOWER_PATH} fill="#ffd27a" draw={0.8} fillDur={0.2} pop={0.45}><PancakeStack p={[0, 0, 0]} n={44} r={0.5} t={t} wobble={0.25} /></DrawItReal>
      : g.visible ? <group position={add(g.pos, [0, -3, 0])} scale={g.scale} rotation={[0, 0, g.rot * 0.3]}><PancakeStack p={[0, 0, 0]} n={44} r={0.5} t={t} wobble={0.4} /></group> : null}
    <Stickman p={[-2.6, 0, 5.4]} t={t} action={b.action} t0={b.t0} face={b.face} prop={t < 28.9 ? "pencilUp" : null} rig={b.action === "drawInAir" ? { ikR: [560, 860 + Math.sin(t * 9) * 120], ikKR: 1, handR: "hold", lookX: 0.8, lookY: -0.6 } : { lookX: 0.6, lookY: -0.6 }} />
  </World>); };

/* ===================== S8 31.2–34.9 a pancake the size of a house ===================== */
const BP: V3 = [-9.0, 0, 3.0];
const K8: [number, Key[]][] = [[31.2, fg([-4.6, 0, 6.6], [-9.0, 1.6, 3.0], 31.2, 33.2, -0.6, 6.0, 60, 0.4)], [33.2, fg([-4.6, 0, 6.6], [-9.0, 1.6, 3.0], 33.2, 35.0, 0.7, 6.0, 60, 0.4)]];
export const S8 = ({ t }: Ctx) => { const b = beats(t, [[31.2, "drawInAir"], [32.9, "freezeShock", "surprised"], [33.6, "laugh"]]);
  return (<World preset="morning" t={t}>
    <Cam t={t} keys={shot(t, K8)} impacts={[[32.75, 0.025]]} />
    <Garden t={t} /><Cottage t={t} />
    <Dragon p={DP} t={t} action="idle" h={DH} pose={{ mood: "wow", mouthOpen: 0.15 }} />
    <DrawItReal t={t} t0={31.4} p={BP} size={[9.2, 4.0]} paths={BIG_PANCAKE} fill="#ffd27a" draw={0.9} fillDur={0.25} pop={0.5}><PancakeStack p={[0, 0, 0]} n={3} r={4.2} t={t} /></DrawItReal>
    <DustImpact c={[BP[0], 0, BP[2] + 4.5]} t={t} t0={32.75} r={2.2} />
    <Stickman p={[-4.6, 0, 6.6]} t={t} action={b.action} t0={b.t0} face={b.face} prop={t < 32.9 ? "pencil" : null} dir={-1} rig={b.action === "drawInAir" ? { ikR: [-520, 760], ikKR: 1, handR: "hold", lookX: -0.8 } : { lookX: -0.6, lookY: -0.3 }} />
  </World>); };

/* ===================== S9 34.9–39.2 dragon burp — the roof catches fire ===================== */
const ROOF: V3 = [-1.0, 4.7, -1.0];
const K9: [number, Key[]][] = [[34.9, fg([-2.0, 0, 8.2], [1.6, 5.4, 0.0], 34.9, 37.2, 0.5, 6.4, 62, 0.45)], [37.2, fg([-2.0, 0, 8.2], [-1.0, 5.0, -1.0], 37.2, 39.2, -0.5, 6.0, 60, 0.4)]];
export const S9 = ({ t }: Ctx) => { const keys = shot(t, K9), cam = camAt(t, keys).pos as V3, M = dragonPoint(DP, DH, DRAGON_PTS.mouth, cam);
  const burp = seg(t, 35.4, 35.65) * (1 - seg(t, 36.25, 36.6)), fire = seg(t, 35.9, 36.8);
  const b = beats(t, [[34.9, "laugh"], [35.6, "freezeShock", "surprised"], [36.4, "panic"]]);
  return (<World preset="morning" t={t}>
    <Cam t={t} keys={keys} impacts={[[35.5, 0.03]]} />
    <Garden t={t} /><Cottage t={t} burnt={seg(t, 36.5, 39) * 0.6} chimneySmoke={false} />
    <Dragon p={DP} t={t} action="idle" h={DH} pose={{ mood: t < 35.4 ? "happy" : t < 36.6 ? "sneeze" : "scared", mouthOpen: burp }} />
    {burp > 0 ? [0, 1, 2, 3, 4, 5].map((i) => { const k = (i + 1) / 6; return <Fire key={i} p={lerp3(M, ROOF, k * burp)} t={t} size={0.5 + k * 0.5} n={3} spread={[0.4, 0.4]} smoke={false} seed={i} />; }) : null}
    <Fire p={ROOF} t={t} size={2.6} n={16} spread={[6.0, 1.8]} intensity={fire} />
    <Stickman p={[-2.0, 0, 8.2]} t={t} action={b.action} t0={b.t0} face={b.face} move={false} rig={{ lookX: 0.4, lookY: -0.6 }} />
  </World>); };

/* ===================== S10 39.2–46.4 he draws a rain cloud — it rains on the roof — Sssss ===================== */
const CL: V3 = [-1.0, 8.4, -1.0];
const K10: [number, Key[]][] = [[39.2, [K(39.2, [-1.0, 2.6, 10.6], [-2.6, 2.2, 6], 44), K(40.6, [-1.3, 2.6, 10.0], [-2.6, 2.3, 6], 42)]], [40.6, fg([-3.4, 0, 6.8], [-1.0, 6.4, -1.0], 40.6, 43.0, -0.4, 6.0, 62, 0.42)], [43.0, [K(43.0, [-3.2, 1.4, 11.8], [-1.2, 4.6, -0.8], 58), K(46.5, [-3.0, 1.5, 11.0], [-1.2, 4.8, -0.8], 58)]]];
export const S10 = ({ t }: Ctx) => { const rain = seg(t, 42.5, 42.9) * (1 - seg(t, 45.6, 46.3)), fire = 1 - seg(t, 43.0, 45.4), steam = seg(t, 43.2, 43.6) * (1 - seg(t, 46.0, 46.5));
  const b = beats(t, [[39.2, "point", "determined"], [40.7, "drawInAir"], [42.5, "celebrate"], [43.6, "scaredShake"], [45.5, "laugh"]]);
  return (<World preset="morning" t={t}>
    <Cam t={t} keys={shot(t, K10)} />
    <Garden t={t} /><Cottage t={t} burnt={0.6} chimneySmoke={false} />
    <Dragon p={DP} t={t} action="idle" h={DH} pose={{ mood: t < 43 ? "scared" : "wow" }} />
    <Fire p={ROOF} t={t} size={2.6} n={16} spread={[6.0, 1.8]} intensity={fire} />
    <DrawItReal t={t} t0={40.8} p={[CL[0], CL[1] - 1.4, CL[2]]} size={[6.0, 3.0]} paths={CLOUD_PATH} fill="#c8c8e0" draw={1.0} fillDur={0.25} pop={0.45}>
      {[[-1.8, 1.0, 1.4], [0, 1.5, 1.9], [1.8, 1.0, 1.4], [-0.9, 1.9, 1.3], [0.9, 2.0, 1.3]].map(([x, y, r], i) => <CloudPuff key={i} p={[x, y, 0]} r={r} seed={i + 120} look={{ color: "#a8a8c8", shadow: "#6a6a8a", rim: "#3a3a5a" }} />)}
    </DrawItReal>
    <Rain c={[CL[0], 0, CL[2]]} t={t} area={[5, 1.8]} top={7.6} ground={4.4} n={70} on={rain} />
    {steam > 0 ? <PuffSmoke src={add(ROOF, [0, 0.5, 0])} t={t} t0={43.2} t1={46.0} rate={9} vel={[0.1, 2.2, 0]} spread={1.8} size={0.7} life={1.6} color="#ffffff" seed={44} /> : null}
    <Stickman p={t < 40.6 ? [-2.6, 0, 6.4] : [-3.4, 0, 6.8]} t={t} action={b.action} t0={b.t0} face={b.face} prop={t < 42.5 ? (t < 40.7 ? "pencilUp" : "pencil") : null} rig={b.action === "drawInAir" ? { ikR: [300, 980], ikKR: 1, handR: "hold", lookX: 0.4, lookY: -0.9 } : { lookY: -0.5, lookX: 0.4 }} />
  </World>); };

/* ===================== S11 46.4–53.9 sad dragon with a tear — Stickman climbs onto its nose and hugs it ===================== */
const K11: [number, Key[]][] = [[46.4, fg([1.8, 0, 6.0], [5.6, 7.2, 1.0], 46.4, 48.9, -0.4, 6.2, 60, 0.45)], [48.9, [K(48.9, [-0.8, 2.4, 12.4], [2.6, 3.0, 4.0], 52), K(51.9, [-0.4, 4.6, 14.2], [3.6, 6.2, 2.5], 56)]], [51.9, [K(51.9, [2.6, 6.4, 10.4], [5.8, 7.4, 1.4], 46), K(53.9, [2.8, 6.6, 9.6], [5.8, 7.5, 1.4], 42)]]];
export const S11 = ({ t }: Ctx) => { const keys = shot(t, K11), cam = camAt(t, keys).pos as V3, snout = towardCam(dragonPoint(DP, DH, DRAGON_PTS.snout, cam), cam, 0.4);
  const climb = eio(seg(t, 50.7, 51.9)), ground: V3 = [1.8, 0, 6.0]; const P = lerp3(ground, [snout[0], snout[1] - 0.35, snout[2]], climb);
  const b = beats(t, [[46.4, "idle", "worried"], [49.1, "think"], [50.3, "climb"], [51.95, "land"], [52.3, "hug"]]);
  return (<World preset="morning" t={t}>
    <Cam t={t} keys={keys} />
    <Garden t={t} /><Cottage t={t} burnt={0.6} chimneySmoke={false} />
    <Dragon p={DP} t={t} action="idle" h={DH} pose={{ mood: t < 52.3 ? "sad" : "happy", tear: t > 47.0 && t < 49.5 ? seg(t, 47.0, 49.0) : 0, blink: t > 52.3 }} />
    {t > 52.4 ? <Sparkles t={t} c={add(snout, [0, 1.6, 0.3])} area={[1.2, 1, 0.3]} n={8} color="#ff8ab8" size={0.16} rise={1} /> : null}
    <Stickman p={P} t={t} action={b.action} t0={b.t0} face={b.face} move={false} shadow={climb < 0.05} rig={{ lookX: 0.6, lookY: -0.4 }} />
  </World>); };

/* ===================== S12 53.9–60.9 smile, wings spread — he is still on its nose ===================== */
const K12a = (): Key[] => flyCloseKeys([DP[0], 0, DP[2]], DH, [-2.4, 1.0, 6.2], 53.9, 55.3);
const K12: [number, Key[]][] = [[53.9, K12a()], [55.3, [K(55.3, [-3.0, 2.2, 19.0], [4.6, 6.2, 1], 60), K(56.4, [-3.3, 2.2, 19.5], [4.6, 6.4, 1], 60)]], [56.4, [K(56.4, [3.2, 7.4, 10.0], [5.8, 8.0, 1.4], 44), K(61.0, [3.0, 7.2, 9.2], [5.8, 8.0, 1.4], 40)]]];
export const S12 = ({ t }: Ctx) => { const keys = shot(t, K12), cam = camAt(t, keys).pos as V3, lift = eio(seg(t, 55.4, 57.0)) * 0.08;
  const snout = towardCam(dragonPoint(DP, DH, DRAGON_PTS.snout, cam, false, lift), cam, 0.4);
  const b = beats(t, [[53.9, "hug"], [54.6, "laugh"], [57.2, "freezeShock", "surprised"], [58.6, "scaredShake"]]);
  return (<World preset="morning" t={t}>
    <Cam t={t} keys={keys} impacts={[[55.4, 0.02]]} />
    <Garden t={t} /><Cottage t={t} burnt={0.6} chimneySmoke={false} />
    <Dragon p={[DP[0], DP[1] + lift * DH, DP[2]]} t={t} action={t > 55.36 ? "idle" : "happy"} t0={55.36} h={DH} pose={t > 55.36 ? { mood: "happy", fly: Math.min(1, (t - 55.36) * 2), flap: 1, flapHz: 3.2 } : { mood: "happy" }} />
    <PuffRing c={[DP[0], 0, DP[2] + 2]} t={t} t0={55.5} n={14} r={6} size={0.9} color="#e8f0d8" up={1} life={1.8} />
    <Stickman p={[snout[0], snout[1] - 0.35, snout[2]]} t={t} action={b.action} t0={b.t0} face={b.face} move={false} shadow={false} rig={{ lookX: -0.3, lookY: 0.6, zeroG: t > 55.4 ? 0.5 : 0 }} />
  </World>); };

/* ===================== S13 60.9–72.9 the flight (golden sunset): whoosh, town, mountains, sea, scream ===================== */
const FH = 10;
const K13: [number, Key[]][] = [
  [60.9, [K(60.9, [9, 3, 14], [5, 9, 1], 60), K(62.8, [8, 6, 13], [5, 14, 1], 62)]],
  [62.8, [K(62.8, [10, 18, 12], [0, 14, -2], 56), K(64.8, [9, 18.5, 10], [0, 14, -2], 56)]],
  [64.8, [K(64.8, [-6, 22.5, 17], [0.5, 21, -8], 58), K(66.8, [-5, 22.8, 15.5], [0.5, 21, -8], 58)]],
  [66.8, [K(66.8, [8, 7.5, 13], [0, 10, 0], 56), K(68.8, [7, 7.0, 11.5], [0, 10, 0], 56)]],
  [68.8, [K(68.8, [1.8, 13.0, 6.0], [1.1, 12.8, 0], 40), K(70.5, [1.6, 13.0, 5.4], [1.1, 12.8, 0], 38)]],
  [70.5, [K(70.5, [-12, 9, 16], [0, 11, 0], 58), K(73.0, [-14, 10, 12], [0, 11, 0], 58)]],
];
function flyCloseKeys(base: V3, dh: number, off: V3, t0: number, t1: number): Key[] { return flyClose(0, base, dh, off, t0, t1); }
function flyClose(t: number, base: V3, dh: number, off: V3, t0: number, t1: number): Key[] { void t; const guess = add(base, [3, 5, 8]), sn = dragonPoint(base, dh, DRAGON_PTS.snout, guess), lk = add(sn, [0, 1.3, 0]);
  return [K(t0, add(sn, off), lk, 52), K(t1, add(sn, [off[0] * 0.9, off[1] * 0.95, off[2] * 0.9]), lk, 50)]; }
export const S13 = ({ t }: Ctx) => { const keys = t >= 61.8 && t < 62.8 ? [...flyClose(t, [DP[0], 8.2, DP[2]], DH, [-2.6, 1.6, 7.4], 61.8, 62.8)] : t >= 62.8 && t < 64.8 ? flyClose(t, [0, 12, 0], FH, [2.6, 3.8, 6.4], 62.8, 64.8) : t >= 64.8 && t < 66.8 ? flyClose(t, [0, 20, 0], FH, [-2.6, 3.4, 6.6], 64.8, 66.8) : t >= 66.8 && t < 68.8 ? flyClose(t, [0, 7.5, 0], FH, [2.8, 3.2, 6.6], 66.8, 68.8) : t >= 70.5 ? flyClose(t, [0, 7.5, 0], FH, [-3.0, 2.6, 7.0], 70.5, 73.0) : shot(t, K13), cam = camAt(t, keys).pos as V3;
  const take = t < 62.8 ? eo(seg(t, 61.0, 62.8)) : 1, DPf: V3 = t < 62.8 ? [DP[0], take * 9, DP[2]] : t < 64.8 ? [0, 12, 0] : t < 66.8 ? [0, 20, 0] : [0, 7.5, 0];
  const dh = t < 62.8 ? DH : FH, snout = towardCam(dragonPoint(DPf, dh, DRAGON_PTS.snout, cam), cam, 0.4), scroll = (t - 62.8) * 9;
  return (<World preset={t < 62.8 ? "morning" : "sunset"} t={t} rays={t > 66.8 ? 0.12 : 0}>
    <Cam t={t} keys={keys} />
    {t < 62.8 ? <><Garden t={t} /><Cottage t={t} burnt={0.6} chimneySmoke={false} /><PuffRing c={[DP[0], 0, DP[2] + 1]} t={t} t0={61.1} n={16} r={7} size={1.0} color="#e8f0d8" up={1.4} life={1.8} /></> : null}
    {t >= 62.8 && t < 64.8 ? <><Town c={[0, 0, 26 - scroll * 0.6]} t={t} /><Clouds t={t} preset="sunset" n={6} y={18} drift={4} /></> : null}
    {t >= 64.8 && t < 66.8 ? <><Mountains c={[0, -4, -4 - (t - 64.8) * 5]} scale={1.7} n={8} /><Clouds t={t} preset="sunset" n={8} y={20} drift={6} /></> : null}
    {t >= 66.8 ? <><Sea c={[0, 0, -20]} t={t} /><Birds t={t} c={[0, 10, -8]} r={8} /><Clouds t={t} preset="sunset" n={6} y={14} drift={5} /></> : null}
    <Dragon p={DPf} t={t} action="idle" t0={60.9} h={dh} shadow={false} pose={{ mood: "happy", fly: 1, flap: 1, flapHz: 3.2 }} />
    <Stickman p={[snout[0], snout[1] - 0.3, snout[2]]} t={t} action={t < 61.6 ? "freezeShock" : "panic"} t0={t < 61.6 ? 61.0 : 61.6} face="scared" move={false} shadow={false} rig={{ zeroG: 1, drag: [-50, -40] as [number, number], lookY: 0.4 } as Partial<Rig>} />
  </World>); };

/* ===================== S14 72.9–80.9 tiny island: landing, curl up, yawn, shrink with sparkles ===================== */
const ISL: V3 = [0, 0, 0], DL: V3 = [1.6, 1.0, -2.6];
const sandY = (x: number, z: number) => Math.max(0, Math.sqrt(Math.max(0, 36 - x * x - z * z)) - 6 * 0.82);
const K14: [number, Key[]][] = [[72.9, [K(72.9, [-5.6, 3.0, 9.0], [-0.4, 3.6, -0.5], 56), K(74.3, [-5.4, 2.9, 8.7], [-0.6, 3.0, 0.0], 56)]], [74.3, [K(74.3, [-4.4, 2.2, 8.2], [-1.2, 1.6, 2.0], 54), K(75.6, [-4.2, 2.2, 7.8], [-1.2, 1.6, 2.0], 52)]], [75.6, [K(75.6, [-2.2, 2.8, 9.6], [1.0, 3.6, -1.5], 52), K(78.0, [-2.0, 2.6, 9.0], [1.0, 3.4, -1.5], 50)]], [78.0, [K(78.0, [-1.8, 2.0, 7.4], [0.6, 1.6, -1.0], 48), K(81.0, [-1.6, 2.0, 6.8], [0.6, 1.6, -1.0], 46)]]];
export const S14 = ({ t }: Ctx) => { const keys = shot(t, K14), cam = camAt(t, keys).pos as V3;
  const land = eo(seg(t, 73.1, 74.3)), shrink = eio(seg(t, 78.1, 78.95)), dh = 9 - 8.25 * shrink;
  const dp: V3 = [DL[0] + (1 - land) * 7, DL[1] + (1 - land) * 9, DL[2] - (1 - land) * 4];
  const snout = towardCam(dragonPoint(dp, dh, DRAGON_PTS.snout, cam), cam, 0.4), HP: V3 = [-1.6, sandY(-1.6, 2.2), 2.2];
  const slide = eio(seg(t, 74.3, 75.0)); const P = t < 74.3 ? [snout[0], snout[1] - 0.3, snout[2]] as V3 : lerp3([snout[0], snout[1] - 0.3, snout[2]], HP, slide);
  const b = beats(t, [[72.9, "panic", "scared"], [74.3, "fallOnBottom"], [75.6, "idle", "smile"], [77.1, "laugh"], [78.1, "freezeShock", "surprised"], [79.2, "idle", "smile"]]);
  return (<World preset="sunset" t={t} rays={0.1}>
    <Cam t={t} keys={keys} impacts={[[74.3, 0.035]]} />
    <Sea c={[0, -0.05, -10]} t={t} size={[200, 200]} color="#ff8a6a" sky="#ffd0a0" /><Island c={ISL} t={t} /><Clouds t={t} preset="sunset" n={5} y={12} drift={0.6} />
    <PuffRing c={[DL[0], sandY(DL[0], DL[2]), DL[2] + 1]} t={t} t0={74.3} n={14} r={5} size={0.8} color="#ffe6b0" up={1} life={1.8} />
    <Dragon p={[dp[0], sandY(dp[0], dp[2]) * land + dp[1] * (1 - land), dp[2]]} t={t} action={t < 74.3 ? "idle" : "sleepy"} t0={73} h={dh} shadow={land > 0.9}
      pose={{ fly: t < 74.3 ? 1 : 0, flap: t < 74.3 ? 1 : 0.1, flapHz: 3.2, curl: t > 75.8 ? 0.8 : 0, legsTucked: t > 75.8, mouthOpen: seg(t, 77.1, 77.4) * (1 - seg(t, 77.8, 78.1)), mood: t > 77.1 && t < 78.1 ? "wow" : "sleepy" }} />
    {t > 78.1 && t < 79.6 ? <MagicSparkles t={t} c={[DL[0], 1.5, DL[2]]} area={[3, 3, 1]} n={24} /> : null}
    <Stickman p={P} t={t} action={b.action} t0={b.t0} face={b.face} move={false} shadow={t > 74.6} rig={{ lookX: 0.6, lookY: -0.2 }} />
  </World>); };

/* ===================== S15 80.9–86.4 small enough to sleep in a teacup — Stickman sighs ===================== */
const TC: V3 = [0.4, 0, 1.6];
const K15: [number, Key[]][] = [[80.9, [K(80.9, [0.4, 1.6, 7.6], [-0.6, 1.3, 1.8], 48), K(83.9, [0.2, 1.6, 7.0], [-0.6, 1.3, 1.8], 46)]], [83.9, [K(83.9, [-2.4, 2.0, 7.0], [-0.6, 1.8, 1.8], 44), K(86.5, [-2.2, 2.0, 6.4], [-0.6, 1.8, 1.8], 42)]]];
export const S15 = ({ t }: Ctx) => { const y = sandY(TC[0], TC[2]), HP: V3 = [-1.5, sandY(-1.5, 2.2), 2.2];
  const b = beats(t, [[80.9, "idle", "smile"], [82.0, "pickUp"], [84.4, "idle", "smile"]]);
  return (<World preset="sunset" t={t}>
    <Cam t={t} keys={shot(t, K15)} />
    <Sea c={[0, -0.05, -10]} t={t} size={[200, 200]} color="#ff8a6a" sky="#ffd0a0" /><Island c={ISL} t={t} />
    <Teacup p={[TC[0], y, TC[2]]} s={0.6} /><Dragon p={[TC[0], y + 0.12, TC[2] + 0.05]} t={t} action="sleepy" h={0.85} shadow={false} />
    {[0, 1, 2].map((i) => { const u = (t * 0.5 + i / 3) % 1; return <SGlow key={i} p={[TC[0] + 0.3 + u * 0.3, y + 0.9 + u * 0.8, TC[2]]} r={0.08} color="#ffffff" o={1 - u} />; })}
    <Stickman p={HP} t={t} action={b.action} t0={b.t0} face={b.face} rig={t > 84.4 ? { squash: -0.06 * Math.sin(Math.min(1, (t - 84.4) / 0.8) * Math.PI), headTilt: -8, lookX: 0.6, lookY: 0.4 } : { lookX: 0.6, lookY: 0.4 }} />
  </World>); };

/* ===================== S16 86.4–94.6 crack! — behind him, a pile of eggs — five of them ===================== */
const NEST: V3 = [-0.6, 0, -1.4];
const EGG_XZ: [number, number][] = [[-1.0, 0.0], [0.0, -0.3], [1.0, 0.0], [-0.5, 0.7], [0.5, 0.7]];
const eggPos = (i: number): V3 => { const [x, z] = EGG_XZ[i]; return [NEST[0] + x, sandY(NEST[0] + x, NEST[2] + z), NEST[2] + z]; };
const K16: [number, Key[]][] = [[86.4, [K(86.4, [-1.2, 2.0, 7.4], [-1.4, 1.8, 2.2], 44), K(88.8, [-1.0, 2.0, 6.8], [-1.4, 1.8, 2.2], 42)]], [88.8, [K(88.8, [1.6, 3.2, 6.6], [-1.6, 0.9, 0.0], 54), K(91.9, [1.4, 3.0, 6.0], [-1.6, 0.9, -0.2], 52)]], [91.9, [K(91.9, [0.8, 1.8, 6.8], [-0.9, 1.3, 0.2], 52), K(94.7, [0.7, 1.8, 6.2], [-0.9, 1.3, 0.2], 50)]]];
export const S16 = ({ t }: Ctx) => { const HP: V3 = [-1.5, sandY(-1.5, 2.2), 2.2];
  const b = beats(t, [[86.4, "idle", "smile"], [86.95, "freezeShock", "surprised"], [88.9, "point", "surprised"], [91.9, "scaredShake"], [93.4, "think"]]);
  return (<World preset="sunset" t={t}>
    <Cam t={t} keys={shot(t, K16)} impacts={[[86.92, 0.012]]} />
    <Sea c={[0, -0.05, -10]} t={t} size={[200, 200]} color="#ff8a6a" sky="#ffd0a0" /><Island c={ISL} t={t} />
    <mesh position={[NEST[0], sandY(NEST[0], NEST[2]) + 0.05, NEST[2]]} rotation={[-Math.PI / 2, 0, 0]}><torusGeometry args={[1.5, 0.28, 8, 28]} /><meshToonMaterial color="#c89a5a" /></mesh>
    {[0, 1, 2, 3, 4].map((i) => <DragonEgg key={i} p={eggPos(i)} t={t + i} s={0.55} wobble={i === 1 ? (t > 86.9 ? 1 : 0.3) : 0.05} crack={i === 1 ? seg(t, 86.9, 87.2) * 0.4 : 0} />)}
    <Teacup p={[TC[0], sandY(TC[0], TC[2]), TC[2]]} s={0.6} /><Dragon p={[TC[0], sandY(TC[0], TC[2]) + 0.12, TC[2] + 0.05]} t={t} action="sleepy" h={0.85} shadow={false} />
    {t > 91.9 ? [0, 1, 2, 3, 4].map((i) => { const k = seg(t, 92.0 + i * 0.12, 92.2 + i * 0.12); return k > 0 && k < 1 ? <SGlow key={i} p={add(eggPos(i), [0, 1.0, 0.3])} r={0.5} color="#fff4a0" o={1 - k} /> : null; }) : null}
    <Stickman p={HP} t={t} action={b.action} t0={b.t0} face={b.face} rig={{ lookX: -0.6, lookY: 0.2 }} />
  </World>); };

/* ===================== S17 94.6–100 the question: the wobbling egg cracks, an eye peeks out (loops to the giant eye of frame 1) ===================== */
const K17: Key[] = [K(94.6, [-0.4, 1.9, 6.6], [-1.6, 1.3, 0.0], 54), K(100, [-0.5, 1.8, 5.8], [-1.5, 1.25, -0.2], 52)];
export const S17 = ({ t }: Ctx) => { const HP: V3 = [-2.2, sandY(-2.2, 0.8), 0.8];
  return (<World preset="sunset" t={t}>
    <Cam t={t} keys={K17} />
    <Sea c={[0, -0.05, -10]} t={t} size={[200, 200]} color="#ff8a6a" sky="#ffd0a0" /><Island c={ISL} t={t} />
    <mesh position={[NEST[0], sandY(NEST[0], NEST[2]) + 0.05, NEST[2]]} rotation={[-Math.PI / 2, 0, 0]}><torusGeometry args={[1.5, 0.28, 8, 28]} /><meshToonMaterial color="#c89a5a" /></mesh>
    {[0, 1, 2, 3, 4].map((i) => <DragonEgg key={i} p={eggPos(i)} t={t + i} s={0.55} wobble={i === 1 ? 1 : 0.1} crack={i === 1 ? 0.4 + seg(t, 95.0, 96.5) * 0.6 : 0} peek={i === 1 ? seg(t, 96.6, 97.2) : 0} />)}
    <Stickman p={HP} t={t} action={t < 96.6 ? "think" : "freezeShock"} t0={t < 96.6 ? 94.6 : 96.6} face={t < 96.6 ? undefined : "surprised"} rig={{ lookX: 0.8, lookY: 0.3 }} />
  </World>); };
void Water; void PATHS; void HOME;
