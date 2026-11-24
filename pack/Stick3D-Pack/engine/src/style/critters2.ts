// v18 HD STORYBOOK ANIMALS (vector canvas, drawn at >= 2x their on-screen size): wolf on its rock, owl on a branch, crab, fish, coral, "?" pop.
// Same line style as Stickman: #1A1A1A outline, soft top-left shading, full colour, fully opaque. Coordinates are in a fixed design space
// scaled to the canvas, so any resolution is crisp.
const INK = "#1A1A1A";
type C2 = CanvasRenderingContext2D;
const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const ln = (c: C2, w: number, col = INK) => { c.lineWidth = w; c.strokeStyle = col; c.lineJoin = "round"; c.lineCap = "round"; c.stroke(); };
const fl = (c: C2, f: string | CanvasGradient, w = 8) => { c.fillStyle = f; c.fill(); if (w > 0) ln(c, w); };
const rg = (c: C2, x: number, y: number, r: number, a: string, b: string) => { const g = c.createRadialGradient(x - r * 0.45, y - r * 0.5, r * 0.08, x, y, r * 1.15); g.addColorStop(0, a); g.addColorStop(1, b); return g; };
const lg = (c: C2, x0: number, y0: number, x1: number, y1: number, stops: [number, string][]) => { const g = c.createLinearGradient(x0, y0, x1, y1); for (const [o, s] of stops) g.addColorStop(o, s); return g; };
function eye(c: C2, x: number, y: number, r: number, lx: number, ly: number, shut: number, iris = "#2a1608", white = "#fff") {
  if (shut > 0.6) { c.beginPath(); c.arc(x, y - r * 0.1, r * 0.85, 0.15 * Math.PI, 0.85 * Math.PI); ln(c, r * 0.16); return; }
  c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); fl(c, white, r * 0.14);
  c.save(); c.beginPath(); c.arc(x, y, r * 0.93, 0, Math.PI * 2); c.clip();
  c.beginPath(); c.arc(x + lx * r * 0.32, y + ly * r * 0.28, r * 0.6, 0, Math.PI * 2); c.fillStyle = iris; c.fill();
  c.beginPath(); c.arc(x + lx * r * 0.32, y + ly * r * 0.28, r * 0.36, 0, Math.PI * 2); c.fillStyle = INK; c.fill();
  c.beginPath(); c.arc(x + lx * r * 0.32 - r * 0.22, y + ly * r * 0.28 - r * 0.22, r * 0.17, 0, Math.PI * 2); c.fillStyle = "#fff"; c.fill();
  if (shut > 0) { c.fillStyle = "#3a3a3a"; c.fillRect(x - r, y - r, r * 2, r * 2 * shut); }
  c.restore();
}
/* fur tufts along a polyline: short curved strokes */
function fur(c: C2, pts: [number, number][], col: string, len: number, w: number, seed: number) {
  for (let i = 0; i < pts.length - 1; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], n = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) / (len * 0.55)));
    for (let j = 0; j < n; j++) { const u = j / n, x = x0 + (x1 - x0) * u, y = y0 + (y1 - y0) * u, nx = -(y1 - y0), ny = x1 - x0, nn = Math.hypot(nx, ny) || 1, L = len * (0.7 + rnd(seed + i * 31 + j) * 0.6);
      c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + (nx / nn) * L * 0.5 + (x1 - x0) / nn * L * 0.3, y + (ny / nn) * L * 0.5 + (y1 - y0) / nn * L * 0.3, x + (nx / nn) * L * 0.2 + (x1 - x0) / nn * L * 0.9, y + (ny / nn) * L * 0.2 + (y1 - y0) / nn * L * 0.9); ln(c, w, col); } }
}

export type AnimalPose = { t: number; blink?: boolean; howl?: number; walk?: number; turn?: number; tilt?: number; ruffle?: number; ear?: number; flip?: boolean; look?: number; claw?: number; mouth?: number; wing?: number };

