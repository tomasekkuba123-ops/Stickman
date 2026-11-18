// STICKMAN rig v2 — the channel's default hero. Layered 2D vector parts traced from the official model sheet
// (02-videos/ep02/STICKMAN_FINAL_LOOK.png, 01_MAIN_CHARACTER_LATEST_MODEL_SHEET.png).
// Units: the character is 1000 units tall (hair tip ~0, sole baseline 1000). Proportions: head ~30 %, hoodie ~31 %,
// visible legs ~25 %, sneakers ~10 %. Views: front, side (facing right; flip -> left), back.
// Every joint is an explicit angle (FK) or a hand IK target; feet are auto-grounded to the baseline.

export type View = "front" | "side" | "back";
export type HandPose = "open" | "relaxed" | "fist" | "thumb" | "point" | "hold";
export type Face = "smile" | "laugh" | "think" | "surprised" | "worried" | "determined" | "scared" | "neutral" | "grin";
export type Arm = { a: number; b: number }; // degrees: a = upper arm from hanging-down (+ outward in front view, + forward in side view); b = elbow bend (forearm = a + b)
export type Leg = { a: number; b: number; f?: number; lift?: number }; // side: a thigh fwd+, b knee bend, f foot pitch (+ toe up). front: a outward+, lift raises the foot
export type Rig = {
  t: number; view?: View; flip?: boolean; face?: Face; lookX?: number; lookY?: number; blink?: number;
  x?: number; y?: number; /* body offset in units (y up = negative) */ air?: number; /* extra height above the ground */
  lean?: number; /* deg, + forward/right */ headTilt?: number; squash?: number; /* + stretch, - squash */ breath?: number;
  armL?: Arm; armR?: Arm; ikL?: [number, number]; ikR?: [number, number]; ikKL?: number; ikKR?: number; /* hand targets (units, x from body centre, y from baseline up) */
  handL?: HandPose; handR?: HandPose; handRotL?: number; handRotR?: number;
  legL?: Leg; legR?: Leg; grounded?: boolean;
  hug?: (c: CanvasRenderingContext2D, x: number, y: number) => void; // drawn over the torso, under the hands (units)
  backpack?: boolean; handsOverHead?: boolean; /* draw arms after the head (hand on chin / face) */
};

const INK = "#101018", RED = "#e2262c", RED_L = "#f2484a", RED_D = "#b51a22", RED_DD = "#8e121a";
const GLOVE = "#ffffff", GLOVE_S = "#c9d2ea", BAG = "#3b3c48", BAG_L = "#55566a", SOLE = "#ffffff";
const LW = 9; // main outline width (units)
const rad = (d: number) => (d * Math.PI) / 180;
type P = [number, number];
const add = (a: P, b: P): P => [a[0] + b[0], a[1] + b[1]];
const rot = (v: P, ang: number): P => [v[0] * Math.cos(ang) - v[1] * Math.sin(ang), v[0] * Math.sin(ang) + v[1] * Math.cos(ang)];
const dirDown = (ang: number, sx: number): P => [Math.sin(ang) * sx, Math.cos(ang)]; // angle from straight down

// segment lengths
const UPPER = 138, FORE = 128, THIGH = 140, SHIN = 132;

/* ---------- generic helpers ---------- */
function stroke(c: CanvasRenderingContext2D, w = LW, col = INK) { c.lineWidth = w; c.strokeStyle = col; c.stroke(); }
function fillStroke(c: CanvasRenderingContext2D, fill: string | CanvasGradient, w = LW) { c.fillStyle = fill; c.fill(); stroke(c, w); }
// tapered tube polygon through points with per-point widths
function tube(c: CanvasRenderingContext2D, pts: P[], ws: number[]) {
  const L: P[] = [], R: P[] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], n = Math.hypot(dx, dy) || 1, nx = -dy / n, ny = dx / n;
    L.push([pts[i][0] + nx * ws[i] / 2, pts[i][1] + ny * ws[i] / 2]); R.push([pts[i][0] - nx * ws[i] / 2, pts[i][1] - ny * ws[i] / 2]);
  }
  c.beginPath(); c.moveTo(L[0][0], L[0][1]);
  for (let i = 1; i < L.length; i++) { const m = [(L[i - 1][0] + L[i][0]) / 2, (L[i - 1][1] + L[i][1]) / 2]; c.quadraticCurveTo(L[i - 1][0], L[i - 1][1], m[0], m[1]); }
  c.lineTo(L[L.length - 1][0], L[L.length - 1][1]);
  const e = pts[pts.length - 1], ew = ws[ws.length - 1] / 2, ang = Math.atan2(pts[pts.length - 1][1] - pts[pts.length - 2][1], pts[pts.length - 1][0] - pts[pts.length - 2][0]);
  c.arc(e[0], e[1], ew, ang - Math.PI / 2, ang + Math.PI / 2);
  for (let i = R.length - 1; i > 0; i--) { const m = [(R[i - 1][0] + R[i][0]) / 2, (R[i - 1][1] + R[i][1]) / 2]; c.quadraticCurveTo(R[i][0], R[i][1], m[0], m[1]); }
  c.lineTo(R[0][0], R[0][1]);
  const s = pts[0], sw = ws[0] / 2, a0 = Math.atan2(pts[1][1] - pts[0][1], pts[1][0] - pts[0][0]);
  c.arc(s[0], s[1], sw, a0 + Math.PI / 2, a0 + Math.PI * 1.5); c.closePath();
}
// 2-bone IK: returns elbow given shoulder, target, lengths and bend side (+1/-1)
function ik(s: P, t: P, l1: number, l2: number, side: number): [P, P] {
  let dx = t[0] - s[0], dy = t[1] - s[1]; let d = Math.hypot(dx, dy); const maxd = l1 + l2 - 0.5;
  if (d > maxd) { dx *= maxd / d; dy *= maxd / d; d = maxd; }
  const a = Math.atan2(dy, dx), cosA = (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), A = Math.acos(Math.max(-1, Math.min(1, cosA)));
  const e: P = [s[0] + Math.cos(a + side * A) * l1, s[1] + Math.sin(a + side * A) * l1];
  return [e, [s[0] + dx, s[1] + dy]];
}

