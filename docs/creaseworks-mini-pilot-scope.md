# creaseworks mini — pilot scope

> scoped 2026-06-10 from: whirlpool transcript (june 10, gemini notes doc `1glIv9O_NfSFNJw19tU6gZSJqCC2AWYqwTKB1YIp3ars`), fruitstand meeting notes (notion `37be4ee7-4ba4-8043`), port action items (meeting `5ad73ac3`), whirlpool agenda 2026-06-10, and the live creaseworks codebase + db.
>
> owner: garrett. deadline: friends & family **next week (~june 17)**; "as many hands as possible" by **june 30**. pilot sequence: friends/family → summer camps → classrooms.

---

## 1. what it is

a **mini version of creaseworks** — a branched, shrunk-down experience with **5 curated activities** for children aged **4–6** (non-readers), wrapped in a **facilitated experience** for parents and teachers that is always **kid-driven**. the wrapper frames each step, embeds the mini app ("an iframe or window into creaseworks" — garrett, whirlpool), and captures feedback as families play.

quality bar (from the whirlpool): the full app "feels like school" to a kindergartener and "is not ready for prime time." the mini exists to fix that at small scale before any broader launch. **decided: not a launch — a pilot.** the whole app is explicitly NOT shared; only the five activities.

vocabulary: the four phases find / fold / unfold / find-again are renamed in-app to **look / make / show / wow** (same icons). all five activities must align with jamie's **collect and connect** framework (three layers: surface play → model shifting → deeper connection) and the transformative theory of change.

---

## 2. the five activities ✅ confirmed

from jamie's keep/strengthen table (#whirlpool, 2026-06-10 10:03 — a slack-native table, read via browser after the API rendered it empty). all five are `ready` / `internal-only` in `playdates_cache` — no content creation needed, only hardening per jamie's notes:

| slug | jamie's hardening note |
|---|---|
| `character-from-a-crease` | best in collection. directly enacts trace theory. add layer 3 provocation. **also the designated fallback**: "whatever you collect is right" |
| `function-swap-same-form` | model-shifting at its clearest. add facilitator face *(sic — likely "pace")* |
| `design-a-rule-not-an-object` | rules make reality. most conceptually ambitious. add layer 3. |
| `take-apart-archaeology` | closest to layer 3 already. deepen facilitator face *(sic)* substantially. |
| `mend-a-stuffed-friend` | kintsugi already gestures at layer 3. strengthen provocation. UDL: fine motor. |

