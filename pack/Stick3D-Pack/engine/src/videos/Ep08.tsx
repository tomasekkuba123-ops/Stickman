// EP08 "What If Stickman Drew a Million Dollars?" — 1080x1920, 30 fps, exactly 3000 frames. Built with the engine kit v13.
import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, interpolate, Easing } from "remotion";
import { Scene, FPS } from "./ep02/common";
import { SafeGrade } from "../kit/world";
import { Captions, CaptionData } from "../kit/captions";
import { SpeedLines } from "../kit/fx";
import { QC } from "../kit/qc";
import * as S from "./ep08/scenes";
import CAP from "../../public/ep08/captions.json";

export const CUTS = [0, 3.4, 10.3, 16.8, 25.0, 27.6, 34.6, 38.2, 42.5, 47.2, 55.4, 58.4, 64.9, 68.9, 73.9, 79.8, 88.3, 95.2, 100];
const SC = [S.S1, S.S2, S.S3, S.S4, S.S5, S.S6, S.S7, S.S8, S.S9, S.S10, S.S11, S.S12, S.S13, S.S14, S.S15, S.S16, S.S17, S.S18];
const BG = ["#ffd6c0", "#ffd6c0", "#8ccaff", "#8ccaff", "#8ccaff", "#8ccaff", "#8ccaff", "#ff9a6a", "#122060", "#122060", "#122060", "#122060", "#ff9a6a", "#ffd6c0", "#ffd6c0", "#ffd6c0", "#ffd6c0", "#ffd6c0"];
const TR = ["ghost", "flash", "whip", "flash", "whip", "whip", "flash", "whip", "flash", "whip", "whip", "zoom", "whip", "flash", "flash", "whip", "whip", "zoom"] as const;

const Hook: React.FC<{ t: number }> = ({ t }) => { if (QC || t > 3.0) return null; const k = 1 - Math.max(0, (t - 2.6) / 0.4);
  return <div style={{ position: "absolute", top: 160, left: 0, right: 0, textAlign: "center", fontFamily: "Inter, Arial", fontWeight: 900, fontSize: 150, lineHeight: 1, color: "#ffd23a", WebkitTextStroke: "22px #0b0d1a", paintOrder: "stroke fill", transform: `scale(${1 + 0.04 * Math.sin(t * 8)}) rotate(-4deg)`, opacity: k, textShadow: "0 16px 0 rgba(0,0,0,.35)" }}>$1,000,000</div>; };
const EndCard: React.FC<{ t: number }> = ({ t }) => {
  if (QC || t < 95.2) return null;
  const words = ["WHAT", "WOULD", "YOU", "DRAW?"], wt = [95.3, 95.42, 95.55, 95.67];
  const card = interpolate(t, [97.5, 97.85], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.back(1.8)) });
  return (<AbsoluteFill style={{ pointerEvents: "none" }}>
    <div style={{ position: "absolute", top: 150, left: 30, right: 30, textAlign: "center", fontFamily: "Inter, Arial", fontWeight: 900, lineHeight: 1.0 }}>
      
      {words.map((w, i) => { const k = interpolate(t, [wt[i], wt[i] + 0.18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.back(2.6)) }); const big = i >= 2;
        return <span key={i} style={{ display: "inline-block", margin: "0 14px", fontSize: big ? 150 : 110, color: big ? "#ffd23a" : "#ffffff", WebkitTextStroke: "18px #0b0d1a", paintOrder: "stroke fill", transform: `scale(${k}) rotate(${(i % 2 ? 2 : -2) * k}deg)`, opacity: k > 0 ? 1 : 0, textShadow: "0 12px 0 rgba(0,0,0,.35)" }}>{w}</span>; })}
    </div>
    {card > 0.002 ? <div style={{ position: "absolute", left: 110, right: 110, top: 1480, height: 250, transform: `translateY(${(1 - card) * 420}px) scale(${0.85 + 0.15 * card})`, background: "linear-gradient(180deg,#ff3b3b,#c8101e)", borderRadius: 46, border: "12px solid #0b0d1a", boxShadow: "0 18px 0 rgba(0,0,0,.35)", display: "flex", alignItems: "center", justifyContent: "space-around", padding: "0 30px" }}>
      <div style={{ fontFamily: "Inter, Arial", fontWeight: 900, fontSize: 82, lineHeight: 0.98, color: "#fff", WebkitTextStroke: "10px #0b0d1a", paintOrder: "stroke fill", textAlign: "left" }}>SUBSCRIBE<br /><span style={{ color: "#ffd23a" }}>FOR MORE</span></div>
      <div style={{ width: 150, height: 110, background: "#fff", borderRadius: 30, border: "9px solid #0b0d1a", display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${1 + 0.06 * Math.sin(t * 8)})` }}><div style={{ width: 0, height: 0, borderTop: "26px solid transparent", borderBottom: "26px solid transparent", borderLeft: "44px solid #e5263a", marginLeft: 10 }} /></div>
    </div> : null}
  </AbsoluteFill>);
};

export const Ep08: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Audio src={staticFile("ep08/mix.wav")} />
      {SC.map((Sc, i) => <Scene key={i} first={i === 0} start={CUTS[i]} end={CUTS[i + 1]} bg={BG[i]} trans={TR[i]}>{(c) => <Sc {...c} />}</Scene>)}
      {!QC && t > 10.3 && t < 16.8 ? <SpeedLines t={t} k={0.25} mode="radial" /> : null}
      <SafeGrade />
      <Hook t={t} />
      <Captions data={CAP as CaptionData} until={95.2} />
      <EndCard t={t} />
    </AbsoluteFill>
  );
};
