import "server-only";

import { PLAYBACK_URL_TTL_SECONDS } from "@/config/constants";
import type {
  CreateUploadInput,
  CreateUploadResult,
  PlaybackOptions,
  SignedUrl,
  VideoProvider,
} from "./types";

function fakeSignedUrl(path: string, ttlSeconds: number): SignedUrl {
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
  const token = Buffer.from(`${path}:${expiresAt.getTime()}`).toString("base64url");
  return {
    url: `https://mock-cdn.ramforge.test/${path}?token=${token}&expires=${expiresAt.getTime()}`,
    expiresAt,
    provider: "mock",
  };
}

/**
 * In-repo mock implementation of {@link VideoProvider}. Returns deterministic,
 * fake signed URLs so the app runs end-to-end without a real hosting account.
 * Swap for a real provider by implementing the same interface.
 */
export const mockVideoProvider: VideoProvider = {
  name: "mock",

  async createUpload(input: CreateUploadInput): Promise<CreateUploadResult> {
    const assetId = `mock_${Math.random().toString(36).slice(2, 10)}`;
    return {
      assetId,
      uploadUrl: `https://mock-cdn.ramforge.test/upload/${assetId}?name=${encodeURIComponent(input.filename)}`,
    };
  },

  async getPlaybackUrl(assetId: string, opts?: PlaybackOptions): Promise<SignedUrl> {
    return fakeSignedUrl(`play/${assetId}`, opts?.ttlSeconds ?? PLAYBACK_URL_TTL_SECONDS);
  },

  async getDownloadUrl(assetId: string, opts?: PlaybackOptions): Promise<SignedUrl> {
    return fakeSignedUrl(`download/${assetId}`, opts?.ttlSeconds ?? PLAYBACK_URL_TTL_SECONDS);
  },

  getThumbnail(assetId: string, opts?: { width?: number }): string {
    return `https://mock-cdn.ramforge.test/thumb/${assetId}.jpg?w=${opts?.width ?? 640}`;
  },

  async deleteAsset(): Promise<void> {
    // no-op in the mock
  },
};
