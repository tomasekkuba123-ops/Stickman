// SCENE KITS v17 (reusable): NightField (hook / dark night / ending), MoonShore (ocean + tides), SpaceDiorama (Earth in space).
// Each is a 5-7 layer diorama built from kit/diorama.tsx + Kenney/Poly Haven CC0 assets, with its own lights + rim colour (LookContext).
import React, { useMemo, useRef, useLayoutEffect } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { V3 } from "../style/kit";
import { canvasTex } from "../style/set3d";
import { SGlow } from "../style/sky";
import { Grass } from "./world";
import { usePHTex, KModel } from "./envlib";
import { SkyGrad, StarField, ShootingStar, BigMoon, CloudStrips, HillLayer, GroundHaze, FireflyTrails, Motes, Props, PropSpec, WoodSign, PaintedGround, Lights, mixC, rnd, noise1, toonRamp } from "./diorama";

const TAU = Math.PI * 2;
const cl = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const sm = (x: number) => { const u = cl(x); return u * u * (3 - 2 * u); };
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

/* =============================== NIGHT FIELD =============================== */
export const NF_MOON: V3 = [17, 27, -62];  // far: big glowing Moon up-right of the hero
const NF_PROPS: PropSpec[] = [
  ["tree_oak", -7.5, -9, 3.2], ["tree_detailed", -11, -15, 3.6], ["tree_fat", 8.5, -11, 3.0], ["tree_pineTallA_detailed", 12, -17, 3.4], ["tree_pineRoundA", -15, -20, 3.4], ["tree_default", 15, -24, 3.0], ["tree_oak", 4.5, -26, 3.4], ["tree_pineRoundC", -5, -28, 3.0],
  ["plant_bushLarge", -4.6, -4.2, 1.9], ["plant_bushDetailed", 5.2, -5.5, 1.8], ["plant_bush", -6.5, -2.2, 1.5], ["plant_bush", 6.8, -1.6, 1.4], ["plant_bushLarge", 9.5, -6.5, 2.0],
  ["rock_largeA", 3.6, -3.4, 1.4], ["rock_smallC", -3.0, -1.0, 1.3], ["stone_largeA", -8.5, -5.5, 1.6], ["rock_tallA", 10.5, -9, 1.4],
  ["mushroom_redGroup", -2.4, -2.6, 1.3], ["mushroom_red", 2.6, -1.2, 1.2], ["flower_purpleA", -1.6, -1.2, 1.3], ["flower_yellowA", 1.9, -2.2, 1.3], ["flower_redA", -4.2, -0.6, 1.2], ["flower_purpleA", 4.4, -0.4, 1.2],
  ["stump_round", -5.8, -6.6, 1.4], ["log", 6.2, -3.3, 1.3], ["grass_large", -3.2, -0.8, 1.4], ["grass_leafsLarge", 3.6, -1.2, 1.4], ["grass_large", 4.4, -2.6, 1.3],
];
const FENCE: PropSpec[] = Array.from({ length: 7 }, (_, i) => ["fence_simple", -13 + i * 1.95, -7.5 - i * 0.25, 1.6, 0.12] as PropSpec);
/* dark 0 = moonlit silver-blue, 1 = deep dark blue (no Moon). moon = vanish progress (0..1+), back = pop-back (loop). */
export const NightField: React.FC<{ t: number; dark?: number; vanish?: number; back?: number; fireflies?: number; stars?: number; moonP?: V3; fore?: V3[]; pitch?: number; glow?: [number, number, number, number]; ghost?: number; children?: React.ReactNode }> = ({ t, dark = 0, vanish = 0, back = 0, fireflies = 1, stars = 1, moonP = NF_MOON, fore = [], pitch = 0, glow, ghost = 0, children }) => {
  const d = cl(dark), pk = 1 - 0.8 * cl(pitch), lum = (1 - 0.45 * d) * (0.3 + 0.7 * pk); // pitch: extra darkness (pitch-black night, only the torch reveals the field)
  const look = { rim: d < 0.5 ? "190,215,255" : "140,165,255", shade: "4,6,30", rimK: lerp(0.6, 0.62, d), dim: 0.24 * d }; // dark: body drops, a soft blue rim keeps him readable
  return (<Lights amb={lerp(0.62, 0.16, d) * pk} keyL={[[NF_MOON[0], NF_MOON[1], NF_MOON[2] + 20], mixC("#d6e4ff", "#5a6ab8", d), lerp(1.25, 0.12, d) * pk]} fill={[[-12, 6, 10], "#3a4aa8", lerp(0.4, 0.22, d) * pk]} look={look} fog={[mixC(mixC("#22336e", "#070b26", d), "#010208", 1 - pk), 14, 90]}>
    <SkyGrad a={["#0f1a52", "#2a3d88", "#6b7fc4"]} b={["#02040f", "#050a26", "#0d1640"]} k={d} horizon="rgba(190,200,255,0.55)" hk={0.6 * (1 - d)} />
    <StarField t={t} n={240} bright={stars * (0.75 + 0.6 * d)} />
    <ShootingStar t={t} t0={0.35} from={[-40, 70, -110]} to={[-75, 48, -100]} />
    <ShootingStar t={t} t0={5.6} from={[30, 75, -110]} to={[-5, 58, -115]} />
    <ShootingStar t={t} t0={33.9} from={[-20, 80, -110]} to={[-55, 62, -105]} />
    {vanish < 1.6 || back > 0 || ghost > 0 ? <BigMoon p={moonP} r={4.4} t={t} vanish={ghost > 0 && back <= 0 ? 1 : vanish} back={back} ghost={ghost} /> : null}
    <CloudStrips t={t} n={5} y={30} z={-58} span={140} speed={1.1} o={1 - 0.5 * d} />
    {/* 3 far silhouette layers (3 tones) + village with warm lit windows */}
    <HillLayer p={[0, 6.5, -96]} s={[300, 70]} o={{ seed: 1, tone: mixC(mixC("#2d3f86", "#0c1236", d), "#02030c", 1 - pk), rim: "rgba(190,205,255,0.5)", top: 0.42, amp: 0.12, trees: 60 }} />
    <HillLayer p={[6, 3.4, -66]} s={[200, 46]} t={t} windows={18} o={{ seed: 5, tone: mixC(mixC("#1f2c66", "#090e2c", d), "#02030c", 1 - pk), rim: "rgba(170,190,255,0.5)", top: 0.45, amp: 0.1, trees: 44, village: true, roof: mixC("#2b2a66", "#0c0c2c", d) }} />
    <HillLayer p={[-4, 1.8, -40]} s={[130, 30]} o={{ seed: 9, tone: mixC(mixC("#152050", "#060a20", d), "#010208", 1 - pk), rim: "rgba(150,175,255,0.45)", top: 0.46, amp: 0.13, trees: 30 }} />
    <GroundHaze t={t} layers={[[-36, 1.2, 140], [-58, 2.2, 190], [-84, 3.6, 260]]} col={d > 0.5 ? "rgba(60,80,150,0.5)" : "rgba(150,170,235,0.5)"} o={0.55} />
    {/* mid ground: varied Kenney trees, bushes, rocks, flowers, mushrooms, fence, sign */}
    <PaintedGround a="#23524f" b="#2f6a5e" c2="#1b4044" z={-30} r={95} />
    <Props list={NF_PROPS} t={t} tint="#8fa0e0" lum={lum} glow={glow} />
    <Props list={FENCE} t={t} tint="#9aa4d8" sway={0} />
    <WoodSign p={[-6.2, 0, -3.2]} ry={0.5} s={1.3} t={t} text="→ MOON" />
    <Grass t={t} area={[24, 11]} c={[0, 0, -5.6]} n={1500} colors={["#2a6470", "#357a80", "#1f5560", "#45908c", "#2c5f7a"]} h={0.4} lum={lum} glow={glow} />
    <Grass t={t} area={[16, 3.2]} c={[0, 0, 1.5]} n={1400} colors={["#2a6470", "#357a80", "#1f5560", "#45908c"]} h={0.13} wd={0.4} lum={lum} glow={glow} /> {/* short lawn in front of the hero (never covers him) */}
    {fireflies > 0 ? <FireflyTrails t={t} n={22} c={[0, 1.5, -3]} area={[12, 2.2, 8]} o={fireflies} size={0.045} trail={7} /> : null}
    <Motes t={t} n={26} c={[0, 2, 0]} area={[8, 3, 5]} color="#cfdcff" o={0.35 * (1 - d)} />
    {/* bottom-edge foreground props (near the camera): rocks, mushrooms, flowers, grass tufts */}
    {fore.map((q, i) => <KModel key={"f" + i} name={(["rock_smallC", "mushroom_redGroup", "flower_purpleA", "stone_smallA", "mushroom_red", "flower_redA", "flower_yellowA", "rock_smallA"] as const)[i % 8]} p={q} s={0.9 + rnd(i) * 0.5} ry={rnd(i * 3) * 6} tint="#8fa0e0" t={t} sway={1} />)}
    {children}
  </Lights>);
};

