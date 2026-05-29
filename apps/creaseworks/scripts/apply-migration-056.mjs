#!/usr/bin/env node
// One-shot runner for migration 056 (harbour_knots ledger).
// Run from apps/creaseworks/: node scripts/apply-migration-056.mjs
// Idempotent — CREATE TABLE/INDEX IF NOT EXISTS, safe to re-run.

import { readFileSync } from "fs";
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local" });

const connStr = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
if (!connStr) {
  console.error("missing POSTGRES_URL(_NON_POOLING) in .env.local");
  process.exit(1);
}

const sql = neon(connStr);
const file = "migrations/056_harbour_knots.sql";
const raw = readFileSync(file, "utf8");

const stmts = raw
  .replace(/--.*$/gm, "")
  .split(";")
  .map((s) => s.trim())
  .filter((s) => s.length > 0);

console.log(`migration 056: ${stmts.length} statements`);
for (let i = 0; i < stmts.length; i++) {
  const preview = stmts[i].slice(0, 60).replace(/\s+/g, " ");
  console.log(`  [${i + 1}/${stmts.length}] ${preview}…`);
  try {
    await sql(stmts[i]);
    console.log("    ok");
  } catch (err) {
    console.error(`    failed: ${err.message}`);
    process.exit(1);
  }
}

const check = await sql(
  "SELECT to_regclass('public.harbour_knots') AS exists, " +
  "(SELECT COUNT(*) FROM harbour_knots) AS row_count"
);
console.log(`\nverified: harbour_knots present, ${check[0].row_count} rows`);
