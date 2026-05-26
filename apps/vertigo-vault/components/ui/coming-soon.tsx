import React from "react";

/**
 * Shared "coming soon" affordances for vault surfaces that used to sell
 * the Practitioner pack. Practitioner videos aren't produced yet, so
 * every CTA that took money for them has been converted to one of these
 * read-only states ahead of the harbour launch.
 *
 * Three variants:
 *  - <ComingSoonChip>     small inline pill, replaces "upgrade →" links
 *  - <ComingSoonBlock>    full-width block, replaces buy-button card
 *  - <ComingSoonInline>   one-line muted note, for upsell sidebars
 *
 * When videos ship, swap these back to the original Link / PurchaseButton
 * surfaces and remove this file's imports — the conversion is meant to be
 * easy to reverse, not a permanent change.
 */

interface ComingSoonChipProps {
  /** Short label, e.g. "🎬 practitioner pack". Emoji optional. */
  label: string;
  className?: string;
}

export function ComingSoonChip({ label, className = "" }: ComingSoonChipProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wider ${className}`}
      style={{
        backgroundColor: "rgba(255,255,255,0.06)",
        color: "var(--vault-text-muted)",
      }}
      aria-label={`${label} — coming soon`}
    >
      <span>{label}</span>
      <span style={{ opacity: 0.6 }}>· coming soon</span>
    </span>
  );
}

interface ComingSoonBlockProps {
  /** Headline, e.g. "practitioner pack". */
  title: string;
  /** Body copy explaining what's coming and why it's not available yet. */
  description: string;
  /** Optional emoji prefix for the title. */
  emoji?: string;
}

export function ComingSoonBlock({
  title,
  description,
  emoji,
}: ComingSoonBlockProps) {
  return (
    <div
      className="rounded-lg px-5 py-4 text-sm"
      style={{
        backgroundColor: "rgba(255,255,255,0.04)",
        border: "1px dashed rgba(255,255,255,0.12)",
        color: "var(--vault-text-muted)",
      }}
    >
      <div className="flex items-baseline gap-2 mb-1">
        {emoji && <span className="text-base">{emoji}</span>}
        <span
          className="text-sm font-semibold"
          style={{ color: "var(--vault-text)" }}
        >
          {title}
        </span>
        <span
          className="text-xs uppercase tracking-wider"
          style={{ color: "var(--vault-accent)" }}
        >
          coming soon
        </span>
      </div>
      <p className="text-sm leading-relaxed">{description}</p>
    </div>
  );
}

interface ComingSoonInlineProps {
  children: React.ReactNode;
}

export function ComingSoonInline({ children }: ComingSoonInlineProps) {
  return (
    <p
      className="text-xs italic"
      style={{ color: "var(--vault-text-muted)", opacity: 0.7 }}
    >
      {children}
    </p>
  );
}
