// API route for cloning a template diet plan for the authenticated user.
// This endpoint is designed for clarity, maintainability, and team understanding.
// It ensures that template plans are immutable and only user-owned plans can be edited.
//
// POST /api/diet/clone
// Body: { templateId: string }
// Returns: { success: boolean, dietPlanId?: string, error?: string }

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import en from '../../../../shared/language/en';

// Use environment variables for security
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

// For server-side operations like API routes, we need to use the service role key
// to bypass RLS policies when performing admin operations
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create two clients: one with anon key for auth checks, one with service role for DB operations
const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

// Only create the admin client if the service role key is available
const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

// Log whether we have admin access


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

    // Get user session from the request headers
    const authHeader = req.headers.get('Authorization');
    let user;
    
    // If no auth header is provided, try to get the session cookie
    if (!authHeader) {
      console.log('No Authorization header found, checking for session');
      const { data: { user: sessionUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !sessionUser) {
        console.log('No session found, authentication required');
        return NextResponse.json({ success: false, error: en.cloneAuthRequired }, { status: 401 });
      }
      
      user = sessionUser;
    } else {
      // Extract the token from the Authorization header
      const token = authHeader.replace('Bearer ', '');
      console.log('Authorization header found, verifying token');
      
      try {
        const { data: { user: tokenUser }, error: tokenError } = await supabase.auth.getUser(token);
        
        if (tokenError || !tokenUser) {
          console.log('Invalid token:', tokenError);
          return NextResponse.json({ success: false, error: en.cloneAuthRequired }, { status: 401 });
        }
        
        user = tokenUser;
      } catch (authError) {
        console.error('Error verifying token:', authError);
        return NextResponse.json({ success: false, error: en.cloneAuthRequired }, { status: 401 });
      }
    }
    
    console.log('User authenticated:', user.id);

    // Fetch the template plan (must be is_template=true)
    // Use admin client if available, otherwise fall back to regular client
    const dbClient = supabaseAdmin || supabase;
    console.log('Using admin client for DB operations:', !!supabaseAdmin);
    
    const { data: template, error: templateError } = await dbClient
      .from('diet_plans')
      .select('*')
      .eq('id', templateId)
      .eq('is_template', true)
      .single();
    
    if (templateError) {
      console.error('Error fetching template:', templateError);
      return NextResponse.json({ 
        success: false, 
        error: `${en.cloneTemplateNotFound} (${templateError.message})`,
        details: templateError
      }, { status: 404 });
    }
    
    if (!template) {
      console.error('Template not found with ID:', templateId);
      return NextResponse.json({ success: false, error: en.cloneTemplateNotFound }, { status: 404 });
    }
    
    // Log the template structure to understand available fields
    console.log('Template structure:', JSON.stringify(template, null, 2));
    console.log('Template keys:', Object.keys(template));

    // Clone diet_plans row for the user
    // Check the actual schema to ensure we're including all required fields
    console.log('Fetching template details:', template);
    
    // Define the new plan data based on the TypeScript types
    const newPlanData = {
      name: template.name,
      description: template.description,
      // Set is_template to false for the user's copy
      is_template: false,
      // Include created_at with current timestamp
      created_at: new Date().toISOString(),
      // Set the owner_id to the current user
      owner_id: user.id
    };
    
    console.log('Attempting to create new plan with:', newPlanData);
    
    // Define newPlan outside the try block so it's accessible throughout the function
    let newPlan: any = null;
    
    try {
      const { data: planData, error: newPlanError } = await dbClient
        .from('diet_plans')
        .insert(newPlanData)
        .select()
        .single();
      
      if (newPlanError) {
        
        return NextResponse.json({ 
          success: false, 
          error: `${en.cloneCreatePlanFailed} (${newPlanError.message})`,
          details: newPlanError
        }, { status: 500 });
      }
      
      if (!planData) {
        
        return NextResponse.json({ 
          success: false, 
          error: `${en.cloneCreatePlanFailed} (No plan returned)` 
        }, { status: 500 });
      }
      
      // Assign to the outer variable so it's accessible outside the try block
      newPlan = planData;
      console.log('Successfully created new plan:', newPlan.id);
    } catch (insertError) {
      console.error('Exception during plan creation:', insertError);
      return NextResponse.json({ 
        success: false, 
        error: `${en.cloneCreatePlanFailed} (${insertError instanceof Error ? insertError.message : 'Unknown error'})`,
        details: insertError instanceof Error ? insertError.stack : undefined
      }, { status: 500 });
    }

    // Error collection for transparency
    const errors: any[] = [];

    // Fetch all days for the template
    const { data: templateDays, error: daysError } = await dbClient
      .from('diet_days')
      .select('*')
      .eq('diet_plan_id', templateId);
    if (daysError) {
      return NextResponse.json({ success: false, error: en.cloneFetchDaysFailed }, { status: 500 });
    }

    // For each day, clone and insert all relevant fields
    for (const day of templateDays) {
      const { data: newDay, error: newDayError } = await dbClient
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
      const { data: templateMeals, error: mealsError } = await dbClient
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
        const { data: newMeal, error: newMealError } = await dbClient
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
        const { data: templateFoods, error: foodsError } = await dbClient
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
          const { error: foodInsertError } = await dbClient
            .from('diet_food_items')
            .insert({
              diet_meal_id: newMeal.id,
              food_name: food.food_name,
              calories: food.calories,
              carbohydrates: food.carbohydrates,
              sugars: food.sugars,
              protein: food.protein,
              fat: food.fat,
              quantity: food.quantity || 1,
              unit: food.unit || 'g',
              completed: food.completed || false
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

