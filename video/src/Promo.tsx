import { AbsoluteFill } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { C } from "./theme";
import { Intro } from "./scenes/Intro";
import { Hero } from "./scenes/Hero";
import { Collection } from "./scenes/Collection";
import { Sizing } from "./scenes/Sizing";
import { Materials } from "./scenes/Materials";
import { Process } from "./scenes/Process";
import { Outro } from "./scenes/Outro";

// Scenes in order, with their length in frames (30 per second).
const SCENES: [React.FC, number][] = [
  [Intro, 75],
  [Hero, 150],
  [Collection, 180],
  [Sizing, 165],
  [Materials, 165],
  [Process, 135],
  [Outro, 120],
];
const FADE = 12;
export const PROMO_DURATION = SCENES.reduce((sum, [, d]) => sum + d, 0) - FADE * (SCENES.length - 1);

export const Promo: React.FC = () => (
  <AbsoluteFill style={{ background: C.night, WebkitFontSmoothing: "antialiased" }}>
    <style>{".art svg { display: block; width: 100%; height: 100%; }"}</style>
    <TransitionSeries>
      {SCENES.flatMap(([Scene, frames], i) => [
        <TransitionSeries.Sequence key={`s${i}`} durationInFrames={frames}><Scene /></TransitionSeries.Sequence>,
        ...(i < SCENES.length - 1 ? [<TransitionSeries.Transition key={`t${i}`} presentation={fade()} timing={linearTiming({ durationInFrames: FADE })} />] : []),
      ])}
    </TransitionSeries>
  </AbsoluteFill>
);
