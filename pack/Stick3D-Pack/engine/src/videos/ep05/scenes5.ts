// EP05 v2 "What If Stickman's Drawing Came Alive?" — tighter framing (characters 40-60% of frame), cuts every 2-3 s,
// fully drawn sketchbook world, sketchbook lying flat on the desk, stronger acting.
import { Rig } from "../../style/stickman";
import { drawPencil, sparkles, puff, glow, sweatDrops, seg, lerp, clamp, easeIO, easeBack, rnd, INK, V2 } from "../../style/props2d";
import { stick, setLook, setGraphite, StickOut } from "../ep03/engine2d";
import { deskBG, paperBG, drawGlass, WW, WH, STAND_Y } from "./bg5";
import { gDraw, gHatch, cage, lockStrokes, crown, throne, thronePoly, castle, throneRoom, dog, signBoard, gText, gPuddle } from "./draw5";

type Ctx = CanvasRenderingContext2D;
const TAU = Math.PI * 2;
export const VW = 1080, VH = 1920;
type Cam = { x: number; y: number; z: number; sx?: number; sy?: number };
function view(c: Ctx, bg: HTMLCanvasElement, cam: Cam, rim: string, fn: () => void) {
  const hw = VW / 2 / cam.z, hh = VH / 2 / cam.z, x = clamp(cam.x, hw, WW - hw), y = clamp(cam.y, hh, WH - hh);
  setLook(rim, true); c.save(); c.translate(VW / 2 + (cam.sx ?? 0), VH / 2 + (cam.sy ?? 0)); c.scale(cam.z, cam.z); c.translate(-x, -y); c.drawImage(bg, 0, 0); fn(); c.restore();
}
// pick the camera of the current shot; a slow drift inside each shot keeps it alive
function shot(t: number, list: [number, Cam][]): Cam { for (let i = 0; i < list.length; i++) if (t < list[i][0] || i === list.length - 1) { const t0 = i ? list[i - 1][0] : t - 1, k = clamp((t - t0) / Math.max(0.5, list[i][0] - t0)); const cm = list[i][1]; return { ...cm, z: cm.z * (1 + 0.04 * k) }; } return list[0][1]; }
const shakeXY = (t: number, t0: number, amp: number): [number, number] => { if (t < t0 || t > t0 + 0.5) return [0, 0]; const k = Math.exp(-(t - t0) * 8) * amp; return [Math.sin(t * 61) * k, Math.cos(t * 53) * k]; };
const RIM_PM = "255,205,130", RIM_PAPER = "255,226,180", RIM_AM = "255,240,190";

