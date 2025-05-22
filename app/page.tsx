'use client';
import React from 'react';
import ProtectedRoute from './components/auth/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';
import DietPlanSelector from './components/custom/DietPlanSelector';
import {
  DashboardCard,
  PlaceholderContent,
} from './components/custom/DashboardCard';
import { Button } from './components/ui/button';
import en from '@/shared/language/en';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from './context/auth-context';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const [templates, setTemplates] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [cloning, setCloning] = React.useState(false);

  // Fetch available templates on mount
  React.useEffect(() => {
    async function fetchTemplates() {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('diet_plans')
        .select('id, name, description')
        .eq('is_template', true);
      if (error) setError(en.failedToFetchTemplates);
      else setTemplates(data || []);
      setLoading(false);
    }
    fetchTemplates();
  }, []);

  // Handler for selecting and cloning a template
  async function handleSelect() {
    if (!selected) return;
    setCloning(true);
    setError(null);
    try {
      const res = await fetch('/api/diet/clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId: selected }),
      });
      const result = await res.json();
      if (!result.success) {
        setError(result.error || en.cloneFailed);
      } else {
        window.location.href = '/diet-plan';
      }
    } catch (err) {
      setError(en.cloneFailed);
    } finally {
      setCloning(false);
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className='container mx-auto px-4 py-8'>
          <h1 className='text-4xl font-bold mb-6'>{en.home.title}</h1>
          <p className='text-lg mb-8'>{en.trackDietIntro}</p>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            <DashboardCard
              title={en.home.userProfile}
              description={en.home.accountInfo}
              actionHref={!user ? '/auth/login' : undefined}
              actionLabel={!user ? en.home.signIn : undefined}
              secondaryAction={
                user
                  ? { href: '/profile', label: en.home.editProfile }
                  : undefined
              }
            >
              <div className='space-y-2'>
                <div className='text-sm mb-3 flex items-center'>
                  <span
                    className={`inline-block w-2 h-2 rounded-full mr-2 ${
                      user ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  ></span>
                  <span className={user ? 'text-green-700' : 'text-red-700'}>
                    {user ? en.home.signedIn : en.home.notSignedIn}
                  </span>
                </div>

                {user && (
                  <div className='text-sm'>
                    <p className='text-muted-foreground'>
                      {en.home.emailLabel}
                    </p>
                    <p className='font-medium'>{user.email}</p>
                  </div>
                )}
              </div>
            </DashboardCard>

            {/* Diet Plan Selector Card */}
            <DashboardCard
              title={en.selectDietPlan}
              description={en.home.selectTemplateDesc}
              className='md:col-span-2 lg:col-span-1'
              actionHref={user ? '/diet-plan' : undefined}
            >
              <DietPlanSelector
                onPlanSelected={() => {
                  window.location.href = '/diet-plan';
                }}
              />
              {!user && (
                <p className='text-xs text-amber-600 mt-2'>
                  {en.signInToUseTemplate}
                </p>
              )}
            </DashboardCard>

            {/* Calories Analytics Preview Card */}
            <DashboardCard
              title={en.home.calorieTracking}
              description={en.home.calorySummary}
              actionHref='/analytics'
              actionLabel={en.home.viewAnalytics}
            >
              <PlaceholderContent text={en.home.caloriePreview} />
            </DashboardCard>

            {/* Macros Analytics Preview Card */}
            <DashboardCard
              title={en.home.macronutrients}
              description={en.home.macroDesc}
              actionHref='/analytics'
              actionLabel={en.home.viewDetails}
            >
              <PlaceholderContent text={en.home.macroPreview} />
            </DashboardCard>

            {/* Goal Completion Card */}
            <DashboardCard
              title={en.home.goalCompletion}
              description={en.home.goalDesc}
              actionHref='/analytics'
              actionLabel={en.home.viewProgress}
            >
              <PlaceholderContent text={en.home.goalPreview} />
            </DashboardCard>

            {/* Days Left Card */}
            <DashboardCard
              title={en.home.daysLeft}
              description={en.home.daysDesc}
              actionHref='/diet-plan'
              actionLabel={en.home.viewDetails}
            >
              <PlaceholderContent text={en.home.daysPreview} />
            </DashboardCard>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
