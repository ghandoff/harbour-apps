"use client";

/**
 * ShipyardDock — the interactive Shipwright's Dock storefront.
 *
 * Boats (the apps) float in a harbour bay; click one to pull it to the dock,
 * where its packs appear as upgrades to "bring aboard". Commerce is unchanged:
 * the panel reuses <BuyButton> → /harbour/api/checkout → webhook → entitlement.
 *
 * Server (page.tsx) does all the data work and hands down a plain BoatVM[]; this
 * island only owns the "which boat is docked" selection state.
 */

import { useState, type CSSProperties } from "react";
import Link from "next/link";
import { BoatArt } from "./boat-art";
import { BuyButton } from "./buy-button";
import type { ShopBoat } from "@/lib/shop-boats";

export interface PackVM {
  packCacheId: string;
  title: string;
  price: string | null;
  owned: boolean;
}
export interface BoatVM extends ShopBoat {
  packs: PackVM[];
  recommended: boolean;
  /** collective-only boat, still being built (only staff ever see these) */
  inDevelopment: boolean;
}

export function ShipyardDock({
  boats,
  signedIn,
}: {
  boats: BoatVM[];
  signedIn: boolean;
}) {
  const [sel, setSel] = useState(() => {
    const rec = boats.findIndex((b) => b.recommended);
    return rec >= 0 ? rec : 0;
  });
  const active = boats[sel];
  if (!active) return null;

  return (
    <div className="shipyard">
      <div className="bay">
        <div className="bay-shore" aria-hidden="true" />
        <span className="bay-wave bw1" aria-hidden="true" />
        <span className="bay-wave bw2" aria-hidden="true" />
        <span className="bay-wave bw3" aria-hidden="true" />
        <ul className="bay-boats" role="list">
          {boats.map((b, i) => (
            <li key={b.slug}>
              <button
                type="button"
                className={`bay-boat${i === sel ? " is-docked" : ""}`}
                style={{ ["--accent" as string]: b.accent, animationDelay: `${(i % 4) * 0.55}s` } as CSSProperties}
                onClick={() => setSel(i)}
                aria-pressed={i === sel}
                aria-label={`${b.label} — ${b.tagline}. ${i === sel ? "at the dock" : "bring to the dock"}`}
              >
                <BoatArt boat={b} h={118} />
                <span className="bay-name">{b.label}</span>
                {b.inDevelopment ? (
                  <span className="dev-badge">crew preview</span>
                ) : (
                  b.recommended && <span className="fit-ribbon">a fit for you</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="dock">
        <div className="dock-grid">
          <div className="berth">
            <div className="docked" key={active.slug}>
              <BoatArt boat={active} h={210} />
            </div>
          </div>

          <div className="panel">
            <h2 className="panel-kick">at the dock</h2>
            <div className="panel-boat" style={{ color: active.accent }}>{active.label}</div>
            <p className="panel-tag">{active.tagline} — fit an upgrade to your boat</p>
            {active.inDevelopment && (
              <p className="dev-note">
                ⚓ crew preview — in development, not yet visible to the public.
              </p>
            )}

            {active.packs.length === 0 ? (
              <p className="panel-none">no upgrades for this boat yet — check back soon.</p>
            ) : (
              active.packs.map((p) => (
                <div className="upg" key={p.packCacheId}>
                  <span className="upg-meta">
                    <b>{p.title}</b>
                  </span>
                  {p.owned ? (
                    <span className="fitted">✓ fitted</span>
                  ) : signedIn ? (
                    <>
                      {p.price && <span className="price">{p.price}</span>}
                      <BuyButton packCacheId={p.packCacheId} label="bring aboard" />
                    </>
                  ) : (
                    <>
                      {p.price && <span className="price">{p.price}</span>}
                      <Link className="signin-buy" href="/login?callbackUrl=/shop">
                        sign in to buy →
                      </Link>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
