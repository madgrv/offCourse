import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import en from '@/shared/language/en';
import { FoodItem } from '../lib/types';
import { mutate } from 'swr';
import { DIET_PLAN_CACHE_KEY } from '../hooks/useDietPlanData';

const supabase = createClientComponentClient();


export async function saveMealFoodItems({
  dietPlanId,
  userId,
  day,
  mealType,
  foodItems,
}: {
  dietPlanId: string;
  userId: string;
  day: string; // Now accepts week-prefixed format like 'week1_Monday'
  mealType: string;
  foodItems: FoodItem[];
}) {
  // Extract actual day and week from week-prefixed format if needed
  const actualDay = day.includes('_') ? day.split('_')[1] : day;
  const weekNumber = day.startsWith('week2_') ? 2 : 1;
  for (const foodItem of foodItems) {
    if (foodItem.id) {

      const { error } = await supabase
        .from('diet_food_items')
        .update({
          food_name: foodItem.food,
          calories: foodItem.calories,
          quantity: foodItem.quantity,
          unit: foodItem.unit,
          carbohydrates: foodItem.carbs,
          sugars: foodItem.sugars,
          protein: foodItem.protein,
          fat: foodItem.fat,
          completed: foodItem.completed || false,
        })
        .eq('id', foodItem.id);
      if (error) {
        throw new Error(en.dietPlan.errorUpdatingFoodItem);
      }
    } else {

      const { error } = await supabase.from('diet_food_items').insert({
        diet_plan_id: dietPlanId,
        user_id: userId,
        day: actualDay,
        week: weekNumber,
        meal_type: mealType,
        food_name: foodItem.food,
        calories: foodItem.calories,
        quantity: foodItem.quantity,
        unit: foodItem.unit,
        completed: foodItem.completed || false,
      });
      if (error) {
        throw new Error(en.dietPlan.errorInsertingFoodItem);
      }
    }
  }
  // After save, revalidate diet plan cache
  await mutate(DIET_PLAN_CACHE_KEY);
}

// Set completion status for a meal
// Why: Tracks whether a user has completed a specific meal on a given day
export async function setMealCompletion({
  userId,
  dietPlanId,
  day,
  mealType,
  completed,
}: {
  userId: string;
  dietPlanId: string;
  day: string; // Now accepts week-prefixed format like 'week1_Monday'
  mealType: string;
  completed: boolean;
}) {
  // Extract actual day from week-prefixed format if needed
  const actualDay = day.includes('_') ? day.split('_')[1] : day;
  const weekNumber = day.startsWith('week2_') ? 2 : 1;
  try {
    // API call for meal completion
    
    // Use the server-side API route that bypasses RLS instead of direct Supabase access
    const response = await fetch('/api/diet/meal-completion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        dietPlanId,
        day,
        mealType,
        completed,
      }),
    });

    const result = await response.json();
    
    if (!response.ok || !result.success) {
      throw new Error(
        `${en.dietPlan.errorUpdatingMealCompletion}: ${result.error || 'Unknown error'}`
      );
    }
    // After update, revalidate diet plan cache
    await mutate(DIET_PLAN_CACHE_KEY);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error(`${en.dietPlan.errorUpdatingMealCompletion}: ${error ? String(error) : 'Unknown error'}`);
    }
  }
}


export async function setFoodItemCompletion({
  userId,
  dietPlanId,
  foodItemId,
  completed,
}: {
  userId: string;
  dietPlanId: string;
  foodItemId: string;
  completed: boolean;
}) {
  try {

    const response = await fetch('/api/diet/food-completion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        foodItemId,
        completed,
      }),
    });

    const result = await response.json();
    
    if (!response.ok || !result.success) {
      throw new Error(
        `${en.dietPlan.errorUpdatingFoodCompletion}: ${result.error || 'Unknown error'}`
      );
    }
    // After update, revalidate diet plan cache
    await mutate(DIET_PLAN_CACHE_KEY);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error(`${en.dietPlan.errorUpdatingFoodCompletion}: ${error ? String(error) : 'Unknown error'}`);
    }
  }
}
