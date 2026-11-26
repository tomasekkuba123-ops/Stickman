// EP14 "Stickman's bed just woke up" — 1080x1920, 30 fps, 35.000 s (1050 frames). v4 workflow (CLAUDE.md), v20 kit.
// Living-objects series (EP10-EP14). Loops: the ending is the hook framing in the bedroom, last frame = first frame.
import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, interpolate, getInputProps } from "remotion";
import { setHeroRes } from "../kit/character";
import { setTexK } from "../style/set3d";
import { Scene, FPS } from "./ep02/common";
import { WordCaptions, CaptionData } from "../kit/captions";
import { QC } from "../kit/qc";
import { SpeedLines } from "../kit/fx";
import * as N from "./ep14/scenes";
import { Grain, Vignette } from "../kit/diorama";
import CAP from "../../public/ep14/captions.json";

export const SECONDS = 35;
if ((getInputProps() as { lowres?: boolean }).lowres) { setHeroRes(1024); setTexK(1); }
// 9 scenes: 1 hook (bed wakes), 2 bounce to the ceiling, 3 gallops down the stairs, 4 playground chase, 5 trampoline, 6 draws a pillow, 7 flop + yawn, 8 tuck in + asleep (sunset), 9 ending (toothbrush sings, = hook framing)
export const CUTS = [0, 3.85, 7.55, 10.5, 14.05, 17.75, 21.65, 25.45, 29.35, 35];
const SC = [N.S1, N.S2, N.S3, N.S4, N.S5, N.S6, N.S7, N.S8, N.S9];
const BG = ["#ffd9b8", "#ffd9b8", "#bfe2d0", "#8ccaff", "#8ccaff", "#8ccaff", "#8ccaff", "#ffb88a", "#ffd9b8"];
const TR = ["cut", "cut", "cut", "cut", "cut", "cut", "cut", "cut", "iris"] as const;
const seg = (t: number, a: number, b: number) => Math.max(0, Math.min(1, (t - a) / (b - a)));
/* HOOK text at frame 0 and again on the last frames (loop) */
const WhatIf: React.FC<{ t: number }> = ({ t }) => {
  if (QC) return null; const k = t < 3 ? 1 - seg(t, 2.3, 2.75) : seg(t, 34.4, 34.75); if (k <= 0) return null;
  const pop = t < 3 ? 1 + 0.06 * Math.sin(t * 7) : interpolate(t, [34.4, 34.65, 34.75], [0.6, 1.08, 1], { extrapolateRight: "clamp" });
  return <div style={{ position: "absolute", top: 150, left: 0, right: 0, textAlign: "center", fontFamily: "Inter, Arial", fontWeight: 900, fontSize: 180, lineHeight: 1, color: "#ffd23a", WebkitTextStroke: "24px #0b0d1a", paintOrder: "stroke fill", transform: `scale(${pop}) rotate(-4deg)`, opacity: k, textShadow: "0 18px 0 rgba(0,0,0,.4)" }}>WHAT IF?</div>;
};
/* speed streaks during the street chase */
const Rush: React.FC<{ t: number }> = ({ t }) => { if (QC || t < 10.7 || t >= 13.7) return null; return <SpeedLines t={t} k={0.25} mode="side" color="rgba(255,255,255,0.55)" />; };

export const Ep14: React.FC = () => {
  const f = useCurrentFrame(), t = f / FPS;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Audio src={staticFile("ep14/mix.wav")} />
      {SC.map((Sc, i) => <Scene key={i} first={i === 0} start={CUTS[i]} end={CUTS[i + 1]} bg={BG[i]} trans={TR[i]} exit={TR[i + 1]}>{(c) => <Sc {...c} />}</Scene>)}
      <Rush t={t} />
      {!QC ? <Vignette k={0.3} col="5,8,30" /> : null}
      {!QC ? <Grain f={f} o={0.04} /> : null}
      <WhatIf t={t} />
      <WordCaptions data={CAP as CaptionData} from={0.25} until={34.3} size={96} fixed />
    </AbsoluteFill>
  );
};
