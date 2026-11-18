// EP06 locations + props: night garage-workshop, far-future alien ocean, washing-machine time pod, retro keyboard + year display, glowing jellyfish.
import { rnd, INK, glow } from "../../style/props2d";
export const WW = 1080, WH = 1920;
const TAU = Math.PI * 2;
type Ctx = CanvasRenderingContext2D;
const lg = (c: Ctx, x0: number, y0: number, x1: number, y1: number, st: [number, string][]) => { const g = c.createLinearGradient(x0, y0, x1, y1); for (const [k, col] of st) g.addColorStop(k, col); return g; };
const ink = (c: Ctx, w = 6) => { c.lineWidth = w; c.strokeStyle = INK; c.stroke(); };
const rr = (c: Ctx, x: number, y: number, w: number, h: number, r: number) => { c.beginPath(); c.roundRect(x, y, w, h, r); };
export const FLOOR_Y = 1650; // workshop floor line where characters stand

/* ===================== WORKSHOP (static layer) ===================== */
const cache: Record<string, HTMLCanvasElement> = {};
export function workshopBG(): HTMLCanvasElement {
  if (cache.ws) return cache.ws;
  const cv = document.createElement("canvas"); cv.width = WW; cv.height = WH; const c = cv.getContext("2d")!; c.lineJoin = "round"; c.lineCap = "round";
  // back wall: painted cinder blocks, cool night tone
  c.fillStyle = lg(c, 0, 0, 0, 1300, [[0, "#1f2a4a"], [1, "#2e3a5e"]]); c.fillRect(0, 0, WW, 1320);
  c.strokeStyle = "rgba(10,14,30,0.55)"; c.lineWidth = 4; for (let y = 40; y < 1320; y += 80) { c.beginPath(); c.moveTo(0, y); c.lineTo(WW, y); c.stroke(); for (let x = ((y / 80) % 2) * 80; x < WW; x += 160) { c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 80); c.stroke(); } }
  // garage door (right, ribbed) with a small window showing the night
  rr(c, 700, 120, 420, 1140, 6); c.fillStyle = "#4a5578"; c.fill(); ink(c, 8);
  for (let y = 190; y < 1250; y += 90) { c.beginPath(); c.moveTo(700, y); c.lineTo(1120, y); c.lineWidth = 6; c.strokeStyle = "#2a3254"; c.stroke(); c.beginPath(); c.moveTo(700, y + 8); c.lineTo(1120, y + 8); c.lineWidth = 3; c.strokeStyle = "rgba(255,255,255,0.12)"; c.stroke(); }
  rr(c, 760, 220, 300, 150, 8); c.fillStyle = lg(c, 0, 220, 0, 370, [[0, "#0a0d2a"], [1, "#2a2470"]]); c.fill(); ink(c, 6);
  for (let i = 0; i < 18; i++) { c.fillStyle = "#fff6d0"; c.beginPath(); c.arc(770 + rnd(i) * 280, 230 + rnd(i + 5) * 120, 1.5 + rnd(i + 9) * 2, 0, TAU); c.fill(); }
  c.beginPath(); c.arc(1000, 270, 26, 0, TAU); c.fillStyle = "#fff4c0"; c.fill(); c.beginPath(); c.arc(1012, 262, 22, 0, TAU); c.fillStyle = "#13154a"; c.fill();
  c.beginPath(); c.moveTo(910, 220); c.lineTo(910, 370); c.moveTo(760, 295); c.lineTo(1060, 295); c.lineWidth = 6; c.strokeStyle = INK; c.stroke();
  // pegboard with tools
  rr(c, 40, 150, 560, 420, 10); c.fillStyle = "#b9895a"; c.fill(); ink(c, 7); c.fillStyle = "rgba(60,30,10,0.45)"; for (let y = 175; y < 560; y += 30) for (let x = 65; x < 590; x += 30) { c.beginPath(); c.arc(x, y, 3, 0, TAU); c.fill(); }
  const hammer = (x: number, y: number) => { rr(c, x - 6, y, 12, 130, 4); c.fillStyle = "#c8854a"; c.fill(); ink(c, 4); rr(c, x - 34, y - 10, 68, 26, 6); c.fillStyle = "#8a92a8"; c.fill(); ink(c, 4); };
  const wrench = (x: number, y: number, s: number) => { c.save(); c.translate(x, y); c.scale(s, s); rr(c, -8, 0, 16, 140, 6); c.fillStyle = "#c0c8dc"; c.fill(); ink(c, 4); c.beginPath(); c.arc(0, 0, 22, Math.PI * 0.2, Math.PI * 1.8); c.lineWidth = 16; c.strokeStyle = INK; c.stroke(); c.lineWidth = 9; c.strokeStyle = "#c0c8dc"; c.stroke(); c.restore(); };
  const saw = (x: number, y: number) => { c.beginPath(); c.moveTo(x, y); c.lineTo(x + 200, y + 20); c.lineTo(x + 200, y + 70); c.lineTo(x, y + 60); c.closePath(); c.fillStyle = "#d8dee8"; c.fill(); ink(c, 4); rr(c, x - 60, y + 10, 70, 50, 14); c.fillStyle = "#e5483f"; c.fill(); ink(c, 4); for (let k = 0; k < 12; k++) { c.beginPath(); c.moveTo(x + k * 16, y + 60 + k * 0.8); c.lineTo(x + 8 + k * 16, y + 70 + k * 0.8); c.lineWidth = 2; c.stroke(); } };
  hammer(100, 210); wrench(180, 220, 1); wrench(240, 230, 0.8); saw(330, 210); hammer(560, 380);
  for (let k = 0; k < 4; k++) { rr(c, 90 + k * 50, 400, 26, 120, 6); c.fillStyle = ["#e5483f", "#f0b429", "#3a6fd8", "#2fb87a"][k]; c.fill(); ink(c, 4); rr(c, 96 + k * 50, 360, 14, 46, 3); c.fillStyle = "#c0c8dc"; c.fill(); ink(c, 3); } // screwdrivers
  c.beginPath(); c.arc(400, 430, 70, 0, TAU); c.lineWidth = 14; c.strokeStyle = "#f0b429"; c.stroke(); c.beginPath(); c.arc(400, 430, 70, 0, TAU); c.lineWidth = 3; c.strokeStyle = INK; c.stroke(); // coiled cable
  // posters
  const poster = (x: number, y: number, w: number, h: number, rot: number, bg: string, draw: () => void) => { c.save(); c.translate(x, y); c.rotate(rot); rr(c, -w / 2, -h / 2, w, h, 4); c.fillStyle = bg; c.fill(); ink(c, 5); draw(); c.beginPath(); c.arc(-w / 2 + 14, -h / 2 + 14, 6, 0, TAU); c.arc(w / 2 - 14, -h / 2 + 14, 6, 0, TAU); c.fillStyle = "#c0c8dc"; c.fill(); c.restore(); };
  poster(160, 720, 220, 300, -0.04, "#1a1f50", () => { c.font = "900 44px Inter"; c.textAlign = "center"; c.fillStyle = "#ffd23a"; c.fillText("TIME", 0, -90); c.fillText("TRAVEL", 0, -46); c.beginPath(); c.arc(0, 50, 60, 0, TAU); c.fillStyle = "#fffdf4"; c.fill(); ink(c, 5); c.beginPath(); c.moveTo(0, 50); c.lineTo(0, 10); c.moveTo(0, 50); c.lineTo(30, 66); c.lineWidth = 6; c.stroke(); });
  poster(440, 700, 200, 260, 0.05, "#ff8a3a", () => { c.beginPath(); c.moveTo(0, -90); c.quadraticCurveTo(40, -40, 30, 50); c.lineTo(-30, 50); c.quadraticCurveTo(-40, -40, 0, -90); c.fillStyle = "#fffdf4"; c.fill(); ink(c, 4); c.beginPath(); c.arc(0, -20, 14, 0, TAU); c.fillStyle = "#3a8fe0"; c.fill(); ink(c, 3); c.beginPath(); c.moveTo(-14, 50); c.lineTo(0, 100); c.lineTo(14, 50); c.fillStyle = "#ffd23a"; c.fill(); });
  poster(600, 980, 160, 120, -0.06, "#fffbe0", () => { c.font = "900 30px Comic Sans MS, Inter"; c.textAlign = "center"; c.fillStyle = "#e5263a"; c.fillText("DON'T", 0, -10); c.fillText("TOUCH!", 0, 26); });
  // wall clock + shelf with boxes, paint cans, jars
  c.save(); c.translate(560, 120); c.beginPath(); c.arc(0, 0, 56, 0, TAU); c.fillStyle = "#fffdf4"; c.fill(); ink(c, 7); for (let k = 0; k < 12; k++) { const a = k * TAU / 12; c.beginPath(); c.moveTo(Math.cos(a) * 44, Math.sin(a) * 44); c.lineTo(Math.cos(a) * 50, Math.sin(a) * 50); c.lineWidth = 4; c.stroke(); } c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -38); c.moveTo(0, 0); c.lineTo(26, 10); c.lineWidth = 7; c.stroke(); c.restore();
  rr(c, 30, 1060, 640, 24, 4); c.fillStyle = "#8a5a32"; c.fill(); ink(c, 6);
  const box = (x: number, w: number, h: number, col: string, label: string) => { rr(c, x, 1060 - h, w, h, 4); c.fillStyle = col; c.fill(); ink(c, 5); c.beginPath(); c.moveTo(x, 1060 - h + 20); c.lineTo(x + w, 1060 - h + 20); c.lineWidth = 3; c.strokeStyle = "rgba(0,0,0,0.3)"; c.stroke(); c.font = "900 22px Inter"; c.fillStyle = "#3a2a1a"; c.textAlign = "center"; c.fillText(label, x + w / 2, 1060 - h / 2 + 10); };
  box(50, 150, 110, "#c8955a", "GEARS"); box(210, 120, 160, "#d8a46a", "BOLTS"); box(340, 110, 90, "#c8955a", "WIRES");
  for (let k = 0; k < 3; k++) { const x = 480 + k * 60; rr(c, x, 980, 50, 80, 6); c.fillStyle = ["#3a6fd8", "#e5483f", "#2fb87a"][k]; c.fill(); ink(c, 4); c.fillStyle = "#c0c8dc"; c.fillRect(x, 980, 50, 12); }
  // hanging lamp + warm cone
  c.beginPath(); c.moveTo(380, 0); c.lineTo(380, 230); c.lineWidth = 5; c.strokeStyle = INK; c.stroke(); c.beginPath(); c.moveTo(320, 300); c.lineTo(440, 300); c.lineTo(410, 230); c.lineTo(350, 230); c.closePath(); c.fillStyle = "#2fb87a"; c.fill(); ink(c, 6);
  // floor: concrete with oil stains, wires
  c.fillStyle = lg(c, 0, 1300, 0, WH, [[0, "#5a6280"], [1, "#3a4060"]]); c.fillRect(0, 1300, WW, WH - 1300);
  c.beginPath(); c.moveTo(0, 1320); c.lineTo(WW, 1320); ink(c, 7);
  for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(-100 + i * 280, WH); c.lineTo(80 + i * 200, 1320); c.lineWidth = 3; c.strokeStyle = "rgba(20,24,40,0.35)"; c.stroke(); }
  for (const [x, y, r] of [[300, 1780, 90], [820, 1860, 70], [600, 1500, 50]] as [number, number, number][]) { c.save(); c.translate(x, y); c.scale(1, 0.35); c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fillStyle = "rgba(20,20,40,0.35)"; c.fill(); c.restore(); }
  // traffic cone, toolbox, extension reel, crates
  c.save(); c.translate(980, 1560); c.beginPath(); c.moveTo(-50, 0); c.lineTo(50, 0); c.lineTo(14, -140); c.lineTo(-14, -140); c.closePath(); c.fillStyle = "#ff7a2a"; c.fill(); ink(c, 6); c.fillStyle = "#fffdf4"; c.fillRect(-30, -80, 60, 18); rr(c, -70, -6, 140, 16, 4); c.fillStyle = "#ff7a2a"; c.fill(); ink(c, 5); c.restore();
  rr(c, 40, 1400, 220, 120, 10); c.fillStyle = "#e5483f"; c.fill(); ink(c, 7); rr(c, 100, 1370, 100, 34, 10); c.lineWidth = 10; c.strokeStyle = INK; c.stroke(); c.fillStyle = "#c0c8dc"; c.fillRect(130, 1450, 40, 16);
  c.save(); c.translate(150, 1820); c.beginPath(); c.arc(0, 0, 70, 0, TAU); c.fillStyle = "#f0b429"; c.fill(); ink(c, 6); c.beginPath(); c.arc(0, 0, 26, 0, TAU); c.fillStyle = "#2b2b38"; c.fill(); c.restore();
  // cables snaking across the floor to the machine
  c.lineWidth = 12; for (const [col, off] of [["#e5483f", 0], ["#3a6fd8", 30], ["#f0b429", 60]] as [string, number][]) { c.beginPath(); c.moveTo(0, 1700 + off); c.bezierCurveTo(250, 1620 + off, 380, 1900 - off, 560, 1760); c.strokeStyle = INK; c.lineWidth = 16; c.stroke(); c.strokeStyle = col; c.lineWidth = 9; c.stroke(); }
  // cool night ambience + lamp warm pool
  const g = c.createRadialGradient(380, 330, 20, 380, 900, 1000); g.addColorStop(0, "rgba(255,210,120,0.45)"); g.addColorStop(1, "rgba(255,180,80,0)"); c.save(); c.globalCompositeOperation = "lighter"; c.fillStyle = g; c.fillRect(0, 0, WW, WH); c.restore();
  const v = c.createRadialGradient(WW / 2, WH * 0.55, WH * 0.3, WW / 2, WH * 0.55, WH * 0.85); v.addColorStop(0, "rgba(5,5,25,0)"); v.addColorStop(1, "rgba(5,5,25,0.5)"); c.fillStyle = v; c.fillRect(0, 0, WW, WH);
  cache.ws = cv; return cv;
}

