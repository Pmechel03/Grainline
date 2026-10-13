import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { C, serif, useProgress } from "../theme";
import { Cap, Captions, Plank, W, clamp, drift, rng } from "./common";

// A 48″ raw walnut board, seen from above. We cut a 36″ shelf from it.
export const BOARD = { w: 860, h: 190, x: 110, y: 865, raw: "#94735A", seed: 11 };
export const CUT = BOARD.w * 0.75;
export const SCENE = 96;
const cutX = BOARD.x + CUT;

// A circular saw blade, seen from a steep angle so it reads as a slim
// spinning disc. It glides down the pencil line and the kerf opens behind it.
const R = 165; // blade radius
const S = R * 2 + 20;
const bladeY = (f: number) => interpolate(f, [16, 62], [BOARD.y - R - 90, BOARD.y + BOARD.h + R + 50], { ...clamp, easing: Easing.inOut(Easing.cubic) });
const kerfAt = (f: number) => Math.min(1, Math.max(0, (bladeY(f) + R * 0.95 - BOARD.y) / BOARD.h));

const Blade: React.FC<{ frame: number }> = ({ frame }) => {
  const shown = interpolate(frame, [12, 22, 54, 64], [0, 1, 1, 0], clamp);
  const teeth = 40, step = (Math.PI * 2) / teeth;
  const at = (r: number, a: number) => `${(r * Math.cos(a)).toFixed(1)} ${(r * Math.sin(a)).toFixed(1)}`;
  let rim = "";
  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    rim += `${i ? "L" : "M"} ${at(R - 12, a)} L ${at(R, a + step * 0.62)} L ${at(R - 3, a + step * 0.78)} L ${at(R - 12, a + step)} `;
  }
  const y = bladeY(frame);
  return (
    <div style={{ position: "absolute", left: cutX - S / 2, top: y - S / 2, width: S, height: S, opacity: shown }}>
      {/* soft shadow cast to the right */}
      <div style={{ position: "absolute", left: S / 2 + 6, top: 30, width: 70, height: S - 60, borderRadius: "50%", background: "rgba(10,6,3,0.45)", filter: "blur(14px)" }} />
      <svg viewBox={`${-S / 2} ${-S / 2} ${S} ${S}`} width={S} height={S}
        style={{ position: "absolute", inset: 0, transform: "perspective(1400px) rotateY(70deg)" }}>
        <defs>
          <radialGradient id="steel" cx="0.38" cy="0.32" r="0.8">
            <stop offset="0" stopColor="#F1F3F5" /><stop offset="0.55" stopColor="#BFC5CB" /><stop offset="1" stopColor="#8A9198" />
          </radialGradient>
        </defs>
        <g transform={`rotate(${frame * 4.5})`}>
          <path d={rim + "Z"} fill="url(#steel)" />
          <circle r={R - 26} fill="none" stroke="#9AA1A8" strokeWidth="1.5" opacity="0.6" />
          {[0, 1, 2, 3, 4, 5].map(i => <path key={i} d={`M ${at(R * 0.5, i * Math.PI / 3)} Q ${at(R * 0.72, i * Math.PI / 3 + 0.08)} ${at(R * 0.8, i * Math.PI / 3 + 0.3)}`} stroke="#7F868D" strokeWidth="4" fill="none" strokeLinecap="round" />)}
          <circle r={R * 0.2} fill="#A7AEB5" />
          <circle r={R * 0.09} fill="#3B3F44" />
        </g>
      </svg>
    </div>
  );
};

