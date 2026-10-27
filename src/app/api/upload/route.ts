import { ACCEPTED_VIDEO_MIME_PREFIX, MAX_VIDEO_UPLOAD_BYTES } from "@/config/constants";
import { ForbiddenError, requirePermission } from "@/lib/rbac";
import { getVideoProvider } from "@/lib/video";
import { getCurrentUser } from "@/server/current-user";
import { z } from "zod";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const uploadSchema = z.object({
  filename: z.string().min(1).max(255),
  sizeBytes: z
    .number()
    .int()
    .positive()
    .max(MAX_VIDEO_UPLOAD_BYTES, `File exceeds the ${MAX_VIDEO_UPLOAD_BYTES} byte limit`),
  contentType: z
    .string()
    .optional()
    .refine((t) => !t || t.startsWith(ACCEPTED_VIDEO_MIME_PREFIX), "Only video files are accepted"),
  // The draft Video id, echoed back on the Mux webhook to finalise the asset.
  videoId: z.string().optional(),
});

/**
 * Create-upload endpoint. Returns a provider direct-upload target so large
 * resumable video uploads go straight from the browser to the provider (never
 * through this server).
 *
 * Authenticated + authorized: only staff with the `videos:upload` permission.
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    requirePermission(user, "videos:upload");
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return NextResponse.json({ error: "You do not have permission to upload." }, { status: 403 });
    }
    throw err;
  }

  const json = await req.json().catch(() => null);
  const parsed = uploadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", fieldErrors: z.flattenError(parsed.error).fieldErrors },
      { status: 400 },
    );
  }

  try {
    const { filename, sizeBytes, contentType, videoId } = parsed.data;
    const provider = getVideoProvider();
    const result = await provider.createUpload({
      filename,
      sizeBytes,
      contentType,
      passthrough: videoId,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload could not be started.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
