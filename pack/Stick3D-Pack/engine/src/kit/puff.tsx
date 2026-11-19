// CLOUD PUFF — the engine's only smoke/dust/cloud particle (replaces "circle smoke" everywhere).
// Irregular cauliflower shape (6 lobes of different sizes), 3-tone toon shading, soft ink rim, warm underside when lit by fire,
// expands + rises (driven by the emitter) and fades with a noisy DISSOLVE (no see-through overlapping circles).
import React from "react";
import * as THREE from "three";
import { V3 } from "../style/kit";

const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const ramp3 = (() => { const d = new Uint8Array([95, 175, 255]); const t = new THREE.DataTexture(d, 3, 1, THREE.RedFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
const noise = (() => { // soft, blobby noise (big features) -> the dissolve eats the puff in round holes, never in shreds
  const cv = document.createElement("canvas"); cv.width = cv.height = 128; const c = cv.getContext("2d")!; c.fillStyle = "#fff"; c.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 26; i++) { const x = rnd(i * 3) * 128, y = rnd(i * 7) * 128, r = 14 + rnd(i * 11) * 26; for (const [ox, oy] of [[0, 0], [128, 0], [-128, 0], [0, 128], [0, -128]]) { const g = c.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r); g.addColorStop(0, "rgba(0,0,0,0.75)"); g.addColorStop(1, "rgba(0,0,0,0)"); c.fillStyle = g; c.fillRect(x + ox - r, y + oy - r, r * 2, r * 2); } }
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; })();
const geo = new THREE.SphereGeometry(1, 16, 12);
// lobe layout (x, y, z, radius) in units of the puff radius — flat-ish base, bumpy top
const LOBES: [number, number, number, number][] = [[0, 0.05, 0, 0.78], [-0.62, -0.08, 0.1, 0.55], [0.6, -0.05, -0.05, 0.6], [-0.25, 0.48, 0.05, 0.56], [0.3, 0.52, 0.1, 0.5], [0.05, -0.1, 0.5, 0.5]];

export type PuffLook = { color?: string; shadow?: string; fire?: string; rim?: string };
export const CloudPuff: React.FC<{ p: V3; r: number; u?: number; seed?: number; lit?: number; look?: PuffLook; spin?: number; outline?: boolean }> = ({ p, r, u = 0, seed = 1, lit = 0, look = {}, spin = 0, outline = true }) => {
  if (u >= 1 || r <= 0.001) return null;
  const base = new THREE.Color(look.color ?? "#eeeaf6"), sh = new THREE.Color(look.shadow ?? "#a8a0c8"), fire = new THREE.Color(look.fire ?? "#ffb060");
  const cut = Math.max(0, (u - 0.5) / 0.5) ** 1.2 * 0.9; // dissolve threshold grows in the 2nd half of life
  const grow = (0.55 + 0.6 * (1 - (1 - Math.min(1, u * 1.4)) ** 3)) * (1 - Math.max(0, (u - 0.7) / 0.3) * 0.45); // expand, then thin out
  return (<group position={p} rotation={[0, seed * 1.7 + spin, (rnd(seed) - 0.5) * 0.5]} scale={r * grow}>
    {LOBES.map(([x, y, z, lr], i) => {
      const jit = 0.85 + rnd(seed * 7 + i) * 0.3, low = y < 0.2;
      const col = base.clone().lerp(sh, low ? 0.25 : 0).lerp(fire, low ? lit * (1 - u) * 0.75 : lit * (1 - u) * 0.25);
      return (<group key={i} position={[x * jit, y * jit, z]}>
        <mesh geometry={geo} scale={lr * jit}><meshToonMaterial color={col} gradientMap={ramp3} alphaMap={noise} alphaTest={cut} transparent={false} /></mesh>
        {outline ? <mesh geometry={geo} scale={lr * jit * 1.07}><meshBasicMaterial color={look.rim ?? "#4a4466"} side={THREE.BackSide} alphaMap={noise} alphaTest={cut} /></mesh> : null}
      </group>);
    })}
  </group>);
};

/* emitter: continuous smoke (rocket trails, chimneys, burning things). Same API as the old Smoke. */
export const PuffSmoke: React.FC<{ src: V3; t: number; t0: number; t1?: number; rate?: number; vel?: V3; spread?: number; size?: number; life?: number; lit?: number; color?: string; seed?: number; max?: number; rise?: number }> =
  ({ src, t, t0, t1 = 1e9, rate = 8, vel = [0, 1.2, 0], spread = 0.8, size = 0.6, life = 2.2, lit = 0, color = "#eeeaf6", seed = 1, max = 36, rise = 0.25 }) => {
  const items: React.ReactNode[] = []; const first = Math.max(0, Math.floor((t - life - t0) * rate)), last = Math.floor((Math.min(t, t1) - t0) * rate);
  const shade = "#" + new THREE.Color(color).lerp(new THREE.Color("#6a6090"), 0.35).getHexString();
  for (let i = Math.max(first, last - max); i <= last; i++) { const born = t0 + i / rate, age = t - born; if (age < 0 || age > life) continue; const u = age / life;
    const dx = (rnd(i * 3 + seed) - 0.5) * 2, dz = (rnd(i * 7 + seed) - 0.5) * 2, r = size * (0.6 + rnd(i + seed * 11) * 0.6) * (0.7 + u * 1.3);
    const p: V3 = [src[0] + vel[0] * age + dx * spread * Math.sqrt(age), src[1] + vel[1] * age + rise * age * age, src[2] + vel[2] * age + dz * spread * Math.sqrt(age)];
    items.push(<CloudPuff key={i} p={p} r={r} u={u} seed={i + seed * 13} lit={lit} spin={age * 0.4} look={{ color, shadow: shade }} />); }
  return <>{items}</>;
};
/* burst: dust ring / impact / landing */
export const PuffRing: React.FC<{ c: V3; t: number; t0: number; n?: number; r?: number; size?: number; color?: string; up?: number; life?: number }> = ({ c, t, t0, n = 10, r = 2, size = 0.6, color = "#ddd6e8", up = 0.6, life = 1.6 }) => {
  const age = t - t0; if (age < 0 || age > life) return null; const u = age / life, e = 1 - (1 - u) ** 3;
  const shade = "#" + new THREE.Color(color).lerp(new THREE.Color("#6a6090"), 0.35).getHexString();
  return <>{Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2 + rnd(i) * 0.4, d = r * e * (0.7 + rnd(i + 3) * 0.6);
    return <CloudPuff key={i} p={[c[0] + Math.cos(a) * d, c[1] + size * 0.4 + up * e * (0.5 + rnd(i + 5)), c[2] + Math.sin(a) * d * 0.7]} r={size * (0.7 + rnd(i + 9) * 0.6)} u={u} seed={i * 5 + 3} look={{ color, shadow: shade }} />; })}</>;
};
