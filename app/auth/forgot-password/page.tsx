'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { createClient } from '@supabase/supabase-js';
import en from '@/shared/language/en';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);
    
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      
      // Use environment variable for site URL or fall back to localhost for development
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
      const redirectTo = `${siteUrl}/auth/reset-password`;
      
      // This will send an email with a reset link containing the token
      const response = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectTo,
      });
      
      if (response.error) {
        setError(response.error.message);
      } else {
        setMessage(en.resetPasswordSuccess);
      }
    } catch (err: any) {
      setError(err.message || en.unexpectedError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto flex items-center justify-center min-h-[80vh] px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">{en.resetPasswordTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          {message && <div className="text-green-600 mb-4">{message}</div>}
          {error && <div className="text-red-600 mb-4">{error}</div>}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium">
                {en.emailAddress}
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border rounded px-3 py-2 bg-background"
                  placeholder="your.email@example.com"
                  required
                  suppressHydrationWarning
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {en.resetPasswordInstructions}
              </p>
            </div>
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={loading}
            >
              {loading ? en.sending : en.sendResetLink}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            {en.rememberPassword}{' '}
            <Link href="/auth/login" className="text-primary hover:underline">
              {en.backToLogin}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
