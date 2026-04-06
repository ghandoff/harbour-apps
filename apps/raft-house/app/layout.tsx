import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { HarbourNav } from "@windedvertigo/auth/harbour-nav";
import { FeedbackWidget } from "@windedvertigo/feedback";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://windedvertigo.com"),
  title: "raft.house — winded.vertigo",
  description:
    "a facilitated, real-time learning platform that helps groups cross threshold concepts through play. use it to cross, then let it go.",
  alternates: {
    canonical: "/harbour/raft-house",
  },
  openGraph: {
    type: "website",
    title: "raft.house — winded.vertigo",
    description:
      "facilitated threshold crossings — jackbox meets escape room meets socratic seminar.",
    url: "/harbour/raft-house",
    siteName: "winded.vertigo",
  },
  twitter: {
    card: "summary",
    title: "raft.house — winded.vertigo",
    description:
      "facilitated threshold crossings — jackbox meets escape room meets socratic seminar.",
  },
};

export default async function RootLayout({
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
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <a href="#main" className="skip-link">
          skip to content
        </a>
        <HarbourNav currentApp="raft-house" user={session?.user} />
        <main id="main">{children}</main>
        <FeedbackWidget appSlug="raft-house" />
      </body>
    </html>
  );
}