/* ================= WOLF standing on its rock (design 800 x 760), side view facing right; howl raises the head ================= */
export function drawWolf2(c: C2, W: number, H: number, p: AnimalPose) {
  c.clearRect(0, 0, W, H); c.save(); c.scale(W / 800, H / 760); if (p.flip) { c.translate(800, 0); c.scale(-1, 1); }
  const hw = p.howl ?? 0, wk = p.walk ?? 0, t = p.t;
  // rock
  c.beginPath(); c.moveTo(40, 760); c.lineTo(90, 640); c.quadraticCurveTo(150, 600, 300, 598); c.quadraticCurveTo(520, 590, 650, 612); c.quadraticCurveTo(730, 630, 770, 700); c.lineTo(790, 760); c.closePath();
  fl(c, lg(c, 0, 590, 0, 760, [[0, "#8a90a6"], [0.5, "#646a82"], [1, "#3f4458"]]), 10);
  for (const [x0, y0, x1, y1] of [[150, 650, 260, 630], [420, 640, 560, 628], [300, 700, 380, 690], [600, 690, 690, 700]]) { c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo((x0 + x1) / 2, y0 - 14, x1, y1); ln(c, 5, "rgba(26,26,26,0.55)"); }
  c.beginPath(); c.moveTo(110, 628); c.quadraticCurveTo(300, 596, 560, 600); ln(c, 6, "rgba(220,228,255,0.6)"); // rim light on the rock top
  for (let i = 0; i < 14; i++) { c.beginPath(); c.ellipse(120 + rnd(i) * 560, 650 + rnd(i * 3) * 90, 10 + rnd(i * 5) * 16, 5 + rnd(i * 7) * 6, 0, 0, Math.PI * 2); c.fillStyle = i % 3 ? "rgba(40,44,60,0.35)" : "rgba(140,190,120,0.55)"; c.fill(); } // pits + moss
  const fur1 = "#a39784", furD = "#5e5548", furDD = "#3c352c", cream = "#f2e8d4"; // timber wolf: warm grey-brown, dark saddle, cream chest
  // tail (bushy)
  c.beginPath(); c.moveTo(205, 420); c.bezierCurveTo(120, 430 + Math.sin(t * 2) * 6, 70, 520, 110, 585); c.bezierCurveTo(140, 560, 175, 520, 215, 470); c.closePath(); fl(c, lg(c, 80, 420, 200, 590, [[0, furD], [0.75, fur1], [1, cream]]), 9);
  fur(c, [[200, 425], [140, 450], [100, 520], [108, 580]], furDD, 24, 4, 3);
  // far legs (darker)
  const leg = (x: number, ph: number, back: boolean, far: boolean) => { const sw = Math.sin(wk * 6.28 + ph) * 16, lift = Math.max(0, Math.sin(wk * 6.28 + ph)) * 14;
    c.beginPath(); if (back) { c.moveTo(x - 34, 420); c.quadraticCurveTo(x - 50, 500, x - 6 + sw * 0.4, 530); c.lineTo(x + sw, 596 - lift); c.lineTo(x + 26 + sw, 598 - lift); c.lineTo(x + 18 + sw * 0.6, 520); c.quadraticCurveTo(x + 30, 470, x + 30, 430); }
    else { c.moveTo(x - 20, 440); c.lineTo(x - 18 + sw, 596 - lift); c.lineTo(x + 18 + sw, 598 - lift); c.lineTo(x + 22, 440); }
    c.closePath(); fl(c, far ? furD : lg(c, x - 40, 420, x + 30, 600, [[0, fur1], [0.7, "#b89a74"], [1, furD]]), 8);
    c.beginPath(); c.ellipse(x + 6 + sw, 597 - lift, 30, 12, 0, 0, Math.PI * 2); fl(c, far ? furDD : "#4a5064", 7); };
  leg(250, 1.6, true, true); leg(510, 0, false, true);
  // body
  c.beginPath(); c.moveTo(540, 360); c.bezierCurveTo(470, 318, 330, 322, 240, 350); c.bezierCurveTo(170, 372, 160, 450, 215, 478); c.bezierCurveTo(300, 500, 420, 492, 520, 470); c.bezierCurveTo(575, 455, 590, 400, 540, 360); c.closePath();
  fl(c, rg(c, 360, 380, 220, "#c8bca6", fur1), 10);
  c.beginPath(); c.moveTo(300, 338); c.bezierCurveTo(380, 322, 470, 326, 530, 356); c.bezierCurveTo(450, 350, 370, 352, 300, 372); c.closePath(); c.fillStyle = furD; c.fill(); // dark saddle
  c.beginPath(); c.moveTo(300, 486); c.quadraticCurveTo(420, 500, 520, 468); c.quadraticCurveTo(430, 480, 320, 470); c.closePath(); c.fillStyle = cream; c.fill(); // belly
  fur(c, [[250, 352], [340, 332], [440, 330], [520, 350]], furDD, 26, 4.5, 11); fur(c, [[230, 470], [320, 488], [420, 486]], "rgba(60,66,84,0.7)", 18, 3.5, 17);
  c.beginPath(); c.moveTo(260, 344); c.bezierCurveTo(360, 318, 470, 322, 535, 352); ln(c, 6, "rgba(225,235,255,0.75)"); // rim light on the back
  // near legs
  leg(215, 3.2, true, false); leg(470, 1.6, false, false);
  // neck + head (rotates up when howling)
  c.save(); c.translate(540, 380); c.rotate(-0.85 * hw + (p.tilt ?? 0) + Math.sin(t * 1.1) * 0.015);
  c.beginPath(); c.moveTo(-40, 10); c.bezierCurveTo(-20, -80, 30, -110, 70, -110); c.lineTo(80, -40); c.bezierCurveTo(70, 10, 40, 60, 0, 80); c.closePath(); fl(c, rg(c, 20, -40, 110, "#cdbfa6", fur1), 9);
  c.beginPath(); c.moveTo(20, -40); c.bezierCurveTo(60, -20, 60, 40, 10, 74); c.bezierCurveTo(0, 30, 0, -10, 20, -40); c.closePath(); c.fillStyle = cream; c.fill(); // chest ruff
  fur(c, [[-30, 20], [-10, -60], [40, -100]], furDD, 22, 4, 23); fur(c, [[30, -20], [40, 30], [15, 70]], "rgba(120,110,90,0.6)", 16, 3, 29);
  c.save(); c.translate(80, -130); const tn = p.turn ?? 0; c.scale(1 - 0.12 * Math.abs(tn), 1);
  const er = p.ear ?? 0;
  for (const s of [-1, 1]) { c.save(); c.translate(-22 + s * 26, -54); c.rotate(-0.15 + (s > 0 ? er * 0.4 : 0)); c.beginPath(); c.moveTo(-26, 10); c.quadraticCurveTo(-14, -60, 4, -86); c.quadraticCurveTo(20, -50, 28, 8); c.closePath(); fl(c, s < 0 ? furD : rg(c, 0, -30, 50, "#b8a88e", furD), 8);
    c.beginPath(); c.moveTo(-12, 0); c.quadraticCurveTo(-4, -44, 4, -62); c.quadraticCurveTo(12, -36, 14, 0); c.closePath(); c.fillStyle = "#d8a6a0"; c.fill(); c.restore(); }
  c.beginPath(); c.ellipse(0, 0, 78, 66, 0, 0, Math.PI * 2); fl(c, rg(c, 0, 0, 80, "#d2c6ae", fur1), 9); // skull
  c.beginPath(); c.moveTo(-60, -20); c.quadraticCurveTo(-20, -56, 30, -50); c.quadraticCurveTo(-10, -30, -60, -20); c.fillStyle = furD; c.fill(); // brow mask
  const mo = Math.max(hw, p.mouth ?? 0);
  c.beginPath(); c.moveTo(30, -18); c.bezierCurveTo(100, -24, 140, -6, 150, 14); c.bezierCurveTo(140, 30, 90, 34, 40, 36); c.closePath(); fl(c, rg(c, 80, 0, 70, "#f6eedc", "#d8c8a8"), 8); // snout (upper)
  if (mo > 0.15) { c.beginPath(); c.moveTo(48, 36); c.quadraticCurveTo(110, 40 + 46 * mo, 140, 24 + 20 * mo); c.quadraticCurveTo(110, 30, 48, 36); fl(c, "#4a1a2a", 7); c.beginPath(); c.moveTo(60, 42 + 6 * mo); c.quadraticCurveTo(110, 48 + 36 * mo, 132, 30 + 16 * mo); fl(c, "#c2c8d6", 7); } // open jaw
  else { c.beginPath(); c.moveTo(60, 38); c.quadraticCurveTo(100, 46, 138, 26); ln(c, 6); }
  c.beginPath(); c.ellipse(150, 10, 17, 13, 0.3, 0, Math.PI * 2); fl(c, INK, 4); c.beginPath(); c.arc(146, 5, 5, 0, Math.PI * 2); c.fillStyle = "#777"; c.fill(); // nose
  for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(100 + i * 12, 14 + i * 2, 2.6, 0, Math.PI * 2); c.fillStyle = INK; c.fill(); }
  eye(c, 6 + tn * 14, -18, 22, (p.look ?? 0.4) + tn * 0.8, -0.1, (p.blink ? 1 : 0) + (hw > 0.55 ? 1 : 0), "#d9a227", "#fff8e0");
  fur(c, [[-74, 10], [-60, 50], [-20, 66]], furDD, 18, 3.5, 41);
  c.restore(); c.restore();
  c.restore();
}

