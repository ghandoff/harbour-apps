/**
 * Vanilla auto-mount entry for the harbour nav widget.
 *
 * Built into a single self-contained IIFE bundle (`dist/harbour-nav-widget.js`)
 * via build-vanilla.mjs. Any page (static HTML, Vite, Next.js) can load it:
 *
 *   <script
 *     src="https://windedvertigo.com/harbour-nav-widget.js"
 *     data-app="cuts-catalogue"
 *     defer
 *   ></script>
 *
 * The bundle:
 *   1. Reads `data-app` from its own script tag to identify the current app.
 *   2. Injects the harbour nav CSS as a <style> element in <head>.
 *   3. Prepends a mount <div> as the first child of <body>.
 *   4. Renders <HarbourNav currentApp={appKey} />.
 *   5. Overrides .harbour-topbar to position:fixed + adds body padding-top
 *      so the nav doesn't conflict with existing sticky/fixed headers.
 */

import { createRoot } from "react-dom/client";
import { HarbourNav, type HarbourAppKey } from "./harbour-nav";

declare global {
  interface Window {
    __wvHarbourNavMounted?: boolean;
  }
}

/* ── CSS to inject ────────────────────────────────────────────────────────
   Includes:
   - Required CSS custom property definitions (wv brand tokens)
   - All .harbour-* rules from packages/tokens/index.css
   - Vanilla-mode overrides: fixed positioning + body padding so the nav
     sits above existing page headers without competing for sticky top:0
*/
const HARBOUR_NAV_CSS = `
:root {
  --wv-cadet: #273248;
  --wv-champagne: #ffebd2;
  --wv-sienna: #cb7858;
  --wv-white: #ffffff;
  --color-text-on-dark: var(--wv-champagne);
  --color-text-on-dark-muted: rgba(255, 235, 210, 0.85);
  --color-accent-on-dark: #e09878;
}

.harbour-topbar {
  --topbar-accent: rgba(255, 235, 210, 0.12);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  height: 52px;
  padding: 0 14px;
  padding-top: env(safe-area-inset-top, 0px);
  background-color: var(--wv-cadet);
  border-bottom: 1px solid rgba(255, 235, 210, 0.08);
  color: var(--color-text-on-dark);
  font-family: system-ui, -apple-system, sans-serif;
  box-sizing: border-box;
}
.harbour-topbar::after {
  content: "";
  position: absolute;
  inset: auto 0 -1px 0;
  height: 1px;
  background: linear-gradient(to right, transparent 0%, var(--topbar-accent) 10%, var(--topbar-accent) 90%, transparent 100%);
  opacity: 0.75;
  pointer-events: none;
}
@media (min-width: 640px) {
  .harbour-topbar { height: 56px; padding: 0 22px; }
}
.harbour-topbar-crumb {
  display: inline-flex;
  align-items: center;
  gap: 0;
  min-width: 0;
  flex: 1;
}
.harbour-anchor {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 44px;
  padding: 6px 10px 6px 8px;
  margin-left: -8px;
  background: none;
  border: none;
  border-radius: 999px;
  color: inherit;
  font: inherit;
  cursor: pointer;
  transition: background-color 160ms ease, transform 220ms ease;
}
.harbour-anchor:hover { background: rgba(255, 235, 210, 0.06); }
.harbour-anchor:active { transform: scale(0.97); }
.harbour-anchor-sigil {
  width: 17px;
  height: 17px;
  color: var(--wv-white);
  opacity: 0.9;
  flex-shrink: 0;
}
.harbour-anchor-label {
  font-size: 0.8125rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  color: var(--wv-white);
  opacity: 0.75;
}
.harbour-anchor-sep {
  position: relative;
  display: inline-block;
  width: 22px;
  height: 12px;
  flex-shrink: 0;
}
.harbour-anchor-sep::before {
  content: "";
  position: absolute;
  inset: 50% 4px auto 4px;
  height: 1px;
  background: rgba(255, 255, 255, 0.22);
  transform: translateY(-0.5px);
}
.harbour-breadcrumb {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 6px 10px;
  font-size: 0.9375rem;
  font-weight: 700;
  letter-spacing: -0.015em;
  color: var(--wv-white);
  text-decoration: none;
  border-radius: 8px;
  transition: background-color 160ms ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 55vw;
}
.harbour-breadcrumb:hover { background: rgba(255, 255, 255, 0.06); }
@media (min-width: 640px) {
  .harbour-anchor-label { font-size: 0.875rem; }
  .harbour-breadcrumb { font-size: 1rem; max-width: none; }
}
.harbour-topbar-action {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}
.harbour-signin {
  font-size: 0.8125rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  color: var(--color-accent-on-dark);
  text-decoration: none;
  padding: 8px 12px;
  border-radius: 999px;
  transition: background-color 160ms ease;
}
.harbour-signin:hover { background: rgba(255, 235, 210, 0.06); }

.harbour-drawer {
  padding: 0; margin: 0; border: none;
  position: fixed; top: 0; right: 0; bottom: 0; left: auto;
  width: 100%; max-width: 100%;
  height: 100vh; height: 100dvh; max-height: 100dvh;
  background-color: var(--wv-cadet);
  color: var(--color-text-on-dark);
  box-shadow: -24px 0 60px -20px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  transform: translateX(100%);
  opacity: 0;
  transition: transform 220ms ease-out, opacity 180ms ease-out, overlay 220ms allow-discrete, display 220ms allow-discrete;
  font-family: system-ui, -apple-system, sans-serif;
}
.harbour-drawer[open] { transform: translateX(0); opacity: 1; }
@starting-style { .harbour-drawer[open] { transform: translateX(100%); opacity: 0; } }
.harbour-drawer::backdrop {
  background: rgba(15, 20, 31, 0.6);
  opacity: 0;
  transition: opacity 180ms ease-out, overlay 220ms allow-discrete, display 220ms allow-discrete;
}
.harbour-drawer[open]::backdrop { opacity: 1; }
@starting-style { .harbour-drawer[open]::backdrop { opacity: 0; } }
@media (min-width: 640px) {
  .harbour-drawer { max-width: 480px; border-left: 1px solid rgba(255, 235, 210, 0.08); }
}
@media (prefers-reduced-motion: reduce) {
  .harbour-drawer {
    transition: opacity 120ms ease-out, overlay 120ms allow-discrete, display 120ms allow-discrete;
    transform: none !important;
  }
  @starting-style { .harbour-drawer[open] { transform: none; } }
}
.harbour-drawer-inner {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 20px 16px calc(24px + env(safe-area-inset-bottom, 0px));
  padding-top: calc(20px + env(safe-area-inset-top, 0px));
  overflow-y: auto;
  overscroll-behavior: contain;
  box-sizing: border-box;
}
@media (min-width: 640px) { .harbour-drawer-inner { padding: 28px 24px 32px; } }
.harbour-drawer-head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 12px;
  margin-bottom: 16px;
  border-bottom: 1px solid rgba(255, 235, 210, 0.08);
}
.harbour-drawer-title {
  flex: 1; margin: 0;
  font-size: 1.0625rem; font-weight: 700; letter-spacing: -0.01em;
  color: var(--color-text-on-dark);
}
.harbour-tide {
  font-size: 0.6875rem; font-weight: 500; letter-spacing: 0.08em;
  color: var(--color-text-on-dark-muted);
  opacity: 0.7; min-width: 6ch; text-align: right; font-variant-numeric: tabular-nums;
}
.harbour-close {
  display: inline-flex; align-items: center; justify-content: center;
  width: 36px; height: 36px;
  background: rgba(255, 235, 210, 0.06);
  border: none; border-radius: 8px;
  color: var(--color-text-on-dark);
  font-size: 0.95rem; cursor: pointer;
  transition: background-color 150ms ease;
}
.harbour-close:hover { background: rgba(255, 235, 210, 0.14); }
.harbour-lost {
  padding: 14px; margin: 0 0 16px;
  background: rgba(255, 235, 210, 0.04);
  border: 1px dashed rgba(255, 235, 210, 0.18);
  border-radius: 10px;
  font-size: 0.8125rem;
  color: var(--color-text-on-dark-muted);
}
.harbour-lost p { margin: 0 0 10px; }
.harbour-lost-action { color: var(--color-accent-on-dark); text-decoration: none; font-weight: 600; }
.harbour-lost-action:hover { text-decoration: underline; }
.harbour-pier { margin-bottom: 20px; }
.harbour-pier:last-of-type { margin-bottom: 24px; }
.harbour-pier-label {
  display: flex; align-items: center; gap: 12px;
  margin: 0 0 8px 8px;
  font-size: 0.75rem; font-weight: 600; letter-spacing: 0.04em;
  color: var(--color-accent-on-dark);
  opacity: 0.85;
}
.harbour-pier-label::after { content: ""; flex: 1; height: 1px; background: rgba(255, 235, 210, 0.1); }
.harbour-pier-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 2px; }
.harbour-dock {
  --dock-accent: var(--wv-sienna);
  display: grid; grid-template-columns: 6px 1fr auto;
  align-items: center; gap: 14px;
  min-height: 56px; padding: 10px 12px; border-radius: 10px;
  text-decoration: none; color: var(--color-text-on-dark);
  transition: background-color 150ms ease, transform 220ms ease-out;
}
.harbour-dock:hover { background: rgba(255, 235, 210, 0.045); }
.harbour-dock:active { transform: translateX(2px); }
.harbour-dock-chip {
  width: 4px; align-self: stretch; margin: 8px 0;
  border-radius: 2px; background: var(--dock-accent);
}
.harbour-dock-body { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.harbour-dock-label { font-size: 0.95rem; font-weight: 600; letter-spacing: -0.005em; color: var(--color-text-on-dark); }
.harbour-dock-tagline { font-size: 0.75rem; font-weight: 400; color: var(--color-text-on-dark-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.harbour-dock-trail {
  font-size: 0.6875rem; font-weight: 500; letter-spacing: 0.04em;
  color: var(--color-text-on-dark-muted); opacity: 0.6;
  transition: color 150ms ease, opacity 150ms ease;
}
.harbour-dock:hover .harbour-dock-trail { opacity: 1; color: var(--color-accent-on-dark); }
.harbour-dock.is-docked { background: rgba(255, 235, 210, 0.06); box-shadow: inset 2px 0 0 var(--wv-champagne); }
.harbour-dock.is-docked .harbour-dock-chip { width: 6px; }
.harbour-dock.is-docked .harbour-dock-label { color: var(--wv-champagne); }
.harbour-dock.is-docked .harbour-dock-trail { color: var(--color-accent-on-dark); opacity: 1; font-style: italic; }
.harbour-dock--coming-soon { opacity: 0.38; cursor: default; }
.harbour-dock--coming-soon:hover { background: none; transform: none; }
.harbour-dock--coming-soon .harbour-dock-trail { opacity: 1; }
.harbour-drawer-foot {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  margin-top: auto; padding-top: 16px;
  border-top: 1px solid rgba(255, 235, 210, 0.08);
  font-size: 0.8125rem;
}
.harbour-user { color: var(--color-text-on-dark-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; flex: 1; }
.harbour-drawer-link {
  color: var(--color-text-on-dark); text-decoration: none; font-weight: 500;
  padding: 8px 10px; border-radius: 8px;
  transition: background-color 150ms ease; white-space: nowrap;
}
.harbour-drawer-link[data-accent] { color: var(--color-accent-on-dark); }
.harbour-drawer-link:hover { background: rgba(255, 235, 210, 0.06); }
`;

