// EP03 "What If Stickman Drew a Rocket?" — all shots as 2D draw functions over the painted backgrounds.
import { Rig, POSES } from "../../style/stickman";
import { drawRocket, sketchRocket, drawLadder, drawPencil, drawRobot, drawReceipt, drawCoin, drawWhale, smoke, puff, sparkles, glow, cloudPuff, bird, twinkles, sweatDrops, bigNumber, seg, lerp, clamp, easeIO, easeBack, rnd, INK, V2, RobotFace } from "../../style/props2d";
import { VW, VH, Cam, applyCam, clampCam, drawBG, camKeys, CK, shake, impact, stick, B, WORLD, ImgKey, StickOut } from "./engine2d";

type Ctx = CanvasRenderingContext2D;
const TAU = Math.PI * 2;
const sinp = (x: number) => Math.sin(x * TAU);

/* ---------- shared helpers ---------- */
function world(c: Ctx, key: ImgKey, cam: Cam, fn?: () => void, alpha = 1) {
  const cc = clampCam(key, cam); c.save(); applyCam(c, cc); drawBG(c, key, alpha); if (fn) fn(); c.restore(); return cc;
}
function sketchPath(c: Ctx, pts: V2[][], prog: number, col = "rgba(120,240,255,1)", w = 8) {
  let total = 0; for (const p of pts) for (let i = 1; i < p.length; i++) total += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
  let rem = total * clamp(prog); let tip: V2 | null = null;
  c.save(); c.lineCap = "round"; c.lineJoin = "round";
  for (const [lw, cl, comp] of [[w * 3.4, col.replace(/[\d.]+\)$/, "0.28)"), "lighter"], [w, "#ffffff", "source-over"]] as [number, string, GlobalCompositeOperation][]) {
    let r = rem; c.globalCompositeOperation = comp; c.lineWidth = lw; c.strokeStyle = cl;
    for (const p of pts) { if (r <= 0) break; c.beginPath(); c.moveTo(p[0][0], p[0][1]); for (let i = 1; i < p.length; i++) { const L = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]), k = Math.min(1, r / L); const x = lerp(p[i - 1][0], p[i][0], k), y = lerp(p[i - 1][1], p[i][1], k); c.lineTo(x, y); tip = [x, y]; r -= L; if (r <= 0) break; } c.stroke(); }
  }
  c.restore(); return tip;
}
const circlePts = (cx: number, cy: number, r: number, n = 28): V2[] => Array.from({ length: n + 1 }, (_, i) => [cx + Math.cos(-Math.PI / 2 + (i / n) * TAU) * r, cy + Math.sin(-Math.PI / 2 + (i / n) * TAU) * r]);
function hangPose(t: number, face: Rig["face"] = "surprised", extra: Partial<Rig> = {}): Rig {
  const sw = Math.sin(t * 3.2);
  return { t: t * 30, view: "front", face, armL: { a: 170, b: -6 }, armR: { a: 170, b: -6 }, handL: "hold", handR: "hold", legL: { a: 6 + sw * 8, b: 0, lift: 30 + 20 * Math.max(0, sw) }, legR: { a: 6 - sw * 8, b: 0, lift: 30 + 20 * Math.max(0, -sw) }, grounded: false, ...extra } as Rig;
}
// rocket + rope ladder + hanging Stickman; returns ladder rung fn and hero out
function rocketRig(c: Ctx, t: number, x: number, y: number, size: number, ang: number, o: { flame?: number; gauge?: number; hero?: Rig | null; rung?: number; heroH?: number; sway?: number; ladderLen?: number; fins?: number; face?: number } = {}) {
  const s = size / 400, bottom: V2 = [x - Math.sin(ang) * 206 * s, y + Math.cos(ang) * 206 * s];
  const L = o.ladderLen ?? size * 1.05;
  const rungAt = drawLadder(c, bottom, L, 70 * s * 1.4, (o.sway ?? Math.sin(t * 2.2) * 0.08) - ang * 0.6, 9, t);
  let out: StickOut | null = null;
  if (o.hero) out = stick(c, o.hero, 0, 0, o.heroH ?? size * 0.8, { p: rungAt(o.rung ?? 0.7) });
  drawRocket(c, x, y, size, ang, { flame: o.flame ?? 1, t, gauge: o.gauge, fins: o.fins ?? 3, face: o.face });
  return { rungAt, out };
}
function pencilInHand(c: Ctx, g: V2, h: number, ang = 0.35, gleam = 0) { drawPencil(c, g[0] + 4, g[1] + h * 0.09, h * 0.36, Math.PI + ang, gleam); }

