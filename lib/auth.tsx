'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';

type Profile = {
  id: string;
  username: string;
  avatar_url: string;
  is_admin: boolean;
  created_at: string;
};

type AuthContextType = {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  userId: string;
};

const BUILT_IN_ADMIN_EMAIL = 'admin@gamestore.com';

function isBuiltInAdminEmail(email?: string | null) {
  return email?.trim().toLowerCase() === BUILT_IN_ADMIN_EMAIL;
}

function fallbackProfile(u: User): Profile {
  const emailName = u.email?.split('@')[0] || 'user';
  return {
    id: u.id,
    username: emailName,
    avatar_url: '',
    is_admin: isBuiltInAdminEmail(u.email),
    created_at: new Date().toISOString(),
  };
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  session: null,
  loading: true,
  signUp: async () => ({ error: null }),
  signIn: async () => ({ error: null }),
  signOut: async () => {},
  userId: 'guest',
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchProfile(u: User) {
    const builtInAdmin = isBuiltInAdminEmail(u.email);
    const { data, error } = await supabase.from('profiles').select('*').eq('id', u.id).maybeSingle();
    if (error) {
      console.warn('[auth] profile fetch', error.message);
    }

    if (!data) {
      const fallback = fallbackProfile(u);
      const { data: created, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: u.id,
          username: fallback.username,
          avatar_url: fallback.avatar_url,
          is_admin: fallback.is_admin,
        })
        .select('*')
        .maybeSingle();

      if (createError) {
        console.warn('[auth] profile create', createError.message);
      }
      setProfile((created as Profile | null) ?? fallback);
      return;
    }

    if (builtInAdmin && data.is_admin !== true) {
      const { data: promoted, error: promoteError } = await supabase
        .from('profiles')
        .update({ is_admin: true })
        .eq('id', u.id)
        .select('*')
        .maybeSingle();

      if (promoteError) {
        console.warn('[auth] admin promote', promoteError.message);
      }
      setProfile((promoted as Profile | null) ?? ({ ...(data as Profile), is_admin: true }));
      return;
    }

    setProfile(data as Profile | null);
  }

  useEffect(() => {
    let mounted = true;

    async function applySession(s: Session | null) {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        await fetchProfile(s.user);
      } else {
        setProfile(null);
      }
      if (mounted) setLoading(false);
    }

    void supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!mounted) return;
      void applySession(s);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!mounted) return;
      void applySession(s);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function signUp(email: string, password: string, username: string): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.signUp({ email, password, options: { data: { username } } });
    if (error) return { error: error.message };

    const { data: { user: u } } = await supabase.auth.getUser();
    if (u) {
      await supabase.from('profiles').upsert({
        id: u.id,
        username,
        is_admin: isBuiltInAdminEmail(email),
      }, { onConflict: 'id' });
    }

    await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }).catch(() => undefined);
    return { error: null };
  }

  async function signIn(email: string, password: string): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }).catch(() => undefined);
    const {
      data: { session: s },
    } = await supabase.auth.getSession();
    if (s?.user) {
      await fetchProfile(s.user);
    }
    return { error: null };
  }

  async function signOut() {
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
  }

  const userId = user?.id ?? 'guest';

  return (
    <AuthContext.Provider value={{ user, profile, session, loading, signUp, signIn, signOut, userId }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
