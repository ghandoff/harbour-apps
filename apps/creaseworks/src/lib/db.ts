/**
 * App-level database connection — CF Workers compatible.
 *
 * Uses @neondatabase/serverless's HTTP driver (`neon()`) instead of the
 * WebSocket-based `Pool`. The HTTP driver makes a stateless HTTPS request
 * per query — no persistent connection, no native I/O that can leak across
 * CF Workers request contexts.
 *
 * Supports two call patterns for backward compatibility:
 *   await sql`SELECT * FROM users WHERE id = ${id}`   (tagged template)
 *   await sql.query("SELECT * FROM users WHERE id = $1", [id])  (.query())
 *
 * Both return { rows, rowCount } to match the pg/Pool response shape.
 */
import { neon } from "@neondatabase/serverless";
import { readFileSync } from "fs";
import { join } from "path";

let _conn: ReturnType<typeof neon> | null = null;

function getConn(): ReturnType<typeof neon> {
  if (!_conn) {
    const url = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    if (!url)
      throw new Error("[creaseworks-db] POSTGRES_URL or DATABASE_URL required");
    _conn = neon(url);
  }
  return _conn;
}

/**
 * Tagged template handler. Converts template literals into parameterized
 * queries to prevent SQL injection.
 *
 * Usage: await sql`SELECT * FROM users WHERE id = ${id}`
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type QueryResult = { rows: any[]; rowCount: number };

function sqlTagged(strings: TemplateStringsArray, ...values: unknown[]): Promise<QueryResult> {
  const text = strings.reduce(
    (acc, str, i) => acc + str + (i < values.length ? `$${i + 1}` : ""),
    "",
  );
  // Cast to any[] to match the pg/Pool query result shape that all callers expect
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return getConn()(text, values).then((rows) => ({ rows: rows as any[], rowCount: (rows as any[]).length }));
}

// Attach .query() so both patterns work
sqlTagged.query = async (text: string, params?: unknown[]): Promise<QueryResult> => {
  // Cast to any[] to match the pg/Pool query result shape that all callers expect
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (await getConn()(text, params as unknown[])) as any[];
  return { rows, rowCount: rows.length };
};

export const sql = sqlTagged;

/**
 * Run the initial schema migration only (001_initial_schema.sql).
 *
 * Dev-only helper — NOT used in production. Migrations are applied via
 * the Neon console or a dedicated migration runner.
 */
export async function runInitialSchema() {
  const migrationPath = join(process.cwd(), "migrations", "001_initial_schema.sql");
  const migration = readFileSync(migrationPath, "utf-8");

  const statements = migration
    .split(";")
    .map((s) =>
      s
        .split("\n")
        .filter((line) => !line.trim().startsWith("--"))
        .join("\n")
        .trim()
    )
    .filter((s) => s.length > 0);

  for (const statement of statements) {
    await sql.query(statement);
  }
}
