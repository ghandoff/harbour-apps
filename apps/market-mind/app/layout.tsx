import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { auth } from "@/lib/auth";
import AuthSessionProvider from "@/components/session-provider";
import { FeedbackWidget } from "@windedvertigo/feedback";
import { HarbourNav } from "@windedvertigo/auth/harbour-nav";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://windedvertigo.com"),
  title: "market.mind — the harbour",
  description: "an opportunity cost trading game where every decision has visible alternatives. discover comparative advantage, marginal thinking, and the sunk cost fallacy through play.",
  alternates: { canonical: "/harbour/market-mind" },
  openGraph: {
    type: "website",
    title: "market.mind — the harbour",
    description: "an opportunity cost trading game where every decision has visible alternatives. discover comparative advantage, marginal thinking, and the sunk cost fallacy through play.",
    url: "/harbour/market-mind",
    siteName: "winded.vertigo",
  },
};

export default async function MarketMindLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-[var(--wv-cadet)] text-[var(--color-text-on-dark)] font-[family-name:var(--font-body)] antialiased">
        <AuthSessionProvider>
          <a href="#main" className="skip-link">skip to content</a>
          <HarbourNav currentApp="market-mind" user={session?.user} />
          {children}
        </AuthSessionProvider>
        <FeedbackWidget appSlug="market-mind" />
        <Analytics />
      </body>
    </html>
  );
}
