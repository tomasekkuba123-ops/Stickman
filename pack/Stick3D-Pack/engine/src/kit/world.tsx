// WORLD KIT — reusable 3D building blocks that follow WORLD_RULES.md.
// <World preset="sunset" t={t} bloom> ...scene... </World> sets sky dome, lights, fog/haze, sun glow, god rays, rim light for characters.
// Terrain + instanced grass/flowers/rocks, wind trees/bushes, clouds, water with ripples + reflections, ambient life, foreground framing, HOME SET.
import React, { useMemo, useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { EffectComposer, Bloom as BloomFx } from "@react-three/postprocessing";
import { Box, Cyl, Ball, CanvasPlane, INK } from "../style/toon";
import { V3 } from "../style/kit";
import { SGlow } from "../style/sky";
import { GradientDome, Cloud3D, canvasTex, Bedroom, DrawingPaper, PAPER } from "../style/set3d";
import { LookContext, Look } from "./character";
import { SetDressing, SpaceBackdrop } from "./dressing";

const TAU = Math.PI * 2;
const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const ramp = (() => { const d = new Uint8Array([110, 185, 255]); const t = new THREE.DataTexture(d, 3, 1, THREE.RedFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();

/* ---------------- time-of-day presets ---------------- */
export type SkyName = "morning" | "day" | "sunset" | "night" | "magic" | "space";
export type SkyPreset = { stops: [number, string][]; stars: number; amb: number; sun: { pos: V3; color: string; i: number; glow: number }; fill: string; fog: [string, number, number]; look: Look; bg: string; clouds: string };
export const SKY: Record<SkyName, SkyPreset> = {
  morning: { stops: [[0, "#6fa8ff"], [0.5, "#ffd6c0"], [1, "#fff1d8"]], stars: 0, amb: 1.0, sun: { pos: [40, 22, -90], color: "#ffe2b8", i: 1.25, glow: 0.6 }, fill: "#a8c0ff", fog: ["#f6e0d0", 30, 140], look: { rim: "255,220,190", shade: "60,40,80", rimK: 0.4 }, bg: "#ffd6c0", clouds: "#fff4ec" },
  day: { stops: [[0, "#2f7ff0"], [0.55, "#8ccaff"], [1, "#e6f6ff"]], stars: 0, amb: 1.1, sun: { pos: [30, 60, -60], color: "#fff4d8", i: 1.4, glow: 0.35 }, fill: "#9ab8ff", fog: ["#cfe8ff", 40, 160], look: { rim: "255,250,235", shade: "20,30,70", rimK: 0.35 }, bg: "#8ccaff", clouds: "#ffffff" },
  sunset: { stops: [[0, "#5a3a9a"], [0.45, "#ff7a5a"], [0.72, "#ffc07a"], [1, "#ffe0b0"]], stars: 0, amb: 0.95, sun: { pos: [-40, 10, -90], color: "#ffb070", i: 1.3, glow: 0.8 }, fill: "#8a7aff", fog: ["#ffb88a", 25, 130], look: { rim: "255,190,120", shade: "60,20,60", rimK: 0.5 }, bg: "#ff9a6a", clouds: "#ffd8c0" },
  night: { stops: [[0, "#050a2a"], [0.6, "#122060"], [1, "#2a3a7a"]], stars: 1, amb: 0.6, sun: { pos: [-30, 40, -90], color: "#b8c8ff", i: 0.6, glow: 0.4 }, fill: "#3a4aa0", fog: ["#0e1640", 20, 120], look: { rim: "150,180,255", shade: "5,5,30", rimK: 0.5 }, bg: "#122060", clouds: "#8a94c8" },
  magic: { stops: [[0, "#2a0a5a"], [0.55, "#8a3ad8"], [1, "#ff8ad8"]], stars: 0.5, amb: 0.9, sun: { pos: [20, 30, -90], color: "#ffb0ff", i: 1.0, glow: 0.6 }, fill: "#6a5aff", fog: ["#6a3aa0", 20, 120], look: { rim: "255,150,255", shade: "40,0,60", rimK: 0.5 }, bg: "#8a3ad8", clouds: "#f0c8ff" },
  space: { stops: [[0, "#010108"], [0.55, "#05051a"], [1, "#0c0a2c"]], stars: 1, amb: 0.8, sun: { pos: [-40, 20, -60], color: "#f0f0ff", i: 1.3, glow: 0.3 }, fill: "#ff7ad8", fog: ["#05051a", 60, 200], look: { rim: "180,200,255", shade: "0,0,20", rimK: 0.45 }, bg: "#05051a", clouds: "#c8d0ff" },
};

/* ---------------- World wrapper ---------------- */
// bloom: 0 = off (default). Real bloom costs ~2-4x render time on the CPU renderer: use it for magic/glow scenes, not everywhere.
export const World: React.FC<{ preset: SkyName; t: number; fog?: boolean; bloom?: number; rays?: number; children?: React.ReactNode; stars?: number; backdrop?: boolean }> = ({ preset, t, fog = true, bloom = 0, rays = 0, children, stars, backdrop = true }) => {
  const P = SKY[preset];
  return (<LookContext.Provider value={P.look}>
    <ambientLight intensity={P.amb} /><directionalLight position={P.sun.pos} intensity={P.sun.i} color={P.sun.color} /><directionalLight position={[-P.sun.pos[0], 6, 10]} intensity={0.45} color={P.fill} />
    <GradientDome r={150} stops={P.stops} stars={stars ?? P.stars} />
    {fog ? <fog attach="fog" args={P.fog} /> : null}
    <SGlow p={[P.sun.pos[0] * 1.2, P.sun.pos[1] * 1.2, Math.max(-140, P.sun.pos[2] * 1.3)]} r={22} color={P.sun.color} o={P.sun.glow} />
    {P.stars > 0 || (stars ?? 0) > 0 ? <TwinkleStars t={t} n={60} /> : null}
    {preset === "space" && backdrop ? <SpaceBackdrop t={t} /> : null}
    {rays > 0 ? <GodRays from={P.sun.pos} t={t} o={rays} color={P.sun.color} /> : null}
    {children}
    {bloom > 0 ? <BloomPass k={bloom} /> : null}
  </LookContext.Provider>);
};
// real bloom (postprocessing); bright emissive / additive parts glow
export const BloomPass: React.FC<{ k?: number }> = ({ k = 0.6 }) => (
  <EffectComposer multisampling={0} resolutionScale={0.5}><BloomFx intensity={k} luminanceThreshold={0.78} luminanceSmoothing={0.2} mipmapBlur resolutionScale={0.5} /></EffectComposer>
);

/* ---------------- terrain ---------------- */
// gentle rolling ground: height at (x,z). Keep props on it with terrainY().
export const terrainY = (x: number, z: number, amp = 1) => amp * (Math.sin(x * 0.09) * 0.9 + Math.sin(z * 0.07 + 1) * 0.8 + Math.sin((x + z) * 0.21) * 0.25) - Math.max(0, -z - 40) * 0.05;
export const Terrain: React.FC<{ size?: number; color?: string; color2?: string; amp?: number; center?: V3 }> = ({ size = 160, color = "#5cc85a", color2 = "#49b04e", amp = 1, center = [0, 0, -30] }) => {
  const geo = useMemo(() => { const g = new THREE.PlaneGeometry(size, size, 120, 120); g.rotateX(-Math.PI / 2); const pos = g.attributes.position as THREE.BufferAttribute; const col: number[] = []; const c1 = new THREE.Color(color), c2 = new THREE.Color(color2);
    for (let i = 0; i < pos.count; i++) { const x = pos.getX(i) + center[0], z = pos.getZ(i) + center[2]; pos.setY(i, terrainY(x, z, amp)); const k = 0.5 + 0.5 * Math.sin(x * 0.3 + Math.sin(z * 0.2) * 2); const c = c1.clone().lerp(c2, k); col.push(c.r, c.g, c.b); }
    g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3)); g.computeVertexNormals(); return g; }, [size, color, color2, amp]);
  return <mesh geometry={geo} position={[center[0], 0, center[2]]}><meshToonMaterial vertexColors gradientMap={ramp} /></mesh>;
};

/* instanced grass blades with wind sway (updated each frame) */
export const Grass: React.FC<{ t: number; area?: [number, number]; c?: V3; n?: number; wind?: number; amp?: number; colors?: string[]; h?: number; lum?: number; glow?: [number, number, number, number]; wd?: number }> = ({ t, area = [30, 24], c = [0, 0, -4], n = 2500, wind = 1, amp = 1, colors = ["#3fbf4a", "#5ad65a", "#2fa04a"], h = 0.38, lum = 1, glow, wd = 1 }) => {
  const ref = useRef<THREE.InstancedMesh>(null); const geo = useMemo(() => bladeGeo(), []);
  const data = useMemo(() => Array.from({ length: n }, (_, i) => { const x = c[0] + (rnd(i) - 0.5) * area[0], z = c[2] + (rnd(i * 3 + 1) - 0.5) * area[1]; return { x, z, y: terrainY(x, z, amp), s: h * (0.6 + rnd(i * 7) * 0.8), r: rnd(i * 5) * TAU, col: colors[i % colors.length] }; }), [n, area[0], area[1], c[0], c[2], amp]);
  const m = useMemo(() => new THREE.Object3D(), []);
  useLayoutEffect(() => { const im = ref.current; if (!im) return; data.forEach((d, i) => { const sw = Math.sin(t * 2.2 + d.x * 0.6 + d.z * 0.4) * 0.22 * wind + 0.08 * wind; m.position.set(d.x, d.y, d.z); m.rotation.set(sw * 0.4, d.r, sw); m.scale.set(wd, d.s, wd); m.updateMatrix(); im.setMatrixAt(i, m.matrix); const cc = new THREE.Color(d.col).multiplyScalar(lum); if (glow) { const q = Math.max(0, 1 - Math.hypot(d.x - glow[0], d.z - glow[1]) / glow[2]) ** 1.5 * glow[3]; if (q > 0) cc.lerp(new THREE.Color("#fff1c0"), Math.min(0.85, q)).multiplyScalar(1 + q * 0.6); } im.setColorAt(i, cc); }); im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; });
  return <instancedMesh ref={ref} args={[geo, undefined, n]}><meshBasicMaterial vertexColors side={THREE.DoubleSide} /></instancedMesh>;
};
/* v18 smooth grass blade: curved, tapered, 5 segments; vertex shade dark base -> lit tip with a pale rim on the top third (never a black spike) */
export function bladeGeo() { const g = new THREE.BufferGeometry(), N = 5, pos: number[] = [], col: number[] = [], idx: number[] = [];
  for (let i = 0; i <= N; i++) { const u = i / N, w = 0.055 * (1 - u) ** 0.8 + 0.004, bend = 0.22 * u * u, sh = 0.42 + 0.58 * u + (u > 0.66 ? 0.35 * (u - 0.66) / 0.34 : 0);
    pos.push(-w, u, bend, w, u, bend); col.push(sh, sh, sh * 1.05, sh * 0.92, sh * 0.92, sh); if (i < N) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals(); return g; }
/* instanced flowers (stem + head) */
export const Flowers: React.FC<{ t: number; area?: [number, number]; c?: V3; n?: number; amp?: number; colors?: string[] }> = ({ t, area = [24, 18], c = [0, 0, -4], n = 220, amp = 1, colors = ["#ff6aa8", "#ffd23a", "#ffffff", "#b88cff", "#ff8a3a"] }) => {
  const heads = useRef<THREE.InstancedMesh>(null), stems = useRef<THREE.InstancedMesh>(null);
  const data = useMemo(() => Array.from({ length: n }, (_, i) => { const x = c[0] + (rnd(i * 11) - 0.5) * area[0], z = c[2] + (rnd(i * 13 + 2) - 0.5) * area[1]; return { x, z, y: terrainY(x, z, amp), h: 0.35 + rnd(i) * 0.3, col: colors[i % colors.length] }; }), [n, area[0], area[1], c[0], c[2], amp]);
  const m = useMemo(() => new THREE.Object3D(), []);
  useLayoutEffect(() => { data.forEach((d, i) => { const sw = Math.sin(t * 1.8 + d.x) * 0.08; m.position.set(d.x + sw * d.h, d.y + d.h, d.z); m.rotation.set(0, 0, 0); m.scale.setScalar(1); m.updateMatrix(); heads.current?.setMatrixAt(i, m.matrix); heads.current?.setColorAt(i, new THREE.Color(d.col));
    m.position.set(d.x + sw * d.h * 0.5, d.y + d.h / 2, d.z); m.rotation.set(0, 0, -sw); m.scale.set(1, d.h, 1); m.updateMatrix(); stems.current?.setMatrixAt(i, m.matrix); });
    for (const r of [heads.current, stems.current]) if (r) { r.instanceMatrix.needsUpdate = true; if (r.instanceColor) r.instanceColor.needsUpdate = true; } });
  return (<><instancedMesh ref={heads} args={[undefined, undefined, n]}><sphereGeometry args={[0.09, 8, 6]} /><meshToonMaterial gradientMap={ramp} /></instancedMesh>
    <instancedMesh ref={stems} args={[undefined, undefined, n]}><cylinderGeometry args={[0.015, 0.015, 1, 4]} /><meshToonMaterial color="#2c9c54" gradientMap={ramp} /></instancedMesh></>);
};
/* instanced rocks */
export const Rocks: React.FC<{ area?: [number, number]; c?: V3; n?: number; amp?: number; color?: string }> = ({ area = [40, 30], c = [0, 0, -8], n = 40, amp = 1, color = "#9aa0b8" }) => {
  const ref = useRef<THREE.InstancedMesh>(null); const m = useMemo(() => new THREE.Object3D(), []);
  useLayoutEffect(() => { for (let i = 0; i < n; i++) { const x = c[0] + (rnd(i * 17) - 0.5) * area[0], z = c[2] + (rnd(i * 19) - 0.5) * area[1], s = 0.15 + rnd(i * 23) * 0.5; m.position.set(x, terrainY(x, z, amp) + s * 0.2, z); m.rotation.set(rnd(i) * 3, rnd(i + 1) * 3, 0); m.scale.set(s * 1.4, s * 0.8, s); m.updateMatrix(); ref.current?.setMatrixAt(i, m.matrix); } if (ref.current) ref.current.instanceMatrix.needsUpdate = true; }, [n]);
  return <instancedMesh ref={ref} args={[undefined, undefined, n]}><dodecahedronGeometry args={[1, 0]} /><meshToonMaterial color={color} gradientMap={ramp} /></instancedMesh>;
};

/* trees + bushes with wind sway (outlined toon foliage clusters) */
const Foliage: React.FC<{ p: V3; r: number; color: string }> = ({ p, r, color }) => (<group position={p}><mesh><icosahedronGeometry args={[r, 2]} /><meshToonMaterial color={color} gradientMap={ramp} /></mesh><mesh scale={1.06}><icosahedronGeometry args={[r, 2]} /><meshBasicMaterial color={INK} side={THREE.BackSide} /></mesh></group>);
export const WindTree: React.FC<{ p: V3; t: number; s?: number; seed?: number; wind?: number; kind?: "round" | "pine" | "blossom" }> = ({ p, t, s = 1, seed = 1, wind = 1, kind = "round" }) => {
  const sw = Math.sin(t * 1.3 + seed) * 0.035 * wind + Math.sin(t * 3.1 + seed * 2) * 0.012 * wind;
  const leaf = kind === "blossom" ? ["#ff9ac8", "#ffb8d8", "#ff7ab0"] : ["#3fbf5a", "#2fa04a", "#5ad66a"];
  return (<group position={p} scale={s}>
    <Cyl p={[0, 1.0, 0]} rt={0.14} rb={0.24} h={2.0} color="#8a5a32" line={3} />
    <group position={[0, 2.0, 0]} rotation={[sw * 0.5, 0, sw]}>
      {kind === "pine" ? [0, 1, 2].map((i) => <group key={i}><mesh position={[0, 0.4 + i * 0.8, 0]}><coneGeometry args={[1.3 - i * 0.32, 1.4, 8]} /><meshToonMaterial color="#2f8f4a" gradientMap={ramp} /></mesh></group>)
        : Array.from({ length: 6 }, (_, i) => <Foliage key={i} p={[Math.cos(i * 1.7 + seed) * 0.7 * (i ? 1 : 0), 0.6 + (i % 3) * 0.45, Math.sin(i * 1.7 + seed) * 0.5 * (i ? 1 : 0)]} r={0.75 + rnd(i + seed) * 0.35} color={leaf[i % 3]} />)}
    </group></group>);
};
export const Bush: React.FC<{ p: V3; t: number; s?: number; seed?: number; flowers?: string }> = ({ p, t, s = 1, seed = 1, flowers }) => (
  <group position={p} scale={s} rotation={[0, 0, Math.sin(t * 1.7 + seed) * 0.03]}>{Array.from({ length: 4 }, (_, i) => <Foliage key={i} p={[(i - 1.5) * 0.45, 0.35 + (i % 2) * 0.2, (i % 2) * 0.2]} r={0.45 + rnd(i * seed) * 0.15} color={i % 2 ? "#2fa04a" : "#3fbf5a"} />)}
    {flowers ? [0, 1, 2, 3, 4].map((i) => <Ball key={"f" + i} p={[(rnd(i + seed) - 0.5) * 1.4, 0.5 + rnd(i * 3) * 0.4, 0.4]} r={0.08} color={flowers} ink={0.02} />) : null}</group>
);
export const Clouds: React.FC<{ t: number; preset?: SkyName; n?: number; y?: number; drift?: number }> = ({ t, preset = "day", n = 8, y = 14, drift = 0.25 }) => (
  <>{Array.from({ length: n }, (_, i) => <Cloud3D key={i} p={[((i * 17.3 + t * drift) % 90) - 45, y + rnd(i) * 8, -30 - rnd(i * 3) * 50]} s={1.6 + rnd(i * 7) * 1.8} seed={i + 5} tint={SKY[preset].clouds} />)}</>
);

/* water: animated ripple texture + sky reflection band + sparkle highlights; Ripples = expanding rings */
export const Water: React.FC<{ p: V3; s: [number, number]; t: number; color?: string; sky?: string }> = ({ p, s, t, color = "#3fb0e8", sky = "#bfe6ff" }) => {
  const tex = useMemo(() => { const t2 = canvasTex("water|" + color + sky, 512, 512, (c, W, H) => { c.fillStyle = color; c.fillRect(0, 0, W, H); for (let i = 0; i < 70; i++) { const y = rnd(i) * H, x = rnd(i * 3) * W, w = 30 + rnd(i * 5) * 90; c.strokeStyle = i % 3 ? "rgba(255,255,255,0.35)" : sky; c.lineWidth = 4; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + w / 2, y - 6, x + w, y); c.stroke(); } }); const c2 = t2.clone(); c2.wrapS = c2.wrapT = THREE.RepeatWrapping; c2.repeat.set(s[0] / 8, s[1] / 8); c2.needsUpdate = true; return c2; }, [color, sky, s[0], s[1]]);
  tex.offset.set(Math.sin(t * 0.2) * 0.05, t * 0.03);
  return (<group position={p}>
    <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={s} /><meshToonMaterial map={tex} gradientMap={ramp} transparent opacity={0.95} /></mesh>
    {Array.from({ length: 10 }, (_, i) => <SGlow key={i} p={[(rnd(i * 7) - 0.5) * s[0] * 0.8, 0.05, (rnd(i * 9) - 0.5) * s[1] * 0.8]} r={0.18} color="#ffffff" o={0.5 + 0.5 * Math.sin(t * 5 + i * 1.7)} />)}
  </group>);
};
export const Ripples: React.FC<{ c: V3; t: number; t0: number; n?: number; life?: number; r?: number }> = ({ c, t, t0, n = 3, life = 1.6, r = 1.6 }) => (
  <>{Array.from({ length: n }, (_, i) => { const u = (t - t0 - i * 0.25) / life; if (u < 0 || u > 1) return null; return <mesh key={i} position={[c[0], c[1] + 0.02, c[2]]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[r * u, r * u + 0.06, 48]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.8 * (1 - u)} depthWrite={false} /></mesh>; })}</>
);
/* god rays from a light source direction */
export const GodRays: React.FC<{ from: V3; t: number; o?: number; color?: string; at?: V3; n?: number }> = ({ from, t, o = 0.12, color = "#ffe6a8", at = [0, 0, -6], n = 5 }) => {
  const d = new THREE.Vector3(at[0] - from[0], at[1] - from[1], at[2] - from[2]).normalize(); const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), d); const e = new THREE.Euler().setFromQuaternion(q);
  return (<group position={[at[0] - d.x * 14, at[1] - d.y * 14 + 4, at[2] - d.z * 14]} rotation={e}>{Array.from({ length: n }, (_, i) => <mesh key={i} position={[(i - n / 2) * 1.3, 0, Math.sin(i) * 0.5]} rotation={[0, i * 0.4, 0]}><planeGeometry args={[0.9 + (i % 2) * 0.6, 34]} /><meshBasicMaterial color={color} transparent opacity={o * (0.6 + 0.4 * Math.sin(t * 0.8 + i))} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} fog={false} /></mesh>)}</group>);
};

