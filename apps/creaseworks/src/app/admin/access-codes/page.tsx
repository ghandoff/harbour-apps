/**
 * /admin/access-codes — manage campaign access codes.
 *
 * Shows the code creation form (single or batch) and a table of all
 * existing codes with redemption counts. Follows /admin/invites pattern.
 */

import { requireAdmin } from "@/lib/auth-helpers";
import { listAllCodes } from "@/lib/queries/access-codes";
import { getAllReadyPacks } from "@/lib/queries/packs";
import Link from "next/link";
import CodeForm from "./code-form";
import { RevokeButton } from "./revoke-button";

export const metadata = { title: "access codes — admin" };
export const dynamic = "force-dynamic";

function formatExpiry(date: string | null): string {
  if (!date) return "no expiry";
  return new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default async function AdminAccessCodesPage() {
  await requireAdmin();
  const [codes, packs] = await Promise.all([
    listAllCodes(),
    getAllReadyPacks(),
  ]);

  const active = codes.filter(
    (c) => !c.revoked_at && (!c.expires_at || new Date(c.expires_at) > new Date()),
  );
  const expired = codes.filter(
    (c) => !c.revoked_at && c.expires_at && new Date(c.expires_at) <= new Date(),
  );

  return (
    <main className="min-h-screen px-6 py-16 max-w-4xl mx-auto space-y-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">access codes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            redeemable codes for workshop participants, conferences, and client cohorts.
            different from{" "}
            <Link href="/admin/invites" className="underline">
              email invites
            </Link>{" "}
            — anyone with a valid code can redeem without prior registration.
          </p>
        </div>
      </div>

      {/* ── create form ─────────────────────────────────────────── */}
      <section>
        <h2 className="text-sm font-medium mb-4 text-muted-foreground uppercase tracking-wider">
          create new code
        </h2>
        <div className="rounded-lg border border-border p-6 max-w-lg">
          <CodeForm packs={packs} />
        </div>
      </section>

      {/* ── distribution model explainer ──────────────────────── */}
      <section className="rounded-lg bg-muted/40 border border-border p-4 text-xs text-muted-foreground space-y-1.5">
        <p className="font-medium text-foreground text-sm">distribution models</p>
        <p><strong>single campaign code</strong> (e.g. PRME2026, max uses = 50) — one code on a slide or handout. anyone with the code gets in until the limit is hit.</p>
        <p><strong>batch unique codes</strong> — generate N single-use codes (e.g. PRME-X7K2) for per-person accountability. export the list and send one to each participant.</p>
        <p><strong>time-limited</strong> — set &ldquo;expires in days&rdquo; on either type. the code stops working after that date.</p>
        <p><strong>unlimited</strong> — omit max uses and expiry for open-ended access (e.g. for a public promo).</p>
      </section>

      {/* ── active codes table ──────────────────────────────────── */}
      <section>
        <h2 className="text-sm font-medium mb-4 text-muted-foreground uppercase tracking-wider">
          active codes ({active.length})
        </h2>
        {active.length === 0 ? (
          <p className="text-sm text-muted-foreground">no active codes yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/30">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">code</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">campaign</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">packs</th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">redeemed</th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">limit</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">expires</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {active.map((code) => {
                  const atLimit = code.max_uses !== null && code.use_count >= code.max_uses;
                  return (
                    <tr key={code.id} className="hover:bg-muted/20">
                      <td className="px-4 py-2 font-mono font-medium">{code.code}</td>
                      <td className="px-4 py-2 text-muted-foreground">{code.campaign}</td>
                      <td className="px-4 py-2 text-muted-foreground text-xs">
                        {code.pack_names?.join(", ") || "—"}
                      </td>
                      <td className={`px-4 py-2 text-right tabular-nums ${atLimit ? "text-red-500 font-medium" : ""}`}>
                        {code.use_count}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums text-muted-foreground">
                        {code.max_uses ?? "∞"}
                      </td>
                      <td className="px-4 py-2 text-muted-foreground text-xs">
                        {formatExpiry(code.expires_at)}
                      </td>
                      <td className="px-4 py-2">
                        <RevokeButton codeId={code.id} codeStr={code.code} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── expired codes ───────────────────────────────────────── */}
      {expired.length > 0 && (
        <section>
          <h2 className="text-sm font-medium mb-4 text-muted-foreground uppercase tracking-wider">
            expired ({expired.length})
          </h2>
          <div className="overflow-x-auto rounded-lg border border-border opacity-60">
            <table className="w-full text-sm">
              <thead className="bg-muted/20">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">code</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">campaign</th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">redeemed</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">expired</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {expired.map((code) => (
                  <tr key={code.id}>
                    <td className="px-4 py-2 font-mono line-through">{code.code}</td>
                    <td className="px-4 py-2 text-muted-foreground">{code.campaign}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{code.use_count}</td>
                    <td className="px-4 py-2 text-muted-foreground text-xs">{formatExpiry(code.expires_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}

