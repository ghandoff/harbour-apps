"use client";

/**
 * Scenario client — interactive simulation pre-loaded with
 * elements and connections from a Notion scenario.
 */

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useSimulation } from "@/hooks/use-simulation";
import { PoolCanvas } from "@/components/pool-canvas";
import { ElementPalette } from "@/components/element-palette";
import { SimulationControls } from "@/components/simulation-controls";
import { ElementInspector } from "@/components/element-inspector";
import { ReflectionPrompt } from "@windedvertigo/mirror-log";
import type { Scenario, PaletteItem } from "@/lib/types";

export function ScenarioClient({
  scenario,
  palette,
}: {
  scenario: Scenario;
  palette: PaletteItem[];
}) {
  const { state, dispatch, addElementFromPalette, addConnection } =
    useSimulation();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [, setDraggedItem] = useState<PaletteItem | null>(null);
  const [showReflection, setShowReflection] = useState(false);
  const [hasReflected, setHasReflected] = useState(false);

  // Load scenario on mount
  useEffect(() => {
    dispatch({ type: "LOAD_SCENARIO", scenario });
  }, [dispatch, scenario]);

  const selectedElement =
    state.elements.find((e) => e.id === selectedId) ?? null;

  const shouldOfferReflection =
    !state.playing &&
    state.tick >= 10 &&
    state.elements.length >= 2 &&
    !hasReflected;

  const handleReflectionComplete = useCallback(() => {
    setShowReflection(false);
    setHasReflected(true);
  }, []);

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="wv-header shrink-0">
        <Link href="/" className="wv-header-brand">
          ← tidal.pool
        </Link>
        <span className="text-xs text-[var(--color-text-on-dark-muted)]">
          {scenario.name}
        </span>
      </header>

      {/* Challenge prompt */}
      {scenario.challengePrompt && (
        <div className="shrink-0 px-4 pt-3">
          <div className="p-3 rounded-xl border border-white/10 bg-white/5 text-sm">
            <span className="text-[var(--wv-sienna)] font-semibold text-xs uppercase tracking-wider mr-2">
              challenge
            </span>
            <span className="text-[var(--color-text-on-dark-muted)]">
              {scenario.challengePrompt}
            </span>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="shrink-0 px-4 pt-3">
        <SimulationControls
          playing={state.playing}
          speed={state.speed}
          tick={state.tick}
          elementCount={state.elements.length}
          connectionCount={state.connections.length}
          dispatch={dispatch}
        />
      </div>

      {/* Main area: palette + canvas + inspector */}
      <div className="flex-1 flex min-h-0 px-4 py-3 gap-3">
        <ElementPalette items={palette} onDragStart={setDraggedItem} />

        <PoolCanvas
          elements={state.elements}
          connections={state.connections}
          tick={state.tick}
          dispatch={dispatch}
          selectedElementId={selectedId}
          onSelectElement={setSelectedId}
          paletteItems={palette}
          addElementFromPalette={addElementFromPalette}
          addConnection={addConnection}
        />

        {selectedElement && (
          <ElementInspector
            element={selectedElement}
            connections={state.connections}
            allElements={state.elements}
            dispatch={dispatch}
            onClose={() => setSelectedId(null)}
          />
        )}
      </div>

      {/* Reflection prompt trigger */}
      {shouldOfferReflection && !showReflection && (
        <div className="shrink-0 px-4 pb-3">
          <button
            onClick={() => setShowReflection(true)}
            className="w-full py-3 rounded-xl border border-white/10 bg-white/5 text-sm text-[var(--color-text-on-dark-muted)] hover:text-[var(--color-text-on-dark)] hover:bg-white/10 transition-all"
          >
            pause and reflect — what did you notice?
          </button>
        </div>
      )}

      {/* mirror.log reflection panel */}
      {showReflection && (
        <div className="shrink-0 px-4 pb-4">
          <ReflectionPrompt
            sourceApp="tidal-pool"
            skillsExercised={scenario.skillSlugs}
            sessionSummary={`${scenario.name} — ${state.elements.length} elements, ${state.connections.length} connections, ${state.tick} ticks`}
            onComplete={handleReflectionComplete}
            onSkip={() => {
              setShowReflection(false);
              setHasReflected(true);
            }}
          />
        </div>
      )}

      {/* Skill tags footer */}
      {scenario.skillSlugs.length > 0 && (
        <div className="shrink-0 px-4 pb-3 flex items-center gap-2">
          <span className="text-[10px] text-[var(--color-text-on-dark-muted)] uppercase tracking-wider">
            skills:
          </span>
          {scenario.skillSlugs.map((skill) => (
            <span
              key={skill}
              className="text-[10px] px-2 py-0.5 rounded-full border border-white/10 text-[var(--color-text-on-dark-muted)]"
            >
              {skill.replace(/-/g, " ")}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
