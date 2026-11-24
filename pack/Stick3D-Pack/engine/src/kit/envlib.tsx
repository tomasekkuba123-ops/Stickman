// ENVIRONMENT LIBRARY (CC0 only — assets/env/LICENSES.md): Kenney Nature Kit GLB models + Poly Haven textures, recoloured to the storybook look.
//   <KModel name="tree_oak" p={[3,0,-6]} s={2.2} />          one model (public/env/kenney/<name>.glb)
//   <KScatter names={["rock_smallA","plant_bush"]} n={20} area={[30,10]} c={[0,0,-8]} seed={3} />
//   <DepthPass focus={6} blur={3} />                          depth blur on far layers (+ soft vignette via SafeGrade)
import React, { useMemo, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { continueRender, delayRender, getInputProps, staticFile } from "remotion";
import { useThree } from "@react-three/fiber";
import { EffectComposer, DepthOfField } from "@react-three/postprocessing";
import { V3 } from "../style/kit";

export type KenneyName = "tree_oak" | "tree_detailed" | "tree_default" | "tree_fat" | "tree_pineRoundA" | "tree_pineRoundC" | "tree_pineTallA_detailed" | "tree_pineTallB_detailed" | "tree_palm" | "tree_palmBend" | "tree_simple" | "tree_cone"
  | "plant_bush" | "plant_bushLarge" | "plant_bushDetailed" | "grass" | "grass_large" | "grass_leafsLarge" | "flower_yellowA" | "flower_purpleA" | "flower_redA" | "mushroom_red" | "mushroom_redGroup"
  | "rock_largeA" | "rock_largeB" | "rock_smallA" | "rock_smallC" | "rock_tallA" | "stone_largeA" | "stone_smallA" | "stump_round" | "log" | "log_large" | "fence_simple" | "tent_detailedOpen" | "campfire_logs" | "campfire_stones" | "lily_large" | "platform_beach";

const cache: Record<string, THREE.Group | null> = {}; const waiting: Record<string, Promise<THREE.Group>> = {};
function load(name: string): Promise<THREE.Group> {
  if (!waiting[name]) waiting[name] = new Promise((res, rej) => new GLTFLoader().load(staticFile(`env/kenney/${name}.glb`), (g) => {
    g.scene.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) { const src = m.material as THREE.MeshStandardMaterial; const c = src.color.clone(); const hsl = { h: 0, s: 0, l: 0 }; c.getHSL(hsl); c.setHSL(hsl.h, Math.min(1, hsl.s * 1.25 + 0.05), Math.min(0.75, hsl.l * 1.08));
      m.material = new THREE.MeshToonMaterial({ color: c }); } });
    cache[name] = g.scene; res(g.scene); }, undefined, rej));
  return waiting[name];
}
export function useKenney(name: KenneyName): THREE.Group | null {
  const [, set] = useState(0);
  useMemo(() => { if (!cache[name]) { const h = delayRender("kenney " + name); load(name).then(() => { set((x) => x + 1); continueRender(h); }); } }, [name]);
  return useMemo(() => (cache[name] ? cache[name]!.clone(true) : null), [name, cache[name]]);
}
// tint: multiply colour (night scenes: "#6a78b8")
export const KModel: React.FC<{ name: KenneyName; p: V3; s?: number; ry?: number; tint?: string; sway?: number; t?: number }> = ({ name, p, s = 1, ry = 0, tint, sway = 0, t = 0 }) => {
  const g = useKenney(name);
  useMemo(() => { if (g && tint) g.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) { const mt = (m.material as THREE.MeshToonMaterial).clone(); mt.color.multiply(new THREE.Color(tint)); m.material = mt; } }); }, [g, tint]);
  if (!g) return null;
  return <primitive object={g} position={p} scale={[s, s, s]} rotation={[sway ? Math.sin(t * 1.3 + p[0]) * 0.02 * sway : 0, ry, sway ? Math.sin(t * 1.1 + p[2]) * 0.025 * sway : 0]} />;
};
const rnd = (s: number) => { const x = Math.sin(s * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
export const KScatter: React.FC<{ names: KenneyName[]; n: number; area: [number, number]; c?: V3; seed?: number; s?: [number, number]; avoid?: [number, number, number][]; tint?: string; t?: number; sway?: number }> = ({ names, n, area, c = [0, 0, 0], seed = 1, s = [0.8, 1.4], avoid = [], tint, t = 0, sway = 0 }) => {
  const items = useMemo(() => { const out: { name: KenneyName; p: V3; s: number; ry: number }[] = [];
    for (let i = 0; out.length < n && i < n * 6; i++) { const x = c[0] + (rnd(seed + i * 3.1) - 0.5) * area[0], z = c[2] + (rnd(seed + i * 7.7) - 0.5) * area[1];
      if (avoid.some(([ax, az, r]) => Math.hypot(x - ax, z - az) < r)) continue;
      out.push({ name: names[Math.floor(rnd(seed + i * 1.3) * names.length)], p: [x, c[1], z], s: s[0] + (s[1] - s[0]) * rnd(seed + i * 5.3), ry: rnd(seed + i * 9.1) * 6.28 }); }
    return out; }, [n, seed]);
  return <>{items.map((it, i) => <KModel key={i} {...it} tint={tint} t={t} sway={sway} />)}</>;
};
/* post effects (DepthPass + BloomPass) are OFF by default (user choice 2026-11: sharper image, ~22 % faster on the CPU renderer).
   Turn them back on for one render with --props '{"postfx":true}'. */
export const noPost = (): boolean => { try { return !(getInputProps() as { postfx?: boolean }).postfx; } catch { return true; } };
/* DEPTH LAYERS: real depth-of-field — the subject plane at `focus` (world units from camera) stays sharp, far layers blur. */
export const DepthPass: React.FC<{ focus: number; range?: number; blur?: number }> = ({ focus, range = 6, blur = 3 }) => {
  const { camera } = useThree(); const cam = camera as THREE.PerspectiveCamera; const span = cam.far - cam.near;
  if (noPost()) return null; // off unless --props '{"postfx":true}'
  return (<EffectComposer multisampling={0}><DepthOfField focusDistance={(focus - cam.near) / span} focalLength={range / span} bokehScale={blur} resolutionScale={0.25} height={240} /></EffectComposer>);
};
/* tinted photo texture (Poly Haven) for ground planes */
export function usePHTex(id: "coast_sand_01" | "forest_ground_04", repeat = 8) {
  return useMemo(() => { const hd = delayRender("ph " + id); const tx = new THREE.TextureLoader().load(staticFile(`env/polyhaven/${id}_diff_1k.jpg`), () => continueRender(hd), undefined, () => continueRender(hd)); tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.repeat.set(repeat, repeat); tx.colorSpace = THREE.SRGBColorSpace; return tx; }, [id, repeat]);
}
