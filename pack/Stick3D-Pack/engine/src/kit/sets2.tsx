// SETS v15 (EP08): small-town STREET (shops, pizza place with neon sign, houses, lamps, trees, benches, bikes), GOLD mansion/car/toilet,
// MONEY (banknote, stacks, piles, falling money, money blanket), PRICE BOARD with spinning digits, APPLE TREE that grows, pencils, SOLD signs.
import React, { useMemo, useRef, useLayoutEffect } from "react";
import * as THREE from "three";
import { Box, Cyl, Ball, CanvasPlane, INK } from "../style/toon";
import { Building, StreetLamp, Bench, Extrude } from "../style/extra";
import { SGlow } from "../style/sky";
import { V3 } from "../style/kit";
import { WindTree, Bush, Flowers, Grass } from "./world";
import { Cottage } from "./sets";

const TAU = Math.PI * 2;
const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const ramp = (() => { const d = new Uint8Array([100, 180, 255]); const t = new THREE.DataTexture(d, 3, 1, THREE.RedFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
const Toon: React.FC<{ color: string; map?: THREE.Texture }> = ({ color, map }) => <meshToonMaterial color={color} map={map} gradientMap={ramp} />;
const GOLD = "#ffc83a", GOLD_D = "#d8962a";

/* ---------------- money ---------------- */
export const billTex = (() => { const cv = document.createElement("canvas"); cv.width = 256; cv.height = 128; const c = cv.getContext("2d")!;
  c.fillStyle = "#8fd88a"; c.fillRect(0, 0, 256, 128); c.strokeStyle = "#2f8a4a"; c.lineWidth = 8; c.strokeRect(6, 6, 244, 116); c.lineWidth = 3; c.strokeRect(18, 18, 220, 92);
  c.fillStyle = "#c8f0c0"; c.beginPath(); c.ellipse(128, 64, 34, 40, 0, 0, TAU); c.fill(); c.strokeStyle = "#2f8a4a"; c.stroke();
  c.fillStyle = "#1f6a3a"; c.font = "900 54px Inter, Arial"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("$", 128, 66); c.font = "900 26px Inter, Arial"; c.fillText("100", 44, 34); c.fillText("100", 212, 96);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t; })();
export const Banknote: React.FC<{ p: V3; rot?: V3; s?: number; glow?: number }> = ({ p, rot = [0, 0, 0], s = 1, glow = 0 }) => (<group position={p} rotation={rot} scale={s}>
  <mesh><boxGeometry args={[1.0, 0.012, 0.5]} /><meshToonMaterial map={billTex} gradientMap={ramp} /></mesh>
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]}><planeGeometry args={[1.0, 0.5]} /><meshBasicMaterial map={billTex} toneMapped={false} /></mesh>
  {glow > 0 ? <SGlow p={[0, 0.1, 0]} r={0.6} color="#d8ffb0" o={0.5 * glow} /> : null}
</group>);
/* a stack of bills: n bills tall (0.012 each) — `wobble` sways, `topple` 0..1 tips it over */
export const MoneyStack: React.FC<{ p: V3; h: number; t: number; topple?: number; w?: number }> = ({ p, h, t, topple = 0, w = 1 }) => {
  const sw = Math.sin(t * 3) * 0.02 * h / 3; return (<group position={p} rotation={[0, 0, -topple * 1.45 + sw]}>
    <mesh position={[0, h / 2, 0]} scale={[w, 1, w]}><boxGeometry args={[1.0, h, 0.5]} /><meshToonMaterial color="#8fd88a" gradientMap={ramp} /></mesh>
    <mesh position={[0, h / 2, 0]} scale={[w * 1.03, 1.005, w * 1.06]}><boxGeometry args={[1.0, h, 0.5]} /><meshBasicMaterial color={INK} side={THREE.BackSide} /></mesh>
    {Array.from({ length: Math.min(40, Math.ceil(h / 0.15)) }, (_, i) => <mesh key={i} position={[0, 0.15 * i + 0.07, 0.256 * w]}><boxGeometry args={[0.98 * w, 0.02, 0.01]} /><meshBasicMaterial color="#2f8a4a" /></mesh>)}
    {[0.25, 0.5, 0.75].map((k) => <mesh key={k} position={[0, h * k, 0]} scale={[w, 1, w]}><boxGeometry args={[1.04, 0.08, 0.54]} /><meshBasicMaterial color="#ffffff" /></mesh>)}
    <mesh position={[0, h + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={w}><planeGeometry args={[1.0, 0.5]} /><meshBasicMaterial map={billTex} toneMapped={false} /></mesh>
  </group>); };
/* instanced pile of bills (mound shape); glow = magic green glow */
export const MoneyPile: React.FC<{ p: V3; r?: number; h?: number; n?: number; glow?: number; seed?: number }> = ({ p, r = 2.5, h = 1.6, n = 700, glow = 0, seed = 1 }) => {
  const ref = useRef<THREE.InstancedMesh>(null), m = useMemo(() => new THREE.Object3D(), []);
  useLayoutEffect(() => { for (let i = 0; i < n; i++) { const a = rnd(i * 3 + seed) * TAU, d = Math.sqrt(rnd(i * 7 + seed)) * r, y = h * Math.max(0, 1 - (d / r) ** 2) * (0.7 + rnd(i) * 0.3);
    m.position.set(Math.cos(a) * d, y, Math.sin(a) * d); m.rotation.set((rnd(i * 5) - 0.5) * 0.9, rnd(i * 11) * TAU, (rnd(i * 13) - 0.5) * 0.9); m.scale.setScalar(0.9 + rnd(i * 17) * 0.3); m.updateMatrix(); ref.current?.setMatrixAt(i, m.matrix); }
    if (ref.current) ref.current.instanceMatrix.needsUpdate = true; }, [n, r, h, seed]);
  return (<group position={p}>
    <mesh position={[0, -h * 0.35, 0]} scale={[r, h * 0.95, r]}><sphereGeometry args={[1, 32, 16, 0, TAU, 0, Math.PI / 2]} /><Toon color="#6ab86a" /></mesh>
    <instancedMesh ref={ref} args={[undefined, undefined, n]}><boxGeometry args={[0.9, 0.02, 0.45]} /><meshToonMaterial map={billTex} gradientMap={ramp} /></instancedMesh>
    {glow > 0 ? <><SGlow p={[0, h * 0.6, 0]} r={r * 1.6} color="#c8ffa0" o={0.35 * glow} />{Array.from({ length: 10 }, (_, i) => <SGlow key={i} p={[(rnd(i) - 0.5) * r * 1.6, h * (0.4 + rnd(i * 3) * 0.6), (rnd(i * 7) - 0.5) * r]} r={0.15} color="#ffffff" o={0.8 * glow} />)}</> : null}
  </group>);
};
/* bills falling like snow over an area (fluttering) */
export const MoneyRain: React.FC<{ c: V3; t: number; area?: [number, number]; top?: number; n?: number; on?: number }> = ({ c, t, area = [14, 10], top = 10, n = 60, on = 1 }) => (on <= 0 ? null :
  <>{Array.from({ length: Math.round(n * on) }, (_, i) => { const u = (t * (0.08 + rnd(i) * 0.05) + rnd(i * 3)) % 1, x = c[0] + (rnd(i * 5) - 0.5) * area[0] + Math.sin(t * 2 + i) * 0.6, z = c[2] + (rnd(i * 7) - 0.5) * area[1];
    return <Banknote key={i} p={[x, c[1] + top * (1 - u), z]} rot={[Math.sin(t * 3 + i) * 0.8, t * 1.5 + i, Math.cos(t * 2.5 + i) * 0.6]} s={0.55} />; })}</>);
/* blanket made of bills (person sleeping underneath shows as a bump) */
export const MoneyBlanket: React.FC<{ p: V3; rotY?: number; t: number; s?: number }> = ({ p, rotY = 0, t, s = 1 }) => (<group position={p} rotation={[0, rotY, 0]} scale={s}>
  <mesh position={[0, 0.25 + Math.sin(t * 1.5) * 0.02, 0]} scale={[1.2, 0.32, 0.6]}><sphereGeometry args={[1, 24, 12, 0, TAU, 0, Math.PI / 2]} /><Toon color="#8fd88a" /></mesh>
  {Array.from({ length: 14 }, (_, i) => <Banknote key={i} p={[(rnd(i) - 0.5) * 2.0, 0.3 + rnd(i * 3) * 0.25, (rnd(i * 5) - 0.5) * 0.9]} rot={[(rnd(i * 7) - 0.5) * 0.6, rnd(i * 9) * 3, (rnd(i * 11) - 0.5) * 0.6]} s={0.7} />)}
  <Ball p={[-1.35, 0.32, 0]} r={0.32} color="#ffffff" /><mesh position={[-1.1, 0.2, 0]}><boxGeometry args={[0.4, 0.4, 0.9]} /><Toon color="#c8d0ff" /></mesh>
  {[0, 1, 2].map((i) => { const u = (t * 0.4 + i / 3) % 1; return <CanvasPlane key={i} p={[-1.4 + u * 0.4, 0.8 + u * 0.9, 0]} s={[0.3, 0.3]} face px={[64, 64]} draw={(c, W, H) => { c.clearRect(0, 0, W, H); c.globalAlpha = 1 - u; c.fillStyle = "#ffffff"; c.strokeStyle = INK; c.lineWidth = 6; c.font = "900 54px Inter"; c.textAlign = "center"; c.strokeText("z", W / 2, H * 0.8); c.fillText("z", W / 2, H * 0.8); }} />; })}
</group>);

/* ---------------- pencils (everyone borrows one) ---------------- */
export const PencilProp: React.FC<{ p: V3; rot?: V3; s?: number }> = ({ p, rot = [0, 0, 0], s = 1 }) => (<group position={p} rotation={rot} scale={s}>
  <Cyl p={[0, 0.5, 0]} rt={0.06} h={0.8} color="#ffd23a" line={2} /><Cyl p={[0, 0.03, 0]} rt={0.06} rb={0.0} h={0.14} color="#f2c38a" line={2} /><Cyl p={[0, 0.95, 0]} rt={0.065} h={0.1} color="#c0c8dc" line={1} /><Cyl p={[0, 1.05, 0]} rt={0.06} h={0.1} color="#ff8fb0" line={1} />
</group>);

/* ---------------- gold things ---------------- */
const goldMat = (k = 0) => <meshToonMaterial color={k ? GOLD_D : GOLD} gradientMap={ramp} />;
export const GoldCar: React.FC<{ p: V3; rotY?: number; s?: number; t: number }> = ({ p, rotY = 0, s = 1, t }) => (<group position={p} rotation={[0, rotY, 0]} scale={s}>
  <Box p={[0, 0.65, 0]} s={[3.2, 0.7, 1.6]} color={GOLD} line={4} /><Box p={[-0.2, 1.25, 0]} s={[1.8, 0.6, 1.4]} color={GOLD} line={4} />
  <Box p={[-0.2, 1.25, 0.71]} s={[1.5, 0.45, 0.02]} color="#9fd8ff" line={2} /><Box p={[-0.2, 1.25, -0.71]} s={[1.5, 0.45, 0.02]} color="#9fd8ff" line={2} />
  {[[-1.0, 0.8], [1.0, 0.8], [-1.0, -0.8], [1.0, -0.8]].map(([x, z], i) => <group key={i} position={[x, 0.36, z]}><Cyl p={[0, 0, 0]} rt={0.36} h={0.24} color="#2b2f40" line={3} rot={[Math.PI / 2, 0, 0]} /><Cyl p={[0, 0, z > 0 ? 0.1 : -0.1]} rt={0.18} h={0.06} color={GOLD_D} line={1} rot={[Math.PI / 2, 0, 0]} /></group>)}
  <Box p={[1.62, 0.7, 0.5]} s={[0.04, 0.2, 0.3]} color="#fff6b0" line={1} /><Box p={[1.62, 0.7, -0.5]} s={[0.04, 0.2, 0.3]} color="#fff6b0" line={1} />
  {[0, 1, 2, 3].map((i) => <SGlow key={i} p={[(rnd(i) - 0.5) * 3, 0.8 + rnd(i * 3) * 0.8, 0.85]} r={0.25} color="#ffffff" o={Math.max(0, Math.sin(t * 5 + i * 1.7))} />)}
</group>);
export const GoldToilet: React.FC<{ p: V3; rotY?: number; t: number; sparkle?: number; lid?: number }> = ({ p, rotY = 0, t, sparkle = 1, lid = 0 }) => (<group position={p} rotation={[0, rotY, 0]}>
  {/* pedestal with red velvet + rope posts */}
  <Cyl p={[0, 0.3, 0]} rt={1.1} rb={1.25} h={0.6} color="#f4f0e8" line={3} /><Cyl p={[0, 0.62, 0]} rt={1.0} h={0.06} color="#c8203a" line={2} />
  {[-1.6, 1.6].map((x) => <group key={x} position={[x, 0, 0.6]}><Cyl p={[0, 0.5, 0]} rt={0.05} h={1.0} color={GOLD} line={1} /><Ball p={[0, 1.05, 0]} r={0.09} color={GOLD} ink={0.02} /></group>)}
  <mesh position={[0, 0.85, 0.6]}><torusGeometry args={[1.6, 0.04, 6, 24, Math.PI]} /><meshToonMaterial color="#c8203a" gradientMap={ramp} /></mesh>
  <group position={[0, 0.65, 0]}>
    <mesh position={[0, 0.3, 0.1]} scale={[0.5, 0.6, 0.62]}><sphereGeometry args={[1, 24, 16]} />{goldMat()}</mesh>
    <mesh position={[0, 0.3, 0.1]} scale={[0.52, 0.62, 0.64]}><sphereGeometry args={[1, 18, 12]} /><meshBasicMaterial color={INK} side={THREE.BackSide} /></mesh>
    <mesh position={[0, 0.62, 0.1]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 1.25, 1]}><ringGeometry args={[0.22, 0.42, 28]} /><meshBasicMaterial color="#fff2a0" /></mesh>
    <Box p={[0, 0.95, -0.45]} s={[0.9, 0.9, 0.3]} color={GOLD} line={3} /><Box p={[0, 1.42, -0.45]} s={[1.0, 0.1, 0.36]} color={GOLD_D} line={2} />
    <group position={[0, 0.66, -0.3]} rotation={[-lid * 1.5, 0, 0]}><mesh position={[0, 0, 0.42]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 1.25, 1]}><circleGeometry args={[0.44, 28]} />{goldMat(1)}</mesh></group>
    <Box p={[0.32, 1.25, -0.28]} s={[0.18, 0.05, 0.05]} color="#fff6b0" line={1} />
  </group>
  {sparkle > 0 ? <>{Array.from({ length: 7 }, (_, i) => { const ph = (t * 1.2 + i * 0.37) % 1; const x = Math.sin(i * 2.3) * 0.6, y = 1.0 + (i % 3) * 0.45; return <group key={i}><SGlow p={[x, y + 0.3, 0.5]} r={0.12 + 0.32 * Math.sin(ph * Math.PI)} color="#ffffff" o={sparkle * Math.sin(ph * Math.PI)} />
    <CanvasPlane p={[x, y + 0.3, 0.55]} s={[0.5, 0.5]} face additive px={[64, 64]} draw={(c, W, H) => { c.clearRect(0, 0, W, H); const k = Math.sin(ph * Math.PI) * sparkle; c.fillStyle = `rgba(255,255,220,${k})`; c.beginPath(); for (let j = 0; j < 8; j++) { const a = (j / 8) * TAU, rr = j % 2 ? 6 : 30 * k; c.lineTo(W / 2 + Math.cos(a) * rr, H / 2 + Math.sin(a) * rr); } c.fill(); }} /></group>; })}
    <SGlow p={[0, 1.3, 0.3]} r={2.0} color="#fff0a0" o={0.35 * sparkle} /></> : null}
</group>);
/* gold mansion: a cottage painted gold + columns + fountain-ish steps */
export const GoldMansion: React.FC<{ p?: V3; t: number; s?: number }> = ({ p = [0, 0, 0], t, s = 1 }) => (<group position={p} scale={s}>
  <group scale={[1.4, 1.25, 1.1]}><Cottage t={t} chimneySmoke={false} goldTint /></group>
  {[-4.6, -2.4, 2.4, 4.6].map((x) => <group key={x} position={[x, 0, 1.0]}><Cyl p={[0, 2.3, 0]} rt={0.28} h={4.6} color="#fff4d0" line={3} /><Box p={[0, 4.7, 0]} s={[0.8, 0.25, 0.8]} color={GOLD} line={2} /><Box p={[0, 0.12, 0]} s={[0.8, 0.25, 0.8]} color={GOLD} line={2} /></group>)}
  <Box p={[0, 4.95, 1.0]} s={[10.5, 0.4, 1.0]} color={GOLD} line={3} />
  {[0, 1, 2].map((i) => <Box key={i} p={[0, 0.1 + i * 0.2, 2.2 - i * 0.35]} s={[4 - i * 0.6, 0.2, 0.7]} color="#f4f0e8" line={2} />)}
  {Array.from({ length: 6 }, (_, i) => <SGlow key={i} p={[(rnd(i) - 0.5) * 10, 2 + rnd(i * 3) * 5, 1.5]} r={0.35} color="#ffffff" o={Math.max(0, Math.sin(t * 3 + i * 2))} />)}
</group>);

/* ---------------- SOLD sign (pops onto anything bought) ---------------- */
export const SoldSign: React.FC<{ p: V3; k: number; rotY?: number; s?: number }> = ({ p, k, rotY = 0, s = 1 }) => (k <= 0 ? null :
  <group position={p} rotation={[0, rotY, Math.sin(k * 9) * 0.15 * (1 - k)]} scale={s * Math.min(1.15, k * 1.4)}>
    <CanvasPlane p={[0, 0, 0]} s={[2.2, 1.0]} px={[352, 160]} draw={(c, W, H) => { c.fillStyle = "#e5263a"; c.fillRect(0, 0, W, H); c.lineWidth = 12; c.strokeStyle = "#ffffff"; c.strokeRect(12, 12, W - 24, H - 24); c.font = "900 96px Inter, Arial"; c.fillStyle = "#ffffff"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("SOLD!", W / 2, H / 2 + 6); c.lineWidth = 8; c.strokeStyle = INK; c.strokeRect(2, 2, W - 4, H - 4); }} />
  </group>);

/* ---------------- PIZZA PLACE with a big neon pizza sign + PRICE BOARD ---------------- */
export const PizzaShop: React.FC<{ p: V3; t: number; neon?: number; rotY?: number }> = ({ p, t, neon = 1, rotY = 0 }) => {
  const fl = neon * (Math.sin(t * 11) > -0.9 ? 1 : 0.4);
  return (<group position={p} rotation={[0, rotY, 0]}>
    <Box p={[0, 2.4, 0]} s={[6, 4.8, 4]} color="#fff1d6" line={4} /><Box p={[0, 4.95, 0]} s={[6.4, 0.3, 4.4]} color="#e5483f" line={3} />
    {/* striped awning */}
    <group position={[0, 3.1, 2.3]} rotation={[0.5, 0, 0]}><CanvasPlane p={[0, 0, 0]} s={[6.2, 1.4]} px={[620, 140]} draw={(c, W, H) => { for (let i = 0; i < 12; i++) { c.fillStyle = i % 2 ? "#ffffff" : "#e5263a"; c.fillRect(i * W / 12, 0, W / 12 + 1, H); } c.lineWidth = 8; c.strokeStyle = INK; c.strokeRect(2, 2, W - 4, H - 4); }} /></group>
    <Box p={[-1.4, 1.5, 2.02]} s={[2.4, 1.6, 0.06]} color="#ffe3a0" line={3} /><Box p={[1.6, 1.25, 2.02]} s={[1.2, 2.5, 0.06]} color="#8a4a2a" line={3} /><Ball p={[2.0, 1.2, 2.08]} r={0.07} color={GOLD} ink={0.02} />
    <SGlow p={[-1.4, 1.5, 2.2]} r={1.4} color="#ffd890" o={0.45} />
    {/* neon pizza sign on the roof */}
    <group position={[0, 6.6, 0.8]}>
      <Box p={[0, 0, -0.1]} s={[4.2, 2.4, 0.15]} color="#1a1040" line={3} />
      <CanvasPlane p={[0, 0, 0.0]} s={[4.0, 2.2]} px={[640, 352]} draw={(c, W, H) => { c.fillStyle = "#1a1040"; c.fillRect(0, 0, W, H); c.save(); c.shadowColor = "#ffb030"; c.shadowBlur = 30 * fl;
        c.strokeStyle = `rgba(255,190,60,${fl})`; c.lineWidth = 10; c.beginPath(); c.moveTo(80, 60); c.lineTo(250, 300); c.lineTo(420 - 170 + 0, 60); c.closePath(); c.stroke();
        c.strokeStyle = `rgba(255,80,80,${fl})`; for (const [x, y] of [[160, 120], [220, 110], [200, 190]]) { c.beginPath(); c.arc(x - 40, y, 18, 0, TAU); c.stroke(); }
        c.font = "900 120px Inter, Arial"; c.textAlign = "left"; c.textBaseline = "middle"; c.lineWidth = 8; c.strokeStyle = `rgba(255,120,220,${fl})`; c.strokeText("PIZZA", 300, H / 2 + 8); c.fillStyle = `rgba(255,230,250,${fl})`; c.fillText("PIZZA", 300, H / 2 + 8); c.restore(); }} />
      <SGlow p={[0, 0, 0.6]} r={3.6} color="#ff9ad0" o={0.45 * neon} />
      <Cyl p={[-1.6, -1.6, -0.1]} rt={0.06} h={1.2} color="#c0c8dc" line={1} /><Cyl p={[1.6, -1.6, -0.1]} rt={0.06} h={1.2} color="#c0c8dc" line={1} />
    </group>
    {/* outdoor table + chairs */}
    <group position={[-2.0, 0, 3.6]}><Cyl p={[0, 0.85, 0]} rt={0.6} h={0.08} color="#ffffff" line={2} /><Cyl p={[0, 0.42, 0]} rt={0.05} h={0.84} color="#2b2f40" line={1} /><Cyl p={[0, 1.3, 0]} rt={0.03} h={0.9} color="#c0c8dc" line={1} /><mesh position={[0, 1.8, 0]}><coneGeometry args={[0.9, 0.4, 8]} /><Toon color="#e5263a" /></mesh></group>
  </group>);
};
/* price board: big digits that spin (slot-machine) from `from` to `to` between t0..t1 */
export const PriceBoard: React.FC<{ p: V3; t: number; t0: number; t1: number; from: number; to: number; rotY?: number; s?: number; label?: string }> = ({ p, t, t0, t1, from, to, rotY = 0, s = 1, label = "PIZZA" }) => {
  const k = Math.max(0, Math.min(1, (t - t0) / (t1 - t0))); const spinning = k > 0 && k < 1;
  const val = k >= 1 ? to : spinning ? Math.floor(from + (to - from) * k * k + (Math.sin(t * 60) * 0.5 + 0.5) * to * 0.3 * (1 - k)) : from;
  const txt = "$" + Math.max(0, val).toLocaleString("en-US");
  return (<group position={p} rotation={[0, rotY, 0]} scale={s}>
    <Box p={[0, 0, -0.08]} s={[4.6, 2.4, 0.12]} color="#2b2f40" line={4} />
    <CanvasPlane p={[0, 0, 0]} s={[4.4, 2.2]} px={[704, 352]} draw={(c, W, H) => { c.fillStyle = "#101828"; c.fillRect(0, 0, W, H); c.fillStyle = "#ffd23a"; c.font = "900 70px Inter, Arial"; c.textAlign = "center"; c.fillText(label, W / 2, 84);
      c.font = `900 ${txt.length > 10 ? 96 : 120}px Courier New, monospace`; c.fillStyle = spinning ? "#ff9a3a" : k >= 1 ? "#ff4a5a" : "#7affb0"; c.save(); c.shadowColor = c.fillStyle as string; c.shadowBlur = 18; c.fillText(txt, W / 2, 250 + (spinning ? Math.sin(t * 50) * 6 : 0)); c.restore();
      if (spinning) { c.fillStyle = "rgba(255,255,255,0.12)"; for (let i = 0; i < 8; i++) c.fillRect(0, (t * 900 + i * 44) % H, W, 6); } }} />
    <Cyl p={[-1.8, -1.9, -0.1]} rt={0.08} h={1.6} color="#8a92a8" line={2} /><Cyl p={[1.8, -1.9, -0.1]} rt={0.08} h={1.6} color="#8a92a8" line={2} />
  </group>);
};

/* ---------------- STREET (origin = road centre; road along x; shops on the north side z<0, houses on the south side z>0) ---------------- */
export type StreetMood = "morning" | "day" | "dinner" | "night";
export const STREET = { pizza: [0, 0, -9] as V3, home: [-14, 0, -9] as V3, sidewalk: 4.8 };
export const Street: React.FC<{ t: number; mood?: StreetMood; sold?: number; neon?: number; noPizza?: boolean; noBikes?: boolean }> = ({ t, mood = "morning", sold = 0, neon, noPizza, noBikes }) => {
  const night = mood === "night", lit = mood === "dinner" || night ? 0.75 : 0.25;
  const shops: [number, string, string][] = [[-21, "#7a5ab0", "BOOKS"], [-7, "#3a8fe0", "TOYS"], [7, "#2fa04a", "MARKET"], [14, "#e58a3a", "BAKERY"], [21, "#ff6aa8", "FLOWERS"]];
  return (<>
    {/* road, kerbs, sidewalks, crossing */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}><planeGeometry args={[120, 7]} /><Toon color="#55586a" /></mesh>
    {Array.from({ length: 20 }, (_, i) => <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[-57 + i * 6, 0.01, 0]}><planeGeometry args={[2.4, 0.2]} /><meshBasicMaterial color="#fff6b0" /></mesh>)}
    {Array.from({ length: 6 }, (_, i) => <mesh key={"z" + i} rotation={[-Math.PI / 2, 0, 0]} position={[3.5, 0.012, -2.5 + i * 1.0]}><planeGeometry args={[2.6, 0.5]} /><meshBasicMaterial color="#ffffff" /></mesh>)}
    {[-1, 1].map((sd) => <group key={sd}><Box p={[0, 0.12, sd * 4.6]} s={[120, 0.24, 2.2]} color="#c8c4d8" line={2} /><Box p={[0, 0.15, sd * 3.55]} s={[120, 0.3, 0.12]} color="#a8a2c0" line={1} /></group>)}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}><planeGeometry args={[200, 200]} /><Toon color="#6ac85a" /></mesh>
    {/* shops (north side) */}
    {shops.map(([x, col, name], i) => <group key={i} position={[x, 0, -9]}>
      <Building p={[0, 0, 0]} s={[6, 5 + (i % 3) * 1.2, 4]} color={col} seed={i + 3} lit={lit} />
      <CanvasPlane p={[0, 3.4, 2.05]} s={[4.4, 0.8]} px={[440, 80]} draw={(c, W, H) => { c.fillStyle = "#fffdf4"; c.fillRect(0, 0, W, H); c.lineWidth = 6; c.strokeStyle = INK; c.strokeRect(3, 3, W - 6, H - 6); c.font = "900 54px Inter, Arial"; c.fillStyle = col; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(name, W / 2, H / 2 + 3); }} />
      <Box p={[0, 1.3, 2.04]} s={[3.6, 1.8, 0.06]} color={night ? "#ffd890" : "#bfe8ff"} line={3} />
      <SoldSign p={[1.4, 2.6, 2.3]} k={Math.max(0, Math.min(1, sold * 6 - i * 0.6))} />
    </group>)}
    {noPizza ? null : <><PizzaShop p={STREET.pizza} t={t} neon={neon ?? (mood === "dinner" || night ? 1 : 0.7)} /><SoldSign p={[2.4, 3.8, -6.6]} k={Math.max(0, Math.min(1, sold * 4))} s={1.2} /></>}
    {/* houses (south side, facing the road) */}
    {[-16, -8, 8, 16].map((x, i) => <group key={i} position={[x, 0, 11]} rotation={[0, Math.PI, 0]} scale={0.75}><Cottage t={t} chimneySmoke={i % 2 === 0} /></group>)}
    {[-16, -8, 8, 16].map((x, i) => <SoldSign key={"hs" + i} p={[x + 1.6, 2.4, 9.0]} k={Math.max(0, Math.min(1, sold * 6 - 2 - i * 0.5))} rotY={0} />)}
    {/* lamp posts, trees, benches, bikes, hydrant, bins */}
    {[-18, -10, -2, 6, 14, 22].map((x, i) => <StreetLamp key={i} p={[x, 0.24, -4.2]} h={4.6} on={mood === "dinner" || night ? 1 : 0} />)}
    {[-24, -12, 4, 18].map((x, i) => <WindTree key={"t" + i} p={[x, 0.24, 5.6]} t={t} s={1.1} seed={i + 4} kind={i % 2 ? "round" : "blossom"} />)}
    {[-5, 10].map((x, i) => <Bench key={"b" + i} p={[x, 0.24, -4.6]} rotY={0} />)}
    {noBikes ? null : [-3.4, 11.6].map((x, i) => <Bike key={"k" + i} p={[x, 0.24, -4.3]} color={i ? "#3a6fd8" : "#e5483f"} />)}
    {[-20, 3, 20].map((x, i) => <Bush key={"bu" + i} p={[x, 0.24, 6.2]} t={t} seed={i + 2} flowers={i % 2 ? "#ffd23a" : "#ff6aa8"} />)}
    <Flowers t={t} c={[0, 0.24, 7.2]} area={[40, 1.2]} n={90} amp={0} />
    {[[-30, -30, 30], [10, -45, 40], [40, -30, 26]].map(([x, z, r], i) => <mesh key={"h" + i} position={[x, -r * 0.6, z]}><sphereGeometry args={[r, 32, 16]} /><Toon color={night ? "#2a4a5a" : "#4cb070"} /></mesh>)}
  </>);
};
export const Bike: React.FC<{ p: V3; rotY?: number; color?: string }> = ({ p, rotY = 0, color = "#e5483f" }) => (<group position={p} rotation={[0, rotY, 0]}>
  {[-0.55, 0.55].map((x) => <mesh key={x} position={[x, 0.42, 0]}><torusGeometry args={[0.38, 0.05, 8, 24]} /><meshToonMaterial color="#2b2f40" gradientMap={ramp} /></mesh>)}
  <Box p={[0, 0.62, 0]} s={[1.1, 0.07, 0.07]} color={color} line={1} rot={[0, 0, 0.15]} /><Box p={[-0.2, 0.75, 0]} s={[0.07, 0.6, 0.07]} color={color} line={1} rot={[0, 0, -0.3]} />
  <Box p={[0.45, 0.95, 0]} s={[0.06, 0.4, 0.06]} color="#2b2f40" line={1} /><Box p={[0.45, 1.15, 0]} s={[0.06, 0.06, 0.5]} color="#2b2f40" line={1} /><Box p={[-0.3, 1.05, 0]} s={[0.35, 0.08, 0.18]} color="#2b2f40" line={1} />
</group>);

