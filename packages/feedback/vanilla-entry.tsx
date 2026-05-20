/**
 * Vanilla auto-mount entry for the feedback widget.
 *
 * Built into a single self-contained UMD/IIFE bundle (`dist/feedback-widget.js`)
 * via build-vanilla.mjs. Static-HTML and Vite apps drop in one script tag:
 *
 *   <script
 *     src="https://windedvertigo.com/feedback-widget.js"
 *     data-app-slug="lines-become-loops"
 *     defer
 *   ></script>
 *
 * The bundle:
 *   1. Reads `data-app-slug` from its own script tag.
 *   2. Creates a mount node in <body>.
 *   3. Renders <FeedbackWidget appSlug={slug} endpoint="/harbour/api/feedback" />.
 *
 * The endpoint is hardcoded to the harbour hub's centralised feedback
 * route (createFeedbackHandler("harbour") at apps/harbour/app/api/feedback/route.ts)
 * so static apps don't need to host their own backend.
 *
 * Honours `data-endpoint` on the script tag for overrides.
 */

import { createRoot } from "react-dom/client";
import { FeedbackWidget } from "./feedback-widget";

declare global {
  interface Window {
    __wvFeedbackWidgetMounted?: boolean;
  }
}

const DEFAULT_ENDPOINT = "/harbour/api/feedback";

function findScriptTag(): HTMLScriptElement | null {
  // currentScript is the most reliable way to find ourselves when
  // running synchronously during script execution. With `defer`, we
  // may be running after currentScript is unset — fall back to a
  // querySelector lookup using the bundle's well-known src suffix.
  if (document.currentScript instanceof HTMLScriptElement) {
    return document.currentScript;
  }
  return document.querySelector<HTMLScriptElement>(
    'script[src*="feedback-widget.js"]',
  );
}

function mount(): void {
  if (typeof window === "undefined") return;
  if (window.__wvFeedbackWidgetMounted) return;
  window.__wvFeedbackWidgetMounted = true;

  const script = findScriptTag();
  const appSlug =
    script?.dataset.appSlug ?? document.body?.dataset.appSlug ?? "unknown";
  const endpoint = script?.dataset.endpoint ?? DEFAULT_ENDPOINT;

  if (appSlug === "unknown") {
    console.warn(
      "[feedback-widget] no data-app-slug found on script or <body>; defaulting to 'unknown'",
    );
  }

  // Mount node — appended to <body> so it doesn't disturb existing layout.
  const container = document.createElement("div");
  container.setAttribute("data-wv-feedback-widget", "");
  document.body.appendChild(container);

  const root = createRoot(container);
  root.render(<FeedbackWidget appSlug={appSlug} endpoint={endpoint} />);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mount);
} else {
  mount();
}

// Also expose a manual mount function so consumers can defer or customise
// the bootstrap. window.WvFeedbackWidget.mount({ appSlug, endpoint }) replaces
// the auto-mounted instance.
export function manualMount(opts: { appSlug: string; endpoint?: string }): void {
  // Allow re-mount by removing the auto-instance first.
  const existing = document.querySelector("[data-wv-feedback-widget]");
  if (existing) existing.remove();
  window.__wvFeedbackWidgetMounted = false;

  const container = document.createElement("div");
  container.setAttribute("data-wv-feedback-widget", "");
  document.body.appendChild(container);

  const root = createRoot(container);
  root.render(
    <FeedbackWidget appSlug={opts.appSlug} endpoint={opts.endpoint ?? DEFAULT_ENDPOINT} />,
  );
  window.__wvFeedbackWidgetMounted = true;
}
