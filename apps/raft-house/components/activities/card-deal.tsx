"use client";

import { useState, useMemo } from "react";
import type { CardDealConfig, Participant } from "@/lib/types";

interface Props {
  config: CardDealConfig;
  role: "facilitator" | "participant";
  onSubmit?: (response: unknown) => void;
  responses?: Record<string, unknown>;
  participants?: Record<string, Participant>;
  submitted?: boolean;
}

/**
 * Card-deal activity — distinct from puzzle in semantics, not surface UX.
 *
 * Puzzle:    drag pieces into THE correct order, scored against `solution`.
 * Card-deal: draft + arrange in YOUR order. The arrangement IS the response.
 *
 * Implementation:
 *   - Tap a card in the deck → it moves to the next available slot in the sequence.
 *   - Tap a card in the sequence → it returns to the deck (undo).
 *   - When the sequence has the required count (default: all cards), the
 *     participant can lock in. Optional written reflection accompanies the
 *     arrangement; if `config.reflectionPrompt` is set, the reflection is
 *     required before submit.
 *   - Touch-first UX — no native drag-and-drop, since DnD across mobile
 *     browsers is inconsistent and our participants are explicitly on phones
 *     (DisplayMode "screenless" is the default).
 *
 * Response shape: { order: string[]; reflection?: string }
 *   - order: card IDs in the participant's chosen sequence
 *   - reflection: free text (present only if config.reflectionPrompt was set)
 */
