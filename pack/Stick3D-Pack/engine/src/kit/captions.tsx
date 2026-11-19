// CAPTIONS — 1-2 words, word-synced, key words in yellow, position per caption group ("low" | "high").
// The layout comes from tools/captions.py (captions.json): it measures where Stickman's face and body are in the ANIMATIC
// (tools/stickdetect.py) and puts every caption in the band that does not cover his face / the key action.
// Without captions.json it falls back to grouping words.json/script.json itself (band from the camera shot list, else "low").
import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import { QC } from "./qc";

export type CapGroup = { words: string[]; a: number; e: number; band?: "low" | "high"; key?: boolean[] };
export type CaptionData = { groups: CapGroup[]; keywords?: string[] };
export const BAND_Y = { low: 1450, high: 230 }; // px top of the caption block in 1080x1920 (qc_check uses the same numbers)

export function groupWords(words: { start: number; end: number }[], script: string[]): CapGroup[] {
  const g: CapGroup[] = []; let cur: number[] = [];
  const flush = () => { if (cur.length) { g.push({ words: cur.map((i) => String(script[i]).replace(/[.,!?;:…"]+$/, "").toUpperCase()), a: words[cur[0]].start, e: words[cur[cur.length - 1]].end }); cur = []; } };
  words.forEach((_, i) => { cur.push(i); if (cur.length === 2 || /[.,!?;:…]$/.test(String(script[i])) || (words[i + 1] && words[i + 1].start - words[i].end > 0.35)) flush(); }); flush(); return g;
}

export const Captions: React.FC<{ data: CaptionData; until?: number; fps?: number; bandAt?: (t: number) => "low" | "high" | undefined; size?: number }> = ({ data, until = 1e9, fps = 30, bandAt, size = 128 }) => {
  const t = useCurrentFrame() / fps; if (QC || t >= until) return null;
  const G = data.groups; const idx = G.findIndex((g, i) => t >= g.a - 0.02 && t < (G[i + 1]?.a ?? 1e9) - 0.02); if (idx < 0) return null; const g = G[idx];
  if (t > g.e + 0.7) return null;
  const KEY = new Set((data.keywords ?? []).map((k) => k.toUpperCase()));
  const sc = interpolate(t - g.a, [0, 0.12], [0.75, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.back(2.6)) });
  const band = g.band ?? bandAt?.(t) ?? "low";
  return <div style={{ position: "absolute", left: 40, right: 40, top: BAND_Y[band], textAlign: "center", fontFamily: "Inter, Arial", fontWeight: 900, fontSize: size, lineHeight: 1.05, WebkitTextStroke: "18px #000", paintOrder: "stroke fill", transform: `scale(${sc})`, textShadow: "0 12px 0 rgba(0,0,0,.35)", letterSpacing: 1 }}>
    {g.words.map((w, i) => <span key={i} style={{ color: (g.key?.[i] ?? KEY.has(w)) ? "#ffd23a" : "#fff" }}>{(i ? " " : "") + w}</span>)}</div>;
};