/* ===================== FUTURE OCEAN (static layer) ===================== */
export const SHORE_Y = 1600, HORIZON_Y = 1000;
export function futureBG(): HTMLCanvasElement {
  if (cache.fu) return cache.fu;
  const cv = document.createElement("canvas"); cv.width = WW; cv.height = WH; const c = cv.getContext("2d")!; c.lineJoin = "round"; c.lineCap = "round";
  c.fillStyle = lg(c, 0, 0, 0, HORIZON_Y, [[0, "#1a0b4a"], [0.45, "#6a2a9a"], [0.8, "#e0609a"], [1, "#ffb08a"]]); c.fillRect(0, 0, WW, HORIZON_Y);
  for (let i = 0; i < 90; i++) { c.fillStyle = `rgba(255,250,230,${0.3 + rnd(i) * 0.7})`; c.beginPath(); c.arc(rnd(i * 3) * WW, rnd(i * 7) * HORIZON_Y * 0.55, 1.5 + rnd(i + 2) * 2.5, 0, TAU); c.fill(); }
  // two moons
  for (const [x, y, r, col] of [[260, 260, 120, "#ffe6f4"], [820, 420, 60, "#bff0ff"]] as [number, number, number, string][]) { glow(c, x, y, r * 2.2, "rgba(255,220,255,1)", 0.35); c.beginPath(); c.arc(x, y, r, 0, TAU); c.fillStyle = col; c.fill(); ink(c, 6); c.fillStyle = "rgba(150,110,190,0.35)"; for (let k = 0; k < 5; k++) { c.beginPath(); c.arc(x + (rnd(k + r) - 0.5) * r * 1.2, y + (rnd(k + 3 + r) - 0.5) * r * 1.2, r * (0.08 + rnd(k) * 0.12), 0, TAU); c.fill(); } }
  // ringed distant planet streak + clouds
  c.save(); c.globalAlpha = 0.6; for (const [x, y, w] of [[600, 640, 380], [180, 760, 300], [880, 820, 260]] as [number, number, number][]) { c.fillStyle = "rgba(255,170,210,0.55)"; for (let k = 0; k < 4; k++) { c.beginPath(); c.ellipse(x + (k - 1.5) * w * 0.25, y - (k % 2) * 16, w * 0.22, 34, 0, 0, TAU); c.fill(); } } c.restore();
  // crystal spires left/right + floating coral islands
  const spire = (x: number, base: number, h: number, w: number, col: string) => { c.beginPath(); c.moveTo(x - w, base); c.lineTo(x - w * 0.3, base - h); c.lineTo(x, base - h - w * 0.8); c.lineTo(x + w * 0.4, base - h * 0.9); c.lineTo(x + w, base); c.closePath(); c.fillStyle = col; c.fill(); ink(c, 7); c.beginPath(); c.moveTo(x, base - h - w * 0.8); c.lineTo(x - w * 0.1, base); c.lineWidth = 4; c.strokeStyle = "rgba(255,255,255,0.45)"; c.stroke(); };
  spire(90, HORIZON_Y + 60, 520, 80, "#8a5ae0"); spire(190, HORIZON_Y + 40, 320, 60, "#b07af0"); spire(1000, HORIZON_Y + 60, 600, 90, "#7a4ad0"); spire(900, HORIZON_Y + 30, 280, 50, "#c08af0");
  const coral = (x: number, y: number, s: number) => { c.save(); c.translate(x, y); c.scale(s, s); c.beginPath(); c.ellipse(0, 0, 140, 40, 0, 0, Math.PI); c.lineTo(-140, 0); c.fillStyle = "#4a2a7a"; c.fill(); ink(c, 6); c.beginPath(); c.moveTo(-140, 0); c.lineTo(140, 0); ink(c, 6);
    for (let k = 0; k < 5; k++) { const bx = -100 + k * 50; c.beginPath(); c.moveTo(bx, 0); c.quadraticCurveTo(bx - 20, -60, bx + (k % 2 ? 20 : -20), -110 - (k % 3) * 20); c.lineWidth = 14; c.strokeStyle = INK; c.stroke(); c.lineWidth = 8; c.strokeStyle = ["#ff6aa8", "#ff9a4a", "#7affd8", "#ffd23a", "#ff6aa8"][k]; c.stroke(); } c.restore(); };
  coral(600, 560, 0.9); coral(330, 880, 0.6); coral(820, 720, 0.55);
  // ocean
  c.fillStyle = lg(c, 0, HORIZON_Y, 0, SHORE_Y, [[0, "#8a3a9a"], [0.5, "#4a2080"], [1, "#2a1060"]]); c.fillRect(0, HORIZON_Y, WW, SHORE_Y - HORIZON_Y);
  c.lineWidth = 4; for (let i = 0; i < 26; i++) { const y = HORIZON_Y + 10 + (i / 26) ** 1.5 * (SHORE_Y - HORIZON_Y); c.strokeStyle = `rgba(255,170,230,${0.15 + 0.2 * rnd(i)})`; c.beginPath(); for (let x = 0; x <= WW; x += 40) c.lineTo(x, y + Math.sin(x * 0.02 + i) * (2 + i * 0.3)); c.stroke(); }
  c.fillStyle = "rgba(255,200,240,0.35)"; for (let k = 0; k < 18; k++) { const y = HORIZON_Y + 40 + k * 30; c.fillRect(260 - k * 4 + rnd(k) * 20, y, 40 + k * 4, 5); } // moon reflection
  // shore: glowing sand + rocks + alien plants
  c.beginPath(); c.moveTo(0, SHORE_Y - 20); c.bezierCurveTo(300, SHORE_Y - 60, 700, SHORE_Y + 10, WW, SHORE_Y - 40); c.lineTo(WW, WH); c.lineTo(0, WH); c.closePath(); c.fillStyle = lg(c, 0, SHORE_Y, 0, WH, [[0, "#c08ad8"], [1, "#7a4aa8"]]); c.fill(); ink(c, 7);
  for (let i = 0; i < 40; i++) { c.fillStyle = `rgba(150,255,240,${0.3 + rnd(i) * 0.5})`; c.beginPath(); c.arc(rnd(i * 3) * WW, SHORE_Y + 30 + rnd(i * 5) * 280, 3 + rnd(i) * 4, 0, TAU); c.fill(); }
  for (const [x, y, s] of [[120, 1780, 1.2], [960, 1750, 1.0], [820, 1880, 0.8]] as [number, number, number][]) { c.save(); c.translate(x, y); c.scale(s, s); c.beginPath(); c.moveTo(-70, 0); c.quadraticCurveTo(-60, -80, 0, -90); c.quadraticCurveTo(70, -70, 70, 0); c.closePath(); c.fillStyle = "#5a3a8a"; c.fill(); ink(c, 6); c.restore(); }
  for (const [x, y] of [[60, 1660], [1020, 1640], [480, 1880]] as [number, number][]) for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(x + k * 18, y); c.quadraticCurveTo(x + k * 18 - 20, y - 70, x + k * 18 + 10, y - 110 - k * 10); c.lineWidth = 9; c.strokeStyle = INK; c.stroke(); c.lineWidth = 5; c.strokeStyle = "#7affd8"; c.stroke(); c.beginPath(); c.arc(x + k * 18 + 10, y - 114 - k * 10, 9, 0, TAU); c.fillStyle = "#c8fff0"; c.fill(); }
  cache.fu = cv; return cv;
}
// animated mist + bioluminescent shimmer on the ocean; wave = 0..1 travelling glow front (x position fraction), strength k
export function futureFX(c: Ctx, t: number, wave = -1, k = 0) {
  c.save(); c.globalCompositeOperation = "lighter";
  for (let i = 0; i < 40; i++) { const x = (rnd(i * 3) * WW + t * 20 * (rnd(i) - 0.5)) % WW, y = HORIZON_Y + 30 + rnd(i * 7) * (SHORE_Y - HORIZON_Y - 60), a = 0.25 + 0.25 * Math.sin(t * 3 + i); c.fillStyle = `rgba(120,255,230,${a})`; c.beginPath(); c.ellipse(x, y, 10, 3, 0, 0, TAU); c.fill(); }
  if (k > 0 && wave >= 0) { const fx = wave * (WW + 600) - 300; const g = c.createLinearGradient(fx - 500, 0, fx + 120, 0); g.addColorStop(0, "rgba(120,255,240,0)"); g.addColorStop(0.75, `rgba(150,255,240,${0.55 * k})`); g.addColorStop(1, "rgba(255,255,255,0)"); c.fillStyle = g; c.fillRect(0, HORIZON_Y - 150, WW, SHORE_Y - HORIZON_Y + 150); }
  c.restore();
  c.save(); for (let i = 0; i < 4; i++) { const x = ((t * 30 + i * 400) % (WW + 600)) - 300, y = HORIZON_Y + 80 + i * 120; const g = c.createRadialGradient(x, y, 10, x, y, 300); g.addColorStop(0, "rgba(255,220,250,0.18)"); g.addColorStop(1, "rgba(255,220,250,0)"); c.fillStyle = g; c.fillRect(x - 300, y - 120, 600, 240); } c.restore();
}

