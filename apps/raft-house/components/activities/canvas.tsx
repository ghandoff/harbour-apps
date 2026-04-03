"use client";

import { useState, useRef, useCallback } from "react";
import type { CanvasConfig, Participant } from "@/lib/types";

interface Props {
  config: CanvasConfig;
  role: "facilitator" | "participant";
  onSubmit?: (response: unknown) => void;
  responses?: Record<string, unknown>;
  participants?: Record<string, Participant>;
  submitted?: boolean;
}

interface Pin {
  x: number;
  y: number;
  note?: string;
}

const COLORS = [
  "#2dd4bf", "#f472b6", "#facc15", "#818cf8", "#fb923c",
  "#34d399", "#f87171", "#a78bfa", "#38bdf8", "#fbbf24",
];

function pinColor(index: number, total: number): string {
  if (total <= COLORS.length) return COLORS[index % COLORS.length];
  const hue = (index * 360 / total) % 360;
  return `hsl(${hue}, 70%, 50%)`;
}

export function CanvasActivity({
  config,
  role,
  onSubmit,
  responses,
  participants,
  submitted,
}: Props) {
  const [pin, setPin] = useState<Pin | null>(null);
  const [note, setNote] = useState("");
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = Math.round(((e.clientX - rect.left) / rect.width) * config.width);
      const y = Math.round(((e.clientY - rect.top) / rect.height) * config.height);
      setPin({ x, y });
    },
    [config.width, config.height],
  );

  const handleSubmit = () => {
    if (!pin) return;
    const response: Pin = { x: pin.x, y: pin.y };
    if (config.allowNote && note.trim()) {
      response.note = note.trim();
    }
    onSubmit?.(response);
  };

  // convert pin coordinates to percentage for rendering
  const toPercent = (val: number, max: number) => (val / max) * 100;

  const isHueMapped = config.pinColor === "hue-mapped";
  const labelClass = isHueMapped ? "text-white/60 drop-shadow-sm" : "text-[var(--rh-text-muted)]";

  // reusable axis labels block for both participant + facilitator views
  const axisLabels = (
    <>
      {/* endpoint labels — four edges */}
      {config.xLow && (
        <span className={`absolute bottom-1 left-2 text-[10px] tracking-wider ${labelClass}`}>
          {config.xLow}
        </span>
      )}
      {config.xHigh && (
        <span className={`absolute bottom-1 right-2 text-[10px] tracking-wider ${labelClass}`}>
          {config.xHigh}
        </span>
      )}
      {config.yLow && (
        <span className={`absolute bottom-2 left-1 -rotate-90 origin-bottom-left text-[10px] tracking-wider whitespace-nowrap ${labelClass}`}>
          {config.yLow}
        </span>
      )}
      {config.yHigh && (
        <span className={`absolute top-2 left-1 -rotate-90 origin-top-left text-[10px] tracking-wider whitespace-nowrap ${labelClass}`}>
          {config.yHigh}
        </span>
      )}
      {/* centered axis titles (legacy xLabel/yLabel) — only if no endpoints */}
      {config.xLabel && !config.xLow && !config.xHigh && (
        <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-wider ${labelClass}`}>
          {config.xLabel}
        </span>
      )}
      {config.yLabel && !config.yLow && !config.yHigh && (
        <span className={`absolute left-1 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] uppercase tracking-wider origin-center ${labelClass}`}>
          {config.yLabel}
        </span>
      )}
    </>
  );

  // derive color from canvas position when pinColor is "hue-mapped"
  // x = hue (0–360°), y = saturation (top=muted, bottom=vivid)
  const pinColorFromPosition = (px: number, py: number): string => {
    if (config.pinColor !== "hue-mapped") return "var(--rh-cyan)";
    const hue = Math.round((px / config.width) * 360);
    const sat = Math.round((py / config.height) * 100);
    const light = 50; // constant lightness keeps colors readable
    return `hsl(${hue}, ${sat}%, ${light}%)`;
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">{config.prompt}</h3>

      {role === "participant" && !submitted ? (
        <div className="space-y-4">
          {/* interactive canvas */}
          <div
            ref={canvasRef}
            onClick={handleCanvasClick}
            className="relative w-full border border-black/10 rounded-xl cursor-crosshair overflow-hidden select-none"
            style={{
              aspectRatio: `${config.width} / ${config.height}`,
              background: config.pinColor === "hue-mapped"
                ? "linear-gradient(to bottom, rgba(128,128,128,0.9), transparent), linear-gradient(to right, hsl(0,80%,50%), hsl(60,80%,50%), hsl(120,80%,50%), hsl(180,80%,50%), hsl(240,80%,50%), hsl(300,80%,50%), hsl(360,80%,50%))"
                : "white",
            }}
          >
            {axisLabels}

            {/* gridlines — only for non-hue-mapped canvases */}
            {config.pinColor !== "hue-mapped" && (
              <div className="absolute inset-0 opacity-10">
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-black" />
                <div className="absolute top-1/2 left-0 right-0 h-px bg-black" />
              </div>
            )}

            {/* zones */}
            {config.zones?.map((zone) => (
              <div
                key={zone.id}
                className="absolute border border-dashed border-black/15 rounded-lg flex items-center justify-center"
                style={{
                  left: `${toPercent(zone.x, config.width)}%`,
                  top: `${toPercent(zone.y, config.height)}%`,
                  width: `${toPercent(zone.width, config.width)}%`,
                  height: `${toPercent(zone.height, config.height)}%`,
                }}
              >
                <span className="text-[10px] text-[var(--rh-text-muted)] uppercase tracking-wider">
                  {zone.label}
                </span>
              </div>
            ))}

            {/* placed pin */}
            {pin && (
              <div
                className="absolute w-5 h-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-lg z-10"
                style={{
                  left: `${toPercent(pin.x, config.width)}%`,
                  top: `${toPercent(pin.y, config.height)}%`,
                  backgroundColor: pinColorFromPosition(pin.x, pin.y),
                }}
              />
            )}
          </div>

          <p className="text-xs text-[var(--rh-text-muted)] text-center">
            {pin ? "tap again to reposition" : "tap the canvas to place your pin"}
          </p>

          {/* optional note */}
          {config.allowNote && pin && (
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="add a note (optional)..."
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-black/10 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--rh-cyan)]/30"
            />
          )}

          {pin && (
            <button
              onClick={handleSubmit}
              className="w-full py-3 rounded-xl bg-[var(--rh-cyan)] text-white font-semibold hover:bg-[var(--rh-teal)] transition-colors"
            >
              lock in position
            </button>
          )}
        </div>
      ) : role === "participant" && submitted ? (
        <div className="text-center py-6 text-[var(--rh-text-muted)]">
          <p className="text-2xl mb-2">📍</p>
          <p className="text-sm">pin placed — waiting for reveal</p>
        </div>
      ) : (
        /* facilitator view */
        <div className="space-y-4">
          {responses ? (
            <>
              {/* canvas with all pins plotted */}
              <div
                className="relative w-full border border-black/10 rounded-xl overflow-hidden"
                style={{
                  aspectRatio: `${config.width} / ${config.height}`,
                  background: config.pinColor === "hue-mapped"
                    ? "linear-gradient(to bottom, rgba(128,128,128,0.9), transparent), linear-gradient(to right, hsl(0,80%,50%), hsl(60,80%,50%), hsl(120,80%,50%), hsl(180,80%,50%), hsl(240,80%,50%), hsl(300,80%,50%), hsl(360,80%,50%))"
                    : "white",
                }}
              >
                {/* axis labels */}
                {config.xLabel && (
                  <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-wider ${
                    config.pinColor === "hue-mapped" ? "text-white/60 drop-shadow-sm" : "text-[var(--rh-text-muted)]"
                  }`}>
                    {config.xLabel}
                  </span>
                )}
                {config.yLabel && (
                  <span className={`absolute left-1 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] uppercase tracking-wider origin-center ${
                    config.pinColor === "hue-mapped" ? "text-white/60 drop-shadow-sm" : "text-[var(--rh-text-muted)]"
                  }`}>
                    {config.yLabel}
                  </span>
                )}

                {/* gridlines — only for non-hue-mapped canvases */}
                {config.pinColor !== "hue-mapped" && (
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-black" />
                    <div className="absolute top-1/2 left-0 right-0 h-px bg-black" />
                  </div>
                )}

                {/* zones */}
                {config.zones?.map((zone) => (
                  <div
                    key={zone.id}
                    className="absolute border border-dashed border-black/15 rounded-lg flex items-center justify-center"
                    style={{
                      left: `${toPercent(zone.x, config.width)}%`,
                      top: `${toPercent(zone.y, config.height)}%`,
                      width: `${toPercent(zone.width, config.width)}%`,
                      height: `${toPercent(zone.height, config.height)}%`,
                    }}
                  >
                    <span className="text-[10px] text-[var(--rh-text-muted)] uppercase tracking-wider">
                      {zone.label}
                    </span>
                  </div>
                ))}

                {/* all participant pins */}
                {Object.entries(responses).map(([pid, response], i, arr) => {
                  const p = response as Pin;
                  const name =
                    participants?.[pid]?.displayName || `participant ${Object.keys(responses).indexOf(pid) + 1}`;
                  const color = config.pinColor === "hue-mapped"
                    ? pinColorFromPosition(p.x, p.y)
                    : pinColor(i, arr.length);
                  return (
                    <div
                      key={pid}
                      className="absolute -translate-x-1/2 -translate-y-1/2 z-10 group"
                      style={{
                        left: `${toPercent(p.x, config.width)}%`,
                        top: `${toPercent(p.y, config.height)}%`,
                      }}
                    >
                      <div
                        className="w-5 h-5 rounded-full border-2 border-white shadow-lg"
                        style={{ backgroundColor: color }}
                      />
                      <div className="absolute left-6 top-0 whitespace-nowrap bg-white/90 px-1.5 py-0.5 rounded text-[10px] font-medium shadow-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        {name}
                        {p.note && (
                          <span className="block text-[var(--rh-text-muted)] font-normal">
                            {p.note}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* cluster summary */}
              {(() => {
                const pins = Object.values(responses).map((r) => r as Pin);
                if (pins.length < 2) return null;
                const avgX = pins.reduce((s, p) => s + p.x, 0) / pins.length;
                const avgY = pins.reduce((s, p) => s + p.y, 0) / pins.length;
                const spread = Math.sqrt(
                  pins.reduce((s, p) => s + (p.x - avgX) ** 2 + (p.y - avgY) ** 2, 0) / pins.length,
                );
                const maxSpread = Math.sqrt(config.width ** 2 + config.height ** 2) / 2;
                const consensus = 1 - Math.min(spread / maxSpread, 1);
                const consensusLabel =
                  consensus > 0.75 ? "tight consensus" :
                  consensus > 0.5 ? "moderate agreement" :
                  consensus > 0.25 ? "spread out" : "wide disagreement";

                // describe centroid position using endpoint labels
                const xPos = avgX / config.width;
                const yPos = avgY / config.height;
                const xDesc = config.xLow && config.xHigh
                  ? (xPos < 0.33 ? config.xLow : xPos > 0.67 ? config.xHigh : `between ${config.xLow} and ${config.xHigh}`)
                  : null;
                const yDesc = config.yLow && config.yHigh
                  ? (yPos > 0.67 ? config.yLow : yPos < 0.33 ? config.yHigh : `between ${config.yLow} and ${config.yHigh}`)
                  : null;

                return (
                  <div className="p-3 rounded-xl bg-[var(--rh-sand)] border border-black/5 text-sm">
                    <p className="font-medium mb-1">group pattern: {consensusLabel}</p>
                    <p className="text-xs text-[var(--rh-text-muted)]">
                      {xDesc && yDesc
                        ? `the group clusters toward ${xDesc}, ${yDesc}`
                        : `${pins.length} pins placed — ${consensusLabel.toLowerCase()}`}
                    </p>
                  </div>
                );
              })()}

              {/* legend */}
              <div className="flex flex-wrap gap-2">
                {Object.entries(responses).map(([pid, response], i, arr) => {
                  const p = response as Pin;
                  const name =
                    participants?.[pid]?.displayName || `participant ${Object.keys(responses).indexOf(pid) + 1}`;
                  const color = config.pinColor === "hue-mapped"
                    ? pinColorFromPosition(p.x, p.y)
                    : pinColor(i, arr.length);
                  return (
                    <div
                      key={pid}
                      className="flex items-center gap-1.5 text-xs"
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      {name}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <p className="text-sm text-[var(--rh-text-muted)]">
              pins are hidden — click &quot;reveal results&quot; to show the
              map
            </p>
          )}
        </div>
      )}
    </div>
  );
}