export function CardDealActivity({
  config,
  role,
  onSubmit,
  responses,
  participants,
  submitted,
}: Props) {
  const targetCount = config.selectCount ?? config.cards.length;
  const sequenceLabel = config.sequenceLabel ?? "your sequence";
  const requiresReflection = Boolean(config.reflectionPrompt);

  const [order, setOrder] = useState<string[]>([]);
  const [reflection, setReflection] = useState("");

  // O(1) lookup for cards-by-id during render
  const cardsById = useMemo(() => {
    const m = new Map<string, (typeof config.cards)[number]>();
    for (const c of config.cards) m.set(c.id, c);
    return m;
  }, [config.cards]);

  const draftedSet = new Set(order);
  const deck = config.cards.filter((c) => !draftedSet.has(c.id));
  const sequenceFull = order.length >= targetCount;
  const canSubmit =
    sequenceFull && (!requiresReflection || reflection.trim().length > 0);

  const onDraft = (id: string) => {
    if (order.length >= targetCount) return;
    setOrder((prev) => [...prev, id]);
  };

  const onReturn = (id: string) => {
    setOrder((prev) => prev.filter((x) => x !== id));
  };

  const onReorderUp = (id: string) => {
    setOrder((prev) => {
      const i = prev.indexOf(id);
      if (i <= 0) return prev;
      const next = [...prev];
      [next[i - 1], next[i]] = [next[i], next[i - 1]];
      return next;
    });
  };

  const onReorderDown = (id: string) => {
    setOrder((prev) => {
      const i = prev.indexOf(id);
      if (i < 0 || i >= prev.length - 1) return prev;
      const next = [...prev];
      [next[i], next[i + 1]] = [next[i + 1], next[i]];
      return next;
    });
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit?.({
      order,
      ...(requiresReflection ? { reflection: reflection.trim() } : {}),
    });
  };

  // ── participant — not yet submitted ──────────────────────────────
  if (role === "participant" && !submitted) {
    return (
      <div>
        <h3 className="text-lg font-semibold mb-4">{config.prompt}</h3>

        {/* the arranged sequence */}
        <div className="mb-5">
          <p className="text-xs font-medium text-[var(--rh-text-muted)] uppercase tracking-wider mb-2">
            {sequenceLabel} ({order.length}/{targetCount})
          </p>
          {order.length === 0 ? (
            <div className="px-4 py-6 rounded-xl border-2 border-dashed border-black/10 text-sm text-[var(--rh-text-muted)] text-center italic">
              tap a card below to start
            </div>
          ) : (
            <ol className="space-y-1.5">
              {order.map((id, i) => {
                const card = cardsById.get(id);
                if (!card) return null;
                return (
                  <li
                    key={id}
                    className="px-3 py-2.5 rounded-xl bg-[var(--rh-teal)] text-white flex items-center gap-2"
                  >
                    <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {i + 1}
                    </span>
                    <span className="flex-1 text-sm">{card.content}</span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => onReorderUp(id)}
                        disabled={i === 0}
                        className="w-7 h-7 rounded-md bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-sm leading-none"
                        aria-label="move up"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => onReorderDown(id)}
                        disabled={i === order.length - 1}
                        className="w-7 h-7 rounded-md bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-sm leading-none"
                        aria-label="move down"
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => onReturn(id)}
                        className="w-7 h-7 rounded-md bg-white/10 hover:bg-white/20 text-sm leading-none"
                        aria-label="return to deck"
                      >
                        ×
                      </button>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        {/* the deck */}
        {deck.length > 0 && (
          <div className="mb-5">
            <p className="text-xs font-medium text-[var(--rh-text-muted)] uppercase tracking-wider mb-2">
              deck ({deck.length} remaining)
            </p>
            <div className="space-y-1.5">
              {deck.map((card) => (
                <button
                  key={card.id}
                  onClick={() => onDraft(card.id)}
                  disabled={sequenceFull}
                  className="w-full text-left px-4 py-2.5 rounded-xl border border-black/10 bg-white text-sm hover:border-[var(--rh-cyan)]/30 hover:bg-[var(--rh-cyan)]/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <p>{card.content}</p>
                  {card.hint && (
                    <p className="text-xs text-[var(--rh-text-muted)] mt-1 italic">
                      {card.hint}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* optional reflection */}
        {requiresReflection && (
          <div className="mb-5">
            <label className="block text-xs font-medium text-[var(--rh-text-muted)] uppercase tracking-wider mb-2">
              {config.reflectionPrompt}
            </label>
            <textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-xl border border-black/10 bg-white text-sm focus:outline-none focus:border-[var(--rh-cyan)]/50"
              placeholder="why this order?"
            />
          </div>
        )}

        {/* submit + reset */}
        <div className="flex gap-3 items-center">
          {canSubmit ? (
            <button
              onClick={handleSubmit}
              className="flex-1 py-3 rounded-xl bg-[var(--rh-cyan)] text-white font-semibold hover:bg-[var(--rh-teal)] transition-colors"
            >
              lock in your sequence
            </button>
          ) : (
            <span className="flex-1 text-xs text-[var(--rh-text-muted)] italic">
              {!sequenceFull
                ? `arrange ${targetCount - order.length} more`
                : requiresReflection
                  ? "write a reflection to lock in"
                  : ""}
            </span>
          )}
          {order.length > 0 && (
            <button
              onClick={() => {
                setOrder([]);
                setReflection("");
              }}
              className="text-xs text-[var(--rh-text-muted)] hover:text-[var(--rh-text)] transition-colors"
            >
              start over
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── participant — already submitted ──────────────────────────────
  if (role === "participant" && submitted) {
    return (
      <div className="text-center py-6 text-[var(--rh-text-muted)]">
        <p className="text-2xl mb-2">🃏</p>
        <p className="text-sm">arrangement locked in — waiting for reveal</p>
      </div>
    );
  }

  // ── facilitator view ─────────────────────────────────────────────
  // Card-deal has NO solution — there's nothing to grade against. Each
  // participant's submission is its own valid response. We render them
  // side-by-side so the facilitator can spark discussion about the
  // different narrative schemas that emerged.
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{config.prompt}</h3>
      {responses ? (
        <div className="space-y-3">
          {Object.entries(responses).map(([pid, response]) => {
            const r = response as { order?: string[]; reflection?: string };
            const ordered = Array.isArray(r.order)
              ? r.order.map((id) => cardsById.get(id)).filter(Boolean)
              : [];
            const displayName =
              participants?.[pid]?.displayName ||
              `participant ${Object.keys(responses).indexOf(pid) + 1}`;
            return (
              <div
                key={pid}
                className="p-4 rounded-xl bg-[var(--rh-sand-light)] border border-black/5"
              >
                <p className="text-xs font-medium text-[var(--rh-text-muted)] uppercase tracking-wider mb-2">
                  {displayName}
                </p>
                {ordered.length > 0 ? (
                  <ol className="space-y-1 mb-2">
                    {ordered.map((card, i) => (
                      <li
                        key={card!.id}
                        className="text-sm flex items-baseline gap-2"
                      >
                        <span className="text-xs font-semibold text-[var(--rh-cyan)] flex-shrink-0">
                          {i + 1}.
                        </span>
                        <span>{card!.content}</span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-sm italic text-[var(--rh-text-muted)]">
                    no arrangement
                  </p>
                )}
                {r.reflection && (
                  <div className="mt-2 pt-2 border-t border-black/5">
                    <p className="text-xs uppercase tracking-wider text-[var(--rh-text-muted)] mb-1">
                      reflection
                    </p>
                    <p className="text-sm italic">&ldquo;{r.reflection}&rdquo;</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-[var(--rh-text-muted)]">
          arrangements are hidden — click &quot;reveal results&quot; to show
        </p>
      )}
    </div>
  );
}