function findScriptTag(): HTMLScriptElement | null {
  if (document.currentScript instanceof HTMLScriptElement) {
    return document.currentScript;
  }
  return document.querySelector<HTMLScriptElement>(
    'script[src*="harbour-nav-widget"]',
  );
}

function mount(): void {
  if (typeof window === "undefined") return;
  if (window.__wvHarbourNavMounted) return;
  window.__wvHarbourNavMounted = true;

  // inject CSS into <head>
  const style = document.createElement("style");
  style.setAttribute("data-wv-harbour-nav", "");
  style.textContent = HARBOUR_NAV_CSS;
  document.head.appendChild(style);

  // load the shared accessibility widget on every harbour app
  const a11yScript = document.createElement("script");
  a11yScript.src = "https://windedvertigo.com/accessibility-widget.js";
  a11yScript.defer = true;
  document.head.appendChild(a11yScript);

  // push body content below the fixed nav
  const NAV_H = 52; // matches .harbour-topbar height
  document.body.style.paddingTop = `max(${NAV_H}px, calc(${NAV_H}px + env(safe-area-inset-top, 0px)))`;

  // determine current app from script tag attribute
  const script = findScriptTag();
  const appKey = (script?.dataset.app ?? "") as HarbourAppKey;

  // mount at the very top of <body>
  const container = document.createElement("div");
  container.setAttribute("data-wv-harbour-nav-root", "");
  document.body.insertBefore(container, document.body.firstChild);

  const root = createRoot(container);
  root.render(<HarbourNav currentApp={appKey} />);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mount);
} else {
  mount();
}
