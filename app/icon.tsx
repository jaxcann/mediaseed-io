import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

// The wordmark dot from PortfolioNav on a cream tile.
// Gradient mirrors --hq-grad in globals.css (ImageResponse cannot read CSS vars).
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#FAF6F0",
          borderRadius: 14,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            background:
              "linear-gradient(94deg, #E85DA8 0%, #8B72EA 32%, #38B8D8 64%, #FF9A62 100%)",
          }}
        />
      </div>
    ),
    size,
  );
}
