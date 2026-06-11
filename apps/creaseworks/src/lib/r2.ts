/**
 * Cloudflare R2 client for evidence photo storage.
 *
 * Uses the S3-compatible API with presigned URLs so the browser
 * uploads directly to R2 without proxying through our server.
 *
 * Built on aws4fetch (SigV4 over fetch) rather than @aws-sdk/client-s3:
 * the AWS SDK's config-resolution chain reads ~/.aws/config from disk,
 * which throws "[unenv] fs.readFile is not implemented" on CF Workers.
 * aws4fetch signs with SubtleCrypto and never touches the filesystem,
 * so the same code runs in workerd, node, and vitest.
 *
 * Required env vars:
 *   R2_ACCOUNT_ID       — Cloudflare account ID
 *   R2_ACCESS_KEY_ID    — R2 API token access key
 *   R2_SECRET_ACCESS_KEY — R2 API token secret
 *   R2_BUCKET_NAME      — bucket name (default: creaseworks-evidence)
 *   R2_PUBLIC_URL       — public bucket URL for reading (optional)
 */

import { AwsClient } from "aws4fetch";

const BUCKET = process.env.R2_BUCKET_NAME ?? "creaseworks-evidence";

let _client: AwsClient | null = null;

function getR2Client(): AwsClient {
  if (_client) return _client;

  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!process.env.R2_ACCOUNT_ID || !accessKeyId || !secretAccessKey) {
    // upload-url route matches on this message for its 503 fallback —
    // keep it stable.
    throw new Error("R2 credentials not configured — set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY");
  }

  _client = new AwsClient({
    accessKeyId,
    secretAccessKey,
    region: "auto",
    service: "s3",
  });

  return _client;
}

/** Bucket-scoped object URL on the R2 S3 endpoint. */
function objectUrl(key: string): string {
  return `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${BUCKET}/${key}`;
}

/** Accepted MIME types for evidence photos. */
export const ACCEPTED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/heic",
  "image/webp",
]);

/** Max file size: 5MB (phone photos). */
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Storage key convention: {orgId}/{runId}/{evidenceId}.{ext}
 */
export function buildStorageKey(
  orgId: string,
  runId: string,
  evidenceId: string,
  ext: string,
): string {
  return `${orgId}/${runId}/${evidenceId}.${ext}`;
}

/**
 * Thumbnail key — same structure with a -thumb suffix.
 */
export function buildThumbnailKey(storageKey: string): string {
  const dot = storageKey.lastIndexOf(".");
  if (dot === -1) return `${storageKey}-thumb`;
  return `${storageKey.slice(0, dot)}-thumb${storageKey.slice(dot)}`;
}

/**
 * Presign a request URL for the given method. `signQuery` puts the
 * signature in query params so the URL is self-contained for the browser.
 */
async function presign(
  key: string,
  method: string,
  expiresIn: number,
  contentType?: string,
): Promise<string> {
  const client = getR2Client();
  const url = new URL(objectUrl(key));
  url.searchParams.set("X-Amz-Expires", String(expiresIn));

  const signed = await client.sign(
    new Request(url, {
      method,
      // content-type becomes a signed header — the uploader must send
      // the same value, which evidence-photo-upload.tsx does.
      headers: contentType ? { "Content-Type": contentType } : undefined,
    }),
    { aws: { signQuery: true } },
  );

  return signed.url;
}

/**
 * Generate a presigned PUT URL for direct browser upload.
 * Expires in 10 minutes.
 */
export async function generateUploadUrl(
  key: string,
  contentType: string,
): Promise<string> {
  return presign(key, "PUT", 600, contentType);
}

/**
 * Generate a presigned GET URL for reading a stored object.
 * Expires in 1 hour. Used by the portfolio/gallery to show photos.
 */
export async function generateReadUrl(
  key: string,
  expiresIn = 3600,
): Promise<string> {
  return presign(key, "GET", expiresIn);
}

/**
 * Fetch raw bytes of a stored object from R2.
 * Used by the evidence PDF export to embed photos directly.
 * Returns null if the object doesn't exist or fetch fails.
 */
export async function getObjectBytes(key: string): Promise<Uint8Array | null> {
  try {
    const client = getR2Client();
    const res = await client.fetch(objectUrl(key));
    if (!res.ok) return null;
    return new Uint8Array(await res.arrayBuffer());
  } catch {
    return null;
  }
}

/**
 * Delete an object from R2.
 */
export async function deleteObject(key: string): Promise<void> {
  const client = getR2Client();
  const res = await client.fetch(objectUrl(key), { method: "DELETE" });
  // S3 DELETE returns 204; treat any non-2xx as failure
  if (!res.ok && res.status !== 404) {
    throw new Error(`R2 delete failed for ${key}: ${res.status}`);
  }
}

/**
 * Upload a buffer directly to R2 (server-side).
 * Used by the sync pipeline to persist Notion images.
 */
export async function uploadBuffer(
  key: string,
  body: Uint8Array | Buffer,
  contentType: string,
): Promise<void> {
  const client = getR2Client();
  const res = await client.fetch(objectUrl(key), {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: body as BodyInit,
  });
  if (!res.ok) {
    throw new Error(`R2 upload failed for ${key}: ${res.status}`);
  }
}

/**
 * Public read URL for a stored object.
 *
 * Priority:
 *   1. R2_PUBLIC_URL — direct URL (fastest, recommended for production)
 *   2. /api/images/{key} — internal proxy that generates a presigned
 *      redirect. Works without any Cloudflare dashboard config.
 */
export function getPublicUrl(key: string): string {
  const publicUrl = process.env.R2_PUBLIC_URL;
  if (publicUrl) {
    return `${publicUrl.replace(/\/$/, "")}/${key}`;
  }
  // Fallback: proxy route generates presigned redirect on demand
  return `/api/images/${key}`;
}
