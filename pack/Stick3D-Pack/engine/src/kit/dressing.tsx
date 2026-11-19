// SET DRESSING — scatters 20-40 props per location in THREE DEPTH ZONES (foreground / midground / background) so no set looks empty.
//   <SetDressing kind="room" anchor={HOME.hero} keep={2.2} bounds={[-6, 6, -5.6, 4]} n={30} seed={3} t={t} />
// kind: room | moon | space | meadow. anchor = where the action happens (kept clear within `keep` radius); bounds = [xmin,xmax,zmin,zmax];
// zones are measured along +z (towards the default camera): fore z > anchor+1.5, mid |dz| <= 1.5, back z < anchor-1.5. ground(x,z) gives the floor height.
import React from "react";
import * as THREE from "three";
import { Box, Cyl, Ball, INK } from "../style/toon";
import { V3 } from "../style/kit";
import { SGlow } from "../style/sky";
import { CloudPuff } from "./puff";

const TAU = Math.PI * 2;
const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const ramp = (() => { const d = new Uint8Array([100, 180, 255]); const t = new THREE.DataTexture(d, 3, 1, THREE.RedFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
const C = ["#e5483f", "#3a6fd8", "#f0b429", "#2fb87a", "#7a54d6", "#ff8fb0", "#ff8a3a"];
type PropFn = (k: number, t: number) => React.ReactNode; // k = seed

/* ---------- prop libraries (all toon + ink outlines, sized for a 3-unit Stickman) ---------- */
const ROOM: PropFn[] = [
  (k) => <group>{[0, 1, 2, 3].map((i) => <Box key={i} p={[0, 0.07 + i * 0.13, 0]} s={[0.7 - i * 0.05, 0.12, 0.5]} color={C[(k + i) % 7]} line={2} rot={[0, (rnd(k + i) - 0.5) * 0.5, 0]} />)}</group>, // book stack
  (k) => <group><Cyl p={[0, 0.25, 0]} rt={0.28} rb={0.2} h={0.5} color="#e07a4a" line={2} />{[0, 1, 2, 3].map((i) => <Ball key={i} p={[Math.cos(i * 1.6) * 0.18, 0.62 + (i % 2) * 0.16, Math.sin(i * 1.6) * 0.18]} r={0.24} color={i % 2 ? "#3fbf5a" : "#2fa04a"} />)}</group>, // potted plant
  (k) => <group>{[0, 1, 2].map((i) => <Box key={i} p={[(i - 1) * 0.3, 0.13 + (i === 1 ? 0.26 : 0), 0]} s={[0.26, 0.26, 0.26]} color={C[(k + i * 2) % 7]} line={2} rot={[0, rnd(k * 3 + i), 0]} />)}</group>, // toy blocks
  (k) => <Ball p={[0, 0.28, 0]} r={0.28} color={C[k % 7]} />, // ball
  (k) => <group><Box p={[0, 0.3, 0]} s={[0.8, 0.6, 0.6]} color="#c8955a" line={3} /><Box p={[0, 0.62, 0.0]} s={[0.84, 0.06, 0.64]} color="#b07840" line={2} rot={[0.3 * rnd(k), 0, 0]} /></group>, // cardboard box
  (k) => <group><Box p={[0, 0.08, 0]} s={[0.55, 0.16, 0.22]} color="#e5483f" line={2} /><Box p={[0.62, 0.08, 0.05]} s={[0.55, 0.16, 0.22]} color="#e5483f" line={2} rot={[0, 0.4, 0]} /></group>, // sneakers
  (k) => <group>{[0, 1, 2].map((i) => <Ball key={i} p={[(rnd(k + i) - 0.5) * 0.8, 0.1, (rnd(k * 2 + i) - 0.5) * 0.6]} r={0.1} color="#fffdf4" ink={0.02} />)}</group>, // crumpled paper
  (k) => <group><Box p={[0, 0.22, 0]} s={[1.0, 0.44, 0.7]} color={C[(k + 4) % 7]} line={3} /><Box p={[0, 0.5, -0.2]} s={[1.0, 0.3, 0.3]} color={C[(k + 4) % 7]} line={2} /></group>, // cushion / pouf
  (k) => <group><Cyl p={[0, 0.15, 0]} rt={0.12} h={0.3} color="#ffffff" line={2} /><Cyl p={[0.15, 0.17, 0]} rt={0.05} h={0.12} color="#ffffff" line={1} rot={[0, 0, Math.PI / 2]} /></group>, // mug
  (k) => <group><Box p={[0, 0.25, 0]} s={[0.4, 0.5, 0.3]} color="#c0c8dc" line={2} /><Box p={[0, 0.3, 0.16]} s={[0.26, 0.16, 0.02]} color="#2fd4c8" line={1} /><Cyl p={[0, 0.6, 0]} rt={0.02} h={0.2} color={INK} line={1} /></group>, // toy robot
];
const MOON: PropFn[] = [
  (k) => <mesh position={[0, 0.15, 0]} rotation={[rnd(k), rnd(k + 1) * 3, 0]} scale={[1.2, 0.7, 1]}><dodecahedronGeometry args={[0.35 + rnd(k) * 0.5, 0]} /><meshToonMaterial color="#a8a2c0" gradientMap={ramp} /></mesh>,
  (k) => <group><mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}><torusGeometry args={[0.9 + rnd(k), 0.16, 8, 28]} /><meshToonMaterial color="#c8c4d8" gradientMap={ramp} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.14, 0]}><torusGeometry args={[0.9 + rnd(k), 0.05, 6, 28, Math.PI * 0.8]} /><meshBasicMaterial color="#ffffff" /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}><circleGeometry args={[0.9 + rnd(k), 28]} /><meshBasicMaterial color="#8a84a8" /></mesh></group>, // small crater with lit rim
  (k) => <group>{Array.from({ length: 6 }, (_, i) => <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[(i % 2 ? 0.18 : -0.18), 0.02, -i * 0.55]}><circleGeometry args={[0.11, 12]} /><meshBasicMaterial color="#6a6488" transparent opacity={0.8} /></mesh>)}</group>, // footprints
  (k) => <group>{[0, 1, 2].map((i) => <mesh key={i} position={[(i - 1) * 0.5, 0.12, rnd(k + i) * 0.3]} rotation={[rnd(i), rnd(k + i), 0]}><icosahedronGeometry args={[0.15 + rnd(k * 2 + i) * 0.15, 0]} /><meshToonMaterial color="#b8b2cc" gradientMap={ramp} /></mesh>)}</group>, // pebbles
  (k) => <group><Cyl p={[0, 0.8, 0]} rt={0.03} h={1.6} color="#c0c8dc" line={1} /><Box p={[0.25, 1.4, 0]} s={[0.5, 0.32, 0.02]} color={C[k % 7]} line={2} /></group>, // flag
  (k) => <group><Cyl p={[0, 0.5, 0]} rt={0.05} h={1.0} color="#8a92a8" line={1} /><mesh position={[0, 1.05, 0]} rotation={[0.6, 0, 0]}><coneGeometry args={[0.35, 0.18, 16, 1, true]} /><meshToonMaterial color="#e4eaf6" gradientMap={ramp} side={THREE.DoubleSide} /></mesh></group>, // antenna dish
];
const MEADOW: PropFn[] = [
  (k) => <group>{[0, 1, 2, 3, 4].map((i) => <group key={i} position={[(rnd(k + i) - 0.5) * 0.7, 0, (rnd(k * 3 + i) - 0.5) * 0.5]}><Cyl p={[0, 0.18, 0]} rt={0.015} h={0.36} color="#2c9c54" line={1} /><Ball p={[0, 0.38, 0]} r={0.08} color={C[(k + i) % 7]} ink={0.02} /></group>)}</group>,
  (k) => <group><Cyl p={[0, 0.12, 0]} rt={0.06} h={0.24} color="#fff4dc" line={1} /><mesh position={[0, 0.26, 0]}><sphereGeometry args={[0.2, 14, 10, 0, TAU, 0, Math.PI / 2]} /><meshToonMaterial color="#e5483f" gradientMap={ramp} /></mesh>{[0, 1, 2].map((i) => <Ball key={i} p={[Math.cos(i * 2) * 0.1, 0.38, Math.sin(i * 2) * 0.1]} r={0.03} color="#ffffff" ink={0.01} />)}</group>, // mushroom
  (k) => <Cyl p={[0, 0.2, 0]} rt={0.2} h={1.4} color="#8a5a32" line={3} rot={[0, rnd(k) * 3, Math.PI / 2]} />, // log
  (k) => <mesh position={[0, 0.2, 0]} rotation={[rnd(k), rnd(k + 1) * 3, 0]} scale={[1.3, 0.7, 1]}><dodecahedronGeometry args={[0.3 + rnd(k) * 0.3, 0]} /><meshToonMaterial color="#9aa0b8" gradientMap={ramp} /></mesh>,
  (k) => <group>{[0, 1, 2].map((i) => <Ball key={i} p={[(i - 1) * 0.35, 0.3 + (i % 2) * 0.1, 0]} r={0.32} color={i % 2 ? "#2fa04a" : "#3fbf5a"} />)}</group>, // bush
];
const SPACE: PropFn[] = [
  (k) => <mesh rotation={[rnd(k) * 3, rnd(k + 1) * 3, 0]}><dodecahedronGeometry args={[0.3 + rnd(k) * 0.8, 0]} /><meshToonMaterial color="#8a84a8" gradientMap={ramp} /></mesh>, // asteroid
  (k) => <group><Ball p={[0, 0, 0]} r={0.5 + rnd(k) * 0.6} color={C[k % 7]} /><mesh rotation={[1.2, 0.2, 0]}><ringGeometry args={[0.9 + rnd(k) * 0.6, 1.3 + rnd(k) * 0.6, 40]} /><meshBasicMaterial color="#ffe6a8" side={THREE.DoubleSide} transparent opacity={0.7} /></mesh></group>, // small ringed planet
];
const LIB: Record<string, PropFn[]> = { room: ROOM, moon: MOON, meadow: MEADOW, space: SPACE };

