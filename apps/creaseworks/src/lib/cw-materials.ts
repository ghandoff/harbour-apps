/**
 * cw-materials — client for the open-ended materials pipeline.
 *
 * Kids submit materials that aren't on the list (used privately in their
 * session); the collective reviews them; Payton uploads 3 icon candidates;
 * the family picks the one that goes live. Same-host, root-relative calls to
 * the eval worker (mirrors cw-trace / cw-identity). Everything fails soft.
 */

const MATERIALS_URL = "/harbour/creaseworks-eval/api/eval/materials";
const CLASSIFY_URL = "/harbour/creaseworks-eval/api/eval/materials/classify";
const ICONS_URL = "/harbour/creaseworks-eval/api/eval/materials/icons";

/** The material form categories (formPrimary) — these drive the character
 *  cast + matching, so the collective assigns one when accepting. Kept in
 *  sync with the values in mini-data.ts MINI_MATERIALS. */
export const MATERIAL_FORMS = [
  "discrete small parts",
  "sheet goods / surfaces",
  "containers / vessels",
  "linear / filament",
  "joining / fastening",
  "mark-making media",
  "found objects / evocative artifacts",
  "volumes / substrates",
  "wearables / embodied props",
] as const;

/** The Layer-B affordance verbs a material can DO — the same vocabulary the
 *  built-in materials carry (mini-data MINI_MATERIALS.affords) and the fold job
 *  wheel draws from. The collective confirms a few per accepted material. */
export const MATERIAL_VERBS = [
  "mark", "join", "divide", "contain", "wrap", "stack", "transform",
  "launch", "carry", "sort", "hide", "reveal", "wear", "sound", "compare",
  "roll", "balance",
] as const;

export interface SubmittedMaterial {
  id: string;
  group_code: string;
  submitted_by: string | null;
  title: string;
  description: string | null;
  form_primary: string | null;
  status: string;
  icon_candidate_urls: string | null; // json array (icons_proposed onward)
  chosen_icon_url: string | null;
  created_at: string;
  // P1.5 dials — confirmed on accept; ai_dials is the cached AI draft
  loud_quiet?: string | null;
  affords?: string | null; // json string[]
  ai_dials?: string | null; // json { form_primary, loud_quiet, affords, reason }
}

/** The AI's drafted dials for a submission — a human confirms before accept. */
export interface MaterialDials {
  form_primary: string | null;
  loud_quiet: "loud" | "quiet" | null;
  affords: string[];
  reason?: string;
}

/** Parse a stored json string[] (affords, or a draft's affords) → string[]. */
export function parseAffords(raw: string | null | undefined): string[] {
  try {
    const a = raw ? JSON.parse(raw) : [];
    return Array.isArray(a) ? a.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

/** Parse the stored json array of candidate icon URLs (or []). */
export function iconCandidates(m: SubmittedMaterial): string[] {
  try {
    const a = m.icon_candidate_urls ? JSON.parse(m.icon_candidate_urls) : [];
    return Array.isArray(a) ? a.filter((u) => typeof u === "string") : [];
  } catch {
    return [];
  }
}

/** Submit a kid-found material for collective review. Returns true on 200. */
export async function submitMaterial(input: {
  code: string;
  title: string;
  description?: string | null;
  submittedBy?: string | null;
}): Promise<boolean> {
  try {
    const res = await fetch(MATERIALS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: input.code,
        title: input.title,
        description: input.description ?? null,
        submitted_by: input.submittedBy ?? null,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** List submissions by status (default pending), optionally scoped to a
 *  group, or status="all" for a family's whole collection (group required). */
export async function fetchMaterials(status = "pending", group?: string | null): Promise<SubmittedMaterial[]> {
  try {
    const qs = new URLSearchParams({ status });
    if (group) qs.set("group", group);
    const res = await fetch(`${MATERIALS_URL}?${qs.toString()}`);
    if (!res.ok) return [];
    const body = (await res.json()) as { materials?: SubmittedMaterial[] };
    return Array.isArray(body.materials) ? body.materials : [];
  } catch {
    return [];
  }
}

/** Ask the AI pre-screen to draft a submission's dials (form + loud/quiet +
 *  affords) from its title + description. A human confirms before accept.
 *  Returns null when unconfigured or on any error — the UI stays human-only. */
export async function classifyMaterial(id: string, reviewer: string | null): Promise<MaterialDials | null> {
  try {
    const res = await fetch(CLASSIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, reviewer }),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { configured?: boolean } & Partial<MaterialDials>;
    if (body.configured === false) return null;
    return {
      form_primary: body.form_primary ?? null,
      loud_quiet: body.loud_quiet === "loud" || body.loud_quiet === "quiet" ? body.loud_quiet : null,
      affords: Array.isArray(body.affords) ? body.affords.filter((v): v is string => typeof v === "string") : [],
      reason: typeof body.reason === "string" ? body.reason : undefined,
    };
  } catch {
    return null;
  }
}

/** Collective accept (with a form_primary + confirmed dials) or decline. */
export async function reviewMaterial(input: {
  id: string;
  action: "accept" | "decline";
  formPrimary?: string;
  loudQuiet?: "loud" | "quiet" | null;
  affords?: string[];
  reviewer: string | null;
}): Promise<boolean> {
  try {
    const res = await fetch(MATERIALS_URL, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: input.id,
        action: input.action,
        form_primary: input.formPrimary,
        loud_quiet: input.loudQuiet ?? null,
        affords: input.affords ?? null,
        reviewer: input.reviewer,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Payton: upload exactly 3 bespoke icon candidates for an accepted material. */
export async function uploadIcons(input: {
  id: string;
  files: File[];
  reviewer?: string | null;
}): Promise<string[] | null> {
  try {
    const form = new FormData();
    form.set("id", input.id);
    if (input.reviewer) form.set("reviewer", input.reviewer);
    input.files.slice(0, 3).forEach((f, i) => form.set(`icon${i}`, f));
    const res = await fetch(ICONS_URL, { method: "POST", body: form });
    if (!res.ok) return null;
    const body = (await res.json()) as { urls?: string[] };
    return Array.isArray(body.urls) ? body.urls : null;
  } catch {
    return null;
  }
}

/** Family: pick the icon that goes live (→ status live + spotlight). The
 *  group code proves ownership — only the family that found it may choose. */
export async function chooseIcon(input: { id: string; chosenIconUrl: string; group: string }): Promise<boolean> {
  try {
    const res = await fetch(MATERIALS_URL, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: input.id, action: "choose", chosen_icon_url: input.chosenIconUrl, group: input.group }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
