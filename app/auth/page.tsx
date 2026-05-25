'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { Gamepad2, Mail, Lock, User, Loader as Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AuthPage() {
  const { signIn, signUp, user } = useAuth();
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) router.push('/');
  }, [user, router]);

  if (user) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error(error);
        setLoading(false);
        return;
      }
      toast.success('Welcome back!');
      router.push('/');
    } else {
      if (username.length < 2) {
        toast.error('Username must be at least 2 characters');
        setLoading(false);
        return;
      }
      const { error } = await signUp(email, password, username);
      if (error) {
        toast.error(error);
        setLoading(false);
        return;
      }
      toast.success('Account created! You are now signed in.');
      router.push('/');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-sky-500/30">
            <Gamepad2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {isLogin ? 'Sign in to your NexusVault account' : 'Join NexusVault today'}
          </p>
        </div>

        {/* Form */}
        <div className="bg-[#1a1a1a] rounded-2xl border border-white/5 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Choose a username"
                    required
                    className="w-full bg-[#121212] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/30"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full bg-[#121212] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  required
                  minLength={6}
                  className="w-full bg-[#121212] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/30"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-xl transition-colors shadow-lg shadow-sky-500/20 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isLogin ? (
                'Sign In'
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-slate-400 hover:text-sky-400 transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
