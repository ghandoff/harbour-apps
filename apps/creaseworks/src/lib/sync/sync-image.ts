/**
 * Shared image sync utility.
 *
 * Downloads an image from a URL (Notion or external) and uploads it
 * to Cloudflare R2 with a deterministic storage key. Both full sync
 * and incremental sync call this so image handling is consistent.
 */

import { uploadBuffer, getPublicUrl } from "@/lib/r2";

/** Max image size we'll download — skip anything larger to avoid function timeouts. */
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * Module-level counter for image-sync failures during a sync run.
 *
 * `syncImageToR2` swallows errors and returns null so it never blocks the
 * surrounding text-property sync. That's the right behavior for a single
 * image — but it makes whole-run failures invisible (cron returns 200 OK
 * and `errors: []` while every image silently fails to upload). The cron
 * route resets this before each run and includes the count in its response,
 * so we can detect e.g. credential drift on R2 the moment it happens.
 *
 * Counter increments cover any return-null path where the image WOULD have
 * been synced (R2 401, fetch non-2xx, oversize, empty body, thrown error).
 * It does NOT increment when callers skip the call entirely (no source URL).
 */
let imageFailures = 0;

export function getImageFailureCount(): number {
  return imageFailures;
}

export function resetImageFailureCount(): void {
  imageFailures = 0;
}

/** Map content-type → file extension. */
const EXT_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "image/heic": "heic",
};

/**
 * Infer a file extension from the content-type header, or fall back
 * to the URL path extension.
 */
function inferExtension(contentType: string | null, sourceUrl: string): string {
  if (contentType) {
    const base = contentType.split(";")[0].trim().toLowerCase();
    if (EXT_MAP[base]) return EXT_MAP[base];
  }

  // fall back to URL path extension
  try {
    const pathname = new URL(sourceUrl).pathname;
    const dot = pathname.lastIndexOf(".");
    if (dot !== -1) {
      const ext = pathname.slice(dot + 1).toLowerCase().split("?")[0];
      if (ext && ext.length <= 5) return ext;
    }
  } catch {
    // invalid URL — ignore
  }

  return "jpg"; // safe default
}

/**
 * Download an image from `sourceUrl` and upload it to R2.
 *
 * Returns the R2 storage key on success, null on failure.
 * Never throws — image failures should not block the text sync.
 *
 * Storage key convention:
 *   notion-images/{notionPageId}/{slot}.{ext}
 *
 * Deterministic keys mean re-syncs overwrite cleanly — no orphan
 * cleanup needed.
 */
export async function syncImageToR2(
  sourceUrl: string,
  notionPageId: string,
  slot: string,
): Promise<string | null> {
  try {
    const res = await fetch(sourceUrl, {
      signal: AbortSignal.timeout(15_000), // 15s download timeout
    });

    if (!res.ok) {
      imageFailures++;
      console.warn(
        `[sync-image] failed to download ${slot} for ${notionPageId}: HTTP ${res.status}`,
      );
      return null;
    }

    // size guard — check content-length header first
    const contentLength = res.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_IMAGE_BYTES) {
      imageFailures++;
      console.warn(
        `[sync-image] ${slot} for ${notionPageId} too large (${contentLength} bytes), skipping`,
      );
      return null;
    }

    const buffer = await res.arrayBuffer();

    // double-check actual size
    if (buffer.byteLength > MAX_IMAGE_BYTES) {
      imageFailures++;
      console.warn(
        `[sync-image] ${slot} for ${notionPageId} too large (${buffer.byteLength} bytes), skipping`,
      );
      return null;
    }

    if (buffer.byteLength === 0) {
      imageFailures++;
      console.warn(
        `[sync-image] ${slot} for ${notionPageId} is empty, skipping`,
      );
      return null;
    }

    const contentType = res.headers.get("content-type");
    const ext = inferExtension(contentType, sourceUrl);
    const mimeType = contentType?.split(";")[0].trim() ?? `image/${ext}`;

    // deterministic key — re-syncs overwrite the same object
    const key = `notion-images/${notionPageId}/${slot}.${ext}`;

    await uploadBuffer(key, new Uint8Array(buffer), mimeType);

    return key;
  } catch (err) {
    imageFailures++;
    console.warn(
      `[sync-image] error syncing ${slot} for ${notionPageId}:`,
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}

/**
 * Given an R2 storage key, return the public URL for rendering.
 * Returns null if the key is null/undefined.
 */
export function imageUrl(r2Key: string | null | undefined): string | null {
  if (!r2Key) return null;
  return getPublicUrl(r2Key);
}
