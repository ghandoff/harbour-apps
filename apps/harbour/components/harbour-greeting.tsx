"use client";

import { useEffect, useState } from "react";

/**
 * Signed-in-aware personalization for the hub hero.
 *
 * The hub renders publicly (SSR/ISR) for SEO; this client component hydrates
 * per-user state after mount by fetching /harbour/api/me — so the cached
 * public HTML is identical for everyone and personalization layers on top.
 *
 * It does two things:
 *  1. renders a greeting in the hero (signed in → "welcome aboard, {name}" +
 *     a link to your harbour; anonymous → a quiet sign-in invite).
 *  2. marks owned boats across the page — any `li[data-harbour-slug]` whose
 *     slug is in `ownedApps` (or all boats, for staff) gets an "in your
 *     harbour" tag. Imperative DOM annotation because the boats are
 *     server-rendered in PierSection.
 */

interface Me {
  signedIn: boolean;
  name?: string | null;
  isStaff?: boolean;
  ownedApps?: string[];
}

export function HarbourGreeting() {
  const [me, setMe] = useState<Me | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/harbour/api/me", { credentials: "include" })
      .then((r) => r.json())
      .then((data: Me) => {
        if (!cancelled) setMe(data);
      })
      .catch(() => {
        /* personalization is best-effort; the public hero already rendered */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Annotate owned boats once we know what the user holds.
  useEffect(() => {
    if (!me?.signedIn) return;
    const owned = new Set(me.ownedApps ?? []);
    const boats = document.querySelectorAll<HTMLElement>("li[data-harbour-slug]");
    boats.forEach((li) => {
      if (li.dataset.harbourMarked) return; // idempotent
      const slug = li.dataset.harbourSlug ?? "";
      if (!(me.isStaff || owned.has(slug))) return;
      li.dataset.harbourMarked = "1";
      const tag = document.createElement("span");
      tag.textContent = "⚓ in your harbour";
      tag.setAttribute("aria-label", "you have access to this");
      tag.style.cssText =
        "position:absolute;top:10px;left:10px;z-index:20;font-size:11px;" +
        "font-weight:600;padding:3px 8px;border-radius:9999px;" +
        "background:var(--wv-champagne);color:var(--wv-cadet);" +
        "box-shadow:0 1px 4px rgba(0,0,0,.3);pointer-events:none;";
      const article = li.querySelector("article");
      if (article) {
        if (getComputedStyle(article).position === "static") {
          article.style.position = "relative";
        }
        article.appendChild(tag);
      }
    });
  }, [me]);

  // Render nothing until hydrated so SSR markup is unaffected.
  if (!me) return null;

  if (me.signedIn) {
    return (
      <p className="text-sm text-[var(--color-text-on-dark-muted)] mb-10">
        {me.name ? `welcome aboard, ${me.name}. ` : "welcome aboard. "}
        <a
          href="/harbour/account"
          className="text-[var(--wv-champagne)] underline-offset-4 hover:underline"
        >
          your harbour →
        </a>
      </p>
    );
  }

  return (
    <p className="text-sm text-[var(--color-text-on-dark-muted)] mb-10">
      <a
        href="/harbour/login"
        className="underline-offset-4 hover:underline"
      >
        sign in to your harbour
      </a>
    </p>
  );
}
