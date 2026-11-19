// SETS (v13, EP07): reusable rich locations — Stickman's COTTAGE + GARDEN (exterior), the cottage HALLWAY (interior with a real doorway),
// breakfast props (garden table, pancakes, pancake tower, teacup), FLIGHT landscape (town rooftops, snowy mountains, sparkling sea),
// TROPICAL ISLAND (sand, palm tree, shells, starfish, gentle waves), DRAGON EGGS (cute, wobble, crack).
import React from "react";
import * as THREE from "three";
import { Box, Cyl, Ball, CanvasPlane, INK } from "../style/toon";
import { WallDoor, Floor, Frame, Plant, Rug } from "../style/props";
import { Extrude } from "../style/extra";
import { SGlow } from "../style/sky";
import { V3 } from "../style/kit";
import { WindTree, Bush, Flowers, Grass, Water, terrainY } from "./world";
import { CloudPuff } from "./puff";

const TAU = Math.PI * 2;
const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const ramp = (() => { const d = new Uint8Array([100, 180, 255]); const t = new THREE.DataTexture(d, 3, 1, THREE.RedFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
const Toon: React.FC<{ color: string }> = ({ color }) => <meshToonMaterial color={color} gradientMap={ramp} />;

/* ---------------- COTTAGE (exterior). Origin = front-centre at ground; faces +z. 8 wide, 6 deep, walls 3.6, ridge 6.3 ---------------- */
export const COTTAGE = { door: [0, 0, 0.05] as V3, sideWindow: [4.05, 2.0, -3] as V3, roofFront: [0, 5.0, -1.4] as V3, chimney: [2.5, 7.1, -3.8] as V3, ridgeY: 6.3 };
export const Cottage: React.FC<{ p?: V3; t: number; chimneySmoke?: boolean; doorOpen?: number; burnt?: number }> = ({ p = [0, 0, 0], t, chimneySmoke = true, doorOpen = 0, burnt = 0 }) => {
  const roof = burnt > 0 ? "#" + new THREE.Color("#c8403a").lerp(new THREE.Color("#3a2a2a"), burnt).getHexString() : "#c8403a";
  const win = (x: number, y: number, z: number, rotY = 0, light = 0) => (<group position={[x, y, z]} rotation={[0, rotY, 0]}>
    <Box p={[0, 0, 0]} s={[1.4, 1.4, 0.12]} color="#ffffff" line={3} /><Box p={[0, 0, 0.05]} s={[1.15, 1.15, 0.04]} color={light ? "#ffe3a0" : "#9fd8ff"} line={2} />
    <Box p={[0, 0, 0.09]} s={[0.07, 1.15, 0.03]} color="#ffffff" line={1} /><Box p={[0, 0, 0.09]} s={[1.15, 0.07, 0.03]} color="#ffffff" line={1} />
    {[-1, 1].map((sd) => <Box key={sd} p={[sd * 1.0, 0, 0.04]} s={[0.5, 1.4, 0.08]} color="#3a8fe0" line={2} />)}
    <Box p={[0, -0.85, 0.2]} s={[1.5, 0.3, 0.4]} color="#8a5a32" line={2} />
    {[-0.5, -0.2, 0.15, 0.45].map((fx, i) => <Ball key={i} p={[fx, -0.6, 0.25]} r={0.13} color={["#ff6aa8", "#ffd23a", "#ff8a3a", "#b88cff"][i]} ink={0.02} />)}
  </group>);
  return (<group position={p}>
    {/* walls + timber frame */}
    <Box p={[0, 1.8, -3]} s={[8, 3.6, 6]} color="#fff1d6" line={4} />
    {[-3.9, 3.9].map((x) => <Box key={x} p={[x, 1.8, 0.02]} s={[0.25, 3.6, 0.08]} color="#8a5a32" line={2} />)}
    <Box p={[0, 3.55, 0.02]} s={[8.1, 0.22, 0.08]} color="#8a5a32" line={2} /><Box p={[0, 0.2, 0.02]} s={[8.1, 0.4, 0.1]} color="#b8b2c8" line={2} />
    {/* gables + roof slabs with tile rows */}
    {[0.05, -6.05].map((z) => <group key={z} position={[0, 3.6, z]}><Extrude pts={[[-4, 0], [4, 0], [0, 2.7]]} depth={0.1} color="#ffe8c4" line={3} /></group>)}
    {[1, -1].map((sd) => <group key={sd} position={[0, 4.95, -3 + sd * 1.62]} rotation={[sd * 0.73, 0, 0]}>
      <Box p={[0, 0, 0]} s={[8.9, 0.24, 4.5]} color={roof} line={4} />
      {[-1.6, -0.8, 0, 0.8, 1.6].map((r) => <Box key={r} p={[0, 0.14, r]} s={[8.9, 0.06, 0.1]} color={burnt > 0.5 ? "#2a1a1a" : "#a82e2a"} line={0} />)}
    </group>)}
    <Box p={[0, 6.32, -3]} s={[9.0, 0.2, 0.35]} color="#8a2420" line={3} />
    {/* chimney */}
    <Box p={[2.5, 6.1, -3.8]} s={[0.9, 2.2, 0.9]} color="#c8704a" line={3} /><Box p={[2.5, 7.25, -3.8]} s={[1.1, 0.2, 1.1]} color="#8a4a32" line={2} />
    {chimneySmoke ? [0, 1, 2, 3].map((i) => { const u = (t * 0.35 + i * 0.25) % 1; return <CloudPuff key={i} p={[2.5 + u * 0.8, 7.5 + u * 2.4, -3.8]} r={0.3 + u * 0.4} u={u} seed={i + 70} look={{ color: "#f4f0f8", shadow: "#b8b0d0" }} />; }) : null}
    {/* door (opens inward around its left hinge) + porch */}
    <Box p={[0, 1.2, 0.03]} s={[1.6, 2.5, 0.1]} color="#ffffff" line={3} />
    <group position={[-0.65, 0, 0.06]} rotation={[0, doorOpen * 1.5, 0]}><Box p={[0.65, 1.12, 0]} s={[1.3, 2.25, 0.1]} color="#2fa04a" line={3} /><Ball p={[1.12, 1.1, 0.08]} r={0.07} color="#ffd23a" ink={0.02} /><Box p={[0.65, 1.7, 0.06]} s={[0.6, 0.5, 0.02]} color="#9fd8ff" line={1} /></group>
    <Box p={[0, 0.1, 0.55]} s={[2.2, 0.2, 1.0]} color="#b8b2c8" line={2} /><Cyl p={[1.0, 2.6, 0.2]} rt={0.12} h={0.35} color="#2b2f40" line={2} /><SGlow p={[1.0, 2.6, 0.35]} r={0.4} color="#ffe6a0" o={0.6} />
    {win(-2.4, 2.0, 0.05)}{win(2.4, 2.0, 0.05)}{win(4.05, 2.0, -3, Math.PI / 2, 1)}{win(-4.05, 2.0, -3, -Math.PI / 2)}
    <Plant p={[-1.4, 0, 0.6]} s={0.7} /><Plant p={[1.5, 0, 0.6]} s={0.6} pot="#3a6fd8" />
  </group>);
};

/* ---------------- COTTAGE HALLWAY (interior, looking at the front door from inside). Door opening centred at x=0 on wall z=0 ---------------- */
export const CottageHall: React.FC<{ t: number; doorOpen?: number; outside?: React.ReactNode }> = ({ t, doorOpen = 0, outside }) => (<>
  <ambientLight intensity={0.95} /><directionalLight position={[3, 6, 6]} intensity={0.9} color="#ffe6c8" /><directionalLight position={[0, 3, -8]} intensity={0.8} color="#fff4d8" />
  <Floor kind="plank" a="#c8955a" b="#b07840" />
  <WallDoor z={0} W={14} kind="wood" a="#f2c890" b="#e8b880" door={{ x: 0, w: 1.6, h: 2.6 }} />
  {[-0.9, 0.9].map((x) => <Box key={x} p={[x, 1.4, 0.04]} s={[0.2, 2.8, 0.18]} color="#ffffff" line={3} />)}<Box p={[0, 2.8, 0.04]} s={[2.0, 0.2, 0.18]} color="#ffffff" line={3} />
  <group position={[-0.8, 0, 0.05]} rotation={[0, -doorOpen * 1.6, 0]}><Box p={[0.8, 1.3, 0]} s={[1.6, 2.6, 0.12]} color="#2fa04a" line={3} /><Ball p={[1.4, 1.25, 0.1]} r={0.08} color="#ffd23a" ink={0.02} /></group>
  {/* the world outside the doorway */}
  <group position={[0, 0, -0.3]}>{outside}</group>
  {/* hallway dressing: coat rack, rug, shoes, pictures, plant, umbrella, light switch, skirting */}
  <Rug p={[0, 0, 2.2]} s={[2.4, 3.6]} a="#e5483f" b="#ffd23a" />
  <group position={[-2.6, 0, 0.6]}><Cyl p={[0, 1.4, 0]} rt={0.06} h={2.8} color="#8a5a32" line={2} />{[0, 1, 2].map((i) => <Cyl key={i} p={[Math.cos(i * 2) * 0.25, 2.6, Math.sin(i * 2) * 0.25]} rt={0.03} h={0.4} color="#8a5a32" line={1} rot={[0, 0, 0.9]} />)}<Box p={[0.15, 2.0, 0.1]} s={[0.6, 1.0, 0.3]} color="#3a6fd8" line={2} /></group>
  <Box p={[1.6, 0.08, 0.6]} s={[0.5, 0.16, 0.22]} color="#e5483f" line={2} /><Box p={[1.95, 0.08, 0.75]} s={[0.5, 0.16, 0.22]} color="#e5483f" line={2} rot={[0, 0.4, 0]} />
  <Frame p={[-2.4, 3.2, 0.05]} s={[1.0, 1.3]} art={1} /><Frame p={[2.4, 3.0, 0.05]} s={[1.2, 0.9]} art={2} />
  <Plant p={[2.9, 0, 0.6]} s={0.8} /><Cyl p={[-1.6, 0.6, 0.4]} rt={0.08} h={1.2} color="#7a54d6" line={2} rot={[0, 0, 0.2]} />
  <Box p={[1.2, 1.5, 0.04]} s={[0.18, 0.28, 0.04]} color="#ffffff" line={1} /><Box p={[0, 0.15, 0.06]} s={[14, 0.3, 0.1]} color="#fff6e8" line={2} />
  {[0, 1, 2, 3, 4, 5].map((i) => <SGlow key={i} p={[(rnd(i) - 0.5) * 2, 0.8 + rnd(i + 3) * 2, 0.8 + rnd(i + 5) * 1.5]} r={0.04} color="#fff4d0" o={0.7 * (0.5 + 0.5 * Math.sin(t + i))} />)}
</>);

/* ---------------- GARDEN around the cottage (morning): fence, gate, path, flower beds, trees, bushes, mailbox, swing, birdhouse ---------------- */
export const Garden: React.FC<{ t: number; c?: V3 }> = ({ t, c = [0, 0, 0] }) => (<group position={c}>
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -10]}><planeGeometry args={[140, 140]} /><Toon color="#5cc85a" /></mesh>
  <Grass t={t} c={[0, 0, 4]} area={[22, 10]} n={1600} amp={0} />
  <Flowers t={t} c={[-5.5, 0, 2.5]} area={[3, 2]} n={70} amp={0} /><Flowers t={t} c={[5.5, 0, 2.5]} area={[3, 2]} n={70} amp={0} />
  {/* stone path */}
  {Array.from({ length: 8 }, (_, i) => <mesh key={i} position={[Math.sin(i * 0.6) * 0.25, 0.03, 1.4 + i * 0.9]} rotation={[-Math.PI / 2, 0, i]}><circleGeometry args={[0.38, 7]} /><Toon color="#c8c4d8" /></mesh>)}
  {/* picket fence with a gate */}
  {Array.from({ length: 26 }, (_, i) => { const x = -12 + i * 0.95; if (Math.abs(x) < 1.0) return null; return <group key={i} position={[x, 0, 8.5]}><Box p={[0, 0.55, 0]} s={[0.18, 1.1, 0.08]} color="#ffffff" line={2} /><mesh position={[0, 1.15, 0]} rotation={[0, 0, Math.PI / 4]}><boxGeometry args={[0.13, 0.13, 0.08]} /><Toon color="#ffffff" /></mesh></group>; })}
  {[0.35, 0.8].map((y) => [-1, 1].map((sd) => <Box key={y + "" + sd} p={[sd * 6.75, y, 8.5]} s={[11.5, 0.1, 0.06]} color="#ffffff" line={1} />))}
  {/* mailbox */}
  <group position={[1.8, 0, 9.2]}><Cyl p={[0, 0.55, 0]} rt={0.06} h={1.1} color="#8a5a32" line={2} /><Box p={[0, 1.2, 0]} s={[0.4, 0.4, 0.7]} color="#3a6fd8" line={3} /><Box p={[0.22, 1.35, -0.1]} s={[0.04, 0.3, 0.1]} color="#e5483f" line={1} /></group>
  {/* trees, bushes, swing, birdhouse */}
  <WindTree p={[-8, 0, -2]} t={t} s={1.5} seed={2} /><WindTree p={[8.5, 0, -6]} t={t} s={1.7} seed={4} kind="blossom" /><WindTree p={[-11, 0, -12]} t={t} s={1.8} seed={6} /><WindTree p={[12, 0, -14]} t={t} s={1.6} seed={8} kind="pine" />
  <Bush p={[-5, 0, 0.8]} t={t} flowers="#ff6aa8" /><Bush p={[5.2, 0, 0.6]} t={t} seed={3} flowers="#ffd23a" /><Bush p={[-7, 0, 5]} t={t} seed={5} />
  <group position={[-8, 0, -2]}><Box p={[0.9, 2.6, 0]} s={[1.6, 0.12, 0.12]} color="#8a5a32" line={2} /><Box p={[1.3, 1.1, 0]} s={[0.8, 0.08, 0.4]} color="#e5483f" line={2} />{[-0.3, 0.3].map((x) => <Cyl key={x} p={[1.3 + x * 1.2, 1.85, 0]} rt={0.015} h={1.5} color="#2b2f40" line={1} />)}</group>
  <group position={[8.5, 2.8, -5.3]}><Box p={[0, 0, 0]} s={[0.5, 0.5, 0.5]} color="#ffd23a" line={2} /><mesh position={[0, 0.4, 0]} rotation={[0, Math.PI / 4, 0]}><coneGeometry args={[0.45, 0.35, 4]} /><Toon color="#e5483f" /></mesh></group>
  {/* far hills */}
  {[[-30, -45, 22, "#4cb070"], [10, -55, 28, "#3fa86a"], [40, -45, 20, "#5cc85a"]].map(([x, z, r, col], i) => <mesh key={i} position={[x as number, -(r as number) * 0.55, z as number]}><sphereGeometry args={[r as number, 32, 16]} /><Toon color={col as string} /></mesh>)}
</group>);

/* ---------------- breakfast props ---------------- */
export const GardenTable: React.FC<{ p: V3 }> = ({ p }) => (<group position={p}>
  <Cyl p={[0, 1.0, 0]} rt={1.0} h={0.12} color="#ffffff" line={3} /><Cyl p={[0, 0.5, 0]} rt={0.08} h={1.0} color="#2b2f40" line={2} /><Cyl p={[0, 0.04, 0]} rt={0.45} h={0.08} color="#2b2f40" line={2} />
  <CanvasPlane p={[0, 1.065, 0]} rot={[-Math.PI / 2, 0, 0]} s={[1.9, 1.9]} px={[256, 256]} draw={(c, W, H) => { c.clearRect(0, 0, W, H); c.beginPath(); c.arc(W / 2, H / 2, W / 2 - 4, 0, TAU); c.clip(); for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { c.fillStyle = (i + j) % 2 ? "#e5483f" : "#ffffff"; c.fillRect(i * 32, j * 32, 32, 32); } }} />
</group>);
/* one fluffy pancake: golden top, darker browned rim, soft round edge */
export const Pancake: React.FC<{ p: V3; r?: number; h?: number; rot?: V3 }> = ({ p, r = 0.5, h = 0.16, rot }) => (<group position={p} rotation={rot}>
  <mesh scale={[1, h / r, 1]}><sphereGeometry args={[r, 28, 12]} /><Toon color="#f2b25a" /></mesh>
  <mesh scale={[1.03, (h / r) * 1.06, 1.03]}><sphereGeometry args={[r, 24, 10]} /><meshBasicMaterial color={INK} side={THREE.BackSide} /></mesh>
  <mesh position={[0, h * 0.82, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={0.78}><circleGeometry args={[r, 28]} /><meshBasicMaterial color="#ffd27a" /></mesh>
</group>);
/* stack of n pancakes with butter + syrup; wobble = sway amplitude (tall towers bend) */
export const PancakeStack: React.FC<{ p: V3; n: number; r?: number; t: number; wobble?: number; syrup?: boolean }> = ({ p, n, r = 0.5, t, wobble = 0, syrup = true }) => {
  const h = r * 0.28; return (<group position={p}>
    <Cyl p={[0, 0.03, 0]} rt={r * 1.35} h={0.06} color="#ffffff" line={2} />
    {Array.from({ length: n }, (_, i) => { const k = i / Math.max(1, n - 1); const sw = Math.sin(t * 2.4) * wobble * k * k; return <Pancake key={i} p={[sw * n * h * 0.5 + (rnd(i) - 0.5) * r * 0.08, 0.06 + h * 0.55 + i * h * 0.92, (rnd(i * 3) - 0.5) * r * 0.08]} r={r * (0.96 + rnd(i * 5) * 0.08)} h={h * 0.55} rot={[0, 0, sw * 0.3]} />; })}
    {syrup ? <group position={[Math.sin(t * 2.4) * wobble * n * h * 0.5, 0.06 + n * h * 0.92 + h * 0.4, 0]}><Box p={[0, 0.06, 0]} s={[r * 0.45, r * 0.25, r * 0.45]} color="#fff4a0" line={2} />
      <mesh position={[0, 0.0, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[r * 0.75, 20]} /><meshBasicMaterial color="#a8541a" /></mesh>
      {[0, 1, 2].map((i) => <mesh key={i} position={[Math.cos(i * 2.1) * r * 0.78, -h * (0.6 + i * 0.3), Math.sin(i * 2.1) * r * 0.78]}><capsuleGeometry args={[r * 0.07, h * (0.8 + i * 0.4), 4, 8]} /><meshBasicMaterial color="#a8541a" /></mesh>)}</group> : null}
  </group>);
};
export const Teacup: React.FC<{ p: V3; s?: number; color?: string }> = ({ p, s = 1, color = "#ffffff" }) => (<group position={p} scale={s}>
  <Cyl p={[0, 0.03, 0]} rt={0.62} h={0.06} color={color} line={2} />
  <mesh position={[0, 0.3, 0]}><cylinderGeometry args={[0.45, 0.3, 0.5, 28, 1, true]} /><meshToonMaterial color={color} gradientMap={ramp} side={THREE.DoubleSide} /></mesh>
  <mesh position={[0, 0.3, 0]} scale={1.04}><cylinderGeometry args={[0.45, 0.3, 0.5, 28, 1, true]} /><meshBasicMaterial color={INK} side={THREE.BackSide} /></mesh>
  <mesh position={[0, 0.54, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.4, 0.45, 28]} /><meshBasicMaterial color="#ff8fb0" /></mesh>
  <mesh position={[0.5, 0.32, 0]} rotation={[0, 0, Math.PI / 2]}><torusGeometry args={[0.13, 0.04, 8, 16, Math.PI]} /><Toon color={color} /></mesh>
  <mesh position={[0, 0.2, 0]} rotation={[0, 0, 0]}><torusGeometry args={[0.38, 0.025, 6, 28]} /><meshBasicMaterial color="#ff8fb0" /></mesh>
</group>);

/* ---------------- FLIGHT landscape: town rooftops, snowy mountains, sparkling sea (lay them out along -z; the dragon flies over them) ---------------- */
export const Town: React.FC<{ c: V3; t: number; n?: number; seed?: number }> = ({ c, t, n = 22, seed = 1 }) => (<group position={c}>
  {Array.from({ length: n }, (_, i) => { const x = (i % 6 - 2.5) * 4.2 + (rnd(i + seed) - 0.5) * 1.2, z = -Math.floor(i / 6) * 5 + (rnd(i * 3 + seed) - 0.5), h = 2.5 + rnd(i * 5 + seed) * 3, w = 2.6 + rnd(i * 7) * 1.2;
    const wall = ["#fff1d6", "#ffd8b0", "#d8e8ff", "#ffe0f0", "#e0ffd8"][i % 5], roof = ["#c8403a", "#3a6fd8", "#e58a3a", "#7a54d6"][i % 4];
    return <group key={i} position={[x, 0, z]} rotation={[0, (rnd(i * 9) - 0.5) * 0.3, 0]}><Box p={[0, h / 2, 0]} s={[w, h, 3]} color={wall} line={3} />
      <mesh position={[0, h + 0.7, 0]} rotation={[0, Math.PI / 4, 0]}><coneGeometry args={[w * 0.82, 1.4, 4]} /><Toon color={roof} /></mesh>
      {[-0.6, 0.6].map((wx) => <Box key={wx} p={[wx * w * 0.6, h * 0.6, 1.52]} s={[0.5, 0.6, 0.04]} color={Math.sin(t + i) > 0.6 ? "#ffe3a0" : "#9fd8ff"} line={1} />)}
      {i % 3 === 0 ? <Box p={[w * 0.25, h + 1.0, 0]} s={[0.4, 0.9, 0.4]} color="#c8704a" line={2} /> : null}</group>; })}
  <mesh position={[0, 0.02, -10]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[40, 40]} /><Toon color="#9a8ab0" /></mesh>
  {Array.from({ length: 8 }, (_, i) => <WindTree key={"t" + i} p={[(rnd(i * 13) - 0.5) * 30, 0, -rnd(i * 17) * 18]} t={t} s={0.9} seed={i + 20} />)}
</group>);
export const Mountains: React.FC<{ c: V3; n?: number; seed?: number; scale?: number }> = ({ c, n = 7, seed = 1, scale = 1 }) => (<group position={c} scale={scale}>
  {Array.from({ length: n }, (_, i) => { const x = (i - n / 2) * 9 + (rnd(i + seed) - 0.5) * 4, z = -rnd(i * 3 + seed) * 12, h = 12 + rnd(i * 5 + seed) * 10, r = h * 0.75;
    return <group key={i} position={[x, 0, z]}><mesh position={[0, h / 2, 0]}><coneGeometry args={[r, h, 7]} /><Toon color={i % 2 ? "#6e86c8" : "#5a74b8"} /></mesh>
      <mesh position={[0, h / 2, 0]} scale={1.02}><coneGeometry args={[r, h, 7]} /><meshBasicMaterial color={INK} side={THREE.BackSide} /></mesh>
      <mesh position={[0, h * 0.82, 0]}><coneGeometry args={[r * 0.36 * 1.04, h * 0.36, 7]} /><Toon color="#f4f8ff" /></mesh></group>; })}
</group>);
export const Sea: React.FC<{ c: V3; t: number; size?: [number, number]; color?: string; sky?: string }> = ({ c, t, size = [160, 120], color = "#3a8fe0", sky = "#ffd0a0" }) => (<>
  <Water p={c} s={size} t={t} color={color} sky={sky} />
  {Array.from({ length: 40 }, (_, i) => <SGlow key={i} p={[c[0] + (rnd(i * 3) - 0.5) * size[0] * 0.6, c[1] + 0.1, c[2] + (rnd(i * 7) - 0.5) * size[1] * 0.6]} r={0.4 + rnd(i) * 0.4} color="#fff4c8" o={Math.max(0, Math.sin(t * 4 + i * 2.3)) * 0.9} />)}
</>);

/* ---------------- TROPICAL ISLAND (sunset): sand mound r~6, palm tree, shells, starfish, gentle waves ---------------- */
export const PalmTree: React.FC<{ p: V3; t: number; s?: number; lean?: number }> = ({ p, t, s = 1, lean = 0.35 }) => {
  const seg = 9, pts: V3[] = Array.from({ length: seg + 1 }, (_, i) => { const k = i / seg; return [Math.sin(k * lean * 2.2) * 1.6 * k, k * 5.2, 0]; });
  const top = pts[seg], sw = Math.sin(t * 1.2) * 0.06;
  return (<group position={p} scale={s}>
    {pts.slice(0, -1).map((a, i) => { const b = pts[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]); return <group key={i} position={[(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 0]} rotation={[0, 0, -Math.atan2(b[0] - a[0], b[1] - a[1])]}><Cyl p={[0, 0, 0]} rt={0.2 - i * 0.012} rb={0.24 - i * 0.012} h={len * 1.05} color={i % 2 ? "#a8743a" : "#8a5a2a"} line={2} /></group>; })}
    <group position={top} rotation={[0, 0, sw]}>
      {Array.from({ length: 7 }, (_, i) => <group key={i} rotation={[0, (i / 7) * TAU, 0]}><group rotation={[0, 0, -0.9 + Math.sin(t * 1.6 + i) * 0.06]}><Extrude pts={[[0, 0], [0.9, 0.25], [2.0, 0.2], [2.9, -0.25], [2.0, -0.05], [0.9, -0.15]]} depth={0.06} color={i % 2 ? "#3fbf5a" : "#2fa04a"} line={3} rot={[Math.PI / 2, 0, 0]} /></group></group>)}
      {[0, 1, 2].map((i) => <Ball key={i} p={[Math.cos(i * 2.1) * 0.3, -0.25, Math.sin(i * 2.1) * 0.3]} r={0.22} color="#7a4a22" />)}
    </group></group>);
};
export const Island: React.FC<{ c?: V3; t: number; r?: number }> = ({ c = [0, 0, 0], t, r = 6 }) => (<group position={c}>
  <mesh position={[0, -r * 0.82, 0]}><sphereGeometry args={[r, 48, 24]} /><Toon color="#ffd98a" /></mesh>
  <mesh position={[0, -r * 0.82, 0]} scale={1.01}><sphereGeometry args={[r, 40, 20]} /><meshBasicMaterial color={INK} side={THREE.BackSide} /></mesh>
  <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[r * 0.55, r * 0.6, 64]} /><meshBasicMaterial color="#f0c070" /></mesh>
  <PalmTree p={[-1.6, r * 0.12, -1.4]} t={t} s={1.15} /><PalmTree p={[1.9, r * 0.08, -2.2]} t={t + 1} s={0.8} lean={-0.3} />
  {Array.from({ length: 10 }, (_, i) => { const a = rnd(i * 7) * TAU, d = r * (0.25 + rnd(i * 3) * 0.3); const x = Math.cos(a) * d, z = Math.sin(a) * d, y = Math.sqrt(Math.max(0, r * r - x * x - z * z)) - r * 0.82;
    return i % 3 === 0 ? <group key={i} position={[x, y + 0.05, z]} rotation={[-Math.PI / 2, 0, a]}><Extrude pts={Array.from({ length: 10 }, (_, k) => { const rr = k % 2 ? 0.08 : 0.2, aa = (k / 10) * TAU; return [Math.cos(aa) * rr, Math.sin(aa) * rr] as [number, number]; })} depth={0.04} color="#ff7a5a" line={2} /></group>
      : <mesh key={i} position={[x, y + 0.06, z]} rotation={[0, a, 0]} scale={[1, 0.6, 1.3]}><sphereGeometry args={[0.13, 10, 8, 0, TAU, 0, Math.PI / 2]} /><Toon color={i % 2 ? "#ffe6f0" : "#fff6d8"} /></mesh>; })}
  {/* gentle waves: rings rolling onto the beach */}
  {[0, 1, 2].map((i) => { const u = (t * 0.25 + i / 3) % 1; return <mesh key={i} position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[r * (0.75 - u * 0.12), r * (0.75 - u * 0.12) + 0.18, 64]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.85 * Math.sin(u * Math.PI)} depthWrite={false} /></mesh>; })}
</group>);

/* ---------------- DRAGON EGG (cute: red with yellow spots like the dragon), wobble + crack (0..1) + peek eye ---------------- */
const eggGeo = (() => { const pts = Array.from({ length: 24 }, (_, i) => { const k = i / 23, a = k * Math.PI; return new THREE.Vector2(Math.sin(a) * (0.5 + 0.12 * Math.cos(a)), -Math.cos(a) * 0.68); }); return new THREE.LatheGeometry(pts, 32); })();
const eggTex = (() => { const cv = document.createElement("canvas"); cv.width = 256; cv.height = 256; const c = cv.getContext("2d")!; c.fillStyle = "#e5372c"; c.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 18; i++) { c.fillStyle = "#ffd256"; c.beginPath(); c.ellipse(rnd(i * 3) * 256, 30 + rnd(i * 7) * 200, 10 + rnd(i) * 12, 8 + rnd(i * 5) * 10, 0, 0, TAU); c.fill(); }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t; })();
export const DragonEgg: React.FC<{ p: V3; t: number; s?: number; wobble?: number; crack?: number; peek?: number; hue?: string }> = ({ p, t, s = 1, wobble = 0, crack = 0, peek = 0 }) => {
  const w = Math.sin(t * 14) * 0.18 * wobble;
  return (<group position={[p[0], p[1] + 0.68 * s, p[2]]} rotation={[0, 0, w]} scale={s}>
    <mesh geometry={eggGeo}><meshToonMaterial map={eggTex} gradientMap={ramp} /></mesh>
    <mesh geometry={eggGeo} scale={1.04}><meshBasicMaterial color={INK} side={THREE.BackSide} /></mesh>
    <SGlow p={[-0.18, 0.3, 0.42]} r={0.18} color="#ffffff" o={0.7} />
    {crack > 0 ? <CanvasPlane p={[0, 0.18, 0.52]} s={[0.9, 0.5]} px={[180, 100]} draw={(c, W, H) => { c.clearRect(0, 0, W, H); const k = Math.min(1, crack * 1.3); c.beginPath(); const pts: [number, number][] = [[0, 0.55], [0.18, 0.35], [0.3, 0.6], [0.45, 0.3], [0.58, 0.62], [0.72, 0.38], [0.86, 0.6], [1, 0.45]];
      pts.slice(0, Math.max(2, Math.ceil(pts.length * k))).forEach(([x, y], i) => (i ? c.lineTo(x * W, y * H) : c.moveTo(x * W, y * H))); c.lineWidth = 7; c.strokeStyle = "#1a0a0a"; c.stroke();
      if (peek > 0) { c.fillStyle = "#1a0a0a"; c.beginPath(); c.ellipse(W * 0.5, H * 0.52, W * 0.18 * peek, H * 0.16 * peek, 0, 0, TAU); c.fill(); c.fillStyle = "#ffffff"; c.beginPath(); c.arc(W * 0.46, H * 0.46, 6 * peek, 0, TAU); c.fill(); } }} /> : null}
  </group>);
};
void terrainY;