/* ---------- gloves (local frame: wrist at origin, +y along the forearm) ---------- */
function finger(c: CanvasRenderingContext2D, x: number, y: number, ang: number, len: number, w: number) {
  c.save(); c.translate(x, y); c.rotate(ang); c.beginPath(); c.roundRect(-w / 2, -w / 2, w, len + w / 2, w / 2); c.fillStyle = GLOVE; c.fill(); stroke(c, 6); c.restore();
}
export function drawGlove(c: CanvasRenderingContext2D, x: number, y: number, ang: number, pose: HandPose, mirror: boolean, s = 1.28) {
  c.save(); c.translate(x, y); c.rotate(ang); c.scale(mirror ? -s : s, s);
  // cuff
  c.beginPath(); c.roundRect(-30, -6, 60, 26, 10); fillStroke(c, GLOVE, 7);
  c.beginPath(); c.moveTo(-24, 13); c.lineTo(24, 13); stroke(c, 3, GLOVE_S);
  const palm = () => { c.beginPath(); c.ellipse(0, 50, 36, 34, 0, 0, Math.PI * 2); fillStroke(c, GLOVE, 7); };
  if (pose === "open" || pose === "relaxed") {
    const spread = pose === "open" ? 1 : 0.35;
    finger(c, 24, 36, rad(-70 * spread - 10), 30, 20); // thumb
    for (let i = 0; i < 4; i++) finger(c, -18 + i * 12, 70, rad((-24 + i * 16) * spread), 34 + (i === 1 || i === 2 ? 6 : 0), 17);
    palm(); c.beginPath(); c.arc(0, 44, 18, 0.3, 2.4); stroke(c, 3, GLOVE_S);
  } else if (pose === "hold") {
    palm(); c.beginPath(); c.arc(4, 64, 26, rad(-20), rad(200)); stroke(c, 16, INK); c.beginPath(); c.arc(4, 64, 26, rad(-20), rad(200)); stroke(c, 8, GLOVE);
    finger(c, 26, 40, rad(-40), 22, 18);
  } else {
    if (pose === "point") finger(c, -8, 66, 0, 58, 18);
    if (pose === "thumb") finger(c, 14, 72, rad(-8), 50, 23);
    c.beginPath(); c.ellipse(0, 50, 38, 36, 0, 0, Math.PI * 2); fillStroke(c, GLOVE, 7);
    c.lineWidth = 4; c.strokeStyle = GLOVE_S; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(-26 + i * 14, 70 - Math.abs(i - 1) * 2); c.lineTo(-22 + i * 14, 80); c.stroke(); }
    c.beginPath(); c.arc(-4, 44, 20, rad(200), rad(320)); stroke(c, 4, GLOVE_S);
    if (pose !== "thumb") { c.beginPath(); c.moveTo(24, 34); c.quadraticCurveTo(10, 52, -6, 50); stroke(c, 6); }
  }
  c.restore();
}

/* ---------- sneakers ---------- */
// side profile, ankle at origin, toe to +x, sole bottom at y = +98
function shoeSide(c: CanvasRenderingContext2D, dark: boolean) {
  const up = dark ? RED_D : RED;
  c.beginPath(); c.roundRect(-62, 66, 194, 32, 14); fillStroke(c, SOLE, 8);
  c.beginPath(); c.moveTo(-54, 84); c.lineTo(124, 84); stroke(c, 3, "#b8c0d8");
  c.beginPath(); c.moveTo(-52, -14); c.quadraticCurveTo(-68, 28, -60, 68); c.lineTo(124, 68); c.quadraticCurveTo(138, 36, 106, 20); c.quadraticCurveTo(66, 6, 34, -14); c.quadraticCurveTo(-8, -22, -52, -14); c.closePath();
  const g = c.createLinearGradient(0, -10, 0, 70); g.addColorStop(0, dark ? RED_DD : RED_L); g.addColorStop(1, up); fillStroke(c, g, 8);
  c.beginPath(); c.moveTo(78, 68); c.lineTo(122, 68); c.quadraticCurveTo(132, 44, 108, 30); c.quadraticCurveTo(84, 30, 78, 68); c.closePath(); fillStroke(c, SOLE, 6); // toe cap
  for (const x of [-6, 26]) { c.beginPath(); c.moveTo(x, 62); c.lineTo(x + 16, 62); c.lineTo(x + 40, 16); c.lineTo(x + 26, 12); c.closePath(); fillStroke(c, SOLE, 5); } // stripes
  c.beginPath(); c.moveTo(-46, -2); c.quadraticCurveTo(-8, -12, 30, -4); stroke(c, 10, dark ? "#d8dcea" : "#ffffff"); c.beginPath(); c.moveTo(-46, -2); c.quadraticCurveTo(-8, -12, 30, -4); stroke(c, 3); // collar
  c.beginPath(); c.moveTo(46, 6); c.lineTo(60, 14); c.moveTo(56, 2); c.lineTo(70, 12); stroke(c, 4, "#ffffff"); // laces
}
// front 3/4 view, ankle at origin, toe points down-outward (+x), sole bottom y = +98
function shoeFront(c: CanvasRenderingContext2D) {
  c.beginPath(); c.roundRect(-64, 62, 162, 36, 16); fillStroke(c, SOLE, 8);
  c.beginPath(); c.moveTo(-52, 84); c.lineTo(86, 84); stroke(c, 3, "#b8c0d8");
  c.beginPath(); c.moveTo(-38, -14); c.quadraticCurveTo(-68, 24, -58, 68); c.lineTo(92, 68); c.quadraticCurveTo(102, 26, 60, 8); c.quadraticCurveTo(26, -6, 24, -16); c.quadraticCurveTo(-6, -24, -38, -14); c.closePath();
  const g = c.createLinearGradient(0, -10, 0, 70); g.addColorStop(0, RED_L); g.addColorStop(1, RED); fillStroke(c, g, 8);
  c.beginPath(); c.moveTo(18, 68); c.lineTo(88, 68); c.quadraticCurveTo(92, 40, 62, 30); c.quadraticCurveTo(26, 34, 18, 68); c.closePath(); fillStroke(c, SOLE, 6);
  for (const x of [-40, -18]) { c.beginPath(); c.moveTo(x, 58); c.lineTo(x + 13, 58); c.lineTo(x + 26, 22); c.lineTo(x + 14, 20); c.closePath(); fillStroke(c, SOLE, 5); }
  c.beginPath(); c.moveTo(-30, -4); c.quadraticCurveTo(-4, -12, 20, -6); stroke(c, 10, "#ffffff"); c.beginPath(); c.moveTo(-30, -4); c.quadraticCurveTo(-4, -12, 20, -6); stroke(c, 3);
}

