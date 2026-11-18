// 2D flat-cartoon props (EP03+): thick ink outlines, soft gradients, same style as the Stickman rig v2.
// All functions draw in the CURRENT canvas transform; sizes in px of that space.
export const INK = "#101018";
export type V2 = [number, number];
const TAU = Math.PI * 2;
export const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const seg = (t: number, a: number, b: number, e: (x: number) => number = (x) => 1 - (1 - x) * (1 - x) * (1 - x)) => e(clamp((t - a) / (b - a)));
export const easeIO = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const easeBack = (x: number) => { const c1 = 2.2, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const ink = (c: CanvasRenderingContext2D, w: number) => { c.lineWidth = w; c.strokeStyle = INK; c.stroke(); };
const lg = (c: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, a: string, b: string) => { const g = c.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, a); g.addColorStop(1, b); return g; };

/* ---------- ROCKET: centred at (0,0) = body centre, nose toward -y; size = body height ---------- */
export function drawRocket(c: CanvasRenderingContext2D, x: number, y: number, size: number, ang = 0, o: { flame?: number; t?: number; gauge?: number; sketch?: number; window?: number; fins?: number; face?: number } = {}) {
  const s = size / 400, t = o.t ?? 0, lw = 9;
  c.save(); c.translate(x, y); c.rotate(ang); c.scale(s, s); c.lineJoin = "round"; c.lineCap = "round";
  // flame
  const fl = o.flame ?? 0;
  if (fl > 0.01) {
    const L = 180 * fl * (0.9 + 0.12 * Math.sin(t * 40) + 0.06 * Math.sin(t * 73));
    for (const [w, col, k] of [[78, "rgba(255,120,30,0.9)", 1], [52, "rgba(255,200,60,0.95)", 0.78], [26, "rgba(255,255,220,1)", 0.5]] as [number, string, number][]) {
      c.beginPath(); c.moveTo(-w / 2, 196); c.quadraticCurveTo(-w * 0.6, 196 + L * k * 0.5, 0, 196 + L * k); c.quadraticCurveTo(w * 0.6, 196 + L * k * 0.5, w / 2, 196); c.closePath(); c.fillStyle = col; c.fill();
    }
  }
  const fins = o.fins ?? 2;
  // fins (behind body)
  const fin = (sx: number) => { c.beginPath(); c.moveTo(sx * 60, 60); c.quadraticCurveTo(sx * 150, 110, sx * 140, 214); c.lineTo(sx * 96, 200); c.quadraticCurveTo(sx * 80, 168, sx * 56, 160); c.closePath(); c.fillStyle = lg(c, sx * 60, 60, sx * 140, 214, "#ff4a44", "#b8161c"); c.fill(); ink(c, lw); };
  if (fins >= 1) fin(-1); if (fins >= 2) fin(1);
  // nozzle
  c.beginPath(); c.moveTo(-44, 168); c.lineTo(44, 168); c.lineTo(58, 206); c.lineTo(-58, 206); c.closePath(); c.fillStyle = lg(c, -58, 0, 58, 0, "#8a90a8", "#4a4e62"); c.fill(); ink(c, lw);
  // body
  const body = () => { c.beginPath(); c.moveTo(0, -200); c.bezierCurveTo(70, -150, 86, -40, 76, 120); c.quadraticCurveTo(70, 176, 0, 178); c.quadraticCurveTo(-70, 176, -76, 120); c.bezierCurveTo(-86, -40, -70, -150, 0, -200); c.closePath(); };
  body(); c.fillStyle = lg(c, -80, 0, 80, 0, "#ffffff", "#c9d2ea"); c.fill();
  c.save(); body(); c.clip();
  c.beginPath(); c.moveTo(-90, -120); c.quadraticCurveTo(0, -150, 90, -120); c.lineTo(90, -260); c.lineTo(-90, -260); c.closePath(); c.fillStyle = lg(c, -80, -200, 80, -120, "#ff4a44", "#c01a20"); c.fill(); // nose cone
  c.beginPath(); c.moveTo(-90, -120); c.quadraticCurveTo(0, -150, 90, -120); ink(c, 6);
  c.fillStyle = "#e5263a"; c.fillRect(-90, 120, 180, 22); c.beginPath(); c.moveTo(-90, 120); c.lineTo(90, 120); c.moveTo(-90, 142); c.lineTo(90, 142); ink(c, 4); // red band
  c.fillStyle = "rgba(255,255,255,0.7)"; c.beginPath(); c.ellipse(-40, -20, 12, 80, 0.05, 0, TAU); c.fill(); // highlight
  c.restore(); body(); ink(c, lw);
  // centre fin
  if (fins >= 3) { c.beginPath(); c.moveTo(-10, 110); c.lineTo(10, 110); c.lineTo(14, 214); c.lineTo(-14, 214); c.closePath(); c.fillStyle = "#c8161c"; c.fill(); ink(c, 7); }
  // round blue window
  const wk = o.window ?? 1;
  if (wk > 0.01) { c.save(); c.translate(0, -40); c.scale(wk, wk); c.beginPath(); c.arc(0, 0, 44, 0, TAU); c.fillStyle = "#c9d2ea"; c.fill(); ink(c, lw);
    c.beginPath(); c.arc(0, 0, 32, 0, TAU); c.fillStyle = lg(c, -30, -30, 30, 30, "#7fd6ff", "#2a6fe0"); c.fill(); ink(c, 6);
    if ((o.face ?? 0) > 0) { c.save(); c.beginPath(); c.arc(0, 0, 32, 0, TAU); c.clip(); const fy = 40 * (1 - o.face!); c.beginPath(); c.arc(0, 14 + fy, 30, 0, TAU); c.fillStyle = "#ffffff"; c.fill(); c.lineWidth = 4; c.strokeStyle = INK; c.stroke();
      c.fillStyle = INK; for (const ex of [-9, 9]) { c.beginPath(); c.ellipse(ex, 8 + fy, 4.5, 7, 0, 0, TAU); c.fill(); } c.beginPath(); c.arc(0, 18 + fy, 8, 0.3, Math.PI - 0.3); c.lineWidth = 3; c.stroke(); c.restore(); }
    c.fillStyle = "rgba(255,255,255,0.85)"; c.beginPath(); c.ellipse(-11, -12, 9, 14, -0.6, 0, TAU); c.fill(); c.restore();
    for (const a of [0, 1, 2, 3, 4, 5]) { const r = 39; c.beginPath(); c.arc(Math.cos(a * 1.047) * r, -40 + Math.sin(a * 1.047) * r, 2.6, 0, TAU); c.fillStyle = INK; c.fill(); } }
  // fuel gauge
  if (o.gauge !== undefined) { c.save(); c.translate(0, 60); c.beginPath(); c.arc(0, 0, 30, Math.PI, 0); c.lineTo(30, 6); c.lineTo(-30, 6); c.closePath(); c.fillStyle = "#fffdf0"; c.fill(); ink(c, 5);
    c.font = "900 16px Inter, Arial"; c.fillStyle = "#e5263a"; c.textAlign = "center"; c.fillText("E", -20, 2); c.fillStyle = "#1a9a4a"; c.fillText("F", 20, 2);
    const na = Math.PI + (1 - clamp(o.gauge)) * 0 + clamp(o.gauge) * Math.PI; const ga = Math.PI * (1 + clamp(o.gauge)); void na;
    c.beginPath(); c.moveTo(0, 2); c.lineTo(Math.cos(ga) * 24, 2 + Math.sin(ga) * 24); c.lineWidth = 4; c.strokeStyle = "#e5263a"; c.stroke(); c.beginPath(); c.arc(0, 2, 4, 0, TAU); c.fillStyle = INK; c.fill(); c.restore(); }
  c.restore();
}
// pencil-sketch version of the rocket (on paper): prog 0..1 per part
export function sketchRocket(c: CanvasRenderingContext2D, x: number, y: number, size: number, p: { body: number; fin1: number; fin2: number; win: number }, col = "#2b3a8a") {
  const s = size / 400; c.save(); c.translate(x, y); c.scale(s, s); c.lineCap = "round"; c.lineJoin = "round"; c.strokeStyle = col; c.lineWidth = 9;
  const part = (k: number, path: () => void, len: number) => { if (k <= 0) return; c.setLineDash([len * k, 10000]); path(); c.stroke(); c.setLineDash([]); };
  part(p.body, () => { c.beginPath(); c.moveTo(0, -200); c.bezierCurveTo(70, -150, 86, -40, 76, 120); c.quadraticCurveTo(70, 176, 0, 178); c.quadraticCurveTo(-70, 176, -76, 120); c.bezierCurveTo(-86, -40, -70, -150, 0, -200); c.moveTo(-74, -110); c.quadraticCurveTo(0, -140, 74, -110); }, 1300);
  part(p.fin1, () => { c.beginPath(); c.moveTo(-64, 60); c.quadraticCurveTo(-150, 110, -140, 214); c.lineTo(-96, 200); c.quadraticCurveTo(-80, 168, -64, 150); }, 420);
  part(p.fin2, () => { c.beginPath(); c.moveTo(64, 60); c.quadraticCurveTo(150, 110, 140, 214); c.lineTo(96, 200); c.quadraticCurveTo(80, 168, 64, 150); }, 420);
  part(p.win, () => { c.beginPath(); c.arc(0, -40, 40, -Math.PI / 2, Math.PI * 1.5); }, 260);
  c.restore();
}

