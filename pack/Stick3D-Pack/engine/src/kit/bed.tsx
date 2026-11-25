// v21 (EP14) LIVING BED — Stickman's purple bed as its own character (side view, puppy-like): big eyes + mouth on the headboard,
// four stubby legs with round paws (gallop cycle), the blanket's foot corner wags like a tail, the pillow flops like an ear.
// Same palette/outline as the bedroom bed (frame #7a54d6 / headboard #5a3aa8 / mattress #f4f6fb / pillow #ffd23a) + rig ink.
//   <LivingBed p={[x,y,z]} t={t} h={1.8} pose={{ mood: "happy", mouth: 0.3, legs: phase, wag: 1 }} />
// Plus: Quilt (the blanket as a flying cloth), Zzz, Toothbrush (in its cup; rises, sings), GiantPillow + PILLOW_PATH (magic pencil),
// Trampoline, Slide, SwingSet, Sandbox, PicketFence (playground), StairHall (hallway with a staircase), Ceiling (bedroom ceiling + lamp).
import React from "react";
import * as THREE from "three";
import { Billboard, Shadow, Box, Cyl, Ball, CanvasPlane, INK } from "../style/toon";
import { SGlow } from "../style/sky";
import type { Path2 } from "../style/sky";
import { V3 } from "../style/kit";
import { useLook } from "./character";

type P = [number, number];
const rad = (d: number) => (d * Math.PI) / 180;
function stroke(c: CanvasRenderingContext2D, w = 9, col = INK) { c.lineWidth = w; c.strokeStyle = col; c.stroke(); }
function rr(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) { c.beginPath(); c.roundRect(x, y, w, h, r); }
const FRAME = "#7a54d6", FRAME_L = "#9a78ee", FRAME_D = "#5a3aa8", MATT = "#f4f6fb", PILLOW = "#ffd23a", BLANKET = "#3a6fd8", BLANKET_D = "#2a54b0";

export type BedPose = {
  mood?: "happy" | "sleepy" | "asleep" | "wow" | "play" | "yawn"; mouth?: number; /* 0..1 */ lookX?: number; lookY?: number;
  legs?: number; /* gallop phase (cycles), NaN/undefined = standing */ tuck?: number; /* 0..1 legs tucked (airborne) */ squash?: number; tilt?: number; /* deg */
  wag?: number; /* 0..1 tail wag amount */ ear?: number; /* -1..1 pillow flop */ blanket?: number; /* 0..1 blanket on (0 = bare mattress) */ flip?: boolean;
};