/* ===================== TIME MACHINE POD (washing machine) ===================== */
// (x,y) = floor centre under the pod, s = scale (1 => ~560 px tall). door 0..1 opens the porthole door. lights blink with t.
export function drawPod(c: Ctx, x: number, y: number, s: number, t: number, o: { door?: number; shake?: number; spark?: number; glowK?: number; occupant?: () => void } = {}) {
  const sh = o.shake ?? 0, jx = Math.sin(t * 57) * 10 * sh, jy = Math.cos(t * 49) * 6 * sh;
  c.save(); c.translate(x + jx, y + jy); c.scale(s, s); c.lineJoin = "round"; c.lineCap = "round";
  // contact shadow
  c.save(); c.scale(1, 0.18); c.beginPath(); c.arc(0, 0, 260, 0, TAU); c.fillStyle = "rgba(10,5,25,0.45)"; c.fill(); c.restore();
  // feet + body
  for (const fx of [-170, 170]) { rr(c, fx - 30, -24, 60, 24, 6); c.fillStyle = "#2b3350"; c.fill(); ink(c, 5); }
  rr(c, -220, -470, 440, 450, 34); c.fillStyle = lg(c, -220, 0, 220, 0, [[0, "#ffffff"], [0.6, "#e4e9f6"], [1, "#b9c3dc"]]); c.fill(); ink(c, 9);
  c.beginPath(); c.roundRect(-220, -470, 440, 92, [34, 34, 0, 0]); c.fillStyle = "#cfd6e8"; c.fill(); ink(c, 7);
  // control strip: knobs + blinking lights
  for (let k = 0; k < 2; k++) { c.beginPath(); c.arc(-150 + k * 80, -424, 24, 0, TAU); c.fillStyle = "#2b3350"; c.fill(); ink(c, 5); c.beginPath(); c.moveTo(-150 + k * 80, -424); c.lineTo(-150 + k * 80 + Math.cos(t * 2 + k) * 18, -424 + Math.sin(t * 2 + k) * 18); c.lineWidth = 5; c.strokeStyle = "#ffd23a"; c.stroke(); }
  for (let k = 0; k < 5; k++) { const on = Math.sin(t * 7 + k * 1.7) > 0; c.beginPath(); c.arc(20 + k * 38, -424, 11, 0, TAU); c.fillStyle = on ? ["#ff4a5a", "#ffd23a", "#4aff8a", "#4ad8ff", "#ff7af0"][k] : "#3a3f56"; c.fill(); ink(c, 4); if (on) glow(c, 20 + k * 38, -424, 30, "rgba(255,255,200,1)", 0.5); }
  // porthole: inner glow, occupant, door
  c.save(); c.translate(0, -210); c.beginPath(); c.arc(0, 0, 150, 0, TAU); c.fillStyle = "#8a92a8"; c.fill(); ink(c, 9);
  c.beginPath(); c.arc(0, 0, 118, 0, TAU); c.fillStyle = lg(c, 0, -118, 0, 118, [[0, "#1a2a5a"], [1, "#3a1a6a"]]); c.fill(); ink(c, 6);
  c.save(); c.beginPath(); c.arc(0, 0, 116, 0, TAU); c.clip(); if (o.occupant) o.occupant(); const gk = o.glowK ?? 0.3; glow(c, 0, 0, 150, "rgba(120,220,255,1)", gk); for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(0, 0, 40 + k * 26 + (t * 60 % 26), 0, TAU); c.lineWidth = 3; c.strokeStyle = `rgba(150,240,255,${0.3 * gk})`; c.stroke(); } c.restore();
  const d = o.door ?? 0; c.save(); c.translate(-150, 0); c.scale(Math.cos(d * 1.4), 1); c.translate(150, 0); c.beginPath(); c.arc(0, 0, 124, 0, TAU); c.fillStyle = "rgba(190,230,255,0.28)"; c.fill(); c.lineWidth = 14; c.strokeStyle = "#c0c8dc"; c.stroke(); c.lineWidth = 5; c.strokeStyle = INK; c.stroke(); c.beginPath(); c.ellipse(-50, -50, 40, 20, -0.7, 0, TAU); c.fillStyle = "rgba(255,255,255,0.55)"; c.fill(); rr(c, 106, -18, 34, 36, 8); c.fillStyle = "#2b3350"; c.fill(); ink(c, 4); c.restore();
  c.restore();
  // clock on top + antenna + coil + levers on the side
  c.save(); c.translate(0, -520); c.beginPath(); c.arc(0, 0, 64, 0, TAU); c.fillStyle = "#f0b429"; c.fill(); ink(c, 7); c.beginPath(); c.arc(0, 0, 48, 0, TAU); c.fillStyle = "#fffdf4"; c.fill(); ink(c, 4); c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.sin(t * 3) * 36, -Math.cos(t * 3) * 36); c.moveTo(0, 0); c.lineTo(Math.sin(t * 0.4) * 24, -Math.cos(t * 0.4) * 24); c.lineWidth = 6; c.strokeStyle = INK; c.stroke(); c.restore();
  c.beginPath(); c.moveTo(150, -470); c.lineTo(190, -640); c.lineWidth = 9; c.strokeStyle = INK; c.stroke(); c.beginPath(); c.arc(190, -650, 16, 0, TAU); c.fillStyle = Math.sin(t * 9) > 0 ? "#ff4a5a" : "#ffd23a"; c.fill(); ink(c, 4); glow(c, 190, -650, 50, "rgba(255,120,120,1)", 0.4);
  c.beginPath(); for (let k = 0; k < 8; k++) { c.ellipse(-190, -560 + k * 14, 26, 8, 0, 0, TAU); } c.lineWidth = 5; c.strokeStyle = "#ff9a4a"; c.stroke();
  for (const [lx, a] of [[230, -0.4], [250, 0.3]] as [number, number][]) { c.save(); c.translate(lx, -260); c.rotate(a + Math.sin(t * 2 + lx) * 0.05); rr(c, -6, -110, 12, 110, 4); c.fillStyle = "#8a92a8"; c.fill(); ink(c, 4); c.beginPath(); c.arc(0, -114, 16, 0, TAU); c.fillStyle = "#e5483f"; c.fill(); ink(c, 4); c.restore(); }
  // wires
  for (const [col, o2] of [["#e5483f", 0], ["#3a6fd8", 20], ["#4aff8a", 40]] as [string, number][]) { c.beginPath(); c.moveTo(-220, -100 - o2); c.bezierCurveTo(-320, -60 - o2, -300, -10, -380, 0); c.lineWidth = 12; c.strokeStyle = INK; c.stroke(); c.lineWidth = 6; c.strokeStyle = col; c.stroke(); }
  // sparks
  if ((o.spark ?? 0) > 0) { const k = o.spark!; c.save(); c.globalCompositeOperation = "lighter"; for (let i = 0; i < 16; i++) { const a = rnd(i + Math.floor(t * 12)) * TAU, r = 120 + rnd(i * 3 + Math.floor(t * 12)) * 260; const px = Math.cos(a) * r * 0.9, py = -260 + Math.sin(a) * r; c.beginPath(); c.moveTo(px, py); c.lineTo(px + Math.cos(a) * 40, py + Math.sin(a) * 40); c.lineWidth = 7; c.strokeStyle = `rgba(255,240,120,${k})`; c.stroke(); } c.restore(); }
  c.restore();
}

