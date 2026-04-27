# Secret rotation runbook

> Single document for rotating any production secret across the winded.vertigo stack
> without forgetting one of the ~11 places it lives. Replaces the previous one-off
> habit of "rotate in vendor dashboard, hope to remember every consumer." See also:
> `~/.claude/projects/-Users-garrettjaeger-Projects/memory/reference_notion_token_rotation_plan.md`
> for the NOTION_TOKEN-specific historical doc.

## The pattern

Each production secret in this stack has roughly the same surface area:

1. **Source of truth (your local working copy):** `~/Projects/windedvertigo/port/.env.local`. This is where Garrett works most often, so it's where new keys land first when rotated in a vendor dashboard.
2. **Vercel project envs:** typically 2–3 projects × 3 environments (production, preview, development) = 6–9 env entries per secret.
3. **CF Worker secrets:** typically 1–3 Workers per secret.
4. **Other local `.env.local` files:** mirrors of the Vercel state for local dev workflows. These drift if not refreshed alongside Vercel.

Forgetting one of these is what got us here on 2026-04-26: the Resend key was rotated in the dashboard + updated only in `port/.env.local`. Production creaseworks digest crons, vault Stripe confirmation emails, and harbour magic-link sends were all silently broken until a deliverability test surfaced the gap.

## How to rotate (3 minutes)

```bash
# 1. Update the source-of-truth file with the new value from the vendor dashboard.
#    Use a real editor, not chat; never paste the value into Claude.
$EDITOR ~/Projects/windedvertigo/port/.env.local
# (find the secret line, replace the value, save)

# 2. Run the propagator. It validates the new value against the vendor's API
#    before touching any destination, so a typo can't propagate.
cd ~/Projects/harbour-apps && node scripts/rotate-secret.mjs --secret=NAME

# 3. Watch for the "✓ verified" line at the end. If you see "✗ verify failed",
#    the chain is inconsistent — investigate which step failed (the script
#    prints per-target ✓/✗ as it goes).
```

The script:
- Reads the secret from `port/.env.local` (only place it lives in your local fs)
- Probes the vendor's API to confirm the value is actually valid (catches typos and stale-source cases)
- Updates each Vercel project's env (rm + add via stdin — never on argv, never echoed)
- Updates each CF Worker's secret via `wrangler secret put` (also stdin)
- Rewrites each local `.env.local` mirror via `sed`-like in-place replace
- Triggers a Vercel redeploy per project so the new value is live immediately (CF Worker secrets activate without redeploy)
- Re-probes at the end as an end-to-end sanity check
- Wipes the secret value from process memory before exit

## Adding a new secret to the rotation script

In `~/Projects/harbour-apps/scripts/rotate-secret.mjs`, add an entry to the `SECRETS` map:

```js
const SECRETS = {
  RESEND_API_KEY: { /* ... */ },
  ANTHROPIC_API_KEY: {
    probeUrl: "https://api.anthropic.com/v1/messages",  // or whatever lightweight auth-check endpoint
    probeOkStatus: 200,
    vercelProjects: [
      ["port", "/Users/.../windedvertigo/port"],
      // …
    ],
    cfWorkers: ["wv-harbour-harbour", "wv-harbour-depth-chart"],
    localFiles: [
      "/Users/.../harbour-apps/apps/creaseworks/.env.local",
      // …
    ],
    redeployVercelAfterUpdate: true,
  },
};
```

To find a secret's destination list (run once, manually, for any new secret):

```bash
# Vercel projects with the secret:
for proj in port creaseworks vertigo-vault depth-chart harbour ops; do
  echo "--- $proj ---"
  (cd /path/to/$proj && vercel env ls 2>/dev/null | grep "^.SECRET_NAME ")
done

# CF Workers with the secret:
export CLOUDFLARE_API_TOKEN=$(cat ~/.cf-token)
for w in wv-harbour-harbour wv-harbour-depth-chart wv-site wv-launch-smoke; do
  echo "--- $w ---"
  npx wrangler secret list --name $w 2>/dev/null | grep SECRET_NAME
done

# Local files with the secret:
find ~/Projects -name ".env*" -not -path "*/node_modules/*" -exec grep -l "^SECRET_NAME=" {} \;
```

## Why this design

- **Source of truth = `port/.env.local`** because port is where Garrett works hands-on, so a freshly-rotated key naturally lands there first. Picking a different anchor (`~/.config/wv-agent/env.local`?) would just move the "where do I update first" question around.
- **Probe before propagate** is the load-bearing safety check. If you typo the new key in the source, the script aborts before touching any destination — current production keeps working.
- **Stdin-only secret transfer** means the value never appears in shell history, never in Bash argv lists (visible to `ps`), never in chat, never in env-var lists.
- **Process-memory wipe at end** is mostly cosmetic since the script exits anyway, but it's a habit worth keeping if the script ever gets refactored into a long-lived helper.
- **Per-target ✓/✗ output** lets you see partial failures cleanly. If 2 of 3 Vercel projects update but the third fails (auth expired, project-not-linked, etc.), you know exactly which to retry by hand.

## How to add this rotation pattern to a new monorepo / project

The script depends on:
- `@neondatabase/serverless` (already in harbour-apps) for any DB-side check; not used by current secrets
- `vercel` CLI — must be authenticated (`vercel login` once per machine)
- `npx wrangler` — must be authenticated (`wrangler login` or `CLOUDFLARE_API_TOKEN` env)
- `curl` (for the probe)
- A source-of-truth `.env.local` Garrett actually edits when rotating

Drop the script + this runbook into the new repo, edit the SOURCE constant, and you're set.

## When to manually intervene

Three failure modes the script can't handle:
1. **Probe says invalid for the source key.** Means you typed it wrong in port/.env.local OR the vendor dashboard's "show key" screen had a copy-paste artifact. Fix the source file, re-run.
2. **Vercel CLI auth expired.** `vercel login` first. Token-based CI auth is a different flow.
3. **CF Worker not linked to a wrangler project locally.** This shouldn't happen in this stack since the wrangler.jsonc files are committed, but if it does: cd into the relevant `apps/<worker>/` and `wrangler whoami` to check.

## Past rotation incidents (for institutional memory)

- **2026-04-26 — RESEND_API_KEY:** rotated in Resend dashboard, propagated only to `port/.env.local`. Surfaced when the Track D email-deliverability seed test couldn't auth (HTTP 401 from Resend). Probe across all `.env.*` files found exactly one valid copy (port). Production creaseworks email crons + vault Stripe confirmations were silently broken; smoke worker doesn't catch email side-effects. Rotation propagated via this script (commit forthcoming).
- **2026-04-23 — multiple secrets after AGENT_AUDIT_DB_ID issue:** memory entry `reference_notion_token_rotation_plan.md` documents the NOTION_TOKEN-specific 178-file rotation sequence.
