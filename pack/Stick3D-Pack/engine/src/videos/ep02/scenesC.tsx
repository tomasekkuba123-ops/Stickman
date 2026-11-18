// EP02 scenes 13-20: storm awakens, bridge collapse, last drawing, heart, seal, sunlight+bubbles, castle, golden eyes + end card.
import React from "react";
import { AbsoluteFill, interpolate, Easing } from "remotion";
import { CanvasPlane, Shadow, Box } from "../../style/toon";
import { Cam, Key, camAt, FaceGroup } from "../../style/extra";
import { ChalkDraw, HEART_PATH, ROCKET_PATH, SWORD_PATH, pathTip, strokePaths, SGlow, Sparkles, Dragon, Lightning, Bubble, bridgePt, hugDragon, Crystal } from "../../style/sky";
import { DragonPose } from "../../style/dragon";
import { Ctx, Hero, HeldKey, armForTip, Kingdom, seg, lerp, clamp, ease, V3, HH, toWorld, B1A, B1B, XTAL, CASTLE, FPS } from "./common";

const rnd = (i: number) => { const x = Math.sin(i * 77.7 + 3.1) * 43758.5453; return x - Math.floor(x); };
/* crack overlay facing the camera (prog 0..1 grows the cracks; glow pulses) */
const CRACKS: [number, number][][] = Array.from({ length: 6 }, (_, k) => { const a = k * 1.05 + 0.3; const pts: [number, number][] = [[0.5, 0.5]]; let x = 0.5, y = 0.5; for (let i = 1; i < 6; i++) { x += Math.cos(a + (rnd(k * 9 + i) - 0.5) * 1.1) * 0.075; y += Math.sin(a + (rnd(k * 9 + i) - 0.5) * 1.1) * 0.11; pts.push([x, y]); } return pts; });
const Cracks: React.FC<{ p: V3; s: number; prog: number; t: number; color?: string }> = ({ p, s, prog, t, color = "rgba(220,200,255,1)" }) => (
  prog <= 0.01 ? null : <CanvasPlane p={p} s={[s, s * 1.5]} face additive px={[256, 384]} draw={(c, W, H) => { c.clearRect(0, 0, W, H); strokePaths(c, W, H, CRACKS.map((cr) => cr.slice(0, 1 + Math.ceil(prog * (cr.length - 1)))), 1, color, 5 + Math.sin(t * 14) * 1.5, 0, t); }} />
);
// dragon riding on the hero's shoulder (billboard placed beside the head, nudged toward camera)
const ShoulderDragon: React.FC<{ P: V3; cam: V3; f: number; pose?: Partial<DragonPose>; back?: boolean }> = ({ P, cam, f, pose, back }) => {
  const w = toWorld(P, [back ? -0.95 : 0.95, 2.05, 0.15], cam);
  return <Dragon p={w} h={1.15} f={f} pose={{ mood: "calm", flap: 0.25, legsTucked: true, ...pose }} />;
};
const hugPose = (f: number, mood: DragonPose["mood"] = "scared") => hugDragon({ t: f, mood, flap: 0.3, arms: "up", legsTucked: true, tilt: -0.1 }, 200, 70, 78);
const HUGARMS = { armR: [0.16, 0.42] as [number, number], armL: [0.0, 0.36] as [number, number] };

