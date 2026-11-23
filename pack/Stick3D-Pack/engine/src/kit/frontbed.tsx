// v18 FRONT BED: crisp vector foreground that fills the bottom of every shot (80-100 % of the height) around the hero's feet.
// Smooth layered grass blades (varied length, dark teal/blue, lit rim on the tips), rocks, flowers, shells, starfish, pebbles, snow.
// Only the nearest layer gets a light depth blur; the middle stays low so the shoes are never hidden.
import React from "react";
import { rnd, noise1 } from "./diorama";
import { QC } from "./qc";

export type BedKind = "meadow" | "night" | "beach" | "space" | "spring" | "summer" | "autumn" | "winter";
type Pal = { g: string[]; rim: string; rock: string; rockL: string; flowers: string[]; ground: string };
const PAL: Record<BedKind, Pal> = {
  meadow: { g: ["#2a6a74", "#327a80", "#3c8a8a", "#2a5e72"], rim: "rgba(190,220,255,0.75)", rock: "#3a4466", rockL: "#6a76a6", flowers: ["#8a7ae0", "#d47ab8", "#ffd23a"], ground: "#122838" },
  night: { g: ["#1c4656", "#225064", "#2a5c6c", "#1a3e56"], rim: "rgba(140,170,255,0.55)", rock: "#1e2440", rockL: "#3c4878", flowers: ["#5a4ea8", "#8a4e88", "#b8a040"], ground: "#08131e" },
  beach: { g: ["#2a6a4a", "#357a56", "#1f5a40", "#40885e"], rim: "rgba(230,240,255,0.7)", rock: "#4a4e66", rockL: "#7c84a6", flowers: ["#ffb0a0", "#ffd6c4", "#ff8a5a"], ground: "#b89a70" },
  space: { g: [], rim: "rgba(255,220,180,0.7)", rock: "#3a3450", rockL: "#7a6a98", flowers: [], ground: "#1a1628" },
  spring: { g: ["#3f9a4a", "#4fb05a", "#2f8040", "#5ac466"], rim: "rgba(255,255,230,0.8)", rock: "#6a7088", rockL: "#9aa2bc", flowers: ["#ffb0d0", "#ffffff", "#ffd23a"], ground: "#4a7a3a" },
  summer: { g: ["#3a8a30", "#4aa038", "#2c7428", "#5cb644"], rim: "rgba(255,250,200,0.85)", rock: "#7a7468", rockL: "#b0a898", flowers: ["#ffd23a", "#ff6a4a", "#ffffff"], ground: "#5a8a30" },
  autumn: { g: ["#a8742a", "#c08a34", "#8a5a22", "#d09a40"], rim: "rgba(255,220,160,0.85)", rock: "#6a5a50", rockL: "#a08a78", flowers: ["#e8502a", "#ff8a2a", "#ffc040"], ground: "#7a5a2a" },
  winter: { g: ["#6a8aa0", "#7a9ab0", "#5a7a92", "#8aaac0"], rim: "rgba(255,255,255,0.9)", rock: "#5a6478", rockL: "#a8b4cc", flowers: [], ground: "#dfe8f4" },
};
const W = 1080, H = 1920;
const mix = (a: string, b: string, k: number) => { const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); const A = p(a), B = p(b); return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * Math.max(0, Math.min(1, k))).toString(16).padStart(2, "0")).join(""); };

