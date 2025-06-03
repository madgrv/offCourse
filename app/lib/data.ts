import { DietData } from './types';
import { supabase } from './supabaseClient';

// Using the centralized Supabase client from supabaseClient.ts

// Function to load diet data from Supabase (client-side compatible)
export async function getDietData(specificPlanId?: string, includeTemplates: boolean = false): Promise<DietData> {

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
      .select('id, name, description, created_at, is_template')
      .eq('owner_id', userId);
      
    // Only filter out templates if not explicitly including them
    if (!includeTemplates) {
      dietPlanQuery = dietPlanQuery.eq('is_template', false);
    }
      
    // If a specific plan ID is provided, use it
    if (specificPlanId) {

      dietPlanQuery = dietPlanQuery.eq('id', specificPlanId);
    } else {

      // Otherwise get the most recent plan
      dietPlanQuery = dietPlanQuery.order('created_at', { ascending: false }).limit(1);
    }
    
    // Execute the query
    const { data: dietPlans, error: plansError } = await dietPlanQuery;
    

    
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
        planDescription: 'You haven\'t created a diet plan yet. Go to the home page to select a template and create your personalised diet plan.',
        isDefaultStructure: true
      };
    }
    
    // Fetch the diet plan and all its nested data in a single query

    const { data: dietPlansWithDetails, error: plansWithDetailsError } = await supabase
      .from('diet_plans')
      .select(`
        id,
        name,
        description,
        created_at,
        is_template,
        plan_weeks (
          id,
          week_number,
          diet_days (
            id,
            day_of_week,
            day_meals (
              id,
              meal_type,
              diet_meal_id,
              meal_food_items (
                id,
                quantity,
                food_items (
                  id,
                  food_name,
                  calories,
                  carbohydrates,
                  protein,
                  fat,
                  sugars,
                  unit
                )
              )
            )
          )
        )
      `)
      .eq('owner_id', userId)

      .order('week_number', { foreignTable: 'plan_weeks' })
      .order('day_of_week', { foreignTable: 'plan_weeks.diet_days' })
      .order('meal_type', { foreignTable: 'plan_weeks.diet_days.day_meals' });

    if (plansWithDetailsError) {
      console.error('Error fetching diet plans with details:', plansWithDetailsError);
      throw new Error(`Failed to fetch diet plans with details: ${plansWithDetailsError.message}`);
    }

    let dietPlan: any;
    if (specificPlanId) {
      dietPlan = dietPlansWithDetails?.find(plan => plan.id === specificPlanId);
    } else {

      const nonTemplatePlans = dietPlansWithDetails?.filter(plan => !plan.is_template);
      dietPlan = nonTemplatePlans?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
    }

    if (!dietPlan) {
      console.warn('No diet plan found for user or specific ID');
      return {
        days: {},
        planName: 'No Diet Plan Found',
        planDescription: 'You haven\'t created a diet plan yet. Go to the home page to select a template and create your personalised diet plan.',
        isDefaultStructure: true
      };
    }

    const dietData: DietData = {
      id: dietPlan.id,
      days: {},
      planName: dietPlan.name,
      planDescription: dietPlan.description || '',
      startDate: dietPlan.created_at || new Date().toISOString(),
    };

    // Process the fetched detailed data
    dietPlan.plan_weeks.forEach((week: any) => {
      week.diet_days.forEach((day: any) => {
        const dayKey = `week${week.week_number}_${day.day_of_week}`;
        dietData.days[dayKey] = dietData.days[dayKey] || { meals: {} };

        day.day_meals.forEach((meal: any) => {
          type ProcessedFoodItem = {
            id?: string;
            food: string;
            calories: number;
            carbs: number;
            protein: number;
            fat: number;
            sugars: number;
            quantity: number;
            unit: string;
            completed: boolean;
          };

          const foodItems: ProcessedFoodItem[] = (meal.meal_food_items || []).map((item: any) => {
            const foodItem = item.food_items;
            return {
              id: item.id,
              food: foodItem?.food_name || 'Unknown food',
              calories: Number(foodItem?.calories) || 0,
              carbs: Number(foodItem?.carbohydrates) || 0,
              protein: Number(foodItem?.protein) || 0,
              fat: Number(foodItem?.fat) || 0,
              sugars: Number(foodItem?.sugars) || 0,
              quantity: Number(item.quantity) || 1,
              unit: foodItem?.unit || 'g',
              completed: item.completed || false,
            };
          });

          let normalizedMealType = meal.meal_type.toLowerCase();
          if (normalizedMealType === 'snacks') {
            normalizedMealType = 'snack';
          }
          dietData.days[dayKey].meals[normalizedMealType] = foodItems;
        });
      });
    });

    // If no days were found for any week, and it's not a default structure, create a default structure
    if (Object.keys(dietData.days).length === 0) {
      console.warn('No days found for any week - creating default structure');
      const defaultDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const defaultMealTypes = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

      [1, 2].forEach(weekNum => {
        defaultDays.forEach(day => {
          const weekDayKey = `week${weekNum}_${day}`;
          dietData.days[weekDayKey] = {
            meals: {},
          };
          defaultMealTypes.forEach(mealType => {
            dietData.days[weekDayKey].meals[mealType] = [];
          });
        });
      });
      dietData.isDefaultStructure = true;

    }


    return dietData;

  } catch (error) {
    console.error('Error in getDietData:', error);
    throw error;
  }
}

// Function to calculate total calories for a meal
export function calculateMealCalories(foodItems: any[]): number {
  return foodItems.reduce((total, item) => total + (item.calories || 0), 0);
}

// Function to get day name from index
export function getDayName(index: number): string {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  return days[index % 7];
}

// Function to format day name for display
export function formatDayName(day: string): string {
  return day.charAt(0).toUpperCase() + day.slice(1).toLowerCase();
}

// Function to get recommended daily intake based on gender
export function getRecommendedIntake(gender: 'male' | 'female' | 'other'): number {
  if (gender === 'male') {
    return 2500;
  } else if (gender === 'female') {
    return 2000;
  }
  return 2250; // Default for 'other'
}
