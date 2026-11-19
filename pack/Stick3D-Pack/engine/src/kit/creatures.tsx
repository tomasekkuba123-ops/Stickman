// CREATURES — big characters as proper models (body shape, fins/limbs, mouth that opens with teeth/tongue/inside, belly grooves, highlights).
// GiantWhale: lathe-built body split into rear body + upper head + HINGED LOWER JAW, so the mouth really opens and shows the inside.
// gulpAt(): the swallow action — object follows a suction path INTO the mouth, the jaw snaps shut after it passes the lips, throat bulge travels down.
import React, { useMemo } from "react";
import * as THREE from "three";
import { V3 } from "../style/kit";
import { SGlow } from "../style/sky";
import { INK } from "../style/toon";
import { Extrude } from "../style/extra";

const TAU = Math.PI * 2;
const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const ramp = (() => { const d = new Uint8Array([100, 180, 255]); const t = new THREE.DataTexture(d, 3, 1, THREE.RedFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
const cl = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));

/* body profile along the length axis y (tail -L .. nose +N): radius r(y). Smooth fat head, long taper to the tail stock. */
const L = 7, N = 6.2;
const prof = (y: number) => { const k = (y + L) / (L + N); // 0 tail .. 1 nose
  if (k > 0.82) { const u = (k - 0.82) / 0.18; return 4.6 * Math.sqrt(Math.max(0, 1 - u * u)); } // rounded nose
  return 0.55 + 4.05 * Math.sin(Math.min(1, k / 0.82) * Math.PI * 0.5) ** 1.4; };
const MOUTH_Y = 1.2; // mouth corner (hinge) position along the length
const pts = (y0: number, y1: number, n = 40) => Array.from({ length: n + 1 }, (_, i) => { const y = y0 + ((y1 - y0) * i) / n; return new THREE.Vector2(Math.max(0.001, prof(y)), y); });

function skinTex(top: string, belly: string, nose = false) {
  const cv = document.createElement("canvas"); cv.width = 1024; cv.height = 512; const c = cv.getContext("2d")!;
  // u = around (phi/2pi): 0 and 1 = belly, 0.5 = top (see orientation note in GiantWhale); v = along the length
  const g = c.createLinearGradient(0, 0, 1024, 0); g.addColorStop(0, belly); g.addColorStop(0.16, belly); g.addColorStop(0.27, top); g.addColorStop(0.73, top); g.addColorStop(0.84, belly); g.addColorStop(1, belly);
  c.fillStyle = g; c.fillRect(0, 0, 1024, 512);
  c.strokeStyle = "rgba(90,80,170,0.55)"; c.lineWidth = 7; for (let i = 0; i < 16; i++) { const x = 1024 * (i < 8 ? 0.01 + i * 0.019 : 0.85 + (i - 8) * 0.019); c.beginPath(); c.moveTo(x, 120); c.lineTo(x, 470); c.stroke(); } // belly grooves
  for (let i = 0; i < 70; i++) { const x = 1024 * (0.3 + rnd(i) * 0.4), y = 60 + rnd(i * 3) * 380, r = 4 + rnd(i * 7) * 10; const gg = c.createRadialGradient(x, y, 1, x, y, r * 2.2); gg.addColorStop(0, "rgba(200,250,255,1)"); gg.addColorStop(1, "rgba(200,250,255,0)"); c.fillStyle = gg; c.fillRect(x - r * 3, y - r * 3, r * 6, r * 6); }
  if (nose) { const gn = c.createLinearGradient(0, 0, 0, 140); gn.addColorStop(0, top); gn.addColorStop(1, "rgba(0,0,0,0)"); c.fillStyle = gn; c.fillRect(0, 0, 1024, 140); } // v=1 (canvas top) = nose tip: blend to one colour (no pinch wedges)
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export type WhaleProps = { p: V3; s?: number; t: number; rotY?: number; tilt?: number; jaw?: number; /* 0 closed .. 1 wide open */ eyes?: number; blink?: number; bulge?: number; /* 0..1 position of the throat bulge (swallowed object) */ finFlap?: number; colors?: { top: string; belly: string; fin: string }; glow?: number; children?: React.ReactNode };
export const GiantWhale: React.FC<WhaleProps> = ({ p, s = 1, t, rotY = 0, tilt = 0, jaw = 0, eyes = 1, blink = 0, bulge = -1, finFlap = 1, colors = { top: "#5a62e8", belly: "#d6d8ff", fin: "#4a48c8" }, glow = 1, children }) => {
  const tex = useMemo(() => skinTex(colors.top, colors.belly), [colors.top, colors.belly]), texN = useMemo(() => skinTex(colors.top, colors.belly, true), [colors.top, colors.belly]);
  const geo = useMemo(() => ({ rear: new THREE.LatheGeometry(pts(-L, MOUTH_Y, 50), 48), upper: new THREE.LatheGeometry(pts(MOUTH_Y, N, 24), 40, Math.PI * 0.38, Math.PI * 1.24), jaw: new THREE.LatheGeometry(pts(MOUTH_Y, N * 0.995, 24), 30, Math.PI * 1.62, Math.PI * 0.76) }), []);
  const jawA = jaw * 0.85; // radians the lower jaw drops
  const mat = <meshToonMaterial map={tex} gradientMap={ramp} side={THREE.DoubleSide} />, matN = <meshToonMaterial map={texN} gradientMap={ramp} side={THREE.DoubleSide} />;
  const ink = (g: THREE.BufferGeometry, k = 1.025) => <mesh geometry={g} scale={k}><meshBasicMaterial color={INK} side={THREE.BackSide} /></mesh>;
  const lip = (phi: number, y: number) => { const r = prof(y); return [Math.sin(phi) * r, y, Math.cos(phi) * r] as V3; }; // lathe: x = r sin(phi), z = r cos(phi); world up = -z
  const tailBeat = Math.sin(t * 1.6) * 0.25, bg = bulge >= 0 && bulge <= 1 ? Math.sin(bulge * Math.PI) : 0;
  return (<group position={p} rotation={[tilt, rotY, 0]} scale={s}>
    {/* lathe axis = +y; rotate so the nose points to +z, belly down */}
    <group rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 0.82]}>
      <group rotation={[0, 0, 0]}>
        <mesh geometry={geo.rear} scale={[1 + bg * 0.12 * (bulge < 0.5 ? 1 : 0.6), 1, 1 + bg * 0.1]}>{mat}</mesh>{ink(geo.rear)}
        <mesh geometry={geo.upper}>{matN}</mesh>{ink(geo.upper)}
        {/* mouth inside: dark cavity + throat, seen when the jaw drops */}
        <mesh position={[0, (MOUTH_Y + N) / 2 - 0.4, 0.6]} scale={[3.6, 2.6, 2.4]}><sphereGeometry args={[1, 24, 16]} /><meshBasicMaterial color="#3a0a24" side={THREE.BackSide} /></mesh>
        <mesh position={[0, MOUTH_Y - 0.6, 0.9]} scale={[1.4, 1.4, 1.2]}><sphereGeometry args={[1, 16, 12]} /><meshBasicMaterial color="#14020c" /></mesh>
        {/* upper teeth along the upper lip */}
        {Array.from({ length: 9 }, (_, i) => { const y = MOUTH_Y + 0.8 + i * 0.5; return [-1, 1].map((sd) => { const q = lip(sd > 0 ? Math.PI * 0.38 : Math.PI * 1.62, y); return <mesh key={i + "u" + sd} position={[q[0] * 0.95, q[1], q[2] * 0.95]} rotation={[Math.PI / 2, 0, 0]}><coneGeometry args={[0.16, 0.5, 6]} /><meshToonMaterial color="#fffbea" gradientMap={ramp} /></mesh>; }); })}
      </group>
      {/* hinged lower jaw: rotates around the mouth-corner axis */}
      <group position={[0, MOUTH_Y, 0]} rotation={[jawA, 0, 0]}>
        <group position={[0, -MOUTH_Y, 0]}>
          <mesh geometry={geo.jaw}>{matN}</mesh>{ink(geo.jaw)}
          <mesh position={[0, MOUTH_Y + 2.4, 2.3]} scale={[2.3, 2.6, 0.7]}><sphereGeometry args={[1, 24, 16]} /><meshToonMaterial color="#ff6aa8" gradientMap={ramp} /></mesh>
          <mesh position={[0, MOUTH_Y + 2.2, 1.8]} scale={[3.0, 3.2, 1.4]}><sphereGeometry args={[1, 24, 16]} /><meshBasicMaterial color="#5a1030" side={THREE.BackSide} /></mesh>
          {Array.from({ length: 8 }, (_, i) => { const y = MOUTH_Y + 0.9 + i * 0.5; return [-1, 1].map((sd) => { const q = lip(sd > 0 ? Math.PI * 0.38 : Math.PI * 1.62, y); return <mesh key={i + "l" + sd} position={[q[0] * 0.93, q[1], q[2] * 0.93]} rotation={[-Math.PI / 2, 0, 0]}><coneGeometry args={[0.14, 0.42, 6]} /><meshToonMaterial color="#fffbea" gradientMap={ramp} /></mesh>; }); })}
        </group>
      </group>
      {children}
    </group>
    {/* pectoral fins (curved, flapping) */}
    {[-1, 1].map((sd) => <group key={sd} position={[sd * 3.6, -1.8, 1.8]} rotation={[0.35, sd * 0.4, sd * (0.55 + Math.sin(t * 2.1) * 0.28 * finFlap)]}>
      <Extrude pts={[[0, 0], [sd * 1.6, -0.5], [sd * 3.4, -1.6], [sd * 4.2, -2.9], [sd * 3.0, -2.4], [sd * 1.2, -1.4]]} depth={0.45} color={colors.fin} line={6} /></group>)}
    {/* dorsal bump */}
    <group position={[0, 1.6, -3.2]} rotation={[-0.3, 0, 0]}><Extrude pts={[[-1.0, 0], [0.2, 1.2], [0.9, 0]]} depth={0.5} color={colors.fin} line={5} rot={[0, Math.PI / 2, 0]} /></group>
    {/* tail stock + flukes (beat up/down) */}
    <group position={[0, 0.2, -L + 0.4]} rotation={[tailBeat, 0, 0]}>
      {[-1, 1].map((sd) => <group key={sd} rotation={[Math.PI / 2, 0, 0]}><Extrude pts={[[0, 0], [sd * 1.4, -0.6], [sd * 3.4, -0.4], [sd * 4.0, -1.6], [sd * 2.0, -1.5], [sd * 0.5, -0.9]]} depth={0.35} color={colors.fin} line={6} /></group>)}
    </group>
    {/* eyes with lids */}
    {[-1, 1].map((sd) => { const open = Math.max(0.06, eyes * (1 - blink)); return <group key={sd} position={[sd * 3.0, 1.8, 4.6]} rotation={[0, sd * 0.6, 0]}>
      <mesh scale={[1, open, 0.8]}><sphereGeometry args={[1.0, 28, 20]} /><meshToonMaterial color="#fffbe8" gradientMap={ramp} /></mesh>
      <mesh scale={[1.07, Math.max(0.08, open * 1.07), 0.86]}><sphereGeometry args={[1.0, 20, 14]} /><meshBasicMaterial color={INK} side={THREE.BackSide} /></mesh>
      {open > 0.3 ? <><mesh position={[0, -0.05, 0.55]} scale={[1, open, 1]}><sphereGeometry args={[0.58, 20, 14]} /><meshBasicMaterial color="#1a0a3a" /></mesh><mesh position={[-0.18, 0.22 * open, 0.98]}><sphereGeometry args={[0.18, 10, 8]} /><meshBasicMaterial color="#ffffff" /></mesh></> : null}
      <mesh position={[0, 0.9 * open + 0.1, 0.1]} rotation={[0, 0, sd * -0.15]} scale={[1.1, 0.35, 0.9]}><sphereGeometry args={[1, 16, 10, 0, TAU, 0, Math.PI / 2]} /><meshToonMaterial color={colors.top} gradientMap={ramp} /></mesh>
      {glow > 0 ? <SGlow p={[0, 0, 1.1]} r={2.0} color="#ffe08a" o={0.4 * glow * open} /> : null}
    </group>; })}
    {/* cheeks + highlights (toon specular) */}
    {[-1, 1].map((sd) => <mesh key={sd} position={[sd * 4.15, -0.3, 3.9]} rotation={[0, sd * 0.95, 0]}><circleGeometry args={[0.6, 20]} /><meshBasicMaterial color="#ff8ab8" transparent opacity={0.55} /></mesh>)}
    <SGlow p={[-1.2, 3.6, 2.2]} r={1.3} color="#ffffff" o={0.5} /><SGlow p={[0.6, 3.9, 0.4]} r={0.7} color="#ffffff" o={0.45} />
    {/* blowhole spout */}
    {[0, 1, 2, 3].map((i) => { const u = (t * 0.8 + i * 0.25) % 1; return <SGlow key={i} p={[Math.sin(i * 2) * 0.4, 4.0 + u * 3, 1.2]} r={0.5 + u * 0.6} color="#bfe8ff" o={0.7 * (1 - u)} />; })}
  </group>);
};
/* world position of the whale's mouth centre (for aiming a gulp), given its transform */
export const whaleMouth = (p: V3, s: number, rotY: number, jaw = 1): V3 => { const lz = (N * 0.82 + 0.3) * s, ly = (-0.9 - jaw * 0.8) * s; return [p[0] + Math.sin(rotY) * lz, p[1] + ly, p[2] + Math.cos(rotY) * lz]; };