/* ---------- characters ---------- */
const base = (t: number, face: Rig["face"], x: Partial<Rig> = {}): Rig => ({ t: t * 30, view: "front", face, armL: { a: 12, b: 10 }, armR: { a: 12, b: 10 }, legL: { a: 6, b: 0 }, legR: { a: 6, b: 0 }, ...x } as Rig);
const stance = (t: number, face: Rig["face"], x: Partial<Rig> = {}): Rig => base(t, face, { legL: { a: 9, b: 0 }, legR: { a: 4, b: 0, lift: 18 }, lean: Math.sin(t * 0.8) * 1.5, ...x });
const toU = (wx: number, wy: number, x: number, y: number, h: number): [number, number] => [(wx - x) * 1000 / h, (y - wy) * 1000 / h];
function hero(c: Ctx, rig: Rig, x: number, y: number, h: number, rot = 0): StickOut { return stick(c, rig, x, y, h, undefined, rot); }
function copy(c: Ctx, t: number, rig: Rig, x: number, y: number, h: number, o: { alpha?: number; melt?: number; reveal?: (g: Ctx, W: number, H: number) => void; flat?: boolean } = {}): StickOut {
  if (o.flat) setLook(null, false); else setLook(null, true);
  setGraphite({ alpha: o.alpha ?? 1, melt: o.melt ?? 0, t, reveal: o.reveal }); const out = stick(c, rig, x, y, h); setGraphite(null); return out;
}
function pencilAt(c: Ctx, tip: V2, len: number, ang = 0.35, coat = 0) { drawPencil(c, tip[0], tip[1], len, ang); if (coat > 0) { c.save(); c.globalAlpha = coat; c.translate(tip[0], tip[1]); c.rotate(ang); c.fillStyle = "rgba(90,90,100,0.85)"; c.fillRect(-len * 0.07, -len * 0.85, len * 0.14, len * 0.7); c.restore(); } }
const tipOfHeld = (g: V2, len: number, ang: number): V2 => [g[0] - Math.sin(ang) * len * 0.5, g[1] + Math.cos(ang) * len * 0.5];
function heldDraw(c: Ctx, t: number, glove: V2, len: number, ang: number, target: V2 | null) {
  const pt = tipOfHeld(glove, len, ang); pencilAt(c, pt, len, ang);
  if (target && Math.hypot(target[0] - pt[0], target[1] - pt[1]) > 30) { c.save(); c.lineCap = "round"; const n = 18; for (const [w, col] of [[9, "rgba(150,150,160,0.35)"], [3.5, "rgba(70,70,80,0.9)"]] as [number, string][]) { c.beginPath(); for (let i = 0; i <= n; i++) { const u = i / n, x = lerp(pt[0], target[0], u) + Math.sin(u * 9 + t * 20) * 6 * Math.sin(u * Math.PI), y = lerp(pt[1], target[1], u) - Math.sin(u * Math.PI) * 40; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.lineWidth = w; c.strokeStyle = col; c.stroke(); } c.restore(); sparkles(c, target[0], target[1], t, 5, 26, 7, "#ffffff", 9, 0.8); }
}
const gripFor = (tip: V2, len: number, ang = 0.35): V2 => [tip[0] + Math.sin(ang) * len * 0.55, tip[1] - Math.cos(ang) * len * 0.55];
function shockLines(c: Ctx, o: StickOut, k: number, col = INK) { if (k <= 0) return; c.save(); c.strokeStyle = col; c.lineCap = "round"; c.lineWidth = 7; for (let i = 0; i < 9; i++) { const a = -Math.PI + i * Math.PI / 8, r0 = o.headR * 1.35, r1 = o.headR * (1.65 + 0.25 * k); c.beginPath(); c.moveTo(o.head[0] + Math.cos(a) * r0, o.head[1] + Math.sin(a) * r0); c.lineTo(o.head[0] + Math.cos(a) * r1, o.head[1] + Math.sin(a) * r1); c.stroke(); } c.restore(); }
function title(c: Ctx, txt: string, sub: string, k: number) { if (k <= 0) return; c.save(); c.translate(VW / 2, 330); const s = 0.6 + 0.4 * easeBack(clamp(k)); c.scale(s, s); c.textAlign = "center"; c.lineJoin = "round"; c.font = "900 64px Inter, Arial"; c.lineWidth = 14; c.strokeStyle = INK; c.strokeText(sub, 0, -110); c.fillStyle = "#ffd23a"; c.fillText(sub, 0, -110);
  c.font = "900 120px Inter, Arial"; const lines = txt.split("\n"); lines.forEach((l, i) => { c.lineWidth = 22; c.strokeStyle = INK; c.strokeText(l, 0, 20 + i * 120); c.fillStyle = "#ffffff"; c.fillText(l, 0, 20 + i * 120); }); c.restore(); }

/* ---------- desk: the sketchbook lies flat on the desk in perspective ---------- */
const HH = 430, HERO_D: V2 = [860, 1520];
const PAGE = { cx: 560, cy: 1480, w: 470, h: 360, sy: 0.42 }; // page rectangle (local, before the perspective squash)
const FEET_FLAT: V2 = [PAGE.cx, PAGE.cy + PAGE.h * PAGE.sy * 0.42]; // the copy's feet on the page (near edge side)
function sketchbookFlat(c: Ctx) {
  c.save(); c.translate(PAGE.cx, PAGE.cy); c.transform(1, 0, -0.18, PAGE.sy, 0, 0);
  c.fillStyle = "rgba(20,10,30,0.3)"; c.beginPath(); c.roundRect(-PAGE.w / 2 + 16, -PAGE.h / 2 + 24, PAGE.w + 20, PAGE.h + 20, 14); c.fill();
  c.beginPath(); c.roundRect(-PAGE.w / 2 - 14, -PAGE.h / 2 - 14, PAGE.w + 28, PAGE.h + 28, 12); c.fillStyle = "#2b3350"; c.fill(); c.lineWidth = 9; c.strokeStyle = INK; c.stroke();
  c.beginPath(); c.roundRect(-PAGE.w / 2, -PAGE.h / 2, PAGE.w, PAGE.h, 6); c.fillStyle = "#fffdf6"; c.fill(); c.lineWidth = 6; c.stroke();
  c.strokeStyle = "rgba(90,140,220,0.4)"; c.lineWidth = 4; for (let y = -PAGE.h / 2 + 40; y < PAGE.h / 2; y += 36) { c.beginPath(); c.moveTo(-PAGE.w / 2 + 8, y); c.lineTo(PAGE.w / 2 - 8, y); c.stroke(); }
  c.strokeStyle = "rgba(230,70,90,0.45)"; c.beginPath(); c.moveTo(-PAGE.w / 2 + 60, -PAGE.h / 2); c.lineTo(-PAGE.w / 2 + 60, PAGE.h / 2); c.stroke();
  for (let i = 0; i < 12; i++) { c.beginPath(); c.ellipse(-PAGE.w / 2 + 30 + i * 38, -PAGE.h / 2 - 8, 10, 22, 0, 0, TAU); c.lineWidth = 6; c.strokeStyle = "#9aa2b8"; c.stroke(); }
  c.restore();
}
function closedBook(c: Ctx) { c.save(); c.translate(250, 1540); c.transform(1, 0, -0.3, 0.45, 0, 0); c.beginPath(); c.roundRect(-150, -170, 300, 340, 10); c.fillStyle = "#2b3350"; c.fill(); c.lineWidth = 8; c.strokeStyle = INK; c.stroke(); c.fillStyle = "#fffdf6"; c.fillRect(-140, 150, 280, 14); c.restore(); }
// zigzag "drawing" mask in rig-canvas coords (hoodie -> legs/shoes -> head/face)
const ZZ: V2[] = (() => { const o: V2[] = []; const band = (y0: number, y1: number, x0: number, x1: number) => { for (let y = y0, i = 0; y <= y1; y += 30, i++) { o.push([i % 2 ? x1 : x0, y]); o.push([i % 2 ? x0 : x1, y + 15]); } }; band(470, 800, 130, 510); band(800, 960, 170, 470); band(40, 470, 140, 500); return o; })();
const ZLEN = (() => { let L = 0; for (let i = 1; i < ZZ.length; i++) L += Math.hypot(ZZ[i][0] - ZZ[i - 1][0], ZZ[i][1] - ZZ[i - 1][1]); return L; })();
function zzUpTo(p: number): { pts: V2[]; tip: V2 } { let rem = ZLEN * clamp(p); const pts: V2[] = [ZZ[0]]; for (let i = 1; i < ZZ.length; i++) { const a = ZZ[i - 1], b = ZZ[i], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (rem >= L) { pts.push(b); rem -= L; } else { const k = rem / L; pts.push([lerp(a[0], b[0], k), lerp(a[1], b[1], k)]); break; } } return { pts, tip: pts[pts.length - 1] }; }
const rigToWorld = (p: V2, x: number, y: number, h: number): V2 => { const k = h / (1000 * (960 * 0.955 / 1040)); return [x + (p[0] - 320) * k, y + (p[1] - 960 * 0.985) * k]; };
const copyDrawP = (t: number) => t < 4.3 ? 0 : t < 6.2 ? lerp(0, 0.42, (t - 4.3) / 1.9) : t < 7.2 ? lerp(0.42, 0.6, (t - 6.2) / 1.0) : lerp(0.6, 1, clamp((t - 7.2) / 1.0));
// the copy lying flat on the page (peel 0) -> standing up (peel 1); feet stay on the page's near edge
function copyOnPage(c: Ctx, t: number, rig: Rig, peel: number, reveal?: (g: Ctx, W: number, H: number) => void, dx = 0): StickOut {
  const sy = lerp(PAGE.sy, 1, peel), h = lerp(380, HH, peel), fx = FEET_FLAT[0] + dx, fy = FEET_FLAT[1];
  c.save(); c.translate(fx, fy); c.transform(1, 0, -0.18 * (1 - peel), sy, 0, 0); c.translate(-fx, -fy);
  const o = copy(c, t, rig, fx, fy, h, { flat: peel < 0.5, reveal }); c.restore();
  const m = (p: V2): V2 => [p[0] - 0.18 * (1 - peel) * (p[1] - fy) * sy, fy + (p[1] - fy) * sy];
  return { gloveR: m(o.gloveR), gloveL: m(o.gloveL), head: m(o.head), headR: o.headR };
}
const flatTip = (p: V2): V2 => { const w = rigToWorld(p, FEET_FLAT[0], FEET_FLAT[1], 380); return [w[0] - 0.18 * (w[1] - FEET_FLAT[1]) * PAGE.sy, FEET_FLAT[1] + (w[1] - FEET_FLAT[1]) * PAGE.sy]; };

/* ======== S1 0-3.85 HOOK: close-up, the grey copy grins and snatches the pencil; quick zoom; title beat ======== */
export function S1(c: Ctx, t: number) {
  const snatch = seg(t, 0.55, 0.95, easeIO), zoom = seg(t, 1.25, 1.55, easeIO);
  const cam: Cam = t < 2.35 ? { x: 720, y: 1180, z: lerp(2.3, 3.4, zoom) } : { x: 720, y: 1240, z: 1.9 };
  view(c, deskBG(false), { ...cam, x: t < 1.25 ? 720 : lerp(720, 600, zoom) }, RIM_PM, () => {
    sketchbookFlat(c);
    const co = copy(c, t, base(t, "smirk", { ikR: t < 0.95 ? toU(lerp(700, 780, snatch), 1330, 600, 1540, HH) : [260, 520], handR: "fist", lookX: 0.6, legL: { a: 10, b: 0 }, legR: { a: 4, b: 0, lift: 20 } }), 600, 1540, HH);
    setLook(RIM_PM, true);
    const ho = hero(c, stance(t, t < 0.6 ? "smile" : "surprised", { ikR: t < 0.6 ? [-140, 470] : [-60, 380], handR: t < 0.6 ? "fist" : "open", lookX: -1, lean: snatch > 0 && snatch < 1 ? -6 : 0 }), HERO_D[0], HERO_D[1], HH);
    const g: V2 = t < 0.6 ? ho.gloveR : t < 0.95 ? [lerp(ho.gloveR[0], co.gloveR[0], snatch), lerp(ho.gloveR[1], co.gloveR[1], snatch)] : co.gloveR;
    pencilAt(c, t < 0.95 ? [g[0] - 6, g[1] + 90] : [g[0] + 130, g[1] + 40], 300, t < 0.95 ? 0.2 : -1.25 + Math.sin(t * 5) * 0.1);
    if (t > 0.9 && t < 1.4) { c.save(); c.font = "900 64px Inter"; c.fillStyle = "#ffd23a"; c.strokeStyle = INK; c.lineWidth = 10; c.strokeText("SNATCH!", co.head[0] - 120, co.head[1] - 240); c.fillText("SNATCH!", co.head[0] - 120, co.head[1] - 240); c.restore(); }
  });
  if (t > 2.35) title(c, "THE COPY", "WHAT IF...", seg(t, 2.35, 2.7));
  if (t > 1.25 && t < 1.45) { c.fillStyle = `rgba(255,255,255,${0.6 * (1 - seg(t, 1.25, 1.45))})`; c.fillRect(0, 0, VW, VH); }
}
/* ======== S2 3.85-10.3 he draws a copy of himself in the sketchbook lying on the desk ======== */
export function S2(c: Ctx, t: number) {
  const p = copyDrawP(t), zz = zzUpTo(p), tipW = flatTip(zz.tip), drawing = p > 0 && p < 1;
  const cam = shot(t, [[6.0, { x: 680, y: 1330, z: 1.85 }], [8.0, { x: 560, y: 1440, z: 2.7 }], [10.3, { x: 740, y: 1320, z: 2.0 }]]);
  view(c, deskBG(false), cam, RIM_PM, () => {
    sketchbookFlat(c);
    for (let pass = 0; pass < 2; pass++) copyOnPage(c, t, base(t, "smile", { legL: { a: 9, b: 0 }, legR: { a: 4, b: 0, lift: 18 } }), 0, (g) => { g.lineWidth = 64; g.lineCap = "round"; g.lineJoin = "round"; g.beginPath(); zz.pts.forEach((q, i) => (i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]))); g.stroke(); });
    setLook(RIM_PM, true);
    const tip: V2 = drawing ? [tipW[0] + Math.sin(t * 40) * 3, tipW[1]] : [HERO_D[0] - 170, HERO_D[1] - 230];
    const hx = drawing ? clamp(tipW[0] + 260, 760, 880) : HERO_D[0], grip = gripFor(tip, 300, 0.5);
    const out = hero(c, stance(t, t > 8.3 ? "laugh" : "determined", { ikR: toU(grip[0], grip[1], hx, HERO_D[1], HH), ikL: [-120, 430], handR: "fist", handL: "relaxed", lean: drawing ? -12 : 0, lookX: -0.8, lookY: drawing ? 0.8 : 0 }), hx, HERO_D[1], HH);
    heldDraw(c, t, out.gloveR, 300, 0.5, drawing ? tip : null);
    if (drawing) sparkles(c, tip[0], tip[1], t, 4, 30, 6, "#ffffff", 3, 0.6);
  });
}
/* ======== S3 10.3-12.9 the drawing blinks ======== */
export function S3(c: Ctx, t: number) {
  const close = t < 11.7;
  view(c, deskBG(false), close ? { x: PAGE.cx - 10, y: PAGE.cy - 20, z: 3.2 } : { x: 760, y: 1320, z: 2.1 }, RIM_PM, () => {
    sketchbookFlat(c);
    copyOnPage(c, t, base(t, "smile", { blink: t > 11.06 && t < 11.22 ? 1 : 0, lookX: t > 11.3 ? 0.8 : 0, legL: { a: 9, b: 0 }, legR: { a: 4, b: 0, lift: 18 } }), 0);
    setLook(RIM_PM, true);
    if (!close) { const out = hero(c, stance(t, "surprised", { lookX: -1, lookY: 0.8, lean: -14, armR: { a: 40, b: 60 }, handR: "fist", squash: t < 12 ? -0.04 : 0 }), HERO_D[0], HERO_D[1], HH); pencilAt(c, [out.gloveR[0], out.gloveR[1] + 80], 300, 0.25); shockLines(c, out, seg(t, 11.7, 11.9) * (1 - seg(t, 12.5, 12.9))); }
  });
}
/* ======== S4 12.9-20.6 it peels up off the paper, grins and snatches the pencil ======== */
export function S4(c: Ctx, t: number) {
  const peel = seg(t, 13.2, 14.1, easeIO), stepOut = seg(t, 14.0, 14.5, easeIO), snatch = seg(t, 15.37, 15.85, easeIO);
  const cam = shot(t, [[14.2, { x: 650, y: 1320, z: 1.9 }], [15.1, { x: 560, y: 1180, z: 2.8 }], [17.4, { x: 720, y: 1300, z: 2.0 }], [20.6, { x: 620, y: 1250, z: 2.3 }]]);
  view(c, deskBG(false), cam, RIM_PM, () => {
    sketchbookFlat(c);
    const heroGlove: V2 = [HERO_D[0] - 150, HERO_D[1] - 230];
    const holdPencil = t < 15.6, reach = seg(t, 15.0, 15.37, easeIO) * (1 - seg(t, 15.85, 16.3));
    const cx = FEET_FLAT[0] + 70 * stepOut, cy = FEET_FLAT[1];
    const cRig = base(t, t < 14.41 ? "smile" : "smirk", { legL: { a: 9 + 18 * Math.sin(stepOut * Math.PI), b: 0, lift: 80 * Math.sin(stepOut * Math.PI) }, legR: { a: 4, b: 0, lift: 18 }, ikR: reach > 0 ? toU(heroGlove[0] - 20, heroGlove[1] + 10, cx, cy, HH) : t > 15.85 ? [140, 600] : undefined, ikKR: Math.max(reach, t > 15.85 ? 1 : 0), handR: "fist", lookX: 0.8 });
    const co = peel < 1 ? copyOnPage(c, t, cRig, peel) : copy(c, t, cRig, cx, cy, HH);
    setLook(RIM_PM, true);
    const jerk = snatch > 0 && snatch < 1 ? Math.sin(snatch * Math.PI) * 0.06 : 0;
    const out = hero(c, stance(t, t < 15.37 ? (peel > 0.2 ? "surprised" : "smile") : t < 16.6 ? "surprised" : "worried", { ikR: holdPencil ? toU(heroGlove[0], heroGlove[1], HERO_D[0], HERO_D[1], HH) : [160, 440], handR: holdPencil ? "fist" : "open", lookX: -1, lean: -jerk * 60, squash: -jerk }), HERO_D[0], HERO_D[1], HH);
    const g: V2 = holdPencil ? (snatch > 0 ? [lerp(out.gloveR[0], co.gloveR[0], snatch), lerp(out.gloveR[1], co.gloveR[1], snatch)] : out.gloveR) : co.gloveR;
    pencilAt(c, [g[0] - 6, g[1] + 90], 300, holdPencil ? 0.25 : -0.3 + Math.sin(t * 3) * 0.12 * (t > 16.5 ? 1 : 0));
    if (t > 15.6 && t < 16.1) { c.save(); c.font = "900 60px Inter"; c.fillStyle = "#ffd23a"; c.strokeStyle = INK; c.lineWidth = 10; c.strokeText("SNATCH!", co.head[0] - 120, co.head[1] - 230); c.fillText("SNATCH!", co.head[0] - 120, co.head[1] - 230); c.restore(); }
  });
}
/* ======== S5 20.6-23.2 Stickman froze: a stiff jump with shock lines ======== */
export function S5(c: Ctx, t: number) {
  const jump = seg(t, 21.1, 21.3, easeIO) * (1 - seg(t, 21.85, 22.05, easeIO)), fr = seg(t, 21.15, 21.3);
  view(c, deskBG(false), shot(t, [[21.9, { x: HERO_D[0] - 60, y: HERO_D[1] - 260, z: 2.3 }], [23.2, { x: HERO_D[0] - 120, y: HERO_D[1] - 220, z: 2.0 }]]), RIM_PM, () => {
    const out = hero(c, base(t, "scared", { armL: { a: lerp(10, 22, fr), b: 0 }, armR: { a: lerp(10, 22, fr), b: 0 }, handL: "open", handR: "open", legL: { a: 3, b: 0 }, legR: { a: 3, b: 0 }, air: jump * 90, squash: 0.06 * fr - (t > 22.05 && t < 22.2 ? 0.06 : 0), lookX: -0.6, breath: 1 - fr }), HERO_D[0], HERO_D[1], HH);
    shockLines(c, out, fr); if (fr > 0) sweatDrops(c, out.head[0], out.head[1], out.headR, t, fr);
    if (fr > 0 && t < 22.4) { c.save(); c.font = "900 46px Inter"; c.fillStyle = "#ffffff"; c.strokeStyle = INK; c.lineWidth = 8; c.strokeText("!!", out.head[0] + out.headR * 1.1, out.head[1] - out.headR * 1.1); c.fillText("!!", out.head[0] + out.headR * 1.1, out.head[1] - out.headR * 1.1); c.restore(); }
    const co = copy(c, t, base(t, "smirk", { armR: { a: 50, b: 80 }, handR: "fist", lookX: 1 }), 630, 1560, HH); pencilAt(c, [co.gloveR[0] + 10, co.gloveR[1] + 90], 300, -0.3 + Math.sin(t * 4) * 0.15);
  });
}