/* ================= OWL on a branch (design 600 x 760): feather rows, wings with primaries, face disc, head swivel ================= */
export function drawOwl2(c: C2, W: number, H: number, p: AnimalPose) {
  c.clearRect(0, 0, W, H); c.save(); c.scale(W / 600, H / 760); const t = p.t, rf = p.ruffle ?? 0, tn = Math.max(-1, Math.min(1, p.turn ?? 0)), tl = p.tilt ?? 0;
  // branch with bark + leaves
  c.beginPath(); c.moveTo(40, 672); c.bezierCurveTo(200, 632, 420, 640, 620, 610); c.lineTo(620, 680); c.bezierCurveTo(420, 700, 200, 694, 40, 680); c.closePath(); fl(c, lg(c, 0, 620, 0, 710, [[0, "#9a6a42"], [1, "#5e3c22"]]), 9);
  for (let i = 0; i < 9; i++) { const x = 20 + i * 66; c.beginPath(); c.moveTo(x, 654 - i * 2); c.quadraticCurveTo(x + 30, 664, x + 50, 656 - i * 2); ln(c, 4, "rgba(40,22,10,0.6)"); }
  for (const [x, y, a] of [[40, 640, -0.6], [560, 606, 0.7], [520, 690, 2.4]] as [number, number, number][]) { c.save(); c.translate(x, y); c.rotate(a + Math.sin(t * 1.3 + x) * 0.06); c.beginPath(); c.ellipse(0, -40, 22, 44, 0, 0, Math.PI * 2); fl(c, rg(c, 0, -40, 44, "#5fae5a", "#2f7a3a"), 6); c.beginPath(); c.moveTo(0, -4); c.lineTo(0, -78); ln(c, 3, "rgba(20,60,20,0.7)"); c.restore(); }
  c.save(); c.translate(300, 430); c.scale(1 + 0.05 * rf * (1 + Math.sin(t * 9)) / 2, 1 - 0.03 * rf);
  // body
  c.beginPath(); c.ellipse(0, 40, 168, 200, 0, 0, Math.PI * 2); fl(c, rg(c, 0, 20, 190, "#c99766", "#7b5232"), 10);
  c.save(); c.beginPath(); c.ellipse(0, 70, 112, 150, 0, 0, Math.PI * 2); c.fillStyle = lg(c, 0, -60, 0, 220, [[0, "#f4e2c0"], [1, "#e2c596"]]); c.fill(); c.clip();
  for (let r = 0; r < 7; r++) for (let i = 0; i < 6; i++) { const x = -110 + i * 44 + (r % 2) * 22, y = -40 + r * 36; c.beginPath(); c.moveTo(x - 12, y); c.quadraticCurveTo(x, y + 14, x + 12, y); ln(c, 4.5, "#8a5e38"); } // chest bars
  c.restore();
  // wings with primary feathers
  for (const s of [-1, 1]) { const wg = (p.wing ?? 0) * 0.5; c.save(); c.translate(s * 150, -10); c.rotate(s * (0.12 + wg + rf * 0.08 * Math.sin(t * 7))); c.beginPath(); c.moveTo(0, -60); c.bezierCurveTo(s * 70, -20, s * 66, 160, s * 10, 250); c.bezierCurveTo(-s * 30, 180, -s * 40, 40, 0, -60); c.closePath(); fl(c, rg(c, 0, 60, 160, "#a8774c", "#6a4428"), 9);
    for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(s * (4 + i * 8), 40 + i * 30); c.quadraticCurveTo(s * (40 - i * 2), 90 + i * 34, s * (14 + i * 4), 150 + i * 22); ln(c, 4, "#4a2e18"); }
    for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(s * (14 + (i % 2) * 18), -10 + i * 24, 7, 0, Math.PI * 2); c.fillStyle = "#f0dcb8"; c.fill(); } c.restore(); }
  if (rf > 0.05) for (let i = 0; i < 14; i++) { const a = -2.4 + i * 0.35, r = 190 + 14 * Math.sin(t * 8 + i); c.beginPath(); c.moveTo(Math.cos(a) * r * 0.86, 40 + Math.sin(a) * r * 0.98); c.lineTo(Math.cos(a) * (r + 22 * rf), 40 + Math.sin(a) * (r + 22 * rf)); ln(c, 5, "#6a4428"); }
  // talons on the branch
  for (const s of [-1, 1]) for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(s * 44 + i * 14, 226); c.quadraticCurveTo(s * 44 + i * 18, 246, s * 44 + i * 22, 250); ln(c, 11, "#e8a23a"); c.beginPath(); c.moveTo(s * 44 + i * 14, 226); c.quadraticCurveTo(s * 44 + i * 18, 246, s * 44 + i * 22, 250); ln(c, 5, "#f6c060"); }
  // head (swivels: features slide + squash, back-of-head shading on the far side)
  c.save(); c.translate(tn * 26, -150); c.rotate(tl + Math.sin(t * 0.7) * 0.02);
  c.beginPath(); c.moveTo(-150, -30); c.lineTo(-138 + tn * 20, -168); c.lineTo(-70 + tn * 30, -112); c.quadraticCurveTo(tn * 40, -128, 70 + tn * 30, -112); c.lineTo(138 + tn * 20, -168); c.lineTo(150, -30); c.quadraticCurveTo(172, 110, 0, 122); c.quadraticCurveTo(-172, 110, -150, -30); c.closePath();
  fl(c, rg(c, 0, -20, 160, "#d4a272", "#86593a"), 10);
  for (let i = 0; i < 10; i++) { const x = -120 + i * 27, y = -96 + Math.abs(i - 4.5) * 6; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 6, y + 16); ln(c, 4, "#6a4428"); } // crown flecks
  const fx = tn * 46, sq = 1 - 0.22 * Math.abs(tn);
  c.save(); c.translate(fx, 0); c.scale(sq, 1);
  for (const s of [-1, 1]) { c.beginPath(); c.arc(s * 64, -14, 74, 0, Math.PI * 2); fl(c, rg(c, s * 64, -14, 74, "#fbf0da", "#e6cfa6"), 0); for (let k = 0; k < 14; k++) { const a = k / 14 * Math.PI * 2; c.beginPath(); c.moveTo(s * 64 + Math.cos(a) * 52, -14 + Math.sin(a) * 52); c.lineTo(s * 64 + Math.cos(a) * 70, -14 + Math.sin(a) * 70); ln(c, 3, "rgba(150,110,70,0.5)"); }
    c.beginPath(); c.arc(s * 64, -14, 74, 0, Math.PI * 2); ln(c, 6, "#8a5e38");
    eye(c, s * 64, -14, 48, (p.look ?? 0) + tn * 0.7, 0.05, p.blink ? 1 : 0, "#f0a020", "#fff3c0"); }
  c.beginPath(); c.moveTo(-18, 30); c.quadraticCurveTo(0, 22, 18, 30); c.lineTo(0, 80); c.closePath(); fl(c, lg(c, 0, 22, 0, 80, [[0, "#f6c060"], [1, "#c98420"]]), 6); // beak
  c.restore();
  if (Math.abs(tn) > 0.05) { c.beginPath(); c.ellipse(-Math.sign(tn) * 120, 0, 40 * Math.abs(tn), 110, 0, 0, Math.PI * 2); c.fillStyle = `rgba(90,58,34,${0.5 * Math.abs(tn)})`; c.fill(); } // far side of the head
  c.restore(); c.restore(); c.restore();
}

