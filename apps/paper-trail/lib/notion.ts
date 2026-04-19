/**
 * paper.trail — Notion integration
 *
 * Fetches activities from the paper.trail Activities database.
 */

import { Client } from "@notionhq/client";
import type { Activity, ActivityAudience, ActivityStep } from "./types";

let _notion: Client | null = null;

function getNotion(): Client {
  if (!_notion) {
    if (!process.env.NOTION_TOKEN) {
      throw new Error("NOTION_TOKEN environment variable is required");
    }
    _notion = new Client({ auth: process.env.NOTION_TOKEN });
  }
  return _notion;
}

const ACTIVITIES_DB = process.env.NOTION_DB_PAPER_TRAIL_ACTIVITIES ?? "";

// ── Property extractors ────────────────────────────────────

function textProp(props: Record<string, unknown>, key: string): string {
  const p = props[key] as { rich_text?: { plain_text: string }[] } | undefined;
  return p?.rich_text?.map((t) => t.plain_text).join("") ?? "";
}

function titleProp(props: Record<string, unknown>, key: string): string {
  const p = props[key] as { title?: { plain_text: string }[] } | undefined;
  return p?.title?.map((t) => t.plain_text).join("") ?? "";
}

function selectProp(props: Record<string, unknown>, key: string): string {
  const p = props[key] as { select?: { name: string } | null } | undefined;
  return p?.select?.name ?? "";
}

function multiSelectProp(props: Record<string, unknown>, key: string): string[] {
  const p = props[key] as { multi_select?: { name: string }[] } | undefined;
  return p?.multi_select?.map((o) => o.name) ?? [];
}

// ── Fetch activities ───────────────────────────────────────

export async function fetchActivities(): Promise<Activity[]> {
  if (!ACTIVITIES_DB) return [];

  const notion = getNotion();
  const response = await notion.databases.query({
    database_id: ACTIVITIES_DB,
    filter: { property: "Status", select: { equals: "live" } },
    sorts: [{ property: "Order", direction: "ascending" }],
  });

  return response.results.map((page) => {
    const props = (page as { properties: Record<string, unknown> }).properties;
    return activityFromProps(props);
  });
}

export async function fetchActivityBySlug(slug: string): Promise<Activity | null> {
  if (!ACTIVITIES_DB) return null;

  const notion = getNotion();
  const response = await notion.databases.query({
    database_id: ACTIVITIES_DB,
    filter: {
      and: [
        { property: "Slug", rich_text: { equals: slug } },
        { property: "Status", select: { equals: "live" } },
      ],
    },
    page_size: 1,
  });

  if (response.results.length === 0) return null;

  const props = (response.results[0] as { properties: Record<string, unknown> }).properties;
  return activityFromProps(props);
}

function activityFromProps(props: Record<string, unknown>): Activity {
  // Parse steps from JSON string (stored as rich_text)
  let steps: ActivityStep[] = [];
  const stepsRaw = textProp(props, "Steps");
  if (stepsRaw) {
    try {
      steps = JSON.parse(stepsRaw);
    } catch {
      // Fall back to splitting by newline
      steps = stepsRaw.split("\n").filter(Boolean).map((s, i) => ({
        order: i + 1,
        instruction: s.trim(),
      }));
    }
  }

  // Parse materials from comma-separated string
  const materialsRaw = textProp(props, "Materials");
  const materials = materialsRaw
    ? materialsRaw.split(",").map((m) => m.trim()).filter(Boolean)
    : [];

  // Parse capture prompts from comma-separated or JSON
  let capturePrompts: string[] = [];
  const promptsRaw = textProp(props, "Capture Prompts");
  if (promptsRaw) {
    try {
      capturePrompts = JSON.parse(promptsRaw);
    } catch {
      capturePrompts = promptsRaw.split(",").map((p) => p.trim()).filter(Boolean);
    }
  }

  const audienceRaw = selectProp(props, "Audience");

  return {
    slug: textProp(props, "Slug"),
    title: titleProp(props, "Name"),
    description: textProp(props, "Description"),
    materials,
    steps,
    capturePrompts,
    skillSlugs: multiSelectProp(props, "Skills"),
    difficulty: (selectProp(props, "Difficulty") || "starter") as Activity["difficulty"],
    audience: audienceRaw ? (audienceRaw as ActivityAudience) : undefined,
  };
}
