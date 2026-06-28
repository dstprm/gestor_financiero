import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { CookieBanner } from "@/components/CookieBanner";
import { PaddleProvider } from "@/components/billing/PaddleProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "SimplyOrg — Org Chart & Scenario Planning for Growing Teams",
  description:
    "Build your live org chart, model reorgs and hiring plans with scenarios, compare before and after, and export to PowerPoint. Free trial, no credit card required.",
  metadataBase: new URL("https://simplyorg.vercel.app"),
  alternates: {
    canonical: "https://simplyorg.vercel.app",
  },
  openGraph: {
    title: "SimplyOrg — Plan your org before you commit to it",
    description:
      "Build your live org chart and create scenarios to model changes — reorgs, new hires, restructures — without touching the real thing. Compare side by side, then export to a deck.",
    url: "https://simplyorg.vercel.app",
    siteName: "SimplyOrg",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SimplyOrg — Plan your org before you commit to it",
    description:
      "Build your live org chart and create scenarios to model changes — reorgs, new hires, restructures — without touching the real thing.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="scroll-smooth">
        <head>
          {/* Prevent flash of wrong theme before React hydrates */}
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){var t=localStorage.getItem('theme')||(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');if(t==='dark')document.documentElement.classList.add('dark');})();`,
            }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "SoftwareApplication",
                name: "SimplyOrg",
                applicationCategory: "BusinessApplication",
                description:
                  "Org chart and scenario planning tool for growing teams",
                offers: {
                  "@type": "Offer",
                  price: "49",
                  priceCurrency: "USD",
                },
                url: "https://simplyorg.vercel.app",
              }),
            }}
          />
        </head>
        <body className="antialiased">
          <PaddleProvider>
            <ThemeProvider>
              {children}
            </ThemeProvider>
          </PaddleProvider>
          <CookieBanner />
          <Toaster richColors position="bottom-right" />
        </body>
      </html>
    </ClerkProvider>
  );
}
