import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, Rise, sans, serif, useProgress } from "../theme";
import { Hinge } from "../Hinge";
import { clamp } from "./common";

// The hinge opens, then the name, the promise and the address settle in.
export const EndCard: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const appear = useProgress(0, 14);
  const open = spring({ frame: f - 8, fps, config: { damping: 20 }, durationInFrames: 30 });
  const screws = useProgress(30, 14);
  const glow = interpolate(f, [8, 40, 105], [0, 0.24, 0.14], clamp);
  return (
    <AbsoluteFill style={{ background: C.night, alignItems: "center", paddingTop: 380, textAlign: "center" }}>
      <div style={{ position: "absolute", top: 160, width: 1100, height: 1100, borderRadius: "50%", opacity: glow,
        background: "radial-gradient(closest-side, rgba(255,196,107,0.5), rgba(255,196,107,0))" }} />
      <Hinge size={300} open={open} screws={screws} style={{ opacity: appear }} />
      <Rise delay={34} dist={18} dur={20}>
        <div style={{ font: `400 136px/1 ${serif}`, letterSpacing: "-0.015em", color: C.cream, marginTop: 50 }}>Grainline</div>
      </Rise>
      <Rise delay={40} dist={18} dur={20}>
        <div style={{ font: `400 136px/1 ${serif}`, letterSpacing: "-0.015em", color: C.cream, marginTop: 6 }}>Creations</div>
      </Rise>
      <Rise delay={54} dist={14} dur={18}>
        <p style={{ font: `400 48px/1.4 ${sans}`, color: C.nightText, margin: "44px 0 0" }}>Made to order. Sized to the inch.</p>
      </Rise>
      <Rise delay={64} dist={14} dur={18}>
        <div style={{ font: `500 44px ${sans}`, background: C.paper, color: C.ink, padding: "26px 52px", borderRadius: 2, marginTop: 52 }}>grainlinecreations.com</div>
      </Rise>
    </AbsoluteFill>
  );
};
