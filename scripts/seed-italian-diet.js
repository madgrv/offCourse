// Script to seed the Italian two-week diet plan directly
// This bypasses the need for admin authentication

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Import the diet plan template and food data
const { twoWeekDietPlanTemplate } = require('../app/api/diet/seed/two-week-template');
const { italianFoodData } = require('../app/api/diet/seed/italian-food-data');
const { parseWeekDay } = require('../app/lib/parseWeekDay');

// Initialize Supabase client with service role key for direct database access
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // This should be in your .env file

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Supabase URL or service role key not found in environment variables');
  console.error('Make sure you have NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedItalianDietPlan() {
  console.log('Starting to seed the Italian two-week diet plan...');
  
  try {
    // You can customize these values
    const planName = process.argv[2] || 'Italian Two-Week Diet Plan';
    const ownerId = process.argv[3]; // Optional owner ID, can be null for a template
    
    // Create the diet plan
    const { data: dietPlan, error: planError } = await supabase
      .from('diet_plans')
      .insert({
        name: planName,
        description: 'A balanced two-week Italian diet plan with nutritious meals',
        is_template: !ownerId, // If no owner ID, make it a template
        owner_id: ownerId || null
      })
      .select()
      .single();
    
    if (planError) {
      throw new Error(`Failed to create diet plan: ${planError.message}`);
    }
    
    console.log(`Created diet plan: ${dietPlan.name} (ID: ${dietPlan.id})`);
    
    // Track created resources
    const days = [];
    const meals = [];
    const foodItems = [];
    const foodItemsInserts = [];
    
    // Process each day in the two-week template
    const mealTypes = ['breakfast', 'lunch', 'snack', 'dinner'];
    
    for (const weekDayKey of Object.keys(twoWeekDietPlanTemplate.days)) {
      // Parse the week and day from the key (e.g., "week1_Monday" -> { week: 1, day: "Monday" })
      const { week, day: dayOfWeek } = parseWeekDay(weekDayKey);
      
      // Create the day
      const { data: day, error: dayError } = await supabase
        .from('diet_days')
        .insert({
          diet_plan_id: dietPlan.id,
          day_of_week: dayOfWeek
        })
        .select()
        .single();
      
      if (dayError) {
        console.error(`Failed to create day ${dayOfWeek}: ${dayError.message}`);
        continue;
      }
      
      days.push(day);
      console.log(`Created day: ${day.day_of_week} (ID: ${day.id})`);
      
      // Create meals for this day
      for (const mealType of mealTypes) {
        const { data: meal, error: mealError } = await supabase
          .from('diet_meals')
          .insert({
            diet_day_id: day.id,
            meal_type: mealType
          })
          .select()
          .single();
        
        if (mealError) {
          console.error(`Failed to create meal ${mealType} for day ${dayOfWeek}: ${mealError.message}`);
          continue;
        }
        
        meals.push(meal);
        console.log(`Created meal: ${meal.meal_type} for ${day.day_of_week} (ID: ${meal.id})`);
        
        // Get food items for this meal from the template
        const templateFoodItems = twoWeekDietPlanTemplate.days[weekDayKey]?.meals[mealType] || [];
        
        // Add food items to the batch insert array
        for (const item of templateFoodItems) {
          foodItemsInserts.push({
            diet_meal_id: meal.id,
            food_name: item.food,
            calories: item.calories,
            quantity: item.quantity,
            unit: item.unit,
            carbohydrates: item.carbs,
            protein: item.protein,
            fat: item.fat,
            completed: false,
            week: week // Set the week number for the 2-week plan
          });
        }
      }
    }
    
    // Insert all food items in batches to improve performance
    if (foodItemsInserts.length > 0) {
      // Split into smaller batches to avoid hitting limits
      const batchSize = 100;
      for (let i = 0; i < foodItemsInserts.length; i += batchSize) {
        const batch = foodItemsInserts.slice(i, i + batchSize);
        const { data: insertedFoodItems, error: foodItemsError } = await supabase
          .from('diet_food_items')
          .insert(batch)
          .select();
        
        if (foodItemsError) {
          console.error(`Failed to create food items batch ${i/batchSize + 1}: ${foodItemsError.message}`);
          continue;
        }
        
        foodItems.push(...(insertedFoodItems || []));
        console.log(`Inserted ${insertedFoodItems?.length || 0} food items in batch ${i/batchSize + 1}`);
      }
    }
    
    console.log('\nSeeding completed successfully!');
    console.log(`Created 1 diet plan, ${days.length} days, ${meals.length} meals, and ${foodItems.length} food items.`);
    console.log(`Diet Plan ID: ${dietPlan.id}`);
    
  } catch (error) {
    console.error('Seeding failed:', error);
  }
}

// Run the seeding function
seedItalianDietPlan();