/* ---------------- ambient life ---------------- */
export const Birds: React.FC<{ t: number; n?: number; c?: V3; r?: number }> = ({ t, n = 5, c = [0, 12, -30], r = 14 }) => (
  <>{Array.from({ length: n }, (_, i) => { const a = t * 0.25 + i * 0.7, f = Math.sin(t * 9 + i) * 0.6; const p: V3 = [c[0] + Math.cos(a) * r + i, c[1] + Math.sin(a * 2 + i) * 1.2 + i * 0.4, c[2] + Math.sin(a) * r * 0.4];
    return <group key={i} position={p} rotation={[0, -a, 0]}>{[-1, 1].map((sd) => <mesh key={sd} position={[sd * 0.22, 0, 0]} rotation={[0, 0, sd * f]}><boxGeometry args={[0.45, 0.04, 0.12]} /><meshBasicMaterial color="#1a1a2a" /></mesh>)}<mesh><sphereGeometry args={[0.09, 8, 6]} /><meshBasicMaterial color="#1a1a2a" /></mesh></group>; })}</>
);
export const Butterflies: React.FC<{ t: number; n?: number; c?: V3; area?: number; colors?: string[] }> = ({ t, n = 6, c = [0, 1.2, -2], area = 5, colors = ["#ffd23a", "#ff6aa8", "#7ad8ff", "#ff9a3a"] }) => (
  <>{Array.from({ length: n }, (_, i) => { const a = t * (0.5 + rnd(i) * 0.4) + i * 2; const p: V3 = [c[0] + Math.sin(a) * area * (0.5 + rnd(i * 3) * 0.5), c[1] + Math.sin(a * 2.3) * 0.5 + rnd(i) * 1.2, c[2] + Math.cos(a * 0.8) * area * 0.4]; const f = Math.abs(Math.sin(t * 14 + i)) * 1.2;
    return <group key={i} position={p} rotation={[0, a, 0]}>{[-1, 1].map((sd) => <mesh key={sd} position={[sd * 0.09, 0, 0]} rotation={[0, sd * f, 0]}><circleGeometry args={[0.12, 10]} /><meshBasicMaterial color={colors[i % colors.length]} side={THREE.DoubleSide} /></mesh>)}</group>; })}</>
);
export const Fireflies: React.FC<{ t: number; n?: number; c?: V3; area?: [number, number, number]; color?: string }> = ({ t, n = 24, c = [0, 1.5, -4], area = [12, 3, 8], color = "#fff27a" }) => (
  <>{Array.from({ length: n }, (_, i) => <SGlow key={i} p={[c[0] + Math.sin(t * 0.4 + i * 1.3) * area[0] * 0.5 * rnd(i), c[1] + Math.sin(t * 0.7 + i) * area[1] * 0.4, c[2] + Math.cos(t * 0.3 + i * 2.1) * area[2] * 0.5 * rnd(i + 5)]} r={0.12} color={color} o={0.35 + 0.65 * Math.max(0, Math.sin(t * 3 + i * 2.7))} />)}</>
);
export const DustMotes: React.FC<{ t: number; n?: number; c?: V3; area?: [number, number, number] }> = ({ t, n = 30, c = [0, 1.5, -3], area = [8, 4, 6] }) => (
  <>{Array.from({ length: n }, (_, i) => <SGlow key={i} p={[c[0] + (rnd(i) - 0.5) * area[0] + Math.sin(t * 0.3 + i) * 0.3, c[1] + (((rnd(i + 3) * area[1] + t * 0.12) % area[1]) - area[1] / 2), c[2] + (rnd(i + 7) - 0.5) * area[2]]} r={0.04} color="#fff4d0" o={0.7} />)}</>
);
export const FallingLeaves: React.FC<{ t: number; n?: number; c?: V3; area?: [number, number]; colors?: string[] }> = ({ t, n = 14, c = [0, 6, -2], area = [10, 6], colors = ["#ff9a3a", "#ffd23a", "#e5483f", "#8ee06a"] }) => (
  <>{Array.from({ length: n }, (_, i) => { const u = ((t * 0.12 + rnd(i)) % 1); const p: V3 = [c[0] + (rnd(i * 3) - 0.5) * area[0] + Math.sin(t * 1.5 + i) * 0.8, c[1] - u * 7, c[2] + (rnd(i * 5) - 0.5) * area[1]];
    return <mesh key={i} position={p} rotation={[t * 2 + i, t * 1.3 + i, Math.sin(t * 2 + i)]}><circleGeometry args={[0.12, 6]} /><meshBasicMaterial color={colors[i % colors.length]} side={THREE.DoubleSide} /></mesh>; })}</>
);
export const TwinkleStars: React.FC<{ t: number; n?: number }> = ({ t, n = 60 }) => (
  <>{Array.from({ length: n }, (_, i) => { const a = rnd(i) * TAU, e = 0.15 + rnd(i * 3) * 1.1; return <SGlow key={i} p={[Math.cos(a) * Math.cos(e) * 120, Math.sin(e) * 120, Math.sin(a) * Math.cos(e) * 120 - 20]} r={0.5 + rnd(i * 5) * 0.8} color={rnd(i * 7) > 0.8 ? "#ffd6f0" : "#ffffff"} o={0.3 + 0.7 * Math.max(0, Math.sin(t * (1.5 + rnd(i) * 3) + i))} />; })}</>
);

