"use client";

/**
 * Kid / grown-up mode toggle — profile page section.
 *
 * Consumes ModeProvider context (useMode) so the actual persistence
 * logic (cookie + API + html class) is centralised in mode-provider.tsx.
 * Visual pattern matches the accessibility-prefs ToggleSwitch cards.
 */

import { useMode } from "@/components/ui/mode-provider";

export default function KidModeToggle() {
  const { isKidMode, toggleMode } = useMode();

  return (
    <div
      className="cw-a11y-card rounded-lg border p-4"
      style={{ borderColor: "var(--cw-border)" }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p
            className="text-sm font-medium"
            style={{ color: "var(--cw-text)" }}
          >
            kid mode
          </p>
          <p
            className="text-xs mt-0.5"
            style={{ color: "var(--cw-text-muted)" }}
          >
            simplify the interface with larger buttons, playful icons, and
            fewer words. perfect for younger learners exploring on their own.
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={isKidMode}
          aria-label="toggle kid mode"
          onClick={toggleMode}
          className="flex-shrink-0 relative rounded-full transition-colors duration-200"
          style={{
            width: 44,
            height: 24,
            backgroundColor: isKidMode
              ? "var(--wv-redwood)"
              : "var(--cw-toggle-off)",
          }}
        >
          <span
            className="block rounded-full bg-white shadow-sm transition-transform duration-200"
            style={{
              width: 20,
              height: 20,
              marginTop: 2,
              marginLeft: 2,
              transform: isKidMode ? "translateX(20px)" : "translateX(0)",
            }}
          />
        </button>
      </div>
    </div>
  );
}
