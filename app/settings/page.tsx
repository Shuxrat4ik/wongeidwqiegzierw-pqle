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
    <div className="store-control-page">
      <main className="mx-auto max-w-[1100px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-200/75">Account command</p>
            <h1 className="mt-2 text-4xl font-black tracking-normal sm:text-5xl">Settings</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/58">
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
          <div className="store-panel p-5">
            <User className="mb-4 h-5 w-5 text-cyan-200" />
            <label className="text-sm font-bold" htmlFor="username">Display name</label>
            <input
              id="username"
              value={settings.username}
              onChange={(event) => update('username', event.target.value)}
              className="store-input mt-3 text-sm"
              placeholder="Player name"
            />
          </div>
          <div className="store-panel p-5">
            <Globe2 className="mb-4 h-5 w-5 text-cyan-200" />
            <label className="text-sm font-bold" htmlFor="region">Region</label>
            <select
              id="region"
              value={settings.region}
              onChange={(event) => update('region', event.target.value)}
              className="store-input mt-3 text-sm"
            >
              {['Malaysia', 'Uzbekistan', 'United States', 'India', 'Europe'].map(region => <option key={region}>{region}</option>)}
            </select>
          </div>
          <div className="store-panel p-5">
            <Download className="mb-4 h-5 w-5 text-cyan-200" />
            <label className="text-sm font-bold" htmlFor="downloadFolder">Download folder</label>
            <input
              id="downloadFolder"
              value={settings.downloadFolder}
              onChange={(event) => update('downloadFolder', event.target.value)}
              className="store-input mt-3 text-sm"
            />
          </div>
        </section>

        <div className="mt-6 grid gap-4">
          {settingCards.map((item) => {
            const Icon = item.icon;
            return (
              <section key={item.key} className="store-panel flex items-center gap-4 p-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-cyan-300/12 text-cyan-200">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-bold">{item.title}</h2>
                  <p className="mt-1 text-sm leading-5 text-white/55">{item.description}</p>
                </div>
                <Switch checked={settings[item.key]} onCheckedChange={(checked) => update(item.key, checked)} aria-label={item.title} />
              </section>
            );
          })}
        </div>

        <section className="store-panel mt-6 flex flex-wrap items-center justify-between gap-3 p-5 text-sm text-white/58">
          <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-emerald-300" /> {enabledCount} preferences enabled</span>
          <span>{savedAt ? `Saved at ${savedAt}` : 'Unsaved changes stay on this page until you save.'}</span>
          <Link href="/profile" className="font-bold text-cyan-200 hover:text-white">Open profile</Link>
        </section>
      </main>
    </div>
  );
}
