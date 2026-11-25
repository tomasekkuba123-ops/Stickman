// SCENE KIT v20 (KIDS EP01 "What If Stickman Shrank?"): two scales of the same garden.
//   BigGarden  = the normal garden (hero h = 3) + a little flower next to him where the ladybug sits.
//   MiniGarden = the ant's-eye garden (hero still h = 3, the world is ~12x bigger): giant grass blades, a giant flower,
//                a pebble with a sleeping snail, a curved leaf slide with its stalk, a raindrop, a dandelion puff.
//   Reusable pieces: GrassBlades, GiantFlower, LeafSlide (+ leafY), Raindrop, Dandelion, FloatSeed, LittleFlower.
import React, { useMemo } from "react";
import * as THREE from "three";
import { Cyl, Ball } from "../style/toon";
import { V3 } from "../style/kit";
import { SGlow } from "../style/sky";
import { Garden8 } from "./sets2";
import { SkyGrad, CloudStrips, HillLayer, GroundHaze, Motes, Props, PropSpec, Lights, rnd, toonRamp } from "./diorama";
import { QC } from "./qc";

const cl = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const sm = (x: number) => { const u = cl(x); return u * u * (3 - 2 * u); };
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const INK = "#1A1A1A";

/* ---------------- shared daylight ---------------- */
const LOOK = { rim: "255,240,205", shade: "30,40,80", rimK: 0.45 };
const Day: React.FC<{ b: number; fog: [number, number]; children?: React.ReactNode }> = ({ b, fog, children }) => (
  <Lights amb={0.86} keyL={[[-20, 30, 18], "#fff4dc", 1.25]} fill={[[10, 4, 12], "#a8c4ff", 0.35]} look={LOOK} fog={["#d6ecff", fog[0], fog[1]]}>
    <SkyGrad a={["#4f9cf0", "#8ccaff", "#e2f3ff"]} horizon="rgba(255,255,255,0.6)" hk={0.5} />
    <SGlow p={[-34, 38, -90]} r={12} color="#fff6c8" o={0.8} /><SGlow p={[-34, 38, -90]} r={28} color="#fff3b0" o={0.25} />
    <CloudStrips t={b} n={5} y={24} z={-80} span={160} speed={1.0} tone="rgba(255,255,255,0.8)" rim="rgba(255,255,255,0.5)" />
    {children}
  </Lights>
);

/* ================= BIG GARDEN ================= */
export const LF: V3 = [1.25, 0, 0.7]; // little flower beside the hero (big world); the ladybug sits on its head
export const LF_TOP = 0.92;
export const LittleFlower: React.FC<{ p: V3; t: number }> = ({ p, t }) => {
  const sw = Math.sin(t * 1.6) * 0.04;
  return (<group position={p} rotation={[0, 0, sw]} scale={[1.5, 1.5, 1.5]}>
    <Cyl p={[0, 0.29, 0]} rt={0.022} h={0.58} color="#3fae4a" line={1} />
    <mesh position={[0.07, 0.2, 0]} rotation={[0, 0, -0.9]} scale={[0.14, 0.05, 0.07]}><sphereGeometry args={[1, 12, 8]} /><meshToonMaterial color="#56c25a" gradientMap={toonRamp} /></mesh>
    {Array.from({ length: 6 }, (_, i) => { const a = (i / 6) * Math.PI * 2; return <Ball key={i} p={[Math.cos(a) * 0.1, 0.58, Math.sin(a) * 0.1]} r={0.075} color={i % 2 ? "#ff8ac0" : "#ff6aa8"} s={[1.2, 0.45, 1.2]} ink={0.012} />; })}
    <Ball p={[0, 0.6, 0]} r={0.06} color="#ffd23a" ink={0.01} />
  </group>);
};
export const BigGarden: React.FC<{ t: number; bgT?: number; children?: React.ReactNode }> = ({ t, bgT, children }) => {
  const b = bgT ?? t;
  return (<Day b={b} fog={[40, 140]}>
    <HillLayer p={[0, 7, -120]} s={[320, 70]} o={{ seed: 31, tone: "#7f9fd0", rim: "rgba(255,255,255,0.45)", top: 0.42, amp: 0.13, trees: 60 }} />
    <HillLayer p={[4, 3.4, -70]} s={[220, 44]} t={b} o={{ seed: 35, tone: "#5fa36a", rim: "rgba(255,255,255,0.45)", top: 0.45, amp: 0.1, trees: 44, village: true, roof: "#d0604a" }} />
    <GroundHaze t={b} layers={[[-40, 1.4, 160], [-62, 2.6, 220]]} col="rgba(230,240,255,0.5)" o={0.5} />
    <Garden8 t={b} />
    <LittleFlower p={LF} t={b} />
    <Motes t={b} n={24} c={[0, 2, 0]} area={[14, 3, 6]} color="#fff8dc" o={0.35} />
    {children}
  </Day>);
};

