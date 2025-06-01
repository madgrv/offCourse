// API route for cloning a template diet plan for the authenticated user.
// This endpoint ensures that template plans are immutable and only user-owned plans can be edited.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import en from '../../../../shared/language/en';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(
  supabaseUrl,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Admin client needed to bypass RLS policies
const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

export async function POST(req: NextRequest) {
  try {
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      return NextResponse.json(
        {
          success: false,
          error: `${en.cloneInvalidRequest}: Invalid JSON in request body`,
        },
        { status: 400 }
      );
    }
    
    const { templateId, force = false } = requestBody;

    if (!templateId) {
      return NextResponse.json(
        { success: false, error: en.cloneMissingTemplateId },
        { status: 400 }
      );
    }

    const authHeader = req.headers.get('Authorization');
    let user;

    if (!authHeader) {
      const {
        data: { user: sessionUser },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !sessionUser) {
        return NextResponse.json(
          { success: false, error: en.cloneAuthRequired },
          { status: 401 }
        );
      }

      user = sessionUser;
    } else {
      const token = authHeader.replace('Bearer ', '');

      try {
        const {
          data: { user: tokenUser },
          error: tokenError,
        } = await supabase.auth.getUser(token);

        if (tokenError || !tokenUser) {
          return NextResponse.json(
            { success: false, error: en.cloneAuthRequired },
            { status: 401 }
          );
        }

        user = tokenUser;
      } catch (authError) {
        return NextResponse.json(
          { success: false, error: en.cloneAuthRequired },
          { status: 401 }
        );
      }
    }

    // Using admin client to bypass RLS if available
    const dbClient = supabaseAdmin || supabase;
    
    // Check if user already has a diet plan
    const { data: existingPlans, error: existingPlanError } = await dbClient
      .from('diet_plans')
      .select('id, name, description')
      .eq('owner_id', user.id)
      .eq('is_template', false)
      .order('created_at', { ascending: false });
      
    const hasExistingPlan = existingPlans && existingPlans.length > 0;
    const existingPlanId = hasExistingPlan ? existingPlans[0].id : null;
    
    // We already have the force flag from the request body
    
    // If user has a plan and force is false, return info about existing plan
    if (hasExistingPlan && !force) {
      return NextResponse.json({
        success: true,
        hasExistingPlan: true,
        existingPlan: existingPlans[0],
        message: 'User already has a diet plan. Set force=true to override.'
      });
    }

    const { data: template, error: templateError } = await dbClient
      .from('diet_plans')
      .select('*')
      .eq('id', templateId)
      .eq('is_template', true)
      .single();

    if (templateError) {
      console.error('Error fetching template:', templateError);
      return NextResponse.json(
        {
          success: false,
          error: `${en.cloneTemplateNotFound} (${templateError.message})`,
          details: templateError,
        },
        { status: 404 }
      );
    }

    if (!template) {
      console.error('Template not found with ID:', templateId);
      return NextResponse.json(
        { success: false, error: en.cloneTemplateNotFound },
        { status: 404 }
      );
    }

    const newPlanData = {
      name: template.name,
      description: template.description,

      is_template: false,

      created_at: new Date().toISOString(),

      owner_id: user.id,
    };

    let newPlan: any = null;

    try {
      const { data: planData, error: newPlanError } = await dbClient
        .from('diet_plans')
        .insert(newPlanData)
        .select()
        .single();

      if (newPlanError) {
        return NextResponse.json(
          {
            success: false,
            error: `${en.cloneCreatePlanFailed} (${newPlanError.message})`,
            details: newPlanError,
          },
          { status: 500 }
        );
      }

      if (!planData) {
        return NextResponse.json(
          {
            success: false,
            error: `${en.cloneCreatePlanFailed} (No plan returned)`,
          },
          { status: 500 }
        );
      }

      newPlan = planData;
    } catch (insertError) {
      console.error('Exception during plan creation:', insertError);
      return NextResponse.json(
        {
          success: false,
          error: `${en.cloneCreatePlanFailed} (${
            insertError instanceof Error ? insertError.message : 'Unknown error'
          })`,
          details: insertError instanceof Error ? insertError.stack : undefined,
        },
        { status: 500 }
      );
    }

    // Collect errors but continue processing for partial success
    const errors: any[] = [];

    const { data: templateDays, error: daysError } = await dbClient
      .from('diet_days')
      .select('*')
      .eq('diet_plan_id', templateId);
    if (daysError) {
      return NextResponse.json(
        { success: false, error: en.cloneFetchDaysFailed },
        { status: 500 }
      );
    }

    for (const day of templateDays) {
      const { data: newDay, error: newDayError } = await dbClient
        .from('diet_days')
        .insert({
          diet_plan_id: newPlan.id,
          day_of_week: day.day_of_week,
          total_calories: day.total_calories ?? null,
        })
        .select()
        .single();
      if (newDayError || !newDay) {
        errors.push({ type: 'day', templateDayId: day.id, error: newDayError });
        console.error('Failed to clone day', day.id, newDayError);
        continue;
      }

      const { data: templateMeals, error: mealsError } = await dbClient
        .from('diet_meals')
        .select('*')
        .eq('diet_day_id', day.id);
      if (mealsError || !templateMeals) {
        errors.push({
          type: 'meals',
          templateDayId: day.id,
          error: mealsError,
        });
        console.error('Failed to fetch meals for day', day.id, mealsError);
        continue;
      }

      for (const meal of templateMeals) {
        const { data: newMeal, error: newMealError } = await dbClient
          .from('diet_meals')
          .insert({
            diet_day_id: newDay.id,
            meal_type: meal.meal_type,
          })
          .select()
          .single();
        if (newMealError || !newMeal) {
          errors.push({
            type: 'meal',
            templateMealId: meal.id,
            error: newMealError,
          });
          console.error('Failed to clone meal', meal.id, newMealError);
          continue;
        }

        const { data: templateFoods, error: foodsError } = await dbClient
          .from('diet_food_items')
          .select('*')
          .eq('diet_meal_id', meal.id);
        if (foodsError || !templateFoods) {
          errors.push({
            type: 'foods',
            templateMealId: meal.id,
            error: foodsError,
          });
          console.error('Failed to fetch foods for meal', meal.id, foodsError);
          continue;
        }

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
              completed: food.completed || false,
            });
          if (foodInsertError) {
            errors.push({
              type: 'food',
              templateFoodId: food.id,
              error: foodInsertError,
            });
            console.error(
              'Failed to clone food item',
              food.id,
              foodInsertError
            );
          }
        }
      }
    }

    if (errors.length > 0) {
      return NextResponse.json(
        {
          success: true,
          dietPlanId: newPlan.id,
          partial: true,
          errors,
          message: en.clonePartialSuccess,
        },
        { status: 207 }
      );
    }
    return NextResponse.json({ success: true, dietPlanId: newPlan.id });
  } catch (err) {
    console.error('Error cloning diet:', err);

    // More detailed error information in development environment
    const errorMessage =
      process.env.NODE_ENV === 'development'
        ? `${en.cloneServerError} ${
            err instanceof Error ? err.message : 'Unknown error'
          }`
        : en.cloneServerError;

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,

        ...(process.env.NODE_ENV === 'development' && {
          stack: err instanceof Error ? err.stack : undefined,
        }),
      },
      { status: 500 }
    );
  }
}
