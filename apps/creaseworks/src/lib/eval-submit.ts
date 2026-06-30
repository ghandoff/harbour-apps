/**
 * eval-submit — post a captured evaluation from the mini to the eval worker.
 *
 * The mini (windedvertigo.com/harbour/creaseworks-mini) and the eval tool
 * (.../harbour/creaseworks-eval) share the same host, so this is a plain
 * same-origin fetch — no CORS, and the row lands in the eval worker's D1
 * (EVAL_DB), feeding the coherence dashboard. "Capture in the play app,
 * analyse in the eval app" — the industry split.
 *
 * Root-relative on purpose: NOT apiUrl(), which would prefix the mini
 * basePath. Fails soft (returns false) off-host / in local dev where the
 * eval worker isn't routed — capture only matters in production.
 */

const EVAL_SUBMIT_URL = "/harbour/creaseworks-eval/api/eval/submit";

export type EvalRegister = "kid" | "grownup" | "collective";

export interface EvalSubmitInput {
  slug: string;
  register: EvalRegister;
  name?: string | null;
  answers: Record<string, unknown>;
}

export async function postEval(input: EvalSubmitInput): Promise<boolean> {
  try {
    const res = await fetch(EVAL_SUBMIT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playdate_slug: input.slug,
        evaluator_name: input.name ?? null,
        register: input.register,
        answers: input.answers,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