/* canvas: width = 2 x height, origin bottom centre, units: 1000 = canvas height */
export function drawLivingBed(c: CanvasRenderingContext2D, W: number, H: number, t: number, o: BedPose = {}) {
  c.clearRect(0, 0, W, H); c.save();
  const S = H / 1000; c.translate(W / 2, H * 0.97); c.scale(S, S); if (o.flip) c.scale(-1, 1);
  const sq = o.squash ?? 0; c.rotate(rad(o.tilt ?? 0)); c.scale(1 - sq * 0.5, 1 + sq); c.lineCap = "round"; c.lineJoin = "round";
  const mood = o.mood ?? "happy", tuck = o.tuck ?? 0, gal = o.legs;
  // LEGS (behind the frame) — stubby, round paws; gallop = front pair and back pair swing in opposite phase
  const legX = [-560, -330, 380, 610];
  legX.forEach((x, i) => {
    const front = i < 2, ph = gal === undefined || Number.isNaN(gal) ? 0 : Math.sin((gal + (front ? 0 : 0.5) + (i % 2) * 0.12) * Math.PI * 2);
    const ang = ph * 28 * (1 - tuck), len = 250 * (1 - 0.45 * tuck);
    const hip: P = [x, -280], foot: P = [x + Math.sin(rad(ang)) * len + (front ? -40 : 40) * tuck, -280 + Math.cos(rad(ang)) * len];
    c.beginPath(); c.moveTo(hip[0], hip[1]); c.lineTo(foot[0], foot[1] - 30); stroke(c, 86); c.beginPath(); c.moveTo(hip[0], hip[1]); c.lineTo(foot[0], foot[1] - 30); stroke(c, 66, i % 2 ? FRAME_D : FRAME);
    c.beginPath(); c.ellipse(foot[0] + (front ? -14 : 14), foot[1] - 22, 62, 40, 0, 0, Math.PI * 2); c.fillStyle = "#c9a8ff"; c.fill(); stroke(c, 8);
    for (const k of [-1, 0, 1]) { c.beginPath(); c.moveTo(foot[0] + (front ? -14 : 14) + k * 24, foot[1] - 4); c.lineTo(foot[0] + (front ? -14 : 14) + k * 24, foot[1] - 22); stroke(c, 5, "#7a54d6"); }
  });
  // TAIL = the blanket's foot corner, wagging
  const wag = (o.wag ?? 0) * Math.sin(t * 16), bl = Math.max(0, Math.min(1, o.blanket ?? 1));
  if (bl > 0.02) { c.save(); c.globalAlpha = 1; const bx = 780, by = -400;
    c.beginPath(); c.moveTo(bx, by - 60); c.bezierCurveTo(bx + 120, by - 70 + wag * 60, bx + 160, by + 40 + wag * 120, bx + 120 + wag * 70, by + 150 + wag * 40); c.lineTo(bx + 40 + wag * 30, by + 120); c.quadraticCurveTo(bx + 20, by + 40, bx, by + 60); c.closePath();
    c.fillStyle = BLANKET_D; c.fill(); stroke(c, 8); c.restore(); }
  // FOOTBOARD
  rr(c, 740, -640, 120, 400, 50); c.fillStyle = FRAME_D; c.fill(); stroke(c, 9);
  // FRAME rail
  rr(c, -830, -440, 1640, 190, 60); const g = c.createLinearGradient(0, -440, 0, -250); g.addColorStop(0, FRAME_L); g.addColorStop(0.5, FRAME); g.addColorStop(1, FRAME_D); c.fillStyle = g; c.fill(); stroke(c, 10);
  for (const x of [-500, -100, 300]) { c.beginPath(); c.arc(x, -345, 18, 0, Math.PI * 2); c.fillStyle = "#c9a8ff"; c.fill(); stroke(c, 5); }
  // MATTRESS
  rr(c, -780, -580, 1540, 160, 60); c.fillStyle = MATT; c.fill(); stroke(c, 9);
  for (let x = -700; x <= 700; x += 140) { c.beginPath(); c.arc(x, -500, 7, 0, Math.PI * 2); c.fillStyle = "#c8cde0"; c.fill(); }
  // PILLOW (ear): flops with `ear`
  const ear = (o.ear ?? 0) * 40; c.save(); c.translate(-560, -600); c.rotate(rad(ear * 0.6));
  c.beginPath(); c.ellipse(0, -30 - ear * 0.5, 200, 80, rad(-6), 0, Math.PI * 2); c.fillStyle = PILLOW; c.fill(); stroke(c, 9);
  c.beginPath(); c.ellipse(-60, -60 - ear * 0.5, 60, 20, rad(-10), 0, Math.PI * 2); c.fillStyle = "rgba(255,255,255,0.45)"; c.fill(); c.restore();
  // BLANKET draped over the mattress, hanging down the side; stars
  if (bl > 0.02) { c.save(); const x0 = 780 - 1180 * bl;
    c.beginPath(); c.moveTo(x0, -600); c.quadraticCurveTo(200, -650, 790, -600); c.lineTo(800, -330); c.bezierCurveTo(500, -300, 300, -360, 100, -320); c.bezierCurveTo(-100, -290, x0 + 100, -340, x0 - 20, -330); c.closePath();
    const gb = c.createLinearGradient(0, -650, 0, -300); gb.addColorStop(0, "#5a8cf0"); gb.addColorStop(1, BLANKET); c.fillStyle = gb; c.fill(); stroke(c, 9);
    c.save(); c.clip(); for (let i = 0; i < 9; i++) { const sx = x0 + 80 + i * 150, sy = -520 + ((i * 97) % 160); if (sx > 760) continue; star(c, sx, sy, 34, "#ffd23a"); } c.restore();
    c.beginPath(); c.moveTo(x0, -600); c.quadraticCurveTo(200, -650, 790, -600); stroke(c, 14, "#ffffff"); c.restore(); }
  // HEADBOARD with the FACE
  rr(c, -980, -1000, 300, 760, 120); const gh = c.createLinearGradient(-980, 0, -680, 0); gh.addColorStop(0, FRAME_L); gh.addColorStop(1, FRAME_D); c.fillStyle = gh; c.fill(); stroke(c, 10);
  rr(c, -945, -960, 230, 220, 90); c.fillStyle = "rgba(255,255,255,0.12)"; c.fill();
  const lx = (o.lookX ?? 0) * 14, ly = (o.lookY ?? 0) * 12, m = Math.max(0, Math.min(1, o.mouth ?? 0));
  const ey = -800, ex: [number, number] = [-890, -770];
  for (const x of ex) {
    if (mood === "sleepy" || mood === "asleep" || mood === "yawn") { c.beginPath(); if (mood === "sleepy") { c.ellipse(x, ey, 46, 22, 0, 0, Math.PI); c.fillStyle = "#ffffff"; c.fill(); stroke(c, 8); c.beginPath(); c.arc(x + lx * 0.5, ey + 8, 12, 0, Math.PI); c.fillStyle = INK; c.fill(); c.beginPath(); c.moveTo(x - 50, ey); c.lineTo(x + 50, ey); stroke(c, 10); }
      else { c.moveTo(x - 44, ey - 4); c.quadraticCurveTo(x, ey + 34, x + 44, ey - 4); stroke(c, 11); } continue; }
    const R = mood === "wow" ? 62 : 52; c.beginPath(); c.ellipse(x, ey, R * 0.9, R * 1.1, 0, 0, Math.PI * 2); c.fillStyle = "#ffffff"; c.fill(); stroke(c, 8);
    c.save(); c.beginPath(); c.ellipse(x, ey, R * 0.9, R * 1.1, 0, 0, Math.PI * 2); c.clip();
    const pr = mood === "wow" ? 20 : 27; c.beginPath(); c.arc(x + lx - 6, ey + ly + 6, pr, 0, Math.PI * 2); c.fillStyle = INK; c.fill(); c.beginPath(); c.arc(x + lx - 14, ey + ly - 4, 9, 0, Math.PI * 2); c.fillStyle = "#ffffff"; c.fill(); c.restore();
  }
  // cheeks
  for (const x of ex) { c.beginPath(); c.ellipse(x - 10, ey + 90, 30, 16, 0, 0, Math.PI * 2); c.fillStyle = "rgba(255,150,170,0.6)"; c.fill(); }
  // mouth
  const my = -630, mm = mood === "yawn" ? Math.max(m, 0.2) : m;
  if (mm < 0.05) { c.beginPath(); if (mood === "asleep") { c.ellipse(-830, my, 18, 12, 0, 0, Math.PI * 2); stroke(c, 8); } else { c.moveTo(-900, my - 10); c.quadraticCurveTo(-830, my + (mood === "sleepy" ? 10 : 40), -760, my - 10); stroke(c, 11); } }
  else { const mw = 70 + 40 * mm, mh = 20 + 150 * mm; c.beginPath(); c.ellipse(-830, my + mh * 0.3, mw, mh * 0.6, 0, 0, Math.PI * 2); c.fillStyle = "#4a0d1c"; c.fill();
    c.save(); c.clip(); c.beginPath(); c.ellipse(-830, my + mh * 0.75, mw * 0.7, mh * 0.35, 0, 0, Math.PI * 2); c.fillStyle = "#ff6f8f"; c.fill(); c.restore();
    c.beginPath(); c.ellipse(-830, my + mh * 0.3, mw, mh * 0.6, 0, 0, Math.PI * 2); stroke(c, 9);
    if (mood === "play" || mood === "happy") { c.beginPath(); c.ellipse(-800, my + mh * 0.85, 34, 40 * mm + 10, 0.2, 0, Math.PI * 2); c.fillStyle = "#ff6f8f"; c.fill(); stroke(c, 6); } }
  c.restore();
}
function star(c: CanvasRenderingContext2D, x: number, y: number, r: number, col: string) {
  c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr2 = i % 2 ? r * 0.45 : r; c.lineTo(x + Math.cos(a) * rr2, y + Math.sin(a) * rr2); } c.closePath(); c.fillStyle = col; c.fill(); c.lineWidth = 5; c.strokeStyle = INK; c.stroke();
}

