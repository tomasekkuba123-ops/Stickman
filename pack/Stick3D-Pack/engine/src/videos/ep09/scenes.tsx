// EP09 "What If the Moon Disappeared?" — v4 workflow: puppet v3, Kokoro voice, Whisper timing, Rhubarb lip sync, CMU mocap, Kenney/Poly Haven CC0 sets, depth layers.
import React from "react";
import { Cam, Key } from "../../style/extra";
import { V3 } from "../../style/kit";
import { SGlow } from "../../style/sky";
import { World, FallingLeaves, Butterflies, Fireflies, DustMotes, TwinkleStars } from "../../kit/world";
import { Stickman, LipCue, ActionName } from "../../kit/character";
import { MoSpec } from "../../kit/mocap";
import { Face, RigOut } from "../../style/stickman";
import { heroShot, foregroundShot } from "../../kit/camera";
import { Critter } from "../../kit/creatures";
import { KModel, KScatter, DepthPass } from "../../kit/envlib";
import { Moon, Earth, NightHill, Beach, SeasonMeadow, FlashBeam } from "../../kit/sets3";
import MOUTH from "../../../public/ep09/mouth.json";

export type Ctx = { t: number; f: number };
const LIPS = (MOUTH as { mouthCues: LipCue[] }).mouthCues;
const K = (t: number, pos: V3, look: V3, fov = 50): Key => ({ t, pos, look, fov });
const shot = (t: number, list: [number, Key[]][]) => { let k = list[0][1]; for (const [t0, ks] of list) if (t >= t0) k = ks; return k; };
const seg = (t: number, a: number, b: number) => Math.max(0, Math.min(1, (t - a) / (b - a)));
const sm = (x: number) => x * x * (3 - 2 * x);
const beats = (t: number, list: [number, ActionName, Face?][]) => { let b = list[0]; for (const x of list) if (t >= x[0]) b = x; return { action: b[1], t0: b[0], face: b[2] }; };
const faceAt = (t: number, list: [number, Face][]) => { let f = list[0][1]; for (const [a, x] of list) if (t >= a) f = x; return f; };

/* flashlight in the right glove (2D prop) */
const torch = (on: number) => (c: CanvasRenderingContext2D, o: RigOut) => { c.save(); c.translate(o.gloveR[0], o.gloveR[1] - 10); c.rotate(-0.9);
  c.fillStyle = "#3a3f5a"; c.beginPath(); c.roundRect(-14, -70, 28, 92, 8); c.fill(); c.lineWidth = 6; c.strokeStyle = "#1A1A1A"; c.stroke();
  c.fillStyle = "#c9cfe0"; c.beginPath(); c.roundRect(-20, -92, 40, 26, 6); c.fill(); c.stroke(); if (on > 0) { c.fillStyle = `rgba(255,246,190,${on})`; c.beginPath(); c.ellipse(0, -94, 18, 6, 0, 0, Math.PI * 2); c.fill(); } c.restore(); };

/* ================= HOOK + END (same set, same camera = seamless loop) ================= */
const PH: V3 = [0, 0, 0];
export const MOON_P: V3 = [1.9, 6.2, -7];
export const HOOK_CAM: Key[] = [K(0, [1.0, 1.15, 5.6], [0.55, 3.0, -1], 58), K(1.45, [0.95, 1.1, 5.1], [0.55, 3.05, -1], 56)];
const HOOK_POSE = { lookY: -0.9, lookX: 0.35, headTilt: -8 };
export const S1 = ({ t }: Ctx) => { const v = seg(t, 1.0, 1.9);
  const cam = t < 1.5 ? HOOK_CAM : heroShot(PH, 1.5, 3.05, { yaw: -0.25, dist: 4.6, fov: 50, y: 1.9 });
  return (<World preset="night" t={t}>
    <Cam t={t} keys={cam} impacts={[[1.55, 0.02]]} />
    <NightHill t={t} />
    <Moon p={MOON_P} r={1.25} t={t} vanish={v} />
    <Stickman p={PH} t={t} action="idle" lips={LIPS} face={faceAt(t, [[0, "smile"], [1.05, "surprised"], [1.6, "scared"]])} rig={{ ...HOOK_POSE, ...(t < 0.8 ? { blink: 0 } : {}), ...(t > 1.6 ? { lookY: -0.6, lookX: 0.1 } : {}) }} mo={[{ clip: "scared", t0: 1.15, view: "front", amp: 1.3, hold: true }]} blinkSeed={0} />
    <DepthPass focus={t < 1.5 ? 5.4 : 4.6} blur={2.5} />
  </World>); };
