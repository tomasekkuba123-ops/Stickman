// EP09 sets "What if the Moon disappeared?": Moon (vanish pop), Earth (tilt wobble + spin), NightHill, Beach + TideWave, SeasonMeadow, FlashBeam.
import React, { useMemo } from "react";
import * as THREE from "three";
import { V3 } from "../style/kit";
import { canvasTex } from "../style/set3d";
import { SGlow } from "../style/sky";
import { rnd } from "../style/props2d";
import { Grass, Flowers, Fireflies, Water } from "./world";
import { KModel, KScatter, usePHTex } from "./envlib";

const sm = (x: number) => { const u = Math.min(1, Math.max(0, x)); return u * u * (3 - 2 * u); };
const ramp = (() => { const d = new Uint8Array([90, 170, 255]); const t = new THREE.DataTexture(d, 3, 1, THREE.RedFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();

/* MOON: craters, soft glow; vanish 0..1 = squash-pop (anticipation grow, then shrink to nothing) + sparkle ring */
export const Moon: React.FC<{ p: V3; r: number; t: number; vanish?: number; back?: number /* 0..1 pops back (loop) */ }> = ({ p, r, t, vanish = 0, back = 0 }) => {
  const tex = useMemo(() => canvasTex("moon9", 512, 512, (c, W, H) => { const g = c.createRadialGradient(W * 0.38, H * 0.35, 20, W / 2, H / 2, W * 0.55); g.addColorStop(0, "#fffbe8"); g.addColorStop(1, "#e6dcb4"); c.fillStyle = g; c.fillRect(0, 0, W, H);
    for (let i = 0; i < 26; i++) { const x = rnd(i * 3) * W, y = rnd(i * 5 + 1) * H, rr = 10 + rnd(i * 7) * 46; c.fillStyle = "rgba(196,184,140,0.55)"; c.beginPath(); c.arc(x, y, rr, 0, Math.PI * 2); c.fill(); c.strokeStyle = "rgba(160,148,108,0.5)"; c.lineWidth = 4; c.stroke(); } }), []);
  const v = vanish, s = v <= 0 ? 1 : v < 0.25 ? 1 + 0.18 * sm(v / 0.25) : (1.18 * (1 - sm((v - 0.25) / 0.45))), k = Math.max(s, back > 0 ? 1.0 * (back < 0.6 ? 1.15 * sm(back / 0.6) : 1.15 - 0.15 * sm((back - 0.6) / 0.4)) : 0);
  const ring = v > 0.55 && v < 1.2 ? (v - 0.55) / 0.65 : 0;
  return (<group position={p}>
    {k > 0.01 ? <><mesh rotation={[0.2, t * 0.05, 0]} scale={[r * k, r * k, r * k]}><sphereGeometry args={[1, 48, 32]} /><meshBasicMaterial map={tex} /></mesh>
      <SGlow p={[0, 0, -0.5]} r={r * 3.2 * k} color="#fff3c4" o={0.55} /></> : null}
    {ring > 0 ? Array.from({ length: 14 }, (_, i) => { const a = (i / 14) * Math.PI * 2, d = r * (0.6 + 2.6 * ring); return <SGlow key={i} p={[Math.cos(a) * d, Math.sin(a) * d, 0.2]} r={r * 0.35 * (1 - ring)} color={i % 2 ? "#fff6c8" : "#bfe2ff"} o={1 - ring} />; }) : null}
  </group>);
};

/* EARTH: oceans + continents + ice caps + clouds, axis rod, tilt (deg) can wobble */
export const Earth: React.FC<{ p: V3; r: number; t: number; tilt: number; axis?: boolean }> = ({ p, r, t, tilt, axis = true }) => {
  const tex = useMemo(() => canvasTex("earth9", 1024, 512, (c, W, H) => { c.fillStyle = "#2f86de"; c.fillRect(0, 0, W, H);
    const land = (x: number, y: number, rx: number, ry: number, seed: number) => { c.beginPath(); for (let i = 0; i <= 40; i++) { const a = (i / 40) * Math.PI * 2, k = 0.75 + 0.35 * Math.sin(a * 3 + seed) * Math.cos(a * 2 + seed * 2); c.lineTo(x + Math.cos(a) * rx * k, y + Math.sin(a) * ry * k); } c.closePath(); c.fillStyle = "#4fc25a"; c.fill(); c.strokeStyle = "#2f8f3e"; c.lineWidth = 6; c.stroke(); };
    land(200, 190, 110, 90, 1); land(260, 330, 70, 100, 2); land(560, 170, 150, 80, 3); land(600, 320, 80, 90, 4); land(820, 300, 90, 60, 5); land(880, 160, 70, 50, 6);
    c.fillStyle = "#f4fbff"; c.fillRect(0, 0, W, 34); c.fillRect(0, H - 34, W, 34);
    c.fillStyle = "rgba(255,255,255,0.75)"; for (let i = 0; i < 40; i++) { c.beginPath(); c.ellipse(rnd(i) * W, 60 + rnd(i * 3) * (H - 120), 40 + rnd(i * 5) * 60, 10 + rnd(i * 7) * 10, 0, 0, Math.PI * 2); c.fill(); } }), []);
  return (<group position={p} rotation={[0, 0, (tilt * Math.PI) / 180]}>
    <mesh rotation={[0, t * 0.9, 0]}><sphereGeometry args={[r, 64, 40]} /><meshToonMaterial map={tex} gradientMap={ramp} /></mesh>
    <mesh scale={[1.06, 1.06, 1.06]}><sphereGeometry args={[r, 48, 32]} /><meshBasicMaterial color="#8fd0ff" transparent opacity={0.18} side={THREE.BackSide} /></mesh>
    {axis ? <><mesh><cylinderGeometry args={[r * 0.03, r * 0.03, r * 2.9, 12]} /><meshBasicMaterial color="#ffffff" /></mesh>
      <mesh position={[0, r * 1.45, 0]}><sphereGeometry args={[r * 0.07, 16, 12]} /><meshBasicMaterial color="#ff5a5a" /></mesh></> : null}
  </group>);
};

/* NIGHT HILL (hook + end): dark rolling hill, Kenney trees tinted night-blue, grass, fireflies. dim 0..1 darkens further */
export const NightHill: React.FC<{ t: number; dim?: number; fireflies?: boolean }> = ({ t, dim = 0, fireflies = true }) => {
  const tint = dim > 0.5 ? "#3a4478" : "#5664a8";
  return (<group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, -20]}><circleGeometry args={[70, 64]} /><meshToonMaterial color={dim > 0.5 ? "#1c3a3a" : "#2a5a4a"} gradientMap={ramp} /></mesh>
    <mesh position={[0, -9.2, -48]} scale={[60, 12, 14]}><sphereGeometry args={[1, 48, 24]} /><meshToonMaterial color="#1f3f45" gradientMap={ramp} /></mesh>
    <Grass t={t} area={[22, 14]} c={[0, 0, -3]} n={260} colors={["#2f6a52", "#3b7c5e", "#285e4a"]} />
    <KScatter names={["tree_oak", "tree_pineRoundA", "tree_detailed", "tree_pineTallA_detailed"]} n={14} area={[46, 16]} c={[0, 0, -22]} seed={9} s={[2.2, 3.6]} tint={tint} t={t} sway={1} />
    <KScatter names={["plant_bush", "rock_smallA", "flower_purpleA", "mushroom_red"]} n={16} area={[18, 8]} c={[0, 0, -4]} seed={4} s={[1.2, 2]} avoid={[[0, -2, 2.5]]} tint={tint} />
    {fireflies ? <Fireflies t={t} n={20} c={[0, 1.6, -4]} area={[12, 2.5, 8]} color="#d8ff7a" /> : null}
  </group>);
};

/* BEACH at night: textured sand, sea, rolling tide wave (amp 1 = normal tide, 0.4 = moonless) */
export const Beach: React.FC<{ t: number; amp: number; tideLine?: boolean }> = ({ t, amp, tideLine = true }) => {
  const sand = usePHTex("coast_sand_01", 10);
  const ph = (t * 0.32) % 1, reach = (-2 + 5.5 * Math.sin(ph * Math.PI)) * amp - 3.5; // wave front z
  return (<group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -4]}><planeGeometry args={[80, 40]} /><meshToonMaterial map={sand} color="#f4e2b8" gradientMap={ramp} /></mesh>
    <Water p={[0, -0.02, -40]} s={[160, 60]} t={t} color="#1f4f8a" sky="#3f6fb0" />
    <mesh position={[0, 0.03, (reach - 10) / 2 - 2]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[80, Math.max(0.1, reach + 14)]} /><meshToonMaterial color="#2c6aa8" transparent opacity={0.85} gradientMap={ramp} /></mesh>
    <mesh position={[0, 0.06 + 0.25 * amp * Math.sin(ph * Math.PI), reach + 5]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[80, 0.22 + 0.3 * amp]} /><meshBasicMaterial color="#e9f6ff" transparent opacity={0.9} /></mesh>
    {tideLine ? <mesh position={[0, 0.04, 2.0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[80, 0.12]} /><meshBasicMaterial color="#7a6646" transparent opacity={0.6} /></mesh> : null}
    <KScatter names={["rock_largeA", "rock_smallC", "stone_largeA", "tree_palmBend", "tree_palm"]} n={7} area={[40, 6]} c={[0, 0, 7]} seed={21} s={[1.4, 2.6]} avoid={[[0, 6, 5]]} tint="#7c88c8" t={t} sway={1} />
  </group>);
};

