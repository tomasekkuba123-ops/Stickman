// GESTURE ENGINE v17 — smooth, speech-driven arm acting for the puppet (reusable in every episode).
//   Arms are 2-bone chains (shoulder a, elbow b, wrist rot); poses are interpolated as joint ANGLES with cubic ease-in/out.
//   Overlapping action: the shoulder follows the eased target, the elbow follows it through a spring (~2-3 frames later),
//   the wrist/hand through a softer spring (~3-4 frames, small overshoot + settle). Hands morph through HandShape space.
//   Moving holds: slow 1-3 px drift + shoulder sway, so open palms never freeze. Fast moves leave a faint motion-blur trail.
//   Usage: <Stickman ... gest={beat(WORDS, [[ "moon", "pointUp" ], ...])} />  or a hand-written list of GKey.
import { Arm, HandShape, HAND, HandPose, mixHand } from "../style/stickman";

export type ArmPose = { a: number; b: number; rot?: number; hand: HandPose | HandShape };
export type Pose2 = { L: ArmPose; R: ArmPose; lean?: number; tilt?: number };
export type GName = "rest" | "palmUp" | "palmUpL" | "palmUp2" | "chop" | "chopL" | "shrug" | "point" | "pointUp" | "pointL" | "open2" | "fist" | "count" | "whoa" | "chin" | "wave" | "hips" | "reach" | "present";
const REST: ArmPose = { a: 8, b: 18, rot: 0, hand: "relaxed" };
export const GEST: Record<GName, Pose2> = { // v17.2: asymmetric (different height / bend per arm), elbows always bent
  rest: { L: REST, R: { a: 9, b: 14, rot: 0, hand: "relaxed" } },
  palmUp: { L: { a: 10, b: 18, rot: 0, hand: "relaxed" }, R: { a: 30, b: 66, rot: -30, hand: "open" }, tilt: 3 },
  palmUpL: { L: { a: 32, b: 60, rot: -30, hand: "open" }, R: { a: 12, b: 22, rot: 0, hand: "relaxed" }, tilt: -3 },
  palmUp2: { L: { a: 24, b: 74, rot: -24, hand: "open" }, R: { a: 38, b: 48, rot: -34, hand: "open" }, tilt: 2 },
  chop: { L: { a: 12, b: 26, rot: 0, hand: "relaxed" }, R: { a: 22, b: 82, rot: 10, hand: { spread: 0, curl: 0.05, idx: 0, up: 0, grip: 0 } }, lean: 3 },
  chopL: { L: { a: 22, b: 82, rot: 10, hand: { spread: 0, curl: 0.05, idx: 0, up: 0, grip: 0 } }, R: { a: 12, b: 26, rot: 0, hand: "relaxed" }, lean: 3 },
  shrug: { L: { a: 40, b: 42, rot: -40, hand: "open" }, R: { a: 52, b: 28, rot: -44, hand: "open" }, tilt: 7 },
  point: { L: { a: 14, b: 30, rot: 0, hand: "relaxed" }, R: { a: 74, b: 18, rot: 0, hand: "point" } },
  pointL: { L: { a: 74, b: 18, rot: 0, hand: "point" }, R: { a: 14, b: 30, rot: 0, hand: "relaxed" } },
  pointUp: { L: { a: 12, b: 34, rot: 0, hand: "relaxed" }, R: { a: 124, b: 16, rot: 0, hand: "point" }, tilt: -4 },
  open2: { L: { a: 46, b: 50, rot: -10, hand: "open" }, R: { a: 62, b: 30, rot: -14, hand: "open" } },
  fist: { L: { a: 12, b: 24, rot: 0, hand: "relaxed" }, R: { a: 26, b: 100, rot: 0, hand: "fist" }, lean: 2 },
  count: { L: { a: 20, b: 84, rot: 0, hand: "open" }, R: { a: 26, b: 98, rot: 0, hand: "point" } },
  whoa: { L: { a: 30, b: 122, rot: 0, hand: "open" }, R: { a: 42, b: 98, rot: 0, hand: "open" }, lean: -4 },
  chin: { L: { a: 14, b: 70, rot: 0, hand: "relaxed" }, R: { a: -8, b: 150, rot: 0, hand: "point" }, tilt: 6 },
  wave: { L: { a: 12, b: 24, rot: 0, hand: "relaxed" }, R: { a: 140, b: -20, rot: 0, hand: "open" } },
  hips: { L: { a: 38, b: -70, rot: 0, hand: "fist" }, R: { a: 38, b: -70, rot: 0, hand: "fist" } },
  reach: { L: { a: 14, b: 30, rot: 0, hand: "relaxed" }, R: { a: 96, b: 20, rot: 0, hand: "open" } },
  present: { L: { a: 48, b: 46, rot: -20, hand: "open" }, R: { a: 12, b: 26, rot: 0, hand: "relaxed" } },
};
/* AIMED point: screen direction in degrees (0 = right, 90 = up, 180 = left). Uses the arm on the target's side, elbow slightly bent,
   the other arm relaxed at a different height. */
