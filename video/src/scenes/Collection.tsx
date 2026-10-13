import { AbsoluteFill } from "remotion";
import { Art, C, Label, Line, PAD, Rise, Spec, display, sans, serif } from "../theme";
import { DEFAULTS, clampSpec, money, priceOf } from "../../../pricing.js";

// The three catalog cards, drawn and priced exactly as on the site.
const PIECES: { spec: Spec; name: string; text: string; tag?: string }[] = [
  { spec: { type: "led", width: 36, height: 1.75, depth: 8, wood: "Oak", edge: "square", light: "Warm white" },
    name: "LED floating shelf", text: "Solid wood with an LED strip tucked underneath that washes the wall in light." },
  { spec: { type: "cologne", width: 20, height: 3, depth: 9, wood: "Oak", edge: "square", light: "Warm white" },
    name: "Cologne display steps", text: "Tiered steps that lift every bottle into view, with optional light behind each row.", tag: "Shown with LED lighting" },
  { spec: { type: "charger", width: 11, height: 13, depth: 6, wood: "Oak", edge: "rounded", pad: "Included" },
    name: "Charging station", text: "One stand for headphones, watch and phone, with a tray for wireless charging." },
];
const fromPrice = (type: Spec["type"]) => money(priceOf(clampSpec(DEFAULTS[type])).total);

export const Collection: React.FC = () => (
  <AbsoluteFill style={{ background: C.paper, color: C.ink, padding: `0 ${PAD}px`, justifyContent: "center" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 48 }}>
      <div>
        <Rise delay={4}><Label>The collection</Label></Rise>
        <h2 style={{ ...display, fontSize: 88, marginTop: 20 }}><Line delay={8}>Three pieces, made well.</Line></h2>
      </div>
      <Rise delay={18}>
        <p style={{ font: `400 26px/1.5 ${sans}`, color: C.muted, maxWidth: "34ch", margin: 0 }}>
          Five finishes at a standard size, or made to your measurements in the custom studio.
        </p>
      </Rise>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 48, marginTop: 64 }}>
      {PIECES.map((piece, i) => (
        <Rise key={piece.name} delay={22 + i * 9} dist={60} dur={30}>
          <div style={{ position: "relative", aspectRatio: "480 / 340" }}>
            <Art spec={piece.spec} style={{ position: "absolute", inset: 0 }} />
            {piece.tag && (
              <span style={{ position: "absolute", left: 18, top: 18, font: `500 18px ${sans}`, padding: "6px 14px", background: "rgba(253,252,250,0.92)", color: C.ink }}>
                {piece.tag}
              </span>
            )}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16, marginTop: 26 }}>
            <h3 style={{ margin: 0, font: `400 40px ${serif}`, letterSpacing: "-0.01em" }}>{piece.name}</h3>
            <span style={{ font: `400 24px ${sans}`, color: C.muted, whiteSpace: "nowrap" }}>
              From <b style={{ color: C.ink, fontWeight: 500 }}>{fromPrice(piece.spec.type)}</b>
            </span>
          </div>
          <p style={{ font: `400 22px/1.5 ${sans}`, color: C.muted, margin: "10px 0 0" }}>{piece.text}</p>
        </Rise>
      ))}
    </div>
  </AbsoluteFill>
);