/* ---------------- STICKMAN'S GARDEN + APPLE TREE (grows 0..1 with sparkles; apples pop at the end) ---------------- */
export const AppleTree: React.FC<{ p: V3; grow: number; t: number; apples?: number; s?: number }> = ({ p, grow, t, apples = 1, s = 1 }) => {
  const g = Math.max(0, Math.min(1, grow)); if (g <= 0) return null; const e = 1 - (1 - g) ** 3, sw = Math.sin(t * 1.3) * 0.03;
  const crown = Math.max(0, (g - 0.35) / 0.65);
  return (<group position={p} scale={s}>
    <group scale={[0.4 + 0.6 * e, e, 0.4 + 0.6 * e]}><Cyl p={[0, 1.4, 0]} rt={0.22} rb={0.38} h={2.8} color="#8a5a32" line={3} />
      {[[-0.5, 2.4, 0.7], [0.55, 2.6, -0.6]].map(([x, y, rz], i) => <Cyl key={i} p={[x * 0.5, y, 0]} rt={0.08} rb={0.14} h={1.2} color="#8a5a32" line={2} rot={[0, 0, rz]} />)}</group>
    {crown > 0 ? <group position={[0, 3.3 * e, 0]} rotation={[sw, 0, sw]} scale={crown}>
      {[[0, 0.8, 0, 1.5], [-1.2, 0.3, 0.2, 1.1], [1.2, 0.35, -0.1, 1.15], [-0.5, 1.5, -0.3, 1.0], [0.6, 1.5, 0.3, 1.0], [0, 0.2, 0.9, 1.0]].map(([x, y, z, r], i) => <group key={i} position={[x, y, z]}><mesh><icosahedronGeometry args={[r, 2]} /><Toon color={i % 2 ? "#3fbf5a" : "#2fa04a"} /></mesh><mesh scale={1.05}><icosahedronGeometry args={[r, 2]} /><meshBasicMaterial color={INK} side={THREE.BackSide} /></mesh></group>)}
      {Array.from({ length: 14 }, (_, i) => { const a = rnd(i * 3) * TAU, el = (rnd(i * 5) - 0.3) * 1.3; const k = Math.max(0, Math.min(1, apples * 14 - i)); if (k <= 0) return null;
        const q: V3 = [Math.cos(a) * 1.55 * Math.cos(el), 0.8 + Math.sin(el) * 1.2, Math.sin(a) * 1.4 * Math.cos(el) + 0.25];
        return <group key={i} position={q} scale={Math.min(1.15, k * 1.3)}><Ball p={[0, 0, 0]} r={0.26} color="#e5263a" /><SGlow p={[-0.08, 0.08, 0.2]} r={0.08} color="#ffffff" o={0.8} /><Cyl p={[0, 0.27, 0]} rt={0.02} h={0.12} color="#5a3a1a" line={1} /><mesh position={[0.08, 0.3, 0]} rotation={[0, 0, -0.8]} scale={[0.12, 0.05, 0.06]}><sphereGeometry args={[1, 8, 6]} /><Toon color="#3fbf5a" /></mesh></group>; })}
    </group> : null}
  </group>);
};
export const Apple: React.FC<{ p: V3; s?: number; bite?: number }> = ({ p, s = 1, bite = 0 }) => (<group position={p} scale={s}>
  <Ball p={[0, 0, 0]} r={0.26} color="#e5263a" /><SGlow p={[-0.08, 0.08, 0.2]} r={0.08} color="#ffffff" o={0.8} /><Cyl p={[0, 0.27, 0]} rt={0.02} h={0.12} color="#5a3a1a" line={1} />
  {bite > 0 ? <mesh position={[0.2, 0.05, 0.12]} scale={[1, 1.2, 1]}><sphereGeometry args={[0.13 * bite, 12, 10]} /><meshBasicMaterial color="#fff4d8" /></mesh> : null}
</group>);
export const SeedSprout: React.FC<{ p: V3; k: number }> = ({ p, k }) => (k <= 0 ? null : <group position={p}>
  <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.45, 20]} /><Toon color="#7a4a22" /></mesh>
  <Cyl p={[0, 0.15 * k, 0]} rt={0.025} h={0.3 * k} color="#3fbf5a" line={1} />
  {k > 0.5 ? [-1, 1].map((sd) => <mesh key={sd} position={[sd * 0.1, 0.3 * k, 0]} rotation={[0, 0, sd * -0.6]} scale={[0.12, 0.05, 0.07]}><sphereGeometry args={[1, 8, 6]} /><Toon color="#5ad66a" /></mesh>) : null}
