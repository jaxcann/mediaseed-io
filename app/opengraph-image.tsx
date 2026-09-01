import { ImageResponse } from "next/og";

export const alt = "Jax Cannon | media producer & AI-native builder";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Gradient mirrors --hq-grad in globals.css (ImageResponse cannot read CSS vars).
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#FAF6F0",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 28,
          letterSpacing: "-0.04em",
        }}
      >
        <div
          style={{
            fontSize: 24,
            letterSpacing: "0.2em",
            color: "#3A3844",
            textTransform: "uppercase",
          }}
        >
          MEDIA PRODUCER · AI-NATIVE BUILDER
        </div>
        <div
          style={{
            fontSize: 160,
            fontWeight: 600,
            backgroundImage:
              "linear-gradient(94deg, #E85DA8 0%, #8B72EA 32%, #38B8D8 64%, #FF9A62 100%)",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          Jax Cannon
        </div>
        <div style={{ fontSize: 26, color: "#3A3844" }}>
          1M+ organic views · PBS credits · 5 shipped projects
        </div>
      </div>
    ),
    size,
  );
}
