import skillsData from "@/data/holistic-skills.json";
import { ScrollReveal } from "./scroll-reveal";

export interface Skill {
  slug: string;
  name: string;
  category: string;
  description: string;
  icon: string;
  howToPractice: string;
  order: number;
}

export const SKILLS: Skill[] = (skillsData as Skill[]).sort(
  (a, b) => a.order - b.order,
);

const CATEGORY_META: Record<
  string,
  { label: string; color: string; accent: string }
> = {
  relational: {
    label: "relational",
    color: "from-[var(--wv-sienna)] to-[var(--wv-redwood)]",
    accent: "bg-[var(--wv-redwood)]",
  },
  somatic: {
    label: "somatic",
    color: "from-[var(--wv-redwood)] to-[var(--wv-cadet)]",
    accent: "bg-[var(--wv-sienna)]",
  },
  reflective: {
    label: "reflective",
    color: "from-[var(--wv-cadet)] to-[var(--wv-champagne)]",
    accent: "bg-[var(--wv-champagne)]",
  },
  generative: {
    label: "generative",
    color: "from-[var(--wv-champagne)] to-[var(--wv-sienna)]",
    accent: "bg-[var(--wv-redwood)]",
  },
};

const FALLBACK_META = {
  label: "other",
  color: "from-[var(--wv-cadet)] to-[var(--wv-sienna)]",
  accent: "bg-[var(--wv-redwood)]",
};

function SkillCard({ skill }: { skill: Skill }) {
  const meta = CATEGORY_META[skill.category] ?? FALLBACK_META;

  return (
    <ScrollReveal animation="card-stagger" className="flex">
      <article className="flex flex-col w-full rounded-2xl border border-white/10 bg-white/5 overflow-hidden hover:border-white/20 transition-colors duration-300">
        {/* Top stripe */}
        <div className={`h-1 w-full bg-gradient-to-r ${meta.color}`} />

        <div className="flex flex-col flex-1 p-6 gap-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <span className="text-3xl leading-none">{skill.icon}</span>
            <span
              className={`${meta.accent} text-[var(--color-text-on-dark)] text-xs font-semibold px-2.5 py-0.5 rounded-full shrink-0`}
            >
              {skill.category}
            </span>
          </div>

          {/* Name + description */}
          <div className="flex-1">
            <h3 className="text-lg font-bold text-[var(--color-text-on-dark)] mb-2 leading-tight">
              {skill.name}
            </h3>
            <p className="text-sm leading-relaxed text-[var(--color-text-on-dark-muted)]">
              {skill.description}
            </p>
          </div>

          {/* Practice prompt */}
          {skill.howToPractice && (
            <div className="border-t border-white/10 pt-4">
              <p className="text-xs font-semibold text-[var(--color-text-on-dark-muted)] mb-1.5 tracking-wider">
                try this
              </p>
              <p className="text-sm leading-relaxed text-[var(--color-text-on-dark-muted)] italic">
                {skill.howToPractice}
              </p>
            </div>
          )}
        </div>
      </article>
    </ScrollReveal>
  );
}

export function SkillsPrimer() {
  // Group skills by category in natural order of first appearance
  const categories: string[] = [];
  const byCategory: Record<string, Skill[]> = {};

  for (const skill of SKILLS) {
    if (!byCategory[skill.category]) {
      categories.push(skill.category);
      byCategory[skill.category] = [];
    }
    byCategory[skill.category].push(skill);
  }

  return (
    <div className="space-y-16">
      {categories.map((cat) => {
        const meta = CATEGORY_META[cat] ?? FALLBACK_META;
        return (
          <section key={cat} aria-label={`${cat} skills`}>
            {/* Category heading */}
            <ScrollReveal>
              <div className="flex items-center gap-4 mb-8">
                <span
                  className={`${meta.accent} w-2 h-8 rounded-full flex-shrink-0`}
                />
                <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-on-dark)]">
                  {meta.label}
                </h2>
              </div>
            </ScrollReveal>

            {/* Skills grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {byCategory[cat].map((skill) => (
                <SkillCard key={skill.slug} skill={skill} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
