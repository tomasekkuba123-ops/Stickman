// EP05 graphite drawings: stroke-by-stroke reveal from the pencil tip, sketchy double lines, hatching, melt + drips.
import { rnd } from "../../style/props2d";
type Ctx = CanvasRenderingContext2D;
export type V2 = [number, number];
export type Stroke = { pts: V2[]; w?: number; hatch?: boolean };
const TAU = Math.PI * 2;
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));

// densify a polyline so melt/jitter deform smoothly
const dens = (p: V2[], step = 14): V2[] => { const o: V2[] = []; for (let i = 0; i < p.length - 1; i++) { const [a, b] = [p[i], p[i + 1]]; const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step)); for (let k = 0; k < n; k++) o.push([lerp(a[0], b[0], k / n), lerp(a[1], b[1], k / n)]); } o.push(p[p.length - 1]); return o; };
const arc = (cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, n = 24): V2[] => Array.from({ length: n + 1 }, (_, i) => { const a = lerp(a0, a1, i / n); return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry] as V2; });
const S = (pts: V2[], w = 7, hatch = false): Stroke => ({ pts: dens(pts), w, hatch });

export type GOpt = { prog?: number; melt?: number; alpha?: number; t?: number; baseY?: number; seed?: number };
// draws strokes; returns the pencil tip (end of the revealed part)
export function gDraw(c: Ctx, strokes: Stroke[], o: GOpt = {}): V2 | null {
  const prog = clamp(o.prog ?? 1), melt = o.melt ?? 0, alpha = o.alpha ?? 1, seed = o.seed ?? 1, baseY = o.baseY ?? 99999;
  let total = 0; for (const s of strokes) for (let i = 1; i < s.pts.length; i++) total += Math.hypot(s.pts[i][0] - s.pts[i - 1][0], s.pts[i][1] - s.pts[i - 1][1]);
  let rem = total * prog, tip: V2 | null = null;
  const mp = (p: V2, i: number): V2 => { if (melt <= 0) return p; const sag = melt * (90 + 60 * Math.sin(p[0] * 0.05 + seed)) * clamp((baseY - p[1]) / 600 + 0.3); return [p[0] + Math.sin(p[1] * 0.04 + i) * 6 * melt, Math.min(baseY, p[1] + sag)]; };
  c.save(); c.lineCap = "round"; c.lineJoin = "round"; c.globalAlpha = alpha * (1 - 0.6 * clamp(melt - 0.6, 0, 1) / 0.4);
  for (let si = 0; si < strokes.length && rem > 0; si++) {
    const s = strokes[si]; const pts: V2[] = []; let r = rem;
    pts.push(mp(s.pts[0], 0)); for (let i = 1; i < s.pts.length; i++) { const a = s.pts[i - 1], b = s.pts[i], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (r >= L) { pts.push(mp(b, i)); r -= L; } else { const k = r / L; pts.push(mp([lerp(a[0], b[0], k), lerp(a[1], b[1], k)], i)); r = 0; break; } }
    rem = r; tip = pts[pts.length - 1];
    for (const [dx, dy, w, col] of [[1.8, -1.2, (s.w ?? 7) * 0.6, "rgba(110,110,120,0.55)"], [0, 0, s.w ?? 7, "rgba(62,62,72,0.92)"]] as [number, number, number, string][]) {
      c.beginPath(); pts.forEach((p, i) => { const j = Math.sin(i * 1.7 + si * 3 + seed) * 1.2; i ? c.lineTo(p[0] + dx + j, p[1] + dy - j) : c.moveTo(p[0] + dx, p[1] + dy); }); c.lineWidth = w; c.strokeStyle = col; c.stroke(); }
    if (melt > 0.15) for (let k = 0; k < pts.length; k += 7) { const p = pts[k], dl = melt * (30 + 50 * rnd(k + si * 11)); c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(p[0], Math.min(baseY, p[1] + dl)); c.lineWidth = 3 + melt * 3; c.strokeStyle = "rgba(80,80,90,0.7)"; c.stroke(); c.beginPath(); c.arc(p[0], Math.min(baseY, p[1] + dl), 3 + melt * 4, 0, TAU); c.fillStyle = "rgba(80,80,90,0.7)"; c.fill(); }
  }
  c.restore(); return tip;
}
const strokeLen = (s: Stroke) => { let L = 0; for (let i = 1; i < s.pts.length; i++) L += Math.hypot(s.pts[i][0] - s.pts[i - 1][0], s.pts[i][1] - s.pts[i - 1][1]); return L; };
// hatch fill for a closed area (rough diagonal pencil shading), revealed with k
export function gHatch(c: Ctx, poly: V2[], k: number, melt = 0, baseY = 99999, dens = 16) {
  if (k <= 0) return; c.save(); c.beginPath(); poly.forEach((p, i) => (i ? c.lineTo(p[0], p[1] + melt * 120) : c.moveTo(p[0], p[1] + melt * 120))); c.closePath(); c.clip();
  const xs = poly.map((p) => p[0]), ys = poly.map((p) => p[1]); const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  c.globalAlpha = 0.5 * (1 - clamp(melt - 0.6, 0, 1) / 0.4); c.strokeStyle = "rgba(90,90,100,0.6)"; c.lineWidth = 3;
  const n = Math.ceil((x1 - x0 + y1 - y0) / dens) * k; for (let i = 0; i < n; i++) { const x = x0 - (y1 - y0) + i * dens; c.beginPath(); c.moveTo(x, y1 + melt * 120); c.lineTo(x + (y1 - y0), y0 + melt * 120); c.stroke(); }
  c.restore(); void baseY;
}

