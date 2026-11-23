// EP09 "What If the Moon Disappeared?" — 1080x1920, 30 fps, 38.000 s (1140 frames). v4 workflow (CLAUDE.md). Loops: last frame = first frame.
// v18 (round 3): final rendered at 2160x3840 (--scale=2) and downscaled with Lanczos (pipeline/final4k.sh); vector front bed in every shot;
// no blur on the character (whip-pans use motion streaks); fixed-size captions in the 62-72 % safe zone.
import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, interpolate, getInputProps } from "remotion";
import { setHeroRes } from "../kit/character";
import { setTexK } from "../style/set3d";
import { Scene, FPS, Streaks } from "./ep02/common";
import { WordCaptions, CaptionData } from "../kit/captions";
import { QC } from "../kit/qc";
import * as N from "./ep09/scenes18";
import { Grain, Vignette } from "../kit/diorama";
import { FrontBed, BedKind } from "../kit/frontbed";
import CAP from "../../public/ep09/captions.json";

export const SECONDS = 38;
// low-res previews (--props '{"lowres":true}'): smaller hero canvas + 1x textures (same look, faster)
if ((getInputProps() as { lowres?: boolean }).lowres) { setHeroRes(1024); setTexK(1); }
// 7 scenes — 1 hook, 2 dark night, 3 ocean, 4 animals, 5 Earth, 6 seasons (one spot, ~4 s), 7 ending (= hook framing)
export const CUTS = [0, 3.0, 9.7, 16.4, 25.0, 28.65, 32.7, 38];
const SC = [N.S1, N.S2, N.S3, N.S4, N.S5, N.S6, N.S7];
const BG = ["#0f1a52", "#03061a", "#0b1548", "#0a1240", "#020210", "#7ab8ff", "#0f1a52"];
const TR = ["cut", "cut", "whip2", "whip2", "iris", "whip2", "cut"] as const;
const seg = (t: number, a: number, b: number) => Math.max(0, Math.min(1, (t - a) / (b - a)));
const BED_SEASON: BedKind[] = ["spring", "summer", "autumn", "winter"];
/* vector front bed (grass, rocks, flowers, shells...) filling the bottom of every shot, parallax with the camera drift */
const Bed: React.FC<{ t: number }> = ({ t }) => {
  if (QC) return null; const px = Math.sin(t * 0.35) * 22 - (t % 6) * 3;
  if (t < 3.0 || t >= 32.7) return <FrontBed t={t} kind="meadow" px={px} seed={1} dim={t < 3 ? 0.35 * seg(t, 1.3, 2.4) : 0.35 * (1 - seg(t, 36.7, 37.4))} />;
  if (t < 9.7) return <FrontBed t={t} kind="night" px={px} seed={2} light={{ x: N.beamScreenX(t), k: t < 7 ? 0.55 * seg(t, 3.72, 3.85) : 0 }} dim={t >= 7.3 ? 0.2 : 0} />;
  if (t < 16.4) return <FrontBed t={t} kind="beach" px={px} seed={3} />;
  if (t < 25.0) return t >= 19.05 && t < 22.4 ? <FrontBed t={t} kind="beach" px={px} seed={4} /> : <FrontBed t={t} kind="meadow" px={px} seed={5} />;
  if (t < 28.65) return null; // space: the rock platform fills the bottom
  if (t < 32.7) { const [, season, chaos] = N.seasonAt(t); return <FrontBed t={t} kind={BED_SEASON[season]} px={0} seed={6} snow={season === 3 ? 1 : chaos === 1 ? 0.5 : 0} dim={chaos === 2 ? 0.3 : 0} />; }
  return null;
};
/* HOOK text: on screen at frame 0 (and again on the last frames so the Short loops seamlessly) */
const WhatIf: React.FC<{ t: number }> = ({ t }) => {
  if (QC) return null; const k = t < 3 ? 1 - seg(t, 2.4, 2.85) : seg(t, 37.25, 37.7); if (k <= 0) return null;
  const pop = t < 3 ? 1 + 0.06 * Math.sin(t * 7) : interpolate(t, [37.25, 37.55, 37.7], [0.6, 1.08, 1], { extrapolateRight: "clamp" });
  return <div style={{ position: "absolute", top: 150, left: 0, right: 0, textAlign: "center", fontFamily: "Inter, Arial", fontWeight: 900, fontSize: 180, lineHeight: 1, color: "#ffd23a", WebkitTextStroke: "24px #0b0d1a", paintOrder: "stroke fill", transform: `scale(${pop}) rotate(-4deg)`, opacity: k, textShadow: "0 18px 0 rgba(0,0,0,.4)" }}>WHAT IF?</div>;
};
/* season changes: whip-pan motion streaks (no blur on the character) */
const SeasonWhip: React.FC<{ t: number }> = ({ t }) => { if (QC) return null; let k = 0, dir = 1; for (const [c] of N.SEASON_CUTS.slice(1)) { const d = t - c; if (d > -0.08 && d < 0.12) { k = Math.max(k, 1 - Math.abs(d) / (d < 0 ? 0.08 : 0.12)); dir = d < 0 ? 1 : -1; } } if (k <= 0) return null;
  return <Streaks k={k} dir={dir} f={useCurrentFrame()} />; };
/* hook: grade drops after the Moon vanishes (the hero keeps his rim light) */
const HookGrade: React.FC<{ t: number }> = ({ t }) => { if (QC) return null; const k = t < 3.05 ? seg(t, 1.35, 2.4) : t >= 32.7 ? 1 - seg(t, 36.7, 37.3) : 0; if (k <= 0) return null;
  return <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: `linear-gradient(rgba(4,8,40,${0.3 * k}), rgba(4,8,40,${0.12 * k}) 70%, rgba(4,8,40,0))` }} />; };
/* "much, much darker": darkness closes in around him, the ground stays faintly visible */
const Dark: React.FC<{ t: number }> = ({ t }) => { if (QC || t < 7.3 || t > 9.75) return null; const k = 0.32 * seg(t, 7.35, 7.6) + 0.22 * seg(t, 7.9, 8.2);
  return <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: `radial-gradient(ellipse 420px 760px at 50% 52%, rgba(0,0,8,0) 0, rgba(0,0,8,0) 55%, rgba(0,0,8,${k}) 100%)` }} />; };

export const Ep09: React.FC = () => {
  const f = useCurrentFrame(), t = f / FPS;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Audio src={staticFile("ep09/mix.wav")} />
      {SC.map((Sc, i) => <Scene key={i} first={i === 0} start={CUTS[i]} end={CUTS[i + 1]} bg={BG[i]} trans={TR[i]} exit={TR[i + 1]}>{(c) => <Sc {...c} />}</Scene>)}
      <Bed t={t} />
      <Dark t={t} />
      <HookGrade t={t} />
      <SeasonWhip t={t} />
      {!QC ? <Vignette k={t >= 25 && t < 28.65 ? 0.5 : 0.36} col={t >= 25 && t < 28.65 ? "2,2,16" : "5,8,30"} /> : null}
      {!QC ? <Grain f={f} o={0.05} /> : null}
      <WhatIf t={t} />
      <WordCaptions data={CAP as CaptionData} from={0.25} until={37.2} size={96} fixed />
    </AbsoluteFill>
  );
};
