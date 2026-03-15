import type { LearningObjective } from "../types";

export interface ParseObjectivesInput {
  raw_text: string;
  subject: string;
  grade_level: string;
}

export type ParseObjectivesOutput = Omit<LearningObjective, "lesson_plan_id" | "tasks">[];

export const PARSE_OBJECTIVES_SYSTEM = `You are parsing a lesson plan or syllabus to extract structured learning objectives.

For each objective you identify, extract:
- raw_text: the original text of the objective as written
- cognitive_verb: the verb that defines what students will DO (e.g., "analyse", "design", "explain")
- blooms_level: the Bloom's taxonomy level — one of: remember, understand, apply, analyse, evaluate, create
- knowledge_dimension: one of: factual, conceptual, procedural, metacognitive
- content_topic: the domain knowledge involved (e.g., "causes of the French Revolution")
- context: any conditions, tools, or constraints mentioned (e.g., "using primary source documents")
- confidence: 0.0–1.0 indicating how confident you are in the classification

If the lesson plan uses vague language like "students will learn about X" or "students will be familiar with Y", flag it as implicit:
- Infer the most likely Bloom's level from surrounding context
- Set confidence < 0.8
- Use "understand" as the default if no cognitive verb is present

Rules:
- Extract EVERY learning objective, including those embedded in activity descriptions
- Do not invent objectives that aren't in the text
- If an objective contains multiple cognitive verbs at different levels, split it into separate objectives
- Preserve the original wording in raw_text exactly as written`;

export function build_parse_prompt(input: ParseObjectivesInput): string {
  return `Lesson plan text:
${input.raw_text}

Subject: ${input.subject}
Grade level: ${input.grade_level}

Return a JSON array of objectives. Each object must have: id (generate a short unique string), raw_text, cognitive_verb, blooms_level, knowledge_dimension, content_topic, context, confidence.

Flag any objectives that appear to lack assessment coverage by adding a field "gap_flag": true.`;
}
