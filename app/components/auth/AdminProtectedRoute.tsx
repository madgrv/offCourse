"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabaseClient";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/app/components/ui/alert";

// AdminProtectedRoute ensures only authenticated admin users can access children
export default function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  // Use state with undefined initial values to prevent hydration mismatch
  const [authState, setAuthState] = useState<{
    loading: boolean;
    isAuthenticated: boolean | null;
    isAdmin: boolean | null;
  }>({ loading: true, isAuthenticated: null, isAdmin: null });
  
  const router = useRouter();

  // Only run authentication check on the client side
  useEffect(() => {
    // Check authentication and admin status
    const checkAuth = async () => {
      try {
        // First check if user is authenticated
        const { data: userData, error: userError } = await supabase.auth.getUser();
        
        if (userError || !userData?.user) {
          setAuthState({ loading: false, isAuthenticated: false, isAdmin: false });
          router.push('/auth/login');
          return;
        }
        
        // User is authenticated, now check if they're an admin
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userData.user.id)
          .single();
        
        if (profileError) {
          console.error('Error fetching user role:', profileError);
          setAuthState({ loading: false, isAuthenticated: true, isAdmin: false });
          return;
        }
        
        const isAdmin = profileData?.role === 'admin';
        
        setAuthState({ 
          loading: false, 
          isAuthenticated: true, 
          isAdmin: isAdmin 
        });
        
        // If not admin, redirect to dashboard
        if (!isAdmin) {
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Admin auth check error:', error);
        setAuthState({ loading: false, isAuthenticated: false, isAdmin: false });
        router.push('/auth/login');
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
  if (authState.loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <p>Loading...</p>
    </div>;
  }

  // If not authenticated or not admin, show access denied
  if (!authState.isAuthenticated || !authState.isAdmin) {
    return <div className="min-h-screen flex items-center justify-center p-4">
      <Alert variant="destructive" className="max-w-md">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Access Denied</AlertTitle>
        <AlertDescription>
          You do not have permission to access this page. This area is restricted to administrators only.
        </AlertDescription>
      </Alert>
    </div>;
  }

  // If authenticated and admin, render children
  return <>{children}</>;
}
