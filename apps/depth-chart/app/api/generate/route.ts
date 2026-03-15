import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { GENERATE_TASK_SYSTEM, build_generate_prompt } from "@/lib/prompts/generate-task";
import { passes_authenticity_gate } from "@/lib/authenticity";
import { get_valid_formats } from "@/lib/blooms";
import type { GenerateTaskInput } from "@/lib/prompts/generate-task";
import type { AuthenticityProfile } from "@/lib/types";

const client = new Anthropic();
const MAX_RETRIES = 2;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GenerateTaskInput;

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
        system: GENERATE_TASK_SYSTEM,
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
      if (passes_authenticity_gate(scores) || attempt === MAX_RETRIES) {
        return NextResponse.json({
          ...result,
          authenticity_passed: passes_authenticity_gate(scores),
          generation_attempts: attempt + 1,
        });
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