/* ======================= ROOM (scenes 1a, 2-5) ======================= */
const R = (x: number, y: number) => B("room", x, y);
const PAPER = R(533, 719), HERO_ROOM: V2 = [730, 1238], HERO_H = 620;
function roomAmbience(c: Ctx, t: number, shakeAmt = 0) { // dust motes in the window light + lamp glow flicker
  glow(c, ...R(690, 560), 260, "rgba(255,220,140,0.6)", 0.35 + 0.05 * Math.sin(t * 9));
  c.save(); c.globalCompositeOperation = "lighter"; for (let i = 0; i < 26; i++) { const u = (t * 0.03 + rnd(i)) % 1; const x = R(300, 0)[0] + rnd(i * 3) * 520 + Math.sin(t + i) * 10 + shakeAmt * Math.sin(t * 40 + i) * 4, y = 300 + u * 900; c.globalAlpha = 0.5 * Math.sin(u * Math.PI); c.fillStyle = "#ffe6a0"; c.beginPath(); c.arc(x, y, 3 + rnd(i) * 3, 0, TAU); c.fill(); } c.restore();
}
function paperOnDesk(c: Ctx, t: number, p: { body: number; fin1: number; fin2: number; win: number }, shakeK = 0, glowK = 0, torn = 0) {
  const [x, y] = PAPER, j = shakeK * 3;
  c.save(); c.translate(x + Math.sin(t * 50) * j, y + Math.cos(t * 43) * j); c.transform(1, 0, -0.35, 0.4, 0, 0);
  if (torn < 1) { c.beginPath(); c.rect(-80, -90, 160, 180); c.fillStyle = "#fffdf4"; c.fill(); c.lineWidth = 3; c.strokeStyle = INK; c.stroke(); sketchRocket(c, 0, 0, 150, p); }
  c.restore();
  if (glowK > 0) glow(c, x, y - 10, 160 + glowK * 140, "rgba(255,240,180,1)", glowK);
}
// procedural desk-top insert (paper close-up)
function deskInsert(c: Ctx, t: number, p: { body: number; fin1: number; fin2: number; win: number }, o: { shakeK?: number; zoom?: number; count?: string; countK?: number; smokeK?: number; glowK?: number; pencil?: V2 | null; crayonHop?: number } = {}) {
  const z = o.zoom ?? 1, sk = o.shakeK ?? 0; const [jx, jy] = shake(t, sk * 10, 47);
  c.save(); c.translate(VW / 2 + jx, VH / 2 + jy); c.scale(z, z); c.translate(-VW / 2, -VH / 2);
  // wood planks
  for (let i = 0; i < 9; i++) { c.fillStyle = i % 2 ? "#b8743a" : "#c98444"; c.fillRect(-200, -200 + i * 290, VW + 400, 290); c.strokeStyle = "rgba(60,30,10,0.5)"; c.lineWidth = 6; c.beginPath(); c.moveTo(-200, -200 + i * 290); c.lineTo(VW + 200, -200 + i * 290); c.stroke();
    c.strokeStyle = "rgba(90,50,20,0.25)"; c.lineWidth = 4; for (let k = 0; k < 4; k++) { c.beginPath(); const yy = -140 + i * 290 + k * 60; c.moveTo(-100, yy); c.bezierCurveTo(300, yy - 20, 600, yy + 24, VW + 100, yy); c.stroke(); } }
  const lg = c.createRadialGradient(VW * 0.7, VH * 0.1, 50, VW * 0.6, VH * 0.4, 1200); lg.addColorStop(0, "rgba(255,210,120,0.45)"); lg.addColorStop(1, "rgba(60,20,0,0.25)"); c.fillStyle = lg; c.fillRect(-200, -200, VW + 400, VH + 400);
  // crayons
  const hop = o.crayonHop ?? 0; const crayon = (x: number, y: number, a: number, col: string, i: number) => { const hy = -Math.abs(Math.sin(t * 22 + i * 1.7)) * 40 * hop; c.save(); c.translate(x, y + hy); c.rotate(a + Math.sin(t * 17 + i) * 0.15 * hop); c.beginPath(); c.roundRect(-110, -22, 200, 44, 10); c.fillStyle = col; c.fill(); c.lineWidth = 7; c.strokeStyle = INK; c.stroke(); c.beginPath(); c.moveTo(90, -18); c.lineTo(140, 0); c.lineTo(90, 18); c.closePath(); c.fillStyle = col; c.fill(); c.stroke(); c.fillStyle = "rgba(255,255,255,0.35)"; c.fillRect(-60, -22, 30, 44); c.restore(); };
  crayon(220, 1660, -0.4, "#e5263a", 0); crayon(860, 1580, 0.6, "#2fb84a", 1); crayon(900, 330, -0.2, "#3a6fd8", 2);
  // paper
  const pj = shake(t, sk * 6, 61);
  c.save(); c.translate(VW / 2 + pj[0], VH * 0.47 + pj[1]); c.rotate(-0.05 + Math.sin(t * 30) * 0.01 * sk);
  c.fillStyle = "rgba(0,0,0,0.25)"; c.fillRect(-372, -472, 760, 960);
  c.beginPath(); c.rect(-380, -480, 760, 960); c.fillStyle = "#fffdf4"; c.fill(); c.lineWidth = 8; c.strokeStyle = INK; c.stroke();
  c.strokeStyle = "rgba(90,140,220,0.25)"; c.lineWidth = 3; for (let yy = -420; yy < 460; yy += 48) { c.beginPath(); c.moveTo(-370, yy); c.lineTo(370, yy); c.stroke(); }
  sketchRocket(c, 0, 0, 640, p);
  if (o.count && (o.countK ?? 0) > 0) bigNumber(c, 0, -60, o.count, 520, o.countK!, "#ff4a44");
  c.restore();
  if ((o.glowK ?? 0) > 0) glow(c, VW / 2, VH * 0.47, 700, "rgba(255,240,180,1)", o.glowK!);
  if ((o.smokeK ?? 0) > 0) smoke(c, VW / 2, VH * 0.47 + 380, t, 16, 500, 900, 110, o.smokeK!, 3);
  if (o.pencil) drawPencil(c, o.pencil[0], o.pencil[1], 520, Math.PI + 0.5);
  c.restore();
}
const rocketParts = (t: number) => ({ body: seg(t, 5.05, 5.7, (x) => x), fin1: seg(t, 5.62, 5.9, (x) => x), fin2: seg(t, 6.42, 6.75, (x) => x), win: seg(t, 7.95, 8.3, (x) => x) });
function heroDraw(t: number, tip: V2 | null, hx: number, hy: number, h: number, face: Rig["face"] = "smile"): Rig {
  // side view facing left; right hand IK to the pencil tip (world) when drawing
  const base: Rig = { t: t * 30, view: "side", flip: true, face, lean: 8, armL: { a: 30, b: 50 }, legL: { a: -4, b: 2 }, legR: { a: 5, b: 3 }, handR: "fist", handL: "relaxed" } as Rig;
  if (tip) { const k = 1000 / h; (base as Rig).ikR = [(hx - tip[0]) * k - 30, (hy - tip[1]) * k - 40]; }
  return base;
}

/* S1a 0-2.0 hook inside the room: the rocket bursts out through the window with Stickman on the ladder */
export function S1a(c: Ctx, t: number) {
  const cam: Cam = { x: 560, y: 700, z: 1.2 + t * 0.1 }; const [sx, sy] = shake(t, 9 * (1 - seg(t, 1.2, 2)), 41); cam.sx = sx; cam.sy = sy;
  world(c, "room", cam, () => {
    roomAmbience(c, t, 1);
    const k = seg(t, 0.15, 1.6, easeIO), x = lerp(620, 577, k), y = lerp(430, 260, k), sz = lerp(360, 80, k);
    smoke(c, lerp(640, 600, k), lerp(1300, 700, k), t, 18, 600, 600, 90, 1 - seg(t, 1.4, 2), 2);
    rocketRig(c, t, x, y, sz, -0.05 + Math.sin(t * 9) * 0.03, { hero: hangPose(t, "surprised"), rung: 0.55, heroH: sz * 0.85, ladderLen: sz * 1.05 });
    if (t > 1.0) sparkles(c, ...R(455, 330), t, 14, 160, 14, "#ffffff", 4);
  });
}
/* S1b 2.0-4.95 exterior: climbing through the clouds, camera tracking upward */
export function S1b(c: Ctx, t: number) {
  const W = WORLD.sky, prog = seg(t, 2.0, 4.95, (x) => x), cy = lerp(W.h - 1000, W.h - 2200, prog);
  const cam: Cam = { x: 540, y: cy, z: 1.0 };
  world(c, "sky", cam, () => {
    for (let i = 0; i < 6; i++) { const yy = cy - 900 + ((i * 420 + t * 900) % 2200); cloudPuff(c, (rnd(i) * 1300 - 100), yy, 300 + rnd(i + 2) * 300, i, "#ffffff", 0.95); }
    smoke(c, 540, cy + 900, t, 14, 400, 800, 100, 0.9, 5);
    rocketRig(c, t, 540, cy - 460, 400, Math.sin(t * 5) * 0.05, { hero: hangPose(t, t > 2.6 ? "laugh" : "surprised"), rung: 0.55, heroH: 330, ladderLen: 420 });
    sparkles(c, 540, cy - 60, t, 10, 140, 18, "#fff0b0", 6);
  });
  // foreground cloud whoosh (parallax 1.6)
  for (let i = 0; i < 3; i++) { const yy = ((i * 900 + t * 2600) % 3000) - 600; cloudPuff(c, i % 2 ? 1060 : 20, yy, 600, 30 + i, "rgba(255,255,255,1)", 0.7); }
}

