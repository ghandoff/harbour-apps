import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-helpers";
import { sql } from "@/lib/db";
import { getConfigObjects, getConfigValues } from "@/lib/queries/cms-config";
import OnboardingWizard from "./wizard";
import type { WizardOption } from "./wizard";

export const metadata = { title: "welcome" };

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; context?: string }>;
}) {
  let session = null;
  try {
    session = await getSession();
  } catch {
    // Auth may fail if DB is unreachable
  }
  if (!session) redirect("/login?callbackUrl=/onboarding");

  const params = await searchParams;
  const isEditMode = params.edit === "true";
  const editContextName = params.context ?? null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let user: any;
  let initialValues: {
    ageGroups: string[];
    contexts: string[];
    energy: string;
    contextName: string;
  } | null = null;
  let invitePackNames: string[] = [];

  try {
    const { rows } = await sql.query(
      `SELECT onboarding_completed, play_preferences, play_contexts, active_context_name
         FROM users WHERE id = $1`,
      [session.userId],
    );

    user = rows[0];
    if (user?.onboarding_completed && !isEditMode) redirect("/sampler");

    if (isEditMode && user) {
      const allContexts = (user.play_contexts ?? []) as Array<Record<string, unknown>>;
      const target = editContextName
        ? allContexts.find((c) => c.name === editContextName)
        : allContexts.find((c) => c.name === user.active_context_name) ?? allContexts[0];

      if (target) {
        initialValues = {
          ageGroups: (target.age_groups as string[]) ?? [],
          contexts: (target.contexts as string[]) ?? [],
          energy: (target.energy as string) ?? "any",
          contextName: (target.name as string) ?? "default",
        };
      }
    }

    if (!isEditMode && !user?.onboarding_completed) {
      const packRows = await sql.query(
        `SELECT DISTINCT pc.title
           FROM entitlements e
           JOIN packs_cache pc ON pc.id = e.pack_cache_id
          WHERE e.user_id = $1
            AND e.revoked_at IS NULL
            AND (e.expires_at IS NULL OR e.expires_at > NOW())
          ORDER BY pc.title`,
        [session.userId],
      );
      invitePackNames = packRows.rows.map((r: { title: string }) => r.title);
    }
  } catch (err) {
    console.error("onboarding DB queries failed:", err);
  }

  // Fetch CMS-managed wizard options (falls back to defaults if empty)
  let tierOptions: WizardOption[] | undefined;
  let ageGroupOptions: WizardOption[] | undefined;
  let contextOptions: WizardOption[] | undefined;
  let energyOptions: WizardOption[] | undefined;
  let contextNameSuggestions: string[] | undefined;

  try {
    const [tierRows, ageRows, ctxRows, energyRows, suggestions] = await Promise.all([
      getConfigObjects<{ label: string; sub?: string; icon?: string }>("onboarding_tier_options"),
      getConfigObjects<{ label: string; sub?: string }>("onboarding_age_groups"),
      getConfigObjects<{ label: string; icon?: string }>("onboarding_contexts"),
      getConfigObjects<{ label: string; sub?: string; icon?: string }>("onboarding_energy"),
      getConfigValues("onboarding_context_name_suggestions"),
    ]);

    if (tierRows.length > 0) {
      tierOptions = tierRows.map((r) => ({
        value: r.value,
        label: r.metadata?.label ?? r.value,
        sub: r.metadata?.sub,
        icon: r.metadata?.icon,
      }));
    }
    if (ageRows.length > 0) {
      ageGroupOptions = ageRows.map((r) => ({
        value: r.value,
        label: r.metadata?.label ?? r.value,
        sub: r.metadata?.sub,
      }));
    }
    if (ctxRows.length > 0) {
      contextOptions = ctxRows.map((r) => ({
        value: r.value,
        label: r.metadata?.label ?? r.value,
        icon: r.metadata?.icon,
      }));
    }
    if (energyRows.length > 0) {
      energyOptions = energyRows.map((r) => ({
        value: r.value,
        label: r.metadata?.label ?? r.value,
        sub: r.metadata?.sub,
        icon: r.metadata?.icon,
      }));
    }
    if (suggestions.length > 0) {
      contextNameSuggestions = suggestions;
    }
  } catch {
    // CMS config fetch failed — wizard will use hard-coded defaults
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-champagne/20 px-4 py-12">
      <OnboardingWizard
        editMode={isEditMode}
        initialValues={initialValues}
        invitePackNames={invitePackNames}
        tierOptions={tierOptions}
        ageGroupOptions={ageGroupOptions}
        contextOptions={contextOptions}
        energyOptions={energyOptions}
        contextNameSuggestions={contextNameSuggestions}
      />
    </main>
  );
}
