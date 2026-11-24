// v19 (EP11) LIVING HOODIE — Stickman's red hoodie as its own character (hood up, empty dark opening with big eyes,
// sleeves as arms, drawstrings + kangaroo pocket), same palette/outline as the rig. Plus a Kite prop and a Rope (3D string).
//   <LivingHoodie p={[x,y,z]} t={t} h={1.4} pose={{ armL: 120, armR: 40, eyes: 1, wink: 0, mood: "happy", squash: 0.1, tilt: 8 }} />
import React from "react";
import * as THREE from "three";
import { Billboard, Shadow } from "../style/toon";
import { V3 } from "../style/kit";
import { useLook } from "./character";

export type HoodiePose = {
  armL?: number; armR?: number; /* sleeve angle from hanging down, deg (+ = outward / up) */ bendL?: number; bendR?: number; /* elbow bend deg */
  eyes?: number; /* 0..1 open */ wink?: number; lookX?: number; lookY?: number; mood?: "happy" | "sad" | "shock" | "sneaky";
  squash?: number; /* + stretch, - squash */ tilt?: number; /* deg */ wiggle?: number; /* 0..1 hem/sleeve wave */ flip?: boolean;
};
const INK = "#1A1A1A", RED = "#D62828", RED_L = "#F05454", RED_D = "#A61E1E", RED_DD = "#7e1414", HOLE = "#2a0b10";
type P = [number, number];
const rad = (d: number) => (d * Math.PI) / 180;
function stroke(c: CanvasRenderingContext2D, w = 9, col = INK) { c.lineWidth = w; c.strokeStyle = col; c.stroke(); }

/* tapered sleeve along a 2-segment arm (shoulder -> elbow -> cuff), drawn as a thick stroked path with an outline */
function sleeve(c: CanvasRenderingContext2D, s: P, a: number, b: number, sx: number, t: number, wig: number) {
  const L1 = 120, L2 = 118, A = rad(a) * sx, B = rad(a + b) * sx;
  const e: P = [s[0] + Math.sin(A) * L1, s[1] + Math.cos(A) * L1 + Math.sin(t * 0.4 + sx) * wig * 6];
  const w: P = [e[0] + Math.sin(B) * L2, e[1] + Math.cos(B) * L2 + Math.sin(t * 0.4 + sx + 1) * wig * 10];
  for (const [wd, col] of [[78, INK], [62, RED]] as [number, string][]) { c.beginPath(); c.moveTo(s[0], s[1]); c.quadraticCurveTo(e[0], e[1], w[0], w[1]); c.lineWidth = wd; c.strokeStyle = col; c.lineCap = "round"; c.stroke(); }
  c.beginPath(); c.moveTo(s[0] + 10 * sx, s[1] + 8); c.quadraticCurveTo(e[0] + 10 * sx, e[1], w[0] + 8 * sx, w[1]); stroke(c, 10, RED_L);
  // ribbed cuff + empty opening (no hand inside)
  const ang = Math.atan2(w[1] - e[1], w[0] - e[0]);
  c.save(); c.translate(w[0], w[1]); c.rotate(ang);
  c.beginPath(); c.roundRect(-16, -33, 34, 66, 12); c.fillStyle = RED_D; c.fill(); stroke(c, 7);
  for (let i = -20; i <= 20; i += 10) { c.beginPath(); c.moveTo(-10, i); c.lineTo(12, i); stroke(c, 2.5, "rgba(0,0,0,0.25)"); }
  c.beginPath(); c.ellipse(18, 0, 9, 26, 0, 0, Math.PI * 2); c.fillStyle = HOLE; c.fill(); stroke(c, 5);
  c.restore();
  return w;
}

