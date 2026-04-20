"use client";

import { useState } from "react";
import type { Criterion } from "@/lib/types";
import { apiPath } from "@/lib/paths";

type Props = {
  code: string;
  criteria: Criterion[];
  canEdit: boolean;
};

export function StepPropose({ code, criteria, canEdit }: Props) {
  const [name, setName] = useState("");
  const [good, setGood] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(apiPath(`/api/rooms/${code}/criteria`), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, good_description: good }),
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(d?.error ?? "something wobbled. try again?");
      } else {
        setName("");
        setGood("");
      }
    } catch {
      setError("the network blinked.");
    } finally {
      setSubmitting(false);
    }
  }

  async function remove(id: string) {
    if (!canEdit) return;
    await fetch(apiPath(`/api/rooms/${code}/criteria/${id}`), { method: "DELETE" });
  }

  async function rename(id: string, nextName: string) {
    if (!canEdit) return;
    await fetch(apiPath(`/api/rooms/${code}/criteria/${id}`), {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: nextName }),
    });
  }

  async function editGood(id: string, nextGood: string) {
    if (!canEdit) return;
    await fetch(apiPath(`/api/rooms/${code}/criteria/${id}`), {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ good_description: nextGood }),
    });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-8">
      <aside className="space-y-5">
        <h1 className="text-3xl font-bold">propose a criterion.</h1>
        <p className="text-[color:var(--color-cadet)]/85 leading-relaxed">
          what should count? write a one-word (ish) name and, if you can, one line on
          what good looks like. every card is anonymous. delete or rename anything
          already on the board — seeds included.
        </p>

        {canEdit ? (
          <form onSubmit={submit} className="space-y-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={120}
              placeholder="criterion name"
              className="w-full rounded-lg border border-[color:var(--color-cadet)]/20 bg-white px-4 py-3 placeholder:text-[color:var(--color-cadet)]/40 focus:border-[color:var(--color-cadet)] focus:outline-none"
            />
            <textarea
              value={good}
              onChange={(e) => setGood(e.target.value)}
              maxLength={500}
              rows={2}
              placeholder="what good looks like (optional, one line)"
              className="w-full rounded-lg border border-[color:var(--color-cadet)]/20 bg-white px-4 py-3 text-sm leading-relaxed placeholder:text-[color:var(--color-cadet)]/40 focus:border-[color:var(--color-cadet)] focus:outline-none"
            />
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="btn-primary text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? "adding…" : "add to the board"}
            </button>
            {error ? (
              <p className="text-xs text-[color:var(--color-redwood)]">{error}</p>
            ) : null}
          </form>
        ) : (
          <p className="text-sm text-[color:var(--color-cadet)]/60 rounded border border-dashed border-[color:var(--color-cadet)]/20 p-4">
            you&apos;re watching. the host view is read-only.
          </p>
        )}

        <p className="text-xs text-[color:var(--color-cadet)]/60">
          the board has {criteria.length} criteri{criteria.length === 1 ? "on" : "a"} so far.
        </p>
      </aside>

      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {criteria.map((c) => (
            <CriterionCard
              key={c.id}
              criterion={c}
              canEdit={canEdit}
              onRemove={() => remove(c.id)}
              onRename={(v) => rename(c.id, v)}
              onEditGood={(v) => editGood(c.id, v)}
            />
          ))}
          {criteria.length === 0 ? (
            <p className="text-[color:var(--color-cadet)]/60 col-span-full p-8 text-center border-2 border-dashed border-[color:var(--color-cadet)]/15 rounded-lg">
              no criteria yet. what would your group want to be graded on?
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function CriterionCard({
  criterion,
  canEdit,
  onRemove,
  onRename,
  onEditGood,
}: {
  criterion: Criterion;
  canEdit: boolean;
  onRemove: () => void;
  onRename: (next: string) => void;
  onEditGood: (next: string) => void;
}) {
  const [name, setName] = useState(criterion.name);
  const [good, setGood] = useState(criterion.good_description ?? "");

  const isProposed = criterion.source === "proposed";
  const needsFailure = isProposed && !criterion.failure_description;

  return (
    <div
      className={`rounded-lg p-4 space-y-2 bg-white ${
        needsFailure
          ? "border-2 border-[color:var(--color-redwood)]/60"
          : "border border-[color:var(--color-cadet)]/15"
      }`}
    >
      <div className="flex items-start gap-2">
        {canEdit ? (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => {
              if (name.trim() && name !== criterion.name) onRename(name.trim());
            }}
            className="flex-1 font-semibold text-[color:var(--color-cadet)] bg-transparent border-b border-transparent focus:border-[color:var(--color-cadet)]/30 focus:outline-none"
          />
        ) : (
          <p className="flex-1 font-semibold">{criterion.name}</p>
        )}
        {criterion.required ? (
          <span className="text-[10px] uppercase tracking-wider bg-[color:var(--color-cadet)] text-white rounded px-2 py-0.5 mt-1 shrink-0">
            required
          </span>
        ) : null}
        {canEdit ? (
          <button
            onClick={onRemove}
            aria-label={`remove ${criterion.name}`}
            className="text-xs text-[color:var(--color-redwood)]/80 hover:text-[color:var(--color-redwood)] shrink-0"
          >
            remove
          </button>
        ) : null}
      </div>
      {canEdit ? (
        <textarea
          value={good}
          onChange={(e) => setGood(e.target.value)}
          onBlur={() => {
            if (good !== (criterion.good_description ?? "")) onEditGood(good);
          }}
          rows={2}
          placeholder="what good looks like"
          className="w-full text-sm leading-relaxed bg-transparent resize-none border border-transparent rounded px-2 py-1 focus:border-[color:var(--color-cadet)]/20 focus:outline-none focus:bg-[color:var(--color-champagne)]/30"
        />
      ) : (
        <p className="text-sm leading-relaxed text-[color:var(--color-cadet)]/80">
          {criterion.good_description ?? <span className="opacity-50">—</span>}
        </p>
      )}
      <p className="text-[10px] uppercase tracking-wider text-[color:var(--color-cadet)]/50">
        {criterion.source}
      </p>
    </div>
  );
}