per-activity hardening (jamie's audit): every one of the five needs **the facilitator pace bit** added, plus a materials list dialed in with coherent iconography (payton owns icons, due with the build).

> ⚠️ note jamie's picks lean hard into layer-2/layer-3 conceptual activities rather than craft-forward ones — scored against collect-and-connect, not age-surface appeal. see open inputs: `design-a-rule-not-an-object` needs an ages-4–6 gut-check.

---

## 3. the find stage (LOOK) — the stress-test target

> "this find is probably where we really want the kids to have a real big blast… this experience needs to start off with a bang." — garrett, whirlpool

### existing modes (in `apps/creaseworks/src/components/matcher/`)

| mode | verdict from meetings | mini scope |
|---|---|---|
| classic picker | "kind of obvious," works; icons incomplete | ✅ include — restrict to the materials of the 5 activities; payton's icon pass |
| explore rooms | "western leaning," classroom filter "really not doing much" | ✅ include (home rooms only for v1); fix classroom filter later |
| timed challenges (30/60/90s) | "the one that works pretty easily" with kids, but "not sustainable" as the only motivator | ✅ include — flagship of v1 (fruitstand: "picker and timer features") |
| scavenger hunt | **broken** — "it actually just skips the looking for materials… that's not cool" | 🔧 rebuild as a real hunt with clues, or cut from v1. cooney center research: kids co-designing games invent clue-based scavenger hunts organically — strongest candidate for co-design WITH kids rather than for them |

### new modes (from fruitstand + garrett's brief)

| mode | concept | mini scope |
|---|---|---|
| **nature walk** | find materials outdoors by colour or shape (school + family walks) | ✅ buildable for v1 — `color-walk-bingo` playdate already prototypes this mechanic; lift it into a find mode |
| **heads up!** | one material shown full-screen; kid holds phone up; group says yes/no; tilt down = dismiss, tilt back = approve | ✅ strong v1 candidate — high fun-per-line-of-code; needs deviceorientation API + big-image-one-at-a-time UI |
| **find by property** | "find something sticky / that rolls / that floats" — name a function or feature, kids hunt | ✅ v1 candidate — the db already models `functions[]` per material and `function-tag-scavenger` (sampler) prototypes it |

### shared find logic

- **match rate**: after a find, score collected materials against the 5 activities' material lists ("82% match rate") and rank activities by match. the matcher API (`/api/matcher`) already does material→playdate matching; constrain to the 5.
- **fallback**: no good match → route to character from a crease ("whatever you collect is right").

---

## 4. make (FOLD)

the 5 playdate guides, simplified for non-readers:

- **pictures-first**: payton's page-by-page layout proposal — "creaseworks characters as guides, like a video game." reuse `@windedvertigo/characters` (all 7 shipped, kid variants, pose system).
- **audio**: read-aloud for each step (garrett: "an audio thing where it talks to them… could be a video… could be just simply pictures that really drive everything"). v1: pre-generated TTS audio per step, single play button per page.
- no literacy-dependent navigation anywhere in the flow.

---

## 5. show (UNFOLD) — reflection + evidence

- capture: photo of the creation + a parent-typed or voice-note reflection. keep it facilitator-driven for ages 4–6.
- **prerequisite bug fix**: photo evidence upload in the full app is broken (garrett: pictures added but never post). likely suspects, in order: R2 credentials/public-url drift from the 2026-04-25 bucket migration (`creaseworks-evidence` moved accounts; new public url `pub-60282cf3…r2.dev`), the presigned `upload-url` flow (`/api/evidence/upload-url`), or the post-upload record write (`/api/runs/[id]/evidence`). fruitstand notes also reference "cloudflare and supabase migration bugs." **diagnose before building anything new on the evidence path.**
- narrative > numbers (jamie): capture how kids engaged/changed, not scores. stealth-assessment framing for the eventual b2b story.

---

## 6. wow (FIND AGAIN) — share, curated

- **suggestion box, not live feed** (fruitstand decision): submissions are curated before anything is public — avoids moderation problems entirely for the pilot.
- **museum melee** (payton, fruitstand): build/find a creature → give it a name, scientific name, and role → digitize → **virtual wall of exhibits**. standardised submission (e.g. 20×20×20 cm). doubles as a social campaign later. v1: a simple curated gallery wall page fed by approved pilot submissions; full melee mechanics post-pilot.
- community material suggestions ("I found this!") also flow into the suggestion box for future find-mode content.

---

## 7. the facilitated wrapper

a guided flow around the mini app — "show not tell… they discover the why behind it as they give us the feedback" (garrett):

1. **welcome** — one screen of framing for the adult (what this is, what feedback we want), kid-language intro voiced by a character.
2. **look** — pick a find mode, hunt for materials, log what was found.
3. **make** — matched activity (or character-from-a-crease fallback), picture+audio guide.
4. **show** — photo + reflection capture.
5. **wow** — see the curated wall; submit to it.
6. **feedback** — lightweight, playful prompts per phase + the in-app bug button pattern (payton: "every time they stop or pause or go 'what do I do?' click that bug and type it in"). store in the existing `harbour_feedback` table shape.

facilitator support: jamie's facilitator guide distilled to one page per session; clear framing requirement ("we need a clear framing AND a clean version to deliver along with it").

### access model — decision needed

the pilot audience is friends/family/teachers **without** @windedvertigo.com accounts, and sign-in is currently domain-restricted across all 20 apps. kids 4–6 should never have accounts. recommendation: **no-login access codes** — reuse the existing `access_codes` / `access_code_redemptions` tables (or the co-play `/co-play/[code]` join flow) so each family/session gets a code or QR from the facilitator. evidence + feedback rows attach to the code, not a user.

> ⚠️ **open input #2**: confirm the access-code approach (vs. adding pilot emails to an allowlist).

---

## 8. architecture recommendation

build the mini **inside the creaseworks codebase** on branch `feat/creaseworks-mini`, as a self-contained route group (e.g. `src/app/mini/…` with its own layout), and deploy the branch to a **dedicated CF worker** (`wv-harbour-creaseworks-mini`, workers.dev canary or `mini` path) so friends and family never touch prod and prod never sees mini code until merge.

why not a separate app: the mini needs the matcher, materials db, characters package, evidence pipeline, access codes, and feedback tables — all already wired in creaseworks. a new app means a 21st worker plus re-wiring ~15 secrets for zero pilot benefit. the branch + separate-worker deploy honours garrett's "branch it and work on a version over here" intent with the least surface area.

cost note: one additional CF worker, manual deploys only — consistent with the existing per-app deploy pattern; no vercel involvement.

---

## 9. build sequence (toward ~june 17 friends & family)

| # | slice | depends on |
|---|---|---|
| 1 | fix photo evidence upload (diagnose R2/presign/record-write) | — |
| 2 | confirm the 5 activities; seed `mini_activities` config (or tag in db); payton icon pass on their materials | jamie's table |
| 3 | mini route group: wrapper shell (welcome → look → make → show → wow), character guides, audio-first pages | — |
| 4 | find modes v1: classic picker (restricted) + timed challenge + heads up! + find-by-property; nature walk if time | 3 |
| 5 | match-rate + character-from-a-crease fallback wiring | 2, 4 |
| 6 | access codes for sessions; evidence + feedback attached to code | 1, 3 |
| 7 | curated wall (suggestion box → approve → display) | 6 |
| 8 | facilitator one-pager + session script (with jamie's framing) | 3 |
| 9 | deploy `wv-harbour-creaseworks-mini`; smoke test on a real phone + ipad (mobile-first per fruitstand) | all |

scavenger hunt rebuild: **deferred** to the co-design sessions (8–12 kids, druin's ladder — let kids design it, per the cooney/GIANT room model in the agenda).

---

## 10. explicitly out of scope (vetoed in meetings)

- full launch or sharing the whole app
- gift-card/incentive-driven co-design (the "LEGO trap" — kids tell you what you want to hear)
- live community feed (suggestion box only)
- quantitative-only assessment
- designing for 6–9 first (4–6 is the bar; older adapts down easily)
- new characters (all 7 shipped)
- classroom rooms-filter overhaul (post-pilot)

---

## 11. open inputs

1. ~~the 4 remaining activities~~ ✅ resolved 2026-06-10 — jamie's table read via browser; see section 2.
2. **access model sign-off** — access codes (recommended) vs. email allowlist.
3. **payton's scavenger-hunt ideas** — referenced in the fruit stand conversation but not detailed in notes; payton owes "additional find activity ideas via slack" (open action).
4. **heads up! IP check** — the mechanic is fine to borrow, but don't use the "Heads Up!" name in product copy (Warner Bros./Ellen game trademark). working name: e.g. "show & guess" / "tilt-it."
5. **"facilitator face" vs "pace"** — jamie's table says "face" twice; the whirlpool transcript repeatedly says "the facilitator pace bit." confirm with jamie — pacing guidance vs. a character/avatar presence are different builds.
6. **`design-a-rule-not-an-object` age-fit** — most conceptually ambitious activity in the collection, aimed at non-readers 4–6. gut-check with jamie whether it survives or gets swapped.
