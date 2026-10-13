import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { C, serif, useProgress } from "../theme";
import { Cap, Captions, Plank, W, clamp, rng, shake } from "./common";

// A 48″ raw walnut board on the bench, seen from above. We cut a 36″ shelf from it.
export const BOARD = { w: 860, h: 190, x: 110, y: 1010, raw: "#94735A", seed: 11 };
export const CUT = BOARD.w * 0.75;
const R = 150; // saw blade radius
const cutX = BOARD.x + CUT;

// Blade center height over time: drops through the board in under a second.
const sawY = (f: number) => interpolate(f, [8, 34], [BOARD.y - R - 120, BOARD.y + BOARD.h + 10], { ...clamp, easing: Easing.inOut(Easing.quad) });
const kerfAt = (f: number) => Math.min(1, Math.max(0, (sawY(f) + R - BOARD.y) / BOARD.h));

// Circular saw: spinning toothed blade under a fixed guard.
const Saw: React.FC<{ angle: number }> = ({ angle }) => {
  const teeth = 32, step = (Math.PI * 2) / teeth;
  const at = (r: number, a: number) => `${(r * Math.cos(a)).toFixed(1)} ${(r * Math.sin(a)).toFixed(1)}`;
  let d = "";
  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    d += `${i ? "L" : "M"} ${at(R - 14, a)} L ${at(R, a + step * 0.75)} L ${at(R - 14, a + step)} `;
  }
  const s = R + 30;
  return (
    <svg width={s * 2} height={s * 2} viewBox={`${-s} ${-s} ${s * 2} ${s * 2}`} style={{ display: "block" }}>
      <defs>
        <radialGradient id="steel"><stop offset="0" stopColor="#E4E7EA" /><stop offset="0.7" stopColor="#B7BDC3" /><stop offset="1" stopColor="#8D949B" /></radialGradient>
      </defs>
      <g transform={`rotate(${angle})`}>
        <path d={d + "Z"} fill="url(#steel)" />
        {[0, 1, 2, 3].map(i => <path key={i} d={`M ${at(R * 0.45, i * Math.PI / 2)} L ${at(R * 0.78, i * Math.PI / 2 + 0.18)}`} stroke="#7D848B" strokeWidth="5" strokeLinecap="round" />)}
        <circle r={R * 0.16} fill="#5E646A" />
        <circle r={R * 0.07} fill="#2C2F33" />
      </g>
      <circle r={R - 7} fill="none" stroke="#fff" strokeOpacity="0.16" strokeWidth="12" />
      {/* guard over the top half */}
      <path d={`M ${-R - 18} 0 A ${R + 18} ${R + 18} 0 0 1 ${R + 18} 0 L ${R * 0.35} 0 A ${R * 0.35} ${R * 0.35} 0 0 0 ${-R * 0.35} 0 Z`} fill="#3A3632" />
      <path d={`M ${-R - 18} 0 A ${R + 18} ${R + 18} 0 0 1 ${R + 18} 0`} fill="none" stroke="#C08A3E" strokeWidth="6" />
    </svg>
  );
};

// Sawdust thrown from where the blade meets the board.
const DUST = Array.from({ length: 140 }, (_, i) => {
  const r = rng(i * 31 + 7);
  const toRight = r() < 0.7;
  return {
    t: 10 + i * 0.16, vx: (toRight ? 1 : -1) * (5 + r() * 13), vy: -(5 + r() * 14), size: 4 + r() * 7,
    color: ["#D9B892", "#E6CFAE", "#BF9E7E", BOARD.raw][Math.floor(r() * 4)],
  };
});
const Dust: React.FC<{ frame: number }> = ({ frame }) => (
  <>
    {DUST.map((p, i) => {
      const age = frame - p.t, k = kerfAt(p.t);
      if (age < 0 || age > 24 || k <= 0 || k >= 1) return null;
      const y0 = BOARD.y + k * BOARD.h;
      return <i key={i} style={{ position: "absolute", left: cutX + p.vx * age, top: y0 + p.vy * age + 0.6 * age * age,
        width: p.size, height: p.size, borderRadius: "50%", background: p.color, opacity: Math.min(1, (24 - age) / 8) }} />;
    })}
  </>
);

export const Cut: React.FC = () => {
  const f = useCurrentFrame();
  const mark = useProgress(0, 8);
  const kerf = kerfAt(f);
  const fall = Math.max(0, f - 33);
  const center = useProgress(40, 12);
  const dx = ((W - CUT) / 2 - BOARD.x) * center;
  const piece = (from: number, to: number): React.CSSProperties => ({
    position: "absolute", left: BOARD.x + from, top: BOARD.y, width: to - from, height: BOARD.h, overflow: "hidden",
  });

  return (
    <AbsoluteFill style={{ background: C.night }}>
      <div style={{ position: "absolute", left: -200, right: -200, top: BOARD.y - 520, height: 1240,
        background: "radial-gradient(closest-side, rgba(255,196,107,0.16), rgba(255,196,107,0))" }} />
      <AbsoluteFill style={{ transform: shake(f, 12, 32, 6) }}>
        {/* the shelf piece */}
        <div style={{ ...piece(0, CUT), transform: `translateX(${dx}px)` }}>
          <Plank w={BOARD.w} h={BOARD.h} hex={BOARD.raw} seed={BOARD.seed} />
        </div>
        {/* the offcut, which drops away once it's free */}
        <div style={{ ...piece(CUT, BOARD.w), transformOrigin: "left center",
          transform: `translate(${fall * 6}px, ${0.9 * fall * fall}px) rotate(${fall * 2.2}deg)` }}>
          <Plank w={BOARD.w} h={BOARD.h} hex={BOARD.raw} seed={BOARD.seed} style={{ marginLeft: -CUT }} />
        </div>
        {/* pencil mark, then the kerf behind the blade */}
        <i style={{ position: "absolute", left: cutX - 2, top: BOARD.y - 16, width: 4, height: (BOARD.h + 32) * mark, background: "#2B2622", opacity: f > 33 ? 0 : 0.85 }} />
        <i style={{ position: "absolute", left: cutX - 4, top: BOARD.y, width: 8, height: BOARD.h * kerf, background: "#1A120C", opacity: f > 33 ? 0 : 1 }} />
        {/* 36″ dimension line */}
        <div style={{ position: "absolute", left: BOARD.x + dx, width: CUT, top: BOARD.y - 120, height: 90, opacity: mark * (1 - center) }}>
          <div style={{ textAlign: "center", font: `400 64px ${serif}`, color: C.cream }}>36″</div>
          <i style={{ position: "absolute", left: 0, right: 0, bottom: 14, height: 3, background: C.step }} />
          <i style={{ position: "absolute", left: 0, bottom: 0, width: 3, height: 30, background: C.step }} />
          <i style={{ position: "absolute", right: 0, bottom: 0, width: 3, height: 30, background: C.step }} />
        </div>
        <Dust frame={f} />
        {f >= 6 && f <= 40 && (
          <div style={{ position: "absolute", left: cutX - R - 30, top: sawY(f) - R - 30 }}>
            <Saw angle={f * 23} />
          </div>
        )}
      </AbsoluteFill>
      <Captions>
        <Cap delay={2}>Raw walnut.</Cap>
        <Cap delay={12} add>Cut to the inch.</Cap>
      </Captions>
    </AbsoluteFill>
  );
};
