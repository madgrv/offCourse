'use client';

import React from 'react';
import { createClient } from '@supabase/supabase-js';
import { Button } from '@/app/components/ui/button';
import Select from '@/app/components/ui/select';
import en from '@/shared/language/en';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';

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
  
  // State for the existing plan dialog
  const [showExistingPlanDialog, setShowExistingPlanDialog] = React.useState(false);
  const [existingPlan, setExistingPlan] = React.useState<any>(null);
  const [templateIdToClone, setTemplateIdToClone] = React.useState<string | null>(null);

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
      } else if (result.hasExistingPlan) {
        // User already has a plan, show dialog to confirm overwrite
        setExistingPlan(result.existingPlan);
        setTemplateIdToClone(templateIdToSend);
        setShowExistingPlanDialog(true);
        setCloning(false);
      } else {
        // No existing plan, proceed with redirect
        onPlanSelected();
      }
    } catch (err: any) {
      setError(`${en.cloneFailed} ${err.message ? `(${err.message})` : ''}`);
    } finally {
      setCloning(false);
    }
  }
  
  // Handle keeping the existing plan
  const handleKeepExisting = async () => {
    setShowExistingPlanDialog(false);
    
    if (!existingPlan?.id) {
      console.error('No existing plan ID found');
      setError('Could not find existing plan details');
      return;
    }
    
    try {
      // Set a cookie with the selected plan ID
      document.cookie = `selected_diet_plan_id=${existingPlan.id}; path=/; max-age=31536000`; // 1 year
      
      // Force a complete page reload with the plan ID
      // The replace method prevents back-button issues
      window.location.replace(`/diet-plan?planId=${existingPlan.id}&forceLoad=true`);
    } catch (err: any) {
      console.error('Error selecting plan:', err);
      setError(`Failed to select plan: ${err.message || ''}`);
    }
  };
  
  // Handle resetting to the template
  const handleResetToTemplate = async () => {
    if (!templateIdToClone) return;
    
    setCloning(true);
    setShowExistingPlanDialog(false);
    
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
        body: JSON.stringify({ 
          templateId: templateIdToClone,
          force: true // Force overwrite of existing plan
        }),
      });
      
      const result = await res.json();
      
      if (!result.success) {
        setError(result.error || en.cloneFailed);
      } else {
        onPlanSelected(); // Redirect to diet plan page
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
          
          {/* Dialog for existing plan confirmation */}
          <Dialog open={showExistingPlanDialog} onOpenChange={setShowExistingPlanDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Existing Diet Plan Found</DialogTitle>
                <DialogDescription>
                  You already have a diet plan &ldquo;{existingPlan?.name}&rdquo;. Would you like to keep your existing plan or reset to the template?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex justify-between sm:justify-between">
                <Button 
                  variant="outline" 
                  onClick={handleKeepExisting}
                >
                  Keep & View Existing Plan
                </Button>
                <Button 
                  variant="default"
                  onClick={handleResetToTemplate}
                  className="ml-2"
                >
                  Reset to Template
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