export const S6 = ({ t }: Ctx) => { const back = seg(t, 36.75, 37.45);
  const cam = t < 35.0 ? heroShot(PH, 32.7, 35.0, { yaw: 0.05, dist: 4.4, fov: 50, y: 1.85, push: 0.92 }) : t < 36.6 ? heroShot(PH, 35.0, 36.6, { yaw: -0.35, dist: 4.9, fov: 52, y: 1.7 }) : [K(36.6, [1.05, 1.2, 6.2], [0.55, 2.9, -1], 58), K(38.0, [1.0, 1.15, 5.6], [0.55, 3.0, -1], 58)];
  const endPose = t > 37.0 ? HOOK_POSE : { lookY: 0, lookX: 0 };
  return (<World preset="night" t={t}>
    <Cam t={t} keys={cam} />
    <NightHill t={t} />
    <Moon p={MOON_P} r={1.25} t={t} vanish={back > 0 ? 0 : 1} back={back} />
    <Stickman p={PH} t={t} action="idle" lips={LIPS} face={faceAt(t, [[32.7, "think"], [35.0, "confused"], [36.7, "surprised"], [37.3, "smile"]])} rig={{ ...endPose, ...(t > 37.0 ? { blink: 0 } : {}) }} mo={[{ clip: "shrug", t0: 35.1, view: "front", amp: 1.2 }]} />
    <DepthPass focus={t < 36.6 ? 4.6 : 5.6} blur={2.5} />
  </World>); };

/* ================= S2 dark night + flashlight 3.0–9.7 ================= */
const P2: V3 = [0, 0, 0];
const K2: [number, Key[]][] = [[3.0, heroShot(P2, 3.0, 5.0, { yaw: 0.5, dist: 5.2, fov: 52 })], [5.0, [K(5.0, [-1.4, 0.6, 5.4], [0.3, 3.6, -3], 62), K(7.0, [-1.2, 0.55, 5.0], [0.3, 3.9, -3], 62)]], [7.0, heroShot(P2, 7.0, 9.75, { yaw: -0.15, dist: 4.3, fov: 50, y: 1.8, push: 0.9 })]];
export const S2 = ({ t }: Ctx) => { const on = sm(seg(t, 3.75, 3.95)), sweep = seg(t, 5.0, 7.0), chin = t > 7.0;
  const hand: V3 = chin ? [0.1, 1.75, 0.3] : [0.55, 1.35, 0.25], aim: V3 = chin ? [0.0, 2.6, 0.2] : t < 5.0 ? [2.5, 0, -3.5] : [-2 + 5 * sm(sweep), 5 + 2 * Math.sin(sweep * 3), -10];
  return (<World preset="night" t={t} stars={1}>
    <Cam t={t} keys={shot(t, K2)} />
    <NightHill t={t} dim={t > 7.4 ? 1 : 0} fireflies={t < 7.4} />
    <TwinkleStars t={t} n={t > 5 ? 160 : 90} />
    <FlashBeam from={hand} to={aim} on={on * (chin ? 0.6 : 1)} />
    <Stickman p={P2} t={t} action="idle" lips={LIPS} extra={torch(on)}
      face={faceAt(t, [[3.0, "worried"], [4.3, "surprised"], [5.2, "happy"], [7.0, "scared"], [8.0, "worried"]])}
      rig={chin ? { ikR: [60, 560], ikKR: 1, handR: "hold", lookY: -0.2 } : t > 5 ? { lookY: -0.8, lookX: 0.2 } : {}}
      mo={[{ clip: "flashlight", t0: 3.1, view: "front", amp: 1.1 }]} />
    <DepthPass focus={t < 5 ? 5.2 : t < 7 ? 5.4 : 4.3} blur={2.8} />
  </World>); };