/* ---------- sketchbook world ---------- */
const CAGE: V2 = [300, 1600], TH: V2 = [770, 1520], HP = 460;
const cageProg = (t: number) => seg(t, 23.9, 25.35, (x) => x);
const crownP = (t: number) => seg(t, 29.5, 30.45, (x) => x), throneP = (t: number) => seg(t, 31.2, 32.3, (x) => x), castleP = (t: number) => seg(t, 32.45, 34.8, (x) => x);
const MISSING = 4;
const smudge = (t: number) => seg(t, 51.3, 53.9, (x) => x);
const meltCrown = (t: number) => seg(t, 74.5, 76.5, (x) => x), meltThrone = (t: number) => seg(t, 75.9, 78.6, (x) => x), meltCopy = (t: number) => seg(t, 81.9, 83.9, (x) => x);
const copySeat = (t: number) => seg(t, 32.0, 32.45, easeIO);
const CASTLE = { cx: 560, base: 1260, w: 1000, h: 700 };
function paperProps(c: Ctx, t: number, o: { castle?: number; throne?: number; dogs?: boolean } = {}) {
  const mT = meltThrone(t), ca = o.castle ?? 0;
  if (ca > 0) { gDraw(c, castle(CASTLE.cx, CASTLE.base, CASTLE.w, CASTLE.h, t), { prog: clamp(ca / 0.75), melt: mT * 0.6, baseY: CASTLE.base + 70, alpha: 0.5 }); if (ca > 0.7) gDraw(c, throneRoom(TH[0], TH[1], t), { prog: (ca - 0.7) / 0.3, melt: mT * 0.5, baseY: TH[1] + 420, seed: 5, alpha: 0.6 }); }
  if ((o.throne ?? 0) > 0) { gHatch(c, thronePoly(TH[0], TH[1], 0.85), seg(o.throne!, 0.6, 1), mT, TH[1]); gDraw(c, throne(TH[0], TH[1], 0.85), { prog: o.throne, melt: mT, baseY: TH[1] + 30, seed: 3 }); }
  if (mT > 0) gPuddle(c, TH[0], TH[1] + 20, 230, 50, clamp(mT * 1.2));
  if (o.dogs) dogs(c, t);
}
// the two guard dogs: big, wobbly (boiling lines), one drawn backwards
const DOGS: [number, number, boolean][] = [[470, 1790, false], [690, 1800, true]];
function dogs(c: Ctx, t: number) { for (const [x, y, back] of DOGS) { const yip = t > 60.3 && t < 61.4 && back ? 0.5 + 0.5 * Math.sin(t * 22) : 0; gDraw(c, dog(x + Math.sin(t * 1.3 + x) * 10, y, 1.15, t * (t > 58 && t < 61.5 ? 1 : 6) + x, yip, back), { seed: x + Math.floor(t * 8), jit: 1.8 }); } }
function cageDraw(c: Ctx, t: number, prog: number, wob = 0) { const sm = smudge(t); gDraw(c, cage(CAGE[0], CAGE[1], 300, 520, MISSING, sm, wob, t), { prog, seed: 7 });
  if (sm > 0 && sm < 1) { const x = CAGE[0] - 150 + 300 * MISSING / 6; c.save(); c.globalAlpha = 1 - sm; gDraw(c, [{ pts: [[x, CAGE[1]], [x, CAGE[1] - 430]], w: 10 }]); c.restore(); const g = c.createRadialGradient(x, CAGE[1] - 260, 4, x, CAGE[1] - 260, 90); g.addColorStop(0, `rgba(120,120,130,${0.45 * sm})`); g.addColorStop(1, "rgba(120,120,130,0)"); c.fillStyle = g; c.fillRect(x - 90, CAGE[1] - 480, 180, 460); } }
