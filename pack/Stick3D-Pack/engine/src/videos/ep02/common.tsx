// EP02 shared: format, cuts, scene wrapper (5 transitions), captions, hero, meadow world, sky-kingdom world.
import React from "react";
import * as THREE from "three";
import { AbsoluteFill, Sequence, useCurrentFrame, interpolate, Easing } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { Box, Cyl, Ball, CanvasPlane, INK } from "../../style/toon";
import { Look, Pose } from "../../style/puppet";
import { Person, seg, lerp, clamp, V3 } from "../../style/kit";
import { FaceGroup, hand } from "../../style/extra";
import { SkyDome, Cloud, Island, Tree, Flower, Bridge, Windmill, Bird, Castle, Crystal, ChalkKey, SGlow, Lightning, Sparkles, PlankFx } from "../../style/sky";
import WORDS from "../../../public/ep02/words.json";
import SCRIPT from "../../../public/ep02/script.json";

export const FPS = 30, LEAD = 6, TAIL = 8, WALK = 3.4, VW = 1080, VH = 1920, HH = 3.4;
export type Ctx = { t: number; f: number };
export type Trans = "ghost" | "zoom" | "flash" | "whip" | "whipL" | "cut" | "iris" | "whip2"; // whip2 = clean whip-pan: hard cut hidden inside a fast blurred pan (outgoing pans out, incoming pans in, never both visible) // v17: "cut" = hard cut, "iris" = circle opens over the previous shot (no double exposure)
export { seg, lerp, clamp };
export type { V3 };
export const ease = { io: Easing.inOut(Easing.cubic), o: Easing.out(Easing.cubic), i: Easing.in(Easing.quad), sin: Easing.inOut(Easing.sin), back: Easing.out(Easing.back(2.2)), lin: Easing.linear };
// spoken-word anchor (seconds) by index in words.json
export const W = (i: number) => WORDS[i].start;

/* the channel hero */
export const STICKMAN: Look = { skin: "#ffffff", body: "#e8342e", outfit: "hoodiePro", hair: "tufts", hairColor: "#111216", eyes: "bean", sleeve: true, gloves: "#ffffff", backpack: "#3a3b46", shoe: "#e8342e", sole: "#ffffff" };
export type HPose = Omit<Pose, "t"> & { t?: number };
export const Hero: React.FC<{ p: V3; f: number; pose: HPose; h?: number; sy?: number; shadow?: boolean }> = ({ p, f, pose, h = HH, sy, shadow = true }) => <Person p={p} h={h} res={768} look={STICKMAN} f={f} pose={pose} sy={sy} shadow={shadow} />;
// chalk key held in the hero's right hand; ang = direction of the key shaft (radians, screen space). Returns the element.
export const HeldKey: React.FC<{ P: V3; arm: [number, number]; ang: number; sq?: number; flip?: boolean; glow?: number; s?: number; spin?: number }> = ({ P, arm, ang, sq = 0, flip = false, glow = 1, s = 0.55, spin = 0 }) => (
  <FaceGroup p={P}><ChalkKey p={hand(HH, arm, sq, flip, 0.1)} rot={[spin, 0, flip ? Math.PI - ang : ang]} s={s} glow={glow} /></FaceGroup>
);
// IK target that puts the key TIP on a local point (x right, y up, puppet units)
export const armForTip = (tip: [number, number], ang: number, s = 0.55): [number, number] => [tip[0] - Math.cos(ang) * s / HH, tip[1] - Math.sin(ang) * s / HH];
export const walkPhase = (dist: number) => dist * WALK;
// meadow hill height (sphere r40 centred (0,-40,-6))
export const gy = (x: number, z: number) => Math.sqrt(Math.max(0, 1600 - x * x - (z + 6) * (z + 6))) - 40;
export const yawTo = (cam: V3, p: V3) => Math.atan2(cam[0] - p[0], cam[2] - p[2]);
export const toWorld = (p: V3, loc: V3, cam: V3): V3 => { const y = yawTo(cam, p); return [p[0] + loc[0] * Math.cos(y) + loc[2] * Math.sin(y), p[1] + loc[1], p[2] - loc[0] * Math.sin(y) + loc[2] * Math.cos(y)]; };

