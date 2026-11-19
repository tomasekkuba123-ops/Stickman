// EP03 REMAKE "What if Stickman drew a rocket" — full 3D (EP02 style), 1080x1920, 30 fps, 3000 frames, voice untouched.
import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, interpolate, Easing } from "remotion";
import { Grade } from "../style/kit";
import { QC } from "../kit/qc";
import { Scene, FPS, clamp } from "./ep02/common";
import { S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14, S15, S16, S17, S18, S19, S20, S21, S22 } from "./ep03r/scenes";
import WORDS from "../../public/ep03/words.json";
import SCRIPT from "../../public/ep03/script.json";

export const CUTS = [0, 2.45, 4.95, 10.1, 14.25, 19.5, 23.4, 26.1, 35.8, 39.8, 44.4, 49.9, 55.0, 58.2, 61.1, 64.2, 68.6, 76.5, 79.8, 85.3, 92.4, 95.7, 100];
const SC = [S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11, S12, S13, S14, S15, S16, S17, S18, S19, S20, S21, S22];
const BG = ["#8ccaff", "#f0a870", "#f0a870", "#f0a870", "#f0a870", "#f0a870", "#ff9a6a", "#183c9a", "#05051a", "#05051a", "#05051a", "#120a3a", "#120a3a", "#120a3a", "#120a3a", "#120a3a", "#120a3a", "#120a3a", "#120a3a", "#8a2a6a", "#8a2a6a", "#8a2a6a"];
const TR = ["ghost", "whipL", "whip", "flash", "whip", "flash", "whip", "flash", "whip", "whipL", "flash", "whip", "flash", "whip", "whipL", "whip", "flash", "whip", "flash", "flash", "whip", "whip"] as const;

/* captions: 1–2 words, word-synced, key words yellow; high/low per time so they never sit on faces */
const KEY = new Set(["ROCKET", "LAUNCHED", "FIN", "FINS", "WINDOW", "SHOOK", "SMOKE", "THREE", "TWO", "ONE", "LADDER", "CLOUDS", "DARK", "BLUE", "BLACK", "STARS", "COUGHED", "EMPTY", "PANICKED", "PENCIL", "GAS", "STATION", "MOON", "ROBOT", "RECEIPT", "THIRTY", "MILLION", "DOLLARS", "COIN", "BIGGER", "CRATER", "ENORMOUS", "GLOWING", "EYES", "WHALE", "SWALLOWED", "WHOLE", "WARM", "SATELLITES", "SMILED", "OUT"]);
type G = { words: string[]; a: number; e: number };
const groups: G[] = (() => { const g: G[] = []; let cur: number[] = [];
  const flush = () => { if (cur.length) { g.push({ words: cur.map((i) => String(SCRIPT[i]).replace(/[.,!?;:…]+$/, "").toUpperCase()), a: WORDS[cur[0]].start, e: WORDS[cur[cur.length - 1]].end }); cur = []; } };
  WORDS.forEach((_, i) => { cur.push(i); if (cur.length === 2 || /[.,!?;:…]$/.test(String(SCRIPT[i])) || (WORDS[i + 1] && WORDS[i + 1].start - WORDS[i].end > 0.35)) flush(); }); flush(); return g; })();
// caption band per time window: "low" (y 1450) or "high" (y 230)
const HIGH: [number, number][] = [[4.95, 14.25], [19.5, 23.4], [44.4, 45.95], [49.9, 55.0], [58.2, 68.6], [76.5, 78.2], [85.3, 89.4]];
const Captions: React.FC<{ until: number }> = ({ until }) => {
  const f = useCurrentFrame(), t = f / FPS; if (QC || t >= until) return null;
  const idx = groups.findIndex((g, i) => t >= g.a - 0.02 && t < (groups[i + 1]?.a ?? 999) - 0.02); if (idx < 0) return null; const g = groups[idx];
  if (t > g.e + 0.7) return null;
  const sc = interpolate(t - g.a, [0, 0.12], [0.75, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.back(2.6)) });
  const high = HIGH.some(([a, b]) => t >= a && t < b);
  return <div style={{ position: "absolute", left: 40, right: 40, top: high ? 230 : 1450, textAlign: "center", fontFamily: "Inter, Arial", fontWeight: 900, fontSize: 128, lineHeight: 1.05, WebkitTextStroke: "18px #000", paintOrder: "stroke fill", transform: `scale(${sc})`, textShadow: "0 12px 0 rgba(0,0,0,.35)", letterSpacing: 1 }}>
    {g.words.map((w, i) => <span key={i} style={{ color: KEY.has(w) ? "#ffd23a" : "#fff" }}>{(i ? " " : "") + w}</span>)}</div>;
};
// hook word on frame 1
const Hook: React.FC<{ t: number }> = ({ t }) => { if (QC || t > 2.4) return null; const k = 1 - clamp((t - 2.0) / 0.4), s = 1 + 0.04 * Math.sin(t * 8);
  return <div style={{ position: "absolute", top: 170, left: 0, right: 0, textAlign: "center", fontFamily: "Inter, Arial", fontWeight: 900, fontSize: 210, color: "#ffd23a", WebkitTextStroke: "24px #0b0d1a", paintOrder: "stroke fill", transform: `scale(${s}) rotate(-4deg)`, opacity: k, textShadow: "0 16px 0 rgba(0,0,0,.35)" }}>LIFTOFF!</div>; };
