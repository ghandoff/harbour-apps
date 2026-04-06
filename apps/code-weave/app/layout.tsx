import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { auth } from "@/lib/auth";
import AuthSessionProvider from "@/components/session-provider";
import { FeedbackWidget } from "@windedvertigo/feedback";
import { HarbourNav } from "@windedvertigo/auth/harbour-nav";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://windedvertigo.com"),
  title: "code.weave — the harbour",
  description: "a visual recursion and abstraction playground. write small programs, see the call stack unfold, and discover why recursion is the most natural way to decompose problems.",
  alternates: { canonical: "/harbour/code-weave" },
  openGraph: {
    type: "website",
    title: "code.weave — the harbour",
    description: "a visual recursion and abstraction playground. write small programs, see the call stack unfold, and discover why recursion is the most natural way to decompose problems.",
    url: "/harbour/code-weave",
    siteName: "winded.vertigo",
  },
};

export default async function CodeWeaveLayout({
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
          <HarbourNav currentApp="code-weave" user={session?.user} />
          {children}
        </AuthSessionProvider>
        <FeedbackWidget appSlug="code-weave" />
        <Analytics />
      </body>
    </html>
  );
}
