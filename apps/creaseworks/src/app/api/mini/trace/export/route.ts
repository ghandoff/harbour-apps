/**
 * GET /api/mini/trace/export?code=<family_code>&format=csv|json&from=&to=
 *
 * Team-facing export of trace_events for pilot analysis (join it with the human
 * eval — event names match the eval vocabulary). Gated by MODERATOR_CODE (the
 * same x-moderator-code header the moderation routes use). Read-only.
 */

import { NextRequest, NextResponse } from "next/server";
import { getMiniEnv, checkModerator } from "@/lib/mini-server";

export async function GET(req: NextRequest) {
  const env = getMiniEnv();
  if (!env) return NextResponse.json({ error: "not available" }, { status: 404 });
  if (!checkModerator(req.headers.get("x-moderator-code"))) {
    return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  }

  const sp = req.nextUrl.searchParams;
  const code = sp.get("code");
  const format = sp.get("format") === "csv" ? "csv" : "json";
  const from = sp.get("from");
  const to = sp.get("to");

  let sql =
    "SELECT id, family_code, session_id, playdate_slug, event_type, payload_json, created_at FROM trace_events WHERE 1=1";
  const binds: unknown[] = [];
  if (code) {
    sql += " AND family_code = ?";
    binds.push(code.trim().toLowerCase());
  }
  if (from) {
    sql += " AND created_at >= ?";
    binds.push(from);
  }
  if (to) {
    sql += " AND created_at <= ?";
    binds.push(to);
  }
  sql += " ORDER BY created_at ASC LIMIT 10000";

  const { results } = await env.db
    .prepare(sql)
    .bind(...binds)
    .all<Record<string, unknown>>();

  if (format === "csv") {
    const cols = ["id", "family_code", "session_id", "playdate_slug", "event_type", "payload_json", "created_at"];
    const esc = (v: unknown) => {
      const s = v == null ? "" : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [cols.join(","), ...results.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="trace_events.csv"',
      },
    });
  }

  return NextResponse.json({ events: results });
}
