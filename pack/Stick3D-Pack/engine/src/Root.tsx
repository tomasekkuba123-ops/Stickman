import React from "react";
import { Composition } from "remotion";
import "@fontsource/inter/900.css";
import { Main } from "./Main";
import { NvidiaV4 } from "./videos/NvidiaV4";
import { Ep02 } from "./videos/Ep02";
import { RigSheet } from "./videos/RigSheet";
import { PuppetFit } from "./videos/PuppetFit";
import { GestureTest } from "./videos/GestureTest";
import { ArmTest } from "./videos/ArmTest";
import { MotionSheet } from "./videos/MotionSheet";
import { Ep04 } from "./videos/Ep04";
import { Ep05 } from "./videos/Ep05";
import { Ep06 } from "./videos/Ep06";
import { Ep03R } from "./videos/Ep03R";
import { EpisodeCompositions } from "./kit/episode";
import { Showreel } from "./videos/Showreel";
import { Lab } from "./videos/Lab";
import { ShowreelV13 } from "./videos/ShowreelV13";
import { Ep07 } from "./videos/Ep07";
import { Ep08 } from "./videos/Ep08";
import { Ep09 } from "./videos/Ep09";
import { WyrScene, WyrTile } from "./videos/WyrScenes";
// NEW EPISODES: register with <EpisodeCompositions id="EpXX" component={EpXX} seconds={60|100} /> (adds EpXXAnimatic for approval + QC mask).
export const Root: React.FC = () => <>
  <Composition id="Main" component={Main} width={720} height={1280} fps={30} durationInFrames={60} />
  <Composition id="NvidiaV4" component={NvidiaV4} width={720} height={1280} fps={30} durationInFrames={661} />
  <Composition id="Ep02" component={Ep02} width={1080} height={1920} fps={30} durationInFrames={3000} />
  <Composition id="MotionSheet" component={MotionSheet} width={1340} height={3300} fps={30} durationInFrames={1} />
  <Composition id="PuppetFit" component={PuppetFit} width={1200} height={800} fps={30} durationInFrames={1} />
  <Composition id="ArmTest" component={ArmTest} width={1080} height={1920} fps={30} durationInFrames={10} />
  <Composition id="GestureTest" component={GestureTest} width={1080} height={1920} fps={30} durationInFrames={160} />
  <Composition id="RigSheet" component={RigSheet} width={2950} height={2050} fps={30} durationInFrames={30} />
  <Composition id="Ep04" component={Ep04} width={1080} height={1920} fps={30} durationInFrames={3000} />
  <Composition id="Ep05" component={Ep05} width={1080} height={1920} fps={30} durationInFrames={3000} />
  <Composition id="Ep06" component={Ep06} width={1080} height={1920} fps={30} durationInFrames={1800} />
  <EpisodeCompositions id="Ep03R" component={Ep03R} seconds={100} />
  <EpisodeCompositions id="Ep07" component={Ep07} seconds={100} />
  <EpisodeCompositions id="Ep08" component={Ep08} seconds={100} />
  <EpisodeCompositions id="Ep09" component={Ep09} seconds={38} />
  <EpisodeCompositions id="ShowreelV13" component={ShowreelV13} seconds={12} />
  <Composition id="Lab" component={Lab} width={1080} height={1920} fps={30} durationInFrames={30} />
  {/* Would You Rather option images (wyr/scenes3d.py renders them; frame = item) */}
  <Composition id="WyrScene" component={WyrScene} width={1350} height={1200} fps={30} durationInFrames={64} defaultProps={{ items: [{ name: "phone", side: "A", layer: "fg", ban: true }] }} />
  <Composition id="WyrTile" component={WyrTile} width={1140} height={780} fps={30} durationInFrames={64} defaultProps={{ items: [{ name: "phone", side: "A", layer: "tile", ban: true }] }} />
  <Composition id="Showreel" component={Showreel} width={1080} height={1920} fps={30} durationInFrames={300} />
</>;