/* ---------------- foreground framing with depth of field ----------------
   Rendered as an HTML/canvas overlay ABOVE the 3D canvas, blurred (shallow DOF look) and parallaxed by the camera drift.
   kind: "leaves" (branch tips in a corner), "grass" (blades along the bottom), "frame" (window/door edge), "bokeh" (soft light dots). */
export const Foreground: React.FC<{ t: number; kind?: "leaves" | "grass" | "bokeh" | "frame"; side?: "left" | "right" | "bottom"; blur?: number; color?: string; parallax?: number }> = ({ t, kind = "leaves", side = "left", blur = 10, color = "#2f8f4a", parallax = 30 }) => {
  const dx = Math.sin(t * 0.5) * parallax, W = 1080, H = 1920;
  const shapes: React.ReactNode[] = [];
  if (kind === "leaves") for (let i = 0; i < 9; i++) { const x = side === "left" ? -60 + rnd(i) * 260 : W - 200 + rnd(i) * 260, y = 40 + rnd(i * 3) * 520, r = 60 + rnd(i * 5) * 70; shapes.push(<ellipse key={i} cx={x + dx} cy={y} rx={r} ry={r * 0.45} transform={`rotate(${rnd(i * 7) * 180 + Math.sin(t + i) * 6} ${x + dx} ${y})`} fill={i % 2 ? color : "#3fbf5a"} stroke="#0b0d1a" strokeWidth={8} />); }
  if (kind === "grass") for (let i = 0; i < 40; i++) { const x = i * 28 + (rnd(i) - 0.5) * 20, h = 160 + rnd(i * 3) * 200, sw = Math.sin(t * 2 + i * 0.5) * 30; shapes.push(<path key={i} d={`M ${x + dx - 14} ${H} Q ${x + dx + sw * 0.5} ${H - h * 0.5} ${x + dx + sw} ${H - h} Q ${x + dx + 6} ${H - h * 0.5} ${x + dx + 14} ${H} Z`} fill={i % 2 ? "#3fbf5a" : "#2fa04a"} stroke="#0b0d1a" strokeWidth={5} />); }
  if (kind === "bokeh") for (let i = 0; i < 14; i++) shapes.push(<circle key={i} cx={(rnd(i) * W + dx * 2 + t * 10) % W} cy={rnd(i * 3) * H} r={30 + rnd(i * 5) * 60} fill={rnd(i * 7) > 0.5 ? "#fff0b0" : "#ffb8e8"} opacity={0.25 + 0.15 * Math.sin(t * 2 + i)} />);
  if (kind === "frame") shapes.push(<rect key="f" x={side === "left" ? -40 + dx : W - 140 + dx} y={-20} width={180} height={H + 40} fill={color} stroke="#0b0d1a" strokeWidth={10} />);
  return <svg width={W} height={H} style={{ position: "absolute", inset: 0, filter: `blur(${blur}px)`, pointerEvents: "none" }}>{shapes}</svg>;
};

