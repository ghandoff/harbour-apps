import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { PARSE_OBJECTIVES_SYSTEM, build_parse_prompt } from "@/lib/prompts/parse-objectives";
import type { ParseObjectivesInput } from "@/lib/prompts/parse-objectives";

const client = new Anthropic();

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ParseObjectivesInput;

    if (!body.raw_text?.trim()) {
      return NextResponse.json(
        { error: "raw_text is required" },
        { status: 400 }
      );
    }

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: PARSE_OBJECTIVES_SYSTEM,
      messages: [{ role: "user", content: build_parse_prompt(body) }],
    });

    const text = response.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("");

    // extract JSON from response (may be wrapped in markdown code block)
    const json_match = text.match(/\[[\s\S]*\]/);
    if (!json_match) {
      return NextResponse.json(
        { error: "failed to parse objectives from response" },
        { status: 500 }
      );
    }

    const objectives = JSON.parse(json_match[0]);

    return NextResponse.json({ objectives });
  } catch (error) {
    console.error("[parse] error:", error);
    return NextResponse.json(
      { error: "failed to parse lesson plan" },
      { status: 500 }
    );
  }
}
