import { ImageResponse } from "next/og";
import { site } from "@/data/site";
import { initials } from "@/lib/utils";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0d111c",
          borderRadius: 14,
          border: "2px solid #2a3350",
          color: "#e9edf7",
          fontSize: 28,
          fontWeight: 700,
          letterSpacing: 1,
          position: "relative",
        }}
      >
        {initials(site.name)}
        <div
          style={{
            position: "absolute",
            right: 8,
            bottom: 8,
            width: 9,
            height: 9,
            borderRadius: 9,
            background: "#5b8cff",
          }}
        />
      </div>
    ),
    size,
  );
}
