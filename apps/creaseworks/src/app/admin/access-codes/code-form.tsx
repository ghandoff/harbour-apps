"use client";

/**
 * CodeForm — admin UI for creating access codes.
 *
 * Supports all four distribution models:
 *   1. Single campaign code with optional use limit
 *   2. Batch unique single-use codes
 *   3. Time-limited variants of either
 *
 * Pattern follows invite-form.tsx closely.
 */

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

interface Pack {
  id: string;
  slug: string;
  title: string;
}

interface CodeFormProps {
  packs: Pack[];
}

type Mode = "single" | "batch";

export default function CodeForm({ packs }: CodeFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("single");

  // Single mode
  const [codeStr, setCodeStr] = useState("");
  // Batch mode
  const [batchCount, setBatchCount] = useState("25");
  const [prefix, setPrefix] = useState("");

  // Shared
  const [campaign, setCampaign] = useState("");
  const [description, setDescription] = useState("");
  const [maxUses, setMaxUses] = useState<string>("");
  const [expiresInDays, setExpiresInDays] = useState<string>("");
  const [selectedPackIds, setSelectedPackIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const codePreview = useMemo(() => {
    if (mode === "single") {
      return codeStr.trim().toUpperCase() || "—";
    }
    const pfx = prefix.trim().toUpperCase() || (campaign.trim().toUpperCase().slice(0, 6) || "CODE");
    return `${pfx}-XXXX-XXXX (×${batchCount || "N"} unique codes)`;
  }, [mode, codeStr, prefix, batchCount, campaign]);

  function togglePack(packId: string) {
    setSelectedPackIds((prev) => {
      const next = new Set(prev);
      if (next.has(packId)) next.delete(packId);
      else next.add(packId);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!campaign.trim()) {
      setMessage({ type: "error", text: "campaign label is required" });
      return;
    }
    if (selectedPackIds.size === 0) {
      setMessage({ type: "error", text: "select at least one pack to grant" });
      return;
    }
    if (mode === "single" && !codeStr.trim()) {
      setMessage({ type: "error", text: "enter a code string" });
      return;
    }

    setSaving(true);
    setMessage(null);

    const body: Record<string, unknown> = {
      campaign: campaign.trim().toLowerCase(),
      description: description.trim() || undefined,
      packIds: Array.from(selectedPackIds),
      expiresInDays: expiresInDays ? Number(expiresInDays) : null,
    };

    if (mode === "single") {
      body.code = codeStr.trim().toUpperCase();
      body.maxUses = maxUses ? Number(maxUses) : null;
    } else {
      body.batch = true;
      body.count = Number(batchCount) || 25;
      body.prefix = prefix.trim().toUpperCase() || undefined;
    }

    try {
      const res = await fetch("/api/admin/access-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "failed" });
      } else {
        const n = data.created ?? 1;
        setMessage({ type: "success", text: `created ${n} code${n !== 1 ? "s" : ""}` });
        // Reset single-code fields; keep campaign/packs for follow-up codes
        setCodeStr("");
        setBatchCount("25");
        router.refresh();
      }
    } catch {
      setMessage({ type: "error", text: "network error — please try again" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Mode toggle */}
      <div className="flex gap-2">
        {(["single", "batch"] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
              mode === m
                ? "bg-foreground text-background border-foreground"
                : "border-border hover:bg-muted"
            }`}
          >
            {m === "single" ? "single code" : "batch (unique codes)"}
          </button>
        ))}
      </div>

      {/* Code string / batch config */}
      {mode === "single" ? (
        <div>
          <label className="block text-sm font-medium mb-1">code</label>
          <input
            value={codeStr}
            onChange={(e) => setCodeStr(e.target.value.toUpperCase())}
            placeholder="PRME2026"
            className="w-full rounded border border-input bg-background px-3 py-2 text-sm font-mono uppercase"
          />
          <p className="text-xs text-muted-foreground mt-1">
            case-insensitive when redeemed. keep it memorable.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">number of codes</label>
            <input
              type="number"
              min={1}
              max={500}
              value={batchCount}
              onChange={(e) => setBatchCount(e.target.value)}
              className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">prefix (optional)</label>
            <input
              value={prefix}
              onChange={(e) => setPrefix(e.target.value.toUpperCase())}
              placeholder="PRME"
              maxLength={8}
              className="w-full rounded border border-input bg-background px-3 py-2 text-sm font-mono uppercase"
            />
          </div>
          <p className="col-span-2 text-xs text-muted-foreground">
            preview: <span className="font-mono">{codePreview}</span>
          </p>
        </div>
      )}

      {/* Campaign */}
      <div>
        <label className="block text-sm font-medium mb-1">campaign label</label>
        <input
          value={campaign}
          onChange={(e) => setCampaign(e.target.value)}
          placeholder="prme-2026"
          className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
        />
        <p className="text-xs text-muted-foreground mt-1">
          groups codes in analytics. use kebab-case, e.g. prme-2026, conf-london.
        </p>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium mb-1">description (internal note)</label>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="PRME Jan 2026 workshop — 50 seats"
          maxLength={300}
          className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
        />
      </div>

      {/* Limits row */}
      <div className="grid grid-cols-2 gap-3">
        {mode === "single" && (
          <div>
            <label className="block text-sm font-medium mb-1">max uses (optional)</label>
            <input
              type="number"
              min={1}
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              placeholder="50"
              className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">leave blank = unlimited</p>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium mb-1">expires in days (optional)</label>
          <input
            type="number"
            min={1}
            value={expiresInDays}
            onChange={(e) => setExpiresInDays(e.target.value)}
            placeholder="90"
            className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
          />
          <p className="text-xs text-muted-foreground mt-1">leave blank = no expiry</p>
        </div>
      </div>

      {/* Pack selection */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium">packs to grant</label>
          <button
            type="button"
            onClick={() => setSelectedPackIds(new Set(packs.map((p) => p.id)))}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            select all
          </button>
        </div>
        <div className="space-y-1 max-h-48 overflow-y-auto rounded border border-input p-2">
          {packs.map((pack) => (
            <label key={pack.id} className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 px-2 py-1 rounded text-sm">
              <input
                type="checkbox"
                checked={selectedPackIds.has(pack.id)}
                onChange={() => togglePack(pack.id)}
              />
              {pack.title}
            </label>
          ))}
          {packs.length === 0 && (
            <p className="text-xs text-muted-foreground px-2 py-1">no packs available</p>
          )}
        </div>
      </div>

      {message && (
        <p className={`text-sm ${message.type === "success" ? "text-green-600" : "text-red-600"}`}>
          {message.text}
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-md bg-foreground text-background py-2 text-sm font-medium hover:bg-foreground/90 disabled:opacity-50 transition-colors"
      >
        {saving ? "creating…" : mode === "single" ? "create code" : `generate ${batchCount || "N"} codes`}
      </button>
    </form>
  );
}
