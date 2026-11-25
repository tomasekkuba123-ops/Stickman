// KIDS EP01 "What If Stickman Shrank?" (standalone kids-channel episode) — 1080x1920, 30 fps, 1200 frames (40 s). v4 workflow; loops: frame 1200 == frame 0.
import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, interpolate, getInputProps } from "remotion";
import { setHeroRes } from "../kit/character";
import { setTexK } from "../style/set3d";
import { Scene, FPS, Streaks } from "./ep02/common";
import { WordCaptions, CaptionData } from "../kit/captions";
import { QC } from "../kit/qc";
import { Shot, CUTS, LEN } from "./kids01/scenes";
import { Grain, Vignette } from "../kit/diorama";
import CAP from "../../public/kids01/captions.json";

export const SECONDS = LEN;
if ((getInputProps() as { lowres?: boolean }).lowres) { setHeroRes(1024); setTexK(1); }
const TR = ["cut", "cut", "cut", "cut", "cut", "cut", "cut", "whip2", "cut", "whip2", "cut", "cut", "cut", "cut", "cut"] as const;
const BG = "#8ccaff";
const seg = (t: number, a: number, b: number) => Math.max(0, Math.min(1, (t - a) / (b - a)));
/* HOOK title: on screen at frame 0 and over the last frames (same tau function -> seamless loop) */
const Title: React.FC<{ t: number }> = ({ t }) => {
  if (QC) return null; const tau = t > LEN - 2 ? t - LEN : t; if (tau < -0.6 || tau > 2.8) return null;
  const k = tau < 0 ? seg(tau, -0.6, -0.3) : 1 - seg(tau, 2.45, 2.8);
  const pop = tau < 0 ? interpolate(tau, [-0.6, -0.4, -0.3], [0.6, 1.08, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1 + 0.05 * Math.sin((tau + 0.3) * 6);
  return <div style={{ position: "absolute", top: 150, left: 0, right: 0, textAlign: "center", fontFamily: "Inter, Arial", fontWeight: 900, fontSize: 150, lineHeight: 0.98, color: "#ffd23a", WebkitTextStroke: "22px #0b0d1a", paintOrder: "stroke fill", transform: `scale(${pop}) rotate(-4deg)`, opacity: k, textShadow: "0 16px 0 rgba(0,0,0,.4)" }}>WHAT IF<br /><span style={{ color: "#7ee86a" }}>I SHRANK?</span></div>;
};
/* pop flash at the shrink / grow moments (edges only) */
const Flash: React.FC<{ t: number }> = ({ t }) => { if (QC) return null; let k = 0; for (const c of [4.55, 31.92]) { const d = t - c; if (d > -0.05 && d < 0.25) k = Math.max(k, 1 - Math.abs(d) / (d < 0 ? 0.05 : 0.25)); } if (k <= 0) return null;
  return <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: `radial-gradient(ellipse 520px 900px at 50% 45%, rgba(255,255,255,0) 0, rgba(255,255,255,0) 50%, rgba(255,255,255,${0.55 * k}) 100%)` }} />; };
const Whips: React.FC<{ t: number }> = ({ t }) => { if (QC) return null; let k = 0, dir = 1; CUTS.forEach((c, i) => { if (TR[i] !== "whip2") return; const d = t - c; if (d > -0.17 && d < 0.17) { k = Math.max(k, 1 - Math.abs(d) / 0.17); dir = d < 0 ? 1 : -1; } });
  if (k <= 0) return null; return <Streaks k={k} dir={dir} f={useCurrentFrame()} />; };

export const KidsEp01: React.FC = () => {
  const f = useCurrentFrame(), t = f / FPS;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Audio src={staticFile("kids01/mix.wav")} />
      {CUTS.slice(0, -1).map((c, i) => <Scene key={i} first={i === 0} start={c} end={CUTS[i + 1]} bg={BG} trans={TR[i]} exit={TR[i + 1]}>{(cx) => <Shot {...cx} i={i} />}</Scene>)}
      <Flash t={t} />
      <Whips t={t} />
      {!QC ? <Vignette k={0.28} col="10,30,60" /> : null}
      {!QC ? <Grain f={f} o={0.035} loop={1200} /> : null}
      <Title t={t} />
      <WordCaptions data={CAP as CaptionData} from={2.9} until={LEN - 1.2} size={96} fixed />
    </AbsoluteFill>
  );
};