/* =============================== MOON SHORE (ocean + tides) =============================== */
const waveTex = (a: string, b: string) => canvasTex("wave17|" + a + b, 512, 512, (c, W, H) => { c.fillStyle = a; c.fillRect(0, 0, W, H);
  for (let i = 0; i < 90; i++) { const y = rnd(i) * H, x = rnd(i * 3) * W, w = 30 + rnd(i * 5) * 110; c.strokeStyle = i % 4 ? b : "rgba(255,255,255,0.35)"; c.lineWidth = 2 + rnd(i * 7) * 3; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + w / 2, y - 5, x + w, y); c.stroke(); } }, [1, 1]);
const foamTex = () => canvasTex("foam17", 1024, 64, (c, W, H) => { for (let i = 0; i < 160; i++) { const x = rnd(i) * W, y = H * (0.5 + (rnd(i * 3) - 0.5) * 0.5), r = 6 + rnd(i * 5) * 16; c.fillStyle = `rgba(255,255,255,${0.5 + rnd(i * 7) * 0.5})`; c.beginPath(); c.ellipse(x, y, r * 2, r * 0.6, 0, 0, TAU); c.fill(); } }, [1, 1]);
const weedTex = () => canvasTex("weed17", 256, 128, (c, W, H) => { c.lineCap = "round"; for (let i = 0; i < 7; i++) { c.strokeStyle = i % 2 ? "#2f7a4a" : "#3f9a5a"; c.lineWidth = 7; c.beginPath(); c.moveTo(20 + i * 30, H - 10); c.bezierCurveTo(40 + i * 30, H * 0.4, i * 30, H * 0.5, 30 + i * 30 + rnd(i) * 30, 12); c.stroke(); } });
const Scroll: React.FC<{ tex: THREE.Texture; rep: [number, number]; off: [number, number]; children: (t: THREE.Texture) => React.ReactNode }> = ({ tex, rep, off, children }) => {
  const tx = useMemo(() => { const x = tex.clone(); x.wrapS = x.wrapT = THREE.RepeatWrapping; x.needsUpdate = true; return x; }, [tex]); tx.repeat.set(rep[0], rep[1]); tx.offset.set(off[0], off[1]); return <>{children(tx)}</>;
};
const beamTex = () => canvasTex("beam17", 64, 256, (c, W, H) => { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "rgba(255,255,255,0)"); g.addColorStop(0.75, "rgba(255,255,255,0.5)"); g.addColorStop(1, "rgba(255,255,255,1)"); c.fillStyle = g; c.fillRect(0, 0, W, H); });
/* lighthouse on a rocky islet with a rotating volumetric beam */
export const Lighthouse: React.FC<{ p: V3; t: number; s?: number }> = ({ p, t, s = 1 }) => {
  const a = t * 1.3, face = Math.max(0, Math.cos(a - 0.35)) ** 18;
  return (<group position={p} scale={s}>
    <mesh position={[0, -0.6, 0]} scale={[3.2, 1.4, 2.2]}><dodecahedronGeometry args={[1, 1]} /><meshToonMaterial color="#3a3f62" gradientMap={toonRamp} /></mesh>
    {[0, 1, 2, 3, 4].map((i) => <mesh key={i} position={[0, 0.6 + i * 1.1, 0]}><cylinderGeometry args={[0.62 - i * 0.07 - 0.07, 0.62 - i * 0.07, 1.1, 20]} /><meshToonMaterial color={i % 2 ? "#f2f2f6" : "#d63a3a"} gradientMap={toonRamp} /></mesh>)}
    <mesh position={[0, 6.3, 0]}><cylinderGeometry args={[0.42, 0.42, 0.7, 16]} /><meshBasicMaterial color="#fff2b8" /></mesh>
    <mesh position={[0, 6.95, 0]}><coneGeometry args={[0.6, 0.7, 16]} /><meshToonMaterial color="#2a2f4a" gradientMap={toonRamp} /></mesh>
    <SGlow p={[0, 6.3, 0.3]} r={1.4 + 3 * face} color="#fff0b0" o={0.8 + 0.2 * face} />
    <group position={[0, 6.3, 0]} rotation={[0, a, 0]}>
      {[0, Math.PI].map((r, i) => <mesh key={i} rotation={[0, r, Math.PI / 2]} position={[i ? -9 : 9, 0, 0]}><coneGeometry args={[1.3, 18, 24, 1, true]} /><meshBasicMaterial map={beamTex()} color="#fff2b8" transparent opacity={0.1} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} fog={false} /></mesh>)}
    </group>
  </group>);
};
/* gulls: white V wings gliding + slow flaps */
export const Gulls: React.FC<{ t: number; n?: number; c?: V3; r?: number }> = ({ t, n = 4, c = [0, 9, -18], r = 10 }) => (
  <>{Array.from({ length: n }, (_, i) => { const a = t * 0.18 + i * 1.7, f = 0.35 + 0.35 * Math.sin(t * (3 + i * 0.4) + i) * (Math.sin(t * 0.7 + i) > 0.3 ? 1 : 0.15);
    const p: V3 = [c[0] + Math.cos(a) * r + i * 2, c[1] + Math.sin(a * 1.3 + i) * 1.2 + i * 0.7, c[2] + Math.sin(a) * r * 0.35];
    return <group key={i} position={p} rotation={[0, -a + Math.PI / 2, Math.sin(a) * 0.2]}>{[-1, 1].map((sd) => <group key={sd} rotation={[0, 0, sd * f]}><mesh position={[sd * 0.32, 0.05, 0]} rotation={[0, 0, -sd * 0.35]}><boxGeometry args={[0.62, 0.05, 0.16]} /><meshBasicMaterial color="#eef2ff" /></mesh></group>)}
      <mesh scale={[1, 0.8, 1.8]}><sphereGeometry args={[0.1, 8, 6]} /><meshBasicMaterial color="#ffffff" /></mesh></group>; })}</>
);
/* tide 1 = normal high water reaching near the hero, 0 = retreated far out (Moonless). ghost = 0..1 translucent Moon (illustration) */
export const SHORE_HI = -0.4, SHORE_LO = -9.5;
export const waterline = (t: number, tide: number) => lerp(SHORE_LO, SHORE_HI, tide) + 0.45 * Math.sin(t * 1.25) + 0.15 * Math.sin(t * 2.7 + 1);
/* scalloped wave-crest texture: rows of small rounded crests with foam caps (replaces the old stripe look) */
const crestTex = (base: string, crest: string) => canvasTex("crest17|" + base + crest, 512, 512, (c, W, H) => { c.fillStyle = base; c.fillRect(0, 0, W, H);
  for (let row = 0; row < 16; row++) { const y = row * 32 + 10; for (let i = 0; i < 10; i++) { const x = ((i * 54 + row * 27) % W) + rnd(row * 10 + i) * 10, w = 34 + rnd(row * 13 + i) * 26;
    c.fillStyle = "rgba(0,20,60,0.22)"; c.beginPath(); c.ellipse(x, y + 7, w * 0.55, 5, 0, 0, Math.PI); c.fill();
    c.strokeStyle = crest; c.lineWidth = 3; c.beginPath(); c.arc(x, y + 10, w * 0.5, Math.PI * 1.12, Math.PI * 1.88); c.stroke();
    if (rnd(row * 7 + i) > 0.55) { c.fillStyle = "rgba(255,255,255,0.55)"; c.beginPath(); c.ellipse(x, y + 1, w * 0.18, 2.5, 0, 0, TAU); c.fill(); } } } }, [1, 1]);
const crestRowTex = () => canvasTex("crestrow17", 1024, 96, (c, W, H) => { for (let i = 0; i < 26; i++) { const x = i * 40 + rnd(i) * 20, w = 50 + rnd(i * 3) * 40;
  c.fillStyle = "rgba(10,40,90,0.35)"; c.beginPath(); c.ellipse(x, 62, w * 0.6, 14, 0, 0, Math.PI); c.fill();
  const g = c.createLinearGradient(0, 24, 0, 60); g.addColorStop(0, "rgba(255,255,255,0.95)"); g.addColorStop(1, "rgba(200,230,255,0.15)"); c.fillStyle = g; c.beginPath(); c.ellipse(x, 52, w * 0.55, 18, 0, Math.PI, TAU); c.fill(); } }, [1, 1]);
