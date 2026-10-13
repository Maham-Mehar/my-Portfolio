import { ImageResponse } from "next/og";
import { seo, site } from "@/data/site";
import { initials } from "@/lib/utils";

export const alt = seo.title;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background:
            "radial-gradient(circle at 85% 0%, rgba(91,140,255,0.28), transparent 45%), linear-gradient(180deg, #0a0d16, #06080e)",
          color: "#e9edf7",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              border: "2px solid #2a3350",
              background: "#0d111c",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 26,
              fontWeight: 700,
            }}
          >
            {initials(site.name)}
          </div>
          <div style={{ fontSize: 28, color: "#a3acc1" }}>{site.name}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 76, lineHeight: 1.02, letterSpacing: -3, fontWeight: 600, maxWidth: 980 }}>
            Turning complex ideas into exceptional digital experiences.
          </div>
          <div style={{ fontSize: 28, color: "#8fb0ff" }}>React.js · Next.js · TypeScript · Full-Stack Development</div>
        </div>
      </div>
    ),
    size,
  );
}
