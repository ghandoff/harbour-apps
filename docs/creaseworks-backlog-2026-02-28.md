# creaseworks backlog — 1 march 2026

consolidated from 14 docs. cross-referenced against live codebase + production smoke test.

last audit: 1 march 2026 (claude code session 36 — tier 4 content & sync all complete)

---

## status key

| tag | meaning |
|-----|---------|
| 🔴 | bug or broken — fix before shipping |
| 🟡 | ready to build — code change, no blockers |
| 🟢 | data or config task — no code needed |
| 🔵 | design/research — needs decisions first |
| ⚪ | housekeeping — docs, cleanup |

---

## completed since last backlog (verified in codebase)

these items were listed as "not started" in the previous backlog but are now implemented:

| old # | item | status |
|-------|------|--------|
| 1 | garbled emoji across 3 files | ✅ fixed — all emoji correct in playdate-card.tsx, entitled-playdate-view.tsx, sampler/[slug]/page.tsx |
| 2 | apply migrations 030–035 to neon | ✅ applied — 031-035 applied 1 march 2026. verification passed. |
| 3 | run smoke test against production | ✅ 28/29 pass (root `/` returns 308 redirect — expected for authed redirect). base URL: `https://windedvertigo.com/reservoir/creaseworks` |
| 4 | packs nav link hidden for authed users | ✅ fixed — packs visible in desktop nav (publicLinks) and mobile bottom tab bar |
| 6 | pack preview badges on sampler cards | ✅ built — `PlaydateCard` accepts `packInfo: PackBadgeInfo` prop, renders 🔒 badge |
| 7 | post-reflection upsell CTA | ✅ built — `RunForm` success state shows pack upsell with `ReflectionPackInfo` |
| 11 | credit system queries + API | ✅ built — `lib/queries/credits.ts` (awardCredit, getUserCredits, spendCredits, checkAndAwardStreakBonus) |
| 12 | credit progress bar on playbook | ✅ built — `credit-progress-bar.tsx` integrated on playbook page |
| 13 | playbook "unlock more" upsell section | ✅ built — `pack-upsell-section.tsx` shows up to 2 unowned packs |
| 14 | photo consent classification UI | ✅ built — `photo-consent-classifier.tsx` with 3-tier COPPA flow |
| — | dual-scope entitlements (user + org) | ✅ built — migration 038, `checkEntitlement` accepts userId, `grantUserEntitlement`, partial indexes |
| — | per-pack individual invites | ✅ built — `createInviteWithPacks`, `processInvitesOnSignIn`, pack selector UI on admin invites |
| — | org member cap safety valve | ✅ built — `autoJoinOrg` checks `member_cap` before INSERT |
| — | invite link on admin profile | ✅ built — manage section links to `/admin/invites` |
| — | profile pack fetch for org-less users | ✅ built — `getOrgPacksWithProgress` accepts null orgId |

---

## tier 1 — quick wins (high impact, low effort) — ✅ ALL COMPLETE

| # | item | status | notes |
|---|------|--------|-------|
| 1 | **breadcrumb context from sampler** | ✅ done | `?from=sampler` redirect + dynamic breadcrumb in pack playdate page |
| 2 | **quick-log photo toast enhancement** | ✅ done | expandable 5s toast with photo nudge + dismiss, hover pauses timer |
| 3 | **tag playdates with campaign_tags in notion** | ✅ done | session 34 — seed script + commit c5a1605 |
| 4 | **lowercase violations in dynamic content** | ✅ done | session 34 — commit c6255c1 |
| 5 | **smoke test base URL fix** | ✅ done | default already includes `/reservoir/creaseworks` prefix |

---

## tier 2 — engagement wiring — ✅ ALL COMPLETE

verified session 35: all engagement features are fully wired into user flows.

| # | item | status | notes |
|---|------|--------|-------|
| 6 | **wire credit earning into run submission** | ✅ done | `api/runs/route.ts` L115-119: quick_log, find_again, streak_bonus. `api/runs/[id]/evidence/route.ts` L114: photo_added. `api/photo-consents/route.ts` L63: marketing_consent. |
| 7 | **wire photo consent into evidence upload** | ✅ done | `PhotoConsentClassifier` integrated in `evidence-capture-section.tsx`. consent saved via `api/photo-consents` endpoint. |
| 8 | **credit redemption UI** | ✅ done | `credit-redemption.tsx` on playbook page — 3 reward tiers (sampler=10, playdate=25, pack=50). |
| 9 | **photo-first quick reflection button** | ✅ done | `photo-quick-log-button.tsx` — "snap it" camera button in `EntitledPlaydateView`. |
| 10 | **pack finder improvements** | ✅ done | `pack-finder.tsx` — situation picker, social proof, comparison table, seasonal nudges. |

