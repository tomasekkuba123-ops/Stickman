// EP05 procedural locations (cached 1080x1920 world canvases): evening art desk, sketchbook paper world, next-morning desk.
import { drawPencil, rnd, INK } from "../../style/props2d";
export const WW = 1080, WH = 1920;
const TAU = Math.PI * 2;
type Ctx = CanvasRenderingContext2D;
const lg = (c: Ctx, x0: number, y0: number, x1: number, y1: number, stops: [number, string][]) => { const g = c.createLinearGradient(x0, y0, x1, y1); for (const [k, col] of stops) g.addColorStop(k, col); return g; };
const ink = (c: Ctx, w = 6) => { c.lineWidth = w; c.strokeStyle = INK; c.stroke(); };
const rr = (c: Ctx, x: number, y: number, w: number, h: number, r: number) => { c.beginPath(); c.roundRect(x, y, w, h, r); };

/* desk layout (world px): desk top surface from y=DESK_BACK (far edge) to DESK_FRONT (near edge) */
export const DESK_BACK = 1210, DESK_FRONT = 1600, STAND_Y = 1440; // characters stand on the desk at ~STAND_Y
export const BOOK = { x0: 150, x1: 640, top: 600, bottom: 1400 }; // upright sketchbook page (the copy is drawn here)
export const GLASS: [number, number] = [985, 1470];
export const LAMP: [number, number] = [905, 1330];

