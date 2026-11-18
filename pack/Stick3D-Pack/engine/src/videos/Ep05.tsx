// EP05 "What If Stickman's Drawing Came Alive?" — 1080x1920, 30 fps, exactly 3000 frames. Procedural desk + sketchbook world, graphite copy.
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, interpolate, Easing, delayRender, continueRender } from "remotion";
import * as S from "./ep05/scenes5";
import WORDS from "../../public/ep05/words.json";
import SCRIPT from "../../public/ep05/script.json";
const VW = 1080, VH = 1920, FPS = 30;
const loadImages = () => Promise.resolve(); const imagesReady = () => true;

type Tr = "cut" | "whip" | "whipL" | "flash" | "dissolve" | "zoom" | "swoosh";
type Sc = { a: number; fn: (c: CanvasRenderingContext2D, t: number) => void; tr: Tr; cap?: "low" | "high" };
export const SCENES: Sc[] = [
  { a: 0, fn: S.S1, tr: "cut" }, { a: 3.85, fn: S.S2, tr: "swoosh", cap: "high" }, { a: 10.3, fn: S.S3, tr: "zoom" }, { a: 12.9, fn: S.S4, tr: "cut" },
  { a: 20.6, fn: S.S5, tr: "zoom" }, { a: 23.2, fn: S.S6, tr: "whip" , cap: "high" }, { a: 29.0, fn: S.S7, tr: "cut" , cap: "high" }, { a: 36.9, fn: S.S8, tr: "zoom" , cap: "high" },
  { a: 39.4, fn: S.S9, tr: "cut" , cap: "high" }, { a: 43.7, fn: S.S10, tr: "cut" , cap: "high" }, { a: 46.9, fn: S.S11, tr: "zoom" , cap: "high" }, { a: 49.9, fn: S.S12, tr: "cut" , cap: "high" },
  { a: 57.0, fn: S.S13, tr: "cut" , cap: "high" }, { a: 62.0, fn: S.S14, tr: "cut" }, { a: 65.1, fn: S.S15, tr: "cut" , cap: "high" }, { a: 68.6, fn: S.S16, tr: "cut" , cap: "high" },
  { a: 74.3, fn: S.S17, tr: "zoom" , cap: "high" }, { a: 79.4, fn: S.S18, tr: "cut" , cap: "high" }, { a: 86.4, fn: S.S19, tr: "swoosh" }, { a: 90.4, fn: S.S20, tr: "cut" },
  { a: 95.9, fn: S.S21, tr: "cut" },
];
const TR = 0.28;
// shots inside scenes where the action sits in the lower half -> caption goes high
const HIGH: [number, number][] = [];
export const capHigh = (t: number) => { const i = SCENES.findIndex((s, k) => t >= s.a && t < (SCENES[k + 1]?.a ?? 101)); return SCENES[i]?.cap === "high" || HIGH.some(([a, b]) => t >= a && t < b); };

let off: HTMLCanvasElement | null = null, off2: HTMLCanvasElement | null = null;
function renderFrame(c: CanvasRenderingContext2D, t: number) {
  const i = SCENES.findIndex((s, k) => t >= s.a && t < (SCENES[k + 1]?.a ?? 101)), sc = SCENES[i];
  const draw = (cc: CanvasRenderingContext2D, s: Sc) => { cc.save(); cc.clearRect(0, 0, VW, VH); cc.fillStyle = "#000"; cc.fillRect(0, 0, VW, VH); s.fn(cc, t); cc.restore(); };
  const dt = t - sc.a;
  if (i === 0 || sc.tr === "cut" || dt >= TR) { draw(c, sc); }
  else {
    const k = dt / TR, ke = 1 - (1 - k) ** 3, prev = SCENES[i - 1];
    if (!off) { off = document.createElement("canvas"); off.width = VW; off.height = VH; }
    const oc = off.getContext("2d")!;
    if (sc.tr === "flash") { draw(c, sc); c.fillStyle = `rgba(255,255,255,${1 - k})`; c.fillRect(0, 0, VW, VH); }
    else if (sc.tr === "dissolve") { draw(oc, prev); draw(c, sc); c.globalAlpha = 1 - ke; c.drawImage(off, 0, 0); c.globalAlpha = 1; }
    else if (sc.tr === "zoom") { draw(oc, sc); const z = 1.3 - 0.3 * ke; c.save(); c.translate(VW / 2, VH / 2); c.scale(z, z); c.translate(-VW / 2, -VH / 2); c.drawImage(off, 0, 0); c.restore(); }
    else { // whip / swoosh: old shot slides out, new slides in, with motion streaks
      const dir = sc.tr === "whip" ? 1 : -1; draw(oc, prev);
      if (!off2) { off2 = document.createElement("canvas"); off2.width = VW; off2.height = VH; } const nc = off2.getContext("2d")!; draw(nc, sc);
      c.fillStyle = "#000"; c.fillRect(0, 0, VW, VH); c.drawImage(off, -dir * ke * VW, 0); c.drawImage(off2, dir * (1 - ke) * VW, 0);
      c.save(); c.globalAlpha = 0.5 * (1 - k); c.fillStyle = sc.tr === "swoosh" ? "rgba(255,240,180,1)" : "#ffffff"; for (let s = 0; s < 6; s++) c.fillRect(0, (s * 337 + t * 900) % VH, VW, 26); c.restore();
    }
  }
}
const Frame: React.FC = () => {
  const ref = useRef<HTMLCanvasElement>(null), f = useCurrentFrame();
  const [ready, setReady] = useState(imagesReady());
  const [handle] = useState(() => (imagesReady() ? null : delayRender("ep03 images")));
  useEffect(() => { if (!ready) loadImages().then(() => setReady(true)); }, [ready]);
  useLayoutEffect(() => { if (!ready) return; const c = ref.current!.getContext("2d")!; renderFrame(c, f / FPS); if (handle !== null) continueRender(handle); });
  return <canvas ref={ref} width={VW} height={VH} style={{ position: "absolute", inset: 0, filter: "saturate(1.08) contrast(1.03)" }} />;
};