/* S2 4.95-10.15 sketching the rocket */
export function S2(c: Ctx, t: number) {
  const p = rocketParts(t);
  if (t < 6.25) { // medium: hero at the desk drawing
    const cam: Cam = { x: 700, y: 900, z: 1.55 - (t - 4.95) * 0.06 };
    world(c, "room", cam, () => { roomAmbience(c, t); paperOnDesk(c, t, p); const prog = p.body < 1 ? p.body : p.fin1; const tip: V2 = [PAPER[0] - 40 + prog * 70 + Math.sin(t * 25) * 6, PAPER[1] - 4 + Math.cos(t * 22) * 3];
      const out = stick(c, heroDraw(t, tip, ...HERO_ROOM, HERO_H, "smile"), ...HERO_ROOM, HERO_H); pencilInHand(c, out.gloveR, HERO_H, -0.5); });
  } else if (t < 8.85) { // insert close-up of the paper; pencil on the drawing
    const tipPath = t < 6.75 ? lerp(0, 1, seg(t, 6.42, 6.75)) : 0; void tipPath;
    const pen: V2 = t < 7.9 ? [VW / 2 + 160 + Math.sin(t * 20) * 14, VH * 0.47 + 160] : [VW / 2 + 40 * Math.cos(t * 12), VH * 0.47 - 120 + 40 * Math.sin(t * 12)];
    deskInsert(c, t, p, { zoom: 1 + (t - 6.25) * 0.04, pencil: pen });
    if (t > 6.59 && t < 7.0) sparkles(c, VW / 2 + 200, VH * 0.47 + 250, t, 10, 120, 22, "#fff0b0", 7);
    if (t > 8.08 && t < 8.7) sparkles(c, VW / 2, VH * 0.47 - 60, t, 12, 140, 24, "#bff8ff", 8);
  } else { // proud thumbs-up
    const cam: Cam = { x: 700, y: 880, z: 1.75 };
    world(c, "room", cam, () => { roomAmbience(c, t); paperOnDesk(c, t, p);
      stick(c, { t: t * 30, view: "front", face: "laugh", armR: { a: 40, b: 128 }, handR: "thumb", armL: { a: 10, b: 8 }, legL: { a: 3, b: 0 }, legR: { a: 3, b: 0 }, squash: 0.03 * Math.sin((t - 8.85) * 8) * Math.exp(-(t - 8.85) * 2) } as Rig, ...HERO_ROOM, HERO_H); });
  }
}
/* S3 10.15-14.3 the paper shakes, smoke pours; Stickman leans back */
export function S3(c: Ctx, t: number) {
  const P = { body: 1, fin1: 1, fin2: 1, win: 1 };
  if (t < 11.3) deskInsert(c, t, P, { shakeK: seg(t, 10.5, 10.75), crayonHop: seg(t, 10.55, 10.8), zoom: 1.05 });
  else {
    const cam: Cam = { x: 680, y: 930, z: lerp(1.45, 1.7, seg(t, 11.3, 14.3)) }; const [sx, sy] = shake(t, 4, 45); cam.sx = sx; cam.sy = sy;
    world(c, "room", cam, () => { roomAmbience(c, t, 0.5); paperOnDesk(c, t, P, 1, 0.3);
      smoke(c, PAPER[0], PAPER[1], t, 14, 120, 420, 40, seg(t, 11.33, 11.8), 9);
      const lean = seg(t, 11.45, 11.75, easeBack);
      stick(c, { t: t * 30, view: "side", flip: true, face: "surprised", lean: -14 * lean, armL: { a: -30 * lean, b: 40 }, armR: { a: 60 * lean, b: 90 }, handR: "open", handL: "open", legL: { a: -6, b: 4 }, legR: { a: 8, b: 4 }, squash: -0.04 * lean } as Rig, HERO_ROOM[0] + 40 * lean, HERO_ROOM[1], HERO_H); });
  }
}
/* S4 14.3-19.55 countdown 3-2-1, everything shakes harder, paper glows */
export function S4(c: Ctx, t: number) {
  const P = { body: 1, fin1: 1, fin2: 1, win: 1 };
  if (t < 16.6) {
    const num = t < 15.19 ? "3" : t < 15.79 ? "2" : "1", t0 = t < 15.19 ? 14.36 : t < 15.79 ? 15.19 : 15.79;
    deskInsert(c, t, P, { zoom: lerp(1.0, 1.4, seg(t, 14.3, 16.6)), shakeK: lerp(0.4, 1.4, seg(t, 14.3, 16.6)), count: num, countK: seg(t, t0, t0 + 0.25), glowK: 0.15 + 0.2 * seg(t, 15.8, 16.6), smokeK: 0.6, crayonHop: 0.8 });
  } else {
    const k = seg(t, 16.6, 19.5); const cam: Cam = { x: 620, y: 860, z: lerp(1.3, 1.65, k) }; const [sx, sy] = shake(t, 6 + 10 * k, 39); cam.sx = sx; cam.sy = sy;
    world(c, "room", cam, () => { roomAmbience(c, t, 1); paperOnDesk(c, t, P, 2, 0.4 + 0.6 * k);
      smoke(c, PAPER[0], PAPER[1], t, 22, 300, 600, 70, 0.9, 10);
      stick(c, { t: t * 30, view: "front", face: "scared", armL: { a: 30, b: 60 }, armR: { a: 30, b: 60 }, handL: "open", handR: "open", legL: { a: 8, b: 0 }, legR: { a: 8, b: 0 }, squash: -0.05 + Math.sin(t * 30) * 0.01, lookX: -0.8 } as Rig, HERO_ROOM[0] + 60, HERO_ROOM[1], HERO_H);
      if (t > 18.2) sparkles(c, PAPER[0], PAPER[1] - 40, t, 16, 200, 20, "#fff0b0", 11); });
  }
}
/* S5 19.55-26.15 the rocket tears off the page, Stickman grabs the ladder, out through the window */
export function S5(c: Ctx, t: number) {
  const grow = seg(t, 20.05, 20.7, easeBack), out = seg(t, 22.4, 23.6, easeIO);
  const rx = lerp(PAPER[0], 660, grow), ryHover = lerp(PAPER[1] - 40, 400, grow);
  const rx2 = lerp(rx, 577, out), ry2 = lerp(ryHover, 300, out), size = lerp(lerp(70, 560, grow), 70, out);
  const jump = seg(t, 21.15, 21.55, (x) => x), grabbed = t >= 21.52;
  const camZ = t < 20.9 ? 1.55 : t < 22.6 ? 1.15 : lerp(1.2, 1.75, seg(t, 22.6, 26.1));
  const cam: Cam = t < 20.9 ? { x: 640, y: 820, z: camZ } : t < 22.6 ? { x: 600, y: 960, z: 1.0 } : { x: 577, y: 520, z: camZ };
  const [sx, sy] = shake(t, t < 23.6 ? 8 : 2, 43); cam.sx = sx; cam.sy = sy;
  world(c, "room", cam, () => {
    roomAmbience(c, t, 1);
    paperOnDesk(c, t, { body: 1, fin1: 1, fin2: 1, win: 1 }, 1, 0, t > 20.05 ? 1 : 0);
    if (t > 20.05 && t < 21.4) for (let i = 0; i < 8; i++) { const d = t - 20.05, a = i * 0.8; c.save(); c.translate(PAPER[0] + Math.cos(a) * d * 380, PAPER[1] - 60 - Math.sin(a) * 200 * d + 300 * d * d); c.rotate(d * (3 + i)); c.fillStyle = "#fffdf4"; c.fillRect(-18, -12, 36, 24); c.lineWidth = 3; c.strokeStyle = INK; c.strokeRect(-18, -12, 36, 24); c.restore(); }
    smoke(c, rx2, ry2 + size * 0.6, t, 16, 300, 500, 60 + size * 0.05, 0.9, 12);
    if (t >= 20.05) {
      let hero: Rig | null = null;
      if (grabbed) hero = hangPose(t, t < 22.6 ? "surprised" : "laugh");
      const rr = rocketRig(c, t, rx2, ry2, size, Math.sin(t * 8) * 0.04, { hero, rung: 0.6, heroH: HERO_H * size / 560, ladderLen: size * 0.9 });
      if (!grabbed) { // run + jump to the dangling ladder
        const run = t < 21.15 ? seg(t, 20.9, 21.15) : 0;
        if (jump > 0) { const h0: V2 = [HERO_ROOM[0], HERO_ROOM[1] - HERO_H * 1.06], r1 = rr.rungAt(0.6), e = easeIO(jump);
          stick(c, { ...hangPose(t, "determined"), squash: jump < 0.15 ? -0.08 : 0.06 } as Rig, 0, 0, HERO_H * size / 560 + (1 - e) * (HERO_H - HERO_H * size / 560), { p: [lerp(h0[0], r1[0], e), lerp(h0[1], r1[1], e) - Math.sin(e * Math.PI) * 120] }); }
        else stick(c, { t: t * 30, view: t < 20.9 ? "front" : "side", flip: true, face: "determined", ...(t > 20.9 ? POSES.run(run * 0.8) : {}), handR: "open", handL: "open" } as Rig, HERO_ROOM[0], HERO_ROOM[1], HERO_H);
      }
    } else stick(c, { t: t * 30, view: "front", face: "scared", armL: { a: 30, b: 60 }, armR: { a: 30, b: 60 }, handL: "open", handR: "open", legL: { a: 8, b: 0 }, legR: { a: 8, b: 0 } } as Rig, HERO_ROOM[0] + 60, HERO_ROOM[1], HERO_H);
    if (t > 22.5 && t < 24.5) sparkles(c, ...R(455, 330), t, 18, 220, 16, "#ffffff", 13);
    if (t > 23.6) { for (let i = 0; i < 5; i++) { const u = (t - 23.6) * 0.4 + i * 0.2; c.save(); c.translate(R(300, 0)[0] + rnd(i) * 420, 380 + (u % 1) * 700); c.rotate(Math.sin(t * 2 + i) * 0.8); c.fillStyle = "#fffdf4"; c.fillRect(-26, -18, 52, 36); c.lineWidth = 3; c.strokeStyle = INK; c.strokeRect(-26, -18, 52, 36); c.restore(); } }
  });
}

