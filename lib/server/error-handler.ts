import { NextResponse } from 'next/server';

export type ApiErrorResponse = {
  error: string;
  detail?: string;
  code?: string;
};

/**
 * Detect if error message indicates a configuration issue
 */
function isConfigError(message: string): boolean {
  return (
    /missing .*environment/i.test(message) ||
    /missing .*env/i.test(message) ||
    /missing NEXT_PUBLIC_/i.test(message) ||
    /missing SUPABASE_/i.test(message) ||
    /missing STRIPE_/i.test(message) ||
    /missing R2/i.test(message) ||
    /must be the R2 secret key/i.test(message) ||
    /CLOUDFLARE_R2_/i.test(message) ||
    /environment variables/i.test(message)
  );
}

/**
 * Detect if error is database-related
 */
function isDatabaseError(message: string): boolean {
  return (
    /row-level security/i.test(message) ||
    /permission denied/i.test(message) ||
    /foreign key/i.test(message) ||
    /unique constraint/i.test(message) ||
    /violates unique constraint/i.test(message) ||
    /could not load game data/i.test(message) ||
    /database/i.test(message)
  );
}

/**
 * Detect if error is authentication-related
 */
function isAuthError(message: string): boolean {
  return (
    /invalid.*session/i.test(message) ||
    /authentication required/i.test(message) ||
    /unauthorized/i.test(message) ||
    /forbidden/i.test(message)
  );
}

/**
 * Determine HTTP status code based on error type
 */
function getStatusCode(message: string): number {
  if (isAuthError(message)) return 401;
  if (isConfigError(message)) return 503;
  if (isDatabaseError(message)) return 502;
  return 500;
}

/**
 * API error response builder - Type safe, always returns proper JSON
 */
export function apiError(
  error: string,
  status: number = 400,
  detail?: string
): NextResponse<ApiErrorResponse> {
  return NextResponse.json<ApiErrorResponse>(
    { error, ...(detail ? { detail } : {}) },
    { status }
  );
}

/**
 * Handle unexpected server errors with proper logging and response
 * @param scope - Where the error occurred (e.g. 'api/download')
 * @param error - The caught error
 * @param context - Additional context data to log
 * @returns Proper error response that never crashes
 */
export function handleServerError(
  scope: string,
  error: unknown,
  context?: Record<string, unknown>
): NextResponse<ApiErrorResponse> {
  const detail = error instanceof Error ? error.message : String(error);
  
  // Always log errors with context
  console.error(
    `[${scope}] Server error: ${detail}`,
    context ? JSON.stringify(context) : ''
  );

  // Detect error type and set appropriate status
  const status = getStatusCode(detail);

  // Return safe error response
  if (status === 503) {
    return apiError(
      'Server configuration is incomplete',
      503,
      detail
    );
  }

  if (status === 502) {
    return apiError(
      'Service unavailable',
      502,
      isDatabaseError(detail) ? 'Database error: ' + detail : detail
    );
  }

  // Default to 500 but never expose internal details in production
  return apiError(
    'Internal Server Error',
    500,
    process.env.NODE_ENV === 'development' ? detail : undefined
  );
}

/**
 * Middleware for wrapping async route handlers with error handling
 * Usage: export const GET = asyncHandler(async (req) => { ... })
 */
export function asyncHandler(
  handler: (req: any) => Promise<NextResponse>
) {
  return async (req: any) => {
    try {
      return await handler(req);
    } catch (error) {
      return handleServerError('api', error);
    }
  };
}

/**
 * Safe JSON parse with proper error handling
 */
export async function safeJsonParse<T>(
  body: ReadableStream<Uint8Array> | null,
  fallback: T
): Promise<T> {
  if (!body) return fallback;
  try {
    const text = await new Response(body).text();
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}

/**
 * Validate required query parameters
 */
export function validateQueryParams(
  params: Record<string, string | null>,
  required: string[]
): { ok: boolean; missing?: string[] } {
  const missing = required.filter(key => !params[key]?.trim());
  return missing.length === 0 
    ? { ok: true }
    : { ok: false, missing };
}

/**
 * Validate required fields in request body
 */
export function validateBodyFields(
  body: any,
  required: string[]
): { ok: boolean; missing?: string[] } {
  const missing = required.filter(key => !body?.[key]);
  return missing.length === 0
    ? { ok: true }
    : { ok: false, missing };
}
