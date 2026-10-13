import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Art, C, Spec, ease, useProgress } from "../theme";
import { MATERIALS, WOODS } from "../../../pricing.js";
import { Cap, Captions, W, clamp, drift } from "./common";

const ART_TOP = 620, ART_H = (W * 340) / 480;
const art: React.CSSProperties = { position: "absolute", left: 0, top: ART_TOP, width: W, height: ART_H };
// Steps and the charging station sit in the middle of their drawings, so show them larger.
const big: React.CSSProperties = { position: "absolute", left: -110, top: 540, width: W + 220, height: ((W + 220) * 340) / 480 };
const fill: React.CSSProperties = { position: "absolute", inset: 0 };
// Scene lengths in frames.
export const FRAMES = { shelf: 84, steps: 90, charger: 78, finishes: 96 };
const glowOn = (f: number, at: number) => interpolate(f, [at, at + 24], [0, 1], { ...clamp, easing: ease });

// The oiled walnut settles onto the wall as a floating shelf, then its LED strip fades on.
const SHELF: Spec = { type: "led", width: 36, height: 2, depth: 8, wood: "Walnut", edge: "square" };
export const Shelf: React.FC = () => {
  const f = useCurrentFrame();
  const settle = useProgress(0, 26);
  return (
    <AbsoluteFill style={{ background: C.night }}>
      <AbsoluteFill style={{ transform: drift(f, FRAMES.shelf) }}>
        <div style={{ ...art, opacity: settle, transform: `translateY(${(1 - settle) * 30}px)` }}>
          <Art spec={{ ...SHELF, light: "None" }} style={{ ...fill, background: "transparent" }} />
          <Art spec={{ ...SHELF, light: "Warm white" }} style={{ ...fill, opacity: glowOn(f, 28) }} />
        </div>
      </AbsoluteFill>
      <Captions end={FRAMES.shelf}>
        <Cap delay={6}>Floating shelf.</Cap>
        <Cap delay={30} add>LED strip tucked underneath.</Cap>
      </Captions>
    </AbsoluteFill>
  );
};

// Cologne steps build up a step at a time as soft dissolves, then light up behind each row.
const BUILD = [16, 32]; // frames where the third and fourth steps appear
export const Steps: React.FC = () => {
  const f = useCurrentFrame();
  const enter = useProgress(0, 20);
  const third = useProgress(BUILD[0], 14), fourth = useProgress(BUILD[1], 14);
  const steps = (n: number): Spec => ({ type: "cologne", width: 20, height: n, depth: 9, wood: "Oak", edge: "square" });
  const layer = (o: number, rise: number): React.CSSProperties => ({ ...fill, opacity: o, transform: `translateY(${(1 - rise) * 14}px)` });
  return (
    <AbsoluteFill style={{ background: C.night }}>
      <AbsoluteFill style={{ transform: drift(f, FRAMES.steps) }}>
        <div style={{ ...big, opacity: enter }}>
          <div style={layer(1 - third, 1)}><Art spec={{ ...steps(2), light: "None" }} style={{ ...fill, background: "transparent" }} /></div>
          <div style={layer(third * (1 - fourth), third)}><Art spec={{ ...steps(3), light: "None" }} style={{ ...fill, background: "transparent" }} /></div>
          <div style={layer(fourth, fourth)}><Art spec={{ ...steps(4), light: "None" }} style={{ ...fill, background: "transparent" }} /></div>
          <Art spec={{ ...steps(4), light: "Warm white" }} style={{ ...fill, opacity: glowOn(f, 50) }} />
        </div>
      </AbsoluteFill>
      <Captions end={FRAMES.steps}>
        <Cap delay={4}>Cologne steps.</Cap>
        <Cap delay={52} add>Lit behind each row.</Cap>
      </Captions>
    </AbsoluteFill>
  );
};

