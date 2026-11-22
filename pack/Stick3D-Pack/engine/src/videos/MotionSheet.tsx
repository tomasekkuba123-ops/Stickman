// MOTION SHEET: every library clip at 4 moments (side + front) — check retargeting after tools/bvh_retarget.py
import React, { useLayoutEffect, useRef } from "react";
import { AbsoluteFill } from "remotion";
import { drawStickman, Rig } from "../style/stickman";
import { mocapAt, clipLength, MotionName } from "../kit/mocap";
const CL: MotionName[] = ["walk", "run", "jump", "fall", "wave", "point", "sit", "scared", "celebrate", "flashlight", "shrug"];
const Cell: React.FC<{ clip: MotionName; u: number; view: "side" | "front" }> = ({ clip, u, view }) => { const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => { const base: Rig = { t: 0, face: "smile" }; const m = mocapAt([{ clip, t0: 0, view, blend: 0.001 }], u * clipLength(clip), base); drawStickman(ref.current!.getContext("2d")!, 150, 300, { ...base, ...m.over, air: m.dy }); });
  return <canvas ref={ref} width={150} height={300} style={{ width: 150, height: 300 }} />; };
export const MotionSheet: React.FC = () => (
  <AbsoluteFill style={{ background: "#fff", flexDirection: "column" }}>
    {CL.map((c) => <div key={c} style={{ display: "flex", alignItems: "center" }}><div style={{ width: 110, font: "bold 22px sans-serif" }}>{c}</div>
      {[0.1, 0.35, 0.6, 0.85].map((u) => <Cell key={"s" + u} clip={c} u={u} view="side" />)}<div style={{ width: 30 }} />{[0.1, 0.35, 0.6, 0.85].map((u) => <Cell key={"f" + u} clip={c} u={u} view="front" />)}</div>)}
  </AbsoluteFill>
);
