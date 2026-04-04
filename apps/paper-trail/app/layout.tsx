import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { auth } from "@/lib/auth";
import AuthSessionProvider from "@/components/session-provider";
import { HarbourNav } from "@windedvertigo/auth/harbour-nav";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://windedvertigo.com"),
  title: "paper.trail — the harbour",
  description:
    "a physical-digital bridge. follow hands-on activities, capture your work with your camera, and annotate what you discover.",
  alternates: { canonical: "/harbour/paper-trail" },
  openGraph: {
    type: "website",
    title: "paper.trail — the harbour",
    description:
      "find, fold, unfold, find again. a hands-on toolkit from winded.vertigo that bridges physical making and digital reflection.",
    url: "/harbour/paper-trail",
    siteName: "winded.vertigo",
  },
};

export default async function PaperTrailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[var(--wv-cadet)] text-[var(--color-text-on-dark)] font-[family-name:var(--font-body)] antialiased">
        <AuthSessionProvider>
          <a href="#main" className="skip-link">
            skip to content
          </a>
          <HarbourNav currentApp="paper-trail" user={session?.user} />
          {children}
        </AuthSessionProvider>
        <Analytics />
      </body>
    </html>
  );
}
