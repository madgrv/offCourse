'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/app/lib/utils';

import { useEffect, useState } from 'react';
import { supabase } from '@/app/lib/supabaseClient';
import en from '@/shared/language/en';
import { UserDropdown } from '@/app/components/ui/user-dropdown';

import { ThemeToggle } from '@/app/components/ui/theme-toggle';
import { useRouter } from 'next/navigation';

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  // State to store logged-in user
  const [user, setUser] = useState<{ email: string; name?: string } | null>(
    null
  );
  // State to track logout in progress
  const [loggingOut, setLoggingOut] = useState(false);

  // On mount, check for authenticated user
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUser({
          email: data.user.email || '',
          name: data.user.user_metadata?.name,
        });
      } else {
        setUser(null);
      }
    };
    getUser();
    // Subscribe to auth state changes to update UI on login/logout
    const { data: listener } = supabase.auth.onAuthStateChange(() => getUser());
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  // Improved logout handler with proper routing
  // Handles user logout with loading overlay and redirect to login page
  // Ensures correct request/response with Supabase and provides error feedback
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const handleLogout = async () => {
    setLoggingOut(true); // Show loading overlay
    setLogoutError(null); // Reset any previous error

    // Log the current session before logout for debugging
    const { data: beforeSession } = await supabase.auth.getSession();
    console.log('DEBUG: Session before logout:', beforeSession);

    try {
      // Log intent to send signOut request
      console.log('DEBUG: Sending signOut request to Supabase...');
      // Wrap signOut in a Promise.race with a 5s timeout to catch hangs
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('signOut timeout')), 5000)
      );
      const result = await Promise.race([
        supabase.auth.signOut(),
        timeout
      ]);
      console.log('DEBUG: signOut result:', result);
      // TypeScript-safe check for error property
      if (typeof result === 'object' && result !== null && 'error' in result) {
        const { error } = result as { error: any };
        if (error) {
          setLoggingOut(false);
          setLogoutError('Logout failed. Please try again.');
          console.error('DEBUG: Error signing out:', error);
          return;
        }
      } else {
        // If result is not an object, it's likely an error thrown by the timeout
        setLoggingOut(false);
        setLogoutError('Logout failed. Please try again.');
        console.error('DEBUG: signOut result not an object:', result);
        return;
      }
      setUser(null);

      // Log the session after logout for debugging
      const { data: afterSession } = await supabase.auth.getSession();
      console.log('DEBUG: Session after logout:', afterSession);

      // Use router.push for SPA navigation (faster, no full reload)
      router.push('/auth/login');
    } catch (error) {
      setLoggingOut(false); // Allow retry if error
      setLogoutError('Logout failed. Please try again.');
      console.error('DEBUG: Error signing out (exception):', error);
    }
  };


  const routes = [
    {
      name: 'Home',
      path: '/',
    },
    {
      name: 'Diet Plan',
      path: '/diet-plan',
    },
    {
      name: 'Analytics',
      path: '/analytics',
    },
  ];

  return (
    <>
      {/* Loading overlay shown during logout */}
      {loggingOut && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white dark:bg-background p-6 rounded shadow text-center">
            <span>Logging out…</span>
            {/* Optionally, add a spinner here for better UX */}
          </div>
        </div>
      )}
      {/* Show logout error message if present */}
      {logoutError && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-destructive text-destructive-foreground px-4 py-2 rounded shadow z-50">
          {logoutError}
        </div>
      )}
      <nav className='bg-background border-b'>
      <div className='container mx-auto px-4'>
        {/* Layout: logo left, nav links centred, user/logout and theme toggle right (md+) */}
        <div className='flex h-16 items-center justify-between'>
          <div className='flex items-center flex-1'>
            <Link href='/' className='text-xl font-bold'>
              offCourse
            </Link>
          </div>
          {/* Centre navigation links on md+ screens */}
          <div className='hidden md:flex flex-1 justify-center items-center'>
            {routes.map((route) => (
              <Link
                key={route.path}
                href={route.path}
                className={cn(
                  'px-3 py-2 rounded-md text-sm font-medium',
                  pathname === route.path
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                {route.name}
              </Link>
            ))}
          </div>
          {/* User/logout and theme toggle right-aligned on md+ screens */}
          <div className='flex items-center space-x-4'>
            {/* Theme toggle for both mobile and desktop */}
            <ThemeToggle />

            {/* UserDropdown: username/email with menu for logout (future: settings/profile) */}
            {user && (
              <div className='hidden md:flex items-center'>
                <UserDropdown
                  name={user.name}
                  email={user.email}
                  onLogout={handleLogout}
                />
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Mobile menu for small screens */}
      <div className='md:hidden border-t'>
        <div className='flex flex-col px-2 pt-2 pb-3 space-y-2'>
          <div className='flex justify-between space-x-1'>
            {routes.map((route) => (
              <Link
                key={route.path}
                href={route.path}
                className={cn(
                  'block px-3 py-2 rounded-md text-sm font-medium text-center flex-1',
                  pathname === route.path
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                {route.name}
              </Link>
            ))}
          </div>
          {/* Mobile user/logout */}
          {user && (
            <div className='flex items-center justify-center space-x-3 mt-2'>
              <span className='text-sm font-medium text-foreground'>
                {user.name ? user.name : user.email}
              </span>
              <button
                onClick={handleLogout}
                className='bg-destructive text-destructive-foreground rounded px-3 py-1 text-sm font-medium hover:bg-destructive/80'
                type='button'
                aria-label={en.logout}
              >
                {en.logout}
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
    </>
  );
}
