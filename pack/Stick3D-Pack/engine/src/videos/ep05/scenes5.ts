// EP05 "What If Stickman's Drawing Came Alive?" — all shots (procedural desk + sketchbook world, graphite copy).
import { Rig } from "../../style/stickman";
import { drawPencil, sparkles, puff, glow, sweatDrops, seg, lerp, clamp, easeIO, easeBack, rnd, INK, V2 } from "../../style/props2d";
import { stick, setLook, setGraphite, StickOut } from "../ep03/engine2d";
import { deskBG, paperBG, drawGlass, WW, WH, STAND_Y, BOOK, GLASS, HORIZON } from "./bg5";
import { gDraw, gHatch, cage, lockStrokes, crown, throne, thronePoly, castle, dog, signBoard, gText, gPuddle } from "./draw5";

type Ctx = CanvasRenderingContext2D;
const TAU = Math.PI * 2;
export const VW = 1080, VH = 1920;
type Cam = { x: number; y: number; z: number; sx?: number; sy?: number };
function view(c: Ctx, bg: HTMLCanvasElement, cam: Cam, rim: string, fn: () => void) {
  const hw = VW / 2 / cam.z, hh = VH / 2 / cam.z, x = clamp(cam.x, hw, WW - hw), y = clamp(cam.y, hh, WH - hh);
  setLook(rim, true); c.save(); c.translate(VW / 2 + (cam.sx ?? 0), VH / 2 + (cam.sy ?? 0)); c.scale(cam.z, cam.z); c.translate(-x, -y); c.drawImage(bg, 0, 0); fn(); c.restore();
}
const shakeXY = (t: number, t0: number, amp: number): [number, number] => { if (t < t0 || t > t0 + 0.5) return [0, 0]; const k = Math.exp(-(t - t0) * 8) * amp; return [Math.sin(t * 61) * k, Math.cos(t * 53) * k]; };
const RIM_PM = "255,205,130", RIM_PAPER = "255,236,200", RIM_AM = "255,240,190";