/* ---------- ROPE LADDER: from top point hanging down, n rungs; sway angle in rad ---------- */
export function drawLadder(c: CanvasRenderingContext2D, top: V2, len: number, width: number, sway: number, n = 8, t = 0) {
  const pt = (k: number, side: number): V2 => { const a = sway * k + Math.sin(t * 3 + k * 2) * 0.02 * k; return [top[0] + side * width / 2 + Math.sin(a) * len * k, top[1] + Math.cos(a) * len * k]; };
  for (const side of [-1, 1]) { c.beginPath(); for (let i = 0; i <= 16; i++) { const p = pt(i / 16, side); i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); } c.lineWidth = 12; c.strokeStyle = INK; c.lineCap = "round"; c.stroke(); c.lineWidth = 6; c.strokeStyle = "#d6a35a"; c.stroke(); }
  for (let i = 1; i <= n; i++) { const k = i / (n + 0.4), a = pt(k, -1), b = pt(k, 1); c.beginPath(); c.moveTo(a[0] - 6, a[1]); c.lineTo(b[0] + 6, b[1]); c.lineWidth = 16; c.strokeStyle = INK; c.stroke(); c.lineWidth = 9; c.strokeStyle = "#b8743a"; c.stroke(); }
  return (k: number): V2 => { const a = pt(k, -1), b = pt(k, 1); return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; };
}

/* ---------- PENCIL: tip at (x,y), pointing along ang (0 = tip down) ---------- */
export function drawPencil(c: CanvasRenderingContext2D, x: number, y: number, len: number, ang: number, gleam = 0) {
  const s = len / 300; c.save(); c.translate(x, y); c.rotate(ang); c.scale(s, s); c.lineJoin = "round";
  c.beginPath(); c.moveTo(0, 0); c.lineTo(-20, -50); c.lineTo(20, -50); c.closePath(); c.fillStyle = "#f2c38a"; c.fill(); ink(c, 6);
  c.beginPath(); c.moveTo(0, 0); c.lineTo(-7, -17); c.lineTo(7, -17); c.closePath(); c.fillStyle = "#2b2b38"; c.fill();
  c.beginPath(); c.rect(-20, -250, 40, 200); c.fillStyle = lg(c, -20, 0, 20, 0, "#ffd84a", "#f0a51c"); c.fill(); ink(c, 6);
  c.beginPath(); c.moveTo(-7, -250); c.lineTo(-7, -50); c.moveTo(7, -250); c.lineTo(7, -50); c.lineWidth = 3; c.strokeStyle = "rgba(160,90,10,0.5)"; c.stroke();
  c.beginPath(); c.rect(-22, -282, 44, 32); c.fillStyle = lg(c, -22, 0, 22, 0, "#e8ecf6", "#9aa2b8"); c.fill(); ink(c, 6);
  c.beginPath(); c.moveTo(-22, -266); c.lineTo(22, -266); c.lineWidth = 3; c.strokeStyle = "#6a7088"; c.stroke();
  c.beginPath(); c.roundRect(-20, -318, 40, 38, [14, 14, 0, 0]); c.fillStyle = "#ff8fb0"; c.fill(); ink(c, 6);
  if (gleam > 0) { c.globalAlpha = gleam; c.fillStyle = "#ffffff"; c.beginPath(); for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; c.moveTo(0, -150); c.lineTo(Math.cos(a) * 70, -150 + Math.sin(a) * 70); c.lineTo(Math.cos(a + 0.2) * 12, -150 + Math.sin(a + 0.2) * 12); } c.fill(); c.globalAlpha = 1; }
  c.restore();
}

