// CHARACTER MODULE — rig v2 Stickman + baby dragon as 3D components with an ACTION LIBRARY.
// Every action has anticipation, squash & stretch and overlapping motion (hair, hood strings, backpack lag via rig.drag).
// Usage:  <Stickman p={[0,0,0]} t={t} action="jump" t0={2.0} face="laugh" />   (t = absolute seconds, t0 = action start)
//         <Dragon p={[2,1,0]} t={t} action="fly" t0={0} />
// Contact shadow is automatic (shrinks while airborne); rim light colour comes from the active <World> sky preset.
import React, { createContext, useContext } from "react";
import { Billboard, Shadow } from "../style/toon";
import { drawStickman, Rig, POSES, Face, RigOut, WALK_STRIDE, RUN_STRIDE, Outfit } from "../style/stickman";
import { drawDragon, DragonPose } from "../style/dragon";
import { drawPencil } from "../style/props2d";
import { V3 } from "../style/kit";
import { QC, maskify } from "./qc";

/* ---------------- scene light context (set by <World preset>) ---------------- */
export type Look = { rim: string; shade: string; rimK: number };
export const LookContext = createContext<Look>({ rim: "255,220,170", shade: "20,10,40", rimK: 0.45 });
export const useLook = () => useContext(LookContext);

/* ---------------- helpers ---------------- */
const cl = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const sg = (u: number, a: number, b: number) => cl((u - a) / (b - a));
const eo = (x: number) => 1 - (1 - x) ** 3, ei = (x: number) => x * x * x, eio = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);
const back = (x: number) => { const c = 2.2; return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2; };
const wob = (u: number, f = 14, d = 6) => Math.sin(u * f) * Math.exp(-u * d); // damped wobble (squash recovery)
const S = Math.sin;

export type ActionName =
  | "idle" | "walk" | "run" | "tiptoe" | "jump" | "land" | "fallOnBottom" | "float" | "swimInAir" | "climb" | "push" | "pull"
  | "point" | "drawInAir" | "write" | "pickUp" | "hold" | "hug" | "wave" | "thumbsUp" | "celebrate" | "panic" | "freezeShock"
  | "scaredShake" | "think" | "facepalm" | "laugh" | "sneezeReact";
export const ACTIONS: ActionName[] = ["idle", "walk", "run", "tiptoe", "jump", "land", "fallOnBottom", "float", "swimInAir", "climb", "push", "pull", "point", "drawInAir", "write", "pickUp", "hold", "hug", "wave", "thumbsUp", "celebrate", "panic", "freezeShock", "scaredShake", "think", "facepalm", "laugh", "sneezeReact"];
// SFX that belongs to each action (tools/auto_sfx.py reads the same table from rules/SFX_MAP.json)
export const ACTION_SFX: Partial<Record<ActionName, { at: number; sfx: string }[]>> = {
  jump: [{ at: 0.22, sfx: "swing" }, { at: 0.78, sfx: "thud2" }], land: [{ at: 0, sfx: "thud2" }], fallOnBottom: [{ at: 0.35, sfx: "thud" }],
  run: [{ at: 0, sfx: "whoosh" }], climb: [{ at: 0, sfx: "rub" }], push: [{ at: 0.2, sfx: "rub" }], pull: [{ at: 0.2, sfx: "rub" }],
  drawInAir: [{ at: 0, sfx: "magic_pencil" }], write: [{ at: 0, sfx: "draw" }], pickUp: [{ at: 0.5, sfx: "pop" }], hug: [{ at: 0.3, sfx: "heart" }],
  wave: [{ at: 0.1, sfx: "swing" }], thumbsUp: [{ at: 0.2, sfx: "ding" }], celebrate: [{ at: 0.1, sfx: "success" }], panic: [{ at: 0, sfx: "yip" }],
  freezeShock: [{ at: 0, sfx: "impact" }], scaredShake: [{ at: 0, sfx: "buzz" }], think: [{ at: 0.2, sfx: "tick" }], facepalm: [{ at: 0.3, sfx: "slam" }],
  laugh: [{ at: 0, sfx: "pop" }], sneezeReact: [{ at: 0.55, sfx: "whoosh" }], float: [{ at: 0, sfx: "hum" }], swimInAir: [{ at: 0, sfx: "blub" }],
};

