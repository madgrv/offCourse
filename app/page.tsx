'use client';
import React from 'react';
import Link from 'next/link';
import ProtectedRoute from './components/auth/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';
import DietPlanSelector from './components/custom/DietPlanSelector';
import en from '@/shared/language/en';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function Home() {
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
        body: JSON.stringify({ templateId: selected })
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
          <h1 className='text-4xl font-bold mb-6'>Teo&apos;s Diet App</h1>
          <p className='text-lg mb-8'>
            {en.trackDietIntro}
          </p>

          {/* Diet Plan Selector UI for choosing a template - now using shadcn-styled component */}
          <div className="bg-card p-6 rounded-lg shadow-md mt-8">
            <h2 className="text-2xl font-semibold mb-4">{en.selectDietPlan}</h2>
            <DietPlanSelector onPlanSelected={() => { window.location.href = '/diet-plan'; }} />
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className='bg-card p-6 rounded-lg shadow-md'>
              <h2 className='text-2xl font-semibold mb-4'>Weekly Diet Plan</h2>
              <p className='mb-4'>View and manage your weekly meal schedule.</p>
              <Link
                href='/diet-plan'
                className='inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90'
              >
                View Diet Plan
              </Link>
            </div>
            <div className='bg-card p-6 rounded-lg shadow-md'>
              <h2 className='text-2xl font-semibold mb-4'>
                Nutrition Analytics
              </h2>
              <p className='mb-4'>
                Track your calorie intake and nutritional balance.
              </p>
              <Link
                href='/analytics'
                className='inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90'
              >
                View Analytics
              </Link>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
