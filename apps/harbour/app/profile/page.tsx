/**
 * Harbour profile capture — the aboard→crew gateway.
 *
 * Server component: requires a session (middleware also guards /profile), reads
 * any existing profile to prefill, and renders the client form. Completing it
 * records role/interests in play_preferences, flips onboarding_completed, and
 * enrols non-staff in the members audience (see /api/profile).
 */

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getProfile } from "@/lib/queries/membership";
import { ProfileForm } from "./profile-form";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.email || !session.userId) {
    redirect("/login?callbackUrl=/profile");
  }

  const profile = await getProfile(session.userId);
  const prefs = profile.playPreferences ?? {};
  const initialRole = typeof prefs.role === "string" ? prefs.role : null;
  const initialInterests = Array.isArray(prefs.interests)
    ? (prefs.interests as string[])
    : [];

  return (
    <main id="main" className="min-h-screen px-6 py-16">
      <div className="max-w-xl mx-auto space-y-8">
        <header className="space-y-2">
          <p className="text-xs font-semibold tracking-[0.25em] text-[var(--color-accent-on-dark)]">
            {profile.onboardingCompleted ? "your profile" : "welcome aboard"}
          </p>
          <h1 className="text-3xl font-bold text-[var(--color-text-on-dark)] tracking-tight">
            {profile.onboardingCompleted
              ? "update your harbour"
              : "make the harbour yours"}
          </h1>
          <p className="text-base text-[var(--color-text-on-dark-muted)] leading-relaxed">
            tell us a little about you so the harbour can point you at the right
            boats. you can change this any time.
          </p>
        </header>

        <ProfileForm
          initialRole={initialRole}
          initialInterests={initialInterests}
        />

        <div className="text-center">
          <Link
            href="/"
            className="text-xs text-[var(--color-text-on-dark-muted)] hover:text-[var(--wv-champagne)] transition-colors"
          >
            ← back to the harbour
          </Link>
        </div>
      </div>
    </main>
  );
}