/* ---------- ROBOT: tiny wheeled robot with a screen face. (x,y) = ground contact centre, h = height ---------- */
export type RobotFace = "happy" | "neutral" | "angry" | "shock" | "blink";
export function drawRobot(c: CanvasRenderingContext2D, x: number, y: number, h: number, o: { face?: RobotFace; t?: number; wheel?: number; armL?: number; armR?: number; flip?: boolean; steam?: number } = {}) {
  const s = h / 300, t = o.t ?? 0; c.save(); c.translate(x, y); if (o.flip) c.scale(-1, 1); c.scale(s, s); c.lineJoin = "round"; c.lineCap = "round";
  const bob = Math.sin(t * 6) * 3;
  // wheels
  for (const wx of [-50, 50]) { c.save(); c.translate(wx, -28); c.beginPath(); c.arc(0, 0, 28, 0, TAU); c.fillStyle = "#2b2f40"; c.fill(); ink(c, 7); c.rotate(o.wheel ?? 0); c.beginPath(); c.arc(0, 0, 12, 0, TAU); c.fillStyle = "#c9d2ea"; c.fill(); ink(c, 4); c.beginPath(); c.moveTo(-12, 0); c.lineTo(12, 0); c.lineWidth = 4; c.strokeStyle = INK; c.stroke(); c.restore(); }
  c.translate(0, bob);
  // arms
  const arm = (sx: number, a: number) => { c.save(); c.translate(sx * 64, -120); c.rotate(sx * a); c.beginPath(); c.moveTo(0, 0); c.lineTo(sx * 34, 40); c.lineWidth = 14; c.strokeStyle = INK; c.stroke(); c.lineWidth = 7; c.strokeStyle = "#9aa2b8"; c.stroke(); c.beginPath(); c.arc(sx * 36, 44, 11, 0, TAU); c.fillStyle = "#ffcc3a"; c.fill(); ink(c, 5); c.restore(); };
  arm(-1, o.armL ?? 0); arm(1, o.armR ?? 0);
  // body
  c.beginPath(); c.roundRect(-66, -170, 132, 120, 26); c.fillStyle = lg(c, -66, -170, 66, -50, "#ffffff", "#bcd0e8"); c.fill(); ink(c, 8);
  c.beginPath(); c.roundRect(-30, -128, 60, 34, 8); c.fillStyle = "#2fd4c8"; c.fill(); ink(c, 5); // receipt slot plate
  c.beginPath(); c.moveTo(-20, -112); c.lineTo(20, -112); c.lineWidth = 5; c.strokeStyle = INK; c.stroke();
  // neck + head screen
  c.beginPath(); c.rect(-10, -186, 20, 18); c.fillStyle = "#9aa2b8"; c.fill(); ink(c, 5);
  c.beginPath(); c.roundRect(-78, -290, 156, 110, 28); c.fillStyle = "#e8eef8"; c.fill(); ink(c, 8);
  const face = o.face ?? "happy", angry = face === "angry";
  c.beginPath(); c.roundRect(-62, -276, 124, 82, 18); c.fillStyle = angry ? "#3a0a12" : "#0d2a3a"; c.fill(); ink(c, 5);
  const fc = angry ? "#ff4a5a" : "#5ff4ff"; c.strokeStyle = fc; c.fillStyle = fc; c.lineWidth = 8;
  c.save(); c.shadowColor = fc; c.shadowBlur = 12;
  if (face === "happy") { for (const ex of [-28, 28]) { c.beginPath(); c.arc(ex, -230, 12, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); } c.beginPath(); c.arc(0, -226, 22, 0.3, Math.PI - 0.3); c.stroke(); }
  else if (face === "neutral" || face === "blink") { for (const ex of [-28, 28]) { c.beginPath(); if (face === "blink") { c.moveTo(ex - 10, -238); c.lineTo(ex + 10, -238); c.stroke(); } else { c.arc(ex, -238, 8, 0, TAU); c.fill(); } } c.beginPath(); c.moveTo(-16, -212); c.lineTo(16, -212); c.stroke(); }
  else if (face === "angry") { for (const ex of [-28, 28]) { c.beginPath(); c.moveTo(ex - 14, -250 + (ex < 0 ? -6 : 6) * -1); c.lineTo(ex + 14, -250 + (ex < 0 ? 6 : -6) * -1); c.stroke(); c.beginPath(); c.arc(ex, -234, 6, 0, TAU); c.fill(); } c.beginPath(); c.arc(0, -198, 20, Math.PI * 1.15, Math.PI * 1.85); c.stroke(); }
  else { for (const ex of [-28, 28]) { c.beginPath(); c.arc(ex, -238, 11, 0, TAU); c.stroke(); } c.beginPath(); c.ellipse(0, -210, 9, 12, 0, 0, TAU); c.stroke(); }
  c.restore();
  // antenna
  c.beginPath(); c.moveTo(0, -290); c.lineTo(0, -326); c.lineWidth = 6; c.strokeStyle = INK; c.stroke(); c.beginPath(); c.arc(0, -334, 11, 0, TAU); c.fillStyle = Math.sin(t * 8) > 0 ? "#ff4a5a" : "#ffcc3a"; c.fill(); ink(c, 5);
  // steam puffs
  if ((o.steam ?? 0) > 0) { const k = o.steam!; for (let i = 0; i < 3; i++) { const u = (k + i * 0.2) % 1; c.globalAlpha = (1 - u) * 0.9; c.beginPath(); c.arc((i - 1) * 40 + Math.sin(u * 6 + i) * 10, -320 - u * 120, 18 + u * 26, 0, TAU); c.fillStyle = "#ffffff"; c.fill(); c.lineWidth = 4; c.strokeStyle = "rgba(16,16,24,0.5)"; c.stroke(); } c.globalAlpha = 1; }
  c.restore();
}