/* ---------- characters ---------- */
const base = (t: number, face: Rig["face"], x: Partial<Rig> = {}): Rig => ({ t: t * 30, view: "front", face, armL: { a: 12, b: 10 }, armR: { a: 12, b: 10 }, legL: { a: 6, b: 0 }, legR: { a: 6, b: 0 }, ...x } as Rig);
// relaxed stance (never feet together): weight on one leg, slight lean
const stance = (t: number, face: Rig["face"], x: Partial<Rig> = {}): Rig => base(t, face, { legL: { a: 9, b: 0 }, legR: { a: 4, b: 0, lift: 18 }, lean: Math.sin(t * 0.8) * 1.5, ...x });
const toU = (wx: number, wy: number, x: number, y: number, h: number, flip = false): [number, number] => [((wx - x) * 1000 / h) * (flip ? -1 : 1), (y - wy) * 1000 / h];
function hero(c: Ctx, rig: Rig, x: number, y: number, h: number, rot = 0): StickOut { return stick(c, rig, x, y, h, undefined, rot); }
function copy(c: Ctx, t: number, rig: Rig, x: number, y: number, h: number, o: { alpha?: number; melt?: number; reveal?: (g: Ctx, W: number, H: number) => void; flat?: boolean } = {}): StickOut {
  if (o.flat) setLook(null, false);
  setGraphite({ alpha: o.alpha ?? 1, melt: o.melt ?? 0, t, reveal: o.reveal }); const out = stick(c, rig, x, y, h); setGraphite(null); return out;
}
function pencilAt(c: Ctx, tip: V2, len: number, ang = 0.35, coat = 0) { drawPencil(c, tip[0], tip[1], len, ang); if (coat > 0) { c.save(); c.globalAlpha = coat; c.translate(tip[0], tip[1]); c.rotate(ang); c.fillStyle = "rgba(90,90,100,0.85)"; c.fillRect(-len * 0.07, -len * 0.85, len * 0.14, len * 0.7); c.restore(); } }
// held pencil: drawn from the glove; if the drawing point is out of reach, a live graphite line runs from the pencil tip to it
const tipOfHeld = (g: V2, len: number, ang: number): V2 => [g[0] - Math.sin(ang) * len * 0.5, g[1] + Math.cos(ang) * len * 0.5];
function heldDraw(c: Ctx, t: number, glove: V2, len: number, ang: number, target: V2 | null) {
  const pt = tipOfHeld(glove, len, ang); pencilAt(c, pt, len, ang);
  if (target && Math.hypot(target[0] - pt[0], target[1] - pt[1]) > 30) { c.save(); c.lineCap = "round"; const n = 18; for (const [w, col] of [[9, "rgba(150,150,160,0.35)"], [3.5, "rgba(70,70,80,0.9)"]] as [number, string][]) { c.beginPath(); for (let i = 0; i <= n; i++) { const u = i / n, x = lerp(pt[0], target[0], u) + Math.sin(u * 9 + t * 20) * 6 * Math.sin(u * Math.PI), y = lerp(pt[1], target[1], u) - Math.sin(u * Math.PI) * 40; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.lineWidth = w; c.strokeStyle = col; c.stroke(); } c.restore(); sparkles(c, target[0], target[1], t, 5, 26, 7, "#ffffff", 9, 0.8); }
}
// hand position that makes a held pencil's tip land on `tip`
const gripFor = (tip: V2, len: number, ang = 0.35): V2 => [tip[0] - Math.sin(ang) * len * -0.55, tip[1] - Math.cos(ang) * len * 0.55];

/* ---------- desk world pieces ---------- */
const HH = 430, HERO_D: V2 = [800, STAND_Y], COPY_PAGE: V2 = [395, 1372];
function closedBook(c: Ctx) { c.save(); c.translate(250, 1520); c.transform(1, 0, -0.3, 0.45, 0, 0); c.beginPath(); c.roundRect(-150, -170, 300, 340, 10); c.fillStyle = "#2b3350"; c.fill(); c.lineWidth = 8; c.strokeStyle = INK; c.stroke(); c.fillStyle = "#fffdf6"; c.fillRect(-140, 150, 280, 14); c.restore(); }
function sketchbook(c: Ctx, t: number) {
  const { x0, x1, top, bottom } = BOOK; c.save();
  c.fillStyle = "rgba(20,10,30,0.25)"; c.beginPath(); c.moveTo(x0 + 10, bottom); c.lineTo(x1 + 40, bottom + 30); c.lineTo(x1 + 20, bottom + 50); c.lineTo(x0 - 10, bottom + 20); c.fill();
  c.beginPath(); c.roundRect(x0 - 16, top - 16, x1 - x0 + 32, bottom - top + 32, 10); c.fillStyle = "#2b3350"; c.fill(); c.lineWidth = 7; c.strokeStyle = INK; c.stroke(); // cover
  c.beginPath(); c.roundRect(x0, top, x1 - x0, bottom - top, 6); c.fillStyle = "#fffdf6"; c.fill(); c.lineWidth = 5; c.stroke();
  c.strokeStyle = "rgba(90,140,220,0.35)"; c.lineWidth = 2.5; for (let y = top + 60; y < bottom - 10; y += 42) { c.beginPath(); c.moveTo(x0 + 10, y); c.lineTo(x1 - 10, y); c.stroke(); }
  c.strokeStyle = "rgba(230,70,90,0.4)"; c.beginPath(); c.moveTo(x0 + 70, top + 4); c.lineTo(x0 + 70, bottom - 4); c.stroke();
  for (let i = 0; i < 14; i++) { c.beginPath(); c.ellipse(x0 + 30 + i * 33, top - 12, 9, 18, 0, 0, TAU); c.lineWidth = 5; c.strokeStyle = "#9aa2b8"; c.stroke(); } // spiral
  c.restore(); void t;
}
// zigzag drawing path over the rig canvas (order: hoodie -> legs/shoes -> head/face)
const ZZ: V2[] = (() => { const o: V2[] = []; const band = (y0: number, y1: number, x0: number, x1: number) => { for (let y = y0, i = 0; y <= y1; y += 30, i++) { o.push([i % 2 ? x1 : x0, y]); o.push([i % 2 ? x0 : x1, y + 15]); } }; band(470, 800, 130, 510); band(800, 960, 170, 470); band(40, 470, 140, 500); return o; })();
const ZLEN = (() => { let L = 0; for (let i = 1; i < ZZ.length; i++) L += Math.hypot(ZZ[i][0] - ZZ[i - 1][0], ZZ[i][1] - ZZ[i - 1][1]); return L; })();
function zzUpTo(p: number): { pts: V2[]; tip: V2 } { let rem = ZLEN * clamp(p); const pts: V2[] = [ZZ[0]]; for (let i = 1; i < ZZ.length; i++) { const a = ZZ[i - 1], b = ZZ[i], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (rem >= L) { pts.push(b); rem -= L; } else { const k = rem / L; pts.push([lerp(a[0], b[0], k), lerp(a[1], b[1], k)]); break; } } return { pts, tip: pts[pts.length - 1] }; }
const rigToWorld = (p: V2, x: number, y: number, h: number): V2 => { const k = h / (1000 * (960 * 0.955 / 1040)); return [x + (p[0] - 320) * k, y + (p[1] - 960 * 0.985) * k]; };
// drawing progress of the copy on the page: hoodie by "hoodie" (6.0), shoes by "shoes" (6.85), face last on "smile" (7.91)
const copyDrawP = (t: number) => t < 4.3 ? 0 : t < 6.2 ? lerp(0, 0.42, (t - 4.3) / 1.9) : t < 7.2 ? lerp(0.42, 0.6, (t - 6.2) / 1.0) : lerp(0.6, 1, clamp((t - 7.2) / 1.0));

/* ======== S1 0-3.85 HOOK: flash-forward to King Copy on the throne, Stickman caged ======== */
export function S1(c: Ctx, t: number) {
  view(c, paperBG(), { x: lerp(560, 520, t / 3.85), y: 1180, z: lerp(1.05, 1.25, t / 3.85) }, RIM_PAPER, () => {
    gDraw(c, castle(600, 1250, 980, 640)); gHatch(c, thronePoly(TH[0], TH[1], 0.85), 1); gDraw(c, throne(TH[0], TH[1], 0.85));
    const cp = copy(c, t, base(t, "smirk", { legL: { a: 30, b: 0, lift: 230 }, legR: { a: 30, b: 0, lift: 230 }, armR: { a: 60, b: 70 }, handR: "fist" }), TH[0], TH[1] - 40, 460);
    gDraw(c, crown(cp.head[0], cp.head[1] - cp.headR * 1.15, 0.8)); pencilAt(c, [cp.gloveR[0] + 20, cp.gloveR[1] + 60], 150, 0.4);
    const sh = Math.sin(t * 22) * 6; gDraw(c, cage(CAGE[0] + sh, CAGE[1], 300, 520)); gDraw(c, lockStrokes(CAGE[0] + sh, CAGE[1] - 230));
    hero(c, stance(t, "worried", { ikL: toU(CAGE[0] - 70 + sh, CAGE[1] - 300, CAGE[0], CAGE[1], 460), ikR: toU(CAGE[0] + 70 + sh, CAGE[1] - 300, CAGE[0], CAGE[1], 460), handL: "hold", handR: "hold", squash: Math.sin(t * 22) * 0.015 }), CAGE[0], CAGE[1], 460);
    for (const [x, ph] of [[500, 0], [640, 2]] as [number, number][]) gDraw(c, dog(x, 1700, 0.62, t * 6 + ph, 0.5 + 0.5 * Math.sin(t * 9 + ph)), { seed: x });
  });
}

/* ======== S2 3.85-10.3 he draws a copy of himself on the upright sketchbook ======== */
export function S2(c: Ctx, t: number) {
  const p = copyDrawP(t), zz = zzUpTo(p), tipW = rigToWorld(zz.tip, COPY_PAGE[0], COPY_PAGE[1], HH);
  const drawing = p > 0 && p < 1, cam: Cam = t < 5.6 ? { x: 520, y: 1100, z: 1.15 } : t < 8.4 ? { x: 450, y: 1080, z: 1.6 } : { x: 600, y: 1130, z: 1.35 };
  view(c, deskBG(false), cam, RIM_PM, () => {
    sketchbook(c, t);
    for (let pass = 0; pass < 2; pass++) copy(c, t, base(t, "smile", { legL: { a: 9, b: 0 }, legR: { a: 4, b: 0, lift: 18 } }), COPY_PAGE[0], COPY_PAGE[1], HH, { flat: true, reveal: (g) => { g.lineWidth = 64; g.lineCap = "round"; g.lineJoin = "round"; g.beginPath(); zz.pts.forEach((q, i) => (i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]))); g.stroke(); } });
    setLook(RIM_PM, true);
    const tip: V2 = drawing ? [tipW[0] + Math.sin(t * 40) * 3, tipW[1]] : [HERO_D[0] - 170, STAND_Y - 260];
    const hx = drawing ? clamp(tipW[0] + 230, 700, 820) : HERO_D[0], grip = gripFor(tip, 300, 0.5);
    const out = hero(c, stance(t, t > 8.3 ? "laugh" : "determined", { ikR: toU(grip[0], grip[1], hx, STAND_Y, HH), ikL: [-120, 430], handR: "fist", handL: "relaxed", lean: drawing ? -6 : 0, lookX: -0.8 }), hx, STAND_Y, HH);
    heldDraw(c, t, out.gloveR, 300, 0.5, drawing ? tip : null);
    if (drawing) sparkles(c, tip[0], tip[1], t, 4, 30, 6, "#ffffff", 3, 0.6);
  });
}
/* ======== S3 10.3-12.9 the drawing blinks ======== */
export function S3(c: Ctx, t: number) {
  const close = t < 11.7;
  view(c, deskBG(false), close ? { x: COPY_PAGE[0], y: COPY_PAGE[1] - HH * 0.82, z: 3.0 } : { x: 620, y: 1120, z: 1.5 }, RIM_PM, () => {
    sketchbook(c, t);
    copy(c, t, base(t, "smile", { blink: t > 11.06 && t < 11.22 ? 1 : 0, lookX: t > 11.3 ? 0.8 : 0, legL: { a: 9, b: 0 }, legR: { a: 4, b: 0, lift: 18 } }), COPY_PAGE[0], COPY_PAGE[1], HH, { flat: true });
    setLook(RIM_PM, true);
    if (!close) { const out = hero(c, stance(t, "surprised", { lookX: -1, lean: -8, armR: { a: 40, b: 60 }, handR: "fist", squash: t < 12 ? -0.04 : 0 }), HERO_D[0], STAND_Y, HH); pencilAt(c, [out.gloveR[0], out.gloveR[1] + 80], 300, 0.25); }
  });
}
/* ======== S4 12.9-20.6 it steps off the paper, grins and snatches the pencil ======== */
export function S4(c: Ctx, t: number) {
  const step = seg(t, 13.2, 14.1, easeIO), snatch = seg(t, 15.37, 15.85, easeIO);
  const cx = lerp(COPY_PAGE[0], 520, step), cy = lerp(COPY_PAGE[1], STAND_Y + 10, step);
  const cam: Cam = t < 14.3 ? { x: 520, y: 1140, z: 1.4 } : t < 16.5 ? { x: 660, y: 1150, z: 1.65 } : { x: 640, y: 1150, z: 1.45 };
  view(c, deskBG(false), cam, RIM_PM, () => {
    sketchbook(c, t);
    if (step > 0) { c.save(); c.globalAlpha = 0.5 * (1 - step); c.fillStyle = "#fffdf6"; c.fillRect(COPY_PAGE[0] - 130, COPY_PAGE[1] - HH, 260, HH); c.restore(); }
    const reach = seg(t, 15.0, 15.37, easeIO) * (1 - seg(t, 15.85, 16.3));
    const heroGlove: V2 = [HERO_D[0] - 150, STAND_Y - 230];
    const holdPencil = t < 15.6; // the hero still holds it
    const cRig = base(t, t < 14.41 ? "smile" : "smirk", { legL: { a: 9 + 14 * Math.sin(step * Math.PI), b: 0, lift: 60 * Math.sin(step * Math.PI) }, legR: { a: 4, b: 0, lift: 18 }, ikR: reach > 0 ? toU(heroGlove[0] - 20, heroGlove[1] + 10, cx, cy, HH) : t > 15.85 ? [140, 560] : undefined, ikKR: Math.max(reach, t > 15.85 ? 1 : 0), handR: "fist", lookX: 0.8 });
    if (step > 0.3) setLook(null, true); else setLook(null, false);
    const co = copy(c, t, cRig, cx, cy, HH, { flat: step < 0.3 });
    setLook(RIM_PM, true);
    const jerk = snatch > 0 && snatch < 1 ? Math.sin(snatch * Math.PI) * 0.06 : 0;
    const out = hero(c, stance(t, t < 15.37 ? "smile" : t < 16.6 ? "surprised" : "worried", { ikR: holdPencil ? toU(heroGlove[0], heroGlove[1], HERO_D[0], STAND_Y, HH) : [160, 440], handR: holdPencil ? "fist" : "open", lookX: -1, lean: -jerk * 60, squash: -jerk }), HERO_D[0], STAND_Y, HH);
    const pTip: V2 = holdPencil ? [out.gloveR[0] - 10, out.gloveR[1] + 90] : [co.gloveR[0] + 10, co.gloveR[1] + 90];
    pencilAt(c, holdPencil ? pTip : [lerp(out.gloveR[0], co.gloveR[0], snatch) + 10, lerp(out.gloveR[1], co.gloveR[1], snatch) + 90], 300, holdPencil ? 0.25 : -0.3 + Math.sin(t * 3) * 0.1 * (t > 16.5 ? 1 : 0));
    if (t > 15.6 && t < 16.1) { c.save(); c.font = "900 54px Inter"; c.fillStyle = "#ffd23a"; c.strokeStyle = INK; c.lineWidth = 9; c.strokeText("SNATCH!", co.gloveR[0] - 120, co.gloveR[1] - 330); c.fillText("SNATCH!", co.gloveR[0] - 120, co.gloveR[1] - 330); c.restore(); }
  });
}
/* ======== S5 20.6-23.2 Stickman froze ======== */
export function S5(c: Ctx, t: number) {
  const fr = seg(t, 21.15, 21.35);
  view(c, deskBG(false), { x: HERO_D[0] - 60, y: STAND_Y - HH * 0.55, z: lerp(1.7, 2.3, seg(t, 20.6, 23.2, easeIO)) }, RIM_PM, () => {
    const out = hero(c, base(t, "scared", { armL: { a: 70, b: 40 }, armR: { a: 70, b: 40 }, handL: "open", handR: "open", legL: { a: 12, b: 0 }, legR: { a: 10, b: 0 }, squash: 0.03 * fr, lookX: -0.6, breath: 1 - fr }), HERO_D[0], STAND_Y, HH);
    if (fr > 0) { c.save(); c.strokeStyle = "rgba(160,220,255,0.9)"; c.lineWidth = 6; for (let k = 0; k < 6; k++) { const a = -2.6 + k * 0.4, r0 = out.headR * 1.25, r1 = out.headR * 1.55; c.beginPath(); c.moveTo(out.head[0] + Math.cos(a) * r0, out.head[1] + Math.sin(a) * r0); c.lineTo(out.head[0] + Math.cos(a) * r1, out.head[1] + Math.sin(a) * r1); c.stroke(); } c.restore(); sweatDrops(c, out.head[0], out.head[1], out.headR, t, fr); }
    const co = copy(c, t, base(t, "smirk", { armR: { a: 50, b: 80 }, handR: "fist", lookX: 1 }), 560, STAND_Y + 10, HH); pencilAt(c, [co.gloveR[0] + 10, co.gloveR[1] + 90], 300, -0.3 + Math.sin(t * 4) * 0.15);
  });
}