/* ---------- head + face ---------- */
const HR = 150;
function hair(c: CanvasRenderingContext2D, hx: number, hy: number, t: number, side: boolean) {
  // 3-4 thin curved strands from the crown
  const sway = Math.sin(t * 0.18) * 0.04;
  const strands: [number, number, number, number][] = side ? [[-20, 78, -0.55, -1], [6, 104, -0.15, 1], [26, 84, 0.25, 1], [-42, 56, -0.9, -1]] : [[-34, 80, -0.5, -1], [-6, 108, -0.12, 1], [22, 92, 0.32, 1], [40, 60, 0.7, 1]];
  for (const [dx, len, ang, bend] of strands) {
    const bx = hx + dx, by = hy - Math.sqrt(Math.max(0, HR * HR - dx * dx)) + 6, a = ang + sway;
    const tx = bx + Math.sin(a) * len, ty = by - Math.cos(a) * len, mx = (bx + tx) / 2 + bend * 16 * Math.cos(a), my = (by + ty) / 2 + bend * 6;
    c.beginPath(); c.moveTo(bx - 6, by + 4); c.quadraticCurveTo(mx - 4, my, tx, ty); c.quadraticCurveTo(mx + 5, my + 3, bx + 6, by + 4); c.closePath(); c.fillStyle = INK; c.fill(); stroke(c, 2);
  }
}
function headBall(c: CanvasRenderingContext2D, hx: number, hy: number, faceDir: number) {
  c.beginPath(); c.arc(hx, hy, HR, 0, Math.PI * 2); c.fillStyle = "#ffffff"; c.fill();
  c.save(); c.beginPath(); c.arc(hx, hy, HR, 0, Math.PI * 2); c.clip();
  const g = c.createRadialGradient(hx - 50 * faceDir, hy - 60, 20, hx, hy, HR * 1.05); g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.72, "rgba(248,250,255,1)"); g.addColorStop(1, "rgba(214,222,244,1)");
  c.fillStyle = g; c.fillRect(hx - HR, hy - HR, HR * 2, HR * 2);
  c.fillStyle = "rgba(160,176,222,0.22)"; c.beginPath(); c.ellipse(hx + 96 * faceDir, hy + 56, HR * 0.62, HR * 0.9, 0.35 * faceDir, 0, Math.PI * 2); c.fill(); // soft grey-blue side
  c.beginPath(); c.arc(hx, hy, HR - 26, rad(faceDir > 0 ? 140 : -40), rad(faceDir > 0 ? 200 : 20)); stroke(c, 12, "rgba(200,214,248,0.85)"); // glossy rim highlight
  c.restore();
  c.beginPath(); c.ellipse(hx - 66 * faceDir, hy - 88, 22, 12, -0.6 * faceDir, 0, Math.PI * 2); c.fillStyle = "rgba(255,255,255,0.95)"; c.fill();
  c.beginPath(); c.arc(hx, hy, HR, 0, Math.PI * 2); stroke(c, 11);
}
function face(c: CanvasRenderingContext2D, hx: number, hy: number, r: Rig, side: boolean) {
  const f = r.face ?? "smile", lx = (r.lookX ?? 0) * 8, ly = (r.lookY ?? 0) * 8, bl = (r.blink ?? 0) > 0.5;
  const eyes: [number, number, number][] = side ? [[hx + 30, hy + 2, 0.8], [hx + 94, hy + 2, 0.68]] : [[hx - 50, hy + 2, 1.1], [hx + 50, hy + 2, 1.1]];
  const big = f === "surprised" || f === "scared" ? 1.18 : 1;
  // eyes
  for (const [ex, ey, sx] of eyes) {
    if (f === "laugh" || f === "grin") { c.beginPath(); c.arc(ex, ey + 14, 24 * sx, rad(200), rad(340)); stroke(c, 9); continue; }
    if (bl) { c.beginPath(); c.arc(ex, ey - 6, 22 * sx, rad(20), rad(160)); stroke(c, 8); continue; }
    c.beginPath(); c.ellipse(ex + lx, ey + ly, 23 * sx * big, 39 * big, 0, 0, Math.PI * 2); c.fillStyle = INK; c.fill();
    c.beginPath(); c.ellipse(ex + lx - 7 * sx, ey + ly - 14 * big, 8 * sx, 11, -0.2, 0, Math.PI * 2); c.fillStyle = "#fff"; c.fill();
    c.beginPath(); c.arc(ex + lx + 6 * sx, ey + ly + 16 * big, 3.5, 0, Math.PI * 2); c.fill();
  }
  // brows (thin arcs)
  const [e0, e1] = eyes;
  const brow = (ex: number, ey: number, sx: number, lift: number, tilt: number) => { c.beginPath(); c.moveTo(ex - 24 * sx, ey - 52 - lift + tilt); c.quadraticCurveTo(ex, ey - 70 - lift, ex + 24 * sx, ey - 52 - lift - tilt); stroke(c, 6.5); };
  if (f === "think") { brow(e0[0], e0[1], e0[2], -4, -4); brow(e1[0], e1[1], e1[2], 18, 6); }
  else if (f === "surprised" || f === "scared") { brow(e0[0], e0[1], e0[2], 20, 0); brow(e1[0], e1[1], e1[2], 20, 0); }
  else if (f === "worried") { brow(e0[0], e0[1], e0[2], 6, -10); brow(e1[0], e1[1], e1[2], 6, 10); }
  else if (f === "determined") { brow(e0[0], e0[1], e0[2], -6, 12); brow(e1[0], e1[1], e1[2], -6, -12); }
  else { brow(e0[0], e0[1], e0[2], f === "laugh" ? 10 : 2, 0); brow(e1[0], e1[1], e1[2], f === "laugh" ? 10 : 2, 0); }
  // mouth
  const mx = side ? hx + 70 : hx, my = hy + 78;
  c.beginPath();
  if (f === "laugh" || f === "grin") {
    const h = f === "laugh" ? 54 : 40; c.moveTo(mx - 40, my - 10); c.quadraticCurveTo(mx, my - 2, mx + 40, my - 10); c.quadraticCurveTo(mx + 34, my + h, mx, my + h + 2); c.quadraticCurveTo(mx - 34, my + h, mx - 40, my - 10); c.closePath(); c.fillStyle = "#3a1222"; c.fill();
    c.save(); c.clip(); c.fillStyle = "#ff7d8e"; c.beginPath(); c.ellipse(mx + 4, my + h, 26, 18, 0, 0, Math.PI * 2); c.fill(); c.fillStyle = "#ffffff"; c.fillRect(mx - 34, my - 12, 68, 12); c.restore(); stroke(c, 7);
  } else if (f === "surprised" || f === "scared") { c.ellipse(mx, my + 10, 16, 22, 0, 0, Math.PI * 2); c.fillStyle = "#3a1222"; c.fill(); stroke(c, 7); }
  else if (f === "think") { c.ellipse(mx + 14, my + 6, 9, 11, 0, 0, Math.PI * 2); c.fillStyle = "#3a1222"; c.fill(); stroke(c, 6); }
  else if (f === "worried") { c.moveTo(mx - 30, my + 14); c.quadraticCurveTo(mx - 10, my + 2, mx, my + 8); c.quadraticCurveTo(mx + 12, my + 14, mx + 30, my + 6); stroke(c, 7); }
  else if (f === "determined") { c.moveTo(mx - 28, my + 8); c.quadraticCurveTo(mx, my + 2, mx + 28, my + 8); stroke(c, 7); }
  else if (f === "neutral") { c.moveTo(mx - 22, my + 6); c.lineTo(mx + 22, my + 6); stroke(c, 7); }
  else { c.moveTo(mx - 46, my - 6); c.quadraticCurveTo(mx, my + 40, mx + 46, my - 6); stroke(c, 7.5); }
}

