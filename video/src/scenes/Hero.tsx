import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Art, C, Label, Line, PAD, Rise, Spec, display, sans } from "../theme";

const SHELF: Spec = { type: "led", width: 36, height: 2, depth: 8, wood: "Walnut", edge: "square" };

// The homepage hero. The shelf hangs dark, then its LED strip switches on.
export const Hero: React.FC = () => {
  const frame = useCurrentFrame();
  const on = interpolate(frame, [46, 50, 53, 56, 70], [0, 0.8, 0.3, 0.9, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const push = interpolate(frame, [0, 150], [1, 1.05]);
  return (
    <AbsoluteFill style={{ background: C.night, flexDirection: "row", alignItems: "center", padding: `0 ${PAD}px`, color: C.cream }}>
      <div style={{ width: 860, flex: "none" }}>
        <Rise delay={6}><Label color={C.nightText}>Modern home &amp; room decor</Label></Rise>
        <h1 style={{ ...display, fontSize: 100, marginTop: 30 }}>
          <Line delay={12}>Solid wood,</Line>
          <Line delay={20}>made to measure.</Line>
        </h1>
        <Rise delay={38}>
          <p style={{ font: `400 30px/1.5 ${sans}`, color: C.nightText, maxWidth: "30ch", margin: "36px 0 0" }}>
            LED shelves, cologne displays and charging stations, built by hand and sized to the inch for your space.
          </p>
        </Rise>
      </div>
      <div style={{ position: "relative", flex: 1, aspectRatio: "480 / 340", marginRight: -60, transform: `scale(${push})` }}>
        <Art spec={{ ...SHELF, light: "None" }} style={{ position: "absolute", inset: 0, background: "transparent" }} />
        <Art spec={{ ...SHELF, light: "Warm white" }} style={{ position: "absolute", inset: 0, opacity: on }} />
        <Rise delay={78} style={{ position: "absolute", left: 0, right: 0, bottom: "3%", textAlign: "center", font: `400 24px ${sans}`, color: C.nightText }}>
          <b style={{ color: C.cream, fontWeight: 500 }}>LED floating shelf</b> in walnut, warm white
        </Rise>
      </div>
    </AbsoluteFill>
  );
};
