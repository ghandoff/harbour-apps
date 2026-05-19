/**
 * Shared database connection for harbour auth.
 *
 * Uses @neondatabase/serverless's HTTP driver (`neon()`) instead of the
 * WebSocket-based `Pool`. The HTTP driver makes a stateless HTTPS request
 * per query — no persistent connection, no native I/O that can leak across
 * CF Workers request contexts.
 *
 * Background: CF Workers can reuse isolates across requests. A Pool creates
 * WebSocket connections that are "owned" by the request that first used them.
 * When a second request tries to reuse those connections, CF Workers throws:
 * "Cannot perform I/O on behalf of a different request (I/O type: Native)".
 * Switching to the HTTP driver eliminates this class of error entirely.
 *
 * Reads POSTGRES_URL or DATABASE_URL from the environment.
 */
import { neon } from "@neondatabase/serverless";

let _sql: ReturnType<typeof neon> | null = null;

function getSql(): ReturnType<typeof neon> {
  if (!_sql) {
    const conn = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    if (!conn)
      throw new Error("[harbour-auth] POSTGRES_URL or DATABASE_URL is required");
    _sql = neon(conn);
  }
  return _sql;
}

export const sql = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async query(text: string, params?: unknown[]): Promise<{ rows: any[] }> {
    // Cast to any[] to match the pg/Pool query result shape that all callers expect
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = (await getSql()(text, params as unknown[])) as any[];
    return { rows };
  },
};
