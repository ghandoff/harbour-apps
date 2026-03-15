#!/usr/bin/env node
/**
 * Apply migration 044 (tier-aware notification filtering) to Neon.
 * Run from apps/creaseworks/:
 *   node scripts/apply-migration-044.mjs
 *
 * Safe to re-run — uses IF NOT EXISTS and idempotent UPDATE.
 */

import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local" });

const connStr = process.env.POSTGRES_URL;

if (!connStr) {
  console.error("❌  No POSTGRES_URL found in .env.local");
  process.exit(1);
}

const sql = neon(connStr);

console.log("🔌  Connecting to Neon…\n");

// Statement 1: Add min_tier column (idempotent via IF NOT EXISTS)
try {
  await sql`
    ALTER TABLE in_app_notifications
      ADD COLUMN IF NOT EXISTS min_tier TEXT NOT NULL DEFAULT 'casual'
  `;
  console.log("✅  Added min_tier column to in_app_notifications");
} catch (err) {
  if (err.code === "42701") {
    console.log("⏭️  min_tier column already exists — skipping");
  } else {
    console.error(`❌  ALTER TABLE failed: ${err.message}`);
    process.exit(1);
  }
}

// Statement 2: Backfill gallery notifications to collaborator tier
try {
  const result = await sql`
    UPDATE in_app_notifications
      SET min_tier = 'collaborator'
      WHERE event_type IN ('gallery_approved', 'gallery_rejected')
        AND min_tier != 'collaborator'
  `;
  const count = result?.length ?? 0;
  console.log(`✅  Backfilled gallery notifications (${count} rows updated)`);
} catch (err) {
  console.error(`❌  Backfill failed: ${err.message}`);
  process.exit(1);
}

// Verify
const cols = await sql`
  SELECT column_name, data_type, column_default
  FROM information_schema.columns
  WHERE table_name = 'in_app_notifications'
    AND column_name = 'min_tier'
`;

if (cols.length === 1) {
  console.log(`\n✅  Verified: min_tier column exists (default: ${cols[0].column_default})`);
} else {
  console.error("\n⚠️  Verification failed — min_tier column not found");
  process.exit(1);
}

console.log("\n🎉  Migration 044 complete!");