const shallowTex = () => canvasTex("shallow17", 8, 256, (c, W, H) => { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#1f5a9a"); g.addColorStop(0.7, "#3f8ccc"); g.addColorStop(1, "#8fd0ee"); c.fillStyle = g; c.fillRect(0, 0, W, H); });
const sandDecal = () => canvasTex("sanddecal17", 1024, 1024, (c, W, H) => { // ripples, speckles, patches
  for (let i = 0; i < 70; i++) { const y = rnd(i) * H, x = rnd(i * 3) * W, w = 60 + rnd(i * 5) * 160; c.strokeStyle = i % 2 ? "rgba(150,120,80,0.35)" : "rgba(255,250,230,0.45)"; c.lineWidth = 3; c.beginPath(); c.moveTo(x, y); c.bezierCurveTo(x + w * 0.3, y - 8, x + w * 0.6, y + 8, x + w, y); c.stroke(); }
  for (let i = 0; i < 900; i++) { c.fillStyle = rnd(i * 7) > 0.5 ? "rgba(120,95,70,0.5)" : "rgba(255,255,255,0.6)"; c.fillRect(rnd(i * 11) * W, rnd(i * 13) * H, 2 + rnd(i) * 2, 2 + rnd(i * 2) * 2); }
  for (let i = 0; i < 18; i++) { const x = rnd(i * 17) * W, y = rnd(i * 19) * H, r = 50 + rnd(i * 23) * 120; const g = c.createRadialGradient(x, y, 1, x, y, r); g.addColorStop(0, "rgba(255,245,215,0.35)"); g.addColorStop(1, "rgba(0,0,0,0)"); c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); } });
const scallopTex = (col: string) => canvasTex("scallop17|" + col, 128, 128, (c, W, H) => { c.fillStyle = col; c.beginPath(); c.moveTo(W / 2, H * 0.92); c.arc(W / 2, H * 0.92, W * 0.46, Math.PI * 1.1, Math.PI * 1.9); c.closePath(); c.fill(); c.strokeStyle = "rgba(120,70,60,0.5)"; c.lineWidth = 3;
  for (let i = 0; i < 7; i++) { const a = Math.PI * (1.15 + i * 0.1); c.beginPath(); c.moveTo(W / 2, H * 0.92); c.lineTo(W / 2 + Math.cos(a) * W * 0.44, H * 0.92 + Math.sin(a) * W * 0.44); c.stroke(); } c.strokeStyle = "#1a1a1a"; c.lineWidth = 4; c.beginPath(); c.moveTo(W / 2, H * 0.92); c.arc(W / 2, H * 0.92, W * 0.46, Math.PI * 1.1, Math.PI * 1.9); c.closePath(); c.stroke(); });
const starfishGeo = (() => { let g: THREE.ExtrudeGeometry | null = null; return () => { if (g) return g; const sh = new THREE.Shape(); for (let i = 0; i <= 10; i++) { const a = (i / 10) * TAU + Math.PI / 2, r = i % 2 ? 0.07 : 0.2; i ? sh.lineTo(Math.cos(a) * r, Math.sin(a) * r) : sh.moveTo(Math.cos(a) * r, Math.sin(a) * r); } g = new THREE.ExtrudeGeometry(sh, { depth: 0.04, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 2 }); return g; }; })();
/* little beach objects */
export const Shell: React.FC<{ p: V3; s?: number; ry?: number; col?: string }> = ({ p, s = 1, ry = 0, col = "#ffd6c4" }) => (
  <mesh position={[p[0], 0.012, p[2]]} rotation={[-Math.PI / 2, 0, ry]} scale={s}><planeGeometry args={[0.36, 0.36]} /><meshBasicMaterial map={scallopTex(col)} transparent alphaTest={0.3} /></mesh>);
export const Conch: React.FC<{ p: V3; s?: number; ry?: number }> = ({ p, s = 1, ry = 0 }) => (
  <group position={[p[0], 0.07 * s, p[2]]} rotation={[0, ry, Math.PI / 2]} scale={s}><mesh><coneGeometry args={[0.08, 0.3, 10]} /><meshToonMaterial color="#ffe2c8" gradientMap={toonRamp} /></mesh><mesh position={[0, -0.12, 0]}><sphereGeometry args={[0.09, 10, 8]} /><meshToonMaterial color="#ffb8a8" gradientMap={toonRamp} /></mesh></group>);
export const Starfish: React.FC<{ p: V3; s?: number; ry?: number; col?: string }> = ({ p, s = 1, ry = 0, col = "#ff8a5a" }) => (
  <mesh geometry={starfishGeo()} position={[p[0], 0.02, p[2]]} rotation={[-Math.PI / 2, 0, ry]} scale={s}><meshToonMaterial color={col} gradientMap={toonRamp} /></mesh>);
export const Driftwood: React.FC<{ p: V3; s?: number; ry?: number }> = ({ p, s = 1, ry = 0 }) => (
  <group position={[p[0], 0.06 * s, p[2]]} rotation={[0, ry, 0]} scale={s}><mesh rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.07, 0.1, 1.6, 8]} /><meshToonMaterial color="#b7a184" gradientMap={toonRamp} /></mesh>
    <mesh position={[0.35, 0.08, 0.15]} rotation={[0.9, 0.4, Math.PI / 2.6]}><cylinderGeometry args={[0.03, 0.05, 0.6, 6]} /><meshToonMaterial color="#a89274" gradientMap={toonRamp} /></mesh></group>);
const Footprints: React.FC<{ from: V3; to: V3; n?: number }> = ({ from, to, n = 9 }) => { const dx = to[0] - from[0], dz = to[2] - from[2], L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L, a = Math.atan2(dx, dz);
  return <>{Array.from({ length: n }, (_, i) => { const u = (i + 0.5) / n, side = i % 2 ? 1 : -1; return <mesh key={i} rotation={[-Math.PI / 2, 0, a]} position={[from[0] + dx * u - uz * side * 0.14, 0.008, from[2] + dz * u + ux * side * 0.14]}><circleGeometry args={[0.1, 14]} /><meshBasicMaterial color="#7a6448" transparent opacity={0.45} depthWrite={false} /></mesh>; })}</>; };
/* tide marker: wooden post + rock; the sea covers its lower half at high tide, then it stands dry with a dark wet stain */
const TideMarker: React.FC<{ p: V3; zw: number; t: number }> = ({ p, zw, t }) => { const sub = sm((zw - p[2] + 0.2) / 0.9), wet = cl((zw - p[2] + 0.6) / 0.6 + 0.0) > 0 ? 1 : 0.6;
  return (<group position={p}>
    <mesh position={[0, 0.65, 0]} rotation={[0.05, 0, 0.06]}><cylinderGeometry args={[0.09, 0.11, 1.3, 10]} /><meshToonMaterial color="#9a6a3a" gradientMap={toonRamp} /></mesh>
    <mesh position={[0, 0.33, 0]} rotation={[0.05, 0, 0.06]}><cylinderGeometry args={[0.115, 0.115, 0.62, 10]} /><meshBasicMaterial color="#4a3a2a" transparent opacity={0.55 * wet} /></mesh>
    <mesh position={[0, 0.78, 0.0]} rotation={[0.05, 0, 0.06]}><boxGeometry args={[0.5, 0.06, 0.06]} /><meshToonMaterial color="#8a5a2a" gradientMap={toonRamp} /></mesh>
    <mesh position={[0.45, 0.16, 0.15]} scale={[0.42, 0.3, 0.36]}><dodecahedronGeometry args={[1, 1]} /><meshToonMaterial color="#8a8ea8" gradientMap={toonRamp} /></mesh>
    {sub > 0.02 ? <><mesh position={[0.15, 0.3 * sub, 0]}><cylinderGeometry args={[0.75, 0.75, 0.6 * sub, 28]} /><meshBasicMaterial color="#4f9ad2" transparent opacity={0.82} /></mesh>
      <mesh position={[0.15, 0.6 * sub + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.13, 0.32 + 0.05 * Math.sin(t * 4), 28]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.8 * sub} /></mesh></> : null}
  </group>); };
