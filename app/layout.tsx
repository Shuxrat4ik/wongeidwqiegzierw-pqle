import './globals.css';
import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MarketplaceShell from '@/components/MarketplaceShell';
import { AuthProvider } from '@/lib/auth';
import { Toaster } from '@/components/ui/sonner';
import { SpeedInsights } from "@vercel/speed-insights/next"

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });

export const metadata: Metadata = {
  title: 'NexusVault — PC Game Store',
  description: 'Discover, install, and play PC games with a modern storefront experience.',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${outfit.variable}`}>
      <body className="min-h-screen bg-[#080a12] flex flex-col font-sans antialiased">

        <AuthProvider>
          <Navbar />
          <MarketplaceShell />

          {/* META HERE (to‘g‘ri yo‘l) */}
          <meta
            name="impact-site-verification"
            content="69996f3c-e366-4eb7-9662-bcf219f580e5"
          />

          {/* ONLY ONCE */}
          <main className="flex-1 pt-11 w-full h-full">
            {children}
          </main>

        <html lang="en">
          <body>
            {children}

            <SpeedInsights />
          </body>
        </html>

          <Footer />
          <Toaster richColors position="bottom-right" />
        </AuthProvider>

      </body>
    </html>
  );
}