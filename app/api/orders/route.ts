import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/server/auth';
import { apiError, handleServerError } from '@/lib/server/error-handler';

export async function GET(req: NextRequest) {
  try {
    const gate = await requireUser(req);
    if (!gate.ok) return gate.response;

    const page = Math.max(1, Number(req.nextUrl.searchParams.get('page') ?? '1') || 1);
    const pageSize = Math.min(50, Math.max(1, Number(req.nextUrl.searchParams.get('pageSize') ?? '10') || 10));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await gate.supabase
      .from('orders')
      .select(
        'id, subtotal, discount_amount, tax_amount, total, currency, status, payment_method, stripe_session_id, stripe_payment_intent_id, created_at, order_items(id, game_id, game_title, price_at_purchase, discount_percent)',
        { count: 'exact' }
      )
      .eq('user_id', gate.user.id)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) return apiError(error.message, 400);

    return NextResponse.json({
      orders: data ?? [],
      page,
      pageSize,
      total: count ?? 0,
    });
  } catch (err) {
    return handleServerError('api/orders', err);
  }
}
