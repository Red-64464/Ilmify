import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppShell } from '@/components/layout/AppShell';
import { SplashScreen } from '@/components/layout/SplashScreen';

export const metadata: Metadata = {
  title: 'Ilmify — Savoir • Lumière • Sérénité',
  description: 'Plateforme islamique moderne d\'apprentissage, de mémorisation et d\'organisation du savoir.',
  manifest: '/manifest.json',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0a1f1b',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="font-body antialiased">
        <SplashScreen />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