/* h = bed height (headboard top) in metres; the bed is 2 h long. p = bottom centre (paws on the ground). */
export const LivingBed: React.FC<{ p: V3; t: number; h?: number; pose?: BedPose; shadow?: boolean; groundY?: number; res?: number }> = ({ p, t, h = 1.8, pose = {}, shadow = true, groundY, res = 1600 }) => {
  const look = useLook(); const air = p[1] - (groundY ?? 0);
  return (<>
    {shadow ? <Shadow p={[p[0], groundY ?? 0, p[2]]} r={h * 0.85 / (1 + air * 0.3)} o={0.42 / (1 + air * 0.4)} /> : null}
    <Billboard p={p} h={h} res={res} aspect={0.5} draw={(c, W, H) => { drawLivingBed(c, W, H, t, pose);
      c.save(); c.globalCompositeOperation = "source-atop"; const g = c.createLinearGradient(W * 0.6, 0, W, 0); g.addColorStop(0, `rgba(${look.rim},0)`); g.addColorStop(1, `rgba(${look.rim},${look.rimK * 0.6})`); c.fillStyle = g; c.fillRect(0, 0, W, H); c.restore(); }} />
  </>);
};
/* the mattress top of a LivingBed at p (world y), for standing / landing on it */
export const bedTop = (p: V3, h = 1.8, squash = 0) => p[1] + h * 0.58 * (1 + squash);