export type ActOpts = { dur?: number; dir?: 1 | -1; speed?: number };
/* An action returns the rig (pose + face) plus world motion in rig units: dx (along dir), lift (up). */
export type ActOut = { rig: Partial<Rig>; dx?: number; lift?: number };
const stand = (): Partial<Rig> => ({ armL: { a: 7, b: 6 }, armR: { a: 7, b: 6 }, legL: { a: 3, b: 0 }, legR: { a: 3, b: 0 }, handL: "relaxed", handR: "relaxed", view: "front" });

export function act(name: ActionName, u: number, o: ActOpts = {}): ActOut {
  const T = u * 30, flip = (o.dir ?? 1) < 0, sp = o.speed ?? 1;
  switch (name) {
    case "idle": return { rig: { ...stand(), face: "smile", headTilt: S(u * 0.9) * 3, squash: S(u * 2.2) * 0.008 } };
    case "walk": { const ph = u * 1.4 * sp; return { rig: { ...POSES.walk(ph), flip, face: "smile" }, dx: ph * WALK_STRIDE }; }
    case "run": { const st = sg(u, 0, 0.18), ph = Math.max(0, u - 0.18) * 2.6 * sp; // anticipation crouch before the dash
      if (u < 0.18) return { rig: { ...POSES.run(0), view: "side", flip, squash: -0.1 * S(st * Math.PI), lean: -6 + 20 * st, face: "determined" } };
      return { rig: { ...POSES.run(ph), flip }, dx: ph * RUN_STRIDE }; }
    case "tiptoe": { const ph = u * 1.0 * sp, w = POSES.walk(ph); return { rig: { ...w, flip, lean: -3, y: -26 + S(ph * Math.PI * 4) * 6, armL: { a: 55, b: 70 }, armR: { a: 40, b: 80 }, handL: "relaxed", handR: "relaxed", face: "smirk", lookX: flip ? -0.4 : 0.4,
      legL: { ...(w.legL as object), f: -26 } as Rig["legL"], legR: { ...(w.legR as object), f: -26 } as Rig["legR"] }, dx: ph * WALK_STRIDE * 0.45 }; }
    case "jump": { const d = o.dur ?? 1.1, k = u / d; // 0-.22 crouch, .22-.78 air (stretch->tuck), .78-1 land squash
      if (k < 0.22) { const a = eio(k / 0.22); return { rig: { ...stand(), squash: -0.16 * a, y: 60 * a, armL: { a: -25 * a, b: 20 }, armR: { a: -25 * a, b: 20 }, legL: { a: 10, b: 40 * a }, legR: { a: 10, b: 40 * a }, face: "determined", lookY: -0.4 } }; }
      if (k < 0.78) { const a = (k - 0.22) / 0.56, h = S(a * Math.PI); return { rig: { ...stand(), squash: 0.14 * (1 - a * 2) * (a < 0.5 ? 1 : 0.4), armL: { a: 160, b: -10 }, armR: { a: 160, b: -10 }, handL: "open", handR: "open", legL: { a: 14, b: 30 * h, lift: 60 * h }, legR: { a: 14, b: 30 * h, lift: 60 * h }, face: "laugh", grounded: false }, lift: 420 * h }; }
      const a = (k - 0.78) / 0.22; return { rig: { ...stand(), squash: -0.18 * (1 - eo(a)) + 0.04 * wob(a * 0.5, 20, 4), y: 50 * (1 - eo(a)), armL: { a: 40 * (1 - a), b: 30 }, armR: { a: 40 * (1 - a), b: 30 }, face: "laugh" } }; }
    case "land": return { rig: { ...stand(), squash: -0.2 * Math.exp(-u * 7) + 0.05 * wob(u, 18, 5), y: 60 * Math.exp(-u * 7), armL: { a: 50 * Math.exp(-u * 4), b: 30 }, armR: { a: 50 * Math.exp(-u * 4), b: 30 }, face: u < 0.3 ? "surprised" : "smile" } };
    case "fallOnBottom": { const a = sg(u, 0, 0.18), f = sg(u, 0.18, 0.38), r = sg(u, 0.38, 1.2);
      return { rig: { ...stand(), lean: -10 * a - 18 * f, y: 300 * ei(f), squash: -0.25 * f * (1 - r) + 0.05 * wob(Math.max(0, u - 0.38), 16, 5), armL: { a: 100 * a, b: 20 }, armR: { a: 110 * a, b: 20 }, handL: "open", handR: "open",
        legL: { a: 40 * f, b: 0, lift: 260 * f }, legR: { a: 30 * f, b: 0, lift: 220 * f }, face: u < 0.38 ? "surprised" : r < 0.6 ? "worried" : "laugh", headTilt: 10 * f } }; }
    case "float": return { rig: { ...stand(), zeroG: 1, armL: { a: 70 + S(u * 1.4) * 14, b: 20 }, armR: { a: 70 - S(u * 1.4 + 1) * 14, b: 20 }, handL: "open", handR: "open", legL: { a: 10 + S(u * 1.1) * 8, b: 30, lift: 40 }, legR: { a: 10 - S(u * 1.1) * 8, b: 40, lift: 60 }, face: "smile", headTilt: S(u * 0.7) * 8, grounded: false }, lift: 300 + S(u * 1.3) * 60 };
    case "swimInAir": { const c = u * 1.3 * sp, s = S(c * Math.PI * 2); return { rig: { ...stand(), zeroG: 0.6, lean: 30, armL: { a: 120 + s * 50, b: 30 - s * 30 }, armR: { a: 120 + s * 50, b: 30 - s * 30 }, handL: "open", handR: "open", legL: { a: 20 - s * 14, b: 40 + s * 30, lift: 120 }, legR: { a: 20 + s * 14, b: 40 - s * 30, lift: 120 }, face: "laugh", grounded: false }, lift: 260 + S(c * Math.PI * 2) * 30, dx: c * 160 }; }
    case "climb": { const c = u * 1.6 * sp, s = S(c * Math.PI * 2); return { rig: { ...stand(), armL: { a: 165 + s * 18, b: -8 }, armR: { a: 165 - s * 18, b: -8 }, handL: "hold", handR: "hold", legL: { a: 8, b: 0, lift: 70 + 60 * Math.max(0, s) }, legR: { a: 8, b: 0, lift: 70 + 60 * Math.max(0, -s) }, face: "determined", grounded: false }, lift: c * 180 }; }
    case "push": { const a = sg(u, 0, 0.3), ph = Math.max(0, u - 0.3) * 0.9; const w = POSES.walk(ph); return { rig: { ...w, view: "side", flip, lean: -6 + 32 * eo(a), armL: { a: 82, b: 8 }, armR: { a: 78, b: 12 }, handL: "open", handR: "open", face: "determined", squash: -0.03 }, dx: ph * WALK_STRIDE * 0.35 }; }
    case "pull": { const a = sg(u, 0, 0.3), ph = Math.max(0, u - 0.3) * 0.8; const w = POSES.walk(-ph); return { rig: { ...w, view: "side", flip, lean: 6 - 26 * eo(a), armL: { a: 70, b: 4 }, armR: { a: 74, b: 6 }, handL: "fist", handR: "fist", face: "determined" }, dx: -ph * WALK_STRIDE * 0.3 }; }
    case "point": { const a = sg(u, 0, 0.12), b = sg(u, 0.12, 0.3); return { rig: { ...stand(), armR: { a: 20 * a + 75 * back(b), b: 40 * (1 - b) }, handR: b > 0.2 ? "point" : "relaxed", lean: -3 * a + 4 * b, face: "surprised", lookX: 0.7, squash: 0.03 * wob(Math.max(0, u - 0.3), 18, 6) } }; }
    case "drawInAir": { const a = sg(u, 0, 0.25); return { rig: { ...stand(), ikR: [220 + S(u * 7) * 90 * a, 760 + S(u * 5.3 + 1) * 80 * a], ikKR: 1, handR: "hold", armL: { a: 18, b: 26 }, lean: 4, face: "determined", lookX: 0.6, lookY: -0.2 } }; }
    case "write": return { rig: { ...stand(), ikR: [150 + S(u * 11) * 26, 470 + S(u * 23) * 10], ikKR: 1, handR: "hold", ikL: [-120, 450], ikKL: 1, handL: "open", lean: 12, face: "think", lookY: 0.8 } };
    case "pickUp": { const d = sg(u, 0, 0.45), up = sg(u, 0.55, 0.95); const k = eio(d) * (1 - eio(up)); return { rig: { ...stand(), lean: 34 * k, squash: -0.12 * k + 0.04 * wob(Math.max(0, u - 0.95), 16, 6), y: 120 * k, ikR: [200, 900 - 760 * k], ikKR: 1, handR: k > 0.8 || up > 0 ? "hold" : "open", face: up > 0.5 ? "grin" : "think", lookY: 0.9 * k } }; }
    case "hold": return { rig: { ...stand(), ikR: [150, 560 + S(u * 2) * 8], ikKR: 1, ikL: [-150, 560 + S(u * 2) * 8], ikKL: 1, handR: "hold", handL: "hold", face: "smile", lookY: 0.4 } };
    case "hug": { const a = eo(sg(u, 0, 0.4)); return { rig: { ...stand(), ikR: [lerpN(260, 50, a), 560], ikKR: 1, ikL: [lerpN(-260, -50, a), 560], ikKL: 1, handR: "open", handL: "open", face: "laugh", headTilt: 8 * a, squash: 0.03 * wob(Math.max(0, u - 0.4), 14, 4) } }; }
    case "wave": { const a = sg(u, 0, 0.15); return { rig: { ...stand(), armR: { a: 40 * a + 110 * eo(sg(u, 0.1, 0.3)), b: 30 * S(u * 12) - 20 }, handR: "open", face: "laugh", headTilt: -6 * a, lean: -2 } }; }
    case "thumbsUp": { const a = back(sg(u, 0, 0.3)); return { rig: { ...stand(), ikR: [lerpN(100, 240, a), lerpN(560, 760, a)], ikKR: 1, handR: "thumb", face: "grin", headTilt: 6, squash: -0.05 * (1 - sg(u, 0, 0.12)) + 0.04 * wob(Math.max(0, u - 0.3), 16, 5) } }; }
    case "celebrate": { const c = (u * 1.8) % 1, h = S(c * Math.PI); return { rig: { ...stand(), armL: { a: 165, b: -10 }, armR: { a: 165, b: -10 }, handL: "fist", handR: "fist", squash: c < 0.15 ? -0.1 : 0.08 * h, legL: { a: 14, b: 20 * h, lift: 40 * h }, legR: { a: 14, b: 20 * h, lift: 40 * h }, face: "laugh", grounded: false }, lift: 160 * h }; }
    case "panic": { const s = S(u * 22); return { rig: { ...stand(), armL: { a: 140 + s * 30, b: 20 }, armR: { a: 140 - s * 30, b: 20 }, handL: "open", handR: "open", legL: { a: 10, b: 30, lift: 70 * Math.max(0, s) }, legR: { a: 10, b: 30, lift: 70 * Math.max(0, -s) }, face: "scared", lookX: S(u * 7), headTilt: s * 6, x: S(u * 9) * 30 }, dx: S(u * 3) * 120 }; }
    case "freezeShock": { const a = sg(u, 0, 0.08); return { rig: { ...stand(), squash: 0.16 * a * Math.exp(-u * 3) - 0.02, armL: { a: 70 * a, b: 0 }, armR: { a: 70 * a, b: 0 }, handL: "open", handR: "open", legL: { a: 12 * a, b: 0 }, legR: { a: 12 * a, b: 0 }, face: "surprised", x: S(u * 60) * 4 * a, lookY: -0.1 }, lift: 60 * a * Math.exp(-u * 6) }; }
    case "scaredShake": return { rig: { ...stand(), ikR: [60, 830], ikKR: 1, ikL: [-60, 830], ikKL: 1, handR: "open", handL: "open", handsOverHead: false, legL: { a: -6, b: 24 }, legR: { a: -6, b: 24 }, squash: -0.06, y: 40, face: "scared", x: S(u * 55) * 7, lookX: S(u * 3) * 0.6 } };
    case "think": { const a = eo(sg(u, 0, 0.35)); return { rig: { ...stand(), ikR: [lerpN(140, 50, a), lerpN(540, 760, a)], ikKR: 1, handR: "point", handsOverHead: a > 0.6, ikL: [-60, 600], ikKL: 1, handL: "relaxed", face: "think", headTilt: 8 * a, lookX: 0.5, lookY: -0.5 } }; }
    case "facepalm": { const a = sg(u, 0, 0.3), hit = sg(u, 0.3, 0.4); return { rig: { ...stand(), ikR: [lerpN(200, 30, eio(a)), lerpN(600, 880, eio(a))], ikKR: 1, handR: "open", handsOverHead: a > 0.7, headTilt: -10 * hit, lean: 8 * hit, squash: -0.05 * hit * Math.exp(-Math.max(0, u - 0.4) * 4), face: "worried" } }; }
    case "laugh": return { rig: { ...stand(), ikR: [110, 520], ikKR: 1, ikL: [-110, 520], ikKL: 1, handR: "open", handL: "open", face: "laugh", squash: 0.035 * S(u * 16), headTilt: -8 + S(u * 8) * 4, lean: -5 + S(u * 8) * 3 } };
    case "sneezeReact": { const brace = sg(u, 0, 0.5), blast = sg(u, 0.55, 0.7), rec = sg(u, 0.9, 1.6);
      return { rig: { ...stand(), lean: -4 * brace - 22 * blast * (1 - rec), squash: -0.08 * brace * (1 - blast) + 0.1 * blast * (1 - rec), armL: { a: 30 + 60 * blast * (1 - rec), b: 30 }, armR: { a: 30 + 70 * blast * (1 - rec), b: 30 }, handL: "open", handR: "open", face: u < 0.55 ? "worried" : rec < 0.5 ? "surprised" : "laugh", zeroG: 0.6 * blast * (1 - rec) }, dx: -120 * eo(blast) * (1 - rec * 0.3) }; }
  }
  void T; return { rig: stand() };
}
function lerpN(a: number, b: number, k: number) { return a + (b - a) * k; }

