import "server-only";

import { PLAYBACK_URL_TTL_SECONDS } from "@/config/constants";
import { env } from "@/lib/env";
import Mux from "@mux/mux-node";
import type {
  CreateUploadInput,
  CreateUploadResult,
  PlaybackOptions,
  SignedUrl,
  VideoProvider,
} from "./types";

/**
 * Mux implementation of {@link VideoProvider} — used for PAID lessons (free
 * videos are YouTube embeds and never touch this provider).
 *
 * - `createUpload` returns a Mux **direct upload** URL (browser uploads bytes
 *   straight to Mux) and the upload id. A `video.asset.ready` webhook later
 *   resolves the Mux **playback id**, which is what we persist as the video's
 *   `fullAssetId` and pass to `getPlaybackUrl`.
 * - `getPlaybackUrl` mints a short-lived **signed** HLS token (anti-sharing).
 *
 * The client is created lazily so the app runs on the mock provider without any
 * Mux credentials; selecting `mux` without keys throws a clear error.
 */
function muxCredentials() {
  const { MUX_TOKEN_ID, MUX_TOKEN_SECRET } = env;
  if (!MUX_TOKEN_ID || !MUX_TOKEN_SECRET) {
    throw new Error(
      "Mux is selected (VIDEO_PROVIDER=mux) but MUX_TOKEN_ID / MUX_TOKEN_SECRET are not set.",
    );
  }
  return { tokenId: MUX_TOKEN_ID, tokenSecret: MUX_TOKEN_SECRET };
}

function signingCredentials() {
  const { MUX_SIGNING_KEY_ID, MUX_SIGNING_KEY } = env;
  if (!MUX_SIGNING_KEY_ID || !MUX_SIGNING_KEY) {
    throw new Error(
      "Signed Mux playback requires MUX_SIGNING_KEY_ID and MUX_SIGNING_KEY (base64 private key).",
    );
  }
  return { keyId: MUX_SIGNING_KEY_ID, keySecret: MUX_SIGNING_KEY };
}

let client: Mux | undefined;
function mux(): Mux {
  if (!client) client = new Mux(muxCredentials());
  return client;
}

async function signedPlaybackUrl(
  playbackId: string,
  kind: "video" | "thumbnail",
  ttlSeconds: number,
  viewerId?: string,
): Promise<string> {
  const { keyId, keySecret } = signingCredentials();
  const token = await mux().jwt.signPlaybackId(playbackId, {
    keyId,
    keySecret,
    type: kind,
    expiration: `${ttlSeconds}s`,
    params: viewerId ? { viewer_id: viewerId } : undefined,
  });
  const base =
    kind === "thumbnail"
      ? `https://image.mux.com/${playbackId}/thumbnail.jpg`
      : `https://stream.mux.com/${playbackId}.m3u8`;
  return `${base}?token=${token}`;
}

export const muxVideoProvider: VideoProvider = {
  name: "mux",

  async createUpload(input: CreateUploadInput): Promise<CreateUploadResult> {
    const upload = await mux().video.uploads.create({
      cors_origin: env.NEXT_PUBLIC_APP_URL,
      new_asset_settings: {
        playback_policies: ["signed"],
        // Keep costs low: basic quality, cap resolution at 1080p (4K storage ~4x).
        video_quality: "basic",
        max_resolution_tier: "1080p",
        passthrough: input.passthrough ?? input.filename,
      },
    });
    if (!upload.url) throw new Error("Mux did not return an upload URL.");
    return { uploadUrl: upload.url, assetId: upload.id };
  },

  async getPlaybackUrl(assetId: string, opts?: PlaybackOptions): Promise<SignedUrl> {
    const ttl = opts?.ttlSeconds ?? PLAYBACK_URL_TTL_SECONDS;
    const url = await signedPlaybackUrl(assetId, "video", ttl, opts?.viewerId);
    return { url, expiresAt: new Date(Date.now() + ttl * 1000), provider: "mux" };
  },

  async getDownloadUrl(): Promise<SignedUrl> {
    // Downloads are deferred to a later phase (R2 + Mux static renditions).
    throw new Error("Downloads are not enabled for Mux in this phase.");
  },

  getThumbnail(assetId: string, opts?: { width?: number }): string {
    // Public (unsigned) thumbnail URL. For signed-playback assets a thumbnail
    // token is required; callers that need one use getPlaybackUrl(..., "thumbnail").
    return `https://image.mux.com/${assetId}/thumbnail.jpg?width=${opts?.width ?? 640}`;
  },

  async deleteAsset(assetId: string): Promise<void> {
    // Expects a Mux asset id. Best-effort: ignore "not found" so deletes are idempotent.
    try {
      await mux().video.assets.delete(assetId);
    } catch (err) {
      if (err instanceof Mux.APIError && err.status === 404) return;
      throw err;
    }
  },
};
