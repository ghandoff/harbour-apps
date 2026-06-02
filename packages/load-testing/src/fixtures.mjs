// Activity fixtures — one for each of the 9 ActivityType values in
// apps/raft-house/lib/types.ts. Each conforms to the discriminated-union
// shape of ActivityConfig so the server-side reducer accepts them without
// modification. Shapes are derived directly from lib/types.ts — if a new
// activity type is added there, mirror it here.
//
// `response()` returns a plausible participant submission for that activity
// type. Used by the activity-matrix scenario to round-trip a submission and
// assert reveal-results sees it.

/** @typedef {import("../../../apps/raft-house/lib/types").Activity} Activity */

/**
 * Build an Activity of the given type. `i` is the activity index in the test
 * sequence (used for id/label uniqueness so the same fixture can appear twice
 * in one room without colliding).
 *
 * @param {string} type
 * @param {number} [i=0]
 * @returns {Activity}
 */
export function fixtureActivity(type, i = 0) {
  const idSuffix = `-${i}`;
  const base = { phase: "encounter", label: `${type} test ${i}` };

  switch (type) {
    case "poll":
      return {
        ...base,
        id: `poll${idSuffix}`,
        type: "poll",
        config: {
          type: "poll",
          poll: {
            question: "favourite colour?",
            options: [
              { id: "r", label: "red" },
              { id: "g", label: "green" },
              { id: "b", label: "blue" },
            ],
          },
        },
        mechanic: { interactionModel: "reveal", socialStructure: "anonymous", tempo: "rapid-fire" },
      };

    case "prediction":
      return {
        ...base,
        id: `prediction${idSuffix}`,
        type: "prediction",
        config: {
          type: "prediction",
          prediction: { question: "year of moon landing?", type: "number", answer: 1969 },
        },
        mechanic: { tempo: "timed" },
      };

    case "reflection":
      return {
        ...base,
        id: `reflection${idSuffix}`,
        type: "reflection",
        config: {
          type: "reflection",
          reflection: { prompt: "what surprised you most?", minLength: 10, shareWithGroup: false },
        },
        mechanic: { tempo: "contemplative", socialStructure: "solo" },
      };

    case "open-response":
      return {
        ...base,
        id: `open${idSuffix}`,
        type: "open-response",
        config: {
          type: "open-response",
          openResponse: { prompt: "describe in three words", responseType: "text", anonymous: true },
        },
      };

    case "puzzle":
      return {
        ...base,
        id: `puzzle${idSuffix}`,
        type: "puzzle",
        config: {
          type: "puzzle",
          puzzle: {
            prompt: "order the steps",
            pieces: [
              { id: "a", content: "step a" },
              { id: "b", content: "step b" },
              { id: "c", content: "step c" },
            ],
            solution: ["a", "b", "c"],
          },
        },
      };

    case "asymmetric":
      return {
        ...base,
        id: `asymmetric${idSuffix}`,
        type: "asymmetric",
        config: {
          type: "asymmetric",
          asymmetric: {
            scenario: "town hall budget",
            roles: [
              { id: "mayor", label: "mayor", info: "secret: budget gap", question: "raise taxes?" },
              { id: "citizen", label: "citizen", info: "no info", question: "what to do?" },
            ],
            discussionPrompt: "discuss your perspective",
          },
        },
        mechanic: { socialStructure: "asymmetric" },
      };

    case "canvas":
      return {
        ...base,
        id: `canvas${idSuffix}`,
        type: "canvas",
        config: {
          type: "canvas",
          canvas: {
            prompt: "place a pin where you feel today",
            width: 600,
            height: 400,
            xLow: "calm",
            xHigh: "anxious",
            yLow: "tired",
            yHigh: "energised",
          },
        },
      };

    case "sorting":
      return {
        ...base,
        id: `sorting${idSuffix}`,
        type: "sorting",
        config: {
          type: "sorting",
          sorting: {
            prompt: "sort these into the right buckets",
            cards: [
              { id: "c1", content: "card 1" },
              { id: "c2", content: "card 2" },
            ],
            categories: [
              { id: "cat-a", label: "category a" },
              { id: "cat-b", label: "category b" },
            ],
            solution: { c1: "cat-a", c2: "cat-b" },
          },
        },
      };

    case "rule-sandbox":
      return {
        ...base,
        id: `sandbox${idSuffix}`,
        type: "rule-sandbox",
        config: {
          type: "rule-sandbox",
          ruleSandbox: {
            prompt: "explore the formula",
            parameters: [
              { id: "p", label: "price", min: 0, max: 100, step: 1, defaultValue: 50 },
              { id: "q", label: "quantity", min: 1, max: 10, step: 1, defaultValue: 5 },
            ],
            formula: "p * q",
            outputLabel: "total",
            reflectionPrompt: "what value gives the result you want?",
          },
        },
      };

    default:
      throw new Error(`unknown activity type: ${type}`);
  }
}

/** Plausible participant submission for the given activity type. */
export function fixtureResponse(type) {
  switch (type) {
    case "poll":
      return { selected: "g" };
    case "prediction":
      return { value: 1969 };
    case "reflection":
      return { text: "the prompt revealed an assumption I held" };
    case "open-response":
      return { text: "exposed, curious, ready" };
    case "puzzle":
      return { order: ["a", "b", "c"] };
    case "asymmetric":
      return { roleId: "mayor", response: "raise modestly with offsets" };
    case "canvas":
      return { pins: [{ x: 0.4, y: 0.7 }] };
    case "sorting":
      return { mapping: { c1: "cat-a", c2: "cat-b" } };
    case "rule-sandbox":
      return { parameters: { p: 70, q: 3 }, reflection: "diminishing returns above 70" };
    default:
      throw new Error(`no response fixture for type: ${type}`);
  }
}

/** All activity type strings, in the order ActivityType is declared in types.ts. */
export const ACTIVITY_TYPES = [
  "poll",
  "prediction",
  "reflection",
  "open-response",
  "puzzle",
  "asymmetric",
  "canvas",
  "sorting",
  "rule-sandbox",
];
