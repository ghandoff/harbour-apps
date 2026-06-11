/**
 * Institutional registration + license tagging for the harbour hub.
 *
 * After a successful access-code redemption a member can OPTIONALLY register an
 * institutional email + institution (ask, don't force). We:
 *   - record it in institutional_registrations (migration 061) — the impact-report
 *     metric + institutional-license lead list, tagged by email domain;
 *   - write users.institution (existing column, migration 051);
 *   - cross-reference verified_domains (migration 008): if the institutional
 *     domain belongs to a verified org, link the user (org_memberships, capped by
 *     member_cap) so they inherit any institutional-license org entitlements
 *     (effective on their next session refresh) — extra value now or later.
 *
 * Mirrors apps/creaseworks/src/lib/queries/organisations.ts (getOrgByVerifiedDomain
 * / autoJoinOrg), ported to the hub's stateless db client.
 */

import { sql } from "../db";

export interface VerifiedOrg {
  org_id: string;
  org_name: string;
}

/** The verified org owning a domain, or null. */
export async function getOrgByVerifiedDomain(
  domain: string,
): Promise<VerifiedOrg | null> {
  const r = await sql.query(
    `SELECT o.id AS org_id, o.name AS org_name
       FROM verified_domains vd
       JOIN organisations o ON o.id = vd.org_id
      WHERE vd.domain = $1 AND vd.verified = TRUE
      LIMIT 1`,
    [domain.toLowerCase().trim()],
  );
  return r.rows[0] ?? null;
}

export interface RegisterInput {
  userId: string;
  institutionalEmail: string;
  institution?: string | null;
  consent: boolean;
  campaign?: string;
}

export interface RegisterResult {
  domain: string;
  /** set when the institution's domain is a verified org the user was linked to */
  linkedOrg: VerifiedOrg | null;
}

export async function registerInstitutional(
  input: RegisterInput,
): Promise<RegisterResult> {
  const email = input.institutionalEmail.trim().toLowerCase();
  const domain = email.split("@")[1]?.toLowerCase().trim() ?? "";
  const campaign = input.campaign ?? "ppcs-2026";
  const consentAt = input.consent ? new Date().toISOString() : null;

  // Cross-reference a verified org by the institutional domain.
  const org = domain ? await getOrgByVerifiedDomain(domain) : null;

  // Upsert the registration (one per user per campaign). COALESCE preserves a
  // prior consent/institution/org if a later submit omits them.
  await sql.query(
    `INSERT INTO institutional_registrations
       (user_id, institutional_email, email_domain, institution, campaign, consent_at, org_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (user_id, campaign) DO UPDATE SET
       institutional_email = EXCLUDED.institutional_email,
       email_domain        = EXCLUDED.email_domain,
       institution         = COALESCE(EXCLUDED.institution, institutional_registrations.institution),
       consent_at          = COALESCE(EXCLUDED.consent_at, institutional_registrations.consent_at),
       org_id              = COALESCE(EXCLUDED.org_id, institutional_registrations.org_id),
       updated_at          = NOW()`,
    [input.userId, email, domain, input.institution ?? null, campaign, consentAt, org?.org_id ?? null],
  );

  if (input.institution) {
    await sql.query(
      `UPDATE users SET institution = COALESCE(institution, $2) WHERE id = $1`,
      [input.userId, input.institution.trim()],
    );
  }

  // Link to the verified org, respecting member_cap (institutional seat limits).
  let linkedOrg: VerifiedOrg | null = null;
  if (org) {
    const capRow = await sql.query(
      `SELECT member_cap FROM organisations WHERE id = $1`,
      [org.org_id],
    );
    const cap: number | null = capRow.rows[0]?.member_cap ?? null;
    let underCap = true;
    if (cap !== null) {
      const countRow = await sql.query(
        `SELECT COUNT(*)::int AS n FROM org_memberships WHERE org_id = $1`,
        [org.org_id],
      );
      underCap = (countRow.rows[0]?.n ?? 0) < cap;
    }
    if (underCap) {
      await sql.query(
        `INSERT INTO org_memberships (user_id, org_id, role)
         VALUES ($1, $2, 'member')
         ON CONFLICT (user_id, org_id) DO NOTHING`,
        [input.userId, org.org_id],
      );
      linkedOrg = org;
    }
  }

  return { domain, linkedOrg };
}