/* ================= MINI GARDEN (ant scale) ================= */
export const MG = {
  land: [0, 0, 0] as V3,          // where he lands after shrinking
  bug: [1.7, 0, -2.6] as V3,      // ladybug landing spot (behind-right of him)
  flower: [17, 0, -5] as V3,      // giant flower (head ~ y 11)
  snail: [27.5, 0, -3.2] as V3,   // snail on its pebble
  leafX0: 38, leafX1: 47, leafZ: 0, // leaf slide: high end (x0) -> low end with an upturned lip (x1)
  dand: [51, 0, 0] as V3, dandR: 1.5, dandH: 4.3, // dandelion stem foot, puff radius, puff centre height
};
/* leaf surface height along x (high end 6.4 -> dip 2.0 -> lip 2.6 at x1) */
export const leafY = (x: number) => { const u = cl((x - MG.leafX0) / (MG.leafX1 - MG.leafX0)); return 6.4 - 4.6 * sm(u / 0.85) + 0.7 * sm((u - 0.82) / 0.18); };
export const DAND_TOP = MG.dandH + MG.dandR * 0.92;

/* giant grass blades: tapered, curved ribbons with an ink edge, gentle sway */
type Blade = { x: number; z: number; h: number; w: number; bend: number; ry: number; col: string; ph: number };
const BLADE_COLS = ["#5cc84a", "#4fb43f", "#6fd457", "#43a23a", "#7ad860"];
export function makeBlades(seed: number, n: number, x0: number, x1: number, z0: number, z1: number, h0: number, h1: number, avoid?: (x: number, z: number) => boolean): Blade[] {
  const out: Blade[] = [];
  for (let i = 0; out.length < n && i < n * 6; i++) { const x = lerp(x0, x1, rnd(seed + i * 3.1)), z = lerp(z0, z1, rnd(seed + i * 7.7)); if (avoid && avoid(x, z)) continue;
    out.push({ x, z, h: lerp(h0, h1, rnd(seed + i * 5.3)), w: 0.55 + rnd(seed + i * 9.1) * 0.6, bend: (rnd(seed + i * 2.9) - 0.5) * 4, ry: (rnd(seed + i * 4.4) - 0.5) * 1.4, col: BLADE_COLS[i % 5], ph: rnd(seed + i) * 6 }); }
  return out;
}
const bladeGeo = (h: number, w: number, bend: number) => {
  const s = new THREE.Shape(), N = 10, pts: [number, number][] = [];
  for (let i = 0; i <= N; i++) { const u = i / N; pts.push([-w / 2 * (1 - u) ** 0.8 + bend * u * u, u * h]); }
  s.moveTo(pts[0][0], pts[0][1]); for (const [x, y] of pts.slice(1)) s.lineTo(x, y);
  for (let i = N - 1; i >= 0; i--) { const u = i / N; s.lineTo(w / 2 * (1 - u) ** 0.8 + bend * u * u, u * h); }
  return new THREE.ShapeGeometry(s);
};
export const GrassBlades: React.FC<{ list: Blade[]; t: number }> = ({ list, t }) => {
  const geos = useMemo(() => list.map((b) => { const g = bladeGeo(b.h, b.w, b.bend); return { g, e: new THREE.EdgesGeometry(g) }; }), [list]);
  return (<>{list.map((b, i) => <group key={i} position={[b.x, 0, b.z]} rotation={[0, b.ry, Math.sin(t * 0.9 + b.ph) * 0.025]}>
    <mesh geometry={geos[i].g}><meshToonMaterial color={b.col} gradientMap={toonRamp} side={THREE.DoubleSide} /></mesh>
    {!QC ? <lineSegments geometry={geos[i].e}><lineBasicMaterial color={INK} /></lineSegments> : null}
    <mesh position={[b.bend * 0.25, b.h * 0.5, 0.01]} scale={[0.06, b.h * 0.42, 1]}><planeGeometry args={[1, 1]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.22} side={THREE.DoubleSide} /></mesh>
  </group>)}</>);
};