/* blink every ~3 s (two-frame blink), deterministic */
export const autoBlink = (t: number, seed = 0) => { const p = (t + seed * 0.7) % 3.3; return p > 1.6 && p < 1.69 ? 1 : 0; }; // never on frame 0 (hook frames)

/* Full rig for an action at absolute time t, with overlapping motion (drag) from the action's own velocity. */
export function rigAt(name: ActionName, t: number, t0 = 0, o: ActOpts & { face?: Face; over?: Partial<Rig> } = {}) {
  const u = Math.max(0, t - t0), a = act(name, u, o), b = act(name, Math.max(0, u - 0.08), o);
  const vx = ((a.dx ?? 0) - (b.dx ?? 0)) / 0.08, vy = ((a.lift ?? 0) - (b.lift ?? 0) - ((a.rig.y ?? 0) - (b.rig.y ?? 0))) / 0.08;
  const drag: [number, number] = [cl(-vx * 0.06 * (o.dir ?? 1), -60, 60), cl(vy * 0.05, -60, 60)];
  const rig = { t: t * 30, view: "front", blink: autoBlink(t), ...a.rig, drag, ...(o.face ? { face: o.face } : {}), ...(o.over ?? {}) } as Rig;
  return { rig, dx: a.dx ?? 0, lift: a.lift ?? 0 };
}

