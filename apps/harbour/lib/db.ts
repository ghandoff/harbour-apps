import { neon } from "@neondatabase/serverless";

/**
 * Shared Neon Postgres client for the harbour hub.
 *
 * Uses the HTTP driver (`neon()`) instead of Pool (WebSocket) so it is
 * safe across CF Workers isolate reuse — Pool's persistent WebSocket
 * connections throw "Cannot perform I/O on behalf of a different request"
 * when a second request reuses the same isolate. The HTTP driver makes a
 * stateless HTTPS request per query, eliminating that class of error.
 *
 * Mirrors the pattern in apps/depth-chart/lib/db.ts and
 * apps/creaseworks/src/lib/db.ts.
 */

let _conn: ReturnType<typeof neon> | null = null;

function getConn(): ReturnType<typeof neon> {
  if (!_conn) {
    const url = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    if (!url) throw new Error("[harbour-db] POSTGRES_URL or DATABASE_URL required");
    _conn = neon(url);
  }
  return _conn;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type QueryResult = { rows: any[]; rowCount: number };

function sqlTagged(strings: TemplateStringsArray, ...values: unknown[]): Promise<QueryResult> {
  const text = strings.reduce(
    (acc, str, i) => acc + str + (i < values.length ? `$${i + 1}` : ""),
    "",
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return getConn()(text, values).then((rows) => ({ rows: rows as any[], rowCount: (rows as any[]).length }));
}

sqlTagged.query = async (text: string, params?: unknown[]): Promise<QueryResult> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (await getConn()(text, params as unknown[])) as any[];
  return { rows, rowCount: rows.length };
};

export const sql = sqlTagged;