/* GULP action: object travels from `from` into `mouth` between t0..t1 (accelerating suction), shrinks slightly, spins;
   jaw opens before, stays wide while it flies, SNAPS SHUT 0.12 s after it passes the lips; throat bulge travels afterwards. */
export function gulpAt(t: number, t0: number, t1: number, from: V3, mouth: V3, o: { arc?: number; spin?: number } = {}) {
  const k = cl((t - t0) / (t1 - t0)), e = k * k * (1.6 - 0.6 * k); // ease-in suction
  const pos: V3 = [from[0] + (mouth[0] - from[0]) * e, from[1] + (mouth[1] - from[1]) * e + Math.sin(k * Math.PI) * (o.arc ?? 1.5), from[2] + (mouth[2] - from[2]) * e];
  const inside = t > t1, shut = cl((t - t1 - 0.12) / 0.16);
  const jaw = t < t0 - 0.8 ? 0 : t < t0 ? cl((t - (t0 - 0.8)) / 0.6) : inside ? 1 - (1 - (1 - shut) ** 2) : 1;
  return { pos, scale: 1 - 0.35 * e, rot: (o.spin ?? 2) * e, visible: !inside, jaw, bulge: inside ? cl((t - t1 - 0.2) / 1.2) : -1, squash: inside ? Math.sin(cl((t - t1 - 0.25) / 0.4) * Math.PI) * 0.06 : 0 };
}
