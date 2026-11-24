// STORYBOOK CRITTERS (2D canvas, same line style as Stickman: thick #1A1A1A outline, big glossy eyes, soft shading top-left)
// owl, wolf, crab — each with `confused` (head tilt, mismatched brows, "?"), `blink`, simple idle motion. Draw into a billboard canvas.
export type CritterPose = { t: number; fry?: number; /* dog: fry in mouth 0..1 */ angry?: number; /* dog 0..1 */ run?: number; /* dog run phase speed 0/1 */ glasses?: number; /* pigeon 0..1 */ dizzy?: number; /* pigeon 0..1 */ flap?: number; /* bird/pigeon wing phase (0..1 or frozen) */ fly?: number; /* pigeon flying 0..1 */ confused?: number; /* 0..1 */ blink?: boolean; howl?: number; /* wolf 0..1 */ walk?: number; /* crab sideways phase */ look?: number; flip?: boolean; turn?: number; /* owl head turn -1..1 */ ruffle?: number; /* feather ruffle 0..1 */ ear?: number; /* wolf ear twitch 0..1 */ };
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
  const rf = p.ruffle ?? 0; c.scale(1 + 0.06 * rf * (1 + Math.sin(t * 1.6)) / 2, 1 - 0.03 * rf);
  c.beginPath(); c.ellipse(0, 40, 150, 175, 0, 0, Math.PI * 2); fs(c, shade(c, 0, 40, 160, "#b98a5e", "#7c5536")); // body
  if (rf > 0.05) for (let i = 0; i < 9; i++) { const a = -1.2 + i * 0.3, r = 160 + 10 * Math.sin(t * 1.2 + i); c.beginPath(); c.moveTo(Math.cos(a) * r * 0.95, 40 + Math.sin(a + 1.57) * r * 0.2 - 60); c.lineTo(Math.cos(a) * (r + 18 * rf), 40 + Math.sin(a + 1.57) * r * 0.2 - 70); st(c, 6); } // ruffled feather tips
  c.beginPath(); c.ellipse(0, 80, 95, 115, 0, 0, Math.PI * 2); c.fillStyle = "#e8cfa4"; c.fill(); // belly
  for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(-50 + (i % 3) * 50, 40 + Math.floor(i / 3) * 46, 16, 0.1 * Math.PI, 0.9 * Math.PI); st(c, 5); } // feather marks
  for (const s of [-1, 1]) { c.beginPath(); c.ellipse(s * 140, 60, 45, 110, s * 0.18, 0, Math.PI * 2); fs(c, "#8d6240"); } // wings
  for (const s of [-1, 1]) { c.beginPath(); c.ellipse(s * 40, 208, 26, 14, 0, 0, Math.PI * 2); fs(c, "#f2a53a", 6); } // feet
  // head (tilts when confused)
  const tn = p.turn ?? 0; c.save(); c.translate(tn * 40, -120); c.rotate(-0.28 * k + Math.sin(t * 0.2) * 0.03 * k); c.scale(1 - 0.18 * Math.abs(tn), 1);
  c.beginPath(); c.moveTo(-130, -40); c.lineTo(-120, -150); c.lineTo(-60, -95); c.quadraticCurveTo(0, -110, 60, -95); c.lineTo(120, -150); c.lineTo(130, -40); c.quadraticCurveTo(150, 90, 0, 100); c.quadraticCurveTo(-150, 90, -130, -40); c.closePath(); fs(c, shade(c, 0, -20, 140, "#c99a6c", "#86603e"));
  for (const s of [-1, 1]) { c.beginPath(); c.arc(s * 58, -18, 62, 0, Math.PI * 2); c.fillStyle = "#f3e2c0"; c.fill(); eye(c, s * 58 + tn * 30, -18, 46, (p.look ?? 0) + tn * 0.9 + (k ? -0.6 : 0), !!p.blink, "#2a1608", "#ffe27a"); }
  c.beginPath(); c.moveTo(-16 + tn * 40, 28); c.lineTo(16 + tn * 40, 28); c.lineTo(tn * 44, 62); c.closePath(); fs(c, "#f2a53a", 6); // beak
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
  const er = p.ear ?? 0; for (const s of [-1, 1]) { const tw = s > 0 ? er * 0.35 : 0; c.save(); c.translate(-20 + s * 55, -65); c.rotate(tw); c.beginPath(); c.moveTo(-20, 5); c.lineTo(-10 + s * 15, -85); c.lineTo(30, -5); c.closePath(); fs(c, furD); c.restore(); } // ears (right one twitches)
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


