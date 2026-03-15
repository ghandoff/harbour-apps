"use client";

import { useState, useCallback } from "react";

interface UploadFormProps {
  on_submit: (data: { raw_text: string; subject: string; grade_level: string; title: string }) => void;
  is_loading: boolean;
}

export function UploadForm({ on_submit, is_loading }: UploadFormProps) {
  const [raw_text, set_raw_text] = useState("");
  const [subject, set_subject] = useState("");
  const [grade_level, set_grade_level] = useState("");
  const [title, set_title] = useState("");

  const handle_submit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!raw_text.trim()) return;
      on_submit({ raw_text, subject, grade_level, title });
    },
    [raw_text, subject, grade_level, title, on_submit]
  );

  const handle_drop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type === "text/plain") {
      file.text().then(set_raw_text);
    }
  }, []);

  return (
    <form onSubmit={handle_submit} className="space-y-6">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-[var(--color-text-on-dark-muted)] mb-2">
          lesson plan title
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => set_title(e.target.value)}
          placeholder="e.g., introduction to photosynthesis"
          className="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-3 text-[var(--color-text-on-dark)] placeholder:text-white/30 focus:outline-none focus:border-[var(--wv-champagne)] transition-colors"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-[var(--color-text-on-dark-muted)] mb-2">
            subject
          </label>
          <input
            id="subject"
            type="text"
            value={subject}
            onChange={(e) => set_subject(e.target.value)}
            placeholder="e.g., biology"
            className="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-3 text-[var(--color-text-on-dark)] placeholder:text-white/30 focus:outline-none focus:border-[var(--wv-champagne)] transition-colors"
          />
        </div>
        <div>
          <label htmlFor="grade_level" className="block text-sm font-medium text-[var(--color-text-on-dark-muted)] mb-2">
            grade level
          </label>
          <input
            id="grade_level"
            type="text"
            value={grade_level}
            onChange={(e) => set_grade_level(e.target.value)}
            placeholder="e.g., year 10, undergraduate"
            className="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-3 text-[var(--color-text-on-dark)] placeholder:text-white/30 focus:outline-none focus:border-[var(--wv-champagne)] transition-colors"
          />
        </div>
      </div>

      <div>
        <label htmlFor="raw_text" className="block text-sm font-medium text-[var(--color-text-on-dark-muted)] mb-2">
          lesson plan or syllabus text
        </label>
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handle_drop}
          className="relative"
        >
          <textarea
            id="raw_text"
            value={raw_text}
            onChange={(e) => set_raw_text(e.target.value)}
            placeholder="paste your lesson plan, syllabus, or course outline here — or drag a .txt file"
            rows={12}
            className="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-3 text-[var(--color-text-on-dark)] placeholder:text-white/30 focus:outline-none focus:border-[var(--wv-champagne)] transition-colors resize-y font-mono text-sm leading-relaxed"
          />
        </div>
        <p className="text-xs text-[var(--color-text-on-dark-muted)] mt-2">
          include learning objectives, outcomes, and any assessment descriptions already in the plan.
        </p>
      </div>

      <button
        type="submit"
        disabled={!raw_text.trim() || is_loading}
        className="w-full bg-[var(--wv-champagne)] text-[var(--wv-cadet)] font-semibold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {is_loading ? "parsing objectives..." : "extract learning objectives"}
      </button>
    </form>
  );
}
