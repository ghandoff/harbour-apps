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

export interface EvalEnv {
  db: EvalD1;
}

/** Binding, or null when running in a flavour without the eval store. */
export function getEvalEnv(): EvalEnv | null {
  try {
    const { env } = getCloudflareContext() as unknown as {
      env: { EVAL_DB?: EvalD1 };
    };
    if (!env?.EVAL_DB) return null;
    return { db: env.EVAL_DB };
  } catch {
    return null;
  }
}

export const EVAL_NAME_MAX = 60;
export const EVAL_ANSWERS_MAX = 20000; // generous cap on the JSON blob