/* ===== S13 46.6-54.3 "But their rescue had woken something worse. A cracked storm crystal flashed. The floating islands lurched." ===== */
const P13: V3 = [25.2, 0, 0.5];
const K13: Key[] = [
  { t: 46.4, pos: [23.4, 2.0, 7.0], look: [25.3, 1.6, 0], fov: 46 },
  { t: 48.4, pos: [23.0, 2.4, 6.6], look: [24.4, 0.8, -1], fov: 48 },
  { t: 49.6, pos: [17.5, 0.6, 0.5], look: [14, -4, -12], fov: 50 },
  { t: 50.9, pos: [15.0, -2.2, -5.0], look: [14, -3.6, -12], fov: 46 },
  { t: 52.0, pos: [10.0, 2.0, 12], look: [16, -1, -4], fov: 58 },
  { t: 54.5, pos: [8.5, 3.4, 16], look: [16, 0, -4], fov: 60 },
];
const lurchK = (t: number) => seg(t, 52.7, 52.9) * Math.max(0, 1 - (t - 52.9) * 0.9);
export const S13 = ({ t, f }: Ctx) => {
  const crack = seg(t, 49.67, 50.6, ease.o), flash = t > 50.87 ? Math.exp(-(t - 50.87) * 5) : 0, lk = lurchK(t);
  const worried = t > 48.2, jolt = t > 52.81 && t < 53.2;
  return (<>
    <Cam t={t} keys={K13} impacts={[[50.87, 0.03], [52.81, 0.09]]} />
    <Kingdom t={t} storm={lerp(0.85, 1, seg(t, 48, 50))} lurch={lk} crack={crack} />
    <Cracks p={[XTAL[0], XTAL[1] + Math.sin(t * 0.8) * 0.3, XTAL[2] + 2.0]} s={4.2} prog={crack} t={t} />
    <SGlow p={[XTAL[0], XTAL[1], XTAL[2] + 2.5]} r={4 + 12 * flash} color="#ffffff" o={0.3 * crack + 0.9 * flash} />
    {[0, 1, 2, 3].map((i) => <Lightning key={i} p={[XTAL[0] + (i - 1.5) * 4, XTAL[1] - 1, XTAL[2] + 1 + i]} s={[3, 9]} seed={i * 11 + Math.floor(t * 6)} o={flash > 0.2 ? flash : (t * 1.7 + i * 0.3) % 1 < 0.08 ? 0.8 : 0} rot={[0, 0, (i - 1.5) * 0.4]} />)}
    <Hero p={[P13[0], (jolt ? 0.25 * Math.sin((t - 52.81) / 0.4 * Math.PI) : 0), P13[2]]} sy={0} f={f} pose={{ mood: !worried ? "laugh" : jolt ? "shock" : "worry", nerv: worried ? 0.4 : 0, sweat: worried ? 0.8 : 0, lookY: worried && t < 52 ? 1 : 0, lookX: worried ? -0.7 : 0, squash: jolt ? 0.1 : 0, air: jolt ? 1 : 0, ...HUGARMS, hug: hugPose(f, worried ? "scared" : "happy") }} />
  </>);
};

/* ===== S14 54.3-56.95 "The bridge shattered behind them." ===== */
const P14x = (t: number) => lerp(15.5, 2.6, seg(t, 54.3, 56.35, (x) => x < 0.08 ? x * x / 0.16 : x > 0.9 ? 1 - (1 - x) * (1 - x) / 0.2 - 0.0 : x - 0.04));
const breakX = (t: number) => 19.8 - Math.max(0, t - 54.75) * 7.2;
const heroY14 = (x: number) => (x > B1A[0] && x < B1B[0] ? bridgePt(B1A, B1B, (x - B1A[0]) / (B1B[0] - B1A[0]), 0.55)[1] + 0.07 : 0);
export const S14 = ({ t, f }: Ctx) => {
  const x = P14x(t), y = heroY14(x), moving = Math.abs(P14x(t + 0.04) - x) > 0.005, bx = breakX(t);
  const fx = (i: number, u: number) => { const px = lerp(B1A[0], B1B[0], u); if (px < bx) return {}; const tb = 54.75 + (19.8 - px) / 7.2, d = t - tb; if (d > 2.2) return { gone: true }; return { dy: -4.9 * d * d - 0.1 * d, rot: [d * (2 + (i % 3)), 0, d * (1.5 - (i % 2) * 3)] as V3, dx: d * (rnd(i) - 0.5) * 2, dz: d * (rnd(i + 5) - 0.5) * 2 }; };
  const ropeCut = clamp((bx - B1A[0]) / (B1B[0] - B1A[0]) - 0.04, 0, 2);
  const keys: Key[] = [{ t: 0, pos: [x - 5.2, 2.6, 7.6], look: [x + 1.6, 0.6, -0.5], fov: 54 }];
  const arrived = t > 56.35, turn = seg(t, 56.35, 56.6);
  return (<>
    <Cam t={t} keys={keys} impacts={[[54.89, 0.04]]} />
    <Kingdom t={t} storm={1} bridgeFx={fx} ropeCut={ropeCut} lurch={0.15} />
    {[0, 1, 2, 3, 4, 5].map((i) => { const px = bx + 0.6 + i * 0.9; if (px > 19.8) return null; const q = bridgePt(B1A, B1B, (px - B1A[0]) / (B1B[0] - B1A[0]), 0.55); return <SGlow key={i} p={[px, q[1], 0.6]} r={0.6} color="#ffd86a" o={0.35} />; })}
    <Hero p={[x, y, 0]} sy={y} f={f} pose={{ walk: (15.5 - x) * 3.4 / 1.3, speed: moving ? 1 : 0, flip: !arrived || turn < 0.5, tilt: moving ? -0.1 : 0, mood: arrived ? "worry" : "shock", nerv: 0.4, sweat: 1, hunch: arrived ? 0.5 * turn : 0.2, lookX: arrived ? 1 : -0.3, ...HUGARMS, hug: hugPose(f) }} />
  </>);
};

