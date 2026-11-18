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

/* ---------- sketchbook paper world (fully drawn: warm paper, sketched landscape, doodles, stains) ---------- */
export const HORIZON = 1180; // sketched hill line; characters stand at ~1520-1650
import { gDraw, Stroke } from "./draw5";
const sk = (pts: [number, number][], w = 6): Stroke => ({ pts: dense(pts), w });
const dense = (p: [number, number][], step = 12): [number, number][] => { const o: [number, number][] = []; for (let i = 0; i < p.length - 1; i++) { const [a, b] = [p[i], p[i + 1]]; const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step)); for (let k = 0; k < n; k++) o.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]); } o.push(p[p.length - 1]); return o; };
const circ = (cx: number, cy: number, rx: number, ry: number, a0 = 0, a1 = TAU, n = 28): [number, number][] => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + (a1 - a0) * i / n; return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry] as [number, number]; });
export const sketchCloud = (x: number, y: number, s: number): Stroke[] => [sk([...circ(x - 60 * s, y, 50 * s, 38 * s, Math.PI * 0.5, Math.PI * 1.5, 12), ...circ(x, y - 30 * s, 60 * s, 48 * s, Math.PI, TAU, 14), ...circ(x + 70 * s, y, 52 * s, 40 * s, Math.PI * 1.5, Math.PI * 2.5, 12)], 5), sk([[x - 60 * s, y + 38 * s], [x + 70 * s, y + 40 * s]], 5)];
export const sketchTree = (x: number, y: number, s: number): Stroke[] => [sk([[x - 14 * s, y], [x - 10 * s, y - 120 * s]], 7), sk([[x + 14 * s, y], [x + 10 * s, y - 120 * s]], 7), sk([[x, y - 90 * s], [x - 40 * s, y - 140 * s]], 5),
  sk([...circ(x, y - 190 * s, 90 * s, 80 * s, 0, TAU, 30).map(([a, b], i) => [a + Math.sin(i * 1.7) * 10 * s, b + Math.cos(i * 2.1) * 8 * s] as [number, number])], 6), sk(circ(x - 30 * s, y - 210 * s, 26 * s, 20 * s, 0, TAU, 12), 4), sk(circ(x + 34 * s, y - 170 * s, 22 * s, 18 * s, 0, TAU, 12), 4)];