export function drawLivingHoodie(c: CanvasRenderingContext2D, W: number, H: number, t: number, o: HoodiePose = {}) {
  c.clearRect(0, 0, W, H); c.save();
  const S = H / 1000; c.translate(W / 2, H * 0.97); c.scale(S, S); if (o.flip) c.scale(-1, 1);
  const sq = o.squash ?? 0; c.rotate(rad(o.tilt ?? 0)); c.scale(1 - sq * 0.5, 1 + sq);
  c.lineCap = "round"; c.lineJoin = "round";
  const wig = o.wiggle ?? 0, T = t * 30;
  // origin = hem centre; torso from y -330 to 0; hood above to ~ -620
  const shL: P = [-112, -300], shR: P = [112, -300];
  // back of the hood (behind the sleeves)
  // sleeves behind the body when they hang, in front when raised: draw raised ones later
  const armL = o.armL ?? 12, armR = o.armR ?? 12;
  const back: [P, number, number, number][] = [], front: [P, number, number, number][] = [];
  (armL > 95 ? front : back).push([shL, armL, o.bendL ?? 10, -1]); (armR > 95 ? front : back).push([shR, armR, o.bendR ?? 10, 1]);
  for (const [s, a, b, sx] of back) sleeve(c, s, a, b, sx, T, wig);
  // torso
  const hem = (x: number) => Math.sin(x * 0.04 + T * 0.35) * 10 * wig;
  c.beginPath(); c.moveTo(-70, -330);
  c.bezierCurveTo(-110, -326, -136, -300, -140, -262); c.bezierCurveTo(-148, -190, -146, -90, -138, -30); c.lineTo(-136, hem(-136));
  for (let x = -136; x <= 136; x += 17) c.lineTo(x, 8 + hem(x));
  c.lineTo(138, -30); c.bezierCurveTo(146, -90, 148, -190, 140, -262); c.bezierCurveTo(136, -300, 110, -326, 70, -330); c.closePath();
  const g = c.createLinearGradient(-140, 0, 140, 0); g.addColorStop(0, RED_L); g.addColorStop(0.5, RED); g.addColorStop(1, RED_D); c.fillStyle = g; c.fill();
  c.save(); c.clip();
  c.fillStyle = RED_D; c.fillRect(-160, -46, 320, 80); for (let i = -130; i <= 130; i += 13) { c.beginPath(); c.moveTo(i, -44); c.lineTo(i, 14); stroke(c, 2.5, "rgba(0,0,0,0.22)"); }
  c.fillStyle = "rgba(120,0,10,0.22)"; c.beginPath(); c.ellipse(132, -170, 40, 170, 0, 0, Math.PI * 2); c.fill();
  // kangaroo pocket
  c.beginPath(); c.moveTo(-74, -178); c.lineTo(74, -178); c.quadraticCurveTo(98, -110, 100, -58); c.lineTo(-100, -58); c.quadraticCurveTo(-98, -110, -74, -178); c.closePath(); c.fillStyle = "#e3302f"; c.fill(); stroke(c, 6);
  for (const sx of [-1, 1]) { c.beginPath(); c.moveTo(sx * 74, -178); c.quadraticCurveTo(sx * 60, -110, sx * 100, -60); c.quadraticCurveTo(sx * 80, -112, sx * 74, -178); c.fillStyle = RED_DD; c.fill(); stroke(c, 5); }
  c.setLineDash([9, 8]); c.beginPath(); c.moveTo(-64, -166); c.lineTo(64, -166); stroke(c, 3, RED_DD); c.setLineDash([]);
  c.restore();
  c.beginPath(); c.moveTo(-70, -330); c.bezierCurveTo(-110, -326, -136, -300, -140, -262); c.bezierCurveTo(-148, -190, -146, -90, -138, -30); c.lineTo(-136, hem(-136));
  for (let x = -136; x <= 136; x += 17) c.lineTo(x, 8 + hem(x));
  c.lineTo(138, -30); c.bezierCurveTo(146, -90, 148, -190, 140, -262); c.bezierCurveTo(136, -300, 110, -326, 70, -330); c.closePath(); stroke(c, 9);
  // hood (up, empty), opening with the face
  const hb = -470 + Math.sin(T * 0.12) * 4;
  c.beginPath(); c.moveTo(-104, -300); c.bezierCurveTo(-150, -380, -140, hb - 150, 0, hb - 168); c.bezierCurveTo(140, hb - 150, 150, -380, 104, -300); c.quadraticCurveTo(0, -270, -104, -300); c.closePath();
  const hg = c.createLinearGradient(-130, hb - 160, 130, -300); hg.addColorStop(0, RED_L); hg.addColorStop(0.6, RED); hg.addColorStop(1, RED_D); c.fillStyle = hg; c.fill(); stroke(c, 9);
  c.beginPath(); c.ellipse(0, hb + 18, 92, 104, 0, 0, Math.PI * 2); c.fillStyle = HOLE; c.fill(); stroke(c, 8);
  c.beginPath(); c.ellipse(0, hb + 18, 104, 116, 0, Math.PI * 1.05, Math.PI * 1.95); stroke(c, 6, RED_DD);
  // eyes inside the opening
  const op = Math.max(0, Math.min(1, o.eyes ?? 1)), lx = (o.lookX ?? 0) * 9, ly = (o.lookY ?? 0) * 8;
  for (const sx of [-1, 1]) { const q: P = [sx * 38, hb + 4], wink = sx < 0 ? (o.wink ?? 0) : 0, h = 36 * op * (1 - wink);
    if (h < 4) { c.beginPath(); c.moveTo(q[0] - 24, q[1] + 4); c.quadraticCurveTo(q[0], q[1] - 16, q[0] + 24, q[1] + 4); stroke(c, 8, "#ffffff"); continue; }
    c.beginPath(); c.ellipse(q[0], q[1], 25, h, 0, 0, Math.PI * 2); c.fillStyle = "#ffffff"; c.fill();
    c.save(); c.beginPath(); c.ellipse(q[0], q[1], 25, h, 0, 0, Math.PI * 2); c.clip();
    c.beginPath(); c.ellipse(q[0] + lx, q[1] + ly + 4, 13, 17, 0, 0, Math.PI * 2); c.fillStyle = INK; c.fill();
    c.beginPath(); c.arc(q[0] + lx - 5, q[1] + ly - 5, 5, 0, Math.PI * 2); c.fillStyle = "#ffffff"; c.fill(); c.restore();
    if (o.mood === "sad") { c.beginPath(); c.moveTo(q[0] - sx * 30, q[1] - h - 2); c.lineTo(q[0] + sx * 16, q[1] - h - 16); stroke(c, 7, "#ffffff"); }
    if (o.mood === "sneaky") { c.beginPath(); c.moveTo(q[0] - 28, q[1] - h * 0.35); c.lineTo(q[0] + 28, q[1] - h * 0.35); stroke(c, 8, HOLE); } }
  const my = hb + 62;
  if (o.mood === "shock") { c.beginPath(); c.ellipse(0, my, 12, 15, 0, 0, Math.PI * 2); c.fillStyle = "#ffffff"; c.fill(); }
  else if (o.mood === "sad") { c.beginPath(); c.moveTo(-22, my + 10); c.quadraticCurveTo(0, my - 8, 22, my + 10); stroke(c, 7, "#ffffff"); }
  else { c.beginPath(); c.moveTo(-30, my - 4); c.quadraticCurveTo(0, my + 22, 30, my - 4); stroke(c, 7, "#ffffff"); }
  // drawstrings
  for (const sx of [-1, 1]) { const sw = Math.sin(T * 0.17 + sx) * (4 + wig * 14); c.beginPath(); c.moveTo(sx * 30, -300); c.quadraticCurveTo(sx * 34 + sw, -250, sx * 36 + sw * 1.6, -200);
    stroke(c, 14); c.beginPath(); c.moveTo(sx * 30, -300); c.quadraticCurveTo(sx * 34 + sw, -250, sx * 36 + sw * 1.6, -200); stroke(c, 7, "#ffffff");
    c.beginPath(); c.roundRect(sx * 36 + sw * 1.6 - 9, -204, 18, 26, 4); c.fillStyle = "#e6eaf6"; c.fill(); stroke(c, 5); }
  for (const [s, a, b, sx] of front) sleeve(c, s, a, b, sx, T, wig);
  c.restore();
}