// Fine sawdust drifting up out of the cut, soft as dust in a light beam.
const MOTES = Array.from({ length: 80 }, (_, i) => {
  const r = rng(i * 31 + 7);
  return { t: 18 + i * 0.5, vx: (r() - 0.5) * 4.5, vy: -(1 + r() * 3.2), size: 3 + r() * 5, life: 32 + r() * 22,
    color: ["255,228,190", "233,210,175", "214,186,150"][Math.floor(r() * 3)] };
});
const Motes: React.FC<{ frame: number }> = ({ frame }) => (
  <>
    {MOTES.map((m, i) => {
      const age = frame - m.t, k = kerfAt(m.t);
      if (age < 0 || age > m.life || k <= 0 || k >= 1) return null;
      const fade = Math.min(1, age / 5, (m.life - age) / 16);
      const slow = 1 - Math.exp(-age / 18); // eases out as it drifts
      return <i key={i} style={{ position: "absolute", left: cutX + m.vx * 18 * slow, top: BOARD.y + k * BOARD.h + m.vy * 18 * slow - age * 0.6,
        width: m.size, height: m.size, borderRadius: "50%", opacity: 0.85 * fade,
        background: `radial-gradient(circle, rgba(${m.color},1), rgba(${m.color},0) 70%)` }} />;
    })}
  </>
);

export const Cut: React.FC = () => {
  const f = useCurrentFrame();
  const mark = useProgress(4, 16);
  const kerf = kerfAt(f);
  const part = useProgress(64, 26);
  const dx = ((W - CUT) / 2 - BOARD.x) * part;
  const piece = (from: number, to: number): React.CSSProperties => ({
    position: "absolute", left: BOARD.x + from, top: BOARD.y, width: to - from, height: BOARD.h, overflow: "hidden",
  });

  return (
    <AbsoluteFill style={{ background: C.night }}>
      <div style={{ position: "absolute", left: -260, right: -260, top: BOARD.y - 560, height: 1300,
        background: "radial-gradient(closest-side, rgba(255,196,107,0.14), rgba(255,196,107,0))" }} />
      <AbsoluteFill style={{ transform: drift(f, SCENE) }}>
        {/* the shelf piece */}
        <div style={{ ...piece(0, CUT), transform: `translateX(${dx}px)` }}>
          <Plank w={BOARD.w} h={BOARD.h} hex={BOARD.raw} seed={BOARD.seed} />
        </div>
        {/* the offcut glides away once it's free */}
        <div style={{ ...piece(CUT, BOARD.w), transform: `translateX(${dx + 200 * part}px)`, opacity: 1 - part }}>
          <Plank w={BOARD.w} h={BOARD.h} hex={BOARD.raw} seed={BOARD.seed} style={{ marginLeft: -CUT }} />
        </div>
        {/* pencil line, then the kerf */}
        <i style={{ position: "absolute", left: cutX - 1.5, top: BOARD.y - 14, width: 3, height: (BOARD.h + 28) * mark, background: "#2B2622", opacity: 0.8 * (1 - kerf) }} />
        <i style={{ position: "absolute", left: cutX - 3, top: BOARD.y, width: 6, height: BOARD.h * kerf, background: "#1A120C", opacity: 1 - part }} />
        {/* 36″ dimension line */}
        <div style={{ position: "absolute", left: BOARD.x + dx, width: CUT, top: BOARD.y - 120, height: 90, opacity: mark * (1 - part) }}>
          <div style={{ textAlign: "center", font: `400 64px ${serif}`, color: C.cream }}>36″</div>
          <i style={{ position: "absolute", left: 0, right: 0, bottom: 14, height: 2, background: C.step }} />
          <i style={{ position: "absolute", left: 0, bottom: 2, width: 2, height: 26, background: C.step }} />
          <i style={{ position: "absolute", right: 0, bottom: 2, width: 2, height: 26, background: C.step }} />
        </div>
        <Motes frame={f} />
        <Blade frame={f} />
      </AbsoluteFill>
      <Captions end={SCENE}>
        <Cap delay={2}>Raw walnut.</Cap>
        <Cap delay={24} add>Cut to the inch.</Cap>
      </Captions>
    </AbsoluteFill>
  );
};

// Where the shelf piece rests at the end of the cut; the oil scene picks up
// from here, including the push-in, so the crossfade lines up.
export const RESTING = { x: (W - CUT) / 2, y: BOARD.y, scale: 1.04 };
