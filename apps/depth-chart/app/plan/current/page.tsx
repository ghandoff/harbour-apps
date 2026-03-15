"use client";

import { useState, useEffect, useCallback } from "react";
import { ObjectiveCard } from "@/components/objective-card";
import { TaskCard } from "@/components/task-card";
import { AlignmentReport } from "@/components/alignment-report";
import { RubricTable } from "@/components/rubric-table";
import { EJScaffoldPanel } from "@/components/ej-scaffold-panel";
import { get_valid_formats } from "@/lib/blooms";
import type {
  LearningObjective,
  GeneratedTask,
  AlignmentReport as AlignmentReportType,
  BloomsLevel,
  TeacherConfig,
} from "@/lib/types";

interface StoredPlan {
  title: string;
  subject: string;
  grade_level: string;
  raw_text: string;
  objectives: LearningObjective[];
}

const DEFAULT_CONFIG: TeacherConfig = {
  authenticity_weights: {},
  max_minutes: 45,
  collaboration_mode: "individual",
  preferred_formats: [],
};

function build_alignment_report(objectives: LearningObjective[]): AlignmentReportType {
  const distribution: Record<BloomsLevel, number> = {
    remember: 0, understand: 0, apply: 0, analyse: 0, evaluate: 0, create: 0,
  };

  for (const obj of objectives) {
    distribution[obj.blooms_level]++;
  }

  const hocs_count = distribution.analyse + distribution.evaluate + distribution.create;
  const total = objectives.length;

  return {
    objectives_count: total,
    covered_count: total,
    gaps: [],
    blooms_distribution: distribution,
    hocs_percentage: total > 0 ? (hocs_count / total) * 100 : 0,
  };
}

export default function PlanPage() {
  const [plan, set_plan] = useState<StoredPlan | null>(null);
  const [tasks, set_tasks] = useState<Record<string, GeneratedTask>>({});
  const [generating, set_generating] = useState<string | null>(null);
  const [selected_task, set_selected_task] = useState<GeneratedTask | null>(null);
  const [view, set_view] = useState<"rubric" | "scaffold" | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("depth_chart_plan");
    if (stored) {
      set_plan(JSON.parse(stored));
    }
  }, []);

  const generate_task = useCallback(
    async (objective: LearningObjective) => {
      if (!plan) return;
      set_generating(objective.id);

      try {
        const formats = get_valid_formats(objective.blooms_level);
        const format = formats[0]; // pick first valid format

        const res = await fetch("/depth-chart/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            objective_raw_text: objective.raw_text,
            cognitive_verb: objective.cognitive_verb,
            blooms_level: objective.blooms_level,
            knowledge_dimension: objective.knowledge_dimension,
            content_topic: objective.content_topic,
            context: objective.context,
            subject: plan.subject,
            grade_level: plan.grade_level,
            task_format: format,
            teacher_config: DEFAULT_CONFIG,
          }),
        });

        if (!res.ok) throw new Error("generation failed");

        const task = await res.json();
        task.id = `task_${objective.id}`;
        task.objective_id = objective.id;
        task.blooms_level = objective.blooms_level;
        task.task_format = format;

        set_tasks((prev) => ({ ...prev, [objective.id]: task }));
      } catch (e) {
        console.error("[generate]", e);
      } finally {
        set_generating(null);
      }
    },
    [plan]
  );

  if (!plan) {
    return (
      <main id="main" className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center space-y-4">
          <p className="text-[var(--color-text-on-dark-muted)]">
            no lesson plan found. upload one first.
          </p>
          <a
            href="/depth-chart/upload"
            className="text-sm text-[var(--wv-champagne)] hover:opacity-80"
          >
            ← go to upload
          </a>
        </div>
      </main>
    );
  }

  const report = build_alignment_report(plan.objectives);

  return (
    <main id="main" className="min-h-screen px-6 pt-24 pb-16">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* header */}
        <div className="space-y-2">
          <a
            href="/depth-chart/upload"
            className="text-xs text-[var(--color-text-on-dark-muted)] hover:text-[var(--wv-champagne)] transition-colors"
          >
            ← upload another
          </a>
          <h1 className="text-2xl font-bold text-[var(--color-text-on-dark)]">
            {plan.title || "untitled lesson plan"}
          </h1>
          <p className="text-sm text-[var(--color-text-on-dark-muted)]">
            {plan.subject} · {plan.grade_level} · {plan.objectives.length} objectives extracted
          </p>
        </div>

        {/* alignment report */}
        <AlignmentReport report={report} />

        {/* objectives */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold tracking-[0.15em] text-[var(--color-text-on-dark-muted)]">
            learning objectives
          </h2>

          {plan.objectives.map((obj) => (
            <div key={obj.id} className="space-y-3">
              <ObjectiveCard
                objective={obj}
                on_generate={generate_task}
                is_generating={generating === obj.id}
              />

              {tasks[obj.id] && (
                <div className="ml-6 space-y-3">
                  <TaskCard
                    task={tasks[obj.id]}
                    on_view_rubric={(t) => { set_selected_task(t); set_view("rubric"); }}
                    on_view_scaffold={(t) => { set_selected_task(t); set_view("scaffold"); }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* detail panels */}
        {selected_task && view === "rubric" && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-6 z-50">
            <div className="bg-[var(--wv-cadet)] border border-white/10 rounded-2xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-[var(--color-text-on-dark)]">rubric</h3>
                <button
                  onClick={() => { set_selected_task(null); set_view(null); }}
                  className="text-[var(--color-text-on-dark-muted)] hover:text-[var(--color-text-on-dark)]"
                >
                  close
                </button>
              </div>
              <RubricTable rubric={selected_task.rubric} />
            </div>
          </div>
        )}

        {selected_task && view === "scaffold" && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-6 z-50">
            <div className="bg-[var(--wv-cadet)] border border-white/10 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-[var(--color-text-on-dark)]">evaluative judgment scaffold</h3>
                <button
                  onClick={() => { set_selected_task(null); set_view(null); }}
                  className="text-[var(--color-text-on-dark-muted)] hover:text-[var(--color-text-on-dark)]"
                >
                  close
                </button>
              </div>
              <EJScaffoldPanel scaffold={selected_task.ej_scaffold} />
            </div>
          </div>
        )}

        {/* footer */}
        <footer className="text-center py-8 text-xs text-[var(--color-text-on-dark-muted)]">
          <p>
            tasks generated using constructive alignment (Biggs), scored against
            six authenticity criteria (Baquero-Vargas & Pérez-Salas), with
            evaluative judgment scaffolds (Sadler).
          </p>
        </footer>
      </div>
    </main>
  );
}