/* ---------- main ---------- */
type Geo = { hip: P; hipL: P; hipR: P; kneeL: P; kneeR: P; ankL: P; ankR: P; footL: number; footR: number; sh: P; shL: P; shR: P; elL: P; elR: P; wrL: P; wrR: P; head: P };
export function drawStickman(c: CanvasRenderingContext2D, W: number, H: number, r: Rig) {
  c.clearRect(0, 0, W, H); c.save();
  const S = (H * 0.955) / 1040; // 1000 units + hair headroom
  c.translate(W / 2, H * 0.985 - 1000 * S); c.scale(S, S);
  if (r.flip) c.scale(-1, 1);
  c.lineCap = "round"; c.lineJoin = "round";
  const view = r.view ?? "front", side = view === "side", t = r.t;
  const breath = (r.breath ?? 1) * Math.sin(t * 0.2) * 4;
  const lean = rad(r.lean ?? 0), sq = r.squash ?? 0;
  // ---- skeleton (pre-grounding) ----
  const hip: P = [r.x ?? 0, 632 + (r.y ?? 0)];
  const torsoPt = (p: P): P => { const v = rot([p[0] * (1 - sq * 0.5), p[1] * (1 + sq)], lean); return add(hip, v); }; // local torso offset (from hip) -> world
  const legs = (leg: Leg | undefined, sx: number): [P, P, P, number] => {
    const L = leg ?? { a: 0, b: 0 };
    const h = side ? add(hip, [sx * -6, 0]) : add(hip, [sx * 46, 0]);
    if (side) { const k = add(h, [Math.sin(rad(L.a)) * THIGH, Math.cos(rad(L.a)) * THIGH]); const sa = rad(L.a - L.b); const a: P = add(k, [Math.sin(sa) * SHIN, Math.cos(sa) * SHIN]); return [h, k, a, rad(L.f ?? 0)]; }
    const lift = L.lift ?? 0, ang = rad(L.a) * sx; const len = THIGH + SHIN - lift;
    const a: P = add(h, [Math.sin(ang) * len, Math.cos(ang) * len]); const k: P = [(h[0] + a[0]) / 2 + sx * lift * 0.35, (h[1] + a[1]) / 2]; return [h, k, a, 0];
  };
  const [hipL, kneeL, ankL, footL] = legs(r.legL, -1), [hipR, kneeR, ankR, footR] = legs(r.legR, 1);
  // grounding: lowest sole point touches y = 1000
  const soleY = (a: P, f: number) => side ? Math.max(a[1] + rot([-60, 98], -f)[1], a[1] + rot([130, 98], -f)[1]) : a[1] + 98;
  let gy = 0; if (r.grounded !== false) gy = 1000 - Math.max(soleY(ankL, footL), soleY(ankR, footR));
  gy -= (r.air ?? 0);
  c.translate(0, gy);
  const shBase: P = side ? [8, -258] : [0, -258];
  const sh = torsoPt([0, -258]);
  const shL = torsoPt(side ? [shBase[0] - 10, shBase[1] + 6] : [-140, -246 + breath * 0.3]), shR = torsoPt(side ? [shBase[0] + 4, shBase[1] + 4] : [140, -246 + breath * 0.3]);
  const armPts = (arm: Arm | undefined, s: P, sx: number, ikT?: [number, number], ikK = 1): [P, P] => {
    const A = arm ?? { a: 8, b: 6 };
    const fa = rad(A.a) + lean * (side ? 1 : 0), fb = rad(A.a + A.b) + lean * (side ? 1 : 0);
    let e: P = add(s, dirDown(fa, side ? 1 : sx).map((v) => v * UPPER) as P), w: P = add(e, dirDown(fb, side ? 1 : sx).map((v) => v * FORE) as P);
    if (ikT && ikK > 0) { const tgt: P = [ikT[0], 1000 - ikT[1] - gy]; const [ie, iw] = ik(s, tgt, UPPER, FORE, side ? -1 : sx > 0 ? -1 : 1); e = [e[0] + (ie[0] - e[0]) * ikK, e[1] + (ie[1] - e[1]) * ikK]; w = [w[0] + (iw[0] - w[0]) * ikK, w[1] + (iw[1] - w[1]) * ikK]; }
    return [e, w];
  };
  const [elL, wrL] = armPts(r.armL, shL, -1, r.ikL, r.ikKL ?? 1), [elR, wrR] = armPts(r.armR, shR, 1, r.ikR, r.ikKR ?? 1);
  const head = torsoPt([side ? 14 : 0, -442 + breath * 0.5]);
  const g: Geo = { hip, hipL, hipR, kneeL, kneeR, ankL, ankR, footL, footR, sh, shL, shR, elL, elR, wrL, wrR, head };
  if (view === "side") drawSide(c, r, g, breath, lean, sq, torsoPt); else drawFront(c, r, g, breath, lean, sq, torsoPt, view === "back");
  c.restore();
}

