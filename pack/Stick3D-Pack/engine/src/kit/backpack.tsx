// v20 (EP12) LIVING BACKPACK — Stickman's navy backpack as its own character: big eyes on the flap, the main zip is a mouth
// (zip teeth = teeth, dark inside, pink tongue), strap legs with buckle feet for hopping, belly that bulges when full.
// Same palette/outline as the rig (backpack #2B2D42 / pocket #4A4E6E / ink #1A1A1A).
//   <LivingBackpack p={[x,y,z]} t={t} h={1.1} pose={{ mouth: 0.8, mood: "hungry", lookX: 0.3, squash: 0.1, full: 0.4 }} />
// Plus: food + desk props (Homework, Crayons, AlarmClock, Cake, GiantCookie) as one <Prop kind=... />, Crumbs, MusicNotes,
// BedroomDoor (left wall of the HomeSet bedroom), BakeryFront (shop front for the Street set), COOKIE_PATH (magic-pencil drawing).
import React from "react";
import { Billboard, Shadow, Box, Cyl, CanvasPlane, INK } from "../style/toon";
import { SGlow } from "../style/sky";
import type { Path2 } from "../style/sky";
import { V3 } from "../style/kit";
import { useLook } from "./character";

export type BagPose = {
  mouth?: number; /* 0..1 open (1 = huge, the body stretches) */ tongue?: number; /* 0..1 tongue out */ eyes?: number; /* 0..1 open */
  mood?: "hungry" | "happy" | "sneaky" | "sleepy" | "shock" | "full"; lookX?: number; lookY?: number;
  squash?: number; /* + stretch, - squash */ tilt?: number; /* deg */ full?: number; /* 0..1 belly bulge */ legs?: number; /* -1..1 stride / tuck */ flip?: boolean;
};
const NAVY = "#2B2D42", NAVY_L = "#454866", NAVY_D = "#1c1d2e", POCKET = "#4A4E6E", INSIDE = "#4a0d1c", TONGUE = "#ff6f8f", TONGUE_D = "#d8456a", ZIP = "#e8ebf4";
type P = [number, number];
const rad = (d: number) => (d * Math.PI) / 180;
function stroke(c: CanvasRenderingContext2D, w = 9, col = INK) { c.lineWidth = w; c.strokeStyle = col; c.stroke(); }
function rr(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) { c.beginPath(); c.roundRect(x, y, w, h, r); }

