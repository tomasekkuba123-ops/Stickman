// WYR (Would You Rather) option scenes: one frame = one option image, rendered in the series' toon 3D style
// (meshToon + ink outlines + rim light). Two layers per option so the compositor (wyr/render.py) can parallax them:
//   layer "bg" = dark studio (dome, floor glow, floating bokeh/props)   layer "fg" = plinth + hero object (transparent background)
// Render: npx remotion render WyrScene <outdir> --sequence --image-format=png --props='{"items":[...]}'  (see wyr/scenes3d.py)
import React, { useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { Box, Cyl, Ball, CanvasPlane, INK } from "../style/toon";
import { GradientDome, Coin3D } from "../style/set3d";
import { Glow } from "../style/props";
import { Cam } from "../style/extra";

type V3 = [number, number, number];
export type WyrItem = { name: string; side: "A" | "B"; layer: "bg" | "fg" | "tile"; ban?: boolean; dark?: boolean };
const TAU = Math.PI * 2;
const ramp = (() => { const d = new Uint8Array([95, 175, 255]); const t = new THREE.DataTexture(d, 3, 1, THREE.RedFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// ---------- small toon helpers (outline = inflated back-face shell, like Ball) ----------
const Lathe: React.FC<{ pts: [number, number][]; color: string; p?: V3; s?: V3; ink?: number; seg?: number }> = ({ pts, color, p = [0, 0, 0], s = [1, 1, 1], ink = 0.045, seg = 48 }) => {
  const geo = useMemo(() => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg), [pts, seg]);
  const out = useMemo(() => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x + ink, y)), seg), [pts, seg, ink]);
  return <group position={p} scale={s}><mesh geometry={geo}><meshToonMaterial color={color} gradientMap={ramp} side={THREE.DoubleSide} /></mesh><mesh geometry={out}><meshBasicMaterial color={INK} side={THREE.BackSide} /></mesh></group>;
};
const Torus: React.FC<{ p?: V3; rot?: V3; R: number; r: number; color: string; ink?: number; glow?: boolean }> = ({ p = [0, 0, 0], rot = [0, 0, 0], R, r, color, ink = 0.04, glow }) => (
  <group position={p} rotation={rot}>
    <mesh><torusGeometry args={[R, r, 24, 96]} />{glow ? <meshBasicMaterial color={color} toneMapped={false} /> : <meshToonMaterial color={color} gradientMap={ramp} />}</mesh>
    {glow ? null : <mesh><torusGeometry args={[R, r + ink, 24, 96]} /><meshBasicMaterial color={INK} side={THREE.BackSide} /></mesh>}
  </group>
);
const Txt = (txt: string, col: string, font = 900, size = 0.8) => (c: CanvasRenderingContext2D, W: number, H: number) => {
  c.clearRect(0, 0, W, H); c.font = `${font} ${Math.round(H * size)}px Inter, Arial`; c.textAlign = "center"; c.textBaseline = "middle";
  c.lineWidth = H * 0.06; c.strokeStyle = INK; c.lineJoin = "round"; c.strokeText(txt, W / 2, H * 0.53); c.fillStyle = col; c.fillText(txt, W / 2, H * 0.53);
};

// ---------- hero objects (stand on y=0 = plinth top) ----------
const Phone: React.FC = () => (<group rotation={[0.02, -0.32, 0.07]} position={[0, 1.45, 0]}>
  <Box p={[0, 0, 0]} s={[1.42, 2.8, 0.18]} color="#262838" line={5} />
  <CanvasPlane p={[0, 0, 0.095]} s={[1.26, 2.6]} px={[252, 520]} draw={(c, W, H) => {
    const g = c.createLinearGradient(0, 0, W, H); g.addColorStop(0, "#4b6cff"); g.addColorStop(1, "#b44bff"); c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.fillStyle = "#fff"; c.font = "800 54px Inter"; c.textAlign = "center"; c.fillText("9:41", W / 2, 92);
    const cols = ["#ff5a5f", "#ffd23f", "#36d399", "#3abff8", "#ffffff", "#ff9f1c", "#a3e635", "#f472b6"];
    cols.forEach((col, i) => { const x = 30 + (i % 4) * 52, y = 170 + Math.floor(i / 4) * 62; c.fillStyle = col; c.beginPath(); c.roundRect(x, y, 40, 40, 11); c.fill(); });
    c.fillStyle = "rgba(255,255,255,.85)"; c.beginPath(); c.roundRect(90, 488, 72, 8, 4); c.fill(); }} />
  <Box p={[0, 1.27, 0.1]} s={[0.36, 0.08, 0.02]} color="#111" line={0} />
</group>);

