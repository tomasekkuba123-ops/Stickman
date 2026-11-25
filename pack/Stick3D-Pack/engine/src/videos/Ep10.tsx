// EP10 "What If Gravity Disappeared for 10 Seconds?" — 1080x1920, 30 fps, 39.8 s (1194 frames). v4 workflow (CLAUDE.md).
// One fixed spot (SeasonHill autumn), no scene cuts. Loop: last frame = first frame.
import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, interpolate, getInputProps } from "remotion";
import { setHeroRes } from "../kit/character";
import { setTexK } from "../style/set3d";
import { Scene, FPS } from "./ep02/common";
import { WordCaptions, CaptionData } from "../kit/captions";
import { QC } from "../kit/qc";
import * as N from "./ep10/scenes10";
import { Grain, Vignette } from "../kit/diorama";
import { FrontBed } from "../kit/frontbed";
import CAP from "../../public/ep10/captions.json";

export const SECONDS = N.SECONDS;
if ((getInputProps() as { lowres?: boolean }).lowres) { setHeroRes(1024); setTexK(1); }

const seg = (t: number, a: number, b: number) => Math.max(0, Math.min(1, (t - a) / (b - a)));
const Bed: React.FC<{ t: number }> = ({ t }) => { if (QC) return null;
  const px = (Math.sin(t * 0.35) * 22 - (t % 6) * 3) * (t > 37 ? 1 - seg(t, 37.2, 38.3) : 1);
  return <FrontBed t={t} kind="autumn" px={px} seed={1} dim={t < 2.6 ? 0.3 * seg(t, 1.2, 2.3) : 0.3 * (1 - seg(t, 37.5, 38.1))} />; };
/* HOOK text: on screen at frame 0 (and again on the last frames so the Short loops seamlessly) */
const WhatIf: React.FC<{ t: number }> = ({ t }) => { if (QC) return null;
  const k = t < 2.8 ? 1 - seg(t, 2.2, 2.65) : seg(t, 37.55, 38.0); if (k <= 0) return null;
  const pop = t < 2.8 ? 1 + 0.06 * Math.sin(t * 7) : interpolate(t, [37.55, 37.85, 38.0], [0.6, 1.08, 1], { extrapolateRight: "clamp" });
  return <div style={{ position: "absolute", top: 150, left: 0, right: 0, textAlign: "center", fontFamily: "Inter, Arial", fontWeight: 900, fontSize: 170, lineHeight: 1, color: "#ffd23a", WebkitTextStroke: "24px #0b0d1a", paintOrder: "stroke fill", transform: `scale(${pop}) rotate(-4deg)`, opacity: k, textShadow: "0 18px 0 rgba(0,0,0,.4)" }}>WHAT IF?</div>; };

export const Ep10: React.FC = () => {
  const f = useCurrentFrame(), t = f / FPS;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Audio src={staticFile("ep10/mix.wav")} />
      <Scene first start={0} end={SECONDS} bg="#7ab8ff" trans="cut">{(c) => <N.Ep10Scene {...c} />}</Scene>
      <Bed t={t} />
      {!QC ? <Vignette k={0.34} col="30,20,8" /> : null}
      {!QC ? <Grain f={f} o={0.05} loop={SECONDS * FPS} /> : null}
      <WhatIf t={t} />
      <WordCaptions data={CAP as CaptionData} from={0.25} until={39.0} size={96} fixed />
    </AbsoluteFill>
  );
};
