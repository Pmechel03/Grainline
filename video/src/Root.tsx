import { Composition } from "remotion";
import { Promo, PROMO_DURATION } from "./Promo";
import { TikTok, TIKTOK_DURATION } from "./TikTok";

export const Root: React.FC = () => (
  <>
    <Composition id="Promo" component={Promo} durationInFrames={PROMO_DURATION} fps={30} width={1920} height={1080} />
    <Composition id="TikTok" component={TikTok} durationInFrames={TIKTOK_DURATION} fps={30} width={1080} height={1920} />
  </>
);
