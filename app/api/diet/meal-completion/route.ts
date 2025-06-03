import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import en from '../../../../shared/language/en';

// Helper function to get Supabase admin client
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables');
    throw new Error('Missing required environment variables for Supabase client');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

/**
 * Extracts the actual day and week number from a week-prefixed day format
 * @param weekDay Format like 'week1_Monday' or just 'Monday'
 * @returns Object with day and weekNumber
 */
function parseWeekDay(weekDay: string): { day: string; weekNumber: number } {
  // Check if the day has week prefix (e.g., 'week1_Monday')
  const match = weekDay.match(/^week([12])_(.+)$/);
  
  if (match) {
    return {
      weekNumber: parseInt(match[1]),
      day: match[2]
    };
  }
  
  // If no week prefix, default to week 1
  return {
    weekNumber: 1,
    day: weekDay
  };
}

export async function POST(req: NextRequest) {
  try {
    // Initialize Supabase client only when the route is called
    const supabase = getSupabaseAdmin();
    
    const body = await req.json();
    // We now expect weekNumber and dayOfWeek directly instead of parsing from day
    const { userId, dietPlanId, weekNumber, dayOfWeek, mealType, completed } = body;
    
    // For backward compatibility, handle the old format as well
    let actualDay = dayOfWeek;
    let actualWeekNumber = weekNumber;
    
    if (!actualDay && body.day) {
      // If we received the old format with day, parse it
      const parsed = parseWeekDay(body.day);
      actualDay = parsed.day;
      actualWeekNumber = parsed.weekNumber;
    }
    
    if (!userId || !dietPlanId || !actualDay || !mealType || actualWeekNumber === undefined) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 });
    }
    
    // Processing meal completion request
    
    // First, update all food items for this meal in the new schema
    // Using a different approach to avoid TypeScript errors with nested queries
    
    // 1. Find the plan weeks for this diet plan and week number
    const { data: planWeeks, error: planWeeksError } = await supabase
      .from('plan_weeks')
      .select('id')
      .eq('diet_plan_id', dietPlanId)
      .eq('week_number', actualWeekNumber);
      
    if (planWeeksError || !planWeeks || planWeeks.length === 0) {
      console.error('Error finding plan weeks');
      return NextResponse.json({
        success: false,
        error: 'Could not find plan weeks for this diet plan'
      }, { status: 404 });
    }
    
    // 2. Find the diet days for these plan weeks and day of week
    const planWeekIds = planWeeks.map(week => week.id);
    const { data: dietDays, error: dietDaysError } = await supabase
      .from('diet_days')
      .select('id')
      .eq('day_of_week', actualDay)
      .in('plan_week_id', planWeekIds);
      
    if (dietDaysError || !dietDays || dietDays.length === 0) {
      console.error('Error finding diet days');
      return NextResponse.json({
        success: false,
        error: 'Could not find diet days for this week and day'
      }, { status: 404 });
    }
    
    // 3. Find the day meals for these diet days and meal type
    const dietDayIds = dietDays.map(day => day.id);
    const { data: dayMeals, error: dayMealsError } = await supabase
      .from('day_meals')
      .select('id')
      .eq('meal_type', mealType)
      .in('diet_day_id', dietDayIds);
      
    if (dayMealsError || !dayMeals || dayMeals.length === 0) {
      console.error('Error finding day meals');
      return NextResponse.json({
        success: false,
        error: 'Could not find meals for this day and meal type'
      }, { status: 404 });
    }
    
    // 4. Update all meal food items for these day meals
    const dayMealIds = dayMeals.map(meal => meal.id);
    const { error: foodItemsError } = await supabase
      .from('meal_food_items')
      .update({ completed })
      .eq('user_id', userId)
      .in('day_meal_id', dayMealIds);
    
    if (foodItemsError) {
      console.error('Error updating meal food items');
    }
    
    // Now handle the meal completion record
    // First, find all day_meal_ids for this meal
    
    // For each day meal, handle user meal completion
    for (const dayMealId of dayMealIds) {
      const { data: existingMealCompletion } = await supabase
        .from('user_meal_completion')
        .select('*')
        .eq('user_id', userId)
        .eq('day_meal_id', dayMealId)
        .maybeSingle();
  
      if (existingMealCompletion) {
        const { error } = await supabase
          .from('user_meal_completion')
          .update({
            completed,
            completed_at: completed ? new Date().toISOString() : null,
          })
          .eq('user_id', userId)
          .eq('day_meal_id', dayMealId);
  
        if (error) {
          console.error('Error updating meal completion');
          return NextResponse.json(
            {
              success: false,
              error: `Error updating meal completion: ${error.message}`,
            },
            { status: 500 }
          );
        }
      } else {
        const { error } = await supabase
          .from('user_meal_completion')
          .insert({
            user_id: userId,
            day_meal_id: dayMealId,
            completed,
            completed_at: completed ? new Date().toISOString() : null,
          });
  
        if (error) {
          console.error('Error inserting meal completion');
          return NextResponse.json(
            {
              success: false,
              error: `Error creating meal completion: ${error.message}`,
            },
            { status: 500 }
          );
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Meal completion status updated successfully'
    });
    
  } catch (error) {
    console.error('Error in meal completion API');
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}