/* giant flower: stem + 8 petals + seed centre, head tilted toward the camera */
export const GiantFlower: React.FC<{ p: V3; t: number; h?: number; col?: string }> = ({ p, t, h = 10, col = "#ff6aa8" }) => (
  <group position={p} rotation={[0, 0, Math.sin(t * 0.7) * 0.02]}>
    <Cyl p={[0, h / 2, 0]} rt={0.28} rb={0.36} h={h} color="#3fae4a" line={2} />
    <mesh position={[0.9, h * 0.38, 0]} rotation={[0, 0, -0.8]} scale={[2.0, 0.5, 0.9]}><sphereGeometry args={[1, 16, 10]} /><meshToonMaterial color="#56c25a" gradientMap={toonRamp} /></mesh>
    <group position={[0, h, 0]} rotation={[0.55, 0, 0]}>
      {Array.from({ length: 8 }, (_, i) => { const a = (i / 8) * Math.PI * 2; return <Ball key={i} p={[Math.cos(a) * 1.55, 0, Math.sin(a) * 1.55]} r={1.0} color={i % 2 ? col : "#ff8ac0"} s={[1.35, 0.32, 0.9]} ink={0.05} />; })}
      <Ball p={[0, 0.25, 0]} r={0.95} color="#ffc21a" s={[1, 0.55, 1]} ink={0.06} />
    </group>
  </group>
);

/* leaf slide: a big curved leaf (cupped across, sloping along x), on a stalk at its high end */
export const LeafSlide: React.FC<{ t: number; wet?: number }> = ({ wet = 0 }) => {
  const geo = useMemo(() => { const nx = 48, nz = 10, W = 3.6, g = new THREE.PlaneGeometry(1, 1, nx, nz), a = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < a.count; i++) { const u = a.getX(i) + 0.5, v = a.getY(i) * 2; const x = lerp(MG.leafX0 - 0.8, MG.leafX1 + 0.4, u), wid = W * Math.sin(Math.PI * cl(0.08 + u * 0.92)) ** 0.6;
      a.setXYZ(i, x, leafY(x) + 0.35 * v * v - 0.05, MG.leafZ + v * wid / 2); }
    g.computeVertexNormals(); return g; }, []);
  const col = wet > 0 ? "#3fbf62" : "#4cc85a";
  return (<group>
    <mesh geometry={geo}><meshToonMaterial color={col} gradientMap={toonRamp} side={THREE.DoubleSide} /></mesh>
    <mesh geometry={geo} position={[0, -0.06, 0]} scale={[1, 1, 1.02]}><meshBasicMaterial color={INK} side={THREE.BackSide} /></mesh>
    {/* midrib + veins */}
    {Array.from({ length: 24 }, (_, i) => { const x = lerp(MG.leafX0 - 0.4, MG.leafX1, i / 24), x2 = x + (MG.leafX1 - MG.leafX0) / 24; const y = leafY(x) + 0.03, y2 = leafY(x2) + 0.03;
      return <mesh key={i} position={[(x + x2) / 2, (y + y2) / 2, MG.leafZ]} rotation={[0, 0, Math.atan2(y2 - y, x2 - x)]}><boxGeometry args={[Math.hypot(x2 - x, y2 - y) + 0.02, 0.05, 0.12]} /><meshBasicMaterial color="#a8ec88" /></mesh>; })}
    {/* stalk from the ground to the high end */}
    <Cyl p={[MG.leafX0 - 0.9, 3.3, -0.2]} rt={0.22} rb={0.32} h={6.6} color="#3fae4a" line={2} rot={[0, 0, 0.06]} />
    {wet > 0 ? Array.from({ length: 9 }, (_, i) => { const x = lerp(MG.leafX0 + 0.5, MG.leafX1 - 0.5, i / 8); return <SGlow key={i} p={[x, leafY(x) + 0.12, MG.leafZ + Math.sin(i * 2.3) * 0.7]} r={0.18} color="#e6f8ff" o={0.7 * wet} />; }) : null}
  </group>);
};

