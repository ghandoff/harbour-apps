/**
 * BoatArt — renders one app as a boat for the Shipwright's Dock.
 *
 * - If the app has bespoke artwork (boat.boatSvg), draw it via <img>.
 * - Otherwise draw a procedural accent-tinted sailboat so the app still reads
 *   as a vessel (swappable later by dropping an SVG into public/harbour-preview/
 *   and setting boatSvg in lib/shop-boats.ts — no layout change).
 *
 * In both cases a flag flies above the boat carrying the app's icon tile — the
 * per-app identity Garrett asked for. Decorative; the surrounding <button> in
 * ShipyardDock carries the accessible label.
 */

import type { ShopBoat } from "@/lib/shop-boats";

export function BoatArt({ boat, h = 150 }: { boat: ShopBoat; h?: number }) {
  return (
    <span className="boat-art" style={{ height: h }}>
      {boat.boatSvg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className="boat-hull"
          src={boat.boatSvg}
          alt=""
          style={{ height: h }}
          draggable={false}
        />
      ) : (
        <ProceduralBoat accent={boat.accent} h={h} />
      )}
      <span className="boat-flag" style={{ ["--flag-accent" as string]: boat.accent }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="boat-flag-icon" src={boat.icon} alt="" draggable={false} />
      </span>
    </span>
  );
}

/** Procedural fallback vessel — a simple sailboat tinted in the app accent. */
function ProceduralBoat({ accent, h }: { accent: string; h: number }) {
  return (
    <svg
      className="boat-hull"
      width={h}
      height={h}
      viewBox="0 0 150 150"
      role="presentation"
    >
      <defs>
        <linearGradient id="ph-hull" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8a5640" />
          <stop offset="1" stopColor="#5a3826" />
        </linearGradient>
      </defs>
      <path d="M75 30 C 104 46, 110 82, 104 100 L75 100 Z" fill="#ffebd2" stroke="rgba(0,0,0,.18)" />
      <path d="M75 34 C 52 50, 48 84, 56 100 L75 100 Z" fill={accent} opacity="0.95" stroke="rgba(0,0,0,.18)" />
      <rect x="73" y="26" width="4" height="76" rx="2" fill="#4a3325" />
      <path d="M34 104 L116 104 L104 126 C100 133 94 136 86 136 L64 136 C56 136 50 133 46 126 Z" fill="url(#ph-hull)" stroke="rgba(0,0,0,.25)" strokeWidth="1.5" />
      <path d="M37 108 L113 108 L110 114 L40 114 Z" fill={accent} opacity="0.92" />
      <path d="M47 128 C62 134 88 134 103 128" fill="none" stroke="rgba(255,255,255,.32)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