/* captions: 1-2 words, word-synced; position moves up when the action is low */
type G = { text: string; a: number; e: number };
export const GROUPS: G[] = (() => { const g: G[] = []; let cur: number[] = [];
  const flush = () => { if (cur.length) { g.push({ text: cur.map((i) => String(SCRIPT[i]).replace(/[.,!?;:…]+$/, "").replace("…", "")).join(" "), a: WORDS[cur[0]].start, e: WORDS[cur[cur.length - 1]].end }); cur = []; } };
  WORDS.forEach((_, i) => { cur.push(i); if (cur.length === 2 || /[.,!?;:…]$/.test(String(SCRIPT[i])) || (WORDS[i + 1] && WORDS[i + 1].start - WORDS[i].end > 0.35)) flush(); }); flush(); return g; })();
const Captions: React.FC<{ t: number }> = ({ t }) => {
  if (t >= 95.92) return null;
  const idx = GROUPS.findIndex((g, i) => t >= g.a - 0.02 && t < (GROUPS[i + 1]?.a ?? 999) - 0.02); if (idx < 0) return null; const g = GROUPS[idx];
  if (t > g.e + 0.7) return null;
  const sc = interpolate(t - g.a, [0, 0.12], [0.75, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.back(2.6)) });
  const top = capHigh(t) ? 210 : 1330;
  return <div style={{ position: "absolute", left: 45, right: 45, top, textAlign: "center", fontFamily: "Inter, Arial", fontWeight: 900, fontSize: 132, lineHeight: 1.05, color: "#fff", WebkitTextStroke: "18px #000", paintOrder: "stroke fill", transform: `scale(${sc})`, textShadow: "0 12px 0 rgba(0,0,0,.35)", textTransform: "uppercase" }}>{g.text}</div>;
};
const EndCard: React.FC<{ t: number }> = ({ t }) => {
  if (t < 95.92) return null;
  const words = ["WHAT", "WOULD", "YOUR", "COPY", "DO", "FIRST?"], wt = [95.96, 96.1, 96.21, 96.3, 96.64, 96.79];
  const card = interpolate(t, [97.5, 97.85], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.back(1.8)) });
  return (<AbsoluteFill>
    <AbsoluteFill style={{ background: `rgba(20,6,40,${0.3 * Math.min(1, (t - 95.7) / 0.4)})` }} />
    <div style={{ position: "absolute", top: 170, left: 40, right: 40, textAlign: "center", fontFamily: "Inter, Arial", fontWeight: 900, lineHeight: 1.0 }}>
      {words.map((w, i) => { const k = interpolate(t, [wt[i], wt[i] + 0.18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.back(2.6)) }); const big = i >= 3;
        return <span key={w + i} style={{ display: "inline-block", margin: "0 16px", fontSize: big ? 176 : 140, color: big ? "#ffd23a" : "#fff", WebkitTextStroke: "20px #101018", paintOrder: "stroke fill", transform: `scale(${k}) rotate(${(i % 2 ? 2 : -2) * k}deg)`, opacity: k > 0 ? 1 : 0, textShadow: "0 14px 0 rgba(0,0,0,.35), 0 0 40px rgba(255,120,220,.5)" }}>{w}</span>; })}
    </div>
    {card > 0.002 ? <div style={{ position: "absolute", left: 110, right: 110, top: 1500, height: 240, transform: `translateY(${(1 - card) * 420}px) scale(${0.85 + 0.15 * card})`, background: "linear-gradient(180deg,#ff3b3b,#c8101e)", borderRadius: 46, border: "12px solid #101018", boxShadow: "0 18px 0 rgba(0,0,0,.35)", display: "flex", alignItems: "center", justifyContent: "center", gap: 34 }}>
      <div style={{ fontFamily: "Inter, Arial", fontWeight: 900, fontSize: 80, lineHeight: 0.98, color: "#fff", WebkitTextStroke: "10px #101018", paintOrder: "stroke fill" }}>SUBSCRIBE<br /><span style={{ color: "#ffd23a" }}>FOR MORE</span></div>
      <div style={{ width: 150, height: 110, background: "#fff", borderRadius: 30, border: "9px solid #101018", display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${1 + 0.06 * Math.sin(t * 8)})` }}><div style={{ width: 0, height: 0, borderTop: "26px solid transparent", borderBottom: "26px solid transparent", borderLeft: "44px solid #e5233a", marginLeft: 10 }} /></div>
    </div> : null}
  </AbsoluteFill>);
};
export const Ep05: React.FC = () => {
  const f = useCurrentFrame(), t = f / FPS;
  return (<AbsoluteFill style={{ background: "#000" }}>
    <Audio src={staticFile("ep05/mix.wav")} />
    <Frame />
    <Captions t={t} />
    <EndCard t={t} />
  </AbsoluteFill>);
};
