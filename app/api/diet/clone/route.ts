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
  // Route handler for cloning diet plans

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
        message: 'User already has a diet plan. Set force=true to override.',
      });
    }

    const { data: template, error: templateError } = await dbClient
      .from('diet_plans')
      .select('*')
      .eq('id', templateId)
      .eq('is_template', true)
      .single();

    if (templateError) {
      console.error('Error fetching template');
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
      console.error('Template not found');
      return NextResponse.json(
        { success: false, error: en.cloneTemplateNotFound },
        { status: 404 }
      );
    }

    // Generate a unique name for the new plan to avoid unique constraint violations
    // If force is true and there's an existing plan, we'll use a timestamp suffix
    // Otherwise, we'll use the template name as is
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:.TZ]/g, '')
      .substring(0, 14);
    const uniqueSuffix = hasExistingPlan ? ` (${timestamp})` : '';

    const newPlanData = {
      name: `${template.name}${uniqueSuffix}`,
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

      // Define types for structured cloning
      type MealFoodItem = {
        id: string;
        diet_meal_id: string;
        food_item_id: string;
        quantity: number;
      };
      type DayMeal = {
        id: string;
        diet_day_id: string;
        diet_meal_id: string; // Reference to diet_meals (e.g., Breakfast UUID)
        meal_type: string; // e.g., "Breakfast", "Lunch"
        meal_food_items?: MealFoodItem[]; // Optional for holding cloned items temporarily
      };
      type DietDay = {
        id: string;
        plan_week_id: string;
        day_of_week: string;
        day_meals?: DayMeal[]; // Optional for holding cloned items temporarily
      };
      type PlanWeek = {
        id: string;
        diet_plan_id: string;
        week_number: number;
        diet_days?: DietDay[]; // Optional for holding cloned items temporarily
      };

      // Fetch all components of the template plan
      const { data: templateWeeksData, error: templateWeeksError } = await dbClient
        .from('plan_weeks')
        .select('*, diet_days(*, day_meals(*, meal_food_items!diet_meal_id(*))))')
        .eq('diet_plan_id', templateId)
        .order('week_number', { ascending: true })
        .order('day_of_week', { referencedTable: 'diet_days', ascending: true })
        // Supabase doesn't easily order by meal_type in day_meals or items in meal_food_items here
        // We'll rely on their existing order or handle it if specific order is critical later
        .returns<PlanWeek[]>();

      if (templateWeeksError) {
        console.error('Error fetching template plan structure');
        throw new Error('Failed to fetch template plan structure for cloning.');
      }

      if (!templateWeeksData || templateWeeksData.length === 0) {
        // Template has no weeks, creating empty plan
        // If template has no weeks, newPlan is already created and empty, which is fine.
      } else {
        // Proceed with cloning weeks and their contents
        for (const templateWeek of templateWeeksData) {
          const { data: newWeek, error: newWeekError } = await dbClient
            .from('plan_weeks')
            .insert({ diet_plan_id: newPlan.id, week_number: templateWeek.week_number })
            .select('id, week_number')
            .single();

          if (newWeekError) {
            console.error('Error inserting new week');
            throw new Error(`Failed to insert new week ${templateWeek.week_number}.`);
          }

          if (templateWeek.diet_days) {
            for (const templateDay of templateWeek.diet_days) {
              const { data: newDay, error: newDayError } = await dbClient
                .from('diet_days')
                .insert({ plan_week_id: newWeek.id, day_of_week: templateDay.day_of_week })
                .select('id, day_of_week')
                .single();

              if (newDayError) {
                console.error('Error inserting new day');
                throw new Error(`Failed to insert new day ${templateDay.day_of_week}.`);
              }

              if (templateDay.day_meals) {
                for (const templateMeal of templateDay.day_meals) {
                  // Fetch the name of the meal_type from diet_meals table
                  const { data: dietMealTypeDetails, error: dietMealTypeError } = await dbClient
                    .from('diet_meals') // This is the table like 'Breakfast', 'Lunch' etc.
                    .select('name')
                    .eq('id', templateMeal.diet_meal_id) // templateMeal.diet_meal_id is the FK to diet_meals.id
                    .single();

                  if (dietMealTypeError || !dietMealTypeDetails) {
                    console.error('Error fetching meal type name');
                    throw new Error(`Failed to fetch meal type name for ID ${templateMeal.diet_meal_id}.`);
                  }
                  
                  const { data: newMeal, error: newMealError } = await dbClient
                    .from('day_meals') // This is the junction table being inserted into
                    .insert({
                      diet_day_id: newDay.id,
                      diet_meal_id: templateMeal.diet_meal_id, // FK to diet_meals.id
                      meal_type: dietMealTypeDetails.name, // The actual string like "Breakfast"
                    })
                    .select('id')
                    .single();

                  if (newMealError) {
                    console.error('Error inserting new meal');
                    throw new Error(`Failed to insert new meal ${dietMealTypeDetails.name}.`);
                  }

                  // Enhanced logging for meal_food_items
                  // Processing meal food items

                  if (templateMeal.meal_food_items && templateMeal.meal_food_items.length > 0) {
                    // Cloning food items for meal
                    for (const templateFoodItem of templateMeal.meal_food_items) {
                      const { error: newFoodItemError } = await dbClient
                        .from('meal_food_items')
                        .insert({
                          diet_meal_id: newMeal.id, // This is newMeal.id from the day_meals insert
                          food_item_id: templateFoodItem.food_item_id,
                          quantity: templateFoodItem.quantity,
                        });

                      if (newFoodItemError) {
                        console.error('Error inserting new food item');
                        throw new Error('Failed to insert new food item.');
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
      // All cloning successful
      return NextResponse.json({
        success: true,
        dietPlanId: newPlan.id,
        message: 'Diet plan cloned successfully.',
      });

    } catch (insertError) {
      // This catch block is for errors during the creation of newPlan or cloning of its contents
      console.error('Exception during plan creation or cloning');
      return NextResponse.json(
        {
          success: false,
          error: `${en.cloneCreatePlanFailed} (${insertError instanceof Error ? insertError.message : 'Unknown error during cloning'})`,
          details: insertError instanceof Error ? { message: insertError.message, stack: insertError.stack } : undefined,
        },
        { status: 500 }
      );
    }
    // The main try-catch for request parsing, auth, etc. continues below
  } catch (err) { // This is the outermost catch block

    console.error('Error cloning diet');

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
