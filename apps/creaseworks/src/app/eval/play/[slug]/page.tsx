"use client";

/**
 * creaseworks eval — the climb.
 *
 * One scrollable page, sections per cascade layer, jump-anywhere. The
 * tool that evaluates non-linearity is itself non-linear. felt evaluators
 * see only the bottom (the felt play); frame evaluators climb the whole
 * cascade. Register + name come from sessionStorage (set on the home
 * page); missing → back home.
 */

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiUrl } from "@/lib/api-url";
import { evalHref } from "@/lib/eval-nav";
import { layersFor, playdateBySlug, type Register } from "@/lib/eval-rubric";
import { ItemField, type AnswerValue } from "../../item-field";

const NAME_KEY = "cw-eval-name";
const REG_KEY = "cw-eval-register";

type SendState = "idle" | "sending" | "done" | "error";

export default function EvalPlayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const playdate = playdateBySlug(slug);

  const [register, setRegister] = useState<Register | null>(null);
  const [name, setName] = useState("");
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [state, setState] = useState<SendState>("idle");
  const [oneRead, setOneRead] = useState<{ loading: boolean; configured: boolean; text?: string }>({
    loading: false,
    configured: false,
  });
  const [readVote, setReadVote] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const n = sessionStorage.getItem(NAME_KEY);
      const r = sessionStorage.getItem(REG_KEY) as Register | null;
      if (!n || (r !== "felt" && r !== "frame")) {
        router.replace(evalHref(""));
        return;
      }
      setName(n);
      setRegister(r);
    } catch {
      router.replace(evalHref(""));
    }
  }, [router]);

  function onChange(id: string, value: AnswerValue) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  async function submit() {
    if (!register || !playdate) return;
    setState("sending");
    try {
      const res = await fetch(apiUrl("/api/eval/submit"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playdate_slug: playdate.slug,
          evaluator_name: name,
          register,
          answers,
        }),
      });
      setState(res.ok ? "done" : "error");
      if (res.ok) {
        window.scrollTo({ top: 0, behavior: "smooth" });
        void loadOneRead();
      }
    } catch {
      setState("error");
    }
  }

  async function loadOneRead() {
    if (!playdate) return;
    setOneRead({ loading: true, configured: false });
    try {
      const res = await fetch(apiUrl("/api/eval/one-read"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: playdate.slug }),
      });
      const data = (await res.json().catch(() => ({}))) as { configured?: boolean; text?: string };
      setOneRead({ loading: false, configured: !!data.configured, text: data.text });
    } catch {
      setOneRead({ loading: false, configured: false });
    }
  }

  async function voteRead(agree: boolean) {
    if (!playdate) return;
    setReadVote(agree);
    try {
      await fetch(apiUrl("/api/eval/one-read/vote"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: playdate.slug, evaluator_name: name, agree }),
      });
    } catch {}
  }

  if (!playdate) {
    return (
      <div>
        <p style={{ fontWeight: 800 }}>unknown playdate.</p>
        <Link href={evalHref("")} style={{ color: "var(--wv-teal)", fontWeight: 800 }}>
          ← back to the audit home
        </Link>
      </div>
    );
  }

  if (!register) return null; // redirecting

  const groups = layersFor(register);
  const answeredCount = Object.keys(answers).length;

  return (
    <div>
      <style>{`
        .ep-head { margin-bottom: 18px; }
        .ep-crumb { font-size: 13px; color: var(--wv-teal); font-weight: 800; text-decoration: none; }
        .ep-title { font-family: var(--font-fraunces), serif; font-weight: 600; font-size: 24px;
          color: var(--wv-cadet); margin: 10px 0 2px; }
        .ep-tag { font-size: 14px; color: #4b5563; margin: 0 0 6px; }
        .ep-reg { display: inline-block; font-weight: 800; font-size: 12px; color: var(--wv-white);
          background: ${register === "felt" ? "var(--wv-seafoam)" : "var(--wv-cornflower)"};
          border-radius: 10px 14px 10px 12px; padding: 3px 10px; margin-top: 4px; }

        .ep-layer { background: var(--wv-white); border: 1.5px solid rgba(39,50,72,0.10);
          border-radius: 18px 22px 16px 20px; padding: 18px 18px 6px; margin-bottom: 16px;
          box-shadow: 0 3px 0 rgba(39,50,72,0.06); }
        .ep-layer-h { display: flex; align-items: baseline; gap: 10px; margin-bottom: 4px; }
        .ep-layer-n { font-weight: 800; font-size: 11px; color: var(--wv-white);
          background: var(--wv-navy); border-radius: 50%; width: 22px; height: 22px;
          display: inline-flex; align-items: center; justify-content: center; flex: none; }
        .ep-layer-label { font-family: var(--font-fraunces), serif; font-weight: 600; font-size: 18px; color: var(--wv-cadet); }
        .ep-layer-blurb { font-size: 13px; color: #6b7280; margin: 0 0 12px; line-height: 1.5; }

        .ef-item { padding: 14px 0; border-top: 1px solid rgba(39,50,72,0.07); }
        .ep-layer .ef-item:first-of-type { border-top: none; }
        .ef-prompt { font-weight: 700; font-size: 15px; line-height: 1.5; color: var(--wv-cadet); margin: 0 0 4px; }
        .ef-help { font-size: 12.5px; line-height: 1.5; color: #6b7280; margin: 0 0 10px; }
        .ef-opts { display: flex; flex-wrap: wrap; gap: 8px; }
        button.ef-opt:not([type="submit"]) { cursor: pointer; font-family: inherit; font-weight: 700;
          font-size: 13.5px; color: var(--wv-cadet); background: var(--wv-white);
          border: 2px solid rgba(39,50,72,0.14); border-radius: 12px; padding: 8px 14px;
          transition: all 120ms ease; }
        button.ef-opt[data-on="true"] { border-color: var(--wv-teal);
          background: color-mix(in srgb, var(--wv-mint) 40%, var(--wv-white)); color: var(--wv-cadet); }
        button.ef-opt:focus-visible { outline: 3px solid var(--color-focus); outline-offset: 2px; }
        .ef-scale { display: flex; gap: 8px; }
        button.ef-scalebtn:not([type="submit"]) { cursor: pointer; flex: 1; max-width: 56px; font-family: inherit;
          font-weight: 800; font-size: 15px; color: var(--wv-cadet); background: var(--wv-white);
          border: 2px solid rgba(39,50,72,0.14); border-radius: 12px; padding: 10px 0; transition: all 120ms ease; }
        button.ef-scalebtn[data-on="true"] { border-color: var(--wv-teal); background: var(--wv-teal); color: var(--wv-white); }
        button.ef-scalebtn:focus-visible { outline: 3px solid var(--color-focus); outline-offset: 2px; }
        .ef-scale-ends { display: flex; justify-content: space-between; max-width: 312px; font-size: 11px; color: #9ca3af; margin-top: 4px; }
        .ef-text { width: 100%; box-sizing: border-box; font-family: inherit; font-size: 14px; line-height: 1.5;
          color: var(--wv-cadet); background: var(--wv-white); border: 2px solid rgba(39,50,72,0.14);
          border-radius: 12px; padding: 10px 12px; resize: vertical; }
        .ef-text:focus-visible { outline: 3px solid var(--color-focus); outline-offset: 1px; }

        .ep-foot { position: sticky; bottom: 0; background: color-mix(in srgb, var(--wv-periwinkle) 18%, var(--wv-white));
          padding: 12px 0 8px; display: flex; align-items: center; gap: 14px; }
        button.ep-submit:not([type="submit"]) { font-family: inherit; font-weight: 800; font-size: 16px;
          color: var(--wv-white); background: var(--wv-redwood); border: none; border-radius: 16px 20px 14px 18px;
          padding: 13px 26px; cursor: pointer; box-shadow: 0 4px 0 rgba(39,50,72,0.15); }
        button.ep-submit:disabled { opacity: 0.45; cursor: default; }
        button.ep-submit:focus-visible { outline: 3px solid var(--color-focus); outline-offset: 3px; }
        .ep-count { font-size: 13px; color: #6b7280; }

        .ep-done { background: var(--wv-white); border: 1.5px solid rgba(39,50,72,0.10);
          border-radius: 20px 26px 18px 24px; padding: 28px 22px; text-align: center; box-shadow: 0 4px 0 rgba(39,50,72,0.07); }
        .ep-done h2 { font-family: var(--font-fraunces), serif; font-weight: 600; font-size: 22px; color: var(--wv-cadet); margin: 6px 0 8px; }
        .ep-done p { font-size: 14px; color: #4b5563; margin: 0 0 18px; }
        .ep-done a { display: inline-block; margin: 0 8px; font-weight: 800; font-size: 14px; color: var(--wv-teal); text-decoration: none; }
        .ep-salience { font-size: 12.5px; color: #6b7280; margin: 8px 0 0; line-height: 1.5; }
        .ep-read { text-align: left; background: color-mix(in srgb, var(--wv-periwinkle) 16%, var(--wv-white));
          border: 1.5px solid rgba(39,50,72,0.12); border-radius: 14px 18px 12px 16px; padding: 16px; margin: 18px 0; }
        .ep-read-h { font-weight: 800; font-size: 12.5px; color: var(--wv-cadet); margin-bottom: 8px; }
        .ep-read-text { font-size: 14px; line-height: 1.6; color: var(--wv-cadet); margin: 0; white-space: pre-wrap; }
        .ep-read-muted { font-size: 13px; color: #6b7280; margin: 4px 0 0; }
        .ep-vote { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
        .ep-vote-q { font-size: 13px; font-weight: 700; color: var(--wv-cadet); margin-right: 2px; }
        button.ep-vote-btn:not([type="submit"]) { font-family: inherit; font-weight: 800; font-size: 13px; cursor: pointer;
          color: var(--wv-white); background: var(--wv-teal); border: none; border-radius: 10px 14px 9px 12px; padding: 7px 14px; }
        button.ep-vote-btn.ghost { background: var(--wv-white); color: var(--wv-cadet); border: 2px solid rgba(39,50,72,0.16); }
        button.ep-vote-btn:focus-visible { outline: 3px solid var(--color-focus); outline-offset: 2px; }
      `}</style>

      {state === "done" ? (
        <div className="ep-done">
          <div style={{ fontSize: 34 }}>✓</div>
          <h2>logged — thank you, {name}.</h2>
          <p>your read of “{playdate.title}” is in. the dashboard updates as the team submits.</p>

          <div className="ep-read">
            <div className="ep-read-h">🤖 one read — one voice, not the answer</div>
            {oneRead.loading && <p className="ep-read-muted">generating a read…</p>}
            {!oneRead.loading && !oneRead.configured && (
              <p className="ep-read-muted">the one read isn&rsquo;t switched on yet. (it needs the model key on the worker.)</p>
            )}
            {!oneRead.loading && oneRead.configured && oneRead.text && (
              <>
                <p className="ep-read-text">{oneRead.text}</p>
                {readVote === null ? (
                  <div className="ep-vote">
                    <span className="ep-vote-q">did this match what you found?</span>
                    <button type="button" className="ep-vote-btn" onClick={() => voteRead(true)}>it matched</button>
                    <button type="button" className="ep-vote-btn ghost" onClick={() => voteRead(false)}>mark it wrong</button>
                  </div>
                ) : (
                  <p className="ep-read-muted">{readVote ? "noted — it matched." : "noted — the room outranks the page."}</p>
                )}
              </>
            )}
          </div>

          <Link href={evalHref("")}>evaluate another →</Link>
          <Link href={evalHref("/dashboard")}>see the coherence dashboard →</Link>
        </div>
      ) : (
        <>
          <div className="ep-head">
            <Link href={evalHref("")} className="ep-crumb">← all playdates</Link>
            <h1 className="ep-title">{playdate.title}</h1>
            <p className="ep-tag">{playdate.tagline}</p>
            <span className="ep-reg">
              {register === "felt" ? "🌿 the felt play" : "🧭 the five lenses"} · {name}
            </span>
            <p className="ep-salience">mark only what feels salient — skip anything that doesn&rsquo;t. nothing here is required.</p>
          </div>

          {groups.map((group, i) => (
            <section key={group.meta.key} className="ep-layer">
              <div className="ep-layer-h">
                <span className="ep-layer-n" aria-hidden="true">{i + 1}</span>
                <span className="ep-layer-label">{group.meta.label}</span>
              </div>
              <p className="ep-layer-blurb">{group.meta.blurb}</p>
              {group.items.map((item) => (
                <ItemField key={item.id} item={item} value={answers[item.id]} onChange={onChange} />
              ))}
            </section>
          ))}

          <div className="ep-foot">
            <button
              type="button"
              className="ep-submit"
              disabled={answeredCount === 0 || state === "sending"}
              onClick={submit}
            >
              {state === "sending" ? "logging…" : "submit evaluation →"}
            </button>
            <span className="ep-count">
              {answeredCount} marked
              {state === "error" && " · that didn't go through — try again?"}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
