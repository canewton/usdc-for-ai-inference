// middleware.ts
import { type CookieOptions, createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL
  ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
  : 'http://localhost:3000';

const corsOptions = {
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function middleware(request: NextRequest) {
  // Check the origin from the request
  const origin = request.headers.get('origin') ?? '';
  const isAllowedOrigin = origin === baseUrl;

  // Handle preflighted requests
  const isPreflight = request.method === 'OPTIONS';

  if (isPreflight) {
    const preflightHeaders = {
      ...(isAllowedOrigin && { 'Access-Control-Allow-Origin': origin }),
      ...corsOptions,
    };
    return NextResponse.json({}, { headers: preflightHeaders });
  }

  // Handle simple requests
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  if (isAllowedOrigin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }

  Object.entries(corsOptions).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    },
  );

  // Refresh session if expired - required for Server Components
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Define protected routes
  const protectedRoutes = [
    '/dashboard',
    '/admin',
    '/chat',
    '/3d',
    '/video',
    '/image',
  ];
  const adminRoutes = ['/admin'];
  const userOnlyRoutes = ['/dashboard', '/3d', '/chat', '/image', '/video'];
  const authRoutes = ['/sign-in', '/sign-up', '/forgot-password'];

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  );
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));
  const isUserOnlyRoute = userOnlyRoutes.some(
    (route) => pathname === route || pathname.startsWith(route),
  );
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  if (!user && (isProtectedRoute || request.nextUrl.pathname === '/')) {
    // Redirect unauthenticated users trying to access protected routes
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  if (user) {
    // Fetch profile info to check admin status
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('auth_user_id', user.id)
      .single();

    // Admin user specific redirects
    if (profile?.is_admin) {
      if (request.nextUrl.pathname === '/' || isUserOnlyRoute || isAuthRoute) {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
    } else {
      if (request.nextUrl.pathname === '/' || isAdminRoute || isAuthRoute) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/ (API routes - auth check happens within the route handlers)
     * - auth/callback (Supabase auth callback)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|api/|auth/callback).*)',
  ],
};
