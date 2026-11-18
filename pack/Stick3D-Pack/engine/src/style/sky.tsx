// Sky-kingdom props (EP02): sky dome, toon clouds, floating islands, golden rope bridge, windmills, birds, castle,
// storm crystal, chalk key, chalk stroke drawings, cached glow sprites, bubbles, the baby dragon billboard.
import React, { useMemo } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { Box, Cyl, Ball, CanvasPlane, Billboard, Shadow, INK } from "./toon";
import { V3, clamp, lerp } from "./kit";
import { Extrude } from "./extra";
import { drawDragon, DragonPose } from "./dragon";

const cloudRamp = (() => { const d = new Uint8Array([205, 238, 255]); const t = new THREE.DataTexture(d, 3, 1, THREE.RedFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
const Puff: React.FC<{ p: V3; r: number; color: string }> = ({ p, r, color }) => (<group position={p}><mesh><sphereGeometry args={[r, 18, 14]} /><meshToonMaterial color={color} gradientMap={cloudRamp} /></mesh><mesh><sphereGeometry args={[r + 0.06, 18, 14]} /><meshBasicMaterial color={INK} side={THREE.BackSide} /></mesh></group>);
const ramp = (() => { const d = new Uint8Array([90, 170, 255]); const t = new THREE.DataTexture(d, 3, 1, THREE.RedFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

/* ---------- sky dome: vertical gradient sphere (redrawn only when colours change) ---------- */
export const SkyDome: React.FC<{ top: string; mid: string; bottom: string; r?: number }> = ({ top, mid, bottom, r = 160 }) => {
  const tex = useMemo(() => { const c = document.createElement("canvas"); c.width = 4; c.height = 256; const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return { c, t }; }, []);
  const key = top + mid + bottom;
  useMemo(() => { const g = tex.c.getContext("2d")!; const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, top); gr.addColorStop(0.55, mid); gr.addColorStop(1, bottom); g.fillStyle = gr; g.fillRect(0, 0, 4, 256); tex.t.needsUpdate = true; }, [key]);
  return <mesh><sphereGeometry args={[r, 32, 24]} /><meshBasicMaterial map={tex.t} side={THREE.BackSide} depthWrite={false} fog={false} /></mesh>;
};

/* ---------- cached soft glow sprite (additive, faces camera) ---------- */
const glowTex = (() => { let t: THREE.CanvasTexture | null = null; return () => { if (t) return t; const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d")!; const rg = g.createRadialGradient(64, 64, 1, 64, 64, 64); rg.addColorStop(0, "rgba(255,255,255,1)"); rg.addColorStop(0.25, "rgba(255,255,255,.55)"); rg.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = rg; g.fillRect(0, 0, 128, 128); t = new THREE.CanvasTexture(c); return t; }; })();
export const SGlow: React.FC<{ p: V3; r: number; color: string; o?: number }> = ({ p, r, color, o = 0.7 }) => {
  const { camera } = useThree(); const ref = React.useRef<THREE.Mesh>(null);
  React.useLayoutEffect(() => { if (ref.current) ref.current.quaternion.copy(camera.quaternion); });
  if (o <= 0.001 || r <= 0.001) return null;
  return <mesh ref={ref} position={p}><planeGeometry args={[r * 2, r * 2]} /><meshBasicMaterial map={glowTex()} color={color} transparent opacity={o} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>;
};
// sparkle field (twinkling)
export const Sparkles: React.FC<{ t: number; c: V3; area: V3; n?: number; color?: string; size?: number; rise?: number; o?: number; seed?: number }> = ({ t, c, area, n = 16, color = "#bff6ff", size = 0.12, rise = 0.2, o = 1, seed = 1 }) => (
  <>{Array.from({ length: n }, (_, i) => { const u = (t * rise * 0.2 + rnd(i + seed * 50)) % 1, tw = 0.5 + 0.5 * Math.sin(t * 5 + i * 2.3);
    return <SGlow key={i} p={[c[0] + (rnd(i * 3 + seed) - 0.5) * 2 * area[0], c[1] + (u - 0.5) * 2 * area[1], c[2] + (rnd(i * 7 + seed) - 0.5) * 2 * area[2]]} r={size * (0.6 + tw * 0.6)} color={color} o={o * (0.4 + 0.6 * tw) * Math.sin(u * Math.PI)} />; })}</>
);

/* ---------- toon cloud (cluster of outlined spheres) ---------- */
export const Cloud: React.FC<{ p: V3; s?: number; color?: string; seed?: number; flat?: boolean }> = ({ p, s = 1, color = "#ffffff", seed = 1, flat }) => {
  const puffs = useMemo(() => Array.from({ length: 6 }, (_, i) => { const a = (i / 6) * Math.PI * 2 + rnd(seed + i); return [Math.cos(a) * (0.9 + rnd(seed * 3 + i) * 0.5), (rnd(seed * 5 + i) * 0.5) * (flat ? 0.4 : 1), Math.sin(a) * 0.6, 0.7 + rnd(seed * 7 + i) * 0.5] as [number, number, number, number]; }), [seed, flat]);
  return (<group position={p} scale={[s, s * (flat ? 0.6 : 0.8), s]}>
    <Puff p={[0, 0.3, 0]} r={1.15} color={color} />
    {puffs.map(([x, y, z, r], i) => <Puff key={i} p={[x, y, z]} r={r} color={color} />)}
  </group>);
};

/* ---------- floating island: grass slab + rock cone underneath ---------- */
export const Island: React.FC<{ p: V3; r: number; depth?: number; grass?: string; rock?: string; seed?: number; trees?: number; rotY?: number }> = ({ p, r, depth = r * 1.4, grass = "#5fd06a", rock = "#7a6a8e", seed = 1, trees = 2, rotY = 0 }) => (
  <group position={p} rotation={[0, rotY, 0]}>
    <Cyl p={[0, -0.18, 0]} rt={r} rb={r * 0.96} h={0.36} color={grass} line={3} />
    <Cyl p={[0, -0.36 - 0.12, 0]} rt={r * 0.96} rb={r * 0.86} h={0.24} color="#a57a52" line={2} />
    <Cyl p={[0, -0.6 - depth / 2, 0]} rt={r * 0.86} rb={r * 0.12} h={depth} color={rock} line={3} />
    <Cyl p={[r * 0.25, -0.6 - depth * 0.55, r * 0.3]} rt={r * 0.4} rb={0.05} h={depth * 0.7} color="#5f5478" line={2} />
    {Array.from({ length: trees }, (_, i) => { const a = rnd(seed + i * 3) * Math.PI * 2, d = r * (0.45 + rnd(seed + i * 5) * 0.35); return <Tree key={i} p={[Math.cos(a) * d, 0, Math.sin(a) * d]} s={0.6 + rnd(seed + i) * 0.5} seed={seed + i} />; })}
  </group>
);
export const Tree: React.FC<{ p: V3; s?: number; seed?: number }> = ({ p, s = 1, seed = 1 }) => (
  <group position={p} scale={s}><Cyl p={[0, 0.6, 0]} rt={0.12} rb={0.18} h={1.2} color="#8a5a32" line={2} />
    <Ball p={[0, 1.6, 0]} r={0.7} color={seed % 2 ? "#3fbf5a" : "#47c98a"} ink={0.05} /><Ball p={[0.4, 1.35, 0.2]} r={0.45} color="#35a852" ink={0.04} /><Ball p={[-0.35, 1.4, -0.1]} r={0.48} color="#5ad874" ink={0.04} /></group>
);
export const Flower: React.FC<{ p: V3; color?: string }> = ({ p, color = "#ff6aa8" }) => (<group position={p}><Cyl p={[0, 0.15, 0]} rt={0.02} h={0.3} color="#2c9c54" line={1} /><Ball p={[0, 0.32, 0]} r={0.08} color={color} ink={0.02} /></group>);

/* ---------- golden rope bridge from a to b (planks sag; per-plank override for shake / collapse) ---------- */
export type PlankFx = { dy?: number; rot?: V3; dx?: number; dz?: number; gone?: boolean };
export const bridgePt = (a: V3, b: V3, u: number, sag: number): V3 => [lerp(a[0], b[0], u), lerp(a[1], b[1], u) - Math.sin(u * Math.PI) * sag, lerp(a[2], b[2], u)];
export const Bridge: React.FC<{ a: V3; b: V3; n?: number; sag?: number; width?: number; fx?: (i: number, u: number) => PlankFx; ropes?: boolean; ropeCut?: number }> = ({ a, b, n = 14, sag = 0.4, width = 1.5, fx, ropes = true, ropeCut = 2 }) => {
  const yaw = Math.atan2(-(b[2] - a[2]), b[0] - a[0]);
  const len = Math.hypot(b[0] - a[0], b[2] - a[2]);
  const nx = Math.sin(yaw), nz = Math.cos(yaw); // side normal
  return (<>
    {Array.from({ length: n }, (_, i) => { const u = (i + 0.5) / n, q = bridgePt(a, b, u, sag), e = fx ? fx(i, u) : {}; if (e.gone) return null; const slope = Math.atan2(bridgePt(a, b, u + 0.01, sag)[1] - q[1], len * 0.01);
      return <group key={i} position={[q[0] + (e.dx ?? 0), q[1] + (e.dy ?? 0), q[2] + (e.dz ?? 0)]} rotation={[0, yaw, 0]}><group rotation={[(e.rot?.[0] ?? 0), 0, slope + (e.rot?.[2] ?? 0)]}><Box p={[0, 0, 0]} s={[len / n * 0.82, 0.12, width]} color={i % 2 ? "#ffc23a" : "#f0ad28"} line={2} /></group></group>; })}
    {ropes ? [-1, 1].map((sd) => { const pts = Array.from({ length: n + 1 }, (_, i) => bridgePt(a, b, i / n, sag)); return <React.Fragment key={sd}>{pts.slice(0, -1).map((q, i) => { if (i / n > ropeCut) return null; const r = pts[i + 1]; const mid: V3 = [(q[0] + r[0]) / 2 + nx * sd * width / 2, (q[1] + r[1]) / 2 + 0.75, (q[2] + r[2]) / 2 + nz * sd * width / 2]; const L = Math.hypot(r[0] - q[0], r[1] - q[1], r[2] - q[2]); return <group key={i} position={mid} rotation={[0, yaw, Math.atan2(r[1] - q[1], len / n) - Math.PI / 2]}><Cyl p={[0, 0, 0]} rt={0.035} h={L * 1.02} color="#ffd86a" line={1} /></group>; })}
      {[0, 0.5, 1].map((u) => { if (u > ropeCut) return null; const q = bridgePt(a, b, u, sag); return <Cyl key={u} p={[q[0] + nx * sd * width / 2, q[1] + 0.42, q[2] + nz * sd * width / 2]} rt={0.06} h={0.85} color="#ffc23a" line={2} />; })}</React.Fragment>; }) : null}
  </>);
};

/* ---------- windmill (blade spin = rotation radians) ---------- */
export const Windmill: React.FC<{ p: V3; s?: number; spin: number; rotY?: number; color?: string }> = ({ p, s = 1, spin, rotY = 0, color = "#fff2dc" }) => (
  <group position={p} scale={s} rotation={[0, rotY, 0]}>
    <Cyl p={[0, 1.2, 0]} rt={0.42} rb={0.7} h={2.4} color={color} line={3} />
    <Cyl p={[0, 2.75, 0]} rt={0.0} rb={0.62} h={0.8} color="#e5483f" line={3} />
    <Box p={[0, 0.5, 0.62]} s={[0.4, 0.7, 0.1]} color="#8a5a32" line={2} />
    <group position={[0, 2.25, 0.62]} rotation={[0, 0, spin]}>
      {[0, 1, 2, 3].map((i) => <group key={i} rotation={[0, 0, i * Math.PI / 2]}><Box p={[0, 0.85, 0]} s={[0.36, 1.5, 0.05]} color={i % 2 ? "#ffe9a8" : "#ffffff"} line={2} /></group>)}
      <Ball p={[0, 0, 0.05]} r={0.13} color="#ffc23a" ink={0.03} />
    </group>
  </group>
);

/* ---------- bird (two flapping wings) ---------- */
export const Bird: React.FC<{ p: V3; t: number; s?: number; color?: string; yaw?: number }> = ({ p, t, s = 1, color = "#fff6c8", yaw = 0 }) => {
  const fl = Math.sin(t * 14) * 0.7;
  return (<group position={p} scale={s} rotation={[0, yaw, 0]}>
    <Ball p={[0, 0, 0]} r={0.16} color={color} s={[1.6, 1, 1]} ink={0.03} />
    <group rotation={[fl, 0, 0]}><Box p={[0, 0, 0.3]} s={[0.22, 0.03, 0.5]} color={color} line={1} /></group>
    <group rotation={[-fl, 0, 0]}><Box p={[0, 0, -0.3]} s={[0.22, 0.03, 0.5]} color={color} line={1} /></group>
    <SGlow p={[0, 0, 0]} r={0.5} color="#ffe9a0" o={0.35} />
  </group>);
};

/* ---------- golden cloud castle with two door leaves (open 0..1) and inner darkness ---------- */
export const Castle: React.FC<{ p: V3; s?: number; open?: number; eyes?: number; blink?: number; gold?: string }> = ({ p, s = 1, open = 0, eyes = 0, blink = 0, gold = "#ffcc3a" }) => (
  <group position={p} scale={s}>
    <Box p={[0, 3, 0]} s={[8, 6, 4]} color={gold} />
    <Box p={[0, 6.4, 0]} s={[8.4, 0.8, 4.4]} color="#f0ad28" />
    {[-3.2, -1.6, 0, 1.6, 3.2].map((x) => <Box key={x} p={[x, 7.1, 1.9]} s={[0.8, 0.6, 0.6]} color={gold} line={2} />)}
    {[-4.6, 4.6].map((x) => <React.Fragment key={x}><Cyl p={[x, 4.5, 0]} rt={1.3} h={9} color="#ffd65a" /><Cyl p={[x, 10.2, 0]} rt={0} rb={1.6} h={2.6} color="#e5483f" /><Box p={[x, 12.0, 0]} s={[0.06, 1, 0.06]} color={INK} line={1} /><Box p={[x + 0.35, 12.3, 0]} s={[0.7, 0.4, 0.04]} color="#2fd4ff" line={1} /></React.Fragment>)}
    <Cyl p={[0, 9.6, -0.6]} rt={1.1} h={6.0} color="#ffd65a" /><Cyl p={[0, 13.8, -0.6]} rt={0} rb={1.4} h={2.6} color="#e5483f" />
    {[[-2.6, 4.4], [2.6, 4.4], [0, 9.8]].map(([x, y], i) => <Box key={i} p={[x, y, i === 2 ? 0.52 : 2.02]} s={[0.7, 1.0, 0.06]} color="#5a3a8a" line={2} />)}
    {/* doorway: dark arched hole on the facade, gold trim, two leaves opening outward, eyes inside */}
    <mesh position={[0, 1.9, 2.03]}><planeGeometry args={[2.8, 3.8]} /><meshBasicMaterial color="#0e0818" /></mesh>
    <mesh position={[0, 3.8, 2.03]}><circleGeometry args={[1.4, 24, 0, Math.PI]} /><meshBasicMaterial color="#0e0818" /></mesh>
    <Box p={[-1.5, 2.3, 2.06]} s={[0.2, 4.6, 0.1]} color="#ffb020" line={2} /><Box p={[1.5, 2.3, 2.06]} s={[0.2, 4.6, 0.1]} color="#ffb020" line={2} />
    <group position={[-1.4, 0, 2.1]} rotation={[0, -open * 1.35, 0]}><Box p={[0.7, 1.9, 0]} s={[1.4, 3.8, 0.12]} color="#b06a2a" line={3} /><Ball p={[1.15, 1.8, 0.1]} r={0.1} color="#ffd65a" ink={0.02} /></group>
    <group position={[1.4, 0, 2.1]} rotation={[0, open * 1.35, 0]}><Box p={[-0.7, 1.9, 0]} s={[1.4, 3.8, 0.12]} color="#b06a2a" line={3} /><Ball p={[-1.15, 1.8, 0.1]} r={0.1} color="#ffd65a" ink={0.02} /></group>
    {eyes > 0 ? [-0.55, 0.55].map((x) => <React.Fragment key={x}><mesh position={[x, 2.6, 2.05]} scale={[1, Math.max(0.05, 1 - blink), 1]}><circleGeometry args={[0.32, 24]} /><meshBasicMaterial color="#ffd23a" transparent opacity={eyes} /></mesh><mesh position={[x + 0.04, 2.6, 2.06]} scale={[0.45, Math.max(0.05, 1 - blink), 1]}><circleGeometry args={[0.22, 16]} /><meshBasicMaterial color="#1a0a00" transparent opacity={eyes} /></mesh><SGlow p={[x, 2.6, 2.1]} r={0.8} color="#ffb020" o={0.5 * eyes * (1 - blink * 0.8)} /></React.Fragment>) : null}
  </group>
);

/* ---------- storm crystal (outlined octahedron) ---------- */
export const Crystal: React.FC<{ p: V3; s?: number; color?: string; rotY?: number; tall?: number; o?: number }> = ({ p, s = 1, color = "#7a8cff", rotY = 0, tall = 1.7, o = 1 }) => {
  const geo = useMemo(() => new THREE.OctahedronGeometry(1, 0), []);
  return (<group position={p} rotation={[0, rotY, 0]} scale={[s, s * tall, s]}>
    <mesh geometry={geo}><meshToonMaterial color={color} gradientMap={ramp} transparent={o < 1} opacity={o} /></mesh>
    <mesh geometry={geo} scale={1.06}><meshBasicMaterial color={INK} side={THREE.BackSide} /></mesh>
  </group>);
};

/* ---------- chalk key (cyan, glowing), ring at origin, shaft toward +x, tip at x = 1.0 ---------- */
const KEYPTS: [number, number][] = (() => { const pts: [number, number][] = []; for (let i = 0; i <= 20; i++) { const a = Math.PI * 0.18 + (i / 20) * Math.PI * 1.64; pts.push([-Math.cos(a) * 0.28 - 0.0, Math.sin(a) * 0.28]); } pts.push([1.0, 0.07], [1.0, -0.07], [0.86, -0.07], [0.86, -0.2], [0.76, -0.2], [0.76, -0.07], [0.62, -0.07], [0.62, -0.17], [0.54, -0.17], [0.54, -0.07], [0.24, -0.07]); return pts; })();
export const ChalkKey: React.FC<{ p: V3; rot?: V3; s?: number; glow?: number }> = ({ p, rot, s = 1, glow = 1 }) => (
  <group position={p} rotation={rot} scale={s}>
    <Extrude pts={KEYPTS} depth={0.12} color="#5fe8ff" line={3} />
    <mesh position={[-0.0, 0, 0]}><circleGeometry args={[0.13, 20]} /><meshBasicMaterial color="#0d3b52" /></mesh>
    <SGlow p={[0.3, 0, 0.1]} r={0.9 * glow + 0.05} color="#4fe6ff" o={0.75 * glow} />
  </group>
);

/* ---------- chalk drawing: polylines revealed stroke-by-stroke (prog 0..1 over total length) ---------- */
export type Path2 = [number, number][]; // normalized 0..1 (y down)
export const pathLen = (ps: Path2[]) => ps.reduce((a, p) => a + p.slice(1).reduce((b, q, i) => b + Math.hypot(q[0] - p[i][0], q[1] - p[i][1]), 0), 0);
export const pathTip = (ps: Path2[], prog: number): [number, number] => {
  let rem = pathLen(ps) * clamp(prog);
  for (const p of ps) for (let i = 1; i < p.length; i++) { const L = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); if (rem <= L) { const k = L ? rem / L : 0; return [lerp(p[i - 1][0], p[i][0], k), lerp(p[i - 1][1], p[i][1], k)]; } rem -= L; }
  const lp = ps[ps.length - 1]; return lp[lp.length - 1];
};
export function strokePaths(c: CanvasRenderingContext2D, W: number, H: number, ps: Path2[], prog: number, color: string, width: number, wobble = 0, t = 0) {
  let rem = pathLen(ps) * clamp(prog); if (rem <= 0) return;
  const pass = (lw: number, col: string) => { c.strokeStyle = col; c.lineWidth = lw; c.lineCap = "round"; c.lineJoin = "round"; let r = rem;
    for (const p of ps) { if (r <= 0) break; c.beginPath(); c.moveTo(p[0][0] * W, p[0][1] * H);
      for (let i = 1; i < p.length; i++) { const L = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); const k = Math.min(1, r / (L || 1e-6)); const x = lerp(p[i - 1][0], p[i][0], k), y = lerp(p[i - 1][1], p[i][1], k); const wb = wobble * Math.sin(i * 1.7 + t * 0.6); c.lineTo(x * W + wb, y * H - wb); r -= L; if (r <= 0) break; }
      c.stroke(); } };
  pass(width * 4.2, color.replace(/[\d.]+\)$/, "0.16)")); pass(width * 2.2, color.replace(/[\d.]+\)$/, "0.35)")); pass(width, "rgba(255,255,255,0.95)");
}
export const ChalkDraw: React.FC<{ p: V3; s: [number, number]; paths: Path2[]; prog: number; color?: string; width?: number; rot?: V3; o?: number; t?: number; face?: boolean; fill?: string; fillK?: number; px?: number }> = ({ p, s, paths, prog, color = "rgba(80,230,255,1)", width = 9, rot, o = 1, t = 0, face, fill, fillK = 0, px = 512 }) => (
  prog <= 0 && fillK <= 0 ? null :
  <CanvasPlane p={p} s={s} rot={rot} face={face} additive px={[px, Math.round(px * s[1] / s[0])]} draw={(c, W, H) => {
    c.clearRect(0, 0, W, H); c.globalAlpha = o;
    if (fill && fillK > 0) { c.save(); c.globalAlpha = o * fillK; c.fillStyle = fill; c.beginPath(); for (const pth of paths) { pth.forEach(([x, y], i) => i ? c.lineTo(x * W, y * H) : c.moveTo(x * W, y * H)); } c.fill(); c.restore(); }
    strokePaths(c, W, H, paths, prog, color, width * W / 512, 0.6, t);
  }} />
);

/* ---------- bubble (iridescent ring + highlights) ---------- */
export const Bubble: React.FC<{ p: V3; r: number; t: number; o?: number }> = ({ p, r, t, o = 1 }) => (
  r <= 0.01 ? null :
  <CanvasPlane p={p} s={[r * 2, r * 2]} px={[256, 256]} face additive draw={(c, W, H) => {
    c.clearRect(0, 0, W, H); c.globalAlpha = o;
    const g = c.createRadialGradient(W / 2, H / 2, W * 0.32, W / 2, H / 2, W / 2); g.addColorStop(0, "rgba(120,200,255,0)"); g.addColorStop(0.75, `hsla(${(t * 40) % 360},90%,70%,.35)`); g.addColorStop(0.92, `hsla(${(t * 40 + 120) % 360},90%,75%,.75)`); g.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = g; c.beginPath(); c.arc(W / 2, H / 2, W / 2, 0, 7); c.fill();
    c.fillStyle = "rgba(255,255,255,.85)"; c.beginPath(); c.ellipse(W * 0.32, H * 0.28, W * 0.09, H * 0.05, -0.7, 0, 7); c.fill(); c.beginPath(); c.arc(W * 0.24, H * 0.4, W * 0.025, 0, 7); c.fill();
    c.strokeStyle = "rgba(255,255,255,.5)"; c.lineWidth = W * 0.012; c.beginPath(); c.arc(W / 2, H / 2, W * 0.47, Math.PI * 0.1, Math.PI * 0.45); c.stroke();
  }} />
);

/* ---------- lightning bolt plane (additive) ---------- */
export const Lightning: React.FC<{ p: V3; s: [number, number]; seed: number; o: number; rot?: V3; color?: string }> = ({ p, s, seed, o, rot, color = "rgba(180,170,255,1)" }) => (
  o <= 0.01 ? null :
  <CanvasPlane p={p} s={s} rot={rot} additive px={[128, Math.round(128 * s[1] / s[0])]} draw={(c, W, H) => {
    c.clearRect(0, 0, W, H); let x = W / 2, y = 0; const pts: [number, number][] = [[x, y]]; let i = 0; while (y < H) { y += H / 9; x = W / 2 + (rnd(seed * 13 + i++) - 0.5) * W * 0.8; pts.push([x, y]); }
    for (const [lw, col] of [[W * 0.16, color.replace(/[\d.]+\)$/, `${0.25 * o})`)], [W * 0.05, `rgba(255,255,255,${o})`]] as [number, string][]) { c.strokeStyle = col; c.lineWidth = lw; c.lineJoin = "round"; c.beginPath(); pts.forEach(([a, b], k) => k ? c.lineTo(a, b) : c.moveTo(a, b)); c.stroke(); }
  }} />
);

/* ---------- the baby dragon (yaw-only billboard, feet at p) ---------- */
export const Dragon: React.FC<{ p: V3; h?: number; pose: Omit<DragonPose, "t"> & { t?: number }; f: number; shadow?: boolean; sy?: number }> = ({ p, h = 1.3, pose, f, shadow = false, sy }) => (
  <>{shadow ? <Shadow p={[p[0], sy ?? p[1], p[2]]} r={h * 0.35} /> : null}
    <Billboard p={p} h={h} res={384} aspect={1} draw={(c, W, H) => drawDragon(c, W, H, { ...pose, t: pose.t ?? f })} /></>
);

/* ---------- glowing doorway frame drawn in the air (canvas) ---------- */
export const DOOR_PATHS: Path2[] = [[[0.12, 0.98], [0.12, 0.06], [0.88, 0.06], [0.88, 0.98]], [[0.74, 0.52], [0.76, 0.56], [0.74, 0.6]]];
export const HEART_PATH: Path2[] = [(() => { const pts: [number, number][] = []; for (let i = 0; i <= 60; i++) { const a = Math.PI / 2 + (i / 60) * Math.PI * 2; const x = 16 * Math.sin(a) ** 3, y = 13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a); pts.push([0.5 + x / 36, 0.47 - y / 34]); } return pts; })()];
export const SHIELD_PATH: Path2[] = [[[0.5, 0.06], [0.88, 0.2], [0.85, 0.55], [0.7, 0.8], [0.5, 0.95], [0.3, 0.8], [0.15, 0.55], [0.12, 0.2], [0.5, 0.06]], [[0.5, 0.2], [0.5, 0.82]], [[0.25, 0.42], [0.75, 0.42]]];
export const LADDER_PATH: Path2[] = [[[0.2, 1], [0.2, 0]], [[0.8, 1], [0.8, 0]], ...[0.12, 0.3, 0.48, 0.66, 0.84].map((y) => [[0.2, y], [0.8, y]] as Path2)];
export const SCISSORS_PATH: Path2[] = [
  (() => { const p: [number, number][] = []; for (let i = 0; i <= 24; i++) { const a = (i / 24) * Math.PI * 2; p.push([0.22 + Math.cos(a) * 0.12, 0.78 + Math.sin(a) * 0.12]); } return p; })(),
  (() => { const p: [number, number][] = []; for (let i = 0; i <= 24; i++) { const a = (i / 24) * Math.PI * 2; p.push([0.45 + Math.cos(a) * 0.12, 0.86 + Math.sin(a) * 0.1]); } return p; })(),
  [[0.3, 0.68], [0.55, 0.45], [0.92, 0.06], [0.6, 0.5]], [[0.46, 0.75], [0.5, 0.52], [0.88, 0.14], [0.55, 0.52]]];
export const ROCKET_PATH: Path2[] = [[[0.5, 0.05], [0.66, 0.3], [0.66, 0.72], [0.34, 0.72], [0.34, 0.3], [0.5, 0.05]], [[0.34, 0.55], [0.2, 0.8], [0.34, 0.72]], [[0.66, 0.55], [0.8, 0.8], [0.66, 0.72]], (() => { const p: [number, number][] = []; for (let i = 0; i <= 16; i++) { const a = (i / 16) * Math.PI * 2; p.push([0.5 + Math.cos(a) * 0.07, 0.4 + Math.sin(a) * 0.07]); } return p; })(), [[0.42, 0.76], [0.5, 0.95], [0.58, 0.76]]];
export const SWORD_PATH: Path2[] = [[[0.5, 0.04], [0.57, 0.14], [0.57, 0.64], [0.43, 0.64], [0.43, 0.14], [0.5, 0.04]], [[0.28, 0.64], [0.72, 0.64], [0.72, 0.69], [0.28, 0.69], [0.28, 0.64]], [[0.5, 0.69], [0.5, 0.88]], (() => { const p: [number, number][] = []; for (let i = 0; i <= 16; i++) { const a = (i / 16) * Math.PI * 2; p.push([0.5 + Math.cos(a) * 0.04, 0.92 + Math.sin(a) * 0.04]); } return p; })()];
void Cyl;

/* ---------- crystal vine: lavender translucent tube a->b with sag; draw sub-range [from,to]; off = rigid offset (falling piece) ---------- */
export const Vine: React.FC<{ a: V3; b: V3; sag?: number; from?: number; to?: number; off?: V3; rot?: number; o?: number; r?: number; pulse?: number }> = ({ a, b, sag = 0.4, from = 0, to = 1, off = [0, 0, 0], rot = 0, o = 1, r = 0.07, pulse = 0 }) => {
  const key = [a, b, sag, from.toFixed(3), to.toFixed(3), r].join("|");
  const geo = useMemo(() => {
    const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(...a), new THREE.Vector3((a[0] + b[0]) / 2 + sag * 0.4, (a[1] + b[1]) / 2 - sag, (a[2] + b[2]) / 2 + sag * 0.3), new THREE.Vector3(...b));
    const pts = Array.from({ length: 13 }, (_, i) => curve.getPoint(lerp(from, to, i / 12)));
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, r, 8, false);
  }, [key]);
  if (o <= 0.01 || to - from < 0.01) return null;
  const mid = geo.boundingSphere ? geo.boundingSphere.center : new THREE.Vector3(...a);
  return (<group position={off} >
    <group position={[mid.x, mid.y, mid.z]} rotation={[0, 0, rot]}><group position={[-mid.x, -mid.y, -mid.z]}>
      <mesh geometry={geo}><meshToonMaterial color={pulse > 0.5 ? "#e8d0ff" : "#c79cff"} gradientMap={ramp} transparent opacity={0.88 * o} /></mesh>
      <mesh geometry={geo} scale={1}><meshBasicMaterial color="#3a1f6a" side={THREE.BackSide} transparent opacity={0.6 * o} /></mesh>
    </group></group>
  </group>);
};

