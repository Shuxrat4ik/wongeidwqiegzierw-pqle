'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase, Game, FeaturedGame } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Shield, Gamepad2, Users, ShoppingCart, Star, Loader as Loader2, Plus, Pencil, Trash2, Eye, ToggleLeft, ToggleRight, DollarSign, Search, ChevronLeft, ChevronRight, X, Image as ImageIcon, CircleAlert as AlertCircle, ArrowUp, ArrowDown, Activity, BarChart3, CheckCircle2, UploadCloud, Zap } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import Link from 'next/link';
import { defaultSystemRequirements } from '@/lib/admin-game-payload';
import { normalizeDbGameRow } from '@/lib/db';
import UploadFile from './components/UploadFile';

type Tab = 'games' | 'featured' | 'orders' | 'users';

const PAGE_SIZE = 10;
const featuredPlacements = ['hero', 'trending', 'new_release', 'on_sale'] as const;


function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function parseList(value: string) {
  return value.split(',').map(item => item.trim()).filter(Boolean);
}

function isValidUrl(value: string) {
  if (!value.trim()) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function isHttpUrl(value: string) {
  return value.trim().length > 0 && isValidUrl(value);
}

function looksLikeHttpUrl(value: string) {
  return /^https?:\/\//i.test(value.trim());
}

function toNumber(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function formatMoney(value: unknown) {
  return `$${toNumber(value).toFixed(2)}`;
}

function placementLabel(placement: string) {
  if (placement === 'hero') return 'Hero carousel';
  if (placement === 'trending') return 'Trending';
  if (placement === 'new_release') return 'New releases';
  if (placement === 'on_sale') return 'Deals';
  return placement;
}

export default function AdminPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('games');
  const [games, setGames] = useState<Game[]>([]);
  const [featured, setFeatured] = useState<FeaturedGame[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [adminWarning, setAdminWarning] = useState<string | null>(null);


  // Pagination
  const [gamesPage, setGamesPage] = useState(1);
  const [ordersPage, setOrdersPage] = useState(1);
  const [usersPage, setUsersPage] = useState(1);

  // Search/filter
  const [gamesSearch, setGamesSearch] = useState('');
  const [gamesGenreFilter, setGamesGenreFilter] = useState('');
  const [usersSearch, setUsersSearch] = useState('');

  // Game form
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [showGameForm, setShowGameForm] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formTitle, setFormTitle] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formPrice, setFormPrice] = useState('0');
  const [formDiscount, setFormDiscount] = useState('0');
  const [formGenre, setFormGenre] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formShortDesc, setFormShortDesc] = useState('');
  const [formDeveloper, setFormDeveloper] = useState('');
  const [formPublisher, setFormPublisher] = useState('');
  const [formCoverImg, setFormCoverImg] = useState('');
  const [formBannerImg, setFormBannerImg] = useState('');
  const [formScreenshots, setFormScreenshots] = useState('');
  const [formTrailer, setFormTrailer] = useState('');
  const [formVideos, setFormVideos] = useState('');
  const [formPlatform, setFormPlatform] = useState('Windows');
  const [formRating, setFormRating] = useState('4.0');
  const [formTags, setFormTags] = useState('');
  const [formAffiliateUrl, setFormAffiliateUrl] = useState('');
  const [formDownloadUrl, setFormDownloadUrl] = useState('');
  const [formGameFile, setFormGameFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteGameId, setDeleteGameId] = useState<string | null>(null);
  const [deleteGameTitle, setDeleteGameTitle] = useState('');

  const [featuredAddGameId, setFeaturedAddGameId] = useState('');
  const [featuredAddPlacement, setFeaturedAddPlacement] = useState('hero');
  const [editingFeaturedRow, setEditingFeaturedRow] = useState<FeaturedGame | null>(null);
  const [feGameId, setFeGameId] = useState('');
  const [fePlacement, setFePlacement] = useState('hero');
  const [feSortOrder, setFeSortOrder] = useState('0');
  const [feActive, setFeActive] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/auth');
      return;
    }
    if (profile && profile.is_admin !== true) {
      router.replace('/auth');
    }
  }, [user, profile, authLoading, router]);

  useEffect(() => {
    if (games.length === 0) return;
    if (!featuredAddGameId || !games.some(g => g.id === featuredAddGameId)) {
      setFeaturedAddGameId(games[0].id);
    }
  }, [games, featuredAddGameId]);

  useEffect(() => {
    if (!editingFeaturedRow) return;
    setFeGameId(editingFeaturedRow.game_id);
    setFePlacement(editingFeaturedRow.placement);
    setFeSortOrder(String(editingFeaturedRow.sort_order));
    setFeActive(editingFeaturedRow.active);
  }, [editingFeaturedRow]);

  const fetchData = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    let gamesList: Game[] = [];
    let featuredList: FeaturedGame[] = [];
    let warningMessage: string | null = null;

    if (token) {
      const [gamesRes, featuredRes] = await Promise.all([
        fetch('/api/admin/games', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/featured-games', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const parseJson = async (res: Response) => {
        const text = await res.text();
        try {
          return text ? JSON.parse(text) : {};
        } catch {
          return { error: text };
        }
      };

      const gamesPayload = await parseJson(gamesRes);
      console.log('[admin] Games API response:', { status: gamesRes.status, payload: gamesPayload });

      if (gamesRes.ok && Array.isArray(gamesPayload.games)) {
        gamesList = gamesPayload.games as Game[];
      } else if (!gamesRes.ok) {
        const msg = typeof gamesPayload.error === 'string' ? gamesPayload.error : gamesRes.statusText;
        const hint = typeof gamesPayload.hint === 'string' ? gamesPayload.hint : '';
        warningMessage = [msg, hint].filter(Boolean).join(' — ') || 'Admin games API unavailable';
      } else {
        warningMessage = `Games API returned invalid response: ${JSON.stringify(gamesPayload)}`;
      }

      const featuredPayload = await parseJson(featuredRes);
      if (featuredRes.ok && Array.isArray(featuredPayload.rows)) {
        featuredList = featuredPayload.rows as FeaturedGame[];
      } else if (!warningMessage) {
        const msg = typeof featuredPayload.error === 'string' ? featuredPayload.error : featuredRes.statusText;
        const hint = typeof featuredPayload.hint === 'string' ? featuredPayload.hint : '';
        warningMessage = [msg, hint].filter(Boolean).join(' — ') || 'Admin featured API unavailable';
      }
    }

    if (gamesList.length === 0) {
      const fb = await supabase.from('games').select('*').order('title');
      if (fb.error) toast.error(fb.error.message);
      gamesList = (fb.data ?? []) as Game[];
    }

    if (featuredList.length === 0) {
      const { data: featuredRows, error: featError } = await supabase
        .from('featured_games')
        .select('*')
        .order('placement')
        .order('sort_order');
      
      if (featError) {
        toast.error(featError.message);
      } else if (featuredRows && featuredRows.length > 0) {
        // Get game details for all featured games
        const gameIds = (featuredRows as FeaturedGame[]).map((r) => r.game_id);
        const { data: games, error: gamesErr } = await supabase
          .from('games')
          .select('*')
          .in('id', gameIds);
        
        if (gamesErr) {
          toast.error(gamesErr.message);
        } else {
          // Map games by ID
          const gamesMap = new Map(
            (games || []).map((g: Record<string, unknown>) => [g.id, g])
          );
          
          // Merge featured_games with games
          featuredList = (featuredRows as FeaturedGame[]).map((row) => ({
            ...row,
            games: gamesMap.get(row.game_id) as Game | undefined,
          }));
        }
      }
    }

    gamesList = gamesList.map(row => normalizeDbGameRow(row as unknown as Record<string, unknown>) as Game);
    featuredList = featuredList.map(row => ({
      ...row,
      games: row.games
        ? (normalizeDbGameRow(row.games as unknown as Record<string, unknown>) as Game)
        : undefined,
    }));

    setAdminWarning(warningMessage);

    const [ordersRes, usersRes, orderItemsRes] = await Promise.all([
      supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(200),
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('order_items').select('*'),
    ]);
    
    // Check for schema cache errors and provide helpful message
    const schemaErrors = [ordersRes.error, usersRes.error, orderItemsRes.error].filter(e => 
      e?.message?.includes('Could not find the table') || e?.message?.includes('schema cache')
    );
    
    if (schemaErrors.length > 0) {
      const migrationHint = 'Database schema not initialized. Run migrations in Supabase SQL Editor: https://app.supabase.com → SQL Editor → Copy & run: supabase/migrations/20260515100000_schema.sql, then 20260515100001_seed.sql';
      warningMessage = migrationHint;
      toast.error('Database schema missing. See warning for migration instructions.');
    }
    
    // Merge order_items with their game titles
    const orderItemsMap = new Map<string, any[]>();
    (orderItemsRes.data || []).forEach((item: any) => {
      if (!orderItemsMap.has(item.order_id)) {
        orderItemsMap.set(item.order_id, []);
      }
      orderItemsMap.get(item.order_id)!.push(item);
    });
    
    // Enrich orders with their items
    let enrichedOrders = (ordersRes.data || []).map((order: any) => ({
      ...order,
      order_items: orderItemsMap.get(order.id) || [],
    }));
    
    const firstError = ordersRes.error ?? usersRes.error;
    if (firstError) toast.error(firstError.message);

    featuredList.sort((a, b) => {
      const pl = a.placement.localeCompare(b.placement);
      if (pl !== 0) return pl;
      if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
      return (a.created_at ?? '').localeCompare(b.created_at ?? '');
    });

    setGames(gamesList);
    setFeatured(featuredList);
    setOrders(enrichedOrders);
    setUsers(usersRes.data ?? []);
    setDataLoading(false);
  }, []);

  useEffect(() => { void fetchData(); }, [fetchData]);

  // Filtered games
  const filteredGames = useMemo(() => {
    let result = [...games];
    if (gamesSearch) {
      const q = gamesSearch.toLowerCase();
      result = result.filter(
        g => g.title.toLowerCase().includes(q) || (g.developer ?? '').toLowerCase().includes(q)
      );
    }
    if (gamesGenreFilter) {
      result = result.filter(g => (g.genre ?? []).includes(gamesGenreFilter));
    }
    return result;
  }, [games, gamesSearch, gamesGenreFilter]);

  const allGenres = useMemo(() => {
    const set = new Set<string>();
    games.forEach(g => (g.genre ?? []).forEach(gen => set.add(gen)));
    return Array.from(set).sort();
  }, [games]);

  const filteredUsers = useMemo(() => {
    if (!usersSearch) return users;
    const q = usersSearch.toLowerCase();
    return users.filter((u: any) => (u.username || '').toLowerCase().includes(q) || u.id.toLowerCase().includes(q));
  }, [users, usersSearch]);

  // Paginated slices
  const paginatedGames = filteredGames.slice((gamesPage - 1) * PAGE_SIZE, gamesPage * PAGE_SIZE);
  const paginatedOrders = orders.slice((ordersPage - 1) * PAGE_SIZE, ordersPage * PAGE_SIZE);
  const paginatedUsers = filteredUsers.slice((usersPage - 1) * PAGE_SIZE, usersPage * PAGE_SIZE);
  const totalGamePages = Math.max(1, Math.ceil(filteredGames.length / PAGE_SIZE));
  const totalOrderPages = Math.max(1, Math.ceil(orders.length / PAGE_SIZE));
  const totalUserPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));

  function validateForm(): boolean {
    const errors: Record<string, string> = {};
    const slug = formSlug.trim() || slugify(formTitle);
    if (!formTitle.trim()) errors.title = 'Title is required';
    if (!slug) errors.slug = 'Slug is required';
    if (slug && games.some(game => game.slug === slug && game.id !== editingGame?.id)) errors.slug = 'Slug must be unique';
    if (!formDeveloper.trim()) errors.developer = 'Developer is required';
    if (!formPublisher.trim()) errors.publisher = 'Publisher is required';
    if (!formDesc.trim()) errors.description = 'Description is required';
    if (!formShortDesc.trim()) errors.short_description = 'Short description is required';
    if (!formCoverImg.trim()) errors.cover_image = 'Cover image URL is required';
    if (formCoverImg.trim() && !isValidUrl(formCoverImg)) errors.cover_image = 'Enter a valid image URL';
    if (!formBannerImg.trim()) errors.banner_image = 'Banner image URL is required';
    if (formBannerImg.trim() && !isValidUrl(formBannerImg)) errors.banner_image = 'Enter a valid image URL';
    const invalidScreenshot = parseList(formScreenshots).find(item => !isValidUrl(item));
    if (invalidScreenshot) errors.screenshots = 'Every screenshot must be a valid URL';
    if (formTrailer.trim() && !isValidUrl(formTrailer)) errors.trailer_url = 'Enter a valid trailer URL';
    const invalidVideos = parseList(formVideos).find(item => !isValidUrl(item));
    if (invalidVideos) errors.videos = 'Every video URL must be a valid URL';
    if (formAffiliateUrl.trim() && !isValidUrl(formAffiliateUrl)) errors.affiliate_url = 'Enter a valid affiliate URL';
    if (looksLikeHttpUrl(formDownloadUrl) && !isValidUrl(formDownloadUrl)) errors.download_url = 'Enter a valid download or affiliate URL';
    if (!formGenre.trim()) errors.genre = 'At least one genre is required';
    const price = parseFloat(formPrice);
    if (isNaN(price) || price < 0) errors.price = 'Price must be 0 or greater';
    const discount = parseInt(formDiscount);
    if (isNaN(discount) || discount < 0 || discount > 100) errors.discount_percent = 'Discount must be 0-100';
    if (!formAffiliateUrl.trim() && !formDownloadUrl.trim() && !formGameFile) {
      errors.affiliate_url = 'Add an affiliate URL or configure a private download';
    }
    const rating = parseFloat(formRating);
    if (isNaN(rating) || rating < 1 || rating > 5) errors.rating = 'Rating must be 1.0-5.0';
    if (parseList(formPlatform).length === 0) errors.platform = 'At least one platform is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function openEditGame(game: Game) {
    setEditingGame(game);
    setFormTitle(game.title); setFormSlug(game.slug); setFormPrice(String(game.price));
    setFormDiscount(String(game.discount_percent)); setFormGenre(game.genre.join(', '));
    setFormDesc(game.description); setFormShortDesc(game.short_description);
    setFormDeveloper(game.developer); setFormPublisher(game.publisher);
    setFormCoverImg(game.cover_image); setFormBannerImg(game.banner_image);
    setFormScreenshots((game.screenshots ?? []).join(', '));
    setFormTrailer(game.trailer_url ?? '');
    setFormVideos((game.videos ?? []).join(', '));
    setFormPlatform(game.platform.join(', '));
    setFormRating(String(game.rating)); setFormTags(game.tags.join(', '));
    setFormAffiliateUrl(game.affiliate_url ?? '');
    setFormDownloadUrl(game.download_url ?? game.download_path ?? '');
    setFormGameFile(null);
    setFormErrors({});
    setShowGameForm(true);
  }

  function openNewGame() {
    setEditingGame(null);
    setFormTitle(''); setFormSlug(''); setFormPrice('0'); setFormDiscount('0');
    setFormGenre(''); setFormDesc(''); setFormShortDesc('');
    setFormDeveloper(''); setFormPublisher('');
    setFormCoverImg('https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg?auto=compress&cs=tinysrgb&w=600');
    setFormBannerImg('https://images.pexels.com/photos/3165335/pexels-photo-3165335.jpeg?auto=compress&cs=tinysrgb&w=1260');
    setFormScreenshots('');
    setFormTrailer(''); setFormPlatform('Windows'); setFormRating('4.0');
    setFormTags(''); setFormAffiliateUrl(''); setFormDownloadUrl(''); setFormGameFile(null);
    setFormErrors({});
    setShowGameForm(true);
  }

  async function adminBearerFetch(
    path: string,
    method: 'POST' | 'PATCH' | 'DELETE',
    body?: object
  ): Promise<{ ok: true; payload: unknown } | { ok: false; message: string }> {
    const { data: refreshed, error: refreshErr } = await supabase.auth.refreshSession();
    const session = refreshed.session ?? (await supabase.auth.getSession()).data.session;
    const token = session?.access_token;
    if (!token) {
      if (refreshErr) {
        toast.error('Session expired. Please sign in again.');
        return { ok: false, message: refreshErr.message };
      }
      toast.error('Session expired. Please sign in again.');
      return { ok: false, message: 'No session' };
    }
    const res = await fetch(path, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(method === 'DELETE' ? {} : { 'Content-Type': 'application/json' }),
      },
      body: method === 'DELETE' ? undefined : JSON.stringify(body ?? {}),
    });
    const text = await res.text();
    let payload: any = {};
    try {
      payload = text ? JSON.parse(text) : {};
    } catch {
      payload = { error: text };
    }
    if (!res.ok) {
      const msg = typeof payload.error === 'string' ? payload.error : res.statusText;
      const hint = typeof payload.hint === 'string' ? payload.hint : '';
      return { ok: false, message: hint ? `${msg} — ${hint}` : msg };
    }
    return { ok: true, payload };
  }

  async function adminGamesRequest(method: 'POST' | 'PATCH' | 'DELETE', body?: object, deleteId?: string) {
    const url =
      method === 'DELETE' && deleteId
        ? `/api/admin/games?id=${encodeURIComponent(deleteId)}`
        : '/api/admin/games';
    return adminBearerFetch(url, method, method === 'DELETE' ? undefined : body);
  }

  async function adminFeaturedRequest(method: 'POST' | 'PATCH' | 'DELETE', body?: object, deleteId?: string) {
    const url =
      method === 'DELETE' && deleteId
        ? `/api/admin/featured-games?id=${encodeURIComponent(deleteId)}`
        : '/api/admin/featured-games';
    return adminBearerFetch(url, method, method === 'DELETE' ? undefined : body);
  }

  async function uploadGameFile(slug: string): Promise<string | null> {
    const configuredDownload = formDownloadUrl.trim();
    if (!formGameFile) return configuredDownload && !isHttpUrl(configuredDownload) ? configuredDownload : null;

    const { data: refreshed, error: refreshErr } = await supabase.auth.refreshSession();
    const session = refreshed.session ?? (await supabase.auth.getSession()).data.session;
    const token = session?.access_token;
    if (!token) {
      throw new Error(refreshErr?.message || 'Session expired. Please sign in again.');
    }

    const form = new FormData();
    form.append('slug', slug);
    form.append('file', formGameFile);
    const res = await fetch('/api/admin/game-file', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(typeof payload.error === 'string' ? payload.error : 'Upload failed');
    }
    return typeof payload.path === 'string' ? payload.path : null;
  }

  async function saveGame() {
    if (!validateForm()) return;
    setSaving(true);
    const slug = formSlug.trim() || slugify(formTitle);
    let downloadPath: string | null;
    try {
      downloadPath = await uploadGameFile(slug);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed');
      setSaving(false);
      return;
    }
    const configuredDownload = formDownloadUrl.trim();
    const data: any = {
      title: formTitle.trim(), slug,
      description: formDesc.trim(), short_description: formShortDesc.trim(),
      price: parseFloat(formPrice) || 0, discount_percent: parseInt(formDiscount) || 0,
      genre: parseList(formGenre),
      developer: formDeveloper.trim(), publisher: formPublisher.trim(),
      cover_image: formCoverImg.trim(), banner_image: formBannerImg.trim(),
      trailer_url: formTrailer.trim() || null,
      videos: parseList(formVideos),
      platform: parseList(formPlatform),
      rating: parseFloat(formRating) || 4.0,
      tags: parseList(formTags),
      affiliate_url: formAffiliateUrl.trim() || null,
      download_url: isHttpUrl(configuredDownload) ? configuredDownload : null,
      download_path: downloadPath,
      screenshots: parseList(formScreenshots).length > 0 ? parseList(formScreenshots) : [formCoverImg.trim(), formBannerImg.trim()],
    };

    if (editingGame) {
      const result = await adminGamesRequest('PATCH', { id: editingGame.id, ...data });
      if (!result.ok) {
        toast.error('Failed to update: ' + result.message);
        setSaving(false);
      } else {
        toast.success('Game updated');
        const row = (result.payload as { game?: Game }).game;
        if (row) setGames(games.map(g => g.id === editingGame.id ? { ...g, ...row } : g));
        else setGames(games.map(g => g.id === editingGame.id ? { ...g, ...data } : g));
        setShowGameForm(false);
        setSaving(false);
        void fetchData();
      }
    } else {
      const today = new Date().toISOString().split('T')[0];
      const result = await adminGamesRequest('POST', {
        ...data,
        review_count: 1500,
        release_date: today,
        system_requirements: defaultSystemRequirements(),
      });
      if (!result.ok) {
        toast.error('Failed to create: ' + result.message);
        setSaving(false);
      } else {
        toast.success('Game created');
        const row = (result.payload as { game?: Game }).game;
        if (row) setGames([...games, row]);
        setShowGameForm(false);
        setSaving(false);
        void fetchData();
      }
    }
  }

  function openDeleteConfirm(id: string, title: string) {
    setDeleteGameId(id);
    setDeleteGameTitle(title);
    setShowDeleteConfirm(true);
  }

  async function confirmDeleteGame() {
    if (!deleteGameId) return;
    const result = await adminGamesRequest('DELETE', undefined, deleteGameId);
    if (!result.ok) {
      toast.error('Failed to delete game: ' + result.message);
    } else {
      toast.success('Game deleted');
      setGames(games.filter(g => g.id !== deleteGameId));
      setShowDeleteConfirm(false);
      setDeleteGameId(null);
      setDeleteGameTitle('');
      void fetchData();
    }
  }

  function sortFeaturedRows(rows: FeaturedGame[]) {
    return [...rows].sort((a, b) => {
      const o = a.sort_order - b.sort_order;
      if (o !== 0) return o;
      const ac = a.created_at ?? '';
      const bc = b.created_at ?? '';
      return ac.localeCompare(bc);
    });
  }

  async function toggleFeatured(id: string, active: boolean) {
    const result = await adminFeaturedRequest('PATCH', { id, active: !active });
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success(active ? 'Store card hidden from storefront' : 'Store card visible on storefront');
    void fetchData();
  }

  async function addFeaturedCard() {
    if (!featuredAddGameId) {
      toast.error('Add a game in the Games tab first');
      return;
    }
    const samePl = featured.filter(f => f.placement === featuredAddPlacement);
    const nextOrder = samePl.reduce((m, f) => Math.max(m, f.sort_order), -1) + 1;
    const result = await adminFeaturedRequest('POST', {
      game_id: featuredAddGameId,
      placement: featuredAddPlacement,
      sort_order: nextOrder,
      active: true,
    });
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success('Store card added');
    void fetchData();
  }

  async function removeFeaturedCard(id: string) {
    const result = await adminFeaturedRequest('DELETE', undefined, id);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.info('Store card removed');
    void fetchData();
  }

  async function moveFeaturedCard(id: string, placement: string, delta: number) {
    const rows = sortFeaturedRows(featured.filter(f => f.placement === placement));
    const idx = rows.findIndex(r => r.id === id);
    const j = idx + delta;
    if (idx < 0 || j < 0 || j >= rows.length) return;
    const a = rows[idx];
    const b = rows[j];
    const r1 = await adminFeaturedRequest('PATCH', { id: a.id, sort_order: b.sort_order });
    if (!r1.ok) {
      toast.error(r1.message);
      return;
    }
    const r2 = await adminFeaturedRequest('PATCH', { id: b.id, sort_order: a.sort_order });
    if (!r2.ok) {
      toast.error(r2.message);
      void fetchData();
      return;
    }
    toast.success('Order updated');
    void fetchData();
  }

  async function saveFeaturedEdit() {
    if (!editingFeaturedRow) return;
    const order = parseInt(feSortOrder, 10);
    const result = await adminFeaturedRequest('PATCH', {
      id: editingFeaturedRow.id,
      game_id: feGameId,
      placement: fePlacement,
      sort_order: Number.isFinite(order) ? order : editingFeaturedRow.sort_order,
      active: feActive,
    });
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success('Store card saved');
    setEditingFeaturedRow(null);
    void fetchData();
  }

  if (authLoading || dataLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-10 h-10 text-sky-500 animate-spin" /></div>;
  }

  if (!user || profile?.is_admin !== true) {
    return <div className="flex items-center justify-center min-h-[60vh]"><p className="text-slate-400">Access denied. Admin only.</p></div>;
  }

  const totalRevenue = orders.reduce((s, o) => s + toNumber(o.total), 0);
  const freeGamesCount = games.filter(g => g.price === 0).length;
  const paidGamesCount = games.length - freeGamesCount;
  const saleGamesCount = games.filter(g => g.discount_percent > 0).length;
  const activeFeaturedCount = featured.filter(f => f.active).length;
  const avgRating = games.length > 0 ? games.reduce((s, g) => s + g.rating, 0) / games.length : 0;
  const heroReady = featured.some(f => f.placement === 'hero' && f.active);
  const saleRailReady = featured.some(f => f.placement === 'on_sale' && f.active) || saleGamesCount > 0;
  const storeHealthItems = [
    { label: 'Hero carousel', ok: heroReady, detail: heroReady ? 'Live' : 'Needs at least 1 active hero' },
    { label: 'Deals rail', ok: saleRailReady, detail: saleGamesCount > 0 ? `${saleGamesCount} discounted` : 'No sale games yet' },
    { label: 'Free games', ok: freeGamesCount > 0, detail: freeGamesCount > 0 ? `${freeGamesCount} free titles` : 'No free titles yet' },
    { label: 'Catalog rating', ok: avgRating >= 4, detail: `${avgRating.toFixed(1)} average` },
  ];
  const readinessScore = Math.round((storeHealthItems.filter(item => item.ok).length / storeHealthItems.length) * 100);

  const tabs: { id: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'games', label: 'Games', icon: <Gamepad2 className="w-4 h-4" />, count: games.length },
    { id: 'featured', label: 'Featured', icon: <Star className="w-4 h-4" />, count: featured.length },
    { id: 'orders', label: 'Orders', icon: <ShoppingCart className="w-4 h-4" />, count: orders.length },
    { id: 'users', label: 'Users', icon: <Users className="w-4 h-4" />, count: users.length },
  ];
  const formPriceValue = Math.max(0, parseFloat(formPrice) || 0);
  const formDiscountValue = Math.min(100, Math.max(0, parseInt(formDiscount, 10) || 0));
  const formFinalPrice = formPriceValue * (1 - formDiscountValue / 100);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#1a1a1a] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-500/15 flex items-center justify-center"><Shield className="w-5 h-5 text-amber-400" /></div>
          <div>
            <h1 className="text-2xl font-bold text-white">Admin Command Center</h1>
            <p className="text-slate-400 text-sm">Catalog, storefront publishing, orders, and users in one place.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-300">
            <Activity className="h-3.5 w-3.5" /> Live catalog
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1.5 text-xs font-bold text-sky-300">
            <UploadCloud className="h-3.5 w-3.5" /> {activeFeaturedCount} cards published
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-xs font-bold text-amber-200">
            <BarChart3 className="h-3.5 w-3.5" /> {readinessScore}% ready
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-8">
        <StatCard icon={<Gamepad2 className="w-5 h-5 text-sky-400" />} label="Total Games" value={games.length} />
        <StatCard icon={<DollarSign className="w-5 h-5 text-green-400" />} label="Paid Games" value={paidGamesCount} />
        <StatCard icon={<Zap className="w-5 h-5 text-amber-400" />} label="On Sale" value={saleGamesCount} />
        <StatCard icon={<Star className="w-5 h-5 text-cyan-400" />} label="Avg Rating" value={avgRating.toFixed(1)} />
        <StatCard icon={<Users className="w-5 h-5 text-emerald-400" />} label="Users" value={users.length} />
        <StatCard icon={<DollarSign className="w-5 h-5 text-green-400" />} label="Revenue" value={formatMoney(totalRevenue)} />
      </div>

      {adminWarning ? (
        <div className="mb-6 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100">
          <p className="font-semibold">Admin data is loading with fallback access.</p>
          <p>{adminWarning}</p>
        </div>
      ) : null}

      <div className="mb-8 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-xl border border-white/10 bg-[#1a1a1a] p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-white">Store health</h2>
              <p className="text-xs text-slate-500">Publishing checks that keep the storefront feeling complete.</p>
            </div>
            <BarChart3 className="h-5 w-5 text-sky-400" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {storeHealthItems.map(item => (
              <div key={item.label} className="flex items-start gap-3 rounded-lg border border-white/5 bg-black/15 p-3">
                {item.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />}
                <div>
                  <p className="text-sm font-semibold text-white">{item.label}</p>
                  <p className="text-xs text-slate-500">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#1a1a1a] p-4">
          <h2 className="mb-3 text-sm font-bold text-white">Quick actions</h2>
          <div className="grid gap-2">
            <button onClick={openNewGame} className="flex items-center justify-between rounded-lg bg-sky-500 px-3 py-2.5 text-sm font-bold text-white transition-colors hover:bg-sky-400">
              Add a new game <Plus className="h-4 w-4" />
            </button>
            <button onClick={() => setActiveTab('featured')} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-bold text-white transition-colors hover:bg-white/10">
              Manage storefront cards <Star className="h-4 w-4 text-amber-300" />
            </button>
            <Link href="/" className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-bold text-white transition-colors hover:bg-white/10">
              Preview store <Eye className="h-4 w-4 text-emerald-300" />
            </Link>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-[#1a1a1a] rounded-xl p-1 border border-white/5 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
              activeTab === tab.id ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'
            )}
          >
            {tab.icon} {tab.label}
            {tab.count !== undefined && <span className={cn('text-xs px-1.5 py-0.5 rounded-full', activeTab === tab.id ? 'bg-white/20' : 'bg-white/5')}>{tab.count}</span>}
          </button>
        ))}
      </div>

      {/* Games Tab */}
      {activeTab === 'games' && (
        <div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-bold text-white">All Games ({filteredGames.length})</h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text" placeholder="Search games..." value={gamesSearch} onChange={e => { setGamesSearch(e.target.value); setGamesPage(1); }}
                  className="bg-[#1a1a1a] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500/50 w-48"
                />
              </div>
              <select value={gamesGenreFilter} onChange={e => { setGamesGenreFilter(e.target.value); setGamesPage(1); }} className="bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500/50">
                <option value="">All Genres</option>
                {allGenres.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <button onClick={openNewGame} className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold rounded-lg transition-colors shrink-0">
                <Plus className="w-4 h-4" /> Add Game
              </button>
            </div>
          </div>

          <div className="bg-[#1a1a1a] rounded-xl border border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Game</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Genre</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Price</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Discount</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Rating</th>
                    <th className="text-right px-4 py-3 text-slate-400 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedGames.map((game, index) => (
                    <tr key={`${game.id}-${game.slug}-${index}`} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img src={game.cover_image} alt="" className="w-10 h-14 rounded bg-black object-cover" />
                          <div>
                            <p className="font-medium text-white">{game.title}</p>
                            <p className="text-xs text-slate-500">{game.developer}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">{(game.genre ?? []).slice(0, 2).map(g => <span key={g} className="text-xs bg-white/5 text-slate-400 px-1.5 py-0.5 rounded">{g}</span>)}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('font-semibold', game.price === 0 ? 'text-sky-400' : 'text-white')}>
                          {game.price === 0 ? 'FREE' : `$${game.price.toFixed(2)}`}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {game.discount_percent > 0 ? (
                          <span className="badge-discount text-white text-xs font-bold px-2 py-0.5 rounded-md bg-red-500/20">-{game.discount_percent}%</span>
                        ) : <span className="text-slate-600">--</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          <span className="text-white">{game.rating.toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/games/${game.slug}`} className="p-1.5 rounded-md text-slate-500 hover:text-sky-400 hover:bg-sky-400/10 transition-colors" title="View"><Eye className="w-4 h-4" /></Link>
                          <button onClick={() => openEditGame(game)} className="p-1.5 rounded-md text-slate-500 hover:text-amber-400 hover:bg-amber-400/10 transition-colors" title="Edit"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => openDeleteConfirm(game.id, game.title)} className="p-1.5 rounded-md text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredGames.length === 0 && <p className="text-slate-500 text-sm text-center py-8">No games found.</p>}
          </div>
          <Pagination current={gamesPage} total={totalGamePages} onChange={setGamesPage} />
        </div>
      )}

      {/* Featured / storefront cards */}
      {activeTab === 'featured' && (
        <div>
          <h2 className="text-lg font-bold text-white mb-1">Storefront cards</h2>
          <p className="text-slate-500 text-sm mb-4 max-w-2xl">
            Add unlimited cards per section. Hero drives the top carousel; Trending, New Releases, and Deals publish as storefront rails. Edits sync to the store automatically (and in other open tabs after the Realtime migration runs).
          </p>
          <div className="bg-[#1a1a1a] rounded-xl border border-white/5 p-4 mb-6">
            <h3 className="text-sm font-bold text-white mb-3">Add card</h3>
            {games.length === 0 ? (
              <p className="text-slate-500 text-sm">Create a game in the Games tab first.</p>
            ) : (
              <div className="flex gap-3 items-end flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <label className="text-xs text-slate-400 mb-1 block">Game</label>
                  <select
                    value={featuredAddGameId}
                    onChange={e => setFeaturedAddGameId(e.target.value)}
                    className="w-full bg-[#121212] border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                  >
                    {games.map((g, index) => (
                      <option key={`${g.id}-${g.slug}-${index}`} value={g.id}>{g.title}</option>
                    ))}
                  </select>
                </div>
                <div className="w-44">
                  <label className="text-xs text-slate-400 mb-1 block">Section</label>
                  <select
                    value={featuredAddPlacement}
                    onChange={e => setFeaturedAddPlacement(e.target.value)}
                    className="w-full bg-[#121212] border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                  >
                    {featuredPlacements.map(placement => (
                      <option key={placement} value={placement}>{placementLabel(placement)}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => void addFeaturedCard()}
                  className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4 inline mr-1" /> Add card
                </button>
              </div>
            )}
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {featuredPlacements.map(placement => {
              const items = sortFeaturedRows(featured.filter(f => f.placement === placement));
              const label = placementLabel(placement);
              return (
                <div key={placement} className="rounded-xl border border-white/10 bg-[#1a1a1a] p-3">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-white">{label}</h3>
                      <p className="text-xs text-slate-500">{items.filter(item => item.active).length} active / {items.length} total</p>
                    </div>
                    <span className={cn('rounded-full px-2 py-0.5 text-xs font-bold', items.length > 0 ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/5 text-slate-500')}>
                      {items.length > 0 ? 'Ready' : 'Empty'}
                    </span>
                  </div>
                  {items.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-white/10 p-4 text-center">
                      <Star className="mx-auto mb-2 h-5 w-5 text-slate-600" />
                      <p className="text-xs text-slate-500">Add a card to publish this section.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                    {items.map((f, idx) => (
                      <div key={f.id} className="flex items-center gap-2 rounded-lg border border-white/5 bg-[#1a1a1a] p-3">
                        {f.games && <img src={(f.games as Game).cover_image} alt="" className="w-10 h-14 rounded bg-black object-cover shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{f.games ? (f.games as Game).title : 'Unknown game'}</p>
                          <p className="text-xs text-slate-500">
                            Sort {f.sort_order}
                            {!f.active && <span className="ml-2 text-amber-400/90">hidden on store</span>}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            title="Move up"
                            disabled={idx === 0}
                            onClick={() => void moveFeaturedCard(f.id, placement, -1)}
                            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none"
                          >
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            title="Move down"
                            disabled={idx >= items.length - 1}
                            onClick={() => void moveFeaturedCard(f.id, placement, 1)}
                            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none"
                          >
                            <ArrowDown className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingFeaturedRow(f)}
                            className="p-1.5 rounded-md text-slate-400 hover:text-sky-400 hover:bg-sky-400/10"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void toggleFeatured(f.id, f.active)}
                            className={cn('p-1.5 rounded-md transition-colors', f.active ? 'text-green-400 hover:bg-green-400/10' : 'text-slate-600 hover:bg-white/5')}
                            title={f.active ? 'Hide from store' : 'Show on store'}
                          >
                            {f.active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => void removeFeaturedCard(f.id)}
                            className="p-1.5 rounded-md text-slate-500 hover:text-red-400 hover:bg-red-400/10"
                            title="Remove"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div>
          <h2 className="text-lg font-bold text-white mb-4">Recent Orders ({orders.length})</h2>
          <div className="bg-[#1a1a1a] rounded-xl border border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Order ID</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">User</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Total</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Status</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Date</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Items</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedOrders.map(order => (
                    <tr key={order.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="px-4 py-3 text-slate-400 font-mono text-xs">{order.id.slice(0, 8)}...</td>
                      <td className="px-4 py-3 text-white font-mono text-xs">{order.user_id?.slice(0, 8)}...</td>
                      <td className="px-4 py-3 text-white font-semibold">{formatMoney(order.total)}</td>
                      <td className="px-4 py-3">
                        <span className={cn('text-xs font-bold px-2 py-0.5 rounded-md', order.status === 'completed' ? 'bg-green-500/15 text-green-400' : 'bg-amber-500/15 text-amber-400')}>{order.status}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{formatDate(order.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {(order.order_items ?? []).map((item: any, i: number) => (
                            <img key={i} src={item.games?.cover_image ?? ''} alt="" className="w-8 h-10 rounded bg-black object-cover" title={item.games?.title ?? ''} />
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {orders.length === 0 && <p className="text-slate-500 text-sm text-center py-8">No orders yet.</p>}
          </div>
          <Pagination current={ordersPage} total={totalOrderPages} onChange={setOrdersPage} />
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div>
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-bold text-white">Users ({filteredUsers.length})</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input type="text" placeholder="Search users..." value={usersSearch} onChange={e => { setUsersSearch(e.target.value); setUsersPage(1); }}
                className="bg-[#1a1a1a] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500/50 w-48" />
            </div>
          </div>
          <div className="bg-[#1a1a1a] rounded-xl border border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">User</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Role</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map((u: any) => (
                    <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-sky-500 to-cyan-400 flex items-center justify-center text-white text-xs font-bold">
                            {(u.username || 'U')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-white font-medium">{u.username || 'Unknown'}</p>
                            <p className="text-xs text-slate-500 font-mono">{u.id.slice(0, 12)}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {u.is_admin ? (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-400">Admin</span>
                        ) : (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-white/5 text-slate-400">User</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{formatDate(u.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredUsers.length === 0 && <p className="text-slate-500 text-sm text-center py-8">No users found.</p>}
          </div>
          <Pagination current={usersPage} total={totalUserPages} onChange={setUsersPage} />
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setShowDeleteConfirm(false)}>
          <div className="w-full max-w-md bg-[#1a1a1a] rounded-2xl border border-white/10 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/15 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="font-bold text-white">Delete Game?</h3>
                <p className="text-sm text-slate-400 mt-1">Are you sure you want to delete <strong>{deleteGameTitle}</strong>? This cannot be undone.</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">
                Cancel
              </button>
              <button onClick={confirmDeleteGame} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-lg transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit storefront card */}
      {editingFeaturedRow && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setEditingFeaturedRow(null)}>
          <div className="w-full max-w-md bg-[#1a1a1a] rounded-2xl border border-white/10 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white">Edit store card</h3>
              <button type="button" onClick={() => setEditingFeaturedRow(null)} className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/10">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Game</label>
                <select
                  value={feGameId}
                  onChange={e => setFeGameId(e.target.value)}
                  className="w-full bg-[#121212] border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                >
                    {games.map((g, index) => (
                      <option key={`${g.id}-${g.slug}-${index}`} value={g.id}>{g.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Section</label>
                <select
                      value={fePlacement}
                      onChange={e => setFePlacement(e.target.value)}
                      className="w-full bg-[#121212] border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                    >
                      {featuredPlacements.map(placement => (
                        <option key={placement} value={placement}>{placementLabel(placement)}</option>
                      ))}
                    </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Sort order</label>
                <input
                  type="number"
                  value={feSortOrder}
                  onChange={e => setFeSortOrder(e.target.value)}
                  className="w-full bg-[#121212] border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input type="checkbox" checked={feActive} onChange={e => setFeActive(e.target.checked)} className="rounded border-white/20" />
                Visible on storefront
              </label>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button type="button" onClick={() => setEditingFeaturedRow(null)} className="px-4 py-2 text-sm text-slate-400 hover:text-white">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void saveFeaturedEdit()}
                className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold rounded-lg"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Edit/Create Modal */}
      {showGameForm && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-start justify-center p-4 pt-10 overflow-y-auto" onClick={() => setShowGameForm(false)}>
          <div className="w-full max-w-2xl bg-[#1a1a1a] rounded-2xl border border-white/10 p-6 mb-20" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">{editingGame ? 'Edit Game' : 'New Game'}</h2>
              <button onClick={() => setShowGameForm(false)} className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors"><X className="w-5 h-5" /></button>
            </div>

            {/* Image Preview */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div>
                <p className="text-xs text-slate-400 mb-1.5">Cover Preview</p>
                {formCoverImg ? (
                  <img src={formCoverImg} alt="Cover preview" className="w-full aspect-[3/4] rounded-lg border border-white/10 bg-black object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                ) : (
                  <div className="w-full aspect-[3/4] rounded-lg border border-dashed border-white/10 flex items-center justify-center"><ImageIcon className="w-8 h-8 text-slate-600" /></div>
                )}
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1.5">Banner Preview</p>
                {formBannerImg ? (
                  <img src={formBannerImg} alt="Banner preview" className="w-full aspect-video rounded-lg border border-white/10 bg-black object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                ) : (
                  <div className="w-full aspect-video rounded-lg border border-dashed border-white/10 flex items-center justify-center"><ImageIcon className="w-8 h-8 text-slate-600" /></div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Title"
                value={formTitle}
                onChange={value => {
                  const previousSlug = slugify(formTitle);
                  setFormTitle(value);
                  if (!editingGame && (!formSlug || formSlug === previousSlug)) {
                    setFormSlug(slugify(value));
                  }
                }}
                error={formErrors.title}
                required
              />
              <FormField label="Slug" value={formSlug} onChange={setFormSlug} placeholder="auto-generated from title" error={formErrors.slug} />
              <FormField label="Price" value={formPrice} onChange={setFormPrice} type="number" error={formErrors.price} required />
              <FormField label="Discount %" value={formDiscount} onChange={setFormDiscount} type="number" error={formErrors.discount_percent} />
              <FormField label="Developer" value={formDeveloper} onChange={setFormDeveloper} error={formErrors.developer} required />
              <FormField label="Publisher" value={formPublisher} onChange={setFormPublisher} error={formErrors.publisher} required />
              <FormField label="Genre (comma separated)" value={formGenre} onChange={setFormGenre} placeholder="Action, RPG" error={formErrors.genre} required />
              <FormField label="Platform (comma separated)" value={formPlatform} onChange={setFormPlatform} placeholder="Windows, Mac" error={formErrors.platform} />
              <FormField label="Tags (comma separated)" value={formTags} onChange={setFormTags} placeholder="Open World, Story Rich" />
              <FormField label="Rating (1-5)" value={formRating} onChange={setFormRating} type="number" error={formErrors.rating} />
              <FormField label="Cover Image URL" value={formCoverImg} onChange={setFormCoverImg} error={formErrors.cover_image} required />
              <FormField label="Banner Image URL" value={formBannerImg} onChange={setFormBannerImg} error={formErrors.banner_image} required />
              <FormField label="Trailer URL" value={formTrailer} onChange={setFormTrailer} placeholder="YouTube embed URL" error={formErrors.trailer_url} />
              <FormField label="Affiliate URL" value={formAffiliateUrl} onChange={setFormAffiliateUrl} placeholder="https://partner.example/game" error={formErrors.affiliate_url} />
              <FormField label="Download URL or Private Path" value={formDownloadUrl} onChange={setFormDownloadUrl} placeholder="https://partner.example/game or game-slug/installer.zip" error={formErrors.download_url} />
              <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Upload Game File</label>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                </label>
                  <UploadFile />
                {/* <input
                  type="file"
                  onChange={event => setFormGameFile(event.target.files?.[0] ?? null)}
                  /> */}
                </div>
              {formGameFile && <p className="mt-1 text-xs text-slate-500">{formGameFile.name}</p>}
              </div>
              <div className="md:col-span-2">
                <FormField label="Screenshots (comma separated URLs)" value={formScreenshots} onChange={setFormScreenshots} placeholder="https://.../shot1.jpg, https://.../shot2.jpg" error={formErrors.screenshots} />
              </div>
              <div className="md:col-span-2">
                <FormField label="Short Description" value={formShortDesc} onChange={setFormShortDesc} error={formErrors.short_description} required />
              </div>
              <div className="md:col-span-2 rounded-xl border border-white/10 bg-[#121212] p-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-slate-500">Store price</p>
                    <p className={cn('text-lg font-black', formPriceValue === 0 ? 'text-sky-400' : 'text-white')}>
                      {formPriceValue === 0 ? 'FREE' : `$${formFinalPrice.toFixed(2)}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Discount</p>
                    <p className="text-lg font-black text-amber-300">{formDiscountValue}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Tags</p>
                    <p className="text-lg font-black text-white">{parseList(formTags).length}</p>
                  </div>
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-slate-400 mb-1 block">Description <span className="text-red-400">*</span></label>
                <textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} rows={4} className={cn('w-full bg-[#121212] border rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 resize-none', formErrors.description ? 'border-red-500/50 focus:ring-red-500/30' : 'border-white/10 focus:border-sky-500/50 focus:ring-sky-500/30')} />
                {formErrors.description && <p className="text-xs text-red-400 mt-1">{formErrors.description}</p>}
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-white/5">
              <button onClick={() => setShowGameForm(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">Cancel</button>
              <button onClick={saveGame} disabled={saving} className="flex items-center gap-2 px-6 py-2 bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingGame ? 'Save Changes' : 'Create Game'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <div className="bg-[#1a1a1a] rounded-xl border border-white/5 p-4">
      <div className="flex items-center gap-2 mb-1.5">{icon}<span className="text-xs text-slate-400">{label}</span></div>
      <p className="text-xl font-black text-white">{value}</p>
    </div>
  );
}

function FormField({ label, value, onChange, type = 'text', placeholder, error, required }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; error?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="text-xs text-slate-400 mb-1 block">{label} {required && <span className="text-red-400">*</span>}</label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className={cn('w-full bg-[#121212] border rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1',
          error ? 'border-red-500/50 focus:ring-red-500/30' : 'border-white/10 focus:border-sky-500/50 focus:ring-sky-500/30'
        )}
      />
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}

function Pagination({ current, total, onChange }: { current: number; total: number; onChange: (p: number) => void }) {
  if (total <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <button onClick={() => onChange(Math.max(1, current - 1))} disabled={current === 1} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-default">
        <ChevronLeft className="w-4 h-4" />
      </button>
      {Array.from({ length: total }, (_, i) => i + 1).map(page => (
        <button key={page} onClick={() => onChange(page)} className={cn('w-8 h-8 rounded-lg text-sm font-medium transition-colors', page === current ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5')}>
          {page}
        </button>
      ))}
      <button onClick={() => onChange(Math.min(total, current + 1))} disabled={current === total} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-default">
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
