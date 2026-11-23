// pose probe: 6 stickmen with candidate shield / scratch arm settings (frame f picks the set)
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { Stickman } from "../kit/character";
import { World } from "../kit/world";
import { Cam } from "../style/extra";
const SETS: Record<string, unknown>[] = [
  { ikL: [-40, 960], ikKL: 1, handL: "open", handRotL: 90, handsOverHead: true }, { ikL: [-40, 960], ikKL: 1, handL: "open", handRotL: 0, handsOverHead: true }, { ikL: [0, 990], ikKL: 1, handL: "open", handRotL: -90, handsOverHead: true },
  { ikR: [160, 1040], ikKR: 1, handR: "relaxed", handsOverHead: true }, { ikR: [130, 980], ikKR: 1, handR: "relaxed" }, { ikL: [-90, 1010], ikKL: 1, handL: "open", handRotL: 60, handsOverHead: true },
];
export const ArmTest: React.FC = () => { const t = useCurrentFrame() / 30;
  return <AbsoluteFill style={{ background: "#9fd6ff" }}><ThreeCanvas width={1080} height={1920} camera={{ fov: 50, position: [0, 1.5, 6] }}>
    <World preset="day" t={t}><Cam t={t} keys={[{ t: 0, pos: [0, 3.2, 17], look: [0, 3.2, 0], fov: 50 }]} />
    {SETS.map((r, i) => <Stickman key={i} p={[(i % 3 - 1) * 2.6, i < 3 ? 3.6 : 0, 0]} t={t} rig={r as never} res={512} />)}</World></ThreeCanvas></AbsoluteFill>; };
