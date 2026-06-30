/**
 * cw-materials — client for the open-ended materials pipeline.
 *
 * Kids submit materials that aren't on the list (used privately in their
 * session); the collective reviews them on the dashboard. Same-host,
 * root-relative POST to the eval worker (mirrors cw-trace / cw-identity).
 * Everything fails soft — a dropped submission must never break play.
 */

const MATERIALS_URL = "/harbour/creaseworks-eval/api/eval/materials";

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

export interface SubmittedMaterial {
  id: string;
  group_code: string;
  submitted_by: string | null;
  title: string;
  description: string | null;
  form_primary: string | null;
  status: string;
  chosen_icon_url: string | null;
  created_at: string;
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

/** List submissions by status (default pending) for the review card. */
export async function fetchMaterials(status = "pending"): Promise<SubmittedMaterial[]> {
  try {
    const res = await fetch(`${MATERIALS_URL}?status=${encodeURIComponent(status)}`);
    if (!res.ok) return [];
    const body = (await res.json()) as { materials?: SubmittedMaterial[] };
    return Array.isArray(body.materials) ? body.materials : [];
  } catch {
    return [];
  }
}

/** Collective accept (with a form_primary) or decline a submission. */
export async function reviewMaterial(input: {
  id: string;
  action: "accept" | "decline";
  formPrimary?: string;
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
        reviewer: input.reviewer,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