/* ===================== RETRO KEYBOARD + YEAR DISPLAY ===================== */
// key layout in local units (keyboard 900 x 300). Returns the world position of a named key.
export const KEYS: Record<string, [number, number]> = {}; (() => { const rows = ["1234567890", "QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"]; rows.forEach((r, ri) => [...r].forEach((ch, ci) => { KEYS[ch] = [-405 + ci * 84 + ri * 24, -230 + ri * 64]; })); KEYS.ENTER = [380, -70]; })();
export function keyPos(kx: number, ky: number, s: number, key: string): [number, number] { const k = KEYS[key]; return [kx + k[0] * s, ky + k[1] * s]; }
// keyboard at (kx, ky) = front-centre bottom; pressed = key name currently pressed
export function drawKeyboard(c: Ctx, kx: number, ky: number, s: number, t: number, pressed: string[] = [], glowK = 0.4) {
  c.save(); c.translate(kx, ky); c.scale(s, s); c.lineJoin = "round";
  c.beginPath(); c.moveTo(-470, 0); c.lineTo(470, 0); c.lineTo(440, -300); c.lineTo(-440, -300); c.closePath(); c.fillStyle = lg(c, 0, -300, 0, 0, [[0, "#d8c8a8"], [1, "#b8a07a"]]); c.fill(); ink(c, 9);
  for (const [ch, [x, y]] of Object.entries(KEYS)) { const dn = pressed.includes(ch) ? 8 : 0, w = ch === "ENTER" ? 120 : 70; rr(c, x - w / 2, y - 26 + dn, w, 54, 10); c.fillStyle = dn ? "#c8b48a" : ch === "ENTER" ? "#e5483f" : "#fffaf0"; c.fill(); ink(c, 5); rr(c, x - w / 2, y + 20 + dn, w, 8, 4); c.fillStyle = "rgba(0,0,0,0.2)"; c.fill();
    c.font = `900 ${ch === "ENTER" ? 24 : 30}px Inter`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillStyle = ch === "ENTER" ? "#fff" : "#3a2a1a"; c.fillText(ch, x, y + 2 + dn); }
  glow(c, 0, -150, 480, "rgba(120,220,255,1)", glowK * 0.25);
  c.restore();
}
// big 7-segment-style LED year display (string), at centre (dx, dy), width w
export function drawDisplay(c: Ctx, dx: number, dy: number, w: number, txt: string, t: number, o: { spin?: number; red?: boolean; sparks?: number; spinFrom?: number } = {}) {
  const h = w * 0.36; c.save(); c.translate(dx, dy); c.lineJoin = "round";
  rr(c, -w / 2 - 22, -h / 2 - 22, w + 44, h + 44, 26); c.fillStyle = "#3a3f56"; c.fill(); ink(c, 10);
  rr(c, -w / 2, -h / 2, w, h, 14); c.fillStyle = "#06120e"; c.fill(); ink(c, 6);
  for (let k = 0; k < 4; k++) { c.beginPath(); c.arc(-w / 2 - 6 + (k % 2) * (w + 12), -h / 2 - 6 + Math.floor(k / 2) * (h + 12), 6, 0, TAU); c.fillStyle = "#8a92a8"; c.fill(); }
  const col = o.red ? "#ff4a5a" : "#5affa0";
  const n = txt.length, fs = Math.min(h * 0.82, (w * 0.94) / (n * 0.62));
  c.font = `900 ${fs}px "Courier New", monospace`; c.textAlign = "center"; c.textBaseline = "middle";
  c.fillStyle = o.red ? "rgba(255,74,90,0.12)" : "rgba(90,255,160,0.1)"; c.fillText("8".repeat(n), 0, 4);
  c.save(); c.shadowColor = col; c.shadowBlur = 30; c.fillStyle = col; const sp = o.spin ?? 0;
  if (sp > 0) { const cw = fs * 0.62, x0 = -((n - 1) * cw) / 2; for (let i = 0; i < n; i++) { const ch = txt[i]; const roll = /[0-9]/.test(ch) && i >= (o.spinFrom ?? 0) && sp > rnd(i) * 0.4 ? String(Math.floor(rnd(i * 13 + Math.floor(t * 24)) * 10)) : ch; c.fillText(roll, x0 + i * cw, 4 + Math.sin(t * 40 + i) * 4 * sp); } }
  else c.fillText(txt, 0, 4);
  c.restore();
  c.fillStyle = "rgba(255,255,255,0.08)"; c.beginPath(); c.moveTo(-w / 2, -h / 2); c.lineTo(w / 2, -h / 2); c.lineTo(w / 2, -h / 6); c.lineTo(-w / 2, h / 6); c.fill();
  c.font = "900 26px Inter"; c.textAlign = "left"; c.fillStyle = "#c0c8dc"; c.fillText("YEAR", -w / 2 - 4, -h / 2 - 40);
  if ((o.sparks ?? 0) > 0) { c.save(); c.globalCompositeOperation = "lighter"; for (let i = 0; i < 14; i++) { const a = rnd(i + Math.floor(t * 15)) * TAU, r = w * (0.4 + rnd(i * 5 + Math.floor(t * 15)) * 0.3); c.beginPath(); c.moveTo(Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.5); c.lineTo(Math.cos(a) * r, Math.sin(a) * r * 0.65); c.lineWidth = 8; c.strokeStyle = `rgba(255,240,120,${o.sparks})`; c.stroke(); } c.restore(); }
  c.restore();
}

