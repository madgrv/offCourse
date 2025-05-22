"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabaseClient";

// ProtectedRoute ensures only authenticated users can access children
export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  // Use state with undefined initial values to prevent hydration mismatch
  const [authState, setAuthState] = useState<{
    loading: boolean;
    isAuthenticated: boolean | null;
  }>({ loading: true, isAuthenticated: null });
  
  const router = useRouter();

  // Only run authentication check on the client side
  useEffect(() => {
    // Don't redirect if already on an auth page
    const isAuthPage = window.location.pathname.startsWith('/auth/');
    
    // Check authentication status
    const checkAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        
        if (error) {
          // Don't log expected auth session missing errors
          if (!error.message.includes('Auth session missing') && !isAuthPage) {
            
          }
          
          setAuthState({ loading: false, isAuthenticated: false });
          
          // Only redirect if not already on an auth page
          if (!isAuthPage) {
            router.push('/auth/login');
          }
          return;
        }
        
        if (data?.user) {
          setAuthState({ loading: false, isAuthenticated: true });
        } else {
          setAuthState({ loading: false, isAuthenticated: false });
          
          // Only redirect if not already on an auth page
          if (!isAuthPage) {
            router.push('/auth/login');
          }
        }
      } catch (error) {
        // Only log unexpected errors
        if (!isAuthPage) {
          
        }
        
        setAuthState({ loading: false, isAuthenticated: false });
        
        // Only redirect if not already on an auth page
        if (!isAuthPage) {
          router.push('/auth/login');
        }
      }
    };
    
    // Only run on client side
    checkAuth();
    
    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      checkAuth();
    });
    
    return () => { listener?.subscription.unsubscribe(); };
  }, [router]);

  // Render different content based on authentication state
  // Initial render will be empty to prevent hydration mismatch
  if (authState.loading) {
    return <div className="min-h-screen" />;
  }

  // If not authenticated, show minimal content while redirecting
  if (authState.isAuthenticated === false) {
    return <div className="min-h-screen" />;
  }

  // If authenticated, render children
  return <>{children}</>;
}
