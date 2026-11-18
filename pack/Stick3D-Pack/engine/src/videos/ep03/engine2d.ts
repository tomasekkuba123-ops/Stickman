// EP03 2D engine helpers: image cache, painted-background camera, Stickman/dragon stamping, captions data.
import { staticFile } from "remotion";
import { drawStickman, Rig } from "../../style/stickman";

export const VW = 1080, VH = 1920, FPS = 30;
export type V2 = [number, number];

/* ---------- images ---------- */
const files = { room: "ep03/BG_01_ROOM.png", sky: "ep03/BG_02_SKY_TO_SPACE.png", moon: "ep03/BG_03_MOON_GAS_STATION.png", moonClean: "ep03/BG_03_CLEAN.png", belly: "ep03/BG_04_WHALE_BELLY.png" };
export type ImgKey = keyof typeof files;
export const IMG: Partial<Record<ImgKey, HTMLImageElement>> = {};
let promise: Promise<void> | null = null;
export function loadImages(): Promise<void> {
  if (promise) return promise;
  promise = Promise.all((Object.keys(files) as ImgKey[]).map((k) => new Promise<void>((res) => { const im = new Image(); im.onload = () => { IMG[k] = im; res(); }; im.onerror = () => res(); im.src = staticFile(files[k]); }))).then(() => undefined);
  return promise;
}
export const imagesReady = () => (Object.keys(files) as ImgKey[]).every((k) => IMG[k]);
// world size of each background (scaled so it covers 1080 px width or 1920 px height)
export const WORLD: Record<ImgKey, { k: number; w: number; h: number }> = {
  room: { k: 1080 / 941, w: 1080, h: 1672 * 1080 / 941 },
  sky: { k: 1080 / 724, w: 1080, h: 2172 * 1080 / 724 },
  moon: { k: 1920 / 941, w: 1672 * 1920 / 941, h: 1920 },
  moonClean: { k: 1920 / 941, w: 1672 * 1920 / 941, h: 1920 },
  belly: { k: 1080 / 941, w: 1080, h: 1672 * 1080 / 941 },
};
export const B = (key: ImgKey, x: number, y: number): V2 => [x * WORLD[key].k, y * WORLD[key].k]; // BG pixel -> world

/* ---------- camera: centre (x,y) in world px, zoom z, roll r ---------- */
export type Cam = { x: number; y: number; z: number; r?: number; sx?: number; sy?: number };
export function applyCam(c: CanvasRenderingContext2D, cam: Cam, parallax = 1) {
  c.translate(VW / 2 + (cam.sx ?? 0), VH / 2 + (cam.sy ?? 0)); c.rotate(cam.r ?? 0); const z = 1 + (cam.z - 1) * parallax; c.scale(z, z); c.translate(-cam.x * parallax - (1 - parallax) * VW / 2, -cam.y * parallax - (1 - parallax) * VH / 2);
}
// clamp camera so the painted background always covers the frame
export function clampCam(key: ImgKey, cam: Cam): Cam {
  const w = WORLD[key], hw = VW / 2 / cam.z, hh = VH / 2 / cam.z;
  return { ...cam, x: Math.min(w.w - hw, Math.max(hw, cam.x)), y: Math.min(w.h - hh, Math.max(hh, cam.y)) };
}
export function drawBG(c: CanvasRenderingContext2D, key: ImgKey, alpha = 1) {
  const im = IMG[key]; if (!im) return; const w = WORLD[key]; c.globalAlpha = alpha; c.drawImage(im, 0, 0, w.w, w.h); c.globalAlpha = 1;
}
// Catmull-Rom camera keys
export type CK = [number, number, number, number]; // t, x, y, z
export function camKeys(t: number, keys: CK[]): Cam {
  if (t <= keys[0][0]) return { x: keys[0][1], y: keys[0][2], z: keys[0][3] };
  const n = keys.length; if (t >= keys[n - 1][0]) return { x: keys[n - 1][1], y: keys[n - 1][2], z: keys[n - 1][3] };
  let i = 0; while (i < n - 2 && t > keys[i + 1][0]) i++;
  let u = (t - keys[i][0]) / (keys[i + 1][0] - keys[i][0]); u = u * u * (3 - 2 * u);
  const a = keys[Math.max(0, i - 1)], b = keys[i], c2 = keys[i + 1], d = keys[Math.min(n - 1, i + 2)];
  const cr = (j: number) => 0.5 * (2 * b[j] + (-a[j] + c2[j]) * u + (2 * a[j] - 5 * b[j] + 4 * c2[j] - d[j]) * u * u + (-a[j] + 3 * b[j] - 3 * c2[j] + d[j]) * u * u * u);
  return { x: cr(1), y: cr(2), z: cr(3) };
}
export const shake = (t: number, amp: number, freq = 37): V2 => [Math.sin(t * freq) * amp, Math.cos(t * freq * 1.13) * amp];
export const impact = (t: number, t0: number, amp: number) => (t >= t0 && t < t0 + 0.5 ? amp * Math.exp(-(t - t0) * 9) : 0);

