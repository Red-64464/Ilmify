import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "Ilmify — Savoir Islamique",
  description: "Plateforme islamique moderne d'apprentissage, de mémorisation et de réflexion personnelle.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#0A1F1C",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full bg-ilm-darkest text-ilm-ivory">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