/* ===== S15 56.95-64.35 "The chalk key flickered. One drawing left. Stickman could draw a rocket. Or a sword." ===== */
const P15: V3 = [3.0, 0, 1.2];
const K15: Key[] = [
  { t: 56.8, pos: [3.9, 2.2, 5.6], look: [3.5, 1.9, 1.2], fov: 42 },
  { t: 59.4, pos: [3.8, 2.3, 6.4], look: [3.4, 2.0, 1.2], fov: 44 },
  { t: 60.6, pos: [3.4, 2.4, 9.0], look: [3.4, 2.5, 1.0], fov: 50 },
  { t: 64.5, pos: [3.2, 2.5, 8.4], look: [3.3, 2.6, 1.0], fov: 50 },
];
const flick = (t: number) => { if (t < 57.75) return 1; if (t < 58.8) return rnd(Math.floor(t * 18)) > 0.45 ? 0.9 : 0.15; return 0.28; };
const Thought: React.FC<{ P: V3; t: number; t0: number; t1: number; paths: [number, number][][]; seed: number }> = ({ P, t, t0, t1, paths, seed }) => {
  const k = seg(t, t0, t0 + 0.3, ease.back), prog = seg(t, t0 + 0.15, t0 + 0.75, (x) => x), out = seg(t, t1 - 0.35, t1);
  if (t < t0 || t > t1) return null;
  return <FaceGroup p={P}><CanvasPlane p={[0.95, 4.35, 0.2]} s={[2.4 * k + 0.01, 2.2 * k + 0.01]} px={[320, 294]} draw={(c, W, H) => {
    c.clearRect(0, 0, W, H); c.globalAlpha = 1 - out; c.fillStyle = "#ffffff"; c.strokeStyle = "#0b0d1a"; c.lineWidth = 7;
    const blobs: [number, number, number][] = [[0.5, 0.45, 0.3], [0.28, 0.5, 0.2], [0.72, 0.5, 0.2], [0.4, 0.3, 0.2], [0.62, 0.3, 0.2], [0.5, 0.62, 0.2]];
    c.beginPath(); for (const [x, y, r] of blobs) { c.moveTo(x * W + r * W, y * H); c.arc(x * W, y * H, r * W, 0, 7); } c.stroke(); c.beginPath(); for (const [x, y, r] of blobs) { c.moveTo(x * W + r * W, y * H); c.arc(x * W, y * H, r * W, 0, 7); } c.fill();
    for (const [x, y, r] of [[0.2, 0.86, 0.05], [0.12, 0.96, 0.03]] as [number, number, number][]) { c.beginPath(); c.arc(x * W, y * H, r * W, 0, 7); c.fill(); c.stroke(); }
    c.save(); c.translate(W * 0.3, H * 0.13); c.scale(0.4, 0.62); strokePaths(c, W, H, paths, prog, "rgba(60,70,110,1)", 8, 0.3, t + seed); c.restore();
    if (out > 0) { c.strokeStyle = `rgba(230,40,60,${1 - out})`; c.lineWidth = 12; c.beginPath(); c.moveTo(W * 0.32, H * 0.2); c.lineTo(W * 0.68, H * 0.68); c.moveTo(W * 0.68, H * 0.2); c.lineTo(W * 0.32, H * 0.68); c.stroke(); }
  }} /></FaceGroup>;
};
export const S15 = ({ t, f }: Ctx) => {
  const fl = flick(t), breath = seg(t, 63.75, 64.3, ease.sin);
  return (<>
    <Cam t={t} keys={K15} />
    <Kingdom t={t} storm={1} noBridge lurch={0.05} />
    {[0, 1].map((i) => <Lightning key={i} p={[12 + i * 5, -6, -8]} s={[3, 9]} seed={i * 3 + Math.floor(t * 4)} o={(t * 0.9 + i * 0.5) % 1 < 0.07 ? 0.8 : 0} />)}
    <Dragon p={[4.55, 0, 1.6]} h={1.25} f={f} shadow pose={{ mood: "scared", flap: 0.2, lookX: -1, flip: true }} />
    <HeldKey P={P15} arm={[0.22, 0.52]} ang={1.15} glow={fl} />
    {t > 58.8 ? <SGlow p={toWorld(P15, [0.22 * HH + Math.cos(1.15) * 0.55, 0.52 * HH + Math.sin(1.15) * 0.55, 0.25], camAt(t, K15).pos)} r={0.22 + 0.05 * Math.sin(t * 5)} color="#7fefff" o={0.95} /> : null}
    <Thought P={P15} t={t} t0={61.45} t1={62.85} paths={ROCKET_PATH} seed={1} />
    <Thought P={P15} t={t} t0={63.05} t1={64.3} paths={SWORD_PATH} seed={2} />
    <Hero p={P15} f={f} pose={{ mood: t < 59.5 ? "worry" : t < 61.4 ? "deadpan" : t < 63.9 ? "worry" : "smile", lookX: t < 59.6 ? 0.6 : t < 61.4 ? 0 : 0.5, lookY: t < 59.6 ? 0.6 : t > 61.4 && t < 63.9 ? -1 : 0, nerv: t < 59.6 ? 0.3 : 0, squash: breath * 0.05 * Math.sin(breath * Math.PI), armR: [0.22, 0.52], armL: [-0.22, 0.44], armLK: 0.6 }} />
  </>);
};