/* ---------------- hero painter: rig + rim light + ground shade, HEAD KEPT WHITE (grading never tints his face) ---------------- */
let clean: HTMLCanvasElement | null = null;
export function paintHero(c: CanvasRenderingContext2D, W: number, H: number, rig: Rig, rim: string, shade: string, rimK: number) {
  const out = drawStickman(c, W, H, rig);
  if (!clean || clean.width !== W || clean.height !== H) { clean = document.createElement("canvas"); clean.width = W; clean.height = H; }
  const cc = clean.getContext("2d")!; cc.clearRect(0, 0, W, H); cc.drawImage(c.canvas, 0, 0);
  c.save(); c.globalCompositeOperation = "source-atop";
  const g = c.createLinearGradient(W * 0.6, 0, W * 0.95, 0); g.addColorStop(0, `rgba(${rim},0)`); g.addColorStop(1, `rgba(${rim},${rimK})`); c.fillStyle = g; c.fillRect(0, 0, W, H);
  const g2 = c.createLinearGradient(0, H * 0.7, 0, H); g2.addColorStop(0, `rgba(${shade},0)`); g2.addColorStop(1, `rgba(${shade},0.2)`); c.fillStyle = g2; c.fillRect(0, 0, W, H); c.restore();
  // restore the head (face, eyes, hair) from the untinted copy
  c.save(); c.beginPath(); c.arc(out.head[0], out.head[1], out.headR * 1.03, 0, Math.PI * 2); c.clip(); c.clearRect(0, 0, W, H); c.drawImage(clean, 0, 0); c.restore();
  return out;
}

