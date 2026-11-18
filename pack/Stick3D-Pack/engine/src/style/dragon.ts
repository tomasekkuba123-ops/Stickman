// Baby red dragon v2 (EP02+): detailed flat cartoon, thick ink outlines, same style as the Stickman rig.
// Red body with soft shading, warm yellow striped belly, small orange-yellow wings with membrane ribs, cream horns,
// back spikes, spade tail, big glossy eyes. 3/4 view facing right (flip -> left). Square canvas, feet at the bottom.
export type DragonPose = {
  t: number; mood?: "happy" | "calm" | "scared" | "sneeze" | "wow" | "sleepy";
  flap?: number; /* 0..1 wing-flap amplitude */ flapHz?: number; flip?: boolean; tilt?: number; squash?: number;
  arms?: "down" | "up" | "reach"; blink?: boolean; lookX?: number; headRecoil?: number; /* -1 back .. 1 forward (sneeze) */ legsTucked?: boolean; curl?: number;
  fly?: number; /* 0..1: big spread wings, dangling legs, streaming tail */
};
const INK = "#101018";
const RED = "#e5372c", RED_L = "#ff6450", RED_D = "#b4231d", RED_DD = "#8a1612", BELLY = "#ffd256", BELLY_D = "#f0a630", WING = "#ffb43a", WING_D = "#f08a22", HORN = "#f7e3b0", HORN_D = "#d9b56a";
const LW = 11;