const lockOn = (t: number) => t >= 25.39 && t < 57.2;
function copyKing(c: Ctx, t: number, o: { face?: Rig["face"]; ik?: [number, number]; hands?: boolean; shrug?: number; turn?: number } = {}) {
  const seat = copySeat(t), mC = meltCopy(t);
  const x = lerp(TH[0] + 210, TH[0], seat), y = lerp(TH[1] + 60, TH[1] - 40, seat) - Math.sin(seat * Math.PI) * 120;
  const sh = o.shrug ?? 0;
  const rig = base(t, o.face ?? "smirk", { legL: { a: 30 * seat + 8, b: 0, lift: 230 * seat }, legR: { a: 30 * seat + 4, b: 0, lift: 230 * seat }, ikR: o.ik, handR: "fist",
    armL: o.hands ? { a: 70, b: 70 } : sh > 0 ? { a: lerp(12, 50, sh), b: lerp(10, 100, sh) } : undefined, armR: o.ik ? undefined : o.hands ? { a: 70, b: 70 } : sh > 0 ? { a: lerp(12, 50, sh), b: lerp(10, 100, sh) } : { a: 50, b: 70 }, handL: o.hands || sh > 0 ? "open" : "relaxed",
    lookX: o.turn ? lerp(0, -1, o.turn) : 0, lookY: o.turn ? -0.8 * o.turn : o.hands ? 0.9 : 0, headTilt: o.turn ? -10 * o.turn : sh * 8, squash: -0.02 * sh });
  const out = copy(c, t, rig, x, y, HP, { melt: mC, alpha: 1 - seg(t, 83.2, 84.2), flat: seat > 0.5 });
  setLook(RIM_PAPER, true); return out;
}
function crownOnCopy(c: Ctx, t: number, out: StickOut, prog: number) { gDraw(c, crown(out.head[0], out.head[1] - out.headR * 1.12, 0.78), { prog, melt: meltCrown(t), baseY: out.head[1] + out.headR * 2, seed: 9 }); }
const copyPencil = (c: Ctx, out: StickOut) => pencilAt(c, [out.gloveR[0] + 10, out.gloveR[1] + 80], 150, -0.25);
const heroInCage = (t: number, face: Rig["face"], x: Partial<Rig> = {}) => stance(t, face, { ikL: toU(CAGE[0] - 125, CAGE[1] - 330, CAGE[0], CAGE[1], HP), ikR: toU(CAGE[0] + 125, CAGE[1] - 330, CAGE[0], CAGE[1], HP), handL: "hold", handR: "hold", ...x });