export const SetDressing: React.FC<{ kind: "room" | "moon" | "space" | "meadow"; anchor?: V3; keep?: number; bounds?: [number, number, number, number]; n?: number; seed?: number; t?: number; ground?: (x: number, z: number) => number; zones?: [number, number, number] }> =
  ({ kind, anchor = [0, 0, 0], keep = 2.4, bounds = [-10, 10, -14, 5], n = 30, seed = 1, t = 0, ground = () => 0, zones = [0.25, 0.4, 0.35] }) => {
  const lib = LIB[kind], out: React.ReactNode[] = [];
  const counts = zones.map((z) => Math.round(z * n)); let id = 0;
  counts.forEach((cnt, zi) => { let made = 0, tries = 0;
    while (made < cnt && tries < cnt * 25) { tries++; const k = seed * 101 + id * 7 + tries;
      const x = bounds[0] + rnd(k) * (bounds[1] - bounds[0]); let z: number;
      if (zi === 0) z = anchor[2] + 1.5 + rnd(k + 1) * Math.max(0.5, bounds[3] - anchor[2] - 1.5);        // foreground
      else if (zi === 1) z = anchor[2] - 1.5 + rnd(k + 1) * 3;                                              // midground
      else z = bounds[2] + rnd(k + 1) * Math.max(0.5, anchor[2] - 1.5 - bounds[2]);                         // background
      if (z < bounds[2] || z > bounds[3]) continue;
      if (Math.hypot(x - anchor[0], z - anchor[2]) < keep) continue;                                         // keep the action area clear
      if (zi === 0 && Math.abs(x - anchor[0]) < keep * 1.2) continue;                                       // foreground props frame the shot from the sides
      const f = lib[(k * 13) % lib.length]; const s = kind === "space" ? 1 : zi === 2 ? 1.25 : 1;
      out.push(<group key={id++} position={[x, kind === "space" ? anchor[1] + (rnd(k + 5) - 0.3) * 8 : ground(x, z), z]} rotation={[0, rnd(k + 2) * TAU, 0]} scale={s}>{f(k, t)}</group>); made++; } });
  return <>{out}</>;
};

