/**
 * Cloudflare R2 client — vault sync subset.
 *
 * Only includes uploadBuffer + getPublicUrl needed by the sync pipeline.
 * The full presigned URL / evidence photo helpers live in creaseworks.
 *
 * Built on aws4fetch (SigV4 over fetch) rather than @aws-sdk/client-s3:
 * the AWS SDK's config-resolution chain reads ~/.aws/config from disk,
 * which throws "[unenv] fs.readFile is not implemented" on CF Workers.
 * aws4fetch signs with SubtleCrypto and never touches the filesystem.
 * Mirrors apps/creaseworks/src/lib/r2.ts (rewritten in #173).
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
 *   2. /api/images/{key} — internal proxy fallback
 */
export function getPublicUrl(key: string): string {
  const publicUrl = process.env.R2_PUBLIC_URL;
  if (publicUrl) {
    return `${publicUrl.replace(/\/$/, "")}/${key}`;
  }
  return `/api/images/${key}`;
}
