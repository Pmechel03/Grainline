/* The Grainline mark is a hinge: two leaves on a pin, drawn on an 80-unit grid.
   Built from boxes rather than one SVG so the right leaf can swing in 3D. */
import { C } from "./theme";

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

// `open` runs 0 (folded shut) → 1 (flat); `screws` 0 → 1 pops the screws in.
export const Hinge: React.FC<{ size: number; open: number; screws: number; style?: React.CSSProperties }> = ({ size, open, screws, style }) => (
  <div style={{ position: "relative", flex: "none", width: size, height: size, ...style }}>
    <Leaf x={6} screwX={12} size={size} screws={screws} />
    <Leaf x={48} screwX={14} size={size} screws={screws} swing={-180 * (1 - open)} />
    <Pin size={size} />
  </div>
);
