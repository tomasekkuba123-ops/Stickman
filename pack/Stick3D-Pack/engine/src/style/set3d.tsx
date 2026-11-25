// 3D props + sets for the EP03 remake (and later episodes): rig-v2 Stickman billboard, rocket, rope ladder, volumetric smoke,
// bedroom, sky/space layers, Moon gas station, robot, coins, giant space whale, whale interior, satellites.
import React, { useMemo } from "react";
import * as THREE from "three";
import { Box, Cyl, Ball, CanvasPlane, Billboard, Shadow, Surface, INK } from "./toon";
import { V3, lerp, clamp } from "./kit";
import { Extrude, Globe } from "./extra";
import { SGlow } from "./sky";
import { drawStickman, Rig, RigOut } from "./stickman";
import { drawPencil, sketchRocket, rnd } from "./props2d";
import { QC, maskify } from "../kit/qc";
import { PuffSmoke, PuffRing, CloudPuff } from "../kit/puff";
import { GiantWhale } from "../kit/creatures";
import { paintHero } from "../kit/character";
import { SetDressing } from "../kit/dressing";

const TAU = Math.PI * 2;
const ramp = (() => { const d = new Uint8Array([110, 185, 255]); const t = new THREE.DataTexture(d, 3, 1, THREE.RedFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
const texCache = new Map<string, THREE.CanvasTexture>();
export let TEX_K = 2; export const setTexK = (k: number) => { TEX_K = k; };
export function canvasTex(key: string, w: number, h: number, draw: (c: CanvasRenderingContext2D, W: number, H: number) => void, repeat?: [number, number]) {
  const hit = texCache.get(key); if (hit) return hit; const cv = document.createElement("canvas"); const k = TEX_K && Math.max(w, h) <= 1024 ? TEX_K : 1; cv.width = w * k; cv.height = h * k; const g2 = cv.getContext("2d")!; g2.scale(k, k); draw(g2, w, h); // v18: textures drawn at 2x (HD, 4K supersampled final)
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); } texCache.set(key, t); return t;
}

/* ---------------- Stickman rig v2 as a yaw-only billboard (rim light + contact shadow + extra 2D overlay) ---------------- */
export type Extra2D = (c: CanvasRenderingContext2D, out: RigOut, W: number, H: number) => void;
export const HeroV2: React.FC<{ p: V3; h?: number; rig: Rig; rim?: string; extra?: Extra2D; shadow?: boolean; sy?: number }> = ({ p, h = 3, rig, rim = "255,220,170", extra, shadow = true, sy }) => (
  <>{shadow ? <Shadow p={[p[0], sy ?? p[1], p[2]]} r={h * 0.3} o={0.5} /> : null}
    <Billboard p={p} h={h} res={640} aspect={1.5} draw={(c, W, H) => {
      const out = rim ? paintHero(c, W, H, rig, rim, "20,10,40", 0.45) : drawStickman(c, W, H, rig);
      if (extra) extra(c, out, W, H);
      if (QC) maskify(c, out.head, out.headR, W, H);
    }} /></>
);
// world offset (relative to feet) of the glove midpoint for a rig drawn at height h (yaw-facing plane: x is camera-right)
let probe: HTMLCanvasElement | null = null;
export function gloveOffset(rig: Rig, h: number, which: "both" | "R" | "L" = "both"): [number, number] {
  if (!probe) { probe = document.createElement("canvas"); probe.width = 320; probe.height = 480; }
  const W = 320, H = 480, o = drawStickman(probe.getContext("2d")!, W, H, rig); const g = which === "R" ? o.gloveR : which === "L" ? o.gloveL : [(o.gloveR[0] + o.gloveL[0]) / 2, (o.gloveR[1] + o.gloveL[1]) / 2];
  return [((g[0] - W / 2) / H) * h, ((H * 0.985 - g[1]) / H) * h];
}
// 2D pencil in the right glove. ang: tilt of the body (0 = body straight up, tip down); tipUp flips it
export const pencil2D = (ang = 0.4, len = 0.13, gleam = 0, tipUp = false, which: "R" | "L" = "R"): Extra2D => (c, out, W, H) => { const g = which === "R" ? out.gloveR : out.gloveL, a = ang + (tipUp ? Math.PI : 0), L = H * len, bx = Math.sin(a), by = -Math.cos(a); void W; drawPencil(c, g[0] - bx * L * 0.42, g[1] - by * L * 0.42, L, a, gleam); };

/* ---------------- volumetric-looking smoke: soft shaded puffs, sizes vary, dissipate, lit by the flame ---------------- */
// v13: both are thin wrappers around the cloud-puff particle (kit/puff.tsx) — no more circle smoke anywhere.
export const Smoke: React.FC<{ src: V3; t: number; t0: number; t1?: number; rate?: number; vel?: V3; spread?: number; size?: number; life?: number; lit?: number; color?: string; seed?: number; max?: number }> = (props) => <PuffSmoke {...props} color={props.color ?? "#eeeaf6"} />;
// burst of puffs at time t0 (dust ring / impact)
export const PuffBurst: React.FC<{ c: V3; t: number; t0: number; n?: number; r?: number; size?: number; color?: string; up?: number; life?: number }> = (props) => <PuffRing {...props} />;
export const Sparks: React.FC<{ c: V3; t: number; t0: number; n?: number; v?: number; life?: number; color?: string }> = ({ c, t, t0, n = 14, v = 4, life = 0.7, color = "#ffe68a" }) => {
  const age = t - t0; if (age < 0 || age > life) return null; const u = age / life;
  return <>{Array.from({ length: n }, (_, i) => { const a = rnd(i) * TAU, b = (rnd(i + 4) - 0.3) * 1.4, s = v * (0.6 + rnd(i + 8) * 0.6); return <SGlow key={i} p={[c[0] + Math.cos(a) * s * age, c[1] + b * s * age - 4 * age * age, c[2] + Math.sin(a) * s * age]} r={0.12 * (1 - u) + 0.03} color={color} o={1 - u} />; })}</>;
};

/* ---------------- rocket: white body, red nose + fins, blue window; flame; fuel gauge; face in the window ---------------- */
export const Rocket3D: React.FC<{ p: V3; s?: number; rot?: V3; t: number; flame?: number; gauge?: number; face?: number; faceMood?: "scared" | "smile" | "wow" }> = ({ p, s = 1, rot = [0, 0, 0], t, flame = 0, gauge, face = 0, faceMood = "scared" }) => (
  <group position={p} scale={s} rotation={rot}>
    <Cyl p={[0, 1.0, 0]} rt={0.58} rb={0.62} h={2.0} color="#f4f6fb" line={4} />
    <Cyl p={[0, 2.45, 0]} rt={0.0} rb={0.58} h={0.9} color="#e8303a" line={4} />
    <Cyl p={[0, 0.15, 0]} rt={0.63} h={0.24} color="#e8303a" line={3} />
    <Cyl p={[0, -0.18, 0]} rt={0.42} rb={0.52} h={0.36} color="#6a7088" line={3} />
    {[0, 1, 2].map((i) => <group key={i} rotation={[0, (i / 3) * TAU + 0.5, 0]}><Extrude pts={[[0.5, 1.0], [1.15, 0.0], [1.2, -0.45], [0.5, 0.1]]} depth={0.1} color="#e8303a" line={4} /></group>)}
    <group position={[0, 1.35, 0.56]}><Cyl p={[0, 0, 0]} rt={0.34} h={0.12} color="#c8d0e4" line={3} rot={[Math.PI / 2, 0, 0]} /><Cyl p={[0, 0, 0.04]} rt={0.26} h={0.08} color="#4aa8ff" line={2} rot={[Math.PI / 2, 0, 0]} />
      {face > 0 ? <CanvasPlane p={[0, 0, 0.1]} s={[0.5, 0.5]} px={[160, 160]} draw={(c, W, H) => { c.clearRect(0, 0, W, H); c.save(); c.beginPath(); c.arc(W / 2, H / 2, W / 2 - 2, 0, TAU); c.clip(); c.fillStyle = "#4aa8ff"; c.fillRect(0, 0, W, H); c.translate(0, H * (1 - face) * 0.6);
        c.fillStyle = "#fff"; c.beginPath(); c.arc(W / 2, H * 0.62, W * 0.4, 0, TAU); c.fill(); c.lineWidth = 6; c.strokeStyle = INK; c.stroke(); c.fillStyle = INK; for (const ex of [-0.14, 0.14]) { c.beginPath(); c.ellipse(W * (0.5 + ex), H * 0.55, W * 0.06, W * (faceMood === "wow" ? 0.11 : 0.09), 0, 0, TAU); c.fill(); }
        c.beginPath(); if (faceMood === "smile") { c.arc(W / 2, H * 0.68, W * 0.12, 0.3, Math.PI - 0.3); c.stroke(); } else { c.ellipse(W / 2, H * 0.74, W * 0.06, W * 0.08, 0, 0, TAU); c.fill(); } c.restore(); }} /> : null}
      <SGlow p={[0.1, 0.1, 0.12]} r={0.18} color="#ffffff" o={0.6} /></group>
    {gauge !== undefined ? <CanvasPlane p={[0, 0.55, 0.64]} s={[0.55, 0.34]} px={[220, 136]} draw={(c, W, H) => { c.fillStyle = "#fffdf0"; c.beginPath(); c.roundRect(2, 2, W - 4, H - 4, 14); c.fill(); c.lineWidth = 6; c.strokeStyle = INK; c.stroke(); c.font = "900 30px Inter"; c.textAlign = "center"; c.fillStyle = "#e5263a"; c.fillText("E", 28, H - 20); c.fillStyle = "#1a9a4a"; c.fillText("F", W - 28, H - 20);
      c.beginPath(); c.arc(W / 2, H - 14, H * 0.72, Math.PI * 1.1, Math.PI * 1.9); c.lineWidth = 6; c.strokeStyle = "#8a92a8"; c.stroke(); const a = Math.PI * (1.12 + 0.76 * clamp(gauge)); c.beginPath(); c.moveTo(W / 2, H - 14); c.lineTo(W / 2 + Math.cos(a) * H * 0.66, H - 14 + Math.sin(a) * H * 0.66); c.lineWidth = 8; c.strokeStyle = "#e5263a"; c.stroke(); }} /> : null}
    {flame > 0.01 ? <group position={[0, -0.36, 0]}>
      <mesh position={[0, -0.9 * flame, 0]} rotation={[Math.PI, 0, 0]}><coneGeometry args={[0.42, 1.8 * flame * (0.9 + 0.15 * Math.sin(t * 40)), 20, 1, true]} /><meshBasicMaterial color="#ff7a20" transparent opacity={0.9} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} /></mesh>
      <mesh position={[0, -0.6 * flame, 0]} rotation={[Math.PI, 0, 0]}><coneGeometry args={[0.24, 1.2 * flame * (0.9 + 0.2 * Math.sin(t * 53)), 16, 1, true]} /><meshBasicMaterial color="#fff2a0" transparent opacity={0.95} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} /></mesh>
      <SGlow p={[0, -0.5, 0.2]} r={1.6 * flame} color="#ffb040" o={0.8} /></group> : null}
  </group>
);
// rope ladder hanging from `top`; returns rung world position fn. sway = swing angle (rad) in the x-y plane
export function ladderPts(top: V3, L: number, sway: number, k: number): V3 { return [top[0] + Math.sin(sway * k) * L * k, top[1] - Math.cos(sway * k) * L * k, top[2]]; }
export const RopeLadder: React.FC<{ top: V3; L: number; sway: number; n?: number; w?: number }> = ({ top, L, sway, n = 7, w = 0.55 }) => {
  const segs = 10; const pts = Array.from({ length: segs + 1 }, (_, i) => ladderPts(top, L, sway, i / segs));
  return (<>{[-1, 1].map((sd) => pts.slice(0, -1).map((a, i) => { const b = pts[i + 1], m: V3 = [(a[0] + b[0]) / 2 + sd * w / 2, (a[1] + b[1]) / 2, a[2]], len = Math.hypot(b[0] - a[0], b[1] - a[1]); return <group key={sd + "_" + i} position={m} rotation={[0, 0, Math.atan2(b[0] - a[0], -(b[1] - a[1])) * -1]}><Cyl p={[0, 0, 0]} rt={0.035} h={len * 1.04} color="#d6a35a" line={1} /></group>; }))}
    {Array.from({ length: n }, (_, i) => { const q = ladderPts(top, L, sway, (i + 0.7) / (n + 0.2)); return <Box key={i} p={q} s={[w + 0.12, 0.08, 0.1]} color="#b8743a" line={2} rot={[0, 0, sway * 0.6]} />; })}</>);
};