function legLine(c: CanvasRenderingContext2D, h: P, k: P, a: P, dark: boolean) {
  c.beginPath(); c.moveTo(h[0], h[1]); c.quadraticCurveTo(k[0], k[1], a[0], a[1]);
  stroke(c, 19, dark ? "#05050a" : INK); c.beginPath(); c.moveTo(h[0] + 3, h[1]); c.quadraticCurveTo(k[0] + 3, k[1], a[0] + 3, a[1]); stroke(c, 3, "rgba(120,110,140,0.55)");
}
function sleeve(c: CanvasRenderingContext2D, s: P, e: P, w: P, dark: boolean, foldSide: number) {
  const cuffStart: P = [e[0] + (w[0] - e[0]) * 0.8, e[1] + (w[1] - e[1]) * 0.8];
  tube(c, [s, e, cuffStart], [76, 64, 58]);
  const g = c.createLinearGradient(s[0] - 40, s[1], s[0] + 40, s[1]); g.addColorStop(0, dark ? RED_D : RED_L); g.addColorStop(1, dark ? RED_DD : RED);
  fillStroke(c, g, 8);
  // folds near the elbow + shading stripe
  const ex = e[0], ey = e[1], ang = Math.atan2(w[1] - e[1], w[0] - e[0]);
  c.save(); c.translate(ex, ey); c.rotate(ang);
  c.beginPath(); c.moveTo(-6, -22 * foldSide); c.quadraticCurveTo(8, -8 * foldSide, 4, 10 * foldSide); stroke(c, 4, dark ? RED_DD : RED_D);
  c.beginPath(); c.moveTo(-34, 24 * foldSide); c.quadraticCurveTo(-22, 14 * foldSide, -14, 22 * foldSide); stroke(c, 4, dark ? RED_DD : RED_D);
  c.restore();
  // ribbed cuff
  const ca = Math.atan2(w[1] - cuffStart[1], w[0] - cuffStart[0]);
  c.save(); c.translate(cuffStart[0], cuffStart[1]); c.rotate(ca);
  c.beginPath(); c.roundRect(-4, -29, 32, 58, 10); fillStroke(c, dark ? RED_DD : RED_D, 7);
  for (let i = -18; i <= 18; i += 9) { c.beginPath(); c.moveTo(2, i); c.lineTo(24, i); stroke(c, 2.5, "rgba(0,0,0,0.25)"); }
  c.restore();
}
function hoodieFront(c: CanvasRenderingContext2D, T: (p: P) => P, back: boolean, breath: number) {
  const pts = (arr: P[]) => arr.map(T);
  const b = breath * 0.4;
  // torso body (shoulders -> long hem covering the hips)
  const [a1, a2, a3, a4, a5, a6, a7, a8] = pts([[-128, -268 - b], [-158, -200], [-162, -40], [-152, 14], [152, 14], [162, -40], [158, -200], [128, -268 - b]]);
  const top = T([0, -290 - b]);
  c.beginPath(); c.moveTo(a1[0], a1[1]); c.quadraticCurveTo(a2[0] - 6, a2[1] - 30, a2[0], a2[1]); c.lineTo(a3[0], a3[1]); c.quadraticCurveTo(a4[0], a4[1] - 6, a4[0] + 10, a4[1]);
  c.lineTo(a5[0] - 10, a5[1]); c.quadraticCurveTo(a5[0], a5[1] - 6, a6[0], a6[1]); c.lineTo(a7[0], a7[1]); c.quadraticCurveTo(a7[0] + 6, a7[1] - 30, a8[0], a8[1]); c.quadraticCurveTo(top[0], top[1] - 6, a1[0], a1[1]); c.closePath();
  const g = c.createLinearGradient(a3[0], 0, a6[0], 0); g.addColorStop(0, RED_L); g.addColorStop(0.5, RED); g.addColorStop(1, RED_D); c.fillStyle = g; c.fill();
  c.save(); c.clip();
  c.fillStyle = "rgba(120,0,10,0.22)"; c.beginPath(); c.ellipse(a6[0] + 10, (a6[1] + a7[1]) / 2, 48, 190, 0, 0, Math.PI * 2); c.fill(); // side shadow
  const h0 = T([-170, -36]), h1 = T([170, -36]); c.fillStyle = RED_D; c.beginPath(); c.moveTo(h0[0], h0[1]); c.lineTo(h1[0], h1[1]); c.lineTo(h1[0], h1[1] + 70); c.lineTo(h0[0], h0[1] + 70); c.fill(); // ribbed hem
  for (let i = -150; i <= 150; i += 14) { const p0 = T([i, -32]), p1 = T([i, 10]); c.beginPath(); c.moveTo(p0[0], p0[1]); c.lineTo(p1[0], p1[1]); stroke(c, 2.5, "rgba(0,0,0,0.22)"); }
  c.beginPath(); c.moveTo(h0[0], h0[1]); c.lineTo(h1[0], h1[1]); stroke(c, 5);
  // folds
  for (const [p0, p1, p2] of [[[-140, -170], [-110, -120], [-122, -70]], [[132, -180], [104, -130], [118, -84]], [[-60, -64], [-40, -50], [-20, -60]]] as [P, P, P][]) { const q0 = T(p0), q1 = T(p1), q2 = T(p2); c.beginPath(); c.moveTo(q0[0], q0[1]); c.quadraticCurveTo(q1[0], q1[1], q2[0], q2[1]); stroke(c, 4.5, RED_DD); }
  if (!back) {
    // kangaroo pocket
    const p = pts([[-88, -160], [88, -160], [112, -46], [-112, -46]]);
    c.beginPath(); c.moveTo(p[0][0], p[0][1]); c.lineTo(p[1][0], p[1][1]); c.quadraticCurveTo(p[2][0] - 4, p[2][1] - 40, p[2][0], p[2][1]); c.lineTo(p[3][0], p[3][1]); c.quadraticCurveTo(p[3][0] + 4, p[3][1] - 40, p[0][0], p[0][1]); c.closePath();
    c.fillStyle = "rgba(255,90,90,0.25)"; c.fill(); stroke(c, 6);
    const s0 = T([-80, -150]), s1 = T([80, -150]); c.beginPath(); c.moveTo(s0[0], s0[1]); c.lineTo(s1[0], s1[1]); c.setLineDash([10, 9]); stroke(c, 3, RED_DD); c.setLineDash([]);
    for (const sx of [-1, 1]) { const q0 = T([sx * 88, -156]), q1 = T([sx * 100, -100]), q2 = T([sx * 108, -52]); c.beginPath(); c.moveTo(q0[0], q0[1]); c.quadraticCurveTo(q1[0] - sx * 18, q1[1], q2[0], q2[1]); stroke(c, 5, RED_DD); }
  }
  c.restore();
  c.beginPath(); c.moveTo(a1[0], a1[1]); c.quadraticCurveTo(a2[0] - 6, a2[1] - 30, a2[0], a2[1]); c.lineTo(a3[0], a3[1]); c.quadraticCurveTo(a4[0], a4[1] - 6, a4[0] + 10, a4[1]); c.lineTo(a5[0] - 10, a5[1]); c.quadraticCurveTo(a5[0], a5[1] - 6, a6[0], a6[1]); c.lineTo(a7[0], a7[1]); c.quadraticCurveTo(a7[0] + 6, a7[1] - 30, a8[0], a8[1]); c.quadraticCurveTo(top[0], top[1] - 6, a1[0], a1[1]); c.closePath(); stroke(c, LW);
}
function hoodFront(c: CanvasRenderingContext2D, T: (p: P) => P, back: boolean) {
  const n = T([0, -286]);
  if (back) { c.beginPath(); c.ellipse(n[0], n[1] + 40, 112, 92, 0, 0, Math.PI * 2); fillStroke(c, RED, 8); c.beginPath(); c.ellipse(n[0], n[1] + 30, 70, 50, 0, 0, Math.PI * 2); fillStroke(c, RED_DD, 5); return; }
  // hood lying around the neck: two rolled lobes + dark opening
  for (const sx of [-1, 1]) { c.beginPath(); c.ellipse(n[0] + sx * 62, n[1] + 4, 66, 34, sx * 0.28, 0, Math.PI * 2); const g = c.createLinearGradient(n[0], n[1] - 30, n[0], n[1] + 30); g.addColorStop(0, RED_L); g.addColorStop(1, RED_D); fillStroke(c, g, 8); }
  c.beginPath(); c.moveTo(n[0] - 44, n[1] - 4); c.quadraticCurveTo(n[0], n[1] + 54, n[0] + 44, n[1] - 4); c.quadraticCurveTo(n[0], n[1] + 14, n[0] - 44, n[1] - 4); c.closePath(); fillStroke(c, RED_DD, 6);
}
function strings(c: CanvasRenderingContext2D, T: (p: P) => P, t: number, xs: number[]) {
  for (const sx of xs) { const sw = Math.sin(t * 0.17 + sx) * 3; const a = T([sx, -262]), b = T([sx * 1.1 + sw, -158]);
    c.beginPath(); c.moveTo(a[0], a[1]); c.quadraticCurveTo((a[0] + b[0]) / 2 + sw, (a[1] + b[1]) / 2, b[0], b[1]); stroke(c, 14); c.beginPath(); c.moveTo(a[0], a[1]); c.quadraticCurveTo((a[0] + b[0]) / 2 + sw, (a[1] + b[1]) / 2, b[0], b[1]); stroke(c, 7, "#ffffff");
    c.beginPath(); c.roundRect(b[0] - 9, b[1] - 4, 18, 26, 4); fillStroke(c, "#e6eaf6", 5); }
}
function backpackFront(c: CanvasRenderingContext2D, T: (p: P) => P) {
  const p = T([-150, -250]);
  c.beginPath(); c.roundRect(p[0] - 62, p[1] - 6, 110, 236, 38); const g = c.createLinearGradient(p[0] - 62, 0, p[0] + 48, 0); g.addColorStop(0, BAG_L); g.addColorStop(1, BAG); fillStroke(c, g, LW);
  c.beginPath(); c.arc(p[0] - 10, p[1] + 110, 46, rad(150), rad(250)); stroke(c, 8, "rgba(255,255,255,0.18)");
}
function strapFront(c: CanvasRenderingContext2D, T: (p: P) => P) {
  const a = T([-104, -276]), b = T([-122, -150]);
  c.beginPath(); c.moveTo(a[0], a[1]); c.quadraticCurveTo(a[0] - 18, (a[1] + b[1]) / 2, b[0], b[1]); stroke(c, 30); c.beginPath(); c.moveTo(a[0], a[1]); c.quadraticCurveTo(a[0] - 18, (a[1] + b[1]) / 2, b[0], b[1]); stroke(c, 18, BAG);
}

