// LAB: quick visual tests of kit pieces (frame = test case). Not an episode.
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { Cam } from "../style/extra";
import { World, Terrain } from "../kit/world";
import { GiantWhale } from "../kit/creatures";
import { Stickman } from "../kit/character";
const CASES: { cam: [number, number, number]; look: [number, number, number]; jaw: number }[] = [
  { cam: [10, 4, 26], look: [0, 3, 0], jaw: 0 }, { cam: [10, 4, 26], look: [0, 3, 0], jaw: 1 }, { cam: [0, 2, 24], look: [0, 2, 0], jaw: 1 },
  { cam: [26, 6, 2], look: [0, 3, 0], jaw: 0.6 }, { cam: [-14, 14, 18], look: [0, 3, 0], jaw: 0.3 }, { cam: [4, 1.5, 16], look: [0, 3, 4], jaw: 1 }];
export const Lab: React.FC = () => { const f = useCurrentFrame(), c = CASES[f % CASES.length];
  return (<AbsoluteFill style={{ background: "#120a3a" }}><ThreeCanvas width={1080} height={1920} flat camera={{ fov: 55, position: [0, 2, 8], near: 0.1, far: 400 }}>
    <World preset="space" t={1} fog={false}><Cam t={0} keys={[{ t: 0, pos: c.cam, look: c.look, fov: 50 }]} />
      <Terrain color="#b9b4c8" color2="#a8a2c0" amp={0.3} />
      <GiantWhale p={[0, 4.5, 0]} s={1} t={1} jaw={c.jaw} />
      <Stickman p={[6, 0, 8]} t={1} action="freezeShock" />
    </World></ThreeCanvas></AbsoluteFill>); };
