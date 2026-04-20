import Anthropic from "@anthropic-ai/sdk";

// generates a short, deliberately-uneven student artefact tailored to the
// teacher's learning outcome + project description. returns null if the
// anthropic api isn't configured or the call fails — callers should fall back
// to the stock sample.
//
// model choice: sonnet 4.5 (creative generation, like depth-chart).
// prompt caching: the system prompt is stable across rooms, so we cache it
// to cut input-token cost ~90% on repeat generations within a 5-minute window.

export const ARTEFACT_MODEL = "claude-sonnet-4-5";

const SYSTEM_PROMPT = `you write short fictional student artefacts (400-500 words) that a class can use to calibrate a shared grading rubric.

rules you never break:
- write british english. all lowercase except proper nouns, acronyms, and corporate names.
- use oxford commas.
- output valid markdown. use at most 5 short ## headings. no code blocks. no tables.
- the artefact must be deliberately uneven: one dimension strong, one dimension thin, one dimension clear, one dimension ambiguous. this unevenness is the whole point — it gives students something to disagree about when they score it.
- sound like a real first-year student draft, not a polished deliverable. concrete claims, a few specific numbers, the occasional clumsy transition.
- never mention AI, winded.vertigo, or the rubric itself. this is the artefact only.
- do not label the unevenness. let the reader find it.

structure you always follow:
1. start with a one-line title as the first heading (##).
2. then 3–4 short sections under ## headings with natural, in-voice titles.
3. paragraphs of 2–4 sentences. no bullet lists unless the student would genuinely use one.
4. close with a short paragraph that lands the ask, the stake, or the commitment.

output two things, in this exact format and nothing else:

TITLE: <one short line, sentence case, under 90 characters>
CONTENT:
<the markdown body — starts with a ## heading, uses ## for section breaks, double newlines between paragraphs>`;

const USER_TEMPLATE = (outcome: string, project: string) =>
  `learning outcome the assessment should surface:
${outcome}

the project description the class will be graded on:
${project}

write a fictional student artefact that a plausible team in this class would produce. make it uneven on purpose so the class has something to argue about when scoring.`;

export type GeneratedArtefact = { title: string; content: string };

function parseResponse(text: string): GeneratedArtefact | null {
  const titleMatch = text.match(/^\s*TITLE:\s*(.+?)\s*(?:\r?\n)+CONTENT:\s*/i);
  if (!titleMatch) return null;
  const title = titleMatch[1].trim().slice(0, 200);
  const content = text.slice(titleMatch[0].length).trim();
  if (!title || !content) return null;
  return { title, content };
}

export async function generateArtefact(
  outcome: string,
  project: string,
): Promise<GeneratedArtefact | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const client = new Anthropic({ apiKey });

  try {
    const response = await client.messages.create({
      model: ARTEFACT_MODEL,
      max_tokens: 1200,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: USER_TEMPLATE(outcome, project),
        },
      ],
    });

    const firstText = response.content.find((b) => b.type === "text");
    if (!firstText || firstText.type !== "text") return null;
    return parseResponse(firstText.text);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[rubric-co-builder] generateArtefact failed:", err);
    return null;
  }
}