export function drawLivingBackpack(c: CanvasRenderingContext2D, W: number, H: number, t: number, o: BagPose = {}) {
  c.clearRect(0, 0, W, H); c.save();
  const S = H / 1000; c.translate(W / 2, H * 0.97); c.scale(S, S); if (o.flip) c.scale(-1, 1);
  const sq = o.squash ?? 0, full = o.full ?? 0, m = Math.max(0, Math.min(1, o.mouth ?? 0)), T = t * 30;
  c.rotate(rad(o.tilt ?? 0)); c.lineCap = "round"; c.lineJoin = "round";
  // strap legs (behind the body): from the body bottom to buckle feet on the ground (y = 0)
  const lg = o.legs ?? 0;
  for (const sx of [-1, 1]) { const hip: P = [sx * 120, -150], foot: P = [sx * (150 + 40 * lg * sx), 0], knee: P = [sx * 175 + 30 * lg, -70];
    for (const [wd, col] of [[46, INK], [32, NAVY_D]] as [number, string][]) { c.beginPath(); c.moveTo(hip[0], hip[1]); c.quadraticCurveTo(knee[0], knee[1], foot[0], foot[1] - 14); c.lineWidth = wd; c.strokeStyle = col; c.stroke(); }
    rr(c, foot[0] - 44, -30, 88, 34, 14); c.fillStyle = "#c9cede"; c.fill(); stroke(c, 7); rr(c, foot[0] - 16, -24, 32, 22, 6); stroke(c, 5, "#7c8096"); }
  // body (stretches with the mouth, bulges when full)
  c.save(); c.scale(1 - sq * 0.5 + full * 0.14, 1 + sq + m * 0.22);
  const top = -820, bot = -110, wT = 230 + full * 30, wB = 280 + full * 40, mid = -470;
  const body = () => { c.beginPath(); c.moveTo(-wT + 40, top); c.quadraticCurveTo(0, top - 50, wT - 40, top); c.quadraticCurveTo(wT + 10, top + 10, wT + 6, top + 90);
    c.bezierCurveTo(wB + 30 * full, mid, wB + 10, bot - 60, wB - 30, bot); c.quadraticCurveTo(0, bot + 34, -wB + 30, bot); c.bezierCurveTo(-wB - 10, bot - 60, -wB - 30 * full, mid, -wT - 6, top + 90);
    c.quadraticCurveTo(-wT - 10, top + 10, -wT + 40, top); c.closePath(); };
  body(); const g = c.createLinearGradient(-wB, 0, wB, 0); g.addColorStop(0, NAVY_L); g.addColorStop(0.55, NAVY); g.addColorStop(1, NAVY_D); c.fillStyle = g; c.fill();
  c.save(); c.clip();
  c.fillStyle = "rgba(255,255,255,0.07)"; c.beginPath(); c.ellipse(-wB * 0.55, mid - 60, 60, 260, 0, 0, Math.PI * 2); c.fill();
  // front pocket (lower) with its own little zip
  rr(c, -190, -330, 380, 200, 60); c.fillStyle = POCKET; c.fill(); stroke(c, 7);
  c.beginPath(); c.moveTo(-150, -300); c.quadraticCurveTo(0, -318, 150, -300); stroke(c, 5, "#8a8eae");
  c.restore(); body(); stroke(c, 9);
  // carry handle on top
  c.beginPath(); c.moveTo(-60, top - 18); c.bezierCurveTo(-70, top - 110, 70, top - 110, 60, top - 18); stroke(c, 34); c.beginPath(); c.moveTo(-60, top - 18); c.bezierCurveTo(-70, top - 110, 70, top - 110, 60, top - 18); stroke(c, 20, NAVY_D);
  // MOUTH = the main zip (y ~ -470). Closed: a smiling zip line; open: dark oval with zip teeth top + bottom and a tongue
  const my = -455, mw = 200 + 40 * m, mh = 10 + 330 * m;
  if (m < 0.04) {
    const smile = o.mood === "sneaky" ? 10 : o.mood === "shock" ? 0 : 26;
    c.beginPath(); c.moveTo(-mw, my); c.quadraticCurveTo(0, my + smile, mw, my); stroke(c, 16); c.beginPath(); c.moveTo(-mw, my); c.quadraticCurveTo(0, my + smile, mw, my); stroke(c, 7, ZIP);
    c.beginPath(); c.roundRect(mw - 6, my - 6, 22, 44, 6); c.fillStyle = "#c9cede"; c.fill(); stroke(c, 5); // zip pull
  } else {
    c.beginPath(); c.ellipse(0, my + mh * 0.25, mw, mh * 0.5 + 10, 0, 0, Math.PI * 2); c.fillStyle = INSIDE; c.fill();
    c.save(); c.clip();
    c.fillStyle = "#2a0610"; c.beginPath(); c.ellipse(0, my + mh * 0.38, mw * 0.55, mh * 0.28, 0, 0, Math.PI * 2); c.fill(); // throat
    const tg = Math.max(o.tongue ?? 0, m * 0.6);
    c.beginPath(); c.ellipse(Math.sin(T * 0.2) * 10, my + mh * 0.62 + 40 * tg, mw * 0.62, 70 + 60 * tg, 0, Math.PI, Math.PI * 2); c.fillStyle = TONGUE; c.fill(); stroke(c, 6, TONGUE_D);
    c.beginPath(); c.moveTo(0, my + mh * 0.5); c.lineTo(0, my + mh * 0.62 + 10); stroke(c, 5, TONGUE_D);
    // zip teeth (top row hangs down, bottom row points up)
    const n = 9; for (const row of [-1, 1]) { const yy = row < 0 ? my + mh * 0.25 - mh * 0.5 - 6 : my + mh * 0.25 + mh * 0.5 + 6;
      for (let i = 0; i < n; i++) { const x = -mw * 0.85 + (i + 0.5) * (mw * 1.7 / n); c.beginPath(); c.moveTo(x - 16, yy); c.lineTo(x, yy - row * (30 + 10 * m)); c.lineTo(x + 16, yy); c.closePath(); c.fillStyle = ZIP; c.fill(); stroke(c, 4); } }
    c.restore();
    c.beginPath(); c.ellipse(0, my + mh * 0.25, mw, mh * 0.5 + 10, 0, 0, Math.PI * 2); stroke(c, 10);
    // tongue out over the lower lip (hungry pant)
    if ((o.tongue ?? 0) > 0.3) { const k = o.tongue!; const ty = my + mh * 0.25 + mh * 0.5; c.beginPath(); c.ellipse(30, ty + 40 * k, 62, 70 * k, 0.15, 0, Math.PI * 2); c.fillStyle = TONGUE; c.fill(); stroke(c, 7);
      c.beginPath(); c.moveTo(30, ty + 4); c.lineTo(34, ty + 60 * k); stroke(c, 5, TONGUE_D); }
  }
  // EYES on the flap (y ~ -660), pushed up a bit by a big mouth
  const ey = -665 - m * 60, op = Math.max(0, Math.min(1, o.eyes ?? 1)), lx = (o.lookX ?? 0) * 16, ly = (o.lookY ?? 0) * 14, mood = o.mood ?? "happy";
  for (const sx of [-1, 1]) { const q: P = [sx * 92, ey], R = 62, h = R * 1.1 * op;
    if (mood === "sleepy" || mood === "full" || h < 6) { c.beginPath(); if (mood === "full") { c.moveTo(q[0] - 44, q[1] + 10); c.quadraticCurveTo(q[0], q[1] - 40, q[0] + 44, q[1] + 10); } else { c.moveTo(q[0] - 44, q[1]); c.quadraticCurveTo(q[0], q[1] + 30, q[0] + 44, q[1]); } stroke(c, 12); continue; }
    const yellow = mood === "hungry" || mood === "sneaky";
    c.beginPath(); c.ellipse(q[0], q[1], R, h, 0, 0, Math.PI * 2); c.fillStyle = yellow ? "#ffe14a" : "#ffffff"; c.fill(); stroke(c, 8);
    c.save(); c.beginPath(); c.ellipse(q[0], q[1], R, h, 0, 0, Math.PI * 2); c.clip();
    if (yellow) { c.beginPath(); c.ellipse(q[0] + lx, q[1] + ly, 14, 46, 0, 0, Math.PI * 2); c.fillStyle = INK; c.fill(); }
    else { const pr = mood === "shock" ? 16 : 30; c.beginPath(); c.arc(q[0] + lx, q[1] + ly + 6, pr, 0, Math.PI * 2); c.fillStyle = INK; c.fill(); c.beginPath(); c.arc(q[0] + lx - 10, q[1] + ly - 6, 10, 0, Math.PI * 2); c.fillStyle = "#ffffff"; c.fill(); }
    c.restore();
    if (mood === "hungry") { c.beginPath(); c.moveTo(q[0] - sx * 70, q[1] - h - 30); c.lineTo(q[0] + sx * 46, q[1] - h + 4); stroke(c, 16); }
    if (mood === "sneaky") { c.beginPath(); c.moveTo(q[0] - 60, q[1] - h * 0.35); c.lineTo(q[0] + 60, q[1] - h * 0.35); stroke(c, 14, NAVY); c.beginPath(); c.moveTo(q[0] - 60, q[1] - h * 0.35); c.lineTo(q[0] + 60, q[1] - h * 0.35); stroke(c, 8); }
    if (mood === "happy") { c.beginPath(); c.ellipse(q[0] + sx * 20, q[1] + h + 40, 30, 16, 0, 0, Math.PI * 2); c.fillStyle = "rgba(255,150,170,0.55)"; c.fill(); } }
  c.restore(); c.restore();
}

