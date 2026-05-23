import { NextRequest, NextResponse } from 'next/server';
import { createAnonServerClient } from '@/lib/server/supabase-server';
import { jsonError, serverError } from '@/lib/server/http';

export async function GET(req: NextRequest) {
  try {
    const page = Math.max(1, Number(req.nextUrl.searchParams.get('page') ?? '1') || 1);
    const pageSize = Math.min(60, Math.max(1, Number(req.nextUrl.searchParams.get('pageSize') ?? '24') || 24));
    const search = req.nextUrl.searchParams.get('search')?.trim();
    const category = req.nextUrl.searchParams.get('category')?.trim();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const supabase = createAnonServerClient();

    let query = supabase
      .from('games')
      .select('*', { count: 'exact' })
      .eq('is_available', true)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }
    if (category) {
      query = query.contains('genre', [category]);
    }

    const { data, error, count } = await query;
    if (error) return jsonError(error.message, 400);

    return NextResponse.json({
      games: data ?? [],
      page,
      pageSize,
      total: count ?? 0,
    });
  } catch (err) {
    return serverError('api/games', err);
  }
}