/* ---------- sketchbook world ---------- */
const CAGE: V2 = [300, 1600], TH: V2 = [770, 1520], HP = 460;
const cageProg = (t: number) => seg(t, 23.9, 25.35, (x) => x);
const crownP = (t: number) => seg(t, 29.5, 30.45, (x) => x), throneP = (t: number) => seg(t, 31.2, 32.3, (x) => x), castleP = (t: number) => seg(t, 32.45, 34.8, (x) => x);
const MISSING = 4;
const smudge = (t: number) => seg(t, 51.3, 53.9, (x) => x);
const meltCrown = (t: number) => seg(t, 74.5, 76.5, (x) => x), meltThrone = (t: number) => seg(t, 75.9, 78.6, (x) => x), meltCopy = (t: number) => seg(t, 81.9, 83.9, (x) => x);
const copySeat = (t: number) => seg(t, 32.0, 32.45, easeIO); // hops onto the throne
function paperProps(c: Ctx, t: number, o: { castle?: number; throne?: number; crownOn?: boolean; cage?: number; lock?: boolean; dogs?: boolean } = {}) {
  const mT = meltThrone(t);
  if ((o.castle ?? 0) > 0) gDraw(c, castle(600, 1250, 980, 640), { prog: o.castle, melt: mT * 0.7, baseY: 1250 });
  if ((o.throne ?? 0) > 0) { gHatch(c, thronePoly(TH[0], TH[1], 0.85), seg(o.throne!, 0.6, 1), mT, TH[1]); gDraw(c, throne(TH[0], TH[1], 0.85), { prog: o.throne, melt: mT, baseY: TH[1] + 30, seed: 3 }); }
  if (mT > 0) gPuddle(c, TH[0], TH[1] + 20, 230, 50, clamp(mT * 1.2));
  if (o.dogs) for (const [x, ph] of [[500, 0], [680, 2.4]] as [number, number][]) gDraw(c, dog(x, 1760, 0.85, t * (t > 58 && t < 61.5 ? 0.5 : 5) + ph, t > 60.3 && t < 61.4 && x === 660 ? 0.5 + 0.5 * Math.sin(t * 20) : 0), { seed: x });
}
function cageDraw(c: Ctx, t: number, prog: number, sh = 0) { const sm = smudge(t); const st = cage(CAGE[0] + sh, CAGE[1], 300, 520, MISSING, sm); gDraw(c, st, { prog, seed: 7 });
  if (sm > 0 && sm < 1) { const x = CAGE[0] - 150 + 300 * MISSING / 6 + sh; c.save(); c.globalAlpha = 1 - sm; gDraw(c, [{ pts: [[x, CAGE[1]], [x, CAGE[1] - 430]], w: 9 }]); c.restore(); const g = c.createRadialGradient(x, CAGE[1] - 260, 4, x, CAGE[1] - 260, 90); g.addColorStop(0, `rgba(120,120,130,${0.45 * sm})`); g.addColorStop(1, "rgba(120,120,130,0)"); c.fillStyle = g; c.fillRect(x - 90, CAGE[1] - 480, 180, 460); } }