/* ---------------- Stickman component ---------------- */
export type Prop2D = "pencil" | "chalk" | "pencilUp" | null;
export const Stickman: React.FC<{ p: V3; t: number; h?: number; action?: ActionName; t0?: number; face?: Face; dir?: 1 | -1; move?: boolean; rig?: Partial<Rig>; speed?: number; dur?: number;
  prop?: Prop2D; extra?: (c: CanvasRenderingContext2D, out: RigOut, W: number, H: number) => void; shadow?: boolean; groundY?: number; rim?: string; hero?: boolean; outfit?: Outfit; blinkSeed?: number }> =
  ({ p, t, h = 3, action = "idle", t0 = 0, face, dir = 1, move = true, rig, speed, dur, prop = null, extra, shadow = true, groundY, rim, hero = true, outfit, blinkSeed = 0 }) => {
  const look = useLook(); const r = rigAt(action, t, t0, { dir, face, over: { ...(outfit ? { outfit, backpack: false } : {}), ...(blinkSeed ? { blink: autoBlink(t, blinkSeed) } : {}), ...(rig ?? {}) }, speed, dur });
  const k = h / 1000, x = p[0] + (move ? r.dx * k * dir : 0), y = p[1] + r.lift * k, gy = groundY ?? p[1];
  const rimC = rim ?? look.rim;
  return (<>
    {shadow ? <Shadow p={[x, gy, p[2]]} r={h * 0.3 / (1 + r.lift * k * 0.5)} o={0.5 / (1 + r.lift * k * 0.6)} /> : null}
    <Billboard p={[x, y, p[2]]} h={h} res={640} aspect={1.5} draw={(c, W, H) => {
      const out = paintHero(c, W, H, r.rig, rimC, look.shade, look.rimK);
      if (prop === "pencil" || prop === "chalk" || prop === "pencilUp") { const L = H * 0.13, a = prop === "pencilUp" ? Math.PI + 0.3 : 0.5, bx = Math.sin(a), by = -Math.cos(a); drawPencil(c, out.gloveR[0] - bx * L * 0.42, out.gloveR[1] - by * L * 0.42, L, a, prop === "chalk" ? 0.6 : 0); }
      if (extra) extra(c, out, W, H);
      if (QC && hero) maskify(c, out.head, out.headR, W, H);
    }} />
  </>);
};