/* ================= S3 ocean / tides 9.7–16.4 ================= */
const P3: V3 = [0, 0, 3.4];
const K3: [number, Key[]][] = [[9.7, [K(9.7, [4.6, 1.5, 9.2], [0, 1.4, 1.0], 54), K(11.7, [4.2, 1.5, 8.6], [0, 1.5, 1.0], 54)]], [11.7, [K(11.7, [-1.6, 0.7, 8.2], [0.2, 3.4, 0], 60), K(13.4, [-1.4, 0.7, 7.8], [0.2, 3.7, 0], 60)]], [13.4, foregroundShot(P3, [0, 0.4, -4], 13.4, 16.45, { side: 0.35, dist: 5.3, fov: 56, lift: 1.6 })]];
export const S3 = ({ t }: Ctx) => { const ghost = seg(t, 11.7, 12.2) * (1 - seg(t, 13.6, 14.2)), amp = t < 13.8 ? 1 + 0.25 * ghost : 1.25 - 0.85 * sm(seg(t, 13.8, 15.2));
  const b = beats(t, [[9.7, "idle", "smile"], [11.8, "point", "happy"], [13.5, "idle", "surprised"]]);
  return (<World preset="night" t={t}>
    <Cam t={t} keys={shot(t, K3)} />
    <Beach t={t} amp={amp} />
    {ghost > 0.01 ? <Moon p={[1.5, 7.4, -9]} r={1.3} t={t} back={0.6 + 0.4 * ghost} /> : null}
    <Stickman p={P3} t={t} action={b.action} t0={b.t0} face={b.face} lips={LIPS} rig={b.action === "point" ? { lookY: -0.8 } : { lookX: -0.3 }} mo={[{ clip: "shrug", t0: 14.6, view: "front", amp: 1.3 }]} />
    <DustMotes t={t} n={18} c={[0, 1.6, 2]} area={[8, 2, 4]} />
    <DepthPass focus={t < 11.7 ? 8.6 : t < 13.4 ? 6.0 : 5.3} blur={2.6} />
  </World>); };

/* ================= S4 confused animals 16.4–25.0 ================= */
const P4: V3 = [0, 0, 2];
const OWL: V3 = [2.6, 2.9, -1.2], WOLF: V3 = [-2.4, 0, -0.8];
const K4: [number, Key[]][] = [[16.4, foregroundShot(P4, [OWL[0], OWL[1] + 0.6, OWL[2]], 16.4, 18.4, { side: -0.4, dist: 5.4, fov: 58, k: 0.55 })], [18.4, foregroundShot(P4, [WOLF[0], 1.4, WOLF[2]], 18.4, 20.3, { side: 0.45, dist: 5.4, fov: 58 })],
  [20.3, [K(20.3, [0.6, 1.0, 7.4], [0.2, 1.1, 2.4], 54), K(22.4, [0.4, 0.95, 6.9], [0.2, 1.1, 2.4], 54)]], [22.4, [K(22.4, [0.2, 2.2, 9.6], [0, 1.7, 0.5], 58), K(25.05, [0.2, 2.0, 8.8], [0, 1.7, 0.5], 58)]]];
export const S4 = ({ t }: Ctx) => { const owlK = sm(seg(t, 17.0, 17.6)), wolfHowl = seg(t, 18.5, 18.9) * (1 - seg(t, 19.6, 19.9)), wolfK = sm(seg(t, 19.8, 20.3)), crabK = sm(seg(t, 20.9, 21.3)), shake = t > 23.7 && t < 24.8;
  const b = beats(t, [[16.4, "idle", "smile"], [17.4, "idle", "confused"], [18.4, "idle", "surprised"], [20.3, "idle", "confused"], [22.4, "idle", "worried"], [23.7, "scaredShake", "scared"]]);
  const inBeach = t >= 20.3 && t < 22.4;
  return (<World preset="night" t={t}>
    <Cam t={t} keys={shot(t, K4)} quake={shake ? 0.05 : 0} />
    {inBeach ? <Beach t={t} amp={0.4} tideLine={false} /> : <NightHill t={t} />}
    {!inBeach ? <><KModel name="tree_oak" p={[OWL[0] + 0.9, 0, OWL[2] - 0.6]} s={3.4} tint="#5664a8" t={t} sway={1} />
      <Critter kind="owl" p={OWL} h={2.2} t={t} confused={t > 22.4 ? 1 : owlK} look={-0.5} />
      <Critter kind="wolf" p={WOLF} h={2.6} t={t} howl={wolfHowl} confused={t > 22.4 ? 1 : wolfK} flip /></> : null}
    {(inBeach ? [[-1.2, 3.3], [1.4, 3.1], [0.3, 4.6]] : t > 22.4 ? [[-1.0, 2.9], [1.2, 3.0]] : []).map(([x, z], i) => <Critter key={i} kind="crab" p={[x + Math.sin(t * 2.2 + i) * 0.35, 0, z]} h={0.6} t={t} walk={t * 1.6 + i} confused={inBeach ? crabK : 1} />)}
    <Stickman p={inBeach ? [0, 0, 1.6] : P4} t={t} action={b.action} t0={b.t0} face={b.face} lips={LIPS} rig={t < 18.4 ? { lookX: 0.6, lookY: -0.6 } : t < 20.3 ? { lookX: -0.7 } : inBeach ? { lookY: 0.5 } : {}} mo={inBeach ? [{ clip: "shrug", t0: 21.0, view: "front", amp: 1.3 }] : t < 18.4 ? [{ clip: "shrug", t0: 17.5, view: "front" }] : undefined} />
    <Fireflies t={t} n={12} c={[0, 1.8, 0]} area={[8, 2, 4]} color="#d8ff7a" />
    <DepthPass focus={5.4} blur={2.6} />
  </World>); };

