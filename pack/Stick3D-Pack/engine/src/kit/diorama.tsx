// DIORAMA KIT v17 — reusable, richer hand-crafted environments (5-7 depth layers, living atmosphere). Built for EP09, reused later.
//   Layers:  sky gradient + StarField (shader points, twinkle) + ShootingStar  ->  far painted silhouettes (HillLayers, 3 tones, Village with lit windows)
//            -> GroundHaze bands -> mid Kenney props (trees, bushes, rocks, fence, sign, mushrooms) -> ground + instanced grass (wind)
//            -> FireflyTrails / MotesIn particles -> ForeFrame (2D overlay: blurred grass blades / branch, parallax + wind) -> Grain + vignette.
//   Every element moves a little (noise-based loops), nothing is frozen.  Sets: NightField (hook/end/dark), MoonShore (tides), SpaceDiorama (Earth).
import React, { useMemo, useRef, useLayoutEffect } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { V3 } from "../style/kit";
import { canvasTex } from "../style/set3d";
import { SGlow } from "../style/sky";
import { LookContext, Look } from "./character";
import { Grass } from "./world";
import { KModel, KenneyName } from "./envlib";

const TAU = Math.PI * 2;
export const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const cl = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const sm = (x: number) => { const u = cl(x); return u * u * (3 - 2 * u); };
export const mixC = (a: string, b: string, k: number) => "#" + new THREE.Color(a).lerp(new THREE.Color(b), cl(k)).getHexString();
export const noise1 = (t: number, s = 0) => Math.sin(t * 0.83 + s) * 0.6 + Math.sin(t * 1.91 + s * 2.3) * 0.3 + Math.sin(t * 3.7 + s * 4.1) * 0.1;
const toonRamp = (() => { const d = new Uint8Array([95, 175, 255]); const t = new THREE.DataTexture(d, 3, 1, THREE.RedFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
export { toonRamp };

/* ---------------- sky: vertical gradient dome, palette A -> B by k (quantised for the texture cache) ---------------- */
export const SkyGrad: React.FC<{ a: string[]; b?: string[]; k?: number; r?: number; horizon?: string; hk?: number }> = ({ a, b, k = 0, r = 160, horizon, hk = 0.5 }) => {
  const q = Math.round(cl(k) * 24) / 24, cols = a.map((c, i) => (b ? mixC(c, b[i], q) : c));
  const tex = canvasTex("sky17|" + cols.join(",") + (horizon ?? "") + hk, 8, 512, (c, W, H) => { const g = c.createLinearGradient(0, 0, 0, H); cols.forEach((col, i) => g.addColorStop(i / (cols.length - 1), col)); c.fillStyle = g; c.fillRect(0, 0, W, H);
    if (horizon) { const h = c.createLinearGradient(0, H * 0.42, 0, H * 0.56); h.addColorStop(0, "rgba(0,0,0,0)"); h.addColorStop(0.7, horizon); h.addColorStop(1, "rgba(0,0,0,0)"); c.globalAlpha = hk; c.fillStyle = h; c.fillRect(0, 0, W, H); c.globalAlpha = 1; } });
  return <mesh><sphereGeometry args={[r, 48, 32]} /><meshBasicMaterial map={tex} side={THREE.BackSide} depthWrite={false} fog={false} /></mesh>;
};

/* ---------------- 150+ twinkling stars as one shader point cloud (varied sizes + colours, per-star twinkle) ---------------- */
const starVS = `attribute float size; attribute float phase; attribute vec3 tint; uniform float time; uniform float bright; varying vec3 vC; varying float vA;
void main(){ vC = tint; float tw = 0.55 + 0.45 * sin(time * (1.3 + phase * 2.6) + phase * 40.0); vA = bright * tw; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = size * (0.75 + 0.5 * tw); gl_Position = projectionMatrix * mv; }`;
const starFS = `varying vec3 vC; varying float vA; void main(){ vec2 p = gl_PointCoord - 0.5; float d = length(p); float core = smoothstep(0.5, 0.0, d); float cross = max(0.0, 1.0 - abs(p.x) * 9.0) * max(0.0, 1.0 - abs(p.y) * 1.8) + max(0.0, 1.0 - abs(p.y) * 9.0) * max(0.0, 1.0 - abs(p.x) * 1.8);
 float a = (pow(core, 2.2) + 0.35 * cross * step(0.6, vA)) * vA; if (a < 0.01) discard; gl_FragColor = vec4(vC * a, a); }`;
export const StarField: React.FC<{ t: number; n?: number; r?: number; bright?: number; minEl?: number; seed?: number; px?: number }> = ({ t, n = 220, r = 140, bright = 1, minEl = 0.04, seed = 1, px = 1 }) => {
  const { geo, mat } = useMemo(() => { const g = new THREE.BufferGeometry(); const pos: number[] = [], size: number[] = [], ph: number[] = [], col: number[] = [];
    for (let i = 0; i < n; i++) { const az = rnd(i * 3.1 + seed) * TAU, el = minEl + Math.pow(rnd(i * 5.7 + seed), 0.8) * (1.45 - minEl); pos.push(Math.cos(az) * Math.cos(el) * r, Math.sin(el) * r, Math.sin(az) * Math.cos(el) * r);
      const big = rnd(i * 9.3 + seed); size.push((big > 0.93 ? 9 + big * 6 : 2.4 + big * 4.5) * px); ph.push(rnd(i * 13.7 + seed)); const c = new THREE.Color(rnd(i * 17 + seed) > 0.82 ? "#ffd9ec" : rnd(i * 19 + seed) > 0.7 ? "#cfe4ff" : "#ffffff"); col.push(c.r, c.g, c.b); }
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("size", new THREE.Float32BufferAttribute(size, 1)); g.setAttribute("phase", new THREE.Float32BufferAttribute(ph, 1)); g.setAttribute("tint", new THREE.Float32BufferAttribute(col, 3));
    const m = new THREE.ShaderMaterial({ vertexShader: starVS, fragmentShader: starFS, uniforms: { time: { value: 0 }, bright: { value: 1 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
    return { geo: g, mat: m }; }, [n, r, seed, px]);
  mat.uniforms.time.value = t; mat.uniforms.bright.value = bright;
  return <points geometry={geo} material={mat} frustumCulled={false} />;
};
/* shooting star: bright head + fading streak, crosses the sky in `dur` s from t0 */
export const ShootingStar: React.FC<{ t: number; t0: number; from: V3; to: V3; dur?: number; color?: string }> = ({ t, t0, from, to, dur = 0.7, color = "#ffffff" }) => {
  const u = (t - t0) / dur; if (u < 0 || u > 1.25) return null; const P = (k: number): V3 => [from[0] + (to[0] - from[0]) * k, from[1] + (to[1] - from[1]) * k, from[2] + (to[2] - from[2]) * k];
  const fade = u > 1 ? 1 - (u - 1) / 0.25 : sm(u / 0.15);
  return <>{Array.from({ length: 10 }, (_, i) => { const k = cl(u - i * 0.035); return <SGlow key={i} p={P(k)} r={(1.6 - i * 0.13) * (i ? 0.7 : 1.3)} color={color} o={fade * (1 - i / 10) * (i ? 0.55 : 1)} />; })}</>;
};

/* ---------------- BIG MOON: craters, layered halo, soft rotating rays, vanish = anticipation swell -> shrink + fade + sparkle burst; back = pop in ---------------- */
const moonTex = () => canvasTex("moon17", 512, 512, (c, W, H) => { const g = c.createRadialGradient(W * 0.36, H * 0.32, 20, W / 2, H / 2, W * 0.6); g.addColorStop(0, "#fffdf0"); g.addColorStop(1, "#e2d9b8"); c.fillStyle = g; c.fillRect(0, 0, W, H);
  for (let i = 0; i < 30; i++) { const x = rnd(i * 3) * W, y = rnd(i * 5 + 1) * H, rr = 8 + rnd(i * 7) * 44; const cg = c.createRadialGradient(x - rr * 0.3, y - rr * 0.3, 1, x, y, rr); cg.addColorStop(0, "rgba(170,160,125,0.6)"); cg.addColorStop(1, "rgba(200,190,150,0.25)"); c.fillStyle = cg; c.beginPath(); c.arc(x, y, rr, 0, TAU); c.fill(); c.strokeStyle = "rgba(255,255,240,0.5)"; c.lineWidth = 3; c.beginPath(); c.arc(x + 2, y + 2, rr, 0.6, 2.4); c.stroke(); }
  for (let i = 0; i < 6; i++) { c.fillStyle = "rgba(190,180,150,0.22)"; c.beginPath(); c.ellipse(rnd(i * 11) * W, rnd(i * 13) * H, 60 + rnd(i) * 80, 40 + rnd(i * 2) * 50, rnd(i * 3) * 3, 0, TAU); c.fill(); } });
const raysTex = () => canvasTex("rays17", 512, 512, (c, W, H) => { c.translate(W / 2, H / 2); for (let i = 0; i < 18; i++) { const a = (i / 18) * TAU + rnd(i) * 0.2, w = 0.04 + rnd(i * 3) * 0.06, L = W * (0.32 + rnd(i * 5) * 0.18);
  const g = c.createLinearGradient(0, 0, Math.cos(a) * L, Math.sin(a) * L); g.addColorStop(0, "rgba(255,255,255,0.0)"); g.addColorStop(0.25, "rgba(255,255,255,0.55)"); g.addColorStop(1, "rgba(255,255,255,0)"); c.fillStyle = g; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, L, a - w, a + w); c.closePath(); c.fill(); } });
export const BigMoon: React.FC<{ p: V3; r: number; t: number; vanish?: number; back?: number; halo?: number; color?: string }> = ({ p, r, t, vanish = 0, back = 0, halo = 1, color = "#fff3c8" }) => {
  const { camera } = useThree(); const ray = useRef<THREE.Mesh>(null);
  useLayoutEffect(() => { if (ray.current) { ray.current.quaternion.copy(camera.quaternion); ray.current.rotateZ(t * 0.05); } });
  const v = vanish; // 0..1: 0-0.22 swell (anticipation), 0.22-0.8 shrink + fade, burst 0.55-1
  let s = v <= 0 ? 1 : v < 0.22 ? 1 + 0.14 * sm(v / 0.22) : 1.14 * (1 - sm((v - 0.22) / 0.58));
  if (back > 0) s = Math.max(s, back < 0.6 ? 1.12 * sm(back / 0.6) : 1.12 - 0.12 * sm((back - 0.6) / 0.4));
  const fade = v > 0.22 ? 1 - sm((v - 0.3) / 0.5) : 1, o = back > 0 ? Math.max(fade, sm(back / 0.5)) : fade;
  const burst = v > 0.5 && v < 1.6 ? (v - 0.5) / 1.1 : 0;
  return (<group position={p}>
    {s > 0.01 ? <>
      <mesh rotation={[0.25, 0.4 + t * 0.03, 0]} scale={r * s}><sphereGeometry args={[1, 48, 32]} /><meshBasicMaterial map={moonTex()} transparent opacity={o} fog={false} /></mesh>
      <SGlow p={[0, 0, -r * 0.6]} r={r * 2.0 * s} color={color} o={0.75 * halo * o} />
      <SGlow p={[0, 0, -r * 0.8]} r={r * 4.2 * s} color="#cfe0ff" o={0.38 * halo * o} />
      <SGlow p={[0, 0, -r]} r={r * 8 * s} color="#8fa8ff" o={0.16 * halo * o} />
      <mesh ref={ray} position={[0, 0, -r * 0.7]}><planeGeometry args={[r * 9 * s, r * 9 * s]} /><meshBasicMaterial map={raysTex()} color={color} transparent opacity={0.22 * halo * o * (0.85 + 0.15 * Math.sin(t * 0.7))} blending={THREE.AdditiveBlending} depthWrite={false} fog={false} /></mesh>
    </> : null}
    {burst > 0 ? Array.from({ length: 26 }, (_, i) => { const a = rnd(i * 7) * TAU, sp = 0.6 + rnd(i * 3) * 1.4, d = r * (0.3 + sp * 3.2 * Math.pow(burst, 0.6)), fall = burst * burst * r * 0.8;
      return <SGlow key={i} p={[Math.cos(a) * d, Math.sin(a) * d - fall, r * 0.3]} r={r * (0.22 + 0.18 * rnd(i)) * (1 - burst) * (0.7 + 0.3 * Math.sin(t * 30 + i))} color={i % 3 ? "#fff6c8" : "#bfe2ff"} o={1 - burst} />; }) : null}
    {burst > 0 && burst < 0.5 ? <SGlow p={[0, 0, r * 0.4]} r={r * 3 * (1 - burst * 2)} color="#ffffff" o={0.9 * (1 - burst * 2)} /> : null}
  </group>);
};

/* ---------------- thin cloud strips drifting across the sky (moonlit underside) ---------------- */
const stripTex = (tone: string, rim: string) => canvasTex("strip17|" + tone + rim, 1024, 128, (c, W, H) => { for (let i = 0; i < 26; i++) { const x = W * (0.08 + rnd(i) * 0.84), y = H * (0.45 + (rnd(i * 3) - 0.5) * 0.3), rx = 60 + rnd(i * 5) * 140, ry = 10 + rnd(i * 7) * 16;
  const g = c.createRadialGradient(x, y - ry * 0.4, 2, x, y, rx); g.addColorStop(0, tone); g.addColorStop(1, "rgba(0,0,0,0)"); c.fillStyle = g; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, TAU); c.fill(); }
  c.globalCompositeOperation = "source-atop"; const e = c.createLinearGradient(0, 0, 0, H); e.addColorStop(0, rim); e.addColorStop(0.5, "rgba(0,0,0,0)"); c.fillStyle = e; c.fillRect(0, 0, W, H); });
export const CloudStrips: React.FC<{ t: number; n?: number; y?: number; z?: number; span?: number; speed?: number; tone?: string; rim?: string; o?: number }> = ({ t, n = 4, y = 22, z = -50, span = 120, speed = 0.9, tone = "rgba(120,135,200,0.55)", rim = "rgba(230,236,255,0.6)", o = 1 }) => {
  const tex = stripTex(tone, rim);
  return <>{Array.from({ length: n }, (_, i) => { const x = ((rnd(i * 3) * span + t * speed * (0.6 + rnd(i) * 0.8)) % span) - span / 2; const w = 30 + rnd(i * 7) * 30;
    return <mesh key={i} position={[x, y + (rnd(i * 5) - 0.5) * 14, z - rnd(i * 9) * 25]}><planeGeometry args={[w, w * 0.12]} /><meshBasicMaterial map={tex} transparent opacity={o * (0.6 + 0.4 * rnd(i * 11))} depthWrite={false} fog={false} /></mesh>; })}</>;
};

/* ---------------- far painted silhouette layer: rolling hill line + varied tree silhouettes (round, pine, poplar, bushy) + optional village ---------------- */
export type HillOpts = { seed: number; tone: string; rim: string; top: number; amp: number; trees: number; village?: boolean; roof?: string };
const hillTex = (o: HillOpts) => canvasTex("hill17|" + JSON.stringify(o), 2048, 512, (c, W, H) => {
  const yAt = (x: number) => H * o.top + Math.sin(x / W * TAU * 1.3 + o.seed) * H * o.amp * 0.6 + Math.sin(x / W * TAU * 3.1 + o.seed * 2) * H * o.amp * 0.25 + Math.sin(x / W * TAU * 7 + o.seed * 3) * H * o.amp * 0.06;
  const body = () => { c.beginPath(); c.moveTo(0, H); for (let x = 0; x <= W; x += 8) c.lineTo(x, yAt(x)); c.lineTo(W, H); c.closePath(); };
  // trees + houses first (same tone), then the hill body
  c.fillStyle = o.tone;
  for (let i = 0; i < o.trees; i++) { const x = rnd(i * 7 + o.seed) * W, y = yAt(x) + 6, k = rnd(i * 11 + o.seed), s = H * (0.07 + rnd(i * 13 + o.seed) * 0.11);
    c.beginPath();
    if (k < 0.35) { c.arc(x, y - s * 0.9, s * 0.55, 0, TAU); c.arc(x - s * 0.4, y - s * 0.6, s * 0.4, 0, TAU); c.arc(x + s * 0.42, y - s * 0.62, s * 0.42, 0, TAU); c.rect(x - s * 0.06, y - s * 0.5, s * 0.12, s * 0.6); }
    else if (k < 0.65) { for (let j = 0; j < 3; j++) { c.moveTo(x, y - s * (1.6 - j * 0.35)); c.lineTo(x - s * (0.32 + j * 0.12), y - s * (0.75 - j * 0.32)); c.lineTo(x + s * (0.32 + j * 0.12), y - s * (0.75 - j * 0.32)); } c.rect(x - s * 0.05, y - s * 0.2, s * 0.1, s * 0.3); }
    else if (k < 0.82) { c.ellipse(x, y - s * 0.95, s * 0.22, s * 0.85, 0, 0, TAU); }
    else { c.ellipse(x, y - s * 0.3, s * 0.55, s * 0.35, 0, 0, TAU); }
    c.fill(); }
  if (o.village) for (let i = 0; i < 9; i++) { const x = W * (0.56 + i * 0.035 + rnd(i) * 0.01), y = yAt(x) + 4, w = H * (0.05 + rnd(i * 3) * 0.03), h = w * (0.8 + rnd(i * 5) * 0.5);
    c.fillStyle = o.tone; c.fillRect(x - w / 2, y - h, w, h + 6); c.fillStyle = o.roof ?? o.tone; c.beginPath(); c.moveTo(x - w * 0.62, y - h); c.lineTo(x, y - h - w * 0.55); c.lineTo(x + w * 0.62, y - h); c.closePath(); c.fill();
    if (i === 4) { c.fillStyle = o.tone; c.fillRect(x - w * 0.12, y - h - w * 1.6, w * 0.24, w * 1.2); c.beginPath(); c.moveTo(x - w * 0.2, y - h - w * 1.6); c.lineTo(x, y - h - w * 2.3); c.lineTo(x + w * 0.2, y - h - w * 1.6); c.fill(); } }
  c.fillStyle = o.tone; body(); c.fill();
  // moonlit rim along the top edge of everything
  c.globalCompositeOperation = "source-atop"; c.strokeStyle = o.rim; c.lineWidth = 5; c.beginPath(); for (let x = 0; x <= W; x += 8) (x ? c.lineTo(x, yAt(x) + 2) : c.moveTo(x, yAt(x) + 2)); c.stroke();
  const g = c.createLinearGradient(0, H * (o.top - o.amp), 0, H); g.addColorStop(0, "rgba(255,255,255,0.10)"); g.addColorStop(0.5, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,0.25)"); c.fillStyle = g; c.fillRect(0, 0, W, H);
});
/* window lights for a village painted on a HillLayer (positions in the layer's plane, warm flicker) */
export const HillLayer: React.FC<{ p: V3; s: [number, number]; o: HillOpts; t?: number; windows?: number; winColor?: string }> = ({ p, s, o, t = 0, windows = 0, winColor = "#ffcf7a" }) => {
  const tex = hillTex(o);
  const yAt = (u: number) => o.top + Math.sin(u * TAU * 1.3 + o.seed) * o.amp * 0.6 + Math.sin(u * TAU * 3.1 + o.seed * 2) * o.amp * 0.25 + Math.sin(u * TAU * 7 + o.seed * 3) * o.amp * 0.06;
  return (<group position={p}>
    <mesh><planeGeometry args={s} /><meshBasicMaterial map={tex} transparent depthWrite={false} fog={false} /></mesh>
    {Array.from({ length: windows }, (_, i) => { const u = 0.56 + Math.floor(i / 2) * 0.035 + rnd(Math.floor(i / 2)) * 0.01 + (i % 2 ? 0.006 : -0.006), hgt = (0.05 + rnd(Math.floor(i / 2) * 3) * 0.03) * 0.45; const v = yAt(u) - hgt;
      const fl = 0.75 + 0.25 * Math.sin(t * (2 + rnd(i) * 3) + i) * (rnd(i * 7) > 0.6 ? 1 : 0.2);
      return <SGlow key={i} p={[(u - 0.5) * s[0], (0.5 - v) * s[1], 0.1]} r={s[1] * 0.018} color={winColor} o={fl} />; })}
  </group>);
};

/* ---------------- ground haze bands between depth layers (soft drifting mist) ---------------- */
const hazeTex = (col: string) => canvasTex("haze17|" + col, 1024, 128, (c, W, H) => { for (let i = 0; i < 40; i++) { const x = rnd(i) * W, y = H * (0.5 + (rnd(i * 3) - 0.5) * 0.4), rx = 80 + rnd(i * 5) * 200;
  const g = c.createRadialGradient(x, y, 1, x, y, rx); g.addColorStop(0, col); g.addColorStop(1, "rgba(0,0,0,0)"); c.fillStyle = g; c.beginPath(); c.ellipse(x, y, rx, rx * 0.22, 0, 0, TAU); c.fill(); } }, [2, 1]);
export const GroundHaze: React.FC<{ t: number; layers: [number, number, number][] /* [z, y, width] */; col?: string; o?: number; speed?: number }> = ({ t, layers, col = "rgba(150,170,230,0.5)", o = 0.6, speed = 0.01 }) => {
  const tex = hazeTex(col);
  return <>{layers.map(([z, y, w], i) => { const tx = tex.clone(); tx.needsUpdate = true; tx.wrapS = THREE.RepeatWrapping; tx.repeat.set(2, 1); tx.offset.set((t * speed * (1 + i * 0.4) + i * 0.3) % 1, 0);
    return <mesh key={i} position={[0, y, z]}><planeGeometry args={[w, w * 0.09]} /><meshBasicMaterial map={tx} transparent opacity={o} depthWrite={false} fog={false} /></mesh>; })}</>;
};

/* ---------------- fireflies drifting in lazy loops with glowing trails ---------------- */
export const FireflyTrails: React.FC<{ t: number; n?: number; c?: V3; area?: V3; color?: string; o?: number; size?: number; trail?: number }> = ({ t, n = 18, c = [0, 1.4, -2], area = [8, 1.6, 5], color = "#d8ff7a", o = 1, size = 0.1, trail = 6 }) => {
  const P = (i: number, s: number): V3 => { const f = 0.25 + rnd(i * 3) * 0.3, ph = rnd(i) * TAU; return [c[0] + (rnd(i * 5) - 0.5) * area[0] + Math.sin(s * f + ph) * 0.9 + Math.sin(s * f * 2.3 + ph) * 0.3, c[1] + (rnd(i * 7) - 0.5) * area[1] + Math.sin(s * f * 1.7 + ph * 2) * 0.35, c[2] + (rnd(i * 11) - 0.5) * area[2] + Math.cos(s * f * 0.9 + ph) * 0.8]; };
  return <>{Array.from({ length: n }, (_, i) => { const pulse = 0.35 + 0.65 * Math.max(0, Math.sin(t * (1.6 + rnd(i * 13)) + i * 2.1)); return Array.from({ length: trail }, (_, k) => <SGlow key={i + "-" + k} p={P(i, t - k * 0.07)} r={size * (k ? 0.55 * (1 - k / trail) : 1.6) * (0.7 + 0.5 * pulse)} color={color} o={o * pulse * (k ? 0.45 * (1 - k / trail) : 1)} />); })}</>;
};
/* dust / pollen motes in a volume (slow rise + drift); `lit` = only visible inside a light (0..1 per mote via fn) */
export const Motes: React.FC<{ t: number; n?: number; c?: V3; area?: V3; color?: string; size?: number; o?: number; lit?: (p: V3) => number }> = ({ t, n = 40, c = [0, 1.5, 0], area = [6, 3, 4], color = "#fff4d0", size = 0.035, o = 0.7, lit }) => (
  <>{Array.from({ length: n }, (_, i) => { const p: V3 = [c[0] + (rnd(i) - 0.5) * area[0] + noise1(t * 0.4, i) * 0.4, c[1] + ((((rnd(i + 3) * area[1] + t * 0.07 * (0.5 + rnd(i * 2))) % area[1]) + area[1]) % area[1]) - area[1] / 2, c[2] + (rnd(i + 7) - 0.5) * area[2] + noise1(t * 0.3, i + 4) * 0.3];
    const k = lit ? lit(p) : 1; if (k <= 0.01) return null; return <SGlow key={i} p={p} r={size * (0.6 + rnd(i * 5))} color={color} o={o * k * (0.6 + 0.4 * Math.sin(t * 3 + i))} />; })}</>
);

/* ---------------- mid-ground prop placement with wind (Kenney CC0 models, tinted per scene) ---------------- */
export type PropSpec = [KenneyName, number, number, number /* scale */, number? /* rotY */];
export const Props: React.FC<{ list: PropSpec[]; t: number; tint?: string; sway?: number; y?: number }> = ({ list, t, tint, sway = 1, y = 0 }) => (
  <>{list.map(([name, x, z, s, ry], i) => <KModel key={i} name={name} p={[x, y, z]} s={s} ry={ry ?? rnd(i * 3) * 6.28} tint={tint} t={t} sway={/tree|bush|grass|flower|palm/.test(name) ? sway * (0.8 + rnd(i) * 0.6) : 0} />)}</>
);
/* wooden sign post (story prop) */
export const WoodSign: React.FC<{ p: V3; ry?: number; s?: number; t?: number; color?: string; text?: string }> = ({ p, ry = 0, s = 1, t = 0, color = "#a8774a", text = "" }) => {
  const tex = canvasTex("sign17|" + text + color, 256, 128, (c, W, H) => { c.fillStyle = color; c.fillRect(0, 0, W, H); for (let i = 0; i < 6; i++) { c.strokeStyle = "rgba(60,30,10,0.35)"; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 12 + i * 21); c.bezierCurveTo(W * 0.3, 8 + i * 21, W * 0.6, 18 + i * 21, W, 12 + i * 21); c.stroke(); }
    c.strokeStyle = "#1a1a1a"; c.lineWidth = 10; c.strokeRect(5, 5, W - 10, H - 10); if (text) { c.fillStyle = "#2a1a0a"; c.font = "bold 54px Inter, Arial"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(text, W / 2, H / 2 + 4); } });
  return (<group position={p} rotation={[0, ry, Math.sin(t * 0.9) * 0.01]} scale={s}>
    <mesh position={[0, 0.55, 0]}><boxGeometry args={[0.1, 1.1, 0.1]} /><meshToonMaterial color="#6e4a2a" gradientMap={toonRamp} /></mesh>
    <mesh position={[0, 1.0, 0.06]}><boxGeometry args={[0.9, 0.45, 0.06]} /><meshToonMaterial map={tex} gradientMap={toonRamp} /></mesh>
  </group>);
};

/* ---------------- ground: big disc with painted colour variation (patches, paths) ---------------- */
export const PaintedGround: React.FC<{ y?: number; z?: number; r?: number; a: string; b: string; c2?: string; seed?: number; map?: THREE.Texture; tint?: string }> = ({ y = 0, z = -20, r = 80, a, b, c2, seed = 3 }) => {
  const tex = canvasTex("ground17|" + a + b + (c2 ?? "") + seed, 1024, 1024, (c, W, H) => { c.fillStyle = a; c.fillRect(0, 0, W, H);
    for (let i = 0; i < 160; i++) { const x = rnd(i * 3 + seed) * W, yy = rnd(i * 5 + seed) * H, rr = 20 + rnd(i * 7 + seed) * 90; const g = c.createRadialGradient(x, yy, 1, x, yy, rr); g.addColorStop(0, i % 3 === 0 && c2 ? c2 : b); g.addColorStop(1, "rgba(0,0,0,0)"); c.fillStyle = g; c.globalAlpha = 0.5; c.beginPath(); c.arc(x, yy, rr, 0, TAU); c.fill(); } c.globalAlpha = 1; });
  return <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y - 0.01, z]}><circleGeometry args={[r, 72]} /><meshToonMaterial map={tex} gradientMap={toonRamp} /></mesh>;
};

/* ---------------- 2D OVERLAY layers (above the 3D canvas) ---------------- */
/* Foreground framing: tall grass blades / leaves / rocks, blurred (near DOF), parallax with the camera drift `px`, wind = looping noise. */
export const ForeFrame: React.FC<{ t: number; kind?: ("grass" | "branchL" | "branchR" | "rocks" | "reeds" | "seaweed" | "crab" | "debris" | "flowers")[]; tone?: string; tone2?: string; rim?: string; blur?: number; px?: number; h?: number; o?: number }> = ({ t, kind = ["grass"], tone = "#0d1d2a", tone2 = "#13283a", rim = "rgba(170,200,255,0.55)", blur = 7, px = 0, h = 1, o = 1 }) => {
  const W = 1080, H = 1920, el: React.ReactNode[] = [];
  if (kind.includes("grass") || kind.includes("reeds")) { const reeds = kind.includes("reeds");
    for (let i = 0; i < 46; i++) { const side = rnd(i * 3) < 0.5 ? rnd(i) * 0.36 : 0.64 + rnd(i) * 0.36, x = side * W + px * (0.8 + rnd(i * 5) * 0.6), hh = (180 + rnd(i * 7) * 340) * h * (side > 0.25 && side < 0.75 ? 0.55 : 1), sw = (noise1(t * 0.9, i) * 40 + Math.sin(t * 1.7 + i) * 10) * (hh / 400), wd = reeds ? 9 : 13 + rnd(i * 9) * 10;
      const tipx = x + sw + (rnd(i * 11) - 0.5) * 60, tipy = H - hh; const col = i % 2 ? tone : tone2;
      el.push(<path key={"g" + i} d={`M ${x - wd} ${H + 10} Q ${x + sw * 0.4 - wd * 0.3} ${H - hh * 0.55} ${tipx} ${tipy} Q ${x + sw * 0.4 + wd * 0.3} ${H - hh * 0.55} ${x + wd} ${H + 10} Z`} fill={col} />);
      if (rnd(i * 13) > 0.55) el.push(<path key={"r" + i} d={`M ${x + wd * 0.4} ${H - hh * 0.25} Q ${x + sw * 0.4 + wd * 0.2} ${H - hh * 0.6} ${tipx} ${tipy}`} stroke={rim} strokeWidth={3} fill="none" />);
      if (reeds && rnd(i * 17) > 0.6) el.push(<ellipse key={"c" + i} cx={tipx} cy={tipy + 30} rx={9} ry={30} fill={tone2} transform={`rotate(${sw * 0.3} ${tipx} ${tipy + 30})`} />); } }
  if (kind.includes("rocks")) for (let i = 0; i < 3; i++) { const x = (i === 1 ? 0.92 : i * 0.08) * W + px * 1.2, r = 120 + rnd(i * 3) * 90; el.push(<ellipse key={"k" + i} cx={x} cy={H + 30} rx={r * 1.3} ry={r * 0.8} fill={tone2} />, <path key={"kr" + i} d={`M ${x - r} ${H - r * 0.45} Q ${x} ${H - r * 0.85} ${x + r * 0.9} ${H - r * 0.5}`} stroke={rim} strokeWidth={4} fill="none" />); }
  for (const k of ["branchL", "branchR"] as const) if (kind.includes(k)) { const L = k === "branchL", bx = L ? -40 + px * 1.4 : W + 40 + px * 1.4, by = 120, sway = noise1(t * 0.7, L ? 3 : 7) * 4;
    const leaves = Array.from({ length: 16 }, (_, i) => { const u = i / 15, x = bx + (L ? 1 : -1) * u * 420, y = by + u * 160 + Math.sin(u * 5) * 30, a = (L ? 1 : -1) * (30 + rnd(i * 3) * 80) + Math.sin(t * 1.3 + i) * 8 + sway * 2;
      return <ellipse key={i} cx={x + (rnd(i * 5) - 0.5) * 40} cy={y + (rnd(i * 7) - 0.5) * 60} rx={48 + rnd(i) * 24} ry={17 + rnd(i * 2) * 7} fill={i % 2 ? tone : tone2} transform={`rotate(${a} ${x} ${y})`} />; });
    el.push(<g key={k} transform={`rotate(${sway} ${bx} ${by})`}><path d={`M ${bx} ${by - 30} Q ${bx + (L ? 220 : -220)} ${by + 40} ${bx + (L ? 440 : -440)} ${by + 170}`} stroke={tone} strokeWidth={26} fill="none" strokeLinecap="round" />{leaves}</g>); }
  if (kind.includes("seaweed")) for (let i = 0; i < 9; i++) { const x = (i < 5 ? i * 0.07 : 0.68 + (i - 5) * 0.08) * W + px, hh = 160 + rnd(i * 3) * 160, sw = noise1(t * 0.8, i + 20) * 30;
    el.push(<path key={"sw" + i} d={`M ${x} ${H + 10} C ${x + sw - 30} ${H - hh * 0.4}, ${x + sw + 30} ${H - hh * 0.7}, ${x + sw * 1.4} ${H - hh}`} stroke={i % 2 ? "#1f5a3a" : "#2a6e46"} strokeWidth={16} fill="none" strokeLinecap="round" />); }
  if (kind.includes("crab")) { const cx = W * 0.84 + px * 1.3 + Math.sin(t * 1.4) * 22, cy = H - 70, k = Math.sin(t * 9) * 4;
    el.push(<g key="crab"><ellipse cx={cx} cy={cy} rx={70} ry={44} fill="#e2553a" stroke="#1a1a1a" strokeWidth={7} />{[-1, 1].map((sd) => <g key={sd}><path d={`M ${cx + sd * 50} ${cy - 20} Q ${cx + sd * 90} ${cy - 70 + k} ${cx + sd * 100} ${cy - 50}`} stroke="#1a1a1a" strokeWidth={8} fill="none" /><circle cx={cx + sd * 104} cy={cy - 56 + k} r={22} fill="#e2553a" stroke="#1a1a1a" strokeWidth={6} /></g>)}
      {[-1, 1].map((sd) => <g key={"e" + sd}><line x1={cx + sd * 18} y1={cy - 36} x2={cx + sd * 22} y2={cy - 66} stroke="#1a1a1a" strokeWidth={6} /><circle cx={cx + sd * 22} cy={cy - 72} r={12} fill="#fff" stroke="#1a1a1a" strokeWidth={5} /><circle cx={cx + sd * 24} cy={cy - 71} r={5} fill="#1a1a1a" /></g>)}</g>); }
  if (kind.includes("flowers")) for (let i = 0; i < 6; i++) { const x = (i < 3 ? 0.04 + i * 0.09 : 0.72 + (i - 3) * 0.1) * W + px, y = H - 120 - rnd(i) * 160 + noise1(t, i) * 8;
    el.push(<g key={"fl" + i}><line x1={x} y1={H} x2={x + noise1(t, i) * 10} y2={y} stroke={tone2} strokeWidth={8} />{[0, 1, 2, 3, 4].map((j) => <circle key={j} cx={x + Math.cos(j * 1.256) * 20} cy={y + Math.sin(j * 1.256) * 20} r={15} fill={i % 2 ? "#7a6ad0" : "#c86aa8"} />)}<circle cx={x} cy={y} r={11} fill="#ffd23a" /></g>); }
  if (kind.includes("debris")) for (let i = 0; i < 5; i++) { const x = (i < 3 ? i * 0.12 : 0.78 + (i - 3) * 0.14) * W + px * 1.5 + Math.sin(t * 0.5 + i) * 14, y = H - 60 - rnd(i * 3) * 220 + Math.sin(t * 0.7 + i) * 18, r = 50 + rnd(i * 5) * 70;
    el.push(<g key={"db" + i} transform={`rotate(${t * 8 * (i % 2 ? 1 : -1) + i * 40} ${x} ${y})`}><path d={`M ${x - r} ${y} L ${x - r * 0.4} ${y - r * 0.8} L ${x + r * 0.6} ${y - r * 0.6} L ${x + r} ${y + r * 0.2} L ${x + r * 0.2} ${y + r * 0.8} L ${x - r * 0.7} ${y + r * 0.6} Z`} fill={tone} /><path d={`M ${x - r * 0.4} ${y - r * 0.8} L ${x + r * 0.6} ${y - r * 0.6}`} stroke={rim} strokeWidth={5} /></g>); }
  return <svg width={W} height={H} style={{ position: "absolute", inset: 0, filter: `blur(${blur}px)`, pointerEvents: "none", opacity: o }}>{el}</svg>;
};
/* film grain (neutral, very low) — changes every frame */
export const Grain: React.FC<{ f: number; o?: number }> = ({ f, o = 0.07 }) => (
  <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: o, mixBlendMode: "overlay" }}>
    <filter id={"gr" + (f % 7)}><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={f % 97} stitchTiles="stitch" /><feColorMatrix type="saturate" values="0" /></filter>
    <rect width="100%" height="100%" filter={`url(#gr${f % 7})`} />
  </svg>
);
/* soft vignette with a per-scene tint (edges only, never over the character in the centre) */
export const Vignette: React.FC<{ k?: number; col?: string }> = ({ k = 0.45, col = "5,8,30" }) => (
  <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: `radial-gradient(ellipse 75% 62% at 50% 40%, rgba(${col},0) 55%, rgba(${col},${k}) 100%)` }} />
);
/* iris transition (clean, no double exposure): circle opening from black */
export const Iris: React.FC<{ k: number; cx?: number; cy?: number }> = ({ k, cx = 540, cy = 760 }) => k >= 1 ? null : (
  <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: `radial-gradient(circle at ${cx}px ${cy}px, rgba(0,0,0,0) ${Math.max(0, k * 1300 - 2)}px, #000 ${k * 1300}px)` }} />
);

/* ---------------- lights helper: key + fill + rim colour for characters (LookContext) ---------------- */
export const Lights: React.FC<{ amb: number; keyL: [V3, string, number]; fill?: [V3, string, number]; look: Look; fog?: [string, number, number]; children?: React.ReactNode }> = ({ amb, keyL: k, fill, look, fog, children }) => (
  <LookContext.Provider value={look}>
    <ambientLight intensity={amb} /><directionalLight position={k[0]} color={k[1]} intensity={k[2]} />
    {fill ? <directionalLight position={fill[0]} color={fill[1]} intensity={fill[2]} /> : null}
    {fog ? <fog attach="fog" args={fog} /> : null}
    {children}
  </LookContext.Provider>
);
void Grass;
