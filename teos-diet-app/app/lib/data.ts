import { DietData } from './types';

// Function to load diet data using fetch API (client-side compatible)
export async function getDietData(): Promise<DietData> {
  try {
    // Use relative URL to fetch the JSON file from the public directory
    const response = await fetch('/data/diet-data.json');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch diet data: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data as DietData;
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