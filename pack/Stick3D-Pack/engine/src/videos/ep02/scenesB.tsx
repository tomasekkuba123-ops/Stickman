// EP02 scenes 5-12 (sky kingdom): reveal, no way back, a cry, trapped dragon, bridge run, shield, ladder+scissors, snip & catch.
import React from "react";
import { Cam, Key, camAt, FaceGroup, hand } from "../../style/extra";
import { ChalkDraw, SHIELD_PATH, LADDER_PATH, SCISSORS_PATH, pathTip, SGlow, Sparkles, Dragon, Vine, Scissors, Ladder, SoundRings, Lightning, bridgePt, hugDragon, Crystal } from "../../style/sky";
import { Ctx, Hero, HeldKey, armForTip, MagicDoor, Kingdom, seg, lerp, clamp, ease, V3, HH, toWorld, B1A, B1B, DRAGON_HANG } from "./common";

const heroY = (x: number) => (x > B1A[0] && x < B1B[0] ? bridgePt(B1A, B1B, (x - B1A[0]) / (B1B[0] - B1A[0]), 0.55)[1] + 0.07 : 0);

/* ===== S5 13.85-20.6 "Beyond it floated a kingdom of clouds, golden bridges, and tiny spinning windmills." ===== */
const DOORK: V3 = [0, 0, 4.1];
const K5: Key[] = [
  { t: 13.7, pos: [0.5, 2.2, 10.0], look: [0, 1.6, -4], fov: 50 },
  { t: 15.2, pos: [0.9, 6.0, 6.0], look: [0, 3.0, -30], fov: 56 },
  { t: 16.8, pos: [2.6, 6.4, 1.0], look: [14, 0.5, -6], fov: 54 },
  { t: 18.5, pos: [4.0, 6.4, -12], look: [11, 5.2, -30], fov: 46 },
  { t: 20.8, pos: [5.0, 6.6, -15], look: [11.5, 5.4, -31], fov: 44 },
];
export const S5 = ({ t, f }: Ctx) => (<>
  <Cam t={t} keys={K5} />
  <Kingdom t={t} />
  <MagicDoor p={DOORK} solid={1} open={1} noPortal glow={0.6} />
  <Hero p={[0, 0, DOORK[2] + 0.15]} f={f} pose={{ back: true, mood: "shock", armL: [-0.3, 0.5], armLK: 0.5, armR: [0.24, 0.58], armRK: 0.6 }} />
  <HeldKey P={[0, 0, DOORK[2] + 0.1]} arm={[0.24, 0.58]} ang={1.2} glow={0.8} />
  <Sparkles t={t} c={[6, 4, -10]} area={[10, 4, 8]} n={18} color="#fff2b0" size={0.18} rise={0.5} />
</>);

/* ===== S6 20.6-24.1 "Stickman stepped through. The door vanished." ===== */
const P6z = (t: number) => lerp(4.25, 1.7, seg(t, 21.05, 22.35, ease.sin));
const K6: Key[] = [
  { t: 20.4, pos: [1.6, 1.5, -5.2], look: [0, 1.1, 3.5], fov: 50 },
  { t: 22.4, pos: [0.9, 1.4, -4.4], look: [0, 1.1, 3.0], fov: 50 },
  { t: 24.3, pos: [-0.6, 1.6, -3.6], look: [0, 1.3, 2.6], fov: 48 },
];
export const S6 = ({ t, f }: Ctx) => {
  const z = P6z(t), moving = t > 21.05 && t < 22.35, close = seg(t, 22.45, 22.75, ease.i), fade = 1 - seg(t, 22.92, 23.5, ease.sin);
  const look = seg(t, 22.5, 22.7);
  return (<>
    <Cam t={t} keys={K6} impacts={[[22.75, 0.01]]} />
    <Kingdom t={t} />
    <MagicDoor p={DOORK} solid={1} open={1 - close} glow={0.6 + (1 - fade) * 1.4} fade={fade} meadow portalZ={0.2} />
    {t > 22.9 && t < 24 ? <Sparkles t={t} c={[0, 1.8, 4.1]} area={[1.4, 1.8, 0.3]} n={22} color="#9ff4ff" size={0.14} rise={2} o={1 - seg(t, 23.4, 24)} seed={6} /> : null}
    {t > 22.9 && t < 23.9 ? [0, 1, 2, 3, 4, 5, 6, 7].map((i) => { const u = t - 22.92; return <SGlow key={i} p={[Math.sin(i * 2.3) * 1.2 + Math.sin(i) * u, 0.4 + (i % 4) * 0.9 + u * 1.5, 4.1]} r={0.25} color="#7fefff" o={0.8 * (1 - u)} />; }) : null}
    <Hero p={[0, 0, z]} f={f} pose={{ walk: (4.25 - z) * 3.4, speed: moving ? 0.7 : 0, mood: t < 22.5 ? "smile" : t < 23.2 ? "shock" : "gulp", lookX: -look * 1, lookY: 0, flip: look > 0.5 && t < 23.6, nerv: t > 23.2 ? 0.3 : 0, squash: t > 22.5 && t < 22.8 ? -0.06 : 0, armR: [0.24, 0.5], armRK: 0.6 }} />
    <HeldKey P={[0, 0, z]} arm={[0.24, 0.5]} ang={1.3} glow={0.8} flip={look > 0.5 && t < 23.6} />
  </>);
};