/* ---------------- baby dragon ---------------- */
export type DragonAction = "idle" | "fly" | "happy" | "sneeze" | "scared" | "sleepy" | "wow";
export function dragonAt(name: DragonAction, t: number, t0 = 0): { pose: DragonPose; lift: number } {
  const u = Math.max(0, t - t0), T = t * 30;
  switch (name) {
    case "fly": return { pose: { t: T, mood: "happy", fly: 1, flap: 1, flapHz: 3.2, tilt: S(u * 2) * 0.06 }, lift: 0.9 + S(u * 3.2 * Math.PI * 2 / 2) * 0.12 };
    case "happy": { const c = (u * 1.6) % 1; return { pose: { t: T, mood: "happy", flap: 0.6, arms: "up", squash: c < 0.15 ? -0.1 : 0.06 * S(c * Math.PI) }, lift: 0.35 * S(c * Math.PI) }; }
    case "sneeze": { const b = sg(u, 0, 0.5), s = sg(u, 0.5, 0.62); return { pose: { t: T, mood: u < 0.5 ? "wow" : u < 1.2 ? "sneeze" : "happy", headRecoil: -0.8 * b * (1 - s) + 1 * s * Math.exp(-(u - 0.62) * 3), squash: -0.1 * b * (1 - s) + 0.12 * s * Math.exp(-(u - 0.62) * 4) }, lift: 0 }; }
    case "scared": return { pose: { t: T, mood: "scared", arms: "up", curl: 0.4, squash: -0.05 + S(u * 50) * 0.01 }, lift: 0 };
    case "sleepy": return { pose: { t: T, mood: "sleepy", curl: 0.8, legsTucked: true, squash: S(u * 1.6) * 0.02 }, lift: 0 };
    case "wow": return { pose: { t: T, mood: "wow", arms: "reach", flap: 0.3 }, lift: 0 };
    default: return { pose: { t: T, mood: "calm", flap: 0.15, blink: autoBlink(t, 3) === 1, squash: S(u * 2) * 0.015 }, lift: 0 };
  }
}
// GROWN dragon = the same EP02 design scaled up (h up to ~14 world units). pose overrides any DragonPose field (mouthOpen, tear, mood, fly...).
export const Dragon: React.FC<{ p: V3; t: number; action?: DragonAction; t0?: number; h?: number; flip?: boolean; shadow?: boolean; groundY?: number; pose?: Partial<DragonPose>; res?: number }> = ({ p, t, action = "idle", t0 = 0, h = 1.6, flip = false, shadow = true, groundY, pose, res }) => {
  const look = useLook(); const d0 = dragonAt(action, t, t0); const d = { ...d0, pose: { ...d0.pose, ...(pose ?? {}) } }; const y = p[1] + d.lift * h;
  return (<>
    {shadow ? <Shadow p={[p[0], groundY ?? p[1], p[2]]} r={h * 0.35 / (1 + d.lift)} o={0.45 / (1 + d.lift)} /> : null}
    <Billboard p={[p[0], y, p[2]]} h={h} res={res ?? (h > 4 ? 1024 : 512)} aspect={1} draw={(c, W, H) => { drawDragon(c, W, H, { ...d.pose, flip });
      c.save(); c.globalCompositeOperation = "source-atop"; const g = c.createLinearGradient(W * 0.55, 0, W, 0); g.addColorStop(0, `rgba(${look.rim},0)`); g.addColorStop(1, `rgba(${look.rim},${look.rimK * 0.8})`); c.fillStyle = g; c.fillRect(0, 0, W, H); c.restore(); }} />
  </>);
};

