import './globals.css';
import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MarketplaceShell from '@/components/MarketplaceShell';
import { AuthProvider } from '@/lib/auth';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });

export const metadata: Metadata = {
  title: 'NexusVault — PC Game Store',
  description: 'Discover, install, and play PC games with a modern storefront experience.',
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="75" font-size="75" fill="%23fff">N</text></svg>',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${outfit.variable}`}>
      <body className="min-h-screen bg-[#121212] flex flex-col font-sans antialiased">
        <AuthProvider>
          <Navbar />
          <MarketplaceShell />

          <main className="flex-1 pt-11 w-full h-full">
            {children}
          </main>

          <Footer />
          <Toaster richColors position="bottom-right" />
        </AuthProvider>
      </body>
    </html>
  );
}
