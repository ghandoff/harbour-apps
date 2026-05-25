/**
 * Shared feedback API handler.
 *
 * Each app creates a thin route file:
 *   import { createFeedbackHandler } from "@windedvertigo/feedback/api-handler";
 *   export const POST = createFeedbackHandler("orbit-lab");
 *
 * Stores feedback in the harbour_feedback Postgres table.
 * Optionally pings a Slack webhook if SLACK_FEEDBACK_WEBHOOK_URL is set.
 */

import { NextResponse } from "next/server";
import type { FeedbackPayload } from "./types";

export function createFeedbackHandler(defaultAppSlug: string) {
  return async function POST(request: Request) {
    try {
      const body = (await request.json()) as Partial<FeedbackPayload>;

      const app_slug = body.app_slug || defaultAppSlug;
      const { route, feedback_type, severity, comment, device_info } = body;

      if (!feedback_type || !severity || severity < 1 || severity > 5) {
        return NextResponse.json(
          { error: "feedback_type and severity (1-5) are required" },
          { status: 400 },
        );
      }

      // store in postgres if POSTGRES_URL is available
      if (process.env.POSTGRES_URL || process.env.DATABASE_URL) {
        const { neon } = await import("@neondatabase/serverless");
        const sql = neon(process.env.POSTGRES_URL || process.env.DATABASE_URL!);
        await sql`
          INSERT INTO harbour_feedback (app_slug, route, feedback_type, severity, comment, device_info)
          VALUES (${app_slug}, ${route || null}, ${feedback_type}, ${severity}, ${comment || null}, ${JSON.stringify(device_info || {})})
        `;
      } else {
        // log to stdout as fallback (visible in Vercel function logs)
        console.log("[feedback]", JSON.stringify({ app_slug, route, feedback_type, severity, comment, device_info }));
      }

      // optional slack notification (supports webhook URL or bot token).
      //
      // Three things matter on Cloudflare Workers:
      //  1) AWAIT the fetch — unawaited fetches get cancelled when the
      //     Worker invocation ends, so a fire-and-forget pattern (the
      //     prior implementation) silently drops the post on most
      //     requests. The user pays ~200-400ms for the extra round-trip,
      //     but the alternative is "no Slack message ever arrives,"
      //     which is exactly the bug we just shipped a fix for.
      //  2) LOG both success and failure. A silent `.catch(() => {})`
      //     hides expired webhooks / 4xx responses from operators.
      //  3) DO NOT throw — Slack failures should not 500 the user's
      //     bug report submission, which already persisted to Postgres.
      const slackUrl = process.env.SLACK_FEEDBACK_WEBHOOK_URL;
      const slackToken = process.env.SLACK_BOT_TOKEN;
      const slackChannel = process.env.SLACK_FEEDBACK_CHANNEL;

      const icon = feedback_type === "bug" ? "🔴" : feedback_type === "confusing" ? "🟡" : feedback_type === "idea" ? "💡" : "💬";
      const text = `${icon} *[${app_slug}]* ${feedback_type} (${severity}/5)${comment ? `\n> ${comment}` : ""}${route ? `\n_${route}_` : ""}`;

      // Routing precedence (post-tidy-up — winded.vertigo unified bot):
      //   1) SLACK_BOT_TOKEN + SLACK_FEEDBACK_CHANNEL — preferred, single
      //      bot identity across all projects, channel routed per-worker.
      //   2) SLACK_FEEDBACK_WEBHOOK_URL — legacy fallback while we migrate
      //      workers off webhooks. Delete once all workers have the bot
      //      token + channel ID set.
      //   3) Log a warning if neither is configured.
      let slack_status: number | null = null;
      let slack_body: string | null = null;
      try {
        if (slackToken && slackChannel) {
          const res = await fetch("https://slack.com/api/chat.postMessage", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${slackToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ channel: slackChannel, text }),
          });
          slack_status = res.status;
          if (!res.ok) slack_body = (await res.text()).slice(0, 300);
        } else if (slackUrl) {
          const res = await fetch(slackUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text }),
          });
          slack_status = res.status;
          if (!res.ok) slack_body = (await res.text()).slice(0, 300);
        } else {
          console.warn("[feedback] no slack credentials configured — message dropped");
        }
      } catch (err) {
        console.error("[feedback] slack post threw:", err);
      }

      // Structured log — searchable in CF Worker logs as "[feedback] slack:"
      console.log(
        `[feedback] slack: app_slug=${app_slug} status=${slack_status ?? "skipped"}${
          slack_body ? ` body=${slack_body}` : ""
        }`,
      );

      return NextResponse.json({ ok: true });
    } catch (err) {
      console.error("[feedback] error:", err);
      return NextResponse.json({ error: "internal error" }, { status: 500 });
    }
  };
}
