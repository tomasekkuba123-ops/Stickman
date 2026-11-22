// MOTION LIBRARY (CMU mocap, retargeted by tools/bvh_retarget.py -> src/motion/motion_lib.json; sources in assets/motion/LICENSES.md)
// Clips: walk run jump fall wave point sit scared celebrate flashlight shrug. Each frame has a side-view and a front-view pose + root motion.
//   <Stickman ... mo={[{ clip: "scared", t0: 1.2 }, { clip: "flashlight", t0: 4, view: "front", loop: true }]} />
import LIB from "../motion/motion_lib.json";
import { Rig, Arm, Leg } from "../style/stickman";
type Pose = { armL: number[]; armR: number[]; legL: number[]; legR: number[]; lean: number; head: number };
type Clip = { src: string; fps: number; loop: boolean; frames: { side: Pose; front: Pose; root: [number, number] }[] };
const L = LIB as unknown as Record<string, Clip>;
export type MotionName = "walk" | "run" | "jump" | "fall" | "wave" | "point" | "sit" | "scared" | "celebrate" | "flashlight" | "shrug";
export type MoSpec = { clip: MotionName; t0: number; view?: "side" | "front"; speed?: number; loop?: boolean; hold?: boolean; /* keep the last frame */ from?: number; to?: number; /* clip seconds */ blend?: number; amp?: number; /* 0..1 exaggeration of the clip vs neutral */ };
export const clipLength = (c: MotionName) => L[c].frames.length / L[c].fps;
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const ss = (x: number) => { const u = Math.min(1, Math.max(0, x)); return u * u * (3 - 2 * u); };

function sample(c: Clip, s: number, view: "side" | "front") {
  const n = c.frames.length, f = s * c.fps, i = Math.min(n - 1, Math.max(0, Math.floor(f))), j = Math.min(n - 1, i + 1), k = f - Math.floor(f);
  const A = c.frames[i], B = c.frames[j], a = A[view], b = B[view], m = (x: number[], y: number[]) => x.map((v, q) => lerp(v, y[q], k));
  return { armL: m(a.armL, b.armL), armR: m(a.armR, b.armR), legL: m(a.legL, b.legL), legR: m(a.legR, b.legR), lean: lerp(a.lean, b.lean, k), head: lerp(a.head, b.head, k), root: m(A.root, B.root) };
}
/* active clip at time t -> rig override (blended with `base`) + root offset in puppet units */
export function mocapAt(specs: MoSpec[], t: number, base: Rig): { over: Partial<Rig>; dx: number; dy: number; w: number } {
  let sp: MoSpec | null = null; for (const s of specs) if (t >= s.t0) sp = s;
  if (!sp) return { over: {}, dx: 0, dy: 0, w: 0 };
  const c = L[sp.clip], view = sp.view ?? "side", sp0 = sp.from ?? 0, len = (sp.to ?? c.frames.length / c.fps) - sp0, u = (t - sp.t0) * (sp.speed ?? 1);
  const loop = sp.loop ?? c.loop, done = !loop && u > len; if (done && !sp.hold) { const out = u - len, bl = sp.blend ?? 0.3; if (out > bl) return { over: {}, dx: 0, dy: 0, w: 0 }; }
  const s = sp0 + (loop ? ((u % len) + len) % len : Math.min(u, len)), P = sample(c, s, view), bl = sp.blend ?? 0.3;
  const w = ss(u / bl) * (done && !sp.hold ? 1 - ss((u - len) / bl) : 1), amp = sp.amp ?? 1;
  const arm = (b: Arm | undefined, m: number[]): Arm => { const B = b ?? { a: 8, b: 6 }; return { a: lerp(B.a, m[0] * amp, w), b: lerp(B.b, m[1] * amp, w) }; };
  const leg = (b: Leg | undefined, m: number[]): Leg => { const B = b ?? { a: 0, b: 0 }; return view === "side" ? { a: lerp(B.a, m[0] * amp, w), b: lerp(B.b, m[1] * amp, w), f: lerp(B.f ?? 0, m[2] * amp, w) } : { a: lerp(B.a, m[0] * amp, w), b: 0, lift: lerp(B.lift ?? 0, Math.max(0, m[1]) * amp, w) }; };
  let rootDx = P.root[0]; if (loop) { const per = c.frames[c.frames.length - 1].root[0] - c.frames[0].root[0], cyc = Math.floor(u / len); rootDx += per * cyc; }
  return { over: { view, armL: arm(base.armL, P.armL), armR: arm(base.armR, P.armR), legL: leg(base.legL, P.legL), legR: leg(base.legR, P.legR), lean: lerp(base.lean ?? 0, P.lean * amp, w), headTilt: lerp(base.headTilt ?? 0, P.head * 0.6 * amp, w), ikL: undefined, ikR: undefined },
    dx: view === "side" ? rootDx * w : 0, dy: Math.max(0, P.root[1]) * w, w };
}
