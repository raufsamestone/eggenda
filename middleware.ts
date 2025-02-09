import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const path = req.nextUrl.pathname;

  // Auth sayfalarına ve public assets'lere serbest erişim ver
  if (path.startsWith('/auth/') ||
      path.includes('favicon') ||
      path.includes('.ico') ||
      path.includes('apple-icon') ||
      path.includes('icon')) {
    return res;
  }

  // Diğer tüm sayfalar için auth kontrolü yap
  const supabase = createMiddlewareClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.redirect(new URL('/auth/sign-in', req.url));
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - public folder files
     */
    '/((?!api|_next/static|_next/image|assets|public).*)',
  ],
};
