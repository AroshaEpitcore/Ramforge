import { getVideoProvider } from "@/lib/video";
import { getCurrentUser } from "@/server/current-user";
import { db } from "@/server/db";
import { resolveVideoAccess, type OwnedEntitlement } from "@/server/services/entitlements";
import { NextResponse } from "next/server";

/**
 * Issue a short-lived download URL for an owned, downloadable video.
 * Enforces ownership + the per-purchase download limit, then increments the
 * counter. The actual signed URL comes from the configured provider (R2/Mux
 * when wired; the mock returns a placeholder).
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const video = await db.video.findUnique({
    where: { id },
    select: {
      id: true,
      accessMode: true,
      courseId: true,
      fullAssetId: true,
      status: true,
      allowDownload: true,
    },
  });
  if (!video || video.status !== "PUBLISHED") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!video.allowDownload) {
    return NextResponse.json(
      { error: "Downloads are not available for this video." },
      { status: 403 },
    );
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const purchases = await db.purchase.findMany({
    where: {
      userId: user.id,
      OR: [{ videoId: video.id }, ...(video.courseId ? [{ courseId: video.courseId }] : [])],
    },
    select: {
      id: true,
      videoId: true,
      courseId: true,
      type: true,
      expiresAt: true,
      revokedAt: true,
      downloadCount: true,
      downloadLimit: true,
    },
  });
  const decision = resolveVideoAccess(
    { accessMode: video.accessMode, videoId: video.id, courseId: video.courseId },
    purchases as OwnedEntitlement[],
  );
  if (video.accessMode !== "FREE" && !decision.allowed) {
    return NextResponse.json({ error: decision.reason ?? "Forbidden" }, { status: 403 });
  }

  const purchase = purchases.find((p) => p.videoId === video.id) ?? purchases[0];
  if (
    purchase &&
    typeof purchase.downloadLimit === "number" &&
    purchase.downloadCount >= purchase.downloadLimit
  ) {
    return NextResponse.json({ error: "Download limit reached." }, { status: 403 });
  }

  if (!video.fullAssetId) {
    return NextResponse.json({ error: "Download is not ready yet." }, { status: 409 });
  }

  try {
    const signed = await getVideoProvider().getDownloadUrl(video.fullAssetId);
    if (purchase) {
      await db.purchase.update({
        where: { id: purchase.id },
        data: { downloadCount: { increment: 1 } },
      });
    }
    return NextResponse.json({ url: signed.url, expiresAt: signed.expiresAt });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Download unavailable.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
