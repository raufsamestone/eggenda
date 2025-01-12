import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define public routes that don't need authentication
const publicRoutes = ['/auth/login', '/auth/sign-in', '/auth/signup', '/auth/callback', '/auth/verify-email', '/auth/reset-password'];

export async function middleware(req: NextRequest) {
  // Create authenticated Supabase client
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  
  try {
    // Refresh the session
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) throw error;

    // Get the current path from the request URL
    const path = req.nextUrl.pathname;

    // Check if it's a public route
    const isPublicRoute = publicRoutes.some(route => path.startsWith(route));

    // If there is no session and trying to access protected route
    if (!session && !isPublicRoute) {
      // Create the URL to redirect to, including the original destination
      const redirectUrl = new URL('/auth/login', req.url);
      redirectUrl.searchParams.set('redirectTo', path);
      return NextResponse.redirect(redirectUrl);
    }

    // If there is a session and trying to access auth routes
    if (session && isPublicRoute) {
      // Redirect to home page if trying to access login/register while logged in
      return NextResponse.redirect(new URL('/', req.url));
    }

    return res;
  } catch (error) {
    console.error('Middleware error:', error);
    // On error, redirect to login
    const redirectUrl = new URL('/auth/sign-in', req.url);
    return NextResponse.redirect(redirectUrl);
  }
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    // Match all routes except static files, images, and callback
    '/((?!_next/static|_next/image|favicon.ico|public|api|auth/callback).*)',
    '/auth/login',
    '/auth/sign-in',
    '/auth/signup'
  ]
};
