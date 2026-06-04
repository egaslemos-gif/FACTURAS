import type { Metadata, Viewport } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Providers } from "@/components/Providers";
import { PwaInitializer } from "@/components/pwa/PwaInitializer";
import { Toaster } from "sonner";
import { NetworkAwareness } from "@/components/network/NetworkAwareness";
import { OfflineBanner } from "@/components/network/OfflineBanner";

const geist = Geist({subsets:['latin'],variable:'--font-geist'});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Proforma360 — Proformas Profissionais",
    template: "%s | Proforma360",
  },
  description:
    "Crie, gerencie e partilhe proformas e orçamentos profissionais. Dados armazenados no seu Google Drive.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Proforma360",
  },
  openGraph: {
    type: "website",
    locale: "pt_MZ",
    url: "https://proforma360.vercel.app",
    title: "Proforma360",
    description: "Crie, envie e acompanhe propostas comerciais profissionais. CRM • Pipeline • PDFs • Offline-First.",
    siteName: "Proforma360",
    images: [
      {
        url: "https://proforma360.vercel.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "Proforma360 - Gestão comercial moderna para empresas",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Proforma360",
    description: "Crie, envie e acompanhe propostas comerciais profissionais. CRM • Pipeline • PDFs • Offline-First.",
    images: ["https://proforma360.vercel.app/og-image.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#004ac6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt" className={cn("h-full", inter.variable, geist.variable)}>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className="min-h-full flex flex-col antialiased overflow-x-hidden font-sans bg-[var(--color-surface)] text-[var(--color-on-surface)]" suppressHydrationWarning>
        <NetworkAwareness />
        <OfflineBanner />
        <div className="flex-1 flex flex-col min-h-0">
          <Providers>
            <PwaInitializer>
              {children}
              <Toaster position="top-right" richColors />
            </PwaInitializer>
          </Providers>
        </div>
      </body>
    </html>
  );
}