/* ---------------- sky + space ---------------- */
export const GradientDome: React.FC<{ stops: [number, string][]; r?: number; stars?: number; t?: number }> = ({ stops, r = 150, stars = 0 }) => { // r must stay < camera far (200)
  const key = "dome|" + stops.map((s) => s.join(":")).join("|") + "|" + stars.toFixed(2);
  const tex = canvasTex(key, 2048, 1024, (c, W, H) => { const g = c.createLinearGradient(0, 0, 0, H); for (const [k, col] of stops) g.addColorStop(k, col); c.fillStyle = g; c.fillRect(0, 0, W, H);
    if (stars > 0) for (let i = 0; i < 2000; i++) { c.globalAlpha = stars * (0.35 + rnd(i) * 0.65); c.fillStyle = rnd(i + 3) > 0.85 ? "#ffd6f0" : "#ffffff"; c.beginPath(); c.arc(rnd(i * 3) * W, rnd(i * 7) * H * 0.8, 0.7 + rnd(i + 9) * 1.2, 0, TAU); c.fill(); } c.globalAlpha = 1; });
  return <mesh><sphereGeometry args={[r, 48, 32]} /><meshBasicMaterial map={tex} side={THREE.BackSide} depthWrite={false} fog={false} /></mesh>;
};
const mixC = (a: string, b: string, k: number) => "#" + new THREE.Color(a).lerp(new THREE.Color(b), clamp(k)).getHexString();
// sky by altitude 0 (day) .. 1 (dark blue) .. 2 (black space); quantised so textures are cached
export const AltDome: React.FC<{ alt: number }> = ({ alt }) => {
  const q = Math.round(alt * 12) / 12, A = ["#2f7ff0", "#8ccaff", "#e6f6ff"], B = ["#06124a", "#183c9a", "#4a78d8"], C = ["#010108", "#05051a", "#0c0a2c"];
  const col = (i: number) => q <= 1 ? mixC(A[i], B[i], q) : mixC(B[i], C[i], q - 1);
  return <GradientDome r={150} stops={[[0, col(0)], [0.55, col(1)], [1, col(2)]]} stars={clamp(q - 1.1) * 1.1} />;
};
// fluffy 3D cloud (soft white puffs, slightly lit underneath)
export const Cloud3D: React.FC<{ p: V3; s?: number; seed?: number; tint?: string; o?: number }> = ({ p, s = 1, seed = 1, tint = "#ffffff", o = 1 }) => {
  const shade = "#" + new THREE.Color(tint).lerp(new THREE.Color("#9a9ad8"), 0.4).getHexString();
  return (<group position={p} scale={s}>{Array.from({ length: 5 }, (_, i) => { const a = rnd(i + seed) * TAU, d = i ? 0.9 + rnd(i * 3 + seed) * 0.8 : 0;
    return <CloudPuff key={i} p={[Math.cos(a) * d * 1.5, rnd(i * 5 + seed) * 0.5 - (i ? 0.2 : 0), Math.sin(a) * d * 0.6]} r={i ? 0.9 + rnd(i * 7 + seed) * 0.5 : 1.4} u={o < 1 ? (1 - o) * 0.9 + 0.45 : 0} seed={seed * 9 + i} look={{ color: tint, shadow: shade, rim: "#7a78a8" }} />; })}</group>);
};
export const Earth: React.FC<{ p: V3; r: number; rotY?: number; glow?: number }> = ({ p, r, rotY = 0, glow = 0.35 }) => (<><Globe p={p} r={r} rotY={rotY} tilt={0.2} /><SGlow p={[p[0], p[1], p[2] + r * 0.2]} r={r * 1.6} color="#7ac8ff" o={glow} /></>);

