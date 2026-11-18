import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { Look } from "../style/puppet";
import { Person, Lights } from "../style/kit";
import { Cam } from "../style/extra";
import { SkyDome, Cloud, Island, Dragon, ChalkKey, Windmill, Bridge } from "../style/sky";
export const STICKMAN: Look = { skin: "#ffffff", body: "#e8342e", outfit: "hoodiePro", hair: "tufts", hairColor: "#111216", eyes: "bean", sleeve: true, gloves: "#ffffff", backpack: "#3a3b46", shoe: "#e8342e", sole: "#ffffff" };
export const Ep02Test: React.FC = () => { const f = useCurrentFrame(), t = f / 30; return (
  <AbsoluteFill style={{ background: "#7ec8ff", filter: "saturate(1.25) contrast(1.06)" }}>
    <ThreeCanvas width={1080} height={1920} camera={{ fov: 55, position: [0, 2, 8] }}>
      <Cam t={t} keys={[{ t: 0, pos: [0, 2.4, 8.5], look: [0, 1.9, 0], fov: 50 }]} />
      <Lights /><SkyDome top="#2f7de0" mid="#8ecbff" bottom="#ffd6f0" />
      <Island p={[0, 0, 0]} r={4.5} seed={2} trees={2} />
      <Cloud p={[-5, -2, -6]} s={1.6} seed={3} /><Cloud p={[6, 3, -14]} s={2.2} seed={5} />
      <Windmill p={[3.2, 0, -2.5]} spin={t} s={0.8} />
      <Bridge a={[4.4, 0, -1]} b={[12, 0, -6]} n={12} />
      <Person p={[-0.6, 0, 0.8]} h={3.4} res={768} look={STICKMAN} f={f} pose={{ mood: f % 2 ? "laugh" : "smile", arms: f % 2 ? "up" : undefined }} />
      <Dragon p={[1.4, 0, 1.2]} h={1.4} f={f} pose={{ mood: f % 2 ? "scared" : "calm", flap: 0.6 }} shadow />
      <ChalkKey p={[-2.2, 0.4, 1.5]} s={0.8} />
    </ThreeCanvas>
  </AbsoluteFill>); };
