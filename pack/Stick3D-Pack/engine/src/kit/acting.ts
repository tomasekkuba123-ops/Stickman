// v18 BODY ACTING layer (beyond the arms): head turns toward a target BEFORE the hand points, weight shifts, knee dips,
// startled step back, stumble, shiver. Keys are eased (smoothstep) poses; every field not given in a key = neutral.
//   const A = act(t, [{ t: 0.5, turn: 0.6, tilt: -6 }, { t: 1.2, back: 0.4, dip: 1, lean: -8 }, ...]);
//   <Stickman p={stepBack(P, pose, A.back)} rig={{ ...A.rig, ...eyes }} />
import { V3 } from "../style/kit";
import { Rig } from "../style/stickman";

export type AKey = { t: number; d?: number; /* transition time into this key (s) */
  turn?: number; /* head turn -1..1 (+ = toward screen right) */ tilt?: number; /* head tilt deg */ lean?: number; /* body lean deg (+ fwd/right) */
  dx?: number; /* hip shift (rig units, ~1000 = body height) */ dip?: number; /* knee bend 0..1 */ back?: number; /* world units away from camera */
  lift?: number; /* foot lift (step): + right foot, - left foot, 0..1 */ shiver?: number; /* 0..1 */ };
const F = ["turn", "tilt", "lean", "dx", "dip", "back", "lift", "shiver"] as const;
const sm = (x: number) => { const u = Math.max(0, Math.min(1, x)); return u * u * (3 - 2 * u); };
/* overshoot ease for snappy moves (startle) */
const os = (x: number) => { const u = Math.max(0, Math.min(1, x)); return 1 - Math.pow(1 - u, 3) * Math.cos(u * 2.2); };

export function act(t: number, keys: AKey[], o: { sway?: number; seed?: number } = {}) {
  const v: Record<string, number> = {};
  for (const f of F) {
    let val = 0;
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i], d = k.d ?? 0.3, a = k.t - d, target = k[f] ?? 0;
      if (t <= a) break;
      const prev = val, e = (k.d ?? 0.3) <= 0.16 ? os((t - a) / d) : sm((t - a) / d);
      val = prev + (target - prev) * e;
    }
    v[f] = val;
  }
  const sd = o.seed ?? 0, sw = o.sway ?? 1;
  // continuous weight shift (never a frozen statue) + knee dip as a lowered, squashed body
  const shift = sw * (Math.sin(t * 0.47 + sd) * 7 + Math.sin(t * 1.13 + sd * 2) * 2.5);
  const shv = v.shiver > 0 ? v.shiver * (Math.sin(t * 61) * 5 + Math.sin(t * 47 + 1) * 3) : 0;
  const lift = v.lift;
  const rig: Partial<Rig> = {
    headTurn: v.turn, headTilt: v.tilt + sw * Math.sin(t * 0.8 + sd) * 1.5, lean: v.lean + sw * Math.sin(t * 0.47 + sd + 0.6) * 1.2,
    x: v.dx + shift + shv, y: v.dip * 34 + Math.abs(shv) * 0.4, squash: -0.04 * v.dip,
    ...(Math.abs(lift) > 0.02 ? { [lift > 0 ? "legR" : "legL"]: { a: lift > 0 ? 6 : -6, b: 28 * Math.abs(lift), lift: 70 * Math.abs(lift) } } : {}),
  };
  return { rig, back: v.back, v };
}
/* hero world position moved `back` units away from the camera (startled step back / stumble) */
export function stepBack(p: V3, pose: { pos: V3; look: V3 }, back: number): V3 {
  if (!back) return p; const fx = pose.look[0] - pose.pos[0], fz = pose.look[2] - pose.pos[2], n = Math.hypot(fx, fz) || 1;
  return [p[0] + (fx / n) * back, p[1], p[2] + (fz / n) * back];
}