/* SPACE BACKDROP: nebula clouds, planets, three star layers at different depths (parallax) */
const nebTex = new Map<string, THREE.CanvasTexture>();
const nebula = (a: string, b: string, seed: number) => { const key = a + b + seed; const hit = nebTex.get(key); if (hit) return hit; const cv = document.createElement("canvas"); cv.width = cv.height = 512; const c = cv.getContext("2d")!;
  for (let i = 0; i < 70; i++) { const x = 256 + (rnd(seed + i) - 0.5) * 360, y = 256 + (rnd(seed * 3 + i) - 0.5) * 240, r = 40 + rnd(seed * 7 + i) * 120; const g = c.createRadialGradient(x, y, 0, x, y, r); const col = i % 3 ? a : b; g.addColorStop(0, col); g.addColorStop(1, "rgba(0,0,0,0)"); c.globalAlpha = 0.18; c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; nebTex.set(key, t); return t; };
export const SpaceBackdrop: React.FC<{ t: number; seed?: number }> = ({ t, seed = 1 }) => (<>
  {[["#ff5ad0", "#7a5aff", -120, 30, 20, 120], ["#5ad0ff", "#a05aff", -140, -50, 40, 140], ["#ffb05a", "#ff5a8a", -110, 60, -20, 90]].map(([a, b, z, x, y, s], i) =>
    <mesh key={i} position={[x as number, y as number, z as number]} rotation={[0, 0, i]}><planeGeometry args={[s as number, (s as number) * 0.6]} /><meshBasicMaterial map={nebula(a as string, b as string, seed + i)} transparent blending={THREE.AdditiveBlending} depthWrite={false} fog={false} /></mesh>)}
  {[[-40, 25, -90, 9, "#e5a84a", true], [55, -10, -110, 14, "#5a8aff", false], [20, 40, -130, 5, "#ff8a8a", false]].map(([x, y, z, r, col, ring], i) => <group key={i} position={[x as number, y as number, z as number]}>
    <mesh><sphereGeometry args={[r as number, 32, 24]} /><meshToonMaterial color={col as string} gradientMap={ramp} /></mesh><mesh scale={1.03}><sphereGeometry args={[r as number, 24, 16]} /><meshBasicMaterial color={INK} side={THREE.BackSide} /></mesh>
    {ring ? <mesh rotation={[1.25, 0.3, 0]}><ringGeometry args={[(r as number) * 1.4, (r as number) * 2.1, 64]} /><meshBasicMaterial color="#ffe6b0" transparent opacity={0.65} side={THREE.DoubleSide} /></mesh> : null}</group>)}
  {[40, 80, 140].map((d, L) => Array.from({ length: 40 }, (_, i) => { const a = rnd(i + L * 100) * TAU, e = (rnd(i * 3 + L * 50) - 0.3) * 1.2; return <SGlow key={L + "_" + i} p={[Math.cos(a) * d, Math.sin(e) * d * 0.6, -Math.abs(Math.sin(a)) * d - 10]} r={(0.25 + rnd(i * 5) * 0.3) * (1 + L * 0.8)} color={rnd(i * 7 + L) > 0.85 ? "#ffd6f0" : "#ffffff"} o={0.4 + 0.5 * Math.max(0, Math.sin(t * (1 + L) + i))} />; }))}
</>);
void CloudPuff;
