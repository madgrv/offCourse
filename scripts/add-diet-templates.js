// Script to add diet plan templates to the database
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Import configuration (make sure these values match your environment)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Initialize Supabase client with service role key for admin privileges
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Path to diet plan JSON files
const dietPlansDir = path.join(process.cwd(), 'diet-plans');

// Function to read a diet plan from a JSON file
async function readDietPlan(filename) {
  const filePath = path.join(dietPlansDir, filename);
  const fileContent = await fs.promises.readFile(filePath, 'utf-8');
  return JSON.parse(fileContent);
}

// Function to add a diet plan template to the database
async function addDietPlanTemplate(dietPlan) {
  console.log(`Adding diet plan template: ${dietPlan.planName}`);
  
  try {
    // 1. Create the diet plan entry
    const dietPlanId = uuidv4();
    const { error: planError } = await supabase
      .from('diet_plans')
      .insert({
        id: dietPlanId,
        name: dietPlan.planName,
        description: dietPlan.planDescription,
        is_template: true,
        owner_id: null // Templates don't have an owner
      });
    
    if (planError) {
      throw new Error(`Error creating diet plan: ${planError.message}`);
    }
    
    console.log(`Created diet plan with ID: ${dietPlanId}`);
    
    // 2. Create days for each day of the week
    for (const [dayName, dayData] of Object.entries(dietPlan.days)) {
      const dayId = uuidv4();
      const { error: dayError } = await supabase
        .from('diet_days')
        .insert({
          id: dayId,
          diet_plan_id: dietPlanId,
          day_of_week: dayName,
          total_calories: dayData.totalCalories || 0
        });
      
      if (dayError) {
        throw new Error(`Error creating day ${dayName}: ${dayError.message}`);
      }
      
      console.log(`Created day ${dayName} with ID: ${dayId}`);
      
      // 3. Create meals for each meal type
      for (const [mealType, foods] of Object.entries(dayData.meals)) {
        const mealId = uuidv4();
        const { error: mealError } = await supabase
          .from('diet_meals')
          .insert({
            id: mealId,
            diet_day_id: dayId,
            meal_type: mealType
          });
        
        if (mealError) {
          throw new Error(`Error creating meal ${mealType}: ${mealError.message}`);
        }
        
        console.log(`Created meal ${mealType} with ID: ${mealId}`);
        
        // 4. Create food items for each meal
        for (const food of foods) {
          const foodId = uuidv4();
          const { error: foodError } = await supabase
            .from('diet_food_items')
            .insert({
              id: foodId,
              diet_meal_id: mealId,
              food_name: food.food,
              calories: food.calories,
              quantity: food.quantity || null,
              unit: food.unit || null,
              carbohydrates: food.carbs || null,
              sugars: food.sugars || null,
              protein: food.protein || null,
              fat: food.fat || null,
              completed: false
            });
          
          if (foodError) {
            throw new Error(`Error creating food item ${food.food}: ${foodError.message}`);
          }
          
          console.log(`Created food item ${food.food} with ID: ${foodId}`);
        }
      }
    }
    
    console.log(`Successfully added diet plan template: ${dietPlan.planName}`);
    return dietPlanId;
  } catch (error) {
    console.error(`Failed to add diet plan template: ${error.message}`);
    throw error;
  }
}

// Main function to add all diet plan templates
async function addAllDietPlanTemplates() {
  try {
    console.log('Starting to add diet plan templates...');
    
    // Get list of JSON files in the diet-plans directory
    const files = await fs.promises.readdir(dietPlansDir);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    if (jsonFiles.length === 0) {
      console.log('No diet plan JSON files found.');
      return;
    }
    
    console.log(`Found ${jsonFiles.length} diet plan JSON files.`);
    
    // Process each diet plan file
    for (const file of jsonFiles) {
      console.log(`Processing ${file}...`);
      const dietPlan = await readDietPlan(file);
      await addDietPlanTemplate(dietPlan);
    }
    
    console.log('All diet plan templates added successfully.');
  } catch (error) {
    console.error('Error adding diet plan templates:', error);
  }
}

// Run the script
addAllDietPlanTemplates();