export const LivingBackpack: React.FC<{ p: V3; t: number; h?: number; pose?: BagPose; shadow?: boolean; groundY?: number; res?: number }> = ({ p, t, h = 1.1, pose = {}, shadow = true, groundY, res = 1024 }) => {
  const look = useLook(); const air = p[1] - (groundY ?? 0);
  return (<>
    {shadow ? <Shadow p={[p[0], groundY ?? 0, p[2]]} r={h * 0.36 / (1 + air * 0.4)} o={0.45 / (1 + air * 0.5)} /> : null}
    <Billboard p={p} h={h} res={res} aspect={1} draw={(c, W, H) => { drawLivingBackpack(c, W, H, t, pose);
      c.save(); c.globalCompositeOperation = "source-atop"; const g = c.createLinearGradient(W * 0.55, 0, W, 0); g.addColorStop(0, `rgba(${look.rim},0)`); g.addColorStop(1, `rgba(${look.rim},${look.rimK * 0.7})`); c.fillStyle = g; c.fillRect(0, 0, W, H); c.restore(); }} />
  </>);
};

/* ---------------- props (canvas billboards, origin = bottom centre; rot = in-plane spin, deg) ---------------- */
export type PropKind = "homework" | "crayons" | "clock" | "cake" | "cookie";
export function drawProp(c: CanvasRenderingContext2D, W: number, H: number, kind: PropKind, t: number, rot = 0, bite = 0) {
  c.clearRect(0, 0, W, H); c.save(); const S = H / 1000; c.translate(W / 2, H * 0.5); c.scale(S, S); c.rotate(rad(rot)); c.lineCap = "round"; c.lineJoin = "round";
  if (kind === "homework") { // sheet of paper: lines, maths, a red A+
    c.rotate(-0.08); rr(c, -330, -430, 660, 860, 18); c.fillStyle = "#fffdf6"; c.fill(); stroke(c, 14);
    for (let y = -300; y <= 360; y += 70) { c.beginPath(); c.moveTo(-270, y); c.lineTo(270, y); stroke(c, 5, "#9cc4f0"); }
    c.beginPath(); c.moveTo(-200, -430); c.lineTo(-200, 430); stroke(c, 5, "#f08a9a");
    c.font = "900 92px Inter, Arial"; c.fillStyle = INK; c.fillText("2+2=4", -170, -190); c.fillText("3x3=9", -170, -50); c.fillText("7-5=2", -170, 90);
    c.font = "900 150px Inter, Arial"; c.fillStyle = "#e5263a"; c.fillText("A+", 60, 330);
  } else if (kind === "crayons") { // three crayons fanned
    [["#e5263a", -18], ["#ffd23a", 0], ["#2fa0e8", 18]].forEach(([col, a]) => { c.save(); c.rotate(rad(a as number)); rr(c, -62, -330, 124, 640, 22); c.fillStyle = col as string; c.fill(); stroke(c, 12);
      c.beginPath(); c.moveTo(-62, -330); c.lineTo(0, -470); c.lineTo(62, -330); c.closePath(); c.fillStyle = col as string; c.fill(); stroke(c, 12);
      rr(c, -62, -200, 124, 70, 6); c.fillStyle = "rgba(0,0,0,0.25)"; c.fill(); rr(c, -62, 160, 124, 70, 6); c.fill(); c.restore(); });
  } else if (kind === "clock") { // red twin-bell alarm clock, shaking hammer
    const sh = Math.sin(t * 60) * 6;
    for (const sx of [-1, 1]) { c.beginPath(); c.arc(sx * 230, -330, 120, Math.PI * (sx < 0 ? 1.05 : 1.45), Math.PI * (sx < 0 ? 1.55 : 1.95)); c.lineTo(sx * 150, -260); c.closePath(); c.fillStyle = "#ffcf3a"; c.fill(); stroke(c, 12); }
    c.beginPath(); c.moveTo(0, -400); c.lineTo(sh, -470); stroke(c, 14);
    for (const sx of [-1, 1]) { c.beginPath(); c.moveTo(sx * 200, 300); c.lineTo(sx * 260, 420); stroke(c, 26); }
    c.beginPath(); c.arc(0, 0, 360, 0, Math.PI * 2); c.fillStyle = "#e5263a"; c.fill(); stroke(c, 14);
    c.beginPath(); c.arc(0, 0, 280, 0, Math.PI * 2); c.fillStyle = "#fffdf6"; c.fill(); stroke(c, 10);
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; c.beginPath(); c.moveTo(Math.sin(a) * 230, -Math.cos(a) * 230); c.lineTo(Math.sin(a) * 260, -Math.cos(a) * 260); stroke(c, i % 3 ? 6 : 12); }
    c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -190); stroke(c, 16); c.beginPath(); c.moveTo(0, 0); c.lineTo(130, 40); stroke(c, 12);
  } else if (kind === "cake") { // three-tier pink cake with drips, candles and a cherry
    const tiers: [number, number, number, string][] = [[-470, 140, 300, "#ffb3c8"], [-330, 140, 230, "#fff1f4"], [-190, 130, 160, "#ffb3c8"]];
    rr(c, -560, 380, 1120, 60, 20); c.fillStyle = "#e8eaf4"; c.fill(); stroke(c, 12); // plate
    tiers.forEach(([_y, hh, ww, col], i) => { const y0 = 380 - (i + 1) * 0 - [0, 230, 430][i] - 230; rr(c, -ww * 1.55, y0, ww * 3.1, hh + 90, 30); c.fillStyle = col; c.fill(); stroke(c, 12);
      c.beginPath(); c.moveTo(-ww * 1.55 + 20, y0 + 10); for (let x = -ww * 1.55 + 20; x <= ww * 1.55 - 20; x += 60) c.quadraticCurveTo(x + 30, y0 + 70 + (x % 120 ? 30 : 0), x + 60, y0 + 10); c.lineTo(ww * 1.55 - 20, y0 + 10); c.fillStyle = i % 2 ? "#ff8fb0" : "#ffffff"; c.fill(); stroke(c, 7);
      for (let x = -ww * 1.4; x <= ww * 1.4; x += 70) { c.beginPath(); c.arc(x, y0 + hh + 40, 9, 0, Math.PI * 2); c.fillStyle = ["#ffd23a", "#2fa0e8", "#7ad36a"][Math.abs(Math.round(x / 70)) % 3]; c.fill(); } });
    for (const x of [-80, 0, 80]) { rr(c, x - 14, -390, 28, 115, 8); c.fillStyle = "#7ec8ff"; c.fill(); stroke(c, 6); c.beginPath(); c.ellipse(x, -420 + Math.sin(t * 20 + x) * 4, 16, 30, 0, 0, Math.PI * 2); c.fillStyle = "#ffcf3a"; c.fill(); stroke(c, 5); }
  } else if (kind === "cookie") { // giant choc-chip cookie (bite = 0..1 removes a bite from the top right)
    c.save(); if (bite > 0) { c.beginPath(); c.rect(-600, -600, 1200, 1200); for (let i = 0; i < 3; i++) { const a = -0.9 + i * 0.45; c.moveTo(Math.cos(a) * 470 + 180 * bite, Math.sin(a) * 470); c.arc(Math.cos(a) * 470, Math.sin(a) * 470, 160 * bite + 20, 0, Math.PI * 2, true); } c.clip("evenodd"); }
    c.beginPath(); for (let i = 0; i <= 40; i++) { const a = (i / 40) * Math.PI * 2, r = 470 + Math.sin(i * 2.7) * 14; i ? c.lineTo(Math.cos(a) * r, Math.sin(a) * r) : c.moveTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath();
    const g = c.createRadialGradient(-120, -140, 40, 0, 0, 480); g.addColorStop(0, "#f4c07a"); g.addColorStop(1, "#c8823e"); c.fillStyle = g; c.fill(); stroke(c, 14);
    for (const [x, y, r] of COOKIE_CHIPS) { c.beginPath(); c.ellipse(x * 900 - 450, y * 900 - 450, r * 900, r * 760, 0.4, 0, Math.PI * 2); c.fillStyle = "#4a2a1a"; c.fill(); }
    c.restore();
  }
  c.restore();
}
const COOKIE_CHIPS: [number, number, number][] = [[0.3, 0.3, 0.05], [0.62, 0.26, 0.045], [0.45, 0.52, 0.055], [0.25, 0.62, 0.045], [0.68, 0.6, 0.05], [0.5, 0.78, 0.04], [0.78, 0.42, 0.035]];
export const Prop: React.FC<{ kind: PropKind; p: V3; h: number; t: number; rot?: number; bite?: number; shadow?: boolean; groundY?: number }> = ({ kind, p, h, t, rot = 0, bite = 0, shadow = false, groundY = 0 }) => (<>
  {shadow ? <Shadow p={[p[0], groundY, p[2]]} r={h * 0.45} o={0.35} /> : null}
  <Billboard p={[p[0], p[1] - h * 0.483, p[2]]} h={h} res={512} aspect={1} draw={(c, W, H) => drawProp(c, W, H, kind, t, rot, bite)} />
</>); // p = prop centre
/* magic-pencil drawing of the cookie (outline + chips), normalized 0..1 (y down) */
export const COOKIE_PATH: Path2[] = [
  Array.from({ length: 41 }, (_, i) => { const a = (i / 40) * Math.PI * 2 - Math.PI / 2; return [0.5 + Math.cos(a) * 0.46, 0.5 + Math.sin(a) * 0.46] as [number, number]; }),
  ...COOKIE_CHIPS.map(([x, y, r]) => Array.from({ length: 13 }, (_, i) => { const a = (i / 12) * Math.PI * 2; return [x + Math.cos(a) * r, y + Math.sin(a) * r] as [number, number]; })),
];