/* sleeve-end (cuff) position in world space for a hoodie billboard at p (same maths as drawLivingHoodie, unflipped, no tilt) */
export function hoodieCuff(p: V3, h: number, arm: number, bend: number, sx: 1 | -1, cam: V3): V3 {
  const A = rad(arm) * sx, B = rad(arm + bend) * sx, s: P = [sx * 112, -300];
  const w: P = [s[0] + Math.sin(A) * 120 + Math.sin(B) * 136, s[1] + Math.cos(A) * 120 + Math.cos(B) * 136];
  const u = h / 1000, yaw = Math.atan2(cam[0] - p[0], cam[2] - p[2]); // billboard plane basis
  const lx = w[0] * u, ly = -w[1] * u; // canvas origin (hem) sits 1.3 % of h above p (billboard centre is at p + 0.483 h)
  return [p[0] + Math.cos(yaw) * lx, p[1] + h * 0.013 + ly, p[2] - Math.sin(yaw) * lx];
}

export const LivingHoodie: React.FC<{ p: V3; t: number; h?: number; pose?: HoodiePose; shadow?: boolean; groundY?: number; res?: number }> = ({ p, t, h = 1.6, pose = {}, shadow = true, groundY, res = 1024 }) => {
  const look = useLook(); const air = p[1] - (groundY ?? 0);
  return (<>
    {shadow ? <Shadow p={[p[0], groundY ?? 0, p[2]]} r={h * 0.3 / (1 + air * 0.4)} o={0.45 / (1 + air * 0.5)} /> : null}
    <Billboard p={p} h={h} res={res} aspect={1} draw={(c, W, H) => { drawLivingHoodie(c, W, H, t, pose);
      c.save(); c.globalCompositeOperation = "source-atop"; const g = c.createLinearGradient(W * 0.55, 0, W, 0); g.addColorStop(0, `rgba(${look.rim},0)`); g.addColorStop(1, `rgba(${look.rim},${look.rimK * 0.7})`); c.fillStyle = g; c.fillRect(0, 0, W, H); c.restore(); }} />
  </>);
};

