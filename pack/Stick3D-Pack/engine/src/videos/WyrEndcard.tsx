// WYR subscribe end card (1.5 s, 45 frames). Rendered ONCE into wyr/assets/endcard/ by wyr/build_endcard.py and reused
// unchanged in every episode. 3D stage + the series Stickman puppet pointing at the SUBSCRIBE button; button gets pressed ->
// grey SUBSCRIBED; then the bell rings. Premium cinematic look matching the WYR v3 template.
import React from "react";
import "@fontsource/inter/600.css";
import "@fontsource/inter/800.css";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { Stickman } from "../kit/character";
import { GradientDome } from "../style/set3d";
import { Glow } from "../style/props";
import { Cyl } from "../style/toon";
import { Cam } from "../style/extra";

const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const easeOut = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
const back = (x: number) => { x = clamp(x) - 1; return 1 + 2.4 * x * x * x + 1.4 * x * x; };

const PRESS = 0.42, FLIP = 0.52, RING = 0.68;   // seconds

const Bell: React.FC<{ t: number }> = ({ t }) => {
  const u = t - RING; const ang = u > 0 ? 24 * Math.sin(2 * Math.PI * 5.5 * u) * Math.exp(-2.6 * u) : 0;
  const glow = u > 0 ? Math.exp(-2 * u) : 0;
  return (<div style={{ position: "absolute", left: 665, top: 1262, width: 150, height: 150, borderRadius: 75, background: "rgba(10,10,20,.72)",
    border: "3px solid rgba(255,255,255,.35)", boxShadow: `0 0 ${30 + 60 * glow}px rgba(255,201,74,${0.25 + 0.6 * glow})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
    <svg width="92" height="92" viewBox="0 0 100 100" style={{ transform: `rotate(${ang}deg)`, transformOrigin: "50% 12%" }}>
      <path d="M50 8 C30 10 24 28 24 46 C24 62 18 70 12 76 L88 76 C82 70 76 62 76 46 C76 28 70 10 50 8 Z" fill="#FFC94A" />
      <circle cx="50" cy="86" r="9" fill="#FFC94A" /><circle cx="50" cy="7" r="5" fill="#FFC94A" />
      <path d="M34 44 C34 32 38 24 46 20" stroke="rgba(255,255,255,.7)" strokeWidth="5" fill="none" strokeLinecap="round" />
    </svg>
    {u > 0 ? [-1, 1].map((s) => <svg key={s} width="70" height="90" viewBox="0 0 70 90" style={{ position: "absolute", left: s < 0 ? -42 : 122, top: 26, opacity: glow, transform: s < 0 ? "scaleX(-1)" : "" }}>
      <path d="M10 20 Q30 45 10 70" stroke="#FFC94A" strokeWidth="6" fill="none" strokeLinecap="round" /><path d="M28 8 Q56 45 28 82" stroke="#FFC94A" strokeWidth="6" fill="none" strokeLinecap="round" /></svg>) : null}
  </div>);
};

const Button: React.FC<{ t: number }> = ({ t }) => {
  const pressK = t < PRESS ? 0 : t < FLIP ? (t - PRESS) / (FLIP - PRESS) : Math.max(0, 1 - (t - FLIP) / 0.12);
  const done = t >= FLIP; const pulse = done ? 0 : 0.5 + 0.5 * Math.sin(t * 14);
  const sc = 1 - 0.08 * Math.sin(Math.PI * clamp(pressK)) + (done ? 0.06 * Math.exp(-(t - FLIP) * 10) : 0);
  return (<div style={{ position: "absolute", left: 470, top: 1075, width: 540, height: 140, borderRadius: 70, transform: `scale(${sc})`,
    background: done ? "linear-gradient(#55565f,#3b3c45)" : "linear-gradient(#ff2a3d,#d0001c)",
    boxShadow: done ? "0 10px 30px rgba(0,0,0,.5)" : `0 0 ${40 + 30 * pulse}px rgba(255,40,60,.75), 0 12px 30px rgba(0,0,0,.55)`,
    border: done ? "3px solid rgba(255,255,255,.18)" : "3px solid rgba(255,255,255,.35)", display: "flex", alignItems: "center", justifyContent: "center", gap: 18,
    fontFamily: "Inter", fontWeight: 900, fontSize: 60, letterSpacing: 3, color: done ? "#d9d9e0" : "#ffffff" }}>
    {done ? <svg width="46" height="46" viewBox="0 0 24 24"><path d="M4 12.5 L10 18 L20 6" stroke="#d9d9e0" strokeWidth="3.4" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg> : null}
    {done ? "SUBSCRIBED" : "SUBSCRIBE"}
  </div>);
};

export const WyrEndcard: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const t = f / fps;
  const k = easeOut(t / 0.25);
  return (<AbsoluteFill style={{ background: "#05040a" }}>
    <ThreeCanvas width={1080} height={1920} flat camera={{ fov: 38, position: [0, 2.4, 11], near: 0.1, far: 200 }}>
      <Cam t={0} keys={[{ t: 0, pos: [0.4 - 0.25 * t, 2.6, 11.6 - 0.5 * t], look: [0.4, 2.2, 0], fov: 38 }]} />
      <ambientLight intensity={0.5} /><directionalLight position={[4, 7, 6]} intensity={1.2} color="#fff1dc" />
      <directionalLight position={[-6, 4, -5]} intensity={1.8} color="#ff5a4a" /><directionalLight position={[6, 3, -5]} intensity={1.8} color="#4aa8ff" />
      <GradientDome r={60} stops={[[0, "#08010a"], [0.4, "#2a0718"], [0.52, "#3a0c3a"], [0.62, "#0b1846"], [1, "#020208"]]} />
      <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[30, 64]} /><meshBasicMaterial color="#07060f" /></mesh>
      <Glow p={[-2.2, 1.8, -3]} r={5} color="rgba(255,60,80,.9)" o={0.45} />
      <Glow p={[2.6, 2.4, -3.5]} r={5.5} color="rgba(70,140,255,.9)" o={0.45} />
      {Array.from({ length: 30 }, (_, i) => <Glow key={i} p={[(rnd(i) - 0.5) * 16, rnd(i + 7) * 8 + 0.3 * t * (rnd(i + 2) - 0.3), -3 - rnd(i + 3) * 10]} r={0.1 + rnd(i + 11) * 0.3} color={i % 2 ? "rgba(255,120,110,.9)" : "rgba(120,180,255,.9)"} o={0.3 + rnd(i + 5) * 0.4} />)}
      <Cyl p={[-1.0, 0.22, 0.5]} rt={1.25} rb={1.4} h={0.44} color="#1b1d2a" line={4} />
      <mesh position={[-1.0, 0.445, 0.5]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[1.24, 0.03, 12, 72]} /><meshBasicMaterial color="#ffc94a" toneMapped={false} /></mesh>
      <Stickman p={[-1.0, 0.44, 0.5]} t={t} h={2.25} action="point" t0={-0.35} face={t < FLIP ? "grin" : "laugh"} dir={1} move={false} blinkSeed={3} />
    </ThreeCanvas>
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 45%, rgba(0,0,0,.7) 100%)" }} />
    <div style={{ position: "absolute", top: 400, width: "100%", textAlign: "center", transform: `translateY(${(1 - k) * 18}px)`, opacity: 0.75 + 0.25 * k }}>
      <div style={{ fontFamily: "Inter", fontWeight: 900, fontSize: 118, letterSpacing: 4, color: "#fff", textShadow: "0 6px 30px rgba(0,0,0,.6), 0 0 40px rgba(255,255,255,.15)" }}>
        PICK <span style={{ color: "#FFC94A", textShadow: "0 0 40px rgba(255,201,74,.55)" }}>ONE</span> DAILY</div>
      <div style={{ margin: "26px auto 0", width: 420, height: 4, borderRadius: 2, background: "linear-gradient(90deg, rgba(200,16,46,0), #ff3b4e 30%, #fff 50%, #3b7bff 70%, rgba(30,91,255,0))" }} />
      <div style={{ marginTop: 30, fontFamily: "Inter", fontWeight: 600, fontSize: 46, color: "rgba(255,255,255,.88)", textShadow: "0 4px 18px rgba(0,0,0,.7)" }}>A new impossible choice every day</div>
    </div>
    <Button t={t} />
    <Bell t={t} />
    <div style={{ position: "absolute", top: 1478, width: "100%", display: "flex", justifyContent: "center" }}>
      <div style={{ padding: "18px 40px", borderRadius: 40, background: "rgba(8,8,18,.62)", fontFamily: "Inter", fontWeight: 600, fontSize: 42, color: "#fff" }}>Subscribe for tomorrow's choice!</div>
    </div>
  </AbsoluteFill>);
};
