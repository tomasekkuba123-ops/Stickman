// EP04 "What If Stickman Erased Gravity?" — 20 lines as 2D shots over the painted backgrounds + floating cut-outs.
import { Rig, POSES } from "../../style/stickman";
import { drawPencil, drawCow, drawShark, drawFish, waterBlob, drawSock, drawBed, drawPaintedMoon, smoke, puff, sparkles, glow, bird, sweatDrops, seg, lerp, clamp, easeIO, easeBack, rnd, INK, V2 } from "../../style/props2d";
import { stick, setLook } from "../ep03/engine2d";
import { VW, VH, Cam, clampC, applyC, drawImg, floatWorld, sprite, P, shake, IMG, K as BGK, setAfterPlate } from "./engine4";
// the ONE Moon: the painted Moon of BG_02 is repainted with the same moon used later in the sky
setAfterPlate((c, bg, t) => { if (bg === "bg2") drawPaintedMoon(c, 856, 470, 196, t); });

type Ctx = CanvasRenderingContext2D;
const TAU = Math.PI * 2;
const RIMS: Record<string, string> = { bg1: "255,226,160", bg2: "255,244,210", bg3: "255,170,210", bg4: "255,232,175" };
function scene(c: Ctx, bg: string, cam: Cam, fn: () => void) { setLook(RIMS[bg], true); const cc = clampC(bg, cam); c.save(); applyC(c, cc); fn(); c.restore(); return cc; }
const idle = (t: number, face: Rig["face"], x: Partial<Rig> = {}): Rig => ({ t: t * 30, view: "front", face, armL: { a: 10, b: 8 }, armR: { a: 10, b: 8 }, legL: { a: 3, b: 0 }, legR: { a: 3, b: 0 }, ...x } as Rig);
const sitting = (t: number, face: Rig["face"], x: Partial<Rig> = {}): Rig => idle(t, face, { legL: { a: 38, b: 0, lift: 235 }, legR: { a: 38, b: 0, lift: 235 }, ...x });
// zero-gravity float: feet off the ground, knees relaxed and bent, arms loose and drifting, hair + strings floating
const floating = (t: number, face: Rig["face"], x: Partial<Rig> = {}): Rig => { const s = Math.sin(t * 1.1), s2 = Math.sin(t * 0.8 + 1); return idle(t, face, { grounded: false, zeroG: 1, armL: { a: 48 + 14 * s, b: 38 + 10 * s2 }, armR: { a: 42 - 12 * s, b: 44 - 10 * s2 }, legL: { a: 22 + 8 * s2, b: 0, lift: 190 + 30 * s }, legR: { a: 12 - 6 * s2, b: 0, lift: 150 - 30 * s }, handL: "relaxed", handR: "relaxed", ...x }); };
// floating stamp: slow drift + gentle rotation (no contact shadow)
function fstick(c: Ctx, t: number, rig: Rig, x: number, y: number, h: number, anchor?: undefined, rot = 0) { return stick(c, rig, x + Math.sin(t * 0.42) * h * 0.03, y + Math.sin(t * 0.9) * h * 0.035, h, anchor, rot + Math.sin(t * 0.5) * 0.13); }
function cowSpr(c: Ctx, x: number, y: number, h: number, rot = 0, flip = false) { const im = IMG.cowk; if (!im) return; const w = h * im.width / im.height; c.save(); c.translate(x, y - h / 2); c.rotate(rot); if (flip) c.scale(-1, 1); c.drawImage(im, -w / 2, -h / 2, w, h); c.restore(); }
const superman = (t: number, face: Rig["face"] = "laugh"): Rig => ({ t: t * 30, view: "side", face, lean: 0, armR: { a: 175, b: 0 }, armL: { a: 150, b: 10 }, handR: "fist", handL: "fist", legR: { a: -20, b: 10, f: -30 }, legL: { a: -34, b: 20, f: -40 }, grounded: false } as Rig);
// pencil held in a glove; eraserDown flips it (eraser toward the page)
function heldPencil(c: Ctx, g: V2, len: number, ang: number, flip = 0, gleam = 0) { if (flip < 0.5) drawPencil(c, g[0] + Math.sin(ang) * len * 0.3, g[1] + len * 0.3, len, ang, gleam); else drawPencil(c, g[0] - Math.sin(ang) * len * 0.75, g[1] - len * 0.75, len, Math.PI + ang, gleam); }
function glowText(c: Ctx, txt: string, x: number, y: number, size: number, prog: number, t: number, col = "rgba(140,250,255,1)") {
  c.save(); c.font = `900 ${size}px Inter, Arial`; c.textAlign = "left"; c.textBaseline = "middle"; const w = c.measureText(txt).width, x0 = x - w / 2;
  c.beginPath(); c.rect(x0 - 20, y - size, (w + 40) * clamp(prog), size * 2); c.clip();
  c.lineJoin = "round"; c.lineWidth = size * 0.16; c.strokeStyle = col.replace(/[\d.]+\)$/, "0.35)"); c.strokeText(txt, x0, y); c.lineWidth = size * 0.06; c.strokeStyle = col; c.strokeText(txt, x0, y); c.fillStyle = "rgba(255,255,255,0.95)"; c.fillText(txt, x0, y);
  c.restore(); return [x0 + w * clamp(prog), y] as V2;
}

