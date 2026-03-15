# depth.chart — product roadmap & business plan

*a winded.vertigo project. last updated: 14 march 2026.*

> **notion mirror**: [depth.chart — product roadmap & business plan](https://www.notion.so/324e4ee74ba481aabac2e6798d4e71bd) — keep both the markdown and Notion page in sync as we iterate.

---

## current state (v0.1 — MVP)

depth.chart is a formative assessment generator that transforms lesson plans into constructively aligned assessment tasks. faculty paste their lesson plan text, and depth.chart:

1. extracts learning objectives and classifies them on Bloom's revised taxonomy
2. generates assessment tasks with rubrics grounded in constructive alignment (Biggs, 1996)
3. produces evaluative judgment scaffolds for student self-assessment (Sadler, 1989; Tai et al., 2018)
4. applies Baquero-Vargas & Pérez-Salas (2023) six authenticity criteria with configurable weights

**stack**: Next.js 16, TypeScript, Anthropic Claude API, localStorage persistence
**live at**: windedvertigo.com/harbour/depth-chart

### what's built

- [x] lesson plan text upload + AI parsing (objectives extraction + Bloom's classification)
- [x] per-objective task generation with rubric + EJ scaffold
- [x] teacher configuration panel (time limits, collaboration mode, format preferences, authenticity weights)
- [x] plan history (localStorage, last 20 plans)
- [x] Bloom's taxonomy reference on landing page
- [x] alignment report (distribution across cognitive levels)

---

## wishlist & feature roadmap

### 1. multi-format upload (high priority)

faculty should be able to upload or drag-and-drop PDFs, DOCX files, or paste a link to a Google Doc on the upload page — not just raw text.

**approach:**
- PDF: use `pdf-parse` or `pdfjs-dist` server-side to extract text, then pass to existing parse pipeline
- DOCX: use `mammoth` to extract text/HTML from .docx files
- Google Docs: accept a sharing link, use Google Docs API (or export-as-text endpoint) to fetch content
- drag-and-drop zone with file type detection + progress indicator
- fallback: if extraction quality is low, show the extracted text and let faculty edit before parsing

**files to modify:**
- `apps/depth-chart/components/upload-form.tsx` — add drag-drop zone, file input
- `apps/depth-chart/app/api/parse/route.ts` — add file upload handling, format detection, text extraction
- new: `apps/depth-chart/lib/extractors.ts` — PDF, DOCX, Google Docs extraction utilities

### 2. winded.vertigo branding on generated outputs

scenarios, rubrics, and EJ scaffolds should each carry winded.vertigo branding — a subtle watermark or header/footer mark that establishes provenance.

**approach:**
- add a branded header to each generated output section: "depth.chart by winded.vertigo" in champagne on cadet, using the icon mark
- for downloadable PDFs (see item 3): include the full wordmark at footer with 20% opacity watermark per brand guidelines
- use `--wv-champagne` text on `--wv-cadet` background for the branding strip
- watermark placement follows brand guidelines: "white wordmark with subtle placement, transparency not exceeding 20%"

**brand assets needed:**
- `apps/site/images/logo.png` (existing wordmark)
- `packages/tokens/` colour variables (existing)

### 3. downloadable branded PDFs

each generated assessment component (scenario, rubric, EJ scaffold) should be downloadable as a w.v-branded PDF.

**approach:**
- use `@react-pdf/renderer` or `jsPDF` for client-side PDF generation
- template: cadet header bar with depth.chart wordmark, content body, champagne footer with "a winded.vertigo project"
- watermark: full wordmark at 15-20% opacity, centred, rotated 30°
- include metadata: plan title, subject, grade level, Bloom's level, generation date
- download button on each task card + bulk "download all" option

**files to create:**
- `apps/depth-chart/lib/pdf-template.tsx` — branded PDF layout component
- `apps/depth-chart/components/download-button.tsx` — per-task and bulk download

### 4. LMS integration (canvas, blackboard, moodle)

depth.chart should fit into faculty workflows by supporting direct export to learning management systems.

**approach (phased):**

**phase 1 — export formats**
- QTI (question and test interoperability) XML export for rubrics — supported by Canvas, Blackboard, Moodle, Brightspace
- IMS Common Cartridge package for full assessment bundles
- CSV export for gradebook-compatible rubric matrices

**phase 2 — LTI integration**
- implement LTI 1.3 (learning tools interoperability) as an external tool
- faculty launches depth.chart from within their LMS
- generated tasks publish back to the LMS assignment area
- requires: OAuth 2.0 flow, JWKS endpoint, deep linking spec

**phase 3 — direct API integration**
- Canvas REST API: create assignments, attach rubrics
- Blackboard REST API: create assessments
- Moodle Web Services API: create quiz/assignment resources
- each integration behind a feature flag, rolled out per institution

**competitive note:** most assessment tools stop at PDF export. LTI integration is a major differentiator for institutional adoption.

### 5. visual design & imagery

the current UI is functional but text-heavy. images, illustrations, and visual cues would improve the aesthetic experience and reinforce the educational methodology.

**approach:**
- commission or source illustrations for each Bloom's taxonomy level (6 illustrations)
- hero image or animation on the landing page — something that communicates "depth" visually
- subtle background textures or patterns using the brand palette (cadet/champagne/sienna gradients)
- iconography for the "how it works" steps (currently text-only cards)
- consider lottie animations for the parse → generate → scaffold flow
- photography style per brand guidelines: "candid, warm-lit imagery... muted earth tones"

**assets needed:**
- 6 Bloom's level illustrations (custom commission or curated stock)
- landing page hero visual
- step-by-step iconography (4 icons)
- background texture/pattern files

---

## business plan

### the opportunity

higher education faces a persistent gap between learning objectives and assessment practice. faculty write learning objectives (often required by accreditation bodies), but the assessments they create frequently misalign with those objectives — testing recall when the objective targets analysis, or using formats that don't match the cognitive level required.

this misalignment is well-documented:
- Biggs (1996) showed that constructive alignment between objectives, activities, and assessments is the single strongest predictor of learning quality
- Bloom's taxonomy (revised by Anderson & Krathwohl, 2001) provides the cognitive framework, but faculty rarely map assessments systematically to it
- Baquero-Vargas & Pérez-Salas (2023) identified six authenticity criteria that make assessments meaningful, but applying all six requires expertise most faculty lack

**depth.chart automates what currently requires assessment design expertise.**

### target market

**primary:** higher education faculty (universities, colleges, community colleges)
- estimated 1.5M faculty in the US alone (NCES)
- assessment design is a pain point across all disciplines
- accreditation requirements increasingly demand documented alignment

**secondary:** instructional designers and curriculum developers
- employed by institutions to support faculty
- fewer in number but higher per-user value
- often responsible for programme-level assessment maps

**tertiary:** K-12 educators (future expansion)
- larger market but different needs (standards-based, not objectives-based)
- would require curriculum standards integration (Common Core, NGSS, etc.)

### revenue model

**freemium SaaS with institutional licensing:**

| tier | price | features |
|------|-------|----------|
| **free** | $0 | 3 plans/month, text upload only, basic task generation |
| **faculty** | $12/month or $99/year | unlimited plans, PDF/DOCX upload, branded PDF export, plan history, full authenticity config |
| **department** | $49/month (up to 10 seats) | everything in faculty + shared plan library, department-level analytics, LMS export (QTI/CSV) |
| **institution** | custom pricing | everything in department + LTI integration, SSO, dedicated support, custom branding, API access |

**pricing rationale:**
- $12/month is below the "requires purchase order" threshold at most institutions — faculty can expense it or pay personally
- department tier targets chairs/programme leads who want consistency across courses
- institutional tier is the growth engine — once embedded via LTI, switching costs are high

### competitive landscape

| competitor | approach | gap depth.chart fills |
|------------|----------|----------------------|
| **Chalk** | curriculum mapping platform | no AI-powered assessment generation; manual rubric building |
| **Turnitin** | plagiarism + feedback | detection, not generation; no constructive alignment |
| **Respondus** | exam authoring | test-bank focused; no learning objective analysis |
| **ChatGPT / generic AI** | prompt-and-pray | no pedagogical framework; no authenticity criteria; no systematic alignment |
| **ExamSoft** | secure testing | delivery platform, not a design tool |

**depth.chart's moat:**
1. **methodological rigour** — grounded in published assessment theory, not generic AI prompts
2. **evaluative judgment scaffolds** — unique feature; no competitor generates self-assessment frameworks
3. **authenticity criteria** — configurable six-criteria framework from peer-reviewed research
4. **constructive alignment engine** — systematically maps objectives → tasks → rubrics at the correct cognitive level

### go-to-market strategy

**phase 1 — validation (current → Q3 2026)**
- deploy MVP at windedvertigo.com/harbour/depth-chart
- recruit 10-15 faculty beta testers from winded.vertigo's existing network
- collect usage data: which Bloom's levels are most common, which formats are preferred, where faculty override AI suggestions
- iterate on generation quality based on feedback

**phase 2 — launch (Q4 2026)**
- add multi-format upload (PDF, DOCX, Google Docs)
- add branded PDF export
- launch free + faculty tiers
- content marketing: blog posts on constructive alignment, conference presentations (OLC, EDUCAUSE)
- SEO: target "assessment generator," "rubric builder," "constructive alignment tool"

**phase 3 — institutional (2027)**
- LTI 1.3 integration for Canvas, Blackboard, Moodle
- department and institutional tiers
- pilot with 2-3 institutions from wv's consulting network
- case studies from pilot institutions
- apply for ed-tech grants (Gates Foundation, EDUCAUSE)

**phase 4 — platform (2027-2028)**
- API for third-party integrations
- assessment analytics dashboard (programme-level alignment gaps)
- peer review workflow (faculty review each other's assessments)
- expand to K-12 with standards integration

### unit economics (projected)

| metric | year 1 | year 2 | year 3 |
|--------|--------|--------|--------|
| free users | 500 | 2,000 | 5,000 |
| paid faculty | 50 | 300 | 1,000 |
| department licences | 0 | 15 | 60 |
| institutional licences | 0 | 2 | 8 |
| MRR | $600 | $4,335 | $16,735 |
| ARR | $7,200 | $52,020 | $200,820 |

**cost structure:**
- Claude API: ~$0.02-0.05 per plan parse + ~$0.05-0.15 per task generation (opus for quality)
- estimated API cost per active user: $2-5/month at moderate usage
- Vercel hosting: currently free tier; Pro ($20/month) when traffic warrants
- total infrastructure cost year 1: ~$3,000-5,000

**margin note:** at $12/month per faculty user with $3-5/month API cost, gross margin is 58-75%. institutional licences have even better margins due to bulk pricing and lower per-user generation frequency.

### token economics

| operation | model | input tokens (est.) | output tokens (est.) | cost per call |
|-----------|-------|--------------------|--------------------|--------------|
| plan parse (objectives extraction) | claude-opus-4-6 | ~2,000-5,000 | ~500-1,500 | $0.02-0.06 |
| task generation (per objective) | claude-opus-4-6 | ~1,500-3,000 | ~1,000-2,500 | $0.04-0.10 |
| typical plan (5 objectives, full generation) | claude-opus-4-6 | ~10,000-20,000 | ~6,000-14,000 | $0.22-0.56 |

*based on Claude Opus 4.6 pricing: $15/M input, $75/M output tokens. costs decrease if sonnet is viable for parse step.*

**cost optimisation levers:**
- use claude-sonnet-4-6 for parse step (classification is well-structured, doesn't need opus reasoning)
- cache common Bloom's level → format mappings to reduce redundant generation
- batch objectives in a single generation call where appropriate

### risks and mitigations

| risk | likelihood | impact | mitigation |
|------|-----------|--------|------------|
| AI hallucination in rubric criteria | medium | high | human-in-the-loop review; faculty always edit before use |
| LLM cost spikes | low | medium | usage caps on free tier; cache common patterns; model flexibility |
| slow institutional sales cycle | high | medium | freemium bottom-up adoption; faculty advocates drive institutional interest |
| competitor copies methodology | medium | low | execution speed; brand trust; publish methodology openly (academic credibility) |
| faculty resistance to AI tools | medium | medium | position as "AI-assisted, not AI-replaced"; faculty controls all parameters |

### alignment with winded.vertigo mission

depth.chart embodies wv's core values:
- **play**: faculty experiment with different assessment formats and authenticity weightings
- **justice**: structurally better assessments serve all students, especially those disadvantaged by traditional testing
- **aliveness**: evaluative judgment scaffolds help students develop agency over their own learning

it follows the find → fold → unfold → find again methodology:
- **find**: extract what's already in the lesson plan (objectives, implicit cognitive targets)
- **fold**: shape those objectives into constructively aligned assessment tasks
- **unfold**: the EJ scaffold surfaces what changed — helping students reflect on their own growth
- **find again**: plan history and analytics carry learning forward across courses and semesters

---

## open questions

- [ ] should depth.chart have its own subdomain (depthchart.windedvertigo.com) or stay under the harbour?
- [ ] what's the right model split? opus for generation quality vs sonnet for cost at scale?
- [ ] should we pursue SOC 2 compliance early for institutional sales, or wait until there's demand?
- [ ] how do we handle FERPA considerations if/when student data enters the system via LTI?
- [ ] should the business plan target VC funding or bootstrap via wv's consulting revenue?
