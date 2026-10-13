import { AbsoluteFill } from "remotion";
import { C, Label, Line, PAD, Rise, display, sans, serif, useProgress } from "../theme";
import { swatch } from "../../../drawing.js";
import { MATERIALS, WOODS } from "../../../pricing.js";

// Each sample board rises into view, grain running top to bottom.
const Board: React.FC<{ name: string; delay: number }> = ({ name, delay }) => {
  const p = useProgress(delay, 30);
  const wood = WOODS[name as keyof typeof WOODS];
  return (
    <div>
      <div className="art" style={{ aspectRatio: "4 / 5", background: C.oat, clipPath: `inset(${(1 - p) * 100}% 0 0 0)` }}
        dangerouslySetInnerHTML={{ __html: swatch(name) }} />
      <Rise delay={delay + 14}>
        <h3 style={{ margin: "22px 0 0", font: `400 36px ${serif}`, letterSpacing: "-0.01em" }}>{name}</h3>
        <div style={{ font: `400 21px ${sans}`, color: C.muted, marginTop: 4 }}>{wood.material.solid}</div>
      </Rise>
    </div>
  );
};

export const Materials: React.FC = () => (
  <AbsoluteFill style={{ background: C.paper, color: C.ink, padding: `0 ${PAD}px`, justifyContent: "center" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 48 }}>
      <div>
        <Rise delay={4}><Label>Materials</Label></Rise>
        <h2 style={{ ...display, fontSize: 88, marginTop: 20 }}><Line delay={8}>Five finishes.</Line></h2>
      </div>
      <Rise delay={16}>
        <p style={{ font: `400 26px/1.5 ${sans}`, color: C.muted, maxWidth: "40ch", margin: 0 }}>
          Every piece is offered in the same five materials, each with the one finish that suits it best.
        </p>
      </Rise>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 40, marginTop: 64 }}>
      {MATERIALS.map((m, i) => <Board key={m} name={m} delay={18 + i * 7} />)}
    </div>
  </AbsoluteFill>
);