/* ---------- RECEIPT: paper strip from (x,y) down, length L, with total amount ---------- */
export function drawReceipt(c: CanvasRenderingContext2D, x: number, y: number, w: number, L: number, curl = 0, amount = "$30,000,000", big = 1, amtAt = 1) {
  c.save(); c.translate(x, y); c.rotate(curl); c.lineJoin = "round";
  c.beginPath(); c.moveTo(-w / 2, 0); c.lineTo(w / 2, 0); c.lineTo(w / 2, L); for (let i = 0; i <= 8; i++) c.lineTo(w / 2 - (i * w) / 8, L + (i % 2 ? 8 : 0)); c.closePath(); c.fillStyle = "#fffdf4"; c.fill(); ink(c, 5);
  c.save(); c.beginPath(); c.rect(-w / 2, 0, w, L); c.clip();
  const ay = amtAt >= 1 ? L - 14 : L * amtAt, fs = Math.round(w * 0.135 * big);
  c.fillStyle = "#8a8fa8"; for (let yy = 30; yy < L - 20; yy += 26) { if (Math.abs(yy - ay) < fs * 2.2 + 10) continue; c.fillRect(-w / 2 + 14, yy, w * (0.3 + rnd(yy) * 0.3), 7); c.fillRect(w / 2 - 14 - w * 0.18, yy, w * 0.18, 7); }
  if (L > 90) { c.textAlign = "center"; c.fillStyle = "#101018"; c.font = `900 ${Math.round(fs * 0.8)}px Inter, Arial`; c.fillText("TOTAL", 0, ay - fs * 1.15); c.fillStyle = "#e5263a"; c.font = `900 ${fs}px Inter, Arial`; c.fillText(amount, 0, ay); }
  c.restore(); c.restore();
}

/* ---------- COIN: centre (x,y), radius r, spin (0..1 => edge-on at 0.5) ---------- */
export function drawCoin(c: CanvasRenderingContext2D, x: number, y: number, r: number, spin = 0, rot = 0) {
  const sx = Math.max(0.12, Math.abs(Math.cos(spin * Math.PI)));
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(sx, 1); c.lineJoin = "round";
  c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fillStyle = lg(c, -r, -r, r, r, "#ffe680", "#e09a16"); c.fill(); c.lineWidth = Math.max(4, r * 0.08) / sx; c.strokeStyle = INK; c.stroke();
  c.beginPath(); c.arc(0, 0, r * 0.78, 0, TAU); c.lineWidth = Math.max(2.5, r * 0.04); c.strokeStyle = "#b8780e"; c.stroke();
  c.fillStyle = "#b8780e"; c.font = `900 ${Math.round(r * 1.05)}px Inter, Arial`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("$", 0, r * 0.05);
  c.fillStyle = "rgba(255,255,255,0.6)"; c.beginPath(); c.ellipse(-r * 0.4, -r * 0.45, r * 0.16, r * 0.3, 0.6, 0, TAU); c.fill();
  c.restore();
}

/* ---------- SPACE WHALE head rising (front view). (x,y) = centre of the head bottom/jaw line, s = scale (1 => 1000 px wide) ---------- */
export function drawWhale(c: CanvasRenderingContext2D, x: number, y: number, s: number, o: { eyes?: number; blink?: number; mouth?: number; t?: number; glow?: number } = {}) {
  const t = o.t ?? 0, mouth = clamp(o.mouth ?? 0), eyes = clamp(o.eyes ?? 1), bl = clamp(o.blink ?? 0);
  c.save(); c.translate(x, y); c.scale(s, s); c.lineJoin = "round"; c.lineCap = "round";
  // body dome
  const dome = () => { c.beginPath(); c.moveTo(-520, 60); c.bezierCurveTo(-540, -380, -260, -560, 0, -560); c.bezierCurveTo(260, -560, 540, -380, 520, 60); c.closePath(); };
  dome(); c.fillStyle = lg(c, -500, -560, 500, 60, "#6a8cff", "#4a2fa8"); c.fill();
  c.save(); dome(); c.clip();
  c.fillStyle = "rgba(255,255,255,0.12)"; c.beginPath(); c.ellipse(-180, -380, 220, 120, -0.4, 0, TAU); c.fill();
  for (let i = 0; i < 26; i++) { const px = (rnd(i) - 0.5) * 900, py = -100 - rnd(i + 7) * 420; c.globalAlpha = 0.35 + 0.35 * Math.sin(t * 3 + i); c.beginPath(); c.arc(px, py, 6 + rnd(i + 3) * 10, 0, TAU); c.fillStyle = "#bfe8ff"; c.fill(); } c.globalAlpha = 1; // glowing spots
  c.restore(); dome(); c.lineWidth = 14; c.strokeStyle = INK; c.stroke();
  // pectoral fins waving at the sides
  for (const sx of [-1, 1]) { const a = Math.sin(t * 2.4 + sx) * 0.25; c.save(); c.translate(sx * 500, -40); c.rotate(sx * (0.5 + a));
    c.beginPath(); c.moveTo(0, -60); c.bezierCurveTo(sx * 160, -40, sx * 260, 60, sx * 240, 150); c.bezierCurveTo(sx * 140, 120, sx * 40, 60, 0, 60); c.closePath(); c.fillStyle = lg(c, 0, -60, sx * 240, 150, "#5a6cf0", "#3a2690"); c.fill(); c.lineWidth = 12; c.strokeStyle = INK; c.stroke(); c.restore(); }
  // blowhole spout with sparkles
  if ((o.glow ?? 1) > 0) { c.save(); c.globalAlpha = 0.85; for (let i = 0; i < 5; i++) { const u = (t * 0.9 + i * 0.2) % 1; c.beginPath(); c.arc(Math.sin(i * 2 + t) * 40 * u, -580 - u * 260, 26 + u * 30, 0, TAU); c.fillStyle = "#bfe8ff"; c.fill(); c.lineWidth = 5; c.strokeStyle = "rgba(16,16,24,0.5)"; c.stroke(); } c.restore(); }
  // mouth (opens downward from y=0) + lower jaw
  if (mouth > 0.01) { c.beginPath(); c.moveTo(-380, 0); c.quadraticCurveTo(0, 60 + 560 * mouth, 380, 0); c.quadraticCurveTo(0, 30, -380, 0); c.closePath(); c.fillStyle = "#2a0a2a"; c.fill(); c.lineWidth = 12; c.strokeStyle = INK; c.stroke();
    c.save(); c.clip(); c.beginPath(); c.ellipse(0, 40 + 470 * mouth, 220, 120 * mouth + 10, 0, 0, TAU); c.fillStyle = "#ff6aa8"; c.fill(); c.restore(); }
  // jaw underside with grooves
  c.beginPath(); c.moveTo(-520, 60); c.quadraticCurveTo(0, 260 + 560 * mouth, 520, 60); c.quadraticCurveTo(0, 120 + 540 * mouth, -520, 60); c.closePath(); c.fillStyle = lg(c, 0, 60, 0, 300, "#c9d8ff", "#8aa0f0"); c.fill(); c.lineWidth = 12; c.strokeStyle = INK; c.stroke();
  c.lineWidth = 6; c.strokeStyle = "rgba(60,60,140,0.55)"; for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(i * 110, 90 + 470 * mouth * (1 - Math.abs(i) / 5)); c.quadraticCurveTo(i * 120, 150 + 520 * mouth * (1 - Math.abs(i) / 6), i * 100, 210 + 540 * mouth * (1 - Math.abs(i) / 5)); c.stroke(); } // ventral grooves
  // eyes
  for (const ex of [-250, 250]) { c.save(); c.translate(ex, -250); const open = eyes * (1 - bl);
    c.beginPath(); c.ellipse(0, 0, 92, 92 * Math.max(0.06, open), 0, 0, TAU); c.fillStyle = "#fff6c8"; c.fill(); c.lineWidth = 12; c.strokeStyle = INK; c.stroke();
    if (open > 0.15) { c.save(); c.beginPath(); c.ellipse(0, 0, 92, 92 * open, 0, 0, TAU); c.clip(); c.beginPath(); c.arc(8, 6, 50, 0, TAU); c.fillStyle = "#1a0a3a"; c.fill(); c.beginPath(); c.arc(-10, -14, 16, 0, TAU); c.fillStyle = "#fff"; c.fill(); c.restore(); }
    c.globalCompositeOperation = "lighter"; const g = c.createRadialGradient(0, 0, 40, 0, 0, 200); g.addColorStop(0, `rgba(255,230,120,${0.5 * (o.glow ?? 1) * open})`); g.addColorStop(1, "rgba(255,230,120,0)"); c.fillStyle = g; c.fillRect(-200, -200, 400, 400); c.globalCompositeOperation = "source-over";
    c.restore(); }
  c.restore();
}

