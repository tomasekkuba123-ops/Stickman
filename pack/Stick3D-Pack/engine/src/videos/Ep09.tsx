// EP09 "What If the Moon Disappeared?" — 1080x1920, 30 fps, 38.000 s (1140 frames). v4 workflow (CLAUDE.md). Loops: last frame = first frame.
import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, interpolate, Easing } from "remotion";
import { Scene, FPS } from "./ep02/common";
import { SafeGrade } from "../kit/world";
import { WordCaptions, CaptionData } from "../kit/captions";
import { QC } from "../kit/qc";
import * as S from "./ep09/scenes";
import CAP from "../../public/ep09/captions.json";

export const SECONDS = 38;
export const CUTS = [0, 3.0, 9.7, 16.4, 25.0, 32.7, 38];
const SC = [S.S1, S.S2, S.S3, S.S4, S.S5, S.S6];
const BG = ["#122060", "#0a1240", "#122060", "#122060", "#05060f", "#122060"];
const TR = ["ghost", "flash", "whip", "whip", "zoom", "flash"] as const;

/* HOOK text: on screen at frame 0 (and again on the last frames so the Short loops seamlessly) */
const WhatIf: React.FC<{ t: number }> = ({ t }) => {
  if (QC) return null; const k = t < 3 ? 1 - seg(t, 2.4, 2.85) : seg(t, 37.25, 37.7); if (k <= 0) return null;
  const pop = t < 3 ? 1 + 0.06 * Math.sin(t * 7) : interpolate(t, [37.25, 37.55, 37.7], [0.6, 1.08, 1], { extrapolateRight: "clamp" });
  return <div style={{ position: "absolute", top: 170, left: 0, right: 0, textAlign: "center", fontFamily: "Inter, Arial", fontWeight: 900, fontSize: 190, lineHeight: 1, color: "#ffd23a", WebkitTextStroke: "24px #0b0d1a", paintOrder: "stroke fill", transform: `scale(${pop}) rotate(-4deg)`, opacity: k, textShadow: "0 18px 0 rgba(0,0,0,.4)" }}>WHAT IF?</div>;
};
const seg = (t: number, a: number, b: number) => Math.max(0, Math.min(1, (t - a) / (b - a)));
/* "much, much darker": darkness closes in around the flashlight-lit face */
const Dark: React.FC<{ t: number }> = ({ t }) => { if (QC || t < 7.3 || t > 9.75) return null; const k = 0.5 * seg(t, 7.35, 7.6) + 0.35 * seg(t, 7.9, 8.2);
  return <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 50% 34%, rgba(0,0,8,0) 0, rgba(0,0,8,0) 230px, rgba(0,0,8,${k}) 470px)` }} />; };

export const Ep09: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Audio src={staticFile("ep09/mix.wav")} />
      {SC.map((Sc, i) => <Scene key={i} first={i === 0} start={CUTS[i]} end={CUTS[i + 1]} bg={BG[i]} trans={TR[i]}>{(c) => <Sc {...c} />}</Scene>)}
      <Dark t={t} />
      <SafeGrade k={0.38} />
      <WhatIf t={t} />
      <WordCaptions data={CAP as CaptionData} from={0.25} until={37.2} size={108} />
    </AbsoluteFill>
  );
};
