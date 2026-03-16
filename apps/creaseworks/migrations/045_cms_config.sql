-- Migration 045: CMS config table for Notion-managed app configuration
--
-- Stores key-value configuration entries synced from a Notion "App Config"
-- database. Powers form dropdowns, wizard options, and other content that
-- the collective should be able to update without code changes.
--
-- Each row represents one option within a config group (e.g. key="run_types",
-- value="home session"). Complex items store additional fields in metadata JSONB.

CREATE TABLE IF NOT EXISTS cms_config (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key    TEXT NOT NULL,
  value         TEXT NOT NULL,
  sort_order    INT NOT NULL DEFAULT 0,
  group_key     TEXT,
  metadata      JSONB,
  notion_id     TEXT UNIQUE,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cms_config_key ON cms_config (config_key, sort_order);