/* ---------- FX ---------- */
export function smoke(c: CanvasRenderingContext2D, x: number, y: number, t: number, n: number, spread: number, rise: number, size: number, alpha = 1, seed = 1, col = "#ffffff") {
  for (let i = 0; i < n; i++) { const u = (t * 0.6 + rnd(i + seed)) % 1, px = x + (rnd(i * 3 + seed) - 0.5) * spread * (0.4 + u), py = y - u * rise, r = size * (0.4 + u * 0.9);
    c.globalAlpha = alpha * (1 - u) * 0.95; c.beginPath(); c.arc(px, py, r, 0, TAU); c.fillStyle = col; c.fill(); c.lineWidth = 4; c.strokeStyle = "rgba(16,16,24,0.35)"; c.stroke(); }
  c.globalAlpha = 1;
}
export function puff(c: CanvasRenderingContext2D, x: number, y: number, k: number, r: number, col = "#e8ecf6") { // single expanding puff, k 0..1
  if (k <= 0 || k >= 1) return; c.globalAlpha = 1 - k; for (let i = 0; i < 5; i++) { const a = i * 1.26; c.beginPath(); c.arc(x + Math.cos(a) * r * k * 0.8, y + Math.sin(a) * r * k * 0.5, r * (0.35 + k * 0.5), 0, TAU); c.fillStyle = col; c.fill(); c.lineWidth = 4; c.strokeStyle = "rgba(16,16,24,0.4)"; c.stroke(); } c.globalAlpha = 1;
}
export function sparkles(c: CanvasRenderingContext2D, x: number, y: number, t: number, n: number, rad: number, size: number, col = "#fff6c0", seed = 1, a = 1) {
  c.save(); c.globalCompositeOperation = "lighter";
  for (let i = 0; i < n; i++) { const u = (t * 0.8 + rnd(i + seed)) % 1, ang = rnd(i * 5 + seed) * TAU, d = rad * (0.3 + 0.7 * rnd(i * 7 + seed)), px = x + Math.cos(ang) * d, py = y + Math.sin(ang) * d - u * rad * 0.4, sz = size * Math.sin(u * Math.PI);
    c.globalAlpha = a * Math.sin(u * Math.PI); c.fillStyle = col; c.beginPath(); c.moveTo(px, py - sz); c.quadraticCurveTo(px, py, px + sz, py); c.quadraticCurveTo(px, py, px, py + sz); c.quadraticCurveTo(px, py, px - sz, py); c.quadraticCurveTo(px, py, px, py - sz); c.fill(); }
  c.restore();
}
export function glow(c: CanvasRenderingContext2D, x: number, y: number, r: number, col: string, a: number) {
  if (a <= 0) return; c.save(); c.globalCompositeOperation = "lighter"; const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, "rgba(0,0,0,0)"); c.globalAlpha = a; c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); c.restore();
}
export function cloudPuff(c: CanvasRenderingContext2D, x: number, y: number, w: number, seed = 1, col = "#ffffff", a = 1) {
  c.save(); c.globalAlpha = a; const n = 5; c.beginPath();
  for (let i = 0; i < n; i++) { const px = x + (i / (n - 1) - 0.5) * w * 0.8, r = w * (0.16 + rnd(i + seed) * 0.1) * (i === 2 ? 1.4 : 1); c.moveTo(px + r, y - r * 0.3); c.arc(px, y - r * 0.3, r, 0, TAU); }
  c.rect(x - w * 0.42, y - w * 0.1, w * 0.84, w * 0.12);
  c.fillStyle = col; c.fill(); c.restore();
}
export function bird(c: CanvasRenderingContext2D, x: number, y: number, s: number, t: number) {
  const f = Math.sin(t * 16) * 0.5; c.save(); c.translate(x, y); c.scale(s, s); c.beginPath(); c.moveTo(-20, -8 * f - 4); c.quadraticCurveTo(-8, -10 * f - 8, 0, 0); c.quadraticCurveTo(8, -10 * f - 8, 20, -8 * f - 4); c.lineWidth = 4; c.strokeStyle = "#2a2a40"; c.lineCap = "round"; c.stroke(); c.restore();
}
export function twinkles(c: CanvasRenderingContext2D, W: number, H: number, t: number, n: number, seed = 1, a = 1, y0 = 0) {
  c.save(); c.globalCompositeOperation = "lighter";
  for (let i = 0; i < n; i++) { const x = rnd(i + seed) * W, y = y0 + rnd(i * 3 + seed) * H, k = 0.5 + 0.5 * Math.sin(t * (2 + rnd(i) * 3) + i), sz = 3 + rnd(i * 7) * 6;
    c.globalAlpha = a * k; c.fillStyle = "#ffffff"; c.beginPath(); c.moveTo(x, y - sz * 2); c.quadraticCurveTo(x, y, x + sz * 2, y); c.quadraticCurveTo(x, y, x, y + sz * 2); c.quadraticCurveTo(x, y, x - sz * 2, y); c.quadraticCurveTo(x, y, x, y - sz * 2); c.fill(); }
  c.restore();
}
export function sweatDrops(c: CanvasRenderingContext2D, hx: number, hy: number, hr: number, t: number, a = 1) {
  c.save(); c.globalAlpha = a; for (let k = 0; k < 3; k++) { const u = (t * 1.1 + k / 3) % 1, x = hx + hr * (0.85 + 0.1 * k) * (k % 2 ? -1 : 1), y = hy - hr * 0.6 + u * hr * 1.2, r = (1 - u * 0.4) * hr * 0.09;
    c.beginPath(); c.moveTo(x, y - r * 1.7); c.quadraticCurveTo(x + r, y, x, y + r * 0.7); c.quadraticCurveTo(x - r, y, x, y - r * 1.7); c.fillStyle = "#9bdcff"; c.fill(); c.lineWidth = 3; c.strokeStyle = "#2f6fa0"; c.stroke(); } c.restore();
}
export function bigNumber(c: CanvasRenderingContext2D, x: number, y: number, txt: string, size: number, k: number, col = "#ffd23a") {
  if (k <= 0) return; c.save(); c.translate(x, y); const sc = easeBack(clamp(k)); c.scale(sc, sc); c.font = `900 ${size}px Inter, Arial`; c.textAlign = "center"; c.textBaseline = "middle";
  c.lineJoin = "round"; c.lineWidth = size * 0.14; c.strokeStyle = INK; c.strokeText(txt, 0, 0); c.fillStyle = col; c.fillText(txt, 0, 0); c.restore();
}

