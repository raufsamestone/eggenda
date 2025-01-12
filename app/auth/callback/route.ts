import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const next = requestUrl.searchParams.get('next') ?? '/';

    if (code) {
      const cookieStore = cookies();
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('Auth error:', error);
        return NextResponse.redirect(`${requestUrl.origin}/auth/sign-in?error=Authentication failed`);
      }

      // Successful authentication
      return NextResponse.redirect(`${requestUrl.origin}${next}`);
    }

    // No code provided
    return NextResponse.redirect(`${requestUrl.origin}/auth/sign-in?error=No code provided`);
  } catch (error) {
    console.error('Callback error:', error);
    //@ts-ignore
    return NextResponse.redirect(`${requestUrl.origin}/auth/sign-in?error=Something went wrong`);
  }
}