const Burger: React.FC = () => (<group position={[0, 0, 0]} rotation={[0.18, 0.4, 0]} scale={1.4}>
  <Cyl p={[0, 0.2, 0]} rt={1.05} rb={0.95} h={0.4} color="#d9893b" line={4} />
  <Cyl p={[0, 0.56, 0]} rt={1.14} h={0.36} color="#6b3518" line={4} />
  <Box p={[0, 0.78, 0]} s={[1.75, 0.07, 1.75]} rot={[0, Math.PI / 4, 0]} color="#ffc21a" line={3} />
  <Cyl p={[0, 0.88, 0]} rt={1.08} h={0.12} color="#e2412d" line={3} />
  <Cyl p={[0, 0.99, 0]} rt={1.2} h={0.1} color="#62c24c" line={3} />
  <Ball p={[0, 1.08, 0]} r={1.12} s={[1, 0.62, 1]} color="#e8963f" ink={0.05} />
  {Array.from({ length: 14 }, (_, i) => { const a = rnd(i) * TAU, rr = 0.2 + rnd(i + 9) * 0.75; return <Ball key={i} p={[Math.cos(a) * rr, 1.08 + Math.sqrt(Math.max(0, 1 - (rr / 1.12) ** 2)) * 0.69, Math.sin(a) * rr]} r={0.05} s={[1.6, 0.7, 1]} color="#fff6e0" ink={0.015} />; })}
</group>);

const MoneyBag: React.FC = () => (<group>
  <Lathe color="#c79a5b" pts={[[0, 0], [0.9, 0.05], [1.3, 0.55], [1.32, 1.2], [1.05, 1.75], [0.45, 2.05], [0.32, 2.15], [0.6, 2.55], [0.7, 2.7], [0.02, 2.62]]} />
  <Torus p={[0, 2.13, 0]} rot={[Math.PI / 2, 0, 0]} R={0.36} r={0.08} color="#7a4a20" />
  <CanvasPlane p={[0, 1.08, 1.33]} s={[1.3, 1.3]} px={[256, 256]} draw={Txt("$", "#2fbf5a", 900, 0.95)} />
  {[[-1.5, 0.16, 0.6, 0.3], [1.45, 0.16, 0.7, -0.4], [1.0, 0.16, 1.35, 1.1], [-0.9, 0.16, 1.3, 2.2]].map(([x, y, z, r], i) => <Coin3D key={i} p={[x, y, z]} r={0.36} rot={[Math.PI / 2 - 0.15, 0, r]} />)}
  {[0, 1, 2, 3, 4].map((k) => <Coin3D key={"s" + k} p={[-1.75, 0.09 + k * 0.17, -0.3]} r={0.34} rot={[Math.PI / 2, 0, k]} />)}
</group>);

