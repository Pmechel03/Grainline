import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { Cut, SCENE as CUT_FRAMES } from "./tiktok/Cut";
import { Oil, SCENE as OIL_FRAMES } from "./tiktok/Oil";
import { Shelf, Steps, Charger, Finishes, FRAMES } from "./tiktok/Products";
import { FADE } from "./tiktok/common";
import { EndCard } from "./tiktok/EndCard";

// The vertical cut for TikTok and Reels: from raw board to finished pieces,
// joined by soft crossfades. Lengths are in frames (30 per second).
const SCENES: [React.FC, number][] = [
  [Cut, CUT_FRAMES],
  [Oil, OIL_FRAMES],
  [Shelf, FRAMES.shelf],
  [Steps, FRAMES.steps],
  [Charger, FRAMES.charger],
  [Finishes, FRAMES.finishes],
  [EndCard, 105],
];
export const TIKTOK_DURATION = SCENES.reduce((sum, [, d]) => sum + d, 0) - FADE * (SCENES.length - 1);

export const TikTok: React.FC = () => (
  <>
    <style>{".art svg { display: block; width: 100%; height: 100%; }"}</style>
    <TransitionSeries>
      {SCENES.flatMap(([Scene, frames], i) => [
        <TransitionSeries.Sequence key={`s${i}`} durationInFrames={frames}><Scene /></TransitionSeries.Sequence>,
        ...(i < SCENES.length - 1 ? [<TransitionSeries.Transition key={`t${i}`} presentation={fade()}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: FADE })} />] : []),
      ])}
    </TransitionSeries>
  </>
);