/* ======== S6 23.2-29.0 the copy draws a cage around him. Click. ======== */
export function S6(c: Ctx, t: number) {
  const prog = cageProg(t), [sx, sy] = shakeXY(t, 25.39, 20);
  const cam = shot(t, [[25.35, { x: 470, y: 1380, z: 1.75 }], [26.6, { x: CAGE[0] + 20, y: CAGE[1] - 260, z: 2.7 }], [29.0, { x: CAGE[0] + 60, y: CAGE[1] - 290, z: 2.0 }]]);
  view(c, paperBG(), { ...cam, sx, sy }, RIM_PAPER, () => {
    const tip = gDraw(c, cage(CAGE[0], CAGE[1], 300, 520), { prog, seed: 7 });
    if (lockOn(t)) { gDraw(c, lockStrokes(CAGE[0], CAGE[1] - 230), { prog: seg(t, 25.39, 25.55) }); if (t < 25.9) sparkles(c, CAGE[0], CAGE[1] - 210, t, 8, 60, 14, "#ffffff", 4, 1 - seg(t, 25.5, 25.9)); }
    const look = prog > 0 && prog < 1;
    hero(c, stance(t, prog < 0.2 ? "surprised" : t < 25.4 ? "scared" : "worried", { lookX: look ? 0.6 : 0.8, armL: { a: 50, b: 70 }, armR: { a: 50, b: 70 }, handL: "open", handR: "open", lean: Math.sin(t * 7) * 3 * (look ? 1 : 0), hunch: t > 25.4 ? 0.3 : 0 } as Partial<Rig>), CAGE[0], CAGE[1], HP);
    const tipT = tip && prog < 1 ? tip : null; const cx = tipT ? clamp(tipT[0] + 230, 520, 760) : lerp(520, 640, seg(t, 25.4, 26.4, easeIO)), cy = 1640;
    const grip = tipT ? gripFor(tipT, 150, 0.5) : null;
    const co = copy(c, t, base(t, "smirk", { ikR: grip ? toU(grip[0], grip[1], cx, cy, HP) : [140, 560], handR: "fist", lookX: -0.9, legL: { a: 10, b: 0 }, legR: { a: 4, b: 0, lift: 20 } }), cx, cy, HP);
    setLook(RIM_PAPER, true); heldDraw(c, t, co.gloveR, 150, tipT ? 0.5 : -0.25, tipT);
    if (t > 25.39 && t < 26.1) { c.save(); c.font = "900 90px Inter"; c.fillStyle = "#ffffff"; c.strokeStyle = INK; c.lineWidth = 14; c.strokeText("CLICK!", CAGE[0] - 150, CAGE[1] - 560); c.fillText("CLICK!", CAGE[0] - 150, CAGE[1] - 560); c.restore(); }
  });
}
/* ======== S7 29.0-36.9 crown, throne, castle ======== */
export function S7(c: Ctx, t: number) {
  const cr = crownP(t), th = throneP(t), ca = castleP(t);
  const cam = shot(t, [[30.6, { x: TH[0] + 160, y: 1240, z: 2.4 }], [32.4, { x: TH[0] + 60, y: 1300, z: 1.8 }], [34.8, { x: 560, y: 1050, z: 1.1 }], [36.9, { x: TH[0] - 60, y: 1280, z: 1.85 }]]);
  view(c, paperBG(), cam, RIM_PAPER, () => {
    paperProps(c, t, { castle: ca, throne: th });
    cageDraw(c, t, 1); if (lockOn(t)) gDraw(c, lockStrokes(CAGE[0], CAGE[1] - 230));
    hero(c, heroInCage(t, "worried", { lookX: 0.8 }), CAGE[0], CAGE[1], HP);
    let tip: V2 | null = null; const probe = (st: ReturnType<typeof crown>, p: number) => { if (p > 0 && p < 1) { c.save(); c.globalAlpha = 0; tip = gDraw(c, st, { prog: p }); c.restore(); } };
    const seat = copySeat(t), cx = lerp(TH[0] + 210, TH[0], seat), cy = lerp(TH[1] + 60, TH[1] - 40, seat), headY = cy - HP * 0.84;
    probe(crown(cx, headY - HP * 0.2, 0.78), cr); probe(throne(TH[0], TH[1], 0.85), th); probe(castle(CASTLE.cx, CASTLE.base, CASTLE.w, CASTLE.h, t), clamp(ca / 0.75));
    const grip = tip ? gripFor(tip, 150, 0.5) : null;
    const out = copyKing(c, t, { ik: grip ? toU(grip[0], grip[1], cx, cy - Math.sin(seat * Math.PI) * 120, HP) : undefined, face: "smirk" });
    crownOnCopy(c, t, out, cr);
    heldDraw(c, t, out.gloveR, 150, tip ? 0.5 : -0.25, tip);
    if (t > 34.8) sparkles(c, 560, 600, t, 10, 400, 18, "#ffffff", 6, 0.6);
  });
}
/* ======== S8 36.9-39.4 King Copy (low angle) ======== */
export function S8(c: Ctx, t: number) {
  view(c, paperBG(), shot(t, [[38.2, { x: TH[0] - 20, y: TH[1] - 330, z: 2.3 }], [39.4, { x: TH[0] - 80, y: TH[1] - 380, z: 1.9 }]]), RIM_PAPER, () => {
    paperProps(c, t, { castle: 1, throne: 1 });
    const out = copyKing(c, t, { face: "smirk" }); crownOnCopy(c, t, out, 1); copyPencil(c, out);
    sparkles(c, out.head[0], out.head[1] - out.headR * 1.3, t, 8, 90, 18, "#fff6c0", 8, 0.8);
  });
}
/* ======== S9 39.4-43.7 grabs the bars with both gloves and shakes hard. Nothing. ======== */
export function S9(c: Ctx, t: number) {
  const shaking = t > 39.85 && t < 41.45, sh = shaking ? Math.sin(t * 38) * 14 : 0, slump = seg(t, 41.5, 42.0);
  view(c, paperBG(), shot(t, [[41.45, { x: CAGE[0] + 30, y: CAGE[1] - 320, z: 2.2 }], [43.7, { x: CAGE[0] + 80, y: CAGE[1] - 260, z: 2.5 }]]), RIM_PAPER, () => {
    paperProps(c, t, { castle: 1, throne: 1 }); cageDraw(c, t, 1, shaking ? 1 : 0); gDraw(c, lockStrokes(CAGE[0] + sh * 0.4, CAGE[1] - 230));
    const o = hero(c, stance(t, shaking ? "determined" : slump > 0.5 ? "worried" : "determined", { ikL: toU(CAGE[0] - 125 + sh, CAGE[1] - 330 + slump * 140, CAGE[0], CAGE[1], HP), ikR: toU(CAGE[0] + 125 + sh, CAGE[1] - 330 + slump * 140, CAGE[0], CAGE[1], HP), handL: "hold", handR: "hold", lean: sh * 0.8, squash: shaking ? Math.sin(t * 38) * 0.03 : -0.05 * slump, headTilt: slump * 12, lookY: slump * 0.7, legL: { a: 14, b: 0 }, legR: { a: 10, b: 0, lift: 30 } }), CAGE[0] + sh * 0.3, CAGE[1], HP);
    if (shaking) for (const sx of [-1, 1]) { c.save(); c.lineWidth = 7; c.strokeStyle = INK; c.lineCap = "round"; for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(CAGE[0] + sx * 175, CAGE[1] - 360 + k * 50); c.lineTo(CAGE[0] + sx * 225, CAGE[1] - 370 + k * 50); c.stroke(); } c.restore(); }
    if (slump > 0.5) { c.save(); c.font = "900 50px Inter"; c.fillStyle = "#cfd6ea"; c.strokeStyle = INK; c.lineWidth = 8; c.strokeText("...", o.head[0] + o.headR, o.head[1] - o.headR * 1.2); c.fillText("...", o.head[0] + o.headR, o.head[1] - o.headR * 1.2); c.restore(); }
  });
}
/* ======== S10 43.7-46.9 but the copy forgot one thing ======== */
export function S10(c: Ctx, t: number) {
  const look = seg(t, 45.3, 45.8);
  view(c, paperBG(), shot(t, [[45.3, { x: TH[0] - 30, y: TH[1] - 300, z: 2.1 }], [46.9, { x: CAGE[0] + 40, y: CAGE[1] - 290, z: 2.4 }]]), RIM_PAPER, () => {
    paperProps(c, t, { castle: 1, throne: 1 }); cageDraw(c, t, 1); gDraw(c, lockStrokes(CAGE[0], CAGE[1] - 230));
    const out = copyKing(c, t, { face: t > 44.6 ? "laugh" : "smirk" }); crownOnCopy(c, t, out, 1); copyPencil(c, out);
    const ho = hero(c, stance(t, look > 0.5 ? "think" : "worried", { armL: { a: 50, b: 115 }, handL: "open", armR: { a: 18, b: 12 }, lookX: -0.4, lookY: look * 0.6 }), CAGE[0], CAGE[1], HP);
    if (look > 0) { c.save(); c.globalAlpha = look; c.fillStyle = "rgba(90,90,100,0.75)"; c.beginPath(); c.ellipse(ho.gloveL[0], ho.gloveL[1] - 8, 20, 12, 0.3, 0, TAU); c.fill(); c.restore(); }
  });
}
/* ======== S11 46.9-49.9 it was drawn in pencil (close on the bar) ======== */
export function S11(c: Ctx, t: number) {
  const x = CAGE[0] - 150 + 300 * MISSING / 6;
  view(c, paperBG(), { x: x - 40, y: CAGE[1] - 340, z: 2.9 }, RIM_PAPER, () => {
    cageDraw(c, t, 1);
    const ho = hero(c, stance(t, t > 48.4 ? "grin" : "think", { ikR: toU(x + 18, CAGE[1] - 300 + Math.sin(t * 6) * 20, CAGE[0], CAGE[1], HP), handR: "point", lookX: 0.8 }), CAGE[0], CAGE[1], HP);
    c.save(); c.globalAlpha = 0.5; c.strokeStyle = "rgba(90,90,100,0.7)"; c.lineWidth = 10; c.beginPath(); c.moveTo(x + 8, CAGE[1] - 330); c.lineTo(x + 20, CAGE[1] - 260 + Math.sin(t * 6) * 20); c.stroke(); c.restore();
    if (t > 48.4) { const k = seg(t, 48.4, 48.7, easeBack); c.save(); c.translate(ho.head[0] + ho.headR * 1.2, ho.head[1] - ho.headR * 1.3); c.scale(k, k); c.beginPath(); c.arc(0, 0, 34, 0, TAU); c.fillStyle = "#ffe86a"; c.fill(); c.lineWidth = 6; c.strokeStyle = INK; c.stroke(); c.fillStyle = "#c8c8d0"; c.fillRect(-14, 30, 28, 16); c.restore(); glow(c, ho.head[0] + ho.headR * 1.2, ho.head[1] - ho.headR * 1.3, 90, "rgba(255,240,140,1)", 0.6 * k); }
  });
}
/* ======== S12 49.9-57.0 licks his thumb (close-up), rubs the bar, it smudges away ======== */
export function S12(c: Ctx, t: number) {
  const lick = seg(t, 50.2, 50.45) * (1 - seg(t, 51.0, 51.25)), rub = t > 51.25 && t < 53.9;
  const x = CAGE[0] - 150 + 300 * MISSING / 6;
  const cam = shot(t, [[51.25, { x: CAGE[0] + 20, y: CAGE[1] - 400, z: 3.6 }], [53.2, { x: x - 30, y: CAGE[1] - 300, z: 2.6 }], [55.2, { x: CAGE[0] + 40, y: CAGE[1] - 280, z: 2.1 }], [57.0, { x: CAGE[0] + 70, y: CAGE[1] - 320, z: 2.4 }]]);
  view(c, paperBG(), cam, RIM_PAPER, () => {
    paperProps(c, t, { castle: 1, throne: 1 });
    cageDraw(c, t, 1); if (lockOn(t)) gDraw(c, lockStrokes(CAGE[0], CAGE[1] - 230));
    const ry = CAGE[1] - 300 + Math.sin(t * 16) * 80;
    const ho = hero(c, stance(t, lick > 0.3 ? "laugh" : rub ? "determined" : t > 53.9 ? "grin" : "smile", { ikR: lick > 0 ? [50, 790] : rub ? toU(x + 14, ry, CAGE[0], CAGE[1], HP) : undefined, ikKR: lick > 0 ? lick : 1, handR: lick > 0 ? "thumb" : rub ? "fist" : "relaxed", lookX: rub ? 0.8 : 0, lookY: lick > 0 ? 0.3 : 0, lean: rub ? 6 : 0, handsOverHead: lick > 0 } as Partial<Rig>), CAGE[0], CAGE[1], HP);
    if (lick > 0.3) { c.save(); c.fillStyle = "#ff7d8e"; c.beginPath(); c.ellipse(ho.head[0] + ho.headR * 0.05, ho.head[1] + ho.headR * 0.72, ho.headR * 0.18, ho.headR * 0.16 * lick, 0, 0, TAU); c.fill(); c.lineWidth = 5; c.strokeStyle = INK; c.stroke(); c.restore();
      for (let i = 0; i < 3; i++) { const u = (t * 2.5 + i / 3) % 1; c.fillStyle = `rgba(140,210,255,${1 - u})`; c.beginPath(); c.arc(ho.gloveR[0] + 30 + u * 30, ho.gloveR[1] - 30 - u * 40, 8, 0, TAU); c.fill(); }
      c.save(); c.font = "900 56px Inter"; c.fillStyle = "#ffffff"; c.strokeStyle = INK; c.lineWidth = 9; c.strokeText("LICK!", ho.head[0] + ho.headR * 0.9, ho.head[1] - ho.headR * 1.25); c.fillText("LICK!", ho.head[0] + ho.headR * 0.9, ho.head[1] - ho.headR * 1.25); c.restore(); }
    if (rub) { for (let i = 0; i < 8; i++) { const u = (t * 2 + rnd(i)) % 1; c.fillStyle = `rgba(110,110,120,${0.6 * (1 - u)})`; c.beginPath(); c.arc(x + 30 + u * 70, ry + (rnd(i) - 0.5) * 60 + u * 40, 7, 0, TAU); c.fill(); } }
    if (t > 53.3 && t < 54.3) puff(c, x, CAGE[1] - 260, seg(t, 53.3, 54.3, (u) => u), 100, "#c8c8d0");
  });
}
/* ======== S13 57.0-62.0 slips out and tiptoes (knees high) past the badly drawn dogs ======== */
const tipX = (t: number) => t < 57.2 ? CAGE[0] : t < 57.9 ? lerp(CAGE[0], CAGE[0] + 150, seg(t, 57.2, 57.9, easeIO)) : lerp(CAGE[0] + 150, TH[0] + 220, seg(t, 57.9, 62.0, (x) => x));
export function S13(c: Ctx, t: number) {
  const x = tipX(t), squeeze = t > 57.2 && t < 57.9 ? Math.sin(seg(t, 57.2, 57.9) * Math.PI) : 0, ph = (t - 57.9) * 1.4 * TAU;
  const cam = shot(t, [[57.95, { x: CAGE[0] + 90, y: CAGE[1] - 260, z: 2.1 }], [60.2, { x: x + 40, y: 1500, z: 1.75 }], [61.4, { x: 600, y: 1600, z: 2.0 }], [62.0, { x: x, y: 1460, z: 1.9 }]]);
  view(c, paperBG(), cam, RIM_PAPER, () => {
    paperProps(c, t, { castle: 1, throne: 1, dogs: true });
    cageDraw(c, t, 1);
    const out = copyKing(c, t, { face: "smirk" }); crownOnCopy(c, t, out, 1); copyPencil(c, out);
    const tiptoe = t > 57.9, sp = Math.sin(ph), cp = Math.cos(ph);
    const rig: Rig = tiptoe ? { t: t * 30, view: "side", face: "smirk", lookX: 0.6, lean: 14, armR: { a: 30 + 15 * sp, b: 55 }, armL: { a: 30 - 15 * sp, b: 55 }, handR: "relaxed", handL: "relaxed",
      legR: { a: 70 * Math.max(0, sp) - 4, b: 120 * Math.max(0, sp), f: 40 }, legL: { a: 70 * Math.max(0, -sp) - 4, b: 120 * Math.max(0, -sp), f: 40 }, y: -14 * Math.abs(cp) } as Rig
      : stance(t, "determined", { squash: -0.06 * squeeze, lean: 14 * squeeze, armL: { a: 70, b: 40 }, armR: { a: 30, b: 20 } });
    hero(c, rig, x, CAGE[1] + (tiptoe ? 50 : 0), HP);
    if (tiptoe) { c.save(); c.globalAlpha = 0.7; c.strokeStyle = INK; c.lineWidth = 4; for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(x - 140 - k * 30, CAGE[1] - 60 + k * 30); c.lineTo(x - 180 - k * 30, CAGE[1] - 60 + k * 30); c.stroke(); } c.restore(); }
    if (t > 60.3 && t < 61.5) { c.save(); c.font = "900 54px Inter"; c.fillStyle = "#ffffff"; c.strokeStyle = INK; c.lineWidth = 9; c.strokeText("yip?", 740, 1580); c.fillText("yip?", 740, 1580); c.restore(); }
  });
}
/* ======== S14 62.0-65.1 grabs the glass and really climbs the back of the throne ======== */
const GL: V2 = [1010, 1640];
const climbK = (t: number) => seg(t, 62.3, 64.2, (x) => x);
export function S14(c: Ctx, t: number) {
  const k = climbK(t), grab = t > 62.15, ph = k * 5 * TAU / 2;
  view(c, paperBG(), shot(t, [[63.3, { x: TH[0] + 140, y: lerp(1420, 1100, k), z: 1.9 }], [65.1, { x: TH[0] + 100, y: 960, z: 2.0 }]]), RIM_PAPER, () => {
    paperProps(c, t, { castle: 1, throne: 1 });
    const out = copyKing(c, t, { face: "smirk" }); crownOnCopy(c, t, out, 1); copyPencil(c, out);
    if (!grab) drawGlass(c, GL[0], GL[1], 0.8, 0.85, 0, t);
    const climbing = k > 0 && k < 1, hx = lerp(TH[0] + 205, TH[0] + 120, k), hy = lerp(GL[1], TH[1] - 520, k);
    const s1 = Math.sin(ph), s2 = Math.cos(ph);
    const rig: Rig = climbing ? { t: t * 30, view: "side", flip: true, face: "determined", lean: -10, armR: { a: 165 + 18 * s1, b: 20 - 15 * s1 }, armL: { a: 150 - 18 * s1, b: 40 + 15 * s1 }, handR: "hold", handL: "hold", legR: { a: 50 * Math.max(0, s2), b: 90 * Math.max(0, s2), f: 20 }, legL: { a: 50 * Math.max(0, -s2), b: 90 * Math.max(0, -s2), f: 20 }, grounded: false, lookY: -0.8 } as Rig
      : k >= 1 ? base(t, "smirk", { legL: { a: 30, b: 0, lift: 200 }, legR: { a: 30, b: 0, lift: 200 }, armR: { a: 120, b: 40 }, handR: "hold", lookX: -0.6, lookY: 0.7 }) : stance(t, "determined", { armR: { a: 40, b: 80 }, handR: "hold", lookY: -0.6, lookX: -0.4 });
    const ho = hero(c, rig, hx, hy, HP * 0.95);
    if (grab) drawGlass(c, ho.gloveR[0] + (climbing ? 30 : 10), ho.gloveR[1] + 60, 0.55, 0.85, 0, t);
    if (climbing) { c.save(); c.strokeStyle = INK; c.lineWidth = 5; for (let i = 0; i < 2; i++) { c.beginPath(); c.moveTo(hx - 120, hy - 200 + i * 60); c.lineTo(hx - 150, hy - 220 + i * 60); c.stroke(); } c.restore(); }
  });
}
/* ======== S15 65.1-68.6 the copy turns around. Too late. ======== */
export function S15(c: Ctx, t: number) {
  const turn = seg(t, 65.5, 66.0, easeIO);
  view(c, paperBG(), shot(t, [[66.5, { x: TH[0] - 10, y: TH[1] - 420, z: 2.2 }], [68.6, { x: TH[0] + 60, y: TH[1] - 600, z: 2.0 }]]), RIM_PAPER, () => {
    paperProps(c, t, { castle: 1, throne: 1 });
    const ho = hero(c, base(t, t < 66.5 ? "smirk" : "grin", { legL: { a: 30, b: 0, lift: 200 }, legR: { a: 30, b: 0, lift: 200 }, armR: { a: 120, b: 40 }, handR: "hold", lookX: -0.6, lookY: 0.7 }), TH[0] + 120, TH[1] - 520, HP * 0.95);
    drawGlass(c, ho.gloveR[0] + 10, ho.gloveR[1] + 60, 0.55, 0.85, -0.2, t);
    const out = copyKing(c, t, { face: turn > 0.5 ? "surprised" : "smirk", turn }); crownOnCopy(c, t, out, 1); copyPencil(c, out);
  });
}
/* ======== S16 68.6-74.3 spills a whole glass over its head: thick arc, big splash, droplets, shake ======== */
const SPLASH = 71.04;
export function S16(c: Ctx, t: number) {
  const tilt = seg(t, 69.0, 69.6, easeIO) * 2.3, flow = seg(t, 69.45, 71.3, (x) => x), [sx, sy] = shakeXY(t, SPLASH, 26);
  view(c, paperBG(), { ...shot(t, [[70.6, { x: TH[0] + 40, y: TH[1] - 600, z: 1.8 }], [72.4, { x: TH[0] + 10, y: TH[1] - 580, z: 1.75 }], [74.3, { x: TH[0] - 20, y: TH[1] - 420, z: 1.9 }]]), sx, sy }, RIM_PAPER, () => {
    paperProps(c, t, { castle: 1, throne: 1 });
    const out = copyKing(c, t, { face: t < SPLASH ? "surprised" : "scared", turn: 1 }); crownOnCopy(c, t, out, 1); copyPencil(c, out);
    const ho = hero(c, base(t, t < 70 ? "grin" : "laugh", { legL: { a: 30, b: 0, lift: 200 }, legR: { a: 30, b: 0, lift: 200 }, armR: { a: 120 + tilt * 15, b: 40 }, handR: "hold", lookX: -0.6, lookY: 0.7 }), TH[0] + 120, TH[1] - 520, HP * 0.95);
    const rim: V2 = [ho.gloveR[0] - 30, ho.gloveR[1] + 20];
    drawGlass(c, ho.gloveR[0] + 10, ho.gloveR[1] + 60, 0.55, 0.85 * (1 - flow), -tilt, t);
    const head: V2 = [out.head[0], out.head[1] - out.headR * 0.6];
    if (flow > 0 && flow < 1) { c.save(); const N = 40; for (let pass = 0; pass < 2; pass++) for (let i = 0; i < N; i++) { const u = i / (N - 1), x = lerp(rim[0], head[0], u) - Math.sin(u * Math.PI) * 90, y = lerp(rim[1], head[1], u) - Math.sin(u * Math.PI) * 150 + u * u * 50; const w = (pass ? 12 : 34) * (1 - u * 0.3) * (0.85 + 0.15 * Math.sin(t * 30 + i));
      c.beginPath(); c.arc(x, y, w, 0, TAU); c.fillStyle = pass ? "rgba(230,248,255,0.85)" : "rgba(70,165,245,0.85)"; c.fill(); } c.restore(); }
    if (t > SPLASH - 0.3) { const d = t - (SPLASH - 0.3);
      if (d < 0.8) { c.save(); c.translate(head[0], head[1]); const k = clamp(d / 0.35); for (let i = 0; i < 9; i++) { const a = -Math.PI * (0.08 + 0.84 * i / 8); c.beginPath(); c.moveTo(Math.cos(a) * 30, Math.sin(a) * 20); c.quadraticCurveTo(Math.cos(a) * 120 * k, Math.sin(a) * 160 * k, Math.cos(a) * 160 * k, Math.sin(a) * 120 * k + 40 * k * k); c.lineWidth = 22 * (1 - d); c.strokeStyle = "rgba(70,165,245,0.85)"; c.lineCap = "round"; c.stroke(); } c.restore(); }
      for (let i = 0; i < 40; i++) { const a = -Math.PI * (0.05 + 0.9 * rnd(i)), v = 380 + rnd(i + 4) * 520, x = head[0] + Math.cos(a) * v * d, y = head[1] + Math.sin(a) * v * d + 1000 * d * d; if (y > TH[1] + 40 || d > 1.7) continue; c.beginPath(); c.ellipse(x, y, 13, 18, a, 0, TAU); c.fillStyle = "rgba(90,180,250,0.9)"; c.fill(); c.lineWidth = 3; c.strokeStyle = "rgba(20,80,160,0.9)"; c.stroke(); }
      c.save(); c.globalAlpha = 0.55; c.fillStyle = "rgba(90,180,250,0.6)"; c.beginPath(); c.ellipse(out.head[0], out.head[1], out.headR * 1.15, out.headR * 1.25, 0, 0, TAU); c.fill(); c.restore(); }
    if (t > SPLASH && t < SPLASH + 0.7) { const k = easeBack(seg(t, SPLASH, SPLASH + 0.25)); c.save(); c.translate(TH[0] - 40, TH[1] - 980); c.scale(k, k); c.font = "900 120px Inter"; c.textAlign = "center"; c.fillStyle = "#5ab4ff"; c.strokeStyle = INK; c.lineWidth = 16; c.strokeText("SPLASH!", 0, 0); c.fillText("SPLASH!", 0, 0); c.restore(); }
  });
}
/* ======== S17 74.3-79.4 the crown drips, the throne melts ======== */
export function S17(c: Ctx, t: number) {
  const hop = seg(t, 77.0, 77.6, easeIO);
  view(c, paperBG(), shot(t, [[75.9, { x: TH[0], y: TH[1] - 560, z: 2.6 }], [77.6, { x: TH[0] - 20, y: TH[1] - 440, z: 1.75 }], [79.4, { x: TH[0] + 60, y: TH[1] - 240, z: 2.0 }]]), RIM_PAPER, () => {
    paperProps(c, t, { castle: 1, throne: 1 });
    const out = copyKing(c, t, { face: "scared", turn: 1 - seg(t, 76, 76.5) }); crownOnCopy(c, t, out, 1);
    for (let i = 0; i < 6; i++) { const u = ((t * 0.8 + rnd(i)) % 1); c.fillStyle = "rgba(90,180,250,0.8)"; c.beginPath(); c.ellipse(out.head[0] + (rnd(i * 3) - 0.5) * out.headR * 2, out.head[1] + u * HP * 0.9, 7, 10, 0, 0, TAU); c.fill(); }
    const hx = lerp(TH[0] + 120, TH[0] + 230, hop), hy = lerp(TH[1] - 520, TH[1] + 80, hop) - Math.sin(hop * Math.PI) * 120;
    const ho = hero(c, hop < 1 ? base(t, "grin", { legL: { a: 30, b: 0, lift: 200 * (1 - hop) }, legR: { a: 30, b: 0, lift: 200 * (1 - hop) }, armR: { a: 40, b: 60 }, handR: "hold", lookX: -0.6, lookY: 0.5, grounded: hop >= 1 }) : stance(t, "laugh", { armR: { a: 40, b: 60 }, handR: "hold", lookX: -0.8 }), hx, hy, HP * lerp(0.95, 1, hop));
    drawGlass(c, ho.gloveR[0] + 10, ho.gloveR[1] + 60, 0.55, 0, -0.3, t);
  });
}
/* ======== S18 79.4-86.4 looks at its hands, shrugs, fades into a grey puddle ======== */
export function S18(c: Ctx, t: number) {
  const hands = t > 79.85 && t < 80.95, shrug = seg(t, 80.95, 81.3) * (1 - seg(t, 81.7, 82.0));
  view(c, paperBG(), shot(t, [[81.0, { x: TH[0] - 30, y: TH[1] - 420, z: 2.3 }], [83.6, { x: TH[0] + 30, y: TH[1] - 260, z: 1.8 }], [86.4, { x: TH[0] + 120, y: TH[1] - 200, z: 2.1 }]]), RIM_PAPER, () => {
    paperProps(c, t, { castle: 1, throne: 1 });
    const out = copyKing(c, t, { face: hands ? "surprised" : shrug > 0 ? "neutral" : "worried", hands, shrug }); crownOnCopy(c, t, out, 1);
    if (hands) for (const g of [out.gloveL, out.gloveR]) for (let i = 0; i < 3; i++) { const u = ((t * 1.5 + i / 3) % 1); c.fillStyle = "rgba(100,100,110,0.75)"; c.beginPath(); c.ellipse(g[0] + (i - 1) * 8, g[1] + 20 + u * 120, 5, 8, 0, 0, TAU); c.fill(); }
    gPuddle(c, TH[0], TH[1] + 30, 300, 70, clamp(meltThrone(t) + meltCopy(t) * 0.4), t);
    hero(c, stance(t, t < 82.5 ? "surprised" : "smile", { armR: { a: 30, b: 50 }, handR: "relaxed", lookX: -0.9, lookY: t > 82.5 ? 0.5 : 0 }), TH[0] + 260, TH[1] + 80, HP);
    if (t > 83.5) sparkles(c, TH[0], TH[1] + 10, t, 8, 160, 14, "#ffffff", 12, 0.6);
  });
}
/* ======== S19 86.4-90.4 next morning: picks up his pencil from the puddle and wipes it clean ======== */
const PUDDLE_D: V2 = [560, 1520];
export function S19(c: Ctx, t: number) {
  const pick = seg(t, 86.85, 87.3, easeIO), wipe = seg(t, 87.9, 88.9, (x) => x);
  view(c, deskBG(true), shot(t, [[88.2, { x: 700, y: 1300, z: 2.0 }], [90.4, { x: 760, y: 1260, z: 2.4 }]]), RIM_AM, () => {
    closedBook(c); gPuddle(c, PUDDLE_D[0], PUDDLE_D[1], 170, 40, 1, t);
    const pencilLying: V2 = [PUDDLE_D[0] + 60, PUDDLE_D[1] - 10];
    const ho = hero(c, stance(t, wipe > 0 ? "grin" : "smile", { ikR: pick < 1 ? toU(lerp(pencilLying[0] + 30, 760, pick), lerp(pencilLying[1] - 40, HERO_D[1] - 260, pick), 800, HERO_D[1], HH) : [120, 470], handR: "fist", armL: wipe > 0 && wipe < 1 ? { a: 60 + Math.sin(t * 16) * 20, b: 80 } : undefined, handL: "open", lean: pick < 0.5 ? -14 * (1 - pick) : 0, lookX: -0.4, lookY: pick < 1 ? 0.6 : 0 }), 800, HERO_D[1], HH);
    if (pick <= 0) { c.save(); c.translate(pencilLying[0], pencilLying[1]); c.rotate(-1.4); pencilAt(c, [0, 0], 300, 0, 1); c.restore(); }
    else pencilAt(c, [ho.gloveR[0] - 6, ho.gloveR[1] + 90], 300, 0.15, 1 - wipe);
    if (wipe > 0 && wipe < 1) sparkles(c, ho.gloveR[0], ho.gloveR[1] - 40, t, 6, 70, 12, "#ffffff", 13, 1);
  });
}
/* ======== S20 90.4-95.9 draws the sign above the desk: NO MORE COPIES (big close-up) ======== */
const SIGN: V2 = [380, 1000], BOOKTOP: V2 = [690, 1205];
export function S20(c: Ctx, t: number) {
  const bp = seg(t, 90.68, 92.3, (x) => x), tp = seg(t, 93.1, 94.0, (x) => x);
  view(c, deskBG(true), shot(t, [[93.1, { x: 470, y: 1080, z: 1.65 }], [95.9, { x: 440, y: 1050, z: 1.7 }]]), RIM_AM, () => {
    closedBook(c);
    const tip1 = gDraw(c, signBoard(SIGN[0], SIGN[1], 480, 190), { prog: bp, seed: 21 });
    const tip2 = tp > 0 ? gText(c, "NO MORE COPIES", SIGN[0], SIGN[1] + 4, 56, tp) : null;
    const tip = tp > 0 && tp < 1 ? tip2 : bp > 0 && bp < 1 ? tip1 : null;
    const hx = BOOKTOP[0], grip = tip ? gripFor(tip, 300, 0.6) : null;
    const ho = hero(c, stance(t, tp >= 1 ? "laugh" : "determined", { ikR: grip ? toU(grip[0], grip[1], hx, BOOKTOP[1], HH) : [130, 470], handR: "fist", lookX: -0.7, lookY: tip ? -0.8 : 0 }), hx, BOOKTOP[1], HH);
    heldDraw(c, t, ho.gloveR, 300, tip ? 0.6 : 0.15, tip);
  });
}
/* ======== S21 95.9-100 end ======== */
export function S21(c: Ctx, t: number) {
  view(c, deskBG(true), { x: 450, y: lerp(1060, 1020, seg(t, 95.9, 100)), z: lerp(1.75, 1.6, seg(t, 95.9, 100)) }, RIM_AM, () => {
    closedBook(c); gDraw(c, signBoard(SIGN[0], SIGN[1], 480, 190), { seed: 21 }); gText(c, "NO MORE COPIES", SIGN[0], SIGN[1] + 4, 56, 1);
    hero(c, stance(t, "grin", { armR: { a: 40, b: 128 }, handR: "thumb", lookX: 0 }), BOOKTOP[0], BOOKTOP[1], HH);
  });
}
void STAND_Y; void WH;
