import { Composition } from "remotion";
import { Promo, PROMO_DURATION } from "./Promo";

export const Root: React.FC = () => (
  <Composition id="Promo" component={Promo} durationInFrames={PROMO_DURATION} fps={30} width={1920} height={1080} />
);
