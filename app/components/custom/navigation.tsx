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
import { useAuth } from '@/app/context/auth-context';

export function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  // State to store logged-in user
  // Use global auth context for user state
  const { user, setUser } = useAuth();
  // State to track logout in progress
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      router.push('/auth/login');
    } catch (error) {
      
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
        <div className='fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50'>
          <div className='bg-white dark:bg-background p-6 rounded shadow text-center'>
            <span>Logging out…</span>
            {/* Optionally, add a spinner here for better UX */}
          </div>
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
