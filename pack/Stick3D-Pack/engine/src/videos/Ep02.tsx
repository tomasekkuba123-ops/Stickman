// EP02 "What if Stickman drew a door" — 1080x1920, 30 fps, exactly 3000 frames (voice untrimmed).
import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { Grade } from "../style/kit";
import { Scene, Captions, FPS } from "./ep02/common";
import { S1, S2, S3, S4 } from "./ep02/scenesA";
import { S5, S6, S7, S8, S9, S10, S11, S12 } from "./ep02/scenesB";
import { S13, S14, S15, S16, S17, S18, S19, S20, EndCard } from "./ep02/scenesC";

export const CUTS = [0, 3.85, 7.15, 11.1, 13.85, 20.6, 24.1, 25.95, 31.1, 35.3, 38.0, 41.0, 46.6, 54.3, 56.95, 64.35, 69.25, 75.45, 82.35, 90.45, 100];
export const Ep02: React.FC = () => {
  const f = useCurrentFrame(), t = f / FPS;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Audio src={staticFile("ep02/mix.wav")} />
      <Scene first start={CUTS[0]} end={CUTS[1]} bg="#69b8ff">{(c) => <S1 {...c} />}</Scene>
      <Scene start={CUTS[1]} end={CUTS[2]} bg="#69b8ff" trans="whipL">{(c) => <S2 {...c} />}</Scene>
      <Scene start={CUTS[2]} end={CUTS[3]} bg="#69b8ff">{(c) => <S3 {...c} />}</Scene>
      <Scene start={CUTS[3]} end={CUTS[4]} bg="#69b8ff" trans="zoom">{(c) => <S4 {...c} />}</Scene>
      <Scene start={CUTS[4]} end={CUTS[5]} bg="#ffb7e3" trans="flash">{(c) => <S5 {...c} />}</Scene>
      <Scene start={CUTS[5]} end={CUTS[6]} bg="#ffb7e3">{(c) => <S6 {...c} />}</Scene>
      <Scene start={CUTS[6]} end={CUTS[7]} bg="#ffb7e3" trans="whip">{(c) => <S7 {...c} />}</Scene>
      <Scene start={CUTS[7]} end={CUTS[8]} bg="#6a4a9a" trans="zoom">{(c) => <S8 {...c} />}</Scene>
      <Scene start={CUTS[8]} end={CUTS[9]} bg="#6a4a9a" trans="whip">{(c) => <S9 {...c} />}</Scene>
      <Scene start={CUTS[9]} end={CUTS[10]} bg="#6a4a9a" trans="flash">{(c) => <S10 {...c} />}</Scene>
      <Scene start={CUTS[10]} end={CUTS[11]} bg="#6a4a9a">{(c) => <S11 {...c} />}</Scene>
      <Scene start={CUTS[11]} end={CUTS[12]} bg="#6a4a9a" trans="zoom">{(c) => <S12 {...c} />}</Scene>
      <Scene start={CUTS[12]} end={CUTS[13]} bg="#2a1e5e">{(c) => <S13 {...c} />}</Scene>
      <Scene start={CUTS[13]} end={CUTS[14]} bg="#2a1e5e" trans="whip">{(c) => <S14 {...c} />}</Scene>
      <Scene start={CUTS[14]} end={CUTS[15]} bg="#2a1e5e">{(c) => <S15 {...c} />}</Scene>
      <Scene start={CUTS[15]} end={CUTS[16]} bg="#2a1e5e" trans="zoom">{(c) => <S16 {...c} />}</Scene>
      <Scene start={CUTS[16]} end={CUTS[17]} bg="#2a1e5e">{(c) => <S17 {...c} />}</Scene>
      <Scene start={CUTS[17]} end={CUTS[18]} bg="#bfe6ff" trans="flash">{(c) => <S18 {...c} />}</Scene>
      <Scene start={CUTS[18]} end={CUTS[19]} bg="#bfe6ff">{(c) => <S19 {...c} />}</Scene>
      <Scene start={CUTS[19]} end={CUTS[20]} bg="#bfe6ff" trans="zoom">{(c) => <S20 {...c} />}</Scene>
      <Grade t={t} shaft={false} tint={t < 13.85 ? "rgba(255,210,120,.03)" : t < 25.95 ? "rgba(255,120,200,.04)" : t < 46.6 ? "rgba(90,40,200,.07)" : t < 69.25 ? "rgba(70,30,180,.10)" : t < 75.45 ? "rgba(255,180,60,.06)" : "rgba(255,220,120,.05)"} />
      <Captions until={96.05} />
      <EndCard t={t} />
    </AbsoluteFill>
  );
};
