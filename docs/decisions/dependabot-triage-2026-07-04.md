# dependabot triage — 2026-07-04

29 alerts on `main` at the time of triage (1 critical, 12 high, 10 moderate, 6 low).

## fixed (npm audit fix + manual bump)

Ran `npm audit fix` (no `--force`) — 41 packages changed:

| package | was | now | severity |
|---|---|---|---|
| axios | 1.15.2 | 1.18.1 | high × 5 advisories |
| basic-ftp | 5.3.0 | 5.3.1 | high |
| form-data | 4.0.5 | 4.0.6 | high |
| tmp | 0.2.5 | 0.2.7 | high |
| @babel/core | 7.29.0 | 7.29.7 | low |
| brace-expansion | 5.0.5 | 5.0.7 | moderate |
| ip-address | 10.1.0 | 10.2.0 | moderate |
| js-yaml | 4.1.1 | 4.3.0 | moderate |
| qs | 6.15.1 | 6.15.3 | moderate |
| turbo | 2.9.6 | 2.10.3 | moderate |
| next | 16.2.6 | 16.2.10 | moderate (postcss) |

Then bumped `apps/values-auction` vite from `^5.4.11` → `^7.3.6`, eliminating the vite/esbuild advisory for that sub-app.

## residuals — accepted / no safe fix

### esbuild@0.27.7 (GHSA-g7r4-m6w7-qqqr) — moderate
- **what**: arbitrary file read when running the **esbuild dev server** on Windows
- **installed by**: vite@7.3.6, which peer-depends `^0.27.0` — cannot reach esbuild 0.28.1+ without a vite major bump (vite@8)
- **risk here**: nil. Team runs macOS; vulnerability requires Windows. Even on Windows, only the dev server is affected, not the production build.
- **action**: accept; revisit when vite@8 ships and the broader migration is planned

### postcss@8.4.31 inside next@16.2.10 (GHSA-qx2v-qp2m-jg93) — moderate
- **what**: XSS via unescaped `</style>` in postcss CSS stringify output
- **installed by**: next@16.2.10 bundles its own postcss copy; advisory covers all next versions 9.3.4-canary.0 through 16.3.0-canary.5
- **npm "fix"**: `next@9.3.3` — a 7-major downgrade, clearly wrong. Latest next@16.x still carries this bundled postcss.
- **risk here**: postcss stringify is used by Next.js at **build time** to process CSS files, not to serialize user-controlled strings into HTML. The XSS vector requires attackers to control the CSS being stringified. Not applicable.
- **action**: false positive. Dismiss `inaccurate` on Dependabot; monitor next@17 or a next patch that updates its bundled postcss.
