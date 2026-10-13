import { AbsoluteFill } from "remotion";
import { C, Mark, serif, useProgress } from "../theme";

// The mark builds itself, then the name wipes in beside it.
export const Intro: React.FC = () => {
  const word = useProgress(20, 30);
  return (
    <AbsoluteFill style={{ background: C.night, alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
        <Mark size={150} side="#D9B892" rail="#C08A3E" detail={C.night} t={4} />
        <div style={{
          font: `400 112px ${serif}`, letterSpacing: "-0.01em", color: C.cream, whiteSpace: "nowrap",
          opacity: word, transform: `translateX(${(1 - word) * -20}px)`, clipPath: `inset(-20% ${(1 - word) * 100}% -20% 0)`,
        }}>Grainline Creations</div>
      </div>
    </AbsoluteFill>
  );
};