function wall(c: Ctx, morning: boolean) {
  c.fillStyle = lg(c, 0, 0, 0, DESK_BACK, morning ? [[0, "#f6e7c8"], [1, "#ead2a6"]] : [[0, "#2b2a5a"], [0.6, "#3c3570"], [1, "#4a3a6a"]]); c.fillRect(0, 0, WW, DESK_BACK + 20);
  c.fillStyle = morning ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.05)"; for (let x = 0; x < WW; x += 60) c.fillRect(x, 0, 26, DESK_BACK); // wallpaper stripes
  for (let i = 0; i < 40; i++) { c.fillStyle = morning ? "rgba(220,160,90,0.18)" : "rgba(255,230,160,0.12)"; const x = rnd(i) * WW, y = rnd(i + 7) * DESK_BACK; c.beginPath(); for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + k * TAU / 5, b = a + TAU / 10; c.lineTo(x + Math.cos(a) * 9, y + Math.sin(a) * 9); c.lineTo(x + Math.cos(b) * 4, y + Math.sin(b) * 4); } c.fill(); } // tiny star pattern
}
function windowPane(c: Ctx, morning: boolean) {
  const x0 = 590, y0 = 120, x1 = 1010, y1 = 760;
  rr(c, x0 - 26, y0 - 26, x1 - x0 + 52, y1 - y0 + 52, 14); c.fillStyle = morning ? "#d9a46a" : "#8a5a3a"; c.fill(); ink(c, 8);
  c.save(); rr(c, x0, y0, x1 - x0, y1 - y0, 6); c.clip();
  c.fillStyle = lg(c, 0, y0, 0, y1, morning ? [[0, "#5fb4ff"], [0.7, "#bfe6ff"], [1, "#e8f6ff"]] : [[0, "#0d1240"], [0.55, "#3a2a7a"], [0.85, "#d0607a"], [1, "#ffa060"]]); c.fillRect(x0, y0, x1 - x0, y1 - y0);
  if (morning) { c.fillStyle = "#fff6c0"; c.beginPath(); c.arc(x0 + 300, y0 + 150, 60, 0, TAU); c.fill(); for (const [x, y, w] of [[x0 + 60, y0 + 260, 200], [x0 + 260, y0 + 380, 150]] as [number, number, number][]) { c.fillStyle = "#ffffff"; for (let k = 0; k < 4; k++) { c.beginPath(); c.arc(x + k * w * 0.25, y - (k % 2) * 18, w * 0.17, 0, TAU); c.fill(); } } }
  else { for (let i = 0; i < 60; i++) { c.fillStyle = `rgba(255,255,240,${0.4 + rnd(i) * 0.6})`; c.beginPath(); c.arc(x0 + rnd(i * 3) * (x1 - x0), y0 + rnd(i * 5) * (y1 - y0) * 0.6, 1.5 + rnd(i) * 2.5, 0, TAU); c.fill(); }
    c.fillStyle = "#fff6d0"; c.beginPath(); c.arc(x0 + 320, y0 + 120, 46, 0, TAU); c.fill(); c.fillStyle = "#0d1240"; c.beginPath(); c.arc(x0 + 340, y0 + 108, 40, 0, TAU); c.fill(); }
  // skyline
  for (let i = 0; i < 9; i++) { const bw = 50 + rnd(i) * 40, bh = 120 + rnd(i + 3) * 200, bx = x0 + i * 50 - 10; c.fillStyle = morning ? "#8fb0d8" : "#1a1640"; c.fillRect(bx, y1 - bh, bw, bh); if (!morning) { c.fillStyle = "#ffd66a"; for (let yy = y1 - bh + 14; yy < y1 - 10; yy += 26) for (let xx = bx + 8; xx < bx + bw - 10; xx += 18) if (rnd(xx * 3 + yy) > 0.45) c.fillRect(xx, yy, 8, 12); } }
  c.restore();
  c.fillStyle = morning ? "#d9a46a" : "#8a5a3a"; c.fillRect((x0 + x1) / 2 - 8, y0, 16, y1 - y0); c.fillRect(x0, (y0 + y1) / 2 - 8, x1 - x0, 16);
  rr(c, x0 - 40, y1 + 22, x1 - x0 + 80, 30, 8); c.fillStyle = morning ? "#e0b07a" : "#9a6a46"; c.fill(); ink(c, 6); // sill
  // curtains
  for (const [cx, dir] of [[x0 - 30, -1], [x1 + 30, 1]] as [number, number][]) { c.beginPath(); c.moveTo(cx, 70); c.quadraticCurveTo(cx + dir * 40, 420, cx + dir * 10, 820); c.lineTo(cx + dir * 110, 820); c.quadraticCurveTo(cx + dir * 150, 400, cx + dir * 90, 70); c.closePath(); c.fillStyle = morning ? "#ff8a6a" : "#b8344a"; c.fill(); ink(c, 6); for (let k = 1; k < 4; k++) { c.beginPath(); c.moveTo(cx + dir * k * 25, 80); c.quadraticCurveTo(cx + dir * (k * 25 + 20), 420, cx + dir * (k * 25 + 5), 810); c.lineWidth = 3; c.strokeStyle = "rgba(0,0,0,0.2)"; c.stroke(); } }
  c.fillStyle = "#6a4a2a"; c.fillRect(x0 - 160, 60, x1 - x0 + 320, 14);
}
function shelfAndBoard(c: Ctx, morning: boolean) {
  // shelf with books, trophy, jar of brushes, small globe
  rr(c, 30, 250, 470, 22, 4); c.fillStyle = "#9a6a42"; c.fill(); ink(c, 6);
  let x = 50; const cols = ["#e5483f", "#3a6fd8", "#f0b429", "#2fb87a", "#7a54d6", "#ff8a3a", "#2b3350"];
  for (let i = 0; i < 9; i++) { const w = 22 + rnd(i) * 16, h = 90 + rnd(i + 2) * 60; rr(c, x, 250 - h, w, h, 3); c.fillStyle = cols[i % cols.length]; c.fill(); ink(c, 4); c.fillStyle = "rgba(255,255,255,0.5)"; c.fillRect(x + 4, 250 - h + 12, w - 8, 5); x += w + 3; }
  c.save(); c.translate(390, 250); c.beginPath(); c.arc(0, -55, 45, 0, TAU); c.fillStyle = "#3a8fe0"; c.fill(); ink(c, 5); c.fillStyle = "#3fbf5a"; c.beginPath(); c.ellipse(-12, -62, 18, 24, 0.4, 0, TAU); c.fill(); c.fillStyle = "#8a5a32"; c.fillRect(-4, -10, 8, 10); rr(c, -26, -4, 52, 8, 3); c.fill(); c.restore();
  rr(c, 440, 170, 44, 80, 8); c.fillStyle = "rgba(200,230,255,0.6)"; c.fill(); ink(c, 4); for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(452 + k * 7, 200); c.lineTo(448 + k * 10, 130); c.lineWidth = 5; c.strokeStyle = ["#e5483f", "#3a6fd8", "#f0b429", "#2fb87a"][k]; c.stroke(); }
  // cork board with pinned doodles + sticky notes
  rr(c, 40, 340, 420, 300, 12); c.fillStyle = "#c8955a"; c.fill(); ink(c, 7); for (let i = 0; i < 80; i++) { c.fillStyle = "rgba(120,70,30,0.35)"; c.fillRect(50 + rnd(i) * 400, 350 + rnd(i + 3) * 280, 3, 3); }
  const paper = (px: number, py: number, w: number, h: number, rot: number, col: string, doodle: number) => { c.save(); c.translate(px, py); c.rotate(rot); rr(c, -w / 2, -h / 2, w, h, 3); c.fillStyle = col; c.fill(); ink(c, 3); c.lineWidth = 4; c.strokeStyle = "#3a3a52"; c.beginPath();
    if (doodle === 0) { c.arc(0, -6, 18, 0, TAU); for (let k = 0; k < 8; k++) { const a = k * TAU / 8; c.moveTo(Math.cos(a) * 24, -6 + Math.sin(a) * 24); c.lineTo(Math.cos(a) * 34, -6 + Math.sin(a) * 34); } }
    else if (doodle === 1) { c.moveTo(-30, 20); c.lineTo(-30, -6); c.lineTo(0, -30); c.lineTo(30, -6); c.lineTo(30, 20); c.closePath(); c.moveTo(-8, 20); c.lineTo(-8, 4); c.lineTo(8, 4); c.lineTo(8, 20); }
    else if (doodle === 2) { c.arc(0, -18, 12, 0, TAU); c.moveTo(0, -6); c.lineTo(0, 16); c.moveTo(-14, 2); c.lineTo(14, 2); c.moveTo(0, 16); c.lineTo(-10, 30); c.moveTo(0, 16); c.lineTo(10, 30); }
    else { c.moveTo(-26, -10); c.lineTo(26, -10); c.moveTo(-26, 4); c.lineTo(20, 4); c.moveTo(-26, 18); c.lineTo(10, 18); }
    c.stroke(); c.beginPath(); c.arc(0, -h / 2 + 8, 6, 0, TAU); c.fillStyle = "#e5263a"; c.fill(); c.restore(); };
  paper(130, 430, 120, 110, -0.08, "#ffffff", 0); paper(270, 420, 110, 100, 0.06, "#fffbe8", 1); paper(380, 470, 100, 120, -0.04, "#ffffff", 2); paper(150, 570, 90, 80, 0.1, "#ffe86a", 3); paper(300, 570, 110, 90, -0.06, "#9ff0c8", 3);
  // wall clock
  c.save(); c.translate(1020, 880); c.beginPath(); c.arc(0, 0, 48, 0, TAU); c.fillStyle = "#fffdf4"; c.fill(); ink(c, 6); c.lineWidth = 6; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -30); c.moveTo(0, 0); c.lineTo(morning ? -22 : 22, morning ? 12 : 8); c.stroke(); c.restore();
  // string lights
  if (!morning) { c.beginPath(); c.moveTo(0, 40); c.quadraticCurveTo(270, 120, 540, 50); c.quadraticCurveTo(810, 120, 1080, 40); c.lineWidth = 3; c.strokeStyle = "#2a2a3a"; c.stroke();
    for (let i = 0; i < 14; i++) { const u = i / 13, x = u * 1080, half = u < 0.5 ? u * 2 : (u - 0.5) * 2, y = 40 + Math.sin(half * Math.PI) * 45 + (u < 0.5 ? 0 : 0) + 10; const col = ["#ffd66a", "#ff8ab0", "#8affc8", "#8ac8ff"][i % 4]; const g = c.createRadialGradient(x, y, 2, x, y, 40); g.addColorStop(0, col); g.addColorStop(1, "rgba(0,0,0,0)"); c.fillStyle = g; c.globalAlpha = 0.5; c.fillRect(x - 40, y - 40, 80, 80); c.globalAlpha = 1; c.beginPath(); c.ellipse(x, y, 7, 10, 0, 0, TAU); c.fillStyle = col; c.fill(); ink(c, 2); } }
}
function desk(c: Ctx, morning: boolean) {
  // top surface (perspective planks)
  c.beginPath(); c.moveTo(-60, DESK_BACK); c.lineTo(WW + 60, DESK_BACK); c.lineTo(WW + 160, DESK_FRONT); c.lineTo(-160, DESK_FRONT); c.closePath();
  c.fillStyle = lg(c, 0, DESK_BACK, 0, DESK_FRONT, morning ? [[0, "#d89a5a"], [1, "#e8b070"]] : [[0, "#8a4e2a"], [1, "#b46a3a"]]); c.fill();
  c.lineWidth = 3; c.strokeStyle = "rgba(60,30,10,0.35)"; for (let i = 1; i < 6; i++) { const y = DESK_BACK + (DESK_FRONT - DESK_BACK) * (i / 6) ** 1.3; c.beginPath(); c.moveTo(-100, y); c.lineTo(WW + 100, y); c.stroke(); }
  for (let i = 0; i < 30; i++) { c.strokeStyle = "rgba(60,30,10,0.18)"; c.lineWidth = 2; const y = DESK_BACK + rnd(i) * (DESK_FRONT - DESK_BACK), x = rnd(i + 4) * WW; c.beginPath(); c.moveTo(x, y); c.bezierCurveTo(x + 40, y - 6, x + 80, y + 6, x + 130, y); c.stroke(); }
  c.beginPath(); c.moveTo(-60, DESK_BACK); c.lineTo(WW + 60, DESK_BACK); ink(c, 6);
  // front edge + under-desk
  c.fillStyle = morning ? "#b87a3e" : "#6a3a1e"; c.fillRect(-10, DESK_FRONT, WW + 20, 90); c.beginPath(); c.moveTo(-10, DESK_FRONT); c.lineTo(WW + 10, DESK_FRONT); ink(c, 7);
  c.fillStyle = morning ? "#5a4a5a" : "#1c1530"; c.fillRect(0, DESK_FRONT + 90, WW, WH - DESK_FRONT - 90);
  rr(c, 120, DESK_FRONT + 120, 360, 140, 10); c.fillStyle = morning ? "#a46a36" : "#5a2e18"; c.fill(); ink(c, 6); c.beginPath(); c.arc(300, DESK_FRONT + 190, 12, 0, TAU); c.fillStyle = "#ffd66a"; c.fill(); ink(c, 4);
  rr(c, 600, DESK_FRONT + 120, 360, 140, 10); c.fillStyle = morning ? "#a46a36" : "#5a2e18"; c.fill(); ink(c, 6); c.beginPath(); c.arc(780, DESK_FRONT + 190, 12, 0, TAU); c.fillStyle = "#ffd66a"; c.fill(); ink(c, 4);
}
function deskProps(c: Ctx, morning: boolean) {
  // books propping the sketchbook
  for (let i = 0; i < 3; i++) { rr(c, 70 + i * 6, 1290 - i * 44, 620, 46, 6); c.fillStyle = ["#3a6fd8", "#e5483f", "#2fb87a"][i]; c.fill(); ink(c, 5); c.fillStyle = "#fffdf4"; c.fillRect(80 + i * 6, 1300 - i * 44, 600, 8); }
  // succulent pot
  c.save(); c.translate(80, 1280); c.beginPath(); c.moveTo(-40, -50); c.lineTo(40, -50); c.lineTo(30, 10); c.lineTo(-30, 10); c.closePath(); c.fillStyle = "#e07a4a"; c.fill(); ink(c, 5); for (let k = 0; k < 6; k++) { c.save(); c.translate(0, -52); c.rotate(-1.2 + k * 0.48); c.beginPath(); c.ellipse(0, -30, 13, 34, 0, 0, TAU); c.fillStyle = k % 2 ? "#4fbf6a" : "#3aa858"; c.fill(); ink(c, 4); c.restore(); } c.restore();
  // pencil cup
  c.save(); c.translate(745, 1320); for (let k = 0; k < 5; k++) { c.save(); c.rotate(-0.25 + k * 0.12); drawPencil(c, 0, -230, 220, Math.PI); c.restore(); } rr(c, -55, -110, 110, 120, 14); c.fillStyle = "#3a6fd8"; c.fill(); ink(c, 6); c.fillStyle = "rgba(255,255,255,0.25)"; c.fillRect(-40, -100, 14, 100); c.font = "900 30px Inter"; c.fillStyle = "#fff"; c.textAlign = "center"; c.fillText("ART", 0, -40); c.restore();
  // desk lamp + glow
  c.save(); c.translate(LAMP[0], LAMP[1]); c.beginPath(); c.ellipse(0, 0, 80, 20, 0, 0, TAU); c.fillStyle = "#2b3350"; c.fill(); ink(c, 5);
  c.beginPath(); c.moveTo(0, -10); c.lineTo(-60, -230); c.lineTo(-10, -360); c.lineWidth = 16; c.strokeStyle = INK; c.stroke(); c.lineWidth = 9; c.strokeStyle = "#e5483f"; c.stroke();
  c.save(); c.translate(-10, -360); c.rotate(-0.6); c.beginPath(); c.moveTo(-30, 0); c.lineTo(30, 0); c.lineTo(80, 110); c.lineTo(-80, 110); c.closePath(); c.fillStyle = "#e5483f"; c.fill(); ink(c, 6); c.beginPath(); c.ellipse(0, 110, 80, 18, 0, 0, TAU); c.fillStyle = morning ? "#fff3c0" : "#fff6b0"; c.fill(); ink(c, 5); c.restore(); c.restore();
  // crayons scattered + crayon box
  const crayon = (x: number, y: number, a: number, col: string) => { c.save(); c.translate(x, y); c.rotate(a); rr(c, -60, -13, 110, 26, 6); c.fillStyle = col; c.fill(); ink(c, 4); c.beginPath(); c.moveTo(50, -11); c.lineTo(80, 0); c.lineTo(50, 11); c.closePath(); c.fill(); ink(c, 4); c.fillStyle = "rgba(255,255,255,0.4)"; c.fillRect(-30, -13, 16, 26); c.restore(); };
  crayon(210, 1560, -0.3, "#e5483f"); crayon(420, 1585, 0.25, "#2fb87a"); crayon(560, 1545, -0.1, "#f0b429"); crayon(830, 1575, 0.4, "#7a54d6");
  rr(c, 470, 1460, 170, 70, 8); c.fillStyle = "#f0b429"; c.fill(); ink(c, 5); c.fillStyle = "#2fb87a"; c.fillRect(480, 1475, 150, 20); c.font = "900 26px Inter"; c.fillStyle = "#1a1a2a"; c.textAlign = "center"; c.fillText("CRAYONS", 555, 1520);
  // pink eraser + sharpener + ruler + sticky pad
  c.save(); c.translate(300, 1500); c.rotate(-0.12); rr(c, -60, -26, 120, 52, 12); c.fillStyle = "#ff9fb8"; c.fill(); ink(c, 5); c.fillStyle = "#4a7ad8"; c.fillRect(-60, -26, 44, 52); c.restore();
  c.save(); c.translate(680, 1490); rr(c, -26, -22, 52, 44, 6); c.fillStyle = "#c8d0e0"; c.fill(); ink(c, 4); c.beginPath(); c.arc(0, 0, 9, 0, TAU); c.fillStyle = "#2b2b38"; c.fill(); c.restore();
  c.save(); c.translate(150, 1590); c.rotate(0.05); rr(c, -120, -16, 300, 32, 4); c.fillStyle = "#ffe08a"; c.fill(); ink(c, 4); for (let k = 0; k < 24; k++) { c.beginPath(); c.moveTo(-110 + k * 12, -16); c.lineTo(-110 + k * 12, k % 5 ? -6 : 2); c.lineWidth = 2; c.strokeStyle = INK; c.stroke(); } c.restore();
  c.save(); c.translate(880, 1420); c.rotate(0.1); rr(c, -45, -40, 90, 80, 4); c.fillStyle = "#9ff0c8"; c.fill(); ink(c, 4); c.fillStyle = "#7ad0a8"; c.fillRect(-45, -40, 90, 12); c.restore();
  // mug with brushes
  c.save(); c.translate(1020, 1300); rr(c, -40, -80, 80, 90, 14); c.fillStyle = "#fffdf4"; c.fill(); ink(c, 5); c.beginPath(); c.arc(44, -36, 22, -1.3, 1.3); c.lineWidth = 9; c.strokeStyle = INK; c.stroke(); c.lineWidth = 4; c.strokeStyle = "#fffdf4"; c.stroke(); c.fillStyle = "#e5483f"; c.font = "900 28px Inter"; c.textAlign = "center"; c.fillText("♥", 0, -28); c.restore();
}
export function drawGlass(c: Ctx, x: number, y: number, s: number, fill = 1, tilt = 0, t = 0) {
  // real glass of water (feet at x,y); tilt in rad around the base
  c.save(); c.translate(x, y); c.rotate(tilt); c.scale(s, s);
  const W0 = 52, W1 = 40, H = 150;
  const body = () => { c.beginPath(); c.moveTo(-W0, -H); c.lineTo(W0, -H); c.lineTo(W1, 0); c.lineTo(-W1, 0); c.closePath(); };
  if (fill > 0) { c.save(); body(); c.clip(); const lvl = -H * 0.85 * fill; c.save(); c.rotate(-tilt); c.fillStyle = "rgba(90,180,250,0.6)"; c.fillRect(-200, lvl, 400, 400); c.beginPath(); for (let k = -6; k <= 6; k++) c.lineTo(k * 20, lvl + Math.sin(t * 6 + k) * 3); c.lineWidth = 4; c.strokeStyle = "rgba(255,255,255,0.8)"; c.stroke(); c.restore(); c.restore(); }
  body(); c.fillStyle = "rgba(220,240,255,0.25)"; c.fill(); ink(c, 6);
  c.fillStyle = "rgba(255,255,255,0.75)"; c.fillRect(-W0 + 12, -H + 14, 10, H - 36);
  c.beginPath(); c.ellipse(0, -H, W0, 10, 0, 0, TAU); c.lineWidth = 4; c.strokeStyle = INK; c.stroke();
  c.restore();
}
function lighting(c: Ctx, morning: boolean) {
  if (morning) { c.save(); c.globalCompositeOperation = "lighter"; for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(620 + k * 120, 140); c.lineTo(700 + k * 120, 140); c.lineTo(420 + k * 160, DESK_FRONT); c.lineTo(260 + k * 160, DESK_FRONT); c.closePath(); c.fillStyle = "rgba(255,240,190,0.12)"; c.fill(); } c.restore(); }
  else { const g = c.createRadialGradient(LAMP[0] - 80, LAMP[1] - 200, 30, LAMP[0] - 120, LAMP[1] - 40, 760); g.addColorStop(0, "rgba(255,210,120,0.55)"); g.addColorStop(1, "rgba(255,180,80,0)"); c.save(); c.globalCompositeOperation = "lighter"; c.fillStyle = g; c.fillRect(0, 0, WW, WH); c.restore();
    const v = c.createRadialGradient(WW / 2, WH * 0.55, WH * 0.3, WW / 2, WH * 0.55, WH * 0.8); v.addColorStop(0, "rgba(10,5,30,0)"); v.addColorStop(1, "rgba(10,5,30,0.45)"); c.fillStyle = v; c.fillRect(0, 0, WW, WH); }
}
const cache: Record<string, HTMLCanvasElement> = {};
export function deskBG(morning: boolean): HTMLCanvasElement {
  const key = morning ? "am" : "pm"; if (cache[key]) return cache[key];
  const cv = document.createElement("canvas"); cv.width = WW; cv.height = WH; const c = cv.getContext("2d")!; c.lineJoin = "round"; c.lineCap = "round";
  wall(c, morning); windowPane(c, morning); shelfAndBoard(c, morning); desk(c, morning); deskProps(c, morning); lighting(c, morning);
  cache[key] = cv; return cv;
}

