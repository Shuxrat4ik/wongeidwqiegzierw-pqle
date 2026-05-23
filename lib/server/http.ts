import { NextRequest, NextResponse } from 'next/server';

export type ApiErrorBody = {
  error: string;
  detail?: string;
};

export function jsonError(error: string, status = 400, detail?: string) {
  return NextResponse.json<ApiErrorBody>({ error, ...(detail ? { detail } : {}) }, { status });
}

export function serverError(scope: string, error: unknown) {
  const detail = error instanceof Error ? error.message : String(error);
  console.error(`[${scope}]`, detail);
  return jsonError('Internal Server Error', 500, detail);
}

export function bearerToken(req: NextRequest): string | null {
  const header = req.headers.get('authorization');
  if (!header || !/^Bearer\s+/i.test(header)) return null;
  return header.replace(/^Bearer\s+/i, '').trim();
}

export function getOrigin(req: NextRequest) {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ||
    req.headers.get('origin') ||
    new URL(req.url).origin
  );
}