function drawFront(c: CanvasRenderingContext2D, r: Rig, g: Geo, breath: number, lean: number, sq: number, T: (p: P) => P, back: boolean) {
  const showBag = r.backpack !== false;
  if (showBag && !back) backpackFront(c, T);
  // legs + shoes
  for (const [h, k, a, mir] of [[g.hipL, g.kneeL, g.ankL, true], [g.hipR, g.kneeR, g.ankR, false]] as [P, P, P, boolean][]) {
    legLine(c, h, k, a, false); c.save(); c.translate(a[0], a[1]); if (mir) c.scale(-1, 1); c.translate(14, 0); shoeFront(c); c.restore();
  }
  hoodFront(c, T, back);
  hoodieFront(c, T, back, breath);
  if (back && showBag) { const p = T([0, -232]); c.beginPath(); c.roundRect(p[0] - 104, p[1], 208, 230, 50); const gg = c.createLinearGradient(p[0] - 104, 0, p[0] + 104, 0); gg.addColorStop(0, BAG_L); gg.addColorStop(1, BAG); fillStroke(c, gg, LW); c.beginPath(); c.roundRect(p[0] - 70, p[1] + 110, 140, 90, 24); stroke(c, 6); }
  if (!back) { strings(c, T, r.t, [-22, 22]); if (showBag) strapFront(c, T); }
  if (r.hug) r.hug(c, T([0, -180])[0], T([0, -180])[1]);
  const arms = () => {
    sleeve(c, g.shL, g.elL, g.wrL, false, 1); sleeve(c, g.shR, g.elR, g.wrR, false, -1);
    const angL = Math.atan2(g.wrL[1] - g.elL[1], g.wrL[0] - g.elL[0]) - Math.PI / 2 + rad(r.handRotL ?? 0), angR = Math.atan2(g.wrR[1] - g.elR[1], g.wrR[0] - g.elR[0]) - Math.PI / 2 + rad(r.handRotR ?? 0);
    drawGlove(c, g.wrL[0], g.wrL[1], angL, r.handL ?? "relaxed", true); drawGlove(c, g.wrR[0], g.wrR[1], angR, r.handR ?? "relaxed", false);
  };
  if (!r.handsOverHead) arms();
  // head
  c.save(); c.translate(g.head[0], g.head[1]); c.rotate(rad(r.headTilt ?? 0)); c.translate(-g.head[0], -g.head[1]);
  headBall(c, g.head[0], g.head[1], 1); hair(c, g.head[0], g.head[1], r.t, false);
  if (!back) face(c, g.head[0], g.head[1], r, false);
  c.restore();
  if (r.handsOverHead) arms();
  void lean; void sq;
}

