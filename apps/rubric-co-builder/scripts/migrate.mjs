#!/usr/bin/env node
// runs every migrations/*.sql file against POSTGRES_URL_NON_POOLING using
// the pg-compatible Pool from @neondatabase/serverless (supports raw multi-
// statement executes). comments are stripped before splitting on `;`.

import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "@neondatabase/serverless";

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, "..", "migrations");
const url = process.env.POSTGRES_URL_NON_POOLING ?? process.env.POSTGRES_URL;

if (!url) {
  console.error("POSTGRES_URL_NON_POOLING is required to run migrations.");
  process.exit(1);
}

const pool = new Pool({ connectionString: url });

function stripCommentsAndSplit(source) {
  const withoutBlock = source.replace(/\/\*[\s\S]*?\*\//g, "");
  const withoutLine = withoutBlock.replace(/--[^\n]*/g, "");
  return withoutLine
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
}

const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

try {
  for (const file of files) {
    const raw = readFileSync(join(migrationsDir, file), "utf8");
    const statements = stripCommentsAndSplit(raw);
    console.log(`running ${file} (${statements.length} statements)`);
    for (const stmt of statements) {
      await pool.query(stmt);
    }
  }
  console.log("migrations complete.");
} finally {
  await pool.end();
}
