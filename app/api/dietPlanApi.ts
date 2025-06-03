import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import en from '@/shared/language/en';
import { FoodItem } from '../lib/types';
import { mutate } from 'swr';
import { DIET_PLAN_CACHE_KEY } from '../hooks/useDietPlanData';

const supabase = createClientComponentClient();

/**
 * Save meal food items using the new normalised schema
 */
export async function saveMealFoodItems({
  dietPlanId,
  userId,
  day,
  mealType,
  foodItems,
}: {
  dietPlanId: string;
  userId: string;
  day: string; // Week-prefixed format like 'week1_Monday'
  mealType: string;
  foodItems: FoodItem[];
}) {
  try {

    
    // Extract week number and day of week from the day string
    const [weekPart, dayOfWeek] = day.split('_');
    const weekNumber = weekPart === 'week2' ? 2 : 1;
    
    // 1. Find the plan week for this diet plan and week number
    const { data: weeks, error: weeksError } = await supabase
      .from('plan_weeks')
      .select('id')
      .eq('diet_plan_id', dietPlanId)
      .eq('week_number', weekNumber);
      
    if (weeksError) {

      throw new Error(en.dietPlan.errorUpdatingFoodItem);
    }
    
    if (!weeks || weeks.length === 0) {

      throw new Error(en.dietPlan.errorUpdatingFoodItem);
    }
    
    const planWeekId = weeks[0].id;
    
    // 2. Find the diet day for this plan week and day of week
    const { data: days, error: daysError } = await supabase
      .from('diet_days')
      .select('id')
      .eq('plan_week_id', planWeekId)
      .eq('day_of_week', dayOfWeek);
      
    if (daysError) {

      throw new Error(en.dietPlan.errorUpdatingFoodItem);
    }
    
    if (!days || days.length === 0) {

      throw new Error(en.dietPlan.errorUpdatingFoodItem);
    }
    
    const dietDayId = days[0].id;
    
    // 3. Find the day meal for this diet day and meal type
    const { data: meals, error: mealsError } = await supabase
      .from('day_meals')
      .select('id')
      .eq('diet_day_id', dietDayId)
      .eq('meal_type', mealType);
      
    if (mealsError) {

      throw new Error(en.dietPlan.errorUpdatingFoodItem);
    }
    
    if (!meals || meals.length === 0) {

      throw new Error(en.dietPlan.errorUpdatingFoodItem);
    }
    
    const dayMealId = meals[0].id;
    
    // Process each food item
    for (const foodItem of foodItems) {
      if (foodItem.id) {
        // Update existing food item
        const { error } = await supabase
          .from('meal_food_items')
          .update({
            quantity: foodItem.quantity,
            unit: foodItem.unit
          })
          .eq('id', foodItem.id);
          
        if (error) {

          throw new Error(en.dietPlan.errorUpdatingFoodItem);
        }
      } else {
        // Create food item record first
        // Define interface for food item response
        interface FoodItemRecord {
          id: string;
          name: string;
          calories: number;
        }
        
        const { data: foodItemData, error: foodItemError } = await supabase
          .from('food_items')
          .upsert({
            name: foodItem.food,
            calories: foodItem.calories,
            carbohydrates: foodItem.carbs,
            protein: foodItem.protein,
            fat: foodItem.fat,
            sugars: foodItem.sugars
          }, {
            onConflict: 'name'
          });
          
        if (foodItemError) {

          throw new Error(en.dietPlan.errorInsertingFoodItem);
        }
        
        // Now get the food item ID
        // Get the food item ID by querying for the item we just created/updated
        let foodItemId: string | null = null;
        
        const { data: foundItems } = await supabase
          .from('food_items')
          .select('id')
          .eq('name', foodItem.food)
          .limit(1);
          
        if (foundItems && Array.isArray(foundItems) && foundItems.length > 0) {
          foodItemId = foundItems[0].id;
        }
        
        if (!foodItemId) {

          throw new Error(en.dietPlan.errorInsertingFoodItem);
        }
        
        const { error: mealFoodItemError } = await supabase
          .from('meal_food_items')
          .insert({
            day_meal_id: dayMealId,
            food_item_id: foodItemId,
            quantity: foodItem.quantity,
            unit: foodItem.unit
          });
          
        if (mealFoodItemError) {

          throw new Error(en.dietPlan.errorInsertingFoodItem);
        }
      }
    }
    
    // After save, revalidate diet plan cache
    await mutate(DIET_PLAN_CACHE_KEY);
  } catch (error) {

    throw error;
  }
}

/**
 * Set completion status for a meal using the new normalised schema
 * Tracks whether a user has completed a specific meal on a given day
 */
export async function setMealCompletion({
  userId,
  dietPlanId,
  day,
  mealType,
  completed,
}: {
  userId: string;
  dietPlanId: string;
  day: string; // Week-prefixed format like 'week1_Monday'
  mealType: string;
  completed: boolean;
}) {
  try {

    
    // Extract week number and day of week from the day string
    const [weekPart, dayOfWeek] = day.split('_');
    const weekNumber = weekPart === 'week2' ? 2 : 1;
    
    // Use the server-side API route that bypasses RLS
    const response = await fetch('/api/diet/meal-completion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        dietPlanId,
        weekNumber,
        dayOfWeek,
        mealType,
        completed,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to set meal completion status');
    }
    
    // After updating, revalidate diet plan cache
    await mutate(DIET_PLAN_CACHE_KEY);
    
    return { success: true };
  } catch (error) {

    throw error;
  }
}

/**
 * Set completion status for a specific food item using the new normalised schema
 * Allows tracking individual food items within a meal
 */
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
    // In the new schema, we use user_food_item_completion table to track completion
    // First check if an entry already exists
    const { data: existingCompletions } = await supabase
      .from('user_food_item_completion')
      .select('id')
      .eq('user_id', userId)
      .eq('meal_food_item_id', foodItemId);
      
    if (existingCompletions && existingCompletions.length > 0) {
      // Update existing completion record
      const { error } = await supabase
        .from('user_food_item_completion')
        .update({ completed })
        .eq('id', existingCompletions[0].id);
        
      if (error) {

        throw new Error('Failed to update food item completion status');
      }
    } else {
      // Create new completion record
      const { error } = await supabase
        .from('user_food_item_completion')
        .insert({
          user_id: userId,
          meal_food_item_id: foodItemId,
          completed,
          completed_at: completed ? new Date().toISOString() : null
        });
        
      if (error) {

        throw new Error('Failed to create food item completion status');
      }
    }
    
    // After updating, revalidate diet plan cache
    await mutate(DIET_PLAN_CACHE_KEY);
    
    return { success: true };
  } catch (error) {

    throw error;
  }
}