/* QUILT: the blanket on its own (flying off / being tucked in). Centre p, size w x h metres, flutter 0..1, rot deg */
export const Quilt: React.FC<{ p: V3; t: number; w?: number; h?: number; flutter?: number; rot?: number; o?: number }> = ({ p, t, w = 2.4, h = 1.6, flutter = 0, rot = 0, o = 1 }) => (o <= 0 ? null :
  <Billboard p={[p[0], p[1] - h * 0.483 * (w / h > 1 ? h / w : 1), p[2]]} h={Math.max(w, h)} res={900} aspect={1} draw={(c, W, H) => { c.clearRect(0, 0, W, H); c.save(); c.globalAlpha = o; c.translate(W / 2, H / 2); c.rotate(rad(rot));
    const sw = (w / Math.max(w, h)) * W * 0.48, sh = (h / Math.max(w, h)) * H * 0.48, f = flutter;
    c.beginPath(); c.moveTo(-sw, -sh + Math.sin(t * 13) * f * 20);
    for (let i = 1; i <= 8; i++) { const x = -sw + (i / 8) * 2 * sw; c.lineTo(x, -sh + Math.sin(t * 13 + i) * f * 26); }
    for (let i = 1; i <= 8; i++) { const y = -sh + (i / 8) * 2 * sh; c.lineTo(sw + Math.sin(t * 11 + i) * f * 24, y); }
    for (let i = 7; i >= 0; i--) { const x = -sw + (i / 8) * 2 * sw; c.lineTo(x, sh + Math.sin(t * 12 + i * 1.3) * f * 30); }
    for (let i = 7; i >= 1; i--) { const y = -sh + (i / 8) * 2 * sh; c.lineTo(-sw + Math.sin(t * 10 + i) * f * 24, y); } c.closePath();
    const g = c.createLinearGradient(0, -sh, 0, sh); g.addColorStop(0, "#5a8cf0"); g.addColorStop(1, BLANKET); c.fillStyle = g; c.fill(); c.lineWidth = W * 0.008; c.strokeStyle = INK; c.lineJoin = "round"; c.stroke();
    c.save(); c.clip(); const sc = W / 1000; for (let i = 0; i < 12; i++) star(c, -sw + ((i * 0.37) % 1) * 2 * sw, -sh + ((i * 0.61) % 1) * 2 * sh, 34 * sc * 1.4, "#ffd23a"); c.restore();
    c.beginPath(); c.moveTo(-sw, -sh); c.lineTo(sw, -sh); c.lineWidth = W * 0.012; c.strokeStyle = "#ffffff"; c.stroke(); c.restore(); }} />);

/* Zzz floating up from c */
export const Zzz: React.FC<{ c: V3; t: number; t0?: number; t1?: number; n?: number; h?: number }> = ({ c, t, t0 = -99, t1 = 999, n = 3, h = 0.5 }) => (t < t0 || t > t1 + 1.5 ? null : <>{Array.from({ length: n }, (_, i) => {
  const per = 1.8, ph = ((t - t0) / per + i / n) % 1, born = t0 + (i / n) * per; if (t < born && t0 > -50) return null; if (t > t1 + ph * per) return null;
  const x = c[0] + ph * 0.7 + Math.sin(ph * 5 + i) * 0.12, y = c[1] + ph * 1.3, a = Math.sin(ph * Math.PI), s = h * (0.6 + ph * 0.6);
  return <Billboard key={i} p={[x, y, c[2]]} h={s} res={128} aspect={1} draw={(g, W, H) => { g.clearRect(0, 0, W, H); g.globalAlpha = a; g.font = `900 ${H * 0.85}px Inter, Arial`; g.textAlign = "center"; g.textBaseline = "middle"; g.lineWidth = H * 0.1; g.strokeStyle = INK; g.lineJoin = "round"; g.strokeText("Z", W / 2, H / 2); g.fillStyle = "#9fd0ff"; g.fillText("Z", W / 2, H / 2); }} />; })}</>);

/* TOOTHBRUSH in its cup: rise 0..1 (pops up out of the cup), awake 0..1 (eyes open), sing 0..1 (mouth), sway deg */
export type BrushPose = { rise?: number; awake?: number; sing?: number; sway?: number };
export function drawToothbrush(c: CanvasRenderingContext2D, W: number, H: number, t: number, o: BrushPose = {}) {
  c.clearRect(0, 0, W, H); c.save(); const S = H / 1000; c.translate(W / 2, H * 0.97); c.scale(S, S); c.lineCap = "round"; c.lineJoin = "round";
  const rise = o.rise ?? 0, aw = o.awake ?? 0, sing = o.sing ?? 0;
  // handle (behind the cup front): pivot at cup bottom
  c.save(); c.translate(0, -120 - rise * 160); c.rotate(rad((o.sway ?? 0) + 8));
  rr(c, -44, -760, 88, 700, 44); const g = c.createLinearGradient(-44, 0, 44, 0); g.addColorStop(0, "#5ee0d0"); g.addColorStop(1, "#2bb5a8"); c.fillStyle = g; c.fill(); stroke(c, 9);
  rr(c, -30, -560, 60, 260, 30); c.fillStyle = "rgba(255,255,255,0.35)"; c.fill();
  // head + bristles + toothpaste
  rr(c, -50, -900, 100, 160, 40); c.fillStyle = "#5ee0d0"; c.fill(); stroke(c, 9);
  for (let i = 0; i < 5; i++) { rr(c, 44, -890 + i * 30, 70, 22, 8); c.fillStyle = "#ffffff"; c.fill(); stroke(c, 4); }
  c.beginPath(); c.moveTo(120, -890); c.bezierCurveTo(170, -920, 170, -760, 120, -760); c.fillStyle = "#e9f7ff"; c.fill(); stroke(c, 5); c.beginPath(); c.moveTo(128, -860); c.quadraticCurveTo(150, -830, 128, -790); stroke(c, 10, "#ff6f8f");
  // face on the handle (y ~ -470)
  for (const x of [-18, 18]) { if (aw < 0.15) { c.beginPath(); c.moveTo(x - 14, -480); c.quadraticCurveTo(x, -468, x + 14, -480); stroke(c, 6); continue; }
    c.beginPath(); c.ellipse(x, -485, 15, 20 * aw, 0, 0, Math.PI * 2); c.fillStyle = "#ffffff"; c.fill(); stroke(c, 5); c.beginPath(); c.arc(x + 2, -482, 7 * aw, 0, Math.PI * 2); c.fillStyle = INK; c.fill(); }
  if (sing > 0.05) { c.beginPath(); c.ellipse(0, -420, 14 + 6 * sing, 8 + 22 * sing, 0, 0, Math.PI * 2); c.fillStyle = "#4a0d1c"; c.fill(); stroke(c, 5); }
  else { c.beginPath(); c.moveTo(-14, -425); c.quadraticCurveTo(0, -412, 14, -425); stroke(c, 5); }
  c.restore();
  // cup
  c.beginPath(); c.moveTo(-170, -380); c.lineTo(170, -380); c.lineTo(140, 0); c.lineTo(-140, 0); c.closePath(); const gc = c.createLinearGradient(-170, 0, 170, 0); gc.addColorStop(0, "#ffb3c8"); gc.addColorStop(1, "#ff7aa0"); c.fillStyle = gc; c.fill(); stroke(c, 10);
  c.beginPath(); c.ellipse(0, -380, 170, 30, 0, 0, Math.PI * 2); c.fillStyle = "#ff8fb0"; c.fill(); stroke(c, 8);
  for (const [x, y] of [[-70, -250], [60, -170], [-20, -90]] as P[]) { c.beginPath(); c.arc(x, y, 22, 0, Math.PI * 2); c.fillStyle = "rgba(255,255,255,0.55)"; c.fill(); }
  c.restore();
}
export const Toothbrush: React.FC<{ p: V3; t: number; h?: number; pose?: BrushPose }> = ({ p, t, h = 0.6, pose = {} }) => (
  <Billboard p={p} h={h} res={512} aspect={1} draw={(c, W, H) => drawToothbrush(c, W, H, t, pose)} />);

