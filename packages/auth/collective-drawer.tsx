"use client";

/**
 * CollectiveDrawer — winded.vertigo collective-only view-toggle drawer.
 *
 * One tucked-away drawer, on EVERY harbour app, that lets the collective preview
 * the experience as different audiences — without affecting real visitors:
 *
 *   • freemium preview — full ⇄ sampler. Sets the `wv_gate_preview` cookie, which
 *     /harbour/api/tier honours for a real-staff session only, so every app's gate
 *     flips to its sampler for this viewer. Meaningful on every app.
 *   • view as — your view / public / visitor / profiled / crew. Sets `wv_view_as`,
 *     which the hub's getViewer honours (staff only). Personas re-render the HUB
 *     surfaces (account / shop / home); on a sub-app the section is kept but
 *     marked "applies on the hub" (freemium-forward there).
 *
 * Renders NOTHING unless /harbour/api/me reports realStaff (derived from the
 * session email, never the cookie) — so the public never sees it, and a forged
 * cookie does nothing for anyone (same trust model as the server gates). Both
 * cookies are set client-side, scoped to `.windedvertigo.com` so they apply
 * across every app, and auto-clear (freemium after 4h; reset clears both).
 *
 * Self-contained: own fetch, own injected styles (literal brand hexes — this
 * widget is bundled into static apps that don't import the token CSS). Rendered
 * by HarbourNav (→ every sub-app, incl. the vanilla CDN bundle) and mounted in
 * the harbour hub layout (which uses no HarbourNav).
 */

import { useEffect, useState } from "react";

const VIEW_AS_COOKIE = "wv_view_as";
const GATE_PREVIEW_COOKIE = "wv_gate_preview";
const COOKIE_DOMAIN = ".windedvertigo.com";

interface Me {
  realStaff?: boolean;
  activePersona?: string | null;
  gatePreview?: boolean;
}

const PERSONAS: { key: string | null; label: string }[] = [
  { key: null, label: "your view" },
  { key: "public", label: "public" },
  { key: "visitor", label: "visitor" },
  { key: "profiled", label: "profiled" },
  { key: "crew", label: "crew" },
];

function writeCookie(name: string, value: string, maxAge: number) {
  const secure = typeof location !== "undefined" && location.protocol === "https:" ? "; secure" : "";
  document.cookie = `${name}=${value}; domain=${COOKIE_DOMAIN}; path=/; max-age=${maxAge}; samesite=lax${secure}`;
  // also clear any legacy path-scoped copy (the old ViewAsBar set wv_view_as on path=/harbour)
  if (maxAge === 0) document.cookie = `${name}=; path=/harbour; max-age=0; samesite=lax`;
}

function onHubPage(): boolean {
  if (typeof location === "undefined") return false;
  const p = location.pathname;
  return (
    p === "/harbour" ||
    p === "/harbour/" ||
    p.startsWith("/harbour/account") ||
    p.startsWith("/harbour/shop") ||
    p.startsWith("/harbour/gate-preview")
  );
}