/* ===== L1 0-3.85 HOOK: upside-down flight among floating houses, cars and a cow ===== */
export function A(c: Ctx, t: number) {
  scene(c, "bg3", { x: 540, y: 820 - t * 30, z: 1.0 }, () => {
    floatWorld(c, "bg3", t);
    const x = lerp(260, 760, seg(t, 0, 3.8, (u) => u)), y = 1000 + Math.sin(t * 2) * 40;
    fstick(c, t, floating(t, "laugh", { armL: { a: 150, b: 0 }, armR: { a: 150, b: 0 }, handL: "open", handR: "open" }), x, y + 280, 460, undefined, Math.PI + Math.sin(t * 1.2) * 0.25);
    sparkles(c, x, y, t, 8, 160, 16, "#fff6c0", 2);
  });
}
/* ===== L2 3.85-12.7 the eraser: rubbing out GRAVITY ===== */
const SIT: V2 = [300, 1440], SITH = 560;
function notebook(c: Ctx, cx: number, cy: number, w: number, erased: number, rot = 0, blank = false) {
  c.save(); c.translate(cx, cy); c.rotate(rot); const h = w * 0.72;
  c.beginPath(); c.roundRect(-w / 2, -h / 2, w, h, 10); c.fillStyle = "#fffdf4"; c.fill(); c.lineWidth = Math.max(4, w * 0.012); c.strokeStyle = INK; c.stroke();
  c.strokeStyle = "rgba(90,140,220,0.3)"; c.lineWidth = Math.max(1.5, w * 0.004); for (let y = -h / 2 + h * 0.12; y < h / 2; y += h * 0.1) { c.beginPath(); c.moveTo(-w / 2 + 8, y); c.lineTo(w / 2 - 8, y); c.stroke(); }
  c.strokeStyle = "rgba(230,60,80,0.45)"; c.beginPath(); c.moveTo(-w * 0.36, -h / 2); c.lineTo(-w * 0.36, h / 2); c.stroke();
  c.fillStyle = "rgba(60,60,90,0.55)"; for (let i = 0; i < 5; i++) if (i !== 2) c.fillRect(-w * 0.3, -h / 2 + h * (0.17 + i * 0.16), w * (0.4 + rnd(i) * 0.3), Math.max(2, w * 0.012));
  if (!blank) { const word = "GRAVITY", n = Math.floor(clamp(erased) * 7 + 1e-6); c.font = `900 ${w * 0.15}px "Comic Sans MS", Inter, Arial`; c.textAlign = "left"; c.textBaseline = "middle"; c.fillStyle = "#3a3a52"; const fw = c.measureText(word).width; let x = -fw / 2;
    for (let i = 0; i < 7; i++) { const lw = c.measureText(word[i]).width; c.globalAlpha = i < n ? 0.06 : i === n ? 1 - (clamp(erased) * 7 - n) : 1; c.fillText(word[i], x, h * 0.02); x += lw; } c.globalAlpha = 1; }
  c.restore();
}
export function B(c: Ctx, t: number) {
  const flip = seg(t, 4.96, 5.35, easeIO);
  if (t < 6.1) {
    scene(c, "bg1", { x: 420, y: 1130, z: 1.25 }, () => { drawImg(c, "bg1", "bg1");
      const out = stick(c, sitting(t, "smile", { ikR: [150, 420], ikL: [-120, 400], handR: "fist", handL: "hold", lookY: 0.6 }), ...SIT, SITH);
      notebook(c, (out.gloveR[0] + out.gloveL[0]) / 2 - 10, (out.gloveR[1] + out.gloveL[1]) / 2 + 30, 190, 0, -0.32);
      heldPencil(c, out.gloveR, 150, -0.6 + flip * 0.2, flip, flip > 0.9 && flip < 1 ? 1 : 0); });
  } else if (t < 9.6) {
    // insert: the eraser rubs the word out letter by letter
    const im = IMG.bg1; if (im) { c.save(); c.filter = "blur(16px)"; c.drawImage(im, -380, -700, im.width * BGK.bg1 * 1.9, im.height * BGK.bg1 * 1.9); c.restore(); c.fillStyle = "rgba(255,230,190,0.12)"; c.fillRect(0, 0, VW, VH); }
    c.fillStyle = "#e2262c"; c.beginPath(); c.ellipse(VW / 2, VH * 1.05, VW * 0.8, VH * 0.2, 0, 0, TAU); c.fill(); c.lineWidth = 10; c.strokeStyle = INK; c.stroke(); // red hoodie lap
    const er = seg(t, 6.28, 9.0, (u) => u); const W = 900;
    notebook(c, VW / 2, VH * 0.42, W, er, -0.04);
    const ex = VW / 2 - W * 0.31 + W * 0.62 * er + Math.sin(t * 30) * 18, ey = VH * 0.42 + Math.cos(t * 26) * 10;
    drawPencil(c, ex + 40, ey - 650, 620, Math.PI + 0.12); // tip up, eraser end rubbing the page
    for (let i = 0; i < 10; i++) { const u = ((t * 2 + rnd(i)) % 1); c.fillStyle = i % 2 ? "#ff9fb8" : "#b8bccb"; c.beginPath(); c.ellipse(ex + (rnd(i * 5) - 0.5) * 200 * u, ey + 60 + u * 260 + Math.sin(u * 9 + i) * 20, 8, 5, i, 0, TAU); c.fill(); }
  } else {
    scene(c, "bg1", { x: 380, y: 1100, z: lerp(1.4, 1.6, seg(t, 9.6, 12.7)) }, () => { drawImg(c, "bg1", "bg1");
      const show = seg(t, 9.7, 10.1, easeBack);
      const out = stick(c, sitting(t, show > 0.5 ? "grin" : "smile", { ikR: [lerp(150, 190, show), lerp(420, 440, show)], ikL: [lerp(-120, -170, show), lerp(400, 430, show)], handR: "hold", handL: "hold", lookX: 0, lookY: 0.4 }), ...SIT, SITH);
      notebook(c, (out.gloveR[0] + out.gloveL[0]) / 2, (out.gloveR[1] + out.gloveL[1]) / 2 + 40, lerp(190, 230, show), 1, lerp(-0.32, -0.22, show)); });
  }
}
/* ===== L3 12.7-16.4 for a second, nothing happened (a bird stops mid-air) ===== */
export function C(c: Ctx, t: number) {
  if (t < 14.5) scene(c, "bg1", { x: 520, y: 960, z: 1.0 }, () => { drawImg(c, "bg1", "bg1");
    const stop = 13.25, bt = Math.min(t, stop), bx = 300 + (bt - 12.7) * 360, by = 520 + Math.sin(bt * 3) * 20;
    bird(c, bx, by, 3, t < stop ? t : stop + 0.02); if (t > stop) { c.save(); c.font = "900 60px Inter"; c.fillStyle = "#fff"; c.strokeStyle = INK; c.lineWidth = 8; c.strokeText("?", bx + 40, by - 60); c.fillText("?", bx + 40, by - 60); c.restore(); }
    stick(c, sitting(t, "neutral", { lookX: Math.sin(t * 2.2), lookY: -0.3, ikR: [120, 330], ikL: [-130, 300], handR: "fist", handL: "hold" }), ...SIT, SITH); });
  else scene(c, "bg1", { x: 330, y: 1060, z: 1.85 }, () => { drawImg(c, "bg1", "bg1");
    stick(c, sitting(t, "neutral", { lookX: t < 15.2 ? -0.9 : 0.9, blink: (t > 14.9 && t < 15.05) || (t > 15.9 && t < 16.05) ? 1 : 0, ikR: [120, 330], ikL: [-130, 300], handR: "fist", handL: "hold" }), ...SIT, SITH); });
}
/* ===== L4 16.4-20.3 the sock floats off the floor ===== */
const SOCK0: V2 = [520, 1450];
export function D(c: Ctx, t: number) {
  const up = seg(t, 17.15, 20.3, (u) => u), sx = SOCK0[0] + Math.sin(up * 4) * 40 + up * 60, sy = SOCK0[1] - up * 700;
  scene(c, "bg1", { x: 420, y: lerp(1200, 900, seg(t, 17.6, 20.3, easeIO)), z: 1.45 }, () => { drawImg(c, "bg1", "bg1");
    stick(c, sitting(t, t < 17.3 ? "neutral" : "surprised", { lookX: 0.8, lookY: lerp(0.4, -1, up), ikR: [120, 330], ikL: [-130, 300], handR: "fist", handL: "hold" }), ...SIT, SITH);
    drawSock(c, sx, sy, 1.2, up * 2.4 + Math.sin(t * 2) * 0.2); if (up > 0) sparkles(c, sx, sy, t, 4, 60, 8, "#ffffff", 3, 0.6); });
}
/* ===== L5 20.3-22.85 the bed floats up behind the window and bonks the ceiling ===== */
export function E(c: Ctx, t: number) {
  const win = [P("bg1", 150, 370), P("bg1", 235, 452)] as [V2, V2];
  scene(c, "bg1", { x: (win[0][0] + win[1][0]) / 2 + 30, y: (win[0][1] + win[1][1]) / 2 + 60, z: 2.3 }, () => { drawImg(c, "bg1", "bg1");
    c.save(); c.beginPath(); c.rect(win[0][0] + 4, win[0][1] + 4, win[1][0] - win[0][0] - 8, win[1][1] - win[0][1] - 8); c.clip();
    c.fillStyle = "rgba(255,230,180,0.85)"; c.fillRect(win[0][0], win[0][1], 200, 200);
    const rise = seg(t, 20.45, 20.9, (u) => u * u), bonk = t > 20.9 ? Math.exp(-(t - 20.9) * 6) * Math.sin((t - 20.9) * 30) * 6 : 0;
    drawBed(c, (win[0][0] + win[1][0]) / 2, lerp(win[1][1] + 60, win[0][1] + 40, rise) + bonk, 110, Math.sin(t * 2) * 0.06);
    c.restore();
    if (t > 20.9 && t < 21.6) { c.save(); c.font = "900 46px Inter"; c.fillStyle = "#ffd23a"; c.strokeStyle = INK; c.lineWidth = 8; c.strokeText("BONK", win[1][0] + 6, win[0][1] - 4); c.fillText("BONK", win[1][0] + 6, win[0][1] - 4); c.restore(); } });
}
/* ===== L6 22.85-28.3 the whole house lifts off its foundations ===== */
export function F(c: Ctx, t: number) {
  const lift = seg(t, 23.9, 27.4, easeIO), mixK = seg(t, 23.9, 24.6), rumble = t < 24.6 ? 1 : 0.4;
  const cam: Cam = { x: 470, y: 1000 - lift * 80, z: 1.0 };
  scene(c, "bg1", cam, () => {
    drawImg(c, "bg1", "bg1");
    if (mixK > 0) { c.save(); c.globalAlpha = mixK; c.translate(0, (1 - lift) * 220); drawImg(c, "bg2", "bg2"); c.restore(); }
    // dust + clods along the foundations
    smoke(c, 300, 900, t, 14, 700, 160, 60, rumble * (1 - lift * 0.8), 4, "#d8c8b0");
    for (let i = 0; i < 10; i++) { const u = ((t * 0.8 + rnd(i)) % 1); c.fillStyle = "#8a5a32"; c.beginPath(); c.arc(80 + rnd(i * 3) * 380, 860 + u * 300, 6 + rnd(i) * 8, 0, TAU); c.fill(); c.lineWidth = 3; c.strokeStyle = INK; c.stroke(); }
    const fy = lerp(SIT[1], SIT[1] - 260, seg(t, 24.2, 27.8, easeIO));
    fstick(c, t, floating(t, t < 23.9 ? "surprised" : "laugh", { lookY: -0.6, lookX: -0.5 }), SIT[0] + 40, fy, SITH);
  });
}
/* ===== L7 28.3-33.6 cars drift down the street like balloons ===== */
export function G(c: Ctx, t: number) {
  scene(c, "bg2", { x: lerp(700, 780, seg(t, 28.3, 33.6)), y: 760, z: 1.45 }, () => {
    floatWorld(c, "bg2", t, (n) => (n.includes("car") ? { spin: n.includes("red") ? 0.18 : -0.22, dx: (t - 28.3) * (n.includes("red") ? 22 : -14), amp: 1.5 } : {}));
    fstick(c, t, floating(t, "surprised", { lookX: 1, lookY: -0.3 }), 640, 1080, 420);
  });
}
/* ===== L8 33.6-39.4 a cow floats past the window, still chewing ===== */
export function H(c: Ctx, t: number) {
  const cx = lerp(820, -200, seg(t, 33.7, 38.6, (u) => u)), cy = 520 + Math.sin(t * 1.2) * 20;
  scene(c, "bg2", { x: 300, y: 560, z: 1.85 }, () => {
    floatWorld(c, "bg2", t, (n) => (n === "bg2_house" ? { amp: 0.4 } : {}));
    cowSpr(c, cx, cy + 120, 190, Math.sin(t * 0.8) * 0.12); c.save(); c.strokeStyle = "#3fbf4a"; c.lineWidth = 6; c.lineCap = "round"; c.beginPath(); const mx = cx + 70, my = cy + 10 + Math.sin(t * 9) * 4; c.moveTo(mx, my); c.lineTo(mx + 34, my + 22 + Math.sin(t * 9) * 6); c.moveTo(mx, my); c.lineTo(mx + 30, my - 6); c.stroke(); c.restore();
    const take = seg(t, 34.6, 34.8);
    fstick(c, t, floating(t, take > 0 ? "surprised" : "smile", { lookX: lerp(1, -1, seg(t, 35, 37.5)), squash: take > 0 && t < 35.1 ? 0.06 : 0 }), 470, 900, 300);
  });
}
/* ===== L9 39.4-45.6 laughs, kicks off the porch roof (ceiling) and flies with a big loop ===== */
const ROOF_UNDER: V2 = [260, 560]; // underside of the floating porch roof in BG_02 (world px)
function flyPath(u: number): [V2, number] { // u 0..1 over 40.75-45.6 ; returns position (body centre) + heading (rad, screen)
  const pts = (k: number): V2 => { if (k < 0.3) { const q = k / 0.3; return [lerp(ROOF_UNDER[0], 560, q), lerp(ROOF_UNDER[1] + 260, 1250, q * q * 0.6 + q * 0.4)]; }
    if (k < 0.8) { const q = (k - 0.3) / 0.5, a = Math.PI / 2 - q * TAU; return [560 + Math.cos(a) * 340 + q * 120, 910 + Math.sin(a) * 340]; } // loop centre (560,910) r 340
    const q = (k - 0.8) / 0.2; return [lerp(680, 1100, q), lerp(1250, 700, q)]; };
  const p = pts(u), p2 = pts(Math.min(1, u + 0.01)), p0 = pts(Math.max(0, u - 0.01)); return [p, Math.atan2(p2[0] - p0[0], -(p2[1] - p0[1]))];
}
export function I(c: Ctx, t: number) {
  const kick = seg(t, 40.45, 40.75, easeIO), u = seg(t, 40.75, 45.6, (x) => x);
  if (t < 40.75) scene(c, "bg2", { x: 330, y: 800, z: 1.5 }, () => { floatWorld(c, "bg2", t, (n) => (n === "bg2_house" ? { still: true } : {}));
      // hanging upside down with his feet planted on the porch roof underside, crouch -> push
      const crouch = seg(t, 40.0, 40.45, easeIO) * (1 - kick);
      stick(c, { ...floating(t, "laugh"), legL: { a: 6, b: 0, lift: 60 + 220 * crouch }, legR: { a: 6, b: 0, lift: 60 + 220 * crouch }, armL: { a: 30, b: 30 }, armR: { a: 30, b: 30 }, squash: -0.1 * crouch + 0.08 * kick } as Rig, ROOF_UNDER[0], ROOF_UNDER[1] + 60, 400, undefined, Math.PI);
      if (kick > 0) puff(c, ROOF_UNDER[0], ROOF_UNDER[1] + 10, kick, 90, "#ffffff"); });
  else scene(c, "bg2", { x: 540, y: 960, z: 1.0 }, () => { floatWorld(c, "bg2", t);
      // speed trail along the path
      for (let k = 1; k <= 14; k++) { const [q] = flyPath(Math.max(0, u - k * 0.012)); c.globalAlpha = 0.55 * (1 - k / 15); c.fillStyle = "#ffffff"; c.beginPath(); c.arc(q[0], q[1], 22 - k, 0, TAU); c.fill(); } c.globalAlpha = 1;
      const [p, head] = flyPath(u); stick(c, { ...superman(t, u > 0.3 && u < 0.8 ? "laugh" : "grin"), zeroG: 1 } as Rig, p[0], p[1] + 230, 460, undefined, head);
      if (u > 0.3 && u < 0.8) sparkles(c, 560, 950, t, 10, 320, 18, "#fff6c0", 11, 0.8); });
}
/* ===== L10 45.6-48.9 the ocean rises too ===== */
const RIVER: V2 = P("bg3", 640, 1310);
function risingWater(c: Ctx, t: number, k: number) {
  for (let i = 0; i < 7; i++) { const u = ((t * 0.18 + i / 7) % 1) * k; const x = RIVER[0] - 260 + i * 90 + Math.sin(t + i) * 30, y = RIVER[1] - u * 1300; if (u <= 0) continue;
    waterBlob(c, x, y, 34 + u * 70, 26 + u * 50, t, i + 5, () => { if (i % 2) drawFish(c, x + Math.sin(t * 1.5 + i) * 20, y, 40, { t, confused: true, flip: i % 3 === 0 }); }); }
  c.save(); c.globalAlpha = 0.85 * k; c.beginPath(); c.moveTo(RIVER[0] - 300, RIVER[1] + 30); for (let i = 0; i <= 12; i++) { const x = RIVER[0] - 300 + i * 50; c.lineTo(x, RIVER[1] - 40 * k - Math.sin(t * 4 + i) * 16 * k - (i > 4 && i < 9 ? 120 * k : 0)); } c.lineTo(RIVER[0] + 300, RIVER[1] + 30); c.closePath(); c.fillStyle = "rgba(60,170,240,0.85)"; c.fill(); c.lineWidth = 5; c.strokeStyle = "rgba(20,80,160,0.9)"; c.stroke(); c.restore();
}
export function J(c: Ctx, t: number) {
  const tilt = seg(t, 45.6, 47.6, easeIO);
  scene(c, "bg3", { x: 620, y: lerp(900, 1420, tilt), z: 1.0 }, () => {
    floatWorld(c, "bg3", t);
    risingWater(c, t, seg(t, 46.2, 48.9));
    const hx = lerp(380, 560, tilt), hy = lerp(820, 1080, tilt);
    stick(c, superman(t, t > 46.4 ? "surprised" : "laugh"), hx, hy + 190, 360, undefined, -1.2);
  });
}
/* ===== L11 48.9-56.7 giant wobbling blobs full of confused fish ===== */
export function K(c: Ctx, t: number) {
  const pan = seg(t, 48.9, 56.7, (u) => u);
  scene(c, "bg3", { x: lerp(560, 420, pan), y: lerp(1300, 520, pan), z: lerp(1.1, 1.25, pan) }, () => {
    floatWorld(c, "bg3", t, (n) => (n.includes("blob") || n.includes("bubble") || n.includes("fish") ? { amp: 1.8 } : {}));
    const blobs: [number, number, number, number, number][] = [[300, 1500, 230, 170, 0], [780, 1180, 260, 190, 1], [380, 820, 210, 160, 2], [760, 560, 200, 150, 3]];
    for (const [x, y, rx, ry, i] of blobs) { const bx = x + Math.sin(t * 0.5 + i) * 60, by = y - (t - 48.9) * 30;
      waterBlob(c, bx, by, rx, ry, t, i * 7, () => { for (let f = 0; f < 3; f++) drawFish(c, bx + Math.sin(t * (0.8 + f * 0.3) + f * 2 + i) * rx * 0.5, by + (f - 1) * ry * 0.35, 70, { t: t + f, col: ["#ff8a2a", "#ffd23a", "#5ad0ff"][f], confused: t > 52.4, flip: Math.cos(t * (0.8 + f * 0.3) + f * 2 + i) > 0 }); }); }
    const hy = lerp(1350, 620, pan) + Math.sin(t * 1.3) * 30;
    fstick(c, t, floating(t, t > 52.0 ? "laugh" : "surprised", { lookX: Math.sin(t * 0.9) }), 560, hy + 180, 360);
  });
}
/* ===== L12 56.7-62.6 the Moon gets closer. Much closer. ===== */
export function L(c: Ctx, t: number) {
  const slide = seg(t, 56.9, 58.4, easeIO), closer = seg(t, 58.6, 60.6, easeIO);
  const mr = lerp(150, 250, slide) + closer * 140, my = lerp(-200, 470, slide) + closer * 20, mx = lerp(780, 680, slide);
  scene(c, "bg3", { x: 540, y: 980, z: 1.0 }, () => {
    floatWorld(c, "bg3", t);
    c.save(); c.globalAlpha = 0.25 * (slide + closer); c.fillStyle = "#1a1040"; c.fillRect(0, 0, 1080, 2100); c.restore();
    drawPaintedMoon(c, mx, my, mr, t);
    const pale = closer;
    const out = fstick(c, t, floating(t, closer > 0.2 ? "scared" : "surprised", { lookY: -1, armL: { a: 40, b: 70 }, armR: { a: 40, b: 70 } }), 540, 1700, 520);
    if (pale > 0) { c.save(); c.globalAlpha = 0.25 * pale; c.fillStyle = "#e8f0ff"; c.beginPath(); c.arc(out.head[0], out.head[1], out.headR, 0, TAU); c.fill(); c.restore(); sweatDrops(c, out.head[0], out.head[1], out.headR, t, pale); }
  });
}
/* ===== L13 62.6-67.2 panics, flips the pencil and writes G-R ===== */
const SKYPOS: V2 = [430, 1300];
function skyBack(c: Ctx, t: number) { floatWorld(c, "bg3", t); c.save(); c.globalAlpha = 0.3; c.fillStyle = "#1a1040"; c.fillRect(0, 0, 1080, 2100); c.restore(); drawPaintedMoon(c, 700, 700, 300 + (t - 62.6) * 2.5, t); }
export function M(c: Ctx, t: number) {
  const flip = seg(t, 63.7, 64.0, easeIO), wr = seg(t, 64.05, 64.8, (u) => u);
  scene(c, "bg3", { x: 560, y: 1080, z: 1.25 }, () => { skyBack(c, t);
    const tip = wr > 0 ? glowText(c, "GR", SKYPOS[0] + 360, SKYPOS[1] - 360, 170, wr, t) : null;
    const h = 480, feetY = SKYPOS[1] + 160;
    const rig = floating(t, t < 63.6 ? "scared" : "determined", { lookX: 0.8, handR: "fist", armR: undefined, ikR: tip ? [(tip[0] - SKYPOS[0]) * 1000 / h - 40, (feetY - tip[1]) * 1000 / h - 80] : [140, 620] });
    const out = stick(c, rig, SKYPOS[0], feetY, h);
    if (t < 63.6) sweatDrops(c, out.head[0], out.head[1], out.headR, t, 1);
    heldPencil(c, out.gloveR, 170, 0.5, 1 - flip); });
}
/* ===== L14 67.2-71.0 the pencil floats out of his hand ===== */
export function N(c: Ctx, t: number) {
  const slip = seg(t, 67.8, 71.0, (u) => u), reach = seg(t, 68.2, 68.6, easeBack);
  scene(c, "bg3", { x: 560, y: 1080, z: 1.25 }, () => { skyBack(c, t);
    glowText(c, "GR", SKYPOS[0] + 360, SKYPOS[1] - 360, 170, 1, t);
    const h = 480, feetY = SKYPOS[1] + 160;
    const out = fstick(c, t, floating(t, t < 67.8 ? "determined" : t < 68.7 ? "surprised" : "scared", { lookX: 1, lookY: -0.6, handR: t < 67.8 ? "fist" : "open", armR: t < 67.8 ? { a: 120, b: 30 } : { a: lerp(120, 165, reach), b: 0 } }), SKYPOS[0], feetY, h);
    if (t < 67.8) heldPencil(c, out.gloveR, 170, 0.5); else { const px = out.gloveR[0] + 60 + slip * 520, py = out.gloveR[1] - 40 - slip * 420 + Math.sin(slip * 9) * 30; drawPencil(c, px, py, 170, (t - 67.8) * 5); sparkles(c, px, py - 60, t, 4, 50, 10, "#ffffff", 5, 0.6); } });
}
/* ===== L15 71.0-75.0 swims after it, past a shark in a water bubble ===== */
export function O(c: Ctx, t: number) {
  const sw = seg(t, 71.0, 75.0, (u) => u), stroke = Math.sin(t * 7);
  scene(c, "bg3", { x: 540, y: 1000, z: 1.0 }, () => { skyBack(c, t);
    const bx = 700, by = 1000; const look = seg(t, 73.3, 73.9);
    waterBlob(c, bx, by, 300, 210, t, 9, () => { drawShark(c, bx + Math.sin(t * 0.8) * 30, by + 10, 380, { t, mood: "smile", flip: look > 0.5, look }); for (let f = 0; f < 3; f++) drawFish(c, bx - 150 + f * 120, by + 140 - f * 30, 50, { t: t + f, col: "#ffd23a", flip: f % 2 === 0 }); });
    // breaststroke (1.15 s cycle): glide -> arms sweep out/back -> hands to chest -> shoot forward while the legs frog-kick
    const ph = ((t - 71.0) / 1.15) % 1, pull = ph < 0.35 ? ph / 0.35 : 0, rec = ph >= 0.35 && ph < 0.55 ? (ph - 0.35) / 0.2 : 0, ext = ph >= 0.55 && ph < 0.75 ? (ph - 0.55) / 0.2 : 0;
    const armA = ph < 0.35 ? lerp(178, 95, pull) : ph < 0.55 ? lerp(95, 40, rec) : ph < 0.75 ? lerp(40, 178, ext) : 178, armB = ph < 0.35 ? lerp(0, 25, pull) : ph < 0.55 ? lerp(25, 120, rec) : ph < 0.75 ? lerp(120, 0, ext) : 0;
    const kick = ph >= 0.4 && ph < 0.6 ? (ph - 0.4) / 0.2 : 0, snap = ph >= 0.6 && ph < 0.8 ? (ph - 0.6) / 0.2 : 0;
    const legA = kick > 0 ? lerp(-10, 55, kick) : snap > 0 ? lerp(55, -12, snap) : -12, legB = kick > 0 ? lerp(5, 120, kick) : snap > 0 ? lerp(120, 0, snap) : 0;
    const surge = (ph >= 0.6 ? (ph - 0.6) / 0.4 : 0) * 0.5 + Math.floor((t - 71.0) / 1.15) + (ph < 0.6 ? ph * 0.5 / 0.6 : 0.5);
    const hx = 300 + surge * 200, hy = 1330 - Math.sin(clamp(hx / 1000) * Math.PI) * 120;
    stick(c, { t: t * 30, view: "side", face: "determined", zeroG: 1, armR: { a: armA, b: armB }, armL: { a: armA - 6, b: armB + 6 }, handR: "open", handL: "open", legR: { a: legA, b: legB, f: -40 }, legL: { a: legA - 4, b: legB + 6, f: -40 }, grounded: false } as Rig, hx, hy + 220, 440, undefined, Math.PI / 2 - 0.12 + Math.sin(ph * TAU) * 0.05);
    drawPencil(c, 1000 + Math.sin(t) * 20, 760, 150, t * 2); });
}
/* ===== L16 75.0-81.4 grabs it and writes one big word across the sky ===== */
export function Pq(c: Ctx, t: number) {
  const wr = seg(t, 76.1, 77.9, (u) => u), pulse = t > 77.9 ? 0.5 + 0.5 * Math.sin((t - 77.9) * 5) : 0;
  const back = seg(t, 77.9, 79.5, easeIO);
  scene(c, "bg3", { x: 540, y: lerp(1050, 1000, back), z: lerp(1.2, 1.0, back) }, () => { skyBack(c, t);
    const tip = glowText(c, "GRAVITY", 540, 1050, 150, wr, t, `rgba(255,${200 + pulse * 55},${120 + pulse * 100},1)`);
    if (pulse > 0) glow(c, 540, 1050, 600, "rgba(255,230,150,1)", 0.25 + 0.2 * pulse);
    const h = 440, hx = wr > 0 && wr < 1 ? tip[0] - 120 : t < 76.1 ? 820 : 760, feetY = 1520;
    const grab = t >= 75.12;
    const out = fstick(c, t, floating(t, wr >= 1 ? "laugh" : "determined", { handR: "fist", armR: undefined, ikR: wr > 0 && wr < 1 ? [(tip[0] - hx) * 1000 / h, (feetY - tip[1]) * 1000 / h - 120] : [140, 640], lookY: -0.5 }), hx, feetY, h);
    if (grab) heldPencil(c, out.gloveR, 160, 0.3, 0, t < 75.5 ? 1 : 0); else drawPencil(c, out.gloveR[0] + 60, out.gloveR[1] - 40, 160, t * 3); });
}
/* ===== L17 81.4-85.9 EVERYTHING SLAMS BACK DOWN (the one camera shake) ===== */
const SLAM = 81.84;
const ROOF_HERO: V2 = [330, 1660], SHARK: V2 = [720, 1610];
function heroOnRoof(c: Ctx, t: number, face: Rig["face"], x: Partial<Rig> = {}) { return stick(c, sitting(t, face, { ikL: [-170, 300], ikR: [170, 300], handL: "open", handR: "open", ...x }), ...ROOF_HERO, 520); }
export function Q(c: Ctx, t: number) {
  const imp = t >= SLAM ? Math.exp(-(t - SLAM) * 7) : 0, [sx, sy] = shake(t, t >= SLAM && t < SLAM + 0.55 ? 34 * imp : 0, 43);
  scene(c, "bg4", { x: 540, y: 960, z: 1.0, sx, sy }, () => {
    drawImg(c, "bg4", "bg4");
    if (t < SLAM) { const f = seg(t, 81.4, SLAM, (u) => u * u);
      cowSpr(c, 560, lerp(-200, 1010, f), 220, Math.sin(t * 9) * 0.2);
      stick(c, { ...floating(t, "scared"), armL: { a: 160, b: 10 }, armR: { a: 160, b: 10 }, handL: "open", handR: "open" } as Rig, ROOF_HERO[0], lerp(-300, ROOF_HERO[1], f), 520, undefined, Math.sin(t * 14) * 0.3);
      c.save(); c.globalAlpha = 0.6; c.fillStyle = "#fff"; for (const x of [200, 520, 840]) for (let i = 0; i < 5; i++) c.fillRect(x + i * 22 - 50, lerp(-300, 1200, f) - i * 90, 6, 140); c.restore(); }
    else { smoke(c, 540, 1000, t - SLAM, 26, 1100, 500, 110, 1 - seg(t, SLAM + 0.3, 85), 8, "#e8e0d0");
      for (let i = 0; i < 14; i++) { const d = t - SLAM, a = i * 0.45 + 0.2, v = 700 + rnd(i) * 500; const x = 540 + Math.cos(a) * v * d * 0.8, y = 1000 - Math.abs(Math.sin(a)) * v * d + 1400 * d * d; if (y > 1900) continue; waterBlob(c, x, y, 16, 12, t, i); }
      cowSpr(c, 560, 1010 - Math.abs(Math.sin((t - SLAM) * 10)) * 40 * imp, 220);
      const land = t < SLAM + 0.35 ? Math.exp(-(t - SLAM) * 8) : 0;
      heroOnRoof(c, t, t < 83.2 ? "scared" : "surprised", { squash: -0.14 * land, lookY: t > 83.2 ? -0.6 : 0 });
      puff(c, ROOF_HERO[0], ROOF_HERO[1], seg(t, SLAM, SLAM + 0.9, (u) => u), 150, "#f0d8c8"); }
  });
  if (t >= SLAM && t < SLAM + 0.25) { c.fillStyle = `rgba(255,255,255,${1 - (t - SLAM) / 0.25})`; c.fillRect(0, 0, VW, VH); }
}
/* ===== L18 85.9-90.4 the house. the cars. the cow. (wide, Stickman on the roof in front) ===== */
export function R(c: Ctx, t: number) {
  const drop = (t0: number, from: number) => (t < t0 ? from * (1 - seg(t, t0 - 0.38, t0, (u) => u * u)) : -Math.abs(Math.sin((t - t0) * 9)) * 60 * Math.exp(-(t - t0) * 4));
  const hit = (t0: number) => (t >= t0 && t < t0 + 0.3 ? Math.exp(-(t - t0) * 12) : 0);
  const zx = t < 86.9 ? 600 : t < 87.9 ? 470 : 540, z = 1.15 + 0.06 * (hit(85.98) + hit(86.97) + hit(88.0));
  scene(c, "bg4", { x: zx, y: 1085, z }, () => {
    drawImg(c, "bg4p", "bg4");
    sprite(c, "bg4_house", t, { still: true, dy: t < 85.6 ? -1400 : drop(85.98, -1400) });
    for (const n of ["bg4_redcar", "bg4_bluecar"]) sprite(c, n, t, { still: true, dy: t < 86.6 ? -900 : drop(86.97 + (n.includes("blue") ? 0.08 : 0), -900) });
    if (t > 85.98) puff(c, 970, 1070, seg(t, 85.98, 86.9, (u) => u), 180, "#e8e0d0");
    if (t > 86.97) { puff(c, 390, 900, seg(t, 86.97, 87.8, (u) => u), 140, "#e8e0d0"); puff(c, 750, 760, seg(t, 87.05, 87.8, (u) => u), 100, "#e8e0d0"); }
    const f = seg(t, 87.6, 88.0, (u) => u * u); if (t > 87.6) { cowSpr(c, 560, lerp(200, 1010, f) - (t > 88 ? Math.abs(Math.sin((t - 88) * 10)) * 30 * Math.exp(-(t - 88) * 6) : 0), 220); if (t > 88.0) puff(c, 560, 1020, seg(t, 88.0, 88.9, (u) => u), 150, "#e8e0d0"); }
    const look = t < 86.9 ? 1 : t < 87.9 ? -0.3 : 0.4;
    heroOnRoof(c, t, "surprised", { lookX: look, lookY: -0.4, squash: -0.05 * (hit(85.98) + hit(86.97) + hit(88.0)) });
  });
}
function puddle(c: Ctx, t: number) { c.save(); c.beginPath(); c.ellipse(SHARK[0], SHARK[1] + 10, 170, 40, 0, 0, TAU); c.fillStyle = "rgba(110,190,245,0.75)"; c.fill(); c.lineWidth = 5; c.strokeStyle = "rgba(30,90,170,0.85)"; c.stroke();
  for (let k = 0; k < 2; k++) { const u = (t * 0.6 + k * 0.5) % 1; c.beginPath(); c.ellipse(SHARK[0], SHARK[1] + 10, 60 + u * 100, 14 + u * 24, 0, 0, TAU); c.lineWidth = 3; c.strokeStyle = `rgba(255,255,255,${0.7 * (1 - u)})`; c.stroke(); } c.restore(); }