/* SEASONS flashing: season s = 0 winter, 1 spring, 2 summer, 3 autumn (fractional = crossfade) */
const SEASON = [{ g: "#e8f1fb", tree: "#ffffff", sky: "#bcd3ea" }, { g: "#7fd36a", tree: "#ffb3d1", sky: "#9fd6ff" }, { g: "#5cc85a", tree: "#6bd36a", sky: "#5ab8ff" }, { g: "#d9a441", tree: "#f08a2c", sky: "#f6c28a" }];
export const seasonColors = (s: number) => { const i = Math.floor(s) % 4, j = (i + 1) % 4, k = s - Math.floor(s); const m = (a: string, b: string) => "#" + new THREE.Color(a).lerp(new THREE.Color(b), k).getHexString(); return { g: m(SEASON[i].g, SEASON[j].g), tree: m(SEASON[i].tree, SEASON[j].tree), sky: m(SEASON[i].sky, SEASON[j].sky) }; };
export const SeasonMeadow: React.FC<{ t: number; s: number }> = ({ t, s }) => {
  const C = seasonColors(s), i = Math.round(s) % 4;
  return (<group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, -15]}><circleGeometry args={[60, 64]} /><meshToonMaterial color={C.g} gradientMap={ramp} /></mesh>
    {i === 1 || i === 2 ? <Flowers t={t} area={[18, 12]} c={[0, 0, -4]} n={60} /> : null}
    {i !== 0 ? <Grass t={t} area={[20, 12]} c={[0, 0, -3]} n={180} colors={[C.g, C.g, "#4a9a48"]} /> : null}
    {[[-6, -9], [5, -11], [-11, -16], [10, -18], [0, -22]].map(([x, z], n) => <KModel key={n + "-" + i} name={n % 2 ? "tree_oak" : "tree_detailed"} p={[x, 0, z]} s={3 + (n % 3) * 0.6} tint={C.tree} t={t} sway={1.5} />)}
  </group>);
};

/* FLASHLIGHT beam (visible cone + spot light) from a world point toward a target */
export const FlashBeam: React.FC<{ from: V3; to: V3; on?: number }> = ({ from, to, on = 1 }) => {
  const d = new THREE.Vector3(to[0] - from[0], to[1] - from[1], to[2] - from[2]), L = d.length(), q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), d.clone().normalize());
  const tgt = useMemo(() => new THREE.Object3D(), []); tgt.position.set(...to);
  if (on <= 0.01) return null;
  return (<group>
    <mesh position={[(from[0] + to[0]) / 2, (from[1] + to[1]) / 2, (from[2] + to[2]) / 2]} quaternion={q}><coneGeometry args={[L * 0.12, L, 32, 1, true]} /><meshBasicMaterial color="#fff6c0" transparent opacity={0.05 * on} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} /></mesh>
    <primitive object={tgt} />
    <spotLight position={from} target={tgt} angle={0.42} penumbra={0.6} intensity={60 * on} distance={L * 2.4} color="#fff2c0" />
    <SGlow p={to} r={L * 0.18} color="#fff6c8" o={0.35 * on} />
  </group>);
};
