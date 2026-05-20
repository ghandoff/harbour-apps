# Harbour Landing — Visual Architecture Research

**Audience:** Garrett. **Goal:** decide how the pier IA should *look* (it currently reads as a vertical list of cards, not a harbour). **Deadline:** 10 days to PRME launch (28 May 2026).

---

## TL;DR — my three picks

Out of 12 categories of multi-portal homepage design I looked at, three are the strongest fit for what you're trying to do:

1. **🥇 Illustrated bird's-eye harbour map** as a hero/navigator, with the page below organised as a "tour" of each pier in turn. Strongest because it leans into the metaphor literally — the user *sees* the harbour before walking the piers. Closest reference: theme-park websites + isometric neighbourhood maps. **Effort: high.** Needs one custom SVG illustration.

2. **🥈 Horizontal "boardwalk" rails per pier** — each pier becomes a single-row Netflix-style horizontal scroll along a stylised wooden planking band, with the pier label set in oversized lowercase type running parallel to the boardwalk. Strongest because it's the cheapest visual layer that *feels* like piers. **Effort: medium.** No custom illustrations needed — pure CSS.

3. **🥉 Bento-grid per pier with strong inter-pier water treatment** — keep the current 2-col grid inside each pier but separate piers with full-bleed wave/water dividers, and give each pier a distinct background tint (Pier A = quiet cadet, Pier B = warmer redwood-tinted, Pier C = champagne-light, drydock = tonally low). Strongest because it ships in 4 hours and looks intentional. **Effort: low.**

If you want me to be opinionated on a single recommendation given the 10-day window: **#2 (boardwalks) for May 28, with #1 (illustrated map) as a phase-two enhancement after launch.** The map is the strongest concept but the slowest to produce a good version of — boardwalks give 80% of the metaphor at 20% of the production cost.

The 12 categories with examples below — your call which way to lean.

---

## How to use this doc

- 12 categories ordered roughly from highest-to-lowest fit for the harbour metaphor
- Each has 2-4 concrete examples with URLs you can click
- "Harbour fit" rating: ★★★ strong, ★★ usable with modification, ★ poor fit
- "Effort" tells you what you'd need to build/commission

