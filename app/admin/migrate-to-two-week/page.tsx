'use client';

import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/ui/card';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/app/context/auth-context';
import AdminProtectedRoute from '@/app/components/auth/AdminProtectedRoute';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { supabase } from '@/app/lib/supabaseClient';

// Define simple Alert components inline to avoid import issues
type AlertProps = {
  children: React.ReactNode;
  variant?: 'default' | 'destructive';
  className?: string;
  [key: string]: any;
};

const Alert = ({ children, variant = 'default', className = '', ...props }: AlertProps) => (
  <div
    className={`relative w-full rounded-lg border p-4 ${variant === 'destructive' ? 'border-red-500 text-red-600' : 'border-gray-200'} ${className}`}
    role="alert"
    {...props}
  >
    {children}
  </div>
);

type AlertChildProps = {
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
};

const AlertTitle = ({ children, className = '', ...props }: AlertChildProps) => (
  <h5 className={`mb-1 font-medium leading-none tracking-tight ${className}`} {...props}>
    {children}
  </h5>
);

const AlertDescription = ({ children, className = '', ...props }: AlertChildProps) => (
  <div className={`text-sm ${className}`} {...props}>
    {children}
  </div>
);
export default function MigrationPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    message?: string;
    details?: any;
  }>({});

  const runMigration = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setResult({});
    
    try {
      // Get the current session directly from Supabase
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData.session) {
        throw new Error(sessionError?.message || 'No active session found');
      }
      
      const accessToken = sessionData.session.access_token;
      
      if (!accessToken) {
        throw new Error('Access token not available in current session');
      }
      
      const response = await fetch('/api/diet/migrate-to-two-week', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Migration failed');
      }
      
      setResult({
        success: true,
        message: data.message || 'Migration completed successfully',
        details: data.results,
      });
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminProtectedRoute>
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">Migrate to Two-Week Diet Plan</h1>
          
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Migration Tool</CardTitle>
              <CardDescription>
                This tool will migrate your existing diet plan data to support a 2-week alternating plan.
                It will add a week column to the diet_food_items table and duplicate existing food items for week 2.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                Before proceeding, please ensure:
              </p>
              <ul className="list-disc pl-6 mb-4 space-y-1">
                <li>You have admin privileges</li>
                <li>You have backed up your database</li>
                <li>Users are not actively using the system</li>
              </ul>
              <p className="text-amber-600">
                This operation cannot be undone.
              </p>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={runMigration} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Running Migration...' : 'Run Migration'}
              </Button>
            </CardFooter>
          </Card>
          
          {result.message && (
            <Alert variant={result.success ? 'default' : 'destructive'} className="mb-6">
              <div className="flex items-center gap-2">
                {result.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                <AlertTitle>{result.success ? 'Success' : 'Error'}</AlertTitle>
              </div>
              <AlertDescription className="mt-2">{result.message}</AlertDescription>
            </Alert>
          )}
          
          {result.details && (
            <Card>
              <CardHeader>
                <CardTitle>Migration Results</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-md overflow-auto max-h-96 text-sm">
                  {JSON.stringify(result.details, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
      </DashboardLayout>
    </AdminProtectedRoute>
  );
}
