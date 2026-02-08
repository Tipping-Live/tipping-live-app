import type { Metadata } from 'next';
import Providers from './providers';
import "./globals.css";

export const metadata: Metadata = {
  title: 'EveryAid App',
  description: 'Instant disaster relief through live broadcasting and zero-fee donations',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-US">
      <body className="min-h-screen bg-app-radial bg-bg text-text">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
