import { ImageResponse } from "next/og";

// Social share card (OpenGraph + Twitter). Cinematic Obsidian backdrop with the
// FrameForge mark and an Electric Orange underscore — font-free so it needs no
// remote font loading.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "FrameForge";

const mark = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'>
  <path d='M9.5 12.2 14.5 10.5 14.5 30.8 9.5 32.5Z' fill='#FF7900'/>
  <path d='M15.5 8 33 8 28 14 22 14 22 17.5 30.5 17.5 26 23 22 23 22 31 15.5 33Z' fill='#F5F7FA'/>
</svg>`;

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 48,
        background: "radial-gradient(circle at 50% 35%, #1B222B 0%, #080A0D 70%)",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        width={300}
        height={300}
        src={`data:image/svg+xml;utf8,${encodeURIComponent(mark)}`}
        alt="FrameForge"
      />
      <div
        style={{
          width: 220,
          height: 10,
          borderRadius: 9999,
          background: "#FF7900",
        }}
      />
    </div>,
    size,
  );
}
