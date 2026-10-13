import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, serif, useProgress, useSpring } from "../theme";
import { Hinge } from "../Hinge";

// The hinge swings open, then steps aside for the name.
export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const appear = useProgress(0, 14);
  // About a second to swing open, a touch past flat, then settle.
  const open = spring({ frame: frame - 18, fps, config: { damping: 13 }, durationInFrames: 34 });
  const screws = useSpring(46, 10);
  const lockup = useProgress(62, 30);
  const word = useProgress(66, 32);
  const glow = interpolate(frame, [18, 50, 100], [0, 0.22, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const size = interpolate(lockup, [0, 1], [420, 150]);

  return (
    <AbsoluteFill style={{ background: C.night, alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", width: 1000, height: 1000, borderRadius: "50%", opacity: glow,
        background: "radial-gradient(closest-side, rgba(255,196,107,0.5), rgba(255,196,107,0))" }} />
      <div style={{ display: "flex", alignItems: "center", gap: 40 * lockup }}>
        <Hinge size={size} open={open} screws={screws} style={{ opacity: appear, transform: `translateY(${(1 - appear) * 20}px)` }} />
        <div style={{ maxWidth: 1000 * word, overflow: "hidden" }}>
          <div style={{ font: `400 112px ${serif}`, letterSpacing: "-0.01em", color: C.cream, whiteSpace: "nowrap", opacity: word, transform: `translateX(${(1 - word) * -30}px)` }}>
            Grainline Creations
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
