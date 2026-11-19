// CAMERA SYSTEM — shot presets + auto-framing + automatic coverage.
// A shot = Catmull-Rom key list (style/extra Cam). Auto-framing computes the distance so the subject (Stickman, h world units tall)
// fills `frac` of the frame height (default 40-60 %), always fully in frame, always slightly moving.
//   <ShotCam t={t} shots={[ shotPreset("medium", 2.0, 4.5, { subject: P }), shotPreset("lowAngle", 4.5, 7, { subject: P }) ]} />
//   <ShotCam t={t} shots={autoCoverage(2.0, 12.0, { subject: (t) => heroPos(t) })} />   // new angle every ~2.5 s
import React from "react";
import { Cam, Key } from "../style/extra";
import { V3 } from "../style/kit";

export type ShotKind = "wide" | "medium" | "closeUp" | "lowAngle" | "overShoulder" | "tracking" | "orbit" | "crane" | "pushIn" | "twoShot";
export type Subject = V3 | ((t: number) => V3);
export type ShotOpts = { subject: Subject; h?: number; /* twoShot: */ other?: Subject; otherH?: number; side?: number; /* yaw around the subject, rad (0 = camera in front, +z) */ target?: V3; frac?: number; fov?: number; roll?: number; dist?: number };
export type Shot = { t0: number; t1: number; kind: ShotKind; keys: Key[]; band: "low" | "high" };

const at = (s: Subject, t: number): V3 => (typeof s === "function" ? s(t) : s);
const rad = (d: number) => (d * Math.PI) / 180;
// distance for subject height h to fill `frac` of a vertical FOV
export const frameDist = (h: number, frac: number, fov: number) => h / (2 * Math.tan(rad(fov) / 2) * frac);
const around = (c: V3, yaw: number, d: number, y: number): V3 => [c[0] + Math.sin(yaw) * d, y, c[2] + Math.cos(yaw) * d];

export const FRAC: Record<ShotKind, number> = { wide: 0.4, medium: 0.52, closeUp: 0.9, lowAngle: 0.5, overShoulder: 0.55, tracking: 0.48, orbit: 0.5, crane: 0.45, pushIn: 0.5, twoShot: 0.4 };
export const CAPTION_BAND: Record<ShotKind, "low" | "high"> = { wide: "low", medium: "low", closeUp: "low", lowAngle: "high", overShoulder: "low", tracking: "low", orbit: "low", crane: "low", pushIn: "low", twoShot: "high" };