/* ---------- giant scissors: pivot at origin, blades toward +y, handles toward -y; open = half-angle ---------- */
export const Scissors: React.FC<{ p: V3; open: number; rot?: V3; s?: number }> = ({ p, open, rot, s = 1 }) => (
  <group position={p} rotation={rot} scale={s}>
    {[-1, 1].map((sd) => <group key={sd} rotation={[0, 0, sd * open]}>
      <Extrude pts={[[-0.09, 0], [0.09, 0], [0.03 * sd, 1.6], [-0.02 * sd, 1.6]]} depth={0.05} color="#d9e2f2" line={2} p={[0, 0, sd * 0.03]} />
      <Extrude pts={[[-0.07, 0], [0.07, 0], [0.18 * sd + 0.04, -0.55], [0.18 * sd - 0.06, -0.55]]} depth={0.06} color="#2fd4ff" line={2} p={[0, 0, sd * 0.03]} />
      <mesh position={[0.22 * sd, -0.78, sd * 0.03]}><torusGeometry args={[0.22, 0.06, 8, 20]} /><meshToonMaterial color="#2fd4ff" gradientMap={ramp} /></mesh>
    </group>)}
    <Ball p={[0, 0, 0.06]} r={0.07} color="#ffd65a" ink={0.02} />
    <SGlow p={[0, 0.4, 0.1]} r={1.1} color="#bff8ff" o={0.25} />
  </group>
);

