import "server-only";

import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { env } from "@/lib/env";

/**
 * Neon Object Storage client (S3-compatible).
 *
 * Buckets are declared in `neon.ts` and provisioned with `neon deploy`, which
 * injects the AWS-standard credentials (`AWS_ACCESS_KEY_ID`,
 * `AWS_SECRET_ACCESS_KEY`, `AWS_ENDPOINT_URL_S3`, `AWS_REGION`). Neon requires
 * **path-style** addressing and SigV4 — so `forcePathStyle: true` is mandatory.
 *
 * All helpers throw a clear error when storage is not configured, mirroring the
 * Mux provider, so the rest of the app can run on the mock without credentials.
 */

/** The bucket declared under `buckets` in `neon.ts` (default: `assets`). */
export const STORAGE_BUCKET = env.NEON_STORAGE_BUCKET;

/** True when all Neon Object Storage credentials are present. */
export function isStorageConfigured(): boolean {
  return Boolean(
    env.AWS_ENDPOINT_URL_S3 && env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY && env.AWS_REGION,
  );
}

let client: S3Client | undefined;

/** Lazily construct the S3 client. Throws if storage is unconfigured. */
export function getStorageClient(): S3Client {
  if (!isStorageConfigured()) {
    throw new Error(
      "Neon Object Storage is not configured. Run `neon deploy` and ensure AWS_ENDPOINT_URL_S3, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY and AWS_REGION are set.",
    );
  }
  client ??= new S3Client({
    region: env.AWS_REGION,
    endpoint: env.AWS_ENDPOINT_URL_S3,
    forcePathStyle: true, // required: Neon uses path-style addressing
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY!,
    },
  });
  return client;
}

/** Upload (or overwrite) an object. */
export async function putObject(input: {
  key: string;
  body: Uint8Array | Buffer | string;
  contentType?: string;
  cacheControl?: string;
}): Promise<void> {
  await getStorageClient().send(
    new PutObjectCommand({
      Bucket: STORAGE_BUCKET,
      Key: input.key,
      Body: input.body,
      ContentType: input.contentType,
      CacheControl: input.cacheControl,
    }),
  );
}

/** Presigned GET URL — share a private object without exposing credentials. */
export function presignDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
  return getSignedUrl(
    getStorageClient(),
    new GetObjectCommand({ Bucket: STORAGE_BUCKET, Key: key }),
    { expiresIn },
  );
}

/** Presigned PUT URL — let a browser upload bytes straight to the bucket. */
export function presignUploadUrl(
  key: string,
  opts: { contentType?: string; expiresIn?: number } = {},
): Promise<string> {
  return getSignedUrl(
    getStorageClient(),
    new PutObjectCommand({
      Bucket: STORAGE_BUCKET,
      Key: key,
      ContentType: opts.contentType,
    }),
    { expiresIn: opts.expiresIn ?? 3600 },
  );
}

/** Whether an object exists (HeadObject). */
export async function objectExists(key: string): Promise<boolean> {
  try {
    await getStorageClient().send(new HeadObjectCommand({ Bucket: STORAGE_BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

/** Permanently delete an object. */
export async function deleteObject(key: string): Promise<void> {
  await getStorageClient().send(new DeleteObjectCommand({ Bucket: STORAGE_BUCKET, Key: key }));
}