/* ===== EP10 street critters (same line style) ===== */
/* DOG sitting (3/4), fry in its mouth, can turn angry (brows down, teeth) or run (legs cycle) — canvas 640x640, faces right (flip = left) */
export function drawDog(c: CanvasRenderingContext2D, W: number, H: number, p: CritterPose) {
  c.clearRect(0, 0, W, H); c.save(); c.scale(W / 640, H / 640); if (p.flip) { c.translate(640, 0); c.scale(-1, 1); }
  const t = p.t, ang = p.angry ?? 0, run = p.run ?? 0, fur = "#e0a25a", furD = "#b07436", furL = "#f6d3a0";
  const ph = t * 0.55, lg = (k: number) => run * Math.sin(ph + k) * 0.6;
  const bob = run ? Math.abs(Math.sin(ph)) * -18 : 0; c.translate(0, bob);
  // tail (wags when happy, stiff when angry)
  c.save(); c.translate(150, 470); c.rotate(-0.9 + (ang > 0.5 ? 0.2 : Math.sin(t * 0.6) * 0.35));
  c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-40, -90, -10, -150); c.quadraticCurveTo(15, -90, 26, 0); c.closePath(); fs(c, furD); c.restore();
  // back legs + body
  const body = run ? () => { c.beginPath(); c.ellipse(320, 430, 190, 105, 0, 0, Math.PI * 2); } : () => { c.beginPath(); c.moveTo(170, 600); c.quadraticCurveTo(140, 420, 280, 360); c.quadraticCurveTo(420, 320, 450, 430); c.quadraticCurveTo(470, 540, 430, 600); c.closePath(); };
  for (const [x, k] of [[220, 0], [270, 3.1]] as [number, number][]) { c.save(); c.translate(x, run ? 470 : 540); c.rotate(lg(k)); c.beginPath(); c.roundRect(-30, 0, 60, run ? 150 : 70, 26); fs(c, furD); c.restore(); }
  body(); fs(c, shade(c, 320, 440, 200, furL, fur));
  c.beginPath(); c.ellipse(run ? 420 : 380, 470, 55, 70, 0, 0, Math.PI * 2); c.fillStyle = "#fff3e0"; c.fill(); // chest
  for (const [x, k] of [[380, 1.5], [440, 4.6]] as [number, number][]) { c.save(); c.translate(x, run ? 480 : 500); c.rotate(lg(k)); c.beginPath(); c.roundRect(-26, 0, 52, run ? 140 : 110, 24); fs(c, fur); c.beginPath(); c.ellipse(0, run ? 140 : 108, 34, 18, 0, 0, Math.PI * 2); fs(c, furL, 7); c.restore(); }
  // collar
  c.beginPath(); c.ellipse(430, 330, 70, 22, -0.3, 0, Math.PI * 2); fs(c, "#3a6fd8", 7); c.beginPath(); c.arc(440, 356, 14, 0, Math.PI * 2); fs(c, "#ffd23a", 5);
  // head
  c.save(); c.translate(450, 250); c.rotate(-0.08 + Math.sin(t * 0.08) * 0.03 - ang * 0.08);
  c.beginPath(); c.ellipse(-70, -20, 42, 95, 0.35, 0, Math.PI * 2); fs(c, furD); // back ear
  c.beginPath(); c.ellipse(0, 0, 110, 98, 0, 0, Math.PI * 2); fs(c, shade(c, 0, 0, 120, furL, fur)); // skull
  c.beginPath(); c.ellipse(85, 40, 78, 52, 0.1, 0, Math.PI * 2); fs(c, "#f8e2bf"); // muzzle
  c.beginPath(); c.ellipse(150, 18, 24, 18, 0, 0, Math.PI * 2); fs(c, INK, 4); // nose
  if (ang > 0.4) { c.beginPath(); c.moveTo(70, 70); c.lineTo(150, 62); c.lineTo(145, 84); c.lineTo(75, 92); c.closePath(); fs(c, "#3a1222", 6); for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(82 + i * 18, 70 - i); c.lineTo(90 + i * 18, 84 - i); c.lineTo(98 + i * 18, 69 - i); c.closePath(); c.fillStyle = "#fff"; c.fill(); } }
  else { c.beginPath(); c.moveTo(70, 72); c.quadraticCurveTo(110, 92, 150, 66); st(c, 6); }
  const fry = p.fry ?? 0; if (fry > 0.01) { c.save(); c.translate(120, 76); c.rotate(-0.35); c.beginPath(); c.roundRect(-10, -8, 150 * fry, 22, 6); fs(c, "#ffcf3a", 6); c.restore(); } // the fry
  eye(c, 30, -25, 30, ang > 0.4 ? 0.7 : 0.35, !!p.blink && ang < 0.4, "#1A1A1A");
  c.beginPath(); c.moveTo(-5, -70 + 18 * ang); c.lineTo(65, -60 - 10 * ang + 26 * ang); st(c, 10); // brow (angry = slanted down)
  c.beginPath(); c.ellipse(-40, -60, 40, 85, -0.5 + ang * 0.4, 0, Math.PI * 2); fs(c, furD); // front ear (flattens when angry)
  c.restore();
  c.restore();
}