/* ---------- scene wrapper ---------- */
export const Scene: React.FC<{ start: number; end: number; first?: boolean; trans?: Trans; exit?: Trans; bg: string; fog?: [string, number, number]; children: (c: Ctx) => React.ReactNode }> = ({ start, end, first, trans = "ghost", exit, bg, fog, children }) => {
  const from = Math.round(start * FPS) - (first || trans === "cut" || trans === "whip2" ? 0 : LEAD), dur = Math.min(3000, Math.round(end * FPS) + TAIL) - from;
  return <Sequence from={from} durationInFrames={dur} layout="none"><Inner from={from} first={first} trans={trans} exit={exit} endF={Math.round(end * FPS)} bg={bg} fog={fog} children={children} /></Sequence>;
};
const Inner: React.FC<{ from: number; first?: boolean; trans: Trans; exit?: Trans; endF?: number; bg: string; fog?: [string, number, number]; children: (c: Ctx) => React.ReactNode }> = ({ from, first, trans, exit, endF = 1e9, bg, fog, children }) => {
  const f = useCurrentFrame(), t = (f + from) / FPS;
  const W2 = 5, kin = !first && trans === "whip2" ? Easing.out(Easing.cubic)(clamp(f / W2)) : 1, kout = exit === "whip2" ? Easing.in(Easing.cubic)(clamp((f + from - (endF - W2)) / W2)) : 0;
  const wp = (1 - kin) - kout, wpx = wp * 230, wsc = 1 + Math.abs(wp) * 0.12, wbl = 0; // v18: no blur on the frame (character stays sharp) -> motion streaks instead
  const k = first || trans === "cut" || trans === "whip2" ? 1 : clamp(f / (LEAD + 2)), ke = Easing.out(Easing.cubic)(k);
  const iris = !first && trans === "iris" && k < 1 ? `circle(${(Easing.inOut(Easing.cubic)(k) * 1300).toFixed(0)}px at 50% 40%)` : undefined;
  const sc = !first && trans === "zoom" ? lerp(1.35, 1, ke) : 1;
  const whip = !first && (trans === "whip" || trans === "whipL");
  const tx = (whip ? (1 - ke) * VW * (trans === "whipL" ? -1 : 1) : 0) + wpx, blur = (whip ? (1 - ke) * 20 : 0) + wbl;
  return (
    <AbsoluteFill style={{ clipPath: iris, opacity: first || trans === "flash" || trans === "cut" || trans === "iris" || trans === "whip2" || whip ? 1 : k, transform: `translateX(${tx}px) scale(${sc * wsc})`, background: bg, filter: `saturate(1.25) contrast(1.06)${blur > 0.2 ? ` blur(${blur.toFixed(1)}px)` : ""}` }}>
      <ThreeCanvas width={VW} height={VH} flat camera={{ fov: 55, position: [0, 2, 8], near: 0.1, far: 400 }} gl={{ antialias: true }}>
        <color attach="background" args={[bg]} />
        {fog ? <fog attach="fog" args={fog} /> : null}
        {children({ t, f })}
      </ThreeCanvas>
      {Math.abs(wp) > 0.02 ? <Streaks k={Math.abs(wp)} dir={Math.sign(wp)} f={f} /> : null}
      {!first && trans === "flash" ? <AbsoluteFill style={{ background: "#fff", opacity: 1 - clamp(f / 8) }} /> : null}
      {!first && trans === "whipL" ? <ChalkSwoosh k={clamp(f / 12)} /> : null}
    </AbsoluteFill>
  );
};
// hand-drawn chalk swoosh streak used by the "rewind" transition
const ChalkSwoosh: React.FC<{ k: number }> = ({ k }) => k >= 1 ? null : (
  <svg width={VW} height={VH} style={{ position: "absolute", inset: 0 }}>
    <path d={`M ${VW + 80} 640 C ${VW * 0.6} 520, ${VW * 0.4} 900, -80 760`} stroke="rgba(150,240,255,0.9)" strokeWidth={70} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - Math.min(1, k * 2.2)} opacity={1 - k} />
    <path d={`M ${VW + 80} 640 C ${VW * 0.6} 520, ${VW * 0.4} 900, -80 760`} stroke="#ffffff" strokeWidth={22} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - Math.min(1, k * 2.2)} opacity={1 - k} />
  </svg>
);