/* ===== S7 24.1-25.95 "Then he heard a cry." ===== */
const P7x = (t: number) => lerp(0, 0.9, seg(t, 25.15, 25.9, ease.sin));
const K7: Key[] = [
  { t: 23.9, pos: [-0.8, 1.7, -3.2], look: [0, 1.2, 1.8], fov: 46 },
  { t: 24.75, pos: [-2.0, 2.0, -1.0], look: [6, 1.6, 1.5], fov: 48 },
  { t: 26.2, pos: [-5.6, 3.2, 6.8], look: [22, 2.6, -0.6], fov: 46 },
];
export const S7 = ({ t, f }: Ctx) => {
  const turned = t > 24.62, x = P7x(t), moving = t > 25.15 && t < 25.9;
  return (<>
    <Cam t={t} keys={K7} />
    <Kingdom t={t} storm={0.15 * seg(t, 24.6, 25.5)} />
    <SoundRings p={[DRAGON_HANG[0], DRAGON_HANG[1], DRAGON_HANG[2] + 0.5]} t={t} t0={24.78} s={1.8} />
    <SGlow p={DRAGON_HANG} r={0.9} color="#ff7a4a" o={0.5 + 0.3 * Math.sin(t * 9)} />
    <Hero p={[x, 0, 1.7]} f={f} pose={{ back: turned, walk: x * 3.4, speed: moving ? 0.5 : 0, mood: "worry", lookX: turned ? 0 : 1, squash: t > 24.62 && t < 24.8 ? -0.05 : 0, hunch: 0.2, armR: [0.24, 0.5], armRK: 0.6 }} />
    {!turned ? <HeldKey P={[x, 0, 1.7]} arm={[0.24, 0.5]} ang={1.3} glow={0.7} /> : null}
  </>);
};

