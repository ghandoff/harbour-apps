"use client";

/**
 * EmojiTile — big, tappable, child-first selection tile.
 *
 * Square card with a large emoji above a small label.
 * Designed for the "find" phase: celebrating the joy of looking,
 * noticing, and discovering what's around you.
 *
 * Pre-literate friendly: emoji is the primary signifier,
 * label is optional and secondary. 48–112px touch target
 * depending on size. Spring bounce on tap, warm glow when selected.
 *
 * Used by: Room Explorer, Timer Challenge, Scavenger Hunt.
 */

import { useRef, useCallback } from "react";

export type EmojiTileSize = "sm" | "md" | "lg";

export interface EmojiTileProps {
  emoji: string;
  label: string;
  selected: boolean;
  onClick: () => void;
  accentColor?: string;
  size?: EmojiTileSize;
  showLabel?: boolean;
  disabled?: boolean;
  /** optional badge (e.g. "bonus") shown in top-right */
  badge?: string;
  /** optional image URL for custom emoji — replaces the text emoji */
  emojiSrc?: string;
}

const SIZE_CONFIG: Record<EmojiTileSize, {
  tile: number;
  emoji: string;
  label: string;
  gap: number;
  radius: number;
}> = {
  sm: { tile: 72, emoji: "1.5rem", label: "0.6rem", gap: 2, radius: 14 },
  md: { tile: 88, emoji: "2rem", label: "0.65rem", gap: 3, radius: 16 },
  lg: { tile: 108, emoji: "2.5rem", label: "0.7rem", gap: 4, radius: 20 },
};

const SPRING = "cubic-bezier(0.34, 1.56, 0.64, 1)";

export function EmojiTile({
  emoji,
  label,
  selected,
  onClick,
  accentColor = "var(--wv-redwood)",
  size = "md",
  showLabel = true,
  disabled = false,
  badge,
  emojiSrc,
}: EmojiTileProps) {
  const cfg = SIZE_CONFIG[size];
  const tapRef = useRef<HTMLButtonElement>(null);

  /* trigger a one-shot bounce animation class on every tap */
  const handleClick = useCallback(() => {
    if (disabled) return;
    onClick();
    const el = tapRef.current;
    if (!el) return;
    el.classList.remove("emoji-tile-tap");
    // force reflow to restart animation
    void el.offsetWidth;
    el.classList.add("emoji-tile-tap");
  }, [disabled, onClick]);

  return (
    <button
      ref={tapRef}
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={selected}
      className="emoji-tile relative flex flex-col items-center justify-center select-none"
      style={{
        width: cfg.tile,
        minHeight: cfg.tile,
        gap: cfg.gap,
        borderRadius: cfg.radius,
        border: selected
          ? `2.5px solid ${accentColor}`
          : "2px solid rgba(255, 255, 255, 0.1)",
        backgroundColor: selected
          ? `color-mix(in srgb, ${accentColor} 15%, rgba(39, 50, 72, 0.6))`
          : "rgba(255, 255, 255, 0.06)",
        boxShadow: selected
          ? `0 0 0 3px color-mix(in srgb, ${accentColor} 25%, transparent), 0 2px 8px color-mix(in srgb, ${accentColor} 15%, transparent)`
          : "0 1px 4px rgba(0,0,0,0.1)",
        opacity: disabled ? 0.35 : 1,
        cursor: disabled ? "default" : "pointer",
        transition: `all 220ms ${SPRING}`,
        transform: selected ? "scale(1.04)" : "scale(1)",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      {/* badge */}
      {badge && (
        <span
          className="absolute -top-1.5 -right-1.5 rounded-full px-1.5 py-0.5 text-white font-bold leading-none"
          style={{
            fontSize: "0.5rem",
            backgroundColor: accentColor,
            letterSpacing: "0.04em",
          }}
        >
          {badge}
        </span>
      )}

      {/* emoji — the primary signifier (text emoji or custom image) */}
      {emojiSrc ? (
        <img
          src={emojiSrc}
          alt={label}
          className="object-contain"
          style={{
            width: cfg.emoji,
            height: cfg.emoji,
            transition: `transform 220ms ${SPRING}`,
            transform: selected ? "scale(1.15)" : "scale(1)",
            filter: disabled ? "grayscale(0.8)" : "none",
          }}
          aria-hidden="true"
          draggable={false}
        />
      ) : (
        <span
          className="leading-none"
          style={{
            fontSize: cfg.emoji,
            transition: `transform 220ms ${SPRING}`,
            transform: selected ? "scale(1.15)" : "scale(1)",
            filter: disabled ? "grayscale(0.8)" : "none",
          }}
          aria-hidden="true"
        >
          {emoji}
        </span>
      )}

      {/* label — secondary, optional */}
      {showLabel && (
        <span
          className="text-center leading-tight font-medium truncate w-full px-1"
          style={{
            fontSize: cfg.label,
            color: selected ? accentColor : "var(--wv-champagne)",
            opacity: selected ? 1 : 0.55,
            transition: `color 180ms ease, opacity 180ms ease`,
          }}
        >
          {label}
        </span>
      )}

      {/* selected checkmark */}
      {selected && (
        <span
          className="absolute -bottom-1 -right-1 rounded-full flex items-center justify-center"
          style={{
            width: size === "sm" ? 16 : 20,
            height: size === "sm" ? 16 : 20,
            backgroundColor: accentColor,
            color: "var(--wv-white)",
            fontSize: size === "sm" ? "0.55rem" : "0.65rem",
            animation: `tileCheckPop 300ms ${SPRING}`,
            boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
          }}
          aria-hidden="true"
        >
          ✓
        </span>
      )}

      {/* inline keyframes */}
      <style>{`
        @keyframes tileCheckPop {
          from { transform: scale(0); }
          60%  { transform: scale(1.3); }
          to   { transform: scale(1); }
        }
        @keyframes tileTapBounce {
          0%   { transform: scale(1); }
          30%  { transform: scale(1.12); }
          60%  { transform: scale(0.94); }
          100% { transform: scale(1); }
        }
        .emoji-tile-tap {
          animation: tileTapBounce 350ms ${SPRING};
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes tileCheckPop { from, to { transform: scale(1); } }
          @keyframes tileTapBounce { from, to { transform: scale(1); } }
          .emoji-tile-tap { animation: none; }
        }
      `}</style>
    </button>
  );
}
