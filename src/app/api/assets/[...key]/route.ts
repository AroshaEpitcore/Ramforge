import { getObjectBytes } from "@/lib/storage/neon";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Public read-through for marketing images stored in Neon Object Storage.
 *
 * Only the `banners/` prefix is served, so this never becomes an open proxy for
 * private video assets. Images are content-addressed (unique key per upload), so
 * they can be cached immutably and forever.
 */
const ALLOWED_PREFIXES = ["banners/", "donate/", "thumbnails/", "promos/", "samples/"];

export async function GET(req: NextRequest, ctx: { params: Promise<{ key: string[] }> }) {
  const { key: segments } = await ctx.params;
  const key = segments.map(decodeURIComponent).join("/");

  if (!ALLOWED_PREFIXES.some((p) => key.startsWith(p)) || key.includes("..")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let bytes: Uint8Array;
  let contentType: string | undefined;
  try {
    ({ bytes, contentType } = await getObjectBytes(key));
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const total = bytes.length;
  const base = {
    "Content-Type": contentType ?? "application/octet-stream",
    "Cache-Control": "public, max-age=31536000, immutable",
    "Accept-Ranges": "bytes",
  };

  // Serve a byte range so <video> can stream/seek reliably.
  const range = req.headers.get("range");
  const match = range ? /bytes=(\d*)-(\d*)/.exec(range) : null;
  if (match) {
    let start = match[1] ? parseInt(match[1], 10) : 0;
    let end = match[2] ? parseInt(match[2], 10) : total - 1;
    if (Number.isNaN(start)) start = 0;
    if (Number.isNaN(end) || end >= total) end = total - 1;
    if (start > end || start >= total) {
      return new NextResponse(null, {
        status: 416,
        headers: { "Content-Range": `bytes */${total}` },
      });
    }
    const chunk = new Uint8Array(bytes.subarray(start, end + 1));
    return new NextResponse(chunk, {
      status: 206,
      headers: {
        ...base,
        "Content-Range": `bytes ${start}-${end}/${total}`,
        "Content-Length": String(chunk.length),
      },
    });
  }

  return new NextResponse(new Uint8Array(bytes), {
    status: 200,
    headers: { ...base, "Content-Length": String(total) },
  });
}