/* crumbs / bits flying out from c (ballistic), t0 = burst time */
export const Crumbs: React.FC<{ c: V3; t: number; t0: number; n?: number; speed?: number; life?: number; colors?: string[]; size?: number }> = ({ c, t, t0, n = 26, speed = 3.2, life = 1.1, colors = ["#c8823e", "#f4c07a", "#4a2a1a", "#e0a060"], size = 0.09 }) => {
  const u = t - t0; if (u < 0 || u > life) return null;
  return (<>{Array.from({ length: n }, (_, i) => { const a = (i * 2.399) % (Math.PI * 2), up = 0.6 + ((i * 0.37) % 1) * 0.9, v = speed * (0.6 + ((i * 0.61) % 1) * 0.6);
    const x = c[0] + Math.cos(a) * v * u, z = c[2] + Math.sin(a) * v * 0.5 * u + 0.4 * u, y = c[1] + up * v * u - 4.9 * u * u, s = size * (1 - (u / life) ** 3) * (0.6 + ((i * 0.29) % 1) * 0.8);
    return <mesh key={i} position={[x, y, z]} rotation={[u * 9 + i, u * 7, i]} scale={[s, s * 0.7, s * 0.8]}><dodecahedronGeometry args={[1, 0]} /><meshToonMaterial color={colors[i % colors.length]} /></mesh>; })}</>);
};

