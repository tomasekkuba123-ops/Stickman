// v18 HD animals as upright billboards: <Animal kind="wolf" p h t pose /> (canvas res sized for 2x screen size), "?" pops, fish school, coral spawn.
import React from "react";
import { Billboard } from "../style/toon";
import { V3 } from "../style/kit";
import { SGlow } from "../style/sky";
import { drawWolf2, drawOwl2, drawCrab2, drawFish, drawCoral, drawQ, drawDuck, drawLadybug, drawSnail, AnimalPose } from "../style/critters2";
import { QC } from "./qc";

export type AnimalKind = "wolf" | "owl" | "crab" | "fish" | "coral" | "duck" | "ladybug" | "snail";
const ASP: Record<AnimalKind, number> = { wolf: 760 / 800, owl: 760 / 600, crab: 440 / 640, fish: 0.5, coral: 520 / 640, duck: 560 / 600, ladybug: 480 / 640, snail: 440 / 640 };
const FN = { wolf: drawWolf2, owl: drawOwl2, crab: drawCrab2, fish: drawFish, coral: drawCoral, duck: drawDuck, ladybug: drawLadybug, snail: drawSnail } as const;
export const Animal: React.FC<{ kind: AnimalKind; p: V3; h: number; t: number; res?: number; pose?: Partial<AnimalPose> & { hue?: number; glow?: number } }> = ({ kind, p, h, t, res, pose = {} }) => {
  const blink = (Math.floor(t * 30) + kind.length * 13) % 89 < 4;
  const r = QC ? 256 : res ?? (kind === "fish" ? 384 : kind === "crab" || kind === "duck" || kind === "ladybug" || kind === "snail" ? 1280 : 2048);
  return <Billboard p={p} h={h} res={r} aspect={ASP[kind]} draw={(c, W, H) => (FN[kind] as (c: CanvasRenderingContext2D, W: number, H: number, p: AnimalPose) => void)(c, W, H, { t, blink, ...pose })} />;
};
/* "?" pop above a head: appears at t0 with overshoot, bobs, fades at t1 */
export const QPop: React.FC<{ p: V3; t: number; t0: number; t1?: number; h?: number }> = ({ p, t, t0, t1 = 99, h = 0.9 }) => {
  if (QC || t < t0 || t > t1 + 0.2) return null; const u = (t - t0) / 0.28, pop = u >= 1 ? 1 : Math.max(0, Math.sin(u * Math.PI * 0.5) * (1 + 0.25 * Math.sin(u * Math.PI))), out = t > t1 ? Math.max(0, 1 - (t - t1) / 0.2) : 1;
  return <Billboard p={p} h={h} res={512} aspect={1.3} draw={(c, W, H) => drawQ(c, W, H, pop * out, t)} />;
};
/* fish school circling a centre (confused = erratic, direction flips) */
export const FishSchool: React.FC<{ c: V3; t: number; n?: number; r?: number; h?: number; confused?: number }> = ({ c, t, n = 12, r = 1.1, h = 0.32, confused = 0 }) => (
  <>{Array.from({ length: n }, (_, i) => { const sp = 0.9 + (i % 3) * 0.15, dir = confused > 0.5 && Math.sin(t * 1.7 + i) > 0.3 ? -1 : 1, a = t * sp * dir + (i / n) * Math.PI * 2 + Math.sin(t * 3 + i) * 0.25 * confused;
    const rr = r * (0.7 + 0.3 * Math.sin(i * 2.1)), x = c[0] + Math.cos(a) * rr, z = c[2] + Math.sin(a) * rr * 0.55, y = c[1] + Math.sin(t * 2 + i) * 0.08 + (i % 3) * 0.06;
    const goingRight = -Math.sin(a) * dir > 0; return <Animal key={i} kind="fish" p={[x, y, z]} h={h * (0.85 + (i % 4) * 0.08)} t={t + i * 0.37} pose={{ flip: !goingRight, hue: i % 3 }} />; })}</>
);
/* coral spawn: glowing eggs rising from the polyps */
export const Spawn: React.FC<{ c: V3; t: number; n?: number; w?: number; k?: number }> = ({ c, t, n = 40, w = 1.6, k = 1 }) => (
  <>{k > 0.01 ? Array.from({ length: n }, (_, i) => { const u = ((t * 0.35 + i / n * 3.7) % 1), x = c[0] + (Math.sin(i * 12.9) * 0.5) * w + Math.sin(t + i) * 0.08, y = c[1] + u * 1.8, z = c[2] + Math.sin(i * 7.3) * 0.3;
    return <SGlow key={i} p={[x, y, z]} r={0.035 + 0.02 * Math.sin(i)} color={i % 3 ? "#ffd0ee" : "#fff6c0"} o={k * 0.9 * Math.sin(u * Math.PI)} />; }) : null}</>
);