/* ===== S8 25.95-31.1 "A baby dragon was trapped in crystal vines above a raging storm." ===== */
const DR: V3 = [DRAGON_HANG[0], DRAGON_HANG[1] - 0.75, DRAGON_HANG[2]];
export const VINES: [V3, V3, number][] = [ // from arch -> to dragon body points
  [[25.5, 5.2, -1.3], [DR[0] - 0.35, DR[1] + 0.85, DR[2] + 0.15], 0.3],
  [[26.9, 5.2, -1.3], [DR[0] + 0.3, DR[1] + 0.7, DR[2] + 0.15], 0.35],
  [[26.4, 5.3, -1.3], [DR[0] + 0.05, DR[1] + 0.15, DR[2] + 0.25], 0.5],
];
const swayD = (t: number) => Math.sin(t * 1.3) * 0.08;
export const TrappedDragon: React.FC<{ t: number; f: number; struggle?: number; mood?: "scared" | "calm" | "wow" }> = ({ t, f, struggle = 1, mood = "scared" }) => (<>
  <group position={[DR[0], DR[1] + 0.6, DR[2]]} rotation={[0, 0, swayD(t)]}><group position={[-DR[0], -DR[1] - 0.6, -DR[2]]}>
    <Dragon p={DR} h={1.35} f={f} pose={{ mood, flap: 0.35 + struggle * 0.35 * (0.5 + 0.5 * Math.sin(t * 2.1)), flapHz: 1.6, tilt: Math.sin(t * 3.3) * 0.08 * struggle, legsTucked: true, arms: "up", blink: (t % 2.7) < 0.12, lookX: Math.sin(t * 0.9) }} />
  </group></group>
  {VINES.map(([a, b, sg], i) => <Vine key={i} a={a} b={b} sag={sg} pulse={Math.sin(t * 3 + i) > 0.6 ? 1 : 0} />)}
  {VINES.map(([, b], i) => <Crystal key={i} p={[b[0] + 0.05, b[1] + 0.12, b[2] + 0.12]} s={0.11} color="#e0c8ff" tall={1.6} rotY={i} />)}
</>);
const K8: Key[] = [
  { t: 25.8, pos: [25.6, 3.8, 2.9], look: [26.2, 3.9, -0.6], fov: 40 },
  { t: 28.2, pos: [24.6, 4.3, 4.6], look: [26.2, 3.8, -0.6], fov: 44 },
  { t: 31.3, pos: [20.5, 10.5, 10.5], look: [25.0, -1.5, -1], fov: 54 },
];
export const S8 = ({ t, f }: Ctx) => {
  const storm = 0.3 + 0.5 * seg(t, 28.6, 29.8);
  return (<>
    <Cam t={t} keys={K8} />
    <Kingdom t={t} storm={storm} />
    <TrappedDragon t={t} f={f} />
    {[0, 1, 2].map((i) => { const ph = (t * 1.3 + i * 0.37) % 1; return <Lightning key={i} p={[14 + i * 6, -11, -8 + i * 4]} s={[3, 7]} seed={Math.floor(t * 3) + i * 7} o={ph < 0.12 ? 1 : 0} />; })}
    <SGlow p={[16, -12, -6]} r={14} color="#7a5aff" o={0.25 + 0.15 * Math.sin(t * 5)} />
  </>);
};

/* ===== S9 31.1-35.3 "Stickman ran across a narrow bridge. The planks began to shake." ===== */
const P9x = (t: number) => t < 34.5 ? lerp(2.4, 18.0, seg(t, 31.4, 34.5, (x) => (x < 0.1 ? 5 * x * x : x - 0.05) / 0.95)) : lerp(18.0, 20.2, seg(t, 34.5, 35.4, ease.o));
export const shakeK = (t: number) => seg(t, 34.4, 34.6) * Math.max(0.25, 1 - (t - 34.6) * 0.4);
export const S9 = ({ t, f }: Ctx) => {
  const x = P9x(t), y = heroY(x), moving = Math.abs(P9x(t + 0.04) - x) > 0.005, sk = shakeK(t);
  const camx = x;
  const keys: Key[] = [{ t: 0, pos: [camx - 1.5, 2.2, 9.5], look: [camx + 1.2, 1.0, 0], fov: 50 }];
  const fx = (i: number) => ({ dy: Math.sin(t * 22 + i * 1.3) * 0.07 * sk, rot: [Math.sin(t * 17 + i) * 0.12 * sk, 0, Math.sin(t * 19 + i * 2) * 0.05 * sk] as V3 });
  return (<>
    <Cam t={t} keys={keys} impacts={[[34.43, 0.02]]} />
    <Kingdom t={t} storm={0.8} bridgeFx={fx} />
    <TrappedDragon t={t} f={f} />
    {[0, 1].map((i) => { const ph = (t * 1.1 + i * 0.5) % 1; return <Lightning key={i} p={[10 + i * 8, -10, -4]} s={[3, 8]} seed={Math.floor(t * 3) + i * 5} o={ph < 0.1 ? 1 : 0} />; })}
    <Hero p={[x, y + (sk > 0 ? Math.abs(Math.sin(t * 22)) * 0.05 * sk : 0), 0]} sy={y} f={f} pose={{ walk: (x - 2.4) * 3.4 / 1.3, speed: moving ? 1 : 0, tilt: moving ? 0.1 * (1 - sk) : Math.sin(t * 9) * 0.06 * sk, mood: sk > 0.2 ? "worry" : "angry", nerv: sk > 0.2 ? 0.55 : 0, sweat: sk > 0.2 ? 0.8 : 0.3,
      arms: sk > 0.2 ? "shrug" : undefined, armR: sk > 0.2 ? undefined : [0.26, 0.42], armRK: 0.5 }} />
    {sk <= 0.2 ? <HeldKey P={[x, y, 0]} arm={[0.26, 0.42]} ang={0.6} glow={0.7} /> : null}
  </>);
};