/* ======================= EP04 props ======================= */
/* COW (side view, facing left). (x,y) = ground under the hooves, h = height to the back; chew 0..1 phase */
export function drawCow(c: CanvasRenderingContext2D, x: number, y: number, h: number, o: { t?: number; chew?: boolean; legs?: number; eyes?: "calm" | "shock"; flip?: boolean; rot?: number } = {}) {
  const s = h / 300, t = o.t ?? 0; c.save(); c.translate(x, y); if (o.flip) c.scale(-1, 1); c.rotate(o.rot ?? 0); c.scale(s, s); c.lineJoin = "round"; c.lineCap = "round";
  const lg = o.legs ?? 0; // 0 standing, 1 dangling/spread
  for (const [lx, ph] of [[-110, 0], [-70, 1], [80, 2], [120, 3]] as [number, number][]) { const a = lg * Math.sin(t * 2 + ph) * 0.3 + lg * (lx < 0 ? 0.25 : -0.25); c.save(); c.translate(lx, -120); c.rotate(a); c.beginPath(); c.roundRect(-16, 0, 32, 110, 12); c.fillStyle = ph % 2 ? "#f4f4f8" : "#e6e8f0"; c.fill(); ink(c, 7); c.beginPath(); c.roundRect(-18, 92, 36, 26, 8); c.fillStyle = "#3a3038"; c.fill(); ink(c, 6); c.restore(); }
  // tail
  c.beginPath(); c.moveTo(150, -240); c.quadraticCurveTo(200 + Math.sin(t * 3) * 10, -200, 190 + Math.sin(t * 3) * 14, -130); c.lineWidth = 9; c.strokeStyle = INK; c.stroke(); c.beginPath(); c.ellipse(190 + Math.sin(t * 3) * 14, -120, 12, 20, 0, 0, TAU); c.fillStyle = "#3a3038"; c.fill(); ink(c, 5);
  // body
  const body = () => { c.beginPath(); c.roundRect(-160, -280, 330, 170, 80); };
  body(); c.fillStyle = lg2(c, 0, -280, 0, -110, "#ffffff", "#dfe3ef"); c.fill();
  c.save(); body(); c.clip(); c.fillStyle = "#2b2530"; for (const [px, py, r] of [[-60, -240, 46], [60, -170, 52], [130, -250, 34], [-130, -150, 30]]) { c.beginPath(); c.ellipse(px, py, r * 1.2, r, 0.4, 0, TAU); c.fill(); } c.restore(); body(); ink(c, 9);
  // head
  c.save(); c.translate(-170, -250);
  c.beginPath(); c.ellipse(-30, -30, 60, 20, -0.5, 0, TAU); c.fillStyle = "#f4f4f8"; c.fill(); ink(c, 6); // ear
  for (const hx of [-10, 30]) { c.beginPath(); c.moveTo(hx, -60); c.quadraticCurveTo(hx + 8, -100, hx + 26, -104); c.quadraticCurveTo(hx + 18, -84, hx + 18, -58); c.closePath(); c.fillStyle = "#f6e2ae"; c.fill(); ink(c, 5); }
  c.beginPath(); c.ellipse(0, 0, 70, 80, 0.15, 0, TAU); c.fillStyle = "#ffffff"; c.fill(); ink(c, 9);
  const jaw = o.chew ? Math.sin(t * 9) * 5 : 0;
  c.beginPath(); c.ellipse(-30, 60 + jaw * 0.3, 62, 40, 0.2, 0, TAU); c.fillStyle = "#ffb3c6"; c.fill(); ink(c, 8);
  c.fillStyle = "#c46a86"; for (const nx of [-50, -18]) { c.beginPath(); c.ellipse(nx, 52, 8, 11, 0.3, 0, TAU); c.fill(); }
  if (o.chew) { c.beginPath(); c.moveTo(-60, 92 + jaw); c.lineTo(-110, 120 + jaw + Math.sin(t * 9) * 6); c.lineWidth = 6; c.strokeStyle = "#3fbf4a"; c.stroke(); c.beginPath(); c.moveTo(-60, 92 + jaw); c.lineTo(-100, 70 + jaw); c.stroke(); }
  if (o.eyes === "shock") { c.beginPath(); c.arc(-10, -20, 18, 0, TAU); c.fillStyle = "#fff"; c.fill(); ink(c, 5); c.beginPath(); c.arc(-12, -20, 7, 0, TAU); c.fillStyle = INK; c.fill(); }
  else { c.beginPath(); c.ellipse(-12, -18, 13, 16, 0, 0, TAU); c.fillStyle = INK; c.fill(); c.fillStyle = "#f4f4f8"; c.beginPath(); c.ellipse(-12, -26, 15, 9, 0, Math.PI, 0); c.fill(); c.beginPath(); c.moveTo(-28, -24); c.lineTo(4, -24); ink(c, 5); } // half-lidded, calm
  c.restore(); c.restore();
}
const lg2 = (c: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, a: string, b: string) => { const g = c.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, a); g.addColorStop(1, b); return g; };