/* ===== S16 64.35-69.25 "Instead, he drew a giant, glowing heart." ===== */
const P16: V3 = [2.4, 0, -2.0];
const K16: Key[] = [
  { t: 64.2, pos: [-0.8, 3.2, 5.2], look: [9, -1.2, -9], fov: 60 },
  { t: 66.6, pos: [-0.4, 3.6, 4.4], look: [10.5, -2.0, -10], fov: 60 },
  { t: 69.4, pos: [0.2, 4.0, 3.6], look: [11.5, -2.6, -10.5], fov: 60 },
];
const HEART_S = 15;
export const S16 = ({ t, f }: Ctx) => {
  const prog = seg(t, 65.66, 67.45, ease.sin), snap = t > 67.45 ? Math.exp(-(t - 67.45) * 5) : 0, raise = seg(t, 64.5, 65.4, ease.back);
  const tp = pathTip(HEART_PATH, prog);
  // the hand traces a small mirror of the heart while the giant one is drawn far away
  const arm: [number, number] = prog > 0 && prog < 1 ? [0.18 + (tp[0] - 0.5) * 0.35, 0.86 - (tp[1] - 0.5) * 0.3] : [lerp(0.22, 0.2, raise), lerp(0.5, 0.86, raise)];
  return (<>
    <Cam t={t} keys={K16} />
    <Kingdom t={t} storm={1} noBridge lurch={0.05} crack={1} />
    <Cracks p={[XTAL[0], XTAL[1], XTAL[2] + 2.0]} s={4.2} prog={1} t={t} />
    {[0, 1].map((i) => <Lightning key={i} p={[XTAL[0] + (i ? 4 : -4), XTAL[1], XTAL[2]]} s={[3, 9]} seed={i * 7 + Math.floor(t * 5)} o={(t * 1.3 + i * 0.5) % 1 < 0.08 ? 0.8 : 0} />)}
    <FaceGroup p={[XTAL[0], XTAL[1] - 0.5, XTAL[2] + 2.5]}><ChalkDraw p={[0, 0, 0]} s={[HEART_S, HEART_S * 0.95]} paths={HEART_PATH} prog={prog} t={t} width={13} color="rgba(255,200,60,1)" fill="rgba(255,190,60,0.25)" fillK={seg(t, 67.3, 67.6)} px={640} /></FaceGroup>
    {prog > 0 && prog < 1 ? <SGlow p={toWorld([XTAL[0], XTAL[1] - 0.5, XTAL[2] + 2.5], [(tp[0] - 0.5) * HEART_S, (0.5 - tp[1]) * HEART_S * 0.95, 0.3], camAt(t, K16).pos)} r={1.6} color="#fff0b0" o={0.9} /> : null}
    <SGlow p={[XTAL[0], XTAL[1], XTAL[2] + 3]} r={10 + 10 * snap} color="#ffd86a" o={0.9 * snap} />
    <HeldKey P={P16} arm={arm} ang={0.9} glow={0.6 + prog * 1.2} flip />
    <Hero p={P16} f={f} pose={{ back: true, armR: arm, armRK: 1, armL: [-0.2, 0.46], armLK: 0.5, squash: snap * -0.06 }} />
    <Dragon p={[1.3, 0, -1.2]} h={1.2} f={f} shadow pose={{ mood: prog > 0.3 ? "wow" : "scared", flap: 0.3 + snap, lookX: 1 }} />
  </>);
};