/* ================= CRAB (design 640 x 440): segmented legs, pincers that snap, eyestalks ================= */
export function drawCrab2(c: C2, W: number, H: number, p: AnimalPose) {
  c.clearRect(0, 0, W, H); c.save(); c.scale(W / 640, H / 440); const ph = p.walk ?? 0, t = p.t, cl = p.claw ?? 0.3, red = "#ef5a3a", redD = "#b23a22", redL = "#ff9a72";
  for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { const a = Math.sin(ph * 6.28 + i * 1.6 + (s > 0 ? 0.8 : 0)) * 14, x0 = 320 + s * (78 + i * 20), y0 = 300, x1 = 320 + s * (150 + i * 30), y1 = 300 + a - 30 + i * 6, x2 = 320 + s * (176 + i * 34), y2 = 420 + a * 0.6;
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.lineTo(x2, y2); ln(c, 22); c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.lineTo(x2, y2); ln(c, 12, i % 2 ? redD : red); c.beginPath(); c.arc(x1, y1, 7, 0, Math.PI * 2); c.fillStyle = redL; c.fill(); }
  for (const s of [-1, 1]) { const up = 0.35 + 0.5 * (p.tilt ?? 0) + Math.sin(t * 1.7 + s) * 0.06; c.save(); c.translate(320 + s * 140, 250); c.rotate(s * (-0.7 - up));
    c.beginPath(); c.roundRect(-16, -96, 32, 100, 14); fl(c, lg(c, -16, -96, 16, 0, [[0, redL], [1, red]]), 8); c.translate(0, -122);
    const o = 0.25 + 0.45 * cl * (0.5 + 0.5 * Math.sin(t * 9 + s)); c.beginPath(); c.ellipse(0, 10, 50, 40, 0, 0, Math.PI * 2); fl(c, rg(c, 0, 10, 50, redL, red), 8);
    c.save(); c.rotate(-o); c.beginPath(); c.moveTo(-10, -18); c.quadraticCurveTo(-30, -70, -6, -96); c.quadraticCurveTo(12, -60, 12, -20); c.closePath(); fl(c, rg(c, 0, -60, 40, redL, red), 7); c.restore();
    c.save(); c.rotate(o * 0.6); c.beginPath(); c.moveTo(6, -18); c.quadraticCurveTo(30, -60, 20, -84); c.quadraticCurveTo(2, -56, -4, -20); c.closePath(); fl(c, rg(c, 10, -50, 36, redL, redD), 7); c.restore(); c.restore(); }
  c.beginPath(); c.moveTo(170, 290); c.bezierCurveTo(170, 180, 470, 180, 470, 290); c.bezierCurveTo(470, 350, 170, 350, 170, 290); c.closePath(); fl(c, rg(c, 320, 270, 160, "#ff8a62", red), 10); // shell
  for (let i = 0; i < 9; i++) { c.beginPath(); c.arc(220 + rnd(i) * 200, 240 + rnd(i * 3) * 60, 5 + rnd(i * 5) * 9, 0, Math.PI * 2); c.fillStyle = i % 2 ? "rgba(255,210,180,0.7)" : "rgba(160,40,20,0.45)"; c.fill(); }
  c.beginPath(); c.moveTo(200, 250); c.quadraticCurveTo(320, 196, 440, 250); ln(c, 7, "rgba(255,225,200,0.8)");
  for (const s of [-1, 1]) { const sw = Math.sin(t * 2.3 + s) * 6; c.beginPath(); c.moveTo(320 + s * 34, 214); c.lineTo(320 + s * 44 + sw, 140); ln(c, 12); c.beginPath(); c.moveTo(320 + s * 34, 214); c.lineTo(320 + s * 44 + sw, 140); ln(c, 6, red);
    eye(c, 320 + s * 44 + sw, 126, 26, p.look ?? 0, 0, p.blink ? 1 : 0, INK, "#fff"); }
  const m = p.mouth ?? 0; c.beginPath(); c.moveTo(290, 300); c.quadraticCurveTo(320, 300 + 16 - 28 * m, 350, 300); ln(c, 7);
  c.restore();
}

