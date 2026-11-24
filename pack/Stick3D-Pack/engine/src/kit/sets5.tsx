// SCENE KIT v19 (EP10 "The Floor Is Lava"): LavaPark — a sunny park whose ground turns into lava and back.
//   One continuous set so every shot shares the same layout: lawn terrace A (start) -> 2 stepping stones -> big gap -> bridge-head stone
//   -> wooden plank bridge (collapses plank by plank) -> terrace B (reset button). A far grass bank with trees never turns to lava.
//   Ground = one shader plane: grass <-> lava (crack network spreads from a centre, then the lava floods out), animated flow + crust.
//   Reusable pieces: LavaGround, Terrace, PlankBridge, ResetButton, LavaLife (bubbles, steam, embers).
import React, { useMemo } from "react";
import * as THREE from "three";
import { V3 } from "../style/kit";
import { canvasTex } from "../style/set3d";
import { SGlow } from "../style/sky";
import { Grass } from "./world";
import { KModel } from "./envlib";
import { PuffSmoke } from "./puff";
import { SkyGrad, CloudStrips, HillLayer, GroundHaze, Motes, Props, PropSpec, Lights, mixC, rnd, toonRamp } from "./diorama";
import { QC } from "./qc";

const cl = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const sm = (x: number) => { const u = cl(x); return u * u * (3 - 2 * u); };
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

/* ---------------- layout (world units, hero h = 3) ---------------- */
export const TOP = 0.45; // walking height of every terrace / stone / the bridge
export const LP = {
  A: [0, 0, 0] as V3, rA: 2.3,                      // start lawn terrace
  S1: [3.3, 0, 0.15] as V3, S2: [6.0, 0, -0.05] as V3, rS: 0.85, // stepping stones
  H: [11.4, 0, 0] as V3, rH: 1.25,                  // bridge-head stone (after the big gap)
  b0: 12.5, b1: 20.6, N: 23,                        // bridge x range + plank count
  B: [23.8, 0, 0] as V3, rB: 3.0,                   // terrace B (button)
  BTN: [24.9, 0, -0.9] as V3,                       // reset button pedestal (on B)
};
export const plankX = (i: number) => LP.b0 + ((i + 0.5) / LP.N) * (LP.b1 - LP.b0);
export const bridgeY = (x: number) => TOP - 0.22 * Math.sin(Math.PI * cl((x - LP.b0) / (LP.b1 - LP.b0)));

