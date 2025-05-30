'use client';

import { useState, useEffect } from 'react';
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
import { createClient } from '@supabase/supabase-js';
import en from '@/shared/language/en';

const createSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(supabaseUrl, supabaseAnonKey);
};

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [token, setToken] = useState('');
  const [hashPresent, setHashPresent] = useState(false);

  useEffect(() => {
    const hasHash = window.location.hash.length > 0;
    setHashPresent(hasHash);

    if (!hasHash) {
      setError(en.invalidResetLink);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(en.passwordsDoNotMatch);
      return;
    }

    if (password.length < 6) {
      setError(en.passwordTooShort);
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createSupabaseClient();

      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        throw error;
      }

      setSuccess(en.passwordResetSuccess);

      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message || en.passwordResetFailed);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='container mx-auto flex items-center justify-center min-h-[80vh] px-4'>
      <Card className='w-full max-w-md'>
        <CardHeader>
          <CardTitle className='text-2xl text-center'>
            {en.resetPasswordTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && <div className='text-red-600 mb-4'>{error}</div>}
          {success && <div className='text-green-600 mb-4'>{success}</div>}

          {hashPresent ? (
            <form onSubmit={handleSubmit} className='space-y-4'>
              <div className='space-y-2'>
                <label htmlFor='password' className='block text-sm font-medium'>
                  {en.newPassword}
                </label>
                <div className='relative'>
                  <input
                    id='password'
                    type='password'
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className='w-full border rounded px-3 py-2 bg-background'
                    placeholder='••••••••'
                    required
                    suppressHydrationWarning
                  />
                </div>
              </div>
              <div className='space-y-2'>
                <label
                  htmlFor='confirmPassword'
                  className='block text-sm font-medium'
                >
                  {en.confirmNewPassword}
                </label>
                <div className='relative'>
                  <input
                    id='confirmPassword'
                    type='password'
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className='w-full border rounded px-3 py-2 bg-background'
                    placeholder='••••••••'
                    required
                    suppressHydrationWarning
                  />
                </div>
              </div>
              <Button type='submit' className='w-full' disabled={isLoading}>
                {isLoading ? en.resettingPassword : en.resetPasswordButton}
              </Button>
            </form>
          ) : (
            <div className='text-center py-4'>
              <p className='mb-4'>{en.resetLinkInfo}</p>
              <Link href='/auth/login' className='text-primary hover:underline'>
                {en.returnToLogin}
              </Link>
            </div>
          )}
        </CardContent>
        <CardFooter className='flex justify-center'>
          <p className='text-sm text-muted-foreground'>
            {en.rememberPassword}{' '}
            <Link href='/auth/login' className='text-primary hover:underline'>
              {en.loginButton}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
