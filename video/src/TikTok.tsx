import { Series } from "remotion";
import { Cut } from "./tiktok/Cut";
import { Oil } from "./tiktok/Oil";
import { Shelf, Steps, Charger, Finishes } from "./tiktok/Products";
import { EndCard } from "./tiktok/EndCard";

// The vertical cut for TikTok and Reels: from raw board to finished pieces,
// with hard cuts between scenes. Lengths are in frames (30 per second).
const SCENES: [React.FC, number][] = [
  [Cut, 54],
  [Oil, 36],
  [Shelf, 60],
  [Steps, 54],
  [Charger, 45],
  [Finishes, 45],
  [EndCard, 75],
];
export const TIKTOK_DURATION = SCENES.reduce((sum, [, d]) => sum + d, 0);

export const TikTok: React.FC = () => (
  <>
    <style>{".art svg { display: block; width: 100%; height: 100%; }"}</style>
    <Series>
      {SCENES.map(([Scene, frames], i) => <Series.Sequence key={i} durationInFrames={frames}><Scene /></Series.Sequence>)}
    </Series>
  </>
);
