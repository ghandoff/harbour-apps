/**
 * CMS config sync — Notion "App Config" database → Postgres.
 *
 * Each row in the Notion database represents one config option.
 * Expected Notion properties:
 *   - "name" (title): the option value (e.g. "home session")
 *   - "key" (select): the config group (e.g. "run_types")
 *   - "sort order" (number): display ordering within the group
 *   - "group" (select): optional sub-grouping
 *   - "metadata" (rich text): optional JSON string for complex items
 *
 * When NOTION_DB_APP_CONFIG is not set, this sync is silently skipped.
 * Components fall back to hard-coded defaults.
 */

import { sql } from "@/lib/db";
import { queryAllPages } from "@/lib/notion";
import {
  extractTitle,
  extractSelect,
  extractNumber,
  extractRichText,
  extractPageId,
} from "./extract";

const DB_ID = process.env.NOTION_DB_APP_CONFIG ?? "";

export async function syncCmsConfig(): Promise<number> {
  if (!DB_ID) {
    console.log("[sync] cms-config: NOTION_DB_APP_CONFIG not set, skipping");
    return 0;
  }

  console.log("[sync] cms-config: fetching from Notion…");
  const pages = await queryAllPages(DB_ID);
  console.log(`[sync] cms-config: ${pages.length} row(s) fetched`);

  let synced = 0;

  for (const page of pages) {
    const props = page.properties;
    const notionId = extractPageId(page);

    const value = extractTitle(props, "name");
    const configKey = extractSelect(props, "key");
    const sortOrder = extractNumber(props, "sort order") ?? 0;
    const groupKey = extractSelect(props, "group");

    // metadata is a rich text field containing a JSON string
    let metadata: string | null = null;
    const rawMeta = extractRichText(props, "metadata");
    if (rawMeta) {
      try {
        JSON.parse(rawMeta); // validate
        metadata = rawMeta;
      } catch {
        console.warn(
          `[sync] cms-config: invalid JSON in metadata for "${value}" (${notionId})`,
        );
      }
    }

    if (!configKey || !value) {
      console.warn(
        `[sync] cms-config: skipping row ${notionId} — missing key or value`,
      );
      continue;
    }

    await sql`
      INSERT INTO cms_config (config_key, value, sort_order, group_key, metadata, notion_id, updated_at)
      VALUES (${configKey}, ${value}, ${sortOrder}, ${groupKey}, ${metadata}::jsonb, ${notionId}, NOW())
      ON CONFLICT (notion_id) DO UPDATE SET
        config_key = EXCLUDED.config_key,
        value = EXCLUDED.value,
        sort_order = EXCLUDED.sort_order,
        group_key = EXCLUDED.group_key,
        metadata = EXCLUDED.metadata,
        updated_at = NOW()
    `;
    synced++;
  }

  console.log(`[sync] cms-config: ${synced}/${pages.length} synced`);
  return synced;
}
