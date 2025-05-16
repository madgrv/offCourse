import { DietData } from './types';

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Function to load diet data from Supabase (client-side compatible)
export async function getDietData(): Promise<DietData> {
  try {
    // Check authentication
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      throw new Error('Authentication required to fetch diet plan');
    }
    
    const userId = sessionData.session.user.id;
    
    
    // Fetch the user's diet plan (non-template)
    const { data: dietPlans, error: plansError } = await supabase
      .from('diet_plans')
      .select('id, name, description')
      .eq('owner_id', userId)
      .eq('is_template', false)
      .order('created_at', { ascending: false })
      .limit(1);
    
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
    
    // Initialize the diet data structure
    const dietData: DietData = { 
      id: dietPlanId,
      days: {},
      planName: dietPlans[0].name,
      planDescription: dietPlans[0].description || ''
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
        // Fetch food items for this meal
        
        const { data: foodItems, error: foodError } = await supabase
          .from('diet_food_items')
          .select('id, food_name, calories, carbohydrates, protein, fat, sugars, quantity, unit, completed')
          .eq('diet_meal_id', meal.id);
        
        if (foodError) {
          console.error(`Error fetching food items for meal ${meal.meal_type}:`, foodError);
          continue;
        }
        
        // Map the food items to the expected format
        const formattedFoodItems = (foodItems || []).map(item => {
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
        
        
        
        // Add the meal to the day
        dietData.days[day.day_of_week].meals[meal.meal_type] = formattedFoodItems;
        
        // Verify the data was added correctly
        const mealItems = dietData.days[day.day_of_week]?.meals[meal.meal_type];
        
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