/* ---------------- bedroom at sunset ---------------- */
export const PAPER: V3 = [-0.6, 1.53, -2.85]; // centre of the drawing paper on the desk
export const Bedroom: React.FC<{ t: number; windowOpen?: number; shake?: number; night?: boolean; noBed?: boolean }> = ({ t, windowOpen = 0, shake = 0, night = false, noBed = false }) => {
  const j = (k: number) => Math.sin(t * 40 + k) * 0.02 * shake;
  return (<>
    <ambientLight intensity={night ? 0.55 : 1.0} /><directionalLight position={[4, 6, 6]} intensity={night ? 0.45 : 1.1} color={night ? "#8a9aff" : "#ffd6a0"} /><directionalLight position={[-6, 3, 2]} intensity={0.45} color="#a0b0ff" />
    {night ? <pointLight position={[0.6, 2.4, -2.6]} intensity={2.2} distance={9} color="#ffd890" /> : null}
    <Surface p={[0, 0, -1]} s={[18, 14]} rot={[-Math.PI / 2, 0, 0]} kind="plank" a="#c8844a" b="#b8743a" unit={1.6} />
    <Surface p={[0, 4, -6]} s={[18, 8]} kind="plain" a="#f0a870" b="#e89860" unit={2} />
    <Surface p={[-6.5, 4, -1]} s={[12, 8]} rot={[0, Math.PI / 2, 0]} kind="plain" a="#e89060" b="#e08858" unit={2} />
    <CanvasPlane p={[0, 6.5, -5.95]} s={[18, 3]} px={[900, 150]} draw={(c, W, H) => { c.clearRect(0, 0, W, H); c.fillStyle = "rgba(255,255,255,0.2)"; for (let i = 0; i < 40; i++) { const x = rnd(i) * W, y = rnd(i + 3) * H; c.beginPath(); for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + k * TAU / 5, b = a + TAU / 10; c.lineTo(x + Math.cos(a) * 9, y + Math.sin(a) * 9); c.lineTo(x + Math.cos(b) * 4, y + Math.sin(b) * 4); } c.fill(); } }} />
    {/* v13 set dressing: wallpaper, skirting boards, wall socket + cables */}
    <CanvasPlane p={[0, 4, -5.97]} s={[18, 8]} px={[900, 400]} draw={(c, W, H) => { c.fillStyle = "#f2b07a"; c.fillRect(0, 0, W, H); for (let x = 0; x < W; x += 50) { c.fillStyle = "rgba(255,255,255,0.13)"; c.fillRect(x, 0, 22, H); } c.fillStyle = "rgba(200,90,60,0.25)"; for (let y = 25; y < H; y += 60) for (let x = 36; x < W; x += 50) { c.beginPath(); c.arc(x + ((y / 60) % 2) * 25, y, 5, 0, TAU); c.fill(); } }} />
    <CanvasPlane p={[-6.47, 4, -1]} rot={[0, Math.PI / 2, 0]} s={[12, 8]} px={[600, 400]} draw={(c, W, H) => { c.fillStyle = "#eca472"; c.fillRect(0, 0, W, H); for (let x = 0; x < W; x += 50) { c.fillStyle = "rgba(255,255,255,0.12)"; c.fillRect(x, 0, 22, H); } }} />
    <Box p={[0, 0.16, -5.92]} s={[18, 0.32, 0.12]} color="#fff6e8" line={2} /><Box p={[-6.42, 0.16, -1]} s={[0.12, 0.32, 12]} color="#fff6e8" line={2} />
    <Box p={[1.7, 0.55, -5.93]} s={[0.36, 0.36, 0.05]} color="#ffffff" line={2} />{[-0.07, 0.07].map((x) => <Box key={x} p={[1.7 + x, 0.55, -5.9]} s={[0.04, 0.1, 0.02]} color="#2b2f40" line={1} />)}
    <mesh><tubeGeometry args={[new THREE.CatmullRomCurve3([new THREE.Vector3(0.9, 1.5, -3.25), new THREE.Vector3(0.95, 0.8, -3.4), new THREE.Vector3(1.1, 0.04, -3.9), new THREE.Vector3(1.6, 0.04, -5.6), new THREE.Vector3(1.7, 0.5, -5.88)]), 40, 0.035, 6, false]} /><meshToonMaterial color="#2b2f40" gradientMap={ramp} /></mesh>
    <mesh><tubeGeometry args={[new THREE.CatmullRomCurve3([new THREE.Vector3(-1.9, 1.5, -3.3), new THREE.Vector3(-2.2, 0.6, -3.6), new THREE.Vector3(-2.6, 0.04, -4.4), new THREE.Vector3(-0.6, 0.04, -5.7), new THREE.Vector3(1.66, 0.5, -5.88)]), 40, 0.03, 6, false]} /><meshToonMaterial color="#e8e8f0" gradientMap={ramp} /></mesh>
    {/* window with sunset city; open sash */}
    <Box p={[2.4, 4.3, -5.9]} s={[5.4, 4.4, 0.2]} color="#f6efe4" line={4} />
    <CanvasPlane p={[2.4, 4.3, -5.78]} s={[5.0, 4.0]} px={[600, 480]} draw={(c, W, H) => { const g = c.createLinearGradient(0, 0, 0, H); if (night) { g.addColorStop(0, "#050a2a"); g.addColorStop(1, "#22307a"); } else { g.addColorStop(0, "#5a3a9a"); g.addColorStop(0.5, "#ff8a5a"); g.addColorStop(1, "#ffd08a"); } c.fillStyle = g; c.fillRect(0, 0, W, H); c.fillStyle = "#fff0b0"; c.beginPath(); c.arc(W * (night ? 0.7 : 0.35), H * (night ? 0.22 : 0.68), night ? 40 : 60, 0, TAU); c.fill(); if (night) { c.fillStyle = "#fff"; for (let i = 0; i < 40; i++) c.fillRect(rnd(i * 3) * W, rnd(i * 5) * H * 0.6, 2, 2); }
      for (let i = 0; i < 12; i++) { const bw = 60 + rnd(i) * 50, bh = 120 + rnd(i + 2) * 200, bx = i * 52 - 20; c.fillStyle = "#3a2a6a"; c.fillRect(bx, H - bh, bw, bh); c.fillStyle = "#ffd66a"; for (let yy = H - bh + 14; yy < H - 10; yy += 26) for (let xx = bx + 8; xx < bx + bw - 12; xx += 18) if (rnd(xx * 3 + yy) > 0.5) c.fillRect(xx, yy, 8, 12); } }} />
    <Box p={[2.4, 4.3, -5.75]} s={[0.14, 4.0, 0.08]} color="#f6efe4" line={2} /><Box p={[2.4, 4.3, -5.75]} s={[5.0, 0.14, 0.08]} color="#f6efe4" line={2} />
    <Box p={[2.4, 2.0, -5.5]} s={[5.8, 0.18, 0.7]} color="#f6efe4" line={3} />
    {/* curtains */}
    {[-0.4, 5.2].map((x, i) => <CanvasPlane key={i} p={[x, 4.4, -5.6]} s={[1.0, 5.0]} px={[100, 500]} draw={(c, W, H) => { c.fillStyle = "#3a6fd8"; c.fillRect(0, 0, W, H); for (let k = 0; k < 4; k++) { c.fillStyle = k % 2 ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.12)"; c.fillRect(k * 25, 0, 25, H); } c.fillStyle = "#ffd23a"; for (let y = 30; y < H; y += 70) for (let x2 = 15; x2 < W; x2 += 45) { c.beginPath(); c.arc(x2 + (y % 140 ? 20 : 0), y, 6, 0, TAU); c.fill(); } c.lineWidth = 6; c.strokeStyle = INK; c.strokeRect(3, 3, W - 6, H - 6); }} />)}
    {/* desk + chair + lamp + crayons + books */}
    <group position={[j(1), j(2), 0]}>
      <Box p={[-0.6, 1.4, -2.6]} s={[3.2, 0.16, 1.6]} color="#c08850" /><Box p={[-2.05, 0.66, -2.6]} s={[0.16, 1.32, 1.4]} color="#9a6a3a" /><Box p={[0.85, 0.66, -2.6]} s={[0.16, 1.32, 1.4]} color="#9a6a3a" /><Box p={[0.3, 1.0, -2.6]} s={[1.0, 0.6, 1.3]} color="#b07840" />
      <Box p={[0.3, 1.0, -1.93]} s={[0.6, 0.06, 0.04]} color="#ffd66a" line={2} />
      <Cyl p={[0.9, 1.52, -3.1]} rt={0.25} h={0.06} color="#2b3350" line={2} /><Cyl p={[0.9, 2.0, -3.1]} rt={0.03} h={1.0} color="#e5483f" line={2} rot={[0, 0, -0.3]} /><Cyl p={[0.68, 2.55, -3.1]} rt={0.12} rb={0.35} h={0.4} color="#e5483f" line={3} rot={[0, 0, 0.6]} />
      <SGlow p={[0.5, 2.3, -2.9]} r={1.6} color="#ffd890" o={0.5} />
      {[0, 1, 2, 3].map((i) => <Box key={i} p={[-1.8 + i * 0.16, 1.62 + Math.max(0, Math.sin(t * 20 + i)) * 0.15 * shake, -3.1]} s={[0.1, 0.06, 0.5]} color={["#e5483f", "#3a6fd8", "#2fb87a", "#f0b429"][i]} line={1} rot={[0, 0.3 + i * 0.2, 0]} />)}
      {[0, 1, 2].map((i) => <Box key={i} p={[0.55, 1.55 + i * 0.13, -2.2]} s={[0.7, 0.12, 0.5]} color={["#3a6fd8", "#e5483f", "#2fb87a"][i]} line={2} />)}
      <Box p={[0.2, 1.58, -2.3]} s={[0.35, 0.16, 0.22]} color="#ff9fb8" line={2} />
    </group>
    <group position={[2.6, 0, -1.4]} rotation={[0, -0.6, 0]}><Box p={[0, 0.9, 0]} s={[1.0, 0.12, 1.0]} color="#3a6fd8" /><Box p={[0, 1.5, 0.45]} s={[1.0, 1.1, 0.12]} color="#3a6fd8" />{[[-0.4, -0.4], [0.4, -0.4], [-0.4, 0.4], [0.4, 0.4]].map(([x, z], i) => <Cyl key={i} p={[x, 0.45, z]} rt={0.05} h={0.9} color="#2b3350" line={1} />)}</group>
    {/* shelves, posters, bed, rug, plant, toy rocket */}
    <Box p={[-6.3, 5.2, -2]} s={[0.4, 0.12, 2.4]} color="#9a6a3a" /><Box p={[-6.3, 4.0, -2]} s={[0.4, 0.12, 2.4]} color="#9a6a3a" />
    {Array.from({ length: 9 }, (_, i) => <Box key={i} p={[-6.2, 4.38 + (i % 2) * 1.2, -3 + (i % 5) * 0.45]} s={[0.3, 0.6 + rnd(i) * 0.3, 0.16]} color={["#e5483f", "#3a6fd8", "#f0b429", "#2fb87a", "#7a54d6"][i % 5]} line={2} />)}
    <Ball p={[-6.2, 5.55, -1.0]} r={0.28} color="#3a8fe0" /><Cyl p={[-6.2, 4.3, -1.0]} rt={0.12} h={0.5} color="#e8303a" line={2} />
    <CanvasPlane p={[-2.6, 4.8, -5.94]} s={[1.6, 2.1]} px={[160, 210]} frame="#2b3350" draw={(c, W, H) => { c.fillStyle = "#1a1f50"; c.fillRect(0, 0, W, H); for (let i = 0; i < 30; i++) { c.fillStyle = "#fff"; c.fillRect(rnd(i) * W, rnd(i + 5) * H, 2, 2); } c.beginPath(); c.arc(W / 2, H * 0.62, 34, 0, TAU); c.fillStyle = "#ff8a3a"; c.fill(); c.font = "900 28px Inter"; c.fillStyle = "#ffd23a"; c.textAlign = "center"; c.fillText("SPACE", W / 2, 40); }} />
    <CanvasPlane p={[-6.42, 3.0, 1.2]} rot={[0, Math.PI / 2, 0]} s={[1.6, 1.2]} px={[160, 120]} frame="#2b3350" draw={(c, W, H) => { c.fillStyle = "#fff6d0"; c.fillRect(0, 0, W, H); c.strokeStyle = "#3a3a52"; c.lineWidth = 4; c.beginPath(); c.moveTo(W / 2, 20); c.lineTo(W / 2 + 22, 70); c.lineTo(W / 2 - 22, 70); c.closePath(); c.stroke(); c.beginPath(); c.arc(W / 2, 50, 7, 0, TAU); c.stroke(); }} />
    {noBed ? null : <group position={[4.8, 0, -3.5]}><Box p={[0, 0.5, 0]} s={[3.0, 0.6, 4.0]} color="#7a54d6" /><Box p={[0, 0.9, 0]} s={[2.8, 0.3, 3.8]} color="#f4f6fb" /><Box p={[0, 1.15, -1.4]} s={[1.6, 0.3, 0.7]} color="#ffd23a" /><Box p={[0, 1.3, -1.95]} s={[3.0, 1.6, 0.2]} color="#5a3aa8" /></group>}
    <CanvasPlane p={[0.5, 0.02, 0.6]} rot={[-Math.PI / 2, 0, 0]} s={[5, 3.2]} px={[500, 320]} draw={(c, W, H) => { c.fillStyle = "#2fb87a"; c.fillRect(0, 0, W, H); c.strokeStyle = "#ffd23a"; c.lineWidth = 18; c.strokeRect(24, 24, W - 48, H - 48); c.strokeStyle = INK; c.lineWidth = 6; c.strokeRect(3, 3, W - 6, H - 6); c.fillStyle = "#ffd23a"; for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(80 + i * 70, H / 2, 14, 0, TAU); c.fill(); } }} />
    <group position={[-5.4, 0, 1.6]}><Cyl p={[0, 0.4, 0]} rt={0.45} rb={0.35} h={0.8} color="#e07a4a" />{[0, 1, 2, 3, 4].map((i) => <Ball key={i} p={[Math.cos(i * 1.3) * 0.3, 1.2 + (i % 2) * 0.3, Math.sin(i * 1.3) * 0.3]} r={0.38} color={i % 2 ? "#3fbf5a" : "#2fa04a"} />)}</group>
    <Cyl p={[3.4, 0.5, 1.6]} rt={0.0} rb={0.3} h={1.0} color="#ff8a3a" line={2} />
    {/* warm light rays through the window */}
    {[0, 1, 2].map((i) => <mesh key={i} position={[2.2 - i * 0.9, 2.6, -2.6]} rotation={[0.55, 0.25, 0.12 * i]}><planeGeometry args={[1.0, 7.5]} /><meshBasicMaterial color="#ffd890" transparent opacity={0.13} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} /></mesh>)}
    {Array.from({ length: 16 }, (_, i) => <SGlow key={i} p={[rnd(i) * 5 - 1, 1 + ((rnd(i + 3) * 4 + t * 0.15) % 4), -4 + rnd(i + 7) * 3]} r={0.05} color="#fff0c0" o={0.8} />)}
  </>);
};
// the drawing paper on the desk (flat). parts 0..1; count = big countdown number; shakeK jitter; glowK
export const DrawingPaper: React.FC<{ t: number; parts: { body: number; fin1: number; fin2: number; win: number }; shakeK?: number; count?: string; countK?: number; torn?: number; glowK?: number }> = ({ t, parts, shakeK = 0, count, countK = 0, torn = 0, glowK = 0 }) => (
  torn >= 1 ? null : <group position={[PAPER[0] + Math.sin(t * 50) * 0.03 * shakeK, PAPER[1] + Math.abs(Math.sin(t * 37)) * 0.04 * shakeK, PAPER[2]]} rotation={[-Math.PI / 2, 0, 0.08 + Math.sin(t * 31) * 0.04 * shakeK]}>
    <CanvasPlane p={[0, 0, 0]} s={[1.5, 1.1]} px={[600, 440]} draw={(c, W, H) => { c.fillStyle = "#fffdf4"; c.fillRect(0, 0, W, H); c.strokeStyle = "rgba(90,140,220,0.3)"; c.lineWidth = 2; for (let y = 40; y < H; y += 32) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); } c.lineWidth = 6; c.strokeStyle = INK; c.strokeRect(2, 2, W - 4, H - 4);
      c.save(); c.translate(W / 2, H / 2); c.rotate(-Math.PI / 2); sketchRocket(c, 0, 0, 360, parts); c.restore();
      if (count && countK > 0) { c.save(); c.translate(W / 2, H / 2); const s = 0.5 + 0.5 * Math.min(1, countK * 1.6); c.scale(s, s); c.font = "900 300px Inter"; c.textAlign = "center"; c.textBaseline = "middle"; c.lineWidth = 26; c.strokeStyle = INK; c.strokeText(count, 0, 10); c.fillStyle = "#ff4a44"; c.fillText(count, 0, 10); c.restore(); } }} />
    {glowK > 0 ? <SGlow p={[0, 0, 0.2]} r={1.6 + glowK} color="#fff0b0" o={glowK} /> : null}
  </group>
);
// 3D pencil (lying / held), tip at p pointing along dir
export const Pencil3D: React.FC<{ p: V3; rot?: V3; s?: number }> = ({ p, rot = [0, 0, 0], s = 1 }) => (
  <group position={p} rotation={rot} scale={s}><Cyl p={[0, 0.5, 0]} rt={0.05} h={0.7} color="#ffd23a" line={2} /><Cyl p={[0, 0.07, 0]} rt={0.05} rb={0.0} h={0.14} color="#f2c38a" line={2} /><Cyl p={[0, 0.9, 0]} rt={0.055} h={0.1} color="#c0c8dc" line={1} /><Cyl p={[0, 0.98, 0]} rt={0.05} h={0.08} color="#ff8fb0" line={1} /></group>
);

