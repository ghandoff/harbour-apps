"use client";

import { useState } from "react";

/**
 * Buy button — POSTs to the harbour storefront checkout and redirects the
 * browser to the returned Stripe Checkout URL. basePath (/harbour) is
 * auto-prepended, so the fetch target is app-relative.
 */
export function BuyButton({
  packCacheId,
  label,
}: {
  packCacheId: string;
  label: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function buy() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ packCacheId }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error || "checkout failed — please try again.");
        setLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("something went wrong — please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={buy}
        disabled={loading}
        className="shrink-0 rounded-lg bg-[var(--wv-champagne)] text-[var(--wv-cadet)] font-semibold text-sm py-2 px-4 hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {loading ? "…" : label}
      </button>
      {error && <p className="text-xs text-red-400 max-w-[12rem] text-right">{error}</p>}
    </div>
  );
}
