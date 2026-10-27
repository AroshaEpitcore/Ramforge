import { getVideoProvider } from "@/lib/video";
import { getCurrentUser } from "@/server/current-user";
import { db } from "@/server/db";
import { resolveVideoAccess, type OwnedEntitlement } from "@/server/services/entitlements";
import { NextResponse } from "next/server";

/**
 * Resolve a playback source for a video.
 *   - FREE  → no auth; YouTube videos return the embed id, Mux returns a signed URL.
 *   - PAID  → requires sign-in + a matching (video or course) entitlement; then
 *             returns a short-lived signed Mux URL. Entitlements are granted by
 *             purchases (Phase 4b), so paid videos return 403 until then.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const video = await db.video.findUnique({
    where: { id },
    select: {
      id: true,
      accessMode: true,
      courseId: true,
      source: true,
      youtubeId: true,
      fullAssetId: true,
      status: true,
    },
  });
  if (!video || video.status !== "PUBLISHED") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (video.accessMode !== "FREE") {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

    const purchases = await db.purchase.findMany({
      where: {
        userId: user.id,
        OR: [{ videoId: video.id }, ...(video.courseId ? [{ courseId: video.courseId }] : [])],
      },
      select: { videoId: true, courseId: true, type: true, expiresAt: true, revokedAt: true },
    });
    const decision = resolveVideoAccess(
      { accessMode: video.accessMode, videoId: video.id, courseId: video.courseId },
      purchases as OwnedEntitlement[],
    );
    if (!decision.allowed) {
      return NextResponse.json({ error: decision.reason ?? "Forbidden" }, { status: 403 });
    }
  }

  if (video.source === "YOUTUBE") {
    if (!video.youtubeId) return NextResponse.json({ error: "No source" }, { status: 409 });
    return NextResponse.json({ source: "youtube", youtubeId: video.youtubeId });
  }

  // Mux source.
  if (!video.fullAssetId) {
    return NextResponse.json({ error: "Video is still processing." }, { status: 409 });
  }
  try {
    const signed = await getVideoProvider().getPlaybackUrl(video.fullAssetId);
    return NextResponse.json({ source: "mux", url: signed.url, expiresAt: signed.expiresAt });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Playback unavailable.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
