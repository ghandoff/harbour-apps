import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { auth } from "@/lib/auth";
import AuthSessionProvider from "@/components/session-provider";
import { HarbourNav } from "@windedvertigo/auth/harbour-nav";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://windedvertigo.com"),
  title: "mirror.log — the harbour",
  description:
    "a metacognitive reflection tool. review your reflections across harbour activities, notice patterns, and track your growth.",
  alternates: { canonical: "/harbour/mirror-log" },
  openGraph: {
    type: "website",
    title: "mirror.log — the harbour",
    description:
      "your learning journal from winded.vertigo. browse reflections, spot patterns, and build self-awareness across harbour activities.",
    url: "/harbour/mirror-log",
    siteName: "winded.vertigo",
  },
};

export default async function MirrorLogLayout({
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
          <HarbourNav currentApp="mirror-log" user={session?.user} />
          {children}
        </AuthSessionProvider>
        <Analytics />
      </body>
    </html>
  );
}