/* ---------------- ground shader: grass <-> lava ---------------- */
const VS = `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const FS = `
uniform float uLava, uCrack, uTime, uR0; uniform vec2 uC; uniform vec3 uFog; uniform float uFogN, uFogF; varying vec3 vW;
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
float fbm(vec2 p){ float s=0.0, a=0.5; for(int i=0;i<5;i++){ s+=a*n(p); p=p*2.03+vec2(1.7,9.2); a*=0.5; } return s; }
vec2 vor(vec2 p){ vec2 i=floor(p), f=fract(p); float d1=8.0, d2=8.0; for(int y=-1;y<=1;y++) for(int x=-1;x<=1;x++){ vec2 g=vec2(x,y); vec2 o=vec2(h(i+g), h(i+g+17.3)); float d=length(g+o-f); if(d<d1){ d2=d1; d1=d; } else if(d<d2) d2=d; } return vec2(d1, d2-d1); }
void main(){
  vec2 p = vW.xz; float r = length(p - uC);
  // grass: two greens + mown stripes + darker patches
  float g = fbm(p*0.35); vec3 grass = mix(vec3(0.33,0.70,0.26), vec3(0.45,0.80,0.30), g); grass *= 0.92 + 0.08*sin(p.x*1.1);
  grass = mix(grass, vec3(0.26,0.56,0.22), smoothstep(0.55,0.75,fbm(p*0.12+3.0))*0.5);
  // lava: flowing fbm, hot yellow veins, dark floating crust plates with glowing rims
  vec2 q = p*0.32 + vec2(uTime*0.05, -uTime*0.035); float f = fbm(q + fbm(q*1.7 + uTime*0.04));
  vec3 lava = mix(vec3(0.55,0.05,0.02), vec3(1.0,0.38,0.02), smoothstep(0.25,0.7,f)); lava = mix(lava, vec3(1.0,0.86,0.35), smoothstep(0.68,0.85,f));
  vec2 v = vor(p*0.55 + vec2(uTime*0.03, uTime*0.02)); float plate = smoothstep(0.10,0.18,v.y) * smoothstep(0.5,0.62,fbm(p*0.4+7.0));
  lava = mix(lava, vec3(0.16,0.07,0.06) + 0.04*n(p*6.0), plate*0.92);
  // crack network spreading from uC (radius uCrack * 46), then the flood (radius uLava * 70)
  vec2 cv = vor(p*0.75); float line = 1.0 - smoothstep(0.0, 0.07, cv.y);
  float reach = uR0 + uCrack*46.0; float cm = smoothstep(reach, reach-2.5, r);
  float flood = smoothstep(uLava*70.0, uLava*70.0 - 6.0, r + (fbm(p*0.3)-0.5)*8.0) * step(0.001, uLava);
  vec3 col = grass;
  col = mix(col, vec3(0.20,0.10,0.06), line*cm*0.7);                       // dark split in the turf
  col += vec3(1.0,0.45,0.05) * line*cm * (0.85 + 0.25*sin(uTime*6.0 + r));  // glowing seam
  col = mix(col, lava, flood);
  float d = distance(cameraPosition, vW); col = mix(col, uFog, smoothstep(uFogN, uFogF, d));
  gl_FragColor = vec4(col, 1.0);
}`;
export const LavaGround: React.FC<{ t: number; lava: number; crack: number; c?: [number, number]; r0?: number; fog: string }> = ({ t, lava, crack, c = [0, 0], r0 = 0, fog }) => {
  const mat = useMemo(() => new THREE.ShaderMaterial({ vertexShader: VS, fragmentShader: FS, uniforms: { uLava: { value: 0 }, uCrack: { value: 0 }, uTime: { value: 0 }, uR0: { value: 0 }, uC: { value: new THREE.Vector2() }, uFog: { value: new THREE.Color() }, uFogN: { value: 40 }, uFogF: { value: 150 } } }), []);
  mat.uniforms.uLava.value = lava; mat.uniforms.uCrack.value = crack; mat.uniforms.uTime.value = t; mat.uniforms.uR0.value = crack > 0 ? r0 : -10; mat.uniforms.uC.value.set(c[0], c[1]); mat.uniforms.uFog.value.set(fog);
  return <mesh rotation={[-Math.PI / 2, 0, 0]} position={[12, 0, -20]} material={mat}><planeGeometry args={[300, 220, 1, 1]} /></mesh>;
};

/* ---------------- toon solid with ink outline (inverted hull) ---------------- */
const Ink: React.FC<{ children: React.ReactNode; s?: number }> = ({ children }) => <>{children}</>;
const Solid: React.FC<{ p: V3; geo: React.ReactNode; color: string; rot?: V3; scale?: V3; line?: number }> = ({ p, geo, color, rot = [0, 0, 0], scale = [1, 1, 1], line = 0.035 }) => (
  <group position={p} rotation={rot} scale={scale}>
    <mesh>{geo}<meshToonMaterial color={color} gradientMap={toonRamp} /></mesh>
    <mesh scale={[1 + line, 1 + line * 1.5, 1 + line]}>{geo}<meshBasicMaterial color="#1A1A1A" side={THREE.BackSide} /></mesh>
  </group>
);
const rockTex = () => canvasTex("rock19", 512, 256, (c, W, H) => { c.fillStyle = "#8a8d9c"; c.fillRect(0, 0, W, H);
  for (let i = 0; i < 120; i++) { const x = rnd(i) * W, y = rnd(i * 3) * H, r = 8 + rnd(i * 5) * 26; c.fillStyle = i % 3 ? "rgba(60,60,80,0.18)" : "rgba(255,255,255,0.14)"; c.beginPath(); c.ellipse(x, y, r * 1.6, r, 0, 0, Math.PI * 2); c.fill(); }
  for (let i = 0; i < 14; i++) { c.strokeStyle = "rgba(40,40,56,0.45)"; c.lineWidth = 3; c.beginPath(); const x = rnd(i * 7) * W; c.moveTo(x, 0); c.lineTo(x + (rnd(i) - 0.5) * 60, H * (0.4 + rnd(i * 9) * 0.5)); c.stroke(); } }, [3, 1]);
/* terrace / stepping stone: rocky drum, grass (or mossy) cap, hot glow ring at the base when the lava is up */
export const Terrace: React.FC<{ p: V3; r: number; top?: number; grass?: boolean; hot?: number; t: number; seed?: number }> = ({ p, r, top = TOP, grass = true, hot = 0, t, seed = 1 }) => {
  const tex = rockTex(), hgt = top + 1.2, geo = <cylinderGeometry args={[r, r * 1.12, hgt, 28, 1]} />;
  return (<group>
    <group position={[p[0], top - hgt / 2, p[2]]}>
      <mesh>{geo}<meshToonMaterial color="#b6b8c6" map={tex} gradientMap={toonRamp} /></mesh>
      <mesh scale={[1.03, 1.0, 1.03]}>{geo}<meshBasicMaterial color="#1A1A1A" side={THREE.BackSide} /></mesh>
    </group>
    <mesh position={[p[0], top + 0.005, p[2]]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[r * 0.985, 40]} /><meshToonMaterial color={grass ? "#5fbf47" : "#9aa0ae"} gradientMap={toonRamp} /></mesh>
    {grass ? <Grass t={t} area={[r * 1.3, r * 1.1]} c={[p[0], top, p[2] - r * 0.15]} n={Math.round(140 * r * r)} colors={["#4fae3f", "#62c24a", "#3f9a3a"]} h={0.16} wd={0.5} /> : null}
    {hot > 0.01 ? <SGlow p={[p[0], 0.08, p[2]]} r={r * 1.7} color="#ff7a1a" o={0.45 * hot} /> : null}
    {void seed}
  </group>);
};

/* ---------------- plank bridge: sagging planks + rope rails; fall[i] = time plank i drops (Infinity = stays) ---------------- */
const woodTex = () => canvasTex("wood19", 256, 64, (c, W, H) => { c.fillStyle = "#b07a46"; c.fillRect(0, 0, W, H); for (let i = 0; i < 18; i++) { c.strokeStyle = i % 2 ? "rgba(90,50,20,0.35)" : "rgba(255,220,170,0.25)"; c.lineWidth = 2; c.beginPath(); c.moveTo(0, rnd(i) * H); c.bezierCurveTo(W * 0.3, rnd(i * 3) * H, W * 0.6, rnd(i * 5) * H, W, rnd(i * 7) * H); c.stroke(); }
  c.fillStyle = "#3a2410"; for (const x of [18, W - 18]) { c.beginPath(); c.arc(x, H / 2, 4, 0, Math.PI * 2); c.fill(); } });
export function plankFall(t: number, tf: number, i: number) { // -> {dy, rx, rz, gone, wob}
  if (t < tf - 0.3) return { dy: 0, rx: 0, rz: 0, gone: false, wob: 0 };
  if (t < tf) { const w = Math.sin((t - tf) * 60 + i) * 0.03 * (1 - (tf - t) / 0.3); return { dy: 0, rx: w, rz: w * 0.6, gone: false, wob: 1 }; } // creak: shiver before the drop
  const u = t - tf, dy = -0.5 * 9.8 * u * u - 0.6 * u; return { dy, rx: u * (1.6 + rnd(i) * 2) * (i % 2 ? 1 : -1), rz: u * (rnd(i * 3) - 0.5) * 3, gone: dy < -1.2, wob: 0 };
}
export const PlankBridge: React.FC<{ t: number; fall: number[] }> = ({ t, fall }) => {
  const tex = woodTex(), W = 1.25;
  const lastStand = (side: number) => side; void lastStand;
  return (<group>
    {Array.from({ length: LP.N }, (_, i) => { const x = plankX(i), y = bridgeY(x), f = plankFall(t, fall[i] ?? Infinity, i); if (f.gone) return null;
      return <Solid key={i} p={[x, y - 0.05 + f.dy, (rnd(i) - 0.5) * 0.05]} rot={[f.rx, (rnd(i * 2) - 0.5) * 0.08, f.rz]} color="#c48a52" line={0.05}
        geo={<boxGeometry args={[(LP.b1 - LP.b0) / LP.N * 0.82, 0.09, W]} />} />; })}
    {/* rope rails: posts at both ends, rope segments between hanging points (segment drops with its plank) */}
    {[LP.b0 - 0.15, LP.b1 + 0.15].map((x, j) => [-1, 1].map((s) => <Solid key={"p" + j + s} p={[x, TOP + 0.45, s * W * 0.52]} color="#8a5a2e" geo={<cylinderGeometry args={[0.07, 0.08, 1.1, 10]} />} />))}
    {[-1, 1].map((s) => Array.from({ length: LP.N }, (_, i) => { const x = plankX(i), f = plankFall(t, fall[i] ?? Infinity, i); if (f.gone) return null; const y = bridgeY(x) + 0.78 - 0.06 * Math.sin(Math.PI * (i + 0.5) / LP.N);
      return <mesh key={"r" + s + i} position={[x, y + f.dy * 0.9, s * W * 0.52]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.025, 0.025, (LP.b1 - LP.b0) / LP.N * 1.02, 6]} /><meshToonMaterial color="#d8c08a" gradientMap={toonRamp} /></mesh>; }))}
    {/* vertical hangers every 2 planks */}
    {[-1, 1].map((s) => Array.from({ length: LP.N }, (_, i) => { if (i % 2) return null; const x = plankX(i), f = plankFall(t, fall[i] ?? Infinity, i); if (f.gone) return null; const y = bridgeY(x);
      return <mesh key={"h" + s + i} position={[x, y + 0.38 + f.dy, s * W * 0.52]}><cylinderGeometry args={[0.018, 0.018, 0.78, 5]} /><meshToonMaterial color="#c8ad78" gradientMap={toonRamp} /></mesh>; }))}
    {void tex}
  </group>);
};

/* ---------------- reset button: striped pedestal, big red dome (press 0..1), RESET plate, pulse glow ---------------- */
const stripeTex = () => canvasTex("stripe19", 512, 64, (c, W, H) => { c.fillStyle = "#ffd21f"; c.fillRect(0, 0, W, H); c.fillStyle = "#1A1A1A"; for (let x = -H; x < W + H; x += 64) { c.beginPath(); c.moveTo(x, H); c.lineTo(x + 32, H); c.lineTo(x + 32 + H, 0); c.lineTo(x + H, 0); c.closePath(); c.fill(); } }, [1, 1]);
const plateTex = () => canvasTex("plate19", 512, 160, (c, W, H) => { c.fillStyle = "#1A1A1A"; c.beginPath(); c.roundRect(0, 0, W, H, 28); c.fill(); c.fillStyle = "#f4f4f4"; c.beginPath(); c.roundRect(10, 10, W - 20, H - 20, 22); c.fill();
  c.fillStyle = "#d62828"; c.font = "900 104px Inter, Arial"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("RESET", W / 2, H / 2 + 6); });
export const ResetButton: React.FC<{ p: V3; t: number; press?: number; glow?: number; ry?: number }> = ({ p, t, press = 0, glow = 0, ry = 0.35 }) => {
  const st = stripeTex(), pl = plateTex(), y0 = p[1] + TOP;
  return (<group position={[p[0], y0, p[2]]} rotation={[0, ry, 0]}>
    <Solid p={[0, 0.5, 0]} color="#5a5e72" geo={<cylinderGeometry args={[0.42, 0.55, 1.0, 24]} />} />
    <mesh position={[0, 0.86, 0]}><cylinderGeometry args={[0.435, 0.435, 0.16, 32, 1, true]} /><meshToonMaterial map={st} gradientMap={toonRamp} /></mesh>
    <Solid p={[0, 1.02, 0]} color="#c9ccd8" geo={<cylinderGeometry args={[0.5, 0.46, 0.08, 28]} />} />
    <Solid p={[0, 1.06 - press * 0.12, 0]} color="#e3262b" scale={[1, 0.62 - press * 0.25, 1]} geo={<sphereGeometry args={[0.36, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />} />
    <mesh position={[-0.12, 1.22 - press * 0.12, 0.12]}><sphereGeometry args={[0.07, 12, 8]} /><meshBasicMaterial color="#ffb0a8" transparent opacity={0.8} /></mesh>
    <mesh position={[0, 0.5, 0.56]} rotation={[0, 0, 0]}><planeGeometry args={[0.78, 0.245]} /><meshBasicMaterial map={pl} transparent toneMapped={false} /></mesh>
    {glow > 0.01 && !QC ? <SGlow p={[0, 1.15, 0]} r={1.1 + 0.15 * Math.sin(t * 7)} color="#ff4a3a" o={0.5 * glow} /> : null}
  </group>);
};

/* ---------------- lava life: bubbles that pop, steam puffs, rising embers ---------------- */
const BUB: [number, number][] = Array.from({ length: 26 }, (_, i) => [-6 + rnd(i) * 34, -8 + rnd(i * 7) * 13]);
export const LavaLife: React.FC<{ t: number; k: number; avoid?: (x: number, z: number) => boolean }> = ({ t, k, avoid }) => {
  if (k < 0.05) return null;
  return (<group>
    {BUB.map(([x, z], i) => { if (avoid && avoid(x, z)) return null; const per = 1.6 + rnd(i * 3) * 1.4, u = ((t + rnd(i) * 5) % per) / per, r = 0.08 + 0.22 * sm(u / 0.85) * k, pop = u > 0.85;
      return pop ? <SGlow key={i} p={[x, 0.1, z]} r={0.5 * k} color="#ffd36a" o={(1 - (u - 0.85) / 0.15) * 0.7} /> :
        <mesh key={i} position={[x, 0.02, z]} scale={[1, 0.6, 1]}><sphereGeometry args={[r, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshBasicMaterial color={u > 0.6 ? "#ffcf4a" : "#ff8a1a"} toneMapped={false} /></mesh>; })}
    {!QC ? [[-3, -6], [8.5, -7], [17, -8], [29, -6]].map(([x, z], i) => <PuffSmoke key={"s" + i} src={[x, 0.2, z]} t={t} t0={-3 + i * 0.4} rate={1.6} vel={[0.1, 0.9, 0]} spread={0.8} size={0.3 * k} life={2.0} color="#ddd2cc" seed={i + 3} rise={0.6} max={8} />) : null}
    {!QC ? <Motes t={t} n={40} c={[10, 1.8, -2]} area={[30, 3.5, 12]} color="#ffb04a" size={0.04} o={0.85 * k} /> : null}
  </group>);
};

/* ---------------- far bank (never lava): raised grass strip, trees, bushes, fence; mid rocks in the lava field ---------------- */
const BANK: PropSpec[] = [
  ["tree_oak", -9, -13, 3.4], ["tree_fat", -3, -15, 3.2], ["tree_detailed", 4, -14, 3.6], ["tree_default", 10, -15.5, 3.2], ["tree_oak", 16, -13.5, 3.4], ["tree_fat", 22, -15, 3.4], ["tree_detailed", 29, -14, 3.4], ["tree_pineRoundA", 34, -16, 3.2],
  ["plant_bushLarge", -6, -11.2, 1.8], ["plant_bush", 1, -11, 1.5], ["plant_bushDetailed", 7.5, -11.4, 1.7], ["plant_bushLarge", 13, -11.2, 1.8], ["plant_bush", 19, -11, 1.5], ["plant_bushLarge", 26, -11.4, 1.8],
  ["flower_yellowA", -4, -10.6, 1.3], ["flower_redA", 3, -10.5, 1.2], ["flower_purpleA", 11, -10.6, 1.3], ["flower_yellowA", 17.5, -10.5, 1.2], ["flower_redA", 24, -10.6, 1.3],
];
const FENCE: PropSpec[] = Array.from({ length: 22 }, (_, i) => ["fence_simple", -10 + i * 2.0, -10.2, 1.6, 0] as PropSpec);
/* things on the terraces (normal day: picnic on A, flowers + a sign near B) */
const ON_A: PropSpec[] = [["flower_yellowA", -1.4, -1.2, 1.2], ["flower_redA", 1.5, -1.3, 1.1], ["plant_bush", -1.7, -0.2, 1.1], ["mushroom_red", 1.2, 1.1, 1.0]];
const ON_B: PropSpec[] = [["plant_bushDetailed", 25.9, -1.6, 1.3], ["flower_purpleA", 22.4, -1.6, 1.2], ["flower_yellowA", 26.1, 0.9, 1.1], ["rock_smallC", 21.7, 1.3, 1.0], ["tree_default", 26.0, -2.2, 2.2]];
const IN_LAVA: PropSpec[] = [["rock_largeA", -5, -5, 1.6], ["rock_tallA", 9, -6.5, 1.5], ["rock_largeB", 18, -7, 1.7], ["rock_smallA", 14.5, 3.6, 1.3], ["rock_largeA", 28, -4, 1.5], ["stone_largeA", -4.5, 3.2, 1.4]];

export type LavaParkProps = { t: number; bgT?: number; lava: number; crack: number; crackC?: [number, number]; crackR0?: number; fall?: number[]; press?: number; btnGlow?: number; picnic?: number; children?: React.ReactNode };
export const LavaPark: React.FC<LavaParkProps> = ({ t, bgT, lava, crack, crackC = [0, 0], crackR0 = 0, fall = [], press = 0, btnGlow = 0, picnic = 1, children }) => {
  const b = bgT ?? t, heat = cl(Math.max(lava, crack * 0.45)), fog = mixC("#cfe6ff", "#ffb58a", heat);
  const look = { rim: heat > 0.3 ? "255,150,70" : "255,236,200", shade: heat > 0.3 ? "60,10,0" : "30,30,70", rimK: lerp(0.4, 0.62, heat) };
  return (<Lights amb={lerp(0.85, 0.7, heat)} keyL={[[-20, 30, 18], mixC("#fff4dc", "#ffd0a0", heat), 1.25]} fill={[[10, 4, 12], mixC("#a8c4ff", "#ff7a3a", heat), lerp(0.35, 0.6, heat)]} look={look} fog={[fog, 45, 150]}>
    <SkyGrad a={["#4f9cf0", "#86c2ff", "#d9eeff"]} b={["#5a3a8a", "#e0603a", "#ffc070"]} k={heat * 0.85} horizon="rgba(255,255,255,0.6)" hk={0.5} />
    <SGlow p={[-34, 34, -90]} r={12} color="#fff6c8" o={0.75} /><SGlow p={[-34, 34, -90]} r={28} color="#fff3b0" o={0.25} />
    <CloudStrips t={b} n={5} y={22} z={-80} span={160} speed={1.2} tone="rgba(255,255,255,0.75)" rim="rgba(255,255,255,0.5)" />
    <HillLayer p={[10, 7, -120]} s={[320, 70]} o={{ seed: 21, tone: mixC("#7f9fd0", "#a06a8a", heat), rim: "rgba(255,255,255,0.45)", top: 0.42, amp: 0.13, trees: 60 }} />
    <HillLayer p={[14, 3.4, -70]} s={[220, 44]} t={b} o={{ seed: 25, tone: mixC("#5fa36a", "#7a7a5a", heat * 0.6), rim: "rgba(255,255,255,0.45)", top: 0.45, amp: 0.1, trees: 44, village: true, roof: "#d0604a" }} />
    <GroundHaze t={b} layers={[[-40, 1.4, 160], [-62, 2.6, 220]]} col={heat > 0.4 ? "rgba(255,170,120,0.5)" : "rgba(230,240,255,0.5)"} o={0.5} />
    {/* far bank: raised grass strip (never lava) */}
    <mesh position={[12, 0.25, -16]} ><boxGeometry args={[120, 0.5, 12]} /><meshToonMaterial color="#5cb446" gradientMap={toonRamp} /></mesh>
    <mesh position={[12, 0.5, -10.05]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.04, 0.04, 120, 6]} /><meshBasicMaterial color="#1A1A1A" /></mesh>
    <Props list={BANK} t={b} y={0.5} />
    <Props list={FENCE} t={b} y={0.5} sway={0} />
    <Grass t={b} area={[44, 3]} c={[12, 0.5, -11.6]} n={900} colors={["#4fae3f", "#62c24a", "#3f9a3a"]} h={0.3} />
    <LavaGround t={t} lava={lava} crack={crack} c={crackC} r0={crackR0} fog={fog} />
    <Props list={IN_LAVA} t={b} sway={0} />
    {/* walkable pieces */}
    <Terrace p={LP.A} r={LP.rA} t={b} hot={lava} />
    <Terrace p={LP.S1} r={LP.rS} t={b} grass={false} hot={lava} top={TOP} />
    <Terrace p={LP.S2} r={LP.rS} t={b} grass={false} hot={lava} top={TOP} />
    <Terrace p={LP.H} r={LP.rH} t={b} grass={false} hot={lava} top={TOP} />
    <Terrace p={LP.B} r={LP.rB} t={b} hot={lava} />
    <PlankBridge t={t} fall={fall} />
    <Props list={ON_A} t={b} y={TOP} />
    <Props list={ON_B} t={b} y={TOP} />
    {picnic > 0 ? <Picnic p={[-0.9, TOP, -0.9]} /> : null}
    <ResetButton p={LP.BTN} t={t} press={press} glow={btnGlow} />
    <LavaLife t={t} k={lava} avoid={(x, z) => Math.hypot(x - LP.B[0], z) < LP.rB + 0.5 || Math.hypot(x, z) < LP.rA + 0.5 || (x > LP.b0 - 1 && x < LP.b1 + 1 && Math.abs(z) < 1.4)} />
    {lava > 0.05 ? <pointLight position={[10, 0.6, 2]} color="#ff7a2a" intensity={1.4 * lava} distance={30} /> : null}
    <Motes t={b} n={24} c={[10, 2, 0]} area={[30, 3, 6]} color="#fff8dc" o={0.3 * (1 - heat)} />
    {children}
  </Lights>);
};
/* picnic blanket + lemonade glass (normal day, terrace A) */
const blanketTex = () => canvasTex("blanket19", 256, 256, (c, W, H) => { c.fillStyle = "#ffffff"; c.fillRect(0, 0, W, H); c.fillStyle = "rgba(220,40,50,0.85)"; for (let i = 0; i < 8; i += 2) { c.fillRect(i * 32, 0, 32, H); c.fillRect(0, i * 32, W, 32); } });
const Picnic: React.FC<{ p: V3 }> = ({ p }) => (<group position={p}>
  <mesh rotation={[-Math.PI / 2, 0, 0.4]} position={[0, 0.012, 0]}><planeGeometry args={[1.4, 1.1]} /><meshToonMaterial map={blanketTex()} gradientMap={toonRamp} /></mesh>
  <Solid p={[0.3, 0.12, 0.1]} color="#fff6a8" geo={<cylinderGeometry args={[0.07, 0.06, 0.22, 14]} />} />
  <Solid p={[-0.25, 0.08, -0.15]} color="#c88a4a" geo={<boxGeometry args={[0.36, 0.16, 0.26]} />} />
</group>);
void Ink;
