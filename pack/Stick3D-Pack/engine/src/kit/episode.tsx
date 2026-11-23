// EPISODE helpers: every episode gets two compositions automatically —
//   <Id>          final 1080x1920 @ 30 fps
//   <Id>Animatic  same scenes sampled at 12 fps (render with --scale=0.5 -> 540x960) for approval
//   <Id>QC        sampled at 6 fps, rendered with --props '{"qcmask":true}' --scale=0.25 for the QC mask
import React from "react";
import { Composition, Freeze, useCurrentFrame } from "remotion";

export const ANIMATIC_FPS = 12, QC_FPS = 6;
export function animaticOf(C: React.FC, srcFps = 30, fps = ANIMATIC_FPS): React.FC {
  const A: React.FC = () => { const f = useCurrentFrame(); return <Freeze frame={Math.round((f * srcFps) / fps)}><C /></Freeze>; };
  A.displayName = "Animatic";
  return A;
}
export const EpisodeCompositions: React.FC<{ id: string; component: React.FC; seconds: number }> = ({ id, component, seconds }) => (
  <>
    <Composition id={id} component={component} width={1080} height={1920} fps={30} durationInFrames={Math.round(seconds * 30)} />
    {/* declared length = 30-fps frame count (Remotion clamps frozen frames to the composition length); render ONLY frames 0..seconds*12-1 */}
    <Composition id={`${id}Animatic`} component={animaticOf(component)} width={1080} height={1920} fps={ANIMATIC_FPS} durationInFrames={Math.round(seconds * 30)} />
    {/* v17 24-fps low-res preview (render with --scale=0.5 and --frames in 24-fps units) */}
    <Composition id={`${id}P24`} component={animaticOf(component, 30, 24)} width={1080} height={1920} fps={24} durationInFrames={Math.round(seconds * 30)} />
    {/* QC mask pass: 6 fps is enough to measure visibility gaps / size / caption-vs-face, and renders 2x faster than the animatic */}
    <Composition id={`${id}QC`} component={animaticOf(component, 30, QC_FPS)} width={1080} height={1920} fps={QC_FPS} durationInFrames={Math.round(seconds * 30)} />
  </>
);
