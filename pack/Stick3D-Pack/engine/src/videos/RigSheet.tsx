// Model sheet: STICKMAN rig v2 + baby dragon v2 next to the official references.
import React, { useLayoutEffect, useRef } from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { drawStickman, Rig, POSES, drawGlove, HandPose } from "../style/stickman";
import { drawDragon, DragonPose } from "../style/dragon";

const card: React.CSSProperties = { background: "linear-gradient(#ffffff,#eef2fb)", borderRadius: 24, border: "3px solid #d5dbec" };
const lab: React.CSSProperties = { fontFamily: "Inter, Arial", fontWeight: 900, fontSize: 36, marginTop: 8, color: "#1a1a2a" };
const Fig: React.FC<{ rig: Rig; label: string; w?: number; h?: number }> = ({ rig, label, w = 480, h = 760 }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => { drawStickman(ref.current!.getContext("2d")!, w * 2, h * 2, rig); });
  return <div style={{ width: w, display: "flex", flexDirection: "column", alignItems: "center" }}><canvas ref={ref} width={w * 2} height={h * 2} style={{ width: w, height: h, ...card }} /><div style={lab}>{label}</div></div>;
};
const Dra: React.FC<{ pose: DragonPose; label: string; w?: number }> = ({ pose, label, w = 480 }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => { drawDragon(ref.current!.getContext("2d")!, w * 2, w * 2, pose); });
  return <div style={{ width: w, display: "flex", flexDirection: "column", alignItems: "center" }}><canvas ref={ref} width={w * 2} height={w * 2} style={{ width: w, height: w, ...card }} /><div style={lab}>{label}</div></div>;
};
export const RigSheet: React.FC = () => {
  const f = useCurrentFrame(), t = f;
  const stand: Rig = { t, view: "front", face: "smile", ...POSES.stand(t) } as Rig;
  const walk: Rig = { t, face: "smile", ...POSES.walk(0.12) } as Rig;
  const thumb: Rig = { t, view: "front", face: "smile", armL: { a: 12, b: 10 }, armR: { a: 40, b: 128 }, handR: "thumb", handL: "relaxed", legL: { a: 4, b: 0 }, legR: { a: 6, b: 0 }, headTilt: -4 };
  const laugh: Rig = { t, view: "front", face: "laugh", ikL: [-62, 596], ikR: [62, 596], ikBendL: -1, ikBendR: 1, handL: "fist", handR: "fist", legL: { a: 3, b: 0 }, legR: { a: 3, b: 0 }, squash: -0.02, headTilt: 3 };
  const think: Rig = { t, view: "front", face: "think", lookX: 0.6, lookY: -0.6, handsOverHead: true, ikR: [34, 572], handR: "fist", ikL: [74, 468], handL: "hold", handRotL: -20, legL: { a: 3, b: 0 }, legR: { a: 3, b: 0 }, headTilt: -6 };
  const hands: Rig[] = (["open", "relaxed", "hold", "point", "fist", "thumb"] as const).map((hp) => ({ t, view: "front", face: "smile", armL: { a: 8, b: 6 }, armR: { a: 70, b: 70 }, handR: hp, handL: "relaxed", legL: { a: 3, b: 0 }, legR: { a: 3, b: 0 } }));
  return (<AbsoluteFill style={{ background: "#f7f8fc", padding: 36, flexDirection: "row", gap: 36 }}>
    <div style={{ width: 820, display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ ...lab, fontSize: 42 }}>REFERENCE</div>
      <Img src={staticFile("ref/STICKMAN_REFERENCE_SHEET_v3.png")} style={{ width: 820, borderRadius: 20, border: "3px solid #d5dbec" }} />
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        <Img src={staticFile("ref/STICKMAN_REFERENCE_SHEET_v3.png")} style={{ height: 470, borderRadius: 20, border: "3px solid #d5dbec" }} />
        <Img src={staticFile("ref/dragon_ref.png")} style={{ width: 500, borderRadius: 20, border: "3px solid #d5dbec" }} />
      </div>
    </div>
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ ...lab, fontSize: 42 }}>NEW RIG v2 — STICKMAN + BABY DRAGON</div>
      <div style={{ display: "flex", gap: 24 }}><Fig rig={stand} label="FRONT STANDING" /><Fig rig={walk} label="WALK (SIDE)" /><Fig rig={thumb} label="THUMBS-UP" /><Fig rig={laugh} label="LAUGHING" /></div>
      <div style={{ display: "flex", gap: 24 }}><Fig rig={think} label="THINKING" /><Dra pose={{ t, mood: "happy", flap: 0.3 }} label="DRAGON IDLE" /><Dra pose={{ t: 6, mood: "wow", fly: 1, flap: 0.5, flapHz: 1, arms: "up", lookX: 0.5 }} label="DRAGON FLYING" /><Dra pose={{ t, mood: "calm", flap: 0.2, lookX: 0.6 }} label="DRAGON CALM" /></div>
      <div style={{ ...lab, fontSize: 32 }}>GLOVE POSES: open · relaxed · holding · pointing · fist · thumbs-up</div>
      <div style={{ display: "flex", gap: 10 }}>{hands.map((r, i) => <Crop key={i} rig={r} />)}</div>
    </div>
  </AbsoluteFill>);
};
// close-up of a glove pose (drawn directly, fingers up)
const Crop: React.FC<{ rig: Rig }> = ({ rig }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => { const c = ref.current!.getContext("2d")!; c.clearRect(0, 0, 600, 420); c.lineCap = "round"; c.lineJoin = "round"; drawGlove(c, 300, 330, Math.PI, rig.handR ?? "relaxed", false, 2.6); });
  return <canvas ref={ref} width={600} height={420} style={{ width: 300, height: 210, ...card }} />;
};
