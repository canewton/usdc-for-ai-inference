// middleware.ts
import { type CookieOptions, createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
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
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
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
  // https://supabase.com/docs/guides/auth/auth-helpers/nextjs#managing-session-with-middleware
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Define protected routes
  const protectedRoutes = [
    '/dashboard',
    '/admin',
    '/chat',
    '/image-generator',
    '/3d',
    '/video',
  ];
  const adminRoutes = ['/admin'];
  const authRoutes = ['/sign-in', '/sign-up', '/forgot-password'];
  const userOnlyRoutes = [
    '/dashboard',
    '/3d',
    '/chat',
    '/image',
    '/video',
    '/image-generator',
  ];

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  );
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
  const isUserOnlyRoute = userOnlyRoutes.some(
    (route) => pathname === route || pathname.startsWith(route),
  );

  if (!user && isProtectedRoute) {
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
      // Redirect admin from root to admin dashboard
      if (request.nextUrl.pathname === '/') {
        return NextResponse.redirect(new URL('/admin', request.url));
      }

      // Redirect admin from user-only routes to admin dashboard
      if (isUserOnlyRoute) {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
    }

    if (isAuthRoute) {
      // Redirect authenticated users trying to access auth pages to dashboard or admin based on role
      if (profile?.is_admin) {
        return NextResponse.redirect(new URL('/admin', request.url));
      } else {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }

    // Check admin status for admin routes
    if (isAdminRoute) {
      if (!profile?.is_admin) {
        // Redirect non-admins trying to access admin routes
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
  }

  // If user is trying to access the root path '/', redirect based on auth status
  if (pathname === '/') {
    if (user) {
      // Check admin status and redirect accordingly
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('auth_user_id', user.id)
        .single();

      if (profile?.is_admin) {
        return NextResponse.redirect(new URL('/admin', request.url));
      } else {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    } else {
      // Redirect unauthenticated users from root to sign-in
      return NextResponse.redirect(new URL('/sign-in', request.url));
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