/* ===== S17 69.25-75.45 "It wrapped around the crystal... and sealed the crack. The wind fell silent." ===== */
const P17: V3 = [2.4, 0, -2.0];
const K17: Key[] = [
  { t: 69.1, pos: [12.0, -0.8, -1.0], look: [14, -3.8, -12], fov: 50 },
  { t: 72.0, pos: [9.0, 2.0, 4.0], look: [13, -2.5, -10], fov: 52 },
  { t: 75.6, pos: [0.6, 2.6, 5.6], look: [6.5, -1.5, -8], fov: 54 },
];
// windmill spin angle: integral of a speed that goes from storm-fast to calm (wind falls silent 73.4-74.1)
const spin17 = (t: number) => { const v0 = 6, v1 = 1.0, a = 73.4, b = 74.2; if (t < a) return t * v0; if (t < b) { const u = (t - a) / (b - a); return a * v0 + (b - a) * (v0 * u - (v0 - v1) * u * u / 2); } return a * v0 + (b - a) * (v0 + v1) / 2 + (t - b) * v1; };
export const S17 = ({ t, f }: Ctx) => {
  const wrap = seg(t, 69.45, 70.6, ease.io), seal = seg(t, 71.1, 71.95, ease.io), storm = lerp(1, 0.35, seg(t, 71.6, 74.3, ease.sin));
  const s = lerp(HEART_S, 5.2, wrap), cam = camAt(t, K17).pos;
  return (<>
    <Cam t={t} keys={K17} />
    <Kingdom t={t} storm={storm} noBridge crack={1 - seal} spin={spin17(t)} lurch={0.05 * (1 - seal)} />
    <Cracks p={[XTAL[0], XTAL[1], XTAL[2] + 2.0]} s={4.2} prog={1 - seal} t={t} color="rgba(255,220,140,1)" />
    <FaceGroup p={[XTAL[0], XTAL[1] - 0.5 * (1 - wrap), XTAL[2] + lerp(2.5, 1.9, wrap)]}><ChalkDraw p={[0, 0, 0]} s={[s, s * 0.95]} paths={HEART_PATH} prog={1} t={t} width={lerp(13, 22, wrap)} color="rgba(255,200,60,1)" fill="rgba(255,190,60,0.35)" fillK={0.6 + 0.4 * wrap} px={640} /></FaceGroup>
    <SGlow p={[XTAL[0], XTAL[1], XTAL[2] + 2.6]} r={4 + 3 * seal} color="#ffd86a" o={0.22 + 0.25 * Math.sin(seal * Math.PI)} />
    {t < 72 ? [0, 1].map((i) => <Lightning key={i} p={[XTAL[0] + (i ? 4 : -4), XTAL[1] - 1, XTAL[2] - 2]} s={[1.6, 5 * (1 - seal) + 0.01]} seed={i * 5 + Math.floor(t * 5)} o={(t * 1.3 + i * 0.5) % 1 < 0.08 ? 0.8 * (1 - seal) : 0} />) : null}
    {seal > 0 ? <Sparkles t={t} c={[XTAL[0], XTAL[1], XTAL[2] + 2]} area={[3, 4, 1]} n={18} color="#ffe6a0" size={0.2} rise={1} o={Math.sin(seal * Math.PI) + (t > 72 ? 0.4 : 0)} seed={17} /> : null}
    <Hero p={P17} f={f} pose={{ mood: seal > 0.6 ? "smile" : "worry", lookX: 1, lookY: 0.5, armR: [0.22, 0.48], armL: [-0.22, 0.44], armLK: 0.5 }} />
    <ShoulderDragon P={P17} cam={cam} f={f} pose={{ mood: seal > 0.6 ? "happy" : "wow", lookX: 1, flap: 0.3 }} />
    <HeldKey P={P17} arm={[0.22, 0.48]} ang={1.1} glow={0.25} />
  </>);
};

