// FX LIBRARY — drawing strokes, magic sparkles + glow, smoke, sparks, dust impact, splash, explosion puff, speed lines, impact frames, camera shake.
// 3D effects go inside the ThreeCanvas; Overlay effects (SpeedLines, ImpactFrame) go in the AbsoluteFill above it.
import React from "react";
import * as THREE from "three";
import { V3 } from "../style/kit";
import { SGlow, Sparkles as SkySparkles, ChalkDraw, Path2, ROCKET_PATH, DOOR_PATHS } from "../style/sky";
import { Smoke as SmokeFx, PuffBurst, Sparks as SparksFx } from "../style/set3d";

const TAU = Math.PI * 2;
const rnd = (i: number) => { const x = Math.sin(i * 91.7 + 17.3) * 43758.5453; return x - Math.floor(x); };
const ramp = (() => { const d = new Uint8Array([110, 185, 255]); const t = new THREE.DataTexture(d, 3, 1, THREE.RedFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();

/* stroke-by-stroke drawing in the air or on paper. style "chalk" (glowing cyan), "pencil" (graphite on paper), "magic" (gold glow) */
export const DRAW_STYLES = { chalk: { color: "rgba(120,240,255,1)", width: 10 }, pencil: { color: "rgba(60,60,80,1)", width: 7 }, magic: { color: "rgba(255,236,120,1)", width: 11 } };
export const DrawStrokes: React.FC<{ p: V3; s: [number, number]; paths: Path2[]; prog: number; t: number; style?: keyof typeof DRAW_STYLES; rot?: V3; face?: boolean; fill?: string; fillK?: number }> = ({ p, s, paths, prog, t, style = "magic", rot, face = true, fill, fillK = 0 }) => (
  <><ChalkDraw p={p} s={s} paths={paths} prog={prog} color={DRAW_STYLES[style].color} width={DRAW_STYLES[style].width} t={t} rot={rot} face={face} fill={fill} fillK={fillK} />
    {style !== "pencil" && prog > 0 ? <SGlow p={[p[0], p[1], p[2] + 0.2]} r={Math.max(s[0], s[1]) * 0.7} color={style === "chalk" ? "#9ff4ff" : "#fff0a0"} o={0.25 * Math.min(1, prog * 2)} /> : null}</>
);
export const PATHS = { rocket: ROCKET_PATH, door: DOOR_PATHS, circle: [Array.from({ length: 33 }, (_, i) => [0.5 + Math.cos((i / 32) * TAU - Math.PI / 2) * 0.44, 0.5 + Math.sin((i / 32) * TAU - Math.PI / 2) * 0.44] as [number, number])] as Path2[],
  star: [Array.from({ length: 11 }, (_, i) => { const r = i % 2 ? 0.2 : 0.46, a = -Math.PI / 2 + (i * Math.PI) / 5; return [0.5 + Math.cos(a) * r, 0.52 + Math.sin(a) * r] as [number, number]; })] as Path2[],
  heart: [Array.from({ length: 41 }, (_, i) => { const a = (i / 40) * TAU; return [0.5 + 0.026 * 16 * Math.sin(a) ** 3, 0.47 - 0.026 * (13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a))] as [number, number]; })] as Path2[],
  house: [[[0.12, 0.95], [0.12, 0.45], [0.88, 0.45], [0.88, 0.95], [0.12, 0.95]], [[0.05, 0.47], [0.5, 0.1], [0.95, 0.47]], [[0.4, 0.95], [0.4, 0.68], [0.6, 0.68], [0.6, 0.95]]] as Path2[] };

/* magic sparkles + glow */
export const MagicSparkles: React.FC<{ t: number; c: V3; area?: [number, number, number]; n?: number; color?: string; size?: number }> = ({ t, c, area = [1.5, 1.5, 0.6], n = 16, color = "#fff27a", size = 0.14 }) => (
  <SkySparkles t={t} c={c} area={area} n={n} color={color} size={size} rise={1} />
);
export const MagicGlow: React.FC<{ p: V3; r?: number; color?: string; t: number; pulse?: number }> = ({ p, r = 1.2, color = "#fff0a0", t, pulse = 0.25 }) => (
  <><SGlow p={p} r={r * (1 + Math.sin(t * 5) * pulse * 0.3)} color={color} o={0.55} /><SGlow p={p} r={r * 0.4} color="#ffffff" o={0.8} /></>
);
export const Smoke = SmokeFx, Sparks = SparksFx;
/* dust impact: ring of puffs + a few pebbles */
export const DustImpact: React.FC<{ c: V3; t: number; t0: number; r?: number; color?: string }> = ({ c, t, t0, r = 1.4, color = "#d8cfc0" }) => (
  <><PuffBurst c={c} t={t} t0={t0} n={10} r={r} size={0.35 * r} color={color} up={0.3} life={1.2} />
    {t > t0 && t < t0 + 0.8 ? Array.from({ length: 6 }, (_, i) => { const u = t - t0, a = rnd(i) * TAU, v = 2 + rnd(i * 3) * 2; return <mesh key={i} position={[c[0] + Math.cos(a) * v * u, c[1] + 0.1 + 3 * u - 6 * u * u, c[2] + Math.sin(a) * v * u]}><dodecahedronGeometry args={[0.06, 0]} /><meshToonMaterial color="#8a7a6a" gradientMap={ramp} /></mesh>; }) : null}</>
);
/* splash: droplets arc + ring */
export const Splash: React.FC<{ c: V3; t: number; t0: number; n?: number; color?: string; s?: number }> = ({ c, t, t0, n = 18, color = "#7ad8ff", s = 1 }) => {
  const u = t - t0; if (u < 0 || u > 1.2) return null;
  return (<>{Array.from({ length: n }, (_, i) => { const a = rnd(i) * TAU, v = (1.5 + rnd(i * 3) * 2) * s, up = (3 + rnd(i * 5) * 3) * s; return <mesh key={i} position={[c[0] + Math.cos(a) * v * u, c[1] + up * u - 9 * u * u, c[2] + Math.sin(a) * v * u]} scale={[1, 1.4, 1]}><sphereGeometry args={[0.08 * s * (1 - u * 0.6), 8, 6]} /><meshToonMaterial color={color} gradientMap={ramp} transparent opacity={1 - u * 0.7} /></mesh>; })}
    <mesh position={[c[0], c[1] + 0.03, c[2]]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[u * 2 * s, u * 2 * s + 0.1, 40]} /><meshBasicMaterial color="#ffffff" transparent opacity={1 - u} depthWrite={false} /></mesh></>);
};
/* explosion puff (cartoon): flash, fire core, smoke ring, sparks */
export const ExplosionPuff: React.FC<{ c: V3; t: number; t0: number; s?: number }> = ({ c, t, t0, s = 1 }) => {
  const u = t - t0; if (u < 0 || u > 2.2) return null; const k = Math.min(1, u / 0.25);
  return (<>
    {u < 0.35 ? <SGlow p={c} r={4 * s * (1 - u / 0.35 * 0.5)} color="#fff4c0" o={1 - u / 0.35} /> : null}
    {u < 0.9 ? <mesh position={c} scale={s * (0.6 + k * 1.2)}><icosahedronGeometry args={[1, 2]} /><meshBasicMaterial color={u < 0.3 ? "#ffd23a" : "#ff7a2a"} transparent opacity={0.9 * (1 - u / 0.9)} /></mesh> : null}
    <PuffBurst c={[c[0], c[1] - 0.6 * s, c[2]]} t={t} t0={t0 + 0.1} n={14} r={2.4 * s} size={0.8 * s} color="#6a6470" up={1.6 * s} life={2.0} />
    <SparksFx c={c} t={t} t0={t0} n={20} v={6 * s} life={0.9} color="#ffd06a" />
  </>);
};

/* SPEED LINES (overlay): radial or horizontal streaks; k = intensity 0..1 */
export const SpeedLines: React.FC<{ t: number; k: number; mode?: "radial" | "down" | "side"; color?: string }> = ({ t, k, mode = "radial", color = "rgba(255,255,255,0.85)" }) => {
  if (k <= 0.01) return null; const W = 1080, H = 1920, L: React.ReactNode[] = [];
  for (let i = 0; i < 26; i++) { const ph = (t * 3 + rnd(i)) % 1;
    if (mode === "radial") { const a = rnd(i * 3) * TAU, r0 = 520 + ph * 300, r1 = r0 + 260 + rnd(i) * 300; L.push(<line key={i} x1={W / 2 + Math.cos(a) * r0} y1={H / 2 + Math.sin(a) * r0} x2={W / 2 + Math.cos(a) * r1} y2={H / 2 + Math.sin(a) * r1} stroke={color} strokeWidth={4 + rnd(i * 5) * 8} strokeLinecap="round" />); }
    else if (mode === "down") { const x = rnd(i * 3) * W, y = (ph * (H + 400)) - 400; L.push(<line key={i} x1={x} y1={y} x2={x} y2={y + 220 + rnd(i) * 200} stroke={color} strokeWidth={3 + rnd(i * 5) * 6} strokeLinecap="round" />); }
    else { const y = rnd(i * 3) * H, x = W - ph * (W + 600); L.push(<line key={i} x1={x} y1={y} x2={x + 300 + rnd(i) * 200} y2={y} stroke={color} strokeWidth={3 + rnd(i * 5) * 6} strokeLinecap="round" />); } }
  return <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: k, pointerEvents: "none" }}>{L}</svg>;
};
/* IMPACT FRAME (overlay): 2-3 frames of high-contrast flash at t0 (manga style) */
export const ImpactFrame: React.FC<{ t: number; t0: number; frames?: number; color?: string }> = ({ t, t0, frames = 3, color = "#ffffff" }) => {
  const f = (t - t0) * 30; if (f < 0 || f >= frames) return null;
  return <div style={{ position: "absolute", inset: 0, background: f < 1 ? color : "#0b0d1a", mixBlendMode: f < 1 ? "normal" : "difference", opacity: f < 1 ? 0.85 : 0.6, pointerEvents: "none" }} />;
};
/* camera shake list helper: only on big impacts. Returns [time, amplitude][] for <Cam impacts={...}> */
export const shakes = (...hits: [number, "small" | "big" | "huge"][]) => hits.map(([t, k]) => [t, k === "small" ? 0.015 : k === "big" ? 0.035 : 0.07] as [number, number]);