/* ===== S10 35.3-38.0 "He drew a shield to block the sparks." ===== */
const P10: V3 = [21.0, 0, 0.8];
const SH = { lx: -1.25, ly: 1.75, w: 1.7, h: 2.0 };
const K10: Key[] = [
  { t: 35.1, pos: [24.6, 2.0, 7.6], look: [20.4, 1.2, 0], fov: 50 },
  { t: 38.2, pos: [23.6, 1.6, 6.8], look: [20.0, 1.4, 0], fov: 48 },
];
const SPARKS = [36.12, 36.38, 36.6, 36.9, 37.25];
export const S10 = ({ t, f }: Ctx) => {
  const prog = seg(t, 35.62, 36.3, (x) => x), fill = seg(t, 36.2, 36.45), cam = camAt(t, K10).pos;
  const tip = pathTip(SHIELD_PATH, prog), tipLoc: [number, number] = [(SH.lx - SH.w / 2 + tip[0] * SH.w) / HH, (SH.ly + SH.h / 2 - tip[1] * SH.h) / HH];
  const drawing = prog > 0 && prog < 1, k = seg(t, 35.4, 35.62) * (1 - seg(t, 36.35, 36.6));
  const idle: [number, number] = [0.26, 0.5], dArm = armForTip(tipLoc, Math.PI - 0.5);
  const arm: [number, number] = [lerp(idle[0], dArm[0], k), lerp(idle[1], dArm[1], k)];
  const hits = SPARKS.filter((s) => t > s + 0.36);
  return (<>
    <Cam t={t} keys={K10} impacts={SPARKS.map((s) => [s + 0.36, 0.012] as [number, number])} />
    <Kingdom t={t} storm={0.85} />
    <TrappedDragon t={t} f={f} />
    <FaceGroup p={P10}>
      <ChalkDraw p={[SH.lx, SH.ly, 0.35]} s={[SH.w, SH.h]} paths={SHIELD_PATH} prog={prog} t={t} width={13} fill="rgba(90,230,255,0.35)" fillK={fill} />
      {fill > 0 ? <SGlow p={[SH.lx, SH.ly, 0.4]} r={1.4} color="#5fe8ff" o={0.35 + hits.filter((s) => t - s - 0.36 < 0.2).length * 0.4} /> : null}
    </FaceGroup>
    {SPARKS.map((s0, i) => { const u = clamp((t - s0) / 0.36); if (t < s0 || t > s0 + 0.9) return null; const imp = toWorld(P10, [SH.lx + Math.sin(i * 2) * 0.3, SH.ly + Math.cos(i * 3) * 0.4, 0.45], cam); const st: V3 = [15.5, -3 + i * 0.4, -3];
      if (u < 1) { const p: V3 = [lerp(st[0], imp[0], u), lerp(st[1], imp[1], u) + Math.sin(u * Math.PI) * 1.2, lerp(st[2], imp[2], u)]; return <React.Fragment key={i}><SGlow p={p} r={0.35} color="#bfb0ff" o={1} />{[1, 2, 3].map((k2) => <SGlow key={k2} p={[lerp(st[0], imp[0], u - k2 * 0.05), lerp(st[1], imp[1], u - k2 * 0.05) + Math.sin((u - k2 * 0.05) * Math.PI) * 1.2, lerp(st[2], imp[2], u - k2 * 0.05)]} r={0.22 - k2 * 0.04} color="#9a8aff" o={0.7 - k2 * 0.15} />)}</React.Fragment>; }
      const d = t - s0 - 0.36; return <React.Fragment key={i}><SGlow p={imp} r={0.9 * Math.exp(-d * 6)} color="#ffffff" o={0.9} />{[0, 1, 2, 3].map((k2) => <SGlow key={k2} p={[imp[0] - d * 2 * Math.cos(k2), imp[1] + d * 2.5 * Math.sin(k2 + 1) - d * d * 6, imp[2] + 0.2]} r={0.1} color="#d8d0ff" o={1 - d * 1.8} />)}</React.Fragment>; })}
    <Hero p={P10} f={f} pose={{ mood: hits.length ? "angry" : "worry", nerv: 0.3, lookX: -1, squash: hits.length && t - SPARKS[hits.length - 1] - 0.36 < 0.15 ? -0.05 : 0, tilt: 0.05 * fill, armR: arm, armL: [-0.2, 0.42], armLK: 0.6 }} />
    <HeldKey P={P10} arm={arm} ang={lerp(1.3, Math.PI - 0.5, k)} glow={1.2} />
  </>);
};

