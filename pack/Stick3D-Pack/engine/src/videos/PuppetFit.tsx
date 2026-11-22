// PUPPET FIT: the 5 turnaround views of the puppet on white, for overlay + measurement against assets/reference/views (tools/puppet_fit.py)
import React, { useLayoutEffect, useRef } from "react";
import { AbsoluteFill } from "remotion";
import { drawStickman, Rig } from "../style/stickman";
const Cell: React.FC<{ rig: Rig }> = ({ rig }) => { const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => { drawStickman(ref.current!.getContext("2d")!, 400, 800, rig); });
  return <canvas ref={ref} width={400} height={800} style={{ width: 400, height: 800 }} />; };
export const PuppetFit: React.FC = () => (
  <AbsoluteFill style={{ background: "#ffffff", flexDirection: "row" }}>
    <Cell rig={{ t: 0, view: "front", face: "grin", backpack: true, armL: { a: 10, b: 4 }, armR: { a: 10, b: 4 }, handL: "fist", handR: "fist" }} />
    <Cell rig={{ t: 0, view: "side", face: "smile", backpack: true }} />
    <Cell rig={{ t: 0, view: "back", backpack: true, armL: { a: 14, b: 6 }, armR: { a: 14, b: 6 } }} />
  </AbsoluteFill>
);