export function aim(dirDeg: number, hand: HandPose = "point"): Pose2 {
  const d = ((dirDeg % 360) + 360) % 360, right = d <= 90 || d >= 270;
  const up = right ? (d >= 270 ? d - 360 : d) : 180 - d; // elevation above horizontal on that side
  const P: ArmPose = { a: Math.max(20, Math.min(165, 90 + up)), b: 12, rot: 0, hand }, O: ArmPose = { a: 13, b: 34, rot: 0, hand: "relaxed" };
  return right ? { L: O, R: P, tilt: -up * 0.05 } : { L: P, R: O, tilt: up * 0.05 };
}
/* one gesture beat: hits its pose at `t` (stressed word onset), in = attack time, hold = hold, then eases back to rest (or straight into the next beat) */
export type GKey = { t: number; g: GName | Pose2; in?: number; hold?: number; out?: number; amp?: number };

const eio = (x: number) => { const u = Math.min(1, Math.max(0, x)); return u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2; };
const hs = (h: HandPose | HandShape): HandShape => (typeof h === "string" ? HAND[h] : h);
const mixArm = (p: ArmPose, q: ArmPose, k: number): ArmPose => ({ a: p.a + (q.a - p.a) * k, b: p.b + (q.b - p.b) * k, rot: (p.rot ?? 0) + ((q.rot ?? 0) - (p.rot ?? 0)) * k, hand: mixHand(hs(p.hand), hs(q.hand), k) });
const mixPose = (p: Pose2, q: Pose2, k: number): Pose2 => ({ L: mixArm(p.L, q.L, k), R: mixArm(p.R, q.R, k), lean: (p.lean ?? 0) + ((q.lean ?? 0) - (p.lean ?? 0)) * k, tilt: (p.tilt ?? 0) + ((q.tilt ?? 0) - (p.tilt ?? 0)) * k });
const scalePose = (P: Pose2, amp: number): Pose2 => amp === 1 ? P : mixPose(GEST.rest, P, amp);

/* keyframes: rest ... [attack -> pose] hold [release -> rest] ... ; consecutive beats chain directly */
const KF = new WeakMap<GKey[], Map<Pose2, [number, Pose2][]>>();
function keyframes(keys: GKey[], rest: Pose2): [number, Pose2][] {
  let m = KF.get(keys); if (!m) { m = new Map(); KF.set(keys, m); } const hit = m.get(rest); if (hit) return hit; const r = buildKF(keys, rest); m.set(rest, r); return r;
}
function buildKF(keys: GKey[], rest: Pose2): [number, Pose2][] {
  const K: [number, Pose2][] = [[-1e9, rest]]; const ks = [...keys].sort((a, b) => a.t - b.t);
  ks.forEach((k, i) => { const P = scalePose(typeof k.g === "string" ? GEST[k.g] : k.g, k.amp ?? 1), tin = k.in ?? 0.32, hold = k.hold ?? 0.35, out = k.out ?? 0.38, nx = ks[i + 1]?.t ?? 1e9;
    const a0 = Math.max(K[K.length - 1][0] + 0.02, k.t - tin); K.push([a0, K[K.length - 1][1]]); K.push([k.t, P]);
    const e = Math.min(k.t + hold, nx - (ks[i + 1]?.in ?? 0.32) - 0.02); if (e > k.t) K.push([e, P]);
    if (nx - e > out + 0.1) K.push([e + out, rest]); });
  return K;
}
export function targetAt(keys: GKey[], t: number, rest: Pose2 = GEST.rest): Pose2 {
  const K = keyframes(keys, rest); let i = 0; while (i < K.length - 1 && t >= K[i + 1][0]) i++;
  if (i >= K.length - 1) return K[K.length - 1][1];
  const [ta, A] = K[i], [tb, B] = K[i + 1]; if (ta < -1e8) return A; return mixPose(A, B, eio((t - ta) / (tb - ta)));
}
/* damped spring follow of a scalar signal (deterministic: simulated over the last `win` s at 120 Hz) */
function spring(sig: (t: number) => number, t: number, k: number, d: number, win = 0.7) {
  const dt = 1 / 120; let x = sig(t - win), v = 0; for (let s = t - win + dt; s <= t + 1e-6; s += dt) { const a = k * (sig(s) - x) - d * v; v += a * dt; x += v * dt; } return x;
}
const noise = (t: number, s: number) => Math.sin(t * 0.83 + s) * 0.6 + Math.sin(t * 1.91 + s * 2.3) * 0.3 + Math.sin(t * 3.7 + s * 4.1) * 0.1;