/* ===== S11 38.0-41.0 "Then a ladder. Then enormous scissors." ===== */
const LAD: V3 = [26.0, 0, 0.35];
const P11y = (t: number) => lerp(0, 0.96, seg(t, 39.1, 39.85, ease.sin));
const K11: Key[] = [
  { t: 37.8, pos: [22.6, 1.3, 7.0], look: [25.4, 2.4, -0.4], fov: 52 },
  { t: 41.2, pos: [23.2, 2.0, 6.2], look: [25.8, 3.4, -0.4], fov: 50 },
];
const SC = { lx: 0.9, ly: 1.15, w: 1.6, h: 2.0 }; // scissors drawing (local to hero, relative to his feet)
// solid scissors pose (local): drawn spot -> lifted overhead with blades up around the vines
export const scissorsAt = (t: number) => { const k = seg(t, 40.45, 40.95, ease.sin); return { p: [lerp(SC.lx - 0.1, 0.12, k), lerp(SC.ly + 0.1, 3.6, k), 0.35] as V3, rot: lerp(-0.75, 0, k) }; };
export const scissorsArms = (t: number): [[number, number], [number, number]] => { const sp = scissorsAt(t); const hx = sp.p[0], hy = sp.p[1] - 0.78; return [[(hx + 0.2) / HH, hy / HH], [(hx - 0.2) / HH, hy / HH]]; };
export const S11 = ({ t, f }: Ctx) => {
  const walkX = lerp(23.8, 25.9, seg(t, 37.9, 38.3, ease.sin)), lprog = seg(t, 38.3, 38.9, (x) => x), lsolid = seg(t, 38.85, 39.05, ease.back);
  const y = P11y(t), P: V3 = [t < 38.35 ? walkX : 25.9, y, 0.5], climbing = t > 39.1 && t < 39.85;
  const sprog = seg(t, 39.5, 40.4, (x) => x), ssolid = seg(t, 40.35, 40.6, ease.back);
  // which drawing is the key working on
  let arm: [number, number] = [0.26, 0.5], ang = 1.2;
  if (lprog > 0 && lprog < 1) { const tp = pathTip(LADDER_PATH, lprog); ang = 0.9; arm = armForTip([(LAD[0] - 0.6 + tp[0] * 1.2 - P[0]) / HH, (3.6 - tp[1] * 3.6 + 0.1 - y) / HH], ang); }
  if (sprog > 0 && sprog < 1) { const tp = pathTip(SCISSORS_PATH, sprog); ang = 0.8; arm = armForTip([(SC.lx - SC.w / 2 + tp[0] * SC.w) / HH, (SC.ly + SC.h / 2 - tp[1] * SC.h) / HH], ang); }
  const climbArm: [number, number] = [0.18, 0.62 + Math.sin(t * 16) * 0.05];
  const holdS = ssolid > 0;
  return (<>
    <Cam t={t} keys={K11} />
    <Kingdom t={t} storm={0.85} />
    <TrappedDragon t={t} f={f} />
    <FaceGroup p={[LAD[0], 0, LAD[2] - 0.2]}><ChalkDraw p={[0, 1.9, 0]} s={[1.2, 3.6]} paths={LADDER_PATH} prog={lprog} o={1 - lsolid} t={t} width={10} /></FaceGroup>
    {lsolid > 0 ? <Ladder p={[LAD[0], 0, LAD[2] - 0.05]} h={3.7} lean={-0.5} k={lsolid} /> : null}
    <FaceGroup p={P}>
      <ChalkDraw p={[SC.lx, SC.ly, 0.3]} s={[SC.w, SC.h]} paths={SCISSORS_PATH} prog={sprog} o={1 - ssolid} t={t} width={10} />
      {holdS ? <Scissors p={scissorsAt(t).p} open={0.5} rot={[0, 0, scissorsAt(t).rot]} s={ssolid} /> : null}
    </FaceGroup>
    <Hero p={P} sy={y} shadow={y < 0.05} f={f} pose={{ walk: (walkX - 23.8) * 3.4 + (climbing ? (t - 39.1) * 12 : 0), speed: t < 38.3 || climbing ? 0.6 : 0, mood: holdS ? "laugh" : "angry", lookX: 0.5, lookY: -0.8, armR: holdS ? scissorsArms(t)[0] : arm, armL: holdS ? scissorsArms(t)[1] : climbing ? climbArm : [-0.22, 0.6], armLK: holdS ? seg(t, 40.45, 40.9) : climbing ? 1 : 0.5 }} />
    {!holdS ? <HeldKey P={P} arm={arm} ang={ang} glow={1.2} /> : null}
  </>);
};

