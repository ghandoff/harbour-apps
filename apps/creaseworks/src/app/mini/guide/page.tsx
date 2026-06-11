"use client";

/**
 * mini guide — the facilitator one-pager (slice 8).
 *
 * Everything a parent or teacher needs to run one ~20-minute session,
 * in plain language. Print-friendly (the shell chrome and feedback
 * button hide under @media print). Linked from the welcome page's
 * grown-up strip.
 *
 * Distilled from jamie's facilitator guide + the whirlpool/fruitstand
 * decisions: kid-driven, no wrong materials, narrative feedback.
 */

import Link from "next/link";
import { MINI_ACTIVITIES, MINI_STAGES, miniHref } from "@/lib/mini-pilot";

export default function MiniGuidePage() {
  return (
    <article className="mini-guide">
      <style>{`
        .mini-guide {
          font-family: var(--font-nunito), ui-sans-serif, system-ui, sans-serif;
          color: var(--wv-cadet);
          line-height: 1.65;
          font-size: 15px;
          padding-bottom: 48px;
        }
        .mini-guide h1 {
          font-family: var(--font-fraunces), serif;
          font-weight: 600;
          font-size: 28px;
          margin: 10px 0 4px;
        }
        .mini-guide .mini-guide-sub { opacity: 0.6; margin-bottom: 22px; }
        .mini-guide h2 {
          font-family: var(--font-fraunces), serif;
          font-weight: 600;
          font-size: 19px;
          margin: 26px 0 8px;
        }
        .mini-guide p { margin-bottom: 10px; }
        .mini-guide ul { margin: 0 0 10px 18px; list-style: disc; }
        .mini-guide li { margin-bottom: 6px; }
        .mini-guide-stage {
          background: var(--wv-white);
          border-left: 4px solid var(--accent);
          border-radius: 12px;
          padding: 10px 14px;
          margin-bottom: 10px;
        }
        .mini-guide-stage strong { font-weight: 800; }
        .mini-guide-activity {
          background: var(--wv-white);
          border: 1.5px solid rgba(39, 50, 72, 0.08);
          border-radius: 14px;
          padding: 12px 14px;
          margin-bottom: 10px;
        }
        .mini-guide-activity h3 {
          font-weight: 800;
          font-size: 15px;
          margin-bottom: 2px;
        }
        .mini-guide-activity p { font-size: 13px; opacity: 0.75; margin-bottom: 6px; }
        .mini-guide-mats { font-size: 12px; opacity: 0.6; }
        .mini-guide-print {
          font-size: 13px;
          opacity: 0.5;
        }
        @media print {
          .mini-guide { font-size: 12px; }
          .mini-guide-print { display: none; }
        }
      `}</style>

      <h1>running a creaseworks mini session</h1>
      <p className="mini-guide-sub">
        for the grown-up in the room · ~20 minutes · ages 4–6
      </p>

      <h2>the one rule</h2>
      <p>
        <strong>your child drives.</strong>{" "}you hold the phone, read things
        aloud, and resist the urge to instruct. there are no wrong
        materials and no wrong builds. when they do something unexpected,
        that&rsquo;s the good part — follow it.
      </p>

      <h2>before you start (2 minutes)</h2>
      <ul>
        <li>
          enter your <strong>family code</strong> on the{" "}
          <Link href={miniHref("/")}>welcome page</Link>{" "}under &ldquo;for
          grown-ups&rdquo; — it lets you share photos and send us notes.
        </li>
        <li>
          nothing to prepare or buy: the whole point is using what&rsquo;s
          already around the house or classroom.
        </li>
      </ul>

      <h2>the four phases</h2>
      {MINI_STAGES.map((s, i) => (
        <div
          key={s.key}
          className="mini-guide-stage"
          style={{
            ["--accent" as string]: [
              "var(--wv-cornflower)",
              "var(--wv-teal)",
              "var(--wv-seafoam)",
              "var(--wv-periwinkle)",
            ][i],
          }}
        >
          <strong>{s.label}</strong> — {s.adultBlurb}
        </div>
      ))}

      <h2>what to say (and not say)</h2>
      <ul>
        <li>
          say: <em>&ldquo;what did you find?&rdquo;</em>,{" "}
          <em>&ldquo;tell me about it&rdquo;</em>,{" "}
          <em>&ldquo;what else could it be?&rdquo;</em>
        </li>
        <li>
          avoid: <em>&ldquo;that&rsquo;s not how it works&rdquo;</em>,{" "}
          <em>&ldquo;do it like this&rdquo;</em>, or finishing their build
          for them.
        </li>
        <li>
          when they say a bottle cap is a hat, a wheel, or soup — all
          three are correct.
        </li>
      </ul>

      <h2>the five activities</h2>
      <p className="mini-guide-print">
        the app matches one to whatever your child finds — you don&rsquo;t
        pick. listed here so you know what might come up:
      </p>
      {MINI_ACTIVITIES.map((a) => (
        <div key={a.slug} className="mini-guide-activity">
          <h3>{a.title}</h3>
          <p>{a.headline}</p>
          <p className="mini-guide-mats">
            often uses: {a.materials.slice(0, 5).join(" · ")}
          </p>
        </div>
      ))}

      <h2>what we&rsquo;re asking of you</h2>
      <ul>
        <li>
          <strong>photos + their words</strong> in the show phase — you
          type, they talk. exact words are better than tidy summaries.
        </li>
        <li>
          <strong>the &ldquo;💬 tell us&rdquo; button</strong> (bottom-left,
          every page): tap it whenever your child pauses, gets confused,
          or surprises you. one sentence is plenty. those moments are
          exactly what we&rsquo;re testing for.
        </li>
        <li>
          nothing your family shares is public until we review and
          approve it.
        </li>
      </ul>

      <p className="mini-guide-print">
        this page prints cleanly if you&rsquo;d rather have it on paper.
      </p>
    </article>
  );
}
