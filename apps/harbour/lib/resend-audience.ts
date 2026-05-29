/**
 * Resend audience helper — shared between the harbour sign-in flow
 * (lib/auth.ts onFirstSignIn) and the register-interest endpoint.
 *
 * Adds a contact to a named Resend audience, creating the audience lazily on
 * first use. Resend errors are logged and swallowed — enrollment is a
 * best-effort side effect, never a reason to block the user-facing flow.
 *
 * The `harbour-members` audience is the marketing/announcement list that
 * customer (non-staff) sign-ins are added to.
 */

import { Resend } from "resend";

/** The audience every customer (non-staff) sign-in is enrolled into. */
export const HARBOUR_MEMBERS_AUDIENCE = "harbour-members";

let _resend: Resend | null = null;
function getResend(): Resend {
  if (_resend) return _resend;
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not set");
  _resend = new Resend(key);
  return _resend;
}

// audience_id cache (per worker instance) — avoids a list+find on every call.
const audienceIdCache = new Map<string, string>();

export async function resolveAudienceId(name: string): Promise<string> {
  const cached = audienceIdCache.get(name);
  if (cached) return cached;

  const resend = getResend();
  const list = await resend.audiences.list();
  const existing = list.data?.data?.find((a) => a.name === name);
  if (existing) {
    audienceIdCache.set(name, existing.id);
    return existing.id;
  }

  const created = await resend.audiences.create({ name });
  if (!created.data?.id) {
    throw new Error(`failed to create audience ${name}`);
  }
  audienceIdCache.set(name, created.data.id);
  return created.data.id;
}

/**
 * Add an email to a Resend audience (creating the audience if needed).
 *
 * Idempotent: re-adding an existing contact surfaces as a `validation_error`
 * from Resend, which we treat as success. Never throws — returns `false` on
 * failure so callers can log/alert, but the flow continues either way.
 */
export async function addToAudience(
  audienceName: string,
  email: string,
): Promise<boolean> {
  try {
    const audienceId = await resolveAudienceId(audienceName);
    const result = await getResend().contacts.create({
      audienceId,
      email,
      unsubscribed: false,
    });
    if (result.error && result.error.name !== "validation_error") {
      console.warn(
        `[resend-audience] contact create returned error for ${audienceName}:`,
        result.error,
      );
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[resend-audience] enroll failed for ${audienceName}:`, err);
    return false;
  }
}
