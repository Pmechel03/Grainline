import { AbsoluteFill } from "remotion";
import { C, Label, Line, PAD, Rise, display, sans, serif, useProgress } from "../theme";

const STEPS = [
  ["Choose a piece", "Start with an LED shelf, cologne display steps or a charging station."],
  ["Make it yours", "Set the size to the inch and pick a material and lighting. The price updates as you go."],
  ["We build it by hand", "Once you order, we build your piece and email you when it ships."],
];

const Step: React.FC<{ n: number; title: string; text: string; delay: number }> = ({ n, title, text, delay }) => {
  const rule = useProgress(delay, 30);
  return (
    <div style={{ position: "relative", paddingTop: 32 }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "rgba(242,237,228,0.2)", transform: `scaleX(${rule})`, transformOrigin: "left" }} />
      <Rise delay={delay + 6}>
        <div style={{ font: `300 96px/1 ${serif}`, color: C.step, marginBottom: 32 }}>0{n}</div>
        <h3 style={{ margin: "0 0 12px", font: `600 34px ${sans}` }}>{title}</h3>
        <p style={{ margin: 0, font: `400 25px/1.5 ${sans}`, color: C.nightText, maxWidth: "30ch" }}>{text}</p>
      </Rise>
    </div>
  );
};

// How it works, from the site's dark band.
export const Process: React.FC = () => (
  <AbsoluteFill style={{ background: C.night, color: C.cream, padding: `0 ${PAD}px`, justifyContent: "center" }}>
    <Rise delay={4}><Label color={C.nightText}>How it works</Label></Rise>
    <h2 style={{ ...display, fontSize: 88, marginTop: 20 }}><Line delay={8}>From your idea to your wall.</Line></h2>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 64, marginTop: 80 }}>
      {STEPS.map(([title, text], i) => <Step key={title} n={i + 1} title={title} text={text} delay={20 + i * 12} />)}
    </div>
  </AbsoluteFill>
);
