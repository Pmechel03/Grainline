import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C, ease } from "../theme";
import { WOODS } from "../../../pricing.js";
import { Cap, Captions, Plank, W, clamp } from "./common";
import { BOARD, CUT } from "./Cut";

// A rag wipes hardwax oil along the shelf piece and the walnut darkens behind it.
export const Oil: React.FC = () => {
  const f = useCurrentFrame();
  const wipe = interpolate(f, [4, 26], [0, 1], { ...clamp, easing: ease });
  const zoom = interpolate(f, [0, 36], [1, 1.1]);
  const rag = interpolate(f, [2, 6, 24, 30], [0, 1, 1, 0], clamp);
  const x = (W - CUT) / 2;

  return (
    <AbsoluteFill style={{ background: C.night }}>
      <div style={{ position: "absolute", left: -200, right: -200, top: BOARD.y - 520, height: 1240,
        background: "radial-gradient(closest-side, rgba(255,196,107,0.16), rgba(255,196,107,0))" }} />
      <div style={{ position: "absolute", left: x, top: BOARD.y, width: CUT, height: BOARD.h, transform: `scale(${zoom})` }}>
        <Plank w={CUT} h={BOARD.h} hex={BOARD.raw} seed={BOARD.seed} style={{ position: "absolute" }} />
        <div style={{ position: "absolute", inset: 0, clipPath: `inset(0 ${(1 - wipe) * 100}% 0 0)` }}>
          <Plank w={CUT} h={BOARD.h} hex={WOODS.Walnut.hex} seed={BOARD.seed} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(255,255,255,0.16), rgba(255,255,255,0) 60%)" }} />
        </div>
        {/* wet sheen at the leading edge */}
        <div style={{ position: "absolute", top: 0, bottom: 0, left: wipe * CUT - 90, width: 120, opacity: rag,
          background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,236,200,0.45), rgba(255,255,255,0))" }} />
        {/* the rag */}
        <div style={{ position: "absolute", left: wipe * CUT - 100, top: -30 + Math.sin(f * 0.9) * 10, width: 190, height: 150, opacity: rag,
          borderRadius: "18% 30% 22% 34%", transform: `rotate(${-14 + Math.sin(f * 0.6) * 6}deg)`,
          background: "linear-gradient(160deg, #F2ECE2 0%, #E6DCCB 38%, #F4EEE5 40%, #DED3C1 72%, #EAE2D5 74%, #D7CBB8 100%)",
          boxShadow: "0 18px 30px rgba(0,0,0,0.35)" }} />
      </div>
      <Captions>
        <Cap delay={2}>Hardwax oil.</Cap>
        <Cap delay={12} add>Brings out the grain.</Cap>
      </Captions>
    </AbsoluteFill>
  );
};
