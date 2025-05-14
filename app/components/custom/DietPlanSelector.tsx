'use client';
// DietPlanSelector.tsx
// UI component for selecting a diet plan (template) and triggering the clone action.
// Designed for clarity, localisation, and easy integration in the home page.

import React from 'react';
import { createClient } from '@supabase/supabase-js';
import en from '@/shared/language/en';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function DietPlanSelector({ onPlanSelected }: { onPlanSelected: () => void }) {
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
        onPlanSelected();
      }
    } catch (err) {
      setError(en.cloneFailed);
    } finally {
      setCloning(false);
    }
  }

  return (
    <div className="bg-card p-6 rounded-lg shadow-md mt-8">
      <h2 className="text-2xl font-semibold mb-4">{en.selectDietPlan}</h2>
      {loading ? (
        <p>{en.loading}</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : (
        <>
          <select
            className="border rounded px-3 py-2 mb-4 w-full"
            value={selected || ''}
            onChange={e => setSelected(e.target.value)}
            aria-label={en.chooseDietPlan}
          >
            <option value="">{en.chooseDietPlan}</option>
            {templates.map(plan => (
              <option key={plan.id} value={plan.id}>
                {plan.name}
              </option>
            ))}
          </select>
          <button
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            onClick={handleSelect}
            disabled={!selected || cloning}
          >
            {cloning ? en.cloning : en.useThisPlan}
          </button>
        </>
      )}
    </div>
  );
}
