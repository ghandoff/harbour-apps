import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { GENERATE_TASK_SYSTEM, build_generate_prompt } from "@/lib/prompts/generate-task";
import { passes_authenticity_gate } from "@/lib/authenticity";
import { get_valid_formats } from "@/lib/blooms";
import { auth } from "@/lib/auth";
import { save_task, track_event, count_generations_today } from "@/lib/queries";
import type { GenerateTaskInput } from "@/lib/prompts/generate-task";
import type { AuthenticityProfile } from "@/lib/types";

const client = new Anthropic();
const MAX_RETRIES = 2;

// AI cost gate. winded.vertigo staff are uncapped; everyone else gets a daily
// free allowance before a friendly paywall. depth-chart sign-in is currently
// domain-gated to staff, so the quota is DORMANT today (every signed-in user is
// staff) — it activates the moment depth-chart opens to public sign-up. Tunable.
const STAFF_DOMAIN = "windedvertigo.com";
const DAILY_FREE_LIMIT = 10;

export async function POST(request: Request) {
  try {
    const session = await auth();
    const user_id = session?.user?.id ?? null;
    const email = session?.user?.email ?? null;

    // Require sign-in. This closes the open endpoint that previously let anyone
    // on the internet burn up to 3 Sonnet calls per request with no account.
    if (!user_id) {
      return NextResponse.json(
        { error: "please sign in to generate tasks." },
        { status: 401 }
      );
    }

    // Per-user daily quota (staff uncapped). Checked before generation so we
    // never spend tokens for a request we're going to reject.
    const is_staff =
      (email?.split("@")[1]?.toLowerCase() ?? "") === STAFF_DOMAIN;
    if (!is_staff) {
      const used_today = await count_generations_today(user_id);
      if (used_today >= DAILY_FREE_LIMIT) {
        return NextResponse.json(
          {
            error: `you've reached today's free limit of ${DAILY_FREE_LIMIT} generations. it resets tomorrow.`,
            code: "daily_limit_reached",
          },
          { status: 429 }
        );
      }
    }

    const body = (await request.json()) as GenerateTaskInput & {
      objective_id?: string;
      plan_id?: string;
    };

    if (!body.objective_raw_text?.trim()) {
      return NextResponse.json(
        { error: "objective_raw_text is required" },
        { status: 400 }
      );
    }

    // validate that the requested format is valid for the Bloom's level
    const valid_formats = get_valid_formats(body.blooms_level);
    if (!valid_formats.includes(body.task_format)) {
      return NextResponse.json(
        {
          error: `"${body.task_format}" is not valid for Bloom's level "${body.blooms_level}". valid formats: ${valid_formats.join(", ")}`,
        },
        { status: 400 }
      );
    }

    let last_result = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const prompt =
        attempt === 0
          ? build_generate_prompt(body)
          : `${build_generate_prompt(body)}\n\nPREVIOUS ATTEMPT FAILED THE AUTHENTICITY GATE. Scores were: ${JSON.stringify(last_result?.authenticity_scores)}. Improve the task to score >= 3 on at least 4 dimensions with an average >= 3.0.`;

      const response = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 8192,
        // Mark the stable system prefix for prompt caching. NB: it's ~750
        // tokens today — below Sonnet's 1024-token cache minimum — so this is
        // a no-op until the system prompt grows; kept per the caching mandate
        // and to benefit retries/growth. Cost here is output-dominated anyway,
        // so the sign-in gate + quota above are the real fiscal controls.
        system: [
          {
            type: "text",
            text: GENERATE_TASK_SYSTEM,
            cache_control: { type: "ephemeral" },
          },
        ],
        messages: [{ role: "user", content: prompt }],
      });

      const text = response.content
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("");

      const json_match = text.match(/\{[\s\S]*\}/);
      if (!json_match) continue;

      const result = JSON.parse(json_match[0]);
      last_result = result;

      const scores = result.authenticity_scores as AuthenticityProfile;
      const passed = passes_authenticity_gate(scores);
      if (passed || attempt === MAX_RETRIES) {
        const task_data = {
          ...result,
          authenticity_passed: passed,
          generation_attempts: attempt + 1,
        };

        // persist the task only when an objective is provided to attach it to
        if (body.objective_id) {
          try {
            const task_id = `task_${body.objective_id}`;
            await save_task(body.objective_id, { ...task_data, id: task_id, objective_id: body.objective_id, blooms_level: body.blooms_level, task_format: body.task_format }, attempt + 1, passed);
          } catch (e) {
            console.error("[generate] db save failed:", e);
          }
        }

        // Always record the generation — this is what the daily quota counts,
        // so it must fire for every successful generate (not only when a task
        // is persisted). user_id is guaranteed here (sign-in is required).
        try {
          await track_event(user_id, "task_generated", {
            plan_id: body.plan_id,
            objective_id: body.objective_id,
            blooms_level: body.blooms_level,
            task_format: body.task_format,
            attempts: attempt + 1,
            authenticity_passed: passed,
          });
        } catch (e) {
          console.error("[generate] track_event failed:", e);
        }

        return NextResponse.json(task_data);
      }
    }

    // shouldn't reach here, but return last result if we do
    return NextResponse.json({
      ...last_result,
      authenticity_passed: false,
      generation_attempts: MAX_RETRIES + 1,
    });
  } catch (error) {
    console.error("[generate] error:", error);
    return NextResponse.json(
      { error: "failed to generate task" },
      { status: 500 }
    );
  }
}