/* GIANT PILLOW (squash 0..1 when something lands on it). p = bottom centre; w = width (m) */
export const GiantPillow: React.FC<{ p: V3; t: number; w?: number; squash?: number; pop?: number; groundY?: number }> = ({ p, t, w = 3.6, squash = 0, pop = 1 }) => {
  const h = w * 0.42 * (1 - 0.35 * squash) * pop, ww = w * (1 + 0.15 * squash) * pop;
  return (<><Shadow p={[p[0], p[1], p[2]]} r={ww * 0.5} o={0.4} />
    <Billboard p={p} h={Math.max(0.01, h * 1.15)} res={1200} aspect={0.5} draw={(c, W, H) => { c.clearRect(0, 0, W, H); c.save(); const sx = W / 1000, sy = H / 500; c.scale(sx, sy); c.lineJoin = "round";
      c.beginPath(); c.moveTo(60, 380); c.bezierCurveTo(20, 200, 40, 90, 120, 70); c.quadraticCurveTo(500, 20, 880, 70); c.bezierCurveTo(960, 90, 980, 200, 940, 380); c.quadraticCurveTo(940, 470, 860, 470); c.quadraticCurveTo(500, 500, 140, 470); c.quadraticCurveTo(60, 470, 60, 380); c.closePath();
      const g = c.createLinearGradient(0, 60, 0, 480); g.addColorStop(0, "#fff6c8"); g.addColorStop(0.5, PILLOW); g.addColorStop(1, "#e8b820"); c.fillStyle = g; c.fill(); c.lineWidth = 9; c.strokeStyle = INK; c.stroke();
      for (const [x, y] of [[90, 80], [910, 80], [70, 460], [930, 460]] as P[]) { c.beginPath(); c.moveTo(x, y); c.lineTo(x + (x < 500 ? -40 : 40), y + (y < 200 ? -30 : 30)); c.lineWidth = 9; c.stroke(); }
      c.beginPath(); c.moveTo(200, 270); c.quadraticCurveTo(500, 320 + 40 * squash, 800, 270); c.lineWidth = 6; c.strokeStyle = "#d8a010"; c.stroke();
      c.beginPath(); c.ellipse(300, 160, 120, 34, -0.1, 0, Math.PI * 2); c.fillStyle = "rgba(255,255,255,0.5)"; c.fill(); c.restore(); void t; }} /></>);
};
/* magic-pencil drawing of the pillow, normalized 0..1 (y down), same outline as GiantPillow (canvas 1000 x 500 -> fits a 1:1 box at y 0.25..0.75) */
const PO: P[] = (() => { const pts: P[] = []; const bez = (a: P, b: P, cc: P, d: P) => { for (let i = 1; i <= 10; i++) { const u = i / 10, v = 1 - u; pts.push([v * v * v * a[0] + 3 * v * v * u * b[0] + 3 * v * u * u * cc[0] + u * u * u * d[0], v * v * v * a[1] + 3 * v * v * u * b[1] + 3 * v * u * u * cc[1] + u * u * u * d[1]]); } };
  const quad = (a: P, b: P, d: P) => { for (let i = 1; i <= 10; i++) { const u = i / 10, v = 1 - u; pts.push([v * v * a[0] + 2 * v * u * b[0] + u * u * d[0], v * v * a[1] + 2 * v * u * b[1] + u * u * d[1]]); } };
  pts.push([60, 380]); bez([60, 380], [20, 200], [40, 90], [120, 70]); quad([120, 70], [500, 20], [880, 70]); bez([880, 70], [960, 90], [980, 200], [940, 380]); quad([940, 380], [940, 470], [860, 470]); quad([860, 470], [500, 500], [140, 470]); quad([140, 470], [60, 470], [60, 380]);
  return pts; })();
