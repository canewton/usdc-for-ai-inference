// middleware.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr';
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
  const protectedRoutes = ['/dashboard', '/admin', '/chat', '/image-generator', '/3d', '/video'];
  const adminRoutes = ['/admin'];
  const authRoutes = ['/sign-in', '/sign-up', '/forgot-password'];

  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  if (!user && isProtectedRoute) {
    // Redirect unauthenticated users trying to access protected routes
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  if (user) {
    if (isAuthRoute) {
      // Redirect authenticated users trying to access auth pages
      // Check if admin status is needed here, potentially fetch profile
      // For simplicity now, just redirect to dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url));
      // TODO: Enhance this to check admin status and redirect admins to /admin if preferred
    }

    // Fetch profile only if trying to access admin route to check status
    if (isAdminRoute) {
        const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('auth_user_id', user.id)
        .single();

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