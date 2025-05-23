'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { supabase } from '@/app/lib/supabaseClient';
import en from '@/shared/language/en';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setIsLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSuccess(en.loginSuccess);
    setTimeout(() => {
      router.push('/');
    }, 1000);
  };

  return (
    <div className='container mx-auto flex items-center justify-center min-h-[80vh] px-4'>
      <Card className='w-full max-w-md'>
        <CardHeader>
          <CardTitle className='text-2xl text-center'>
            {en.loginToApp}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && <div className='text-red-600 mb-2'>{error}</div>}
          {success && <div className='text-green-600 mb-2'>{success}</div>}

          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='space-y-2'>
              <label htmlFor='email' className='block text-sm font-medium'>
                Email
              </label>
              <div className='relative'>
                <input
                  id='email'
                  type='email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className='w-full border rounded px-3 py-2 bg-background'
                  placeholder='your.email@example.com'
                  required
                  suppressHydrationWarning
                />
              </div>
            </div>
            <div className='space-y-2'>
              <label htmlFor='password' className='text-sm font-medium'>
                {en.password}
              </label>
              <div className='relative'>
                <input
                  id='password'
                  type='password'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className='w-full p-2 border rounded-md bg-background'
                  placeholder='••••••••'
                  required
                  suppressHydrationWarning
                />
              </div>
              <Link
                href='/auth/forgot-password'
                className='text-xs text-primary hover:underline mt-1 block'
              >
                {en.forgotPassword}
              </Link>
            </div>
            <Button type='submit' className='w-full' disabled={isLoading}>
              {isLoading ? en.loggingIn : en.loginButton}
            </Button>
          </form>
        </CardContent>
        <CardFooter className='flex justify-center'>
          <p className='text-sm text-muted-foreground'>
            {en.dontHaveAccount}{' '}
            <Link
              href='/auth/register'
              className='text-primary hover:underline'
            >
              {en.register}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