/* diamond kite with a bow tail; p = kite centre */
export const Kite: React.FC<{ p: V3; t: number; s?: number; col?: string }> = ({ p, t, s = 1.1, col = "#ffd23a" }) => (
  <Billboard p={[p[0], p[1] - s * 0.95, p[2]]} h={s * 1.9} res={512} aspect={1} draw={(c, W, H) => {
    c.clearRect(0, 0, W, H); const cx = W / 2, cy = H * 0.3, a = W * 0.22, b = H * 0.27; c.lineJoin = "round"; c.lineCap = "round";
    c.save(); c.translate(cx, cy); c.rotate(Math.sin(t * 2.1) * 0.12);
    c.beginPath(); c.moveTo(0, -b); c.lineTo(a, -b * 0.15); c.lineTo(0, b); c.lineTo(-a, -b * 0.15); c.closePath(); c.fillStyle = col; c.fill(); c.lineWidth = 8; c.strokeStyle = INK; c.stroke();
    c.beginPath(); c.moveTo(0, -b); c.lineTo(0, b); c.lineTo(-a, -b * 0.15); c.closePath(); c.fillStyle = "#2fa0e8"; c.fill(); c.stroke();
    c.beginPath(); c.moveTo(-a, -b * 0.15); c.lineTo(a, -b * 0.15); c.lineWidth = 5; c.stroke();
    // tail
    c.beginPath(); c.moveTo(0, b); let x = 0, y = b; const pts: P[] = [];
    for (let i = 1; i <= 8; i++) { x = Math.sin(t * 3 + i * 0.8) * 18; y = b + i * 26; c.lineTo(x, y); if (i % 2 === 0) pts.push([x, y]); } c.lineWidth = 4; c.stroke();
    pts.forEach(([bx, by], i) => { c.beginPath(); c.moveTo(bx, by); c.lineTo(bx - 14, by - 9); c.lineTo(bx - 14, by + 9); c.closePath(); c.moveTo(bx, by); c.lineTo(bx + 14, by - 9); c.lineTo(bx + 14, by + 9); c.closePath(); c.fillStyle = i % 2 ? "#e5483f" : "#2fa0e8"; c.fill(); c.lineWidth = 3; c.stroke(); });
    c.restore();
  }} />
);

/* thin 3D string between two world points */
export const Rope: React.FC<{ a: V3; b: V3; r?: number; col?: string }> = ({ a, b, r = 0.012, col = "#f4f4f4" }) => {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), L = d.length(); if (L < 1e-4) return null;
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize()), m = A.clone().add(B).multiplyScalar(0.5);
  return <mesh position={[m.x, m.y, m.z]} quaternion={q}><cylinderGeometry args={[r, r, L, 6]} /><meshBasicMaterial color={col} /></mesh>;
};