/* PIGEON (side view, faces right): standing or flying, optional tiny sunglasses, dizzy stars — canvas 512x512 */
export function drawPigeon(c: CanvasRenderingContext2D, W: number, H: number, p: CritterPose) {
  c.clearRect(0, 0, W, H); c.save(); c.scale(W / 512, H / 512); if (p.flip) { c.translate(512, 0); c.scale(-1, 1); }
  const t = p.t, fly = p.fly ?? 0, fl = p.flap ?? 0.5, dz = p.dizzy ?? 0, gl = p.glasses ?? 0;
  if (fly < 0.5) for (const x of [220, 270]) { c.beginPath(); c.moveTo(x, 380); c.lineTo(x - 6, 440); st(c, 8); c.beginPath(); c.moveTo(x - 30, 444); c.lineTo(x + 24, 444); st(c, 7); }
  c.beginPath(); c.moveTo(110, 300); c.lineTo(40, 270); c.lineTo(55, 330); c.closePath(); fs(c, "#6f7892"); // tail
  c.beginPath(); c.ellipse(240, 310, 150, 92, -0.12, 0, Math.PI * 2); fs(c, shade(c, 240, 300, 160, "#c3c9dc", "#8c95b0")); // body
  c.beginPath(); c.ellipse(320, 260, 62, 52, 0, 0, Math.PI * 2); const ir = c.createLinearGradient(270, 220, 370, 300); ir.addColorStop(0, "#7fd6a8"); ir.addColorStop(1, "#b37ad8"); c.fillStyle = ir; c.fill(); // neck sheen
  // wing
  const wa = fly > 0.5 ? -1.1 + Math.cos(fl * Math.PI * 2) * 0.9 : -0.15;
  c.save(); c.translate(210, 280); c.rotate(wa); c.beginPath(); c.ellipse(0, -10, 120, 52, 0, 0, Math.PI * 2); fs(c, "#a2aac2"); for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(-60 + i * 40, 10); c.lineTo(-90 + i * 40, 30); st(c, 5); } c.restore();
  // head
  c.save(); c.translate(360, 200); c.rotate(dz * Math.sin(t * 0.5) * 0.25);
  c.beginPath(); c.arc(0, 0, 62, 0, Math.PI * 2); fs(c, shade(c, 0, 0, 70, "#d0d5e6", "#98a0ba"));
  c.beginPath(); c.moveTo(52, -4); c.lineTo(102, 10); c.lineTo(52, 22); c.closePath(); fs(c, "#f2a53a", 6); // beak
  if (dz > 0.3) { for (const s of [-1, 1]) { c.beginPath(); c.moveTo(14 + s * 12, -16 + s * 12); c.lineTo(14 - s * 12, -16 + s * 12 * -1); st(c, 6); } } // X eye
  else eye(c, 16, -14, 22, 0.4, !!p.blink, "#1A1A1A", "#ffcf6a");
  if (gl > 0.01) { c.save(); c.translate(14, -14 - (1 - gl) * 60); c.globalAlpha = Math.min(1, gl * 1.5); c.beginPath(); c.roundRect(-34, -16, 68, 34, 12); fs(c, "#111", 6); c.beginPath(); c.moveTo(-34, -6); c.lineTo(-70, -16); st(c, 6); c.fillStyle = "rgba(255,255,255,0.7)"; c.fillRect(-22, -10, 14, 6); c.restore(); }
  c.restore();
  if (dz > 0.05) for (let i = 0; i < 3; i++) { const a = t * 0.25 + i * 2.1; c.save(); c.translate(360 + Math.cos(a) * 80, 110 + Math.sin(a) * 22); c.globalAlpha = dz; c.font = "900 54px Inter, Arial"; c.textAlign = "center"; c.lineWidth = 8; c.strokeStyle = INK; c.strokeText("\u2605", 0, 0); c.fillStyle = "#ffd23a"; c.fillText("\u2605", 0, 0); c.restore(); }
  c.restore();
}