const lockOn = (t: number) => t >= 25.39 && t < 57.2;
// the copy: standing (drawing) or seated on the throne
function copyKing(c: Ctx, t: number, o: { face?: Rig["face"]; ik?: [number, number]; hands?: boolean; shrug?: number; turn?: number; alpha?: number } = {}) {
  const seat = copySeat(t), mC = meltCopy(t);
  const x = lerp(TH[0] + 210, TH[0], seat), y = lerp(TH[1] + 60, TH[1] - 40, seat) - Math.sin(seat * Math.PI) * 120;
  const sh = o.shrug ?? 0;
  const rig = base(t, o.face ?? "smirk", { legL: { a: 30 * seat + 8, b: 0, lift: 230 * seat }, legR: { a: 30 * seat + 4, b: 0, lift: 230 * seat }, ikR: o.ik, handR: "fist",
    armL: o.hands ? { a: 70, b: 70 } : sh > 0 ? { a: lerp(12, 50, sh), b: lerp(10, 100, sh) } : undefined, armR: o.ik ? undefined : o.hands ? { a: 70, b: 70 } : sh > 0 ? { a: lerp(12, 50, sh), b: lerp(10, 100, sh) } : { a: 50, b: 70 }, handL: o.hands || sh > 0 ? "open" : "relaxed",
    lookX: o.turn ? lerp(0, -1, o.turn) : 0, lookY: o.turn ? -0.8 * o.turn : o.hands ? 0.9 : 0, headTilt: o.turn ? -10 * o.turn : sh * 8, squash: -0.02 * sh });
  setLook(null, seat < 0.5);
  const out = copy(c, t, rig, x, y, HP, { melt: mC, alpha: (o.alpha ?? 1) * (1 - seg(t, 83.2, 84.2)) });
  setLook(RIM_PAPER, true); return out;
}
function crownOnCopy(c: Ctx, t: number, out: StickOut, prog: number) { gDraw(c, crown(out.head[0], out.head[1] - out.headR * 1.12, 0.78), { prog, melt: meltCrown(t), baseY: out.head[1] + out.headR * 2, seed: 9 }); }
const copyPencil = (c: Ctx, out: StickOut, tip?: V2) => pencilAt(c, tip ?? [out.gloveR[0] + 10, out.gloveR[1] + 80], 150, tip ? 0.5 : -0.25);

