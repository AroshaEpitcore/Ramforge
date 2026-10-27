import { env } from "@/lib/env";
import { db } from "@/server/db";
import Mux from "@mux/mux-node";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Mux webhook receiver. Verifies the signature, then finalises the matching
 * Video using the `passthrough` value we set at upload (the Video id):
 *   - video.asset.ready   → store the signed playback id + mark READY
 *   - video.asset.errored → mark ERRORED
 *
 * The raw body is required for signature verification, so it is read as text.
 */
export async function POST(req: NextRequest) {
  if (!env.MUX_WEBHOOK_SECRET || !env.MUX_TOKEN_ID || !env.MUX_TOKEN_SECRET) {
    return NextResponse.json({ error: "Mux is not configured." }, { status: 503 });
  }

  const mux = new Mux({
    tokenId: env.MUX_TOKEN_ID,
    tokenSecret: env.MUX_TOKEN_SECRET,
    webhookSecret: env.MUX_WEBHOOK_SECRET,
  });

  const body = await req.text();

  let event: Awaited<ReturnType<typeof mux.webhooks.unwrap>>;
  try {
    event = await mux.webhooks.unwrap(body, req.headers, env.MUX_WEBHOOK_SECRET);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  const data = event.data as {
    passthrough?: string | null;
    playback_ids?: { id: string; policy?: string }[] | null;
  };
  const videoId = data.passthrough ?? undefined;

  try {
    if (videoId && event.type === "video.asset.ready") {
      // Prefer a signed playback id; fall back to the first available.
      const playbackId =
        (data.playback_ids ?? []).find((p) => p.policy === "signed")?.id ??
        data.playback_ids?.[0]?.id;
      if (playbackId) {
        await db.video.update({
          where: { id: videoId },
          data: { fullAssetId: playbackId, uploadStatus: "READY" },
        });
      }
    } else if (videoId && event.type === "video.asset.errored") {
      await db.video.update({ where: { id: videoId }, data: { uploadStatus: "ERRORED" } });
    }
  } catch {
    // The video may have been deleted; acknowledge so Mux stops retrying.
  }

  return NextResponse.json({ received: true });
}
