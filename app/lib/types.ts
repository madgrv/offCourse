// Types for the diet data structure

// Food item with calories and macronutrients
export interface FoodItem {
  id?: string; // Database ID for existing items
  food: string;
  calories: number | null;
  quantity?: number;
  unit?: string;
  completed?: boolean;
  carbs?: number; // Total carbohydrates in grams
  sugars?: number; // Sugars in grams (subset of carbs)
  protein?: number; // Protein in grams
  fat?: number; // Fat in grams
}

// Processed food item with standardised properties for internal use
export interface ProcessedFoodItem {
  id: string;
  food: string;
  calories: number;
  carbs: number; // Total carbohydrates in grams
  sugars: number; // Sugars in grams (subset of carbs)
  protein: number; // Protein in grams
  fat: number; // Fat in grams
  quantity: number;
  unit: string;
  completed: boolean;
}

// Meal structure with support for two-week plan
export interface TwoWeekMeal {
  week1: FoodItem[];
  week2: FoodItem[];
}

// Meal structure (breakfast, lunch, snack, dinner)
export interface Meal {
  [key: string]: FoodItem[];
}

// Daily diet structure with support for two-week plan
export interface DayDiet {
  meals: {
    breakfast?: FoodItem[] | TwoWeekMeal;
    lunch?: FoodItem[] | TwoWeekMeal;
    snack?: FoodItem[] | TwoWeekMeal;
    dinner?: FoodItem[] | TwoWeekMeal;
    [mealType: string]: FoodItem[] | TwoWeekMeal | undefined;
  };
  totalCalories?: number;
}

// Weekly diet structure
export interface WeeklyDiet {
  days: {
    monday: DayDiet;
    tuesday: DayDiet;
    wednesday: DayDiet;
    thursday: DayDiet;
    friday: DayDiet;
    saturday: DayDiet;
    sunday: DayDiet;
  };
}

// Nutritional information
export interface NutritionalInfo {
  adultMale: {
    recommendedDailyIntake: number;
  };
  adultFemale: {
    recommendedDailyIntake: number;
  };
}

// Food reference data
export interface FoodReference {
  [key: string]: {
    calories: number;
    description: string;
  };
}

// Complete diet data structure
export interface DietData {
  id?: string; // Database ID for the diet plan
  days: {
    [key: string]: DayDiet;
  };
  planName?: string;
  planDescription?: string;
  startDate?: string; // ISO string date when the plan was created
  nutritionalInfo?: NutritionalInfo;
  foodReference?: FoodReference;
  isDefaultStructure?: boolean; // Flag to indicate if this is a default structure created when no weeks are found
}

// User profile
export interface UserProfile {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'other';
  age: number;
  weight: number; // in kg
  height: number; // in cm
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very active';
  goal: 'maintain' | 'lose' | 'gain';
}

// Daily log entry
export interface DailyLogEntry {
  date: string;
  meals: {
    [mealType: string]: {
      foods: FoodItem[];
      totalCalories: number;
    };
  };
  totalCalories: number;
  notes?: string;
}

// Authentication types
export interface AuthUser {
  id: string;
  email: string;
  name?: string;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}