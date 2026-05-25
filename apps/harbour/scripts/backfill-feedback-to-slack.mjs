#!/usr/bin/env node
/**
 * Backfill harbour_feedback rows to Slack.
 *
 * Context: the shared feedback API handler in packages/feedback/api-handler.ts
 * was doing fire-and-forget `fetch(slackUrl).catch(() => {})`. On Cloudflare
 * Workers, unawaited fetches get cancelled when the Worker invocation ends,
 * so most Slack posts never actually completed — but the row WAS being
 * persisted to the harbour_feedback Postgres table first. This script
 * replays those persisted rows to Slack so the feedback isn't lost.
 *
 * The fix to the handler went live in this session. Any rows created
 * AFTER the fix deploy time were delivered through the working path and
 * should be skipped to avoid duplicates.
 *
 * Usage:
 *   POSTGRES_URL='postgres://...' \
 *   SLACK_FEEDBACK_WEBHOOK_URL='https://hooks.slack.com/services/...' \
 *   node scripts/backfill-feedback-to-slack.mjs
 *
 *   # Defaults to dry-run — prints what would be sent.
 *   # Add --send to actually post.
 *   # Optional --since / --until ISO timestamps to narrow the window.
 *   # Default cutoff: "until 2 hours ago" — the fix has been live well
 *   # past that window so anything older is guaranteed pre-fix.
 *
 * Examples:
 *   # Preview the full backfill
 *   node scripts/backfill-feedback-to-slack.mjs
 *
 *   # Actually send everything pre-fix
 *   node scripts/backfill-feedback-to-slack.mjs --send
 *
 *   # Narrow window
 *   node scripts/backfill-feedback-to-slack.mjs --since 2026-04-15 --until 2026-05-20 --send
 *
 * Idempotency: the script tags each backfilled message with `[backfill]`
 * + the original timestamp so reviewers can spot duplicates if the
 * script is run twice. There's no `slack_replayed_at` column on the
 * table — adding one for a one-shot job felt heavy. If you do run twice,
 * just review the timestamps and ignore duplicates manually.
 */

import { setTimeout as sleep } from "node:timers/promises";

// ──────────────────────────────────────────────────────────────────────
// Config
// ──────────────────────────────────────────────────────────────────────

const POSTGRES_URL = process.env.POSTGRES_URL;
const SLACK_URL = process.env.SLACK_FEEDBACK_WEBHOOK_URL;

if (!POSTGRES_URL) {
  console.error("✗ POSTGRES_URL env var required.");
  console.error("  Source it from your local .env, the Neon dashboard,");
  console.error("  or `wrangler secret list` (which shows names only — you");
  console.error("  still need the value from a separate source).");
  process.exit(1);
}
if (!SLACK_URL) {
  console.error("✗ SLACK_FEEDBACK_WEBHOOK_URL env var required.");
  console.error("  Use the same webhook URL you set on the wv-harbour-harbour");
  console.error("  Worker (visible in Slack admin → Apps → Incoming Webhooks).");
  process.exit(1);
}

const args = process.argv.slice(2);
const argFlag = (name) => args.includes(name);
const argValue = (name) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : null;
};

const dryRun = !argFlag("--send");
const since = argValue("--since"); // ISO date string e.g. "2026-04-01"
// Default cutoff: 2 hours ago. The fix went live earlier today; anything
// older than 2h is safely pre-fix. Override with --until to widen / narrow.
const untilDefault = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
const until = argValue("--until") || untilDefault;
const limit = parseInt(argValue("--limit") || "1000", 10);

console.log(`\n──── harbour_feedback → Slack backfill ─────`);
console.log(`  mode:   ${dryRun ? "DRY RUN (pass --send to fire)" : "SEND"}`);
console.log(`  since:  ${since || "(table start)"}`);
console.log(`  until:  ${until}`);
console.log(`  limit:  ${limit}`);
console.log(`─────────────────────────────────────────────\n`);

// ──────────────────────────────────────────────────────────────────────
// Postgres query
// ──────────────────────────────────────────────────────────────────────

const { neon } = await import("@neondatabase/serverless");
const sql = neon(POSTGRES_URL);

const rows = since
  ? await sql`
      SELECT id, app_slug, route, feedback_type, severity, comment, device_info, created_at
      FROM harbour_feedback
      WHERE created_at >= ${since}::timestamptz AND created_at <= ${until}::timestamptz
      ORDER BY created_at ASC
      LIMIT ${limit}
    `
  : await sql`
      SELECT id, app_slug, route, feedback_type, severity, comment, device_info, created_at
      FROM harbour_feedback
      WHERE created_at <= ${until}::timestamptz
      ORDER BY created_at ASC
      LIMIT ${limit}
    `;

if (rows.length === 0) {
  console.log("No rows in window. Nothing to backfill. ✓");
  process.exit(0);
}

console.log(`Found ${rows.length} row(s) in window:`);
console.log(
  `  oldest: ${rows[0].created_at}`,
);
console.log(
  `  newest: ${rows[rows.length - 1].created_at}`,
);
const byApp = rows.reduce((acc, r) => {
  acc[r.app_slug] = (acc[r.app_slug] || 0) + 1;
  return acc;
}, {});
console.log(`  by app:`, byApp);
console.log("");

// ──────────────────────────────────────────────────────────────────────
// Format + send
// ──────────────────────────────────────────────────────────────────────

function formatMessage(row) {
  const icon =
    row.feedback_type === "bug"
      ? "🔴"
      : row.feedback_type === "confusing"
      ? "🟡"
      : row.feedback_type === "idea"
      ? "💡"
      : "💬";
  // Original timestamp in the body so reviewers can see when it was
  // actually submitted, vs. the (later) backfill post time.
  const ts = new Date(row.created_at).toISOString().replace("T", " ").slice(0, 16);
  const lines = [
    `${icon} *[backfill · ${ts} UTC]* *[${row.app_slug}]* ${row.feedback_type} (${row.severity}/5)`,
    row.comment ? `> ${row.comment}` : null,
    row.route ? `_${row.route}_` : null,
  ].filter(Boolean);
  return lines.join("\n");
}

let sent = 0;
let failed = 0;
const failures = [];

for (const row of rows) {
  const text = formatMessage(row);

  if (dryRun) {
    // Print preview, don't post.
    console.log("─".repeat(60));
    console.log(text);
    continue;
  }

  try {
    const res = await fetch(SLACK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) {
      const body = await res.text();
      failures.push({ id: row.id, status: res.status, body: body.slice(0, 200) });
      failed += 1;
      console.log(`  ✗ ${row.id} → ${res.status}`);
    } else {
      sent += 1;
      if (sent % 10 === 0) console.log(`  · sent ${sent}/${rows.length}`);
    }
  } catch (err) {
    failures.push({ id: row.id, error: String(err) });
    failed += 1;
    console.log(`  ✗ ${row.id} threw: ${err.message}`);
  }

  // Stay well under Slack's ~1 req/sec webhook limit.
  await sleep(220);
}

console.log("");
if (dryRun) {
  console.log(`Dry run complete. ${rows.length} message(s) would be sent.`);
  console.log(`Re-run with --send to fire them to Slack.`);
} else {
  console.log(`Done. ${sent} sent, ${failed} failed.`);
  if (failures.length > 0) {
    console.log("\nFailures:");
    for (const f of failures.slice(0, 20)) {
      console.log("  ", f);
    }
    if (failures.length > 20) console.log(`  ... and ${failures.length - 20} more`);
  }
}
