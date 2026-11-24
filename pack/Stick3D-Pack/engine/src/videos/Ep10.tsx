// EP10 "What If Stickman Drew a Pause Button?" — 1080x1920, 30 fps, 39.000 s (1170 frames). v4 workflow (CLAUDE.md). Loops: ends on the hook camera.
import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, interpolate } from "remotion";
import { Scene, FPS } from "./ep02/common";
import { WordCaptions, CaptionData } from "../kit/captions";
import { QC } from "../kit/qc";
import { Grain, Vignette } from "../kit/diorama";
import * as S from "./ep10/scenes";
import CAP from "../../public/ep10/captions.json";

export const SECONDS = 39;
export const CUTS = [0, 3.55, 4.75, 6.7, 9.6, 11.8, 15.4, 18.4, 21.6, 23.95, 25.55, 27.6, 29.4, 31.5, 33.9, 39];
const SC = [S.S1, S.S2, S.S3, S.S4, S.S5, S.S6, S.S7, S.S8, S.S9, S.S10, S.S11, S.S12, S.S13, S.S14, S.S15];
const TR = ["cut", "cut", "cut", "cut", "whip2", "cut", "whip2", "cut", "cut", "cut", "whip2", "cut", "cut", "cut", "whip2"] as const;
const seg = (t: number, a: number, b: number) => Math.max(0, Math.min(1, (t - a) / (b - a)));

/* HOOK text at frame 0 and again on the last frames (seamless loop) */
const WhatIf: React.FC<{ t: number }> = ({ t }) => {
  if (QC) return null; const k = t < 3 ? 1 - seg(t, 2.3, 2.75) : seg(t, 38.15, 38.55); if (k <= 0) return null;
  const pop = t < 3 ? 1 + 0.05 * Math.sin(t * 7) : interpolate(t, [38.15, 38.4, 38.55], [0.6, 1.08, 1], { extrapolateRight: "clamp" });
  return <div style={{ position: "absolute", top: 170, left: 0, right: 0, textAlign: "center", fontFamily: "Inter, Arial", fontWeight: 900, fontSize: 190, lineHeight: 1, color: "#ffd23a", WebkitTextStroke: "24px #0b0d1a", paintOrder: "stroke fill", transform: `scale(${pop}) rotate(-4deg)`, opacity: k, textShadow: "0 18px 0 rgba(0,0,0,.4)" }}>WHAT IF?</div>;
};
/* video-player HUD: "❚❚ PAUSED" while the world is frozen, "▶ PLAY" flash when it restarts */
const HUD: React.FC<{ t: number }> = ({ t }) => {
  if (QC) return null; const paused = S.frozen(t), play = t >= S.RESUME && t < S.RESUME + 1.1;
  if (!paused && !play) return null;
  const inK = paused ? seg(t, S.FREEZE, S.FREEZE + 0.18) : 1 - seg(t, S.RESUME + 0.8, S.RESUME + 1.1), blink = paused ? 0.75 + 0.25 * Math.cos(t * 4) : 1;
  return (<div style={{ position: "absolute", top: 70, left: 60, display: "flex", alignItems: "center", gap: 18, padding: "16px 30px", borderRadius: 26, background: "rgba(10,12,28,0.72)", border: "5px solid rgba(255,255,255,0.9)",
    transform: `scale(${0.7 + 0.3 * inK})`, transformOrigin: "left top", opacity: inK * blink, fontFamily: "Inter, Arial", fontWeight: 900, fontSize: 58, color: "#fff", letterSpacing: 2 }}>
    {paused ? <><span style={{ display: "inline-flex", gap: 9 }}><i style={{ width: 15, height: 50, background: "#fff", borderRadius: 4 }} /><i style={{ width: 15, height: 50, background: "#fff", borderRadius: 4 }} /></span>PAUSED</>
      : <><span style={{ width: 0, height: 0, borderTop: "26px solid transparent", borderBottom: "26px solid transparent", borderLeft: "42px solid #5fd07a" }} />PLAY</>}
  </div>);
};
/* freeze look: a cold flash at the click, then a light blue cast on the world while it is paused (Stickman's head stays white enough) */
const FreezeGrade: React.FC<{ t: number }> = ({ t }) => {
  if (QC) return null; const flash = Math.max(0, 1 - Math.abs(t - S.FREEZE) / 0.18) * 0.55 + Math.max(0, 1 - Math.abs(t - S.RESUME) / 0.2) * 0.45;
  const cast = S.frozen(t) ? 0.1 * seg(t, S.FREEZE, S.FREEZE + 0.3) * (1 - seg(t, S.RESUME - 0.15, S.RESUME)) : 0;
  if (flash <= 0 && cast <= 0 && !(t >= S.FREEZE && t < S.FREEZE + 0.6) && !(t >= S.RESUME && t < S.RESUME + 0.6)) return null;
  const wave = (a: number) => { const u = (t - a) / 0.55; if (u < 0 || u > 1) return null; return <div style={{ position: "absolute", left: 650 - 1400 * u, top: 640 - 1400 * u, width: 2800 * u, height: 2800 * u, borderRadius: "50%", border: `${30 * (1 - u)}px solid rgba(220,235,255,${0.85 * (1 - u)})`, boxShadow: `0 0 60px rgba(170,200,255,${0.6 * (1 - u)})` }} />; };
  return (<><div style={{ position: "absolute", inset: 0, background: `rgba(120,160,255,${cast})`, mixBlendMode: "multiply" }} /><div style={{ position: "absolute", inset: 0, background: `rgba(235,245,255,${flash})` }} />{wave(S.FREEZE)}{wave(S.RESUME)}</>);
};

export const Ep10: React.FC = () => {
  const f = useCurrentFrame(), t = f / FPS;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Audio src={staticFile("ep10/mix.wav")} />
      {SC.map((Sc, i) => <Scene key={i} first={i === 0} start={CUTS[i]} end={CUTS[i + 1]} bg="#8ccaff" trans={TR[i]} exit={TR[i + 1]}>{(c) => <Sc {...c} />}</Scene>)}
      <FreezeGrade t={t} />
      {!QC ? <Vignette k={0.32} col="10,14,40" /> : null}
      {!QC ? <Grain f={f} o={0.05} /> : null}
      <HUD t={t} />
      <WhatIf t={t} />
      <WordCaptions data={CAP as CaptionData} from={0.25} until={38.1} size={100} />
    </AbsoluteFill>
  );
};
