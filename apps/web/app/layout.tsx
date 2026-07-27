import '@food-marketplace/ui/tokens.css';

import type { Metadata, Viewport } from 'next';

import { AppProviders } from '../src/client/providers/app-providers';

export const metadata: Metadata = {
  title: 'Food Marketplace',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'Food Marketplace' },
};

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
