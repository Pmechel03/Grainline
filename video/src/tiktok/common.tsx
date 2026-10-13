/* Pieces shared by the vertical (TikTok) cut. Captions sit in the upper
   third, clear of TikTok's own buttons on the right and caption at the bottom. */
import { useMemo } from "react";
import { C, serif, useProgress } from "../theme";

export const W = 1080, H = 1920;
export const CAPTION_TOP = 250;
export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Same small seeded random and color helpers drawing.js uses for its grain.
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
export function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = n >> 8 & 255, b = n & 255;
  const t = amt < 0 ? 0 : 255, p = Math.abs(amt);
  r = Math.round(r + (t - r) * p); g = Math.round(g + (t - g) * p); b = Math.round(b + (t - b) * p);
  return "#" + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}

// A few pixels of camera shake between `from` and `to`, for impacts and the saw.
export function shake(frame: number, from: number, to: number, amp: number) {
  if (frame < from || frame > to) return "none";
  const r = rng(frame * 7919 + 13);
  return `translate(${(r() - 0.5) * 2 * amp}px, ${(r() - 0.5) * 2 * amp}px)`;
}

// A board seen from above, grain running along its length.
export const Plank: React.FC<{ w: number; h: number; hex: string; seed?: number; style?: React.CSSProperties }> = ({ w, h, hex, seed = 11, style }) => {
  const lines = useMemo(() => {
    const r = rng(seed), dark = shade(hex, -0.3), light = shade(hex, 0.14);
    return Array.from({ length: 18 }, () => {
      const y = r() * h, a = (r() - 0.5) * h * 0.14;
      return { d: `M-10 ${y.toFixed(1)} C ${w * 0.3} ${(y + a).toFixed(1)}, ${w * 0.7} ${(y - a).toFixed(1)}, ${w + 10} ${(y + a * 0.4).toFixed(1)}`,
        stroke: r() < 0.25 ? light : dark, width: 1 + r() * 2.6, opacity: 0.22 + r() * 0.4 };
    });
  }, [w, h, hex, seed]);
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block", ...style }}>
      <rect width={w} height={h} fill={hex} />
      {lines.map((l, i) => <path key={i} d={l.d} stroke={l.stroke} strokeWidth={l.width} fill="none" opacity={l.opacity} />)}
    </svg>
  );
};

// Big caption lines that pop in. `add` lines are the thing each step adds.
export const Cap: React.FC<{ delay: number; add?: boolean; size?: number; dark?: boolean; children: React.ReactNode }> = ({ delay, add, size, dark, children }) => {
  const p = useProgress(delay, 8);
  const color = add ? (dark ? "#8B5E34" : C.step) : (dark ? C.ink : C.cream);
  return (
    <div style={{ font: `${add ? 400 : 300} ${size ?? (add ? 76 : 112)}px/1.05 ${serif}`, letterSpacing: "-0.02em", color,
      opacity: p, transform: `translateY(${(1 - p) * 24}px) scale(${0.92 + 0.08 * p})` }}>
      {children}
    </div>
  );
};

export const Captions: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ position: "absolute", top: CAPTION_TOP, left: 80, right: 80, display: "flex", flexDirection: "column", alignItems: "center", gap: 18, textAlign: "center" }}>
    {children}
  </div>
);
