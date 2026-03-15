"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface SavedPlanSummary {
  title: string;
  subject: string;
  grade_level: string;
  objectives_count: number;
  saved_at: string;
}

interface StoredPlan {
  title: string;
  subject: string;
  grade_level: string;
  raw_text: string;
  objectives: { id: string }[];
}

export default function PlanHistoryPage() {
  const router = useRouter();
  const [plans, set_plans] = useState<SavedPlanSummary[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem("depth_chart_plan_history");
    if (raw) {
      set_plans(JSON.parse(raw));
    }
  }, []);

  const load_plan = useCallback(
    (index: number) => {
      const raw = localStorage.getItem("depth_chart_plan_history");
      if (!raw) return;
      const history: (StoredPlan & { saved_at: string })[] = JSON.parse(raw);
      const plan = history[index];
      if (!plan) return;

      // set as current plan
      localStorage.setItem("depth_chart_plan", JSON.stringify(plan));
      localStorage.removeItem("depth_chart_tasks");
      router.push("/plan/current");
    },
    [router]
  );

  const delete_plan = useCallback(
    (index: number) => {
      const raw = localStorage.getItem("depth_chart_plan_history");
      if (!raw) return;
      const history: SavedPlanSummary[] = JSON.parse(raw);
      history.splice(index, 1);
      localStorage.setItem("depth_chart_plan_history", JSON.stringify(history));
      set_plans([...history]);
    },
    []
  );

  return (
    <main id="main" className="min-h-screen px-6 pt-24 pb-16">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="space-y-2">
          <a
            href="/harbour/depth-chart"
            className="text-xs text-[var(--color-text-on-dark-muted)] hover:text-[var(--wv-champagne)] transition-colors"
          >
            ← home
          </a>
          <h1 className="text-2xl font-bold text-[var(--color-text-on-dark)]">
            plan history
          </h1>
          <p className="text-sm text-[var(--color-text-on-dark-muted)]">
            previously uploaded lesson plans stored in your browser.
          </p>
        </div>

        {plans.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <p className="text-[var(--color-text-on-dark-muted)]">
              no saved plans yet.
            </p>
            <a
              href="/harbour/depth-chart/upload"
              className="inline-block text-sm text-[var(--wv-champagne)] hover:opacity-80"
            >
              upload your first lesson plan →
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            {plans.map((plan, i) => (
              <div
                key={`${plan.saved_at}-${i}`}
                className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between gap-4"
              >
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-[var(--color-text-on-dark)] truncate">
                    {plan.title || "untitled"}
                  </h3>
                  <p className="text-xs text-[var(--color-text-on-dark-muted)] mt-0.5">
                    {plan.subject} · {plan.grade_level} · {plan.objectives_count} objectives
                  </p>
                  <p className="text-xs text-[var(--color-text-on-dark-muted)] opacity-60 mt-0.5">
                    {new Date(plan.saved_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => load_plan(i)}
                    className="px-3 py-1.5 bg-[var(--wv-champagne)] text-[var(--wv-cadet)] text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity"
                  >
                    load
                  </button>
                  <button
                    onClick={() => delete_plan(i)}
                    className="px-3 py-1.5 bg-white/5 text-[var(--color-text-on-dark-muted)] text-xs rounded-lg hover:bg-red-500/20 hover:text-red-400 transition-colors"
                  >
                    delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
