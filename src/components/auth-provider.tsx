'use client'; // This component must be a Client Component

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase/client'; // Import our client-side helper
import type { AuthSession } from '@supabase/supabase-js';

interface AuthContextType {
  session: AuthSession | null;
  isLoading: boolean;
  // Add other auth-related values if needed (e.g., user, loading state)
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Add loading state

  useEffect(() => {
    let isMounted = true; // Flag to prevent state update on unmounted component

    // Fetch initial session
    supabase.auth.getSession().then(({ data }) => {
       if (isMounted) {
         setSession(data.session ?? null);
         setIsLoading(false);
       }
    }).catch(error => {
       if (isMounted) {
         console.error("Error in getSession:", error);
         setIsLoading(false); // Ensure loading stops on error too
       }
    });

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (isMounted) {
         setSession(currentSession ?? null);
         // Note: Loading state usually remains false after initial load
      }
    });

    // Cleanup on unmount
    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  const value = { session, isLoading }; // Pass session state

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 