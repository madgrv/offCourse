'use client';

import React from 'react';
import { Button } from '@/app/components/ui/button';
import { stripPlanNameTimestamp } from '@/app/lib/utils';
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
import { supabase } from '@/app/lib/supabaseClient';

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
  const [showExistingPlanDialog, setShowExistingPlanDialog] =
    React.useState(false);
  const [existingPlan, setExistingPlan] = React.useState<any>(null);
  const [templateIdToClone, setTemplateIdToClone] = React.useState<
    string | null
  >(null);

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

      try {
        // First, check if the table exists and has the expected structure
        const { data: tableInfo, error: tableError } = await supabase
          .from('diet_plans')
          .select('*')
          .limit(1);

        if (tableError) {
        }

        // If no templates exist, create a default template for testing
        const { data: existingTemplates, error: checkError } = await supabase
          .from('diet_plans')
          .select('count')
          .eq('is_template', true);

        if (
          !checkError &&
          (!existingTemplates ||
            existingTemplates.length === 0 ||
            existingTemplates[0].count === 0)
        ) {
          // Create a default template for testing
          const { error: createError } = await supabase
            .from('diet_plans')
            .insert({
              name: 'Balanced Diet Plan',
              description:
                'A nutritionally balanced diet plan with proper macronutrient distribution',
              is_template: true,
            });

          if (createError) {
            setError('Error creating default template');
          }
        }

        // Now fetch all templates
        const { data, error } = await supabase
          .from('diet_plans')
          .select('id, name, description')
          .eq('is_template', true);

        if (error) {
          setError('Error fetching templates');
        } else {
          // Filter out duplicate templates by name
          const uniqueTemplates = data
            ? Array.from(
                new Map(data.map((item) => [item.name, item])).values()
              )
            : [];
          setTemplates(uniqueTemplates);
        }
      } catch (err) {
        setError(
          `Failed to fetch templates: ${
            err instanceof Error ? err.message : 'Unknown error'
          }`
        );
      } finally {
        setLoading(false);
      }
    }
    fetchTemplates();
  }, []);

  async function handleSelect() {
    if (!selected) {
      setError('Please select a template diet plan');
      return;
    }

    if (!user) {
      setError('Authentication required');
      return;
    }

    setCloning(true);
    setError(null);

    try {
      // Validate the template exists and is actually a template
      const { data: templateCheck, error: templateCheckError } = await supabase
        .from('diet_plans')
        .select('id, name')
        .eq('id', selected)
        .eq('is_template', true)
        .single();

      if (templateCheckError) {
        setError(`Template check failed: ${templateCheckError.message}`);
        setCloning(false);
        return;
      }

      if (!templateCheck) {
        setError('Selected plan is not a valid template');
        setCloning(false);
        return;
      }

      const templateIdToSend = selected.trim();

      // Get the user's session for authentication
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        setError('Authentication required');
        setCloning(false);
        return;
      }

      try {
        const res = await fetch('/api/diet/clone', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          credentials: 'include', // Include cookies for session-based auth
          body: JSON.stringify({ templateId: templateIdToSend }),
        });

        // Create a clone of the response for error handling
        const resClone = res.clone();

        if (!res.ok) {
          // Handle HTTP errors
          try {
            const errorData = await resClone.json();

            // Check for specific database constraint errors
            if (errorData.details?.code === '23505') {
              setError(
                en.duplicatePlanName || 'A plan with this name already exists.'
              );
              return;
            }
            throw new Error(
              `Server error: ${errorData.error || res.statusText}`
            );
          } catch (parseError) {
            // If JSON parsing fails, just use the status code
            throw new Error(`Server error: ${res.status} ${res.statusText}`);
          }
        }
        const result: any = await res.json();

        if (!result.success) {
          setError(result.error || 'Failed to clone template');
        } else if (result.hasExistingPlan) {
          setExistingPlan(result.existingPlan);
          setTemplateIdToClone(templateIdToSend);
          setShowExistingPlanDialog(true);
        } else {
          // Set the cookie with the new plan ID
          if (result.dietPlanId) {
            document.cookie = `selected_diet_plan_id=${result.dietPlanId}; path=/; max-age=31536000`; // 1 year

            // Clear any existing refresh attempt flags from sessionStorage to ensure a fresh load
            // This is a safer approach than using clearCache=true which causes excessive requests
            Object.keys(sessionStorage).forEach((key) => {
              if (key.startsWith('refresh_attempt_')) {
                sessionStorage.removeItem(key);
              }
            });

            // Redirect to the diet plan page with just the plan ID
            window.location.replace(`/diet-plan?planId=${result.dietPlanId}`);
          } else {
            // Fallback to the original behavior if no plan ID is returned
            onPlanSelected();
          }
        }
      } catch (apiError) {
        setError(
          `API error: ${
            apiError instanceof Error ? apiError.message : 'Unknown error'
          }`
        );
      }
    } catch (err: any) {
      setError(
        `Failed to clone template ${err.message ? `(${err.message})` : ''}`
      );
    } finally {
      setCloning(false);
    }
  }

  // Handle keeping the existing plan
  const handleKeepExisting = async () => {
    setShowExistingPlanDialog(false);

    if (!existingPlan?.id) {
      setError('No existing plan ID found');
      return;
    }

    try {
      // Set a cookie with the selected plan ID
      document.cookie = `selected_diet_plan_id=${existingPlan.id}; path=/; max-age=31536000`; // 1 year

      // Navigate to the diet plan page without forceLoad parameter
      // This will use the cookie value and avoid triggering excessive refreshes

      window.location.replace(`/diet-plan?planId=${existingPlan.id}`);
    } catch (err: any) {
      setError(`Failed to select plan: ${err.message || ''}`);
    }
  };

  // Handle resetting to the template
  const handleResetToTemplate = async () => {
    if (!templateIdToClone) {
      setError('Template information is missing');
      return;
    }

    setCloning(true);
    setShowExistingPlanDialog(false);
    setError(null); // Clear any previous errors

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        setError('Authentication required');
        return;
      }

      try {
        const res = await fetch('/api/diet/clone', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          credentials: 'include',
          body: JSON.stringify({
            templateId: templateIdToClone,
            force: true, // Force overwrite of existing plan
          }),
        });

        // Create a clone of the response for error handling
        const resClone = res.clone();

        if (!res.ok) {
          // Handle HTTP errors
          try {
            const errorData = await resClone.json();

            // Check for specific database constraint errors
            if (errorData.details?.code === '23505') {
              throw new Error(
                'A diet plan with this name already exists. The system will automatically add a unique identifier to prevent this error.'
              );
            } else {
              throw new Error(
                `Server error: ${errorData.error || res.statusText}`
              );
            }
          } catch (parseError) {
            // If JSON parsing fails, just use the status code
            throw new Error(`Server error: ${res.status} ${res.statusText}`);
          }
        }

        const result = await res.json();

        if (!result.success) {
          setError(result.error || 'Failed to reset to template');
        } else {
          // Set the cookie with the new plan ID
          if (result.dietPlanId) {
            document.cookie = `selected_diet_plan_id=${result.dietPlanId}; path=/; max-age=31536000`; // 1 year

            // Clear any existing refresh attempt flags from sessionStorage to ensure a fresh load
            // This is a safer approach than using clearCache=true which causes excessive requests
            Object.keys(sessionStorage).forEach((key) => {
              if (key.startsWith('refresh_attempt_')) {
                sessionStorage.removeItem(key);
              }
            });

            // Redirect to the diet plan page with just the plan ID
            window.location.replace(`/diet-plan?planId=${result.dietPlanId}`);
          } else {
            // Fallback to the original behavior if no plan ID is returned
            onPlanSelected();
          }
        }
      } catch (apiError) {
        setError(
          `API error: ${
            apiError instanceof Error ? apiError.message : 'Unknown error'
          }`
        );
      }
    } catch (err: any) {
      setError(
        `Failed to reset to template ${err.message ? `(${err.message})` : ''}`
      );
    } finally {
      setCloning(false);
    }
  };

  return (
    <div className='bg-card'>
      {loading ? (
        <div className='space-y-2'>
          <div className='h-4 w-24 bg-muted animate-pulse rounded'></div>
          <div className='h-10 bg-muted animate-pulse rounded-md'></div>
          <div className='h-10 w-full bg-muted animate-pulse rounded-md mt-4'></div>
        </div>
      ) : error ? (
        <div>
          <p className='text-red-600 mb-2'>{error}</p>
          {!user && <p className='text-sm text-amber-600'>Sign in required</p>}
        </div>
      ) : (
        <>
          <div className='text-xs text-gray-500 mb-2'>
            Status{' '}
            {loading
              ? 'Loading'
              : templates.length === 0
              ? 'No templates found'
              : `${templates.length} templates available`}
          </div>
          <Select
            options={templates.map((plan) => ({
              label: stripPlanNameTimestamp(plan.name),
              value: plan.id,
            }))}
            placeholder={'Choose a diet plan'}
            value={selected || ''}
            onValueChange={setSelected}
            disabled={loading || templates.length === 0}
            aria-label={'Choose a diet plan'}
            className='mb-4'
          />
          {renderButton && (
            <>
              <Button
                onClick={handleSelect}
                disabled={!selected || cloning || !user}
                className='w-full'
              >
                {cloning ? (
                  <>
                    <span className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent'></span>
                    Cloning...
                  </>
                ) : (
                  'Use this plan'
                )}
              </Button>
              {!user && selected && (
                <p className='text-xs text-amber-600 mt-2'>
                  Sign in to use template
                </p>
              )}
            </>
          )}

          {/* Dialog for existing plan confirmation */}
          <Dialog
            open={showExistingPlanDialog}
            onOpenChange={setShowExistingPlanDialog}
          >
            <DialogContent className='max-w-md'>
              <DialogHeader>
                <DialogTitle className='text-xl font-semibold'>
                  Existing Diet Plan Found
                </DialogTitle>
                <DialogDescription className='mt-2'>
                  <div className='mb-2'>You already have a diet plan:</div>
                  <div className='bg-muted p-3 rounded-md mb-3'>
                    <div className='font-medium text-primary'>
                      {existingPlan?.name ? stripPlanNameTimestamp(existingPlan.name) : ''}
                    </div>
                    {existingPlan?.description && (
                      <div className='text-sm text-muted-foreground mt-1'>
                        {existingPlan.description}
                      </div>
                    )}
                  </div>
                  <div>
                    Would you like to keep using your existing plan or reset to
                    the selected template?
                  </div>
                </DialogDescription>
              </DialogHeader>

              <div className='my-4 space-y-4'>
                <div className='rounded-lg border p-3'>
                  <h4 className='font-medium mb-1'>Keep Existing Plan</h4>
                  <p className='text-sm text-muted-foreground'>
                    Continue with your current diet plan and all your existing
                    progress.
                  </p>
                </div>

                <div className='rounded-lg border p-3 border-primary/50 bg-primary/5'>
                  <h4 className='font-medium mb-1'>Reset to Template</h4>
                  <p className='text-sm text-muted-foreground'>
                    Replace your current plan with the selected template.{' '}
                    <span className='text-destructive font-medium'>
                      This will delete your existing plan data.
                    </span>
                  </p>
                </div>
              </div>

              <DialogFooter className='flex flex-col-reverse sm:flex-row justify-between gap-2 sm:gap-3'>
                <Button
                  variant='outline'
                  onClick={handleKeepExisting}
                  className='w-full sm:w-auto'
                  disabled={cloning}
                >
                  Keep & View Existing Plan
                </Button>
                <Button
                  variant='default'
                  onClick={handleResetToTemplate}
                  className='w-full sm:w-auto'
                  disabled={cloning}
                >
                  {cloning ? (
                    <>
                      <span className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent'></span>
                      Resetting...
                    </>
                  ) : (
                    'Reset to Template'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
