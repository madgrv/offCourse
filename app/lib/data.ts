import { DietData } from './types';

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Function to load diet data from Supabase (client-side compatible)
export async function getDietData(specificPlanId?: string): Promise<DietData> {
  console.log('getDietData called with specificPlanId:', specificPlanId);
  try {
    // Check authentication
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      throw new Error('Authentication required to fetch diet plan');
    }
    
    const userId = sessionData.session.user.id;
    
    
    // Check for a specific plan ID first (from cookie or URL parameter)
    let dietPlanQuery = supabase
      .from('diet_plans')
      .select('id, name, description')
      .eq('owner_id', userId)
      .eq('is_template', false);
      
    // If a specific plan ID is provided, use it
    if (specificPlanId) {
      console.log('Fetching specific diet plan with ID:', specificPlanId);
      dietPlanQuery = dietPlanQuery.eq('id', specificPlanId);
    } else {
      console.log('No specific plan ID provided, fetching most recent plan');
      // Otherwise get the most recent plan
      dietPlanQuery = dietPlanQuery.order('created_at', { ascending: false }).limit(1);
    }
    
    // Execute the query
    const { data: dietPlans, error: plansError } = await dietPlanQuery;
    
    console.log('Diet plans query result:', dietPlans);
    
    if (plansError) {
      console.error('Error fetching diet plans:', plansError);
      throw new Error(`Failed to fetch diet plans: ${plansError.message}`);
    }
    
    if (!dietPlans || dietPlans.length === 0) {
      console.warn('No diet plan found for user');
      // Return empty diet data structure with a message
      return { 
        days: {},
        planName: 'No Diet Plan Found',
        planDescription: 'You haven\'t created a diet plan yet. Go to the home page to select a template and create your personalised diet plan.'
      };
    }
    
    const dietPlanId = dietPlans[0].id;
    
    
    // Fetch all days for this diet plan
    const { data: days, error: daysError } = await supabase
      .from('diet_days')
      .select('id, day_of_week, total_calories')
      .eq('diet_plan_id', dietPlanId);
    
    if (daysError) {
      console.error('Error fetching diet days:', daysError);
      throw new Error(`Failed to fetch diet days: ${daysError.message}`);
    }
    
    // Fetch the diet plan start date to calculate current week
    const { data: planData, error: planError } = await supabase
      .from('diet_plans')
      .select('created_at')
      .eq('id', dietPlanId)
      .single();
      
    if (planError) {
      console.error('Error fetching diet plan start date:', planError);
      // Continue without the start date, we'll default to week 1
    }
    
    // Initialize the diet data structure
    const dietData: DietData = { 
      id: dietPlanId,
      days: {},
      planName: dietPlans[0].name,
      planDescription: dietPlans[0].description || '',
      startDate: planData?.created_at || new Date().toISOString()
    };
    
    // Process each day
    
    for (const day of days || []) {
      // Fetch meals for this day
      
      const { data: meals, error: mealsError } = await supabase
        .from('diet_meals')
        .select('id, meal_type')
        .eq('diet_day_id', day.id);
      
      if (mealsError) {
        console.error(`Error fetching meals for day ${day.day_of_week}:`, mealsError);
        continue;
      }
      
      
      // Initialize the day structure
      dietData.days[day.day_of_week] = {
        meals: {}
      };
      
      // Process each meal
      for (const meal of meals || []) {
        // Check if the database has been migrated to support the two-week plan
        // First, try to get all food items for this meal without week filter
        const { data: allFoodItems, error: foodError } = await supabase
          .from('diet_food_items')
          .select('id, food_name, calories, carbohydrates, protein, fat, sugars, quantity, unit, completed, week')
          .eq('diet_meal_id', meal.id);
        
        if (foodError) {
          // If error contains 'column diet_food_items.week does not exist', the migration hasn't been run
          if (foodError.message?.includes('column diet_food_items.week does not exist')) {
            // Database not migrated yet, get food items without week filter
            const { data: legacyFoodItems, error: legacyError } = await supabase
              .from('diet_food_items')
              .select('id, food_name, calories, carbohydrates, protein, fat, sugars, quantity, unit, completed')
              .eq('diet_meal_id', meal.id);
              
            if (legacyError) {
              console.error(`Error fetching food items for meal ${meal.meal_type}:`, legacyError);
              continue;
            }
            
            // Treat all items as week 1 items in non-migrated database
            const week1FoodItems = legacyFoodItems || [];
            const week2FoodItems: typeof week1FoodItems = []; // Empty for week 2
            
            // Process as normal with these items
            dietData.days[day.day_of_week] = dietData.days[day.day_of_week] || { meals: {} };
            dietData.days[day.day_of_week].meals[meal.meal_type] = {
              week1: week1FoodItems.map(item => ({
                id: item.id,
                food: item.food_name,
                calories: item.calories,
                carbs: item.carbohydrates,
                protein: item.protein,
                fat: item.fat,
                sugars: item.sugars,
                quantity: item.quantity,
                unit: item.unit,
                completed: item.completed
              })),
              week2: week2FoodItems.map(item => ({
                id: item.id,
                food: item.food_name,
                calories: item.calories,
                carbs: item.carbohydrates,
                protein: item.protein,
                fat: item.fat,
                sugars: item.sugars,
                quantity: item.quantity,
                unit: item.unit,
                completed: item.completed
              }))
            };
            
            continue; // Skip the rest of this iteration
          } else {
            console.error(`Error fetching food items for meal ${meal.meal_type}:`, foodError);
            continue;
          }
        }
        
        // If we got here, the database has been migrated
        // Separate items by week
        const week1FoodItems = allFoodItems?.filter(item => !item.week || item.week === 1) || [];
        const week2FoodItems = allFoodItems?.filter(item => item.week === 2) || [];
        
        // Map the week 1 food items to the expected format
        const formattedWeek1FoodItems = (week1FoodItems || []).map(item => {
          // Use the quantity and unit directly from the database
          // If they're not available, provide sensible defaults
          return {
            id: item.id,
            food: item.food_name,
            calories: item.calories,
            quantity: item.quantity || 1,
            unit: item.unit || 'g',
            completed: item.completed || false,
            // Store both total carbs and sugars separately as per project requirements
            carbs: item.carbohydrates || 0,
            sugars: item.sugars || 0,
            protein: item.protein || 0,
            fat: item.fat || 0
          };
        });
        
        // Map the week 2 food items to the expected format
        const formattedWeek2FoodItems = (week2FoodItems || []).map(item => {
          return {
            id: item.id,
            food: item.food_name,
            calories: item.calories,
            quantity: item.quantity || 1,
            unit: item.unit || 'g',
            completed: item.completed || false,
            carbs: item.carbohydrates || 0,
            sugars: item.sugars || 0,
            protein: item.protein || 0,
            fat: item.fat || 0
          };
        });
        
        
        
        // Add the meals to the day for both weeks using the week-prefixed format
        if (!dietData.days[day.day_of_week]) {
          dietData.days[day.day_of_week] = { meals: {} };
        }
        
        // Create week-prefixed day keys
        const week1Day = `week1_${day.day_of_week}`;
        const week2Day = `week2_${day.day_of_week}`;
        
        // Initialize the week-prefixed days if they don't exist
        if (!dietData.days[week1Day]) {
          dietData.days[week1Day] = { meals: {} };
        }
        if (!dietData.days[week2Day]) {
          dietData.days[week2Day] = { meals: {} };
        }
        
        // Add the meals to the week-prefixed days
        dietData.days[week1Day].meals[meal.meal_type] = formattedWeek1FoodItems;
        dietData.days[week2Day].meals[meal.meal_type] = formattedWeek2FoodItems;
        
        // Also keep the original day format for backward compatibility
        dietData.days[day.day_of_week].meals[meal.meal_type] = formattedWeek1FoodItems;
        
      }
    }
    
    
    return dietData;
  } catch (error) {
    console.error('Error loading diet data:', error);
    throw new Error('Failed to load diet data');
  }
}

// Function to calculate total calories for a meal
export function calculateMealCalories(foodItems: { food: string; calories: number | null }[]): number {
  return foodItems.reduce((total, item) => total + (item.calories || 0), 0);
}

// Function to get day name from index
export function getDayName(index: number): string {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  return days[index % 7];
}

// Function to format day name for display
export function formatDayName(day: string): string {
  return day.charAt(0).toUpperCase() + day.slice(1);
}

// Function to get recommended daily intake based on gender
export function getRecommendedIntake(gender: 'male' | 'female' | 'other'): number {
  // Default values based on our data
  if (gender === 'male') return 2100;
  if (gender === 'female') return 1500;
  return 1800; // Default for 'other'
}