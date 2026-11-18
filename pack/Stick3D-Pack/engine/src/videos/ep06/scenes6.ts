// EP06 "What If Stickman Built a Time Machine… With One Wrong Number?" — 60 s seamless loop.
import { Rig, POSES } from "../../style/stickman";
import { sparkles, puff, glow, sweatDrops, smoke, seg, lerp, clamp, easeIO, easeBack, rnd, INK, V2 } from "../../style/props2d";
import { stick, setLook, StickOut } from "../ep03/engine2d";
import { workshopBG, futureBG, futureFX, drawPod, drawKeyboard, drawDisplay, drawJelly, bubbleText, keyPos, WW, WH, FLOOR_Y, SHORE_Y, HORIZON_Y } from "./bg6";

type Ctx = CanvasRenderingContext2D;
const TAU = Math.PI * 2;
export const VW = 1080, VH = 1920;
type Cam = { x: number; y: number; z: number; sx?: number; sy?: number };
function view(c: Ctx, bg: HTMLCanvasElement, cam: Cam, rim: string, fn: () => void) {
  const hw = VW / 2 / cam.z, hh = VH / 2 / cam.z, x = clamp(cam.x, hw, WW - hw), y = clamp(cam.y, hh, WH - hh);
  setLook(rim, true); c.save(); c.translate(VW / 2 + (cam.sx ?? 0), VH / 2 + (cam.sy ?? 0)); c.scale(cam.z, cam.z); c.translate(-x, -y); c.drawImage(bg, 0, 0); fn(); c.restore();
}
function shot(t: number, list: [number, Cam][]): Cam { for (let i = 0; i < list.length; i++) if (t < list[i][0] || i === list.length - 1) { const t0 = i ? list[i - 1][0] : list[0][0] - 2, k = clamp((t - t0) / Math.max(0.5, list[i][0] - t0)); const cm = list[i][1]; return { ...cm, z: cm.z * (1 + 0.035 * k) }; } return list[0][1]; }
const shakeXY = (t: number, t0: number, amp: number, dur = 0.5): [number, number] => { if (t < t0 || t > t0 + dur) return [0, 0]; const k = Math.exp(-(t - t0) * 6) * amp; return [Math.sin(t * 61) * k, Math.cos(t * 53) * k]; };
const RIM_WS = "150,200,255", RIM_FU = "255,150,235";
const base = (t: number, face: Rig["face"], x: Partial<Rig> = {}): Rig => ({ t: t * 30, view: "front", face, armL: { a: 12, b: 10 }, armR: { a: 12, b: 10 }, legL: { a: 9, b: 0 }, legR: { a: 4, b: 0, lift: 18 }, ...x } as Rig);
const toU = (wx: number, wy: number, x: number, y: number, h: number): [number, number] => [(wx - x) * 1000 / h, (y - wy) * 1000 / h];
const hero = (c: Ctx, rig: Rig, x: number, y: number, h: number, rot = 0): StickOut => stick(c, rig, x, y, h, undefined, rot);
function bang(c: Ctx, txt: string, x: number, y: number, size: number, k: number, fill = "#ffd23a") { if (k <= 0) return; c.save(); c.translate(x, y); const s = easeBack(clamp(k)); c.scale(s, s); c.font = `900 ${size}px Inter`; c.textAlign = "center"; c.textBaseline = "middle"; c.lineJoin = "round"; c.lineWidth = size * 0.16; c.strokeStyle = INK; c.strokeText(txt, 0, 0); c.fillStyle = fill; c.fillText(txt, 0, 0); c.restore(); }

