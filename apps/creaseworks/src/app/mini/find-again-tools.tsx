"use client";

/**
 * FindAgainDoors — the "find again" ending (P0.5). Replaces the single
 * "see the wall" done-card with a prize + two doors + a quiet exit.
 *
 * The arc is a REVERSAL: you unfolded a thing, now you fold it back into the
 * next question. So the ending isn't a finish line — it's a door:
 *   • same stuff, new job — keep the found materials, re-open fold, respin the
 *     wheel (the make page keeps the found set + playdate),
 *   • where this leads — the chain: launch the recommended next playdate,
 *     carrying the materials over (a one-shot hand-off the make page honours),
 *   • done for today — a calm exit to the wall.
 *
 * Every door is optional; each logs one ending_choice (family-code-keyed, no
 * child identity). Nothing here renders a score, a streak, or a verdict.
 */

import { useRouter } from "next/navigation";
import { MINI_ACTIVITY_EXTRAS } from "@/lib/mini-data";
import { MINI_ACTIVITIES, miniHref, saveChainTarget } from "@/lib/mini-pilot";
import { miniTrace } from "@/lib/cw-mini-trace";

export function FindAgainDoors({ slug, photoUrl }: { slug: string | null; photoUrl: string | null }) {
  const router = useRouter();
  const chain = (slug && MINI_ACTIVITY_EXTRAS[slug]?.chain) || null;
  const chainTitle = chain
    ? MINI_ACTIVITIES.find((a) => a.slug === chain.toSlug)?.title ?? null
    : null;

  const sameStuff = () => {
    miniTrace("ending_choice", { playdate_slug: slug, choice: "same-stuff-new-job" });
    // found materials + the chosen playdate already persist → make re-opens fold
    // with a fresh wheel spin.
    router.push(miniHref("/make"));
  };

  const whereLeads = () => {
    if (!chain) return;
    miniTrace("ending_choice", { playdate_slug: slug, choice: "where-this-leads", to: chain.toSlug });
    saveChainTarget(chain.toSlug); // make reads-and-clears this on mount
    router.push(miniHref("/make"));
  };

  const doneForToday = () => {
    miniTrace("ending_choice", { playdate_slug: slug, choice: "done" });
    router.push(miniHref("/wow"));
  };

  return (
    <div className="mini-again">
      <style>{`
        .mini-again { display: flex; flex-direction: column; gap: 16px; }
        .mini-again-prize {
          background: var(--wv-white); border: 2.5px solid var(--wv-sun, #ffd166);
          border-radius: 24px 30px 22px 28px; padding: 18px; text-align: center;
        }
        .mini-again-photo {
          width: 100%; max-height: 260px; object-fit: cover; display: block;
          border-radius: 16px 20px 14px 18px; margin-bottom: 12px;
        }
        .mini-again-prize-h {
          font-family: var(--font-fraunces), serif; font-weight: 600; font-size: 24px;
          color: var(--wv-cadet); margin-bottom: 6px; line-height: 1.15;
        }
        .mini-again-prize-sub {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 700; font-size: 14px; color: #4b5563; line-height: 1.5;
        }
        .mini-again-q {
          font-family: var(--font-fraunces), serif; font-weight: 600; font-size: 20px;
          color: var(--wv-white); margin: 2px 0 -4px;
        }
        .mini-again-doors { display: flex; flex-direction: column; gap: 12px; }
        button.mini-again-door:not([type="submit"]):not(.wv-header-signout) {
          text-align: left; cursor: pointer; background: var(--wv-white);
          border: 2.5px solid var(--wv-teal); border-radius: 22px 28px 20px 26px;
          padding: 16px 18px; display: flex; flex-direction: column; gap: 3px;
          box-shadow: 0 4px 0 rgba(39, 50, 72, 0.1);
          transition: scale 140ms cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        button.mini-again-door:not([type="submit"]):not(.wv-header-signout):hover { scale: 1.02; }
        button.mini-again-door:not([type="submit"]):not(.wv-header-signout):active { scale: 0.97; }
        button.mini-again-door:focus-visible { outline: 3px solid var(--color-focus); outline-offset: 3px; }
        button.mini-again-door.is-chain { border-color: var(--wv-cornflower); }
        .mini-again-door-emoji { font-size: 30px; line-height: 1; }
        .mini-again-door-t {
          font-family: var(--font-fraunces), serif; font-weight: 600; font-size: 20px; color: var(--wv-cadet);
        }
        .mini-again-door-d {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 700; font-size: 13.5px; color: #4b5563; line-height: 1.4;
        }
        .mini-again-door-next {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800; font-size: 13px; color: var(--wv-cornflower); margin-top: 3px;
        }
        .mini-again-foot { display: flex; justify-content: center; margin-top: 2px; }
        button.mini-again-quiet:not([type="submit"]):not(.wv-header-signout) {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          font-weight: 800; font-size: 14px; color: var(--wv-white);
          background: none; border: none; padding: 6px 4px; cursor: pointer;
          text-decoration: underline; text-underline-offset: 3px;
        }
        button.mini-again-quiet:focus-visible { outline: 3px solid var(--color-focus); outline-offset: 2px; border-radius: 6px; }
        @media (prefers-reduced-motion: reduce) {
          button.mini-again-door:hover, button.mini-again-door:active { scale: 1; }
        }
      `}</style>

      <div className="mini-again-prize">
        {photoUrl && <img src={photoUrl} alt="your creation" className="mini-again-photo" />}
        <p className="mini-again-prize-h">✨ your invention is a prize</p>
        <p className="mini-again-prize-sub">
          you made something that wasn&rsquo;t here before. it&rsquo;s shared — a grown-up on our
          side will add it to the wow wall soon.
        </p>
      </div>

      <p className="mini-again-q">what next?</p>
      <div className="mini-again-doors">
        <button type="button" className="mini-again-door" onClick={sameStuff}>
          <span className="mini-again-door-emoji" aria-hidden="true">🔁</span>
          <span className="mini-again-door-t">same stuff, new job</span>
          <span className="mini-again-door-d">keep what you found — give it a totally different job.</span>
        </button>

        {chain && chainTitle && (
          <button type="button" className="mini-again-door is-chain" onClick={whereLeads}>
            <span className="mini-again-door-emoji" aria-hidden="true">➡️</span>
            <span className="mini-again-door-t">where this leads</span>
            <span className="mini-again-door-d">{chain.note}</span>
            <span className="mini-again-door-next">→ {chainTitle}</span>
          </button>
        )}
      </div>

      <div className="mini-again-foot">
        <button type="button" className="mini-again-quiet" onClick={doneForToday}>
          we&rsquo;re done for today — see the wall →
        </button>
      </div>
    </div>
  );
}