/* ======== S6 23.2-29.0 the copy draws a cage around him. Click. ======== */
export function S6(c: Ctx, t: number) {
  const prog = cageProg(t), [sx, sy] = shakeXY(t, 25.39, 14);
  view(c, paperBG(), { x: 470, y: 1330, z: 1.2, sx, sy }, RIM_PAPER, () => {
    const tip = gDraw(c, cage(CAGE[0], CAGE[1], 300, 520), { prog, seed: 7 });
    if (lockOn(t)) { gDraw(c, lockStrokes(CAGE[0], CAGE[1] - 230), { prog: seg(t, 25.39, 25.55) }); if (t < 25.9) sparkles(c, CAGE[0], CAGE[1] - 210, t, 8, 60, 14, "#ffffff", 4, 1 - seg(t, 25.5, 25.9)); }
    const look = prog > 0 && prog < 1;
    hero(c, stance(t, prog < 0.2 ? "surprised" : t < 25.4 ? "scared" : "worried", { lookX: look ? 0.6 : 0.8, armL: { a: 40, b: 60 }, armR: { a: 40, b: 60 }, handL: "open", handR: "open", lean: Math.sin(t * 7) * 2 * (look ? 1 : 0) }), CAGE[0], CAGE[1], HP);
    const tipT = tip && prog < 1 ? tip : null; const cx = tipT ? clamp(tipT[0] + 230, 520, 760) : lerp(520, 760, seg(t, 25.4, 26.4, easeIO)), cy = 1640;
    const grip = tipT ? gripFor(tipT, 150, 0.5) : null;
    const co = copy(c, t, base(t, "smirk", { ikR: grip ? toU(grip[0], grip[1], cx, cy, HP) : [140, 560], handR: "fist", lookX: -0.9, legL: { a: 10, b: 0 }, legR: { a: 4, b: 0, lift: 20 } }), cx, cy, HP);
    heldDraw(c, t, co.gloveR, 150, tipT ? 0.5 : -0.25, tipT);
    if (t > 25.39 && t < 26.0) { c.save(); c.font = "900 80px Inter"; c.fillStyle = "#ffffff"; c.strokeStyle = INK; c.lineWidth = 12; c.strokeText("CLICK!", CAGE[0] - 30, CAGE[1] - 640); c.fillText("CLICK!", CAGE[0] - 30, CAGE[1] - 640); c.restore(); }
  });
}
/* ======== S7 29.0-36.9 crown, throne, castle ======== */
export function S7(c: Ctx, t: number) {
  const cr = crownP(t), th = throneP(t), ca = castleP(t), wide = seg(t, 32.4, 34.6, easeIO);
  view(c, paperBG(), t < 31.0 ? { x: 640, y: 1330, z: 1.2 } : { x: lerp(620, 560, wide), y: lerp(1300, 1180, wide), z: lerp(1.15, 1.05, wide) }, RIM_PAPER, () => {
    // pencil tip target depends on what is being drawn
    paperProps(c, t, { castle: ca, throne: th });
    cageDraw(c, t, 1); if (lockOn(t)) gDraw(c, lockStrokes(CAGE[0], CAGE[1] - 230));
    hero(c, stance(t, "worried", { ikL: toU(CAGE[0] - 60, CAGE[1] - 300, CAGE[0], CAGE[1], HP), ikR: toU(CAGE[0] + 60, CAGE[1] - 300, CAGE[0], CAGE[1], HP), handL: "hold", handR: "hold", lookX: 0.8 }), CAGE[0], CAGE[1], HP);
    let tip: V2 | null = null; const probe = (st: ReturnType<typeof crown>, p: number) => { if (p > 0 && p < 1) { c.save(); c.globalAlpha = 0; tip = gDraw(c, st, { prog: p }); c.restore(); } };
    const seat = copySeat(t), cx = lerp(TH[0] + 210, TH[0], seat), cy = lerp(TH[1] + 60, TH[1] - 40, seat), headY = cy - HP * 0.84;
    probe(crown(cx, headY - HP * 0.2, 0.78), cr); probe(throne(TH[0], TH[1], 0.85), th); probe(castle(600, 1250, 980, 640), ca);
    const grip = tip ? gripFor(tip, 150, 0.5) : null;
    const out = copyKing(c, t, { ik: grip ? toU(grip[0], grip[1], cx, cy - Math.sin(seat * Math.PI) * 120, HP) : undefined, face: "smirk" });
    crownOnCopy(c, t, out, cr);
    heldDraw(c, t, out.gloveR, 150, tip ? 0.5 : -0.25, tip);
    if (t > 34.8) sparkles(c, 600, 700, t, 10, 400, 18, "#ffffff", 6, 0.6);
  });
}
/* ======== S8 36.9-39.4 King Copy (low angle) ======== */
export function S8(c: Ctx, t: number) {
  view(c, paperBG(), { x: TH[0] - 20, y: TH[1] - 330, z: lerp(1.9, 2.1, seg(t, 36.9, 39.4)) }, RIM_PAPER, () => {
    paperProps(c, t, { castle: 1, throne: 1 });
    const out = copyKing(c, t, { face: "smirk" }); crownOnCopy(c, t, out, 1); copyPencil(c, out);
    sparkles(c, out.head[0], out.head[1] - out.headR * 1.3, t, 8, 90, 18, "#fff6c0", 8, 0.8);
  });
}
/* ======== S9 39.4-43.7 shakes the bars. Nothing. ======== */
export function S9(c: Ctx, t: number) {
  const sh = t > 39.85 && t < 41.4 ? Math.sin(t * 34) * 10 : 0, slump = seg(t, 41.5, 42.0);
  view(c, paperBG(), { x: CAGE[0] + 60, y: CAGE[1] - 300, z: 1.75 }, RIM_PAPER, () => {
    paperProps(c, t, { castle: 1, throne: 1 }); cageDraw(c, t, 1, sh * 0.5); gDraw(c, lockStrokes(CAGE[0] + sh * 0.5, CAGE[1] - 230));
    hero(c, stance(t, sh ? "determined" : "worried", { ikL: toU(CAGE[0] - 70 + sh, CAGE[1] - 290 + slump * 120, CAGE[0], CAGE[1], HP), ikR: toU(CAGE[0] + 70 + sh, CAGE[1] - 290 + slump * 120, CAGE[0], CAGE[1], HP), handL: "hold", handR: "hold", lean: sh * 0.6, squash: -0.04 * slump, headTilt: slump * 10, lookY: slump * 0.6 }), CAGE[0] + sh * 0.3, CAGE[1], HP);
    if (sh) for (const sx of [-1, 1]) { c.beginPath(); c.moveTo(CAGE[0] + sx * 180, CAGE[1] - 330); c.lineTo(CAGE[0] + sx * 220, CAGE[1] - 350); c.moveTo(CAGE[0] + sx * 180, CAGE[1] - 280); c.lineTo(CAGE[0] + sx * 225, CAGE[1] - 280); c.lineWidth = 6; c.strokeStyle = INK; c.stroke(); }
  });
}
/* ======== S10 43.7-46.9 but the copy forgot one thing ======== */
export function S10(c: Ctx, t: number) {
  const look = seg(t, 44.2, 44.7);
  view(c, paperBG(), { x: 470, y: 1300, z: 1.25 }, RIM_PAPER, () => {
    paperProps(c, t, { castle: 1, throne: 1 }); cageDraw(c, t, 1); gDraw(c, lockStrokes(CAGE[0], CAGE[1] - 230));
    const out = copyKing(c, t, { face: t > 45 ? "laugh" : "smirk" }); crownOnCopy(c, t, out, 1); copyPencil(c, out);
    const ho = hero(c, stance(t, look > 0.5 ? "think" : "worried", { armL: { a: 50, b: 110 }, handL: "open", armR: { a: 18, b: 12 }, lookX: -0.4, lookY: look * 0.6 }), CAGE[0], CAGE[1], HP);
    if (look > 0) { c.save(); c.globalAlpha = look; c.fillStyle = "rgba(90,90,100,0.7)"; c.beginPath(); c.ellipse(ho.gloveL[0], ho.gloveL[1] - 8, 16, 10, 0.3, 0, TAU); c.fill(); c.restore(); }
  });
}
/* ======== S11 46.9-49.9 it was drawn in pencil (close on the bar) ======== */
export function S11(c: Ctx, t: number) {
  const x = CAGE[0] - 150 + 300 * MISSING / 6;
  view(c, paperBG(), { x: x - 40, y: CAGE[1] - 330, z: 3.0 }, RIM_PAPER, () => {
    cageDraw(c, t, 1);
    const ho = hero(c, stance(t, t > 48.4 ? "grin" : "think", { ikR: toU(x + 18, CAGE[1] - 300 + Math.sin(t * 6) * 20, CAGE[0], CAGE[1], HP), handR: "point", lookX: 0.8 }), CAGE[0], CAGE[1], HP);
    c.save(); c.globalAlpha = 0.5; c.strokeStyle = "rgba(90,90,100,0.7)"; c.lineWidth = 10; c.beginPath(); c.moveTo(x + 8, CAGE[1] - 330); c.lineTo(x + 20, CAGE[1] - 260 + Math.sin(t * 6) * 20); c.stroke(); c.restore();
    if (t > 48.4) { const k = seg(t, 48.4, 48.7, easeBack); c.save(); c.translate(ho.head[0] + ho.headR * 1.2, ho.head[1] - ho.headR * 1.3); c.scale(k, k); c.beginPath(); c.arc(0, 0, 34, 0, TAU); c.fillStyle = "#ffe86a"; c.fill(); c.lineWidth = 6; c.strokeStyle = INK; c.stroke(); c.fillStyle = "#c8c8d0"; c.fillRect(-14, 30, 28, 16); c.restore(); glow(c, ho.head[0] + ho.headR * 1.2, ho.head[1] - ho.headR * 1.3, 90, "rgba(255,240,140,1)", 0.6 * k); }
  });
}
/* ======== S12 49.9-57.0 licks his thumb, rubs the bar, it smudges away ======== */
export function S12(c: Ctx, t: number) {
  const lick = seg(t, 50.3, 50.6) * (1 - seg(t, 50.9, 51.2)), rub = t > 51.25 && t < 53.9;
  const x = CAGE[0] - 150 + 300 * MISSING / 6;
  view(c, paperBG(), t < 51.2 ? { x: CAGE[0] + 30, y: CAGE[1] - 380, z: 2.4 } : { x: CAGE[0] + 60, y: CAGE[1] - 300, z: 1.8 }, RIM_PAPER, () => {
    if (t > 51.2) paperProps(c, t, { castle: 1, throne: 1 });
    cageDraw(c, t, 1); if (lockOn(t)) gDraw(c, lockStrokes(CAGE[0], CAGE[1] - 230));
    const ry = CAGE[1] - 300 + Math.sin(t * 14) * 70;
    const ho = hero(c, stance(t, lick > 0.3 ? "laugh" : rub ? "determined" : t > 53.9 ? "grin" : "smile", { ikR: lick > 0 ? [60, 760] : rub ? toU(x + 14, ry, CAGE[0], CAGE[1], HP) : undefined, ikKR: lick > 0 ? lick : 1, handR: lick > 0 ? "thumb" : rub ? "fist" : "relaxed", lookX: rub ? 0.8 : 0, lean: rub ? 5 : 0 }), CAGE[0], CAGE[1], HP);
    if (lick > 0.3) { c.save(); c.fillStyle = "#ff7d8e"; c.beginPath(); c.ellipse(ho.head[0] + ho.headR * 0.15, ho.head[1] + ho.headR * 0.62, ho.headR * 0.14, ho.headR * 0.12 * lick, 0, 0, TAU); c.fill(); c.lineWidth = 4; c.strokeStyle = INK; c.stroke(); c.restore(); }
    if (rub) { for (let i = 0; i < 6; i++) { const u = (t * 2 + rnd(i)) % 1; c.fillStyle = `rgba(110,110,120,${0.6 * (1 - u)})`; c.beginPath(); c.arc(x + 30 + u * 60, ry + (rnd(i) - 0.5) * 60 + u * 40, 6, 0, TAU); c.fill(); } }
    if (t > 53.3 && t < 54.3) puff(c, x, CAGE[1] - 260, seg(t, 53.3, 54.3, (u) => u), 90, "#c8c8d0");
  });
}
/* ======== S13 57.0-62.0 slips out and tiptoes past the badly drawn dogs ======== */
const tipX = (t: number) => t < 57.2 ? CAGE[0] : t < 57.9 ? lerp(CAGE[0], CAGE[0] + 150, seg(t, 57.2, 57.9, easeIO)) : lerp(CAGE[0] + 150, TH[0] + 200, seg(t, 57.9, 62.0, (x) => x));
export function S13(c: Ctx, t: number) {
  const x = tipX(t), squeeze = t > 57.2 && t < 57.9 ? Math.sin(seg(t, 57.2, 57.9) * Math.PI) : 0, ph = (t - 57.9) * 1.6 * TAU;
  view(c, paperBG(), { x: clamp(x + 60, 420, 700), y: 1420, z: 1.45 }, RIM_PAPER, () => {
    paperProps(c, t, { castle: 1, throne: 1, dogs: true });
    cageDraw(c, t, 1);
    const tiptoe = t > 57.9;
    const sp = Math.sin(ph), cp = Math.cos(ph);
    const rig: Rig = tiptoe ? { t: t * 30, view: "side", face: "determined", lookX: 0.4, lean: 6, armR: { a: 70 + 20 * sp, b: 110 }, armL: { a: 70 - 20 * sp, b: 110 }, handR: "open", handL: "open",
      legR: { a: 30 * Math.max(0, sp) - 5, b: 70 * Math.max(0, sp), f: 30 }, legL: { a: 30 * Math.max(0, -sp) - 5, b: 70 * Math.max(0, -sp), f: 30 }, y: -10 * Math.abs(cp) } as Rig
      : stance(t, "determined", { squash: -0.05 * squeeze, lean: 12 * squeeze, armL: { a: 60, b: 40 }, armR: { a: 30, b: 20 } });
    hero(c, rig, x, CAGE[1] + (tiptoe ? 60 : 0), HP);
    if (t > 60.3 && t < 61.5) { c.save(); c.font = "900 46px Inter"; c.fillStyle = "#ffffff"; c.strokeStyle = INK; c.lineWidth = 8; c.strokeText("yip?", 700, 1500); c.fillText("yip?", 700, 1500); c.restore(); }
    const out = copyKing(c, t, { face: "smirk" }); crownOnCopy(c, t, out, 1); copyPencil(c, out);
  });
}
/* ======== S14 62.0-65.1 climbs up behind the throne (with the glass of water) ======== */
const GL: V2 = [1010, 1640];
const climbK = (t: number) => seg(t, 62.25, 63.7, easeIO);
export function S14(c: Ctx, t: number) {
  const k = climbK(t), grab = t > 62.15;
  view(c, paperBG(), { x: 800, y: lerp(1450, 1080, k), z: 1.5 }, RIM_PAPER, () => {
    paperProps(c, t, { castle: 1, throne: 1 });
    const out = copyKing(c, t, { face: "smirk" }); crownOnCopy(c, t, out, 1); copyPencil(c, out);
    const hx = lerp(TH[0] + 210, TH[0] + 90, k), hy = lerp(GL[1], TH[1] - 520, k); const ph = k * 6 * Math.PI;
    if (!grab) drawGlass(c, GL[0], GL[1], 0.8, 0.85, 0, t);
    const ho = hero(c, { ...stance(t, "determined", { lookX: -0.6, lookY: -0.6 }), view: "back", armR: k > 0 && k < 1 ? { a: 150 + 20 * Math.sin(ph), b: 30 } : { a: 40, b: 80 }, armL: k > 0 && k < 1 ? { a: 150 - 20 * Math.sin(ph), b: 30 } : { a: 20, b: 20 }, legL: { a: 10, b: 0, lift: 90 * Math.max(0, Math.sin(ph)) }, legR: { a: 10, b: 0, lift: 90 * Math.max(0, -Math.sin(ph)) }, grounded: k <= 0 } as Rig, hx, hy, HP * 0.95);
    if (grab) drawGlass(c, ho.gloveR[0] + 10, ho.gloveR[1] + 60, 0.55, 0.85, 0, t);
  });
}
/* ======== S15 65.1-68.6 the copy turns around. Too late. ======== */
export function S15(c: Ctx, t: number) {
  const turn = seg(t, 65.5, 66.0, easeIO);
  view(c, paperBG(), t < 66.5 ? { x: TH[0] - 10, y: TH[1] - 420, z: 1.9 } : { x: TH[0] + 40, y: TH[1] - 560, z: 1.7 }, RIM_PAPER, () => {
    paperProps(c, t, { castle: 1, throne: 1 });
    const ho = hero(c, base(t, t < 66.5 ? "smirk" : "grin", { legL: { a: 30, b: 0, lift: 200 }, legR: { a: 30, b: 0, lift: 200 }, armR: { a: 120, b: 40 }, handR: "hold", lookX: -0.6, lookY: 0.7 }), TH[0] + 90, TH[1] - 520, HP * 0.95);
    drawGlass(c, ho.gloveR[0] + 10, ho.gloveR[1] + 60, 0.55, 0.85, -0.2, t);
    const out = copyKing(c, t, { face: turn > 0.5 ? "surprised" : "smirk", turn }); crownOnCopy(c, t, out, 1); copyPencil(c, out);
  });
}
/* ======== S16 68.6-74.3 spills a whole glass of water over its head (splash = shake) ======== */
const SPLASH = 71.04;
export function S16(c: Ctx, t: number) {
  const tilt = seg(t, 69.0, 69.6, easeIO) * 2.3, flow = seg(t, 69.45, 71.3, (x) => x), [sx, sy] = shakeXY(t, SPLASH, 12);
  view(c, paperBG(), { x: TH[0] + 20, y: TH[1] - 470, z: 1.6, sx, sy }, RIM_PAPER, () => {
    paperProps(c, t, { castle: 1, throne: 1 });
    const out = copyKing(c, t, { face: t < SPLASH ? "surprised" : "scared", turn: 1 }); crownOnCopy(c, t, out, 1); copyPencil(c, out);
    const ho = hero(c, base(t, t < 70 ? "grin" : "laugh", { legL: { a: 30, b: 0, lift: 200 }, legR: { a: 30, b: 0, lift: 200 }, armR: { a: 120 + tilt * 15, b: 40 }, handR: "hold", lookX: -0.6, lookY: 0.7 }), TH[0] + 90, TH[1] - 520, HP * 0.95);
    const rim: V2 = [ho.gloveR[0] - 30, ho.gloveR[1] + 20];
    drawGlass(c, ho.gloveR[0] + 10, ho.gloveR[1] + 60, 0.55, 0.85 * (1 - flow), -tilt, t);
    // real liquid arc: stream of overlapping blobs on a parabola from the rim to the copy's head
    if (flow > 0 && flow < 1) { const head: V2 = [out.head[0], out.head[1] - out.headR * 0.6]; c.save(); for (let i = 0; i < 26; i++) { const u = i / 25, x = lerp(rim[0], head[0], u) - Math.sin(u * Math.PI) * 60, y = lerp(rim[1], head[1], u) - Math.sin(u * Math.PI) * 110 + u * u * 40; const w = 22 * (1 - u * 0.4) * (0.85 + 0.15 * Math.sin(t * 30 + i));
      c.beginPath(); c.arc(x, y, w, 0, TAU); c.fillStyle = "rgba(90,180,250,0.75)"; c.fill(); } c.restore(); }
    if (t > SPLASH - 0.3) { const d = t - (SPLASH - 0.3); for (let i = 0; i < 18; i++) { const a = -Math.PI * (0.1 + 0.8 * rnd(i)), v = 300 + rnd(i + 4) * 400, x = out.head[0] + Math.cos(a) * v * d, y = out.head[1] - out.headR * 0.5 + Math.sin(a) * v * d + 900 * d * d; if (y > TH[1] + 30 || d > 1.6) continue; c.beginPath(); c.ellipse(x, y, 10, 14, a, 0, TAU); c.fillStyle = "rgba(90,180,250,0.85)"; c.fill(); c.lineWidth = 3; c.strokeStyle = "rgba(20,80,160,0.9)"; c.stroke(); }
      c.save(); c.globalAlpha = 0.55; c.fillStyle = "rgba(90,180,250,0.6)"; c.beginPath(); c.ellipse(out.head[0], out.head[1], out.headR * 1.1, out.headR * 1.2, 0, 0, TAU); c.fill(); c.restore(); }
    if (t > SPLASH && t < SPLASH + 0.6) { c.save(); c.font = "900 88px Inter"; c.fillStyle = "#5ab4ff"; c.strokeStyle = INK; c.lineWidth = 12; c.strokeText("SPLASH!", TH[0] - 260, TH[1] - 760); c.fillText("SPLASH!", TH[0] - 260, TH[1] - 760); c.restore(); }
  });
}
/* ======== S17 74.3-79.4 the crown drips, the throne melts ======== */
export function S17(c: Ctx, t: number) {
  const hop = seg(t, 77.0, 77.6, easeIO);
  view(c, paperBG(), t < 75.9 ? { x: TH[0], y: TH[1] - 520, z: 2.4 } : { x: TH[0] - 80, y: TH[1] - 300, z: 1.4 }, RIM_PAPER, () => {
    paperProps(c, t, { castle: 1, throne: 1 });
    const out = copyKing(c, t, { face: "scared", turn: 1 - seg(t, 76, 76.5) }); crownOnCopy(c, t, out, 1);
    for (let i = 0; i < 5; i++) { const u = ((t * 0.8 + rnd(i)) % 1); c.fillStyle = "rgba(90,180,250,0.8)"; c.beginPath(); c.ellipse(out.head[0] + (rnd(i * 3) - 0.5) * out.headR * 2, out.head[1] + u * HP * 0.9, 6, 9, 0, 0, TAU); c.fill(); }
    const hx = lerp(TH[0] + 90, TH[0] + 300, hop), hy = lerp(TH[1] - 520, TH[1] + 80, hop) - Math.sin(hop * Math.PI) * 120;
    const ho = hero(c, hop < 1 ? base(t, "grin", { legL: { a: 30, b: 0, lift: 200 * (1 - hop) }, legR: { a: 30, b: 0, lift: 200 * (1 - hop) }, armR: { a: 40, b: 60 }, handR: "hold", lookX: -0.6, lookY: 0.5, grounded: hop >= 1 }) : stance(t, "laugh", { armR: { a: 40, b: 60 }, handR: "hold", lookX: -0.8 }), hx, hy, HP * lerp(0.95, 1, hop));
    drawGlass(c, ho.gloveR[0] + 10, ho.gloveR[1] + 60, 0.55, 0, -0.3, t);
  });
}
/* ======== S18 79.4-86.4 looks at its hands, shrugs, fades into a grey puddle ======== */
export function S18(c: Ctx, t: number) {
  const hands = t > 79.85 && t < 80.95, shrug = seg(t, 80.95, 81.3) * (1 - seg(t, 81.7, 82.0));
  view(c, paperBG(), t < 81.9 ? { x: TH[0] - 30, y: TH[1] - 420, z: 2.0 } : { x: TH[0] - 60, y: TH[1] - 260, z: 1.35 }, RIM_PAPER, () => {
    paperProps(c, t, { castle: 1, throne: 1 });
    const out = copyKing(c, t, { face: hands ? "surprised" : shrug > 0 ? "neutral" : "worried", hands, shrug }); crownOnCopy(c, t, out, 1);
    if (hands) for (const g of [out.gloveL, out.gloveR]) for (let i = 0; i < 3; i++) { const u = ((t * 1.5 + i / 3) % 1); c.fillStyle = "rgba(100,100,110,0.75)"; c.beginPath(); c.ellipse(g[0] + (i - 1) * 8, g[1] + 20 + u * 120, 5, 8, 0, 0, TAU); c.fill(); }
    gPuddle(c, TH[0], TH[1] + 30, 300, 70, clamp(meltThrone(t) + meltCopy(t) * 0.4), t);
    const ho = hero(c, stance(t, t < 82.5 ? "surprised" : "smile", { armR: { a: 30, b: 50 }, handR: "relaxed", lookX: -0.9, lookY: t > 82.5 ? 0.5 : 0 }), TH[0] + 300, TH[1] + 80, HP); void ho;
    if (t > 83.5) sparkles(c, TH[0], TH[1] + 10, t, 8, 160, 14, "#ffffff", 12, 0.6);
  });
}
/* ======== S19 86.4-90.4 next morning: picks up his pencil from the puddle and wipes it clean ======== */
const PUDDLE_D: V2 = [470, 1500];
export function S19(c: Ctx, t: number) {
  const pick = seg(t, 86.85, 87.3, easeIO), wipe = seg(t, 87.9, 88.9, (x) => x);
  view(c, deskBG(true), { x: 600, y: 1200, z: t < 88.2 ? 1.5 : 1.85 }, RIM_AM, () => {
    closedBook(c); gPuddle(c, PUDDLE_D[0], PUDDLE_D[1], 170, 40, 1, t);
    const pencilLying: V2 = [PUDDLE_D[0] + 60, PUDDLE_D[1] - 10];
    const ho = hero(c, stance(t, wipe > 0 ? "grin" : "smile", { ikR: pick < 1 ? toU(lerp(pencilLying[0] + 30, 700, pick), lerp(pencilLying[1] - 40, STAND_Y - 260, pick), 720, STAND_Y, HH) : [120, 470], handR: "fist", armL: wipe > 0 && wipe < 1 ? { a: 60 + Math.sin(t * 16) * 20, b: 80 } : undefined, handL: "open", lean: pick < 0.5 ? -10 * (1 - pick) : 0, lookX: -0.4 }), 720, STAND_Y, HH);
    if (pick <= 0) { c.save(); c.translate(pencilLying[0], pencilLying[1]); c.rotate(-1.4); pencilAt(c, [0, 0], 300, 0, 1); c.restore(); }
    else pencilAt(c, [ho.gloveR[0] - 6, ho.gloveR[1] + 90], 300, 0.15, 1 - wipe);
    if (wipe > 0 && wipe < 1) sparkles(c, ho.gloveR[0], ho.gloveR[1] - 40, t, 6, 70, 12, "#ffffff", 13, 1);
  });
}
/* ======== S20 90.4-95.9 draws a small sign above the desk: NO MORE COPIES ======== */
const SIGN: V2 = [300, 1000], BOOKTOP: V2 = [640, 1205];
export function S20(c: Ctx, t: number) {
  const bp = seg(t, 90.68, 92.3, (x) => x), tp = seg(t, 93.1, 94.0, (x) => x);
  view(c, deskBG(true), { x: 480, y: 1000, z: 1.3 }, RIM_AM, () => {
    gPuddle(c, PUDDLE_D[0], PUDDLE_D[1], 170, 40, 1 - seg(t, 90.4, 91.4), t); closedBook(c);
    const tip1 = gDraw(c, signBoard(SIGN[0], SIGN[1], 470, 170), { prog: bp, seed: 21 });
    const tip2 = tp > 0 ? gText(c, "NO MORE COPIES", SIGN[0], SIGN[1], 56, tp) : null;
    const tip = tp > 0 && tp < 1 ? tip2 : bp > 0 && bp < 1 ? tip1 : null;
    const hx = BOOKTOP[0], grip = tip ? gripFor(tip, 300, 0.6) : null;
    const ho = hero(c, stance(t, tp >= 1 ? "laugh" : "determined", { ikR: grip ? toU(grip[0], grip[1], hx, BOOKTOP[1], HH) : [130, 470], handR: "fist", lookX: -0.7, lookY: tip ? -0.8 : 0, legR: { a: 4, b: 0, lift: tip ? 0 : 18 } }), hx, BOOKTOP[1], HH);
    heldDraw(c, t, ho.gloveR, 300, tip ? 0.6 : 0.15, tip);
  });
}
/* ======== S21 95.9-100 end ======== */
export function S21(c: Ctx, t: number) {
  view(c, deskBG(true), { x: 480, y: lerp(1080, 1040, seg(t, 95.9, 100)), z: lerp(1.5, 1.3, seg(t, 95.9, 100)) }, RIM_AM, () => {
    closedBook(c); gDraw(c, signBoard(SIGN[0], SIGN[1], 470, 170), { seed: 21 }); gText(c, "NO MORE COPIES", SIGN[0], SIGN[1], 56, 1);
    const ho = hero(c, stance(t, "grin", { armR: { a: 40, b: 128 }, handR: "thumb", lookX: 0 }), BOOKTOP[0], BOOKTOP[1], HH); void ho;
  });
}
void easeBack; void HORIZON; void GLASS; void VH;
