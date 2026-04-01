import { Client } from "@notionhq/client";
import type { Activity } from "./types";

const DATABASE_ID = "8ed2d02fc2e647cf9d108a66fef9306e";

export interface NotionSession {
  name: string;
  slug: string;
  description: string;
  template: string;
  activities: Activity[] | null;
  activityCount: number;
  duration: number;
  audience: string;
  tags: string[];
  groupSize: string;
  facilitatorNotes: string;
  order: number;
  icon: string;
}

// map common template names / slugs to icons
const ICON_MAP: Record<string, string> = {
  "play-as-pedagogy": "\u{1F3AD}",
  "the-sunk-cost-trap": "\u2693",
  "opportunity-cost-demo": "\u{1F4B0}",
  "opportunity-cost": "\u{1F4B0}",
  "systems-thinking": "\u{1F310}",
};

function iconForSlug(slug: string): string {
  return ICON_MAP[slug] ?? "\u{1F9ED}";
}

// ── helpers to read Notion property values ──────────────────────

function richTextToString(prop: unknown): string {
  const arr = (prop as { rich_text?: { plain_text: string }[] })?.rich_text;
  if (!arr || arr.length === 0) return "";
  return arr.map((t) => t.plain_text).join("");
}

function titleToString(prop: unknown): string {
  const arr = (prop as { title?: { plain_text: string }[] })?.title;
  if (!arr || arr.length === 0) return "";
  return arr.map((t) => t.plain_text).join("");
}

function numberValue(prop: unknown): number {
  return (prop as { number?: number | null })?.number ?? 0;
}

function selectValue(prop: unknown): string {
  return (prop as { select?: { name: string } | null })?.select?.name ?? "";
}

function multiSelectValues(prop: unknown): string[] {
  const opts = (prop as { multi_select?: { name: string }[] })?.multi_select;
  if (!opts) return [];
  return opts.map((o) => o.name);
}

// ── fetch sessions from Notion ──────────────────────────────────

export async function fetchSessionsFromNotion(): Promise<NotionSession[]> {
  const apiKey = process.env.NOTION_API_KEY;
  if (!apiKey) {
    throw new Error("NOTION_API_KEY is not set");
  }

  const notion = new Client({ auth: apiKey });

  const response = await notion.databases.query({
    database_id: DATABASE_ID,
    filter: {
      property: "Status",
      select: { equals: "ready" },
    },
    sorts: [{ property: "Order", direction: "ascending" }],
  });

  return response.results.map((page) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const props = (page as any).properties as Record<string, unknown>;

    const slug = richTextToString(props["Slug"]);
    const activitiesRaw = richTextToString(props["Activities"]);

    let activities: Activity[] | null = null;
    if (activitiesRaw) {
      try {
        activities = JSON.parse(activitiesRaw) as Activity[];
      } catch {
        // invalid JSON — will fall back to template-generated activities
        activities = null;
      }
    }

    return {
      name: titleToString(props["Name"]),
      slug,
      description: richTextToString(props["Description"]),
      template: selectValue(props["Template"]),
      activities,
      activityCount: numberValue(props["Activity Count"]),
      duration: numberValue(props["Duration"]),
      audience: richTextToString(props["Audience"]),
      tags: multiSelectValues(props["Tags"]),
      groupSize: richTextToString(props["Group Size"]),
      facilitatorNotes: richTextToString(props["Facilitator Notes"]),
      order: numberValue(props["Order"]),
      icon: iconForSlug(slug),
    };
  });
}
