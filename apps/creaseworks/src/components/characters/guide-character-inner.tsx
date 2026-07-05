"use client";

import { useEffect, useRef, useState } from "react";
import { useRive, Layout, Fit, Alignment } from "@rive-app/react-canvas";

// Placeholder .riv path — swap for the real cord asset once exported from rive.app.
// Real asset should be under 100 KB. Export as "Cord" with state machine "CharacterSM".
const CORD_RIV_PATH = "/harbour/creaseworks/characters/cord.riv";

// Static poster shown when: (a) reduced motion is active, (b) .riv fails to load,
// or (c) the component is hydrating. Swap src for real image once generated.
function CordPoster({ size, className }: { size: number; className?: string }) {
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "var(--color-surface-raised, #e8e4dc)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.5,
        userSelect: "none",
      }}
      aria-label="cord character"
      role="img"
    >
      {/* placeholder until expressions/neutral.png is generated */}
      🪢
    </div>
  );
}

function getReducedMotion(): boolean {
  if (typeof window === "undefined") return true;
  const html = document.documentElement;
  const osReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const appReduced = html.classList.contains("reduce-motion");
  const calmTheme = html.classList.contains("calm-theme");
  const siteStill = "still" in html.dataset;
  return osReduced || appReduced || calmTheme || siteStill;
}

export default function GuideCharacterInner({
  size,
  className,
}: {
  size: number;
  className?: string;
}) {
  const [reduced, setReduced] = useState(true); // safe default until mounted
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    setReduced(getReducedMotion());
    const observer = new MutationObserver(() => setReduced(getReducedMotion()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-still"],
    });
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    mq.addEventListener("change", () => setReduced(getReducedMotion()));
    return () => observer.disconnect();
  }, []);

  const { RiveComponent, rive } = useRive({
    src: CORD_RIV_PATH,
    stateMachines: "CharacterSM",
    layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
    autoplay: !reduced,
    onLoadError: () => setLoadError(true),
  });

  // fire wave-on-load once, 400ms after mount, if motion is enabled
  useEffect(() => {
    if (!rive || reduced) return;
    const t = setTimeout(() => {
      try {
        const inputs = rive.stateMachineInputs("CharacterSM");
        const wave = inputs?.find((i) => i.name === "wave");
        if (wave) wave.fire();
      } catch {
        // placeholder .riv won't have this input — silently ignore
      }
    }, 400);
    return () => clearTimeout(t);
  }, [rive, reduced]);

  if (loadError || reduced) {
    return <CordPoster size={size} className={className} />;
  }

  return (
    <div
      className={className}
      style={{ width: size, height: size }}
      aria-label="cord character"
      role="img"
    >
      <RiveComponent />
    </div>
  );
}
