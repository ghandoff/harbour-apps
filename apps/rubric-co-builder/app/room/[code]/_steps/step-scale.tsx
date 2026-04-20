"use client";

import { useMemo, useState } from "react";
import type { Criterion, Scale } from "@/lib/types";
import { SCALE_LEVELS } from "@/lib/types";
import { apiPath } from "@/lib/paths";

type Props = {
  code: string;
  criteria: Criterion[];
  scales: Scale[];
  canEdit: boolean;
};

export function StepScale({ code, criteria, scales, canEdit }: Props) {
  const selected = useMemo(
    () => criteria.filter((c) => c.status === "selected").sort((a, b) => a.position - b.position),
    [criteria],
  );

  return (
    <div className="space-y-8">
      <header className="max-w-3xl space-y-3">
        <h1 className="text-3xl font-bold">write the scale.</h1>
        <p className="text-[color:var(--color-cadet)]/85 leading-relaxed">
          four levels for each criterion — novice, emerging, proficient, advanced. the
          placeholders are deliberately weak. tighten them in your own words. edits
          auto-save.
        </p>
      </header>

      <div className="space-y-6">
        {selected.map((c) => (
          <ScaleBlock
            key={c.id}
            code={code}
            criterion={c}
            scales={scales.filter((s) => s.criterion_id === c.id)}
            canEdit={canEdit}
          />
        ))}
        {selected.length === 0 ? (
          <p className="text-[color:var(--color-cadet)]/60">
            no criteria selected yet. the host needs to tally votes before this step
            has anything to show.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function ScaleBlock({
  code,
  criterion,
  scales,
  canEdit,
}: {
  code: string;
  criterion: Criterion;
  scales: Scale[];
  canEdit: boolean;
}) {
  return (
    <section className="rounded-lg border border-[color:var(--color-cadet)]/15 bg-white p-5">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-[color:var(--color-cadet)]">
          {criterion.name}
        </h2>
        {criterion.good_description ? (
          <p className="text-sm text-[color:var(--color-cadet)]/70 leading-relaxed">
            {criterion.good_description}
          </p>
        ) : null}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {SCALE_LEVELS.map(({ level, label }) => {
          const scale = scales.find((s) => s.level === level);
          return (
            <ScaleCell
              key={level}
              code={code}
              criterionId={criterion.id}
              level={level}
              label={label}
              initial={scale?.descriptor ?? ""}
              canEdit={canEdit}
            />
          );
        })}
      </div>
    </section>
  );
}

function ScaleCell({
  code,
  criterionId,
  level,
  label,
  initial,
  canEdit,
}: {
  code: string;
  criterionId: string;
  level: 1 | 2 | 3 | 4;
  label: string;
  initial: string;
  canEdit: boolean;
}) {
  const [value, setValue] = useState(initial);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!canEdit) return;
    if (value === initial) return;
    setSaving(true);
    try {
      await fetch(apiPath(`/api/rooms/${code}/scales`), {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          criterion_id: criterionId,
          level,
          descriptor: value,
        }),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded bg-[color:var(--color-champagne)]/40 p-3 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] tracking-wider text-[color:var(--color-cadet)]/60">
          {level} · {label}
        </p>
        {saving ? (
          <span className="text-[10px] text-[color:var(--color-cadet)]/50">saving…</span>
        ) : null}
      </div>
      {canEdit ? (
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={save}
          rows={5}
          maxLength={600}
          className="w-full text-sm leading-relaxed bg-white rounded p-2 border border-transparent focus:border-[color:var(--color-cadet)]/30 focus:outline-none resize-none"
        />
      ) : (
        <p className="text-sm leading-relaxed whitespace-pre-wrap text-[color:var(--color-cadet)]/85">
          {value || <span className="opacity-50">—</span>}
        </p>
      )}
    </div>
  );
}