/* ================= FISH (design 320 x 160), glowing edge for the moonlit spawn ================= */
export function drawFish(c: C2, W: number, H: number, p: AnimalPose & { hue?: number }) {
  c.clearRect(0, 0, W, H); c.save(); c.scale(W / 320, H / 160); if (p.flip) { c.translate(320, 0); c.scale(-1, 1); }
  const sw = Math.sin(p.t * 14) * 12, cols = [["#7fe6ff", "#2f8fd8"], ["#ffcf6a", "#f07a2a"], ["#c3a8ff", "#7a4ae0"]][Math.abs(Math.round(p.hue ?? 0)) % 3];
  c.beginPath(); c.moveTo(70, 80); c.lineTo(14, 40 + sw); c.quadraticCurveTo(30, 80, 14, 120 + sw); c.closePath(); fl(c, cols[1], 6);
  c.beginPath(); c.moveTo(60, 80); c.bezierCurveTo(100, 22, 240, 24, 290, 80); c.bezierCurveTo(240, 136, 100, 138, 60, 80); c.closePath(); fl(c, lg(c, 0, 30, 0, 130, [[0, cols[0]], [1, cols[1]]]), 7);
  for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(130 + i * 34, 46); c.quadraticCurveTo(140 + i * 34, 80, 130 + i * 34, 114); ln(c, 4, "rgba(255,255,255,0.45)"); }
  c.beginPath(); c.moveTo(150, 40); c.quadraticCurveTo(180, 8, 220, 36); ln(c, 6); eye(c, 250, 70, 16, 0.3, 0, 0, INK, "#fff");
  c.restore();
}
/* ================= CORAL cluster (design 640 x 520): branching + fan + glowing polyp tips ================= */
export function drawCoral(c: C2, W: number, H: number, p: AnimalPose & { glow?: number }) {
  c.clearRect(0, 0, W, H); c.save(); c.scale(W / 640, H / 520); const g = p.glow ?? 0.6, t = p.t;
  c.beginPath(); c.ellipse(320, 500, 300, 40, 0, 0, Math.PI * 2); fl(c, lg(c, 0, 460, 0, 540, [[0, "#6a6f8a"], [1, "#3c4058"]]), 8);
  c.save(); c.translate(470, 470); c.rotate(Math.sin(t * 0.9) * 0.04); c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(-150, -120, -60, -330, 40, -330); c.bezierCurveTo(150, -320, 160, -120, 0, 0); c.closePath(); fl(c, rg(c, 20, -200, 180, "#c58cff", "#6a3ab8"), 8);
  for (let i = 0; i < 9; i++) { c.beginPath(); c.moveTo(0, -4); c.quadraticCurveTo(-90 + i * 24, -160, -80 + i * 22, -300 + Math.abs(i - 4) * 16); ln(c, 3.5, "rgba(60,20,110,0.6)"); } c.restore();
  const branch = (x: number, y: number, a: number, L: number, d: number, col: string): void => { const x1 = x + Math.sin(a) * L, y1 = y - Math.cos(a) * L; c.beginPath(); c.moveTo(x, y); c.lineTo(x1, y1); ln(c, 30 - d * 7); c.beginPath(); c.moveTo(x, y); c.lineTo(x1, y1); ln(c, 20 - d * 6, col);
    if (d < 3) { branch(x1, y1, a - 0.45 + Math.sin(t * 0.8 + d) * 0.03, L * 0.72, d + 1, col); branch(x1, y1, a + 0.4, L * 0.7, d + 1, col); }
    else { const k = g * (0.6 + 0.4 * Math.sin(t * 3 + x * 0.05)); c.beginPath(); c.arc(x1, y1, 16, 0, Math.PI * 2); c.fillStyle = `rgba(255,${200 + 40 * k},${220},${0.35 * k})`; c.fill(); c.beginPath(); c.arc(x1, y1, 8, 0, Math.PI * 2); c.fillStyle = "#fff0fa"; c.fill(); } };
  branch(200, 480, -0.15, 130, 0, "#ff7aa8"); branch(330, 486, 0.2, 110, 0, "#ff9f5a");
  for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(80 + i * 26, 470 - (i % 2) * 18, 20, 0, Math.PI * 2); fl(c, rg(c, 80 + i * 26, 470, 22, "#7ff0d0", "#2aa08a"), 6); }
  c.restore();
}
/* "?" pop (design 200 x 260): yellow with ink outline, pops with overshoot then bobs */
export function drawQ(c: C2, W: number, H: number, k: number, t: number) {
  c.clearRect(0, 0, W, H); if (k <= 0.01) return; c.save(); c.scale(W / 200, H / 260); c.translate(100, 200 - Math.sin(t * 5) * 8); c.scale(k, k); c.rotate(Math.sin(t * 3) * 0.12);
  c.font = "900 220px Inter, Arial"; c.textAlign = "center"; c.lineJoin = "round"; c.lineWidth = 26; c.strokeStyle = INK; c.strokeText("?", 0, 0); c.fillStyle = "#ffd23a"; c.fillText("?", 0, 0);
  c.lineWidth = 6; c.strokeStyle = "rgba(255,255,255,0.7)"; c.beginPath(); c.moveTo(-40, -130); c.quadraticCurveTo(-20, -160, 20, -158); c.stroke(); c.restore();
}

