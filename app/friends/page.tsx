'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { MessageSquare, Plus, Radio, Search, Send, Trash2, UserPlus, Users } from 'lucide-react';
import { toast } from 'sonner';

const FRIENDS_KEY = 'nexusvault:friends:v1';
const MESSAGES_KEY = 'nexusvault:party-messages:v1';

type FriendStatus = 'Online' | 'In game' | 'Away' | 'Offline';
type Friend = { id: string; name: string; status: FriendStatus; game: string };
type PartyMessage = { id: string; author: string; text: string; time: string };

const defaultFriends: Friend[] = [
  { id: 'akmal', name: 'Akmal', status: 'Online', game: 'Counter-Strike 2' },
  { id: 'madina', name: 'Madina', status: 'In game', game: 'Elden Ring' },
  { id: 'sardor', name: 'Sardor', status: 'Away', game: 'Cyberpunk 2077' },
  { id: 'lola', name: 'Lola', status: 'Offline', game: 'Stardew Valley' },
];

const defaultMessages: PartyMessage[] = [
  { id: 'm1', author: 'Akmal', text: 'Ranked match tonight?', time: '20:15' },
  { id: 'm2', author: 'Madina', text: 'Send invite when download finishes.', time: '20:18' },
];

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

export default function FriendsPage() {
  const [friends, setFriends] = useState<Friend[]>(defaultFriends);
  const [messages, setMessages] = useState<PartyMessage[]>(defaultMessages);
  const [hydrated, setHydrated] = useState(false);
  const [query, setQuery] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    setFriends(readStorage(FRIENDS_KEY, defaultFriends));
    setMessages(readStorage(MESSAGES_KEY, defaultMessages));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(FRIENDS_KEY, JSON.stringify(friends));
  }, [friends, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
  }, [messages, hydrated]);

  const filteredFriends = useMemo(() => friends.filter(friend =>
    friend.name.toLowerCase().includes(query.toLowerCase()) ||
    friend.game.toLowerCase().includes(query.toLowerCase()) ||
    friend.status.toLowerCase().includes(query.toLowerCase())
  ), [friends, query]);

  const onlineCount = friends.filter(friend => friend.status === 'Online' || friend.status === 'In game').length;

  function addFriend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) return;
    if (friends.some(friend => friend.name.toLowerCase() === cleanName.toLowerCase())) {
      toast.info('Friend already exists');
      return;
    }
    const nextFriend: Friend = {
      id: `${cleanName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
      name: cleanName,
      status: 'Online',
      game: 'Browsing NexusVault',
    };
    setFriends(prev => [nextFriend, ...prev]);
    setName('');
    toast.success(`${cleanName} added`);
  }

  function removeFriend(id: string, friendName: string) {
    setFriends(prev => prev.filter(friend => friend.id !== id));
    toast.info(`${friendName} removed`);
  }

  function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = message.trim();
    if (!text) return;
    const nextMessage: PartyMessage = {
      id: `msg-${Date.now()}`,
      author: 'You',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev.slice(-8), nextMessage]);
    setMessage('');
  }

  return (
    <div className="min-h-screen bg-[#080a12] text-white">
      <main className="mx-auto max-w-[1180px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#3b82f6]">Social</p>
            <h1 className="mt-2 text-3xl font-black sm:text-4xl">Friends</h1>
            <p className="mt-3 text-sm text-[#a0a0a0]">{onlineCount} online · {friends.length} total friends</p>
          </div>
          <Link href="/games?sort=rating" className="store-btn-primary inline-flex items-center gap-2">
            <MessageSquare className="h-4 w-4" /> Find co-op games
          </Link>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
          <section className="rounded-lg border border-white/10 bg-[#1a1a1a]">
            <div className="grid gap-3 border-b border-white/10 p-5 sm:grid-cols-[minmax(0,1fr)_260px]">
              <h2 className="flex items-center gap-2 text-xl font-black">
                <Users className="h-5 w-5 text-[#3b82f6]" /> Friend list
              </h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search friends"
                  className="w-full rounded-lg border border-white/10 bg-[#121212] py-2 pl-9 pr-3 text-sm text-white outline-none transition focus:border-[#3b82f6]"
                />
              </div>
            </div>

            <form onSubmit={addFriend} className="grid gap-3 border-b border-white/10 p-4 sm:grid-cols-[minmax(0,1fr)_auto]">
              <div className="relative">
                <UserPlus className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Friend name"
                  className="w-full rounded-lg border border-white/10 bg-[#121212] py-2 pl-9 pr-3 text-sm text-white outline-none transition focus:border-[#3b82f6]"
                />
              </div>
              <button type="submit" className="store-btn-secondary inline-flex items-center justify-center gap-2">
                <Plus className="h-4 w-4" /> Add friend
              </button>
            </form>

            <div className="divide-y divide-white/10">
              {filteredFriends.map((friend) => (
                <div key={friend.id} className="flex items-center gap-4 p-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#3b82f6] to-[#22c55e] text-sm font-black">
                    {friend.name[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold">{friend.name}</div>
                    <div className="truncate text-sm text-[#a0a0a0]">{friend.game}</div>
                  </div>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/75">{friend.status}</span>
                  <button type="button" onClick={() => removeFriend(friend.id, friend.name)} className="rounded-lg p-2 text-white/50 transition hover:bg-red-500/15 hover:text-red-300" aria-label={`Remove ${friend.name}`}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {filteredFriends.length === 0 && <div className="p-8 text-center text-sm text-[#a0a0a0]">No friends match your search.</div>}
            </div>
          </section>

          <aside className="rounded-lg border border-white/10 bg-[#1f1f1f] p-5">
            <Radio className="mb-4 h-5 w-5 text-[#3b82f6]" />
            <h2 className="text-xl font-black">Party channel</h2>
            <div className="mt-4 space-y-3">
              {messages.map(item => (
                <div key={item.id} className="rounded-lg bg-white/5 p-3">
                  <div className="flex items-center justify-between gap-2 text-xs text-white/45">
                    <span className="font-bold text-white/70">{item.author}</span>
                    <span>{item.time}</span>
                  </div>
                  <p className="mt-1 text-sm leading-5 text-white/80">{item.text}</p>
                </div>
              ))}
            </div>
            <form onSubmit={sendMessage} className="mt-4 flex gap-2">
              <input
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Message party"
                className="min-w-0 flex-1 rounded-lg border border-white/10 bg-[#121212] px-3 py-2 text-sm text-white outline-none transition focus:border-[#3b82f6]"
              />
              <button type="submit" className="rounded-lg bg-[#3b82f6] px-3 text-white transition hover:bg-[#2563eb]" aria-label="Send message">
                <Send className="h-4 w-4" />
              </button>
            </form>
          </aside>
        </div>
      </main>
    </div>
  );
}
