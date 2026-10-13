import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { Art, C, Label, Line, PAD, Rise, Spec, display, sans } from "../theme";
import { DEFAULTS, MATERIALS, TYPES, WOODS, clampSpec, dimsText, money, priceOf } from "../../../pricing.js";

const WOOD = "Matte white";
const [MIN_W, MAX_W] = TYPES.led.W;
// drawing.js fits wide shelves to the frame. Scaling every dimension by K
// keeps it at one true scale instead, so a wider shelf really looks wider.
// (Matte white has no grain, so redrawing it every frame doesn't flicker.)
const K = 380 / MAX_W / 13;

// The custom studio: drag the width slider and the shelf and price follow.
export const Sizing: React.FC = () => {
  const frame = useCurrentFrame();
  const w = interpolate(frame, [40, 120], [24, 54], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  const spec = clampSpec({ ...DEFAULTS.led, wood: WOOD, width: Math.round(w) });
  const drawn: Spec = { ...spec, width: w * K, height: spec.height * K, depth: spec.depth * K };
  const at = (w - MIN_W) / (MAX_W - MIN_W);
  const row: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "baseline", font: `600 26px ${sans}` };

  return (
    <AbsoluteFill style={{ background: C.white, color: C.ink, flexDirection: "row", alignItems: "center", gap: 80, padding: `0 ${PAD}px` }}>
      <Rise delay={0} dist={0} dur={16} style={{ position: "relative", width: 1000, flex: "none", aspectRatio: "480 / 340" }}>
        <Art spec={drawn} style={{ position: "absolute", inset: 0 }} />
        <span style={{ position: "absolute", right: 24, bottom: 20, font: `400 22px ${sans}`, color: C.nightText, fontVariantNumeric: "tabular-nums" }}>
          {dimsText(spec)}
        </span>
      </Rise>
      <div style={{ flex: 1 }}>
        <Rise delay={4}><Label>Custom studio</Label></Rise>
        <h2 style={{ ...display, fontSize: 84, marginTop: 20 }}><Line delay={8}>Sized to</Line><Line delay={15}>the inch.</Line></h2>

        <Rise delay={22} style={{ marginTop: 52, paddingTop: 28, borderTop: `1px solid ${C.line}` }}>
          <div style={row}>Width <b style={{ fontWeight: 400, color: C.muted, fontVariantNumeric: "tabular-nums" }}>{spec.width}″</b></div>
          <div style={{ position: "relative", height: 34, marginTop: 10 }}>
            <div style={{ position: "absolute", left: 0, right: 0, top: 16, height: 2, background: C.line }} />
            <div style={{ position: "absolute", left: 0, width: `${at * 100}%`, top: 16, height: 2, background: C.ink }} />
            <div style={{ position: "absolute", left: `calc(${at * 100}% - 15px)`, top: 2, width: 30, height: 30, borderRadius: "50%", background: C.white, border: `2px solid ${C.ink}` }} />
          </div>
        </Rise>

        <Rise delay={28} style={{ marginTop: 28 }}>
          <div style={row}>Material <b style={{ fontWeight: 400, color: C.muted }}>{WOOD}</b></div>
          <div style={{ display: "flex", gap: 16, marginTop: 16 }}>
            {MATERIALS.map(m => (
              <i key={m} style={{
                width: 44, height: 44, borderRadius: "50%", background: WOODS[m as keyof typeof WOODS].hex,
                boxShadow: `inset 0 0 0 1px rgba(0,0,0,0.14), 0 0 0 4px ${C.white}, 0 0 0 6px ${m === WOOD ? C.ink : "transparent"}`,
              }} />
            ))}
          </div>
        </Rise>

        <Rise delay={34} style={{ display: "flex", alignItems: "baseline", gap: 16, marginTop: 44 }}>
          <span style={{ font: `500 64px ${sans}`, fontVariantNumeric: "tabular-nums" }}>{money(priceOf(spec).total)}</span>
          <small style={{ font: `400 24px ${sans}`, color: C.muted }}>Plus shipping</small>
        </Rise>
      </div>
    </AbsoluteFill>
  );
};