/* ---------- generators (world px) ---------- */
export function cage(cx: number, baseY: number, w: number, h: number, missingBar = -1, smudge = 0): Stroke[] {
  const st: Stroke[] = []; const n = 7;
  st.push(S([[cx - w / 2 - 10, baseY], [cx + w / 2 + 10, baseY]], 10));
  for (let i = 0; i < n; i++) { if (i === missingBar && smudge >= 1) continue; const x = cx - w / 2 + (w * i) / (n - 1); const top = baseY - h + Math.pow(Math.abs(i - (n - 1) / 2) / ((n - 1) / 2), 2) * h * 0.25; st.push(S([[x, baseY], [x + Math.sin(i) * 3, (baseY + top) / 2], [x, top]], 9)); }
  st.push(S(arc(cx, baseY - h * 0.75, w / 2, h * 0.25, Math.PI, TAU, 30), 10));
  st.push(S([[cx, baseY - h], [cx, baseY - h - 40]], 7)); st.push(S(arc(cx, baseY - h - 56, 16, 16, 0, TAU, 14), 6));
  st.push(S([[cx - w / 2, baseY - h * 0.4], [cx + w / 2, baseY - h * 0.4]], 7)); // cross bar
  return st;
}
export const lockStrokes = (x: number, y: number): Stroke[] => [S([[x - 22, y], [x + 22, y], [x + 22, y + 40], [x - 22, y + 40], [x - 22, y]], 7), S(arc(x, y, 15, 20, Math.PI, TAU, 12), 6), S([[x, y + 14], [x, y + 26]], 6)];
export function crown(cx: number, y: number, s: number): Stroke[] {
  const p = (x: number, yy: number): V2 => [cx + x * s, y + yy * s];
  return [S([p(-60, 40), p(-70, -30), p(-35, 5), p(0, -45), p(35, 5), p(70, -30), p(60, 40), p(-60, 40)], 8), S([p(-60, 22), p(60, 22)], 6), ...[-70, 0, 70].map((x) => S(arc(cx + x * s, y + (x === 0 ? -55 : -40) * s, 8 * s, 8 * s, 0, TAU, 10), 5))];
}
export function throne(cx: number, baseY: number, s: number): Stroke[] {
  const p = (x: number, yy: number): V2 => [cx + x * s, baseY + yy * s];
  return [S([p(-120, 0), p(-120, -260), p(120, -260), p(120, 0)], 10), S([p(-130, -260), p(130, -260)], 10),
    S([p(-100, -260), p(-100, -560), p(-60, -620), p(0, -650), p(60, -620), p(100, -560), p(100, -260)], 10),
    S([p(-150, -260), p(-150, -380), p(-100, -380)], 9), S([p(150, -260), p(150, -380), p(100, -380)], 9),
    S(arc(cx, baseY - 470 * s, 40 * s, 40 * s, 0, TAU, 16), 7), S([p(-100, -150), p(100, -150)], 6), S([p(-110, 0), p(-110, 30)], 9), S([p(110, 0), p(110, 30)], 9)];
}
export const thronePoly = (cx: number, baseY: number, s: number): V2[] => [[cx - 100 * s, baseY - 260 * s], [cx - 100 * s, baseY - 560 * s], [cx, baseY - 650 * s], [cx + 100 * s, baseY - 560 * s], [cx + 100 * s, baseY - 260 * s]];
export function castle(cx: number, baseY: number, w: number, h: number): Stroke[] {
  const st: Stroke[] = []; const x0 = cx - w / 2, x1 = cx + w / 2, wallTop = baseY - h * 0.55;
  const merlons = (a: number, b: number, y: number): V2[] => { const o: V2[] = [[a, y]]; const n = Math.round((b - a) / 50); for (let i = 0; i < n; i++) { const x = a + ((b - a) * i) / n, x2 = a + ((b - a) * (i + 0.5)) / n, x3 = a + ((b - a) * (i + 1)) / n; o.push([x, y - 30], [x2, y - 30], [x2, y], [x3, y]); } return o; };
  st.push(S(merlons(x0 + 120, x1 - 120, wallTop), 8));
  for (const tx of [x0 + 60, x1 - 60]) { st.push(S([[tx - 60, baseY], [tx - 60, baseY - h], [tx + 60, baseY - h], [tx + 60, baseY]], 9)); st.push(S([[tx - 75, baseY - h], [tx, baseY - h - 140], [tx + 75, baseY - h]], 9)); st.push(S([[tx, baseY - h - 140], [tx, baseY - h - 220], [tx + 60, baseY - h - 195], [tx, baseY - h - 175]], 6)); st.push(S([[tx - 15, baseY - h * 0.7], [tx - 15, baseY - h * 0.6], [tx + 15, baseY - h * 0.6], [tx + 15, baseY - h * 0.7]], 6)); }
  st.push(S([[x0 + 120, wallTop], [x0 + 120, baseY]], 8)); st.push(S([[x1 - 120, wallTop], [x1 - 120, baseY]], 8));
  for (let i = 0; i < 6; i++) { const y = wallTop + 30 + i * ((baseY - wallTop - 30) / 6); st.push(S([[x0 + 130, y], [x0 + 300, y]], 4)); st.push(S([[x1 - 300, y + 20], [x1 - 130, y + 20]], 4)); } // brick hints
  return st;
}
// clumsy badly-drawn dog (side view). phase animates wobbly legs; yip 0..1 opens the mouth
export function dog(x: number, y: number, s: number, phase: number, yip = 0, flip = false): Stroke[] {
  const f = flip ? -1 : 1, p = (a: number, b: number): V2 => [x + a * s * f, y + b * s];
  const lg = (lx: number, ph: number) => S([p(lx, -40), p(lx + Math.sin(phase + ph) * 10, -12), p(lx + 6 + Math.sin(phase + ph) * 14, 0)], 7);
  return [S(arc(x, y - 70 * s, 90 * s, 42 * s, 0, TAU, 28), 8), // lumpy body
    S([p(80, -90), p(130, -130), p(175, -110), p(170, -70 + yip * 12), p(120, -62)], 8), // head (wonky)
    S([p(130, -128), p(118, -175), p(150, -138)], 7), S([p(160, -122), p(172, -160), p(178, -116)], 7), // ears uneven
    S([p(150, -100), p(152, -96)], 9), S([p(170, -72 + yip * 12), p(185, -60 + yip * 20)], 6), // dot eye + mouth
    S([p(-88, -88), p(-130, -130 + Math.sin(phase * 2) * 18), p(-140, -150)], 7), // tail
    lg(-60, 0), lg(-30, 2), lg(40, 1), lg(70, 3)];
}
export function signBoard(x: number, y: number, w: number, h: number): Stroke[] { return [S([[x - w / 2, y - h / 2], [x + w / 2, y - h / 2], [x + w / 2, y + h / 2], [x - w / 2, y + h / 2], [x - w / 2, y - h / 2]], 8), S([[x - w * 0.3, y - h / 2], [x - w * 0.36, y - h / 2 - 90]], 6), S([[x + w * 0.3, y - h / 2], [x + w * 0.36, y - h / 2 - 90]], 6), S(arc(x - w * 0.36, y - h / 2 - 96, 8, 8, 0, TAU, 8), 5), S(arc(x + w * 0.36, y - h / 2 - 96, 8, 8, 0, TAU, 8), 5)]; }
// handwritten graphite text revealed left->right; returns tip
export function gText(c: Ctx, txt: string, x: number, y: number, size: number, prog: number): V2 {
  c.save(); c.font = `900 ${size}px "Comic Sans MS", "Inter", Arial`; c.textAlign = "left"; c.textBaseline = "middle"; const w = c.measureText(txt).width, x0 = x - w / 2;
  c.beginPath(); c.rect(x0 - 10, y - size, (w + 20) * clamp(prog), size * 2); c.clip();
  c.lineJoin = "round"; c.lineWidth = size * 0.07; c.strokeStyle = "rgba(110,110,120,0.5)"; c.strokeText(txt, x0 + 2, y - 2); c.fillStyle = "rgba(55,55,66,0.92)"; c.fillText(txt, x0, y);
  c.restore(); return [x0 + w * clamp(prog), y + size * 0.3];
}
// puddle of graphite (grey) with sheen
export function gPuddle(c: Ctx, x: number, y: number, rx: number, ry: number, k: number, t = 0) {
  if (k <= 0) return; c.save(); c.beginPath(); for (let i = 0; i <= 40; i++) { const a = i / 40 * TAU, w = 1 + 0.12 * Math.sin(a * 3 + 1) + 0.06 * Math.sin(a * 7); c.lineTo(x + Math.cos(a) * rx * k * w, y + Math.sin(a) * ry * k * w); } c.closePath();
  const g = c.createRadialGradient(x - rx * 0.2, y - ry * 0.3, 2, x, y, rx * k); g.addColorStop(0, "#9a9aa6"); g.addColorStop(1, "#5a5a66"); c.fillStyle = g; c.fill(); c.lineWidth = 5; c.strokeStyle = "rgba(40,40,50,0.8)"; c.stroke();
  c.fillStyle = "rgba(255,255,255,0.45)"; c.beginPath(); c.ellipse(x - rx * 0.3 * k, y - ry * 0.35 * k, rx * 0.25 * k, ry * 0.12 * k, -0.2, 0, TAU); c.fill(); void t; c.restore();
}
