import { AbsoluteFill } from "remotion";
import { C, Line, Mark, Rise, display, sans, serif } from "../theme";

// Sign-off in the footer's colors, with the call to action.
export const Outro: React.FC = () => (
  <AbsoluteFill style={{ background: C.ink, color: C.cream, alignItems: "center", justifyContent: "center", textAlign: "center" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
      <Mark size={72} side="#D9B892" rail="#C08A3E" detail={C.ink} t={2} />
      <Rise delay={12} dist={12}><span style={{ font: `400 52px ${serif}`, letterSpacing: "-0.01em" }}>Grainline Creations</span></Rise>
    </div>
    <h2 style={{ ...display, fontSize: 100, marginTop: 56 }}>
      <Line delay={18}>Real wood.</Line>
      <Line delay={26}>Real hardware.</Line>
      <Line delay={34}>Built to last.</Line>
    </h2>
    <Rise delay={48} style={{ display: "flex", alignItems: "center", gap: 40, marginTop: 64 }}>
      <span style={{ font: `500 28px ${sans}`, background: C.paper, color: C.ink, padding: "22px 48px", borderRadius: 2 }}>Design yours</span>
      <span style={{ font: `500 30px ${sans}`, borderBottom: "1px solid currentColor", paddingBottom: 4 }}>grainlinecreations.com</span>
    </Rise>
  </AbsoluteFill>
);
