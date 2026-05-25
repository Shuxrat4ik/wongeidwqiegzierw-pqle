import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/server/auth';
import { serverError } from '@/lib/server/http';

export async function GET(req: NextRequest) {
  try {
    const gate = await requireUser(req);
    if (!gate.ok) return gate.response;

    return NextResponse.json({
      user: gate.user,
    });
  } catch (err) {
    return serverError('api/auth/me', err);
  }
}
