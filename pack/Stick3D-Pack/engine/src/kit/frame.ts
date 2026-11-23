// FRAMING v17 — consistent character scale in every shot.
//   FULL = full-body size (frac of frame height), CLOSE = the one slightly larger size. The hero is placed at screen (sx, sy)
//   (sy = vertical centre of the body, 0 = top), so the feet stay above the caption safe zone (62-72 % of the height).
import { Key } from "../style/extra";
import { V3 } from "../style/kit";
export const FULL = 0.46, CLOSE = 0.56, HERO_H = 3;
const ASPECT = 1080 / 1920;
export type FrameOpts = { frac?: number; fov?: number; yaw?: number; camY?: number; sx?: number; sy?: number; push?: number; drift?: number; h?: number };
export function framePose(hero: V3, o: FrameOpts = {}, k = 0): Key & { pos: V3; look: V3 } {
  const frac = o.frac ?? FULL, fov = o.fov ?? 40, h = o.h ?? HERO_H, vf = (fov * Math.PI) / 180, hf = 2 * Math.atan(Math.tan(vf / 2) * ASPECT);
  const d0 = h / (frac * 2 * Math.tan(vf / 2)), d = d0 * (1 - (1 - (o.push ?? 0.95)) * k), yaw = (o.yaw ?? 0) + (o.drift ?? 0.05) * k;
  const cy = hero[1] + (o.camY ?? 1.35), C: V3 = [hero[0] + Math.sin(yaw) * d, cy, hero[2] + Math.cos(yaw) * d];
  const mid: V3 = [hero[0], hero[1] + h / 2, hero[2]];
  // direction to the body centre, then rotate so it lands at (sx, sy) on screen
  const dx = mid[0] - C[0], dy = mid[1] - C[1], dz = mid[2] - C[2], hd = Math.hypot(dx, dz);
  const yaw0 = Math.atan2(dx, dz), pit0 = Math.atan2(dy, hd);
  const ay = Math.atan((0.5 - (o.sx ?? 0.5)) * 2 * Math.tan(hf / 2)), ap = Math.atan(((o.sy ?? 0.36) - 0.5) * 2 * Math.tan(vf / 2));
  const Y = yaw0 - ay, P = pit0 + ap; // look further right -> hero appears left
  const look: V3 = [C[0] + Math.sin(Y) * Math.cos(P) * 10, C[1] + Math.sin(P) * 10, C[2] + Math.cos(Y) * Math.cos(P) * 10];
  return { t: 0, pos: C, look, fov };
}
/* a shot from t0 to t1: slow push-in + drift (never static) */
export function frameShot(hero: V3, t0: number, t1: number, o: FrameOpts = {}): Key[] {
  return [{ ...framePose(hero, o, 0), t: t0 }, { ...framePose(hero, o, 1), t: t1 }];
}
/* world point that appears at screen (sx, sy) at distance `dist` from a camera pose -> place the Moon / Sun / Earth exactly in the composition */
export function worldAt(pose: { pos: V3; look: V3; fov?: number }, sx: number, sy: number, dist: number): V3 {
  const vf = ((pose.fov ?? 40) * Math.PI) / 180, th = Math.tan(vf / 2), tw = th * ASPECT;
  const f = norm(sub(pose.look, pose.pos)), r = norm(cross(f, [0, 1, 0])), u = cross(r, f);
  const d = norm([f[0] + r[0] * (sx - 0.5) * 2 * tw + u[0] * (0.5 - sy) * 2 * th, f[1] + r[1] * (sx - 0.5) * 2 * tw + u[1] * (0.5 - sy) * 2 * th, f[2] + r[2] * (sx - 0.5) * 2 * tw + u[2] * (0.5 - sy) * 2 * th]);
  return [pose.pos[0] + d[0] * dist, pose.pos[1] + d[1] * dist, pose.pos[2] + d[2] * dist];
}
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a: V3): V3 => { const n = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / n, a[1] / n, a[2] / n]; };