const MoneyMonth: React.FC = () => (<group rotation={[0, -0.25, 0]}>
  <Box p={[0, 1.45, 0]} s={[2.3, 2.6, 0.3]} color="#f4f1ea" line={5} />
  <Box p={[0, 2.5, 0.02]} s={[2.32, 0.6, 0.34]} color="#22a052" line={5} />
  {[-0.6, 0.6].map((x) => <Cyl key={x} p={[x, 2.85, 0]} rt={0.08} h={0.45} color="#b8bcc8" line={3} />)}
  <CanvasPlane p={[0, 2.5, 0.2]} s={[2.0, 0.42]} px={[400, 84]} draw={Txt("EVERY MONTH", "#ffffff", 900, 0.62)} />
  <CanvasPlane p={[0, 1.2, 0.16]} s={[2.1, 1.9]} px={[420, 380]} draw={(c, W, H) => { c.clearRect(0, 0, W, H); c.fillStyle = "#d9dde5"; for (let r = 0; r < 4; r++) for (let k = 0; k < 6; k++) { c.beginPath(); c.roundRect(10 + k * 68, 12 + r * 90, 56, 74, 9); c.fill(); } Txt("$", "#22a052", 900, 0.78)(c as any, W, H); }} />
  {[0, 1, 2, 3].map((k) => <Box key={k} p={[1.55 + (k % 2) * 0.06, 0.09 + k * 0.17, 0.9]} s={[1.3, 0.15, 0.7]} rot={[0, 0.5 + k * 0.08, 0]} color="#7ccf7a" line={3} />)}
  <Box p={[1.58, 0.42, 0.9]} s={[0.22, 0.7, 0.74]} rot={[0, 0.62, 0]} color="#f2efe2" line={2} />
  {[[-1.15, 0.16, 0.9, 0.3], [-0.6, 0.16, 1.25, 1.4]].map(([x, y, z, r], i) => <Coin3D key={i} p={[x, y, z]} r={0.34} rot={[Math.PI / 2 - 0.15, 0, r]} />)}
</group>);

const MindRead: React.FC = () => (<group>
  <Ball p={[0, 0.55, 0]} r={1.25} s={[1.25, 0.55, 0.9]} color="#3a3f5a" />
  <Cyl p={[0, 1.05, 0]} rt={0.38} h={0.6} color="#f2d0ac" line={3} />
  <Ball p={[0, 2.25, 0]} r={1.05} s={[0.95, 1.08, 1]} color="#f6d9b8" />
  <CanvasPlane p={[0, 2.18, 1.0]} s={[1.3, 0.9]} px={[260, 180]} draw={(c, W, H) => { c.clearRect(0, 0, W, H); c.strokeStyle = INK; c.lineWidth = 11; c.lineCap = "round";
    for (const x of [70, 190]) { c.beginPath(); c.arc(x, 70, 30, 0.15 * Math.PI, 0.85 * Math.PI); c.stroke(); } c.beginPath(); c.moveTo(105, 140); c.quadraticCurveTo(130, 150, 155, 140); c.stroke();
    c.fillStyle = "rgba(255,120,120,.35)"; for (const x of [40, 220]) { c.beginPath(); c.ellipse(x, 110, 26, 16, 0, 0, TAU); c.fill(); } }} />
  {[1.45, 1.85, 2.25].map((R, i) => <Torus key={i} p={[0, 2.3, 0]} rot={[Math.PI / 2 + 0.35, 0.15 * (i - 1), 0]} R={R} r={0.035} color={i % 2 ? "#7df9ff" : "#ffe066"} glow />)}
  {[0, 1, 2].map((i) => <Glow key={i} p={[0, 2.3, 0]} r={1.6 + i * 0.6} color={i % 2 ? "rgba(125,249,255,.55)" : "rgba(255,224,102,.5)"} o={0.35} />)}
  <CanvasPlane p={[1.35, 3.55, 0.3]} s={[0.9, 0.9]} face px={[180, 180]} draw={Txt("?!", "#ff4d6d", 900, 0.7)} />
</group>);

