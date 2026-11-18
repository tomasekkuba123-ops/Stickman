// EP04 2D engine: painted backgrounds + clean plates + floating cut-out sprites (drift, rotate, wobble).
import { staticFile } from "remotion";
import MAN from "../../../public/ep04/sprites/manifest.json";
export const VW = 1080, VH = 1920, FPS = 30;
export type V2 = [number, number];
type Spr = { file: string; x: number; y: number; w: number; h: number; kind: string; bg: string };
const SPR = MAN as unknown as Record<string, Spr>;
const BGS: Record<string, string> = { bg1: "ep04/BG_01_STREET.png", bg2: "ep04/BG_02_STREET_ZERO_GRAVITY.png", bg3: "ep04/BG_03_HIGH_SKY.png", bg4: "ep04/BG_04_AFTER_ROOF.png", bg2p: "ep04/sprites/bg2_plate.png", bg3p: "ep04/sprites/bg3_plate.png", bg4p: "ep04/sprites/bg4_plate.png" };
export const IMG: Record<string, HTMLImageElement> = {};
let promise: Promise<void> | null = null;
export function loadAll(): Promise<void> {
  if (promise) return promise;
  const all: [string, string][] = [...Object.entries(BGS), ...Object.entries(SPR).map(([k, v]) => [k, "ep04/sprites/" + v.file] as [string, string])];
  promise = Promise.all(all.map(([k, f]) => new Promise<void>((res) => { const im = new Image(); im.onload = () => { IMG[k] = im; res(); }; im.onerror = () => res(); im.src = staticFile(f); }))).then(() => undefined);
  return promise;
}
export const ready = () => Object.keys(BGS).every((k) => IMG[k]);
// world scale per background family (cover 1080x1920)
export const K: Record<string, number> = { bg1: 1920 / 1672, bg2: 1920 / 1672, bg4: 1920 / 1672, bg3: 1080 / 916 };
export const WD: Record<string, [number, number]> = { bg1: [941 * K.bg1, 1920], bg2: [941 * K.bg2, 1920], bg4: [941 * K.bg4, 1920], bg3: [1080, 1717 * K.bg3] };
export const P = (bg: string, x: number, y: number): V2 => [x * K[bg], y * K[bg]];

export type Cam = { x: number; y: number; z: number; r?: number; sx?: number; sy?: number };
export function clampC(bg: string, cam: Cam): Cam { const [w, h] = WD[bg], hw = VW / 2 / cam.z, hh = VH / 2 / cam.z; return { ...cam, x: Math.min(w - hw, Math.max(hw, cam.x)), y: Math.min(h - hh, Math.max(hh, cam.y)) }; }
export function applyC(c: CanvasRenderingContext2D, cam: Cam) { c.translate(VW / 2 + (cam.sx ?? 0), VH / 2 + (cam.sy ?? 0)); c.rotate(cam.r ?? 0); c.scale(cam.z, cam.z); c.translate(-cam.x, -cam.y); }
export function drawImg(c: CanvasRenderingContext2D, key: string, bg: string, alpha = 1) { const im = IMG[key]; if (!im) return; c.globalAlpha = alpha; c.drawImage(im, 0, 0, im.width * K[bg], im.height * K[bg]); c.globalAlpha = 1; }
const hash = (s: string) => { let h = 7; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) % 10007; return h / 10007; };

// one floating sprite: its painted position + drift / spin / wobble; o.dy (world px) offsets it (rising/falling), o.spin adds rotation speed
export type SprFx = { dx?: number; dy?: number; rot?: number; spin?: number; scale?: number; alpha?: number; amp?: number; still?: boolean };
export function sprite(c: CanvasRenderingContext2D, name: string, t: number, o: SprFx = {}) {
  const s = SPR[name], im = IMG[name]; if (!s || !im) return null; const k = K[s.bg], ph = hash(name) * 20;
  const amp = (o.amp ?? 1) * (o.still ? 0 : 1);
  const cx = (s.x + s.w / 2) * k + Math.sin(t * 0.55 + ph) * 12 * amp + (o.dx ?? 0), cy = (s.y + s.h / 2) * k + Math.cos(t * 0.47 + ph * 1.3) * 16 * amp + (o.dy ?? 0);
  const rot = Math.sin(t * 0.38 + ph) * 0.05 * amp + (o.rot ?? 0) + (o.spin ?? 0) * t;
  const blob = s.kind === "blob", wob = blob ? 0.035 * Math.sin(t * 2.1 + ph) * amp : 0;
  c.save(); c.translate(cx, cy); c.rotate(rot); c.scale((o.scale ?? 1) * (1 + wob), (o.scale ?? 1) * (1 - wob)); c.globalAlpha = o.alpha ?? 1;
  c.drawImage(im, -s.w * k / 2, -s.h * k / 2, s.w * k, s.h * k); c.restore();
  return { cx, cy, w: s.w * k, h: s.h * k };
}
export const spritesOf = (bg: string) => Object.keys(SPR).filter((k) => SPR[k].bg === bg);
export const sprInfo = (name: string) => SPR[name];
// whole floating world: plate + every sprite of that background
export function floatWorld(c: CanvasRenderingContext2D, bg: "bg2" | "bg3", t: number, fx: (name: string) => SprFx = () => ({}), skip: string[] = []) {
  drawImg(c, bg + "p", bg);
  for (const n of spritesOf(bg)) if (!skip.includes(n)) sprite(c, n, t, fx(n));
}
export const shake = (t: number, amp: number, freq = 37): V2 => [Math.sin(t * freq) * amp, Math.cos(t * freq * 1.13) * amp];