/* ======================= SKY (scenes 6-9) ======================= */
const SKYH = WORLD.sky.h;
function skyShot(c: Ctx, t: number, camY: number, z: number, rocket: { x: number; y: number; size: number; ang: number; flame?: number; gauge?: number }, hero: Rig | null, rung: number, extra?: (cc: Cam) => void, heroH?: number) {
  const cam: Cam = { x: 540, y: camY, z };
  let rr: ReturnType<typeof rocketRig> | null = null;
  const cc = world(c, "sky", cam, () => {
    const spaceK = clamp(1 - (camY - 600) / 1400);
    twinkles(c, 1080, 1600, t, 60, 3, spaceK, 0);
    rr = rocketRig(c, t, rocket.x, rocket.y, rocket.size, rocket.ang, { flame: rocket.flame ?? 1, gauge: rocket.gauge, hero, rung, heroH: heroH ?? rocket.size * 0.82, ladderLen: rocket.size * 1.05 });
    if (extra) extra(cam);
  });
  void cc; return rr as unknown as ReturnType<typeof rocketRig>;
}
/* S6 26.15-29.05 clouds flash past; birds scatter */
export function S6(c: Ctx, t: number) {
  const k = seg(t, 26.1, 29.1, (x) => x), cy = lerp(SKYH - 1050, SKYH - 1900, k);
  skyShot(c, t, cy, 1.0, { x: 520, y: cy - 460, size: 400, ang: Math.sin(t * 4) * 0.04 }, hangPose(t, "laugh"), 0.55, () => {
    for (let i = 0; i < 7; i++) { const u = (t - 26.1) * (1.4 + rnd(i) * 0.6) + i * 0.3; bird(c, 200 + i * 120 + u * (i % 2 ? 260 : -260), cy - 150 + i * 60 - u * 140, 1.6, t + i); }
    smoke(c, 520, cy + 500, t, 8, 300, 600, 80, 0.5, 14);
  }, 330);
  for (let i = 0; i < 4; i++) { const yy = ((i * 760 + (t - 26.1) * 3200) % 3000) - 700; cloudPuff(c, i % 2 ? 1070 : 10, yy, 620, 40 + i, "#ffffff", 0.8); }
}
/* S7 29.05-35.75 dark blue -> black -> stars; then he climbs up the ladder */
export function S7(c: Ctx, t: number) {
  const k = seg(t, 29.0, 32.6, easeIO), cy = lerp(SKYH - 1900, 1000, k);
  const climb = seg(t, 33.0, 35.6, (x) => x), rung = lerp(0.55, 0.22, climb);
  const hero = climb > 0 && climb < 1 ? { ...hangPose(t, "determined"), armL: { a: 170 + 12 * sinp(climb * 4), b: -6 }, armR: { a: 170 - 12 * sinp(climb * 4), b: -6 } } as Rig : hangPose(t, t < 32 ? "surprised" : "smile");
  const z = 1.0;
  skyShot(c, t, cy, z, { x: 540, y: cy - 460, size: 400, ang: Math.sin(t * 3) * 0.03 }, hero, rung, () => {
    if (t > 31.9) twinkles(c, 1080, 1800, t, 50, 9, seg(t, 31.9, 32.6), cy - 900);
  }, 330);
  if (t < 30.6) for (let i = 0; i < 3; i++) { const yy = ((i * 900 + (t - 29) * 2600) % 3000) - 700; cloudPuff(c, i % 2 ? 1060 : 20, yy, 700, 50 + i, "#ffd6e8", 0.7 * (1 - seg(t, 29.8, 30.6))); }
}
/* S8 35.75-39.85 engine coughs, fuel gauge drops to E */
export function S8(c: Ctx, t: number) {
  const cough = (t0: number) => (t > t0 ? Math.exp(-(t - t0) * 5) : 0), sput = Math.max(cough(36.2), cough(36.7), cough(37.2));
  const flame = t < 36.2 ? 1 : 0.15 + 0.85 * (Math.sin(t * 25) > 0.3 ? 0.6 : 0.1) * (1 - seg(t, 37.7, 38.4));
  const gauge = lerp(0.35, 0, seg(t, 37.05, 37.75, easeBack));
  const wob = Math.sin(t * 6) * 0.08 * seg(t, 36.2, 36.8);
  const close = t > 36.95 && t < 38.2; // insert on the gauge
  const RY = 420, z = close ? 3.0 : 1.0;
  skyShot(c, t, close ? RY + 60 : 960, z, { x: 540, y: RY + Math.sin(t * 2) * 8, size: 400, ang: wob, flame, gauge }, hangPose(t, t < 36.2 ? "smile" : "worried", { lookX: -0.4, lookY: -0.8 }), 0.45, () => {
    for (const [t0, i] of [[36.2, 0], [36.7, 1], [37.2, 2]] as [number, number][]) puff(c, 540 + (i - 1) * 40, RY + 250, seg(t, t0, t0 + 0.9, (x) => x), 60, "#9aa0b8");
  }, 330);
  void sput;
}
/* S9 39.85-44.38 panic, then remembers the pencil in the pocket */
export function S9(c: Ctx, t: number) {
  const reach = seg(t, 41.4, 41.8), pull = seg(t, 42.05, 42.6, easeBack);
  const cy = 630, z = 1.85;
  const hero: Rig = { ...hangPose(t, t < 41.2 ? "scared" : t < 42.1 ? "think" : "grin", { lookX: t < 41.2 ? Math.sin(t * 9) : 0.3 }) } as Rig;
  if (t > 41.3) { hero.armR = undefined; hero.ikR = pull > 0 ? [150, lerp(470, 760, pull)] : [60, lerp(560, 450, reach)]; hero.handR = pull > 0 ? "fist" : "open"; }
  let out: StickOut | null = null;
  skyShot(c, t, cy + 330, z, { x: 540, y: cy - 330, size: 520, ang: Math.sin(t * 2.5) * 0.03, flame: 0.12, gauge: 0 }, null, 0.32, () => {
    const rung = drawLadder; void rung;
  });
  // the hero is drawn in a second pass with the same camera so we can grab his geometry
  c.save(); applyCam(c, clampCam("sky", { x: 540, y: cy + 330, z }));
  const s = 520 / 400, bottom: V2 = [540, cy - 330 + 206 * s]; const sway = Math.sin(t * 2.2) * 0.08;
  const rungAt = (k: number): V2 => [bottom[0] + Math.sin(sway * k) * 546 * k, bottom[1] + Math.cos(sway * k) * 546 * k];
  out = stick(c, hero, 0, 0, 420, { p: rungAt(0.32), which: t > 41.3 ? "L" : "both" });
  if (t < 41.3) sweatDrops(c, out.head[0], out.head[1], out.headR, t, 1);
  if (pull > 0) { drawPencil(c, out.gloveR[0], out.gloveR[1] - 10, 160, Math.PI * 0.95, seg(t, 42.3, 42.6) * (1 - seg(t, 43.6, 44.2))); sparkles(c, out.gloveR[0], out.gloveR[1] - 80, t, 10, 90, 16, "#fff6c0", 15, seg(t, 42.2, 42.5)); }
  c.restore();
}