/* ---------- ladder (solid, chalk-cyan), base at p, top at p + [lean, h, -depth] ---------- */
export const Ladder: React.FC<{ p: V3; h: number; lean?: number; w?: number; k?: number }> = ({ p, h, lean = -0.6, w = 1.0, k = 1 }) => {
  const ang = Math.atan2(lean, h), L = Math.hypot(lean, h);
  return (<group position={p} rotation={[ang, 0, 0]} scale={[1, k, 1]}>
    {[-1, 1].map((sd) => <Box key={sd} p={[sd * w / 2, L / 2, 0]} s={[0.12, L, 0.12]} color="#5fe8ff" line={2} />)}
    {Array.from({ length: Math.floor(L / 0.48) }, (_, i) => <Box key={i} p={[0, 0.42 + i * 0.48, 0]} s={[w, 0.09, 0.09]} color="#9ff4ff" line={2} />)}
  </group>);
};

/* ---------- sound rings (a cry): arcs expanding from a point, facing camera ---------- */
export const SoundRings: React.FC<{ p: V3; t: number; t0: number; s?: number; color?: string }> = ({ p, t, t0, s = 1, color = "255,240,180" }) => (
  t < t0 || t > t0 + 1.4 ? null :
  <CanvasPlane p={p} s={[3 * s, 3 * s]} face additive px={[256, 256]} draw={(c, W2, H2) => {
    c.clearRect(0, 0, W2, H2); for (let k = 0; k < 3; k++) { const u = clamp((t - t0) * 1.4 - k * 0.22); if (u <= 0 || u >= 1) continue; c.strokeStyle = `rgba(${color},${(1 - u) * 0.95})`; c.lineWidth = 10; c.lineCap = "round"; for (const sd of [-1, 1]) { c.beginPath(); c.arc(W2 / 2, H2 / 2, 20 + u * 100, sd > 0 ? -0.6 : Math.PI - 0.6, sd > 0 ? 0.6 : Math.PI + 0.6); c.stroke(); } }
  }} />
);

/* ---------- dragon drawn INTO the puppet canvas (hug): returns a Pose.hug callback ---------- */
const hugCanvas = (() => { let cv: HTMLCanvasElement | null = null; return () => { if (!cv) { cv = document.createElement("canvas"); cv.width = cv.height = 320; } return cv; }; })();
export const hugDragon = (pose: DragonPose, size = 165, dy = 0, dx = 0) => (c: CanvasRenderingContext2D, x: number, y: number, S: number) => {
  const cv = hugCanvas(); drawDragon(cv.getContext("2d")!, 320, 320, pose); const sz = size * S; c.drawImage(cv, x - sz * 0.52 + dx * S, y - sz * 0.72 + dy * S, sz, sz);
};
