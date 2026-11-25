// WYR mascot poses straight from the series 3D Stickman puppet (no cut-out). frame = pose index; props.bg = "black"|"white".
// wyr/build_mascot3d.py renders every pose on black AND on white and computes the exact alpha + uncontaminated colour from the
// difference (two-background matting) -> clean RGBA PNGs with no halo.
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { Stickman } from "../kit/character";
import { Cam } from "../style/extra";

type Pose = { name: string; action: string; face: string; t: number };
export const MASCOT_POSES: Pose[] = [
  { name: "happy", action: "idle", face: "smile", t: 0.4 },
  { name: "excited", action: "celebrate", face: "grin", t: 0.55 },
  { name: "thinking", action: "think", face: "think", t: 1.1 },
  { name: "laughing", action: "idle", face: "laugh", t: 0.4 },
  { name: "surprised", action: "freezeShock", face: "surprised", t: 0.6 },
  { name: "scared", action: "panic", face: "scared", t: 0.5 },
  { name: "wow", action: "idle", face: "surprised", t: 0.4 },
  { name: "thumbs", action: "thumbsUp", face: "grin", t: 0.9 },
];

export const WyrMascot: React.FC<{ bg: string }> = ({ bg }) => {
  const f = useCurrentFrame(); const p = MASCOT_POSES[Math.min(f, MASCOT_POSES.length - 1)];
  return (<AbsoluteFill style={{ background: bg }}>
    <ThreeCanvas width={800} height={1100} flat camera={{ fov: 20, position: [0, 1.75, 13], near: 0.1, far: 100 }}>
      <Cam t={0} keys={[{ t: 0, pos: [0, 1.75, 13], look: [0, 1.75, 0], fov: 20 }]} />
      <ambientLight intensity={1} />
      {/* @ts-ignore action/face names come from the table above */}
      <Stickman p={[0, 0, 0]} t={p.t} h={3} action={p.action as any} t0={0} face={p.face as any} dir={1} move={false} shadow={false} blinkSeed={0} />
    </ThreeCanvas></AbsoluteFill>);
};