const CrystalBall: React.FC = () => {
  const tex = useMemo(() => { const c = document.createElement("canvas"); c.width = c.height = 512; const g = c.getContext("2d")!;
    const rg = g.createRadialGradient(200, 190, 20, 256, 256, 256); rg.addColorStop(0, "#f2d9ff"); rg.addColorStop(0.35, "#b26bff"); rg.addColorStop(0.8, "#4a1aa8"); rg.addColorStop(1, "#22094f"); g.fillStyle = rg; g.fillRect(0, 0, 512, 512);
    g.globalCompositeOperation = "lighter"; for (let i = 0; i < 5; i++) { g.strokeStyle = `rgba(255,200,255,${0.18 + i * 0.05})`; g.lineWidth = 14 - i * 2; g.beginPath(); g.arc(256 + i * 9, 270, 70 + i * 26, 0.2 + i, 2.6 + i); g.stroke(); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }, []);
  return (<group>
    <Cyl p={[0, 0.18, 0]} rt={1.05} rb={1.25} h={0.36} color="#8a5a2b" line={4} />
    <Cyl p={[0, 0.62, 0]} rt={0.6} rb={0.95} h={0.55} color="#d9a441" line={4} />
    <mesh position={[0, 2.0, 0]}><sphereGeometry args={[1.25, 48, 32]} /><meshBasicMaterial map={tex} toneMapped={false} /></mesh>
    <mesh position={[0, 2.0, 0]}><sphereGeometry args={[1.31, 48, 32]} /><meshBasicMaterial color={INK} side={THREE.BackSide} /></mesh>
    <Glow p={[0, 2.0, 0.2]} r={2.6} color="rgba(190,120,255,.9)" o={0.55} />
    <CanvasPlane p={[-0.42, 2.45, 1.26]} s={[0.7, 0.45]} px={[140, 90]} additive draw={(c, W, H) => { c.clearRect(0, 0, W, H); c.fillStyle = "rgba(255,255,255,.75)"; c.beginPath(); c.ellipse(W / 2, H / 2, W * 0.42, H * 0.24, -0.5, 0, TAU); c.fill(); }} />
    {[[0.35, 2.2], [-0.3, 1.7], [0.55, 1.6]].map(([x, y], i) => <CanvasPlane key={i} p={[x, y, 1.3]} s={[0.45 - i * 0.1, 0.45 - i * 0.1]} additive px={[96, 96]} draw={(c, W, H) => { c.clearRect(0, 0, W, H); c.fillStyle = "#fff6c0"; c.beginPath(); for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4, r = k % 2 ? W * 0.12 : W * 0.48; c.lineTo(W / 2 + Math.sin(a) * r, H / 2 - Math.cos(a) * r); } c.fill(); }} />)}
  </group>);
};

const Hourglass: React.FC = () => (<group rotation={[0, 0.3, 0]}>
  <Cyl p={[0, 0.14, 0]} rt={1.15} h={0.28} color="#8d5524" line={4} />
  <Cyl p={[0, 3.26, 0]} rt={1.15} h={0.28} color="#8d5524" line={4} />
  {[0, 1, 2].map((k) => <Cyl key={k} p={[Math.cos(k * TAU / 3) * 0.95, 1.7, Math.sin(k * TAU / 3) * 0.95]} rt={0.08} h={2.9} color="#a8693a" line={3} />)}
  <Lathe color="#ffcc33" pts={[[0.02, 2.0], [0.6, 2.55], [0.78, 2.9], [0.02, 2.9]]} ink={0.0} />
  <Lathe color="#ffcc33" pts={[[0.02, 0.28], [0.8, 0.28], [0.55, 0.62], [0.02, 0.9]]} ink={0.0} />
  <Glow p={[0, 1.6, 1.0]} r={2.2} color="rgba(255,200,80,.8)" o={0.35} />
  <Cyl p={[0, 1.55, 0]} rt={0.03} h={1.1} color="#f2c14e" line={0} />
  <mesh position={[0, 0, 0]}><latheGeometry args={[[[0.02, 0.28], [0.9, 0.3], [0.85, 0.9], [0.25, 1.55], [0.85, 2.2], [0.9, 2.9], [0.02, 3.12]].map(([x, y]) => new THREE.Vector2(x, y)), 48]} /><meshBasicMaterial color="#d8f3ff" transparent opacity={0.42} side={THREE.DoubleSide} depthWrite={false} /></mesh>
  <mesh><latheGeometry args={[[[0.95, 0.3], [0.9, 0.9], [0.3, 1.55], [0.9, 2.2], [0.95, 2.9]].map(([x, y]) => new THREE.Vector2(x, y)), 48]} /><meshBasicMaterial color={INK} side={THREE.BackSide} transparent opacity={0.6} /></mesh>
</group>);

