import { MAX_ASSET_UPLOAD_BYTES } from "@/config/constants";
import { ForbiddenError, requirePermission } from "@/lib/rbac";
import { putObject } from "@/lib/storage/neon";
import { getCurrentUser } from "@/server/current-user";
import { randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Keep uploaded names tidy and safe for a storage key. */
function safeExt(name: string): string {
  const dot = name.lastIndexOf(".");
  if (dot < 0) return "bin";
  const ext = name.slice(dot + 1).toLowerCase();
  return /^[a-z0-9]{1,8}$/.test(ext) ? ext : "bin";
}

/**
 * Upload a downloadable asset file (any type — zip, images, project files…).
 * Stores it in Neon Object Storage under `assets/<uuid>.<ext>` and returns a
 * stable, same-origin URL served by `/api/assets/*`. Requires `assets:manage`.
 *
 * Posts through this serverless route, so it is capped at MAX_ASSET_UPLOAD_BYTES
 * (use an external link, e.g. Google Drive, for larger files).
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  try {
    requirePermission(user, "assets:manage");
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
  if (file.size > MAX_ASSET_UPLOAD_BYTES) {
    const mb = Math.round(MAX_ASSET_UPLOAD_BYTES / (1024 * 1024));
    return NextResponse.json(
      { error: `File must be ${mb} MB or smaller. For larger files, paste an external link.` },
      { status: 400 },
    );
  }

  const key = `assets/${randomUUID()}.${safeExt(file.name)}`;

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    await putObject({
      key,
      body: bytes,
      contentType: file.type || "application/octet-stream",
      cacheControl: "public, max-age=31536000, immutable",
    });
    return NextResponse.json({ url: `/api/assets/${key}` }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
