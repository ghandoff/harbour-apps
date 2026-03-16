/**
 * CMS config query helpers.
 *
 * Reads from the cms_config table with hard-coded fallbacks.
 * When no Notion database is configured (or the table is empty for a key),
 * the hard-coded defaults are returned — ensuring the app always works.
 */

import { sql } from "@/lib/db";
import {
  RUN_TYPES,
  TRACE_EVIDENCE_OPTIONS,
  CONTEXT_TAGS,
} from "@/lib/constants/enums";

/** Hard-coded fallback map — keyed by config_key */
const FALLBACKS: Record<string, readonly string[]> = {
  run_types: RUN_TYPES,
  trace_evidence_options: TRACE_EVIDENCE_OPTIONS,
  context_tags: CONTEXT_TAGS,
};

/**
 * Get simple string values for a config key, ordered by sort_order.
 * Falls back to hard-coded defaults if no DB rows exist.
 */
export async function getConfigValues(key: string): Promise<string[]> {
  try {
    const { rows } = await sql`
      SELECT value FROM cms_config
      WHERE config_key = ${key}
      ORDER BY sort_order ASC, value ASC
    `;
    if (rows.length > 0) {
      return rows.map((r: { value: string }) => r.value);
    }
  } catch {
    // Table may not exist yet (pre-migration) — fall back silently
  }
  return [...(FALLBACKS[key] ?? [])];
}

/**
 * Get config entries with metadata for a config key.
 * Returns objects with { value, metadata } where metadata is parsed JSON.
 * Falls back to empty array if no DB rows and no fallback defined.
 */
export async function getConfigObjects<T = Record<string, unknown>>(
  key: string,
): Promise<Array<{ value: string; sortOrder: number; metadata: T | null }>> {
  try {
    const { rows } = await sql`
      SELECT value, sort_order, metadata FROM cms_config
      WHERE config_key = ${key}
      ORDER BY sort_order ASC, value ASC
    `;
    if (rows.length > 0) {
      return rows.map((r: { value: string; sort_order: number; metadata: unknown }) => ({
        value: r.value,
        sortOrder: r.sort_order,
        metadata: r.metadata as T | null,
      }));
    }
  } catch {
    // Table may not exist yet — fall back silently
  }
  return [];
}
