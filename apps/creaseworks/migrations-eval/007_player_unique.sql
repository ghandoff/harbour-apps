-- Audit hardening: enforce one avatar per group at the DB level.
-- The roster route dedups in app code, but concurrent "who's playing?" taps
-- (a class of 30 at once) can race past it and create duplicate avatar rows,
-- which corrupt within-child analytics. Dedup any existing dups (keep the
-- earliest-inserted by rowid), then make it impossible.
DELETE FROM players
WHERE rowid NOT IN (SELECT MIN(rowid) FROM players GROUP BY group_code, avatar);

CREATE UNIQUE INDEX IF NOT EXISTS idx_players_group_avatar
  ON players (group_code, avatar);