---

## tier 3 — wave 3 features

| # | item | effort | notes |
|---|------|--------|-------|
| 11 | ~~admin playdate preview with pack filter toggles~~ | ✅ done | expandable content preview — completeness badges (find/fold/unfold/body/illustration), lazy-loaded detail via `/api/admin/playdates/[id]`, materials list, design notes. commit abb7640. |
| 12 | ~~profile "your journey" redesign~~ | ✅ done | consolidated: removed duplicate StatPills + recent runs from page.tsx (Dashboard has richer versions), removed duplicate pack exploration from ProfileJourney (YourPacks has richer per-pack cards). each data point now has one canonical home. -167 lines. commit 767333f. |

---

## tier 4 — content & sync improvements — ✅ ALL COMPLETE (except #17)

| # | item | effort | notes |
|---|------|--------|-------|
| 13 | ~~image sync tier 3 — file property extraction~~ | ✅ done | playdate illustrations synced via `extractFiles()` → R2. materials don't have image properties in Notion. all cover images (playdates, packs, collections) synced in tiers 1+2. |
| 14 | ~~image sync tier 4 — body content / blocks~~ | ✅ done | `fetchPageBodyHtml()` in `blocks.ts` — recursive block fetch, renders all block types to HTML, syncs inline images to R2. integrated in playdates, packs, collections. |
| 15 | ~~rich text formatting in sync~~ | ✅ done | `extractRichTextHtml()` preserves bold, italic, links, colors, code annotations. HTML columns added to playdates (6), packs (1), collections (1). `SafeHtml` component for progressive enhancement. commit 31a0111. |
| 16 | ~~notion-as-CMS for /we/ and /do/ page text~~ | ✅ done | `syncCmsPages()` fetches individual Notion pages by ID, renders body HTML. `/we/` and `/do/` routes with ISR. `.cms-body` CSS for all block types. commit 48c0725. TODO: add env vars to Vercel. |
| 17 | 🟢 **notion-as-CMS for sqr-rct content** | ~4 hr | longer-term. sqr-rct currently queries notion in real-time. |

---

## tier 5 — UI/UX polish

| # | item | effort | notes |
|---|------|--------|-------|
| 18 | ~~pack cards — visual differentiation~~ | ✅ done | `pack-illustration.tsx` — 6 themed SVG patterns, per-pack color accents, emojis, cover_url support |
| 19 | ~~matcher page — more playful treatment~~ | ✅ done | gradient bg, floating shapes, animated emoji heading, playful copy |
| 20 | ~~custom empty-state illustrations/copy~~ | ✅ done | `empty-state.tsx` — 4 brand-aligned SVG illustrations (bookshelf, journal, magnifier, seedling) |
| 21 | ~~DRAFT badge uses non-brand orange~~ | ✅ done | already uses sienna/30 border + sienna/5 bg + sienna text |
| 22 | ~~footer "let's play." tagline~~ | ✅ done | already in `packages/tokens/footer.html` |
| 23 | ~~typography scale audit~~ | ✅ done | session 34 — commit f3023fe |
| 24 | ~~parent site vs creaseworks visual bridge~~ | ✅ done | winded.vertigo logo wordmark in footer left side, linking to parent homepage. header shows just "creaseworks". footer rendered in JSX for layout control. calm theme dims logo with opacity+filter. |

---

## tier 6 — accessibility & neurodiversity

