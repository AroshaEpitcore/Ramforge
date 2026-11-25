import { ACCEPTED_IMAGE_MIME_PREFIX, MAX_IMAGE_UPLOAD_BYTES } from "@/config/constants";
import { ForbiddenError, requirePermission, type Permission } from "@/lib/rbac";
import { putObject } from "@/lib/storage/neon";
import { getCurrentUser } from "@/server/current-user";
import { randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
};

/** Upload targets: each maps to a storage prefix and the permission it needs. */
const FOLDERS: Record<string, { prefix: string; permission: Permission }> = {
  banners: { prefix: "banners", permission: "banners:manage" },
  donate: { prefix: "donate", permission: "settings:manage" },
  promos: { prefix: "promos", permission: "settings:manage" },
  thumbnails: { prefix: "thumbnails", permission: "videos:upload" },
  blog: { prefix: "blog", permission: "blog:manage" },
};

/**
 * Upload a marketing image. Stores it in Neon Object Storage under
 * `<folder>/<uuid>.<ext>` and returns a stable, same-origin URL served by
 * `/api/assets/*`. The `folder` form field selects the target and the
 * permission it requires.
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const folderKey = (form?.get("folder") as string | null) ?? "banners";
  const folder = FOLDERS[folderKey];
  if (!folder) {
    return NextResponse.json({ error: "Unknown upload target." }, { status: 400 });
  }

  try {
    requirePermission(user, folder.permission);
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return NextResponse.json({ error: "You do not have permission to upload." }, { status: 403 });
    }
    throw err;
  }

  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  if (!file.type.startsWith(ACCEPTED_IMAGE_MIME_PREFIX)) {
    return NextResponse.json({ error: "Only image files are accepted." }, { status: 400 });
  }
  if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
    const mb = Math.round(MAX_IMAGE_UPLOAD_BYTES / (1024 * 1024));
    return NextResponse.json({ error: `Image must be ${mb} MB or smaller.` }, { status: 400 });
  }

  const ext = EXT_BY_TYPE[file.type] ?? "bin";
  const key = `${folder.prefix}/${randomUUID()}.${ext}`;

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    await putObject({
      key,
      body: bytes,
      contentType: file.type,
      cacheControl: "public, max-age=31536000, immutable",
    });
    return NextResponse.json({ url: `/api/assets/${key}` }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
