import { getObjectStream } from "@/lib/storage/neon";
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
const ALLOWED_PREFIXES = ["banners/", "donate/"];

export async function GET(_req: NextRequest, ctx: { params: Promise<{ key: string[] }> }) {
  const { key: segments } = await ctx.params;
  const key = segments.map(decodeURIComponent).join("/");

  if (!ALLOWED_PREFIXES.some((p) => key.startsWith(p)) || key.includes("..")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const { body, contentType, contentLength } = await getObjectStream(key);
    const headers = new Headers({
      "Content-Type": contentType ?? "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
    });
    if (contentLength != null) headers.set("Content-Length", String(contentLength));
    return new NextResponse(body, { status: 200, headers });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
