import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Art, C, Spec, useProgress } from "../theme";
import { MATERIALS, WOODS } from "../../../pricing.js";
import { Cap, Captions, W, clamp, shake } from "./common";

const ART_TOP = 620, ART_H = (W * 340) / 480;
const art: React.CSSProperties = { position: "absolute", left: 0, top: ART_TOP, width: W, height: ART_H };
// Steps and the charging station sit in the middle of their drawings, so show them larger.
const big: React.CSSProperties = { position: "absolute", left: -110, top: 540, width: W + 220, height: ((W + 220) * 340) / 480 };
// An LED switching on: a quick flicker, then full brightness.
const flicker = (f: number, at: number) => interpolate(f, [at, at + 3, at + 5, at + 7, at + 16], [0, 0.8, 0.3, 0.9, 1], clamp);

const SHELF: Spec = { type: "led", width: 36, height: 2, depth: 8, wood: "Walnut", edge: "square" };

// The oiled walnut lands on the wall as a floating shelf, then its LED strip comes on.
export const Shelf: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const land = spring({ frame: f, fps, config: { damping: 14 }, durationInFrames: 14 });
  return (
    <AbsoluteFill style={{ background: C.night }}>
      <AbsoluteFill style={{ transform: shake(f, 6, 11, 7) }}>
        <div style={{ ...art, opacity: Math.min(1, f / 3), transform: `scale(${1.35 - 0.35 * land})` }}>
          <Art spec={{ ...SHELF, light: "None" }} style={{ position: "absolute", inset: 0, background: "transparent" }} />
          <Art spec={{ ...SHELF, light: "Warm white" }} style={{ position: "absolute", inset: 0, opacity: flicker(f, 22) }} />
        </div>
      </AbsoluteFill>
      <Captions>
        <Cap delay={4}>Floating shelf.</Cap>
        <Cap delay={24} add>+ LED strip.</Cap>
      </Captions>
    </AbsoluteFill>
  );
};

// Cologne steps stack up one step at a time, then light up behind each row.
const STACK = [0, 9, 18];
export const Steps: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const i = STACK.filter(at => f >= at).length - 1;
  const drop = spring({ frame: f - STACK[i], fps, config: { damping: 12 }, durationInFrames: 9 });
  const spec: Spec = { type: "cologne", width: 20, height: i + 2, depth: 9, wood: "Oak", edge: "square" };
  return (
    <AbsoluteFill style={{ background: C.night }}>
      <AbsoluteFill style={{ transform: shake(f, STACK[i] + 3, STACK[i] + 7, 5) }}>
        <div style={{ ...big, transform: `translateY(${-90 * (1 - drop)}px)` }}>
          <Art spec={{ ...spec, light: "None" }} style={{ position: "absolute", inset: 0, background: "transparent" }} />
          <Art spec={{ ...spec, light: "Warm white" }} style={{ position: "absolute", inset: 0, opacity: flicker(f, 30) }} />
        </div>
      </AbsoluteFill>
      <Captions>
        <Cap delay={3}>Cologne steps.</Cap>
        <Cap delay={32} add size={68}>+ light behind each row.</Cap>
      </Captions>
    </AbsoluteFill>
  );
};

// The charging station drops onto the desk and its wireless pad lights up.
const PHONE = { x: 317 * ((W + 220) / 480), y: 290 * ((W + 220) / 480) }; // phone on the pad, in drawing.js's 480 × 340 frame
export const Charger: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const drop = spring({ frame: f, fps, config: { damping: 11 }, durationInFrames: 16 });
  const pulse = useProgress(22, 16);
  const spec: Spec = { type: "charger", width: 11, height: 13, depth: 6, wood: "Walnut", edge: "rounded", pad: f >= 22 ? "Included" : "Not included" };
  return (
    <AbsoluteFill style={{ background: C.oat }}>
      <AbsoluteFill style={{ transform: shake(f, 7, 12, 6) }}>
        <div style={{ ...big, transform: `translateY(${-900 * (1 - drop)}px)` }}>
          <Art spec={spec} style={{ position: "absolute", inset: 0 }} />
          <i style={{ position: "absolute", left: PHONE.x, top: PHONE.y, width: 40 + 360 * pulse, height: 40 + 360 * pulse, borderRadius: "50%",
            transform: "translate(-50%, -50%)", border: "6px solid #34E27A", opacity: f >= 22 ? 0.8 * (1 - pulse) : 0 }} />
        </div>
      </AbsoluteFill>
      <Captions>
        <Cap delay={4} dark>Charging station.</Cap>
        <Cap delay={24} add dark>+ wireless pad.</Cap>
      </Captions>
    </AbsoluteFill>
  );
};

// The shelf runs through all five finishes, one every 8 frames.
const EVERY = 8;
export const Finishes: React.FC = () => {
  const f = useCurrentFrame();
  const i = Math.min(MATERIALS.length - 1, Math.floor(f / EVERY));
  const wood = MATERIALS[i];
  const pop = interpolate(f - i * EVERY, [0, 6], [1.04, 1], clamp);
  return (
    <AbsoluteFill style={{ background: C.night }}>
      <div style={{ ...art, transform: `scale(${pop})` }}>
        <Art spec={{ type: "led", width: 36, height: 1.75, depth: 8, wood, edge: "square", light: "Warm white" }} style={{ position: "absolute", inset: 0 }} />
      </div>
      <div style={{ position: "absolute", top: ART_TOP + ART_H + 10, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 26 }}>
        {MATERIALS.map(m => (
          <i key={m} style={{ width: 64, height: 64, borderRadius: "50%", background: WOODS[m as keyof typeof WOODS].hex,
            boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.12), 0 0 0 6px ${C.night}, 0 0 0 9px ${m === wood ? C.cream : "transparent"}` }} />
        ))}
      </div>
      <Captions>
        <Cap delay={1}>Five finishes.</Cap>
        <Cap delay={0} add size={96} key={wood}>{wood}</Cap>
      </Captions>
    </AbsoluteFill>
  );
};
