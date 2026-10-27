/**
 * Provider-agnostic video hosting abstraction.
 *
 * The hosting provider is NOT chosen yet (see the project plan's open question).
 * All app code depends on this interface — never on a concrete SDK — so the
 * provider can be swapped (Mux, Cloudflare Stream, Bunny, self-hosted HLS, …)
 * without touching the player or pages.
 */

export interface CreateUploadInput {
  filename: string;
  sizeBytes: number;
  contentType?: string;
  /** Opaque value echoed back on provider webhooks (we pass the Video id). */
  passthrough?: string;
}

export interface CreateUploadResult {
  /** Destination to upload bytes to (often a resumable/tus or signed PUT URL). */
  uploadUrl: string;
  /** Opaque asset id to persist on the Video record. */
  assetId: string;
}

export interface SignedUrl {
  url: string;
  /** Absolute expiry — these URLs are short-lived and must not be shared. */
  expiresAt: Date;
  provider: string;
}

export interface PlaybackOptions {
  /** Signed-URL lifetime in seconds. */
  ttlSeconds?: number;
  /** Optional viewer binding for anti-sharing / audit. */
  viewerId?: string;
}

export interface VideoProvider {
  readonly name: string;
  /** Begin an upload; returns where to send bytes and the resulting asset id. */
  createUpload(input: CreateUploadInput): Promise<CreateUploadResult>;
  /** Signed, expiring streaming URL for the full asset. */
  getPlaybackUrl(assetId: string, opts?: PlaybackOptions): Promise<SignedUrl>;
  /** Signed, expiring download URL (only when downloads are allowed). */
  getDownloadUrl(assetId: string, opts?: PlaybackOptions): Promise<SignedUrl>;
  /** Public (or signed) thumbnail URL. */
  getThumbnail(assetId: string, opts?: { width?: number }): string;
  /** Permanently delete an asset. */
  deleteAsset(assetId: string): Promise<void>;
}
