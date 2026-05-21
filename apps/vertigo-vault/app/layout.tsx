import { Inter } from "next/font/google";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { Providers } from "@/components/providers";
import { HarbourNav } from "@windedvertigo/auth/harbour-nav";
import { FeedbackWidget } from "@windedvertigo/feedback";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://windedvertigo.com"),
  title: "vertigo.vault — winded.vertigo",
  description:
    "a curated collection of group activities, energizers, and reflective exercises designed to spark curiosity, collaboration, and creative thinking.",
  alternates: {
    canonical: "/harbour/vertigo-vault",
  },
  openGraph: {
    type: "website",
    title: "vertigo.vault — group activities, energizers, and reflective exercises",
    description:
      "a curated collection of learning activities, energizers, and reflections designed to spark curiosity, collaboration, and creative thinking.",
    url: "/harbour/vertigo-vault",
    siteName: "winded.vertigo · harbour",
    // 1200×720 tile lives on R2 alongside the rest of the harbour series.
    // Bumps twitter:card from summary (square) to summary_large_image so
    // the shareable preview matches the other PRME-launch apps.
    images: [
      {
        url: "https://pub-60282cf378c248cf9317acfb691f6c99.r2.dev/harbour-tiles/vertigo-vault.png",
        width: 1200,
        height: 720,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "vertigo.vault — group activities, energizers, and reflective exercises",
    description:
      "a curated collection of learning activities, energizers, and reflections designed to spark curiosity, collaboration, and creative thinking.",
    images: [
      "https://pub-60282cf378c248cf9317acfb691f6c99.r2.dev/harbour-tiles/vertigo-vault.png",
    ],
  },
  icons: {
    icon: [
      { url: "/images/favicon.ico", type: "image/x-icon" },
      { url: "/images/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/images/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/images/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased">
        <Providers>
          <HarbourNav currentApp="vertigo-vault" user={session?.user} />
          {children}
          <FeedbackWidget appSlug="vertigo-vault" />
        </Providers>
      </body>
    </html>
  );
}