/* ---------- captions (pack style: 1-2 words, word-synced, y ~69%) ---------- */
type G = { text: string; a: number };
const groups: G[] = (() => {
  const g: G[] = []; let cur: number[] = [];
  const flush = () => { if (cur.length) { g.push({ text: cur.map((i) => String(SCRIPT[i]).replace(/[.,!?;:…]+$/, "")).join(" "), a: WORDS[cur[0]].start }); cur = []; } };
  WORDS.forEach((_, i) => { cur.push(i); if (cur.length === 2 || /[.,!?;:]$/.test(String(SCRIPT[i])) || (WORDS[i + 1] && WORDS[i + 1].start - WORDS[i].end > 0.35)) flush(); });
  flush(); return g;
})();
export const Captions: React.FC<{ until: number }> = ({ until }) => {
  const f = useCurrentFrame(), t = f / FPS;
  if (t >= until) return null;
  const idx = groups.findIndex((g, i) => t >= g.a - 0.02 && t < (groups[i + 1]?.a ?? 999) - 0.02); if (idx < 0) return null; const g = groups[idx];
  // hide a caption that has been on screen a long time during a pause (> 1.6 s after its start and the voice is silent)
  const wEnd = (() => { let e = 0; for (const w of WORDS) if (w.start <= t) e = w.end; return e; })();
  if (t - wEnd > 0.6 && t - g.a > 1.2) return null;
  const sc = interpolate(t - g.a, [0, 0.12], [0.75, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.back(2.6)) });
  return <div style={{ position: "absolute", left: 45, right: 45, top: 1290, textAlign: "center", fontFamily: "Inter, Arial", fontWeight: 900, fontSize: 132, lineHeight: 1.05, color: "#fff", WebkitTextStroke: "18px #000", paintOrder: "stroke fill", transform: `scale(${sc})`, textShadow: "0 12px 0 rgba(0,0,0,.35)", textTransform: "uppercase", letterSpacing: 1 }}>{g.text}</div>;
};