export const FrontBed: React.FC<{ t: number; kind: BedKind; px?: number; light?: { x: number; k: number }; seed?: number; snow?: number; dim?: number; o?: number }> = ({ t, kind, px = 0, light, seed = 0, snow = 0, dim = 0, o = 1 }) => {
  if (QC) return null;
  const P = PAL[kind], back: React.ReactNode[] = [], front: React.ReactNode[] = [], props: React.ReactNode[] = [];
  const lit = (x: number) => light ? Math.max(0, 1 - Math.abs(x - light.x) / 380) ** 1.4 * light.k : 0;
  const shade = (col: string, x: number) => { let c = col; if (dim) c = mix(c, "#02040c", dim); const l = lit(x); return l > 0 ? mix(c, "#ffe6a8", 0.55 * l) : c; };
  const blade = (key: string, x: number, h: number, w: number, sw: number, col: string, rim: boolean, list: React.ReactNode[], gid: string) => {
    const tipx = x + sw, tipy = H - h, mid = H - h * 0.55;
    list.push(<path key={key} d={`M ${x - w} ${H + 8} Q ${x + sw * 0.35 - w * 0.45} ${mid} ${tipx} ${tipy} Q ${x + sw * 0.35 + w * 0.45} ${mid} ${x + w} ${H + 8} Z`} fill={`url(#${gid})`} style={{ color: col }} />);
    if (rim) list.push(<path key={key + "r"} d={`M ${x + w * 0.35} ${H - h * 0.3} Q ${x + sw * 0.35 + w * 0.3} ${mid} ${tipx} ${tipy}`} stroke={lit(x) > 0.2 ? "rgba(255,240,190,0.95)" : P.rim} strokeWidth={4} fill="none" strokeLinecap="round" />);
  };
  const grads: React.ReactNode[] = [];
  const gradFor = (id: string, col: string, x: number) => { const c = shade(col, x); grads.push(<linearGradient key={id} id={id} x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor={mix(c, "#000000", 0.3)} /><stop offset="0.6" stopColor={c} /><stop offset="1" stopColor={mix(c, "#ffffff", 0.22)} /></linearGradient>); return id; };
  if (P.g.length) {
    // back layer: dense, short in the middle (feet stay visible), taller toward the corners
    for (let i = 0; i < 56; i++) { const u = rnd(i * 3 + seed), x = u * W + px * 0.6, edge = Math.abs(u - 0.5) * 2, h = (55 + rnd(i * 7 + seed) * 60) * (0.55 + edge * edge * 2.2), sw = noise1(t * 0.9, i) * 18 * (h / 200) + (rnd(i * 11) - 0.5) * 50, w = 18 + rnd(i * 5) * 14;
      blade("b" + i, x, h, w, sw, P.g[i % P.g.length], rnd(i * 13) > 0.5, back, gradFor("gb" + i, P.g[i % P.g.length], x)); }
    // front layer: big blades at the two edges only (nearest, light DOF blur)
    for (let i = 0; i < 16; i++) { const L = i % 2 === 0, u = L ? rnd(i) * 0.2 : 0.8 + rnd(i) * 0.2, x = u * W + px * 1.3, h = 200 + rnd(i * 7 + seed) * 240, sw = (noise1(t * 0.8, i + 50) * 34 + Math.sin(t * 1.6 + i) * 8) * (h / 400) + (L ? 1 : -1) * (20 + rnd(i * 9) * 50), w = 28 + rnd(i * 5) * 18;
      blade("f" + i, x, h, w, sw, P.g[(i + 1) % P.g.length], true, front, gradFor("gf" + i, mix(P.g[(i + 1) % P.g.length], "#000000", 0.1), x)); }
  }
  // rocks in the corners (shaded, rim lit)
  for (let i = 0; i < 3; i++) { const x = [70, 1010, 860][i] + px * 1.1, r = [130, 150, 70][i], y = H + [20, 30, -10][i];
    props.push(<g key={"rk" + i}><ellipse cx={x} cy={y} rx={r * 1.25} ry={r * 0.78} fill={shade(P.rock, x)} /><ellipse cx={x - r * 0.25} cy={y - r * 0.32} rx={r * 0.7} ry={r * 0.32} fill={shade(P.rockL, x)} opacity={0.55} />
      <path d={`M ${x - r * 1.05} ${y - r * 0.35} Q ${x - r * 0.2} ${y - r * 0.92} ${x + r * 0.9} ${y - r * 0.42}`} stroke={P.rim} strokeWidth={4} fill="none" /></g>); }
  if (P.flowers.length && kind !== "beach") for (let i = 0; i < 7; i++) { const x = (i < 4 ? 0.05 + i * 0.075 : 0.74 + (i - 4) * 0.085) * W + px * 0.9, y = H - 90 - rnd(i + seed) * 120 + noise1(t, i) * 6, col = shade(P.flowers[i % P.flowers.length], x), r = 13 + rnd(i * 3) * 6;
    props.push(<g key={"fl" + i}><path d={`M ${x} ${H} Q ${x + 10} ${(H + y) / 2} ${x + noise1(t, i) * 8} ${y}`} stroke={shade(P.g[0] ?? "#2a5a3a", x)} strokeWidth={6} fill="none" />{[0, 1, 2, 3, 4].map((j) => <ellipse key={j} cx={x + Math.cos(j * 1.256 + i) * r * 1.2} cy={y + Math.sin(j * 1.256 + i) * r * 1.2} rx={r} ry={r * 0.7} transform={`rotate(${j * 72 + i * 20} ${x + Math.cos(j * 1.256 + i) * r * 1.2} ${y + Math.sin(j * 1.256 + i) * r * 1.2})`} fill={col} />)}<circle cx={x} cy={y} r={r * 0.7} fill={shade("#ffd23a", x)} /></g>); }
  if (kind === "beach") { // sand lip, shells, starfish, pebbles
    props.unshift(<path key="sand" d={`M 0 ${H - 150} Q 300 ${H - 205} 540 ${H - 170} T 1080 ${H - 160} L 1080 ${H} L 0 ${H} Z`} fill="url(#sandG)" />);
    grads.push(<linearGradient key="sandG" id="sandG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={mix(P.ground, "#ffffff", 0.15)} /><stop offset="1" stopColor={mix(P.ground, "#000000", 0.35)} /></linearGradient>);
    for (let i = 0; i < 16; i++) { const x = rnd(i * 3 + 4) * W + px, y = H - 20 - rnd(i * 5) * 120; props.push(<ellipse key={"pb" + i} cx={x} cy={y} rx={8 + rnd(i) * 14} ry={5 + rnd(i * 2) * 7} fill={i % 3 ? "#8a7a68" : "#a89a88"} />); }
    for (const [x, y, s, a] of [[230, H - 70, 1.1, -12], [760, H - 95, 0.9, 18], [430, H - 30, 0.8, 6]] as [number, number, number, number][]) props.push(<g key={"sh" + x} transform={`translate(${x + px} ${y}) rotate(${a}) scale(${s})`}><path d="M -46 10 A 48 48 0 0 1 46 10 L 6 34 L -6 34 Z" fill="#ffd6c4" stroke="#1a1a1a" strokeWidth={5} />{[-30, -15, 0, 15, 30].map((d) => <line key={d} x1={d * 0.15} y1={32} x2={d} y2={-26 + Math.abs(d) * 0.4} stroke="#d8a08a" strokeWidth={3} />)}</g>);
    props.push(<g key="star" transform={`translate(${900 + px} ${H - 60}) rotate(${t * 2})`}><path d={Array.from({ length: 10 }, (_, k) => { const a = (k / 10) * Math.PI * 2 - Math.PI / 2, r = k % 2 ? 24 : 62; return `${k ? "L" : "M"} ${Math.cos(a) * r} ${Math.sin(a) * r}`; }).join(" ") + " Z"} fill="#ff8a5a" stroke="#1a1a1a" strokeWidth={5} strokeLinejoin="round" /></g>);
  }
  if (snow > 0) props.push(<path key="snow" d={`M 0 ${H - 120} Q 200 ${H - 170} 420 ${H - 130} Q 650 ${H - 95} 820 ${H - 140} Q 960 ${H - 175} 1080 ${H - 130} L 1080 ${H} L 0 ${H} Z`} fill="#f4f8ff" opacity={snow} />);
  return (<svg width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: o }}>
    <defs>{grads}</defs>
    <g>{back}</g><g>{props}</g>
    <g style={{ filter: "blur(2.5px)" }}>{front}</g>
  </svg>);
};
