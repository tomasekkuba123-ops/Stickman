// EP09 "What If the Moon Disappeared?" — 1080x1920, 30 fps, 38.000 s (1140 frames). v4 workflow (CLAUDE.md). Loops: last frame = first frame.
import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, interpolate, Easing } from "remotion";
import { Scene, FPS } from "./ep02/common";
import { SafeGrade } from "../kit/world";
import { WordCaptions, CaptionData } from "../kit/captions";
import { QC } from "../kit/qc";
import * as S from "./ep09/scenes";
import * as N from "./ep09/scenes17";
import { ForeFrame, Grain, Vignette } from "../kit/diorama";
import CAP from "../../public/ep09/captions.json";

export const SECONDS = 38;
// v17: 7 scenes — 1 hook, 2 dark night, 3 ocean, 4 animals, 5 Earth, 6 seasons, 7 ending (= hook set). Clean transitions only (cut / whip / iris).
export const CUTS = [0, 3.0, 9.7, 16.4, 25.0, 29.25, 32.7, 38];
const SC = [N.S1, N.S2, N.S3, N.S4, N.S5, N.S6, N.S7];
const BG = ["#0f1a52", "#03061a", "#0b1548", "#0a1240", "#020210", "#7ab8ff", "#0f1a52"];
const TR = ["cut", "cut", "whip2", "whip2", "iris", "whip2", "cut"] as const; // whip2 = clean whip-pan (no seam, no double exposure)
/* 2D layers above the 3D canvas per scene: foreground framing (blurred, parallax + wind) */
const Fore: React.FC<{ t: number }> = ({ t }) => {
  if (QC) return null; const px = Math.sin(t * 0.35) * 26 - (t % 6) * 3;
  if (t < 3.0 || t >= 32.7) return <ForeFrame t={t} kind={["grass", "flowers", "branchR"]} tone="#0b1830" tone2="#102340" rim="rgba(185,205,255,0.6)" blur={6} px={px} h={0.85} />;
  if (t >= 9.7 && t < 16.4) return <ForeFrame t={t} kind={["seaweed", "rocks", "crab"]} tone="#1a2446" tone2="#222f55" rim="rgba(200,215,255,0.5)" blur={5} px={px} h={0.6} />;
  if (t >= 3.0 && t < 9.7) return <ForeFrame t={t} kind={["grass", "branchL"]} tone="#050a1a" tone2="#08102a" rim="rgba(150,170,255,0.35)" blur={6} px={px} h={0.8} />;
  if (t >= 16.4 && t < 25.0) return t >= 20.3 && t < 22.4 ? <ForeFrame t={t} kind={["seaweed", "rocks"]} tone="#1a2446" tone2="#222f55" rim="rgba(200,215,255,0.5)" blur={5} px={px} h={0.6} />
    : <ForeFrame t={t} kind={["grass", "flowers", "branchL"]} tone="#0a1a2a" tone2="#10263a" rim="rgba(170,200,255,0.5)" blur={6} px={px} h={0.8} />;
  if (t >= 29.25 && t < 32.7) return <ForeFrame t={t} kind={["grass", "flowers"]} tone="#2f6a3a" tone2="#3f8a4a" rim="rgba(255,255,255,0.35)" blur={6} px={px} h={0.7} />;
  if (t >= 25.0 && t < 29.25) return <ForeFrame t={t} kind={["debris"]} tone="#2a2244" tone2="#2a2244" rim="rgba(255,220,180,0.55)" blur={8} px={px} />;
  return null;
};

/* HOOK text: on screen at frame 0 (and again on the last frames so the Short loops seamlessly) */
const WhatIf: React.FC<{ t: number }> = ({ t }) => {
  if (QC) return null; const k = t < 3 ? 1 - seg(t, 2.4, 2.85) : seg(t, 37.25, 37.7); if (k <= 0) return null;
  const pop = t < 3 ? 1 + 0.06 * Math.sin(t * 7) : interpolate(t, [37.25, 37.55, 37.7], [0.6, 1.08, 1], { extrapolateRight: "clamp" });
  return <div style={{ position: "absolute", top: 170, left: 0, right: 0, textAlign: "center", fontFamily: "Inter, Arial", fontWeight: 900, fontSize: 190, lineHeight: 1, color: "#ffd23a", WebkitTextStroke: "24px #0b0d1a", paintOrder: "stroke fill", transform: `scale(${pop}) rotate(-4deg)`, opacity: k, textShadow: "0 18px 0 rgba(0,0,0,.4)" }}>WHAT IF?</div>;
};
const seg = (t: number, a: number, b: number) => Math.max(0, Math.min(1, (t - a) / (b - a)));
/* "much, much darker": darkness closes in around the flashlight-lit face */
const SeasonWhip: React.FC<{ t: number }> = ({ t }) => { if (QC) return null; let k = 0; for (const [c] of N.SEASON_CUTS.slice(1)) { const d = t - c; if (d > -0.07 && d < 0.1) k = Math.max(k, 1 - Math.abs(d) / (d < 0 ? 0.07 : 0.1)); } if (k <= 0) return null;
  return <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backdropFilter: `blur(${(k * 22).toFixed(1)}px)`, WebkitBackdropFilter: `blur(${(k * 22).toFixed(1)}px)` }} />; };
const HookGrade: React.FC<{ t: number }> = ({ t }) => { if (QC) return null; const k = t < 3.05 ? seg(t, 1.35, 2.4) : t >= 32.7 ? 1 - seg(t, 36.7, 37.3) : 0; if (k <= 0) return null;
  return <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: `radial-gradient(ellipse 330px 560px at 40% 37%, rgba(2,4,22,0) 70%, rgba(2,4,22,${0.62 * k}) 100%), linear-gradient(rgba(4,8,40,${0.35 * k}), rgba(4,8,40,${0.35 * k}))`, WebkitMaskImage: "radial-gradient(ellipse 300px 520px at 40% 37%, transparent 75%, black 100%)" }} />; };
const Dark: React.FC<{ t: number }> = ({ t }) => { if (QC || t < 7.3 || t > 9.75) return null; const k = 0.5 * seg(t, 7.35, 7.6) + 0.35 * seg(t, 7.9, 8.2);
  return <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 50% 24%, rgba(0,0,8,0) 0, rgba(0,0,8,0) 300px, rgba(0,0,8,${k}) 620px)` }} />; };

export const Ep09: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Audio src={staticFile("ep09/mix.wav")} />
      {SC.map((Sc, i) => <Scene key={i} first={i === 0} start={CUTS[i]} end={CUTS[i + 1]} bg={BG[i]} trans={TR[i]} exit={TR[i + 1]}>{(c) => <Sc {...c} />}</Scene>)}
      <Dark t={t} />
      <HookGrade t={t} />
      <SeasonWhip t={t} />
      <Fore t={t} />
      {!QC ? <Vignette k={t >= 25 && t < 29.25 ? 0.55 : 0.42} col={t >= 25 && t < 29.25 ? "2,2,16" : "5,8,30"} /> : null}
      {!QC ? <Grain f={useCurrentFrame()} o={0.06} /> : null}
      <WhatIf t={t} />
      <WordCaptions data={CAP as CaptionData} from={0.25} until={37.2} size={100} />
    </AbsoluteFill>
  );
};