| # | item | effort | notes |
|---|------|--------|-------|
| 25 | ~~dyslexia-friendly font toggle~~ | ✅ done | `accessibility-prefs.tsx` toggle — Atkinson Hyperlegible via `next/font/google`, `.dyslexia-font` class on `<html>`, cookie-first for instant CSS |
| 26 | ~~animation toggle in app settings~~ | ✅ done | combined with #25 — `.reduce-motion` class, suppresses all animations/transitions via `!important` overrides |
| 27 | ~~dark/low-colour theme~~ | ✅ done | "calm mode" — warm dark backgrounds (#1c2536), desaturated accents, CSS custom property cascade. migration 040, cookie-first toggle in accessibility prefs. |
| 28 | ~~progress bars with labels on multi-step flows~~ | ✅ done | `step-progress.tsx` shared component with ARIA progressbar, dot indicators, "step X of Y · label" text. integrated in onboarding wizard. |

---

## phase 2 — post-launch enhancements

| # | item | effort | status | notes |
|---|------|--------|--------|-------|
| P2-1 | **mount analytics dashboard** | ~30 min | ✅ done | replaced dead redirect with admin-gated page at `/analytics`, renders `AnalyticsDashboard` |
| P2-3 | **enrich analytics with admin metrics** | ~3 hr | ✅ done | `getAdminAnalytics()` with 5 SQL queries: user growth, conversion funnel, pack adoption, credit economy, platform overview. new chart components: FunnelChart, PackAdoptionChart. fixed `source` → `purchase_id` bug. |
| P2-6 | **set Vercel env vars for CMS pages** | ~10 min | 🟡 manual | `NOTION_CMS_PAGE_WE=316e4ee7-4ba4-8181-9935-e6887e8273dd`, `NOTION_CMS_PAGE_DO=316e4ee7-4ba4-81b1-a34c-da9a4b8e1016`. add via Vercel dashboard → creaseworks → Settings → Environment Variables. |
| P2-2 | **server-side playdate search API** | ~2 hr | ✅ done | `lib/queries/search.ts` — ILIKE across title, headline, rails_sentence, material titles with ranked deduplication. `GET /api/search?q=...` endpoint (auth, 2-100 chars). `playbook-search.tsx` — debounced (300ms) fetch with AbortController, shows playdate results above collection grid with match-field badges. |
| P2-4 | **notification center** | ~4 hr | ✅ done | migration 041: `in_app_notifications` table with partial indexes (unread, dedup). query layer: getUserNotifications, getUnreadCount, markRead/markAllRead, createInAppNotification (dedup via UNIQUE index). API: `GET /api/notifications/in-app` (list + countOnly polling), `POST` (mark-all-read), `POST /[id]/read`. bell icon in nav bar with badge (60s polling), dropdown with unread dots + time-ago. emitters: gallery approve/reject, invite accepted (notifies inviter + invitee), pack grants, org auto-join. |
| P2-5 | **PWA / mobile install** | ~2 hr | ✅ done | manifest.json with basePath-aware scope. service worker: cache-first statics, network-first navigation, offline fallback. PwaInstall component with beforeinstallprompt capture + iOS manual instructions. icons from square "W" mark (512, 192, 180). CSP worker-src, apple-web-app-capable, 14-day dismiss cooldown. |
| P2-7 | **test coverage expansion** | ~6 hr | ✅ done (phase 1) | 5 → 9 suites, 53 → 123 tests. added: entitlements (19), credits (20), search (11), auth guards (20). mock sql.query() pattern. remaining: API route tests, matcher orchestrator, gallery/evidence queries. |

---

## phase 3 — progressive disclosure & user tiers — ✅ COMPLETE (sessions 47–48)

**Rationale:** The full suite of features can overwhelm first-time caregivers. Progressive disclosure shows each user only the features that match their engagement level.

### User tiers

| Tier | Who | Features visible | Nav items |
|------|-----|-----------------|-----------|
| **Casual** | Caregivers who just want play ideas | Playdates (sampler), matcher, packs, gallery (view-only) | sampler, matcher, packs, gallery |
| **Curious** | Caregivers who want to understand the "why" | + Playbook (collections with developmental context) | + playbook |
| **Collaborator** | Educators, therapists, deep engagers | + Reflections, evidence capture, credits, community, gallery submissions | + reflections, community, profile journey |

### Implementation status

| # | Item | Status | Notes |
|---|------|--------|-------|
| P3-1 | ~~tier selection during onboarding~~ | ✅ done | Step 0 in wizard with 3 visual cards ("just play", "play + learn", "play + grow"). POST saves tier + sets `cw-ui-tier` cookie. |
| P3-2 | ~~tier-aware nav bar~~ | ✅ done | Desktop + mobile bottom tabs filter links by tier. Session-driven via `useSession()`. |
| P3-3 | ~~tier-aware profile page~~ | ✅ done | Journey/credits gated to collaborator. Tier badge with distinct colors. TierSwitcher in manage section. |
| P3-4 | ~~upgrade path UX~~ | ✅ done | TierSwitcher component — 3 radio cards, optimistic UI + CSS class swap + session refresh. Always available in profile manage. |
| P3-5 | ~~migration for existing users~~ | ✅ done | Migration 042: `ui_tier` column with CHECK constraint. Existing onboarded users backfilled to collaborator. New users default to casual. |
| P3-6 | ~~tier-aware notification events~~ | ✅ done | Migration 044: `min_tier` column on `in_app_notifications`. Read-time filtering via `array_position()`. Gallery emitters set `minTier: "collaborator"`. API passes `session.uiTier` to queries. |
| P3-7 | ~~gallery submission gating~~ | ✅ done | `gallery-share-toggle.tsx` returns null for non-collaborator. API route returns 403 as safety net. |
| P3-8 | ~~JWT + session pipeline~~ | ✅ done | `uiTier` loaded on sign-in + 5-min refresh, flows through JWT → session → `CWSession`. |
| P3-9 | ~~cookie-first rendering~~ | ✅ done | `cw-ui-tier` cookie → `tier-{value}` CSS class on `<html>` before hydration. `/api/preferences` PATCH sets cookie. |

**Key design constraint:** Tiers are purely cosmetic/UX — not a permission system. All features remain accessible via direct URL.

---

## CMS content migration — move hard-coded content to Notion

**Goal:** Let the collective author and update app content through Notion instead of requiring code changes. Each tier follows the existing sync pattern: Notion DB → sync handler → Postgres → components read from DB with hard-coded fallback.

**Architecture:** One new Notion database ("App Config") with rows per config entry. Each row has a `key` (select), `value` (title), `sort_order` (number), and `metadata` (rich text JSON for complex items like icons/descriptions). Synced to a `cms_config` table in Postgres. Components read from DB at render time with hard-coded defaults as fallback when no DB rows exist.

---

### CMS tier 1 — form constants & enum arrays

Move the simple string arrays used in form dropdowns and filters. Lowest risk — these rarely change but should be authorable without deploys.

| # | item | source file | hard-coded values | status |
|---|------|-------------|-------------------|--------|
| C1 | **run type options** | `lib/constants/enums.ts:11-18` | home session, classroom activity, outdoor play, on-the-go, group session, one-on-one | ✅ done |
| C2 | **trace evidence options** | `lib/constants/enums.ts:20-26` | photo, video, quote, artifact, notes | ✅ done |
| C3 | **context tags** | `lib/constants/enums.ts:28-35` | classroom, home, remote, low-resource, travel-kit, mess-sensitive | ✅ done |

**Implementation:**
1. Migration 045: `cms_config` table (key TEXT, value TEXT, sort_order INT, group_key TEXT, metadata JSONB, notion_id TEXT UNIQUE, updated_at TIMESTAMPTZ)
2. Sync handler: `src/lib/sync/cms-config.ts` — queries Notion "App Config" DB, upserts rows
3. Query helper: `src/lib/queries/cms-config.ts` — `getConfigValues(key)` returns string[] with hard-coded fallback
4. Update `enums.ts` exports to async DB reads; keep current arrays as fallback defaults

---

### CMS tier 2 — onboarding & user-facing option sets

Move the structured option objects used in the onboarding wizard, profile tier switcher, and consent flows. Medium complexity — each option has multiple fields (label, icon, description).

| # | item | source file | items | status |
|---|------|-------------|-------|--------|
| C4 | **onboarding tier options** | `app/onboarding/wizard.tsx:10-29` | 3 options (casual/curious/collaborator) with value, label, icon, sub | ✅ done |
| C5 | **age group options** | `app/onboarding/wizard.tsx:31-36` | 4 groups (toddler, preschool, school-age, older) with value, label, sub | ✅ done |
| C6 | **context options** | `app/onboarding/wizard.tsx:38-43` | 4 contexts (home, classroom, outdoors, travel) with value, label, icon | ✅ done |
| C7 | **energy level options** | `app/onboarding/wizard.tsx:45-50` | 4 levels (chill, medium, active, any) with value, label, sub, icon | ✅ done |
| C8 | **context name suggestions** | `app/onboarding/wizard.tsx:52-59` | 6 suggestions (at home, school time, etc.) | ✅ done |
| C9 | **tier switcher options** | `app/profile/tier-switcher.tsx:24-43` | 3 options (mirrors C4 with emoji field) | ✅ done |
| C10 | **photo consent tier descriptions** | `components/photo-consent-classifier.tsx:29-51` | 3 tiers (artifact, activity, face) with emoji, label, description, autoMarketing | 🔵 deferred — 4 levels of prop drilling |
| C11 | **photo release age ranges** | `components/photo-release-waiver.tsx:17-23` | 5 ranges (under 5, 5–8, 9–12, 13–17, 18+) | 🔵 deferred — 4 levels of prop drilling |

**Implementation:**
1. Uses same `cms_config` table from tier 1 — complex items stored in `metadata` JSONB
2. Query helper: `getConfigObjects(key)` returns parsed metadata objects with hard-coded fallback
3. Update wizard, tier-switcher, consent components to read from DB
4. Notion database: each option is a row with `key=onboarding_tier_options`, `value=casual`, `metadata={"label":"just play","icon":"🎈","sub":"simple play ideas, no tracking"}`

---

### CMS tier 3 — pricing, marketing & landing page content

Move business-critical content that the collective should be able to update independently. Highest impact but needs careful handling — pricing changes affect Stripe integration, landing page is the public face.

| # | item | source file | content | status |
|---|------|-------------|---------|--------|
| C12 | **subscription tier definitions** | `components/ui/tier-card.tsx:26-74` | 4 tiers (sampler/explorer/practitioner/collective) with name, price, tagline, feature lists | ✅ done |
| C13 | **landing page hero section** | `app/page.tsx:82-126` | headline, subheading, CTAs | ✅ done |
| C14 | **landing page feature cards** | `app/page.tsx:150-171` | 4 feature cards with title + description | ✅ done |
| C15 | **landing page how-it-works** | `app/page.tsx:223-240` | 3-step process with titles + descriptions | ✅ done |
| C16 | **landing page who-it's-for** | `app/page.tsx:258-271` | 3 audience cards (parents, teachers, anyone) | ✅ done |
| C17 | **admin dashboard sections** | `app/admin/page.tsx:18-79` | 10 sections with title, href, description, icon | ✅ done |
| C18 | **valid invite tiers** | `app/api/admin/invites/route.ts` | explorer, practitioner | ✅ done |

**Implementation:**
1. C12: New `subscription_tiers` Notion DB (or rows in App Config with `key=subscription_tiers`). Sync to `cms_config`. Tier card reads from DB.
2. C13-C16: Extend existing `cms_pages` pattern — create a Notion page for the landing page, sync body as structured sections. Or use App Config rows per section.
3. C17-C18: App Config rows. Admin page reads from DB.

**Not migrating** (code configuration, not authored content):
- Playdate card visual mappings (`playdate-card.tsx:13-61`) — CSS class names tied to code
- Column selectors (`lib/security/column-selectors.ts`) — security policy, not content
- Footer HTML (`packages/tokens/footer-html.ts`) — already managed via shared template
- Tier ordering/hierarchy (`tier-card.tsx:79-84`) — structural, not content

---

## open questions / future work

1. ~~next/image migration~~ — ✅ DONE (session 50). all card components + CMS body images use `next/image` with a custom Cloudflare loader (`cloudflare-image-loader.ts`). no Vercel image optimization cost — images served directly from R2 public URL.
2. **R2 bucket structure** — DECIDED: one bucket for all apps with folder convention (`/creaseworks/`, `/sqr-rct/`, `/site/`). rationale: simpler CORS/token management, shared assets don't need duplication, per-app storage visibility via R2 prefix metrics. re-evaluate if access control needs diverge.
3. ~~URL redirect for old subdomain~~ — SKIPPED. not enough people have the old `creaseworks.windedvertigo.com` link.
4. **shared header across apps** — NOT WORTH IT. header needs differ too much between apps (auth, icons, bottom tab bar in creaseworks vs hero nav in parent site). footer is shared via tokens, header CSS classes are shared, but the component structure stays app-specific.

---

## codebase health (2 march 2026)

| metric | value |
|--------|-------|
| TypeScript | compiles clean (zero errors) |
| Tests | 9 suites, 123 tests, all passing |
| Migrations | 044 (043 applied to Neon; 044 pending) |
| Smoke test | 28/29 pass |
| Source files | ~299 (.ts + .tsx) |
| Features A–Y | all implemented |
| Phase 2 | ✅ ALL COMPLETE (P2-1 through P2-7). P2-6 env vars set (session 49). |
| Phase 3 | ✅ ALL COMPLETE — progressive disclosure user tiers (casual/curious/collaborator) + tier-aware notifications. |
| Engagement system | fully wired — credits, photo consent, redemption, pack finder all live |
| Material emoji CMS | Notion-managed via `emoji` rich_text property, hard-coded map as fallback |

---

*source docs: CLAUDE.md, CREASEWORKS-DESIGN.md, creaseworks-audit-2026-02-27.md, creaseworks-paywall-strategy.md, creaseworks-engagement-system.md, creaseworks-image-sync-scope.md, creaseworks-session-status-2026-02-28.md, notion-database-map.md, memory/projects/creaseworks.md, Creaseworks-Neurodiversity-Design-Guide.docx, creaseworks-ui-ux-critique.docx*