/* ================= DUCK (design 600 x 560), side view facing right — EP10. walk = waddle phase, tilt = peck (0 up .. 1 beak to the ground),
   mouth = quack (beak open), wing = flap, look = pupil x, flip = facing left. White farm duck, orange beak + feet. ================= */
export function drawDuck(c: C2, W: number, H: number, p: AnimalPose) {
  c.clearRect(0, 0, W, H); c.save(); c.scale(W / 600, H / 560); if (p.flip) { c.translate(600, 0); c.scale(-1, 1); }
  const ph = (p.walk ?? 0) * Math.PI * 2, pk = Math.max(0, Math.min(1, p.tilt ?? 0)), m = p.mouth ?? 0, wg = p.wing ?? 0, t = p.t;
  const bob = Math.abs(Math.sin(ph)) * -10, rock = Math.sin(ph) * 0.06 + pk * 0.16; // waddle: body rocks side to side, bobs on each step
  const OR = "#ff9a1f", ORD = "#d86a0a", ORL = "#ffc46a", WH = "#ffffff", WS = "#d9dce8";
  // feet (behind the body), alternate lift
  for (const s of [0, 1]) { const lift = Math.max(0, Math.sin(ph + s * Math.PI)) * 26, x = 270 + s * 40 + Math.sin(ph + s * Math.PI) * 18;
    c.beginPath(); c.moveTo(x, 440); c.lineTo(x + 4, 520 - lift); ln(c, 22); c.beginPath(); c.moveTo(x, 440); c.lineTo(x + 4, 520 - lift); ln(c, 12, ORD);
    c.beginPath(); c.moveTo(x - 30, 540 - lift); c.quadraticCurveTo(x + 10, 508 - lift, x + 52, 540 - lift); c.quadraticCurveTo(x + 10, 552 - lift, x - 30, 540 - lift); c.closePath(); fl(c, s ? OR : ORD, 7); }
  c.save(); c.translate(300, 470 + bob); c.rotate(rock); c.translate(-300, -470);
  // tail + body
  c.beginPath(); c.moveTo(120, 330); c.quadraticCurveTo(70, 250, 92, 236); c.quadraticCurveTo(150, 280, 190, 300); c.closePath(); fl(c, rg(c, 110, 270, 60, WH, WS), 8);
  c.beginPath(); c.moveTo(110, 330); c.bezierCurveTo(110, 240, 330, 250, 420, 310); c.bezierCurveTo(470, 350, 440, 470, 300, 470); c.bezierCurveTo(170, 470, 110, 420, 110, 330); c.closePath(); fl(c, rg(c, 260, 330, 190, WH, WS), 9);
  c.beginPath(); c.moveTo(160, 430); c.quadraticCurveTo(290, 470, 410, 400); ln(c, 6, "rgba(150,160,190,0.55)"); // belly shade
  // wing (flaps up)
  c.save(); c.translate(320, 330); c.rotate(-0.15 - wg * 0.9 + Math.sin(t * 2) * 0.03);
  c.beginPath(); c.moveTo(10, 0); c.bezierCurveTo(-60, -30, -190, 0, -200, 50); c.bezierCurveTo(-150, 90, -30, 80, 10, 0); c.closePath(); fl(c, rg(c, -80, 20, 120, WH, "#c8cce0"), 8);
  for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(-60 - i * 40, 30 + i * 6); c.quadraticCurveTo(-90 - i * 40, 50, -120 - i * 30, 62); ln(c, 4, "rgba(140,150,180,0.7)"); }
  c.restore();
  // neck + head pivot (peck rotates forward/down)
  c.save(); c.translate(380, 330); c.rotate(pk * 1.05);
  c.beginPath(); c.moveTo(-50, 10); c.quadraticCurveTo(-40, -90, -10, -140); c.lineTo(60, -130); c.quadraticCurveTo(40, -60, 50, 0); c.closePath(); fl(c, WH, 0);
  c.beginPath(); c.moveTo(-50, 10); c.quadraticCurveTo(-40, -90, -10, -140); ln(c, 9); c.beginPath(); c.moveTo(60, -130); c.quadraticCurveTo(40, -60, 50, 0); ln(c, 9);
  c.beginPath(); c.arc(20, -175, 80, 0, Math.PI * 2); fl(c, rg(c, 20, -175, 80, WH, WS), 9); // head
  for (const k of [0, 1]) { const op = k ? m * 26 : 0; // beak: upper (k=0) and lower (k=1, opens)
    c.beginPath(); if (!k) { c.moveTo(80, -190); c.quadraticCurveTo(160, -205, 190, -172); c.quadraticCurveTo(150, -160, 86, -158); } else { c.moveTo(86, -160); c.quadraticCurveTo(150, -150 + op, 180, -158 + op); c.quadraticCurveTo(140, -132 + op, 84, -142); }
    c.closePath(); fl(c, lg(c, 90, -200, 90, -130, [[0, ORL], [1, k ? ORD : OR]]), 7); }
  if (m > 0.2) { c.beginPath(); c.ellipse(120, -160 + m * 10, 26, 8 * m, 0, 0, Math.PI * 2); c.fillStyle = "#7a2a1a"; c.fill(); }
  c.beginPath(); c.arc(118, -186, 3, 0, Math.PI * 2); c.fillStyle = INK; c.fill(); // nostril
  eye(c, 40, -200, 26, 0.4 + (p.look ?? 0), 0.1, p.blink ? 1 : 0);
  c.beginPath(); c.ellipse(-4, -150, 18, 10, 0, 0, Math.PI * 2); c.fillStyle = "rgba(255,170,160,0.55)"; c.fill(); // cheek
  c.beginPath(); c.moveTo(-10, -250); c.quadraticCurveTo(-30, -280, -6, -292); ln(c, 7); c.beginPath(); c.moveTo(4, -252); c.quadraticCurveTo(10, -290, 30, -286); ln(c, 6); // head feather tufts
  c.restore(); c.restore(); c.restore();
}