/* ======================= MOON (scenes 10b-18) ======================= */
const M = (x: number, y: number) => B("moon", x, y);
const PAD = M(270, 640), PUMP = M(985, 600), KIOSK = M(1550, 690), CRATER = M(1400, 835);
const RK_SIZE = 430, RK_Y = PAD[1] - 225 * RK_SIZE / 400 + 12;
const HERO_M_H = 360;
function moonAmb(c: Ctx, t: number, revealK = 1) {
  // neon sign flicker + kiosk window glow + pad beacons
  if (revealK > 0.95) { const fl = 0.7 + 0.3 * (Math.sin(t * 13) > -0.8 ? 1 : 0) * (0.85 + 0.15 * Math.sin(t * 31)); glow(c, ...M(1250, 230), 520, "rgba(255,80,220,1)", 0.35 * fl); glow(c, ...M(1365, 550), 240, "rgba(255,210,120,1)", 0.35); }
  for (const [x, y] of [[45, 635], [230, 610], [430, 615], [515, 655], [110, 690]]) glow(c, ...M(x, y), 70, "rgba(80,255,120,1)", 0.35 + 0.35 * (0.5 + 0.5 * Math.sin(t * 4 + x)));
}
function moonWorld(c: Ctx, t: number, cam: Cam, revealK: number, fn: () => void) {
  const cc = clampCam("moon", cam); c.save(); applyCam(c, cc);
  drawBG(c, "moonClean");
  if (revealK > 0) { // the station is "drawn" into existence: scribble wipe mask over the real background
    c.save(); c.beginPath(); const n = 28; for (let i = 0; i < n; i++) { const k = clamp(revealK * n - i); if (k <= 0) break; const y0 = M(0, 80 + (i / n) * 700)[1]; c.rect(M(720, 0)[0], y0 - 60, (WORLD.moon.w - M(720, 0)[0]) * k, 70); } c.clip(); drawBG(c, "moon"); c.restore();
    if (revealK < 1) { const i = Math.floor(revealK * 28), k = revealK * 28 - i, y0 = M(0, 80 + (i / 28) * 700)[1], x = M(720, 0)[0] + (WORLD.moon.w - M(720, 0)[0]) * k; glow(c, x, y0, 180, "rgba(140,250,255,1)", 0.9); sparkles(c, x, y0, t, 8, 90, 18, "#bff8ff", 16); }
  }
  twinkles(c, WORLD.moon.w, 800, t, 70, 21, 0.8);
  moonAmb(c, t, revealK); fn(); c.restore();
}
/* S10 44.38-49.8 draws a gas station in midair -> on the Moon it appears, rocket lands on the pad */
const STATION_SKETCH: V2[][] = [[[-150, 60], [-150, -80], [150, -80], [150, 60]], [[-190, -80], [0, -150], [190, -80]], [[-60, 60], [-60, -20], [0, -20], [0, 60]], [[60, -50], [120, -50]], [[-200, 60], [200, 60]]];
export function S10(c: Ctx, t: number) {
  if (t < 45.85) {
    const prog = seg(t, 44.5, 45.6, (x) => x);
    const cy = 630, z = 1.5;
    skyShot(c, t, cy + 300, z, { x: 540, y: cy - 330, size: 520, ang: Math.sin(t * 2.5) * 0.03, flame: 0.1, gauge: 0 }, null, 0.32);
    c.save(); applyCam(c, clampCam("sky", { x: 540, y: cy + 300, z }));
    const s = 520 / 400, bottom: V2 = [540, cy - 330 + 206 * s]; const sway = Math.sin(t * 2.2) * 0.08; const rp: V2 = [bottom[0] + Math.sin(sway * 0.32) * 546 * 0.32, bottom[1] + Math.cos(sway * 0.32) * 546 * 0.32];
    const sk = (pts: V2[][]) => pts.map((pl) => pl.map(([x, y]) => [720 + x * 0.55, 860 + y * 0.55] as V2));
    const tip = sketchPath(c, sk(STATION_SKETCH), prog, "rgba(120,240,255,1)", 7);
    const hero: Rig = { ...hangPose(t, "determined"), armR: undefined, ikR: tip ? [ (tip[0] - rp[0]) * 1000 / 420 + 0, 0 ] : [200, 700], handR: "fist", lookX: 0.8 } as Rig;
    // IK in units from feet; estimate: hands at rung -> feet ~ rung + 0.86*h
    if (tip) { const feetY = rp[1] + 420 * 0.84; hero.ikR = [(tip[0] - rp[0]) * 1000 / 420, (feetY - tip[1]) * 1000 / 420]; }
    const out = stick(c, hero, 0, 0, 420, { p: rp, which: "L" });
    drawPencil(c, out.gloveR[0], out.gloveR[1] - 10, 150, Math.PI * 0.8, 0.3);
    if (t > 45.4) { const fly = seg(t, 45.4, 45.85); glow(c, lerp(720, 1100, fly), lerp(860, 300, fly), 200, "rgba(140,250,255,1)", 0.9); }
    c.restore();
    return;
  }
  const reveal = seg(t, 45.95, 47.2, (x) => x);
  const land = seg(t, 47.3, 49.0, easeIO);
  const ry = lerp(RK_Y - 1400, RK_Y, land);
  const cam: Cam = t < 47.3 ? { x: M(1200, 0)[0], y: 900, z: 1.0 } : { x: lerp(M(900, 0)[0], PAD[0] + 160, seg(t, 47.3, 48.2, easeIO)), y: 960, z: 1.0 };
  const [sx, sy] = shake(t, impact(t, 49.0, 12), 40); cam.sx = sx; cam.sy = sy;
  moonWorld(c, t, cam, reveal, () => {
    if (t > 47.3) { const bottomY = ry + 206 * RK_SIZE / 400, LL = clamp(PAD[1] - bottomY, 40, 420), feet = bottomY + LL * 0.5 + HERO_M_H * 1.02, holding = feet < PAD[1] + 12 && t < 49.2;
      rocketRig(c, t, PAD[0], ry, RK_SIZE, 0, { flame: land < 1 ? 0.7 : 0, gauge: 0, hero: holding ? hangPose(t, "smile") : null, rung: 0.5, heroH: HERO_M_H, sway: 0.02, ladderLen: LL });
      if (land >= 1) { puff(c, PAD[0] - 150, PAD[1] - 10, seg(t, 49.0, 49.9, (x) => x), 120, "#d8dcea"); puff(c, PAD[0] + 150, PAD[1] - 10, seg(t, 49.0, 49.9, (x) => x), 120, "#d8dcea"); }
      if (!holding) { const hop = seg(t, 49.2, 49.6); stick(c, { t: t * 30, view: "front", face: "smile", armL: { a: 20, b: 10 }, armR: { a: 20, b: 10 }, legL: { a: 3, b: 0 }, legR: { a: 3, b: 0 }, air: Math.sin(hop * Math.PI) * 120, squash: hop >= 1 ? -0.04 * Math.exp(-(t - 49.6) * 8) : 0 } as Rig, PAD[0] + 230 * hop + 40, PAD[1] + 10, HERO_M_H); }
    }
  });
}
// common moon state for 11-18
const HERO_SPOT: V2 = [PAD[0] + 300, PAD[1] + 14];
const robotX = (t: number) => t < 50.6 ? KIOSK[0] : t < 51.3 ? lerp(KIOSK[0], HERO_SPOT[0] + 330, seg(t, 50.6, 51.3, easeIO)) : HERO_SPOT[0] + 330;
function heroIdle(t: number, face: Rig["face"], extra: Partial<Rig> = {}): Rig { return { t: t * 30, view: "front", face, armL: { a: 10, b: 8 }, armR: { a: 10, b: 8 }, legL: { a: 3, b: 0 }, legR: { a: 3, b: 0 }, ...extra } as Rig; }
function hose(c: Ctx, a: V2, b: V2, sag: number) { c.beginPath(); c.moveTo(a[0], a[1]); c.quadraticCurveTo((a[0] + b[0]) / 2, Math.max(a[1], b[1]) + sag, b[0], b[1]); c.lineWidth = 18; c.strokeStyle = INK; c.lineCap = "round"; c.stroke(); c.lineWidth = 10; c.strokeStyle = "#2b2f40"; c.stroke(); }
/* S11 49.8-55.0 robot rolls out, fills the tank, hands a receipt */
export function S11(c: Ctx, t: number) {
  const rx = robotX(t), fill = seg(t, 51.4, 52.3), print = seg(t, 52.5, 54.6, (x) => x);
  const cam: Cam = t < 50.6 ? { x: KIOSK[0] - 200, y: 980, z: 1.25 } : t < 51.35 ? { x: lerp(KIOSK[0] - 200, HERO_SPOT[0] + 120, seg(t, 50.6, 51.35, easeIO)), y: 980, z: 1.1 } : { x: HERO_SPOT[0] + 120, y: 1000, z: lerp(1.15, 1.45, seg(t, 51.35, 55)) };
  moonWorld(c, t, cam, 1, () => {
    rocketRig(c, t, PAD[0], RK_Y, RK_SIZE, 0, { flame: 0, gauge: lerp(0, 1, fill), hero: null, sway: 0.01, ladderLen: 60 });
    if (t > 50.6) hose(c, M(1018, 600), t < 51.3 ? [rx - 60, PAD[1] - 120] : [PAD[0] + 60, RK_Y + 60], 120);
    if (t > 50.6 && t < 51.3) for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(rx + 120 + i * 30, PAD[1] - 60 - i * 30); c.lineTo(rx + 260 + i * 30, PAD[1] - 60 - i * 30); c.lineWidth = 6; c.strokeStyle = "rgba(255,255,255,0.7)"; c.stroke(); } // speed lines
    if (fill > 0 && fill < 1) sparkles(c, PAD[0] + 60, RK_Y + 60, t, 6, 50, 12, "#bff8ff", 17);
    drawRobot(c, rx, PAD[1] + 10, 230, { face: t < 52.4 ? "happy" : "neutral", t, wheel: -rx / 30, armL: t > 51.3 && t < 52.3 ? -0.8 : 0, armR: 0.2, flip: false });
    if (print > 0) drawReceipt(c, rx, PAD[1] + 10 - 230 * 112 / 300, 70, 20 + print * 420, Math.sin(t * 3) * 0.05 * print);
    stick(c, heroIdle(t, print > 0.6 ? "surprised" : "smile", { lookX: 0.8, armR: print > 0.8 ? { a: 50, b: 40 } : { a: 10, b: 8 }, handR: print > 0.8 ? "hold" : "relaxed" }), ...HERO_SPOT, HERO_M_H);
  });
}
/* S12 55.0-58.15 close-up: $30,000,000 ; jaw drop */
export function S12(c: Ctx, t: number) {
  if (t < 56.0) {
    const cam: Cam = { x: HERO_SPOT[0] + 200, y: 1000, z: 1.6 };
    moonWorld(c, t, cam, 1, () => { drawRobot(c, robotX(t), PAD[1] + 10, 230, { face: "neutral", t }); stick(c, heroIdle(t, "surprised", { lookX: 0.8 }), ...HERO_SPOT, HERO_M_H); });
    c.fillStyle = "rgba(10,10,30,0.35)"; c.fillRect(0, 0, VW, VH);
    const k = seg(t, 55.0, 55.4, easeBack); drawReceipt(c, VW / 2, 330, 660, lerp(200, 1250, k), -0.03, "$30,000,000", 1.0, 0.62);
  } else {
    const cam: Cam = { x: HERO_SPOT[0] + 10, y: HERO_SPOT[1] - HERO_M_H * 0.72, z: 2.7 };
    moonWorld(c, t, cam, 1, () => { const drop = seg(t, 56.05, 56.3, easeBack);
      const out = stick(c, heroIdle(t, "surprised", { squash: -0.06 * drop, armR: { a: 50, b: 40 }, handR: "hold", lookY: 0.4 }), ...HERO_SPOT, HERO_M_H);
      drawReceipt(c, out.gloveR[0] + 10, out.gloveR[1] - 10, 70, 380, 0.15, "$30,000,000", 1, 0.5);
      sweatDrops(c, out.head[0], out.head[1], out.headR, t, drop);
      if (drop > 0) { c.save(); c.translate(out.head[0], out.head[1] + out.headR * 0.9); c.fillStyle = "#3a1222"; c.beginPath(); c.ellipse(0, 0, out.headR * 0.18, out.headR * 0.3 * drop, 0, 0, TAU); c.fill(); c.lineWidth = 5; c.strokeStyle = INK; c.stroke(); c.restore(); } });
  }
}
/* S13 58.15-61.0 draws a tiny coin and offers it */
export function S13(c: Ctx, t: number) {
  const cam: Cam = { x: HERO_SPOT[0] + 170, y: 1010, z: 1.7 };
  moonWorld(c, t, cam, 1, () => {
    drawRobot(c, robotX(t), PAD[1] + 10, 230, { face: "neutral", t });
    const offer = seg(t, 59.4, 59.9, easeBack);
    const out = stick(c, heroIdle(t, offer > 0 ? "grin" : "determined", { lookX: 0.8, armR: offer > 0 ? { a: 80, b: 10 } : { a: 60, b: 70 }, handR: "hold" }), ...HERO_SPOT, HERO_M_H);
    if (t < 58.86) { sketchPath(c, [circlePts(out.gloveR[0] + 60, out.gloveR[1] - 70, 20)], seg(t, 58.4, 58.86, (x) => x), "rgba(255,230,120,1)", 4); drawPencil(c, out.gloveR[0] + 40, out.gloveR[1] - 60, 110, Math.PI * 0.85); }
    else { drawCoin(c, out.gloveR[0] + 6, out.gloveR[1] - 26, 20, 0, 0); sparkles(c, out.gloveR[0], out.gloveR[1] - 26, t, 6, 40, 10, "#fff0b0", 18, 1 - seg(t, 59.5, 60.2)); }
  });
}
/* S14 61.0-64.12 robot not happy: angry screen, steam */
export function S14(c: Ctx, t: number) {
  const cam: Cam = { x: robotX(t) - 40, y: PAD[1] - 180, z: 2.6 };
  moonWorld(c, t, cam, 1, () => {
    const out = stick(c, heroIdle(t, t > 62.3 ? "worried" : "grin", { lookX: 0.8, armR: { a: 80, b: 10 }, handR: "hold" }), ...HERO_SPOT, HERO_M_H); drawCoin(c, out.gloveR[0] + 6, out.gloveR[1] - 26, 20);
    const face: RobotFace = t < 61.85 ? "neutral" : "angry";
    drawRobot(c, robotX(t), PAD[1] + 10, 230, { face, t, steam: t > 62.04 ? (t - 62.04) * 0.9 : 0, armL: t > 61.85 ? -1.2 + Math.sin(t * 14) * 0.2 : 0, armR: t > 61.85 ? 1.2 : 0 });
  });
}
/* S15 64.12-68.55 draws a HUGE coin, it thuds down */
const BIGC = 250;
const coinDropY = (t: number) => t < 64.94 ? 0 : t < 65.55 ? lerp(-700, 0, seg(t, 64.94, 65.55, (x) => x * x)) : -Math.abs(Math.sin((t - 65.55) * 9)) * 40 * Math.exp(-(t - 65.55) * 4);
export function S15(c: Ctx, t: number) {
  const cx = HERO_SPOT[0] + 170, groundY = PAD[1] + 14 - BIGC;
  const cam: Cam = { x: cx, y: 900, z: 1.05 }; const [sx, sy] = shake(t, impact(t, 65.55, 26), 41); cam.sx = sx; cam.sy = sy;
  moonWorld(c, t, cam, 1, () => {
    const surprised = t > 65.55;
    const out = stick(c, heroIdle(t, t < 64.9 ? "determined" : surprised ? "surprised" : "grin", { lookX: 0.6, lookY: t < 65.5 ? -1 : 0, armR: t < 64.94 ? { a: 150, b: 10 } : { a: 20, b: 10 }, handR: "fist", squash: surprised ? -0.05 * Math.exp(-(t - 65.55) * 5) : 0 }), HERO_SPOT[0] - 160, HERO_SPOT[1], HERO_M_H);
    if (t < 64.94) { sketchPath(c, [circlePts(cx, groundY - 700, BIGC)], seg(t, 64.3, 64.92, (x) => x), "rgba(255,230,120,1)", 9); drawPencil(c, out.gloveR[0], out.gloveR[1] - 20, 130, Math.PI * 0.9, 0.4); }
    else { const wob = t > 66.2 ? Math.sin((t - 66.2) * 5) * 0.06 : 0; drawCoin(c, cx, groundY + coinDropY(t), BIGC, 0, wob); if (t > 65.55) { puff(c, cx - 230, PAD[1] + 10, seg(t, 65.55, 66.5, (x) => x), 140, "#d8dcea"); puff(c, cx + 230, PAD[1] + 10, seg(t, 65.55, 66.5, (x) => x), 140, "#d8dcea"); } }
    drawRobot(c, robotX(t) + 160 + (t > 65.55 ? 90 * seg(t, 65.55, 65.9) : 0), PAD[1] + 10, 230, { face: t > 65.55 ? "shock" : "angry", t, wheel: t > 65.55 ? -3 * seg(t, 65.55, 65.9) : 0 });
  });
}
/* S16 68.55-76.45 the coin rolls across a crater and wakes something enormous */
const ROLL_A: V2 = [HERO_SPOT[0] + 170, PAD[1] + 14], ROLL_B: V2 = [CRATER[0] - 120, CRATER[1] - 40];
const rollK = (t: number) => seg(t, 68.75, 70.35, (x) => x * x * (3 - 2 * x) * 0.4 + x * 0.6);
export function S16(c: Ctx, t: number) {
  const k = rollK(t), pos: V2 = [lerp(ROLL_A[0], ROLL_B[0], k), lerp(ROLL_A[1], ROLL_B[1], k) + Math.sin(k * Math.PI * 3) * 20], into = seg(t, 70.35, 70.8, (x) => x * x);
  const rumble = seg(t, 70.85, 71.5) * (1 - seg(t, 75.8, 76.45) * 0.5);
  const camX = t < 70.6 ? lerp(ROLL_A[0], ROLL_B[0], k) : CRATER[0] - 100; const camZ = t < 72.8 ? 1.05 : lerp(1.05, 1.0, seg(t, 72.8, 76));
  const cam: Cam = { x: camX, y: t < 70.6 ? 1100 : lerp(1100, 1180, seg(t, 70.6, 72)), z: camZ }; const [sx, sy] = shake(t, rumble * 14, 33); cam.sx = sx; cam.sy = sy;
  moonWorld(c, t, cam, 1, () => {
    if (into < 1) { c.save(); if (into > 0) { c.beginPath(); c.rect(-1e4, -1e4, 2e4, CRATER[1] - 40 - 1e4 + 1e4); c.clip(); } drawCoin(c, pos[0] + into * 60, pos[1] - BIGC * 0.45 + into * 360, BIGC * 0.45, 0, (pos[0] - ROLL_A[0]) / (BIGC * 0.45)); c.restore(); }
    if (rumble > 0) { smoke(c, CRATER[0], CRATER[1] - 20, t, 22, 700, 520, 110, rumble, 19, "#c8c4d8"); for (let i = 0; i < 8; i++) { const u = ((t * 1.3 + rnd(i)) % 1); c.fillStyle = "#9a96b0"; c.beginPath(); c.arc(CRATER[0] + (rnd(i * 3) - 0.5) * 600, CRATER[1] - 40 - Math.sin(u * Math.PI) * 220, 10 + rnd(i) * 10, 0, TAU); c.fill(); c.lineWidth = 3; c.strokeStyle = INK; c.stroke(); } }
    if (t > 72.8) { const run = seg(t, 72.8, 73.6); stick(c, heroIdle(t, "scared", { lookX: 1, armL: { a: 30, b: 60 }, armR: { a: 30, b: 60 }, handL: "open", handR: "open", nervK: 1 } as Partial<Rig>), lerp(CRATER[0] - 900, CRATER[0] - 470, run), CRATER[1] - 250, HERO_M_H); drawRobot(c, lerp(CRATER[0] - 1100, CRATER[0] - 640, run), CRATER[1] - 244, 200, { face: "shock", t, wheel: -run * 6 }); }
  });
}
/* S17 76.45-79.68 two glowing eyes open under the dust */
export function S17(c: Ctx, t: number) {
  const open = seg(t, 77.2, 77.9, easeBack);
  const cam: Cam = { x: CRATER[0], y: CRATER[1] - 260, z: lerp(1.35, 1.6, seg(t, 76.45, 79.68)) }; const [sx, sy] = shake(t, 5, 31); cam.sx = sx; cam.sy = sy;
  moonWorld(c, t, cam, 1, () => {
    smoke(c, CRATER[0], CRATER[1] - 40, t, 18, 700, 400, 110, 0.85, 22, "#c8c4d8");
    for (const ex of [-170, 170]) { const x = CRATER[0] + ex, y = CRATER[1] - 90; c.save(); c.translate(x, y);
      c.beginPath(); c.ellipse(0, 0, 90, 90 * Math.max(0.04, open), 0, 0, TAU); c.fillStyle = "#fff6c8"; c.fill(); c.lineWidth = 10; c.strokeStyle = INK; c.stroke();
      if (open > 0.2) { c.save(); c.beginPath(); c.ellipse(0, 0, 90, 90 * open, 0, 0, TAU); c.clip(); c.beginPath(); c.arc(-ex * 0.05, 4, 46, 0, TAU); c.fillStyle = "#1a0a3a"; c.fill(); c.beginPath(); c.arc(-14, -14, 14, 0, TAU); c.fillStyle = "#fff"; c.fill(); c.restore(); }
      c.restore(); glow(c, x, y, 260, "rgba(255,220,110,1)", 0.7 * open); }
  });
}
/* S18 79.68-86.45 the space whale rises, yawns, swallows the rocket whole */
export function S18(c: Ctx, t: number) {
  const rise = seg(t, 79.7, 80.8, easeIO), drift = seg(t, 81.0, 82.4, easeIO), yawn = seg(t, 80.85, 81.6) * (1 - seg(t, 82.85, 83.2)) + seg(t, 81.75, 82.0) * 0.0;
  const gulp = seg(t, 82.3, 82.85, (x) => x * x), gone = t > 82.85;
  const wx = lerp(CRATER[0] - 100, PAD[0] + 260, drift), wy = lerp(CRATER[1] + 500, CRATER[1] - 60, rise) - drift * 220 - seg(t, 83.4, 86.4, easeIO) * 900;
  const cam: Cam = t < 81.0 ? { x: CRATER[0] - 200, y: 1000, z: 1.0 } : t < 83.4 ? { x: lerp(CRATER[0] - 200, PAD[0] + 360, drift), y: 960, z: 1.0 } : { x: PAD[0] + 360, y: lerp(960, 900, seg(t, 83.4, 86.4)), z: lerp(1.0, 1.15, seg(t, 83.4, 86.4)) };
  const [sx, sy] = shake(t, 6 * (1 - drift) + impact(t, 82.85, 16), 29); cam.sx = sx; cam.sy = sy;
  moonWorld(c, t, cam, 1, () => {
    if (t < 81.4) smoke(c, CRATER[0], CRATER[1] - 40, t, 14, 700, 400, 110, 1 - seg(t, 80.4, 81.4), 23, "#c8c4d8");
    // rocket (Stickman climbs on the ladder at 79.9-80.6), then is sucked into the mouth
    if (!gone) { const mouth: V2 = [wx, wy + 60], rx = lerp(PAD[0], mouth[0], gulp), ry = lerp(RK_Y, mouth[1], gulp), sz = RK_SIZE * (1 - gulp * 0.7);
      const climb = seg(t, 79.75, 80.25);
      rocketRig(c, t, rx, ry, sz, gulp * 1.2, { flame: 0, gauge: 1, hero: null, ladderLen: 60, face: seg(t, 80.55, 80.8) });
      if (t <= 80.6) { const hopIn = seg(t, 80.25, 80.6); stick(c, { t: t * 30, view: hopIn > 0 ? "front" : "side", flip: true, face: "scared", ...(hopIn > 0 ? {} : POSES.run((t * 2) % 1)), armL: hopIn > 0 ? { a: 160, b: 0 } : undefined, armR: hopIn > 0 ? { a: 160, b: 0 } : undefined, handL: "open", handR: "open", grounded: hopIn <= 0, squash: hopIn > 0 ? 0.06 : 0 } as Rig, lerp(lerp(HERO_SPOT[0], PAD[0] + 120, climb), PAD[0], hopIn), lerp(HERO_SPOT[1], RK_Y + 40, hopIn) - Math.sin(hopIn * Math.PI) * 140, HERO_M_H * (1 - hopIn * 0.75)); } }
    drawWhale(c, wx, wy, 0.95, { eyes: 1, mouth: Math.max(yawn, gulp > 0 && !gone ? 0.85 : 0), t, blink: t > 83.3 && t < 83.6 ? 1 : 0 });
    if (gone) sparkles(c, wx, wy + 40, t, 10, 200, 20, "#ffffff", 24, 1 - seg(t, 83.2, 84));
    drawRobot(c, PAD[0] + 820, PAD[1] + 10, 210, { face: gone ? "shock" : "blink", t, armR: gone ? -1.5 + Math.sin(t * 12) * 0.5 : 0 });
  });
}