const EndCard: React.FC<{ t: number }> = ({ t }) => {
  if (QC || t < 95.75) return null;
  const words = ["WHAT", "WOULD", "YOU", "DRAW", "TO", "GET", "OUT?"], wt = [95.74, 96.19, 96.43, 96.53, 96.78, 96.85, 97.03];
  const card = interpolate(t, [97.5, 97.85], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.back(1.8)) });
  return (<AbsoluteFill style={{ pointerEvents: "none" }}>
    <div style={{ position: "absolute", top: 190, left: 30, right: 30, textAlign: "center", fontFamily: "Inter, Arial", fontWeight: 900, lineHeight: 1.0 }}>
      {words.map((w, i) => { const k = interpolate(t, [wt[i], wt[i] + 0.18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.back(2.6)) }); const big = i === 3 || i === 6;
        return <span key={i} style={{ display: "inline-block", margin: "0 14px", fontSize: big ? 176 : 132, color: big ? "#ffd23a" : "#ffffff", WebkitTextStroke: "20px #0b0d1a", paintOrder: "stroke fill", transform: `scale(${k}) rotate(${(i % 2 ? 2 : -2) * k}deg)`, opacity: k > 0 ? 1 : 0, textShadow: "0 12px 0 rgba(0,0,0,.35)" }}>{w}</span>; })}
    </div>
    {card > 0.002 ? <div style={{ position: "absolute", left: 110, right: 110, top: 1470, height: 250, transform: `translateY(${(1 - card) * 420}px) scale(${0.85 + 0.15 * card})`, background: "linear-gradient(180deg,#ff3b3b,#c8101e)", borderRadius: 46, border: "12px solid #0b0d1a", boxShadow: "0 18px 0 rgba(0,0,0,.35)", display: "flex", alignItems: "center", justifyContent: "space-around", padding: "0 30px" }}>
      <div style={{ fontFamily: "Inter, Arial", fontWeight: 900, fontSize: 82, lineHeight: 0.98, color: "#fff", WebkitTextStroke: "10px #0b0d1a", paintOrder: "stroke fill", textAlign: "left" }}>SUBSCRIBE<br /><span style={{ color: "#ffd23a" }}>FOR MORE</span></div>
      <div style={{ width: 150, height: 110, background: "#fff", borderRadius: 30, border: "9px solid #0b0d1a", display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${1 + 0.06 * Math.sin(t * 8)})` }}><div style={{ width: 0, height: 0, borderTop: "26px solid transparent", borderBottom: "26px solid transparent", borderLeft: "44px solid #e5263a", marginLeft: 10 }} /></div>
    </div> : null}
  </AbsoluteFill>);
};

export const Ep03R: React.FC = () => {
  const f = useCurrentFrame(), t = f / FPS;
  const tint = t < 23.4 ? "rgba(255,170,90,.05)" : t < 35.8 ? "rgba(80,120,255,.04)" : t < 49.9 ? "rgba(40,30,140,.06)" : t < 85.3 ? "rgba(120,60,200,.05)" : "rgba(255,90,170,.05)";
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Audio src={staticFile("ep03r/mix.wav")} />
      {SC.map((S, i) => <Scene key={i} first={i === 0} start={CUTS[i]} end={CUTS[i + 1]} bg={BG[i]} trans={TR[i]}>{(c) => <S {...c} />}</Scene>)}
      <Grade t={t} shaft={false} tint={tint} />
      <Hook t={t} />
      <Captions until={95.7} />
      <EndCard t={t} />
    </AbsoluteFill>
  );
};
