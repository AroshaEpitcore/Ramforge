import { getVideoProvider } from "@/lib/video";
import { z } from "zod";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const uploadSchema = z.object({
  filename: z.string().min(1),
  sizeBytes: z.number().int().positive(),
  contentType: z.string().optional(),
});

/**
 * Create-upload endpoint stub. Returns a provider upload target for large
 * resumable video uploads. In production, authenticate the request and check
 * the `videos:upload` permission before issuing an upload URL.
 */
export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = uploadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // TODO: const user = await getCurrentUser(); requirePermission(user, "videos:upload");
  const provider = getVideoProvider();
  const result = await provider.createUpload(parsed.data);

  return NextResponse.json(result);
}