/* ---------- MEADOW world (scenes 1-4) ---------- */
const rnd = (i: number) => { const x = Math.sin(i * 91.7 + 17.3) * 43758.5453; return x - Math.floor(x); };
export const GrassBlades: React.FC<{ t: number; c: V3; area: [number, number]; n?: number; wind?: number; seed?: number }> = ({ t, c, area, n = 60, wind = 1, seed = 1 }) => (
  <>{Array.from({ length: n }, (_, i) => { const x = c[0] + (rnd(i + seed) - 0.5) * area[0], z = c[2] + (rnd(i * 3 + seed) - 0.5) * area[1], hgt = 0.35 + rnd(i * 7) * 0.35, sway = Math.sin(t * 2.2 + x * 0.8 + z) * 0.18 * wind;
    return <mesh key={i} position={[x, c[1] + hgt / 2, z]} rotation={[sway * 0.4, rnd(i) * 3, sway]}><coneGeometry args={[0.07, hgt, 4]} /><meshToonMaterial color={i % 3 ? "#3fbf4a" : "#5ad65a"} /></mesh>; })}</>
);
export const Meadow: React.FC<{ t: number; wind?: number; keyGlow?: boolean }> = ({ t, wind = 1 }) => (<>
  <ambientLight intensity={1.15} /><directionalLight position={[6, 10, 6]} intensity={1.5} color="#fff4d8" /><directionalLight position={[-6, 4, 2]} intensity={0.45} color="#9ab8ff" />
  <SkyDome top="#1f6fe0" mid="#69b8ff" bottom="#d8f0ff" />
  {/* rolling hill */}
  <mesh position={[0, -40, -6]}><sphereGeometry args={[40, 64, 32]} /><meshToonMaterial color="#5cc85a" /></mesh>
  <mesh position={[0, -40, -6]} scale={1.004}><sphereGeometry args={[40, 64, 32]} /><meshBasicMaterial color={INK} side={THREE.BackSide} /></mesh>
  {/* far hills + mountains */}
  {[[-30, -22, -70, 30, "#3fa86a"], [25, -24, -80, 34, "#4cb070"], [0, -26, -95, 36, "#2f9a66"]].map(([x, y, z, r, c], i) => <mesh key={i} position={[x as number, y as number, z as number]}><sphereGeometry args={[r as number, 40, 20]} /><meshToonMaterial color={c as string} /></mesh>)}
  {[[-40, -120, 22], [-12, -130, 30], [22, -125, 26], [50, -118, 20]].map(([x, z, h], i) => <group key={i} position={[x, -6, z]}><mesh position={[0, h / 2, 0]}><coneGeometry args={[h * 0.7, h, 5]} /><meshToonMaterial color="#6e86c8" /></mesh><mesh position={[0, h * 0.82, 0]}><coneGeometry args={[h * 0.7 * 0.36, h * 0.36, 5]} /><meshToonMaterial color="#f4f8ff" /></mesh></group>)}
  {/* river ribbon */}
  <mesh position={[8, -3.2, -60]} rotation={[-Math.PI / 2, 0, 0.5]}><planeGeometry args={[4, 70]} /><meshBasicMaterial color="#59c4ff" /></mesh>
  {/* trees, rocks, flowers, fence */}
  <Tree p={[-6.5, -0.6, -4]} s={1.6} seed={1} /><Tree p={[7.5, -0.9, -6]} s={1.9} seed={2} /><Tree p={[-11, -2.0, -12]} s={2.2} seed={3} /><Tree p={[12, -2.4, -14]} s={2.0} seed={4} /><Tree p={[4.5, -1.6, -16]} s={1.5} seed={5} />
  {[[-3.4, -0.15, 2.2], [3.9, -0.25, 1.4], [-5.2, -0.5, -1.0]].map((q, i) => <Ball key={i} p={q as V3} r={0.45 + i * 0.12} color="#9aa0b8" s={[1.4, 0.8, 1]} ink={0.05} />)}
  {Array.from({ length: 22 }, (_, i) => <Flower key={i} p={[(rnd(i * 5) - 0.5) * 14, -Math.pow((rnd(i * 5) - 0.5) * 14, 2) / 80 - 0.05, 3 - rnd(i * 9) * 9]} color={["#ff6aa8", "#ffd23a", "#ffffff", "#b88cff"][i % 4]} />)}
  {[-8.5, -7.3, -6.1, -4.9].map((x, i) => <React.Fragment key={x}><Box p={[x, 0.2 - x * x / 80 - 0.4, -2.5 - i * 0.3]} s={[0.14, 1.1, 0.14]} color="#c8955a" line={2} /></React.Fragment>)}
  <Box p={[-6.7, 0.3 - 0.9, -2.95]} s={[3.8, 0.12, 0.08]} color="#c8955a" line={2} rot={[0, 0.25, 0.1]} />
  <GrassBlades t={t} c={[0, -0.02, 0.5]} area={[9, 6]} n={70} wind={wind} />
  {[[-14, 12, -40, 3.0, 1], [16, 15, -50, 3.6, 2], [-2, 20, -70, 4.2, 3], [30, 9, -35, 2.4, 4], [-28, 16, -60, 3.4, 5]].map(([x, y, z, s, sd], i) => <Cloud key={i} p={[x + Math.sin(t * 0.05 + i) * 1.5 + t * 0.25, y, z]} s={s} seed={sd} />)}
</>);

