import { ImageResponse } from "next/og";

// iOS home-screen icon. Rendered on the brand's Carbon Charcoal surface with
// the FrameForge mark centred (iOS applies its own rounded-corner mask).
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const mark = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'>
  <path d='M9.5 12.2 14.5 10.5 14.5 30.8 9.5 32.5Z' fill='#FF7900'/>
  <path d='M15.5 8 33 8 28 14 22 14 22 17.5 30.5 17.5 26 23 22 23 22 31 15.5 33Z' fill='#F5F7FA'/>
</svg>`;

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#11151B",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        width={132}
        height={132}
        src={`data:image/svg+xml;utf8,${encodeURIComponent(mark)}`}
        alt="FrameForge"
      />
    </div>,
    size,
  );
}
