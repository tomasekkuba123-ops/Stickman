// CAPTIONS — 1-2 words, word-synced, key words in yellow, position per caption group ("low" | "high").
// The layout comes from tools/captions.py (captions.json): it measures where Stickman's face and body are in the ANIMATIC
// (tools/stickdetect.py) and puts every caption in the band that does not cover his face / the key action.
// Without captions.json it falls back to grouping words.json/script.json itself (band from the camera shot list, else "low").
import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import { QC, CLEAN } from "./qc";

export type CapGroup = { words: string[]; a: number; e: number; band?: "low" | "high" | "safe"; key?: boolean[]; ts?: [number, number][] };
export type CaptionData = { groups: CapGroup[]; keywords?: string[] };
export const BAND_Y = { low: 1450, high: 230, safe: 1195 }; // v17 "safe" = 62-72 % of the height (feet stay above it) // px top of the caption block in 1080x1920 (qc_check uses the same numbers)

export function groupWords(words: { start: number; end: number }[], script: string[]): CapGroup[] {
  const g: CapGroup[] = []; let cur: number[] = [];
  const flush = () => { if (cur.length) { g.push({ words: cur.map((i) => String(script[i]).replace(/[.,!?;:…"]+$/, "").toUpperCase()), a: words[cur[0]].start, e: words[cur[cur.length - 1]].end }); cur = []; } };
  words.forEach((_, i) => { cur.push(i); if (cur.length === 2 || /[.,!?;:…]$/.test(String(script[i])) || (words[i + 1] && words[i + 1].start - words[i].end > 0.35)) flush(); }); flush(); return g;
}

export const Captions: React.FC<{ data: CaptionData; until?: number; fps?: number; bandAt?: (t: number) => "low" | "high" | undefined; size?: number }> = ({ data, until = 1e9, fps = 30, bandAt, size = 128 }) => {
  const t = useCurrentFrame() / fps; if (QC || CLEAN || t >= until) return null;
  const G = data.groups; const idx = G.findIndex((g, i) => t >= g.a - 0.02 && t < (G[i + 1]?.a ?? 1e9) - 0.02); if (idx < 0) return null; const g = G[idx];
  if (t > g.e + 0.7) return null;
  const KEY = new Set((data.keywords ?? []).map((k) => k.toUpperCase()));
  const sc = interpolate(t - g.a, [0, 0.12], [0.75, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.back(2.6)) });
  const band = g.band ?? bandAt?.(t) ?? "low";
  return <div style={{ position: "absolute", left: 40, right: 40, top: BAND_Y[band], textAlign: "center", fontFamily: "Inter, Arial", fontWeight: 900, fontSize: size, lineHeight: 1.05, WebkitTextStroke: "18px #000", paintOrder: "stroke fill", transform: `scale(${sc})`, textShadow: "0 12px 0 rgba(0,0,0,.35)", letterSpacing: 1 }}>
    {g.words.map((w, i) => <span key={i} style={{ color: (g.key?.[i] ?? KEY.has(w)) ? "#ffd23a" : "#fff" }}>{(i ? " " : "") + w}</span>)}</div>;
};

/* v4 WORD-BY-WORD captions (CLAUDE.md retention rules): groups of up to 3 words from Whisper timings, the CURRENT word highlighted
   (yellow + pop), big bold font, centre-lower; band from captions.py (never over the face). tools/captions.py ... --max 3 */
export const WordCaptions: React.FC<{ data: CaptionData; until?: number; from?: number; fps?: number; size?: number; hi?: string; fixed?: boolean }> = ({ data, until = 1e9, from = 0, fps = 30, size = 112, hi = "#ffd23a", fixed = false }) => {
  const t = useCurrentFrame() / fps; if (QC || CLEAN || t >= until || t < from) return null;
  const G = data.groups; const idx = G.findIndex((g, i) => t >= g.a - 0.04 && t < (G[i + 1]?.a ?? 1e9) - 0.04); if (idx < 0) return null; const g = G[idx];
  if (t > g.e + 0.6) return null;
  const ts = g.ts ?? g.words.map(() => [g.a, g.e] as [number, number]);
  let cur = 0; ts.forEach(([a], i) => { if (t >= a - 0.03) cur = i; });
  const sc = fixed ? 1 : interpolate(t - g.a, [0, 0.14], [0.8, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.back(2.4)) }); // v18 fixed: no group pop, same size for every chunk
  const band = g.band ?? "low";
  // max 2 lines, laid out explicitly (no browser re-wrap): shrink the font until the greedy wrap gives <= 2 lines
  const layout = (z: number) => { const L: number[][] = [[]]; let w = 0; g.words.forEach((x, i) => { const ww = (x.length * 0.74 + 0.5) * z; if (w > 0 && w + ww > 980) { L.push([]); w = 0; } L[L.length - 1].push(i); w += ww; }); return L; };
  let fs = size; while (!fixed && layout(fs).length > 2 && fs > 56) fs -= 4; const lines = layout(fs);
  return <div style={{ position: "absolute", left: 30, right: 30, top: BAND_Y[band], textAlign: "center", fontFamily: "Inter, Arial", fontWeight: 900, fontSize: fs, lineHeight: 1.08, WebkitTextStroke: "16px #0b0d1a", paintOrder: "stroke fill", transform: `scale(${sc})`, textShadow: "0 10px 0 rgba(0,0,0,.35)", letterSpacing: 1 }}>
    {lines.map((ln, li) => <div key={li} style={{ whiteSpace: "nowrap" }}>{ln.map((i) => { const w = g.words[i], on = i === cur, k = on ? (fixed ? interpolate(t - ts[i][0], [0, 0.09, 0.2], [1, 1.07, 1.03], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : interpolate(t - ts[i][0], [0, 0.1, 0.22], [1, 1.16, 1.08], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })) : 1;
      return <span key={i} style={{ display: "inline-block", margin: "0 0.2em", color: on ? hi : "#fff", opacity: i <= cur ? 1 : 0.72, transform: `scale(${k})` }}>{w}</span>; })}</div>)}</div>;
};