/* ---------------- Moon surface + MOON GAS station ---------------- */
export const PAD: V3 = [-4.5, 0, -1.5], KIOSK: V3 = [-9.5, 0, -7.5], PUMP: V3 = [-1.4, 0, -5.6], CRATER: V3 = [9, 0, -16];
export const MoonSet: React.FC<{ t: number; reveal?: number; earthRot?: number; neon?: number; craterDust?: number }> = ({ t, reveal = 1, neon = 1 }) => {
  const groundTex = canvasTex("moonground", 1024, 1024, (c, W, H) => { c.fillStyle = "#b9b4c8"; c.fillRect(0, 0, W, H); for (let i = 0; i < 2500; i++) { c.fillStyle = `rgba(${90 + rnd(i) * 80},${90 + rnd(i) * 70},${120 + rnd(i) * 60},0.25)`; c.fillRect(rnd(i * 3) * W, rnd(i * 7) * H, 2 + rnd(i) * 5, 2 + rnd(i + 1) * 5); }
    for (let i = 0; i < 70; i++) { const x = rnd(i * 11) * W, y = rnd(i * 13) * H, r = 6 + rnd(i * 17) * 40; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fillStyle = "rgba(120,112,150,0.6)"; c.fill(); c.lineWidth = 4; c.strokeStyle = "rgba(230,228,240,0.7)"; c.beginPath(); c.arc(x - 2, y - 2, r, Math.PI * 1.05, Math.PI * 1.9); c.stroke(); } }, [6, 6]);
  const k = (i: number) => clamp(reveal * 5 - i);
  return (<>
    <ambientLight intensity={0.85} /><directionalLight position={[-6, 8, 6]} intensity={1.25} color="#f0f0ff" /><directionalLight position={[6, 3, -4]} intensity={0.5} color="#ff7ad8" />
    <GradientDome stops={[[0, "#05041a"], [0.5, "#120a3a"], [1, "#2a1a5a"]]} stars={1} />
    <Earth p={[-22, 22, -70]} r={9} rotY={t * 0.05} />
    {/* v13: curved Moon horizon (flat within 25 units, then curving away), distant mountains, dressed with rocks / footprints / small craters */}
    <MoonGround tex={groundTex} />
    {Array.from({ length: 14 }, (_, i) => { const a = -Math.PI * 0.95 + (i / 13) * Math.PI * 0.9, d = 85 + rnd(i * 3) * 25, h = 18 + rnd(i * 5) * 22; const x = Math.cos(a) * d, z = Math.sin(a) * d - 10; return <mesh key={"m" + i} position={[x, moonY(x, z) + h * 0.3, z]}><coneGeometry args={[h * 0.9, h, 6]} /><meshToonMaterial color={i % 2 ? "#8a84a8" : "#9a94b8"} gradientMap={ramp} /></mesh>; })}
    <SetDressing kind="moon" anchor={PAD} keep={6} bounds={[-24, 24, -30, 10]} n={34} seed={7} t={t} ground={moonY} />
    {Array.from({ length: 9 }, (_, i) => <mesh key={"fp" + i} rotation={[-Math.PI / 2, 0, -0.5]} position={[PAD[0] + 2.4 + i * 0.55, 0.02, PAD[2] + 1.5 - i * 0.35 + (i % 2 ? 0.2 : -0.2)]}><circleGeometry args={[0.12, 12]} /><meshBasicMaterial color="#6a6488" transparent opacity={0.85} /></mesh>)}
    {[[-12, -8, 2.4], [12, 4, 1.6], [-8, 8, 1.2], [3, -24, 3.0], [-20, -26, 2.0]].map(([x, z, r], i) => <group key={i} position={[x, 0, z]}><mesh rotation={[-Math.PI / 2, 0, 0]}><torusGeometry args={[r, r * 0.18, 10, 32]} /><meshToonMaterial color="#c8c4d8" gradientMap={ramp} /></mesh><mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}><circleGeometry args={[r, 32]} /><meshBasicMaterial color="#8a84a8" /></mesh></group>)}
    {Array.from({ length: 22 }, (_, i) => <Ball key={i} p={[(rnd(i) - 0.5) * 40, 0.2, -rnd(i + 4) * 30 + 6]} r={0.2 + rnd(i + 2) * 0.5} color="#a8a2c0" s={[1.3, 0.7, 1]} ink={0.04} />)}
    {/* big crater where the whale sleeps */}
    <group position={CRATER}><mesh rotation={[-Math.PI / 2, 0, 0]}><torusGeometry args={[11, 2.0, 12, 48]} /><meshToonMaterial color="#c4c0d6" gradientMap={ramp} /></mesh><mesh rotation={[-Math.PI / 2, 0, 2.2]} position={[0, 1.3, 0]}><torusGeometry args={[11, 0.35, 6, 48, Math.PI * 0.9]} /><meshBasicMaterial color="#f4f2ff" /></mesh><mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}><circleGeometry args={[11, 48]} /><meshBasicMaterial color="#4a4268" /></mesh></group>
    {/* landing pad */}
    <group position={PAD}><Cyl p={[0, 0.12, 0]} rt={3.0} h={0.24} color="#6a6f88" line={3} /><CanvasPlane p={[0, 0.25, 0]} rot={[-Math.PI / 2, 0, 0]} s={[5.6, 5.6]} px={[400, 400]} draw={(c, W, H) => { c.clearRect(0, 0, W, H); c.beginPath(); c.arc(W / 2, H / 2, W / 2 - 20, 0, TAU); c.lineWidth = 16; c.strokeStyle = "#ffd23a"; c.stroke(); c.font = "900 220px Inter"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillStyle = "#ffd23a"; c.fillText("H", W / 2, H / 2 + 10); }} />
      {[0, 1, 2, 3, 4, 5].map((i) => { const a = i * TAU / 6; const on = Math.sin(t * 4 + i) > 0; return <React.Fragment key={i}><Ball p={[Math.cos(a) * 2.9, 0.32, Math.sin(a) * 2.9]} r={0.12} color={on ? "#5aff8a" : "#2a6a3a"} ink={0.03} />{on ? <SGlow p={[Math.cos(a) * 2.9, 0.4, Math.sin(a) * 2.9]} r={0.5} color="#5aff8a" o={0.6} /> : null}</React.Fragment>; })}</group>
    {/* station: canopy over pumps, kiosk, neon sign, appears with reveal (drawn into being) */}
    <group position={PUMP} scale={k(0)}><Box p={[0, 0.9, 0]} s={[0.8, 1.8, 0.6]} color="#e5303a" /><Box p={[0, 1.5, 0.31]} s={[0.55, 0.4, 0.02]} color="#0d2a1a" line={2} /><CanvasPlane p={[0, 1.5, 0.33]} s={[0.5, 0.34]} px={[120, 80]} draw={(c, W, H) => { c.fillStyle = "#0d2a1a"; c.fillRect(0, 0, W, H); c.font = "900 40px Courier New"; c.fillStyle = "#5aff8a"; c.textAlign = "center"; c.fillText("FUEL", W / 2, H / 2 + 14); }} /><Cyl p={[0.45, 1.0, 0]} rt={0.06} h={0.6} color="#2b2f40" line={1} /></group>
    <group position={[PUMP[0] + 1.6, 0, PUMP[2]]} scale={k(0.5)}><Box p={[0, 0.9, 0]} s={[0.8, 1.8, 0.6]} color="#3a6fd8" /><Box p={[0, 1.5, 0.31]} s={[0.55, 0.4, 0.02]} color="#0d2a1a" line={2} /></group>
    <group position={[PUMP[0] + 0.8, 0, PUMP[2]]} scale={k(1)}><Box p={[0, 3.2, 0]} s={[4.6, 0.3, 2.6]} color="#f4f6fb" /><Box p={[0, 3.0, 0]} s={[4.7, 0.12, 2.7]} color="#ff4ac8" line={2} />{[[-2, -1], [2, -1], [-2, 1], [2, 1]].map(([x, z], i) => <Cyl key={i} p={[x, 1.5, z]} rt={0.1} h={3.0} color="#c0c8dc" line={2} />)}<SGlow p={[0, 2.8, 0]} r={2.4} color="#fff0f8" o={0.35} /></group>
    <group position={KIOSK} scale={k(2)}><Box p={[0, 1.4, 0]} s={[3.2, 2.8, 2.4]} color="#f4f6fb" /><Box p={[0, 2.95, 0]} s={[3.6, 0.3, 2.8]} color="#3a3f56" /><Box p={[-0.7, 1.6, 1.21]} s={[1.3, 1.0, 0.04]} color="#ffd890" line={2} /><Box p={[0.9, 1.0, 1.21]} s={[0.8, 2.0, 0.04]} color="#5a6a8a" line={2} /><SGlow p={[-0.7, 1.6, 1.4]} r={1.0} color="#ffd890" o={0.5} /></group>
    <group position={[KIOSK[0] - 0.5, 3.4, KIOSK[2] + 0.3]} scale={k(3)}>
      <Box p={[0, 1.0, 0]} s={[4.6, 1.6, 0.25]} color="#1a1040" line={4} />
      <CanvasPlane p={[0, 1.0, 0.14]} s={[4.4, 1.4]} px={[880, 280]} draw={(c, W, H) => { c.fillStyle = "#1a1040"; c.fillRect(0, 0, W, H); const fl = neon * (Math.sin(t * 13) > -0.85 ? 1 : 0.3); c.font = "900 150px Inter"; c.textAlign = "center"; c.textBaseline = "middle"; c.save(); c.shadowColor = "#ff4ac8"; c.shadowBlur = 40 * fl; c.lineWidth = 10; c.strokeStyle = `rgba(255,120,220,${fl})`; c.strokeText("MOON GAS", W / 2, H / 2 + 6); c.fillStyle = `rgba(255,220,250,${fl})`; c.fillText("MOON GAS", W / 2, H / 2 + 6); c.restore(); }} />
      <SGlow p={[0, 1.0, 0.5]} r={3.4} color="#ff5ad0" o={0.55 * neon} />
      <Cyl p={[-1.6, -0.6, 0]} rt={0.08} h={2.0} color="#c0c8dc" line={2} /><Cyl p={[1.6, -0.6, 0]} rt={0.08} h={2.0} color="#c0c8dc" line={2} />
    </group>
  </>);
};