/* ===== S18 75.45-82.35 "Sunlight flooded the sky. The dragon sneezed, releasing a trail of glittering bubbles." ===== */
const P18: V3 = [1.0, 0, 1.5], DG18: V3 = [2.5, 0, 1.9];
const K18: Key[] = [
  { t: 75.3, pos: [-3.0, 3.0, 11], look: [3.0, 3.2, -6], fov: 56 },
  { t: 77.8, pos: [0.6, 1.6, 8.0], look: [1.9, 1.1, 1.5], fov: 46 },
  { t: 80.6, pos: [0.4, 1.9, 8.6], look: [1.8, 1.6, 1.5], fov: 48 },
  { t: 82.5, pos: [0.2, 2.2, 10.0], look: [1.6, 2.0, 1.5], fov: 52 },
];
const SNEEZE = 78.63;
const bubbleCenter: V3 = [1.6, 1.75, 1.75];
export const S18 = ({ t, f }: Ctx) => {
  const sun = seg(t, 75.6, 77.2, ease.sin), cam = camAt(t, K18).pos;
  const pre = seg(t, 78.1, 78.6, ease.sin), rec = t > SNEEZE ? Math.exp(-(t - SNEEZE) * 6) : 0;
  const headRecoil = t < SNEEZE ? -pre : rec * 1.2;
  const hop = seg(t, 80.55, 81.15), onShoulder = t >= 81.15;
  const snout = toWorld(DG18, [0.55, 0.85, 0.2], cam);
  const grow = seg(t, 81.3, 82.2, ease.io);
  const shoulder = toWorld(P18, [0.95, 2.05, 0.15], cam);
  const dragP: V3 = [lerp(DG18[0], shoulder[0], hop), lerp(0, shoulder[1], hop) + Math.sin(hop * Math.PI) * 0.8, lerp(DG18[2], shoulder[2], hop)];
  return (<>
    <Cam t={t} keys={K18} impacts={[[SNEEZE, 0.008]]} />
    <Kingdom t={t} storm={lerp(0.35, 0, sun)} sun={sun} noBridge spin={t * 1.0} />
    {sun > 0 ? [0, 1, 2, 3].map((i) => <SGlow key={i} p={[-30 + i * 9, 40 - i * 6, -120]} r={20 + i * 4} color="#fff2b0" o={0.25 * sun} />) : null}
    {sun > 0 ? <Sparkles t={t} c={[2, 5, -2]} area={[8, 4, 4]} n={14} color="#fff2b0" size={0.16} rise={0.4} o={sun} seed={18} /> : null}
    {/* sneeze bubbles: emitted from the snout, rising and drifting; the last one grows around both */}
    {Array.from({ length: 12 }, (_, i) => { const t0 = SNEEZE + i * 0.08, d = t - t0; if (d < 0 || d > 3.2) return null; const p: V3 = [snout[0] + d * (0.9 + rnd(i) * 0.8), snout[1] + d * (0.55 + rnd(i + 3) * 0.6) + Math.sin(d * 3 + i) * 0.1, snout[2] + d * (rnd(i + 7) - 0.3)]; return <Bubble key={i} p={p} r={0.16 + rnd(i + 9) * 0.22 * Math.min(1, d * 3)} t={t + i} o={1 - seg(d, 2.6, 3.2)} />; })}
    {t > 79.5 ? <Sparkles t={t} c={[snout[0] + 1.2, snout[1] + 1, snout[2]]} area={[1.6, 1.2, 0.5]} n={14} color="#ffffff" size={0.1} rise={1.2} o={1 - seg(t, 81.5, 82.3)} seed={8} /> : null}
    {t > 81.1 ? <Bubble p={[lerp(3.6, bubbleCenter[0], grow), lerp(3.1, bubbleCenter[1], grow), lerp(2.2, bubbleCenter[2] + 0.3, grow)]} r={lerp(0.35, 2.75, grow)} t={t} o={0.95} /> : null}
    <Hero p={P18} f={f} pose={{ mood: t < SNEEZE ? "smile" : t < 79.6 ? "shock" : "laugh", lookX: 1, lookY: sun < 1 && t < 77 ? -1 : 0, squash: t > SNEEZE && t < 78.9 ? -0.05 : 0, armR: [0.22, 0.46], armL: [-0.22, 0.42], armLK: 0.4 }} />
    <HeldKey P={P18} arm={[0.22, 0.46]} ang={1.1} glow={0.25 + sun * 0.3} />
    {!onShoulder ? <Dragon p={dragP} h={1.25} f={f} shadow={hop < 0.05} sy={0} pose={{ mood: t > 78.0 && t < SNEEZE + 0.35 ? "sneeze" : "happy", headRecoil, flap: hop > 0 ? 1 : 0.3, flapHz: hop > 0 ? 3 : 1, flip: true, squash: t > 78.1 && t < SNEEZE ? -0.06 * pre : 0, arms: hop > 0 ? "up" : "down" }} />
      : <ShoulderDragon P={P18} cam={cam} f={f} pose={{ mood: "happy", flip: true }} />}
  </>);
};

