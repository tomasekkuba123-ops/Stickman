// Baby red dragon puppet (EP02). 2D canvas drawing for a yaw-only billboard (square canvas, feet at the bottom).
// Red body, warm yellow belly with ridges, small orange-yellow wings, cream horns + claws, big glossy eyes.
export type DragonPose = {
  t: number; mood?: "happy" | "calm" | "scared" | "sneeze" | "wow" | "sleepy";
  flap?: number; /* 0..1 wing-flap amplitude */ flapHz?: number; flip?: boolean; tilt?: number; squash?: number;
  arms?: "down" | "up" | "reach"; blink?: boolean; lookX?: number; headRecoil?: number; /* -1 back .. 1 forward (sneeze) */ legsTucked?: boolean; curl?: number;
};
const INK = "#0b0d1a";
const RED = "#e8402e", RED_D = "#b82a22", RED_L = "#ff6a4a", BELLY = "#ffd45a", WING = "#ffb43a", HORN = "#f6e2ae";

export function drawDragon(c: CanvasRenderingContext2D, W: number, H: number, d: DragonPose) {
  c.clearRect(0, 0, W, H); c.save();
  const S = W / 512; c.scale(S, S);
  const sq = d.squash ?? 0, tilt = d.tilt ?? 0;
  if (d.flip) { c.translate(512, 0); c.scale(-1, 1); }
  c.translate(256, 496); c.rotate(tilt); c.scale(1 - sq * 0.5, 1 + sq); c.translate(-256, -496);
  c.lineJoin = "round"; c.lineCap = "round"; c.strokeStyle = INK;
  const t = d.t, breath = Math.sin(t * 0.2) * 3, flapA = (d.flap ?? 0.25) * Math.sin(t * (d.flapHz ?? 0.9));
  const m = d.mood ?? "happy";
  // tail
  const tw = Math.sin(t * 0.17) * 10 + (d.curl ?? 0) * 30;
  c.lineWidth = 34; c.strokeStyle = INK; c.beginPath(); c.moveTo(190, 430); c.bezierCurveTo(120, 470, 70, 440, 80 + tw * 0.4, 380 - tw); c.stroke();
  c.lineWidth = 22; c.strokeStyle = RED; c.stroke();
  c.save(); c.translate(80 + tw * 0.4, 380 - tw); c.rotate(-0.5 + tw * 0.01); c.fillStyle = WING; c.strokeStyle = INK; c.lineWidth = 7; c.beginPath(); c.moveTo(0, 8); c.lineTo(-26, -14); c.lineTo(0, -40); c.lineTo(22, -14); c.closePath(); c.fill(); c.stroke(); c.restore();
  // wings (far wing darker, behind body)
  const wing = (ox: number, oy: number, rot: number, sc: number, dark: boolean) => {
    c.save(); c.translate(ox, oy); c.rotate(rot); c.scale(sc, sc);
    c.fillStyle = dark ? "#e0902a" : WING; c.strokeStyle = INK; c.lineWidth = 8;
    c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-40, -70, -110, -95); c.quadraticCurveTo(-100, -60, -118, -40); c.quadraticCurveTo(-90, -38, -96, -10); c.quadraticCurveTo(-70, -20, -60, 10); c.quadraticCurveTo(-30, 0, 0, 20); c.closePath(); c.fill(); c.stroke();
    c.strokeStyle = dark ? "#9a1c18" : RED_D; c.lineWidth = 9; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-40, -70, -110, -95); c.stroke();
    c.strokeStyle = "rgba(180,60,20,.55)"; c.lineWidth = 4; c.beginPath(); c.moveTo(-8, 4); c.lineTo(-112, -44); c.moveTo(-8, 8); c.lineTo(-94, -12); c.stroke();
    c.restore();
  };
  wing(215, 290 + breath, -0.15 - flapA * 0.9, 1.05, true);
  // feet
  const feet = d.legsTucked ? 0.6 : 1;
  for (const [x, y] of [[205, 470], [305, 474]] as [number, number][]) {
    c.fillStyle = RED; c.lineWidth = 8; c.strokeStyle = INK; c.beginPath(); c.ellipse(x, y - (1 - feet) * 30, 40, 26 * feet, 0, 0, 7); c.fill(); c.stroke();
    c.fillStyle = HORN; c.lineWidth = 4; for (const k of [-1, 0, 1]) { c.beginPath(); c.ellipse(x + 18 + k * 13, y + 18 * feet - (1 - feet) * 30, 6, 7, 0, 0, 7); c.fill(); c.stroke(); }
  }
  // body
  c.fillStyle = RED; c.lineWidth = 9; c.strokeStyle = INK; c.beginPath(); c.ellipse(255, 365 - breath * 0.5, 100, 108 + breath, 0, 0, 7); c.fill(); c.stroke();
  c.save(); c.beginPath(); c.ellipse(255, 365 - breath * 0.5, 100, 108 + breath, 0, 0, 7); c.clip();
  const g = c.createLinearGradient(160, 0, 360, 0); g.addColorStop(0, "rgba(120,0,0,.22)"); g.addColorStop(0.5, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(255,200,160,.15)"); c.fillStyle = g; c.fillRect(150, 250, 220, 230);
  c.restore();
  // belly with ridges
  c.fillStyle = BELLY; c.lineWidth = 6; c.beginPath(); c.ellipse(282, 382, 58, 82, 0.05, 0, 7); c.fill(); c.stroke();
  c.strokeStyle = "rgba(190,120,20,.7)"; c.lineWidth = 4; for (let i = 0; i < 5; i++) { const y = 322 + i * 26; c.beginPath(); c.moveTo(240 + Math.abs(i - 2) * 4, y); c.quadraticCurveTo(282, y + 10, 324 - Math.abs(i - 2) * 4, y); c.stroke(); }
  // near wing (in front of body edge, small)
  wing(205, 300 + breath, -0.05 - flapA, 0.9, false);
  // arms
  const armUp = d.arms === "up" ? 1 : d.arms === "reach" ? 0.6 : 0;
  for (const [x, y, s] of [[232, 340, -1], [330, 338, 1]] as [number, number, number][]) {
    const ex = x + s * (14 + armUp * 18), ey = y + 34 - armUp * 90;
    c.strokeStyle = INK; c.lineWidth = 26; c.beginPath(); c.moveTo(x, y); c.lineTo(ex, ey); c.stroke(); c.strokeStyle = RED; c.lineWidth = 16; c.stroke();
    c.fillStyle = HORN; c.strokeStyle = INK; c.lineWidth = 4; for (const k of [-1, 0, 1]) { c.beginPath(); c.ellipse(ex + k * 7, ey + (armUp ? -10 : 10), 5, 6, 0, 0, 7); c.fill(); c.stroke(); }
  }
  // head
  const rec = d.headRecoil ?? 0;
  c.save(); c.translate(285, 260); c.rotate(-rec * 0.25); c.translate(-285 + rec * 10, -260 - Math.abs(rec) * 4);
  // back spikes
  c.fillStyle = BELLY; c.strokeStyle = INK; c.lineWidth = 5; for (const [x, y, a] of [[190, 175, -1.3], [178, 220, -1.6], [182, 262, -1.9]] as [number, number, number][]) { c.save(); c.translate(x, y); c.rotate(a); c.beginPath(); c.moveTo(-12, 0); c.lineTo(0, -24); c.lineTo(12, 0); c.closePath(); c.fill(); c.stroke(); c.restore(); }
  // horns
  for (const [x, y, a] of [[238, 112, -0.5], [318, 104, 0.25]] as [number, number, number][]) { c.save(); c.translate(x, y); c.rotate(a); c.fillStyle = HORN; c.lineWidth = 6; c.beginPath(); c.moveTo(-15, 8); c.quadraticCurveTo(-14, -30, -4, -50); c.quadraticCurveTo(10, -26, 15, 8); c.closePath(); c.fill(); c.stroke(); c.strokeStyle = "rgba(160,120,40,.6)"; c.lineWidth = 3; c.beginPath(); c.moveTo(-10, -10); c.lineTo(9, -12); c.moveTo(-8, -26); c.lineTo(5, -28); c.stroke(); c.restore(); }
  // ear fins
  c.fillStyle = WING; c.strokeStyle = INK; c.lineWidth = 6; c.beginPath(); c.moveTo(196, 160); c.lineTo(150, 128); c.lineTo(178, 192); c.closePath(); c.fill(); c.stroke();
  // head ball
  c.fillStyle = RED; c.lineWidth = 9; c.beginPath(); c.arc(285, 190, 98, 0, 7); c.fill(); c.stroke();
  c.save(); c.beginPath(); c.arc(285, 190, 98, 0, 7); c.clip(); const hg = c.createRadialGradient(250, 140, 10, 285, 190, 110); hg.addColorStop(0, "rgba(255,220,190,.35)"); hg.addColorStop(0.6, "rgba(0,0,0,0)"); hg.addColorStop(1, "rgba(110,0,0,.25)"); c.fillStyle = hg; c.fillRect(180, 80, 220, 220); c.restore();
  // snout
  c.fillStyle = RED_L; c.lineWidth = 7; c.beginPath(); c.ellipse(352, 228, 56, 40, -0.1, 0, 7); c.fill(); c.stroke();
  c.fillStyle = INK; for (const [x, y] of [[372, 214], [396, 222]] as [number, number][]) { c.beginPath(); c.ellipse(x, y, 5, 7, 0.3, 0, 7); c.fill(); }
  // cheeks
  c.fillStyle = "rgba(255,150,170,.55)"; c.beginPath(); c.ellipse(240, 232, 20, 12, 0, 0, 7); c.fill();
  // eyes
  const lx = (d.lookX ?? 0) * 6;
  const eye = (x: number, y: number) => {
    if (d.blink || m === "sleepy") { c.strokeStyle = INK; c.lineWidth = 7; c.beginPath(); c.arc(x, y - 4, 16, Math.PI * 0.15, Math.PI * 0.85); c.stroke(); return; }
    if (m === "happy") { c.strokeStyle = INK; c.lineWidth = 8; c.beginPath(); c.arc(x, y + 8, 18, Math.PI * 1.15, Math.PI * 1.85); c.stroke(); return; }
    if (m === "sneeze") { c.strokeStyle = INK; c.lineWidth = 7; c.beginPath(); c.moveTo(x - 16, y - 12); c.lineTo(x + 8, y); c.lineTo(x - 16, y + 12); c.stroke(); return; }
    const big = m === "scared" || m === "wow" ? 1.25 : 1;
    c.fillStyle = INK; c.beginPath(); c.ellipse(x + lx, y, 17 * big, 25 * big, 0, 0, 7); c.fill();
    c.fillStyle = "#fff"; c.beginPath(); c.ellipse(x + lx - 6, y - 10 * big, 7 * big, 9 * big, 0, 0, 7); c.fill(); c.beginPath(); c.arc(x + lx + 6, y + 10 * big, 3.5, 0, 7); c.fill();
    if (m === "scared") { c.fillStyle = "rgba(140,210,255,.85)"; c.beginPath(); c.ellipse(x - 4, y + 34 + (t * 2 % 20), 5, 8, 0, 0, 7); c.fill(); }
  };
  eye(268, 176); eye(330, 172);
  // brows for scared
  if (m === "scared") { c.strokeStyle = INK; c.lineWidth = 6; c.beginPath(); c.moveTo(250, 136); c.lineTo(282, 128); c.moveTo(318, 124); c.lineTo(348, 134); c.stroke(); }
  // mouth
  c.strokeStyle = INK; c.lineWidth = 6; c.beginPath();
  if (m === "scared") { c.fillStyle = "#5a1420"; c.ellipse(338, 258, 12, 10 + Math.sin(t * 1.3) * 2, 0, 0, 7); c.fill(); c.stroke(); }
  else if (m === "sneeze" || m === "wow") { c.fillStyle = "#5a1420"; c.ellipse(345, 256, 16, 14, 0, 0, 7); c.fill(); c.stroke(); }
  else { c.moveTo(318, 248); c.quadraticCurveTo(342, 270, 368, 250); c.stroke(); c.fillStyle = "#fff"; c.beginPath(); c.moveTo(330, 256); c.lineTo(336, 266); c.lineTo(341, 258); c.fill(); }
  c.restore();
  c.restore();
}