// The charging station rises into place and its wireless pad glows on.
const PHONE = { x: 317 * ((W + 220) / 480), y: 290 * ((W + 220) / 480) }; // phone on the pad, in drawing.js's 480 × 340 frame
const CHARGER: Spec = { type: "charger", width: 11, height: 13, depth: 6, wood: "Walnut", edge: "rounded" };
export const Charger: React.FC = () => {
  const f = useCurrentFrame();
  const rise = useProgress(0, 26);
  const pad = useProgress(32, 14);
  const ring = useProgress(34, 30);
  return (
    <AbsoluteFill style={{ background: C.oat }}>
      <AbsoluteFill style={{ transform: drift(f, FRAMES.charger) }}>
        <div style={{ ...big, opacity: rise, transform: `translateY(${(1 - rise) * 40}px)` }}>
          <Art spec={{ ...CHARGER, pad: "Not included" }} style={fill} />
          <Art spec={{ ...CHARGER, pad: "Included" }} style={{ ...fill, opacity: pad, background: "transparent" }} />
          <i style={{ position: "absolute", left: PHONE.x, top: PHONE.y, width: 60 + 260 * ring, height: 60 + 260 * ring, borderRadius: "50%",
            transform: "translate(-50%, -50%)", border: "3px solid #34E27A", opacity: f >= 34 ? 0.55 * (1 - ring) : 0 }} />
        </div>
      </AbsoluteFill>
      <Captions end={FRAMES.charger}>
        <Cap delay={6} dark>Charging station.</Cap>
        <Cap delay={34} add dark>With a wireless pad.</Cap>
      </Captions>
    </AbsoluteFill>
  );
};

// The shelf dissolves through all five finishes.
const HOLD = 16, BLEND = 8;
const blendIn = (f: number, i: number) => (i === 0 ? 1 : interpolate(f, [i * HOLD, i * HOLD + BLEND], [0, 1], { ...clamp, easing: ease }));
export const Finishes: React.FC = () => {
  const f = useCurrentFrame();
  const enter = useProgress(0, 18);
  // The ring holds on each swatch, then glides to the next while the finishes blend.
  const keys = MATERIALS.slice(1).flatMap((_, k) => [(k + 1) * HOLD, (k + 1) * HOLD + BLEND]);
  const at = interpolate(f, [0, ...keys], [0, ...MATERIALS.slice(1).flatMap((_, k) => [k, k + 1])], { ...clamp, easing: ease });
  const DOT = 64, GAP = 26;
  return (
    <AbsoluteFill style={{ background: C.night }}>
      <AbsoluteFill style={{ transform: drift(f, FRAMES.finishes), opacity: enter }}>
        <div style={art}>
          {MATERIALS.map((wood, i) => (
            <Art key={wood} spec={{ type: "led", width: 36, height: 1.75, depth: 8, wood, edge: "square", light: "Warm white" }}
              style={{ ...fill, opacity: blendIn(f, i) }} />
          ))}
        </div>
        <div style={{ position: "absolute", top: ART_TOP + ART_H + 10, left: (W - (DOT * 5 + GAP * 4)) / 2, display: "flex", gap: GAP }}>
          {MATERIALS.map(m => (
            <i key={m} style={{ width: DOT, height: DOT, borderRadius: "50%", background: WOODS[m as keyof typeof WOODS].hex, boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.12)" }} />
          ))}
          <i style={{ position: "absolute", left: at * (DOT + GAP) - 9, top: -9, width: DOT + 18, height: DOT + 18, borderRadius: "50%", border: `3px solid ${C.cream}`, boxSizing: "border-box" }} />
        </div>
      </AbsoluteFill>
      <Captions end={FRAMES.finishes}>
        <Cap delay={2}>Five finishes.</Cap>
        <div style={{ position: "relative", height: 76, alignSelf: "stretch" }}>
          {MATERIALS.map((m, i) => {
            const o = blendIn(f, i) * (1 - (i < MATERIALS.length - 1 ? blendIn(f, i + 1) : 0)) * Math.min(1, f / 12);
            return <div key={m} style={{ position: "absolute", inset: 0, opacity: o }}><Cap delay={-20} add size={76}>{m}</Cap></div>;
          })}
        </div>
      </Captions>
    </AbsoluteFill>
  );
};
