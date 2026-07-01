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

// Code shape shared by validateCode + ensureCode, and matching
// normalizeGroupCode (eval-server): lowercased, alnum + hyphen, 2–40 chars.
// The old `^[a-z]+-[a-z]+$` rejected digits / multi-segment codes, so a
// roster code that's valid for traces could 403 here.
const CODE_SHAPE = /^[a-z0-9][a-z0-9-]{1,39}$/;

/** A session code is valid when it exists in the seeded sessions table. */
export async function validateCode(
  db: MiniD1,
  code: string,
): Promise<boolean> {
  if (!CODE_SHAPE.test(code)) return false;
  const row = await db
    .prepare("SELECT code FROM sessions WHERE code = ?")
    .bind(code)
    .first();
  return row !== null;
}

/**
 * Pilot self-serve codes: a well-formed code is CREATED on first use, so a
 * family/class can pick their own memorable code without pre-seeding. Keeps
 * the format floor (junk still bounces) and leaves the row in place for the
 * evidence-sharing + roster/traces flows that key off sessions(code).
 */
export async function ensureCode(db: MiniD1, code: string): Promise<boolean> {
  if (!CODE_SHAPE.test(code)) return false;
  await db.prepare("INSERT OR IGNORE INTO sessions (code) VALUES (?)").bind(code).run();
  return true;
}

/** Lowercase + trim a raw code; null when it fails the shape (junk / empty). */
export function normalizeCode(raw: unknown): string | null {
  const code = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  return CODE_SHAPE.test(code) ? code : null;
}

/**
 * Moderator gate: true only when the presented code matches the MODERATOR_CODE
 * secret. Fail-closed — if the secret isn't set, nobody gets in (so the feature
 * ships inert until the passphrase is configured on the worker).
 */
export function checkModerator(code: unknown): boolean {
  const secret = process.env.MODERATOR_CODE;
  return typeof secret === "string" && secret.length > 0 && code === secret;
}

/** who can moderate — the preset collective (attribution on each decision). */
export const MODERATOR_REVIEWERS = ["jamie", "garrett", "maria", "payton", "lamis"] as const;

export const MINI_PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic"]);
export const MINI_PHOTO_MAX = 5 * 1024 * 1024;
export const MINI_BODY_MAX = 2000;
