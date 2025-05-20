import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import en from '@/shared/language/en';
import { FoodItem } from '../lib/types';

const supabase = createClientComponentClient();

// Save (update) all food items for a meal
// Why: Ensures all food item changes for a meal are persisted in the DB
export async function saveMealFoodItems({ dietPlanId, userId, day, mealType, foodItems }: {
  dietPlanId: string;
  userId: string;
  day: string;
  mealType: string;
  foodItems: FoodItem[];
}) {
  for (const foodItem of foodItems) {
    if (foodItem.id) {
      // Update existing food item
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
          completed: foodItem.completed || false
        })
        .eq('id', foodItem.id);
      if (error) {
        throw new Error(en.dietPlan.errorUpdatingFoodItem);
      }
    } else {
      // Insert new food item
      const { error } = await supabase
        .from('diet_food_items')
        .insert({
          diet_plan_id: dietPlanId,
          user_id: userId,
          day,
          meal_type: mealType,
          food_name: foodItem.food,
          calories: foodItem.calories,
          quantity: foodItem.quantity,
          unit: foodItem.unit,
          completed: foodItem.completed || false
        });
      if (error) {
        throw new Error(en.dietPlan.errorInsertingFoodItem);
      }
    }
  }
}

// Set completion status for a meal
// Why: Tracks whether a user has completed a specific meal on a given day
export async function setMealCompletion({ userId, dietPlanId, day, mealType, completed }: {
  userId: string;
  dietPlanId: string;
  day: string;
  mealType: string;
  completed: boolean;
}) {
  const { error } = await supabase
    .from('meal_completions')
    .upsert({
      user_id: userId,
      diet_plan_id: dietPlanId,
      day,
      meal_type: mealType,
      completed,
      completed_at: completed ? new Date().toISOString() : null
    });
  if (error) {
    throw new Error(en.dietPlan.errorUpdatingMealCompletion);
  }
}

// Set completion status for a food item
// Why: Tracks whether a user has completed an individual food item
export async function setFoodItemCompletion({ userId, dietPlanId, day, mealType, foodItemId, completed }: {
  userId: string;
  dietPlanId: string;
  day: string;
  mealType: string;
  foodItemId: string;
  completed: boolean;
}) {
  try {
    // Update the food_completions table
    const { error: completionError } = await supabase
      .from('food_completions')
      .upsert({
        user_id: userId,
        diet_plan_id: dietPlanId,
        day,
        meal_type: mealType,
        diet_food_item_id: foodItemId,
        completed,
        completed_at: completed ? new Date().toISOString() : null
      });
    
    if (completionError) {
      console.error('Food completion update error:', completionError);
      throw new Error(en.dietPlan.errorUpdatingFoodCompletion);
    }
    
    // Also update the completed flag in diet_food_items for compatibility
    const { error: updateError } = await supabase
      .from('diet_food_items')
      .update({ completed })
      .eq('id', foodItemId);
      
    if (updateError) {
      console.error('Food item update error:', updateError);
      throw new Error(en.dietPlan.errorUpdatingFoodItem);
    }
  } catch (error) {
    console.error('Error in setFoodItemCompletion:', error);
    throw new Error(en.dietPlan.errorUpdatingFoodCompletion);
  }
}