/* ================= S5 Earth wobble + seasons 25.0–32.7 ================= */
const P5: V3 = [-1.2, 0, 2.2], EARTH: V3 = [2.2, 3.2, -6];
const K5: [number, Key[]][] = [[25.0, foregroundShot([P5[0], 1.0, P5[2]], EARTH, 25.0, 27.4, { side: -0.35, dist: 5.4, fov: 56, k: 0.45 })], [27.4, [K(27.4, [-0.9, 1.9, 7.8], [0.4, 2.3, -1.5], 58), K(29.25, [-0.8, 1.9, 7.2], [0.4, 2.3, -1.5], 56)]],
  [29.25, heroShot([0, 0, 0], 29.25, 31.0, { yaw: 0.35, dist: 5.2, fov: 54 })], [31.0, heroShot([0, 0, 0], 31.0, 32.75, { yaw: -0.4, dist: 4.8, fov: 52, y: 1.6 })]];
export const S5 = ({ t }: Ctx) => {
  if (t < 29.25) { const wob = seg(t, 27.6, 29.2), tilt = 23.4 + 30 * Math.sin(t * 7) * sm(wob);
    return (<World preset="space" t={t}>
      <Cam t={t} keys={shot(t, K5)} />
      <Earth p={EARTH} r={2.6} t={t} tilt={tilt} />
      <SGlow p={[-30, 10, -60]} r={14} color="#fff2c0" o={0.6} />
      <Stickman p={[P5[0], 1.0 + Math.sin(t * 1.6) * 0.12, P5[2]]} t={t} action="float" lips={LIPS} shadow={false} face={faceAt(t, [[25, "happy"], [27.6, "surprised"], [28.4, "scared"]])} rig={{ lean: 14 * Math.sin(t * 7) * sm(wob), lookX: 0.6, zeroG: 1 }} />
      <DepthPass focus={5.4} blur={2.0} />
    </World>); }
  const s = (t - 29.25) / 0.42;  // a new season every 0.42 s
  const i = Math.floor(s) % 4;
  return (<World preset={i === 0 ? "morning" : i === 3 ? "sunset" : "day"} t={t}>
    <Cam t={t} keys={shot(t, K5)} impacts={[[29.25 + 0.42 * 2, 0.015], [29.25 + 0.42 * 5, 0.015]]} />
    <SeasonMeadow t={t} s={s} />
    {i === 0 ? <FallingLeaves t={t} n={40} c={[0, 4, 0]} area={[10, 6]} colors={["#ffffff", "#eef6ff"]} /> : i === 1 ? <FallingLeaves t={t} n={24} c={[0, 4, 0]} area={[10, 6]} colors={["#ffb3d1", "#ffd6e6"]} /> : i === 2 ? <Butterflies t={t} n={6} c={[0, 1.6, 0]} /> : <FallingLeaves t={t} n={30} c={[0, 4, 0]} area={[10, 6]} colors={["#f08a2c", "#d9541e", "#f2c14e"]} />}
    <Stickman p={[0, 0, 0]} t={t} action={i === 0 ? "scaredShake" : i === 2 ? "celebrate" : "idle"} t0={29.25 + Math.floor(s) * 0.42} lips={LIPS} face={(["scared", "happy", "laugh", "confused"] as Face[])[i]} mo={i === 3 ? [{ clip: "shrug", t0: 29.25 + Math.floor(s) * 0.42, view: "front" }] : undefined} />
    <DepthPass focus={t < 31 ? 5.2 : 4.8} blur={2.6} />
  </World>); };