/* ---------------- HOME SET: Stickman's bedroom (start / end episodes here) ----------------
   Re-uses the EP03 bedroom: desk + drawing paper, window with city, curtains, shelves, lamp, rug, posters, bed, plant, light rays, dust motes.
   HOME.hero = where Stickman stands at the desk; HOME.paper = paper centre; HOME.cams = good camera keys (wide / desk / window). */
export const HOME = { hero: [-0.55, 0, -3.65] as V3, heroSide: [-2.9, 0, -2.2] as V3, paper: PAPER, window: [2.4, 4.3, -5.8] as V3, bed: [4.8, 0, -3.5] as V3 };
export const HomeSet: React.FC<{ t: number; preset?: SkyName; paper?: { body: number; fin1: number; fin2: number; win: number } | null; shake?: number; dress?: boolean; children?: React.ReactNode; noBed?: boolean }> = ({ t, preset = "sunset", paper = null, shake = 0, noBed = false, dress = true, children }) => ( // preset "night" = moonlit window + lamp light
  <LookContext.Provider value={SKY[preset].look}>
    <Bedroom t={t} shake={shake} night={preset === "night"} noBed={noBed} />
    {paper ? <DrawingPaper t={t} parts={paper} /> : null}
    <DustMotes t={t} c={[0.5, 2.5, -3]} area={[6, 3, 4]} n={20} />
    {dress ? <SetDressing kind="room" anchor={HOME.hero} keep={2.6} bounds={[-6, 6, -5.4, 3.2]} n={26} seed={4} t={t} /> : null}
    {children}
  </LookContext.Provider>
);
void Box; void CanvasPlane; void useThree;

/* SAFE GRADE (overlay): neutral vignette only. Colour mood comes from the <World> preset lights/sky — never from a full-frame CSS tint,
   which would tint Stickman's white head (STYLE rule: his head stays white in every scene). */
export const SafeGrade: React.FC<{ k?: number }> = ({ k = 0.35 }) => (
  <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: `radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 62%, rgba(5,8,30,${k}) 100%)` }} />
);
