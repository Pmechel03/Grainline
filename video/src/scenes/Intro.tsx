import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, serif, useProgress, useSpring } from "../theme";

// The Grainline mark is a hinge: two leaves on a pin, drawn on an 80-unit grid.
const LEAF = "#D9B892", PIN = "#C08A3E";
const pct = (n: number, of: number) => `${(n / of) * 100}%`;

// One leaf with its two screws. The right leaf turns on the pin's center
// line (x = 40), so folded shut it lies exactly over the left leaf.
const Leaf: React.FC<{ x: number; screwX: number; size: number; swing?: number; screws: number }> = ({ x, screwX, size, swing = 0, screws }) => {
  const turn = Math.abs(Math.cos((swing * Math.PI) / 180));
  const shade = (0.62 + 0.38 * turn) * (Math.abs(swing) > 90 ? 0.9 : 1); // edge-on and back faces read darker
  const screw = (cy: number): React.CSSProperties => ({
    position: "absolute", left: pct(screwX, 26), top: pct(cy, 60), width: (size * 6) / 80, height: (size * 6) / 80,
    borderRadius: "50%", background: C.night, transform: `translate(-50%, -50%) scale(${screws})`,
  });
  return (
    <div style={{
      position: "absolute", left: pct(x, 80), top: pct(10, 80), width: pct(26, 80), height: pct(60, 80),
      borderRadius: (size * 4) / 80, background: LEAF, filter: `brightness(${shade})`,
      transformOrigin: `${pct(40 - x, 26)} 50%`, transform: `perspective(${size * 2.2}px) rotateY(${swing}deg)`,
    }}>
      <i style={screw(14)} />
      <i style={screw(46)} />
    </div>
  );
};

const Pin: React.FC<{ size: number }> = ({ size }) => {
  const knuckle = (y: number): React.CSSProperties => ({
    position: "absolute", left: 0, right: 0, top: pct(y - 6, 68), height: (size * 2) / 80, transform: "translateY(-50%)", background: C.night,
  });
  return (
    <div style={{ position: "absolute", left: pct(31, 80), top: pct(6, 80), width: pct(18, 80), height: pct(68, 80), borderRadius: (size * 9) / 80, background: PIN }}>
      <i style={knuckle(29)} />
      <i style={knuckle(51)} />
    </div>
  );
};

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
        <div style={{ position: "relative", flex: "none", width: size, height: size, opacity: appear, transform: `translateY(${(1 - appear) * 20}px)` }}>
          <Leaf x={6} screwX={12} size={size} screws={screws} />
          <Leaf x={48} screwX={14} size={size} screws={screws} swing={-180 * (1 - open)} />
          <Pin size={size} />
        </div>
        <div style={{ maxWidth: 1000 * word, overflow: "hidden" }}>
          <div style={{ font: `400 112px ${serif}`, letterSpacing: "-0.01em", color: C.cream, whiteSpace: "nowrap", opacity: word, transform: `translateX(${(1 - word) * -30}px)` }}>
            Grainline Creations
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
