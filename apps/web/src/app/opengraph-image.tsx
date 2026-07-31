import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

export const alt = "Regulars — reply to every review, in your voice.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Satori cannot parse the woff2 that next/font self-hosts, so the OG route
// reads a committed TTF instead. Well under the 500KB bundle limit.
async function displayFont() {
  return readFile(join(process.cwd(), "assets/InstrumentSerif-Regular.ttf"));
}

export default async function Image() {
  return new ImageResponse(
    (
      // Satori supports flexbox only — every multi-child node sets display.
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#faf9f5",
          padding: "72px 80px",
        }}
      >
        <div style={{ display: "flex", fontSize: 26, color: "#66635b" }}>Regulars</div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontFamily: "Instrument Serif",
              fontSize: 82,
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              color: "#16150f",
              maxWidth: 900,
            }}
          >
            Reply to every review, in your voice.
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 28,
              fontSize: 28,
              lineHeight: 1.4,
              color: "#66635b",
              maxWidth: 760,
            }}
          >
            Drafted from your own hours, prices and policies. You approve every one.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ display: "flex", width: 40, height: 3, backgroundColor: "#b14f1a" }} />
          <div style={{ display: "flex", marginLeft: 20, fontSize: 24, color: "#66635b" }}>
            Free, in beta
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Instrument Serif",
          data: await displayFont(),
          weight: 400,
          style: "normal",
        },
      ],
    }
  );
}