/* ===== S19 82.35-90.45 "One bubble carried them toward a distant castle. But as they approached, the castle's enormous doors opened by themselves." ===== */
const DOORW: V3 = [CASTLE[0], CASTLE[1] + 3.0, CASTLE[2] + 3.4];
const bez = (a: V3, b: V3, c: V3, u: number): V3 => [0, 1, 2].map((k) => (1 - u) * (1 - u) * a[k] + 2 * (1 - u) * u * b[k] + u * u * c[k]) as V3;
const bubPos = (t: number): V3 => { const u = seg(t, 82.6, 89.9, ease.io); return bez([1.6, 1.75, 1.75], [6, 22, -40], [DOORW[0], DOORW[1] - 1.2, DOORW[2] + 11], u); };
export const S19 = ({ t, f }: Ctx) => {
  const B = bubPos(t), lift = seg(t, 82.6, 83.4);
  const P: V3 = [B[0], B[1] - 1.75, B[2]];
  const keys: Key[] = [{ t: 0, pos: [B[0] + lerp(1.2, -0.8, lift), B[1] + lerp(0.6, 1.7, lift), B[2] + lerp(8.6, 7.6, lift)], look: [lerp(B[0] + 0.2, B[0] + 0.9, lift), lerp(B[1], B[1] + 1.2, lift), B[2] - lerp(1, 20, lift)], fov: 56 }];
  const cam = keys[0].pos;
  const open = seg(t, 88.5, 89.7, ease.io);
  return (<>
    <Cam t={t} keys={keys} />
    <Kingdom t={t} sun={1} noBridge spin={t} castleOpen={open} />
    {open > 0 ? <SGlow p={[DOORW[0], DOORW[1], DOORW[2] + 1]} r={6} color="#ffe6a0" o={0.3 * open} /> : null}
    <Bubble p={[B[0], B[1], B[2] + 0.4]} r={2.75} t={t} o={0.95} />
    <Hero p={P} f={f} shadow={false} pose={{ back: lift > 0.5, mood: "laugh", armR: [0.22, 0.46], armL: [-0.22, 0.42], armLK: 0.4, walk: 0, air: 1 }} />
    <ShoulderDragon P={P} cam={cam} f={f} back={lift > 0.5} pose={{ mood: "happy", flip: lift <= 0.5, flap: 0.5 }} />
    <Sparkles t={t} c={[B[0], B[1], B[2] + 1]} area={[3, 3, 1]} n={12} color="#fff6c0" size={0.12} rise={1} seed={19} />
  </>);
};

/* ===== S20 90.45-100 "Inside, two golden eyes blinked. Stickman squeezed the key. What would you draw next?" + end card ===== */
const P20: V3 = [CASTLE[0] - 0.4, CASTLE[1], CASTLE[2] + 9.2];
const K20: Key[] = [
  { t: 90.3, pos: [P20[0] + 1.6, P20[1] + 2.6, P20[2] + 7.5], look: [CASTLE[0], CASTLE[1] + 3.0, CASTLE[2] + 3], fov: 52 },
  { t: 92.65, pos: [P20[0] + 1.0, P20[1] + 2.9, P20[2] + 4.6], look: [CASTLE[0], CASTLE[1] + 3.6, CASTLE[2] + 3], fov: 46 },
  { t: 93.4, pos: [P20[0] + 1.4, P20[1] + 2.0, P20[2] + 7.2], look: [P20[0], P20[1] + 1.6, P20[2]], fov: 48 },
  { t: 94.4, pos: [P20[0] + 1.0, P20[1] + 1.8, P20[2] + 5.6], look: [P20[0] + 0.4, P20[1] + 1.4, P20[2]], fov: 46 },
  { t: 96.0, pos: [P20[0] + 1.6, P20[1] + 2.2, P20[2] + 7.6], look: [P20[0] + 0.2, P20[1] + 1.4, P20[2]], fov: 50 },
  { t: 100, pos: [P20[0] + 2.2, P20[1] + 3.2, P20[2] + 10.5], look: [P20[0], P20[1] + 2.2, P20[2]], fov: 54 },
];
export const S20 = ({ t, f }: Ctx) => {
  const cam = camAt(t, K20).pos, front = t > 92.95;
  const pop = seg(t, 90.45, 90.75), eyes = seg(t, 91.5, 92.2, ease.io), blink = t > 92.55 && t < 92.8 ? Math.sin((t - 92.55) / 0.25 * Math.PI) : 0;
  const stun = t > 92.95 && t < 93.5, squeeze = seg(t, 94.4, 94.7, ease.back) * (1 - seg(t, 95.6, 96.0));
  return (<>
    <Cam t={t} keys={K20} />
    <Kingdom t={t} sun={1} noBridge spin={t} castleOpen={1} eyes={eyes} blink={blink} />
    <Box p={[P20[0], CASTLE[1] - 0.15, P20[2] - 1.5]} s={[6, 0.3, 6]} color="#ffd65a" line={3} />
    {[0, 1, 2].map((i) => <Box key={i} p={[CASTLE[0], CASTLE[1] - 0.05 - i * 0.3, CASTLE[2] + 4.0 + i * 0.6]} s={[4.6 + i, 0.3, 0.6]} color="#ffcc3a" line={2} />)}
    {pop > 0 && pop < 1 ? <Bubble p={[P20[0], P20[1] + 1.75, P20[2] + 0.4]} r={2.75 * (1 + pop * 0.3)} t={t} o={1 - pop} /> : null}
    {pop > 0 && pop < 1 ? <Sparkles t={t} c={[P20[0], P20[1] + 1.8, P20[2]]} area={[2.8, 2.8, 1]} n={18} color="#ffffff" size={0.12} rise={2} o={1 - pop} seed={20} /> : null}
    {squeeze > 0 ? <SGlow p={toWorld(P20, [0.2 * HH, 0.44 * HH, 0.3], cam)} r={0.6 + squeeze * 1.2} color="#7fefff" o={0.8 * squeeze} /> : null}
    <Hero p={P20} sy={P20[1]} f={f} pose={{ back: !front, mood: stun ? "shock" : t < 94.3 ? "shock" : t < 96 ? "angry" : "grin", squash: stun ? -0.06 : 0, lookX: front ? -0.3 : 0, armR: [0.2, 0.44], armL: [-0.22, 0.42], armLK: 0.4, nerv: stun ? 0.2 : 0 }} />
    <HeldKey P={P20} arm={[0.2, 0.44]} ang={front ? 1.0 : 1.2} glow={0.5 + squeeze * 1.5} flip={!front} s={0.55 * (1 - squeeze * 0.08)} />
    <ShoulderDragon P={P20} cam={cam} f={f} back={!front} pose={{ mood: t > 91.6 && t < 94 ? "scared" : "wow", flap: 0.3, lookX: front ? -1 : 0 }} />
    {void Shadow}
  </>);
};