/* ---------------- robot (3D body, expressive screen face) ---------------- */
export type BotFace = "happy" | "neutral" | "angry" | "shock" | "blink";
export const Robot3D: React.FC<{ p: V3; t: number; face?: BotFace; rotY?: number; wheel?: number; armL?: number; armR?: number; steam?: number; s?: number }> = ({ p, t, face = "happy", rotY = 0, wheel = 0, armL = 0, armR = 0, steam = 0, s = 1 }) => (
  <group position={p} rotation={[0, rotY, 0]} scale={s}>
    {[-0.45, 0.45].map((x) => <group key={x} position={[x, 0.28, 0]} rotation={[wheel, 0, 0]}><Cyl p={[0, 0, 0]} rt={0.28} h={0.18} color="#2b2f40" line={3} rot={[0, 0, Math.PI / 2]} /><Box p={[0, 0.16, 0]} s={[0.2, 0.06, 0.06]} color="#c0c8dc" line={1} /></group>)}
    <Box p={[0, 0.95, 0]} s={[1.0, 0.9, 0.8]} color="#f4f6fb" /><Box p={[0, 0.95, 0.41]} s={[0.5, 0.25, 0.02]} color="#2fd4c8" line={2} /><Box p={[0, 0.9, 0.42]} s={[0.36, 0.04, 0.02]} color={INK} line={1} />
    {[-1, 1].map((sd) => <group key={sd} position={[sd * 0.56, 1.15, 0]} rotation={[0, 0, sd * (sd < 0 ? armL : armR) - sd * 0.3]}><Cyl p={[sd * 0.15, -0.3, 0]} rt={0.06} h={0.6} color="#8a92a8" line={1} rot={[0, 0, sd * 0.3]} /><Ball p={[sd * 0.25, -0.62, 0]} r={0.12} color="#ffd23a" ink={0.03} /></group>)}
    <Cyl p={[0, 1.5, 0]} rt={0.08} h={0.2} color="#8a92a8" line={1} />
    <Box p={[0, 2.0, 0]} s={[1.3, 0.85, 0.7]} color="#e4eaf6" />
    <CanvasPlane p={[0, 2.0, 0.36]} s={[1.05, 0.65]} px={[300, 186]} draw={(c, W, H) => { const ang = face === "angry"; c.fillStyle = ang ? "#3a0a12" : "#0d2a3a"; c.beginPath(); c.roundRect(0, 0, W, H, 26); c.fill(); const col = ang ? "#ff4a5a" : "#5ff4ff"; c.strokeStyle = col; c.fillStyle = col; c.lineWidth = 14; c.lineCap = "round"; c.save(); c.shadowColor = col; c.shadowBlur = 20;
      if (face === "happy") { for (const ex of [W * 0.32, W * 0.68]) { c.beginPath(); c.arc(ex, H * 0.42, 22, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); } c.beginPath(); c.arc(W / 2, H * 0.5, 44, 0.3, Math.PI - 0.3); c.stroke(); }
      else if (face === "angry") { for (const [ex, d] of [[W * 0.32, 1], [W * 0.68, -1]] as [number, number][]) { c.beginPath(); c.moveTo(ex - 26, H * 0.28 - d * 8); c.lineTo(ex + 26, H * 0.28 + d * 8); c.stroke(); c.beginPath(); c.arc(ex, H * 0.45, 12, 0, TAU); c.fill(); } c.beginPath(); c.arc(W / 2, H * 0.92, 38, Math.PI * 1.15, Math.PI * 1.85); c.stroke(); }
      else if (face === "shock") { for (const ex of [W * 0.32, W * 0.68]) { c.beginPath(); c.arc(ex, H * 0.4, 22, 0, TAU); c.stroke(); } c.beginPath(); c.ellipse(W / 2, H * 0.75, 18, 24, 0, 0, TAU); c.stroke(); }
      else { for (const ex of [W * 0.32, W * 0.68]) { c.beginPath(); if (face === "blink") { c.moveTo(ex - 20, H * 0.42); c.lineTo(ex + 20, H * 0.42); c.stroke(); } else { c.arc(ex, H * 0.42, 14, 0, TAU); c.fill(); } } c.beginPath(); c.moveTo(W * 0.4, H * 0.75); c.lineTo(W * 0.6, H * 0.75); c.stroke(); }
      c.restore(); }} />
    <Cyl p={[0, 2.6, 0]} rt={0.03} h={0.4} color={INK} line={1} /><Ball p={[0, 2.85, 0]} r={0.1} color={Math.sin(t * 8) > 0 ? "#ff4a5a" : "#ffd23a"} ink={0.03} />
    {steam > 0 ? [0, 1, 2].map((i) => { const u = (steam + i * 0.3) % 1; return <CloudPuff key={i} p={[(i - 1) * 0.35, 2.7 + u * 1.4, 0]} r={0.22 + u * 0.2} u={u} seed={i + 40} look={{ color: "#ffffff", shadow: "#c8c8e0" }} />; }) : null}
  </group>
);
export const Receipt3D: React.FC<{ p: V3; len: number; rot?: V3; w?: number }> = ({ p, len, rot, w = 0.32 }) => (len <= 0.02 ? null :
  <CanvasPlane p={[p[0], p[1] - len / 2, p[2]]} rot={rot} s={[w, len]} px={[128, Math.max(16, Math.round(128 * len / w))]} draw={(c, W, H) => { c.fillStyle = "#fffdf4"; c.fillRect(0, 0, W, H); c.fillStyle = "#8a8fa8"; for (let y = 20; y < H - 90; y += 22) { c.fillRect(10, y, W * 0.5, 6); c.fillRect(W - 40, y, 30, 6); } if (H > 140) { c.fillStyle = "#101018"; c.font = "900 18px Inter"; c.textAlign = "center"; c.fillText("TOTAL", W / 2, H - 60); c.fillStyle = "#e5263a"; c.font = "900 17px Inter"; c.fillText("$30,000,000", W / 2, H - 26); } c.lineWidth = 4; c.strokeStyle = INK; c.strokeRect(1, 1, W - 2, H - 2); }} />);