export const MoonShore: React.FC<{ t: number; tide: number; ghost?: number; dark?: number; ghostP?: V3; lighthouse?: V3; marker?: V3; hero?: V3; fore?: V3[]; children?: React.ReactNode }> = ({ t, tide, ghost = 0, dark = 0.15, ghostP = [10, 26, -80], lighthouse = [-26, 1, -70], marker = [1.9, 0, -0.9], hero = [0, 0, 3.4], fore = [], children }) => {
  const sand = usePHTex("coast_sand_01", 10); const zw = waterline(t, tide), zHi = SHORE_HI + 0.6;
  const look = { rim: "175,205,255", shade: "6,10,36", rimK: 0.5, dim: 0.1 };
  const reflX = ghostP[0] * 0.05;
  return (<Lights amb={0.9 - 0.2 * dark} keyL={[[10, 30, -30], "#e4ecff", 1.05]} fill={[[-10, 5, 12], "#4a5ac0", 0.45]} look={look} fog={["#1a2a62", 34, 170]}>
    <SkyGrad a={["#0b1548", "#22368a", "#5a74c4"]} horizon="rgba(200,215,255,0.7)" hk={0.7} />
    <StarField t={t} n={200} bright={0.85} seed={3} />
    <ShootingStar t={t} t0={12.6} from={[-30, 70, -120]} to={[-62, 52, -115]} />
    {ghost > 0.01 ? <BigMoon p={ghostP} r={7.5} t={t} back={sm(ghost)} halo={0.8 * ghost} /> : null}
    <CloudStrips t={t} n={4} y={24} z={-90} span={160} speed={1.0} />
    <HillLayer p={[40, 3.2, -118]} s={[150, 30]} o={{ seed: 13, tone: "#1c2a64", rim: "rgba(190,205,255,0.45)", top: 0.52, amp: 0.14, trees: 18 }} />
    <Lighthouse p={lighthouse} t={t} s={1.5} />
    {/* layered sea: deep far plane (small crests) -> rows of rolling crests -> shallow gradient -> foam edge */}
    <Scroll tex={crestTex("#163e7a", "rgba(170,205,255,0.7)")} rep={[40, 14]} off={[t * 0.004, t * 0.02]}>{(tx) => <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, -95]}><planeGeometry args={[320, 170]} /><meshToonMaterial map={tx} gradientMap={toonRamp} /></mesh>}</Scroll>
    <Scroll tex={crestTex("#21579a", "rgba(190,225,255,0.75)")} rep={[22, 6]} off={[-t * 0.006, t * 0.045]}>{(tx) => <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, zw - 22]}><planeGeometry args={[160, 44]} /><meshToonMaterial map={tx} gradientMap={toonRamp} /></mesh>}</Scroll>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.009, zw - 3]}><planeGeometry args={[160, 6]} /><meshBasicMaterial map={shallowTex()} transparent opacity={0.85} depthWrite={false} /></mesh>
    {Array.from({ length: 7 }, (_, i) => { const u = ((t * 0.2 + i / 7) % 1), z = lerp(zw - 26, zw - 0.5, u * u); return <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[Math.sin(i * 2.3) * 4, 0.012 + 0.001 * i, z]}><planeGeometry args={[120, 0.35 + 0.55 * u]} /><meshBasicMaterial map={crestRowTex()} transparent opacity={0.9 * Math.sin(u * Math.PI)} depthWrite={false} /></mesh>; })}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.016, zw + 0.05]}><planeGeometry args={[160, 0.8]} /><meshBasicMaterial map={foamTex()} transparent opacity={0.95} depthWrite={false} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.7, 0.015, zw - 1.0 - 0.3 * Math.sin(t * 1.25)]}><planeGeometry args={[160, 0.4]} /><meshBasicMaterial map={foamTex()} transparent opacity={0.6} depthWrite={false} /></mesh>
    {/* wet sand left behind (darker, glossy, with star / Moon glints) + high-tide line of seaweed */}
    {zHi - zw > 0.05 ? <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, (zHi + zw) / 2]}><planeGeometry args={[160, zHi - zw]} /><meshBasicMaterial color="#4a4060" transparent opacity={0.55} depthWrite={false} /></mesh> : null}
    {Array.from({ length: 22 }, (_, i) => { const z = lerp(zw + 0.3, zHi, rnd(i * 5)); if (z <= zw + 0.2) return null; return <SGlow key={"w" + i} p={[reflX + (rnd(i) - 0.5) * 6, 0.03, z]} r={0.08 + rnd(i * 3) * 0.12} color="#fff6d0" o={(0.4 + 0.6 * Math.max(0, Math.sin(t * (2 + rnd(i) * 3) + i))) * 0.8} />; })}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.007, zHi]}><planeGeometry args={[160, 0.2]} /><meshBasicMaterial color="#3d6a46" transparent opacity={0.8} depthWrite={false} /></mesh>
    {/* sand + painted detail decal */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 3]}><planeGeometry args={[160, 30]} /><meshToonMaterial map={sand} color="#fff3d2" gradientMap={toonRamp} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 4.5]}><planeGeometry args={[40, 16]} /><meshBasicMaterial map={sandDecal()} transparent depthWrite={false} /></mesh>
    {/* sea sparkles + Moon reflection column */}
    {Array.from({ length: 34 }, (_, i) => { const z = zw - 1 - rnd(i) * 34, x = (rnd(i * 3) - 0.5) * 34; return <SGlow key={i} p={[x, 0.05, z]} r={0.12 + rnd(i * 5) * 0.22} color="#ffffff" o={Math.max(0, Math.sin(t * (3 + rnd(i) * 4) + i * 2)) ** 3} />; })}
    {Array.from({ length: 18 }, (_, i) => { const u = i / 17, z = lerp(-80, zw - 0.8, u), x = lerp(ghostP[0] * 0.75, reflX, u); return <SGlow key={"m" + i} p={[x + Math.sin(t * 3 + i) * 0.4 * (1 + u * 2), 0.06, z]} r={0.6 + u * 1.1} color="#fff2c0" o={(0.15 + 0.5 * ghost) * (0.6 + 0.4 * Math.sin(t * 5 + i * 1.7))} />; })}
    {/* fixed beach dressing (same in every shot) */}
    <Props list={[["rock_largeA", -5.8, 0.6, 1.8], ["rock_largeB", 6.6, -0.4, 2.1], ["stone_largeA", -8.5, -2.2, 1.7], ["rock_tallA", 9.4, -2.6, 1.8], ["rock_smallC", 3.4, 2.0, 1.1], ["rock_smallA", -3.4, 2.6, 0.9], ["stone_smallA", 4.6, 4.6, 1.0], ["rock_smallC", -1.6, 5.6, 0.8]]} t={t} tint="#8e94c8" />
    <TideMarker p={marker} zw={zw} t={t} />
    <Driftwood p={[-3.0, 0, 1.2]} ry={0.4} s={1.1} /><Driftwood p={[3.4, 0, 4.2]} ry={-0.9} s={0.8} />
    {[[-1.8, 4.6, 0.3, "#ffd0c0"], [1.3, 5.2, 1.4, "#ffe8b0"], [-3.9, 4.1, 2.1, "#f0c8ff"], [2.9, 2.6, 0.9, "#ffffff"], [-0.9, 2.2, 2.6, "#ffc8b8"], [0.6, 6.4, 1.0, "#ffe0c0"]].map(([x, z, r, col], i) => <Shell key={i} p={[x as number, 0, z as number]} ry={r as number} col={col as string} s={0.9 + rnd(i) * 0.5} />)}
    <Conch p={[2.2, 0, 5.4]} ry={0.6} /><Conch p={[-2.6, 0, 3.4]} ry={2.2} s={0.8} />
    <Starfish p={[1.2, 0, 3.0]} ry={0.3} /><Starfish p={[-1.5, 0, 6.2]} ry={1.2} col="#ffb03a" s={0.9} /><Starfish p={[4.2, 0, 1.6]} ry={2} col="#ff6a7a" s={0.8} />
    <Footprints from={[-6, 0, 7.5]} to={[hero[0] - 0.4, 0, hero[2] + 0.2]} n={12} />
    {[[-5, 0.3], [4.2, 0.9], [8.5, 2.5], [-2.2, 0.6]].map(([x, z], i) => <mesh key={i} rotation={[-Math.PI / 2, 0, rnd(i) * 3]} position={[x, 0.01, z]}><planeGeometry args={[1.6, 0.8]} /><meshBasicMaterial map={weedTex()} transparent depthWrite={false} /></mesh>)}
    {[[-3.6, 1.0, 1.2], [6.0, 2.4, 1.0]].map(([x, z, r], i) => <group key={i} position={[x, 0.012, z]}><mesh rotation={[-Math.PI / 2, 0, 0]} scale={[r, r * 0.55, 1]}><circleGeometry args={[1, 32]} /><meshBasicMaterial color="#3a78b8" transparent opacity={0.8} /></mesh>
      <SGlow p={[0.3, 0.05, 0]} r={0.25} color="#ffffff" o={0.5 + 0.5 * Math.sin(t * 2 + i)} /><mesh rotation={[-Math.PI / 2, 0, 0]} scale={[r, r * 0.55, 1]}><ringGeometry args={[0.92, 1, 32]} /><meshBasicMaterial color="#cfe6ff" transparent opacity={0.5} /></mesh></group>)}
    {/* near-camera foreground props (bottom edge framing): rocks + seaweed + a crab */}
    {fore.map((q, i) => i % 3 === 0 ? <KModel key={"f" + i} name={i % 2 ? "rock_smallC" : "rock_largeB"} p={q} s={0.9 + rnd(i) * 0.5} ry={rnd(i * 3) * 6} tint="#7a80b0" /> : i % 3 === 1 ? <mesh key={"f" + i} rotation={[-Math.PI / 2, 0, rnd(i) * 3]} position={[q[0], 0.012, q[2]]}><planeGeometry args={[1.4, 0.7]} /><meshBasicMaterial map={weedTex()} transparent depthWrite={false} /></mesh> : <Starfish key={"f" + i} p={q} ry={rnd(i) * 6} col="#ff8a5a" s={1.3} />)}
    <Gulls t={t} n={4} c={[2, 8, -20]} r={12} />
    <Motes t={t} n={22} c={[0, 1.6, 2]} area={[9, 3, 5]} color="#dfe8ff" o={0.35} />
    {children}
  </Lights>);
};