At the bottom: graphics specs (what we'd need to create), implementation phasing, and decision questions for you.

---

## 1. Spatial / illustrated map navigation — ★★★

The reader sees the *place* before navigating into any specific room. Each clickable region is a literal location on an illustrated map. This is the most literal expression of the harbour metaphor.

### Examples
- **[Walt Disney World theme park maps](https://disneyworld.disney.go.com/maps/)** — the canonical example. Four parks shown as illustrated icons; hover or tap reveals attractions. Notice how the *map* establishes territory before the menu becomes a list.
- **[Animal Crossing: New Horizons island map](https://animal-crossing.com/new-horizons/)** — top-down isometric, building-by-building. Sets the rule that exploration is a verb.
- **[Rod Hunt illustrated maps](https://rodhunt.com/different-types-styles-uses-of-illustrated-3d-isometric-maps-created-by-rod-hunt)** — commercial illustrator who has done this for parks, campuses, and brand portals for 30 years. Useful as a reference style if we commission custom work.
- **[Icograms Designer](https://icograms.com/)** — DIY isometric map builder if we want to prototype before commissioning. Stock icon library + simple drag-drop.

### Why it could work for the harbour
The metaphor is *waiting* to be made literal. A top-down view of the harbour with three piers visibly jutting into water (plus a drydock area on land) reads instantly. Click the pier to scroll to the section, or click an individual game tile on the pier to launch the app.

### Why it might not
Production cost. A *good* illustrated harbour map takes a real illustrator 1-3 weeks. A bad one undermines the brand. AI-generated alternatives often look generic — but a tasteful flat/isometric SVG done in your existing palette could land in 2-3 days.

### Effort
- **Stock-style isometric (1-2 days):** Use icograms.com or Vecteezy to source pier/water/boardwalk elements, compose in Figma, export SVG.
- **Custom illustration (1-3 weeks):** Commission an illustrator. £400-£1500 depending on detail.
- **Generative + hand-cleanup (3-5 days):** Midjourney/Sora draft, illustrator cleanup to match your palette. Risky on brand consistency.

**Sources:**
- [Best museum websites — Numiko, 2026](https://numiko.com/insights/best-museum-and-gallery-websites-2026)
- [3D interactive marina maps](https://3dinteractivemaps.com/marina-maps/)
- [Sunset Harbour illustrated map case study](https://escapekeygraphics.com/illustration-portfolio/sunset-harbour-illustrated-map/)

---

## 2. Horizontal "rails" / Netflix rows — ★★★

A single row per category that scrolls horizontally. Hugely effective at communicating "there are many things here, organised by group" without needing a single decision from the visitor upfront.

### Examples
- **[Netflix homepage](https://www.netflix.com/)** — the canonical pattern. Each row is a category; horizontal scroll within row, vertical scroll between rows.
- **[Spotify Home](https://open.spotify.com/)** — same pattern, mood-keyed rather than personalised.
- **[Apple TV+ landing](https://tv.apple.com/)** — softer styling but the same row architecture, with hero cards that span 2-3 row positions for editorial emphasis.
- **[Disney+ profile homepage](https://www.disneyplus.com/)** — explicit branded "shelves" for Pixar, Marvel, Star Wars — each one feels like a distinct sub-property within one site.

### How it would translate to harbour
- Pier A becomes a horizontal rail labelled "pier a — leadership" with each Wave-1 app as a card scrolling sideways
- Pier B is the next rail down
- CastParade between Pier B and Pier C stays as decorative tissue
- Pier C is a special hybrid (waitlist hero + 3 character preview cards, treated as a "coming soon" shelf)
- Drydock is a denser final rail of low-opacity tiles

### Harbour-specific styling lever
Each "rail" is rendered on a stylised wooden boardwalk — a CSS-only horizontal band with subtle plank texture (linear gradients perpendicular to scroll direction). The pier *label* sits at the start of the rail in oversized lowercase type that reads parallel to the boards. The water (page background) lives between rails.

### Why it works for piers specifically
A pier IS a horizontal structure. A vertical 2-column grid actively fights the metaphor. A horizontal rail mirrors the physical shape.

### Why it might not
Horizontal scroll is sometimes accessibility-hostile on touchscreens (especially when nested inside vertical scroll). Mitigation: always show "next" / "previous" arrow buttons + keyboard navigation + ensure each card is reachable without scroll (e.g., snap to grid on smaller screens, fall back to wrap on the smallest).

### Effort
**Medium.** No custom illustrations. ~2-3 days of CSS work to build the rails, plank texture, scroll-snap, label typography, mobile fallback.

**Sources:**
- [Netflix horizontal-rows UX deep dive](https://createbytes.com/insights/netflix-design-analysis-ui-ux-review)
- [Build a Netflix-style row with Tailwind](https://medium.com/@didinjamaludin/build-a-netflix-style-homepage-with-tailwind-css-3c2389065b12)
- [Horizontal scrolling done well — HubSpot](https://blog.hubspot.com/website/horizontal-scrolling)

---

## 3. Bento grid (modular tile mosaic) — ★★★

Asymmetric grid of differently-sized tiles. Each tile is roughly self-contained but the *composition* of varied sizes creates visual hierarchy without any explicit titles or sections.

### Examples
- **[Apple M-series Mac mini page](https://www.apple.com/mac-mini/)** — the canonical 2023+ bento. Big hero tile next to medium spec tiles, all on one zone.
- **[Linear features page](https://linear.app/features)** — bento layout where every tile is a product capability.
- **[Notion homepage](https://www.notion.so/)** — uses bentos for template previews mixed with testimonials and features.
- **[Bentogrids.com](https://bentogrids.com/)** — gallery of current bento implementations.

### How it would translate to harbour
Each pier becomes its own bento section. Pier A is a 2x2 or 3x2 bento with one "hero" tile (e.g., vault) sized larger than the rest. Within each pier, the bento creates visual interest the current uniform 2-col grid lacks. Piers separated by full-bleed wave/water graphics.

### Why it works
- 67% of SaaS top-100 homepages on ProductHunt now use bento. It's the current vernacular for "multiple things, hierarchically arranged"
- 47% longer dwell time vs. uniform grids (per [Senorit's 2026 analysis](https://senorit.de/en/blog/bento-grid-design-trend-2025))
- It lets you give *editorial* emphasis to the most important app per pier without a separate "featured" callout

### Why it might not
Bentos can feel generic if all four piers look the same. Mitigation: give each pier a distinct tonal background + a unique tile-size composition so the *shape* of each pier reads differently. Pier A heavy on landscape tiles (vault, depth.chart), Pier B more square (educational tools), Pier C tall (characters need vertical space).

### Effort
**Low.** Tailwind grid + a per-pier size configuration. ~1 day of work to convert the existing 2-col layout into per-pier bento compositions.

**Sources:**
- [Bento Grid Layouts 2026 — Studio Meyer](https://studiomeyer.io/en/blog/bento-grid-layouts)
- [SaaSFrame practical bento guide 2026](https://www.saasframe.io/blog/designing-bento-grids-that-actually-work-a-2026-practical-guide)
- [Bento Grid: 40+ examples](https://mukeshkdesigns.com/blogs/bento-grid-design-inspiration/)

---

## 4. Audience self-selector ("I am a…") — ★★

A pre-content gate. The visitor declares who they are; the homepage then morphs to show them their pier first. You actually already have a thin version of this at `/harbour/start`.

### Examples
- **[Workday "what's your role?"](https://www.workday.com/)** — three roles, three landing pages.
- **[IBM persona-based home (Cloud)](https://www.ibm.com/cloud)** — "I am a developer" / "I am a business leader" tabs.
- **[Hubspot 2011 case study](https://blog.hubspot.com/blog/tabid/6307/bid/32434/how-to-design-a-persona-centric-website-experience.aspx)** — the foundational pattern: explicit "are you a business owner or a marketer?" pick.
- **[Instrumentl](https://www.instrumentl.com/)** — separate pages for nonprofits vs. consultants.

### How it would translate to harbour
Strengthen `/harbour/start` from an afterthought to the *default* first-visit experience. New visitors land there; returning visitors land directly on `/harbour`. After picking a pier on `/start`, the user is taken to a *focused* page showing only their pier, with the other piers as small footer cards.

### Why it works
Solves the "page is too long" problem by making the long page the *secondary* experience. PRME educators on May 28 land on `/start`, pick "i teach in higher-ed", and immediately see Pier B as a full-page experience rather than the third section down.

### Why it might not
Adds friction (one extra click before content). And not all visitors fit cleanly into one persona — a workshop facilitator who also teaches in higher-ed has to pick one. Mitigation: don't *gate* the main page — keep `/harbour` as the all-in-one entry. Just promote `/start` more prominently in the Hero.

### Effort
**Low to medium.** The `/start` page exists; making it the first-visit default needs a cookie + a one-line redirect in middleware. Producing the per-pier focused pages (`/harbour/pier/leadership` etc.) is a copy of the existing components scoped to one pier — ~1 day per pier.

**Sources:**
- [Persona-centric website experience — HubSpot](https://blog.hubspot.com/blog/tabid/6307/bid/32434/how-to-design-a-persona-centric-website-experience.aspx)
- [Restructuring a website around personas — Search Engine Land](https://searchengineland.com/restructure-website-personas-guide-452132)

---

## 5. Pillar columns ("what we do" verticals) — ★★

Three or four vertical columns side-by-side, each representing one product line. Like a Greek temple — same-height pillars, each labelled.

### Examples
- **[IDEO](https://www.ideo.com/)** — the firm uses pillared sections for their main service offerings.
- **[Stripe products page](https://stripe.com/products)** — pillars per product family (Payments, Billing, Connect, Climate, Atlas).
- **[Pentagram](https://www.pentagram.com/)** — pillared work categories, each visually distinct.
- **[Notion homepage "for every team"](https://www.notion.so/teams)** — pillars for engineering, design, product.

### How it would translate to harbour
The three piers as three columns, side-by-side at desktop, stacked on mobile. Each column visually mimics a pier shape (taller-than-wide, with a "head" at the top where the pier label lives, "body" where the cards live, "tip" extending downward into water). Drydock becomes a fourth column or a footer band.

### Why it works
This is genuinely *pier-shaped* (tall vertical structures jutting from a baseline). It allows side-by-side comparison — a visitor can see Pier A, B, and C at a glance without scrolling.

### Why it might not
Three columns of content at desktop means each column has only ~33% width — Pier A's 4-5 apps would feel cramped. And on mobile it collapses back to a vertical list anyway, losing the pier feel. Works best when each pier has only 1-3 highly-visual items.

### Effort
**Low.** CSS grid with 3 (or 4) columns + responsive collapse to single column on mobile. ~1 day.

---

## 6. Magazine / editorial section layout — ★★

The NYT homepage approach: each "section" of the page is a self-contained editorial unit with its own headline, lead image, and supporting items. The visual variety comes from differently-styled sections, not just differently-sized cards.

### Examples
- **[NYT homepage](https://www.nytimes.com/)** — the textbook reference. Sections feel like distinct neighbourhoods.
- **[The Atlantic](https://www.theatlantic.com/)** — looser but same instinct.
- **[The Verge](https://www.theverge.com/)** — modernised version with strong inter-section colour blocks.
- **[The Pudding](https://pudding.cool/)** — editorial-driven section structure for data stories.

### How it would translate to harbour
Each pier renders as a *section* with its own micro-design language: Pier A is "newspaper-classical" (serif headers, clean grid), Pier B is "academic journal" (numbered, footnoted feel), Pier C is "kids' magazine" (playful, illustrated, character-heavy). The page becomes a tour of *publication styles*.

### Why it could work
Each pier becomes its own world without expensive custom illustration — typography and layout do the heavy lifting.

### Why it might not
Risks looking incoherent if the styles are too different. Brand consistency across the harbour matters more than maximally differentiated piers.

### Effort
**Medium.** Multiple typography systems means more CSS and more design decisions. ~3 days.

---

## 7. Gaming launcher dashboards — ★★

The Steam / Epic / Battle.net approach: a single dense screen showing what's available, what's installed, what's new, with filtering by category. Optimised for users who already know what they want.

### Examples
- **[Steam home page screenshot](https://store.steampowered.com/)** — left sidebar filter, central row-based content, "your library" prominent.
- **[Epic Games Store](https://store.epicgames.com/)** — sparser, more curated, hero carousel + grid below.
- **[Xbox Mode dashboard (Windows 11, April 2026)](https://windowsforum.com/threads/xbox-mode-coming-to-windows-11-console-style-gaming-ui-rolls-out-april-30.416268/)** — controller-first, large tiles, aggregated library across stores.
- **[GOG Galaxy / Playnite](https://www.gog.com/galaxy)** — unified library across stores. Useful reference for "many sources, one surface."

### How it would translate to harbour
Add a filter bar at the top (`All / Pier A / Pier B / Pier C / Drydock`), keep the vertical structure below, but treat the page like a *library*. Most aggressive read: ditch the pier sections entirely and just have one unified tile wall with filter chips.

### Why it could work
PRME educators arriving via certification might think of this as "the harbour library" — a place to browse what's available, not a guided tour.

### Why it might not
Loses the metaphor. Piers exist to *segment*, not just filter. A unified library tells you everything is equivalent — which contradicts the audience-zoning rationale.

### Effort
**Low.** Filter chips + JS visibility toggles. Half a day if you reuse the existing card components.

**Sources:**
- [14 best game launchers in 2026 — Plarium](https://plarium.com/en/blog/best-game-launchers/)

---

## 8. Tabbed / segmented control zones — ★

A single content area with tabs or segmented controls that switch between pier views. Mobile-app navigation translated to web.

### Examples
- **[Apple Music tabs](https://music.apple.com/)** — Listen Now, Browse, Radio as segmented tabs.
- **[Linear product page tabs](https://linear.app/product)** — tabs for different product surfaces.
- **[Figma Community](https://www.figma.com/community)** — tabs for plugins, files, templates.

### How it would translate to harbour
One pier visible at a time, tabs at the top let you switch. Hero stays static; only the section below changes.

### Why this is **probably wrong for harbour**
Tabs hide content. If a PRME educator lands and the default tab is Pier A (leadership), they might never realise Pier B exists for them. Tabs work when users come with intent ("I want to find a song"); they fail when users come to discover ("show me what's here").

### Why it might still work
On *mobile*, tabs are sometimes the only way to fit four sections without infinite scroll. Could be a mobile-only treatment with the desktop staying full-page.

### Effort
**Low.** Standard tab component. Quarter day.

---

## 9. Scrollytelling / narrative scroll — ★

A long-form scroll-driven experience where the layout changes as you scroll. Often used for editorial features. The page tells a story rather than presenting options.

### Examples
- **[NYT Snow Fall (2012)](https://www.nytimes.com/projects/2012/snow-fall/)** — the canonical example.
- **[Pudding visual essays](https://pudding.cool/)** — current state of the form.
- **[National Geographic immersive features](https://www.nationalgeographic.com/)** — strong scroll narrative.

### How it would translate to harbour
The visitor scrolls and the harbour reveals itself — first sky, then water, then Pier A jutting in, then Pier B, etc. Heavy use of position-sticky and scroll-triggered animations.

### Why it might work
The strongest *emotional* hit of any pattern here. If you nail it, the harbour feels like a place.

### Why it probably shouldn't be the main pier IA
- Builds and animates are slow. Bad for return visitors who just want to launch creaseworks.
- Accessibility — scroll-driven animation often fails screen readers and reduced-motion preferences.
- Production cost is high (1-2 weeks of motion design + dev).

### Effort
**High.** 1-2 weeks if done well; longer if it needs to also be the everyday navigation.

**Sources:**
- [11 scrollytelling examples — Vev](https://www.vev.design/blog/scrollytelling-examples/)
- [Scrollytelling examples that bring web content to life](https://reallygooddesigns.com/scrollytelling-website-examples/)

---

## 10. 3D / WebGL "world" navigation — ★

A literal 3D environment the visitor explores. The most aggressive interpretation of "the harbour."

### Examples
- **[Bruno Simon portfolio](https://bruno-simon.com/)** — the canonical "you drive a car around a 3D landscape" portfolio.
- **[Apple Vision Pro experience pages](https://www.apple.com/apple-vision-pro/)** — heavy 3D for narrative emphasis.
- **[Sketchfab](https://sketchfab.com/)** — 3D model navigation.
- **[Three.js journey examples](https://threejs-journey.com/)** — gallery of 3D web experiments.

### Why this is **probably wrong for harbour today**
- Months of production time
- Heavy bundle size — destroys the cache-headers win
- Accessibility-hostile by default
- Doesn't actually help users navigate

### When it might be right
Phase 3, post-launch, as an *alternate* entry point — `/harbour/explore` could be the 3D version while `/harbour` stays as the fast utility.

### Effort
**Very high.** 3-6 weeks if done properly. Skip for May 28.

---

## 11. Hub-and-spoke / radial centre — ★

A central "harbour" point with piers radiating outward as spokes. Looks great in mockups; fights screens in practice.

### Examples
- **[Old IBM design (mid-2010s) hub homepages](https://www.ibm.com/)** — used to have radial layouts before retreating to grids.
- **Brand portal pages** — agency sites often use these for service offerings.

### Why this is **probably wrong for harbour**
Radial layouts don't fit responsive viewports. They look brilliant on a 1440px desktop and break on every other size. Not worth fighting the geometry.

### Effort
**Medium-high.** And the payoff is brittle.

---

## 12. Brutalist / typography-led — ★

Strip out imagery; let oversized lowercase type carry the page. Type as architecture.

### Examples
- **[Pentagram](https://www.pentagram.com/)** — type-led, work case studies in giant title cards.
- **[Werkstatt der Kulturen Berlin](https://werkstatt-der-kulturen.de/)** — programme listings as oversized type.
- **[Are.na](https://www.are.na/)** — minimal, typography-driven channel browsing.

### How it would translate to harbour
"pier a — leadership" as 96-point lowercase Inter (or a chunkier display face), with the app names underneath at 24pt. Almost no imagery. Brand colour blocks separate piers.

### Why it could work
Your brand voice is already strongly typographic — all lowercase, deliberate cadence. Going hard on type is *on-brand*. Cheapest of all directions.

### Why it might not
Doesn't actually solve the "feels like a vertical list" complaint — it just makes the list bigger.

### Effort
**Very low.** Half a day of CSS.

---

## My synthesised recommendation

Given the constraints (10 days, no illustration budget yet, brand already lowercase-typographic), I'd combine three of the categories above into one direction:

> **"Boardwalk piers" — horizontal Netflix-style rails (#2), one per pier, with bento-style sizing within each rail (#3), all framed by a light typographic treatment (#12) that pushes the pier labels into oversized lowercase.**

The boardwalk metaphor is *literal* — a pier physically IS a long horizontal structure with things along it. A rail that scrolls sideways with a plank-textured background, oversized "pier a — leadership" label set parallel to the planks, and bento-sized cards (one hero tile, several smaller ones) within. Water/wave SVG dividers between piers.

This carries the harbour metaphor without needing a custom illustrated map. It costs ~3 days of work. It survives mobile (rails collapse to vertical stacks with the plank texture retained as a sideband). And it leaves room to *upgrade* later with a top-down illustrated harbour map as the hero — that map would link down to the boardwalks, so phase 1 and phase 2 cooperate.

---

## Graphics we'd need to create

For the recommended direction (boardwalks + light typography), you need surprisingly little:

1. **Plank texture (CSS-only)** — a linear-gradient SVG that creates wood-grain bands. ~30 lines of CSS, no asset needed.
2. **Wave divider (SVG)** — one reusable SVG of a stylised wave shape used between piers. ~40 lines of SVG. I can write this inline.
3. **Pier-end marker (SVG, optional)** — a small lighthouse or buoy at the "end" of each boardwalk. Brand decision: do piers end in a lighthouse, a buoy, a flag? You pick; I draw.

If you later want the illustrated harbour map (recommendation #1), you'd need:

4. **Top-down harbour SVG** — three piers visible, water surrounding, a sandy/wooded "drydock" zone. ~3-7 days of illustrator work or 1-2 days of stock-isometric-composition if we go DIY. Roughly 2400×1200px at 2x, or scalable SVG.

For #4 I'd lean toward commissioning. AI-generated illustrations of harbours rarely match a specific brand palette without significant cleanup, and you have a strong existing palette (cadet, redwood, sienna, champagne) the illustration must honour.

---

## Implementation phasing

| Phase | Scope | Effort | Ship by |
| --- | --- | --- | --- |
| **1. Boardwalk rails** | Convert each pier section to a horizontal rail with plank texture + oversized typography. Wave dividers between sections. Cast parade stays as-is between Pier B and Pier C. | 2-3 days | 23 May (5 days before launch) |
| **2. Per-pier tonal background** | Each pier gets a subtle tinted background (cadet, slightly warmer, slightly lighter — all within brand) to reinforce zone identity. | half day | 24 May |
| **3. Pier C visual upgrade** | Lean harder on the characters — make Pier C feel actually different from A/B. Bigger character renders, a "june opens" countdown maybe. | 1 day | 25 May |
| **4. /start as preferred first-touch** | Default new-visitor cookie redirect to /start; returning visitors land at /harbour. | half day | 27 May |
| **5. (Post-launch)** Illustrated harbour map hero | Commission the top-down map; replace the textual hero with the illustration. Map links to pier anchors. | 2-3 weeks | mid-June |

---

## Decision questions for you

These are the things I need from you to actually build:

1. **Boardwalks (#2) vs. illustrated map (#1) vs. bento-only (#3) as the main direction?** My pick: boardwalks (#2). What's yours?

2. **If boardwalks: should each pier label run *parallel* to the boardwalk (rotated 90° on the side) or sit above it like a section header?** Parallel is more "pier-like" but harder to read; section-header is safer.

3. **Pier-end marker — lighthouse, buoy, flag, or none?** Each carries a different brand connotation. Lighthouse = guidance, buoy = playful, flag = territory, none = pure architecture.

4. **Backgrounds per pier — strong tonal shift or subtle?** Strong = each pier feels like a distinct zone, risks fragmenting the brand. Subtle = unified, risks reading as undifferentiated again.

5. **/start as the first-visit default?** PRME educators landing on /start vs. landing on /harbour is a real UX shift. /start surfaces Pier B immediately for them; /harbour makes them scroll past Pier A first.

6. **Commission an illustrator for phase 5 (post-launch map)?** If yes I can write the brief and source illustrators. If no, we either DIY with stock isometrics or skip the map entirely.

---

## What I can implement directly

Tell me which direction you want and I'll branch + implement. Specifically:

- Boardwalks (#2) → I can ship this end-to-end as a self-contained PR within 2 days. No external dependencies.
- Bento-grid per-pier (#3) → same.
- Tonal backgrounds per pier → half-day PR.
- /start as default → half-day PR with a cookie redirect.
- Wave divider SVG → I can write the SVG inline.
- Illustrated harbour map → I can't draw it. I can prep a brief if you want to commission, or compose a stock-isometric draft if you want to DIY.

---

## Sources cited

### Spatial / illustrated maps
- [Best museum and gallery websites 2026 — Numiko](https://numiko.com/insights/best-museum-and-gallery-websites-2026)
- [3D interactive marina maps](https://3dinteractivemaps.com/marina-maps/)
- [Sunset Harbour illustrated map](https://escapekeygraphics.com/illustration-portfolio/sunset-harbour-illustrated-map/)
- [Rod Hunt illustrated maps](https://rodhunt.com/different-types-styles-uses-of-illustrated-3d-isometric-maps-created-by-rod-hunt)
- [Icograms Designer](https://icograms.com/)

### Netflix-style horizontal rails
- [Netflix design deep dive — CreateBytes](https://createbytes.com/insights/netflix-design-analysis-ui-ux-review)
- [Building Netflix-style horizontal scrolling with Tailwind](https://medium.com/@didinjamaludin/build-a-netflix-style-homepage-with-tailwind-css-3c2389065b12)
- [Horizontal scrolling in web design done well](https://blog.hubspot.com/website/horizontal-scrolling)

### Bento grids
- [Bento Grid Layouts 2026 — Studio Meyer](https://studiomeyer.io/en/blog/bento-grid-layouts)
- [SaaSFrame's 2026 practical bento guide](https://www.saasframe.io/blog/designing-bento-grids-that-actually-work-a-2026-practical-guide)
- [40+ bento examples — Mukesh K Designs](https://mukeshkdesigns.com/blogs/bento-grid-design-inspiration/)
- [Bentogrids.com gallery](https://bentogrids.com/)
- [Bento Grid Design 2026 — Senorit](https://senorit.de/en/blog/bento-grid-design-trend-2025)

### Audience self-selector / persona-driven
- [Persona-centric website design — HubSpot](https://blog.hubspot.com/blog/tabid/6307/bid/32434/how-to-design-a-persona-centric-website-experience.aspx)
- [Restructure a website around personas — Search Engine Land](https://searchengineland.com/restructure-website-personas-guide-452132)

### Museum / exhibition
- [Designing accessible museum navigation — Oomph](https://www.oomphinc.com/insights/museum-navigation-design/)
- [Best museum website examples — Weblium](https://weblium.com/blog/10-best-museum-website-examples/)

### Scrollytelling
- [11 scrollytelling examples — Vev](https://www.vev.design/blog/scrollytelling-examples/)
- [21 scrollytelling website examples](https://reallygooddesigns.com/scrollytelling-website-examples/)
- [Webflow's scrollytelling guide](https://webflow.com/blog/scrollytelling-guide)

### Gaming launchers
- [14 best game launchers 2026 — Plarium](https://plarium.com/en/blog/best-game-launchers/)
- [Xbox Mode rolling to Windows 11](https://windowsforum.com/threads/xbox-mode-coming-to-windows-11-console-style-gaming-ui-rolls-out-april-30.416268/)

### Landing page / multi-product
- [40 best landing pages of 2026 — Unbounce](https://unbounce.com/landing-page-examples/best-landing-page-examples/)
- [10 best product landing pages 2026 — SeedProd](https://www.seedprod.com/product-landing-page-examples/)
- [Best landing page examples 2026 — Colorlib](https://colorlib.com/wp/landing-page-examples/)
