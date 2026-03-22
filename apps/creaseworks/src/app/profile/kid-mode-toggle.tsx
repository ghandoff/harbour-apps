"use client";

/**
 * Kid / grown-up mode toggle — profile page section.
 *
 * Two tappable cards rather than a clinical toggle switch.
 * The active card gets a warm border and subtle glow.
 * Designed so a child can understand and tap it themselves.
 */

import { useMode } from "@/components/ui/mode-provider";
import { haptic } from "@/lib/haptics";

export default function KidModeToggle() {
  const { isKidMode, setMode } = useMode();

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* kid mode card */}
      <button
        type="button"
        onClick={() => { haptic("light"); setMode("kid"); }}
        className="relative rounded-xl border-2 p-4 text-center transition-all"
        style={{
          borderColor: isKidMode
            ? "var(--wv-sienna)"
            : "rgba(39, 50, 72, 0.08)",
          backgroundColor: isKidMode
            ? "rgba(255, 235, 210, 0.4)"
            : "var(--cw-card-bg)",
          boxShadow: isKidMode
            ? "0 2px 12px rgba(203, 120, 88, 0.15)"
            : "none",
        }}
        aria-pressed={isKidMode}
      >
        <span className="block text-3xl mb-2" aria-hidden>
          🧒
        </span>
        <span
          className="block text-sm font-bold"
          style={{ color: isKidMode ? "var(--wv-sienna)" : "var(--cw-text)" }}
        >
          kid mode
        </span>
        <span
          className="block text-xs mt-1"
          style={{ color: "var(--cw-text-muted)" }}
        >
          big buttons, bright colours, playful
        </span>
      </button>

      {/* grown-up mode card */}
      <button
        type="button"
        onClick={() => { haptic("light"); setMode("grownup"); }}
        className="relative rounded-xl border-2 p-4 text-center transition-all"
        style={{
          borderColor: !isKidMode
            ? "var(--wv-cadet)"
            : "rgba(39, 50, 72, 0.08)",
          backgroundColor: !isKidMode
            ? "rgba(39, 50, 72, 0.04)"
            : "var(--cw-card-bg)",
          boxShadow: !isKidMode
            ? "0 2px 12px rgba(39, 50, 72, 0.08)"
            : "none",
        }}
        aria-pressed={!isKidMode}
      >
        <span className="block text-3xl mb-2" aria-hidden>
          👤
        </span>
        <span
          className="block text-sm font-bold"
          style={{ color: !isKidMode ? "var(--wv-cadet)" : "var(--cw-text)" }}
        >
          grown-up mode
        </span>
        <span
          className="block text-xs mt-1"
          style={{ color: "var(--cw-text-muted)" }}
        >
          full detail, compact layout
        </span>
      </button>
    </div>
  );
}