/* ---------- the magic door (drawn outline -> solid; hinge on left, opens away) ---------- */
export const MagicDoor: React.FC<{ p: V3; w?: number; h?: number; solid: number; open: number; glow?: number; portal?: number; fade?: number; noPortal?: boolean; portalZ?: number; meadow?: boolean }> = ({ p, w = 2.2, h = 3.3, solid, open, glow = 1, portal = 1, fade = 1, noPortal, portalZ = -0.12, meadow }) => (
  fade <= 0.01 ? null :
  <group position={p} scale={[1, fade < 1 ? lerp(0.7, 1, fade) : 1, 1]}>
    {solid > 0.01 ? <>
      <Box p={[-w / 2 - 0.1, h / 2, 0]} s={[0.2, h + 0.2, 0.3 * solid + 0.01]} color="#7fefff" line={3} />
      <Box p={[w / 2 + 0.1, h / 2, 0]} s={[0.2, h + 0.2, 0.3 * solid + 0.01]} color="#7fefff" line={3} />
      <Box p={[0, h + 0.1, 0]} s={[w + 0.4, 0.2, 0.3 * solid + 0.01]} color="#7fefff" line={3} />
      {/* portal light seen through the opening */}
      {open > 0.02 && !noPortal ? <CanvasPlane p={[0, h / 2, portalZ]} rot={meadow ? [0, Math.PI, 0] : undefined} s={[w, h]} px={[128, 192]} draw={(c, W2, H2) => { const g = c.createLinearGradient(0, 0, 0, H2); if (meadow) { g.addColorStop(0, "#3f8fff"); g.addColorStop(0.62, "#bfe4ff"); g.addColorStop(0.63, "#5cc85a"); g.addColorStop(1, "#3fa84a"); c.fillStyle = g; c.fillRect(0, 0, W2, H2); return; } g.addColorStop(0, "#ffb3e0"); g.addColorStop(0.5, "#ffe7a8"); g.addColorStop(1, "#bff0ff"); c.fillStyle = g; c.fillRect(0, 0, W2, H2); c.fillStyle = "rgba(255,255,255,.9)"; c.beginPath(); c.arc(W2 * 0.6, H2 * 0.35, 18, 0, 7); c.fill(); c.fillStyle = "#c9a0ff"; for (let i = 0; i < 3; i++) { c.beginPath(); c.ellipse(W2 * (0.2 + i * 0.32), H2 * (0.7 + (i % 2) * 0.08), 22, 9, 0, 0, 7); c.fill(); } }} /> : null}
      <group position={[-w / 2, 0, 0.0]} rotation={[0, open * 1.75, 0]}>
        <Box p={[w / 2, h / 2, 0]} s={[w - 0.04, h - 0.04, 0.12 * solid + 0.01]} color="#3fc8e8" line={3} />
        <Box p={[w / 2, h * 0.72, 0.07]} s={[w * 0.66, h * 0.32, 0.04]} color="#6ee0f8" line={2} /><Box p={[w / 2, h * 0.3, 0.07]} s={[w * 0.66, h * 0.32, 0.04]} color="#6ee0f8" line={2} />
        <Ball p={[w * 0.86, h * 0.5, 0.12]} r={0.1} color="#ffd65a" ink={0.025} />
      </group>
    </> : null}
    <SGlow p={[0, h / 2, 0.2]} r={h * 0.8} color="#7fefff" o={0.25 * glow} />
    {open > 0.02 ? <SGlow p={[0, h / 2, 0.3]} r={h * (0.5 + open * 0.45)} color="#ffe7c0" o={0.42 * open * portal} /> : null}
  </group>
);