/* ---------- workshop set: desk + keyboard + wall display + stool + pod ---------- */
const HH = 800, SEAT_X = 230, DESK = { x0: 360, x1: 760, top: 1310 }, KB: V2 = [565, 1310], KBS = 0.42, DISP: V2 = [640, 880], POD: V2 = [900, FLOOR_Y];
const SEAT_Y = FLOOR_Y; // feet
function desk(c: Ctx) {
  c.save(); c.lineJoin = "round"; c.beginPath(); c.roundRect(DESK.x0, DESK.top, DESK.x1 - DESK.x0, 34, 6); c.fillStyle = "#8a5a32"; c.fill(); c.lineWidth = 7; c.strokeStyle = INK; c.stroke();
  for (const x of [DESK.x0 + 30, DESK.x1 - 50]) { c.beginPath(); c.roundRect(x, DESK.top + 34, 22, FLOOR_Y - DESK.top - 34, 4); c.fillStyle = "#6a4022"; c.fill(); c.lineWidth = 6; c.stroke(); }
  c.beginPath(); c.moveTo(DISP[0], DISP[1] + 90); c.lineTo(DISP[0], DESK.top); c.lineWidth = 10; c.stroke(); // display post
  // mug + screwdriver on desk
  c.beginPath(); c.roundRect(DESK.x1 - 70, DESK.top - 60, 50, 60, 8); c.fillStyle = "#fffdf4"; c.fill(); c.lineWidth = 5; c.stroke();
  c.restore();
}
function stool(c: Ctx, x: number) { const top = FLOOR_Y - 0.23 * HH; c.save(); c.lineJoin = "round"; c.beginPath(); c.ellipse(x, top, 90, 22, 0, 0, TAU); c.fillStyle = "#e5483f"; c.fill(); c.lineWidth = 7; c.strokeStyle = INK; c.stroke(); for (const dx of [-60, 0, 60]) { c.beginPath(); c.moveTo(x + dx * 0.6, top + 18); c.lineTo(x + dx, FLOOR_Y); c.lineWidth = 10; c.stroke(); } c.restore(); }
const keyW = (k: string) => keyPos(KB[0], KB[1], KBS, k);
// sitting at the keyboard, side view facing right; right hand index on key `k` (or hovering)
const seated = (t: number, face: Rig["face"], x: Partial<Rig> = {}): Rig => ({ t: t * 30, view: "side", face, lean: 8, legR: { a: 85, b: 88, f: 0 }, legL: { a: 80, b: 84, f: 0 }, armL: { a: 70, b: 30 }, handR: "point", handL: "relaxed", lookX: 0.8, lookY: 0.3, ...x } as Rig);
function workshop(c: Ctx, t: number, o: { pod?: Parameters<typeof drawPod>[5]; podVis?: number; disp?: string; dispO?: Parameters<typeof drawDisplay>[6]; pressed?: string[] } = {}) {
  if ((o.podVis ?? 1) > 0) { c.save(); c.globalAlpha = o.podVis ?? 1; drawPod(c, POD[0], POD[1], 1.0, t, o.pod ?? {}); c.restore(); }
  desk(c); drawKeyboard(c, KB[0], KB[1], KBS, t, o.pressed ?? []); drawDisplay(c, DISP[0], DISP[1], 420, o.disp ?? "2026", t, o.dispO ?? {});
}