/* raindrop: wobbly clear-blue ball with a highlight and an ink rim */
export const Raindrop: React.FC<{ p: V3; r: number; t: number; wob?: number; o?: number }> = ({ p, r, t, wob = 1, o = 1 }) => {
  if (o <= 0.01) return null; const w = 0.06 * wob * Math.sin(t * 9), sy = 1 + w + 0.12, sx = 1 - w * 0.7;
  return (<group position={p} scale={[sx, sy, sx]}>
    <mesh><sphereGeometry args={[r, 32, 24]} /><meshToonMaterial color="#8fd4ff" gradientMap={toonRamp} transparent opacity={0.78 * o} /></mesh>
    <mesh scale={1.05}><sphereGeometry args={[r, 24, 16]} /><meshBasicMaterial color="#2a5a8a" side={THREE.BackSide} transparent opacity={o} /></mesh>
    <mesh position={[-r * 0.35, r * 0.4, r * 0.75]} scale={[r * 0.28, r * 0.18, 0.05]}><sphereGeometry args={[1, 12, 8]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.9 * o} /></mesh>
    <mesh position={[r * 0.3, -r * 0.45, r * 0.8]} scale={[r * 0.16, r * 0.08, 0.05]}><sphereGeometry args={[1, 10, 6]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.6 * o} /></mesh>
  </group>);
};

/* dandelion: stem + a fluffy puff of radiating seeds (instanced), squash on landing */
export const Dandelion: React.FC<{ t: number; squash?: number; lost?: number }> = ({ t, squash = 0, lost = 0 }) => {
  const N = 260, R = MG.dandR;
  const { tips, spokes } = useMemo(() => { const tips: V3[] = [], sp: number[] = [];
    for (let i = 0; i < N; i++) { const y = 1 - (i + 0.5) / N * 2, r = Math.sqrt(1 - y * y), a = i * 2.39996; const d: V3 = [Math.cos(a) * r, y, Math.sin(a) * r]; tips.push(d); sp.push(0, 0, 0, d[0] * R * 0.92, d[1] * R * 0.92, d[2] * R * 0.92); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(sp, 3)); return { tips, spokes: g }; }, []);
  const ref = React.useRef<THREE.InstancedMesh>(null);
  React.useLayoutEffect(() => { const m = ref.current; if (!m) return; const o = new THREE.Object3D();
    tips.forEach((d, i) => { const gone = rnd(i * 1.7) < lost; o.position.set(d[0] * R, d[1] * R, d[2] * R); o.scale.setScalar(gone ? 0.0001 : 1); o.updateMatrix(); m.setMatrixAt(i, o.matrix); }); m.instanceMatrix.needsUpdate = true; });
  const sq = 1 - 0.22 * squash, sw = Math.sin(t * 0.8) * 0.02;
  return (<group position={MG.dand} rotation={[0, 0, sw]}>
    <Cyl p={[0, MG.dandH / 2, 0]} rt={0.12} rb={0.16} h={MG.dandH} color="#5cb84a" line={2} />
    <group position={[0, MG.dandH, 0]} scale={[1 / Math.sqrt(sq), sq, 1 / Math.sqrt(sq)]}>
      <mesh><sphereGeometry args={[R * 0.62, 24, 16]} /><meshToonMaterial color="#f4f1e6" gradientMap={toonRamp} transparent opacity={0.55} /></mesh>
      <lineSegments geometry={spokes}><lineBasicMaterial color="#ffffff" transparent opacity={0.9} /></lineSegments>
      <instancedMesh ref={ref} args={[undefined, undefined, N]}><sphereGeometry args={[0.13, 8, 6]} /><meshToonMaterial color="#ffffff" gradientMap={toonRamp} /></instancedMesh>
      <Ball p={[0, 0, 0]} r={0.28} color="#d8c89a" ink={0.08} />
    </group>
  </group>);
};
/* one floating dandelion seed (fluffy parachute) */
export const FloatSeed: React.FC<{ p: V3; s?: number; rot?: number }> = ({ p, s = 1, rot = 0 }) => (
  <group position={p} scale={s} rotation={[0, 0, rot]}>
    <Cyl p={[0, -0.25, 0]} rt={0.012} h={0.5} color="#e8e2c8" line={0} />
    <Ball p={[0, -0.52, 0]} r={0.035} color="#c8a878" ink={0.008} />
    {Array.from({ length: 9 }, (_, i) => { const a = (i / 9) * Math.PI * 2; return <mesh key={i} position={[Math.cos(a) * 0.14, 0.06, Math.sin(a) * 0.14]} rotation={[Math.sin(a) * 0.9, 0, -Math.cos(a) * 0.9]}><cylinderGeometry args={[0.008, 0.008, 0.3, 4]} /><meshBasicMaterial color="#ffffff" /></mesh>; })}
    <SGlow p={[0, 0.06, 0]} r={0.22} color="#ffffff" o={0.5} />
  </group>
);

