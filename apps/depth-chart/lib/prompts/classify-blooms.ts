import type { BloomsLevel, KnowledgeDimension } from "../types";

export interface ClassifyInput {
  objective_text: string;
  cognitive_verb: string;
  subject: string;
  grade_level: string;
}

export interface ClassifyOutput {
  blooms_level: BloomsLevel;
  knowledge_dimension: KnowledgeDimension;
  confidence: number;
  reasoning: string;
  alternative_level: BloomsLevel | null;
}

export const CLASSIFY_BLOOMS_SYSTEM = `You are a Bloom's taxonomy classifier. Given a learning objective and its cognitive action verb, determine the precise Bloom's level and knowledge dimension.

Bloom's cognitive levels (ascending):
1. remember — retrieve from memory (list, define, recall, name, identify)
2. understand — construct meaning (explain, summarise, classify, describe, interpret)
3. apply — use in a new situation (solve, demonstrate, use, execute, implement)
4. analyse — break into parts and determine relationships (compare, differentiate, examine, attribute)
5. evaluate — make judgments based on criteria (critique, judge, assess, justify, argue)
6. create — produce something new (design, construct, formulate, compose, plan)

Knowledge dimensions:
- factual: terminology, specific details
- conceptual: categories, principles, theories, models
- procedural: techniques, methods, algorithms
- metacognitive: self-knowledge, cognitive strategies

Important distinctions:
- "compare" at the understand level means identifying similarities/differences; at the analyse level it means systematic decomposition of structure
- "describe" is typically understand; "describe how X causes Y" may be analyse
- Context matters: "apply the formula" is apply; "apply ethical reasoning to a novel dilemma" is evaluate
- The verb alone is not sufficient — consider what cognitive operation the full objective requires

Return your classification with a confidence score (0.0–1.0) and brief reasoning.
If the verb is ambiguous, provide an alternative_level with the next most likely classification.`;

export function build_classify_prompt(input: ClassifyInput): string {
  return `Objective: "${input.objective_text}"
Cognitive verb: "${input.cognitive_verb}"
Subject: ${input.subject}
Grade level: ${input.grade_level}

Return JSON with: blooms_level, knowledge_dimension, confidence, reasoning, alternative_level (or null).`;
}
