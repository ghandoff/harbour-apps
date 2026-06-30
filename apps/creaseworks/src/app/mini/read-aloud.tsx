"use client";

/**
 * ReadAloud — renders a read-aloud / instruction string so that any ordered
 * sequence inside it starts on its own line.
 *
 * A "round 1 … round 2 … round 3 …" instruction written as one inline
 * paragraph hides the fact that there's an order to follow; breaking each
 * step onto its own line (and bolding the "round 1:" marker) makes the
 * sequence legible. Plain prose with no markers renders unchanged as a
 * single paragraph — no visual regression.
 *
 * Emits bare <p> elements so it inherits the host container's font
 * (mini-make-steps / mini-show-reflect / guc-readaloud) and only sets
 * margins + the marker weight inline, avoiding any stylesheet bleed.
 */

// break BEFORE an ordinal marker: "round 1:" / "step two -" / "phase 3." / "1)" / "2."
const SPLIT =
  /(?=(?:round|step|phase|part)\s+[\w-]+\s*[:.)\-]|\b\d+[.)]\s)/i;
// the leading marker of a step, to bold it
const PREFIX =
  /^((?:round|step|phase|part)\s+[\w-]+\s*[:.)\-]|\d+[.)])\s*/i;

/** Split a read-aloud string into a lead-in + ordered steps. */
export function splitSequence(text: string): string[] {
  const out: string[] = [];
  for (const line of text.split(/\n+/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    for (const part of trimmed.split(SPLIT)) {
      const p = part.trim();
      if (p) out.push(p);
    }
  }
  return out;
}

export function ReadAloud({ text }: { text: string }) {
  const segs = splitSequence(text);

  // no sequence → one paragraph, unchanged
  if (segs.length <= 1) return <p style={{ margin: 0 }}>{text}</p>;

  return (
    <>
      {segs.map((seg, i) => {
        const isLast = i === segs.length - 1;
        const margin = i === 0 ? "0 0 8px" : isLast ? "0" : "0 0 6px";
        const m = seg.match(PREFIX);
        if (m) {
          return (
            <p key={i} style={{ margin }}>
              <strong style={{ fontWeight: 800, display: "inline" }}>{m[1]}</strong>{" "}
              {seg.slice(m[0].length)}
            </p>
          );
        }
        return (
          <p key={i} style={{ margin }}>
            {seg}
          </p>
        );
      })}
    </>
  );
}
