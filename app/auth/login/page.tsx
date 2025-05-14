"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { supabase } from "@/app/lib/supabaseClient";
import en from "@/shared/language/en";

export default function LoginPage() {
  // --- Forgot Password State ---
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Authenticate user with Supabase Auth (email/password)
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setIsLoading(false);

    if (error) {
      // Show localised error from Supabase
      setError(error.message);
      return;
    }

    // Login succeeded: redirect to home and show success message
    setSuccess(en.loginSuccess);
    setTimeout(() => {
      router.push("/");
    }, 1000);
  };

  return (
    <div className="container mx-auto flex items-center justify-center min-h-[80vh] px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Login to Teo&apos;s Diet App</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Show error or success messages to the user */}
          {error && <div className="text-red-600 mb-2">{error}</div>}
          {success && <div className="text-green-600 mb-2">{success}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium">
                Email
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
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                {en.password}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2 border rounded-md bg-background"
                  placeholder="••••••••"
                  required
                  suppressHydrationWarning
                />
              </div>
              {/* Forgot Password Link - shows inline reset form */}
              <button
                type="button"
                className="text-xs text-primary hover:underline mt-1"
                onClick={() => setShowReset(true)}
                aria-label={en.forgotPassword}
              >
                {en.forgotPassword}
              </button>
              {showReset && (
                <form
                  className="mt-2 flex flex-col gap-2"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setResetMessage("");
                    setResetError("");
                    setResetLoading(true);
                    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail);
                    setResetLoading(false);
                    if (error) {
                      setResetError(error.message);
                    } else {
                      setResetMessage(en.resetEmailSent);
                    }
                  }}
                >
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={e => setResetEmail(e.target.value)}
                    className="w-full px-2 py-1 border rounded bg-background text-sm"
                    placeholder={en.email}
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={resetLoading}
                  >
                    {resetLoading ? en.sending : en.sendResetLink}
                  </Button>
                  {resetMessage && <div className="text-green-600 text-xs">{resetMessage}</div>}
                  {resetError && <div className="text-red-600 text-xs">{resetError}</div>}
                  <button
                    type="button"
                    className="text-xs underline text-muted-foreground mt-1"
                    onClick={() => setShowReset(false)}
                  >
                    {en.cancel}
                  </button>
                </form>
              )}
            </div>
            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/auth/register" className="text-primary hover:underline">
              Register
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}