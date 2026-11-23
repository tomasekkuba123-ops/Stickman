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
  ["stump_round", -5.8, -6.6, 1.4], ["log", 6.2, -3.3, 1.3], ["grass_large", -2.0, 0.6, 1.4], ["grass_leafsLarge", 2.4, 0.4, 1.4], ["grass_large", 3.4, -0.6, 1.3],
];
const FENCE: PropSpec[] = Array.from({ length: 7 }, (_, i) => ["fence_simple", -13 + i * 1.95, -7.5 - i * 0.25, 1.6, 0.12] as PropSpec);
/* dark 0 = moonlit silver-blue, 1 = deep dark blue (no Moon). moon = vanish progress (0..1+), back = pop-back (loop). */
export const NightField: React.FC<{ t: number; dark?: number; vanish?: number; back?: number; fireflies?: number; stars?: number; moonP?: V3; children?: React.ReactNode }> = ({ t, dark = 0, vanish = 0, back = 0, fireflies = 1, stars = 1, moonP = NF_MOON, children }) => {
  const d = cl(dark);
  const look = { rim: d < 0.5 ? "190,215,255" : "120,140,220", shade: "6,8,34", rimK: lerp(0.6, 0.18, d), dim: 0.5 * d };
  return (<Lights amb={lerp(0.62, 0.16, d)} keyL={[[NF_MOON[0], NF_MOON[1], NF_MOON[2] + 20], mixC("#d6e4ff", "#5a6ab8", d), lerp(1.25, 0.12, d)]} fill={[[-12, 6, 10], "#3a4aa8", lerp(0.4, 0.22, d)]} look={look} fog={[mixC("#22336e", "#070b26", d), 22, 130]}>
    <SkyGrad a={["#0f1a52", "#2a3d88", "#6b7fc4"]} b={["#02040f", "#050a26", "#0d1640"]} k={d} horizon="rgba(190,200,255,0.55)" hk={0.6 * (1 - d)} />
    <StarField t={t} n={240} bright={stars * (0.75 + 0.6 * d)} />
    <ShootingStar t={t} t0={0.35} from={[-40, 70, -110]} to={[-75, 48, -100]} />
    <ShootingStar t={t} t0={5.6} from={[30, 75, -110]} to={[-5, 58, -115]} />
    <ShootingStar t={t} t0={33.9} from={[-20, 80, -110]} to={[-55, 62, -105]} />
    {vanish < 1.6 || back > 0 ? <BigMoon p={moonP} r={4.4} t={t} vanish={vanish} back={back} /> : null}
    <CloudStrips t={t} n={5} y={30} z={-58} span={140} speed={1.1} o={1 - 0.5 * d} />
    {/* 3 far silhouette layers (3 tones) + village with warm lit windows */}
    <HillLayer p={[0, 6.5, -96]} s={[300, 70]} o={{ seed: 1, tone: mixC("#2d3f86", "#0c1236", d), rim: "rgba(190,205,255,0.5)", top: 0.42, amp: 0.12, trees: 60 }} />
    <HillLayer p={[6, 3.4, -66]} s={[200, 46]} t={t} windows={18} o={{ seed: 5, tone: mixC("#1f2c66", "#090e2c", d), rim: "rgba(170,190,255,0.5)", top: 0.45, amp: 0.1, trees: 44, village: true, roof: mixC("#2b2a66", "#0c0c2c", d) }} />
    <HillLayer p={[-4, 1.8, -40]} s={[130, 30]} o={{ seed: 9, tone: mixC("#152050", "#060a20", d), rim: "rgba(150,175,255,0.45)", top: 0.46, amp: 0.13, trees: 30 }} />
    <GroundHaze t={t} layers={[[-36, 1.2, 140], [-58, 2.2, 190], [-84, 3.6, 260]]} col={d > 0.5 ? "rgba(60,80,150,0.5)" : "rgba(150,170,235,0.5)"} o={0.55} />
    {/* mid ground: varied Kenney trees, bushes, rocks, flowers, mushrooms, fence, sign */}
    <PaintedGround a="#23524f" b="#2f6a5e" c2="#1b4044" z={-30} r={95} />
    <Props list={NF_PROPS} t={t} tint="#8fa0e0" />
    <Props list={FENCE} t={t} tint="#9aa4d8" sway={0} />
    <WoodSign p={[-6.2, 0, -3.2]} ry={0.5} s={1.3} t={t} text="→ MOON" />
    <Grass t={t} area={[18, 9]} c={[0, 0, -2.5]} n={900} colors={["#2f6a5e", "#3c7f6c", "#24584e", "#4a8f78"]} h={0.42} />
    {fireflies > 0 ? <FireflyTrails t={t} n={22} c={[0, 1.5, -3]} area={[12, 2.2, 8]} o={fireflies} size={0.045} trail={7} /> : null}
    <Motes t={t} n={26} c={[0, 2, 0]} area={[8, 3, 5]} color="#cfdcff" o={0.35 * (1 - d)} />
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
      {[0, Math.PI].map((r, i) => <mesh key={i} rotation={[0, r, Math.PI / 2]} position={[i ? -9 : 9, 0, 0]}><coneGeometry args={[2.2, 18, 24, 1, true]} /><meshBasicMaterial map={beamTex()} color="#fff2b8" transparent opacity={0.22} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} fog={false} /></mesh>)}
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
export const SHORE_HI = -0.6, SHORE_LO = -12;
export const waterline = (t: number, tide: number) => lerp(SHORE_LO, SHORE_HI, tide) + 0.55 * Math.sin(t * 1.25) + 0.2 * Math.sin(t * 2.7 + 1);
export const MoonShore: React.FC<{ t: number; tide: number; ghost?: number; dark?: number; ghostP?: V3; children?: React.ReactNode }> = ({ t, tide, ghost = 0, dark = 0.15, ghostP = [10, 26, -80], children }) => {
  const sand = usePHTex("coast_sand_01", 10); const zw = waterline(t, tide), zHi = SHORE_HI + 0.75;
  const look = { rim: "175,205,255", shade: "6,10,36", rimK: 0.5, dim: 0.12 };
  return (<Lights amb={0.85 - 0.2 * dark} keyL={[[10, 30, -30], "#dfe8ff", 1.0]} fill={[[-10, 5, 12], "#4a5ac0", 0.45]} look={look} fog={["#1a2a62", 30, 160]}>
    <SkyGrad a={["#0b1548", "#22368a", "#5a74c4"]} horizon="rgba(200,215,255,0.7)" hk={0.7} />
    <StarField t={t} n={180} bright={0.8} seed={3} />
    <ShootingStar t={t} t0={12.6} from={[-30, 70, -120]} to={[-62, 52, -115]} />
    {ghost > 0.01 ? <BigMoon p={ghostP} r={7.5} t={t} back={sm(ghost)} halo={0.8 * ghost} /> : null}
    <CloudStrips t={t} n={4} y={24} z={-90} span={160} speed={1.0} />
    <HillLayer p={[40, 3.2, -118]} s={[150, 30]} o={{ seed: 13, tone: "#1c2a64", rim: "rgba(190,205,255,0.45)", top: 0.52, amp: 0.14, trees: 18 }} />
    <Lighthouse p={[-26, 1, -70]} t={t} s={1.4} />
    {/* layered sea: far deep plane + near lighter plane, each scrolling at its own speed */}
    <Scroll tex={waveTex("#163e7a", "rgba(130,170,240,0.45)")} rep={[16, 8]} off={[t * 0.004, t * 0.012]}>{(tx) => <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, -90]}><planeGeometry args={[320, 160]} /><meshToonMaterial map={tx} gradientMap={toonRamp} /></mesh>}</Scroll>
    <Scroll tex={waveTex("#2a66a8", "rgba(170,210,255,0.5)")} rep={[10, 5]} off={[-t * 0.006, t * 0.03]}>{(tx) => <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, zw - 22]}><planeGeometry args={[160, 44]} /><meshToonMaterial map={tx} gradientMap={toonRamp} transparent opacity={0.97} /></mesh>}</Scroll>
    {/* rolling foam crests toward the shore */}
    {[0, 1, 2, 3].map((i) => { const u = ((t * 0.22 + i * 0.25) % 1), z = lerp(zw - 16, zw - 0.6, u); return <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[Math.sin(i * 2) * 3, 0.014 + 0.002 * i, z]}><planeGeometry args={[110, 0.25 + 0.3 * u]} /><meshBasicMaterial map={foamTex()} transparent opacity={0.5 * Math.sin(u * Math.PI)} depthWrite={false} /></mesh>; })}
    {/* shallow swash + moving foam edge at the waterline */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, zw - 1.6]}><planeGeometry args={[160, 3.4]} /><meshBasicMaterial color="#6ab6e4" transparent opacity={0.6} depthWrite={false} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, zw + 0.05]}><planeGeometry args={[160, 0.7]} /><meshBasicMaterial map={foamTex()} transparent opacity={0.95} depthWrite={false} /></mesh>
    {/* wet sand band left behind by the retreating water (darker, glossy) */}
    {zHi - zw > 0.1 ? <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, (zHi + zw) / 2]}><planeGeometry args={[160, zHi - zw]} /><meshBasicMaterial color="#4a4466" transparent opacity={0.6} depthWrite={false} /></mesh> : null}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.009, zHi]}><planeGeometry args={[160, 0.18]} /><meshBasicMaterial color="#3d6a46" transparent opacity={0.8} depthWrite={false} /></mesh>
    {/* sand */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 4]}><planeGeometry args={[160, 36]} /><meshToonMaterial map={sand} color="#fff0c8" gradientMap={toonRamp} /></mesh>
    {/* reflections + sparkles on the water and wet sand */}
    {Array.from({ length: 26 }, (_, i) => { const z = zw - 1 - rnd(i) * 30, x = (rnd(i * 3) - 0.5) * 30; return <SGlow key={i} p={[x, 0.05, z]} r={0.12 + rnd(i * 5) * 0.2} color="#ffffff" o={Math.max(0, Math.sin(t * (3 + rnd(i) * 4) + i * 2)) ** 3} />; })}
    {ghost > 0.01 ? Array.from({ length: 16 }, (_, i) => { const u = i / 15, z = lerp(-70, zw - 1, u), x = lerp(ghostP[0] * 0.7, 1.2, u); return <SGlow key={"m" + i} p={[x + Math.sin(t * 3 + i) * 0.4 * (1 + u * 2), 0.06, z]} r={0.8 + u * 1.2} color="#fff2c0" o={ghost * 0.5 * (0.6 + 0.4 * Math.sin(t * 5 + i * 1.7))} />; }) : null}
    {/* beach props: rocks, shells, seaweed, tide pools */}
    <Props list={[["rock_largeA", -6.5, 1.2, 1.8], ["rock_largeB", 7.2, 0.4, 2.1], ["stone_largeA", -9, -1.5, 1.7], ["rock_tallA", 10, -2, 1.8], ["rock_smallC", 3.3, 2.5, 1.2], ["rock_smallA", -3.6, 3.2, 1.0], ["stone_smallA", 5, 4.5, 1.1]]} t={t} tint="#8e94c8" />
    {[[-2.2, 3.6, "#ffd0c0"], [1.4, 4.4, "#ffe8b0"], [-4.4, 5.2, "#f0c8ff"], [3.6, 2.2, "#ffffff"], [-1.0, 1.4, "#ffc8b8"], [5.8, 5.6, "#ffe0c0"]].map(([x, z, col], i) =>
      <group key={i} position={[x as number, 0.06, z as number]} rotation={[0, rnd(i) * 6, 0]}><mesh rotation={[-Math.PI / 2 + 0.25, 0, 0]} scale={[1, 1.2, 0.45]}><sphereGeometry args={[0.15, 12, 8, 0, TAU, 0, Math.PI / 2]} /><meshToonMaterial color={col as string} gradientMap={toonRamp} /></mesh></group>)}
    {[[-5, 0.3], [4.2, 0.9], [8.5, 2.5]].map(([x, z], i) => <mesh key={i} rotation={[-Math.PI / 2, 0, rnd(i) * 3]} position={[x, 0.03, z]}><planeGeometry args={[1.6, 0.8]} /><meshBasicMaterial map={weedTex()} transparent depthWrite={false} /></mesh>)}
    {[[-3.2, 0.8, 1.5], [6.2, 3.0, 1.1]].map(([x, z, r], i) => <group key={i} position={[x, 0.025, z]}><mesh rotation={[-Math.PI / 2, 0, 0]} scale={[r, r * 0.55, 1]}><circleGeometry args={[1, 32]} /><meshBasicMaterial color="#3a78b8" transparent opacity={0.8} /></mesh>
      <SGlow p={[0.3, 0.05, 0]} r={0.25} color="#ffffff" o={0.5 + 0.5 * Math.sin(t * 2 + i)} /><mesh rotation={[-Math.PI / 2, 0, 0]} scale={[r, r * 0.55, 1]}><ringGeometry args={[0.92, 1, 32]} /><meshBasicMaterial color="#cfe6ff" transparent opacity={0.5} /></mesh></group>)}
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
    {children}
  </Lights>);
};
void KModel; void noise1;