/* =============================== SPACE DIORAMA (Earth wobble) =============================== */
const nebTex = (seed: number, cols: string[]) => canvasTex("neb17|" + seed + cols.join(), 1024, 1024, (c, W, H) => { for (let i = 0; i < 70; i++) { const x = W * (0.5 + (rnd(i * 3 + seed) - 0.5) * 0.8), y = H * (0.5 + (rnd(i * 5 + seed) - 0.5) * 0.55), r = 60 + rnd(i * 7 + seed) * 240;
  const g = c.createRadialGradient(x, y, 1, x, y, r); g.addColorStop(0, cols[i % cols.length]); g.addColorStop(1, "rgba(0,0,0,0)"); c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); } });
const earthTex = () => canvasTex("earth17", 1024, 512, (c, W, H) => { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#2a78d0"); g.addColorStop(0.5, "#2f8ae6"); g.addColorStop(1, "#2a78d0"); c.fillStyle = g; c.fillRect(0, 0, W, H);
  const land = (x: number, y: number, rx: number, ry: number, seed: number, col: string) => { c.beginPath(); for (let i = 0; i <= 48; i++) { const a = (i / 48) * TAU, k = 0.72 + 0.3 * Math.sin(a * 3 + seed) * Math.cos(a * 2 + seed * 2) + 0.08 * Math.sin(a * 9 + seed); c.lineTo(x + Math.cos(a) * rx * k, y + Math.sin(a) * ry * k); } c.closePath(); c.fillStyle = col; c.fill(); c.strokeStyle = "#e8e0a8"; c.lineWidth = 4; c.stroke(); };
  [[200, 190, 120, 95, 1], [270, 335, 70, 100, 2], [560, 170, 160, 85, 3], [610, 320, 85, 95, 4], [830, 305, 95, 60, 5], [880, 160, 70, 50, 6]].forEach(([x, y, rx, ry, s]) => { land(x, y, rx, ry, s, "#4fbf5a"); land(x + 8, y + 6, rx * 0.5, ry * 0.45, s + 7, "#8ac85a"); });
  c.fillStyle = "#f4fbff"; c.fillRect(0, 0, W, 30); c.fillRect(0, H - 30, W, 30); });