// gold coin (spins around its vertical axis when rolling: roll = rotation about local x)
export const Coin3D: React.FC<{ p: V3; r: number; rot?: V3 }> = ({ p, r, rot = [0, 0, 0] }) => {
  const face = canvasTex("coinface", 256, 256, (c, W, H) => { const g = c.createRadialGradient(W * 0.4, H * 0.35, 10, W / 2, H / 2, W / 2); g.addColorStop(0, "#fff0a0"); g.addColorStop(1, "#e0a020"); c.fillStyle = g; c.beginPath(); c.arc(W / 2, H / 2, W / 2, 0, TAU); c.fill(); c.lineWidth = 10; c.strokeStyle = "#b8780e"; c.beginPath(); c.arc(W / 2, H / 2, W * 0.4, 0, TAU); c.stroke(); c.font = "900 150px Inter"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillStyle = "#b8780e"; c.fillText("$", W / 2, H / 2 + 8); });
  return (<group position={p} rotation={rot}>
    <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[r, r, r * 0.22, 40]} /><meshToonMaterial color="#e8b028" gradientMap={ramp} /></mesh>
    <mesh rotation={[Math.PI / 2, 0, 0]} scale={1.04}><cylinderGeometry args={[r, r, r * 0.22, 40]} /><meshBasicMaterial color={INK} side={THREE.BackSide} /></mesh>
    {[1, -1].map((sd) => <mesh key={sd} position={[0, 0, sd * r * 0.115]} rotation={[0, sd > 0 ? 0 : Math.PI, 0]}><circleGeometry args={[r * 0.98, 40]} /><meshToonMaterial map={face} gradientMap={ramp} /></mesh>)}
  </group>);
};