/* ===== S12 41.0-46.6 "Snip! Snip! The vines broke. The dragon leaped into his arms." ===== */
const SNIPS = [41.25, 41.75];
const K12: Key[] = [
  { t: 40.9, pos: [23.4, 3.4, 7.0], look: [26.0, 3.5, -0.4], fov: 50 },
  { t: 42.9, pos: [23.4, 2.8, 6.4], look: [25.8, 2.8, -0.3], fov: 50 },
  { t: 44.6, pos: [23.4, 2.0, 7.6], look: [25.3, 1.7, 0], fov: 50 },
  { t: 46.8, pos: [24.1, 2.0, 5.6], look: [25.3, 1.6, 0], fov: 44 },
];
export const S12 = ({ t, f }: Ctx) => {
  const down = seg(t, 42.95, 43.8, ease.sin), y = lerp(0.96, 0, down), P: V3 = [25.9 - down * 0.7, y, 0.5];
  const snipK = (s: number) => t < s - 0.12 ? 0.5 : t < s ? lerp(0.5, 0.0, (t - s + 0.12) / 0.12) : t < s + 0.2 ? lerp(0, 0.5, (t - s) / 0.2) : 0.5;
  const sOpen = Math.min(snipK(SNIPS[0]), snipK(SNIPS[1])), sGone = seg(t, 43.0, 43.4);
  const broke = t >= 42.91, freeK = seg(t, 42.91, 43.4);
  // dragon: hangs -> freed hover (flap) -> leap parabola into arms (44.52 -> 45.25) -> hugged
  const hover: V3 = [lerp(DR[0], 27.3, freeK), lerp(DR[1], 2.3, seg(t, 42.91, 44.3, ease.sin)) + Math.sin(t * 6) * 0.06, DR[2] + 0.5 * freeK];
  const L0 = 44.52, L1 = 45.25, lu = clamp((t - L0) / (L1 - L0));
  const chest: V3 = [P[0] + 0.45, 1.25, 0.75];
  const dragP: V3 = t < L0 ? hover : [lerp(hover[0], chest[0], lu), lerp(hover[1], chest[1], lu) + Math.sin(lu * Math.PI) * 0.9, lerp(hover[2], chest[2], lu)];
  const hugging = t >= L1;
  const vineCut = (i: number) => (i < 2 ? t >= SNIPS[0] : t >= SNIPS[1]);
  const [sAR, sAL] = scissorsArms(45);
  const catchSq = hugging ? -0.12 * Math.exp(-(t - L1) * 6) : 0;
  return (<>
    <Cam t={t} keys={K12} impacts={[[SNIPS[0], 0.01], [SNIPS[1], 0.01]]} />
    <Kingdom t={t} storm={0.85} />
    {/* vines: whole until cut; after the cut the top retracts and the lower piece falls & fades */}
    {VINES.map(([a, b, sg], i) => { const cut = vineCut(i), ct = i < 2 ? SNIPS[0] : SNIPS[1];
      if (!cut && !broke) return <Vine key={i} a={a} b={b} sag={sg} />;
      const d = t - ct, fall = Math.max(0, t - Math.max(ct, 42.91));
      return <React.Fragment key={i}>
        <Vine a={a} b={b} sag={sg} from={0} to={lerp(0.5, 0.1, seg(t, ct, ct + 0.6))} o={broke ? 1 - seg(t, 42.91, 43.5) : 1} />
        {!broke || fall < 1 ? <Vine a={a} b={b} sag={sg} from={0.5} to={1} off={[0, -4.9 * fall * fall, 0]} rot={fall * 2} o={1 - seg(t, 42.91, 43.6)} /> : null}
        {d > 0 && d < 0.6 ? <Sparkles t={t} c={[lerp(a[0], b[0], 0.5), lerp(a[1], b[1], 0.5) - 0.3, a[2] + 0.3]} area={[0.4, 0.4, 0.2]} n={10} color="#e8d0ff" size={0.12} rise={3} o={1 - d / 0.6} seed={i + 3} />
        : null}</React.Fragment>; })}
    {broke && t < 44 ? <Sparkles t={t} c={[DR[0], DR[1] + 0.6, DR[2] + 0.3]} area={[1, 1, 0.3]} n={16} color="#e8d0ff" size={0.13} rise={2} o={1 - seg(t, 43.4, 44)} seed={9} /> : null}
    {!hugging ? <Dragon p={dragP} h={1.35} f={f} pose={{ mood: t < 42.91 ? "scared" : t < L0 ? "wow" : "happy", flap: t < 42.91 ? 0.5 : 1, flapHz: t < 42.91 ? 1.6 : 3.2, arms: t > L0 ? "reach" : "up", legsTucked: true, tilt: t > L0 ? -0.3 * Math.sin(lu * Math.PI) : Math.sin(t * 3) * 0.05 }} /> : null}
    {/* scissors in his hands until he climbs down; dissolve into chalk dust */}
    {t < 43.4 ? <FaceGroup p={P}><Scissors p={scissorsAt(45).p} open={sOpen} rot={[0, 0, 0]} s={1 - sGone} /></FaceGroup> : null}
    {t > 43.0 && t < 43.9 ? <Sparkles t={t} c={[P[0] + 0.8, y + 1.8, 0.8]} area={[0.6, 0.8, 0.2]} n={12} color="#9ff4ff" size={0.1} rise={2} o={1 - seg(t, 43.5, 43.9)} seed={4} /> : null}
    {hugging ? <Sparkles t={t} c={[P[0], 2.3, 0.9]} area={[1.6, 1.2, 0.4]} n={16} color="#ffe6a0" size={0.14} rise={1.5} o={1 - seg(t, 46.0, 46.6)} seed={12} /> : null}
    <Ladder p={[LAD[0], 0, LAD[2] - 0.05]} h={3.7} lean={-0.5} />
    <Hero p={P} sy={y} shadow={y < 0.05} f={f} pose={{ mood: t < 42.91 ? "angry" : t < L0 ? "smile" : hugging ? "laugh" : "shock", lookY: t < 43 ? -0.9 : t < L1 ? -0.6 : 0, squash: catchSq, walk: down * 6, speed: t > 42.95 && t < 43.8 ? 0.5 : 0,
      arms: t >= 43.8 && !hugging ? "box" : hugging ? "hold" : undefined, armR: t < 43.0 ? sAR : hugging ? [0.16, 0.42] : undefined, armL: t < 43.0 ? sAL : hugging ? [0.0, 0.36] : undefined,
      hug: hugging ? hugDragon({ t: f, mood: "happy", flap: 0.6, flapHz: 1.5, arms: "up", legsTucked: true, tilt: -0.1 }, 200, 70, 78) : undefined }} />
  </>);
};
void hand; void Crystal;