function drawSide(c: CanvasRenderingContext2D, r: Rig, g: Geo, breath: number, lean: number, sq: number, T: (p: P) => P) {
  const b = breath * 0.4;
  // far arm + far leg (behind body, darker)
  sleeve(c, g.shL, g.elL, g.wrL, true, 1);
  drawGlove(c, g.wrL[0], g.wrL[1], Math.atan2(g.wrL[1] - g.elL[1], g.wrL[0] - g.elL[0]) - Math.PI / 2 + rad(r.handRotL ?? 0), r.handL ?? "relaxed", true, 1.22);
  legLine(c, g.hipL, g.kneeL, g.ankL, true); c.save(); c.translate(g.ankL[0], g.ankL[1]); c.rotate(-g.footL); shoeSide(c, true); c.restore();
  // backpack on the back
  if (r.backpack !== false) { const p = T([-118, -250]); c.save(); c.translate(p[0], p[1]); c.rotate(lean * 0.6);
    c.beginPath(); c.roundRect(-82, -4, 116, 250, 40); const gg = c.createLinearGradient(-82, 0, 34, 0); gg.addColorStop(0, BAG_L); gg.addColorStop(1, BAG); fillStroke(c, gg, LW);
    c.beginPath(); c.roundRect(-98, 110, 40, 110, 16); fillStroke(c, BAG, 7); c.beginPath(); c.moveTo(-70, 60); c.lineTo(10, 60); stroke(c, 5, "rgba(255,255,255,0.18)"); c.restore(); }
  // torso
  const pts = ([[-96, -270 - b], [-112, -150], [-104, 14], [104, 14], [112, -120], [86, -272 - b]] as P[]).map(T);
  c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); c.quadraticCurveTo(pts[1][0] - 10, pts[1][1], pts[2][0], pts[2][1]); c.lineTo(pts[3][0], pts[3][1]); c.quadraticCurveTo(pts[4][0] + 8, pts[4][1], pts[5][0], pts[5][1]); const tp = T([0, -300 - b]); c.quadraticCurveTo(tp[0], tp[1], pts[0][0], pts[0][1]); c.closePath();
  const gr = c.createLinearGradient(pts[0][0], 0, pts[3][0], 0); gr.addColorStop(0, RED_D); gr.addColorStop(0.45, RED); gr.addColorStop(1, RED_L); c.fillStyle = gr; c.fill();
  c.save(); c.clip();
  const h0 = T([-130, -36]), h1 = T([130, -36]); c.fillStyle = RED_D; c.beginPath(); c.moveTo(h0[0], h0[1]); c.lineTo(h1[0], h1[1]); c.lineTo(h1[0], h1[1] + 70); c.lineTo(h0[0], h0[1] + 70); c.fill();
  for (let i = -110; i <= 110; i += 14) { const p0 = T([i, -32]), p1 = T([i, 10]); c.beginPath(); c.moveTo(p0[0], p0[1]); c.lineTo(p1[0], p1[1]); stroke(c, 2.5, "rgba(0,0,0,0.22)"); }
  c.beginPath(); c.moveTo(h0[0], h0[1]); c.lineTo(h1[0], h1[1]); stroke(c, 5);
  const pk = ([[20, -150], [96, -150], [110, -48], [6, -48]] as P[]).map(T); c.beginPath(); c.moveTo(pk[0][0], pk[0][1]); c.lineTo(pk[1][0], pk[1][1]); c.lineTo(pk[2][0], pk[2][1]); c.lineTo(pk[3][0], pk[3][1]); c.quadraticCurveTo(pk[3][0] - 6, (pk[0][1] + pk[3][1]) / 2, pk[0][0], pk[0][1]); c.fillStyle = "rgba(255,90,90,0.25)"; c.fill(); stroke(c, 6);
  for (const [p0, p1, p2] of [[[-70, -200], [-50, -150], [-66, -100]], [[-40, -70], [-20, -58], [0, -66]]] as [P, P, P][]) { const q0 = T(p0), q1 = T(p1), q2 = T(p2); c.beginPath(); c.moveTo(q0[0], q0[1]); c.quadraticCurveTo(q1[0], q1[1], q2[0], q2[1]); stroke(c, 4.5, RED_DD); }
  c.restore();
  c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); c.quadraticCurveTo(pts[1][0] - 10, pts[1][1], pts[2][0], pts[2][1]); c.lineTo(pts[3][0], pts[3][1]); c.quadraticCurveTo(pts[4][0] + 8, pts[4][1], pts[5][0], pts[5][1]); c.quadraticCurveTo(tp[0], tp[1], pts[0][0], pts[0][1]); c.closePath(); stroke(c, LW);
  // hood bump on the back of the neck
  const hd = T([-58, -292]); c.beginPath(); c.ellipse(hd[0], hd[1], 70, 40, -0.25, 0, Math.PI * 2); const hg = c.createLinearGradient(hd[0], hd[1] - 30, hd[0], hd[1] + 30); hg.addColorStop(0, RED_L); hg.addColorStop(1, RED_D); fillStroke(c, hg, 8);
  c.beginPath(); c.ellipse(hd[0] + 22, hd[1] + 2, 34, 18, -0.25, 0, Math.PI * 2); fillStroke(c, RED_DD, 5);
  strings(c, T, r.t, [74]);
  // backpack strap over the shoulder
  { const a = T([-70, -280]), m = T([20, -300]), e = T([64, -160]); c.beginPath(); c.moveTo(a[0], a[1]); c.quadraticCurveTo(m[0], m[1], e[0], e[1]); stroke(c, 30); c.beginPath(); c.moveTo(a[0], a[1]); c.quadraticCurveTo(m[0], m[1], e[0], e[1]); stroke(c, 18, BAG); }
  if (r.hug) r.hug(c, T([90, -170])[0], T([90, -170])[1]);
  // near leg + shoe
  legLine(c, g.hipR, g.kneeR, g.ankR, false); c.save(); c.translate(g.ankR[0], g.ankR[1]); c.rotate(-g.footR); shoeSide(c, false); c.restore();
  // head
  c.save(); c.translate(g.head[0], g.head[1]); c.rotate(rad(r.headTilt ?? 0)); c.translate(-g.head[0], -g.head[1]);
  headBall(c, g.head[0], g.head[1], 1); hair(c, g.head[0], g.head[1], r.t, true); face(c, g.head[0], g.head[1], r, true);
  c.restore();
  // near arm
  sleeve(c, g.shR, g.elR, g.wrR, false, -1);
  drawGlove(c, g.wrR[0], g.wrR[1], Math.atan2(g.wrR[1] - g.elR[1], g.wrR[0] - g.elR[0]) - Math.PI / 2 + rad(r.handRotR ?? 0), r.handR ?? "relaxed", false);
  void sq;
}

