import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

export const middleware = async (request: NextRequest) => {
  try {
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
          getAll: () => request.cookies.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value),
            );
            response = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options),
            );
          },
        },
      },
    );

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      // If not logged in, redirect to sign-in for protected routes
      if (!request.nextUrl.pathname.startsWith('/sign-in')) {
        return NextResponse.redirect(new URL('/sign-in', request.url));
      }
      return response;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('auth_user_id', user.id)
      .single();

    if (profileError || !profile) {
      // Handle profile fetch error
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }

    // Redirect non-admins trying to access admin pages
    if (request.nextUrl.pathname.startsWith('/admin') && !profile.is_admin) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Redirect logged-in non-admins from home to dashboard
    if (request.nextUrl.pathname === '/' && !profile.is_admin) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return response;
  } catch (e) {
    console.error('Middleware error:', e);
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }
};