export type ArmsOut = { armL: Arm; armR: Arm; handL: HandShape; handR: HandShape; handRotL: number; handRotR: number; ghostL: Arm[]; ghostR: Arm[]; lean: number; headTilt: number; drag: [number, number] };
/* Final arm state at time t: shoulder = eased target; elbow = spring (lags 2-3 f); wrist + hand = softer spring (3-4 f, overshoot); moving hold; motion trail. */
export function armsAt(keys: GKey[], t: number, o: { rest?: Pose2; hold?: number; seed?: number } = {}): ArmsOut {
  const rest = o.rest ?? GEST.rest, hk = o.hold ?? 1, sd = o.seed ?? 0;
  const T = (s: number) => targetAt(keys, s, rest);
  const ch = (side: "L" | "R", s: number) => { const P = T(s)[side]; return P; };
  const arm = (side: "L" | "R", tt: number) => {
    const a = ch(side, tt).a + hk * 3.4 * noise(tt, sd + (side === "L" ? 1 : 5)); // shoulder leads (+ moving hold sway)
    const b = spring((s) => ch(side, s).b, tt, 420, 30) + hk * 4.5 * noise(tt * 0.8, sd + (side === "L" ? 9 : 13)); // elbow follows ~2-3 frames later
    return { a, b };
  };
  // wrist: the hand's angle follows the forearm through a soft spring (lag 3-4 frames, slight overshoot, settle). Canvas sign: R arm +rig = -canvas.
  const wrist = (side: "L" | "R") => { const fa = (s: number) => ch(side, s).a + ch(side, s).b + (ch(side, s).rot ?? 0), w = spring(fa, t, 230, 13), A = arm(side, t);
    const rel = w - (A.a + A.b) + hk * 4 * noise(t * 1.1, sd + (side === "L" ? 17 : 21)); return side === "R" ? -rel : rel; };
  const hand = (side: "L" | "R") => { const lag = 0.11, A = hs(ch(side, t - lag).hand), B = hs(ch(side, t - lag * 0.5).hand); return mixHand(A, B, 0.5); }; // hands morph a few frames behind the arm
  const L = arm("L", t), R = arm("R", t);
  const speed = (side: "L" | "R") => { const p = arm(side, t - 1 / 30); const q = side === "L" ? L : R; return Math.hypot(q.a - p.a, q.a + q.b - p.a - p.b); };
  const trail = (side: "L" | "R") => speed(side) > 9 ? [arm(side, t - 1 / 60), arm(side, t - 1 / 30)] : [];
  const P = T(t), Pd = T(t - 0.12);
  const vx = ((R.a + R.b) - (arm("R", t - 0.1).a + arm("R", t - 0.1).b)) * 0.5;
  return { armL: L, armR: R, handL: hand("L"), handR: hand("R"), handRotL: wrist("L"), handRotR: wrist("R"), ghostL: trail("L"), ghostR: trail("R"),
    lean: (P.lean ?? 0) * 0.7 + (Pd.lean ?? 0) * 0.3, headTilt: (P.tilt ?? 0), drag: [Math.max(-40, Math.min(40, -vx)), 0] };
}

/* SPEECH BEATS: pick gestures for stressed words from Whisper word timings. words = [{word,start,end}], beats = [wordIndexOrText, gesture, opts?].
   The same gesture is never used twice in a row (falls back to an alternative). */
export type WWord = { word: string; start: number; end: number };
const ALT: Partial<Record<GName, GName>> = { palmUp: "palmUpL", palmUpL: "palmUp", chop: "chopL", chopL: "chop", point: "pointL", pointL: "point", shrug: "palmUp2", palmUp2: "open2", open2: "palmUp2" };
export function beat(words: WWord[], list: [string | number, GName, Partial<GKey>?][], from = 0): GKey[] {
  const out: GKey[] = []; let last: GName | null = null; let cursor = 0;
  for (const [w, g0, opt] of list) {
    let idx = typeof w === "number" ? w : -1;
    if (typeof w === "string") for (let i = cursor; i < words.length; i++) if (words[i].start >= from && words[i].word.toLowerCase().replace(/[^a-z']/g, "") === w.toLowerCase()) { idx = i; break; }
    if (idx < 0) continue; cursor = idx + 1;
    const g: GName = g0 === last ? (ALT[g0] ?? g0) : g0; last = g;
    out.push({ t: words[idx].start + 0.04, g, ...(opt ?? {}) });
  }
  return out;
}
