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
      // NB: fetch() does NOT get Next's basePath auto-prepend (only Link/
      // router/redirect do) — so the /harbour prefix is explicit here, matching
      // the convention in profile-form.tsx etc.
      const res = await fetch("/harbour/api/checkout", {
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
    <div className="flex flex-col items-start gap-1">
      <button
        onClick={buy}
        disabled={loading}
        className="inline-flex items-center gap-2 shrink-0 rounded-full bg-[var(--wv-sienna)] text-[var(--color-text-on-dark)] font-semibold text-sm py-1.5 px-3.5 border border-white/10 hover:brightness-110 transition-all disabled:opacity-50"
      >
        {loading ? "casting off…" : label}
        {!loading && <span aria-hidden="true">&rarr;</span>}
      </button>
      {error && <p className="text-xs text-red-400 max-w-[12rem]">{error}</p>}
    </div>
  );
}
