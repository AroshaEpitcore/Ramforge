import "server-only";

import { PLAYBACK_URL_TTL_SECONDS } from "@/config/constants";
import { env } from "@/lib/env";
import {
  STORAGE_BUCKET,
  deleteObject,
  presignDownloadUrl,
  presignUploadUrl,
} from "@/lib/storage/neon";
import type {
  CreateUploadInput,
  CreateUploadResult,
  PlaybackOptions,
  SignedUrl,
  VideoProvider,
} from "./types";

/**
 * Neon Object Storage implementation of {@link VideoProvider}.
 *
 * Source bytes live in the private `assets` bucket; the `assetId` IS the object
 * key. Uploads go browser→Neon via a presigned PUT; playback/download are served
 * with short-lived presigned GETs. This suits progressive-download MP4 and file
 * downloads — for adaptive HLS streaming use the Mux provider instead.
 */

function sanitize(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 120);
}

async function signedGet(key: string, ttlSeconds: number): Promise<SignedUrl> {
  const url = await presignDownloadUrl(key, ttlSeconds);
  return { url, expiresAt: new Date(Date.now() + ttlSeconds * 1000), provider: "neon" };
}

export const neonStorageProvider: VideoProvider = {
  name: "neon",

  async createUpload(input: CreateUploadInput): Promise<CreateUploadResult> {
    const assetId = `uploads/${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 8)}-${sanitize(input.filename)}`;
    const uploadUrl = await presignUploadUrl(assetId, {
      contentType: input.contentType,
      expiresIn: 3600,
    });
    return { assetId, uploadUrl };
  },

  getPlaybackUrl(assetId: string, opts?: PlaybackOptions): Promise<SignedUrl> {
    return signedGet(assetId, opts?.ttlSeconds ?? PLAYBACK_URL_TTL_SECONDS);
  },

  getDownloadUrl(assetId: string, opts?: PlaybackOptions): Promise<SignedUrl> {
    return signedGet(assetId, opts?.ttlSeconds ?? PLAYBACK_URL_TTL_SECONDS);
  },

  getThumbnail(assetId: string): string {
    // Private buckets can't be presigned synchronously; this endpoint-style URL
    // only resolves for a `public_read` bucket. Callers needing a private
    // thumbnail should presign `${assetId}.thumb.jpg` via presignDownloadUrl.
    return `${env.AWS_ENDPOINT_URL_S3}/${STORAGE_BUCKET}/${assetId}.thumb.jpg`;
  },

  async deleteAsset(assetId: string): Promise<void> {
    await deleteObject(assetId);
  },
};