/* ---------- SKY KINGDOM world (scenes 5-20). World layout:
   A  door island  (0,0,0) r5     |  B1 golden bridge  A(5,0,0) -> D(19.5,0,0)
   D  dragon island (24,0,0) r4.6, rock arch at x 26, vines hold the dragon at y ~4.6
   storm vortex below (14,-15,-8); storm crystal X = (14,-8,-12); castle far (14,16,-140) */
export const ISL_A: V3 = [0, 0, 0], ISL_D: V3 = [24, 0, 0], B1A: V3 = [4.8, 0, 0], B1B: V3 = [19.6, 0, 0], XTAL: V3 = [14, -4, -12], CASTLE: V3 = [14, 16, -140];
export const DRAGON_HANG: V3 = [26.2, 4.2, -0.6];
export type KingdomProps = { t: number; storm?: number; sun?: number; lurch?: number; bridgeFx?: (i: number, u: number) => PlankFx; spin?: number; crack?: number; heart?: number; showArch?: boolean; castleOpen?: number; noStormLight?: boolean; ropeCut?: number; noBridge?: boolean; eyes?: number; blink?: number };
export const skyCols = (storm: number, sun: number) => {
  const mix = (a: string, b: string, k: number) => { const pa = new THREE.Color(a), pb = new THREE.Color(b); return "#" + pa.lerp(pb, clamp(k)).getHexString(); };
  const top = mix(mix("#5b8cff", "#2a1e5e", storm), "#4aa8ff", sun), mid = mix(mix("#ffb7e3", "#6a4a9a", storm), "#bfe6ff", sun), bot = mix(mix("#ffe0b0", "#3a2a5a", storm), "#fff1c4", sun);
  return { top, mid, bot };
};
export const Kingdom: React.FC<KingdomProps> = ({ t, storm = 0, sun = 0, lurch = 0, bridgeFx, spin, crack = 0, showArch = true, castleOpen = 0, ropeCut = 2, noBridge, eyes = 0, blink = 0 }) => {
  const sc = skyCols(storm, sun);
  const L = (i: number): [V3, V3] => [[Math.sin(t * 9 + i) * 0.12 * lurch, Math.sin(t * 7 + i * 2) * 0.2 * lurch - lurch * 0.15 * (i % 2), 0], [Math.sin(t * 6 + i) * 0.02 * lurch, 0, Math.sin(t * 8 + i * 3) * 0.035 * lurch]];
  const sp = spin ?? t * 1.4;
  const far: [V3, number, number][] = [[[-12, 3, -18], 3.4, 11], [[10, 5, -30], 4.0, 12], [[34, 2, -24], 3.6, 13], [[-24, 7, -42], 4.4, 14], [[30, 10, -56], 5.0, 15], [[0, 9, -62], 4.6, 16], [[46, 4, -8], 3.2, 17], [[-30, -2, -14], 3.0, 18], [[52, 12, -40], 4.0, 19]];
  return (<>
    <ambientLight intensity={1.1 - storm * 0.25} /><directionalLight position={[8, 14, 10]} intensity={1.4 - storm * 0.5 + sun * 0.4} color={storm > 0.5 ? "#c8b8ff" : "#fff0d0"} /><directionalLight position={[-8, 4, 4]} intensity={0.5} color="#a8c0ff" />
    <SkyDome top={sc.top} mid={sc.mid} bottom={sc.bot} r={300} />
    {/* sun */}
    <SGlow p={[-60, 70 - storm * 30, -200]} r={30 + sun * 20} color="#fff2b0" o={0.55 * (1 - storm) + sun * 0.15} />
    {/* storm vortex below */}
    <group position={[14, -15, -8]} rotation={[0, t * 0.15, 0]}>
      {[0, 1, 2].map((k) => <mesh key={k} position={[0, k * 0.6, 0]} rotation={[-Math.PI / 2, 0, k]}><ringGeometry args={[4 + k * 9, 14 + k * 12, 48, 1]} /><meshBasicMaterial color={k % 2 ? (storm > 0.5 ? "#4a3a8a" : "#c8b8f0") : (storm > 0.5 ? "#2e2160" : "#e8d8ff")} transparent opacity={0.85 - k * 0.15} side={THREE.DoubleSide} /></mesh>)}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.3, 0]}><circleGeometry args={[60, 48]} /><meshBasicMaterial color={storm > 0.5 ? "#1e1440" : "#d6c8ff"} side={THREE.DoubleSide} /></mesh>
    </group>
    {/* storm crystal */}
    <group position={[XTAL[0] + L(9)[0][0], XTAL[1] + Math.sin(t * 0.8) * 0.3, XTAL[2]]} rotation={[0, t * 0.3, 0]}>
      <Crystal p={[0, 0, 0]} s={1.8} color={crack > 0.02 ? "#8a7cff" : "#7a8cff"} tall={1.7} />
      <SGlow p={[0, 0, 0.5]} r={6} color={storm > 0.5 ? "#9a7aff" : "#bfd8ff"} o={0.25 + storm * 0.35} />
    </group>
    {/* clouds: lower sea + floating puffs */}
    {Array.from({ length: 14 }, (_, i) => { const a = i / 14 * Math.PI * 2; return <Cloud key={"lo" + i} p={[14 + Math.cos(a) * (38 + (i % 3) * 8), -9 - (i % 2) * 2, -20 + Math.sin(a) * 40]} s={4 + (i % 3)} seed={i + 30} flat color={storm > 0.5 ? "#b8a8e0" : "#ffffff"} />; })}
    {[[-8, 6, -10, 1.6], [-6, 10, -22, 2], [30, 7, -12, 1.8], [20, 12, -40, 2.6], [-18, 12, -30, 2.4], [40, 14, -30, 2.4], [2, 16, -90, 5], [34, 18, -100, 5], [-30, 18, -90, 4]].map(([x, y, z, s], i) => <Cloud key={i} p={[x + Math.sin(t * 0.1 + i) * 1.2, y + Math.sin(t * 0.3 + i) * 0.3, z]} s={s} seed={i + 3} color={storm > 0.5 ? "#c4b8ea" : "#ffffff"} />)}
    {/* far islands with windmills, a few bridges between them */}
    {far.map(([p, r, sd], i) => { const [d, rot] = L(i); return <group key={i} position={[p[0] + d[0], p[1] + d[1], p[2]]} rotation={rot}>
      <Island p={[0, 0, 0]} r={r} seed={sd} trees={i % 3 === 0 ? 1 : 2} rock={i % 2 ? "#8a7aa8" : "#6f7fae"} />
      {i % 3 === 1 ? <Windmill p={[r * 0.3, 0, -r * 0.2]} s={1.0} spin={sp * (1 + i * 0.1)} /> : null}
      {i === 4 ? <Windmill p={[-r * 0.4, 0, 0.5]} s={0.8} spin={sp * 1.2 + 1} /> : null}
    </group>; })}
    <Bridge a={[-9, 3, -17]} b={[7, 5, -29]} n={16} sag={0.8} />
    <Bridge a={[13.5, 5, -29.5]} b={[31, 2, -24]} n={16} sag={0.7} />
    <Bridge a={[33, 10, -55]} b={[49, 12, -42]} n={14} sag={0.6} />
    {/* main islands A + D (they lurch too) */}
    <group position={L(20)[0]} rotation={L(20)[1]}>
      <Island p={ISL_A} r={5.2} depth={7} seed={2} trees={0} />
      <Tree p={[-3.2, 0, -2.4]} s={1.1} seed={2} /><Tree p={[-1.6, 0, -3.6]} s={0.8} seed={3} /><Windmill p={[-3.6, 0, -0.6]} s={0.9} spin={sp} />
      {Array.from({ length: 10 }, (_, i) => <Flower key={i} p={[Math.cos(i * 2.4) * (1.5 + (i % 4) * 0.8), 0, Math.sin(i * 2.4) * (1.5 + (i % 4) * 0.8)]} color={["#ff6aa8", "#ffd23a", "#ffffff", "#b88cff"][i % 4]} />)}
      {[[-4.2, 0, 1.6], [3.8, 0, 2.6]].map((q, i) => <Ball key={i} p={q as V3} r={0.4} color="#a8a0c8" s={[1.4, 0.7, 1]} ink={0.04} />)}
    </group>
    <group position={L(21)[0]} rotation={L(21)[1]}>
      <Island p={ISL_D} r={4.6} depth={6} seed={7} trees={0} rock="#7a6aa8" />
      <Tree p={[22.2, 0, -2.8]} s={0.9} seed={4} />
      {showArch ? <>
        <Cyl p={[25.2, 2.6, -2.2]} rt={0.32} rb={0.55} h={5.2} color="#8a7ab8" /><Cyl p={[27.6, 2.6, -1.0]} rt={0.32} rb={0.55} h={5.2} color="#8a7ab8" />
        <Box p={[26.4, 5.5, -1.6]} s={[3.4, 0.8, 1.1]} color="#9a8ac8" rot={[0, -0.45, 0.04]} />
        {[[25.0, 5.2, -2.3, 0.5], [27.9, 5.3, -0.9, 0.45], [26.4, 6.1, -1.6, 0.6], [25.3, 0.4, -2.0, 0.6]].map(([x, y, z, s], i) => <Crystal key={i} p={[x, y, z]} s={s} color="#c9a8ff" tall={1.8} rotY={i} />)}
      </> : null}
    </group>
    {noBridge ? null : <Bridge a={B1A} b={B1B} n={18} sag={0.55} width={1.4} fx={bridgeFx} ropeCut={ropeCut} />}
    {/* castle far away */}
    <group position={CASTLE}><Cloud p={[0, -7.8, 2]} s={9} seed={50} flat /><Castle p={[0, 0, 0]} s={1.6} open={castleOpen} eyes={eyes} blink={blink} /></group>
    {/* birds */}
    {[0, 1, 2, 3, 4].map((i) => { const u = (t * 0.03 + i * 0.21) % 1; return <Bird key={i} p={[-30 + u * 80, 8 + Math.sin(i * 3) * 4 + Math.sin(t + i) * 0.5, -26 - i * 6]} t={t + i} s={1.2} yaw={0} />; })}
  </>);
};
void Lightning; void Sparkles; void Cyl; void HeldKey;

/* v18 whip-pan motion streaks: crisp horizontal speed lines over the frame (no blur on the character) */
export const Streaks: React.FC<{ k: number; dir: number; f: number; col?: string }> = ({ k, dir, f, col = "255,255,255" }) => (
  <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
    <defs><linearGradient id="stk" x1="0" x2="1"><stop offset="0" stopColor={`rgba(${col},0)`} /><stop offset="0.5" stopColor={`rgba(${col},1)`} /><stop offset="1" stopColor={`rgba(${col},0)`} /></linearGradient></defs>
    {Array.from({ length: 34 }, (_, i) => { const r = (n: number) => { const x = Math.sin((i * 7.3 + n) * 127.1) * 43758.5; return x - Math.floor(x); };
      const y = r(1) * 1920, L = 260 + r(2) * 760, x = ((r(3) * 1500 + dir * f * 140 * (0.6 + r(4))) % 1700 + 1700) % 1700 - 400, h = 2 + r(5) * 9;
      return <rect key={i} x={x} y={y} width={L * (0.4 + k)} height={h} rx={h / 2} fill="url(#stk)" opacity={k * (0.25 + 0.5 * r(6))} />; })}
  </svg>
);