/* ---------- motion library (poses as functions of time/phase) ---------- */
const sinp = (p: number) => Math.sin(p * Math.PI * 2);
export const POSES = {
  stand: (t: number): Partial<Rig> => ({ armL: { a: 7, b: 6 }, armR: { a: 7, b: 6 }, legL: { a: 3, b: 0 }, legR: { a: 3, b: 0 }, handL: "relaxed", handR: "relaxed", t }),
  // side-view walk; p = cycle phase 0..1 (one full stride = 2 steps). Distance per cycle = WALK_STRIDE units.
  walk: (p: number): Partial<Rig> => {
    const s = sinp(p), c2 = Math.cos(p * Math.PI * 2);
    const leg = (ph: number): Leg => { const sw = Math.sin(ph * Math.PI * 2), cw = Math.cos(ph * Math.PI * 2); return { a: 24 * sw, b: Math.max(0, cw) * 38 + 6, f: sw > 0 ? 10 * sw : -14 * Math.max(0, -sw) * (cw < 0 ? 1 : 0.4) }; };
    return { view: "side", legR: leg(p), legL: leg(p + 0.5), armR: { a: -22 * s, b: 18 + 8 * Math.max(0, -s) }, armL: { a: 22 * s, b: 18 + 8 * Math.max(0, s) }, y: -8 * Math.abs(c2), lean: 3, handL: "relaxed", handR: "relaxed" };
  },
  run: (p: number): Partial<Rig> => {
    const s = sinp(p);
    const leg = (ph: number): Leg => { const sw = Math.sin(ph * Math.PI * 2), cw = Math.cos(ph * Math.PI * 2); return { a: 42 * sw + 6, b: Math.max(0, cw) * 80 + 16, f: sw > 0 ? 14 * sw : -26 * Math.max(0, -sw) }; };
    return { view: "side", legR: leg(p), legL: leg(p + 0.5), armR: { a: -40 * s + 10, b: 82 }, armL: { a: 40 * s + 10, b: 82 }, air: 24 * Math.abs(Math.cos(p * Math.PI * 2)), lean: 12, handL: "fist", handR: "fist", face: "determined" };
  },
};
export const WALK_STRIDE = 300; // units travelled per walk cycle (feet do not slide at this ratio)
export const RUN_STRIDE = 520;
