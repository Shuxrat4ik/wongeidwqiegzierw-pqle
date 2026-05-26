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
  // 'data:' URI o'rniga public papkadagi fayl yo'lini ishlatish tavsiya etiladi
  icons: {
    icon: '/favicon.ico', 
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${outfit.variable} scroll-smooth`}>
      <body className="min-h-screen bg-[#121212] flex flex-col font-sans antialiased">
        <AuthProvider>
          <Navbar />
          
          {/* MarketplaceShell hamma sahifa uchun umumiy bo'lsa, uni shunday qoldiramiz */}
          <MarketplaceShell />

          <main className="flex-1 w-full">
            {children}
          </main>

          <Footer />
          <Toaster richColors position="bottom-right" />
        </AuthProvider>
      </body>
    </html>
  );
}