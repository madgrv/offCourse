'use client';

import React from 'react';
import { createClient } from '@supabase/supabase-js';
import { Button } from '@/app/components/ui/button';
import Select from '@/app/components/ui/select';
import en from '@/shared/language/en';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface DietPlanSelectorProps {
  onPlanSelected: () => void;
  renderButton?: boolean;
}

export default function DietPlanSelector({
  onPlanSelected,
  renderButton = true,
}: DietPlanSelectorProps) {
  const [templates, setTemplates] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [cloning, setCloning] = React.useState(false);
  const [user, setUser] = React.useState<any>(null);
  const [authChecked, setAuthChecked] = React.useState(false);

  React.useEffect(() => {
    async function checkAuth() {
      const { data, error } = await supabase.auth.getSession();

      if (data.session) {
        setUser(data.session.user);
      }
      setAuthChecked(true);
    }
    checkAuth();
  }, []);

  React.useEffect(() => {
    async function fetchTemplates() {
      setLoading(true);
      setError(null);

      const { data: tableInfo, error: tableError } = await supabase
        .from('diet_plans')
        .select('*')
        .limit(1);

      if (tableError) {
      }

      const { data, error } = await supabase
        .from('diet_plans')
        .select('id, name, description')
        .eq('is_template', true);

      if (error) {
        setError(en.failedToFetchTemplates);
      } else {
        setTemplates(data || []);
      }

      setLoading(false);
    }
    fetchTemplates();
  }, []);

  async function handleSelect() {
    if (!selected) return;

    if (!user) {
      setError(en.cloneAuthRequired || 'Authentication required');
      return;
    }

    setCloning(true);
    setError(null);

    try {
      const { data: templateCheck, error: templateCheckError } = await supabase
        .from('diet_plans')
        .select('id, name')
        .eq('id', selected)
        .eq('is_template', true)
        .single();

      if (templateCheckError) {
        console.error('Error checking template:', templateCheckError);
        setError(`Template check failed: ${templateCheckError.message}`);
        setCloning(false);
        return;
      }

      const templateIdToSend = selected.trim();
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        console.error(en.noAccessToken);
        setError(en.cloneAuthRequired || 'Authentication required');
        setCloning(false);
        return;
      }

      const res = await fetch('/api/diet/clone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: 'include', // Include cookies for session-based auth
        body: JSON.stringify({ templateId: templateIdToSend }),
      });

      const result = await res.json();

      if (!result.success) {
        setError(result.error || en.cloneFailed);

        if (result.errors) {
        }
      } else {
        onPlanSelected();
      }
    } catch (err: any) {
      setError(`${en.cloneFailed} ${err.message ? `(${err.message})` : ''}`);
    } finally {
      setCloning(false);
    }
  }

  return (
    <div className='bg-card'>
      {loading ? (
        <p>{en.loading}</p>
      ) : error ? (
        <div>
          <p className='text-red-600 mb-2'>{error}</p>
          {!user && (
            <p className='text-sm text-amber-600'>
              {en.signInRequired}
            </p>
          )}
        </div>
      ) : (
        <>
          <div className='text-xs text-gray-500 mb-2'>
            {en.statusLabel}{' '}
            {loading
              ? en.loading
              : templates.length === 0
              ? en.noTemplatesFound
              : `${templates.length} ${en.templatesAvailable}`}
          </div>
          <Select
            options={templates.map((plan) => ({
              label: plan.name,
              value: plan.id,
            }))}
            placeholder={en.chooseDietPlan}
            value={selected || ''}
            onValueChange={setSelected}
            disabled={loading || templates.length === 0}
            aria-label={en.chooseDietPlan}
            className='mb-4'
          />
          {renderButton && (
            <>
              <Button
                onClick={handleSelect}
                disabled={!selected || cloning || !user}
                className="w-full"
              >
                {cloning ? en.cloning : en.useThisPlan}
              </Button>
              {!user && selected && (
                <p className='text-xs text-amber-600 mt-2'>
                  {en.signInToUseTemplate}
                </p>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
