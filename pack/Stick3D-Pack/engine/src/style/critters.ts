// STORYBOOK CRITTERS (2D canvas, same line style as Stickman: thick #1A1A1A outline, big glossy eyes, soft shading top-left)
// owl, wolf, crab — each with `confused` (head tilt, mismatched brows, "?"), `blink`, simple idle motion. Draw into a billboard canvas.
export type CritterPose = { t: number; confused?: number; /* 0..1 */ blink?: boolean; howl?: number; /* wolf 0..1 */ walk?: number; /* crab sideways phase */ look?: number; flip?: boolean };
const INK = "#1A1A1A";
const st = (c: CanvasRenderingContext2D, w = 9) => { c.lineWidth = w; c.strokeStyle = INK; c.lineJoin = "round"; c.lineCap = "round"; c.stroke(); };
const fs = (c: CanvasRenderingContext2D, f: string | CanvasGradient, w = 9) => { c.fillStyle = f; c.fill(); st(c, w); };
function eye(c: CanvasRenderingContext2D, x: number, y: number, r: number, look: number, blink: boolean, iris = "#1A1A1A", white = "#fff") {
  if (blink) { c.beginPath(); c.arc(x, y, r * 0.8, 0.15 * Math.PI, 0.85 * Math.PI); st(c, 7); return; }
  c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); fs(c, white, 7);
  c.beginPath(); c.arc(x + look * r * 0.3, y + r * 0.08, r * 0.58, 0, Math.PI * 2); c.fillStyle = iris; c.fill();
  c.beginPath(); c.arc(x + look * r * 0.3 - r * 0.2, y - r * 0.18, r * 0.2, 0, Math.PI * 2); c.fillStyle = "#fff"; c.fill();
}
function qmark(c: CanvasRenderingContext2D, x: number, y: number, s: number, t: number, k: number) {
  if (k <= 0.01) return; c.save(); c.translate(x, y - Math.sin(t * 0.15) * 6); c.scale(s * k, s * k); c.rotate(Math.sin(t * 0.1) * 0.12);
  c.font = "900 120px Inter, Arial"; c.textAlign = "center"; c.lineWidth = 14; c.strokeStyle = INK; c.strokeText("?", 0, 0); c.fillStyle = "#ffd23a"; c.fillText("?", 0, 0); c.restore();
}
const shade = (c: CanvasRenderingContext2D, x: number, y: number, r: number, a: string, b: string) => { const g = c.createRadialGradient(x - r * 0.4, y - r * 0.5, r * 0.1, x, y, r * 1.1); g.addColorStop(0, a); g.addColorStop(1, b); return g; };

/* OWL on a branch: canvas 512x640, branch at the bottom */
export function drawOwl(c: CanvasRenderingContext2D, W: number, H: number, p: CritterPose) {
  c.clearRect(0, 0, W, H); c.save(); c.scale(W / 512, H / 640); const k = p.confused ?? 0, t = p.t;
  c.beginPath(); c.roundRect(-20, 560, 552, 46, 22); fs(c, "#7a5233"); // branch
  c.save(); c.translate(256, 400); c.rotate(Math.sin(t * 0.05) * 0.02);
  c.beginPath(); c.ellipse(0, 40, 150, 175, 0, 0, Math.PI * 2); fs(c, shade(c, 0, 40, 160, "#b98a5e", "#7c5536")); // body
  c.beginPath(); c.ellipse(0, 80, 95, 115, 0, 0, Math.PI * 2); c.fillStyle = "#e8cfa4"; c.fill(); // belly
  for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(-50 + (i % 3) * 50, 40 + Math.floor(i / 3) * 46, 16, 0.1 * Math.PI, 0.9 * Math.PI); st(c, 5); } // feather marks
  for (const s of [-1, 1]) { c.beginPath(); c.ellipse(s * 140, 60, 45, 110, s * 0.18, 0, Math.PI * 2); fs(c, "#8d6240"); } // wings
  for (const s of [-1, 1]) { c.beginPath(); c.ellipse(s * 40, 208, 26, 14, 0, 0, Math.PI * 2); fs(c, "#f2a53a", 6); } // feet
  // head (tilts when confused)
  c.save(); c.translate(0, -120); c.rotate(-0.28 * k + Math.sin(t * 0.2) * 0.03 * k);
  c.beginPath(); c.moveTo(-130, -40); c.lineTo(-120, -150); c.lineTo(-60, -95); c.quadraticCurveTo(0, -110, 60, -95); c.lineTo(120, -150); c.lineTo(130, -40); c.quadraticCurveTo(150, 90, 0, 100); c.quadraticCurveTo(-150, 90, -130, -40); c.closePath(); fs(c, shade(c, 0, -20, 140, "#c99a6c", "#86603e"));
  for (const s of [-1, 1]) { c.beginPath(); c.arc(s * 58, -18, 62, 0, Math.PI * 2); c.fillStyle = "#f3e2c0"; c.fill(); eye(c, s * 58, -18, 46, (p.look ?? 0) + (k ? -0.6 : 0), !!p.blink, "#2a1608", "#ffe27a"); }
  c.beginPath(); c.moveTo(-16, 28); c.lineTo(16, 28); c.lineTo(0, 62); c.closePath(); fs(c, "#f2a53a", 6); // beak
  // brows: confused = one up, one down
  for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * 20, -88 + (s > 0 ? -18 * k : 10 * k)); c.lineTo(s * 100, -76 + (s > 0 ? -30 * k : 16 * k)); st(c, 10); }
  c.restore(); c.restore();
  qmark(c, 420, 150, 1, t, k); c.restore();
}

