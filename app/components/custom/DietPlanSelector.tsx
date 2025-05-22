'use client';
// DietPlanSelector.tsx
// UI component for selecting a diet plan (template) and triggering the clone action.
// Designed for clarity, localisation, and easy integration in the home page.

import React from 'react';
import { createClient } from '@supabase/supabase-js';
import { Button } from '@/app/components/ui/button';
import Select from '@/app/components/ui/select';
import en from '@/shared/language/en';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Debug Supabase connection


interface DietPlanSelectorProps {
  onPlanSelected: () => void;
}

export default function DietPlanSelector({
  onPlanSelected,
}: DietPlanSelectorProps) {
  const [templates, setTemplates] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [cloning, setCloning] = React.useState(false);
  const [user, setUser] = React.useState<any>(null);
  const [authChecked, setAuthChecked] = React.useState(false);

  // Check authentication status on mount
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

  // Fetch available templates on mount
  React.useEffect(() => {
    async function fetchTemplates() {
      
      setLoading(true);
      setError(null);

      // First check if the diet_plans table has the is_template field
      const { data: tableInfo, error: tableError } = await supabase
        .from('diet_plans')
        .select('*')
        .limit(1);

      
      if (tableError) {
        
      }

      // Now fetch templates
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

  // Handler for selecting and cloning a template
  async function handleSelect() {
    if (!selected) return;
    
    // Check if user is authenticated
    if (!user) {
      console.error('Authentication required to clone template');
      setError(en.cloneAuthRequired || 'Authentication required');
      return;
    }
    
    setCloning(true);
    setError(null);
    
    
    
    try {
      // First, check if the template exists
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
      
      // Now attempt to clone it
      // Ensure the template ID is properly formatted
      const templateIdToSend = selected.trim();

      
      // Get the current session and access token
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      
      if (!accessToken) {
        console.error('No access token available, user may not be authenticated');
        setError(en.cloneAuthRequired || 'Authentication required');
        setCloning(false);
        return;
      }
      

      
      const res = await fetch('/api/diet/clone', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        credentials: 'include', // Include cookies for session-based auth
        body: JSON.stringify({ templateId: templateIdToSend })
      });
      
      // Log the raw response

      
      // Parse the JSON response
      const result = await res.json();

      
      if (!result.success) {
        
        setError(result.error || en.cloneFailed);
        
        // If there are detailed errors, log them
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
    <div className="bg-card p-6 rounded-lg shadow-md mt-8">
      <h2 className="text-2xl font-semibold mb-4">{en.selectDietPlan}</h2>
      
      {/* Authentication status indicator */}
      {authChecked && (
        <div className="text-xs mb-3 flex items-center">
          <span className={`inline-block w-2 h-2 rounded-full mr-2 ${user ? 'bg-green-500' : 'bg-red-500'}`}></span>
          <span className={user ? 'text-green-700' : 'text-red-700'}>
            {user ? 'Signed in' : 'Not signed in (required to use templates)'}
          </span>
        </div>
      )}
      
      {loading ? (
        <p>{en.loading}</p>
      ) : error ? (
        <div>
          <p className="text-red-600 mb-2">{error}</p>
          {!user && (
            <p className="text-sm text-amber-600">You need to be signed in to clone a diet plan.</p>
          )}
        </div>
      ) : (
        <>
          <Select
            options={templates.map(plan => ({ label: plan.name, value: plan.id }))}
            placeholder={en.chooseDietPlan}
            value={selected || ''}
            onValueChange={setSelected}
            disabled={loading || templates.length === 0}
            aria-label={en.chooseDietPlan}
            className="mb-4"
          />
          {/* Debug info */}
          <div className="text-xs text-gray-500 mb-2">
            Status: {loading ? 'Loading...' : templates.length === 0 ? 'No templates found' : `${templates.length} templates available`}
          </div>
          <Button
            onClick={handleSelect}
            disabled={!selected || cloning || !user}
          >
            {cloning ? en.cloning : en.useThisPlan}
          </Button>
          {!user && selected && (
            <p className="text-xs text-amber-600 mt-2">Please sign in to use this template</p>
          )}
        </>
      )}
    </div>
  );
}