/* ---------- Stickman stamping ---------- */
const CW = 640, CH = 960, S_IN = (CH * 0.955) / 1040; // rig canvas; 1000 units = 1000*S_IN px
let cv: HTMLCanvasElement | null = null;
let RIM: string | null = null, SHADOW = false;
export const setLook = (rim: string | null, shadow: boolean) => { RIM = rim; SHADOW = shadow; };
// GRAPHITE copy: grey pencil version (washed fills, grey outlines, hatching, double sketch line). alpha fades it; melt 0..1 drips it down; reveal(c,W,H) optional mask painter
export type Graphite = { alpha?: number; melt?: number; t?: number; reveal?: (c: CanvasRenderingContext2D, W: number, H: number) => void } | null;
let GR: Graphite = null; let gc: HTMLCanvasElement | null = null;
export const setGraphite = (g: Graphite) => { GR = g; };
function graphitize(src: HTMLCanvasElement): HTMLCanvasElement {
  if (!gc) { gc = document.createElement("canvas"); gc.width = CW; gc.height = CH; } const g = gc.getContext("2d")!; g.save(); g.clearRect(0, 0, CW, CH);
  g.filter = "grayscale(1) contrast(1.9) brightness(0.9)"; g.drawImage(src, 0, 0); g.filter = "none";
  g.globalCompositeOperation = "source-atop"; g.fillStyle = "rgba(246,245,240,0.18)"; g.fillRect(0, 0, CW, CH);
  g.strokeStyle = "rgba(70,70,80,0.28)"; g.lineWidth = 2; for (let x = -CH; x < CW; x += 9) { g.beginPath(); g.moveTo(x, CH); g.lineTo(x + CH, 0); g.stroke(); }
  g.globalCompositeOperation = "destination-over"; g.globalAlpha = 0.45; g.filter = "grayscale(1) brightness(0.9)"; g.drawImage(src, 2.5, -2); g.drawImage(src, -2, 1.5); g.filter = "none"; g.globalAlpha = 1;
  if (GR && GR.reveal) { g.globalCompositeOperation = "destination-in"; GR.reveal(g, CW, CH); }
  g.restore(); return gc;
}
export type StickOut = { gloveR: V2; gloveL: V2; head: V2; headR: number };
// draws Stickman with his 1000-unit body height = h world px, feet at (x,y). anchor: move so the glove midpoint lands on that point.
export function stick(c: CanvasRenderingContext2D, rig: Rig, x: number, y: number, h: number, anchor?: { p: V2; which?: "both" | "R" | "L" }, rot = 0): StickOut {
  if (!cv) { cv = document.createElement("canvas"); cv.width = CW; cv.height = CH; }
  const cx2 = cv.getContext("2d")!; const out = drawStickman(cx2, CW, CH, rig);
  if (RIM && !GR) { cx2.save(); cx2.globalCompositeOperation = "source-atop"; const g = cx2.createLinearGradient(CW * 0.62, 0, CW * 0.95, 0); g.addColorStop(0, `rgba(${RIM},0)`); g.addColorStop(1, `rgba(${RIM},0.42)`); cx2.fillStyle = g; cx2.fillRect(0, 0, CW, CH);
    const g2 = cx2.createLinearGradient(0, CH * 0.75, 0, CH); g2.addColorStop(0, "rgba(20,10,40,0)"); g2.addColorStop(1, "rgba(20,10,40,0.18)"); cx2.fillStyle = g2; cx2.fillRect(0, 0, CW, CH); cx2.restore(); }
  const k = h / (1000 * S_IN), fy = CH * 0.985;
  let ox = x, oy = y;
  const toW = (p: [number, number], bx: number, by: number): V2 => [bx + (p[0] - CW / 2) * k, by + (p[1] - fy) * k];
  if (anchor) { const g = anchor.which === "R" ? out.gloveR : anchor.which === "L" ? out.gloveL : [(out.gloveR[0] + out.gloveL[0]) / 2, (out.gloveR[1] + out.gloveL[1]) / 2] as [number, number]; const w = toW(g, 0, 0); ox = anchor.p[0] - w[0]; oy = anchor.p[1] - w[1]; }
  if (SHADOW && rig.grounded !== false && !anchor && !rot) { c.save(); const sg = c.createRadialGradient(ox, oy, 2, ox, oy, h * 0.24); sg.addColorStop(0, "rgba(20,10,30,0.42)"); sg.addColorStop(1, "rgba(20,10,30,0)"); c.fillStyle = sg; c.translate(ox, oy); c.scale(1, 0.22); c.translate(-ox, -oy); c.beginPath(); c.arc(ox, oy, h * 0.24, 0, Math.PI * 2); c.fill(); c.restore(); }
  const img = GR ? graphitize(cv) : cv;
  c.save(); if (GR) c.globalAlpha = GR.alpha ?? 1;
  if (GR && (GR.melt ?? 0) > 0) { const m = GR.melt!, sl = 8; for (let sx = 0; sx < CW; sx += sl) { const dy = m * CH * (0.18 + 0.22 * Math.abs(Math.sin(sx * 0.031 + 1.3)) + 0.1 * Math.sin(sx * 0.11)); c.drawImage(img, sx, 0, sl, CH, ox + (sx - CW / 2) * k, oy - fy * k + dy * k * (1 - 0.3 * m), sl * k, CH * k * (1 - 0.55 * m)); } }
  else if (rot) { const cx = ox, cy = oy - h * 0.5; c.translate(cx, cy); c.rotate(rot); c.drawImage(img, -(CW / 2) * k, -fy * k + h * 0.5, CW * k, CH * k); }
  else c.drawImage(img, ox - (CW / 2) * k, oy - fy * k, CW * k, CH * k);
  c.restore();
  return { gloveR: toW(out.gloveR, ox, oy), gloveL: toW(out.gloveL, ox, oy), head: toW(out.head, ox, oy), headR: out.headR * k };
}
