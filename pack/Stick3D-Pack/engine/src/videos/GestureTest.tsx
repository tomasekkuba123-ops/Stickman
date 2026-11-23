// v17 gesture engine test: palm-up -> point up -> shrug -> chop -> point -> whoa -> rest
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { Stickman } from "../kit/character";
import { World } from "../kit/world";
import { Cam } from "../style/extra";
import { GKey } from "../kit/gesture";
export const GT: GKey[] = [{ t: 0.5, g: "palmUp" }, { t: 1.3, g: "pointUp" }, { t: 2.1, g: "shrug" }, { t: 2.9, g: "chop" }, { t: 3.6, g: "point" }, { t: 4.4, g: "whoa" }];
export const GestureTest: React.FC = () => { const t = useCurrentFrame() / 30;
  return <AbsoluteFill style={{ background: "#9fd6ff" }}><ThreeCanvas width={1080} height={1920} camera={{ fov: 50, position: [0, 1.5, 6] }}>
    <World preset="day" t={t}><Cam t={t} keys={[{ t: 0, pos: [0, 1.5, 6.2], look: [0, 1.25, 0], fov: 50 }]} />
    <Stickman p={[0, 0, 0]} t={t} gest={GT} /></World></ThreeCanvas></AbsoluteFill>; };