/* ---------- sketchbook paper world ---------- */
export const HORIZON = 760;
export function paperBG(): HTMLCanvasElement {
  if (cache.paper) return cache.paper;
  const cv = document.createElement("canvas"); cv.width = WW; cv.height = WH; const c = cv.getContext("2d")!; c.lineJoin = "round"; c.lineCap = "round";
  // far: the giant evening desk, blurred
  c.save(); c.filter = "blur(9px)"; c.drawImage(deskBG(false), -900, -2300, WW * 2.7, WH * 2.7); c.restore();
  c.fillStyle = "rgba(40,20,70,0.15)"; c.fillRect(0, 0, WW, HORIZON);
  // giant objects at the page edge (depth layer)
  c.save(); c.filter = "blur(2px)";
  c.save(); c.translate(120, HORIZON + 10); c.rotate(-0.05); rr(c, -160, -150, 330, 150, 26); c.fillStyle = "#ff9fb8"; c.fill(); ink(c, 8); c.fillStyle = "#4a7ad8"; c.fillRect(-160, -150, 120, 150); c.restore(); // giant eraser
  c.save(); c.translate(980, HORIZON - 10); c.rotate(0.08); drawPencil(c, -40, 0, 900, -Math.PI / 2 - 0.02); c.restore(); // giant pencil lying
  c.restore();
  // paper ground
  c.fillStyle = lg(c, 0, HORIZON, 0, WH, [[0, "#ecebe6"], [0.25, "#f7f6f1"], [1, "#fffefb"]]); c.fillRect(0, HORIZON, WW, WH - HORIZON);
  c.lineWidth = 3; c.strokeStyle = "rgba(90,140,220,0.4)"; for (let i = 1; i < 26; i++) { const y = HORIZON + (WH - HORIZON) * (i / 26) ** 1.7; c.beginPath(); c.moveTo(0, y); c.lineTo(WW, y); c.lineWidth = 1 + (i / 26) * 3; c.stroke(); } // ruled lines in perspective
  c.lineWidth = 4; c.strokeStyle = "rgba(230,70,90,0.45)"; c.beginPath(); c.moveTo(250, HORIZON); c.lineTo(-200, WH); c.stroke(); // margin
  for (let i = 0; i < 260; i++) { c.fillStyle = `rgba(120,110,100,${0.04 + rnd(i) * 0.05})`; c.fillRect(rnd(i * 3) * WW, HORIZON + rnd(i * 7) * (WH - HORIZON), 2 + rnd(i) * 3, 2); } // paper tooth
  // faint old doodles + eraser smudges
  c.lineWidth = 3; c.strokeStyle = "rgba(120,120,130,0.22)"; c.beginPath(); for (let k = 0; k < 40; k++) { const a = k * 0.5, r = 6 + k * 1.6; c.lineTo(160 + Math.cos(a) * r, 1760 + Math.sin(a) * r * 0.4); } c.stroke();
  c.beginPath(); for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + k * 4 * Math.PI / 5; c.lineTo(960 + Math.cos(a) * 50, 1800 + Math.sin(a) * 22); } c.closePath(); c.stroke();
  for (const [x, y] of [[820, 1000], [200, 1180]]) { const g = c.createRadialGradient(x, y, 4, x, y, 90); g.addColorStop(0, "rgba(150,150,160,0.18)"); g.addColorStop(1, "rgba(150,150,160,0)"); c.fillStyle = g; c.fillRect(x - 90, y - 40, 180, 80); }
  // page edge at the horizon (slight curl + shadow)
  c.fillStyle = "rgba(60,40,60,0.25)"; c.fillRect(0, HORIZON - 6, WW, 10); c.beginPath(); c.moveTo(0, HORIZON); c.quadraticCurveTo(WW / 2, HORIZON - 16, WW, HORIZON); c.lineWidth = 5; c.strokeStyle = "#c8c4bc"; c.stroke();
  // pencil shavings (foreground)
  for (const [x, y, s] of [[90, 1840, 1.3], [1000, 1700, 1.0], [960, 1880, 1.5]] as [number, number, number][]) { c.save(); c.translate(x, y); c.scale(s, s); c.beginPath(); for (let k = 0; k <= 30; k++) { const a = k / 30 * TAU * 1.5, r = 10 + k * 1.3; c.lineTo(Math.cos(a) * r, Math.sin(a) * r * 0.5); } c.lineWidth = 9; c.strokeStyle = "#f0c890"; c.stroke(); c.lineWidth = 3; c.strokeStyle = "#e5483f"; c.stroke(); c.restore(); }
  cache.paper = cv; return cv;
}