const cloudTex = () => canvasTex("eclouds17", 1024, 512, (c, W, H) => { for (let i = 0; i < 45; i++) { const x = rnd(i) * W, y = 50 + rnd(i * 3) * (H - 100), rx = 30 + rnd(i * 5) * 90; c.fillStyle = `rgba(255,255,255,${0.25 + rnd(i * 9) * 0.3})`; c.beginPath(); c.ellipse(x, y, rx * 0.7, 5 + rnd(i * 7) * 9, rnd(i * 11) * 0.4, 0, TAU); c.fill(); } });
const atmoVS = `varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`;
const atmoFS = `uniform vec3 col; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.0 - abs(dot(vN, vV)), 2.6); gl_FragColor = vec4(col * f, f); }`;
/* Earth with 3D shading (lit by the Sun), separate rotating cloud layer, atmosphere rim glow, and a visible axis that can swing (tilt deg, precession rad) */
export const Earth3: React.FC<{ p: V3; r: number; t: number; tilt: number; prec?: number; axis?: number }> = ({ p, r, t, tilt, prec = 0, axis = 1 }) => {
  const atmo = useMemo(() => new THREE.ShaderMaterial({ vertexShader: atmoVS, fragmentShader: atmoFS, uniforms: { col: { value: new THREE.Color("#7ac8ff") } }, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.FrontSide }), []);
  return (<group position={p} rotation={[0, prec, 0]}><group rotation={[0, 0, (-tilt * Math.PI) / 180]}>
    <mesh rotation={[0, t * 0.35, 0]}><sphereGeometry args={[r, 72, 48]} /><meshToonMaterial map={earthTex()} gradientMap={toonRamp} /></mesh>
    <mesh rotation={[0, t * 0.55 + 1, 0]} scale={1.025}><sphereGeometry args={[r, 64, 40]} /><meshToonMaterial map={cloudTex()} transparent gradientMap={toonRamp} depthWrite={false} /></mesh>
    <mesh scale={1.13} material={atmo}><sphereGeometry args={[r, 48, 32]} /></mesh>
    {axis > 0 ? <><mesh><cylinderGeometry args={[r * 0.022, r * 0.022, r * 3.4, 10]} /><meshBasicMaterial color="#ffffff" transparent opacity={axis} /></mesh>
      <SGlow p={[0, r * 1.7, 0]} r={r * 0.22} color="#ff8a8a" o={axis} /><SGlow p={[0, -r * 1.7, 0]} r={r * 0.22} color="#8ad0ff" o={axis} />
      <mesh position={[0, r * 1.7, 0]}><sphereGeometry args={[r * 0.07, 14, 10]} /><meshBasicMaterial color="#ff5a5a" /></mesh><mesh position={[0, -r * 1.7, 0]}><sphereGeometry args={[r * 0.07, 14, 10]} /><meshBasicMaterial color="#5ab0ff" /></mesh></> : null}
  </group>
    {/* orbit-of-the-axis guide ring (shows the wobble cone) */}
    {axis > 0 ? <mesh position={[0, r * 1.7 * Math.cos((tilt * Math.PI) / 180), 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[r * 1.7 * Math.sin((Math.abs(tilt) * Math.PI) / 180) - r * 0.02, r * 1.7 * Math.sin((Math.abs(tilt) * Math.PI) / 180) + r * 0.02, 64]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.22 * axis} side={THREE.DoubleSide} /></mesh> : null}
  </group>);
};
/* lens flare: sprites along the line from the light source through the screen centre */
export const LensFlare: React.FC<{ src: V3; o?: number }> = ({ src, o = 1 }) => {
  const { camera } = useThree(); const g = useRef<THREE.Group>(null);
  const F = [[0.0, 1.0, "#fff6e0"], [0.35, 0.18, "#ffd08a"], [0.6, 0.1, "#9ad0ff"], [0.85, 0.28, "#c08aff"], [1.2, 0.14, "#8affd0"], [1.5, 0.4, "#ffb070"]] as const;
  useLayoutEffect(() => { const G = g.current; if (!G) return; const s = new THREE.Vector3(...src).project(camera); const vis = Math.abs(s.x) < 1.4 && Math.abs(s.y) < 1.4 && s.z < 1;
    G.children.forEach((ch, i) => { const k = F[i][0], nx = s.x * (1 - k * 2), ny = s.y * (1 - k * 2); const v = new THREE.Vector3(nx, ny, 0.5).unproject(camera).sub(camera.position).normalize().multiplyScalar(8).add(camera.position); ch.position.copy(v); ch.quaternion.copy(camera.quaternion); ch.visible = vis; }); });
  return <group ref={g}>{F.map(([, sz, col], i) => <mesh key={i}><circleGeometry args={[sz * (i ? 0.5 : 0.9), 32]} /><meshBasicMaterial color={col} transparent opacity={(i ? 0.16 : 0.35) * o} blending={THREE.AdditiveBlending} depthWrite={false} depthTest={false} fog={false} /></mesh>)}</group>;
};
export const SPACE_SUN: V3 = [-70, 26, -95];
/* star-dust layer: points in a slab at a given depth (several layers = real parallax when the camera drifts) */
export const DustLayer: React.FC<{ t: number; z: number; w: number; h: number; n?: number; size?: number; col?: string; seed?: number; drift?: number }> = ({ t, z, w, h, n = 160, size = 2.2, col = "#cfd8ff", seed = 1, drift = 0.05 }) => {
  const { geo, mat } = useMemo(() => { const g = new THREE.BufferGeometry(); const pos: number[] = []; for (let i = 0; i < n; i++) pos.push((rnd(i * 3 + seed) - 0.5) * w, (rnd(i * 5 + seed) - 0.5) * h, (rnd(i * 7 + seed) - 0.5) * 4);
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); const m = new THREE.PointsMaterial({ color: col, size, sizeAttenuation: false, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }); return { geo: g, mat: m }; }, [n, w, h, seed, col, size]);
  mat.opacity = 0.55 + 0.25 * Math.sin(t * 1.3 + seed); return <points geometry={geo} material={mat} position={[t * drift, 0, z]} frustumCulled={false} />;
};
/* a small distant planet (optional ring) */
export const Planet: React.FC<{ p: V3; r: number; col: string; col2?: string; ring?: string; t: number }> = ({ p, r, col, col2 = "#ffffff", ring, t }) => {
  const tex = canvasTex("planet17|" + col + col2, 256, 128, (c, W, H) => { c.fillStyle = col; c.fillRect(0, 0, W, H); for (let i = 0; i < 9; i++) { c.fillStyle = i % 2 ? col2 : col; c.globalAlpha = 0.35; c.fillRect(0, (i / 9) * H + rnd(i) * 6, W, 6 + rnd(i * 3) * 10); } c.globalAlpha = 1; });
  return (<group position={p}><mesh rotation={[0.3, t * 0.1, 0.2]}><sphereGeometry args={[r, 32, 20]} /><meshToonMaterial map={tex} gradientMap={toonRamp} /></mesh>
    {ring ? <mesh rotation={[1.25, 0.2, 0.3]}><ringGeometry args={[r * 1.4, r * 2.1, 48]} /><meshBasicMaterial color={ring} transparent opacity={0.6} side={THREE.DoubleSide} /></mesh> : null}
    <SGlow p={[0, 0, -r * 0.2]} r={r * 1.8} color={col} o={0.25} /></group>);
};
/* floating asteroid platform the hero stands on (toon rock, craters, soft under-glow, contact shadow on top) */
export const RockPlatform: React.FC<{ p: V3; t: number; s?: number }> = ({ p, t, s = 1 }) => {
  const geo = useMemo(() => { const g = new THREE.DodecahedronGeometry(1, 2); const P = g.attributes.position as THREE.BufferAttribute; for (let i = 0; i < P.count; i++) { const x = P.getX(i), y = P.getY(i), z = P.getZ(i), k = 1 + 0.12 * Math.sin(x * 5 + z * 3) + 0.08 * Math.sin(y * 7);
    P.setXYZ(i, x * k, y > 0.2 ? 0.2 + (y - 0.2) * 0.25 : y * k, z * k); } g.computeVertexNormals(); return g; }, []);
  return (<group position={p} rotation={[0.05 * Math.sin(t * 0.8), t * 0.08, 0.04 * Math.sin(t * 0.6)]} scale={s}>
    <mesh geometry={geo} scale={[1.25, 0.75, 1.0]} position={[0, -0.2, 0]}><meshToonMaterial color="#8c7fa8" gradientMap={toonRamp} /></mesh>
    {[[0.4, 0.3], [-0.5, -0.2], [0.1, -0.5]].map(([x, z], i) => <mesh key={i} position={[x, 0.005, z]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.16 + i * 0.04, 16]} /><meshBasicMaterial color="#6a5f86" /></mesh>)}
    <mesh position={[0, 0.01, 0.05]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.55, 24]} /><meshBasicMaterial color="#000010" transparent opacity={0.35} depthWrite={false} /></mesh>
    <SGlow p={[0, -0.7, 0]} r={1.6} color="#9a7aff" o={0.35} />
    {Array.from({ length: 5 }, (_, i) => <mesh key={"d" + i} position={[Math.cos(i * 1.3 + t * 0.4) * 1.7, -0.3 + Math.sin(t + i) * 0.15, Math.sin(i * 1.3 + t * 0.4) * 1.2]} scale={0.08 + rnd(i) * 0.08}><dodecahedronGeometry args={[1, 0]} /><meshToonMaterial color="#7a6f98" gradientMap={toonRamp} /></mesh>)}
  </group>);
};
export const SpaceDiorama: React.FC<{ t: number; sun?: V3; children?: React.ReactNode }> = ({ t, sun = SPACE_SUN, children }) => {
  const look = { rim: "255,225,180", shade: "2,2,24", rimK: 0.55, dim: 0.05 };
  return (<Lights amb={0.35} keyL={[sun, "#fff2dc", 1.6]} fill={[[30, -10, 20], "#5a4ad8", 0.4]} look={look}>
    <SkyGrad a={["#020210", "#06061e", "#0e0a30"]} />
    <StarField t={t} n={300} r={150} bright={0.9} seed={7} />
    <StarField t={t} n={120} r={60} bright={0.6} seed={11} px={0.7} />
    {/* nebula in 3 parallax layers */}
    <mesh position={[30, 10, -140]} rotation={[0, 0, 0.4 + t * 0.004]}><planeGeometry args={[220, 220]} /><meshBasicMaterial map={nebTex(1, ["rgba(120,60,200,0.25)", "rgba(40,90,200,0.22)", "rgba(220,80,170,0.16)"])} transparent blending={THREE.AdditiveBlending} depthWrite={false} fog={false} /></mesh>
    <mesh position={[-20, -10, -100]} rotation={[0, 0, -0.3 - t * 0.006]}><planeGeometry args={[150, 150]} /><meshBasicMaterial map={nebTex(2, ["rgba(40,200,220,0.16)", "rgba(90,70,220,0.18)"])} transparent blending={THREE.AdditiveBlending} depthWrite={false} fog={false} /></mesh>
    <mesh position={[18, 14, -60]} rotation={[0, 0, 1.1 + t * 0.01]}><planeGeometry args={[80, 80]} /><meshBasicMaterial map={nebTex(3, ["rgba(255,120,200,0.10)", "rgba(120,160,255,0.12)"])} transparent blending={THREE.AdditiveBlending} depthWrite={false} fog={false} /></mesh>
    {/* the Sun: bright core + halo + rays + flare */}
    <SGlow p={sun} r={7} color="#ffffff" o={1} /><SGlow p={sun} r={16} color="#ffe2a8" o={0.6} /><SGlow p={sun} r={36} color="#ff9a5a" o={0.22} />
    <LensFlare src={sun} />
    {/* drifting asteroids, far */}
    {Array.from({ length: 7 }, (_, i) => <mesh key={i} position={[(rnd(i * 3) - 0.5) * 50 + t * 0.15 * (rnd(i) - 0.5), 2 + (rnd(i * 5) - 0.5) * 22, -25 - rnd(i * 7) * 30]} rotation={[t * 0.2 * rnd(i), t * 0.3 * rnd(i * 2), 0]} scale={[0.5 + rnd(i) * 0.9, 0.4 + rnd(i * 2) * 0.6, 0.5 + rnd(i * 4) * 0.7]}><dodecahedronGeometry args={[1, 0]} /><meshToonMaterial color="#8a7f9a" gradientMap={toonRamp} /></mesh>)}
    <Motes t={t} n={50} c={[0, 2, 0]} area={[14, 8, 10]} color="#cfd8ff" size={0.03} o={0.5} />
    {/* 3 star-dust layers at different depths + distant planets + shooting stars */}
    <DustLayer t={t} z={-14} w={50} h={30} n={140} size={2.0} seed={2} drift={0.06} />
    <DustLayer t={t} z={-30} w={80} h={50} n={200} size={1.6} col="#ffd8f0" seed={5} drift={0.03} />
    <DustLayer t={t} z={-55} w={140} h={80} n={260} size={1.2} col="#bfe0ff" seed={9} drift={0.015} />
    <Planet p={[26, 12, -70]} r={2.6} col="#e8a86a" col2="#fff0d0" ring="#f0d8b0" t={t} />
    <Planet p={[-30, -14, -80]} r={1.6} col="#6ad0c8" t={t} />
    <Planet p={[8, 24, -110]} r={1.1} col="#c88aff" t={t} />
    <ShootingStar t={t} t0={25.5} from={[30, 40, -90]} to={[0, 28, -95]} color="#dfe8ff" />
    <ShootingStar t={t} t0={27.1} from={[-10, 50, -100]} to={[-45, 36, -95]} color="#ffe0f0" />
    <ShootingStar t={t} t0={28.7} from={[40, 20, -90]} to={[12, 8, -95]} />
    {children}
  </Lights>);
};
void KModel; void noise1;

/* =============================== VOLUMETRIC FLASHLIGHT (scene 2) =============================== */
const coneTex = () => canvasTex("cone17", 128, 256, (c, W, H) => { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "rgba(255,255,255,0)"); g.addColorStop(0.6, "rgba(255,255,255,0.35)"); g.addColorStop(1, "rgba(255,255,255,0.9)"); c.fillStyle = g; c.fillRect(0, 0, W, H);
  const h = c.createLinearGradient(0, 0, W, 0); h.addColorStop(0, "rgba(0,0,0,1)"); h.addColorStop(0.5, "rgba(0,0,0,0)"); h.addColorStop(1, "rgba(0,0,0,1)"); c.globalCompositeOperation = "destination-out"; c.globalAlpha = 0.5; c.fillStyle = h; c.fillRect(0, 0, W, H); });
