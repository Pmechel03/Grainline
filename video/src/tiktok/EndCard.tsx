import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, Rise, sans, serif, useProgress } from "../theme";
import { Hinge } from "../Hinge";
import { clamp } from "./common";

// The hinge snaps open, then the name, promise and address.
export const EndCard: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const appear = useProgress(0, 5);
  const open = spring({ frame: f - 2, fps, config: { damping: 12 }, durationInFrames: 16 });
  const screws = spring({ frame: f - 14, fps, config: { damping: 10 } });
  const glow = interpolate(f, [2, 18, 60], [0, 0.26, 0.1], clamp);
  return (
    <AbsoluteFill style={{ background: C.night, alignItems: "center", paddingTop: 380, textAlign: "center" }}>
      <div style={{ position: "absolute", top: 160, width: 1100, height: 1100, borderRadius: "50%", opacity: glow,
        background: "radial-gradient(closest-side, rgba(255,196,107,0.5), rgba(255,196,107,0))" }} />
      <Hinge size={300} open={open} screws={screws} style={{ opacity: appear }} />
      <Rise delay={14} dist={20} dur={12}>
        <div style={{ font: `400 136px/1 ${serif}`, letterSpacing: "-0.015em", color: C.cream, marginTop: 50 }}>Grainline</div>
      </Rise>
      <Rise delay={18} dist={20} dur={12}>
        <div style={{ font: `400 136px/1 ${serif}`, letterSpacing: "-0.015em", color: C.cream, marginTop: 6 }}>Creations</div>
      </Rise>
      <Rise delay={26} dist={16} dur={12}>
        <p style={{ font: `400 48px/1.4 ${sans}`, color: C.nightText, margin: "44px 0 0" }}>Made to order. Sized to the inch.</p>
      </Rise>
      <Rise delay={32} dist={16} dur={12}>
        <div style={{ font: `500 44px ${sans}`, background: C.paper, color: C.ink, padding: "26px 52px", borderRadius: 2, marginTop: 52 }}>grainlinecreations.com</div>
      </Rise>
    </AbsoluteFill>
  );
};
