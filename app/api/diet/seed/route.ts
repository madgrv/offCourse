import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { twoWeekDietPlanTemplate } from './two-week-template';
import { FoodItem } from '@/app/lib/types';
import { getCurrentWeekAndDay } from '@/app/lib/getCurrentWeekAndDay';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(request: Request) {
  try {
    // Check if the request is from an admin
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication failed.' },
        { status: 401 }
      );
    }

    // For additional security, you might want to check if the user is an admin
    // This would require a custom claim or a role in your user table
    
    // Parse request body for any customization options
    const { ownerId, customPlanName } = await request.json();
    
    // Use the provided owner ID or the authenticated user's ID
    const targetOwnerId = ownerId || user.id;
    
    // Create the diet plan record
    const { data: dietPlan, error: dietPlanError } = await supabase
      .from('diet_plans')
      .insert({
        owner_id: targetOwnerId,
        name: customPlanName || twoWeekDietPlanTemplate.planName,
        description: twoWeekDietPlanTemplate.planDescription,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (dietPlanError) {
      return NextResponse.json(
        { error: `Failed to create diet plan: ${dietPlanError.message}` },
        { status: 500 }
      );
    }

    // Create diet days for the plan
    const dietDays = [];
    const days = [
      'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
    ];

    for (const day of days) {
      const { data: dayData, error: dayError } = await supabase
        .from('diet_days')
        .insert({
          diet_plan_id: dietPlan.id,
          day_of_week: day,
        })
        .select()
        .single();

      if (dayError) {
        return NextResponse.json(
          { error: `Failed to create diet day for ${day}: ${dayError.message}` },
          { status: 500 }
        );
      }

      dietDays.push(dayData);
    }

    // Create meals for each day
    const mealTypes = ['breakfast', 'lunch', 'snack', 'dinner'];
    const meals = [];

    for (const day of dietDays) {
      for (const mealType of mealTypes) {
        const { data: mealData, error: mealError } = await supabase
          .from('diet_meals')
          .insert({
            diet_day_id: day.id,
            meal_type: mealType,
          })
          .select()
          .single();

        if (mealError) {
          return NextResponse.json(
            { error: `Failed to create meal ${mealType} for ${day.day_of_week}: ${mealError.message}` },
            { status: 500 }
          );
        }

        meals.push(mealData);
      }
    }

    // Create food items for each meal in both weeks
    const foodItems = [];
    const foodItemsInserts = [];

    // Process both weeks
    for (let week = 1; week <= 2; week++) {
      for (const day of dietDays) {
        const dayOfWeek = day.day_of_week;
        const weekDayKey = `week${week}_${dayOfWeek}`;
        
        if (!twoWeekDietPlanTemplate.days[weekDayKey]) {
          continue; // Skip if this week/day combination doesn't exist in the template
        }

        for (const mealType of mealTypes) {
          const meal = meals.find(
            (m) => 
              m.diet_day_id === day.id && 
              m.meal_type === mealType
          );

          if (!meal) continue;

          const templateFoodItems = twoWeekDietPlanTemplate.days[weekDayKey]?.meals[mealType] || [];
          
          for (const item of templateFoodItems) {
            foodItemsInserts.push({
              diet_meal_id: meal.id,
              food: item.food,
              calories: item.calories,
              quantity: item.quantity,
              unit: item.unit,
              carbs: item.carbs,
              protein: item.protein,
              fat: item.fat,
              completed: false,
              week: week, // Set the week number for the 2-week plan
            });
          }
        }
      }
    }

    // Insert all food items in batches to improve performance
    if (foodItemsInserts.length > 0) {
      const { data: insertedFoodItems, error: foodItemsError } = await supabase
        .from('diet_food_items')
        .insert(foodItemsInserts)
        .select();

      if (foodItemsError) {
        return NextResponse.json(
          { error: `Failed to create food items: ${foodItemsError.message}` },
          { status: 500 }
        );
      }

      foodItems.push(...(insertedFoodItems || []));
    }

    // Update the diet plan with the start date
    const { error: updateError } = await supabase
      .from('diet_plans')
      .update({
        start_date: twoWeekDietPlanTemplate.startDate,
      })
      .eq('id', dietPlan.id);

    if (updateError) {
      return NextResponse.json(
        { error: `Failed to update diet plan start date: ${updateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully seeded the database with a 2-week Italian diet plan',
      results: {
        dietPlan,
        dietDays: dietDays.length,
        meals: meals.length,
        foodItems: foodItems.length,
      },
    });
  } catch (error) {

    return NextResponse.json(
      { error: 'An unexpected error occurred while seeding the database.' },
      { status: 500 }
    );
  }
}
