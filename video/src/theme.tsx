/* Shared look for the promo: the site's colors, fonts and motion, plus the
   small building blocks every scene uses. */
import { useMemo } from "react";
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/fonts";
import newsreader300 from "@fontsource/newsreader/files/newsreader-latin-300-normal.woff2";
import newsreader400 from "@fontsource/newsreader/files/newsreader-latin-400-normal.woff2";
import hanken400 from "@fontsource/hanken-grotesk/files/hanken-grotesk-latin-400-normal.woff2";
import hanken500 from "@fontsource/hanken-grotesk/files/hanken-grotesk-latin-500-normal.woff2";
import hanken600 from "@fontsource/hanken-grotesk/files/hanken-grotesk-latin-600-normal.woff2";
// The site's own drawings and prices, so the video always matches the shop.
import { render } from "../../drawing.js";
import { LIGHTS } from "../../pricing.js";

loadFont({ family: "Newsreader", url: newsreader300, weight: "300" });
loadFont({ family: "Newsreader", url: newsreader400, weight: "400" });
loadFont({ family: "Hanken Grotesk", url: hanken400, weight: "400" });
loadFont({ family: "Hanken Grotesk", url: hanken500, weight: "500" });
loadFont({ family: "Hanken Grotesk", url: hanken600, weight: "600" });

// Same tokens as index.html.
export const C = {
  paper: "#F5F2EC",
  oat: "#ECE7DF",
  white: "#FDFCFA",
  ink: "#1D1B18",
  muted: "#645E55",
  line: "#DCD5CA",
  night: "#241C17",
  nightText: "#BFB4A5",
  cream: "#F2EDE4",
  step: "#E2C9A6",
};
export const serif = "'Newsreader', Georgia, serif";
export const sans = "'Hanken Grotesk', system-ui, sans-serif";
export const ease = Easing.bezier(0.2, 0.7, 0.2, 1);
export const PAD = 140; // side margin of every scene

export type Spec = {
  type: "led" | "cologne" | "charger";
  width: number; height: number; depth: number;
  wood: string; edge: string; light?: string; pad?: string;
};

// 0 → 1 between `from` and `from + dur` frames, with the site's easing.
export function useProgress(from: number, dur = 22) {
  const frame = useCurrentFrame();
  return interpolate(frame, [from, from + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
}

export function useSpring(delay: number, damping = 200) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping } });
}

// Fades its children in while lifting them into place.
export const Rise: React.FC<{ delay?: number; dist?: number; dur?: number; style?: React.CSSProperties; children: React.ReactNode }> =
  ({ delay = 0, dist = 28, dur = 22, style, children }) => {
    const p = useProgress(delay, dur);
    return <div style={{ ...style, opacity: p, transform: `translateY(${(1 - p) * dist}px)` }}>{children}</div>;
  };

// One headline line sliding up from behind a mask.
export const Line: React.FC<{ delay: number; children: React.ReactNode }> = ({ delay, children }) => {
  const p = useProgress(delay, 26);
  return (
    <span style={{ display: "block", overflow: "hidden", paddingBottom: "0.12em", marginBottom: "-0.12em" }}>
      <span style={{ display: "block", transform: `translateY(${(1 - p) * 110}%)` }}>{children}</span>
    </span>
  );
};

export const Label: React.FC<{ color?: string; style?: React.CSSProperties; children: React.ReactNode }> = ({ color = C.muted, style, children }) => (
  <div style={{ font: `600 22px ${sans}`, letterSpacing: "0.14em", textTransform: "uppercase", color, ...style }}>{children}</div>
);

export const display: React.CSSProperties = { fontFamily: serif, fontWeight: 300, letterSpacing: "-0.02em", lineHeight: 1.04, margin: 0 };

export const isLit = (spec: Spec) => !!(spec.light && LIGHTS[spec.light as keyof typeof LIGHTS]);

// A product drawing from drawing.js. Lit pieces carry their own dark wall.
export const Art: React.FC<{ spec: Spec; style?: React.CSSProperties }> = ({ spec, style }) => {
  const key = JSON.stringify(spec);
  const svg = useMemo(() => render(spec), [key]); // eslint-disable-line react-hooks/exhaustive-deps
  return <div className="art" style={{ background: isLit(spec) ? C.night : C.oat, ...style }} dangerouslySetInnerHTML={{ __html: svg }} />;
};

// The Grainline mark: two wood panels with a rail between them. `t` is the
// frame the mark starts building on; pass a negative value to show it built.
export const Mark: React.FC<{ size: number; side: string; rail: string; detail: string; t?: number }> = ({ size, side, rail, detail, t = -100 }) => {
  const left = useSpring(t), right = useSpring(t + 4), center = useSpring(t + 10);
  const dots = useSpring(t + 18, 12);
  const grow = (p: number): React.CSSProperties => ({ transform: `scaleY(${p})`, transformOrigin: "center bottom", transformBox: "fill-box" });
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} style={{ display: "block", overflow: "visible" }}>
      <rect x="6" y="10" width="26" height="60" rx="4" fill={side} style={grow(left)} />
      <rect x="48" y="10" width="26" height="60" rx="4" fill={side} style={grow(right)} />
      <g style={{ transform: `translateY(${(1 - center) * -24}px)`, opacity: center }}>
        <rect x="31" y="6" width="18" height="68" rx="9" fill={rail} />
        <line x1="31" y1="29" x2="49" y2="29" stroke={detail} strokeWidth="2" />
        <line x1="31" y1="51" x2="49" y2="51" stroke={detail} strokeWidth="2" />
      </g>
      {[[18, 24], [18, 56], [62, 24], [62, 56]].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={3 * Math.max(0, dots)} fill={detail} />
      ))}
    </svg>
  );
};