export function shotPreset(kind: ShotKind, t0: number, t1: number, o: ShotOpts): Shot {
  const h = o.h ?? 3, fov = o.fov ?? (kind === "wide" ? 56 : kind === "closeUp" ? 38 : kind === "lowAngle" ? 58 : 48), frac = o.frac ?? FRAC[kind], yaw = o.side ?? 0.35;
  const d = o.dist ?? frameDist(kind === "closeUp" ? h * 0.55 : h, kind === "closeUp" ? 0.8 : frac, fov), n = 4;
  const keys: Key[] = [];
  for (let i = 0; i <= n; i++) {
    const t = t0 + ((t1 - t0) * i) / n, u = i / n, s = at(o.subject, t); const cy = s[1] + h * 0.5, head = s[1] + h * 0.78;
    let pos: V3, look: V3, f = fov;
    switch (kind) {
      case "wide": pos = around(s, yaw + 0.05 * u, d * (1.02 - 0.04 * u), s[1] + h * 0.9 + 0.6 * u); look = [s[0], cy + 0.2, s[2]]; break;
      case "medium": pos = around(s, yaw - 0.06 * u, d * (1 - 0.05 * u), cy + 0.25); look = [s[0], cy + 0.1, s[2]]; break;
      case "closeUp": pos = around(s, yaw + 0.04 * u, d * (1 - 0.06 * u), head); look = [s[0], head - 0.05, s[2]]; break;
      case "lowAngle": pos = around(s, yaw + 0.08 * u, d, s[1] + 0.45); look = [s[0], cy + 0.6, s[2]]; f = fov; break;
      case "overShoulder": { const tg = o.target ?? [s[0], cy, s[2] - 10]; const ang = Math.atan2(s[0] - tg[0], s[2] - tg[2]); pos = around(s, ang + 0.35 - 0.03 * u, h * 0.9, head + 0.1); look = [tg[0], tg[1], tg[2]]; break; }
      case "tracking": pos = around(s, Math.PI / 2 * Math.sign(yaw || 1), d, cy + 0.2); look = [s[0], cy, s[2]]; break;
      case "orbit": pos = around(s, yaw + 0.7 * u - 0.35, d, cy + 0.4); look = [s[0], cy, s[2]]; break;
      case "crane": pos = around(s, yaw, d * (1 + 0.15 * u), s[1] + 0.8 + 4.5 * u); look = [s[0], cy - 0.2 * u, s[2]]; break;
      case "twoShot": { // KEY MOMENT framing: Stickman AND the other object (landing rocket, creature...) both clearly readable
        const ob = at(o.other ?? o.subject, t), oh = o.otherH ?? h, mx = (s[0] + ob[0]) / 2, mz = (s[2] + ob[2]) / 2;
        const top = Math.max(s[1] + h, ob[1] + oh), bot = Math.min(s[1], ob[1]), sep = Math.hypot(ob[0] - s[0], ob[2] - s[2]);
        const vfov = rad(fov), hfov = 2 * Math.atan(Math.tan(vfov / 2) * 9 / 16);
        const dd = Math.max((top - bot) / (2 * Math.tan(vfov / 2) * 0.8), (sep + 1.5) / (2 * Math.tan(hfov / 2) * 0.85), h / (2 * Math.tan(vfov / 2) * 0.42) * 0.6);
        const ang = Math.atan2(ob[0] - s[0], ob[2] - s[2]) + Math.PI / 2 + (yaw - 0.35) ; const cy = (top + bot) / 2;
        pos = [mx + Math.sin(ang) * dd * (1.04 - 0.06 * u), cy + 0.3, mz + Math.cos(ang) * dd * (1.04 - 0.06 * u)]; look = [mx, cy, mz]; break; }
      case "pushIn": pos = around(s, yaw, d * (1.18 - 0.3 * u), cy + 0.3); look = [s[0], cy + 0.15 * u, s[2]]; f = fov - 4 * u; break;
    }
    keys.push({ t, pos, look, fov: f, roll: o.roll ?? (kind === "lowAngle" ? 0.03 * (1 - 2 * u) : 0) });
  }
  return { t0, t1, kind, keys, band: CAPTION_BAND[kind] };
}

/* automatic coverage: a new shot every `every` seconds (2-3 s), varied angles, deterministic by seed */
const ORDER: ShotKind[] = ["medium", "closeUp", "lowAngle", "orbit", "pushIn", "wide", "tracking", "medium", "crane", "closeUp"];
export function autoCoverage(t0: number, t1: number, o: ShotOpts & { every?: number; seed?: number; kinds?: ShotKind[] }): Shot[] {
  const every = o.every ?? 2.5, n = Math.max(1, Math.round((t1 - t0) / every)), seq = o.kinds ?? ORDER, out: Shot[] = [];
  for (let i = 0; i < n; i++) { const a = t0 + ((t1 - t0) * i) / n, b = t0 + ((t1 - t0) * (i + 1)) / n, k = seq[(i + (o.seed ?? 0)) % seq.length];
    out.push(shotPreset(k, a, b, { ...o, side: (o.side ?? 0.35) * (i % 2 ? -1 : 1) + (i % 3) * 0.15 })); }
  return out;
}
export const activeShot = (t: number, shots: Shot[]) => { let s = shots[0]; for (const x of shots) if (t >= x.t0) s = x; return s; };
export const ShotCam: React.FC<{ t: number; shots: Shot[]; impacts?: [number, number][]; quake?: number; fovKick?: number[] }> = ({ t, shots, impacts, quake, fovKick }) => (
  <Cam t={t} keys={activeShot(t, shots).keys} impacts={impacts} quake={quake} fovKick={fovKick} />
);
// export the cut list + caption bands (handy for logging / docs)
export const cutList = (shots: Shot[]) => shots.map((s) => ({ t0: s.t0, t1: s.t1, kind: s.kind, band: s.band }));

/* key story moment (landing, arrival, reveal): a twoShot that keeps both readable — Stickman >= ~25 % tall and the object fully in frame */
export const keyMoment = (t0: number, t1: number, hero: Subject, other: Subject, otherH: number, side = 0.35) => shotPreset("twoShot", t0, t1, { subject: hero, other, otherH, side });
