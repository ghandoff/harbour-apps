import type {
  RoomState,
  Activity,
  ActivityConfig,
  Participant,
  PollConfig,
  PredictionConfig,
  PuzzleConfig,
} from "./types";

/** generate a formatted markdown session report from room state */
export function generateSessionReport(state: RoomState): string {
  const lines: string[] = [];
  const timestamp = new Date(state.createdAt).toISOString().replace("T", " ").slice(0, 19);
  const participants = Object.values(state.participants);

  lines.push(`# raft.house session report`);
  lines.push("");
  lines.push(`- **code:** ${state.code}`);
  lines.push(`- **started:** ${timestamp}`);
  lines.push(`- **status:** ${state.status}`);
  lines.push(`- **participants:** ${participants.length}`);
  lines.push(`- **activities:** ${state.activities.length}`);
  lines.push("");
  lines.push("---");
  lines.push("");

  // ── activities ──────────────────────────────────────────────────
  for (let i = 0; i < state.activities.length; i++) {
    const activity = state.activities[i];
    lines.push(`## ${i + 1}. ${activity.label}`);
    lines.push("");
    lines.push(`**type:** ${activity.type} · **phase:** ${activity.phase}`);
    lines.push("");

    const prompt = getPrompt(activity.config);
    if (prompt) {
      lines.push(`> ${prompt}`);
      lines.push("");
    }

    // gather responses for this activity
    const responses = collectResponses(activity, participants);

    switch (activity.config.type) {
      case "poll":
        formatPoll(lines, activity.config.poll, responses);
        break;
      case "prediction":
        formatPrediction(lines, activity.config.prediction, responses);
        break;
      case "puzzle":
        formatPuzzle(lines, activity.config.puzzle, responses);
        break;
      default:
        formatGeneric(lines, responses);
        break;
    }

    lines.push("");
  }

  // ── participant list ────────────────────────────────────────────
  lines.push("---");
  lines.push("");
  lines.push("## participants");
  lines.push("");
  lines.push("| name | role | status |");
  lines.push("|------|------|--------|");
  for (const p of participants) {
    lines.push(`| ${p.displayName} | ${p.role} | ${p.connectionStatus} |`);
  }
  lines.push("");

  return lines.join("\n");
}

// ── helpers ─────────────────────────────────────────────────────

function getPrompt(config: ActivityConfig): string | null {
  switch (config.type) {
    case "poll":
      return config.poll.question;
    case "prediction":
      return config.prediction.question;
    case "reflection":
      return config.reflection.prompt;
    case "open-response":
      return config.openResponse.prompt;
    case "puzzle":
      return config.puzzle.prompt;
    case "asymmetric":
      return config.asymmetric.scenario;
    default:
      return null;
  }
}

interface ResponseEntry {
  displayName: string;
  response: unknown;
}

function collectResponses(activity: Activity, participants: Participant[]): ResponseEntry[] {
  const entries: ResponseEntry[] = [];
  for (const p of participants) {
    const r = p.responses[activity.id];
    if (r !== undefined) {
      entries.push({ displayName: p.displayName, response: r });
    }
  }
  return entries;
}

function formatPoll(lines: string[], config: PollConfig, responses: ResponseEntry[]) {
  if (responses.length === 0) {
    lines.push("*no responses*");
    return;
  }

  // tally votes
  const tally: Record<string, number> = {};
  const votersByOption: Record<string, string[]> = {};
  for (const opt of config.options) {
    tally[opt.id] = 0;
    votersByOption[opt.id] = [];
  }

  for (const { displayName, response } of responses) {
    const votes = Array.isArray(response) ? response : [response];
    for (const v of votes) {
      const key = String(v);
      if (tally[key] !== undefined) {
        tally[key]++;
        votersByOption[key].push(displayName);
      }
    }
  }

  lines.push("### vote tallies");
  lines.push("");
  for (const opt of config.options) {
    const count = tally[opt.id];
    const voters = votersByOption[opt.id];
    const voterStr = voters.length > 0 ? ` — ${voters.join(", ")}` : "";
    lines.push(`- **${opt.label}:** ${count}${voterStr}`);
  }
}

function formatPrediction(lines: string[], config: PredictionConfig, responses: ResponseEntry[]) {
  if (config.answer !== undefined) {
    const unit = config.unit ? ` ${config.unit}` : "";
    lines.push(`**answer:** ${config.answer}${unit}`);
    lines.push("");
  }

  if (responses.length === 0) {
    lines.push("*no responses*");
    return;
  }

  lines.push("### responses");
  lines.push("");
  for (const { displayName, response } of responses) {
    const correct =
      config.answer !== undefined && String(response) === String(config.answer)
        ? " ✓"
        : "";
    lines.push(`- **${displayName}:** ${String(response)}${correct}`);
  }
}

function formatPuzzle(lines: string[], config: PuzzleConfig, responses: ResponseEntry[]) {
  lines.push(`**solution:** ${config.solution.join(" → ")}`);
  lines.push("");

  if (responses.length === 0) {
    lines.push("*no responses*");
    return;
  }

  lines.push("### responses");
  lines.push("");
  for (const { displayName, response } of responses) {
    const seq = Array.isArray(response) ? response.join(" → ") : String(response);
    const isCorrect =
      Array.isArray(response) &&
      response.length === config.solution.length &&
      response.every((v: unknown, i: number) => String(v) === config.solution[i]);
    lines.push(`- **${displayName}:** ${seq}${isCorrect ? " ✓" : ""}`);
  }
}

function formatGeneric(lines: string[], responses: ResponseEntry[]) {
  if (responses.length === 0) {
    lines.push("*no responses*");
    return;
  }

  lines.push("### responses");
  lines.push("");
  for (const { displayName, response } of responses) {
    const text =
      typeof response === "string"
        ? response
        : JSON.stringify(response, null, 2);
    lines.push(`- **${displayName}:** ${text}`);
  }
}

/** trigger a file download in the browser */
export function downloadReport(state: RoomState) {
  const content = generateSessionReport(state);
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `raft-house-${state.code}-${Date.now()}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
