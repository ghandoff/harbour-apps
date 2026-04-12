import { Inter } from "next/font/google";
import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { FeedbackWidget } from "@windedvertigo/feedback";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://windedvertigo.com"),
  title: "the harbour — winded.vertigo",
  description:
    "the harbour is protected water — a still place where play is already happening and nothing needs to be proved. playful tools for connection, creativity, and growth from winded.vertigo.",
  alternates: {
    canonical: "/harbour",
  },
  openGraph: {
    type: "website",
    title: "the harbour — winded.vertigo",
    description:
      "winded.vertigo is a learning design collective building evidence-based educational experiences for global organisations including the UN, IDB, Sesame Workshop, and UNICEF.",
    url: "/harbour",
    siteName: "winded.vertigo",
    images: [{ url: "/images/logo.png", width: 512, height: 512 }],
  },
  twitter: {
    card: "summary",
    title: "the harbour — winded.vertigo",
    description:
      "winded.vertigo is a learning design collective building evidence-based educational experiences for global organisations including the UN, IDB, Sesame Workshop, and UNICEF.",
    images: ["/images/logo.png"],
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* Progressive enhancement: show all content if JS is disabled */}
        <noscript>
          <style>{`.fade-up, .card-stagger { opacity: 1 !important; transform: none !important; }`}</style>
        </noscript>
      </head>
      <body className="bg-[var(--wv-cadet)] text-[var(--color-text-on-dark)] font-[family-name:var(--font-body)] antialiased">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        {children}
        <FeedbackWidget appSlug="harbour" />
        <Analytics />
      </body>
    </html>
  );
}