/* ======================= WHALE BELLY (19-21) ======================= */
const W4 = (x: number, y: number) => B("belly", x, y);
const BELLY_RK: V2 = W4(470, 1235), BELLY_HERO: V2 = W4(690, 1290), BELLY_HERO2: V2 = W4(250, 1300);
const bellyHeroX = (t: number) => lerp(BELLY_HERO[0], BELLY_HERO2[0], seg(t, 89.0, 90.7, (x) => x));
function bellyAmb(c: Ctx, t: number) {
  for (const [x, y, col] of [[60, 900, "rgba(120,240,255,1)"], [880, 1080, "rgba(120,240,255,1)"], [830, 1440, "rgba(255,220,100,1)"], [60, 1500, "rgba(120,240,255,1)"], [250, 240, "rgba(255,210,90,1)"], [430, 140, "rgba(120,240,255,1)"], [70, 140, "rgba(120,240,255,1)"], [850, 30, "rgba(255,210,90,1)"], [440, 320, "rgba(190,120,255,1)"], [880, 200, "rgba(120,240,255,1)"]] as [number, number, string][])
    glow(c, ...W4(x, y), 120, col, 0.35 + 0.3 * Math.sin(t * 2.5 + x * 0.01));
  c.save(); c.globalCompositeOperation = "lighter"; for (let i = 0; i < 30; i++) { const u = (t * 0.05 + rnd(i)) % 1; c.globalAlpha = 0.6 * Math.sin(u * Math.PI); c.fillStyle = i % 2 ? "#bff8ff" : "#ffd6f8"; c.beginPath(); c.arc(rnd(i * 3) * 1080, 1700 - u * 1500, 4 + rnd(i) * 4, 0, TAU); c.fill(); } c.restore();
}
/* S19 86.45-92.4 inside: rocket lands softly, Stickman climbs out and looks around */
export function S19(c: Ctx, t: number) {
  const land = seg(t, 86.5, 87.4, easeIO), out = seg(t, 87.6, 88.4);
  const hx = bellyHeroX(t);
  const cam: Cam = t < 89.0 ? { x: 600, y: lerp(1150, 1100, seg(t, 86.45, 89.0)), z: lerp(1.25, 1.32, seg(t, 86.45, 89.0)) } : { x: lerp(600, hx + 60, seg(t, 89.0, 89.6)), y: lerp(1100, 1000, seg(t, 89.0, 90.7, easeIO)), z: 1.32 };
  world(c, "belly", cam, () => {
    bellyAmb(c, t);
    const ry = lerp(BELLY_RK[1] - 1100, BELLY_RK[1] - 225 * 420 / 400, land);
    rocketRig(c, t, BELLY_RK[0], ry, 420, (1 - land) * 0.3, { flame: 0, gauge: 1, hero: null, ladderLen: 60, sway: 0.02, face: 1 - seg(t, 87.55, 87.7) });
    if (land >= 1) puff(c, BELLY_RK[0], BELLY_RK[1] + 20, seg(t, 87.4, 88.2, (x) => x), 110, "#ffd6ec");
    if (t >= 87.6) { const lk = t < 88.4 ? 0.8 : t < 89.0 ? Math.sin((t - 88.4) * 6) : t < 89.6 ? -0.8 : -0.9;
      const winY = BELLY_RK[1] - 225 * 420 / 400 - 40, fx = out < 1 ? lerp(BELLY_RK[0], BELLY_HERO[0], out) : hx, fy = lerp(winY + 120, BELLY_HERO[1], out) - Math.sin(out * Math.PI) * 160;
      const walking = t > 89.0 && t < 90.7;
      if (walking) stick(c, { t: t * 30, flip: true, face: "smile", lookY: -0.4, ...POSES.walk(((BELLY_HERO[0] - hx) / 300) % 1), view: "side" } as Rig, fx, BELLY_HERO[1], 520);
      else stick(c, heroIdle(t, t < 89.0 ? "surprised" : "smile", { lookX: t > 90.7 ? -0.8 : lk, lookY: t > 90.7 ? -0.8 : 0, grounded: out >= 1, armL: out < 1 ? { a: 150, b: 0 } : undefined, armR: out < 1 ? { a: 150, b: 0 } : t > 90.9 ? { a: 120, b: 20 } : undefined, handR: t > 90.9 ? "point" : "relaxed" }), fx, fy, 520 * lerp(0.6, 1, out)); }
  });
}
/* S20 92.4-95.7 close-up: smiles, lifts the pencil, it sparkles */
export function S20(c: Ctx, t: number, z0 = 2.2) {
  const lift = seg(t, 93.55, 94.05, easeBack);
  const cam: Cam = { x: BELLY_HERO2[0] + 120, y: BELLY_HERO2[1] - 360, z: z0 };
  world(c, "belly", cam, () => {
    bellyAmb(c, t);
    drawRocket(c, BELLY_RK[0], BELLY_RK[1] - 225 * 420 / 400, 420, 0, { flame: 0, gauge: 1 }); drawLadder(c, [BELLY_RK[0], BELLY_RK[1] - 10], 40, 98, 0, 1, t);
    const out = stick(c, heroIdle(t, t < 92.85 ? "neutral" : "grin", { armR: { a: lerp(10, 150, lift), b: lerp(8, 20, lift) }, handR: lift > 0.1 ? "fist" : "relaxed" }), ...BELLY_HERO2, 520);
    if (lift > 0.1) { drawPencil(c, out.gloveR[0], out.gloveR[1] - 20, 200, Math.PI * 0.98, seg(t, 93.9, 94.2)); sparkles(c, out.gloveR[0], out.gloveR[1] - 120, t, 14, 140, 20, "#fff6c0", 25, seg(t, 93.9, 94.2)); }
  });
}
/* S21 95.7-100 end question + subscribe card (overlay drawn by the composition) */
export function S21(c: Ctx, t: number) { S20(c, t, lerp(2.2, 1.5, seg(t, 95.7, 97.4, easeIO))); }
void cloudPuff; void easeBack; void VH;
