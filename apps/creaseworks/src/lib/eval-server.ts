/**
 * creaseworks eval — server-side helpers for the audit API routes.
 *
 * The eval worker carries one native binding (wrangler.eval.jsonc):
 *   EVAL_DB — D1 (evaluations)
 * and NO production credentials. These routes also ship in the prod and
 * mini builds, where the binding doesn't exist — getEvalEnv() returns
 * null there and every route 404s, so neither exposes anything.
 *
 * Binding types are declared minimally here rather than adding
 * @cloudflare/workers-types to the app's dependency graph.
 */

import { getCloudflareContext } from "@opennextjs/cloudflare";

export interface EvalD1Result<T = Record<string, unknown>> {
  results: T[];
}
export interface EvalD1 {
  prepare(sql: string): {
    bind(...params: unknown[]): {
      run(): Promise<unknown>;
      all<T = Record<string, unknown>>(): Promise<EvalD1Result<T>>;
      first<T = Record<string, unknown>>(): Promise<T | null>;
    };
    all<T = Record<string, unknown>>(): Promise<EvalD1Result<T>>;
  };
}

/** Minimal R2 surface — only what the material-icon routes use. */
export interface EvalR2Object {
  body: ReadableStream;
  httpMetadata?: { contentType?: string };
}
export interface EvalR2 {
  put(
    key: string,
    value: ArrayBuffer | ReadableStream,
    opts?: { httpMetadata?: { contentType?: string } },
  ): Promise<unknown>;
  get(key: string): Promise<EvalR2Object | null>;
}

export interface EvalEnv {
  db: EvalD1;
  /** material-icons bucket — present only on the eval worker (null elsewhere). */
  icons: EvalR2 | null;
}

/** Binding, or null when running in a flavour without the eval store. */
export function getEvalEnv(): EvalEnv | null {
  try {
    const { env } = getCloudflareContext() as unknown as {
      env: { EVAL_DB?: EvalD1; MATERIAL_ICONS?: EvalR2 };
    };
    if (!env?.EVAL_DB) return null;
    return { db: env.EVAL_DB, icons: env.MATERIAL_ICONS ?? null };
  } catch {
    return null;
  }
}

export const EVAL_NAME_MAX = 60;
export const EVAL_ANSWERS_MAX = 20000; // generous cap on the JSON blob

// ── roster + traces (schema v4) ──────────────────────────────────────────
// A group is a family or class code (pseudonym) that owns a roster of
// anonymous player avatars. events carry the nested identity (group →
// player → device → session); player_id is nullable for the anonymous
// fallback. All caps are sanity bounds, not policy.
export const GROUP_KINDS = ["family", "class"] as const;
export type GroupKind = (typeof GROUP_KINDS)[number];

export const ROSTER_MAX_FAMILY = 8; // a generous family
export const ROSTER_MAX_CLASS = 40; // a generous classroom
export const EVENT_BATCH_MAX = 50; // events per ingest POST
export const TOKEN_MAX = 64; // device_token / session_id / player_id length cap

export const TRACE_EVENT_TYPES = [
  "session_start",
  "stage_enter",
  "activity_open",
] as const;
export type TraceEventType = (typeof TRACE_EVENT_TYPES)[number];

export const TRACE_STAGES = ["look", "make", "show", "wow"] as const;

/**
 * Group codes are pseudonyms entered by a caregiver/teacher. Accept a
 * forgiving but bounded shape (lowercased, alnum + hyphen, 2–40 chars) so
 * collective-issued codes and family codes both pass, and nothing weird
 * (paths, scripts, PII-ish free text) lands in the key.
 */
export function normalizeGroupCode(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const code = raw.trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9-]{1,39}$/.test(code)) return null;
  return code;
}