/* real cone of light: soft volumetric cone + spot light (only lights what it sweeps) + dust motes lit inside it + hot spot */
export const TorchBeam: React.FC<{ from: V3; to: V3; on?: number; t: number; spread?: number; bright?: number }> = ({ from, to, on = 1, t, spread = 0.2, bright = 1 }) => {
  const d = new THREE.Vector3(to[0] - from[0], to[1] - from[1], to[2] - from[2]), L = d.length(), u = d.clone().normalize(), q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), u);
  const tgt = useMemo(() => new THREE.Object3D(), []); tgt.position.set(...to);
  if (on <= 0.01) return null;
  const inCone = (p: V3) => { const v = new THREE.Vector3(p[0] - from[0], p[1] - from[1], p[2] - from[2]), a = v.dot(u); if (a < 0.2 || a > L) return 0; const r = v.clone().sub(u.clone().multiplyScalar(a)).length(); return cl(1 - r / (a * spread * 1.1)); };
  const mid: V3 = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2, (from[2] + to[2]) / 2];
  return (<group>
    <mesh position={mid} quaternion={q}><coneGeometry args={[L * spread, L, 40, 1, true]} /><meshBasicMaterial map={coneTex()} color="#fff4c8" transparent opacity={Math.min(1, 0.32 * on * bright)} side={THREE.DoubleSide} depthWrite={bright > 1} /* v18: beam writes depth so the DOF pass keeps it sharp */ blending={THREE.AdditiveBlending} fog={false} /></mesh>
    <mesh position={mid} quaternion={q} scale={[0.5, 1, 0.5]}><coneGeometry args={[L * spread, L, 32, 1, true]} /><meshBasicMaterial map={coneTex()} color="#fffbe8" transparent opacity={Math.min(1, 0.25 * on * bright)} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} fog={false} /></mesh>
    <primitive object={tgt} />
    <spotLight position={from} target={tgt} angle={Math.atan(spread) * 1.15} penumbra={0.5} intensity={(bright > 1 ? 55 : 140) * on} distance={L * 2.2} decay={1.2} color="#fff2c8" />
    <SGlow p={from} r={0.2} color="#fffbe0" o={on} />
    <SGlow p={to} r={L * spread * 0.9} color="#fff6c8" o={0.28 * on} />
    <Motes t={t} n={70} c={mid} area={[L * 0.9, L * 0.6, L * 0.9]} color="#fff6d8" size={0.03} o={0.9 * on} lit={inCone} />
  </group>);
};

/* =============================== FOREST GLADE (scene 4: animals) =============================== */
const GLADE: PropSpec[] = [
  ["tree_oak", -6.5, -5, 3.6], ["tree_detailed", -9.5, -9, 3.8], ["tree_pineTallA_detailed", 8, -8, 3.6], ["tree_fat", 10.5, -4, 3.2], ["tree_pineRoundA", -13, -14, 3.6], ["tree_default", 13, -14, 3.4], ["tree_pineTallB_detailed", 3, -17, 3.6], ["tree_oak", -3.5, -19, 3.4], ["tree_detailed", 16, -20, 3.4], ["tree_pineRoundC", -17, -6, 3.2],
  ["plant_bushDetailed", -4.2, -2.6, 1.8], ["plant_bushLarge", 4.8, -3.4, 1.9], ["plant_bush", -7, 0.2, 1.6], ["plant_bushDetailed", 7.4, 0.4, 1.6],
  ["grass_leafsLarge", -2.6, -1.4, 1.8], ["grass_leafsLarge", 3.0, -0.6, 1.7], ["grass_leafsLarge", -5.0, 1.8, 1.6], ["grass_leafsLarge", 5.6, 2.2, 1.6], // ferns
  ["mushroom_redGroup", -1.8, -2.0, 1.4], ["mushroom_red", 1.6, -1.6, 1.3], ["mushroom_redGroup", 4.0, 1.0, 1.2], ["mushroom_red", -3.6, 0.8, 1.2],
  ["stump_round", -5.2, -1.4, 1.5], ["log_large", 5.8, -6.2, 1.4], ["rock_largeB", -4.0, -6.5, 1.5], ["flower_purpleA", -0.9, -0.4, 1.3], ["flower_yellowA", 1.1, 0.2, 1.2], ["flower_redA", 2.4, -2.4, 1.2],
];
/* owl branch: a horizontal branch sticking out of a trunk */
export const Branch: React.FC<{ p: V3; len?: number; t: number }> = ({ p, len = 2.6, t }) => (
  <group position={p} rotation={[0, 0, Math.sin(t * 0.9) * 0.012]}>
    <mesh position={[len / 2, 0, 0]} rotation={[0, 0, Math.PI / 2 + 0.06]}><cylinderGeometry args={[0.1, 0.16, len, 10]} /><meshToonMaterial color="#6e4a2a" gradientMap={toonRamp} /></mesh>
    {[0.5, 0.8].map((u, i) => <group key={i} position={[len * u, 0.05, 0]} rotation={[0, 0, 0.7 + i * 0.3]}><mesh position={[0, 0.3, 0]}><cylinderGeometry args={[0.03, 0.05, 0.6, 6]} /><meshToonMaterial color="#6e4a2a" gradientMap={toonRamp} /></mesh>
      <mesh position={[0.05, 0.65, 0]} scale={[0.35, 0.22, 0.3]}><icosahedronGeometry args={[1, 1]} /><meshToonMaterial color="#3a7a5a" gradientMap={toonRamp} /></mesh></group>)}
  </group>);
export const ForestGlade: React.FC<{ t: number; dark?: number; children?: React.ReactNode }> = ({ t, dark = 0.5, children }) => {
  const d = cl(dark), look = { rim: "160,190,255", shade: "4,8,30", rimK: 0.6, dim: 0.12 };
  return (<Lights amb={lerp(0.62, 0.32, d)} keyL={[[6, 22, 8], "#b8ccff", lerp(1.1, 0.55, d)]} fill={[[-12, 6, 10], "#3a4aa8", 0.4]} look={look} fog={[mixC("#1c2c66", "#0a1032", d), 16, 90]}>
    <SkyGrad a={["#0a1240", "#1c2c70", "#3e5298"]} b={["#03061a", "#081232", "#162452"]} k={d} />
    <StarField t={t} n={260} bright={1.15} seed={21} />
    <ShootingStar t={t} t0={19.4} from={[25, 70, -110]} to={[-8, 56, -112]} />
    <HillLayer p={[0, 5.5, -80]} s={[240, 56]} o={{ seed: 31, tone: mixC("#1d2a66", "#0a0f30", d), rim: "rgba(170,190,255,0.45)", top: 0.4, amp: 0.1, trees: 90 }} />
    <HillLayer p={[0, 2.6, -46]} s={[150, 34]} o={{ seed: 37, tone: mixC("#142050", "#070b24", d), rim: "rgba(150,175,255,0.4)", top: 0.38, amp: 0.12, trees: 60 }} />
    <GroundHaze t={t} layers={[[-28, 0.9, 120], [-44, 1.8, 160], [-6, 0.35, 60]]} col="rgba(130,150,220,0.5)" o={0.5} />
    {/* starlit glade: soft pool of light in the clearing */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -0.5]}><circleGeometry args={[4.2, 48]} /><meshBasicMaterial color="#9ab0ff" transparent opacity={0.13} depthWrite={false} /></mesh>
    <PaintedGround a="#1f4a48" b="#2a5e56" c2="#173a3c" z={-20} r={80} seed={7} />
    <Props list={GLADE} t={t} tint="#8a9ce0" />
    <Grass t={t} area={[16, 8]} c={[0, 0, -1]} n={700} colors={["#2f6a5e", "#3c7f6c", "#24584e"]} h={0.4} />
    <FireflyTrails t={t} n={26} c={[0, 1.6, -2]} area={[12, 2.4, 8]} o={1} size={0.05} trail={7} />
    {children}
  </Lights>);
};

/* =============================== SEASON HILL (scene 6): one fixed spot, the same hill + tree through 4 seasons ===============================
   season: 0 spring, 1 summer, 2 autumn, 3 winter; chaos 0..1 = weather chaos (lightning + snow in summer) */
export const SEASONS = [
  { sky: ["#7ab8ff", "#c8e4ff", "#ffe8f2"], g: "#7ed36a", g2: "#9ae07a", leaf: ["#ffb3d1", "#ff8ac0", "#ffd6e6"], sun: "#fff4d8", amb: 1.0, rim: "255,230,240", fog: "#e8f0ff" },
  { sky: ["#2f86f0", "#8ccaff", "#e6f6ff"], g: "#4cc458", g2: "#6ad66a", leaf: ["#3fbf5a", "#2fa04a", "#5ad66a"], sun: "#fff8e0", amb: 1.1, rim: "255,250,230", fog: "#cfe8ff" },
  { sky: ["#6a4aa0", "#ff9a5a", "#ffd49a"], g: "#c8a041", g2: "#d9b45a", leaf: ["#f08a2c", "#d9541e", "#f2c14e"], sun: "#ffb070", amb: 0.95, rim: "255,180,110", fog: "#ffc89a" },
  { sky: ["#8aa4c8", "#c4d4ea", "#eef4ff"], g: "#eef4ff", g2: "#dce8f8", leaf: [] as string[], sun: "#e8f0ff", amb: 1.05, rim: "220,235,255", fog: "#e6eef8" },
];
const BareTree: React.FC<{ snow?: boolean }> = ({ snow }) => (<group>{[[0.8, 0.5, 1.1], [-0.7, -0.6, 1.0], [0.2, 0.9, 0.9], [-0.3, 0.2, 1.2], [0.9, -0.4, 0.8]].map(([a, b, l], i) =>
  <group key={i} position={[0, 2.1 + i * 0.12, 0]} rotation={[b * 0.6, i * 1.3, a]}><mesh position={[0, l / 2, 0]}><cylinderGeometry args={[0.04, 0.08, l, 6]} /><meshToonMaterial color="#5a3a22" gradientMap={toonRamp} /></mesh>
    {snow ? <mesh position={[0, l * 0.75, 0.04]} scale={[0.1, 0.05, 0.1]}><sphereGeometry args={[1, 8, 6]} /><meshToonMaterial color="#ffffff" gradientMap={toonRamp} /></mesh> : null}</group>)}</group>);
