"use client";

import { useEffect, useRef, useState } from "react";
import type {
  AiUseVote,
  PledgeSlot,
  PledgeSlotIndex,
} from "@/lib/types";
import { PLEDGE_SLOTS } from "@/lib/types";
import { apiPath } from "@/lib/paths";
import { computeCeiling, levelMeta } from "@/lib/ai-contract";

type Props = {
  code: string;
  slots: PledgeSlot[];
  votes: AiUseVote[];
  canEdit: boolean;
};

export function StepPledge({ code, slots, votes, canEdit }: Props) {
  const { ceiling } = computeCeiling(votes);
  const rung = levelMeta(ceiling);

  return (
    <div className="space-y-6">
      <header className="space-y-3 max-w-3xl">
        <p className="text-xs tracking-widest text-[color:var(--color-cadet)]/70">
          step 5.5b — integrity pledge
        </p>
        <div className="inline-flex items-center gap-2 rounded-full bg-[color:var(--color-cadet)] text-white px-4 py-2 text-sm">
          <span className="font-bold">ceiling · level {ceiling}</span>
          <span className="opacity-80">— {rung.name}</span>
        </div>
        <h1 className="text-3xl font-bold">write the pledge.</h1>
        <p className="text-[color:var(--color-cadet)]/85 leading-relaxed">
          four slots. fill them in your own words. edits auto-save and sync to everyone
          in the room. the ceiling above is the lid — nothing in the pledge can push past it.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PLEDGE_SLOTS.map((meta) => {
          const slot =
            slots.find((s) => s.slot_index === meta.index) ??
            ({
              id: `pending-${meta.index}`,
              room_id: "",
              slot_index: meta.index,
              content: "",
              updated_at: "",
            } satisfies PledgeSlot);
          return (
            <PledgeSlotCard
              key={meta.index}
              code={code}
              index={meta.index}
              label={meta.label}
              placeholder={meta.placeholder}
              initial={slot.content}
              canEdit={canEdit}
            />
          );
        })}
      </div>
    </div>
  );
}

function PledgeSlotCard({
  code,
  index,
  label,
  placeholder,
  initial,
  canEdit,
}: {
  code: string;
  index: PledgeSlotIndex;
  label: string;
  placeholder: string;
  initial: string;
  canEdit: boolean;
}) {
  const [value, setValue] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const lastSent = useRef(initial);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // if remote content changes and we haven't diverged locally, sync
  useEffect(() => {
    if (value === lastSent.current && initial !== value) {
      setValue(initial);
      lastSent.current = initial;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial]);

  function schedule(next: string) {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      if (!canEdit || next === lastSent.current) return;
      setSaving(true);
      try {
        await fetch(apiPath(`/api/rooms/${code}/pledge`), {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ slot_index: index, content: next }),
        });
        lastSent.current = next;
        setSavedAt(new Date().toISOString());
      } finally {
        setSaving(false);
      }
    }, 500);
  }

  return (
    <div className="rounded-lg bg-white border border-[color:var(--color-cadet)]/15 p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label
          htmlFor={`slot-${index}`}
          className="text-sm font-semibold text-[color:var(--color-cadet)]"
        >
          {label}
        </label>
        <span className="text-[10px] text-[color:var(--color-cadet)]/50">
          {saving ? "saving…" : savedAt ? "saved" : "auto-saves"}
        </span>
      </div>
      {canEdit ? (
        <textarea
          id={`slot-${index}`}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            schedule(e.target.value);
          }}
          rows={4}
          maxLength={800}
          placeholder={placeholder}
          className="w-full bg-[color:var(--color-champagne)]/40 rounded p-3 text-sm leading-relaxed placeholder:text-[color:var(--color-cadet)]/40 focus:bg-white focus:outline-none border border-transparent focus:border-[color:var(--color-cadet)]/30 resize-none"
        />
      ) : (
        <p className="bg-[color:var(--color-champagne)]/40 rounded p-3 text-sm leading-relaxed text-[color:var(--color-cadet)]/85 min-h-[5rem] whitespace-pre-wrap">
          {value || <span className="opacity-40">{placeholder}</span>}
        </p>
      )}
    </div>
  );
}