export function drawDragon(c: CanvasRenderingContext2D, W: number, H: number, d: DragonPose) {
  c.clearRect(0, 0, W, H); c.save();
  const S = W / 512; c.scale(S, S);
  const sq = d.squash ?? 0, fly = d.fly ?? 0;
  if (d.flip) { c.translate(512, 0); c.scale(-1, 1); }
  c.translate(256, 496); c.rotate((d.tilt ?? 0) + fly * 0.12); c.scale(1 - sq * 0.5, 1 + sq); c.translate(-256, -496);
  if (fly > 0) c.translate(0, -10 * fly);
  c.lineJoin = "round"; c.lineCap = "round"; c.strokeStyle = INK;
  const t = d.t, breath = Math.sin(t * 0.2) * 3;
  const flapA = (d.flap ?? 0.25) * Math.sin(t * (d.flapHz ?? 0.9)) + fly * 0.25;
  const m = d.mood ?? "happy";
  const ink = (w = LW) => { c.lineWidth = w; c.strokeStyle = INK; c.stroke(); };
  const lin = (x0: number, y0: number, x1: number, y1: number, a: string, b: string) => { const g = c.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, a); g.addColorStop(1, b); return g; };

  // ---- tail (behind) ----
  const tw = Math.sin(t * 0.17) * 10 + (d.curl ?? 0) * 30 - fly * 30;
  const tail = () => { c.beginPath(); c.moveTo(190, 428); c.bezierCurveTo(120, 476 + fly * 10, 64 - fly * 20, 446 + fly * 20, 76 + tw * 0.4 - fly * 30, 380 - tw + fly * 40); };
  tail(); c.lineWidth = 40; c.strokeStyle = INK; c.stroke(); tail(); c.lineWidth = 27; c.strokeStyle = RED; c.stroke();
  tail(); c.lineWidth = 8; c.strokeStyle = "rgba(255,210,90,0.9)"; c.setLineDash([2, 18]); c.stroke(); c.setLineDash([]); // little belly scales on the tail
  c.save(); c.translate(76 + tw * 0.4 - fly * 30, 380 - tw + fly * 40); c.rotate(-0.5 + tw * 0.01 - fly * 0.5);
  c.beginPath(); c.moveTo(0, 10); c.quadraticCurveTo(-34, -6, -6, -46); c.quadraticCurveTo(-2, -24, 0, -20); c.quadraticCurveTo(2, -24, 6, -46); c.quadraticCurveTo(34, -6, 0, 10); c.closePath(); c.fillStyle = lin(0, -46, 0, 10, WING, WING_D); c.fill(); ink(8); c.restore();

  // ---- wings ----
  const wing = (ox: number, oy: number, rotA: number, sc: number, far: boolean) => {
    c.save(); c.translate(ox, oy); c.rotate(rotA); c.scale(sc, sc);
    c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-36, -76, -116, -102); c.quadraticCurveTo(-104, -66, -124, -46); c.quadraticCurveTo(-94, -44, -100, -14); c.quadraticCurveTo(-74, -22, -62, 8); c.quadraticCurveTo(-30, 0, 0, 22); c.closePath();
    c.fillStyle = lin(0, -100, -60, 20, far ? WING_D : WING, far ? "#d07018" : WING_D); c.fill(); ink(9);
    c.strokeStyle = far ? "rgba(150,60,10,.6)" : "rgba(190,90,20,.65)"; c.lineWidth = 4; c.beginPath(); c.moveTo(-6, 4); c.quadraticCurveTo(-60, -20, -118, -46); c.moveTo(-6, 10); c.quadraticCurveTo(-50, -2, -98, -14); c.moveTo(-8, 14); c.quadraticCurveTo(-36, 8, -62, 8); c.stroke(); // membrane ribs
    c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-36, -76, -116, -102); c.lineWidth = 12; c.strokeStyle = INK; c.stroke(); c.lineWidth = 6; c.strokeStyle = far ? RED_DD : RED_D; c.stroke(); // arm bone
    c.beginPath(); c.arc(-116, -102, 6, 0, Math.PI * 2); c.fillStyle = HORN; c.fill(); ink(4); // wing claw
    c.restore();
  };
  const wsc = 1 + fly * 0.3;
  wing(215, 288 + breath, -0.15 - flapA * 0.9 + fly * 0.75, 1.05 * wsc, true);

  // ---- legs / feet ----
  const tuck = d.legsTucked ? 0.6 : 1;
  const foot = (x: number, y: number) => {
    const dy = fly * 26, yy = y - (1 - tuck) * 30 + dy;
    c.beginPath(); c.ellipse(x, yy, 42, 27 * (fly ? 1.1 : tuck), fly * 0.3, 0, Math.PI * 2); c.fillStyle = lin(x - 30, yy - 20, x + 30, yy + 20, RED_L, RED_D); c.fill(); ink(9);
    for (const k of [-1, 0, 1]) { c.beginPath(); c.ellipse(x + 20 + k * 13, yy + 20 * (fly ? 1 : tuck), 6.5, 8, 0, 0, Math.PI * 2); c.fillStyle = HORN; c.fill(); ink(4); }
  };
  foot(205, 470); foot(306, 474);

  // ---- body ----
  const body = () => { c.beginPath(); c.ellipse(255, 365 - breath * 0.5, 102, 110 + breath, 0, 0, Math.PI * 2); };
  body(); c.fillStyle = lin(160, 270, 360, 470, RED_L, RED_D); c.fill();
  c.save(); body(); c.clip(); c.fillStyle = "rgba(140,10,10,0.25)"; c.beginPath(); c.ellipse(170, 400, 50, 110, 0.2, 0, Math.PI * 2); c.fill();
  c.fillStyle = "rgba(255,230,210,0.35)"; c.beginPath(); c.ellipse(225, 300, 30, 16, -0.5, 0, Math.PI * 2); c.fill(); c.restore();
  body(); ink();
  // belly with stripes
  c.beginPath(); c.ellipse(283, 382, 60, 84, 0.05, 0, Math.PI * 2); c.fillStyle = lin(240, 300, 330, 470, "#ffe27a", BELLY); c.fill(); ink(7);
  c.save(); c.beginPath(); c.ellipse(283, 382, 60, 84, 0.05, 0, Math.PI * 2); c.clip();
  c.strokeStyle = BELLY_D; c.lineWidth = 5; for (let i = 0; i < 6; i++) { const y = 316 + i * 24; c.beginPath(); c.moveTo(220, y); c.quadraticCurveTo(283, y + 13, 346, y); c.stroke(); }
  c.restore();

  // near wing
  wing(203, 300 + breath, -0.05 - flapA + fly * 0.55, 0.9 * wsc, false);

  // ---- arms ----
  const armUp = d.arms === "up" ? 1 : d.arms === "reach" ? 0.6 : fly * 0.3;
  for (const [x, y, s] of [[232, 340, -1], [332, 338, 1]] as [number, number, number][]) {
    const ex = x + s * (14 + armUp * 18), ey = y + 34 - armUp * 90;
    c.beginPath(); c.moveTo(x, y); c.lineTo(ex, ey); c.lineWidth = 30; c.strokeStyle = INK; c.stroke(); c.lineWidth = 18; c.strokeStyle = RED; c.stroke();
    for (const k of [-1, 0, 1]) { c.beginPath(); c.ellipse(ex + k * 7.5, ey + (armUp > 0.5 ? -11 : 11), 5.5, 6.5, 0, 0, Math.PI * 2); c.fillStyle = HORN; c.fill(); ink(4); }
  }

  // ---- head ----
  const rec = d.headRecoil ?? 0;
  c.save(); c.translate(285, 260); c.rotate(-rec * 0.25); c.translate(-285 + rec * 10, -260 - Math.abs(rec) * 4);
  // back spikes
  for (const [x, y, a] of [[192, 172, -1.3], [180, 216, -1.6], [184, 258, -1.9], [196, 296, -2.2]] as [number, number, number][]) { c.save(); c.translate(x, y); c.rotate(a); c.beginPath(); c.moveTo(-13, 0); c.quadraticCurveTo(-4, -16, 0, -28); c.quadraticCurveTo(4, -16, 13, 0); c.closePath(); c.fillStyle = lin(0, -28, 0, 0, "#ffe27a", BELLY_D); c.fill(); ink(6); c.restore(); }
  // horns with ridges
  for (const [x, y, a] of [[236, 112, -0.5], [318, 102, 0.25]] as [number, number, number][]) { c.save(); c.translate(x, y); c.rotate(a);
    c.beginPath(); c.moveTo(-16, 8); c.quadraticCurveTo(-16, -32, -4, -54); c.quadraticCurveTo(12, -28, 16, 8); c.closePath(); c.fillStyle = lin(-16, -54, 16, 8, "#fff4d0", HORN_D); c.fill(); ink(7);
    c.strokeStyle = "rgba(150,110,40,.7)"; c.lineWidth = 3.5; for (const yy of [-8, -24, -38]) { c.beginPath(); c.moveTo(-12 + (yy + 54) * 0.05, yy); c.quadraticCurveTo(0, yy - 4, 11 - (yy + 54) * 0.05, yy - 2); c.stroke(); } c.restore(); }
  // ear fins
  c.beginPath(); c.moveTo(198, 158); c.quadraticCurveTo(160, 122, 146, 124); c.quadraticCurveTo(160, 170, 180, 194); c.closePath(); c.fillStyle = lin(146, 124, 198, 190, WING, WING_D); c.fill(); ink(7);
  // head ball
  const hb = () => { c.beginPath(); c.arc(285, 190, 100, 0, Math.PI * 2); };
  hb(); c.fillStyle = lin(200, 100, 370, 290, RED_L, RED_D); c.fill();
  c.save(); hb(); c.clip(); c.fillStyle = "rgba(140,10,10,0.22)"; c.beginPath(); c.ellipse(220, 250, 60, 46, 0.4, 0, Math.PI * 2); c.fill(); c.restore();
  hb(); ink();
  c.beginPath(); c.ellipse(244, 128, 26, 13, -0.5, 0, Math.PI * 2); c.fillStyle = "rgba(255,235,220,0.75)"; c.fill(); // gloss highlight
  // snout
  c.beginPath(); c.ellipse(354, 228, 58, 42, -0.1, 0, Math.PI * 2); c.fillStyle = lin(300, 190, 410, 270, "#ff7a62", RED); c.fill(); ink(9);
  c.fillStyle = INK; for (const [x, y] of [[374, 214], [398, 222]] as [number, number][]) { c.beginPath(); c.ellipse(x, y, 5.5, 7.5, 0.3, 0, Math.PI * 2); c.fill(); }
  // eyes (big, glossy)
  const lx = (d.lookX ?? 0) * 6;
  const eye = (x: number, y: number) => {
    if (d.blink || m === "sleepy") { c.beginPath(); c.arc(x, y - 4, 17, Math.PI * 0.15, Math.PI * 0.85); ink(8); return; }
    if (m === "happy") { c.beginPath(); c.arc(x, y + 9, 19, Math.PI * 1.15, Math.PI * 1.85); ink(9); return; }
    if (m === "sneeze") { c.beginPath(); c.moveTo(x - 17, y - 13); c.lineTo(x + 9, y); c.lineTo(x - 17, y + 13); ink(8); return; }
    const big = m === "scared" || m === "wow" ? 1.22 : 1;
    c.beginPath(); c.ellipse(x + lx, y, 19 * big, 28 * big, 0, 0, Math.PI * 2); c.fillStyle = INK; c.fill();
    c.fillStyle = "#fff"; c.beginPath(); c.ellipse(x + lx - 6, y - 11 * big, 7.5 * big, 10 * big, -0.2, 0, Math.PI * 2); c.fill(); c.beginPath(); c.arc(x + lx + 7, y + 11 * big, 4, 0, Math.PI * 2); c.fill();
    if (m === "scared") { c.fillStyle = "rgba(140,210,255,.9)"; c.beginPath(); c.ellipse(x - 4, y + 36 + ((t * 2) % 20), 5, 8, 0, 0, Math.PI * 2); c.fill(); }
  };
  eye(268, 174); eye(332, 170);
  // brows
  c.beginPath();
  if (m === "scared" || m === "wow") { c.moveTo(248, 132); c.quadraticCurveTo(266, 118, 284, 128); c.moveTo(316, 122); c.quadraticCurveTo(334, 112, 350, 126); }
  else { c.moveTo(250, 138); c.quadraticCurveTo(268, 128, 286, 136); c.moveTo(316, 130); c.quadraticCurveTo(334, 122, 350, 132); }
  ink(6);
  // mouth
  c.beginPath();
  if (m === "scared") { c.ellipse(340, 258, 12, 10 + Math.sin(t * 1.3) * 2, 0, 0, Math.PI * 2); c.fillStyle = "#5a1420"; c.fill(); ink(6); }
  else if (m === "sneeze" || m === "wow") { c.ellipse(346, 256, 17, 15, 0, 0, Math.PI * 2); c.fillStyle = "#5a1420"; c.fill(); ink(6); }
  else { c.moveTo(318, 248); c.quadraticCurveTo(343, 272, 370, 250); ink(6); c.fillStyle = "#fff"; c.beginPath(); c.moveTo(331, 257); c.lineTo(337, 268); c.lineTo(343, 259); c.closePath(); c.fill(); ink(3); }
  c.restore();
  c.restore();
}