export const SeasonTree: React.FC<{ p: V3; s?: number; season: number; t: number }> = ({ p, s = 1, season, t }) => { const S = SEASONS[season], sw = Math.sin(t * 1.4) * 0.03;
  return (<group position={p} scale={s}>
    <mesh position={[0, 1.1, 0]}><cylinderGeometry args={[0.16, 0.28, 2.2, 10]} /><meshToonMaterial color="#6e4a2a" gradientMap={toonRamp} /></mesh>
    <group rotation={[sw * 0.4, 0, sw]}>
      {season === 3 ? <BareTree snow /> : Array.from({ length: 9 }, (_, i) => { const a = i * 2.39, r = i ? 0.75 : 0; return <mesh key={i} position={[Math.cos(a) * r, 2.6 + (i % 3) * 0.4, Math.sin(a) * r * 0.7]} scale={0.7 + rnd(i * 3) * 0.3}><icosahedronGeometry args={[1, 2]} /><meshToonMaterial color={S.leaf[i % 3]} gradientMap={toonRamp} /></mesh>; })}
      {season === 0 ? Array.from({ length: 14 }, (_, i) => <mesh key={"b" + i} position={[(rnd(i) - 0.5) * 2.6, 2.3 + rnd(i * 3) * 1.4, 0.6 + rnd(i * 5) * 0.4]}><sphereGeometry args={[0.09, 8, 6]} /><meshBasicMaterial color="#ffffff" /></mesh>) : null}
      {season === 1 ? Array.from({ length: 6 }, (_, i) => <mesh key={"a" + i} position={[(rnd(i) - 0.5) * 2.2, 2.2 + rnd(i * 3) * 1.2, 0.75]}><sphereGeometry args={[0.13, 10, 8]} /><meshToonMaterial color="#e53935" gradientMap={toonRamp} /></mesh>) : null}
    </group>
  </group>); };
/* falling particles per season: petals, butterflies-ish sparkles, leaves, snow */
export const SeasonFall: React.FC<{ t: number; kind: "petals" | "leaves" | "snow" | "pollen"; n?: number; c?: V3; area?: V3; colors?: string[] }> = ({ t, kind, n = 60, c = [0, 3, 0], area = [12, 6, 8], colors = ["#ffffff"] }) => (
  <>{Array.from({ length: n }, (_, i) => { const sp = kind === "snow" ? 0.18 : kind === "pollen" ? 0.05 : 0.12, u = ((t * sp + rnd(i)) % 1), p: V3 = [c[0] + (rnd(i * 3) - 0.5) * area[0] + Math.sin(t * 1.3 + i) * (kind === "snow" ? 0.2 : 0.6), c[1] + area[1] / 2 - u * area[1], c[2] + (rnd(i * 5) - 0.5) * area[2]];
    if (kind === "snow" || kind === "pollen") return <SGlow key={i} p={p} r={kind === "snow" ? 0.07 + rnd(i) * 0.05 : 0.04} color={kind === "snow" ? "#ffffff" : "#fff6a8"} o={0.95} />;
    return <mesh key={i} position={p} rotation={[t * 2 + i, t * 1.3 + i, Math.sin(t * 2 + i)]}><circleGeometry args={[kind === "petals" ? 0.07 : 0.11, 6]} /><meshBasicMaterial color={colors[i % colors.length]} side={THREE.DoubleSide} /></mesh>; })}</>
);
export const SeasonHill: React.FC<{ t: number; season: number; chaos?: number; flash?: number; children?: React.ReactNode }> = ({ t, season, chaos = 0, flash = 0, children }) => {
  const S = SEASONS[season]; const look = { rim: S.rim, shade: "30,20,60", rimK: 0.45, dim: chaos > 1.5 ? 0.18 * (1 - flash) : 0 };
  const sunP: V3 = season === 2 ? [-30, 6, -70] : [30, 40, -70];
  return (<Lights amb={(chaos > 1.5 ? 0.55 : S.amb) + flash * 1.5} keyL={[sunP, S.sun, 1.3 + flash]} fill={[[-10, 6, 10], "#9ab0ff", 0.4]} look={look} fog={[S.fog, 30, 140]}>
    <SkyGrad a={chaos > 1.5 ? ["#1c1c3a", "#3e3e62", "#6a6a8c"] : S.sky} />{/* v18 chaos: 1 = snow in summer (summer sky), 2 = lightning storm */}
    <SGlow p={sunP} r={season === 2 ? 16 : season === 1 ? 14 : 10} color={S.sun} o={chaos > 1.5 ? 0.1 : 0.85} />{season === 1 && chaos < 1.5 ? <SGlow p={sunP} r={34} color="#fff6c8" o={0.35} /> : null}
    {season !== 3 && chaos < 1.5 ? <CloudStrips t={t} n={5} y={20} z={-70} span={120} speed={1.4} tone="rgba(255,255,255,0.7)" rim="rgba(255,255,255,0.5)" /> : null}
    <HillLayer p={[0, 4, -70]} s={[220, 44]} o={{ seed: 41, tone: mixC(S.g, "#6a7ab0", 0.45), rim: "rgba(255,255,255,0.4)", top: 0.42, amp: 0.12, trees: 50 }} />
    <PaintedGround a={S.g} b={S.g2} z={-20} r={90} seed={11} />
    {/* the fixed spot: hill mound + tree + pond + fence */}
    <mesh position={[0, -2.6, -4]} scale={[9, 3, 6]}><sphereGeometry args={[1, 48, 24]} /><meshToonMaterial color={S.g2} gradientMap={toonRamp} /></mesh>
    <SeasonTree p={[2.6, 0.35, -3.8]} s={1.25} season={season} t={t} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-4.2, 0.02, -1.4]} scale={[1.8, 1, 1]}><circleGeometry args={[1.3, 40]} /><meshToonMaterial color={season === 3 ? "#dff2ff" : "#4aa0e0"} gradientMap={toonRamp} /></mesh>
    {season === 3 ? <SGlow p={[-4, 0.05, -1.3]} r={0.5} color="#ffffff" o={0.8} /> : null}
    <Props list={FENCE.map(([n, x, z, s2, r]) => [n, x + 6, z + 2.5, s2, r] as PropSpec)} t={t} sway={0} />
    {season !== 3 ? <Grass t={t} area={[16, 8]} c={[0, 0, -1]} n={600} colors={[S.g, S.g2, mixC(S.g, "#2a6a3a", 0.3)]} h={0.38} /> : null}
    {season === 0 ? <SeasonFall t={t} kind="petals" n={70} colors={["#ffb3d1", "#ffd6e6", "#ffffff"]} /> : null}
    {season === 1 ? <><SeasonFall t={t} kind="pollen" n={40} /><Butterflies2 t={t} /></> : null}
    {season === 2 ? <SeasonFall t={t} kind="leaves" n={60} colors={["#f08a2c", "#d9541e", "#f2c14e"]} /> : null}
    {season === 3 || (chaos > 0.5 && chaos < 1.5) ? <SeasonFall t={t} kind="snow" n={170} /> : null}{chaos > 1.5 ? <SeasonFall t={t * 6} kind="snow" n={160} area={[14, 8, 8]} /> : null}
    {children}
  </Lights>);
};
const Butterflies2: React.FC<{ t: number }> = ({ t }) => <>{Array.from({ length: 6 }, (_, i) => { const a = t * (0.6 + rnd(i) * 0.4) + i * 2, p: V3 = [Math.sin(a) * 3.5 + (rnd(i) - 0.5) * 4, 1.2 + Math.sin(a * 2.3) * 0.5 + rnd(i) * 1.2, -1 + Math.cos(a * 0.8) * 2]; const f = Math.abs(Math.sin(t * 14 + i)) * 1.2;
  return <group key={i} position={p} rotation={[0, a, 0]}>{[-1, 1].map((sd) => <mesh key={sd} position={[sd * 0.09, 0, 0]} rotation={[0, sd * f, 0]}><circleGeometry args={[0.13, 10]} /><meshBasicMaterial color={["#ffd23a", "#ff6aa8", "#7ad8ff"][i % 3]} side={THREE.DoubleSide} /></mesh>)}</group>; })}</>;
