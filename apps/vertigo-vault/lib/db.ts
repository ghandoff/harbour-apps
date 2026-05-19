import { neon } from "@neondatabase/serverless";

/**
 * Neon Postgres client for vertigo-vault.
 *
 * Uses the HTTP driver (`neon()`) — stateless HTTPS per query — so this
 * module is safe across CF Workers isolate reuse. Pool (WebSocket) holds
 * a connection across requests and throws "Cannot perform I/O on behalf
 * of a different request" when a second request lands in the same isolate.
 *
 * Mirrors apps/depth-chart/lib/db.ts.
 */

let _conn: ReturnType<typeof neon> | null = null;

function getConn(): ReturnType<typeof neon> {
  if (!_conn) {
    const url = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    if (!url) {
      throw new Error("[vault-db] POSTGRES_URL or DATABASE_URL required");
    }
    _conn = neon(url);
  }
  return _conn;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type QueryResult = { rows: any[]; rowCount: number };

function sqlTagged(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<QueryResult> {
  const text = strings.reduce(
    (acc, str, i) => acc + str + (i < values.length ? `$${i + 1}` : ""),
    "",
  );
  return getConn()(text, values).then((rows) => ({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rows: rows as any[],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rowCount: (rows as any[]).length,
  }));
}

sqlTagged.query = async (
  text: string,
  params?: unknown[],
): Promise<QueryResult> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (await getConn()(text, params as unknown[])) as any[];
  return { rows, rowCount: rows.length };
};

export const sql = sqlTagged;