/* SHARK (side view facing left, friendly). (x,y) centre, len = length; mood smile|surprised; look 0..1 turns the eye toward camera */
export function drawShark(c: CanvasRenderingContext2D, x: number, y: number, len: number, o: { t?: number; mood?: "smile" | "surprised"; flip?: boolean; rot?: number; look?: number } = {}) {
  const s = len / 500, t = o.t ?? 0; c.save(); c.translate(x, y); if (o.flip) c.scale(-1, 1); c.rotate(o.rot ?? 0); c.scale(s, s); c.lineJoin = "round"; c.lineCap = "round";
  const tw = Math.sin(t * 5) * 0.15;
  c.save(); c.translate(210, 0); c.rotate(tw); c.beginPath(); c.moveTo(0, 0); c.lineTo(90, -90); c.quadraticCurveTo(70, 0, 90, 80); c.closePath(); c.fillStyle = "#5a7fb8"; c.fill(); ink(c, 9); c.restore(); // tail
  c.beginPath(); c.moveTo(-40, -70); c.lineTo(10, -160); c.quadraticCurveTo(30, -100, 60, -70); c.closePath(); c.fillStyle = "#5a7fb8"; c.fill(); ink(c, 9); // dorsal fin
  const body = () => { c.beginPath(); c.moveTo(-250, 10); c.bezierCurveTo(-240, -80, -100, -95, 60, -75); c.bezierCurveTo(160, -60, 220, -20, 225, 0); c.bezierCurveTo(220, 30, 150, 60, 40, 70); c.bezierCurveTo(-100, 85, -240, 70, -250, 10); c.closePath(); };
  body(); c.fillStyle = lg2(c, 0, -95, 0, 85, "#7fa6e0", "#4a6aa8"); c.fill();
  c.save(); body(); c.clip(); c.beginPath(); c.moveTo(-250, 20); c.bezierCurveTo(-150, 50, 0, 40, 220, 10); c.lineTo(220, 100); c.lineTo(-250, 100); c.closePath(); c.fillStyle = "#f2f4fb"; c.fill(); c.restore(); body(); ink(c, 10);
  c.beginPath(); c.moveTo(-20, 40); c.quadraticCurveTo(10, 110, 60, 120); c.quadraticCurveTo(40, 70, 40, 40); c.closePath(); c.fillStyle = "#5a7fb8"; c.fill(); ink(c, 8); // pectoral fin
  for (const gx of [-110, -95, -80]) { c.beginPath(); c.moveTo(gx, -20); c.quadraticCurveTo(gx - 6, 0, gx, 20); c.lineWidth = 5; c.strokeStyle = "rgba(16,16,24,0.6)"; c.stroke(); } // gills
  // eye (turns toward camera with look)
  const lk = o.look ?? 0, ex = -170 + lk * 10, ey = -30;
  if (o.mood === "surprised") { c.beginPath(); c.arc(ex, ey, 24, 0, TAU); c.fillStyle = "#fff"; c.fill(); ink(c, 6); c.beginPath(); c.arc(ex + 4 * lk - 2, ey, 10, 0, TAU); c.fillStyle = INK; c.fill(); c.beginPath(); c.moveTo(ex - 22, ey - 36); c.quadraticCurveTo(ex, ey - 50, ex + 22, ey - 38); ink(c, 6); }
  else { c.beginPath(); c.ellipse(ex, ey, 13, 18, 0, 0, TAU); c.fillStyle = INK; c.fill(); c.beginPath(); c.arc(ex - 4, ey - 6, 4, 0, TAU); c.fillStyle = "#fff"; c.fill(); }
  // mouth: grin with teeth / surprised O
  if (o.mood === "surprised") { c.beginPath(); c.ellipse(-205, 30, 22, 26, 0, 0, TAU); c.fillStyle = "#3a1222"; c.fill(); ink(c, 7); }
  else { c.beginPath(); c.moveTo(-235, 20); c.quadraticCurveTo(-170, 60, -100, 28); c.quadraticCurveTo(-170, 40, -235, 20); c.closePath(); c.fillStyle = "#3a1222"; c.fill(); ink(c, 7);
    c.fillStyle = "#fff"; for (let i = 0; i < 6; i++) { const tx = -225 + i * 21; c.beginPath(); c.moveTo(tx, 24 + i * 1.5); c.lineTo(tx + 8, 38 + i); c.lineTo(tx + 16, 26 + i * 1.5); c.closePath(); c.fill(); } }
  c.restore();
}
/* small fish (side view, facing left); confused adds a "?" */
export function drawFish(c: CanvasRenderingContext2D, x: number, y: number, len: number, o: { t?: number; col?: string; confused?: boolean; flip?: boolean } = {}) {
  const s = len / 100, t = o.t ?? 0; c.save(); c.translate(x, y); if (o.flip) c.scale(-1, 1); c.scale(s, s); c.lineJoin = "round";
  const col = o.col ?? "#ff8a2a"; const tw = Math.sin(t * 9) * 0.3;
  c.save(); c.translate(36, 0); c.rotate(tw); c.beginPath(); c.moveTo(0, 0); c.lineTo(26, -20); c.lineTo(26, 20); c.closePath(); c.fillStyle = col; c.fill(); ink(c, 4); c.restore();
  c.beginPath(); c.ellipse(0, 0, 44, 26, 0, 0, TAU); c.fillStyle = col; c.fill(); ink(c, 5);
  if (col === "#ff8a2a") { c.fillStyle = "#fff"; for (const bx of [-12, 14]) { c.fillRect(bx - 5, -24, 10, 48); } c.beginPath(); c.ellipse(0, 0, 44, 26, 0, 0, TAU); ink(c, 5); }
  c.beginPath(); c.arc(-24, -6, 8, 0, TAU); c.fillStyle = "#fff"; c.fill(); ink(c, 3); c.beginPath(); c.arc(-26, -6, 3.5, 0, TAU); c.fillStyle = INK; c.fill();
  if (o.confused) { c.beginPath(); c.moveTo(-38, 10); c.quadraticCurveTo(-32, 4, -26, 12); c.quadraticCurveTo(-20, 18, -14, 10); ink(c, 3); c.scale(o.flip ? -1 : 1, 1); c.font = "900 34px Inter, Arial"; c.fillStyle = "#ffffff"; c.strokeStyle = INK; c.lineWidth = 5; c.strokeText("?", -8, -34); c.fillText("?", -8, -34); }
  c.restore();
}
/* wobbly water blob (jelly) with optional contents drawn by fill(); r = base radius */
export function waterBlob(c: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, t: number, seed = 1, fill?: () => void) {
  const pts = 28, path = () => { c.beginPath(); for (let i = 0; i <= pts; i++) { const a = (i / pts) * TAU, w = 1 + 0.06 * Math.sin(a * 3 + t * 2.2 + seed) + 0.04 * Math.sin(a * 5 - t * 3.1 + seed * 2); const px = x + Math.cos(a) * rx * w, py = y + Math.sin(a) * ry * w; i ? c.lineTo(px, py) : c.moveTo(px, py); } c.closePath(); };
  path(); const g = c.createRadialGradient(x - rx * 0.3, y - ry * 0.3, 4, x, y, Math.max(rx, ry)); g.addColorStop(0, "rgba(190,240,255,0.55)"); g.addColorStop(1, "rgba(40,150,230,0.55)"); c.fillStyle = g; c.fill();
  if (fill) { c.save(); path(); c.clip(); fill(); c.restore(); }
  path(); c.lineWidth = 6; c.strokeStyle = "rgba(20,80,160,0.8)"; c.stroke();
  c.fillStyle = "rgba(255,255,255,0.75)"; c.beginPath(); c.ellipse(x - rx * 0.45, y - ry * 0.45, rx * 0.16, ry * 0.08, -0.6, 0, TAU); c.fill();
  for (let i = 0; i < 5; i++) { const u = (t * 0.3 + rnd(i + seed)) % 1; c.beginPath(); c.arc(x + (rnd(i * 3 + seed) - 0.5) * rx, y + ry * 0.6 - u * ry * 1.2, 4 + rnd(i) * 5, 0, TAU); c.lineWidth = 2.5; c.strokeStyle = "rgba(255,255,255,0.8)"; c.stroke(); }
}
export function drawSock(c: CanvasRenderingContext2D, x: number, y: number, s: number, rot: number) {
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s); c.lineJoin = "round";
  c.beginPath(); c.moveTo(-20, -60); c.lineTo(20, -60); c.lineTo(22, 10); c.quadraticCurveTo(60, 14, 62, 34); c.quadraticCurveTo(60, 56, 20, 52); c.lineTo(-14, 50); c.quadraticCurveTo(-24, 40, -22, 10); c.closePath(); c.fillStyle = "#ffffff"; c.fill();
  c.save(); c.clip(); c.fillStyle = "#e5263a"; for (const yy of [-50, -30, -10]) c.fillRect(-30, yy, 100, 9); c.fillStyle = "#3a6fd8"; c.fillRect(-30, 30, 100, 30); c.restore(); ink(c, 6); c.restore();
}
export function drawBed(c: CanvasRenderingContext2D, x: number, y: number, w: number, rot = 0) {
  const s = w / 300; c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s); c.lineJoin = "round";
  c.beginPath(); c.roundRect(-150, -40, 300, 60, 10); c.fillStyle = "#b8743a"; c.fill(); ink(c, 7);
  c.beginPath(); c.roundRect(-140, -80, 280, 50, 14); c.fillStyle = "#3a6fd8"; c.fill(); ink(c, 6);
  c.beginPath(); c.roundRect(-136, -96, 80, 40, 16); c.fillStyle = "#ffffff"; c.fill(); ink(c, 5);
  for (const lx of [-150, 136]) { c.beginPath(); c.rect(lx, -110, 14, 150); c.fillStyle = "#8a5a32"; c.fill(); ink(c, 6); }
  c.restore();
}
export function drawMoon(c: CanvasRenderingContext2D, x: number, y: number, r: number, t = 0) {
  c.save(); c.beginPath(); c.arc(x, y, r, 0, TAU); const g = c.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r); g.addColorStop(0, "#fffbe8"); g.addColorStop(1, "#c9c4d8"); c.fillStyle = g; c.fill(); c.lineWidth = Math.max(6, r * 0.012); c.strokeStyle = INK; c.stroke();
  c.clip(); for (let i = 0; i < 14; i++) { const cx = x + (rnd(i) - 0.5) * r * 1.6, cy = y + (rnd(i + 7) - 0.5) * r * 1.6, cr = r * (0.05 + rnd(i + 3) * 0.12); c.beginPath(); c.arc(cx, cy, cr, 0, TAU); c.fillStyle = "rgba(150,140,175,0.55)"; c.fill(); c.lineWidth = Math.max(2, r * 0.006); c.strokeStyle = "rgba(90,80,120,0.6)"; c.stroke(); }
  c.restore(); glow(c, x, y, r * 1.25, "rgba(255,250,220,1)", 0.18 + 0.03 * Math.sin(t * 2));
}