const flowerSk = (x: number, y: number, s: number): Stroke[] => [sk([[x, y], [x + 4 * s, y - 50 * s]], 4), ...[0, 1, 2, 3, 4].map((k) => sk(circ(x + 4 * s + Math.cos(k * 1.26) * 12 * s, y - 56 * s + Math.sin(k * 1.26) * 12 * s, 9 * s, 9 * s, 0, TAU, 8), 3)), sk([[x + 2 * s, y - 20 * s], [x + 18 * s, y - 30 * s]], 3)];
const grass = (x: number, y: number, s: number): Stroke[] => [sk([[x - 16 * s, y], [x - 20 * s, y - 30 * s]], 4), sk([[x, y], [x + 2 * s, y - 40 * s]], 4), sk([[x + 16 * s, y], [x + 24 * s, y - 28 * s]], 4)];
const star = (x: number, y: number, r: number): Stroke => sk(Array.from({ length: 11 }, (_, i) => { const a = -Math.PI / 2 + i * Math.PI / 5, rr2 = i % 2 ? r * 0.45 : r; return [x + Math.cos(a) * rr2, y + Math.sin(a) * rr2] as [number, number]; }), 4);
export function paperBG(): HTMLCanvasElement {
  if (cache.paper) return cache.paper;
  const cv = document.createElement("canvas"); cv.width = WW; cv.height = WH; const c = cv.getContext("2d")!; c.lineJoin = "round"; c.lineCap = "round";
  // warm paper + fibres + subtle ruled lines + margin
  c.fillStyle = lg(c, 0, 0, 0, WH, [[0, "#f3e9d4"], [0.5, "#f8f0de"], [1, "#f1e4c8"]]); c.fillRect(0, 0, WW, WH);
  for (let i = 0; i < 1400; i++) { c.fillStyle = `rgba(${140 + rnd(i) * 40},${110 + rnd(i) * 30},80,${0.04 + rnd(i + 1) * 0.05})`; c.fillRect(rnd(i * 3) * WW, rnd(i * 7) * WH, 1 + rnd(i) * 4, 1); }
  c.strokeStyle = "rgba(90,140,220,0.16)"; c.lineWidth = 2.5; for (let y = 60; y < WH; y += 64) { c.beginPath(); c.moveTo(0, y); c.lineTo(WW, y); c.stroke(); }
  c.strokeStyle = "rgba(230,70,90,0.25)"; c.lineWidth = 3; c.beginPath(); c.moveTo(96, 0); c.lineTo(96, WH); c.stroke();
  // coffee stains + eraser smudges
  for (const [x, y, r] of [[930, 330, 120], [180, 1880, 90]] as [number, number, number][]) { c.save(); c.beginPath(); c.arc(x, y, r, 0, TAU); c.lineWidth = 14; c.strokeStyle = "rgba(150,95,40,0.22)"; c.stroke(); c.beginPath(); c.arc(x + 6, y - 4, r - 10, 0.3, 4.6); c.lineWidth = 5; c.strokeStyle = "rgba(130,80,30,0.25)"; c.stroke(); const g = c.createRadialGradient(x, y, 2, x, y, r); g.addColorStop(0, "rgba(180,120,60,0.06)"); g.addColorStop(1, "rgba(180,120,60,0.12)"); c.fillStyle = g; c.fill(); c.restore(); }
  for (const [x, y, w] of [[620, 1000, 160], [300, 1320, 140], [880, 1700, 150], [520, 1820, 120]] as [number, number, number][]) { const g = c.createRadialGradient(x, y, 4, x, y, w); g.addColorStop(0, "rgba(130,130,140,0.16)"); g.addColorStop(1, "rgba(130,130,140,0)"); c.fillStyle = g; c.save(); c.translate(x, y); c.scale(1, 0.45); c.beginPath(); c.arc(0, 0, w, 0, TAU); c.restore(); c.fill(); for (let k = 0; k < 6; k++) { c.strokeStyle = "rgba(120,120,130,0.12)"; c.lineWidth = 3; c.beginPath(); c.moveTo(x - w * 0.6, y - 20 + k * 8); c.lineTo(x + w * 0.6, y - 26 + k * 8); c.stroke(); } }
  // sketched sky: sun, clouds, birds
  const st: Stroke[] = [sk(circ(250, 260, 70, 70, 0, TAU, 30), 6), ...Array.from({ length: 10 }, (_, k) => { const a = k * TAU / 10; return sk([[250 + Math.cos(a) * 95, 260 + Math.sin(a) * 95], [250 + Math.cos(a) * 140, 260 + Math.sin(a) * 140]], 5); }),
    ...sketchCloud(640, 330, 1.1), ...sketchCloud(860, 620, 0.9), ...sketchCloud(330, 640, 0.8), ...sketchCloud(760, 140, 0.6),
    ...[[480, 480], [540, 450], [600, 500]].map(([x, y]) => sk([[x - 20, y - 8], [x, y], [x + 20, y - 8]], 4)),
    // hills + far trees + ground line
    sk([[0, 1180], [140, 1120], [300, 1150], [460, 1090], [640, 1140], [820, 1080], [1080, 1150]], 6), sk([[0, 1250], [200, 1230], [520, 1260], [800, 1240], [1080, 1260]], 5),
    ...sketchTree(120, 1230, 0.9), ...sketchTree(980, 1240, 1.0), ...sketchTree(860, 1130, 0.5), ...sketchTree(230, 1150, 0.45),
    // foreground: flowers, grass, pebbles, mushrooms, signpost
    ...flowerSk(160, 1760, 1.2), ...flowerSk(960, 1800, 1.1), ...flowerSk(620, 1880, 1.0), ...grass(420, 1700, 1.2), ...grass(880, 1600, 1.1), ...grass(220, 1560, 1), ...grass(680, 1760, 1),
    sk(circ(360, 1860, 28, 14), 4), sk(circ(820, 1880, 22, 11), 4), sk([[1000, 1560], [1000, 1460]], 6), sk([[960, 1470], [1060, 1470], [1074, 1490], [1060, 1510], [960, 1510], [960, 1470]], 5),
    sk([...circ(150, 1450, 40, 30, Math.PI, TAU, 12), [190, 1450], [110, 1450]], 4), sk([[140, 1450], [140, 1490], [160, 1490], [160, 1450]], 4),
    // margin doodles
    star(48, 260, 26), star(52, 900, 20), sk(Array.from({ length: 30 }, (_, k) => { const a = k * 0.55, r = 3 + k * 1.1; return [48 + Math.cos(a) * r, 560 + Math.sin(a) * r] as [number, number]; }), 3),
    sk([[30, 1300], [70, 1300], [60, 1288], [70, 1300], [60, 1312]], 4), sk([[48, 1600], [30, 1580], [48, 1560], [66, 1580], [48, 1600]], 4), star(48, 1780, 18)];
  gDraw(c, st, { seed: 41 });
  c.save(); c.font = "900 30px Comic Sans MS, Inter"; c.fillStyle = "rgba(70,70,80,0.8)"; c.textAlign = "center"; c.fillText("KINGDOM", 1010, 1500); c.restore();
  // soft warm vignette
  const v = c.createRadialGradient(WW / 2, WH * 0.55, WH * 0.3, WW / 2, WH * 0.55, WH * 0.85); v.addColorStop(0, "rgba(120,80,30,0)"); v.addColorStop(1, "rgba(120,80,30,0.28)"); c.fillStyle = v; c.fillRect(0, 0, WW, WH);
  cache.paper = cv; return cv;
}