/* music notes floating up from c (dancing sneakers) */
export const MusicNotes: React.FC<{ c: V3; t: number; t0: number; t1: number; n?: number; h?: number }> = ({ c, t, t0, t1, n = 4, h = 0.42 }) => (t < t0 || t > t1 + 1 ? null : <>{Array.from({ length: n }, (_, i) => {
  const per = 1.1, ph = ((t - t0) / per + i / n) % 1, born = t0 + (i / n) * per; if (t < born || t > t1 + ph * per) return null;
  const x = c[0] + (i % 2 ? 0.5 : -0.5) + Math.sin(ph * 6 + i) * 0.15, y = c[1] + ph * 1.6, a = Math.sin(ph * Math.PI);
  return <Billboard key={i} p={[x, y, c[2]]} h={h} res={128} aspect={1} draw={(g, W, H) => { g.clearRect(0, 0, W, H); g.globalAlpha = a; g.font = `900 ${H * 0.8}px Arial`; g.textAlign = "center"; g.textBaseline = "middle"; g.lineWidth = H * 0.07; g.strokeStyle = INK; g.strokeText(i % 2 ? "♪" : "♫", W / 2, H / 2); g.fillStyle = ["#ffd23a", "#ff6aa8", "#2fa0e8", "#7ad36a"][i % 4]; g.fillText(i % 2 ? "♪" : "♫", W / 2, H / 2); }} />; })}</>);

