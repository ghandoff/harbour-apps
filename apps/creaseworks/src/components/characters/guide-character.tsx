"use client";

import { Suspense, useEffect, useState } from "react";
import dynamic from "next/dynamic";

// NEXT_PUBLIC_CW_MASCOT build-time gate — component is a no-op unless the flag is set.
// Add NEXT_PUBLIC_CW_MASCOT=1 to wrangler config (or .env.local for dev) to enable.
const MASCOT_ENABLED = !!process.env.NEXT_PUBLIC_CW_MASCOT;

// Lazy-load the Rive runtime — keeps ~200 KB off the initial bundle.
// ssr: false is required — Rive's canvas API is browser-only.
const RiveCanvas = dynamic(() => import("./guide-character-inner"), { ssr: false });

export function GuideCharacter({
  size = 120,
  className,
}: {
  size?: number;
  className?: string;
}) {
  if (!MASCOT_ENABLED) return null;

  return (
    <Suspense fallback={null}>
      <RiveCanvas size={size} className={className} />
    </Suspense>
  );
}