const np = (q: P): [number, number] => [q[0] / 1000, 0.25 + q[1] / 1000];
export const PILLOW_PATH: Path2[] = [PO.map(np), [np([200, 270]), np([350, 292]), np([500, 300]), np([650, 292]), np([800, 270])], [np([90, 80]), np([50, 50])], [np([910, 80]), np([950, 50])], [np([70, 460]), np([30, 490])], [np([930, 460]), np([970, 490])]];

/* ---------------- PLAYGROUND ---------------- */
/* round trampoline: p = centre on the ground, r = radius; dip 0..1 = mat pushed down (something landing) */
export const Trampoline: React.FC<{ p: V3; r?: number; dip?: number }> = ({ p, r = 1.6, dip = 0 }) => {
  const H = 0.75;
  return (<group position={p}>
    {Array.from({ length: 6 }, (_, i) => { const a = (i / 6) * Math.PI * 2; return <Cyl key={i} p={[Math.cos(a) * r * 0.92, H / 2, Math.sin(a) * r * 0.92]} rt={0.05} h={H} color="#2b2f40" line={1} />; })}
    <mesh position={[0, H, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[r, 0.13, 10, 40]} /><meshToonMaterial color="#e5263a" /></mesh>
    <mesh position={[0, H + 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[r * 0.97, 0.04, 6, 40]} /><meshBasicMaterial color={INK} /></mesh>
    <mesh position={[0, H - 0.02 - dip * 0.45, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 1, 1]}><circleGeometry args={[r * 0.88, 40]} /><meshToonMaterial color="#2b3a6a" side={THREE.DoubleSide} /></mesh>
    <mesh position={[0, H - 0.03 - dip * 0.45, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[r * 0.55, r * 0.6, 40]} /><meshBasicMaterial color="#ffd23a" side={THREE.DoubleSide} /></mesh>
  </group>);
};
export const TRAMP_TOP = 0.75;
export const Slide: React.FC<{ p: V3; rotY?: number }> = ({ p, rotY = 0 }) => (<group position={p} rotation={[0, rotY, 0]}>
  {[-0.45, 0.45].map((z) => <Cyl key={z} p={[-1.2, 1.25, z]} rt={0.07} h={2.5} color="#3a6fd8" line={2} />)}
  {[0.5, 1.0, 1.5, 2.0].map((y) => <Box key={y} p={[-1.45, y, 0]} s={[0.1, 0.08, 0.9]} color="#ffd23a" line={2} rot={[0, 0, 0]} />)}
  {[-0.45, 0.45].map((z) => <Cyl key={"b" + z} p={[-1.7, 1.25, z]} rt={0.07} h={2.5} color="#3a6fd8" line={2} />)}
  <Box p={[-1.45, 2.5, 0]} s={[0.7, 0.12, 1.0]} color="#e5263a" line={3} />
  <Box p={[0.0, 1.35, 0]} s={[3.2, 0.1, 0.9]} color="#ffd23a" line={3} rot={[0, 0, -0.68]} />
  {[-0.47, 0.47].map((z) => <Box key={"r" + z} p={[0.0, 1.5, z]} s={[3.2, 0.25, 0.06]} color="#ff9a3a" line={2} rot={[0, 0, -0.68]} />)}
</group>);
export const SwingSet: React.FC<{ p: V3; t: number; rotY?: number }> = ({ p, t, rotY = 0 }) => (<group position={p} rotation={[0, rotY, 0]}>
  {[-1.6, 1.6].map((x) => <group key={x}>{[-0.6, 0.6].map((z) => <Cyl key={z} p={[x, 1.4, z * 0.7]} rt={0.07} h={2.9} color="#e5263a" line={2} rot={[z > 0 ? -0.35 : 0.35, 0, 0]} />)}</group>)}
  <Cyl p={[0, 2.75, 0]} rt={0.07} h={3.4} color="#e5263a" line={2} rot={[0, 0, Math.PI / 2]} />
  {[-0.7, 0.7].map((x, i) => { const a = Math.sin(t * 1.6 + i * 2) * 0.25; return <group key={x} position={[x, 2.75, 0]} rotation={[a, 0, 0]}>
    {[-0.25, 0.25].map((dx) => <Cyl key={dx} p={[dx, -1.0, 0]} rt={0.015} h={2.0} color="#9aa0b8" line={1} />)}<Box p={[0, -2.0, 0]} s={[0.65, 0.08, 0.3]} color="#ffd23a" line={2} /></group>; })}
</group>);
export const Sandbox: React.FC<{ p: V3 }> = ({ p }) => (<group position={p}>
  {[[0, 1.1, 2.4, 0.2], [0, -1.1, 2.4, 0.2], [1.1, 0, 0.2, 2.4], [-1.1, 0, 0.2, 2.4]].map(([x, z, w, d], i) => <Box key={i} p={[x, 0.15, z]} s={[w, 0.3, d]} color="#e07a4a" line={2} />)}
  <Box p={[0, 0.12, 0]} s={[2.0, 0.1, 2.0]} color="#f4d79a" line={1} />
  <Cyl p={[0.4, 0.3, 0.3]} rt={0.18} rb={0.13} h={0.3} color="#3a8fe0" line={2} /><Ball p={[-0.4, 0.35, -0.3]} r={0.25} color="#f4c87a" />
</group>);
export const PicketFence: React.FC<{ from: V3; to: V3; n?: number; color?: string }> = ({ from, to, n = 16, color = "#ffffff" }) => {
  const dx = to[0] - from[0], dz = to[2] - from[2], L = Math.hypot(dx, dz), a = Math.atan2(dz, dx);
  return (<group position={from} rotation={[0, -a, 0]}>
    {Array.from({ length: n }, (_, i) => <Box key={i} p={[(i + 0.5) * L / n, 0.55, 0]} s={[0.16, 1.1, 0.06]} color={color} line={2} />)}
    {[0.35, 0.8].map((y) => <Box key={y} p={[L / 2, y, -0.05]} s={[L, 0.1, 0.05]} color={color} line={2} />)}
  </group>);
};

/* ---------------- STAIR HALL: hallway wall (z = -3), staircase descending toward +x. Top landing at x <= STAIR.x0, floor y = 0 at the bottom ---------------- */
export const STAIR = { x0: -3.4, n: 9, dx: 0.55, dy: 0.34, top: 9 * 0.34, z: -1.4, w: 2.6 };
export const stairY = (x: number) => { const { x0, n, dx, dy } = STAIR; if (x <= x0) return n * dy; const i = Math.floor((x - x0) / dx); return Math.max(0, (n - 1 - i) * dy); };
export const StairHall: React.FC<{ t: number }> = ({ t }) => {
  const { x0, n, dx, dy, top, z, w } = STAIR;
  return (<>
    <ambientLight intensity={1.0} /><directionalLight position={[4, 7, 6]} intensity={1.0} color="#ffe0b0" /><directionalLight position={[-6, 3, 2]} intensity={0.4} color="#a0b0ff" />
    {/* back wall + wallpaper */}
    <CanvasPlane p={[0, 4, -3.0]} s={[22, 10]} px={[1100, 500]} draw={(c, W, H) => { c.fillStyle = "#bfe2d0"; c.fillRect(0, 0, W, H); for (let x = 0; x < W; x += 60) { c.fillStyle = "rgba(255,255,255,0.18)"; c.fillRect(x, 0, 26, H); }
      c.fillStyle = "#8a5a3a"; c.fillRect(0, H * 0.68, W, H * 0.03); }} />
    {/* upstairs floor (landing) + downstairs floor */}
    <Box p={[x0 - 4, top - 0.1, z - 0.2]} s={[8, 0.2, w + 2.4]} color="#c8844a" line={3} />
    <Box p={[x0 - 4, top / 2 - 0.1, z - 0.2]} s={[8, top - 0.2, w + 2.4]} color="#f2e2c8" line={3} />
    <mesh position={[4, 0, z]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[20, 12]} /><meshToonMaterial color="#b8743a" /></mesh>
    {/* steps (tread + riser) */}
    {Array.from({ length: n }, (_, i) => { const y = (n - 1 - i) * dy; return <group key={i}>
      <Box p={[x0 + (i + 0.5) * dx, y + dy / 2, z]} s={[dx, dy, w]} color={i % 2 ? "#f2e2c8" : "#eedac0"} line={2} />
      <Box p={[x0 + (i + 0.5) * dx, y + dy - 0.03, z + 0.05]} s={[dx + 0.04, 0.07, w + 0.06]} color="#c8844a" line={2} /></group>; })}
    {/* carpet runner */}
    {Array.from({ length: n }, (_, i) => <Box key={"c" + i} p={[x0 + (i + 0.5) * dx, (n - 1 - i) * dy + dy + 0.01, z + 0.05]} s={[dx * 0.98, 0.02, w * 0.55]} color="#d84a5a" line={1} />)}
    {/* banister (front side) */}
    {Array.from({ length: n }, (_, i) => <Cyl key={"b" + i} p={[x0 + (i + 0.5) * dx, (n - 1 - i) * dy + dy + 0.5, z + w / 2 - 0.08]} rt={0.035} h={1.0} color="#ffffff" line={1} />)}
    <Box p={[x0 + (n * dx) / 2, top / 2 + 1.05, z + w / 2 - 0.08]} s={[Math.hypot(n * dx, top), 0.1, 0.12]} color="#8a4a2a" line={2} rot={[0, 0, -Math.atan2(top, n * dx)]} />
    <Box p={[x0 + n * dx + 0.1, 0.6, z + w / 2 - 0.08]} s={[0.2, 1.2, 0.2]} color="#8a4a2a" line={2} />
    {/* frames on the wall, a window, a plant, a clock, a rug */}
    {[[-5.5, 5.4, "#ffd23a"], [-1.2, 4.6, "#ff8fb0"], [1.6, 3.6, "#7ad8ff"]].map(([x, y, col], i) => <CanvasPlane key={i} p={[x as number, y as number, -2.95]} s={[1.0, 1.2]} px={[100, 120]} frame="#8a4a2a" draw={(c, W, H) => { c.fillStyle = col as string; c.fillRect(0, 0, W, H); c.fillStyle = "#ffffff"; c.beginPath(); c.arc(W / 2, H * 0.45, W * 0.22, 0, Math.PI * 2); c.fill(); c.fillStyle = "#2fb87a"; c.fillRect(0, H * 0.75, W, H * 0.25); }} />)}
    <CanvasPlane p={[4.6, 4.4, -2.95]} s={[2.2, 2.6]} px={[220, 260]} frame="#ffffff" draw={(c, W, H) => { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#7ec8ff"); g.addColorStop(1, "#d8f0ff"); c.fillStyle = g; c.fillRect(0, 0, W, H); c.fillStyle = "#ffffff"; c.beginPath(); c.arc(W * 0.3, H * 0.3, 30, 0, Math.PI * 2); c.arc(W * 0.45, H * 0.28, 38, 0, Math.PI * 2); c.fill(); c.fillStyle = "#5cc85a"; c.fillRect(0, H * 0.78, W, H); c.fillStyle = "#ffffff"; c.fillRect(W / 2 - 4, 0, 8, H); c.fillRect(0, H / 2 - 4, W, 8); }} />
    <SGlow p={[4.6, 4.4, -2.6]} r={2.2} color="#fff0c0" o={0.35} />
    {[0, 1, 2].map((i) => <mesh key={i} position={[3.6 - i * 0.8, 2.4, -1.6]} rotation={[0.5, 0.35, 0.1 * i]}><planeGeometry args={[0.8, 6]} /><meshBasicMaterial color="#fff0c0" transparent opacity={0.12} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>)}
    <group position={[6.2, 0, -2.2]}><Cyl p={[0, 0.4, 0]} rt={0.42} rb={0.32} h={0.8} color="#e07a4a" />{[0, 1, 2, 3].map((i) => <Ball key={i} p={[Math.cos(i * 1.6) * 0.3, 1.2 + (i % 2) * 0.3, Math.sin(i * 1.6) * 0.3]} r={0.4} color={i % 2 ? "#3fbf5a" : "#2fa04a"} />)}</group>
    <CanvasPlane p={[3.2, 0.02, z + 0.6]} rot={[-Math.PI / 2, 0, 0]} s={[3.4, 2.2]} px={[340, 220]} draw={(c, W, H) => { c.fillStyle = "#7a54d6"; c.fillRect(0, 0, W, H); c.strokeStyle = "#ffd23a"; c.lineWidth = 12; c.strokeRect(16, 16, W - 32, H - 32); }} />
    <group position={[-6.0, top, -2.6]}><Box p={[0, 0.5, 0]} s={[1.2, 1.0, 0.6]} color="#c08850" line={3} /><Box p={[0, 1.3, 0]} s={[0.3, 0.6, 0.3]} color="#3a6fd8" line={2} /></group>
    <CanvasPlane p={[0.4, 6.6, -2.95]} s={[0.9, 0.9]} px={[120, 120]} draw={(c, W, H) => { c.fillStyle = "#ffffff"; c.beginPath(); c.arc(W / 2, H / 2, W * 0.45, 0, Math.PI * 2); c.fill(); c.lineWidth = 8; c.strokeStyle = INK; c.stroke(); c.beginPath(); c.moveTo(W / 2, H / 2); c.lineTo(W / 2, H * 0.2); c.moveTo(W / 2, H / 2); c.lineTo(W * 0.72, H / 2 + Math.sin(t) * 2); c.lineWidth = 6; c.stroke(); }} />
  </>);
};

/* bedroom ceiling (the HomeSet room has none): plane at y, with a round lamp */
export const Ceiling: React.FC<{ y?: number; t: number; swing?: number }> = ({ y = 7.2, t, swing = 0 }) => (<>
  <mesh position={[0, y, -1]} rotation={[Math.PI / 2, 0, 0]}><planeGeometry args={[18, 14]} /><meshToonMaterial color="#fff2e2" side={THREE.DoubleSide} /></mesh>
  <Box p={[0, y - 0.08, -5.9]} s={[18, 0.16, 0.2]} color="#fff6e8" line={2} />
  <group position={[1.6, y, -2.2]} rotation={[0, 0, Math.sin(t * 6) * 0.25 * swing]}>
    <Cyl p={[0, -0.4, 0]} rt={0.02} h={0.8} color="#2b2f40" line={1} /><Cyl p={[0, -0.95, 0]} rt={0.18} rb={0.55} h={0.4} color="#ffd23a" line={3} />
    <SGlow p={[0, -1.2, 0]} r={0.9} color="#fff0b0" o={0.5} /></group>
</>);
