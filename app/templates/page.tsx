'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/context/auth-context';
import { useDietPlanData } from '@/app/hooks/useDietPlanData';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/app/components/ui/tabs';
import { Skeleton } from '@/app/components/ui/skeleton';
import { MealCard } from '@/app/components/custom/MealCard';
import ProtectedRoute from '@/app/components/auth/ProtectedRoute';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import {
  getCurrentWeekAndDay,
  formatWeekDay,
} from '@/app/lib/getCurrentWeekAndDay';
import en from '@/shared/language/en';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/components/ui/card';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function TemplateDietPlansPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  

  useEffect(() => {
    async function fetchTemplates() {
      setLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase
          .from('diet_plans')
          .select('id, name, description, created_at')
          .eq('is_template', true);

        if (error) {
          setError(en.failedToFetchTemplates || 'Failed to fetch templates');
        } else {
          setTemplates(data || []);
        }
      } catch (err) {
        // Error handled in UI state
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    }
    
    if (user) {
      fetchTemplates();
    }
  }, [user]);


  const viewTemplate = (templateId: string) => {
    router.push(`/diet-plan?planId=${templateId}&includeTemplates=true`);
  };


  const cloneTemplate = async (templateId: string) => {
    if (!user) {
      setError(en.cloneAuthRequired || 'Authentication required');
      return;
    }

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        setError(en.cloneAuthRequired || 'Authentication required');
        return;
      }

      const res = await fetch('/api/diet/clone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: 'include',
        body: JSON.stringify({ templateId }),
      });

      const result = await res.json();

      if (!result.success) {
        setError(result.error || en.cloneFailed || 'Failed to clone template');
      } else {
        // Redirect to the diet plan page
        router.push('/diet-plan');
      }
    } catch (err: any) {
      setError(`${en.cloneFailed || 'Failed to clone template'} ${err.message ? `(${err.message})` : ''}`);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className='container mx-auto px-4 py-8'>
            <h1 className='text-3xl font-bold mb-6'>Template Diet Plans</h1>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className='w-full'>
                  <CardHeader>
                    <Skeleton className='h-6 w-48 mb-2' />
                    <Skeleton className='h-4 w-full' />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className='h-4 w-full mb-2' />
                    <Skeleton className='h-4 w-3/4' />
                  </CardContent>
                  <CardFooter className='flex justify-between'>
                    <Skeleton className='h-10 w-24' />
                    <Skeleton className='h-10 w-24' />
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className='container mx-auto px-4 py-8'>
          <h1 className='text-3xl font-bold mb-6'>Template Diet Plans</h1>
          
          {error && (
            <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6'>
              {error}
            </div>
          )}
          
          {templates.length === 0 ? (
            <div className='text-center py-12'>
              <h2 className='text-xl font-semibold mb-2'>No Template Diet Plans Available</h2>
              <p className='text-gray-600'>There are currently no template diet plans available.</p>
            </div>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {templates.map((template) => (
                <Card key={template.id} className='w-full'>
                  <CardHeader>
                    <CardTitle>{template.name || 'Unnamed Template'}</CardTitle>
                    <CardDescription>
                      Created: {new Date(template.created_at).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className='text-sm text-gray-600'>
                      {template.description || 'No description available'}
                    </p>
                  </CardContent>
                  <CardFooter className='flex justify-between'>
                    <Button 
                      variant='outline' 
                      onClick={() => viewTemplate(template.id)}
                    >
                      View
                    </Button>
                    <Button 
                      onClick={() => cloneTemplate(template.id)}
                    >
                      Use This Plan
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