/* ---------------- giant space whale (faces +z) ---------------- */
// v13: the space whale is the proper creature model (kit/creatures.tsx GiantWhale: hinged jaw, teeth, tongue, throat, grooves, fins, flukes)
export const Whale3D: React.FC<{ p: V3; s?: number; t: number; mouth?: number; eyes?: number; blink?: number; rotY?: number; tilt?: number; bulge?: number }> = ({ p, s = 1, t, mouth = 0, eyes = 1, blink = 0, rotY = 0, tilt = 0, bulge = -1 }) => (
  <GiantWhale p={p} s={s} t={t} jaw={mouth} eyes={eyes} blink={blink} rotY={rotY} tilt={tilt} bulge={bulge} />
);

/* ---------------- inside the whale: rib tunnel, glowing dots, turquoise pool, lost satellites ---------------- */
export const Satellite3D: React.FC<{ p: V3; rot?: V3; s?: number }> = ({ p, rot = [0, 0, 0], s = 1 }) => (
  <group position={p} rotation={rot} scale={s}><Box p={[0, 0, 0]} s={[0.8, 0.8, 0.8]} color="#d8b04a" /><Box p={[-1.3, 0, 0]} s={[1.6, 0.06, 0.7]} color="#2a4aa8" line={3} /><Box p={[1.3, 0, 0]} s={[1.6, 0.06, 0.7]} color="#2a4aa8" line={3} /><Cyl p={[0, 0.6, 0]} rt={0.4} rb={0.05} h={0.4} color="#f4f6fb" line={2} /><Cyl p={[0, 0.95, 0]} rt={0.02} h={0.4} color={INK} line={1} /></group>
);
export const WhaleBelly: React.FC<{ t: number }> = ({ t }) => {
  const wall = canvasTex("bellywall", 512, 512, (c, W, H) => { c.fillStyle = "#a83a7a"; c.fillRect(0, 0, W, H); for (let i = 0; i < 40; i++) { c.fillStyle = `rgba(255,${120 + rnd(i) * 80},${190 + rnd(i) * 60},0.25)`; c.beginPath(); c.ellipse(rnd(i * 3) * W, rnd(i * 7) * H, 30 + rnd(i) * 60, 14 + rnd(i + 1) * 30, rnd(i) * 3, 0, TAU); c.fill(); } }, [4, 2]);
  return (<>
    <ambientLight intensity={0.8} /><pointLight position={[0, 4, 2]} intensity={1.2} distance={30} color="#ffb0d8" /><pointLight position={[2, 0.5, -4]} intensity={1.4} distance={20} color="#40ffe0" />
    <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 3, -10]}><cylinderGeometry args={[9, 9, 40, 40, 1, true]} /><meshToonMaterial map={wall} gradientMap={ramp} side={THREE.BackSide} /></mesh>
    {Array.from({ length: 9 }, (_, i) => <mesh key={i} position={[0, 3, 6 - i * 4]}><torusGeometry args={[8.4, 0.5, 12, 40, Math.PI * 1.15]} /><meshToonMaterial color="#ffd0e8" gradientMap={ramp} /></mesh>)}
    {Array.from({ length: 9 }, (_, i) => <mesh key={"o" + i} position={[0, 3, 6 - i * 4]} scale={1.01}><torusGeometry args={[8.4, 0.56, 10, 40, Math.PI * 1.15]} /><meshBasicMaterial color={INK} side={THREE.BackSide} /></mesh>)}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, -8]}><planeGeometry args={[30, 40]} /><meshToonMaterial color="#8a2a6a" gradientMap={ramp} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[2.5, 0.01, -5]}><circleGeometry args={[4.2, 40]} /><meshBasicMaterial color="#20d8c8" transparent opacity={0.85} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[2.5, 0.015, -5]}><ringGeometry args={[4.2, 4.5, 40]} /><meshBasicMaterial color={INK} /></mesh>
    <SGlow p={[2.5, 0.4, -5]} r={5} color="#40ffe0" o={0.45} />
    {Array.from({ length: 34 }, (_, i) => { const a = rnd(i) * Math.PI * 1.1 + Math.PI * 0.95, z = 4 - rnd(i + 3) * 30; return <SGlow key={i} p={[Math.cos(a) * 8, 3 + Math.sin(a) * 8 + 0.3, z]} r={0.25 + rnd(i + 5) * 0.3} color={rnd(i + 8) > 0.5 ? "#7affff" : "#ffd06a"} o={0.5 + 0.4 * Math.sin(t * 2.5 + i)} />; })}
    <Satellite3D p={[-3.5, 4.5 + Math.sin(t) * 0.3, -6]} rot={[0.4, t * 0.2, 0.3]} s={1.1} />
    <Satellite3D p={[4.5, 5.5 + Math.sin(t * 0.8) * 0.3, -12]} rot={[-0.3, t * 0.15, -0.5]} s={1.3} />
    <Satellite3D p={[-1.5, 6.5 + Math.sin(t * 1.2) * 0.2, -18]} rot={[0.2, -t * 0.25, 0.6]} s={1.0} />
    <Satellite3D p={[-4.5, 0.6, -2.5]} rot={[0.1, 0.8, 1.2]} s={0.8} />
    {Array.from({ length: 14 }, (_, i) => { const u = (t * 0.06 + rnd(i)) % 1; return <SGlow key={"m" + i} p={[(rnd(i * 3) - 0.5) * 10, 0.3 + u * 7, -2 - rnd(i * 5) * 12]} r={0.06} color="#ffe6ff" o={Math.sin(u * Math.PI)} />; })}
  </>);
};
void Ball; void lerp;

/* curved Moon ground: flat inside 25 units of the origin, then falls away like a small planet (visible curved horizon) */
export const moonY = (x: number, z: number) => { const r = Math.hypot(x, z + 10); return r < 25 ? 0 : -((r - 25) ** 2) / 240; };
const MoonGround: React.FC<{ tex: THREE.Texture }> = ({ tex }) => {
  const geo = React.useMemo(() => { const g = new THREE.PlaneGeometry(260, 260, 140, 140); g.rotateX(-Math.PI / 2); const pos = g.attributes.position as THREE.BufferAttribute; for (let i = 0; i < pos.count; i++) pos.setY(i, moonY(pos.getX(i), pos.getZ(i) - 10)); g.computeVertexNormals(); return g; }, []);
  return <mesh geometry={geo} position={[0, 0, -10]}><meshToonMaterial map={tex} gradientMap={ramp} /></mesh>;
};