/* ---------- the looping close-up (frame 0 == frame 1800) ---------- */
// tau runs -4.9..1.3 : types 2-0-2-6, finger slips along the number row (tau -4.27), display spins with sparks
const TYPE = [["2", -6.2], ["0", -5.95], ["2", -5.7], ["6", -5.45]] as [string, number][];
function closeup(c: Ctx, tau: number, t: number) {
  const slip = seg(tau, -4.27, -3.9, easeIO), typed = TYPE.filter(([, tt]) => tau > tt).length;
  const disp = slip > 0 ? "2,026,000" : "2026".slice(0, typed).padEnd(4, " ");
  const spin = slip > 0 ? 1 : 0, spark = slip > 0 ? 0.7 + 0.3 * Math.sin(t * 20) : 0;
  const [sx, sy] = slip > 0 ? [Math.sin(t * 47) * 5, Math.cos(t * 41) * 4] : [0, 0];
  view(c, workshopBG(), { x: 640, y: 1000, z: 1.9, sx, sy }, RIM_WS, () => {
    workshop(c, t, { disp, dispO: { spin, sparks: spark, red: slip > 0, spinFrom: 4 }, pressed: slip > 0 ? ["9", "0"] : typed && typed < 5 ? [TYPE[typed - 1][0]] : [] });
    // the finger: before the slip it taps the typed key; then slides right along the number row and stays jammed on 9/0
    const target: V2 = slip > 0 ? [lerp(keyW("6")[0], keyW("0")[0] + 10, slip) + Math.sin(t * 30) * 4, keyW("0")[1] - 6] : keyW(typed ? TYPE[Math.min(3, typed - 1)][0] : "2");
    const out = stick(c, seated(t, slip > 0 ? "scared" : "determined", { ikR: [520, 520], ikL: [420, 480], handL: "open" }), 0, 0, HH, { p: [target[0] - 30, target[1] + 10], which: "R" });
    if (slip > 0) { sweatDrops(c, out.head[0], out.head[1], out.headR, t, slip); for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(target[0] - 70 - i * 30, target[1] - 20 + i * 12); c.lineTo(target[0] - 150 - i * 30, target[1] - 20 + i * 12); c.lineWidth = 6; c.strokeStyle = INK; c.lineCap = "round"; c.stroke(); } }
  });
}
export function S1(c: Ctx, t: number) {
  if (t < 1.3) return closeup(c, t, t);
  if (t < 3.75) { // rewind: medium shot, he types the year
    const pressK = TYPE.map(([k, tt]) => [k, tt + 7.7] as [string, number]); const cur = pressK.filter(([, tt]) => t > tt); const key = cur.length ? cur[cur.length - 1][0] : "2";
    view(c, workshopBG(), shot(t, [[2.5, { x: 470, y: 1230, z: 1.3 }], [3.75, { x: 520, y: 1180, z: 1.55 }]]), RIM_WS, () => {
      workshop(c, t, { disp: "2026".slice(0, cur.length).padEnd(4, " "), pressed: cur.length && t - cur[cur.length - 1][1] < 0.12 ? [key] : [] });
      stool(c, SEAT_X); const kp = keyW(key); hero(c, seated(t, "smile", { ikR: toU(kp[0] - 28, kp[1] + 6 - (t % 0.25 < 0.12 ? 0 : 18), SEAT_X, SEAT_Y, HH) }), SEAT_X, SEAT_Y, HH);
    });
    return;
  }
  closeup(c, t - 8.17, t - 8.17); // 3.75..5.0 -> tau -4.42..-3.17 (slip on 'slipped' 3.9)
}
/* ---------- S2 5.0-10.2: "two zero two six became two zero two... SIX MILLION" ---------- */
export function S2(c: Ctx, t: number) {
  const hi = [5.07, 5.31, 5.61, 5.85].filter((x) => t >= x).length, million = t >= 8.29;
  if (t < 8.8) {
    const disp = t < 6.31 ? "2026" : million ? "2,026,000" : "202" + "6,000".slice(0, 1 + Math.min(4, Math.floor((t - 6.31) * 3)));
    view(c, workshopBG(), { x: DISP[0], y: DISP[1] + 40, z: t < 6.31 ? 2.35 : lerp(2.35, 2.2, seg(t, 6.31, 8.29)), ...(million ? { sx: shakeXY(t, 8.29, 14)[0], sy: shakeXY(t, 8.29, 14)[1] } : {}) }, RIM_WS, () => {
      workshop(c, t, { disp, dispO: { spin: t > 6.31 && !million ? 1 : 0, spinFrom: 3, sparks: million ? 1 - seg(t, 8.29, 8.8) * 0.6 : 0, red: million } });
      if (t < 6.31 && hi > 0) { const cw = 420 * 0.94 / (4 * 0.62) * 0.62 * 0.82, x0 = DISP[0] - 1.5 * cw; c.save(); c.globalCompositeOperation = "lighter"; glow(c, x0 + (hi - 1) * cw, DISP[1] + 4, 70, "rgba(160,255,200,1)", 0.8); c.restore(); }
      if (million) bang(c, "SIX MILLION!", DISP[0], DISP[1] + 200, 64, seg(t, 8.29, 8.5), "#ff5a6a");
    });
  } else view(c, workshopBG(), { x: SEAT_X + 120, y: SEAT_Y - HH * 0.62, z: 2.0 }, RIM_WS, () => { // jaw drop
    workshop(c, t, { disp: "2,026,000", dispO: { red: true, sparks: 0.4 } }); stool(c, SEAT_X);
    const out = hero(c, seated(t, "surprised", { lookX: 0.3, lookY: -0.8, lean: -10, armL: { a: 40, b: 120 }, handL: "open", ikR: [300, 400], handR: "open", squash: -0.05 * seg(t, 8.8, 9.0) }), SEAT_X, SEAT_Y, HH);
    c.save(); c.fillStyle = "#3a1222"; c.beginPath(); c.ellipse(out.head[0] + out.headR * 0.42, out.head[1] + out.headR * 0.62, out.headR * 0.14, out.headR * 0.3 * seg(t, 8.8, 9.1), 0, 0, TAU); c.fill(); c.lineWidth = 5; c.strokeStyle = INK; c.stroke(); c.restore();
  });
}
/* ---------- S3 10.2-14.7: the machine shakes, sparks, vanishes (with him inside) ---------- */
export function S3(c: Ctx, t: number) {
  const shakeK = seg(t, 11.0, 11.4), spark = t > 11.7 ? 0.6 + 0.4 * Math.sin(t * 25) : 0, gone = seg(t, 12.66, 12.9, easeIO);
  const [sx, sy] = t < 12.9 ? [Math.sin(t * 61) * 10 * shakeK, Math.cos(t * 53) * 8 * shakeK] : [0, 0];
  const cam3 = shot(t, [[11.6, { x: POD[0] - 140, y: FLOOR_Y - 380, z: 1.75 }], [12.6, { x: POD[0] - 110, y: FLOOR_Y - 330, z: 2.05 }], [14.7, { x: 620, y: 1260, z: 1.2 }]]);
  view(c, workshopBG(), { ...cam3, sx, sy }, RIM_WS, () => {
    const podScale = 1 - gone;
    if (podScale > 0.01) { c.save(); c.translate(POD[0], POD[1] - 260); c.scale(1 - 0.5 * gone, podScale); c.translate(-POD[0], -(POD[1] - 260)); drawPod(c, POD[0], POD[1], 1.0, t, { shake: shakeK * 1.5, spark, glowK: 0.4 + shakeK * 0.6, occupant: () => { stick(c, base(t, t < 11.7 ? "worried" : "scared", { armL: { a: 150, b: 20 }, armR: { a: 150, b: 20 }, handL: "open", handR: "open" }), Math.sin(t * 50) * 6 * shakeK, 300, 380); } }); c.restore(); }
    desk(c); drawKeyboard(c, KB[0], KB[1], KBS, t, []); drawDisplay(c, DISP[0], DISP[1], 420, "2,026,000", t, { red: true });
    if (t > 12.66) { c.save(); c.globalCompositeOperation = "lighter"; glow(c, POD[0], POD[1] - 260, 700 * (1 - seg(t, 12.7, 13.3)), "rgba(180,240,255,1)", 1 - seg(t, 12.7, 13.4)); c.restore(); smoke(c, POD[0], POD[1] - 40, t, 26, 600, 900, 110, 1 - seg(t, 13.6, 14.7) * 0.6, 4, "#d8dcea"); sparkles(c, POD[0], POD[1] - 260, t, 14, 300, 20, "#bff8ff", 6, 1 - seg(t, 12.7, 13.6)); }
  });
  if (t > 12.66 && t < 12.9) { c.fillStyle = `rgba(255,255,255,${1 - seg(t, 12.66, 12.9)})`; c.fillRect(0, 0, VW, VH); }
}
/* ---------- future world ---------- */
const HF = 820, HX = 360, FEET = 1730, PODF: V2 = [830, 1710];
function future(c: Ctx, t: number, wave = -1, wk = 0) { futureFX(c, t, wave, wk); }
const JELLIES: [number, number, number, number][] = [[200, 760, 120, 300], [520, 640, 170, 280], [880, 780, 140, 310], [700, 920, 90, 270], [330, 920, 80, 320]];
function jellyBack(c: Ctx, t: number, rise: number, lit = 0, o: { skip?: number } = {}) { JELLIES.forEach(([x, y, r, h], i) => { if (i === o.skip) return; drawJelly(c, x + Math.sin(t * 0.6 + i) * 20, y + (1 - rise) * 700 + Math.sin(t * 1.3 + i) * 14, r, t, { hue: h, lit, face: "smile" }); }); }
/* S4 14.7-19.6: smoke clears; coughing; no city, no trees, no people */
export function S4(c: Ctx, t: number) {
  const cough = t < 16.2, look = t < 16.4 ? 0 : t < 17.4 ? -1 : t < 18.4 ? 1 : 0, drop = seg(t, 18.5, 18.8);
  view(c, futureBG(), shot(t, [[16.4, { x: 520, y: 1330, z: 1.25 }], [17.4, { x: 380, y: 1380, z: 1.5 }], [18.4, { x: 540, y: 1360, z: 1.4 }], [19.6, { x: HX + 60, y: FEET - HF * 0.6, z: 2.0 }]]), RIM_FU, () => {
    future(c, t);
    drawPod(c, PODF[0], PODF[1], 0.95, t, { door: 1, glowK: 0.2 });
    const k = cough ? Math.abs(Math.sin(t * 9)) : 0;
    const out = hero(c, base(t, cough ? "worried" : look ? "neutral" : drop > 0 ? "surprised" : "worried", { lean: cough ? 12 * k : 0, squash: -0.04 * k, armL: cough ? { a: 60, b: 120 } : { a: 20, b: 20 }, handL: cough ? "fist" : "open", armR: cough ? { a: 30, b: 30 } : { a: 20, b: 20 }, lookX: look, headTilt: look * 6 }), HX, FEET, HF);
    if (cough) { smoke(c, out.head[0] + 80, out.head[1] + 40, t, 8, 160, 220, 40, 0.8, 9, "#e8e0f0"); if (Math.sin(t * 9) > 0.7) bang(c, "*COUGH*", out.head[0] + 120, out.head[1] - out.headR * 1.4, 54, 1, "#ffffff"); }
    smoke(c, PODF[0], PODF[1] - 200, t, 18, 900, 600, 120, 1 - seg(t, 14.7, 16.6), 5, "#e8e0f0");
    if (drop > 0) { c.save(); c.fillStyle = "#3a1222"; c.beginPath(); c.ellipse(out.head[0], out.head[1] + out.headR * 0.62, out.headR * 0.18, out.headR * 0.32 * drop, 0, 0, TAU); c.fill(); c.lineWidth = 5; c.strokeStyle = INK; c.stroke(); c.restore(); }
  });
}
/* S5 19.6-23.7: giant glowing jellyfish rise over the purple ocean */
export function S5(c: Ctx, t: number) {
  const rise = seg(t, 19.7, 21.4, easeIO);
  view(c, futureBG(), shot(t, [[21.7, { x: 540, y: 1100, z: lerp(1.0, 1.08, rise) }], [23.7, { x: 560, y: 1150, z: 1.25 }]]), RIM_FU, () => {
    future(c, t); jellyBack(c, t, rise);
    const out = hero(c, { ...base(t, "surprised", { lookY: -1, armL: { a: 30, b: 40 }, armR: { a: 30, b: 40 } }), view: t < 21.7 ? "back" : "front" } as Rig, HX + 40, FEET, HF);
    if (t > 21.7) sparkles(c, out.head[0], out.head[1] - out.headR, t, 6, 120, 14, "#ffd6ff", 3, 0.6);
  });
}
/* S6 23.7-26.4: one of them looks at him... and waves */
const BIG: V2 = [760, 900], BR = 260;
export function S6(c: Ctx, t: number) {
  const wave = t > 25.4 ? 0.5 + 0.5 * Math.sin((t - 25.4) * 9) : 0, lookK = seg(t, 24.2, 24.6);
  view(c, futureBG(), shot(t, [[25.3, { x: 600, y: 1200, z: 1.25 }], [26.4, { x: BIG[0] - 120, y: BIG[1] + 150, z: 1.6 }]]), RIM_FU, () => {
    future(c, t); jellyBack(c, t, 1, 0, { skip: 2 });
    drawJelly(c, BIG[0] + Math.sin(t) * 10, BIG[1] + Math.sin(t * 1.3) * 12, BR, t, { hue: 300, face: "smile", wave });
    hero(c, base(t, "surprised", { lookX: lerp(0, 1, lookK), lookY: -0.6 }), HX - 60, FEET, HF);
  });
}
/* S7 26.4-29.3: it speaks in bubbles. BLUB. BLUB-BLUB. */
export function S7(c: Ctx, t: number) {
  const talk = (t > 27.0 && t < 27.6) || (t > 27.89 && t < 28.1) || (t > 28.2 && t < 28.7);
  if (t < 28.75) view(c, futureBG(), { x: BIG[0] - 60, y: BIG[1] + 60, z: 1.9 }, RIM_FU, () => {
    future(c, t); drawJelly(c, BIG[0], BIG[1] + Math.sin(t * 1.3) * 12, BR, t, { hue: 300, face: "talk", mouth: talk ? 0.5 + 0.5 * Math.sin(t * 30) : 0 });
    for (let i = 0; i < 8; i++) { const u = ((t - 26.4) * 0.6 + i * 0.13) % 1; c.beginPath(); c.arc(BIG[0] - 40 + Math.sin(i * 3 + t) * 60, BIG[1] + 20 - u * 500, 10 + rnd(i) * 16, 0, TAU); c.lineWidth = 4; c.strokeStyle = `rgba(220,250,255,${1 - u})`; c.stroke(); }
    bubbleText(c, BIG[0] - 160, BIG[1] - 260, "BLUB.", seg(t, 27.89, 29.0, (x) => x), 90); bubbleText(c, BIG[0] + 40, BIG[1] - 420, "BLUB-BLUB!", seg(t, 28.2, 29.3, (x) => x), 80);
  });
  else view(c, futureBG(), { x: HX + 80, y: FEET - HF * 0.62, z: 2.0 }, RIM_FU, () => { future(c, t); hero(c, base(t, "think", { headTilt: 14, lookX: 1, armR: { a: 40, b: 120 }, handR: "point" }), HX, FEET, HF); });
}
/* S8 29.3-32.2: he waves back. Big mistake (sweat + gulp) */
export function S8(c: Ctx, t: number) {
  const wv = t > 29.85 && t < 30.75 ? Math.sin((t - 29.85) * 14) : 0;
  if (t < 30.75) view(c, futureBG(), { x: 520, y: 1260, z: 1.35 }, RIM_FU, () => {
    future(c, t); drawJelly(c, BIG[0], BIG[1], BR, t, { hue: 300, face: "smile" });
    hero(c, base(t, "laugh", { armR: { a: 150 + 20 * wv, b: 10 }, handR: "open", lookX: 1, legR: { a: 4, b: 0, lift: 30 } }), HX - 40, FEET, HF);
  });
  else view(c, futureBG(), { x: HX + 40, y: FEET - HF * 0.66, z: 2.4 }, RIM_FU, () => {
    future(c, t); const g = seg(t, 31.1, 31.35) * (1 - seg(t, 31.5, 31.7));
    const out = hero(c, base(t, "worried", { squash: -0.05 * g, armR: { a: 150, b: 10 }, handR: "open", lookX: 1, lookY: 0.2 }), HX, FEET, HF);
    sweatDrops(c, out.head[0], out.head[1], out.headR, t, 1); if (g > 0.3) bang(c, "GULP", out.head[0] - out.headR * 1.5, out.head[1] + out.headR * 0.9, 56, 1, "#ffffff");
  });
}
/* S9 32.2-35.8: in this future, waving meant: I challenge you */
export function S9(c: Ctx, t: number) {
  const ch = t > 34.4, flex = ch ? Math.sin(t * 8) : 0;
  view(c, futureBG(), shot(t, [[33.3, { x: BIG[0] - 80, y: BIG[1] + 40, z: 1.85 }], [34.4, { x: 560, y: 1200, z: 1.3 }], [35.8, { x: 540, y: 1180, z: 1.45 }]]), RIM_FU, () => {
    future(c, t); jellyBack(c, t, 1, 0, { skip: 2 });
    drawJelly(c, BIG[0], BIG[1] + Math.sin(t * 1.3) * 10, BR, t, { hue: t > 33.6 ? 330 : 300, face: t > 33.6 ? "challenge" : "smile", flex: ch ? 1 + flex : 0, wave: ch ? 0.6 + 0.4 * flex : 0 });
    if (t > 34.5) bang(c, "!!", BIG[0] + BR * 0.9, BIG[1] - BR * 1.1, 110, seg(t, 34.5, 34.7), "#ff6a8a");
    hero(c, base(t, "worried", { armL: { a: 40, b: 60 }, armR: { a: 40, b: 60 }, handL: "open", handR: "open", lookX: 1, lean: -6 }), HX - 40, FEET, HF);
  });
}
/* S10 35.8-39.4: a thousand jellyfish light up at once (glow wave rolls across the ocean) */
export function S10(c: Ctx, t: number) {
  const wave = seg(t, 37.1, 38.4, (x) => x), wk = clamp(wave * 3) * (1 - seg(t, 38.8, 39.4) * 0.4);
  view(c, futureBG(), shot(t, [[37.6, { x: 540, y: 1000, z: 1.0 }], [39.4, { x: HX + 100, y: FEET - HF * 0.6, z: 1.8 }]]), RIM_FU, () => {
    future(c, t, wave, wk);
    for (let i = 0; i < 70; i++) { const x = rnd(i * 3) * WW, y = HORIZON_Y + 30 + rnd(i * 7) ** 1.3 * (SHORE_Y - HORIZON_Y - 120), d = (y - HORIZON_Y) / (SHORE_Y - HORIZON_Y), r = 18 + d * 60; const lit = clamp((wave * (WW + 600) - 300 - x) / 200); drawJelly(c, x, y + Math.sin(t * 1.5 + i) * 6, r, t + i, { hue: 260 + rnd(i) * 80, lit, face: lit > 0.5 ? "challenge" : "smile" }); }
    jellyBack(c, t, 1, wk);
    const drop = seg(t, 37.3, 37.6);
    const out = hero(c, base(t, drop > 0 ? "scared" : "worried", { armL: { a: 70, b: 40 }, armR: { a: 70, b: 40 }, handL: "open", handR: "open", lookX: 0.3, lookY: -0.4, squash: 0.04 * drop }), HX, FEET, HF);
    if (drop > 0) { c.save(); c.fillStyle = "#3a1222"; c.beginPath(); c.ellipse(out.head[0], out.head[1] + out.headR * 0.62, out.headR * 0.18, out.headR * 0.34 * drop, 0, 0, TAU); c.fill(); c.lineWidth = 5; c.strokeStyle = INK; c.stroke(); c.restore(); sweatDrops(c, out.head[0], out.head[1], out.headR, t, drop); }
  });
}
/* S11 39.4-42.9: jumps back into the machine and smashes every button */
const PANEL_BTNS: [number, number, string][] = Array.from({ length: 15 }, (_, i) => [200 + (i % 5) * 170, 1050 + Math.floor(i / 5) * 170, ["#ff4a5a", "#ffd23a", "#4aff8a", "#4ad8ff", "#ff7af0"][(i * 3) % 5]]);
function cockpit(c: Ctx, t: number, smash: number, flash = "", flashK = 0) {
  c.fillStyle = "#1a2040"; c.fillRect(0, 0, VW, VH);
  const g = c.createRadialGradient(540, 700, 50, 540, 700, 900); g.addColorStop(0, "rgba(120,220,255,0.35)"); g.addColorStop(1, "rgba(0,0,0,0)"); c.fillStyle = g; c.fillRect(0, 0, VW, VH);
  c.save(); c.beginPath(); c.arc(540, 520, 380, 0, TAU); c.fillStyle = "#3a1a6a"; c.fill(); c.lineWidth = 30; c.strokeStyle = "#8a92a8"; c.stroke(); c.lineWidth = 8; c.strokeStyle = INK; c.stroke(); c.restore(); // porthole from inside
  c.save(); c.beginPath(); c.arc(540, 520, 360, 0, TAU); c.clip(); c.drawImage(futureBG(), -200, -300, 1500, 2700); for (let i = 0; i < 6; i++) drawJelly(c, 200 + i * 140, 520 + Math.sin(i) * 120, 50, t + i, { hue: 280 + i * 15, lit: 1, face: "challenge" }); c.restore();
  c.beginPath(); c.roundRect(60, 920, 960, 600, 40); c.fillStyle = "#3a3f56"; c.fill(); c.lineWidth = 10; c.strokeStyle = INK; c.stroke();
  PANEL_BTNS.forEach(([x, y, col], i) => { const hit = smash > 0 && Math.floor(t * 14 + i * 7) % 5 === 0; c.beginPath(); c.arc(x, y + (hit ? 8 : 0), 56, 0, TAU); c.fillStyle = hit ? "#ffffff" : col; c.fill(); c.lineWidth = 8; c.strokeStyle = INK; c.stroke(); if (hit) glow(c, x, y, 120, "rgba(255,255,200,1)", 0.7); });
  if (flashK > 0) bang(c, flash, 540, 860, 120, flashK, flash.startsWith("RIGHT") ? "#4aff8a" : "#ff4a5a");
}
export function S11(c: Ctx, t: number) {
  if (t < 41.2) { const run = seg(t, 39.55, 40.4, (x) => x), jump = seg(t, 40.4, 40.95, easeIO);
    view(c, futureBG(), { x: 620, y: 1290, z: 1.25 }, RIM_FU, () => {
      future(c, t, 1, 0.6); jellyBack(c, t, 1, 0.8);
      drawPod(c, PODF[0], PODF[1], 0.95, t, { door: 1 - seg(t, 40.9, 41.15), glowK: 0.5 });
      if (jump < 1) { const x = lerp(lerp(HX - 80, PODF[0] - 300, run), PODF[0] - 20, jump), y = FEET - Math.sin(jump * Math.PI) * 300 - jump * 120;
        hero(c, jump > 0 ? { t: t * 30, view: "side", face: "scared", ...POSES.run(0.25), grounded: false, armR: { a: 170, b: 0 }, armL: { a: 160, b: 0 } } as Rig : { t: t * 30, face: "scared", ...POSES.run((t * 2.4) % 1), view: "side" } as Rig, x, y, HF * (1 - jump * 0.4)); }
    });
    return; }
  cockpit(c, t, 1);
  const L = Math.sin(t * 26), R = Math.sin(t * 26 + Math.PI);
  stick(c, base(t, "scared", { ikL: [-200, 760 + 140 * L], ikR: [200, 760 + 140 * R], handL: "fist", handR: "fist", lookY: 0.5 }), 540, 2300, 1150);
  bang(c, "SMASH!", 540, 300, 110, seg(t, 41.34, 41.6), "#ffd23a");
}
/* S12 42.9-45.6: wrong button, wrong button, RIGHT BUTTON */
export function S12(c: Ctx, t: number) {
  const ev = t < 43.75 ? ["WRONG!", 43.06] : t < 44.6 ? ["WRONG!", 43.8] : ["RIGHT!", 44.68];
  const k = seg(t, ev[1] as number, (ev[1] as number) + 0.2);
  cockpit(c, t, t > 43.0 && t < 44.68 ? 1 : 0, ev[0] as string, k);
  const yr = t < 43.75 ? "-3,000,000" : t < 44.6 ? "1066" : "2026";
  drawDisplay(c, 540, 600, 640, yr, t, { red: ev[0] !== "RIGHT!", spin: k < 0.5 ? 1 : 0 });
  const tgt = t < 43.75 ? PANEL_BTNS[2] : t < 44.6 ? PANEL_BTNS[8] : PANEL_BTNS[12];
  stick(c, base(t, ev[0] === "RIGHT!" ? "grin" : "scared", { ikR: toU(tgt[0], tgt[1], 540, 2300, 1150), handR: "point", ikL: [-200, 700], handL: "fist", lookY: 0.4 }), 540, 2300, 1150);
  if (ev[0] === "WRONG!") { const [sx] = shakeXY(t, ev[1] as number, 10, 0.3); c.save(); c.globalAlpha = 0.25 * (1 - k * 0.5); c.fillStyle = "#ff2a3a"; c.fillRect(sx, 0, VW, VH); c.restore(); }
  else { c.save(); c.globalCompositeOperation = "lighter"; glow(c, tgt[0], tgt[1], 400, "rgba(120,255,160,1)", k); c.restore(); }
}
/* S13 45.6-49.9: WHOOSH. He lands in his room, breathing hard */
export function S13(c: Ctx, t: number) {
  const app = seg(t, 45.65, 46.1, easeBack), out = seg(t, 46.5, 46.9, easeIO), land = t > 46.9 ? Math.exp(-(t - 46.9) * 7) : 0;
  const [sx, sy] = shakeXY(t, 46.9, 16);
  view(c, workshopBG(), shot(t, [[47.9, { x: 620, y: 1280, z: 1.3, sx, sy }], [49.9, { x: 520, y: FLOOR_Y - HH * 0.6, z: 1.9 }]]), RIM_WS, () => {
    c.save(); c.translate(POD[0], POD[1] - 260); c.scale(app, app); c.translate(-POD[0], -(POD[1] - 260)); drawPod(c, POD[0], POD[1], 1.0, t, { door: seg(t, 46.3, 46.5), spark: 1 - seg(t, 46.1, 46.8), glowK: 0.8 - out * 0.5 }); c.restore();
    desk(c); drawKeyboard(c, KB[0], KB[1], KBS, t, []); drawDisplay(c, DISP[0], DISP[1], 420, "2026", t, {});
    if (t < 46.2) { c.save(); c.globalCompositeOperation = "lighter"; glow(c, POD[0], POD[1] - 260, 800, "rgba(190,240,255,1)", 1 - seg(t, 45.65, 46.3)); c.restore(); bang(c, "WHOOSH!", 540, 700, 120, seg(t, 45.63, 45.85), "#bff6ff"); }
    if (out > 0) { const x = lerp(POD[0] - 60, 520, out), y = lerp(POD[1] - 300, FLOOR_Y, out) - Math.sin(out * Math.PI) * 180;
      const huff = t > 47.6 ? Math.abs(Math.sin(t * 7)) : 0;
      const o = hero(c, base(t, t < 47.6 ? "scared" : "worried", { grounded: out >= 1, air: 0, squash: -0.12 * land - 0.03 * huff, lean: t > 47.6 ? 18 : 0, armL: t > 47.6 ? { a: 15, b: 40 } : { a: 150, b: 10 }, armR: t > 47.6 ? { a: 15, b: 40 } : { a: 150, b: 10 }, handL: "open", handR: "open", legL: { a: 16, b: 0 }, legR: { a: 12, b: 0 } }), x, y, HH);
      if (t > 47.6) { sweatDrops(c, o.head[0], o.head[1], o.headR, t, 1); if (huff > 0.8) puff(c, o.head[0] + o.headR * 1.2, o.head[1] + o.headR * 0.6, (t * 2) % 1, 30, "#e8ecf6"); }
      if (land > 0.1) puff(c, x, FLOOR_Y, 1 - land, 120, "#c8cce0"); }
  });
}
/* S14 49.9-55.1: wipes his forehead, flops into the chair... and types in the year 2026 */
export function S14(c: Ctx, t: number) {
  const wipe = seg(t, 50.05, 50.4) * (1 - seg(t, 50.9, 51.1)), flop = seg(t, 51.25, 51.6, easeIO), bounce = t > 51.6 ? Math.exp(-(t - 51.6) * 7) * Math.sin((t - 51.6) * 20) : 0;
  const keysT = [["2", 52.9], ["0", 53.1], ["2", 53.3], ["6", 53.5]] as [string, number][]; const cur = keysT.filter(([, tt]) => t > tt);
  const cam = shot(t, [[51.2, { x: 420, y: FLOOR_Y - HH * 0.6, z: 1.9 }], [52.5, { x: 400, y: 1300, z: 1.4 }], [55.1, { x: 520, y: 1170, z: 1.6 }]]);
  view(c, workshopBG(), cam, RIM_WS, () => {
    workshop(c, t, { disp: "2026".slice(0, cur.length).padEnd(4, " "), pressed: cur.length && t - cur[cur.length - 1][1] < 0.12 ? [cur[cur.length - 1][0]] : [] });
    stool(c, SEAT_X);
    if (flop <= 0) { const o = hero(c, base(t, wipe > 0 ? "neutral" : "worried", { ikR: wipe > 0 ? [lerp(40, -60, (Math.sin((t - 50.05) * 8) + 1) / 2), 900] : undefined, handR: "open", handsOverHead: wipe > 0, lean: 6 } as Partial<Rig>), 360, FLOOR_Y, HH); sweatDrops(c, o.head[0], o.head[1], o.headR, t, 1 - wipe); }
    else { const key = cur.length ? cur[cur.length - 1][0] : "2", kp = keyW(key), tap = cur.length && t - cur[cur.length - 1][1] < 0.12 ? 0 : 16;
      hero(c, seated(t, t > 52.5 ? "determined" : "smile", { squash: -0.08 * bounce, ikR: t > 52.5 ? toU(kp[0] - 28, kp[1] + 6 - tap, SEAT_X, SEAT_Y, HH) : undefined, armR: t > 52.5 ? undefined : { a: 30, b: 30 } }), lerp(360, SEAT_X, flop), SEAT_Y, HH); }
  });
}
/* S15 55.1-60.0: but his finger slipped -> loops into frame 0 */
export function S15(c: Ctx, t: number) { closeup(c, t - 60, t - 60); }
void bang; void FEET; void PODF;