/* boulders (Kenney rocks scaled up), giant background flowers / mushrooms */
const BOULDERS: PropSpec[] = [["rock_largeA", -6, -6, 5.0], ["rock_smallC", 9, -7, 6.0], ["rock_largeB", 27.5, -3.6, 3.2], ["stone_largeA", 33, -9, 5.0], ["rock_smallA", 44, -6, 5.0], ["rock_largeA", 58, -8, 5.0]];
const FAR_FLOWERS: PropSpec[] = [["flower_yellowA", -12, -26, 14], ["flower_redA", 4, -30, 16], ["mushroom_red", 12, -18, 10], ["flower_purpleA", 24, -28, 15], ["flower_yellowA", 36, -24, 14], ["mushroom_red", 49, -17, 9], ["flower_redA", 62, -27, 16]];

export const MiniGarden: React.FC<{ t: number; bgT?: number; wet?: number; squash?: number; lost?: number; children?: React.ReactNode }> = ({ t, bgT, wet = 0, squash = 0, lost = 0, children }) => {
  const b = bgT ?? t;
  const back = useMemo(() => makeBlades(11, 70, -16, 66, -22, -5, 9, 22), []);
  const mid = useMemo(() => makeBlades(23, 26, -12, 62, -4.5, -1.6, 7, 16, (x, z) => Math.abs(x - MG.flower[0]) < 3 || Math.abs(x - MG.snail[0]) < 3.2 || (x > MG.leafX0 - 2 && x < MG.dand[0] + 2.5) || Math.abs(x - MG.bug[0]) < 2.6 || Math.abs(x) < 2.2 || z > -1.8), []);
  const front = useMemo(() => makeBlades(37, 14, -14, 64, 4.5, 8, 6, 12, (x) => (x > -3 && x < 6) || (x > 35 && x < 54)), []);
  return (<Day b={b} fog={[30, 120]}>
    <HillLayer p={[20, 9, -120]} s={[340, 70]} o={{ seed: 41, tone: "#86b0d8", rim: "rgba(255,255,255,0.45)", top: 0.42, amp: 0.13, trees: 30 }} />
    <GroundHaze t={b} layers={[[-34, 2.4, 200], [-56, 4.5, 260]]} col="rgba(225,240,255,0.55)" o={0.55} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[25, 0, -20]}><planeGeometry args={[220, 120]} /><meshToonMaterial color="#6cb84c" gradientMap={toonRamp} /></mesh>
    {/* soil patches + moss dots on the ground (ant scale texture) */}
    {Array.from({ length: 60 }, (_, i) => <mesh key={i} rotation={[-Math.PI / 2, 0, rnd(i) * 3]} position={[lerp(-14, 64, rnd(i * 3.3)), 0.01 + i * 0.0002, lerp(-10, 7, rnd(i * 5.1))]} scale={[0.6 + rnd(i * 7) * 1.6, 0.4 + rnd(i * 9) * 0.9, 1]}><circleGeometry args={[1, 14]} /><meshToonMaterial color={i % 3 ? "#5aa83e" : "#8a6a42"} gradientMap={toonRamp} /></mesh>)}
    <Props list={FAR_FLOWERS} t={b} sway={0} />
    <GrassBlades list={back} t={b} />
    <Props list={BOULDERS} t={b} sway={0} />
    <GrassBlades list={mid} t={b} />
    <GiantFlower p={MG.flower} t={b} h={10.5} />
    <GiantFlower p={[-9, 0, -9]} t={b + 1} h={13} col="#ffd23a" />
    <GiantFlower p={[62, 0, -9]} t={b + 2} h={12} col="#8a7aff" />
    <LeafSlide t={b} wet={wet} />
    <Dandelion t={b} squash={squash} lost={lost} />
    <GrassBlades list={front} t={b} />
    <Motes t={b} n={40} c={[25, 4, -1]} area={[70, 6, 8]} color="#fff8dc" size={0.07} o={0.45} />
    {children}
  </Day>);
};
