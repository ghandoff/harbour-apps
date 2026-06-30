/**
 * creaseworks mini — server-side helpers for the pilot API routes.
 *
 * The mini worker carries two native bindings (wrangler.mini.jsonc):
 *   MINI_DB        — D1 (sessions, evidence, feedback)
 *   MINI_EVIDENCE  — R2 (photos)
 * and NO production credentials. These routes also ship in the prod
 * build, where the bindings don't exist — getMiniEnv() returns null
 * there and every route 404s, so prod exposes nothing.
 *
 * Binding types are declared minimally here rather than adding
 * @cloudflare/workers-types to the app's dependency graph.
 */

import { getCloudflareContext } from "@opennextjs/cloudflare";

/* minimal structural types for the two bindings we use */
export interface MiniD1Result<T = Record<string, unknown>> {
  results: T[];
}
export interface MiniD1 {
  prepare(sql: string): {
    bind(...params: unknown[]): {
      run(): Promise<unknown>;
      all<T = Record<string, unknown>>(): Promise<MiniD1Result<T>>;
      first<T = Record<string, unknown>>(): Promise<T | null>;
    };
  };
}
export interface MiniR2 {
  put(
    key: string,
    body: ArrayBuffer,
    opts?: { httpMetadata?: { contentType?: string } },
  ): Promise<unknown>;
  get(key: string): Promise<{
    body: ReadableStream;
    httpMetadata?: { contentType?: string };
  } | null>;
}

export interface MiniEnv {
  db: MiniD1;
  evidence: MiniR2;
}

/** Bindings, or null when running in the prod flavour (no pilot stores). */
export function getMiniEnv(): MiniEnv | null {
  try {
    const { env } = getCloudflareContext() as unknown as {
      env: { MINI_DB?: MiniD1; MINI_EVIDENCE?: MiniR2 };
    };
    if (!env?.MINI_DB || !env?.MINI_EVIDENCE) return null;
    return { db: env.MINI_DB, evidence: env.MINI_EVIDENCE };
  } catch {
    return null;
  }
}

/** A session code is valid when it exists in the seeded sessions table. */
export async function validateCode(
  db: MiniD1,
  code: string,
): Promise<boolean> {
  // Same shape as normalizeGroupCode (eval-server): lowercased, alnum +
  // hyphen, 2–40 chars. The old `^[a-z]+-[a-z]+$` rejected digits / multi-
  // segment codes, so a roster code that's valid for traces could 403 here.
  if (!/^[a-z0-9][a-z0-9-]{1,39}$/.test(code)) return false;
  const row = await db
    .prepare("SELECT code FROM sessions WHERE code = ?")
    .bind(code)
    .first();
  return row !== null;
}

export const MINI_PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic"]);
export const MINI_PHOTO_MAX = 5 * 1024 * 1024;
export const MINI_BODY_MAX = 2000;
