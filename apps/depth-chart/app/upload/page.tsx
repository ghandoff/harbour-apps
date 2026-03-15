"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UploadForm } from "@/components/upload-form";
import type { LearningObjective } from "@/lib/types";

interface ParsedPlan {
  title: string;
  subject: string;
  grade_level: string;
  raw_text: string;
  objectives: LearningObjective[];
}

export default function UploadPage() {
  const router = useRouter();
  const [is_loading, set_is_loading] = useState(false);
  const [error, set_error] = useState<string | null>(null);
  const [parsed, set_parsed] = useState<ParsedPlan | null>(null);

  const handle_submit = useCallback(
    async (data: { raw_text?: string; file?: File; subject: string; grade_level: string; title: string }) => {
      set_is_loading(true);
      set_error(null);

      try {
        let res: Response;

        if (data.file) {
          const form = new FormData();
          form.append("file", data.file);
          form.append("subject", data.subject);
          form.append("grade_level", data.grade_level);

          res = await fetch("/harbour/depth-chart/api/parse", {
            method: "POST",
            body: form,
          });
        } else {
          res = await fetch("/harbour/depth-chart/api/parse", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              raw_text: data.raw_text,
              subject: data.subject,
              grade_level: data.grade_level,
            }),
          });
        }

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "failed to parse lesson plan");
        }

        const { objectives, extracted_text } = await res.json();

        set_parsed({
          title: data.title,
          subject: data.subject,
          grade_level: data.grade_level,
          raw_text: data.raw_text || extracted_text || "",
          objectives,
        });
      } catch (e) {
        set_error(e instanceof Error ? e.message : "something went wrong");
      } finally {
        set_is_loading(false);
      }
    },
    []
  );

  // once parsed, store in localStorage (current + history) and navigate
  useEffect(() => {
    if (parsed && parsed.objectives.length > 0) {
      localStorage.setItem("depth_chart_plan", JSON.stringify(parsed));
      localStorage.removeItem("depth_chart_tasks");

      // append to history
      const raw = localStorage.getItem("depth_chart_plan_history");
      const history = raw ? JSON.parse(raw) : [];
      history.unshift({
        ...parsed,
        saved_at: new Date().toISOString(),
        objectives_count: parsed.objectives.length,
      });
      if (history.length > 20) history.length = 20;
      localStorage.setItem("depth_chart_plan_history", JSON.stringify(history));

      router.push("/plan/current");
    }
  }, [parsed, router]);

  return (
    <main id="main" className="min-h-screen flex flex-col items-center px-6 pt-24 pb-16">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-[var(--color-text-on-dark)]">
            upload lesson plan
          </h1>
          <p className="text-sm text-[var(--color-text-on-dark-muted)]">
            upload a PDF, DOCX, or paste your lesson plan below.
            we'll extract learning objectives and classify them on Bloom's taxonomy.
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <UploadForm on_submit={handle_submit} is_loading={is_loading} />
      </div>
    </main>
  );
}