/* ---------- end card overlay (title from 96.1, SUBSCRIBE card in the last 2.7 s) ---------- */
export const EndCard: React.FC<{ t: number }> = ({ t }) => {
  if (t < 96.0) return null;
  const words = ["WHAT", "WOULD", "YOU", "DRAW", "NEXT?"], wt = [96.1, 96.23, 96.33, 96.44, 96.64];
  const card = interpolate(t, [97.3, 97.65], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.back(1.8)) });
  return (<AbsoluteFill style={{ pointerEvents: "none" }}>
    <AbsoluteFill style={{ background: `rgba(10,8,40,${0.28 * clamp((t - 96.0) / 0.4)})` }} />
    <div style={{ position: "absolute", top: 250, left: 40, right: 40, textAlign: "center", fontFamily: "Inter, Arial", fontWeight: 900, lineHeight: 1.02 }}>
      {words.map((w, i) => { const k = interpolate(t, [wt[i], wt[i] + 0.18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.back(2.6)) }); const big = i >= 3;
        return <span key={w} style={{ display: "inline-block", margin: "0 18px", fontSize: big ? 190 : 150, color: big ? "#ffd23a" : "#ffffff", WebkitTextStroke: "20px #0b0d1a", paintOrder: "stroke fill", transform: `scale(${k}) rotate(${(i % 2 ? 2 : -2) * k}deg)`, opacity: k > 0 ? 1 : 0, textShadow: "0 14px 0 rgba(0,0,0,.35), 0 0 40px rgba(127,239,255,.55)" }}>{w}</span>; })}
    </div>
    {card > 0 ? <div style={{ position: "absolute", left: 110, right: 110, top: 1430, height: 250, transform: `translateY(${(1 - card) * 420}px) scale(${0.85 + 0.15 * card})`, background: "linear-gradient(180deg,#ff3b3b,#c8101e)", borderRadius: 46, border: "12px solid #0b0d1a", boxShadow: "0 18px 0 rgba(0,0,0,.35)", display: "flex", alignItems: "center", justifyContent: "center", gap: 34 }}>
      <div style={{ fontFamily: "Inter, Arial", fontWeight: 900, fontSize: 82, lineHeight: 0.98, color: "#fff", WebkitTextStroke: "10px #0b0d1a", paintOrder: "stroke fill", textAlign: "left" }}>SUBSCRIBE<br /><span style={{ color: "#ffd23a" }}>FOR MORE</span></div>
      <div style={{ width: 150, height: 110, background: "#fff", borderRadius: 30, border: "9px solid #0b0d1a", display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${1 + 0.06 * Math.sin(t * 8)})` }}><div style={{ width: 0, height: 0, borderTop: "26px solid transparent", borderBottom: "26px solid transparent", borderLeft: "44px solid #e5233a", marginLeft: 10 }} /></div>
    </div> : null}
  </AbsoluteFill>);
};
void Crystal; void armForTip; void FPS;
