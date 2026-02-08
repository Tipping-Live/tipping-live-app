import type { Metadata } from 'next';
import Providers from './providers';
import "./globals.css";

export const metadata: Metadata = {
  title: 'EveryAid App',
  description: 'Live tipping MVP with Yellow Nitrolite + wagmi',
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
