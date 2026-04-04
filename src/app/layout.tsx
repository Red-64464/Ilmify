import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import AppShell from "@/components/layout/AppShell";
import "./globals.css";

const geistSans = localFont({
  src: "../../public/fonts/GeistVF.woff2",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "../../public/fonts/GeistMonoVF.woff2",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Ilmify - Votre compagnon de savoir islamique",
  description:
    "Explorez, apprenez et renforcez vos connaissances islamiques avec des quiz, des flashcards et une bibliothèque complète.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#0d1117",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="pattern-bg min-h-full flex flex-col">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