/* door in the HomeSet bedroom's left wall (x = -6.42), hinge at the back edge; open 0..1 swings into the room */
export const DOOR = { p: [-6.38, 0, -3.0] as V3, w: 1.5, h: 3.1 };
export const BedroomDoor: React.FC<{ open?: number }> = ({ open = 0 }) => {
  const { p, w, h } = DOOR, a = open * 1.35;
  return (<group position={p}>
    <Box p={[0.02, h / 2 + 0.05, 0]} s={[0.14, h + 0.25, w + 0.3]} color="#fff6e8" line={3} />
    <mesh position={[0.06, h / 2, 0]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[w, h]} /><meshBasicMaterial color="#3a2a4a" /></mesh>
    <CanvasPlane p={[0.07, h / 2, 0]} rot={[0, Math.PI / 2, 0]} s={[w - 0.1, h - 0.1]} px={[150, 310]} draw={(c, W, H) => { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#ffe0a8"); g.addColorStop(1, "#ffc27a"); c.fillStyle = g; c.fillRect(0, 0, W, H); c.fillStyle = "rgba(255,255,255,0.5)"; c.fillRect(0, H * 0.05, W, H * 0.3); }} />
    <group position={[0.1, 0, -w / 2]} rotation={[0, -a, 0]}>
      <Box p={[0, h / 2, w / 2]} s={[0.08, h, w]} color="#c87a4a" line={3} />
      {[0.25, 0.68].map((y) => <Box key={y} p={[0.05, h * y + 0.3, w / 2]} s={[0.04, h * 0.32, w * 0.7]} color="#d88c5a" line={2} />)}
      <mesh position={[0.1, h * 0.48, w - 0.18]}><sphereGeometry args={[0.07, 12, 8]} /><meshToonMaterial color="#ffc83a" /></mesh>
    </group>
  </group>);
};

/* BAKERY shop front for the Street set (put at STREET.pizza with noPizza); BAKERY.table = outdoor cake table top */
export const BAKERY = { p: [0, 0, -9] as V3, table: [-1.7, 1.05, -5.9] as V3, door: [1.6, 0, -6.95] as V3 };
export const BakeryFront: React.FC<{ t: number; p?: V3 }> = ({ t, p = BAKERY.p }) => (<group position={p}>
  <Box p={[0, 2.4, 0]} s={[6.4, 4.8, 4]} color="#ffe6c8" line={4} /><Box p={[0, 4.95, 0]} s={[6.8, 0.3, 4.4]} color="#8a4a2a" line={3} />
  <group position={[0, 3.15, 2.3]} rotation={[0.5, 0, 0]}><CanvasPlane p={[0, 0, 0]} s={[6.6, 1.4]} px={[660, 140]} draw={(c, W, H) => { for (let i = 0; i < 12; i++) { c.fillStyle = i % 2 ? "#ffffff" : "#ff8fb0"; c.fillRect(i * W / 12, 0, W / 12 + 1, H); } for (let i = 0; i < 12; i++) { c.beginPath(); c.arc((i + 0.5) * W / 12, H, W / 24, 0, Math.PI); c.fillStyle = i % 2 ? "#ffffff" : "#ff8fb0"; c.fill(); } c.lineWidth = 8; c.strokeStyle = INK; c.strokeRect(4, 4, W - 8, H - 8); }} /></group>
  {/* sign board with a cupcake */}
  <group position={[0, 5.8, 1.2]}><Box p={[0, 0, -0.1]} s={[4.6, 1.5, 0.15]} color="#8a4a2a" line={3} />
    <CanvasPlane p={[0, 0, 0]} s={[4.4, 1.3]} px={[660, 196]} draw={(c, W, H) => { c.fillStyle = "#fff4e2"; c.fillRect(0, 0, W, H); c.lineWidth = 8; c.strokeStyle = INK; c.strokeRect(4, 4, W - 8, H - 8);
      c.font = "900 120px Inter, Arial"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillStyle = "#e5487a"; c.lineWidth = 10; c.strokeText("BAKERY", W / 2 + 50, H / 2 + 6); c.fillText("BAKERY", W / 2 + 50, H / 2 + 6);
      c.beginPath(); c.moveTo(70, 110); c.lineTo(150, 110); c.lineTo(140, 170); c.lineTo(80, 170); c.closePath(); c.fillStyle = "#e0a060"; c.fill(); c.lineWidth = 6; c.stroke(); c.beginPath(); c.arc(110, 95, 42, Math.PI, 0); c.fillStyle = "#ffb3c8"; c.fill(); c.stroke(); c.beginPath(); c.arc(110, 50, 10, 0, Math.PI * 2); c.fillStyle = "#e5263a"; c.fill(); }} /></group>
  {/* shop window full of bread, croissants and cupcakes */}
  <Box p={[-1.3, 1.65, 2.02]} s={[3.0, 1.9, 0.06]} color="#fff8ea" line={3} />
  <CanvasPlane p={[-1.3, 1.65, 2.07]} s={[2.8, 1.7]} px={[560, 340]} draw={(c, W, H) => { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#ffe8c0"); g.addColorStop(1, "#ffd090"); c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.lineWidth = 5; c.strokeStyle = INK; for (const sy of [0.42, 0.85]) { c.fillStyle = "#c08850"; c.fillRect(0, H * sy, W, 12); c.strokeRect(0, H * sy, W, 12); }
    for (let i = 0; i < 5; i++) { const x = 50 + i * 110, y = H * 0.42; c.beginPath(); c.ellipse(x, y - 30, 44, 30, 0, Math.PI, 0); c.fillStyle = i % 2 ? "#e0a060" : "#d08a48"; c.fill(); c.stroke(); for (let k = -1; k <= 1; k++) { c.beginPath(); c.moveTo(x + k * 18 - 6, y - 50); c.lineTo(x + k * 18 + 6, y - 38); c.stroke(); } }
    for (let i = 0; i < 6; i++) { const x = 45 + i * 92, y = H * 0.85; c.beginPath(); c.moveTo(x - 30, y); c.lineTo(x + 30, y); c.lineTo(x + 24, y - 40); c.lineTo(x - 24, y - 40); c.closePath(); c.fillStyle = "#e0a060"; c.fill(); c.stroke(); c.beginPath(); c.arc(x, y - 44, 30, Math.PI, 0); c.fillStyle = ["#ffb3c8", "#fff1f4", "#9fd8ff"][i % 3]; c.fill(); c.stroke(); }
    c.fillStyle = "rgba(255,255,255,0.35)"; c.beginPath(); c.moveTo(W * 0.1, 0); c.lineTo(W * 0.25, 0); c.lineTo(W * 0.05, H); c.lineTo(0, H); c.closePath(); c.fill(); }} />
  <SGlow p={[-1.3, 1.65, 2.3]} r={1.6} color="#ffd890" o={0.4} />
  {/* door */}
  <Box p={[1.6, 1.3, 2.02]} s={[1.3, 2.6, 0.06]} color="#e5487a" line={3} /><Box p={[1.6, 1.75, 2.06]} s={[0.9, 1.0, 0.03]} color="#bfe8ff" line={2} />
  <mesh position={[2.05, 1.25, 2.1]}><sphereGeometry args={[0.07, 12, 8]} /><meshToonMaterial color="#ffc83a" /></mesh>
  {/* outdoor display table (the cake stands on it) */}
  <group position={[-1.7, 0, 3.1]}><Box p={[0, 1.0, 0]} s={[1.9, 0.1, 1.0]} color="#ffffff" line={3} />
    <CanvasPlane p={[0, 0.72, 0.51]} s={[1.9, 0.5]} px={[380, 100]} draw={(c, W, H) => { for (let i = 0; i < 10; i++) { c.fillStyle = i % 2 ? "#ffffff" : "#ff8fb0"; c.fillRect(i * W / 10, 0, W / 10 + 1, H); } c.lineWidth = 6; c.strokeStyle = INK; c.strokeRect(3, 3, W - 6, H - 6); }} />
    {[[-0.8, -0.4], [0.8, -0.4], [-0.8, 0.4], [0.8, 0.4]].map(([x, z], i) => <Cyl key={i} p={[x, 0.48, z]} rt={0.04} h={0.96} color="#2b2f40" line={1} />)}
  </group>
  {/* flower pots by the door */}
  {[0.6, 2.6].map((x) => <group key={x} position={[x, 0, 2.6]}><Cyl p={[0, 0.3, 0]} rt={0.28} rb={0.2} h={0.6} color="#d8743a" line={2} /><mesh position={[0, 0.78, 0]}><sphereGeometry args={[0.36, 14, 10]} /><meshToonMaterial color="#5cc060" /></mesh>
    {[0, 1, 2].map((k) => <mesh key={k} position={[Math.cos(k * 2.1) * 0.22, 0.95 + (k % 2) * 0.08, Math.sin(k * 2.1) * 0.2 + 0.1]}><sphereGeometry args={[0.08, 8, 6]} /><meshToonMaterial color={["#ff6aa8", "#ffd23a", "#ffffff"][k]} /></mesh>)}</group>)}
  {void t}
</group>);
