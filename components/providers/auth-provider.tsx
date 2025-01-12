// components/providers/auth-provider.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, isLoading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Public routes that don't need authentication
  const publicRoutes = ['/auth/login', '/auth/sign-in', '/auth/signup', '/auth/verify-email', '/auth/reset-password'];
  const isPublicRoute = publicRoutes.includes(pathname);

  useEffect(() => {
    // Check auth state
    const checkUser = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (!session && !isPublicRoute) {
          // No session and trying to access protected route
          router.push('/auth/sign-in');
        } else if (session && isPublicRoute) {
          // Has session but trying to access public route
          router.push('/');
        }

        setUser(session?.user || null);
      } catch (error) {
        console.error('Error checking auth:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (!session && !isPublicRoute) {
        router.push('/auth/sign-in');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, isPublicRoute]);

  return (
    <AuthContext.Provider value={{ user, isLoading }}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};