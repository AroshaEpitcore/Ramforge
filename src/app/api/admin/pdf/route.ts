import { ACCEPTED_PDF_MIME, MAX_PDF_UPLOAD_BYTES } from "@/config/constants";
import { ForbiddenError, requirePermission } from "@/lib/rbac";
import { putObject } from "@/lib/storage/neon";
import { getCurrentUser } from "@/server/current-user";
import { randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Upload a PDF document (e.g. a full blog article). Stores it in Neon Object
 * Storage under `blog/<uuid>.pdf` and returns a stable, same-origin URL served
 * by `/api/assets/*`. Requires the `blog:manage` permission.
 *
 * Note: the file posts through this serverless route, so it is capped at
 * `MAX_PDF_UPLOAD_BYTES` to stay under Vercel's request-body limit.
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  try {
    requirePermission(user, "blog:manage");
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return NextResponse.json({ error: "You do not have permission to upload." }, { status: 403 });
    }
    throw err;
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  if (file.type !== ACCEPTED_PDF_MIME) {
    return NextResponse.json({ error: "Only PDF files are accepted." }, { status: 400 });
  }
  if (file.size > MAX_PDF_UPLOAD_BYTES) {
    const mb = Math.round(MAX_PDF_UPLOAD_BYTES / (1024 * 1024));
    return NextResponse.json({ error: `PDF must be ${mb} MB or smaller.` }, { status: 400 });
  }

  const key = `blog/${randomUUID()}.pdf`;

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    await putObject({
      key,
      body: bytes,
      contentType: ACCEPTED_PDF_MIME,
      cacheControl: "public, max-age=31536000, immutable",
    });
    return NextResponse.json({ url: `/api/assets/${key}` }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