</group>);
export const Garden8: React.FC<{ t: number; night?: boolean }> = ({ t, night = false }) => (<>
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -10]}><planeGeometry args={[160, 160]} /><Toon color={night ? "#2a5a4a" : "#5cc85a"} /></mesh>
  <Grass t={t} c={[0, 0, 2]} area={[20, 14]} n={1600} amp={0} colors={night ? ["#2a6a4a", "#3a7a5a", "#1e5a4a"] : undefined} />
  <Flowers t={t} c={[-5, 0, 3]} area={[3, 2]} n={60} amp={0} /><Flowers t={t} c={[5.5, 0, 3]} area={[3, 2]} n={60} amp={0} />
  <group position={[0, 0, -12]}><Cottage t={t} /></group>
  {Array.from({ length: 22 }, (_, i) => { const x = -11 + i * 1.0; return <group key={i} position={[x, 0, 7]}><Box p={[0, 0.55, 0]} s={[0.18, 1.1, 0.08]} color="#ffffff" line={2} /></group>; })}
  <Box p={[0, 0.8, 7]} s={[22, 0.1, 0.06]} color="#ffffff" line={1} />
  <WindTree p={[-9, 0, -4]} t={t} s={1.5} seed={3} /><WindTree p={[10, 0, -6]} t={t} s={1.7} seed={5} kind="pine" />
  <Bush p={[-6, 0, -1]} t={t} flowers="#ff6aa8" /><Bush p={[6.5, 0, -1.5]} t={t} seed={3} flowers="#ffd23a" />
  {/* watering can + shovel */}
  <group position={[2.2, 0, 1.6]} rotation={[0, -0.6, 0]}><Cyl p={[0, 0.3, 0]} rt={0.28} h={0.6} color="#3a8fe0" line={2} /><Cyl p={[0.45, 0.45, 0]} rt={0.04} h={0.6} color="#3a8fe0" line={1} rot={[0, 0, -1.0]} /><mesh position={[0, 0.65, 0]} rotation={[0, 0, Math.PI / 2]}><torusGeometry args={[0.2, 0.03, 6, 16, Math.PI]} /><Toon color="#3a8fe0" /></mesh></group>
  <group position={[-2.4, 0, 1.4]} rotation={[0, 0, 0.3]}><Cyl p={[0, 0.7, 0]} rt={0.04} h={1.2} color="#8a5a32" line={1} /><Box p={[0, 0.08, 0]} s={[0.3, 0.35, 0.04]} color="#a8b0c8" line={2} /></group>
</>);
void Extrude; void Ball;