// shark sitting upright on its tail in the puddle (nose up), fins raised in surprise
function sittingShark(c: Ctx, t: number, mood: "surprised" | "smile", look: number) { drawShark(c, SHARK[0] + 30, SHARK[1] - 100, 430, { t, mood, look, rot: 0.62 + Math.sin(t * 2) * 0.03 }); for (let i = 0; i < 5; i++) { const u = (t * 0.8 + rnd(i)) % 1; c.fillStyle = "rgba(160,220,255,0.9)"; c.beginPath(); c.ellipse(SHARK[0] - 80 + rnd(i * 3) * 160, SHARK[1] - 330 + u * 320, 5, 8, 0, 0, TAU); c.fill(); } }
/* ===== L19 90.4-96.5 one very surprised shark, sitting on his roof ===== */
export function S(c: Ctx, t: number) {
  const close = t > 93.4;
  scene(c, "bg4", close ? { x: 560, y: 1500, z: 1.45 } : { x: 540, y: 1360, z: 1.1 }, () => { drawImg(c, "bg4", "bg4");
    puddle(c, t); sittingShark(c, t, "surprised", seg(t, 91.6, 92.2));
    heroOnRoof(c, t, t < 91.9 ? "smile" : t < 94.4 ? "surprised" : "laugh", { lookX: t > 91.7 ? 1 : 0 }); });
}
/* ===== L20 96.5-100 what would you erase? (end card drawn by the composition) ===== */
export function T(c: Ctx, t: number) {
  scene(c, "bg4", { x: 420, y: lerp(1450, 1400, seg(t, 96.5, 100)), z: lerp(1.6, 1.4, seg(t, 96.5, 100)) }, () => { drawImg(c, "bg4", "bg4");
    puddle(c, t); sittingShark(c, t, "surprised", 1);
    const up = seg(t, 96.6, 97.0, easeBack);
    const out = heroOnRoof(c, t, "grin", { armR: { a: lerp(10, 150, up), b: 20 }, ikR: undefined, handR: "fist" });
    drawPencil(c, out.gloveR[0], out.gloveR[1] + 70, 200, 0, up > 0.9 ? 0.5 : 0); // tip below the glove, eraser up
    sparkles(c, out.gloveR[0], out.gloveR[1] - 200, t, 8, 90, 16, "#ffc0d8", 7, up); });
}
void POSES; void easeBack; void VH; void glow;
