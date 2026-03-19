# windedvertigo monorepo — claude code conventions

> auto-loaded by Claude Code when working in this directory.

## monorepo structure

npm workspaces + Turborepo. 10 apps in `apps/`, shared packages in `packages/`.

```
apps/creaseworks/      → Next.js 16, TS, Auth.js, Neon, Stripe (main product)
apps/pocket.prompts/   → Node.js serverless, Anthropic SDK, Notion, Slack
apps/site/             → static HTML/CSS/JS (windedvertigo.com)
apps/harbour/          → Next.js 16, TS (portfolio hub — disconnected from Vercel Git)
apps/depth-chart/      → Next.js 16, TS, Anthropic SDK
apps/vertigo-vault/    → Next.js 16, TS, Notion API
apps/deep-deck/        → Next.js 16, TS (disconnected from Vercel Git)
apps/nordic-sqr-rct/   → Next.js 16, JS (disconnected from Vercel Git)
apps/conference-experience/ → static HTML (CLI-deployed)
apps/automations/      → Node.js serverless (weekly summary)
packages/tokens/       → CSS custom properties + TS exports
```

## critical rules

### infrastructure & costs

these rules exist because we got a $223 Vercel bill from uncontrolled build multiplication. see `docs/infrastructure-and-costs.md` for full context.

1. **never add a new Vercel project without updating the cost analysis**. each new project adds a build per push across the entire monorepo. document the expected impact.

2. **always include `[skip ci]` in commits that don't need Vercel builds** — documentation changes, content syncs, config-only changes. Vercel respects this flag.

3. **batch pushes during active sprints**. each `git push` triggers ~5-6 builds (one per connected project). pushing 3 times instead of 15 saves ~60 wasted build attempts.

4. **disconnected projects deploy manually**. harbour, deep-deck, and nordic-sqr-rct are disconnected from Vercel Git. deploy them with `cd apps/<project> && vercel --prod`. do not reconnect them without discussing cost implications.

5. **spending cap is $10 on-demand** (max $30/month total). if builds start failing with "budget exceeded", that's the cap working. do NOT raise it without explicit approval.

6. **cron jobs count as serverless invocations**. creaseworks has 3 crons (sync-notion daily, send-digests weekly, send-nudges daily). don't add more without checking the invocation budget.

### anthropic API

7. **pocket.prompts must use `claude-opus-4-6`** for intent detection. never downgrade to sonnet — this is a deliberate accuracy decision.

8. **always include token economics** when recommending or planning features that use the Claude API. opus input=$15/1M tokens, output=$75/1M tokens. sonnet is ~5x cheaper.

9. **use prompt caching** for repeated system prompts. it reduces input token costs by ~90%.

### coding style

10. **lowercase everything** — variable names, function names, copy text (except acronyms).

11. **no over-abstraction**. concise functions, no unnecessary helpers. three similar lines > a premature abstraction.

12. **all copy must be lowercase** (except acronyms like API, URL, CMS).

### git workflow

13. **always rebase before push**. never amend published commits.

14. **use `--force-with-lease`** after rebase, never `--force`.

15. **always branch + preview before database migrations**. never run migrations directly against production from main.

16. **pull before starting work** — Garrett works from multiple machines.

### deployment

17. **every app has `turbo-ignore` in its `vercel.json`**. this is what prevents unchanged apps from building on every push. never remove it.

18. **the static site proxies to other apps via Vercel rewrites** in `apps/site/vercel.json`. if a proxied app's URL changes, update the rewrites.

19. **shared auth cookies**: creaseworks and vertigo-vault share session cookies on `.windedvertigo.com`. changes to `AUTH_SECRET` in one break sessions in the other. always change both together.

### database

20. **always use `POSTGRES_URL` (pooled)** for application code. use `POSTGRES_URL_NON_POOLING` only for migrations.

21. **Neon free tier has 100 concurrent connection limit**. serverless functions each open a connection. connection pooling via PgBouncer (built into the pooled URL) prevents exhaustion.

### security

22. **never commit `.env` files**. use Vercel's environment variable UI for production secrets.

23. **address high-severity Dependabot alerts within 1 week**. run `npm audit` monthly.

## services in use

full audit in `docs/infrastructure-and-costs.md`. key services: Vercel (Pro), Neon (Postgres), Stripe, Cloudflare R2, Notion (CMS), Anthropic (Claude API), Resend (email), Upstash KV (Redis), Slack, Google OAuth.

## SaaS cost awareness

when evaluating or upgrading any service, always ask:
- what is the metering unit? (builds, invocations, tokens, GB, requests)
- what happens when I exceed the free/included amount? (hard cap vs. overage billing)
- does our monorepo structure multiply the cost? (builds, webhooks, cron jobs)
- is there a spending cap I can set? (set it on day one)
- can I disconnect/disable when not actively using it?

document answers in `docs/infrastructure-and-costs.md` before committing to a new service.
