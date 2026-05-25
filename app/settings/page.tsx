'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Bell, Check, Download, Globe2, Moon, RotateCcw, Save, Shield, SlidersHorizontal, User } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth';
import { Switch } from '@/components/ui/switch';

const SETTINGS_KEY = 'nexusvault:settings:v1';

type SettingsState = {
  username: string;
  language: string;
  region: string;
  downloadFolder: string;
  darkStorefront: boolean;
  saleNotifications: boolean;
  secureCheckout: boolean;
  compactBrowse: boolean;
  autoUpdates: boolean;
};

const defaultSettings: SettingsState = {
  username: '',
  language: 'English',
  region: 'Malaysia',
  downloadFolder: 'NexusVault/Games',
  darkStorefront: true,
  saleNotifications: true,
  secureCheckout: true,
  compactBrowse: true,
  autoUpdates: true,
};

const settingCards = [
  { key: 'darkStorefront', title: 'Dark storefront', description: 'Keep the full store in the dark launcher theme.', icon: Moon },
  { key: 'saleNotifications', title: 'Sale notifications', description: 'Show alerts for wishlist discounts and free weekends.', icon: Bell },
  { key: 'secureCheckout', title: 'Secure checkout', description: 'Require a fresh session before paid checkout starts.', icon: Shield },
  { key: 'compactBrowse', title: 'Compact browse UI', description: 'Use dense cards and rails for faster scanning.', icon: SlidersHorizontal },
  { key: 'autoUpdates', title: 'Auto updates', description: 'Automatically queue updates for installed games.', icon: Download },
] as const;

export default function SettingsPage() {
  const { profile, user } = useAuth();
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);
  const [savedAt, setSavedAt] = useState<string>('');

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SETTINGS_KEY);
      const saved = raw ? JSON.parse(raw) as Partial<SettingsState> : {};
      setSettings({
        ...defaultSettings,
        ...saved,
        username: saved.username || profile?.username || user?.email?.split('@')[0] || '',
      });
    } catch {
      setSettings({ ...defaultSettings, username: profile?.username || user?.email?.split('@')[0] || '' });
    }
  }, [profile?.username, user?.email]);

  const enabledCount = useMemo(() => settingCards.filter(item => settings[item.key]).length, [settings]);

  function update<K extends keyof SettingsState>(key: K, value: SettingsState[K]) {
    setSettings(prev => ({ ...prev, [key]: value }));
  }

  function saveSettings() {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    setSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    toast.success('Settings saved');
  }

  function resetSettings() {
    const next = { ...defaultSettings, username: profile?.username || user?.email?.split('@')[0] || '' };
    setSettings(next);
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
    setSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    toast.info('Settings reset');
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      <main className="mx-auto max-w-[1100px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#3b82f6]">Account</p>
            <h1 className="mt-2 text-3xl font-black sm:text-4xl">Settings</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#a0a0a0]">
              Your launcher preferences are saved on this browser and applied when you come back.
            </p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={resetSettings} className="store-btn-secondary inline-flex items-center gap-2">
              <RotateCcw className="h-4 w-4" /> Reset
            </button>
            <button type="button" onClick={saveSettings} className="store-btn-primary inline-flex items-center gap-2">
              <Save className="h-4 w-4" /> Save
            </button>
          </div>
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-white/10 bg-[#1a1a1a] p-5">
            <User className="mb-4 h-5 w-5 text-[#3b82f6]" />
            <label className="text-sm font-bold" htmlFor="username">Display name</label>
            <input
              id="username"
              value={settings.username}
              onChange={(event) => update('username', event.target.value)}
              className="mt-3 w-full rounded-lg border border-white/10 bg-[#121212] px-3 py-2 text-sm text-white outline-none transition focus:border-[#3b82f6]"
              placeholder="Player name"
            />
          </div>
          <div className="rounded-lg border border-white/10 bg-[#1a1a1a] p-5">
            <Globe2 className="mb-4 h-5 w-5 text-[#3b82f6]" />
            <label className="text-sm font-bold" htmlFor="region">Region</label>
            <select
              id="region"
              value={settings.region}
              onChange={(event) => update('region', event.target.value)}
              className="mt-3 w-full rounded-lg border border-white/10 bg-[#121212] px-3 py-2 text-sm text-white outline-none transition focus:border-[#3b82f6]"
            >
              {['Malaysia', 'Uzbekistan', 'United States', 'India', 'Europe'].map(region => <option key={region}>{region}</option>)}
            </select>
          </div>
          <div className="rounded-lg border border-white/10 bg-[#1a1a1a] p-5">
            <Download className="mb-4 h-5 w-5 text-[#3b82f6]" />
            <label className="text-sm font-bold" htmlFor="downloadFolder">Download folder</label>
            <input
              id="downloadFolder"
              value={settings.downloadFolder}
              onChange={(event) => update('downloadFolder', event.target.value)}
              className="mt-3 w-full rounded-lg border border-white/10 bg-[#121212] px-3 py-2 text-sm text-white outline-none transition focus:border-[#3b82f6]"
            />
          </div>
        </section>

        <div className="mt-6 grid gap-4">
          {settingCards.map((item) => {
            const Icon = item.icon;
            return (
              <section key={item.key} className="flex items-center gap-4 rounded-lg border border-white/10 bg-[#1a1a1a] p-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#3b82f6]/15 text-[#3b82f6]">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-bold">{item.title}</h2>
                  <p className="mt-1 text-sm leading-5 text-[#a0a0a0]">{item.description}</p>
                </div>
                <Switch checked={settings[item.key]} onCheckedChange={(checked) => update(item.key, checked)} aria-label={item.title} />
              </section>
            );
          })}
        </div>

        <section className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-[#1a1a1a] p-5 text-sm text-[#a0a0a0]">
          <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-[#22c55e]" /> {enabledCount} preferences enabled</span>
          <span>{savedAt ? `Saved at ${savedAt}` : 'Unsaved changes stay on this page until you save.'}</span>
          <Link href="/profile" className="font-bold text-[#3b82f6] hover:text-[#60a5fa]">Open profile</Link>
        </section>
      </main>
    </div>
  );
}