/* points on the dragon drawing (normalised 0..1 of its square canvas, unflipped) and their WORLD position for a camera at `cam`
   (billboards face the camera, so the point depends on where the camera is). Use for gulps (mouth), fire (mouth), riding (snout). */
export const DRAGON_PTS = { mouth: [0.739, 0.544] as [number, number], snout: [0.70, 0.40] as [number, number], noseTip: [0.76, 0.45] as [number, number], eye: [0.577, 0.40] as [number, number], belly: [0.5, 0.72] as [number, number], head: [0.6, 0.34] as [number, number] };
export function dragonPoint(p: V3, h: number, n: [number, number], cam: V3, flip = false, lift = 0): V3 {
  const yaw = Math.atan2(cam[0] - p[0], cam[2] - p[2]), nx = flip ? 1 - n[0] : n[0], lx = (nx - 0.5) * h;
  return [p[0] + Math.cos(yaw) * lx, p[1] + lift * h + h * 0.483 + (0.5 - n[1]) * h, p[2] - Math.sin(yaw) * lx];
}

/* TOWNSPEOPLE (v15): same rig + style as Stickman, different hoodie colours and hats; NOT part of the QC hero mask. */
export const TOWNSFOLK: Record<string, Outfit> = {
  neighbor: { hoodie: "#2fa04a", hat: "cap", hatColor: "#ffd23a" }, mailman: { hoodie: "#3a6fd8", hat: "mail", hatColor: "#1d2f66" },
  chef: { hoodie: "#f4f4f8", hat: "chef" }, kid1: { hoodie: "#ff9a3a", hat: "beanie", hatColor: "#7a54d6" }, kid2: { hoodie: "#ff6aa8", hat: "bow", hatColor: "#ffd23a" },
  granny: { hoodie: "#7a54d6", hat: "beanie", hatColor: "#ff8fb0" }, worker: { hoodie: "#f0b429", hat: "cap", hatColor: "#e5483f" }, teen: { hoodie: "#2fd4c8", hat: "none" },
};
export const Townsperson: React.FC<{ who: keyof typeof TOWNSFOLK | Outfit; p: V3; t: number; h?: number; action?: ActionName; t0?: number; face?: Face; dir?: 1 | -1; move?: boolean; rig?: Partial<Rig>; extra?: (c: CanvasRenderingContext2D, out: RigOut, W: number, H: number) => void; seed?: number }> =
  ({ who, p, t, h = 2.8, action = "idle", t0 = 0, face, dir = 1, move = true, rig, extra, seed = 1 }) => (
  <Stickman p={p} t={t} h={h} action={action} t0={t0} face={face} dir={dir} move={move} rig={rig} extra={extra} hero={false} outfit={typeof who === "string" ? TOWNSFOLK[who] : who} blinkSeed={seed} />
);
