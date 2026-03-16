import type { Metadata } from "next";
import AuthSessionProvider from "@/components/session-provider";
import AuthButton from "@/components/auth-button";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://windedvertigo.com"),
  title: {
    template: "%s — depth.chart",
    default: "depth.chart — formative assessment task generator",
  },
  description:
    "generate methodologically sound formative assessment tasks from lesson plans and syllabi, grounded in constructive alignment and evaluative judgment theory.",
  alternates: {
    canonical: "/depth-chart",
  },
  openGraph: {
    type: "website",
    title: "depth.chart — formative assessment task generator",
    description:
      "generate methodologically sound formative assessment tasks from lesson plans and syllabi.",
    url: "/depth-chart",
    siteName: "winded.vertigo",
    images: [{ url: "/images/logo.png", width: 512, height: 512 }],
  },
  twitter: {
    card: "summary",
    title: "depth.chart — formative assessment task generator",
    description:
      "generate methodologically sound formative assessment tasks from lesson plans and syllabi.",
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
          <nav className="fixed top-0 right-0 z-40 p-4">
            <AuthButton />
          </nav>
          {children}
        </AuthSessionProvider>
      </body>
    </html>
  );
}
