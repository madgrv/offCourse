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
  const { user, signOut } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await signOut();
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoggingOut(false);
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
      {loggingOut && (
        <div className='fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50'>
          <div className='bg-white dark:bg-background p-6 rounded shadow text-center'>
            <span>Logging out…</span>
          </div>
        </div>
      )}

      <nav className='bg-background border-b'>
        <div className='container mx-auto px-4'>
          <div className='flex h-16 items-center justify-between'>
            <div className='flex items-center flex-1'>
              <Link href='/' className='text-xl font-bold'>
                offCourse
              </Link>
            </div>
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
            <div className='flex items-center space-x-4'>
              <ThemeToggle />
              {user && (
                <div className='hidden md:flex items-center'>
                  <UserDropdown
                    name={user.email?.split('@')[0] || 'User'}
                    email={user.email || ''}
                    onLogout={handleLogout}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
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
            {user && (
              <div className='flex items-center justify-center space-x-3 mt-2'>
                <span className='text-sm font-medium text-foreground'>
                  {user.email?.split('@')[0] || 'User'}
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