export function CollectiveDrawer() {
  const [me, setMe] = useState<Me | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let live = true;
    fetch("/harbour/api/me", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (live) setMe(d as Me | null);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  if (!me?.realStaff) return null;

  const persona = me.activePersona ?? null;
  const sampler = !!me.gatePreview;
  const hub = onHubPage();

  const setPersona = (key: string | null) => {
    writeCookie(VIEW_AS_COOKIE, key ?? "", key === null ? 0 : 2592000);
    location.reload();
  };
  const setFreemium = (on: boolean) => {
    writeCookie(GATE_PREVIEW_COOKIE, on ? "sampler" : "", on ? 14400 : 0);
    location.reload();
  };
  const resetAll = () => {
    writeCookie(VIEW_AS_COOKIE, "", 0);
    writeCookie(GATE_PREVIEW_COOKIE, "", 0);
    location.reload();
  };

  const active = sampler || persona !== null;

  return (
    <div className="wv-coll">
      <style>{CSS}</style>

      <button
        type="button"
        className={`wv-coll-handle${active ? " is-active" : ""}`}
        aria-expanded={open}
        aria-controls="wv-coll-panel"
        onClick={() => setOpen((o) => !o)}
        title="collective view toggles"
      >
        <span aria-hidden>⚓</span> collective
        {active && <span className="wv-coll-dot" aria-hidden />}
      </button>

      {open && (
        <div id="wv-coll-panel" className="wv-coll-panel" role="dialog" aria-label="collective view toggles">
          <div className="wv-coll-head">
            <strong>collective view</strong>
            <button type="button" className="wv-coll-x" aria-label="close" onClick={() => setOpen(false)}>×</button>
          </div>

          {/* freemium — prominent everywhere */}
          <section className="wv-coll-sec">
            <p className="wv-coll-lbl">freemium preview</p>
            <div className="wv-coll-seg" role="group" aria-label="freemium preview">
              <button type="button" className={`wv-coll-segbtn${!sampler ? " is-on" : ""}`} aria-pressed={!sampler} onClick={() => sampler && setFreemium(false)}>full</button>
              <button type="button" className={`wv-coll-segbtn${sampler ? " is-on" : ""}`} aria-pressed={sampler} onClick={() => !sampler && setFreemium(true)}>sampler</button>
            </div>
            <p className="wv-coll-cap">what the PRME public sees once the gate is live — applies on every app.</p>
          </section>

          {/* personas — hub surfaces */}
          <section className={`wv-coll-sec${hub ? "" : " wv-coll-sec--muted"}`}>
            <p className="wv-coll-lbl">
              view as {!hub && <span className="wv-coll-note">applies on the hub</span>}
            </p>
            <div className="wv-coll-chips">
              {PERSONAS.map((v) => {
                const isActive = v.key === persona;
                return (
                  <button
                    key={v.key ?? "self"}
                    type="button"
                    className={`wv-coll-chip${isActive ? " is-on" : ""}`}
                    aria-pressed={isActive}
                    onClick={() => !isActive && setPersona(v.key)}
                  >
                    {v.label}
                  </button>
                );
              })}
            </div>
            {!hub && (
              <p className="wv-coll-cap">
                personas re-render the hub (account, shop, home). set one here and it&rsquo;s waiting when you go back.
              </p>
            )}
          </section>

          <div className="wv-coll-foot">
            <span className="wv-coll-state">
              {sampler ? "sampler" : "full"}
              {persona ? ` · as ${persona}` : ""}
            </span>
            {active && (
              <button type="button" className="wv-coll-reset" onClick={resetAll}>reset all</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Literal brand hexes — this widget is bundled into static apps that never import
// the @windedvertigo/tokens CSS, so CSS custom properties aren't available here.
//   cadet #273248 · cadet-dark #1E2636 · champagne #FFEBD2 · sienna #CB7858
const CSS = `
.wv-coll { position: fixed; left: 14px; bottom: 14px; z-index: 2147483000; font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; }
.wv-coll-handle { display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px; border-radius: 999px; border: 1px solid rgba(255,235,210,0.28); background: rgba(39,50,72,0.92); color: #FFEBD2; font-size: 12px; font-weight: 600; letter-spacing: 0.02em; cursor: pointer; backdrop-filter: blur(6px); box-shadow: 0 4px 16px rgba(0,0,0,0.3); }
.wv-coll-handle:hover { border-color: rgba(203,120,88,0.6); }
.wv-coll-handle.is-active { border-color: #CB7858; background: rgba(203,120,88,0.22); }
.wv-coll-dot { width: 7px; height: 7px; border-radius: 50%; background: #CB7858; box-shadow: 0 0 0 3px rgba(203,120,88,0.25); }
.wv-coll-panel { position: absolute; left: 0; bottom: calc(100% + 8px); width: 280px; background: #1E2636; border: 1px solid rgba(255,235,210,0.18); border-radius: 14px; padding: 14px; color: #FFEBD2; box-shadow: 0 12px 40px rgba(0,0,0,0.45); }
.wv-coll-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; font-size: 13px; }
.wv-coll-x { background: none; border: none; color: rgba(255,235,210,0.6); font-size: 18px; line-height: 1; cursor: pointer; padding: 0 2px; }
.wv-coll-x:hover { color: #FFEBD2; }
.wv-coll-sec { padding: 10px 0; border-top: 1px solid rgba(255,235,210,0.1); }
.wv-coll-sec:first-of-type { border-top: none; padding-top: 0; }
.wv-coll-sec--muted { opacity: 0.72; }
.wv-coll-lbl { margin: 0 0 7px; font-size: 11px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(255,235,210,0.7); display: flex; align-items: center; gap: 8px; }
.wv-coll-note { font-weight: 500; letter-spacing: 0.02em; text-transform: none; color: #CB7858; font-size: 10px; }
.wv-coll-seg { display: flex; gap: 4px; background: rgba(0,0,0,0.25); border-radius: 9px; padding: 3px; }
.wv-coll-segbtn { flex: 1; padding: 7px 0; border: none; border-radius: 7px; background: transparent; color: rgba(255,235,210,0.75); font-size: 12px; font-weight: 600; cursor: pointer; }
.wv-coll-segbtn.is-on { background: #CB7858; color: #1E2636; }
.wv-coll-chips { display: flex; flex-wrap: wrap; gap: 5px; }
.wv-coll-chip { padding: 5px 10px; border-radius: 999px; border: 1px solid rgba(255,235,210,0.2); background: transparent; color: rgba(255,235,210,0.8); font-size: 12px; cursor: pointer; }
.wv-coll-chip:hover { border-color: rgba(203,120,88,0.5); }
.wv-coll-chip.is-on { background: rgba(203,120,88,0.2); border-color: #CB7858; color: #FFEBD2; font-weight: 600; }
.wv-coll-cap { margin: 7px 0 0; font-size: 10.5px; line-height: 1.4; color: rgba(255,235,210,0.5); }
.wv-coll-foot { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 12px; padding-top: 10px; border-top: 1px solid rgba(255,235,210,0.1); }
.wv-coll-state { font-size: 11px; color: rgba(255,235,210,0.6); }
.wv-coll-reset { background: none; border: 1px solid rgba(255,235,210,0.25); border-radius: 999px; padding: 4px 10px; color: #FFEBD2; font-size: 11px; cursor: pointer; }
.wv-coll-reset:hover { border-color: #CB7858; }
@media (prefers-reduced-motion: no-preference) { .wv-coll-panel { animation: wv-coll-in 120ms ease-out; } }
@keyframes wv-coll-in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
`;
