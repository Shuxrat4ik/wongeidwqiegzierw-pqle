'use client';

import Link from 'next/link';
import { Twitter, Instagram, Youtube, MessageCircle, Send } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  const [year, setYear] = useState(2026);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      toast.error('Please enter a valid email');
      return;
    }
    setSubscribing(true);
    await new Promise(r => setTimeout(r, 500));
    toast.success('Thanks for subscribing!');
    setEmail('');
    setSubscribing(false);
  }

  return (
    <footer className="border-t border-[#121212] bg-[#121212]">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div>
            <div className="mb-5">
              <BrandLogo size="sm" />
            </div>
            <p className="text-[#757575] text-sm leading-relaxed mb-5">
              Your destination for the best PC games. Discover, download, and play today.
            </p>
            <div className="flex items-center gap-2.5">
              <SocialLink href="https://twitter.com" icon={<Twitter className="w-4 h-4" />} label="Twitter" />
              <SocialLink href="https://instagram.com" icon={<Instagram className="w-4 h-4" />} label="Instagram" />
              <SocialLink href="https://youtube.com" icon={<Youtube className="w-4 h-4" />} label="YouTube" />
              <SocialLink href="https://discord.com" icon={<MessageCircle className="w-4 h-4" />} label="Discord" />
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-5 tracking-wide">Quick Links</h3>
            <ul className="space-y-3">
              <FooterLink href="/" label="Home" />
              <FooterLink href="/games" label="Store" />
              <FooterLink href="/wishlist" label="Wishlist" />
              <FooterLink href="/cart" label="Cart" />
              <FooterLink href="/library" label="Library" />
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-5 tracking-wide">Support</h3>
            <ul className="space-y-3">
              <FooterLink href="/" label="Help Center" />
              <FooterLink href="/" label="Refund Policy" />
              <FooterLink href="/" label="Terms of Service" />
              <FooterLink href="/" label="Privacy Policy" />
              <FooterLink href="/" label="Contact Us" />
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-5 tracking-wide">Stay Updated</h3>
            <p className="text-[#757575] text-sm mb-4 leading-relaxed">Get the latest deals and new releases delivered to your inbox.</p>
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="flex-1 min-w-0 bg-[#1f1f1f] border border-[#2e2e2e] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-[#757575] focus:outline-none focus:border-[#0078f4] focus:ring-1 focus:ring-[#0078f4]/30 transition-all"
              />
              <button
                type="submit"
                disabled={subscribing}
                className="shrink-0 px-3.5 py-2.5 bg-[#0078f4] hover:bg-[#0060df] text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[#2e2e2e] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[#5a5a5a] text-xs">
            &copy; {year} NexusVault. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <Link href={href} className="text-sm text-[#8a8a8a] transition-colors hover:text-[#26bbff] hover:underline hover:underline-offset-2">
        {label}
      </Link>
    </li>
  );
}

function SocialLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="w-9 h-9 rounded-lg bg-[#1f1f1f] border border-[#2e2e2e] flex items-center justify-center text-[#757575] hover:text-white hover:border-[#0078f4] hover:bg-[#0078f4]/10 transition-all duration-200"
    >
      {icon}
    </a>
  );
}