const Magnifier: React.FC = () => (<group position={[0.15, -0.05, 0]} rotation={[0, 0, 0.42]}>
  <Cyl p={[0.95, 0.75, 0]} rt={0.17} rb={0.2} h={1.7} rot={[0, 0, 0.6]} color="#6b3a1e" line={4} />
  <group position={[-0.15, 2.3, 0]}>
    <CanvasPlane p={[0, 0, -0.05]} s={[1.9, 1.9]} px={[380, 380]} draw={Txt("?", "#ff3b4e", 900, 0.9)} />
    <mesh><circleGeometry args={[1.08, 64]} /><meshBasicMaterial color="#bfe8ff" transparent opacity={0.28} depthWrite={false} /></mesh>
    <CanvasPlane p={[-0.4, 0.45, 0.03]} s={[0.8, 0.5]} px={[160, 100]} additive draw={(c, W, H) => { c.clearRect(0, 0, W, H); c.fillStyle = "rgba(255,255,255,.6)"; c.beginPath(); c.ellipse(W / 2, H / 2, W * 0.42, H * 0.2, -0.6, 0, TAU); c.fill(); }} />
    <Torus R={1.12} r={0.13} color="#c7ccd8" />
  </group>
</group>);

const Fallback: React.FC<{ label: string }> = ({ label }) => (<CanvasPlane p={[0, 1.6, 0]} s={[2.6, 2.6]} px={[384, 384]} draw={Txt(label, "#ffffff", 900, 0.8)} />);

const HERO: Record<string, React.FC> = { phone: Phone, food: Burger, money_bag: MoneyBag, money_month: MoneyMonth, mind_read: MindRead, crystal_ball: CrystalBall, hourglass: Hourglass, magnifier: Magnifier };
export const WYR_SCENES = Object.keys(HERO);
const HEIGHT: Record<string, number> = { phone: 2.9, food: 2.4, money_bag: 2.8, money_month: 3.0, mind_read: 3.8, crystal_ball: 3.3, hourglass: 3.4, magnifier: 3.6 };

// 3D ban sign in front of the object
const Ban: React.FC<{ y: number; R: number }> = ({ y, R }) => (<group position={[0, y, 1.6]}>
  <Torus R={R} r={0.13} color="#ff2d3d" ink={0.045} />
  <group rotation={[0, 0, -Math.PI / 4]}><Box p={[0, 0, 0]} s={[R * 2, 0.26, 0.26]} color="#ff2d3d" line={4} /></group>
</group>);

const SIDE = {
  A: { dome: [[0, "#070103"], [0.42, "#2a0509"], [0.55, "#5a0b16"], [0.7, "#1a0306"], [1, "#050102"]] as [number, string][], rim: "#ff5a4a", glow: "rgba(255,70,60,.9)", ring: "#ff6b5a", bokeh: "rgba(255,120,90,.9)" },
  B: { dome: [[0, "#01030a"], [0.42, "#04122e"], [0.55, "#0a2a66"], [0.7, "#03102a"], [1, "#010208"]] as [number, string][], rim: "#4aa8ff", glow: "rgba(60,140,255,.9)", ring: "#5ab4ff", bokeh: "rgba(110,180,255,.9)" },
};

// bright "tile" mode (WYR v4 look): hero only, no studio/plinth, bright even light, framed to fill a rounded option tile
const TileStage: React.FC<{ it: WyrItem }> = ({ it }) => {
  const H = HERO[it.name]; const h = HEIGHT[it.name] ?? 2.6; const ban = !!it.ban;
  const oc = h * 0.5, span = Math.max(h, ban ? 3.7 : 2.4) * 1.18, dist = span / 2 / Math.tan((17 * Math.PI) / 180);
  return (<>
    <ambientLight intensity={0.95} />
    <directionalLight position={[4, 7, 6]} intensity={1.15} color="#fffaf0" />
    <directionalLight position={[-5, 3, 4]} intensity={0.45} color="#ffffff" />
    <directionalLight position={[0, 4, -6]} intensity={0.8} color="#ffffff" />
    <Cam t={0} keys={[{ t: 0, pos: [0, oc + dist * 0.12, dist], look: [0, oc, 0], fov: 34 }]} />
    <group>{H ? <H /> : <Fallback label={it.side} />}{ban ? <Ban y={h * 0.5} R={Math.max(1.25, h * 0.56)} /> : null}</group>
  </>);
};

