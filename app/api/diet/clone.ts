// API route for cloning a template diet plan for the authenticated user.
// This endpoint is designed for clarity, maintainability, and team understanding.
// It ensures that template plans are immutable and only user-owned plans can be edited.
//
// POST /api/diet/clone
// Body: { templateId: string }
// Returns: { success: boolean, dietPlanId?: string, error?: string }

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use environment variables for security
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: NextRequest) {
  try {
    const { templateId } = await req.json();
    if (!templateId) {
      return NextResponse.json({ success: false, error: 'Template ID is required.' }, { status: 400 });
    }

    // Get user session (enforces authentication)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
    }

    // Fetch the template plan (must be is_template=true)
    const { data: template, error: templateError } = await supabase
      .from('diet_plans')
      .select('*')
      .eq('id', templateId)
      .eq('is_template', true)
      .single();
    if (templateError || !template) {
      return NextResponse.json({ success: false, error: 'Template not found.' }, { status: 404 });
    }

    // Clone diet_plans row for the user
    const { data: newPlan, error: newPlanError } = await supabase
      .from('diet_plans')
      .insert({
        name: template.name,
        description: template.description,
        owner_id: user.id,
        is_template: false
      })
      .select()
      .single();
    if (newPlanError || !newPlan) {
      return NextResponse.json({ success: false, error: 'Failed to create user plan.' }, { status: 500 });
    }

    // Clone all related days, meals, and food items
    // Fetch all days for the template
    const { data: templateDays, error: daysError } = await supabase
      .from('diet_days')
      .select('*')
      .eq('diet_plan_id', templateId);
    if (daysError) {
      return NextResponse.json({ success: false, error: 'Failed to fetch template days.' }, { status: 500 });
    }

    // For each day, clone and insert
    for (const day of templateDays) {
      const { data: newDay, error: newDayError } = await supabase
        .from('diet_days')
        .insert({
          diet_plan_id: newPlan.id,
          day_of_week: day.day_of_week
        })
        .select()
        .single();
      if (newDayError || !newDay) continue; // Skip this day on error

      // Fetch meals for this template day
      const { data: templateMeals } = await supabase
        .from('diet_meals')
        .select('*')
        .eq('diet_day_id', day.id);
      if (!templateMeals) continue;

      // For each meal, clone and insert
      for (const meal of templateMeals) {
        const { data: newMeal, error: newMealError } = await supabase
          .from('diet_meals')
          .insert({
            diet_day_id: newDay.id,
            meal_type: meal.meal_type
          })
          .select()
          .single();
        if (newMealError || !newMeal) continue; // Skip this meal on error

        // Fetch food items for this template meal
        const { data: templateFoods } = await supabase
          .from('diet_food_items')
          .select('*')
          .eq('diet_meal_id', meal.id);
        if (!templateFoods) continue;

        // For each food item, clone and insert
        for (const food of templateFoods) {
          await supabase
            .from('diet_food_items')
            .insert({
              diet_meal_id: newMeal.id,
              food: food.food,
              calories: food.calories
            });
        }
      }
    }

    return NextResponse.json({ success: true, dietPlanId: newPlan.id });
  } catch (err) {
    // Log and return error
    console.error('Error cloning diet:', err);
    return NextResponse.json({ success: false, error: 'Server error.' }, { status: 500 });
  }
}
