// Model sheet for the STICKMAN rig v2 next to the official reference.
import React, { useLayoutEffect, useRef } from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { drawStickman, Rig, POSES } from "../style/stickman";

const Fig: React.FC<{ rig: Rig; label: string; w?: number; h?: number }> = ({ rig, label, w = 520, h = 800 }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => { const c = ref.current!.getContext("2d")!; drawStickman(c, w * 2, h * 2, rig); });
  return <div style={{ width: w, display: "flex", flexDirection: "column", alignItems: "center" }}>
    <canvas ref={ref} width={w * 2} height={h * 2} style={{ width: w, height: h, background: "linear-gradient(#ffffff,#eef2fb)", borderRadius: 24, border: "3px solid #d5dbec" }} />
    <div style={{ fontFamily: "Inter, Arial", fontWeight: 900, fontSize: 38, marginTop: 10, color: "#1a1a2a" }}>{label}</div>
  </div>;
};
export const RigSheet: React.FC = () => {
  const f = useCurrentFrame(), t = f;
  const stand: Rig = { t, view: "front", face: "smile", ...POSES.stand(t) } as Rig;
  const walk: Rig = { t, face: "smile", ...POSES.walk(0.12) } as Rig;
  const thumb: Rig = { t, view: "front", face: "smile", armL: { a: 12, b: 10 }, armR: { a: 40, b: 128 }, handR: "thumb", handL: "relaxed", legL: { a: 4, b: 0 }, legR: { a: 6, b: 0 }, headTilt: -4 };
  const laugh: Rig = { t, view: "front", face: "laugh", ikL: [-104, 575], ikR: [104, 575], handL: "fist", handR: "fist", legL: { a: 3, b: 0 }, legR: { a: 3, b: 0 }, squash: -0.02, headTilt: 3 };
  const think: Rig = { t, view: "front", face: "think", lookX: 0.6, lookY: -0.6, handsOverHead: true, ikR: [44, 606], handR: "fist", ikL: [96, 500], handL: "relaxed", handRotL: 70, legL: { a: 3, b: 0 }, legR: { a: 3, b: 0 }, headTilt: -6 };
  return (<AbsoluteFill style={{ background: "#f7f8fc", flexDirection: "row", padding: 40, gap: 40 }}>
    <div style={{ width: 900, display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ fontFamily: "Inter, Arial", fontWeight: 900, fontSize: 44 }}>REFERENCE (your model sheet)</div>
      <Img src={staticFile("ref/01_MAIN_CHARACTER_LATEST_MODEL_SHEET.png")} style={{ width: 900, borderRadius: 20, border: "3px solid #d5dbec" }} />
      <div style={{ display: "flex", gap: 16 }}><Img src={staticFile("ref/STICKMAN_FINAL_LOOK.png")} style={{ height: 520, borderRadius: 20, border: "3px solid #d5dbec" }} /></div>
    </div>
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ fontFamily: "Inter, Arial", fontWeight: 900, fontSize: 44 }}>NEW RIG v2 (layered 2D parts)</div>
      <div style={{ display: "flex", gap: 30 }}><Fig rig={stand} label="FRONT STANDING" /><Fig rig={walk} label="WALK (SIDE)" /><Fig rig={thumb} label="THUMBS-UP" /></div>
      <div style={{ display: "flex", gap: 30 }}><Fig rig={laugh} label="LAUGHING" /><Fig rig={think} label="THINKING" /><Fig rig={{ t, face: "determined", ...POSES.run(0.15) } as Rig} label="RUN (SIDE)" /></div>
    </div>
  </AbsoluteFill>);
};