const Stage: React.FC<{ it: WyrItem }> = ({ it }) => {
  if (it.layer === "tile") return <TileStage it={it} />;
  const S = SIDE[it.side]; const H = HERO[it.name]; const h = HEIGHT[it.name] ?? 2.6;
  const dark = it.dark ? 0.8 : 1;
  const oc = 0.6 + h * 0.5, look = it.side === "A" ? oc + 0.8 : oc + 0.38;   // A: object low (header above); B: below the label, clear of the bottom UI
  return (<>
    <ambientLight intensity={0.42 * dark} />
    <directionalLight position={[4, 7, 6]} intensity={1.35 * dark} color="#fff1dc" />
    <directionalLight position={[-6, 4, -5]} intensity={2.2} color={S.rim} />
    <directionalLight position={[6, 2, -4]} intensity={1.4} color={S.rim} />
    <directionalLight position={[-4, 1, 6]} intensity={0.35 * dark} color="#9fb4ff" />
    <Cam t={0} keys={[{ t: 0, pos: [0, look + 0.8, 13.2], look: [0, look, 0], fov: 34 }]} />
    {it.layer === "bg" ? (<>
      <GradientDome stops={S.dome} r={60} />
      <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[30, 64]} /><meshBasicMaterial color={it.side === "A" ? "#14030a" : "#020818"} /></mesh>
      <Glow p={[0, 0.1, -0.5]} r={6} color={S.glow} o={0.55} />
      <Glow p={[0, h * 0.6 + 0.6, -3.5]} r={5.5} color={S.glow} o={0.5} />
      {Array.from({ length: 26 }, (_, i) => <Glow key={i} p={[(rnd(i) - 0.5) * 16, rnd(i + 7) * 7, -4 - rnd(i + 3) * 10]} r={0.12 + rnd(i + 11) * 0.35} color={S.bokeh} o={0.25 + rnd(i + 5) * 0.45} />)}
    </>) : (<>
      <group position={[0, 0, 0]}>
        <Cyl p={[0, 0.3, 0]} rt={1.75} rb={1.9} h={0.6} color="#1b1d2a" line={4} />
        <Torus p={[0, 0.6, 0]} rot={[Math.PI / 2, 0, 0]} R={1.74} r={0.035} color={S.ring} glow />
        <group position={[0, 0.6, 0]}>{H ? <H /> : <Fallback label={it.side} />}{it.ban ? <Ban y={h * 0.5} R={Math.max(1.25, h * 0.56)} /> : null}</group>
      </group>
    </>)}
  </>);
};

export const WyrScene: React.FC<{ items: WyrItem[] }> = ({ items }) => {
  const f = useCurrentFrame(); const it = items[Math.min(f, items.length - 1)];
  const { width, height } = { width: 1350, height: 1200 };
  return (<AbsoluteFill style={{ background: "transparent" }}>
    <ThreeCanvas width={width} height={height} flat gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true }} camera={{ fov: 34, position: [0, 2.3, 10.5], near: 0.1, far: 200 }}>
      <Stage it={it} />
    </ThreeCanvas></AbsoluteFill>);
};

// tiles: 1140x780 (rendered at --scale 1.5 by wyr/scenes3d.py)
export const WyrTile: React.FC<{ items: WyrItem[] }> = ({ items }) => {
  const f = useCurrentFrame(); const it = items[Math.min(f, items.length - 1)];
  return (<AbsoluteFill style={{ background: "transparent" }}>
    <ThreeCanvas width={1140} height={780} flat gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true }} camera={{ fov: 34, position: [0, 2, 10], near: 0.1, far: 200 }}>
      <Stage it={{ ...it, layer: "tile" }} />
    </ThreeCanvas></AbsoluteFill>);
};
