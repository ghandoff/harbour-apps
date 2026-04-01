import type { Metadata } from "next";
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
        <nav className="px-6 pt-4">
          <a
            href="/harbour"
            className="text-xs uppercase tracking-wider opacity-30 hover:opacity-60 transition-opacity inline-block"
          >
            &larr; harbour
          </a>
        </nav>
        <main id="main">{children}</main>
      </body>
    </html>
  );
}