/* WOLF sitting, side-ish 3/4, howls (snout up) — canvas 640x640 */
export function drawWolf(c: CanvasRenderingContext2D, W: number, H: number, p: CritterPose) {
  c.clearRect(0, 0, W, H); c.save(); c.scale(W / 640, H / 640); if (p.flip) { c.translate(640, 0); c.scale(-1, 1); }
  const k = p.confused ?? 0, hw = p.howl ?? 0, t = p.t, fur = "#8f9bb3", furD = "#5d6982", furL = "#c9d1e3";
  c.beginPath(); c.moveTo(150, 600); c.quadraticCurveTo(60, 560, 90, 470); c.quadraticCurveTo(120, 430, 170, 470); c.quadraticCurveTo(150, 540, 200, 590); c.closePath(); fs(c, furD); // tail
  c.beginPath(); c.moveTo(170, 610); c.quadraticCurveTo(150, 420, 260, 330); c.quadraticCurveTo(360, 280, 420, 360); c.quadraticCurveTo(470, 470, 440, 610); c.closePath(); fs(c, shade(c, 300, 450, 200, furL, fur)); // body
  c.beginPath(); c.moveTo(330, 380); c.quadraticCurveTo(380, 470, 350, 560); c.quadraticCurveTo(300, 520, 300, 420); c.closePath(); c.fillStyle = "#e7ebf5"; c.fill(); // chest
  for (const x of [300, 400]) { c.beginPath(); c.roundRect(x - 26, 500, 52, 110, 22); fs(c, fur); c.beginPath(); c.ellipse(x, 606, 36, 18, 0, 0, Math.PI * 2); fs(c, furL, 7); } // legs
  // head
  c.save(); c.translate(380, 300); c.rotate(-0.75 * hw + 0.22 * k + Math.sin(t * 0.12) * 0.02);
  for (const s of [-1, 1]) { c.beginPath(); c.moveTo(-40 + s * 50, -60); c.lineTo(-30 + s * 70, -150); c.lineTo(10 + s * 50, -70); c.closePath(); fs(c, furD); } // ears
  c.beginPath(); c.ellipse(0, 0, 105, 92, 0, 0, Math.PI * 2); fs(c, shade(c, 0, 0, 110, furL, fur)); // skull
  c.beginPath(); c.moveTo(40, -10); c.quadraticCurveTo(150, -14, 185, 20); c.quadraticCurveTo(170, 60, 60, 66); c.closePath(); fs(c, "#d9deea"); // snout
  c.beginPath(); c.arc(184, 18, 16, 0, Math.PI * 2); fs(c, INK, 4); // nose
  if (hw > 0.2) { c.beginPath(); c.ellipse(120, 52, 34, 14 + 16 * hw, 0.2, 0, Math.PI * 2); fs(c, "#3a1222", 6); } else { c.beginPath(); c.moveTo(70, 48); c.quadraticCurveTo(120, 60 - 10 * k, 160, 44); st(c, 6); }
  eye(c, 20, -22, 30, k ? -0.5 : 0.4, !!p.blink || hw > 0.6, "#1A1A1A", "#fff6c8");
  c.beginPath(); c.moveTo(-10, -66 - 16 * k); c.lineTo(52, -54 + 8 * k); st(c, 9);
  c.restore();
  qmark(c, 520, 140, 0.9, t, k); c.restore();
}

/* CRAB — canvas 512x384, scuttles sideways (walk phase), claws up when confused */
export function drawCrab(c: CanvasRenderingContext2D, W: number, H: number, p: CritterPose) {
  c.clearRect(0, 0, W, H); c.save(); c.scale(W / 512, H / 384); const k = p.confused ?? 0, ph = p.walk ?? 0, t = p.t, red = "#f05a3a", redD = "#b9361f";
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const a = Math.sin(ph * 6.28 + i * 2 + (s > 0 ? 1 : 0)) * 12; c.beginPath(); c.moveTo(256 + s * (70 + i * 22), 250); c.lineTo(256 + s * (140 + i * 26), 290 + a); c.lineTo(256 + s * (150 + i * 28), 350 + a); st(c, 12); c.beginPath(); c.moveTo(256 + s * (70 + i * 22), 250); c.lineTo(256 + s * (140 + i * 26), 290 + a); c.lineTo(256 + s * (150 + i * 28), 350 + a); c.lineWidth = 6; c.strokeStyle = redD; c.stroke(); }
  for (const s of [-1, 1]) { const up = 0.5 * k + Math.sin(t * 0.3 + s) * 0.08 * k; c.save(); c.translate(256 + s * 120, 200); c.rotate(s * (-0.6 - up)); c.beginPath(); c.roundRect(-10, -80, 20, 80, 8); fs(c, red, 7);
    c.translate(0, -100); c.beginPath(); c.ellipse(0, 0, 40, 32, 0, 0, Math.PI * 2); fs(c, shade(c, 0, 0, 40, "#ff8a66", red)); c.beginPath(); c.moveTo(-6, -30); c.lineTo(10, 0); c.lineTo(-6, 28); st(c, 6); c.restore(); }
  c.beginPath(); c.ellipse(256, 230, 120, 80, 0, 0, Math.PI * 2); fs(c, shade(c, 256, 230, 120, "#ff7a55", red)); // shell
  for (const s of [-1, 1]) { c.beginPath(); c.moveTo(256 + s * 30, 170); c.lineTo(256 + s * 40, 110); st(c, 8); eye(c, 256 + s * 40, 100, 24, k ? Math.sin(t * 0.25) : 0, !!p.blink); }
  c.beginPath(); c.moveTo(226, 262); c.quadraticCurveTo(256, 250 + 18 * (1 - k) - 10 * k, 286, 262 - 8 * k); st(c, 7);
  qmark(c, 420, 90, 0.6, t, k); c.restore();
}
