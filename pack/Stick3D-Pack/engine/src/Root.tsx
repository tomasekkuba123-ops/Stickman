import React from "react";
import { Composition } from "remotion";
import "@fontsource/inter/900.css";
import { Main } from "./Main";
import { NvidiaV4 } from "./videos/NvidiaV4";
import { Ep02 } from "./videos/Ep02";
import { RigSheet } from "./videos/RigSheet";
import { Ep03 } from "./videos/Ep03";
import { Ep04 } from "./videos/Ep04";
import { Ep05 } from "./videos/Ep05";
import { Ep06 } from "./videos/Ep06";
// DURATION: set durationInFrames = ceil(voiceover_seconds * 30). Use --props or edit per video.
export const Root: React.FC = () => <>
  <Composition id="Main" component={Main} width={720} height={1280} fps={30} durationInFrames={60} />
  <Composition id="NvidiaV4" component={NvidiaV4} width={720} height={1280} fps={30} durationInFrames={661} />
  <Composition id="Ep02" component={Ep02} width={1080} height={1920} fps={30} durationInFrames={3000} />
  <Composition id="RigSheet" component={RigSheet} width={2950} height={2050} fps={30} durationInFrames={30} />
  <Composition id="Ep03" component={Ep03} width={1080} height={1920} fps={30} durationInFrames={3000} />
  <Composition id="Ep04" component={Ep04} width={1080} height={1920} fps={30} durationInFrames={3000} />
  <Composition id="Ep05" component={Ep05} width={1080} height={1920} fps={30} durationInFrames={3000} />
  <Composition id="Ep06" component={Ep06} width={1080} height={1920} fps={30} durationInFrames={1800} />
</>;
