import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C, ease } from "../theme";
import { WOODS } from "../../../pricing.js";
import { Cap, Captions, Plank, clamp } from "./common";
import { BOARD, CUT, RESTING } from "./Cut";

export const SCENE = 84;

// A rag wipes hardwax oil along the shelf piece and the walnut deepens behind it.
export const Oil: React.FC = () => {
  const f = useCurrentFrame();
  const wipe = interpolate(f, [10, 58], [0, 1], { ...clamp, easing: ease });
  const rag = interpolate(f, [4, 14, 54, 66], [0, 1, 1, 0], clamp);
  const zoom = RESTING.scale + 0.06 * Math.min(1, f / SCENE);

  return (
    <AbsoluteFill style={{ background: C.night }}>
      <div style={{ position: "absolute", left: -260, right: -260, top: BOARD.y - 560, height: 1300,
        background: "radial-gradient(closest-side, rgba(255,196,107,0.14), rgba(255,196,107,0))" }} />
      <AbsoluteFill style={{ transform: `scale(${zoom})` }}>
        <div style={{ position: "absolute", left: RESTING.x, top: RESTING.y, width: CUT, height: BOARD.h }}>
          <Plank w={CUT} h={BOARD.h} hex={BOARD.raw} seed={BOARD.seed} style={{ position: "absolute" }} />
          <div style={{ position: "absolute", inset: 0, clipPath: `inset(0 ${(1 - wipe) * 100}% 0 0)` }}>
            <Plank w={CUT} h={BOARD.h} hex={WOODS.Walnut.hex} seed={BOARD.seed} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(255,255,255,0.16), rgba(255,255,255,0) 60%)" }} />
          </div>
          {/* wet sheen at the leading edge */}
          <div style={{ position: "absolute", top: 0, bottom: 0, left: wipe * CUT - 110, width: 140, opacity: rag,
            background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,236,200,0.4), rgba(255,255,255,0))" }} />
          {/* the rag */}
          <div style={{ position: "absolute", left: wipe * CUT - 110, top: -34 + Math.sin(f * 0.35) * 8, width: 190, height: 150, opacity: rag,
            borderRadius: "18% 30% 22% 34%", transform: `rotate(${-14 + Math.sin(f * 0.25) * 5}deg)`,
            background: "linear-gradient(160deg, #F2ECE2 0%, #E6DCCB 38%, #F4EEE5 40%, #DED3C1 72%, #EAE2D5 74%, #D7CBB8 100%)",
            boxShadow: "0 18px 30px rgba(0,0,0,0.35)" }} />
        </div>
      </AbsoluteFill>
      <Captions end={SCENE}>
        <Cap delay={6}>Hardwax oil.</Cap>
        <Cap delay={26} add>Brings out the grain.</Cap>
      </Captions>
    </AbsoluteFill>
  );
};
