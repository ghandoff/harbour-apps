import { createHarbourAuth } from "@windedvertigo/auth";
import { addToAudience, HARBOUR_MEMBERS_AUDIENCE } from "./resend-audience";
import { isStaffEmail } from "./queries/membership";

/**
 * Harbour hub auth.
 *
 * The hub is PUBLIC — any email (Google or magic-link) may sign in. We
 * deliberately omit `allowedEmailDomains` so customers can self-serve; the
 * `@windedvertigo.com` staff/customer distinction is drawn downstream
 * (`isStaffEmail`) rather than at the door. Nested apps that need to stay
 * team-only keep their own `allowedEmailDomains`.
 *
 * Sessions share the `.windedvertigo.com` cookie with creaseworks,
 * vertigo-vault, and depth-chart — signing in here authenticates you there
 * too (access within those apps is still gated by their own entitlements).
 *
 * `onFirstSignIn` enrolls non-staff sign-ins into the `harbour-members`
 * Resend audience — the announcement/marketing list. Idempotent and
 * best-effort: a Resend failure never blocks sign-in. Staff are skipped.
 */
const { handlers, auth, signIn, signOut, authConfig } = createHarbourAuth({
  appName: "",

  async onFirstSignIn(_userId: string, email: string) {
    if (isStaffEmail(email)) return;
    await addToAudience(HARBOUR_MEMBERS_AUDIENCE, email.toLowerCase().trim());
  },
});

export { handlers, auth, signIn, signOut, authConfig };
