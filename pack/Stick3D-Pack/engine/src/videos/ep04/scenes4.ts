// EP04 "What If Stickman Erased Gravity?" — 20 lines as 2D shots over the painted backgrounds + floating cut-outs.
import { Rig, POSES } from "../../style/stickman";
import { drawPencil, drawCow, drawShark, drawFish, waterBlob, drawSock, drawBed, drawMoon, smoke, puff, sparkles, glow, bird, sweatDrops, seg, lerp, clamp, easeIO, easeBack, rnd, INK, V2 } from "../../style/props2d";
import { stick } from "../ep03/engine2d";
import { VW, VH, Cam, clampC, applyC, drawImg, floatWorld, sprite, P, shake } from "./engine4";

type Ctx = CanvasRenderingContext2D;
const TAU = Math.PI * 2;
function scene(c: Ctx, bg: string, cam: Cam, fn: () => void) { const cc = clampC(bg, cam); c.save(); applyC(c, cc); fn(); c.restore(); return cc; }
const idle = (t: number, face: Rig["face"], x: Partial<Rig> = {}): Rig => ({ t: t * 30, view: "front", face, armL: { a: 10, b: 8 }, armR: { a: 10, b: 8 }, legL: { a: 3, b: 0 }, legR: { a: 3, b: 0 }, ...x } as Rig);
const sitting = (t: number, face: Rig["face"], x: Partial<Rig> = {}): Rig => idle(t, face, { legL: { a: 14, b: 0, lift: 150 }, legR: { a: 14, b: 0, lift: 150 }, ...x });
const floating = (t: number, face: Rig["face"], x: Partial<Rig> = {}): Rig => { const s = Math.sin(t * 1.6); return idle(t, face, { grounded: false, armL: { a: 60 + 15 * s, b: 20 }, armR: { a: 60 - 15 * s, b: 20 }, legL: { a: 12 + 6 * s, b: 0, lift: 40 }, legR: { a: 12 - 6 * s, b: 0, lift: 30 }, handL: "open", handR: "open", ...x }); };
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
    stick(c, floating(t, "laugh", { armL: { a: 150, b: 0 }, armR: { a: 150, b: 0 }, handL: "open", handR: "open" }), x, y + 280, 460, undefined, Math.PI + Math.sin(t * 1.2) * 0.25);
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
      const out = stick(c, sitting(t, "smile", { ikR: [120, 330], ikL: [-130, 300], handR: "fist", handL: "hold", lookY: 0.6 }), ...SIT, SITH);
      notebook(c, (out.gloveR[0] + out.gloveL[0]) / 2, (out.gloveR[1] + out.gloveL[1]) / 2 + 20, 200, 0, -0.08);
      heldPencil(c, out.gloveR, 150, -0.6 + flip * 0.2, flip, flip > 0.9 && flip < 1 ? 1 : 0); });
  } else if (t < 9.6) {
    // insert: the eraser rubs the word out letter by letter
    c.fillStyle = "#8a8f9e"; c.fillRect(0, 0, VW, VH); for (let i = 0; i < 40; i++) { c.fillStyle = `rgba(${60 + rnd(i) * 40},${60 + rnd(i) * 40},70,0.25)`; c.beginPath(); c.arc(rnd(i * 3) * VW, rnd(i * 7) * VH, 30 + rnd(i) * 80, 0, TAU); c.fill(); }
    c.fillStyle = "#2b4a8a"; c.beginPath(); c.ellipse(VW / 2, VH * 1.02, VW * 0.75, VH * 0.2, 0, 0, TAU); c.fill(); // lap
    const er = seg(t, 6.28, 9.0, (u) => u); const W = 900;
    notebook(c, VW / 2, VH * 0.42, W, er, -0.04);
    const ex = VW / 2 - W * 0.31 + W * 0.62 * er + Math.sin(t * 30) * 18, ey = VH * 0.42 + Math.cos(t * 26) * 10;
    drawPencil(c, ex + 40, ey - 650, 620, Math.PI + 0.12); // tip up, eraser end rubbing the page
    for (let i = 0; i < 10; i++) { const u = ((t * 2 + rnd(i)) % 1); c.fillStyle = i % 2 ? "#ff9fb8" : "#b8bccb"; c.beginPath(); c.ellipse(ex + (rnd(i * 5) - 0.5) * 200 * u, ey + 60 + u * 260 + Math.sin(u * 9 + i) * 20, 8, 5, i, 0, TAU); c.fill(); }
  } else {
    scene(c, "bg1", { x: 380, y: 1100, z: lerp(1.4, 1.6, seg(t, 9.6, 12.7)) }, () => { drawImg(c, "bg1", "bg1");
      const show = seg(t, 9.7, 10.1, easeBack);
      const out = stick(c, sitting(t, show > 0.5 ? "grin" : "smile", { ikR: [lerp(120, 150, show), lerp(330, 560, show)], ikL: [lerp(-130, -120, show), lerp(300, 560, show)], handR: "hold", handL: "hold", lookX: 0 }), ...SIT, SITH);
      notebook(c, (out.gloveR[0] + out.gloveL[0]) / 2, (out.gloveR[1] + out.gloveL[1]) / 2 - 30 * show, lerp(200, 260, show), 1, -0.05); });
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
    stick(c, floating(t, t < 23.9 ? "surprised" : "laugh", { lookY: -0.6, lookX: -0.5 }), SIT[0] + 40, fy, SITH);
  });
}
/* ===== L7 28.3-33.6 cars drift down the street like balloons ===== */
export function G(c: Ctx, t: number) {
  scene(c, "bg2", { x: lerp(700, 780, seg(t, 28.3, 33.6)), y: 760, z: 1.45 }, () => {
    floatWorld(c, "bg2", t, (n) => (n.includes("car") ? { spin: n.includes("red") ? 0.18 : -0.22, dx: (t - 28.3) * (n.includes("red") ? 22 : -14), amp: 1.5 } : {}));
    stick(c, floating(t, "surprised", { lookX: 1, lookY: -0.3 }), 470, 1230, 420);
  });
}
/* ===== L8 33.6-39.4 a cow floats past the window, still chewing ===== */
export function H(c: Ctx, t: number) {
  const cx = lerp(820, -200, seg(t, 33.7, 38.6, (u) => u)), cy = 520 + Math.sin(t * 1.2) * 20;
  scene(c, "bg2", { x: 300, y: 560, z: 1.85 }, () => {
    floatWorld(c, "bg2", t, (n) => (n === "bg2_house" ? { amp: 0.4 } : {}));
    drawCow(c, cx, cy + 120, 150, { t, chew: true, legs: 1, rot: Math.sin(t * 0.8) * 0.12 });
    const take = seg(t, 34.6, 34.8);
    stick(c, floating(t, take > 0 ? "surprised" : "smile", { lookX: lerp(1, -1, seg(t, 35, 37.5)), squash: take > 0 && t < 35.1 ? 0.06 : 0 }), 470, 900, 300);
  });
}
/* ===== L9 39.4-45.6 laughs, kicks off the ceiling and flies (with a loop) ===== */
export function I(c: Ctx, t: number) {
  const kick = seg(t, 40.5, 40.9), fly = seg(t, 40.9, 45.6, (u) => u);
  const loopA = seg(t, 42.6, 44.4, easeIO) * TAU;
  const px = lerp(340, 780, fly) + (t > 42.6 && t < 44.4 ? -Math.sin(loopA) * 0 : 0), py = lerp(820, 640, fly) - (t > 42.6 ? (1 - Math.cos(loopA)) * 200 : 0);
  scene(c, "bg2", { x: t < 40.9 ? 300 : lerp(300, 620, seg(t, 40.9, 42.4, easeIO)), y: 720, z: t < 40.9 ? 1.6 : 1.15 }, () => {
    floatWorld(c, "bg2", t);
    if (t < 40.9) stick(c, floating(t, "laugh", { squash: kick > 0 ? -0.08 * (1 - kick) + 0.06 * kick : Math.sin(t * 9) * 0.02, legL: { a: 30 * kick, b: 0 }, legR: { a: 30 * kick, b: 0 } }), 330, 1000, 380);
    else { stick(c, superman(t, "laugh"), px, py + 190, 380, undefined, -1.2 + (t > 42.6 && t < 44.4 ? -loopA : 0)); for (let i = 1; i < 6; i++) { c.globalAlpha = 0.5 - i * 0.08; c.fillStyle = "#ffffff"; c.beginPath(); c.arc(px - i * 40, py + i * 6, 14 - i * 2, 0, TAU); c.fill(); } c.globalAlpha = 1; }
  });
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
    stick(c, floating(t, t > 52.0 ? "laugh" : "surprised", { lookX: Math.sin(t * 0.9) }), 560, hy + 180, 360);
  });
}
/* ===== L12 56.7-62.6 the Moon gets closer. Much closer. ===== */
export function L(c: Ctx, t: number) {
  const slide = seg(t, 56.9, 58.2, easeIO), closer = seg(t, 58.6, 60.0, easeBack);
  const mr = lerp(260, 380, slide) + closer * 180, my = lerp(-400, 420, slide) - closer * 90;
  scene(c, "bg3", { x: 540, y: 980, z: 1.0 }, () => {
    floatWorld(c, "bg3", t);
    c.save(); c.globalAlpha = 0.25 * (slide + closer); c.fillStyle = "#1a1040"; c.fillRect(0, 0, 1080, 2100); c.restore();
    drawMoon(c, 560, my, mr, t);
    const pale = closer;
    const out = stick(c, floating(t, closer > 0.2 ? "scared" : "surprised", { lookY: -1, armL: { a: 40, b: 70 }, armR: { a: 40, b: 70 } }), 540, 1700, 520);
    if (pale > 0) { c.save(); c.globalAlpha = 0.25 * pale; c.fillStyle = "#e8f0ff"; c.beginPath(); c.arc(out.head[0], out.head[1], out.headR, 0, TAU); c.fill(); c.restore(); sweatDrops(c, out.head[0], out.head[1], out.headR, t, pale); }
  });
}
/* ===== L13 62.6-67.2 panics, flips the pencil and writes G-R ===== */
const SKYPOS: V2 = [430, 1300];
function skyBack(c: Ctx, t: number) { floatWorld(c, "bg3", t); c.save(); c.globalAlpha = 0.35; c.fillStyle = "#1a1040"; c.fillRect(0, 0, 1080, 2100); c.restore(); drawMoon(c, 600, 330, 560, t); }
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
    const out = stick(c, floating(t, t < 67.8 ? "determined" : t < 68.7 ? "surprised" : "scared", { lookX: 1, lookY: -0.6, handR: t < 67.8 ? "fist" : "open", armR: t < 67.8 ? { a: 120, b: 30 } : { a: lerp(120, 165, reach), b: 0 } }), SKYPOS[0], feetY, h);
    if (t < 67.8) heldPencil(c, out.gloveR, 170, 0.5); else { const px = out.gloveR[0] + 60 + slip * 520, py = out.gloveR[1] - 40 - slip * 420 + Math.sin(slip * 9) * 30; drawPencil(c, px, py, 170, (t - 67.8) * 5); sparkles(c, px, py - 60, t, 4, 50, 10, "#ffffff", 5, 0.6); } });
}
/* ===== L15 71.0-75.0 swims after it, past a shark in a water bubble ===== */
export function O(c: Ctx, t: number) {
  const sw = seg(t, 71.0, 75.0, (u) => u), stroke = Math.sin(t * 7);
  scene(c, "bg3", { x: 540, y: 1000, z: 1.0 }, () => { skyBack(c, t);
    const bx = 700, by = 1000; const look = seg(t, 73.3, 73.9);
    waterBlob(c, bx, by, 300, 210, t, 9, () => { drawShark(c, bx + Math.sin(t * 0.8) * 30, by + 10, 380, { t, mood: "smile", flip: look > 0.5, look }); for (let f = 0; f < 3; f++) drawFish(c, bx - 150 + f * 120, by + 140 - f * 30, 50, { t: t + f, col: "#ffd23a", flip: f % 2 === 0 }); });
    const hx = lerp(120, 900, sw), hy = 1350 - Math.sin(sw * Math.PI) * 140;
    stick(c, { t: t * 30, view: "side", face: "determined", armR: { a: 140 + 40 * stroke, b: 30 - 30 * stroke }, armL: { a: 120 + 40 * stroke, b: 40 - 30 * stroke }, handR: "open", handL: "open", legR: { a: -20 + 25 * stroke, b: 30, f: -30 }, legL: { a: -20 - 25 * stroke, b: 30, f: -30 }, grounded: false } as Rig, hx, hy + 180, 380, undefined, -1.35);
    drawPencil(c, 1000 + Math.sin(t) * 20, 760, 150, t * 2); });
}
/* ===== L16 75.0-81.4 grabs it and writes one big word across the sky ===== */
export function Pq(c: Ctx, t: number) {
  const wr = seg(t, 76.1, 77.9, (u) => u), pulse = t > 77.9 ? 0.5 + 0.5 * Math.sin((t - 77.9) * 5) : 0;
  const back = seg(t, 77.9, 79.5, easeIO);
  scene(c, "bg3", { x: 540, y: lerp(1050, 1000, back), z: lerp(1.2, 1.0, back) }, () => { skyBack(c, t);
    const tip = glowText(c, "GRAVITY", 540, 960, 210, wr, t, `rgba(255,${200 + pulse * 55},${120 + pulse * 100},1)`);
    if (pulse > 0) glow(c, 540, 960, 700, "rgba(255,230,150,1)", 0.25 + 0.2 * pulse);
    const h = 440, hx = wr > 0 && wr < 1 ? tip[0] - 120 : t < 76.1 ? 820 : 760, feetY = 1520;
    const grab = t >= 75.12;
    const out = stick(c, floating(t, wr >= 1 ? "laugh" : "determined", { handR: "fist", armR: undefined, ikR: wr > 0 && wr < 1 ? [(tip[0] - hx) * 1000 / h, (feetY - tip[1]) * 1000 / h - 120] : [140, 640], lookY: -0.5 }), hx, feetY, h);
    if (grab) heldPencil(c, out.gloveR, 160, 0.3, 0, t < 75.5 ? 1 : 0); else drawPencil(c, out.gloveR[0] + 60, out.gloveR[1] - 40, 160, t * 3); });
}
/* ===== L17 81.4-85.9 EVERYTHING SLAMS BACK DOWN (the one camera shake) ===== */
const SLAM = 81.84;
export function Q(c: Ctx, t: number) {
  const imp = t >= SLAM ? Math.exp(-(t - SLAM) * 7) : 0, [sx, sy] = shake(t, t >= SLAM && t < SLAM + 0.55 ? 34 * imp : 0, 43);
  scene(c, "bg4", { x: 540, y: 900, z: 1.0, sx, sy }, () => {
    drawImg(c, "bg4", "bg4");
    if (t < SLAM) { const f = seg(t, 81.4, SLAM, (u) => u * u); drawCow(c, 520, lerp(-300, 900, f), 140, { t, legs: 1, eyes: "shock" }); for (const [x, s] of [[200, 1], [800, 0.8]]) { c.save(); c.globalAlpha = 0.6; c.fillStyle = "#fff"; for (let i = 0; i < 6; i++) c.fillRect(x + i * 20 - 60, lerp(-400, 600, f) - i * 80, 6, 120 * s); c.restore(); } }
    else { smoke(c, 540, 1000, t - SLAM, 26, 1100, 500, 110, 1 - seg(t, SLAM + 0.3, 85), 8, "#e8e0d0"); for (let i = 0; i < 14; i++) { const d = t - SLAM, a = i * 0.45 + 0.2, v = 700 + rnd(i) * 500; const x = 540 + Math.cos(a) * v * d * 0.8, y = 1000 - Math.abs(Math.sin(a)) * v * d + 1400 * d * d; if (y > 1900) continue; waterBlob(c, x, y, 16, 12, t, i); } drawCow(c, 520, 1010, 140, { t, chew: t > 83, eyes: t < 83 ? "shock" : "calm" }); }
  });
  if (t >= SLAM && t < SLAM + 0.25) { c.fillStyle = `rgba(255,255,255,${1 - (t - SLAM) / 0.25})`; c.fillRect(0, 0, VW, VH); }
}
/* ===== L18 85.9-90.4 the house. the cars. the cow. ===== */
export function R(c: Ctx, t: number) {
  const bounce = (t0: number) => (t >= t0 ? -Math.abs(Math.sin((t - t0) * 9)) * 70 * Math.exp(-(t - t0) * 4) : -260);
  if (t < 86.9) scene(c, "bg4", { x: 760, y: 760, z: 1.55 }, () => { drawImg(c, "bg4p", "bg4"); sprite(c, "bg4_redcar", t, { still: true }); sprite(c, "bg4_bluecar", t, { still: true }); const b = t < 85.98 ? -300 * (1 - seg(t, 85.6, 85.98, (u) => u * u)) : bounce(85.98); sprite(c, "bg4_house", t, { still: true, dy: b }); if (t > 85.98) puff(c, 980, 1070, seg(t, 85.98, 86.8, (u) => u), 160, "#e8e0d0"); });
  else if (t < 87.9) scene(c, "bg4", { x: 520, y: 800, z: 1.6 }, () => { drawImg(c, "bg4p", "bg4"); sprite(c, "bg4_house", t, { still: true }); for (const n of ["bg4_redcar", "bg4_bluecar"]) sprite(c, n, t, { still: true, dy: t < 86.97 ? -260 * (1 - seg(t, 86.6, 86.97, (u) => u * u)) : bounce(86.97 + (n.includes("blue") ? 0.08 : 0)) }); if (t > 86.97) { puff(c, 390, 900, seg(t, 86.97, 87.8, (u) => u), 140, "#e8e0d0"); puff(c, 750, 760, seg(t, 87.05, 87.8, (u) => u), 100, "#e8e0d0"); } });
  else scene(c, "bg4", { x: 560, y: 980, z: 1.5 }, () => { drawImg(c, "bg4", "bg4"); const f = seg(t, 87.6, 88.0, (u) => u * u), land = t > 88.0 ? Math.exp(-(t - 88.0) * 6) : 0;
    drawCow(c, 560, lerp(500, 1100, f) - (t > 88 ? Math.abs(Math.sin((t - 88) * 10)) * 30 * land : 0), 170, { t, chew: t > 88.6, eyes: t < 88.6 ? "shock" : "calm" }); if (t > 88.0) puff(c, 560, 1110, seg(t, 88.0, 88.9, (u) => u), 150, "#e8e0d0"); });
}
/* ===== L19 90.4-96.5 one very surprised shark, sitting on his roof ===== */
const ROOF_HERO: V2 = [330, 1660], SHARK: V2 = [760, 1500];
export function S(c: Ctx, t: number) {
  const close = t > 93.4;
  scene(c, "bg4", close ? { x: 560, y: 1500, z: 1.45 } : { x: 540, y: 1360, z: 1.1 }, () => { drawImg(c, "bg4", "bg4");
    c.save(); c.beginPath(); c.ellipse(SHARK[0], SHARK[1] + 140, 320, 70, 0, 0, TAU); c.fillStyle = "rgba(90,180,240,0.7)"; c.fill(); c.lineWidth = 5; c.strokeStyle = "rgba(20,80,160,0.8)"; c.stroke(); c.restore();
    drawShark(c, SHARK[0], SHARK[1] + 40, 560, { t, mood: t < 94.4 ? "surprised" : "smile", look: seg(t, 91.6, 92.2), flip: t > 92.4 && t < 94.4 });
    for (let i = 0; i < 6; i++) { const u = (t * 0.7 + rnd(i)) % 1; c.fillStyle = "rgba(160,220,255,0.9)"; c.beginPath(); c.arc(SHARK[0] - 120 + rnd(i * 3) * 240, SHARK[1] - 60 + u * 140, 7, 0, TAU); c.fill(); }
    stick(c, sitting(t, t < 91.9 ? "smile" : t < 94.4 ? "surprised" : "laugh", { lookX: t > 91.7 ? 1 : 0, ikL: [-140, 300], ikR: [140, 300], handL: "relaxed", handR: "relaxed" }), ...ROOF_HERO, 520); });
}
/* ===== L20 96.5-100 what would you erase? (end card drawn by the composition) ===== */
export function T(c: Ctx, t: number) {
  scene(c, "bg4", { x: 420, y: lerp(1450, 1400, seg(t, 96.5, 100)), z: lerp(1.6, 1.4, seg(t, 96.5, 100)) }, () => { drawImg(c, "bg4", "bg4");
    drawShark(c, SHARK[0], SHARK[1] + 40, 560, { t, mood: "smile", look: 1 });
    const up = seg(t, 96.6, 97.0, easeBack);
    const out = stick(c, sitting(t, "grin", { armR: { a: lerp(10, 150, up), b: 20 }, handR: "fist", ikL: [-140, 300], handL: "relaxed" }), ...ROOF_HERO, 520);
    drawPencil(c, out.gloveR[0], out.gloveR[1] + 70, 200, 0, up > 0.9 ? 0.5 : 0); // tip below the glove, eraser up
    sparkles(c, out.gloveR[0], out.gloveR[1] - 200, t, 8, 90, 16, "#ffc0d8", 7, up); });
}
void POSES; void easeBack; void VH; void glow;
