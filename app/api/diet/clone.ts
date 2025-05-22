// API route for cloning a template diet plan for the authenticated user.
// This endpoint is designed for clarity, maintainability, and team understanding.
// It ensures that template plans are immutable and only user-owned plans can be edited.
//
// POST /api/diet/clone
// Body: { templateId: string }
// Returns: { success: boolean, dietPlanId?: string, error?: string }

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import en from '../../../shared/language/en';

// Use environment variables for security
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: NextRequest) {
  // This endpoint clones a template diet plan for the authenticated user.
  // It ensures all relevant fields are copied and errors are logged for transparency.
  try {
    // Parse the request body with better error handling
    let templateId;
    try {
      const body = await req.json();
      templateId = body.templateId;

    } catch (parseError) {

      return NextResponse.json({ 
        success: false, 
        error: `${en.cloneInvalidRequest}: Invalid JSON in request body` 
      }, { status: 400 });
    }
    
    if (!templateId) {
      return NextResponse.json({ success: false, error: en.cloneMissingTemplateId }, { status: 400 });
    }

    // Get user session (enforces authentication)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ success: false, error: en.cloneAuthRequired }, { status: 401 });
    }

    // Fetch the template plan (must be is_template=true)
    const { data: template, error: templateError } = await supabase
      .from('diet_plans')
      .select('*')
      .eq('id', templateId)
      .eq('is_template', true)
      .single();
    if (templateError || !template) {
      return NextResponse.json({ success: false, error: en.cloneTemplateNotFound }, { status: 404 });
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
      return NextResponse.json({ success: false, error: en.cloneCreatePlanFailed }, { status: 500 });
    }

    // Error collection for transparency
    const errors: any[] = [];

    // Fetch all days for the template
    const { data: templateDays, error: daysError } = await supabase
      .from('diet_days')
      .select('*')
      .eq('diet_plan_id', templateId);
    if (daysError) {
      return NextResponse.json({ success: false, error: en.cloneFetchDaysFailed }, { status: 500 });
    }

    // For each day, clone and insert all relevant fields
    for (const day of templateDays) {
      const { data: newDay, error: newDayError } = await supabase
        .from('diet_days')
        .insert({
          diet_plan_id: newPlan.id,
          day_of_week: day.day_of_week,
          total_calories: day.total_calories ?? null
        })
        .select()
        .single();
      if (newDayError || !newDay) {
        errors.push({ type: 'day', templateDayId: day.id, error: newDayError });
        console.error('Failed to clone day', day.id, newDayError);
        continue;
      }

      // Fetch meals for this template day
      const { data: templateMeals, error: mealsError } = await supabase
        .from('diet_meals')
        .select('*')
        .eq('diet_day_id', day.id);
      if (mealsError || !templateMeals) {
        errors.push({ type: 'meals', templateDayId: day.id, error: mealsError });
        console.error('Failed to fetch meals for day', day.id, mealsError);
        continue;
      }

      // For each meal, clone and insert all relevant fields
      for (const meal of templateMeals) {
        const { data: newMeal, error: newMealError } = await supabase
          .from('diet_meals')
          .insert({
            diet_day_id: newDay.id,
            meal_type: meal.meal_type
          })
          .select()
          .single();
        if (newMealError || !newMeal) {
          errors.push({ type: 'meal', templateMealId: meal.id, error: newMealError });
          console.error('Failed to clone meal', meal.id, newMealError);
          continue;
        }

        // Fetch food items for this template meal
        const { data: templateFoods, error: foodsError } = await supabase
          .from('diet_food_items')
          .select('*')
          .eq('diet_meal_id', meal.id);
        if (foodsError || !templateFoods) {
          errors.push({ type: 'foods', templateMealId: meal.id, error: foodsError });
          console.error('Failed to fetch foods for meal', meal.id, foodsError);
          continue;
        }

        // For each food item, clone and insert all relevant fields
        for (const food of templateFoods) {
          const { error: foodInsertError } = await supabase
            .from('diet_food_items')
            .insert({
              diet_meal_id: newMeal.id,
              food_name: food.food_name,
              calories: food.calories,
              carbohydrates: food.carbohydrates,
              sugars: food.sugars,
              protein: food.protein,
              fat: food.fat
            });
          if (foodInsertError) {
            errors.push({ type: 'food', templateFoodId: food.id, error: foodInsertError });
            console.error('Failed to clone food item', food.id, foodInsertError);
          }
        }
      }
    }

    // Return success, but include errors if any occurred
    if (errors.length > 0) {
      return NextResponse.json({ success: true, dietPlanId: newPlan.id, partial: true, errors, message: en.clonePartialSuccess }, { status: 207 });
    }
    return NextResponse.json({ success: true, dietPlanId: newPlan.id });
  } catch (err) {
    // Log and return error with detailed information for debugging
    console.error('Error cloning diet:', err);
    
    // Provide more detailed error information in development
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? `${en.cloneServerError} ${err instanceof Error ? err.message : 'Unknown error'}` 
      : en.cloneServerError;
    
    return NextResponse.json({ 
      success: false, 
      error: errorMessage,
      // Include stack trace in development for debugging
      ...(process.env.NODE_ENV === 'development' && { stack: err instanceof Error ? err.stack : undefined })
    }, { status: 500 });
  }
}