/* ===================== JELLYFISH ===================== */
// (x,y) = bell centre, r = bell radius. face: smile | wave | talk | challenge | wow. wave = tentacle raise 0..1. lit 0..1 extra glow
export function drawJelly(c: Ctx, x: number, y: number, r: number, t: number, o: { face?: "smile" | "talk" | "challenge" | "wow"; wave?: number; lit?: number; hue?: number; mouth?: number; flex?: number } = {}) {
  const hue = o.hue ?? 290, lit = o.lit ?? 0, pulse = 1 + Math.sin(t * 2.2 + x * 0.01) * 0.05;
  c.save(); c.translate(x, y); c.lineJoin = "round"; c.lineCap = "round";
  glow(c, 0, 0, r * (2.2 + lit * 1.4), `hsla(${hue},100%,75%,1)`, 0.35 + lit * 0.5);
  // tentacles
  for (let i = 0; i < 7; i++) { const bx = (i - 3) * r * 0.24, isWave = i === 6 && (o.wave ?? 0) > 0; c.beginPath(); c.moveTo(bx, r * 0.25);
    if (isWave) { const w = o.wave!; const ex = bx + r * (0.9 + 0.2 * Math.sin(t * 10)) * w, ey = r * 0.25 - r * 1.2 * w; c.bezierCurveTo(bx + r * 0.5, r * 0.6, ex + r * 0.1, ey + r * 0.6, ex, ey); }
    else for (let k = 1; k <= 8; k++) { const yy = r * 0.25 + k * r * 0.22, xx = bx + Math.sin(t * 2 + k * 0.7 + i) * r * 0.08 * k * 0.4 + (o.flex ?? 0) * Math.sin(i) * k * 3; c.lineTo(xx, yy); }
    c.lineWidth = r * 0.07; c.strokeStyle = `hsla(${hue},70%,30%,0.9)`; c.stroke(); c.lineWidth = r * 0.04; c.strokeStyle = `hsla(${hue},100%,${80 + lit * 15}%,0.95)`; c.stroke(); }
  // bell
  c.beginPath(); c.moveTo(-r * pulse, r * 0.25); c.bezierCurveTo(-r * 1.05 * pulse, -r * 1.1, r * 1.05 * pulse, -r * 1.1, r * pulse, r * 0.25); for (let k = 0; k <= 6; k++) { const xx = r * pulse - k * (2 * r * pulse) / 6; c.quadraticCurveTo(xx - r * pulse / 6, r * 0.42, xx - r * pulse / 3, r * 0.25); }
  c.closePath(); const g = c.createRadialGradient(-r * 0.3, -r * 0.5, r * 0.1, 0, 0, r * 1.2); g.addColorStop(0, `hsla(${hue},100%,${92 + lit * 6}%,0.92)`); g.addColorStop(0.6, `hsla(${hue},90%,${70 + lit * 15}%,0.75)`); g.addColorStop(1, `hsla(${hue},80%,45%,0.65)`); c.fillStyle = g; c.fill(); c.lineWidth = r * 0.05; c.strokeStyle = `hsla(${hue},60%,22%,1)`; c.stroke();
  c.fillStyle = "rgba(255,255,255,0.6)"; c.beginPath(); c.ellipse(-r * 0.4, -r * 0.55, r * 0.22, r * 0.1, -0.5, 0, TAU); c.fill();
  for (let k = 0; k < 6; k++) { c.beginPath(); c.arc(-r * 0.6 + k * r * 0.24, -r * 0.05 + Math.sin(k) * r * 0.1, r * 0.035, 0, TAU); c.fillStyle = `hsla(${hue + 40},100%,90%,${0.6 + 0.4 * Math.sin(t * 4 + k)})`; c.fill(); }
  // face
  const f = o.face ?? "smile", ex = r * 0.28, ey = -r * 0.25, er = r * 0.13;
  for (const sx of [-1, 1]) { c.save(); c.translate(sx * ex, ey);
    if (f === "challenge") { c.beginPath(); c.ellipse(0, 0, er, er * 1.1, 0, 0, TAU); c.fillStyle = "#1a0a2a"; c.fill(); c.beginPath(); c.arc(-er * 0.3, -er * 0.35, er * 0.3, 0, TAU); c.fillStyle = "#fff"; c.fill(); c.beginPath(); c.moveTo(-er * 1.4 * sx * -1, -er * 1.6); c.lineTo(er * 1.2 * sx * -1, -er * 0.9); c.lineWidth = r * 0.05; c.strokeStyle = "#1a0a2a"; c.stroke(); }
    else { const big = f === "wow" ? 1.3 : 1; c.beginPath(); c.ellipse(0, 0, er * big, er * 1.25 * big, 0, 0, TAU); c.fillStyle = "#1a0a2a"; c.fill(); c.beginPath(); c.arc(-er * 0.35, -er * 0.45, er * 0.35, 0, TAU); c.fillStyle = "#fff"; c.fill(); c.beginPath(); c.arc(er * 0.3, er * 0.4, er * 0.15, 0, TAU); c.fill(); }
    c.restore(); }
  c.fillStyle = "rgba(255,120,170,0.5)"; for (const sx of [-1, 1]) { c.beginPath(); c.ellipse(sx * r * 0.48, -r * 0.05, r * 0.11, r * 0.06, 0, 0, TAU); c.fill(); }
  const my = r * 0.02, mo = o.mouth ?? 0; c.beginPath();
  if (f === "talk" || mo > 0) { c.ellipse(0, my + r * 0.04, r * 0.09, r * 0.05 + r * 0.08 * mo, 0, 0, TAU); c.fillStyle = "#3a0a2a"; c.fill(); }
  else if (f === "challenge") { c.moveTo(-r * 0.14, my + r * 0.06); c.quadraticCurveTo(0, my - r * 0.02, r * 0.16, my + r * 0.02); c.lineWidth = r * 0.04; c.strokeStyle = "#1a0a2a"; c.stroke(); }
  else { c.arc(0, my - r * 0.04, r * 0.13, 0.3, Math.PI - 0.3); c.lineWidth = r * 0.04; c.strokeStyle = "#1a0a2a"; c.stroke(); }
  c.restore();
}
export function bubbleText(c: Ctx, x: number, y: number, txt: string, k: number, size = 70) {
  if (k <= 0) return; c.save(); c.translate(x, y - k * 60); c.globalAlpha = Math.min(1, k * 3) * (1 - Math.max(0, k - 0.8) * 5); c.font = `900 ${size}px Inter`; const w = c.measureText(txt).width + 60;
  c.beginPath(); c.ellipse(0, 0, w / 2, size * 0.8, 0, 0, TAU); c.fillStyle = "rgba(200,240,255,0.4)"; c.fill(); c.lineWidth = 5; c.strokeStyle = "rgba(255,255,255,0.9)"; c.stroke(); c.beginPath(); c.ellipse(-w * 0.25, -size * 0.35, w * 0.08, size * 0.12, -0.5, 0, TAU); c.fillStyle = "rgba(255,255,255,0.8)"; c.fill();
  c.textAlign = "center"; c.textBaseline = "middle"; c.lineJoin = "round"; c.lineWidth = 10; c.strokeStyle = INK; c.strokeText(txt, 0, 4); c.fillStyle = "#bff6ff"; c.fillText(txt, 0, 4); c.restore();
}
