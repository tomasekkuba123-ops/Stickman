import React from "react";
import { Composition } from "remotion";
import "@fontsource/inter/900.css";
import { Main } from "./Main";
import { NvidiaV4 } from "./videos/NvidiaV4";
import { Ep02 } from "./videos/Ep02";
import { RigSheet } from "./videos/RigSheet";
import { Ep04 } from "./videos/Ep04";
import { Ep05 } from "./videos/Ep05";
import { Ep06 } from "./videos/Ep06";
import { Ep03R } from "./videos/Ep03R";
import { EpisodeCompositions } from "./kit/episode";
import { Showreel } from "./videos/Showreel";
import { Lab } from "./videos/Lab";
import { ShowreelV13 } from "./videos/ShowreelV13";
// NEW EPISODES: register with <EpisodeCompositions id="EpXX" component={EpXX} seconds={60|100} /> (adds EpXXAnimatic for approval + QC mask).
export const Root: React.FC = () => <>
  <Composition id="Main" component={Main} width={720} height={1280} fps={30} durationInFrames={60} />
  <Composition id="NvidiaV4" component={NvidiaV4} width={720} height={1280} fps={30} durationInFrames={661} />
  <Composition id="Ep02" component={Ep02} width={1080} height={1920} fps={30} durationInFrames={3000} />
  <Composition id="RigSheet" component={RigSheet} width={2950} height={2050} fps={30} durationInFrames={30} />
  <Composition id="Ep04" component={Ep04} width={1080} height={1920} fps={30} durationInFrames={3000} />
  <Composition id="Ep05" component={Ep05} width={1080} height={1920} fps={30} durationInFrames={3000} />
  <Composition id="Ep06" component={Ep06} width={1080} height={1920} fps={30} durationInFrames={1800} />
  <EpisodeCompositions id="Ep03R" component={Ep03R} seconds={100} />
  <EpisodeCompositions id="ShowreelV13" component={ShowreelV13} seconds={12} />
  <Composition id="Lab" component={Lab} width={1080} height={1920} fps={30} durationInFrames={30} />
  <Composition id="Showreel" component={Showreel} width={1080} height={1920} fps={30} durationInFrames={300} />
</>;