/* small songBIRD in flight (side view, faces right), wing phase `flap` — canvas 512x384 */
export function drawBird(c: CanvasRenderingContext2D, W: number, H: number, p: CritterPose) {
  c.clearRect(0, 0, W, H); c.save(); c.scale(W / 512, H / 384); if (p.flip) { c.translate(512, 0); c.scale(-1, 1); }
  const fl = p.flap ?? 0.3, wa = -0.9 + Math.cos(fl * Math.PI * 2) * 1.0;
  c.beginPath(); c.moveTo(130, 200); c.lineTo(50, 175); c.lineTo(60, 235); c.closePath(); fs(c, "#2f6fd0"); // tail
  c.save(); c.translate(250, 200); c.rotate(-wa * 0.25); c.beginPath(); c.ellipse(260 - 250, 0, 125, 70, 0, 0, Math.PI * 2); c.restore(); c.beginPath(); c.ellipse(255, 205, 125, 70, -0.08, 0, Math.PI * 2); fs(c, shade(c, 255, 200, 130, "#6fb4ff", "#2f6fd0"));
  c.beginPath(); c.ellipse(290, 225, 70, 38, -0.1, 0, Math.PI * 2); c.fillStyle = "#ffd9a0"; c.fill(); // belly
  c.beginPath(); c.arc(355, 160, 55, 0, Math.PI * 2); fs(c, shade(c, 355, 150, 60, "#7fc0ff", "#3a7ad8")); // head
  c.beginPath(); c.moveTo(402, 150); c.lineTo(450, 166); c.lineTo(402, 178); c.closePath(); fs(c, "#f2a53a", 6);
  eye(c, 370, 148, 20, 0.4, !!p.blink);
  c.save(); c.translate(230, 180); c.rotate(wa); c.beginPath(); c.ellipse(0, -60, 50, 110, 0.3, 0, Math.PI * 2); fs(c, "#3f82e0"); c.restore(); // wing
  c.restore();
}
