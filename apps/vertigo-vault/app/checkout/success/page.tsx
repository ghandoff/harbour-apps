import type { Metadata } from "next";
import EntitlementConfirmer from "@/components/ui/entitlement-confirmer";

export const metadata: Metadata = {
  title: "purchase confirmed — vertigo.vault",
  description:
    "your vault pack purchase is confirmed. you now have full access.",
  robots: { index: false, follow: false },
};

interface Props {
  searchParams: Promise<{ pack?: string; session_id?: string }>;
}

export default async function CheckoutSuccessPage({ searchParams }: Props) {
  const { pack } = await searchParams;
  const packName = pack || "your vault pack";
  const packDetailHref = pack?.toLowerCase().includes("practitioner")
    ? "/practitioner"
    : "/explorer";

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div
        className="w-full max-w-md p-8 rounded-2xl shadow-lg text-center"
        style={{ backgroundColor: "var(--vault-card-bg)" }}
      >
        {/* success icon */}
        <div
          className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-6"
          style={{ backgroundColor: "rgba(107,142,107,0.15)" }}
        >
          <span className="text-2xl">✓</span>
        </div>

        {/* Confirmer polls /api/vault/tier with exponential backoff and
            swaps copy + CTA once the Stripe webhook has propagated the
            entitlement to Postgres. Hides the "browse activities" CTA
            during the race window so users can't race themselves. */}
        <EntitlementConfirmer
          packName={packName}
          packDetailHref={packDetailHref}
        />
      </div>
    </main>
  );
}
